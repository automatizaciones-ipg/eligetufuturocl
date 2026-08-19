// src/services/carrerasIndex.ts
// ============================================================================
// Índice en memoria de TODAS las carreras, cargado UNA sola vez por proceso.
//
// Por qué existe: /carrera/[id] se prerenderiza para ~9.900 códigos y cada
// ficha necesita saber en qué otras sedes y jornadas se dicta el mismo programa
// (para enlazarlas y para detectar filas realmente idénticas). Consultarlo
// ficha por ficha duplicaría las consultas del build; con este índice es una
// sola consulta paginada y luego búsquedas en memoria.
// ============================================================================
import { supabase } from "../../lib/supabase";
import { esCodigoRutaValido, slugificar } from "../utils/formatters";

// La fila completa de `carreras`. Se carga entera (~1 KB por fila, ~10 MB para
// las 9.901) porque así la ficha /carrera/[id] se sirve desde memoria: antes
// hacía una consulta por página y el build tardaba ~55 min solo en eso.
export type CarreraIndexada = {
  id?: number;
  codigo_carrera: string;
  /** URL con nombre (/carrera/<slug>) — columna real, poblada por trigger en Supabase (ver migraciones 0006/0007). */
  slug: string;
  nombre_carrera: string;
  codigo_institucion: string | number;
  sede: string | null;
  jornada: string | null;
  region: string | null;
  arancel_anual: number | null;
  duracion_semestres: number | null;
  empleabilidad_1er_anio: number | null;
  ingreso_promedio_4to_anio: string | number | null;
  acreditacion_carrera?: string | null;
  descripcion?: string | null;
  detalles?: unknown;
  detalles_actualizado?: string | null;
};

export type InstitucionIndexada = {
  codigo_institucion: string | number;
  /** URL con nombre (/institucion/<slug>) — columna real, poblada por trigger en Supabase. */
  slug: string;
  nombre: string;
  tipo: string | null;
  acreditada: boolean | null;
  adscrita_gratuidad: boolean | null;
  logo_url: string | null;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
};

/** Fila de carrera con su institución embebida, tal como la espera la ficha. */
export type CarreraConInstitucion = CarreraIndexada & {
  instituciones: Omit<InstitucionIndexada, "codigo_institucion"> | null;
};

type Indice = {
  /** carrera+institución → todas sus variantes (sedes/jornadas). */
  variantes: Map<string, CarreraIndexada[]>;
  /** código → código canónico cuando la fila es un duplicado exacto. */
  canonico: Map<string, string>;
  /** institución → una fila por programa distinto que imparte. */
  porInstitucion: Map<string, CarreraIndexada[]>;
  /** slug de carrera → todas sus filas en todo Chile (hub por carrera). */
  porNombre: Map<string, CarreraIndexada[]>;
  /** slug de carrera → nombre presentable elegido para ese slug. */
  nombrePorSlug: Map<string, string>;
  /** valor de región → todas sus filas (hub por región). */
  porRegion: Map<string, CarreraIndexada[]>;
  /** código de institución → sus datos, para no reconsultar por página. */
  instituciones: Map<string, InstitucionIndexada>;
  /** código de carrera → su fila completa, para servir la ficha sin consultar. */
  porCodigo: Map<string, CarreraIndexada>;
  /** slug de ficha de carrera → código, para resolver /carrera/[slug]. */
  porSlugCarrera: Map<string, string>;
  /** slug de institución → código, para resolver /institucion/[slug]. */
  porSlugInstitucion: Map<string, string>;
};

/** Clave de agrupación: mismo programa en la misma institución. */
const clavePrograma = (nombre: string, institucion: string | number) =>
  `${(nombre || "").trim().toUpperCase()}|${institucion}`;

/** Clave fina: lo que hace única a una ficha de cara al usuario y a Google. */
const claveVariante = (c: CarreraIndexada) =>
  `${clavePrograma(c.nombre_carrera, c.codigo_institucion)}|${c.sede ?? ""}|${c.jornada ?? ""}`;

let promesa: Promise<Indice> | null = null;

