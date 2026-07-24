// src/pages/api/admin/tendencias/preguntas/update.ts
import type { APIRoute } from "astro";
import { jsonResponse } from "../../../../../lib/api/validators";
import { getSupabaseServerClient } from "../../../../../../lib/supabaseServer";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isFinite(id)) return jsonResponse({ ok: false, message: "Falta id." }, 400);

    const update: Record<string, string | boolean> = {};
    if (typeof body.respuesta === "string") update.respuesta = body.respuesta.trim();
    if (typeof body.aprobada === "boolean") update.aprobada = body.aprobada;
    if (Object.keys(update).length === 0) {
      return jsonResponse({ ok: false, message: "Nada que actualizar." }, 400);
    }

    const supabase = getSupabaseServerClient();

    const { data: row, error: selectError } = await supabase
      .from("scraping_preguntas")
      .select("pregunta_norm")
      .eq("id", id)
      .single();
    if (selectError || !row) return jsonResponse({ ok: false, message: "Pregunta no encontrada." }, 404);

    const { error } = await supabase.from("scraping_preguntas").update(update).eq("id", id);
    if (error) return jsonResponse({ ok: false, message: error.message }, 500);

    // Alimenta el banco de respuestas para autocompletar corridas futuras.
    if (typeof update.respuesta === "string" && update.respuesta) {
      await supabase.from("scraping_respuestas_bank").upsert({
        pregunta_norm: row.pregunta_norm,
        respuesta: update.respuesta,
        updated_at: new Date().toISOString(),
      });
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return jsonResponse({ ok: false, message }, 500);
  }
};
