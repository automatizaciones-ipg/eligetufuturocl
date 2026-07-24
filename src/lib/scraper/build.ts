// src/lib/scraper/build.ts
// Puerto de build.js — combina demanda (autocomplete) + momentum (trends) en
// un score de oportunidad, y resuelve nombre/nivel de cada carrera.
import { deriveNivel, resolveDisplayName } from "./normalize";
import type { BuiltCareer, CareerCandidate, TrendPoint } from "./types";

const TOP_N = 18;

// Términos meta / no-carrera que ensucian el ranking de autocomplete.
const STOP = new Set([
  "carreras",
  "carrera",
  "carreras cortas",
  "carreras tecnicas",
  "carreras futuro",
  "carreras futuro laboral",
  "carreras mas futuro",
  "carreras online",
  "carreras mejor pagadas",
  "carreras mejor pagada",
  "ingles",
  "online",
  "gratis",
  "que estudiar",
  "que carrera",
  "estudiar",
]);
const isMeta = (t: string) => STOP.has(t) || t.startsWith("carreras ") || t === "carreras";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function cleanTop(ranking: CareerCandidate[], n = TOP_N): CareerCandidate[] {
  return ranking.filter((c) => !isMeta(c.termino) && c.termino.length > 3 && c.apariciones >= 2).slice(0, n);
}

export function buildCareers(
  ranking: CareerCandidate[],
  trends: TrendPoint[],
  catalogMap: Map<string, string>
): BuiltCareer[] {
  const tmap = new Map(trends.map((t) => [t.keyword.toLowerCase(), t]));
  const top = cleanTop(ranking, TOP_N);
  const maxScore = Math.max(1, ...top.map((c) => c.score));

  const careers: Omit<BuiltCareer, "orden">[] = top.map((c) => {
    const tr = tmap.get(c.termino.toLowerCase()) ?? null;
    const demanda = Math.round((c.score / maxScore) * 100);
    const pct = tr ? tr.momentum_pct : 0;
    const momentumNorm = tr ? Math.round(clamp(((pct + 50) / 100) * 100, 0, 100)) : 50;
    const oportunidad = Math.round(0.6 * demanda + 0.4 * momentumNorm);
    const nombreDisplay = resolveDisplayName(c.termino, catalogMap);

    return {
      termino_raw: c.termino,
      nombre_display: nombreDisplay,
      slug_busqueda: nombreDisplay.toLowerCase(),
      score: c.score,
      apariciones: c.apariciones,
      demanda,
      momentum_pct: tr ? pct : null,
      estado: tr ? tr.estado : "sin dato",
      interes_actual: tr ? tr.interes_actual : null,
      oportunidad,
      ejemplos: c.ejemplos.slice(0, 3),
      nivel: deriveNivel(demanda),
    };
  });

  return careers
    .sort((a, b) => b.oportunidad - a.oportunidad)
    .map((c, i) => ({ ...c, orden: i + 1 }));
}