async function construir(): Promise<Indice> {
  const filas: CarreraIndexada[] = [];
  const limite = 1000;
  let pagina = 0;

  // Paginado igual que en getStaticPaths: Supabase corta en 1.000 filas.
  // `select *` a propósito: con la fila completa, /carrera/[id] se resuelve
  // desde este mapa y desaparecen 9.899 consultas del build.
  // El `order` es obligatorio: sin una ordenación explícita, PostgREST no
  // garantiza que las páginas de `range()` no se solapen ni se salten filas.
  while (pagina < 45) {
    const { data, error } = await supabase
      .from("carreras")
      .select("*")
      .order("codigo_carrera", { ascending: true })
      .range(pagina * limite, (pagina + 1) * limite - 1);

    if (error || !data || data.length === 0) break;
    filas.push(...(data as unknown as CarreraIndexada[]));
    if (data.length < limite) break;
    pagina++;
  }

  // Las instituciones caben de sobra en memoria (~120) y tanto las páginas hub
  // como la ficha de carrera necesitan sus datos sin consultar por página.
  const instituciones = new Map<string, InstitucionIndexada>();
  const porSlugInstitucion = new Map<string, string>();
  {
    const { data } = await supabase
      .from("instituciones")
      .select(
        "codigo_institucion, slug, nombre, tipo, acreditada, adscrita_gratuidad, logo_url, latitud, longitud, direccion",
      );
    for (const i of (data ?? []) as unknown as InstitucionIndexada[]) {
      // Mismo filtro que ya se aplicaba solo en getStaticPaths de
      // institucion/[id].astro: basura de ingesta SIES (":", espacios, etc.)
      // no puede convertirse en carpeta de build. Se filtra acá también para
      // que el índice sea la única fuente de verdad de qué institución tiene
      // ficha.
      if (!esCodigoRutaValido(i.codigo_institucion)) continue;
      instituciones.set(String(i.codigo_institucion), i);
      if (i.slug) porSlugInstitucion.set(i.slug, String(i.codigo_institucion));
    }
  }

  const variantes = new Map<string, CarreraIndexada[]>();
  const porVariante = new Map<string, CarreraIndexada[]>();
  const porNombre = new Map<string, CarreraIndexada[]>();
  const nombrePorSlug = new Map<string, string>();
  const porRegion = new Map<string, CarreraIndexada[]>();
  const porCodigo = new Map<string, CarreraIndexada>();
  const porSlugCarrera = new Map<string, string>();

  for (const fila of filas) {
    if (!esCodigoRutaValido(fila.codigo_carrera)) continue;

    porCodigo.set(String(fila.codigo_carrera), fila);
    if (fila.slug) porSlugCarrera.set(fila.slug, String(fila.codigo_carrera));

    const kp = clavePrograma(fila.nombre_carrera, fila.codigo_institucion);
    const lista = variantes.get(kp);
    if (lista) lista.push(fila);
    else variantes.set(kp, [fila]);

    const kv = claveVariante(fila);
    const iguales = porVariante.get(kv);
    if (iguales) iguales.push(fila);
    else porVariante.set(kv, [fila]);

    // Agrupación por nombre de carrera (transversal a instituciones): es lo
    // que alimenta /carreras/[slug], la página que hoy no existe para la
    // búsqueda genérica ("estudiar enfermería en Chile").
    const slug = slugificar(fila.nombre_carrera);
    if (slug) {
      const mismas = porNombre.get(slug);
      if (mismas) mismas.push(fila);
      else porNombre.set(slug, [fila]);
      if (!nombrePorSlug.has(slug)) nombrePorSlug.set(slug, fila.nombre_carrera);
    }

    if (fila.region) {
      const enRegion = porRegion.get(fila.region);
      if (enRegion) enRegion.push(fila);
      else porRegion.set(fila.region, [fila]);
    }
  }

  // Filas indistinguibles entre sí (mismo programa, sede y jornada): una sola
  // debe ser indexable. Se elige la de código menor y el resto la canonicaliza,
  // en vez de competir entre ellas con metadatos idénticos.
  const canonico = new Map<string, string>();
  for (const grupo of porVariante.values()) {
    if (grupo.length < 2) continue;
    const codigos = grupo
      .map((g) => String(g.codigo_carrera))
      .sort((a, b) => a.localeCompare(b));
    const elegido = codigos[0];
    for (const cod of codigos) {
      if (cod !== elegido) canonico.set(cod, elegido);
    }
  }

  // Una entrada por programa distinto de cada institución: la ficha de
  // institución enlaza su oferta sin repetir la misma carrera 60 veces.
  const porInstitucion = new Map<string, CarreraIndexada[]>();
  for (const [clave, grupo] of variantes) {
    const institucion = clave.slice(clave.lastIndexOf("|") + 1);
    const representante = grupo[0];
    const lista = porInstitucion.get(institucion);
    if (lista) lista.push(representante);
    else porInstitucion.set(institucion, [representante]);
  }
  for (const lista of porInstitucion.values()) {
    lista.sort((a, b) => a.nombre_carrera.localeCompare(b.nombre_carrera, "es"));
  }

  return {
    variantes,
    canonico,
    porInstitucion,
    porNombre,
    nombrePorSlug,
    porRegion,
    instituciones,
    porCodigo,
    porSlugCarrera,
    porSlugInstitucion,
  };
}

