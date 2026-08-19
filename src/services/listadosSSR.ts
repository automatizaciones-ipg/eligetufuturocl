// src/services/listadosSSR.ts
// ============================================================================
// Datos que las páginas de listado (buscador, instituciones, mercado laboral)
// necesitan resueltos EN EL SERVIDOR para que el HTML salga con contenido y con
// enlaces a /carrera/ e /institucion/. Antes todo se pedía en el cliente, así
// que los buscadores recibían páginas vacías y las ~10.000 fichas quedaban sin
// un solo enlace interno que las respaldara.
//
// Estas páginas son SSR, así que cada visita dispararía las mismas consultas.
// Se cachean en memoria del proceso Node (misma suposición de instancia única
// que el rate-limiter de src/middleware.ts y el jobRunner del scraper).
// ============================================================================
import { supabase } from "../../lib/supabase";

const TTL_MS = 10 * 60 * 1000; // 10 minutos

type Entrada<T> = { valor: T; expira: number };
const cache = new Map<string, Entrada<unknown>>();

/** Memoiza el resultado de `cargar` durante TTL_MS. Ante error, no cachea. */
async function memo<T>(clave: string, cargar: () => Promise<T>, vacio: T): Promise<T> {
  const hit = cache.get(clave) as Entrada<T> | undefined;
  if (hit && hit.expira > Date.now()) return hit.valor;

  try {
    const valor = await cargar();
    cache.set(clave, { valor, expira: Date.now() + TTL_MS });
    return valor;
  } catch {
    // Si Supabase falla, la página se sirve sin semilla y el componente
    // reintenta en cliente: degradamos, no rompemos.
    return hit?.valor ?? vacio;
  }
}

/** Campos mínimos que la tarjeta del buscador necesita para pintarse. */
const CAMPOS_BUSCADOR =
  "codigo_carrera, slug, nombre_carrera, region, duracion_semestres, arancel_anual, instituciones!inner (nombre, tipo, logo_url)";

/** Primera página de carreras, ordenada por nombre (estable y cacheable). */
export function carrerasIniciales(limite = 30) {
  return memo<any[]>(
    `carreras:${limite}`,
    async () => {
      const { data, error } = await supabase
        .from("carreras")
        .select(CAMPOS_BUSCADOR)
        .order("nombre_carrera", { ascending: true })
        .limit(limite);
      if (error) throw error;
      return data ?? [];
    },
    [],
  );
}

/** Total de carreras, para la paginación del buscador. */
export function totalCarreras() {
  return memo<number>(
    "carreras:total",
    async () => {
      const { count, error } = await supabase
        .from("carreras")
        .select("codigo_carrera", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    0,
  );
}

/** Regiones distintas presentes en la oferta académica. */
export function regionesDisponibles() {
  return memo<string[]>(
    "regiones",
    async () => {
      const { data, error } = await supabase
        .from("carreras")
        .select("region")
        .not("region", "is", null);
      if (error) throw error;
      return Array.from(
        new Set((data ?? []).map((r: any) => r.region as string)),
      ).sort();
    },
    [],
  );
}

/** Nombres de instituciones, para el selector del buscador. */
export function nombresInstituciones() {
  return memo<{ nombre: string }[]>(
    "instituciones:nombres",
    async () => {
      const { data, error } = await supabase
        .from("instituciones")
        .select("nombre")
        .order("nombre");
      if (error) throw error;
      return Array.from(
        new Set((data ?? []).map((i: any) => i.nombre as string)),
      ).map((nombre) => ({ nombre }));
    },
    [],
  );
}

/** Instituciones con sus regiones, tal como las consume el directorio. */
export function institucionesDirectorio() {
  return memo<any[]>(
    "instituciones:directorio",
    async () => {
      const { data, error } = await supabase.from("instituciones").select(`
          codigo_institucion,
          slug,
          nombre,
          tipo,
          adscrita_gratuidad,
          acreditada,
          logo_url,
          carreras ( region )
        `);
      if (error) throw error;
      return data ?? [];
    },
    [],
  );
}

/** Carreras destacadas de la home: top por empleabilidad + socias (U. Autónoma, IPG). */
export function carrerasDestacadasHome() {
  return memo<any[]>(
    "home:carreras-destacadas",
    async () => {
      const CAMPOS =
        "id, codigo_carrera, slug, nombre_carrera, empleabilidad_1er_anio, ingreso_promedio_4to_anio, arancel_anual, instituciones!inner(nombre, tipo, logo_url)";
      const [{ data: top, error: e1 }, { data: ua, error: e2 }, { data: ipg, error: e3 }] =
        await Promise.all([
          supabase
            .from("carreras")
            .select(CAMPOS)
            .not("empleabilidad_1er_anio", "is", null)
            .not("ingreso_promedio_4to_anio", "is", null)
            .order("empleabilidad_1er_anio", { ascending: false })
            .limit(25),
          supabase.from("carreras").select(CAMPOS).ilike("instituciones.nombre", "%aut_noma%").limit(8),
          supabase.from("carreras").select(CAMPOS).ilike("instituciones.nombre", "%ipg%").limit(8),
        ]);
      if (e1 || e2 || e3) throw e1 || e2 || e3;
      return [...(top ?? []), ...(ua ?? []), ...(ipg ?? [])];
    },
    [],
  );
}

/** Noticias destacadas de la home (carrusel). */
export function noticiasDestacadasHome(limite = 12) {
  return memo<any[]>(
    `home:noticias:${limite}`,
    async () => {
      const { data, error } = await supabase
        .from("noticias")
        .select("id, slug, titulo, extracto, categoria, autor, imagen_principal, tiempo_lectura, created_at, destacada")
        .eq("estado", "activado")
        .order("created_at", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return data ?? [];
    },
    [],
  );
}

/** Carreras con datos de empleabilidad, para el ranking de mercado laboral. */
export function carrerasMercadoLaboral(limite = 200) {
  return memo<any[]>(
    `mercado:${limite}`,
    async () => {
      const { data, error } = await supabase
        .from("carreras")
        .select(
          "id, codigo_carrera, slug, nombre_carrera, empleabilidad_1er_anio, ingreso_promedio_4to_anio, arancel_anual, instituciones!inner (nombre, tipo, logo_url)",
        )
        .not("empleabilidad_1er_anio", "is", null)
        .not("ingreso_promedio_4to_anio", "is", null)
        .order("empleabilidad_1er_anio", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return data ?? [];
    },
    [],
  );
}
