// scripts/backfill-noticias-geo.mjs
// ============================================================================
// Puebla `slug` y `puntos_clave` en las noticias publicadas ANTES de que
// existieran esas columnas (ver supabase/migrations/0003_noticias_slug_y_resumen.sql).
// Desde esa migración en adelante, src/lib/noticiasIA/pipeline.ts ya arma
// ambos campos en cada noticia nueva — este script es solo para las viejas.
//
// Correr en este orden (ver el plan / CLAUDE.md):
//   1. Ejecutar la migración 0003 en el SQL Editor de Supabase.
//   2. node --env-file=.env scripts/backfill-noticias-geo.mjs
//   3. Recién ahí, deploy del código que empieza a resolver /noticia/[slug].
//
// Requiere en .env: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// ANTHROPIC_API_KEY (para generar los puntos_clave de artículos ya escritos).
//
// Idempotente: solo toca filas con slug o puntos_clave en null, así que se
// puede volver a correr si algo falla a mitad de camino.
// ============================================================================
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Debe mantenerse igual a `slugificar()` en src/utils/formatters.ts —
// mismo patrón de duplicación documentada que `limpiarTextoMatch` en los
// scripts Python de datos_et/ (ver CLAUDE.md).
function slugificar(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(new RegExp("\u00f1", "g"), "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const PUNTOS_CLAVE_SCHEMA = {
  type: "object",
  properties: {
    puntos_clave: { type: "array", items: { type: "string" } },
  },
  required: ["puntos_clave"],
  additionalProperties: false,
};

async function generarPuntosClave(titulo, cuerpoMarkdown) {
  if (!ANTHROPIC_API_KEY) return null;

  const prompt = `Este es un artículo ya publicado de "Elige Tu Futuro", un sitio chileno de orientación vocacional. Extrae 3 a 5 "puntos_clave": oraciones en español de Chile, cada una autocontenida y citable por sí sola (debe tener sentido sin haber leído el resto del artículo), que respondan directamente una pregunta concreta que un estudiante haría sobre el tema. Nada de gancho ni relleno — son las respuestas, no el resumen del resumen.

Título: ${titulo}

Cuerpo (markdown):
${cuerpoMarkdown}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 1000,
      output_config: { format: { type: "json_schema", schema: PUNTOS_CLAVE_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic respondió ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }

  const data = await res.json();
  const textBlock = (data.content ?? []).find((b) => b.type === "text");
  if (!textBlock?.text) throw new Error("Anthropic no devolvió texto.");

  const parsed = JSON.parse(textBlock.text);
  if (!Array.isArray(parsed.puntos_clave) || !parsed.puntos_clave.every((p) => typeof p === "string")) {
    throw new Error("Respuesta de Anthropic no calza con el esquema esperado.");
  }
  return parsed.puntos_clave;
}

async function main() {
  const { data: filas, error } = await supabase
    .from("noticias")
    .select("id, titulo, cuerpo_markdown, slug, puntos_clave")
    .or("slug.is.null,puntos_clave.is.null");

  if (error) {
    console.error("Error consultando noticias:", error.message);
    process.exit(1);
  }

  if (!filas?.length) {
    console.log("Nada que hacer: todas las noticias ya tienen slug y puntos_clave.");
    return;
  }

  console.log(`${filas.length} noticia(s) por completar.`);

  let ok = 0;
  const fallidas = [];

  for (const fila of filas) {
    // El slug se calcula y guarda SIEMPRE primero, sin depender de la llamada
    // a Anthropic: si puntos_clave falla (rate limit, timeout, etc.) no debe
    // perderse un slug que ya estaba listo. Dos updates independientes en vez
    // de uno solo condicionado a que todo salga bien.
    if (!fila.slug) {
      try {
        const slug = `${slugificar(fila.titulo)}-${fila.id.slice(0, 8)}`;
        const { error: updateError } = await supabase.from("noticias").update({ slug }).eq("id", fila.id);
        if (updateError) throw new Error(updateError.message);
        fila.slug = slug;
        console.log(`OK slug  ${fila.id}  ${slug}`);
      } catch (err) {
        fallidas.push({ id: fila.id, titulo: fila.titulo, campo: "slug", error: err instanceof Error ? err.message : String(err) });
        console.error(`FALLÓ slug  ${fila.id}  ${fila.titulo}:`, err instanceof Error ? err.message : err);
      }
    }

    if (!fila.puntos_clave) {
      try {
        const puntos = await generarPuntosClave(fila.titulo, fila.cuerpo_markdown);
        if (puntos) {
          const { error: updateError } = await supabase.from("noticias").update({ puntos_clave: puntos }).eq("id", fila.id);
          if (updateError) throw new Error(updateError.message);
          console.log(`OK resumen  ${fila.id}`);
        }
      } catch (err) {
        fallidas.push({ id: fila.id, titulo: fila.titulo, campo: "puntos_clave", error: err instanceof Error ? err.message : String(err) });
        console.error(`FALLÓ resumen  ${fila.id}  ${fila.titulo}:`, err instanceof Error ? err.message : err);
      }
    }

    if (fila.slug) ok++;
  }

  console.log(`\n${ok}/${filas.length} noticias con slug.`);
  if (fallidas.length) {
    console.log(`${fallidas.length} fallo(s) (volvé a correr el script para reintentarlos):`);
    for (const f of fallidas) console.log(`  - [${f.campo}] ${f.id}  ${f.titulo}: ${f.error}`);
  }
}

main();