/** Carga (o reutiliza) el índice completo de carreras. */
export function indiceCarreras(): Promise<Indice> {
  if (!promesa) {
    promesa = construir().catch((err) => {
      // Un fallo aquí no debe tumbar el build: se degrada a "sin variantes".
      console.warn("[carrerasIndex] no se pudo construir el índice:", err);
      promesa = null;
      return {
        variantes: new Map(),
        canonico: new Map(),
        porInstitucion: new Map(),
        porNombre: new Map(),
        nombrePorSlug: new Map(),
        porRegion: new Map(),
        instituciones: new Map(),
        porCodigo: new Map(),
        porSlugCarrera: new Map(),
        porSlugInstitucion: new Map(),
      } as Indice;
    });
  }
  return promesa;
}

/**
 * Otras sedes/jornadas del mismo programa, excluyendo la ficha actual.
 * Alimenta el enlazado interno entre fichas hermanas.
 */
export async function variantesDelPrograma(
  nombreCarrera: string,
  codigoInstitucion: string | number,
  codigoActual: string,
  limite = 12,
): Promise<CarreraIndexada[]> {
  const { variantes, canonico } = await indiceCarreras();
  const lista = variantes.get(clavePrograma(nombreCarrera, codigoInstitucion)) ?? [];
  return lista
    .filter((c) => String(c.codigo_carrera) !== String(codigoActual))
    // Los códigos duplicados (canonico) ya no generan página propia — enlazar
    // a uno rompería en un 404.
    .filter((c) => !canonico.has(String(c.codigo_carrera)))
    .slice(0, limite);
}

/**
 * Código canónico de una ficha: el propio, salvo que sea un duplicado exacto
 * de otra fila, en cuyo caso devuelve el elegido para el grupo.
 */
export async function codigoCanonico(codigo: string): Promise<string> {
  const { canonico } = await indiceCarreras();
  return canonico.get(String(codigo)) ?? String(codigo);
}

// ============================================================================
// Agregados para las páginas hub
// ----------------------------------------------------------------------------
// Las hub (/carreras/[slug] y /carreras/region/[slug]) existen porque la
// búsqueda genérica —"estudiar enfermería en Chile", "carreras en Valparaíso"—
// no tenía ninguna página a la que llegar: solo había ~9.900 fichas sueltas.
// Su contenido se calcula aquí a partir del índice, sin consultas extra.
// ============================================================================

export type Estadisticas = {
  programas: number;
  instituciones: number;
  regiones: number;
  arancelMin: number | null;
  arancelMax: number | null;
  arancelPromedio: number | null;
  duracionTipica: number | null;
  empleabilidadPromedio: number | null;
  ingresoPromedio: number | null;
};

/** Convierte el ingreso (que llega como texto en algunas filas) a número. */
function aNumero(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  const limpio = Number(String(valor).replace(/[^\d.-]/g, ""));
  return Number.isFinite(limpio) && limpio > 0 ? limpio : null;
}

const promedio = (xs: number[]): number | null =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

