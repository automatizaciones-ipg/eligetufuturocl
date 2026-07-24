// src/pages/api/admin/tendencias/careers/update.ts
import type { APIRoute } from "astro";
import { jsonResponse } from "../../../../../lib/api/validators";
import { getSupabaseServerClient } from "../../../../../../lib/supabaseServer";

export const prerender = false;

const NIVELES_VALIDOS = new Set(["Muy buscada", "Buscada", "Emergente"]);

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isFinite(id)) return jsonResponse({ ok: false, message: "Falta id." }, 400);

    const update: Record<string, string> = {};
    if (typeof body.nombre_display === "string" && body.nombre_display.trim()) {
      update.nombre_display = body.nombre_display.trim();
    }
    if (typeof body.slug_busqueda === "string" && body.slug_busqueda.trim()) {
      update.slug_busqueda = body.slug_busqueda.trim();
    }
    if (typeof body.nivel === "string" && NIVELES_VALIDOS.has(body.nivel)) {
      update.nivel = body.nivel;
    }
    if (Object.keys(update).length === 0) {
      return jsonResponse({ ok: false, message: "Nada que actualizar." }, 400);
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("scraping_careers").update(update).eq("id", id);
    if (error) return jsonResponse({ ok: false, message: error.message }, 500);

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return jsonResponse({ ok: false, message }, 500);
  }
};
