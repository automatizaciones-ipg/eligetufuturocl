// src/lib/noticiasIA/pipeline.ts
// Orquesta generación (Anthropic) → imágenes (Unsplash) → enlaces curados →
// insert en `noticias`, con idempotencia semanal vía noticias_ia_runs.iso_week.
// Mismo estilo que src/lib/scraper/pipeline.ts.
import { randomUUID } from "node:crypto";
import { getSupabaseServerClient } from "../../../lib/supabaseServer";
import { generarArticulo } from "./anthropic";
import { buscarImagenes } from "./unsplash";
import { armarEnlacesReferencia } from "./enlaces";
import { colorParaCategoria } from "./categorias";
import { calcularTiempoLectura } from "./readingTime";
import type { PipelineResult } from "./types";

const AUTOR = "Redacción Explora";

function isoWeekChile(): string {
  const chileStr = new Date().toLocaleString("en-US", { timeZone: "America/Santiago" });
  const local = new Date(chileStr);
  const d = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function runNoticiaIAJob(): Promise<PipelineResult> {
  const supabase = getSupabaseServerClient();
  const isoWeek = isoWeekChile();

  const { data: run, error: insertRunError } = await supabase
    .from("noticias_ia_runs")
    .insert({ iso_week: isoWeek, status: "running" })
    .select("id")
    .single();

  if (insertRunError || !run) {
    // Conflicto de unicidad en iso_week => ya se publicó esta semana.
    if (insertRunError?.code === "23505") {
      return { status: "already_ran", isoWeek };
    }
    throw new Error(insertRunError?.message ?? "No se pudo crear la corrida en noticias_ia_runs.");
  }

  const runId = run.id as string;

  try {
    const { data: recientes } = await supabase
      .from("noticias")
      .select("titulo")
      .order("created_at", { ascending: false })
      .limit(15);
    const temasRecientes = (recientes ?? []).map((n: { titulo: string }) => n.titulo);

    const articulo = await generarArticulo(temasRecientes);
    const imagenes = await buscarImagenes(articulo.image_search_keywords);
    const enlacesReferencia = armarEnlacesReferencia(articulo.tags);
    const color = colorParaCategoria(articulo.categoria);
    const tiempoLectura = calcularTiempoLectura(articulo.cuerpo_markdown);

    const noticiaId = randomUUID();
    // El slug (/noticia/<slug>) lo arma el trigger noticias_generar_slug en
    // la propia base de datos (ver supabase/migrations/0004 y 0005) — misma
    // lógica sin importar si la fila la inserta este pipeline o se publica
    // manual, directo en la tabla.
    const { error: insertNoticiaError } = await supabase.from("noticias").insert({
      id: noticiaId,
      titulo: articulo.titulo,
      extracto: articulo.extracto,
      categoria: articulo.categoria,
      color,
      autor: AUTOR,
      imagen_principal: imagenes.principal,
      imagenes_secundarias: imagenes.secundarias,
      cuerpo_markdown: articulo.cuerpo_markdown,
      enlaces_referencia: enlacesReferencia,
      estado: "activado",
      destacada: true,
      tiempo_lectura: tiempoLectura,
      tags: articulo.tags,
      puntos_clave: articulo.puntos_clave,
    });

    if (insertNoticiaError) {
      throw new Error(`No se pudo insertar la noticia: ${insertNoticiaError.message}`);
    }

    await supabase
      .from("noticias_ia_runs")
      .update({ status: "success", noticia_id: noticiaId, finished_at: new Date().toISOString() })
      .eq("id", runId);

    return { status: "success", noticiaId, isoWeek };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("noticias_ia_runs")
      .update({ status: "error", error_message: message, finished_at: new Date().toISOString() })
      .eq("id", runId);
    return { status: "error", isoWeek, message };
  }
}
