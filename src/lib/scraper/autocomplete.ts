// src/lib/scraper/autocomplete.ts
// Puerto de scraper.js — Google Autocomplete (Chile), sin dependencias.
// Técnica: "prefix expansion" — cada intención semilla se expande con a-z
// para cosechar el long tail de sugerencias. Puntúa cada carrera por posición
// (popularidad) y frecuencia de aparición.
import { EXTRA_SEEDS, INTENTS, extractCore, norm } from "./normalize";
import type { CareerCandidate } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const BASE = "https://www.google.com/complete/search";
const HL = "es";
const GL = "cl";
const ALPHA = "abcdefghijklmnopqrstuvwxyz".split("");
const SLEEP_MS = 180; // cortesía / anti-bloqueo, igual que el scraper original

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function suggest(q: string): Promise<string[]> {
  const url = `${BASE}?client=chrome&hl=${HL}&gl=${GL}&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) return [];
    const j = JSON.parse(await r.text());
    return Array.isArray(j[1]) ? j[1] : [];
  } catch {
    return [];
  }
}

export type AutocompleteResult = {
  requests: number;
  sugerencias: number;
  ranking: CareerCandidate[];
  intenciones: { modificador: string; conteo: number }[];
  preguntas: { pregunta: string; conteo: number }[];
};

export async function runAutocompleteHarvest(
  onProgress: (current: number, total: number) => void
): Promise<AutocompleteResult> {
  const careers = new Map<string, { score: number; hits: number; samples: Set<string> }>();
  const intent: Record<string, number> = {};
  const questions = new Map<string, number>();
  let reqCount = 0;
  let sugCount = 0;

  const seeds = [...INTENTS, ...EXTRA_SEEDS];
  const total = seeds.length * (1 + ALPHA.length);

  function record(sug: string, pos: number) {
    sugCount++;
    const sn = norm(sug);
    if (/^(que|como|cuanto|cuantos|cual|cuales|donde|por que|sirve)\b/.test(sn)) {
      questions.set(sn, (questions.get(sn) ?? 0) + 1);
    }

    const core = extractCore(sug, (canonicalMod) => {
      intent[canonicalMod] = (intent[canonicalMod] ?? 0) + 1;
    });
    if (core.length < 3 || core.split(" ").length > 6) return;

    let o = careers.get(core);
    if (!o) {
      o = { score: 0, hits: 0, samples: new Set() };
      careers.set(core, o);
    }
    o.score += Math.max(1, 11 - pos); // posición 0 = más popular = más peso
    o.hits += 1;
    if (o.samples.size < 4) o.samples.add(norm(sug));
  }

  async function harvest(seed: string) {
    const first = await suggest(seed);
    reqCount++;
    onProgress(reqCount, total);
    first.forEach((x, i) => record(x, i));
    await sleep(SLEEP_MS);

    for (const a of ALPHA) {
      const sg = await suggest(seed + a);
      reqCount++;
      onProgress(reqCount, total);
      sg.forEach((x, i) => record(x, i));
      await sleep(SLEEP_MS);
    }
  }

  for (const seed of seeds) {
    await harvest(seed);
  }

  const ranking = [...careers.entries()]
    .map(([termino, o]) => ({ termino, score: o.score, apariciones: o.hits, ejemplos: [...o.samples] }))
    .filter((c) => c.apariciones >= 2)
    .sort((a, b) => b.score - a.score);

  const intenciones = Object.entries(intent)
    .sort((a, b) => b[1] - a[1])
    .map(([modificador, conteo]) => ({ modificador, conteo }));

  const preguntas = [...questions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([pregunta, conteo]) => ({ pregunta, conteo }));

  return { requests: reqCount, sugerencias: sugCount, ranking, intenciones, preguntas };
}
