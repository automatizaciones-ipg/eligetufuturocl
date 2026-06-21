// src/pages/sitemap.xml.ts
// ============================================================================
// Sitemap XML generado en build. Combina rutas estáticas con las URLs
// dinámicas (carreras, instituciones, noticias) consultadas desde Supabase.
// Se prerenderiza a /sitemap.xml para servirse como archivo estático.
// ============================================================================
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { SITE_URL } from "../lib/seo";

export const prerender = true;

type UrlEntry = {
  loc: string;
  changefreq?: string;
  priority?: number;
  lastmod?: string;
};

const STATIC_ROUTES: UrlEntry[] = [
  { loc: "/", changefreq: "daily", priority: 1.0 },
  { loc: "/noticias", changefreq: "daily", priority: 0.9 },
  { loc: "/herramientas/test-vocacional", changefreq: "monthly", priority: 0.9 },
  { loc: "/herramientas/buscador", changefreq: "weekly", priority: 0.9 },
  { loc: "/herramientas/instituciones", changefreq: "weekly", priority: 0.8 },
  { loc: "/herramientas/calculadora", changefreq: "monthly", priority: 0.8 },
  { loc: "/herramientas/calendario", changefreq: "monthly", priority: 0.8 },
  { loc: "/herramientas/fuas", changefreq: "monthly", priority: 0.8 },
  { loc: "/herramientas/eventos", changefreq: "weekly", priority: 0.7 },
  { loc: "/herramientas/mercado-laboral", changefreq: "monthly", priority: 0.7 },
  { loc: "/herramientas/solicitar-informacion", changefreq: "yearly", priority: 0.4 },
  { loc: "/contacto", changefreq: "yearly", priority: 0.5 },
  { loc: "/terminos-y-condiciones", changefreq: "yearly", priority: 0.3 },
];

/** Trae todos los valores de una columna paginando de a 1000. */
async function fetchAll(table: string, column: string): Promise<string[]> {
  const out: string[] = [];
  const limit = 1000;
  let page = 0;
  // Cap de seguridad para no exceder el límite de 50.000 URLs por sitemap.
  while (page < 45) {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .range(page * limit, (page + 1) * limit - 1);
    if (error || !data || data.length === 0) break;
    for (const row of data as Record<string, unknown>[]) {
      const v = row[column];
      if (v != null) out.push(String(v));
    }
    if (data.length < limit) break;
    page++;
  }
  return out;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const GET: APIRoute = async () => {
  const entries: UrlEntry[] = [...STATIC_ROUTES];

  try {
    const [carreras, instituciones] = await Promise.all([
      fetchAll("carreras", "codigo_carrera"),
      fetchAll("instituciones", "codigo_institucion"),
    ]);

    for (const id of carreras)
      entries.push({ loc: `/carrera/${id}`, changefreq: "monthly", priority: 0.7 });
    for (const id of instituciones)
      entries.push({ loc: `/institucion/${id}`, changefreq: "monthly", priority: 0.6 });
  } catch {
    // Si Supabase no responde en build, igual emitimos las rutas estáticas.
  }

  // Noticias: id + fecha de actualización si está disponible.
  try {
    const { data } = await supabase
      .from("noticias")
      .select("id, created_at, estado")
      .limit(5000);
    for (const n of (data || []) as Record<string, any>[]) {
      if (n.estado && n.estado !== "activado") continue;
      entries.push({
        loc: `/noticia/${n.id}`,
        changefreq: "weekly",
        priority: 0.6,
        lastmod: n.created_at ? new Date(n.created_at).toISOString() : undefined,
      });
    }
  } catch {
    /* noop */
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${xmlEscape(SITE_URL + e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ""}${e.priority != null ? `\n    <priority>${e.priority.toFixed(1)}</priority>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
