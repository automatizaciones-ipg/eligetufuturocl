// src/lib/scraper/pipeline.ts
// Orquesta autocomplete → catálogo (tildes) → trends → build, y persiste todo
// en Supabase (una fila nueva en scraping_runs + sus hijos). Llamado por
// src/lib/scraper/jobRunner.ts, nunca directo desde una ruta HTTP.
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import { runAutocompleteHarvest } from "./autocomplete";
import { buildCareers, cleanTop } from "./build";
import { buildCatalogMap, norm, titleCase } from "./normalize";
import { runTrendsMomentum, TRENDS_WINDOW } from "./trends";
import type { JobState } from "./types";

type Patch = (patch: Partial<JobState>) => void;

export async function runPipeline(patch: Patch): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { data: run, error: insertError } = await supabase
    .from("scraping_runs")
    .insert({ status: "running", trends_window: TRENDS_WINDOW })
    .select("id")
    .single();
  if (insertError || !run) {
    throw new Error(insertError?.message ?? "No se pudo crear la corrida en scraping_runs.");
  }

  const runId = run.id as string;
  patch({ runId });

  try {
    patch({ phase: "autocomplete", progress: { current: 0, total: 1 } });
    const auto = await runAutocompleteHarvest((current, total) => {
      patch({ phase: "autocomplete", progress: { current, total } });
    });

    patch({ phase: "catalogo" });
    // Catálogo real (SIES/MINEDUC) para recuperar tildes correctas al mostrar.
    const { data: carrerasDb } = await supabase.from("carreras").select("nombre_carrera");
    const catalogMap = buildCatalogMap(
      (carrerasDb ?? []).map((c: { nombre_carrera: string | null }) => c.nombre_carrera ?? "").filter(Boolean)
    );

    patch({ phase: "trends", progress: { current: 0, total: 1 } });
    const topCandidates = cleanTop(auto.ranking);
    const trends = await runTrendsMomentum(
      topCandidates.map((c) => c.termino),
      (current, total) => patch({ phase: "trends", progress: { current, total } })
    );

    patch({ phase: "guardando" });
    const built = buildCareers(auto.ranking, trends, catalogMap);

    // Banco de respuestas: autocompleta preguntas ya contestadas en corridas previas.
    const { data: bank } = await supabase.from("scraping_respuestas_bank").select("pregunta_norm,respuesta");
    const bankMap = new Map<string, string>((bank ?? []).map((b: { pregunta_norm: string; respuesta: string }) => [b.pregunta_norm, b.respuesta]));

    const careerRows = built.map((c) => ({
      run_id: runId,
      termino_raw: c.termino_raw,
      nombre_display: c.nombre_display,
      slug_busqueda: c.slug_busqueda,
      score: c.score,
      apariciones: c.apariciones,
      demanda: c.demanda,
      momentum_pct: c.momentum_pct,
      estado: c.estado,
      interes_actual: c.interes_actual,
      oportunidad: c.oportunidad,
      ejemplos: c.ejemplos,
      nivel: c.nivel,
      orden: c.orden,
    }));

    const intencionRows = auto.intenciones.slice(0, 8).map((m, i) => ({
      run_id: runId,
      modificador: m.modificador,
      etiqueta_display: titleCase(m.modificador),
      conteo: m.conteo,
      nota: `Aparece en ${m.conteo} señales de búsqueda.`,
      orden: i + 1,
    }));

    const preguntaRows = auto.preguntas.slice(0, 12).map((p, i) => {
      const preguntaNorm = norm(p.pregunta);
      const respuestaPrevia = bankMap.get(preguntaNorm) ?? null;
      return {
        run_id: runId,
        pregunta: p.pregunta,
        pregunta_norm: preguntaNorm,
        conteo: p.conteo,
        respuesta: respuestaPrevia,
        aprobada: Boolean(respuestaPrevia),
        orden: i + 1,
      };
    });

    if (careerRows.length) await supabase.from("scraping_careers").insert(careerRows);
    if (intencionRows.length) await supabase.from("scraping_intenciones").insert(intencionRows);
    if (preguntaRows.length) await supabase.from("scraping_preguntas").insert(preguntaRows);

    await supabase
      .from("scraping_runs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        requests_count: auto.requests,
        sugerencias_count: auto.sugerencias,
        carreras_detectadas: auto.ranking.length,
      })
      .eq("id", runId);

    patch({ status: "success", phase: "listo", finishedAt: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("scraping_runs")
      .update({ status: "error", error_message: message, finished_at: new Date().toISOString() })
      .eq("id", runId);
    patch({ status: "error", error: message, finishedAt: Date.now() });
    throw err;
  }
}
