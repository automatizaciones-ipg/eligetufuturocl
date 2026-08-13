// scripts/generar-assets-seo.mjs
// ============================================================================
// Genera los assets estáticos que faltaban para redes sociales e iOS:
//
//  · public/og-default.png     1200×630 — la imagen social por defecto. Antes
//    se usaba imagen_portada.png, que mide 592×579 (cuadrada) mientras las
//    metaetiquetas declaraban 1200×630: las previsualizaciones salían
//    recortadas y algunas plataformas directamente la descartaban.
//  · public/apple-touch-icon.png  180×180 — lo pedía un TODO en Seo.astro.
//
// Se ejecuta a mano cuando cambie la marca:  node scripts/generar-assets-seo.mjs
// ============================================================================
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const publico = join(raiz, "public");

const MORADO = "#6544FF";
const MORADO_CLARO = "#947BFF";
const FONDO = "#130E24";

// ── Open Graph 1200×630 ─────────────────────────────────────────────────────
const fondo = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${FONDO}"/>
      <stop offset="100%" stop-color="#241a45"/>
    </linearGradient>
    <radialGradient id="brillo" cx="0.78" cy="0.35" r="0.55">
      <stop offset="0%" stop-color="${MORADO}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${MORADO}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#brillo)"/>
  <rect x="0" y="0" width="1200" height="10" fill="${MORADO}"/>

  <text x="80" y="228" font-family="Segoe UI, Arial, Helvetica, sans-serif"
        font-size="82" font-weight="800" font-style="italic" fill="#FFFFFF">
    ELIGE TU FUTURO
  </text>
  <text x="80" y="318" font-family="Segoe UI, Arial, Helvetica, sans-serif"
        font-size="46" font-weight="700" fill="${MORADO_CLARO}">
    Orientación vocacional en Chile
  </text>
  <text x="80" y="388" font-family="Segoe UI, Arial, Helvetica, sans-serif"
        font-size="29" font-weight="400" fill="#FFFFFF" opacity="0.72">
    Test vocacional · Buscador de carreras
  </text>
  <text x="80" y="432" font-family="Segoe UI, Arial, Helvetica, sans-serif"
        font-size="29" font-weight="400" fill="#FFFFFF" opacity="0.72">
    Calculadora PAES · Becas y FUAS
  </text>
  <text x="80" y="476" font-family="Segoe UI, Arial, Helvetica, sans-serif"
        font-size="29" font-weight="400" fill="#FFFFFF" opacity="0.72">
    Empleabilidad · Admisión 2026
  </text>

  <rect x="80" y="518" width="290" height="58" rx="29" fill="${MORADO}"/>
  <text x="112" y="556" font-family="Segoe UI, Arial, Helvetica, sans-serif"
        font-size="27" font-weight="700" fill="#FFFFFF">
    eligetufuturo.cl
  </text>
</svg>`);

// El bloque de texto llega hasta ~x=760; la ilustración arranca después para
// que nada quede tapado en la previsualización de redes.
const ilustracion = await sharp(join(publico, "imagenes", "imagen_portada.png"))
  .resize(360, 360, { fit: "inside" })
  .png()
  .toBuffer();

await sharp(fondo)
  .composite([{ input: ilustracion, top: 145, left: 800 }])
  .png({ compressionLevel: 9 })
  .toFile(join(publico, "og-default.png"));

// ── apple-touch-icon 180×180 ────────────────────────────────────────────────
// Fondo sólido de marca: iOS no respeta la transparencia y deja el icono sobre
// un cuadro negro si el PNG viene sin fondo.
const favicon = await readFile(join(publico, "favicon.svg"));
const marca = await sharp(favicon)
  .resize(116, 116, { fit: "inside" })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 180,
    height: 180,
    channels: 4,
    background: FONDO,
  },
})
  .composite([{ input: marca, gravity: "centre" }])
  .png({ compressionLevel: 9 })
  .toFile(join(publico, "apple-touch-icon.png"));

// ── Informe ─────────────────────────────────────────────────────────────────
for (const archivo of ["og-default.png", "apple-touch-icon.png"]) {
  const meta = await sharp(join(publico, archivo)).metadata();
  console.log(`${archivo}: ${meta.width}x${meta.height}, ${meta.size} bytes`);
}

// Evita el aviso de "módulo sin uso" al importar writeFile sin utilizarlo.
void writeFile;
