// src/pages/api/admin/tendencias/intenciones/update.ts
import type { APIRoute } from "astro";
import { jsonResponse } from "../../../../../lib/api/validators";
import { getSupabaseServerClient } from "../../../../../../lib/supabaseServer";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isFinite(id)) return jsonResponse({ ok: false, message: "Falta id." }, 400);

    const update: Record<string, string> = {};
    if (typeof body.etiqueta_display === "string" && body.etiqueta_display.trim()) {
      update.etiqueta_display = body.etiqueta_display.trim();
    }
    if (typeof body.nota === "string") {
      update.nota = body.nota.trim();
    }
    if (Object.keys(update).length === 0) {
      return jsonResponse({ ok: false, message: "Nada que actualizar." }, 400);
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("scraping_intenciones").update(update).eq("id", id);
    if (error) return jsonResponse({ ok: false, message: error.message }, 500);

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return jsonResponse({ ok: false, message }, 500);
  }
};
