// src/pages/api/buscar.ts
// ============================================================================
// Búsqueda del buscador del header (carreras e instituciones).
//
// Por qué existe: el Header consultaba Supabase directamente desde el
// navegador, y como va con `client:load` en el Layout, eso arrastraba el
// cliente de Supabase (204 KB, el bundle más pesado del sitio) a la ruta
// crítica de TODAS las páginas, incluidas las que ya no necesitan datos en
// cliente. Moviendo las dos consultas aquí, el navegador solo hace un `fetch`.
//
// Es GET a propósito (es una lectura idempotente y cacheable), a diferencia del
// resto de endpoints de /api que son POST. El rate limiting del middleware solo
// cubre POST, así que aquí se acota el coste por la vía del propio query:
// mínimo 3 caracteres, longitud máxima y `limit` fijo.
// ============================================================================
import type { APIRoute } from "astro";
// Cliente anónimo a propósito: son exactamente los mismos datos públicos que el
// navegador ya leía por su cuenta, así que no se eleva ningún privilegio.
import { supabase } from "../../../lib/supabase";
import { jsonResponse } from "../../lib/api/validators";

export const prerender = false;

const MIN_CARACTERES = 3;
const MAX_CARACTERES = 80;

export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, MAX_CARACTERES);

  if (q.length < MIN_CARACTERES) {
    return jsonResponse({ carreras: [], instituciones: [] });
  }

  // Los datos del SIES vienen sin tildes; el comodín por vocal permite que
  // "ingeniería" encuentre "INGENIERIA". Se escapan antes los comodines de
  // LIKE para que un `%` escrito por el usuario no barra la tabla entera.
  const patron = q
    .replace(/[%_\\]/g, "")
    .replace(/[aeiouáéíóúAEIOUÁÉÍÓÚ]/g, "_");

  if (!patron) {
    return jsonResponse({ carreras: [], instituciones: [] });
  }

  try {
    const [resCarreras, resInstituciones] = await Promise.all([
      supabase
        .from("carreras")
        .select("codigo_carrera, nombre_carrera, instituciones(nombre)")
        .ilike("nombre_carrera", `%${patron}%`)
        .limit(4),
      supabase
        .from("instituciones")
        .select("codigo_institucion, nombre, tipo")
        .ilike("nombre", `%${patron}%`)
        .limit(2),
    ]);

    const carreras = (resCarreras.data ?? []).map((c: any) => {
      const inst = Array.isArray(c.instituciones) ? c.instituciones[0] : c.instituciones;
      return {
        codigo_carrera: c.codigo_carrera,
        nombre_carrera: c.nombre_carrera,
        institucion: inst?.nombre ?? "Institución no informada",
      };
    });

    const instituciones = (resInstituciones.data ?? []).map((i: any) => ({
      codigo_institucion: i.codigo_institucion,
      nombre: i.nombre,
      tipo: i.tipo ?? "Educación Superior",
    }));

    return new Response(JSON.stringify({ carreras, instituciones }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // La oferta académica cambia una vez al año: cachear las búsquedas
        // repetidas evita golpear Supabase por cada tecleo de cada visitante.
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch {
    // El buscador es un extra: si falla, devuelve vacío en vez de romper el
    // header en todas las páginas del sitio.
    return jsonResponse({ carreras: [], instituciones: [] });
  }
};
