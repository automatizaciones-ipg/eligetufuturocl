// src/pages/api/admin/tendencias/publish.ts
import type { APIRoute } from "astro";
import { jsonResponse } from "../../../../lib/api/validators";
import { getSupabaseServerClient } from "../../../../../lib/supabaseServer";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const runId = String(body.runId ?? "");
    if (!runId) return jsonResponse({ ok: false, message: "Falta runId." }, 400);

    const supabase = getSupabaseServerClient();

    const { data: run, error: selectError } = await supabase
      .from("scraping_runs")
      .select("status")
      .eq("id", runId)
      .single();
    if (selectError || !run) return jsonResponse({ ok: false, message: "Corrida no encontrada." }, 404);
    if (run.status !== "success") {
      return jsonResponse({ ok: false, message: "Solo se pueden publicar corridas exitosas." }, 400);
    }

    const { error } = await supabase
      .from("tendencias_config")
      .update({ published_run_id: runId, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return jsonResponse({ ok: false, message: error.message }, 500);

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return jsonResponse({ ok: false, message }, 500);
  }
};
