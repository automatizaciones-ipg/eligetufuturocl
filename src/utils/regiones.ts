// src/utils/regiones.ts
// ============================================================================
// Catálogo de regiones tal como vienen en Supabase (columna `carreras.region`,
// con los nombres abreviados del SIES) y su forma presentable + slug de URL.
//
// El valor crudo no sirve ni para una URL ("Lib. Gral. B. O'Higgins") ni para
// un título; este módulo es el puente entre ambos y el punto único de verdad
// para las páginas hub por región.
// ============================================================================

export type Region = {
  /** Valor exacto almacenado en la columna `region`. */
  valor: string;
  /** Segmento de URL. */
  slug: string;
  /** Nombre oficial completo, para títulos y encabezados. */
  nombre: string;
  /** Ciudad principal, para dar contexto en las descripciones. */
  capital: string;
};

export const REGIONES: Region[] = [
  { valor: "Arica y Parinacota", slug: "arica-y-parinacota", nombre: "Región de Arica y Parinacota", capital: "Arica" },
  { valor: "Tarapacá", slug: "tarapaca", nombre: "Región de Tarapacá", capital: "Iquique" },
  { valor: "Antofagasta", slug: "antofagasta", nombre: "Región de Antofagasta", capital: "Antofagasta" },
  { valor: "Atacama", slug: "atacama", nombre: "Región de Atacama", capital: "Copiapó" },
  { valor: "Coquimbo", slug: "coquimbo", nombre: "Región de Coquimbo", capital: "La Serena" },
  { valor: "Valparaíso", slug: "valparaiso", nombre: "Región de Valparaíso", capital: "Valparaíso" },
  { valor: "Metropolitana", slug: "metropolitana", nombre: "Región Metropolitana de Santiago", capital: "Santiago" },
  { valor: "Lib. Gral. B. O'Higgins", slug: "ohiggins", nombre: "Región del Libertador General Bernardo O'Higgins", capital: "Rancagua" },
  { valor: "Maule", slug: "maule", nombre: "Región del Maule", capital: "Talca" },
  { valor: "Ñuble", slug: "nuble", nombre: "Región de Ñuble", capital: "Chillán" },
  { valor: "Biobío", slug: "biobio", nombre: "Región del Biobío", capital: "Concepción" },
  { valor: "La Araucanía", slug: "la-araucania", nombre: "Región de La Araucanía", capital: "Temuco" },
  { valor: "Los Ríos", slug: "los-rios", nombre: "Región de Los Ríos", capital: "Valdivia" },
  { valor: "Los Lagos", slug: "los-lagos", nombre: "Región de Los Lagos", capital: "Puerto Montt" },
  { valor: "Aysén", slug: "aysen", nombre: "Región de Aysén", capital: "Coyhaique" },
  { valor: "Magallanes", slug: "magallanes", nombre: "Región de Magallanes y la Antártica Chilena", capital: "Punta Arenas" },
];

const PORSLUG = new Map(REGIONES.map((r) => [r.slug, r]));
const PORVALOR = new Map(REGIONES.map((r) => [r.valor, r]));

export const regionPorSlug = (slug: string): Region | undefined =>
  PORSLUG.get(slug);

export const regionPorValor = (valor: string | null | undefined): Region | undefined =>
  valor ? PORVALOR.get(valor) : undefined;
