// src/pages/sitemap.xml.ts
// ============================================================================
// Sitemap XML combina rutas estáticas con las URLs dinámicas (carreras,
// instituciones, noticias) consultadas desde Supabase.
//
// SSR (no prerender): las noticias las publica un cron semanal que escribe
// directo en Supabase sin disparar un build/deploy en Hostinger. Si este
// archivo se horneara en build (como antes), el sitemap quedaba congelado en
// la última vez que alguien hizo `git push` y todo artículo publicado después
// por el cron desaparecía del sitemap hasta el próximo deploy —en ago 2026 se
// detectó con 19 de 25 noticias activas ausentes del sitemap en producción.
// carreras/instituciones sí salen de un índice cacheado en memoria
// (`carrerasIndex.ts`, una vez por proceso), así que este SSR no repite esas
// consultas caras en cada request.
// ============================================================================
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";
import { SITE_URL } from "../lib/seo";
import { esCodigoRutaValido } from "../utils/formatters";
import { indiceCarreras } from "../services/carrerasIndex";
import { REGIONES } from "../utils/regiones";

export const prerender = false;

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
  { loc: "/tendencias", changefreq: "weekly", priority: 0.7 },
  { loc: "/carreras", changefreq: "weekly", priority: 0.9 },
  { loc: "/herramientas/solicitar-informacion", changefreq: "yearly", priority: 0.4 },
  { loc: "/contacto", changefreq: "yearly", priority: 0.5 },
  { loc: "/terminos-y-condiciones", changefreq: "yearly", priority: 0.3 },
];

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
    // Todo sale del mismo índice que genera las páginas, de modo que el sitemap
    // no pueda declarar una URL que no exista ni omitir una que sí.
    // `canonico` marca las fichas indistinguibles entre sí (mismo programa,
    // sede y jornada), que se excluyen: el sitemap debe declarar solo URLs
    // canónicas, o se le pide a Google indexar duplicados a sabiendas.
    const { canonico, porNombre, porCodigo, instituciones } = await indiceCarreras();

    // Páginas hub. Van con prioridad alta: son las que responden a la búsqueda
    // genérica y las que reparten autoridad hacia las fichas.
    for (const slug of porNombre.keys())
      entries.push({ loc: `/carreras/${slug}`, changefreq: "weekly", priority: 0.8 });
    for (const region of REGIONES)
      entries.push({
        loc: `/carreras/region/${region.slug}`,
        changefreq: "weekly",
        priority: 0.8,
      });

    for (const id of porCodigo.keys()) {
      if (canonico.has(id)) continue;
      entries.push({ loc: `/carrera/${id}`, changefreq: "monthly", priority: 0.7 });
    }
    for (const id of instituciones.keys()) {
      if (!esCodigoRutaValido(id)) continue;
      entries.push({ loc: `/institucion/${id}`, changefreq: "monthly", priority: 0.6 });
    }
  } catch {
    // Si Supabase no responde en build, igual emitimos las rutas estáticas.
  }

  // Noticias: slug (URL con nombre) + fecha de actualización si está disponible.
  try {
    const { data } = await supabase
      .from("noticias")
      .select("slug, created_at, estado")
      .limit(5000);
    for (const n of (data || []) as Record<string, any>[]) {
      if (n.estado && n.estado !== "activado") continue;
      if (!n.slug) continue; // fila sin backfillear todavía, ver scripts/backfill-noticias-geo.mjs
      entries.push({
        loc: `/noticia/${n.slug}`,
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