/** Valor más frecuente: para la duración representa mejor que el promedio. */
function moda(xs: number[]): number | null {
  if (!xs.length) return null;
  const cuenta = new Map<number, number>();
  for (const x of xs) cuenta.set(x, (cuenta.get(x) ?? 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function calcularEstadisticas(filas: CarreraIndexada[]): Estadisticas {
  const aranceles = filas
    .map((f) => f.arancel_anual)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const duraciones = filas
    .map((f) => f.duracion_semestres)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const empleabilidades = filas
    .map((f) => f.empleabilidad_1er_anio)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const ingresos = filas
    .map((f) => aNumero(f.ingreso_promedio_4to_anio))
    .filter((v): v is number => v !== null);

  return {
    programas: filas.length,
    instituciones: new Set(filas.map((f) => String(f.codigo_institucion))).size,
    regiones: new Set(filas.map((f) => f.region).filter(Boolean)).size,
    arancelMin: aranceles.length ? Math.min(...aranceles) : null,
    arancelMax: aranceles.length ? Math.max(...aranceles) : null,
    arancelPromedio: promedio(aranceles),
    duracionTipica: moda(duraciones),
    empleabilidadPromedio: promedio(empleabilidades),
    ingresoPromedio: promedio(ingresos),
  };
}

/** Slugs de todas las carreras con al menos una ficha publicable. */
export async function slugsDeCarreras(): Promise<string[]> {
  const { porNombre } = await indiceCarreras();
  return [...porNombre.keys()];
}

/** Todas las filas de una carrera (mismo nombre) en todo Chile. */
export async function carrerasPorSlug(slug: string): Promise<CarreraIndexada[]> {
  const { porNombre } = await indiceCarreras();
  return porNombre.get(slug) ?? [];
}

/** Nombre crudo asociado a un slug, para formatearlo en títulos. */
export async function nombreDeSlug(slug: string): Promise<string | null> {
  const { nombrePorSlug } = await indiceCarreras();
  return nombrePorSlug.get(slug) ?? null;
}

/** Todas las filas de una región. */
export async function carrerasPorRegion(valorRegion: string): Promise<CarreraIndexada[]> {
  const { porRegion } = await indiceCarreras();
  return porRegion.get(valorRegion) ?? [];
}

/**
 * Ficha completa de una carrera con su institución embebida, servida desde el
 * índice en memoria. Sustituye a la consulta `.single()` que /carrera/[id]
 * hacía por página: con ~9.900 fichas prerenderizadas eran ~330 ms cada una,
 * casi una hora de build. Devuelve null si el código no existe.
 */
export async function carreraCompleta(
  codigo: string,
): Promise<CarreraConInstitucion | null> {
  const { porCodigo, instituciones } = await indiceCarreras();
  const fila = porCodigo.get(String(codigo));
  if (!fila) return null;

  const inst = instituciones.get(String(fila.codigo_institucion));
  return {
    ...fila,
    instituciones: inst
      ? {
          slug: inst.slug,
          nombre: inst.nombre,
          tipo: inst.tipo,
          logo_url: inst.logo_url,
          latitud: inst.latitud,
          longitud: inst.longitud,
          direccion: inst.direccion,
          acreditada: inst.acreditada,
          adscrita_gratuidad: inst.adscrita_gratuidad,
        }
      : null,
  };
}

/** Datos de una institución ya cargados en el índice. */
export async function institucionDelIndice(
  codigo: string | number,
): Promise<InstitucionIndexada | undefined> {
  const { instituciones } = await indiceCarreras();
  return instituciones.get(String(codigo));
}

/** Ficha completa de carrera resuelta por su slug (/carrera/[slug]). */
export async function carreraCompletaPorSlug(
  slug: string,
): Promise<CarreraConInstitucion | null> {
  const { porSlugCarrera } = await indiceCarreras();
  const codigo = porSlugCarrera.get(slug);
  if (!codigo) return null;
  return carreraCompleta(codigo);
}

/** Institución resuelta por su slug (/institucion/[slug]). */
export async function institucionPorSlug(
  slug: string,
): Promise<InstitucionIndexada | undefined> {
  const { porSlugInstitucion, instituciones } = await indiceCarreras();
  const codigo = porSlugInstitucion.get(slug);
  if (!codigo) return undefined;
  return instituciones.get(codigo);
}

/**
 * Slugs de todas las fichas de carrera publicables: una por
 * programa+institución+sede+jornada distinto. Los códigos duplicados
 * (basura de ingesta SIES, ver `canonico`) no generan página propia.
 */
export async function slugsDeFichasCarrera(): Promise<string[]> {
  const { porCodigo, canonico } = await indiceCarreras();
  return [...porCodigo.values()]
    .filter((c) => !canonico.has(String(c.codigo_carrera)))
    .map((c) => c.slug)
    .filter(Boolean);
}

/** Slugs de todas las instituciones publicables. */
export async function slugsDeInstituciones(): Promise<string[]> {
  const { instituciones } = await indiceCarreras();
  return [...instituciones.values()].map((i) => i.slug).filter(Boolean);
}

/** Oferta académica de una institución, un enlace por programa distinto. */
export async function carrerasDeInstitucion(
  codigoInstitucion: string | number,
  limite = 60,
): Promise<CarreraIndexada[]> {
  const { porInstitucion } = await indiceCarreras();
  const lista = porInstitucion.get(String(codigoInstitucion)) ?? [];
  return limite > 0 ? lista.slice(0, limite) : lista;
}
