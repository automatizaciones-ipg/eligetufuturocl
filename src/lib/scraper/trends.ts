// src/lib/scraper/trends.ts
// Puerto de trends.js — Google Trends (no oficial) → momentum de carreras (Chile).
//
// FIX estacionalidad: el original comparaba primeras-4-semanas vs
// últimas-4-semanas de un recorte de 12 meses. Como el interés en carreras
// peakea dic-mar (admisión) y cae el resto del año, cualquier corrida entre
// abril y noviembre comparaba "cola del año pasado" vs "valle de este año" →
// siempre salía "bajando", sin importar la tendencia real. Ahora se pide una
// ventana de 5 años (resolución semanal) y se compara AÑO CONTRA AÑO en el
// mismo período calendario.
import type { TrendPoint } from "./types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const HL = "es-CL";
const TZ = "180";
const GEO = "CL";
export const TRENDS_WINDOW = "today 5-y";
const SLEEP_MS = 1600;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const deprefix = (t: string) => JSON.parse(t.substring(t.indexOf("{")));
const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

let cookie = "";

async function refreshCookie(): Promise<boolean> {
  const r = await fetch(`https://trends.google.com/trends/explore?geo=${GEO}&hl=es`, {
    headers: { "User-Agent": UA },
  });
  const sc = (r.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  cookie = sc.map((c) => c.split(";")[0]).join("; ");
  return Boolean(cookie);
}

async function gget(url: string): Promise<string | null> {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Cookie: cookie, Referer: "https://trends.google.com/" },
    });
    if (r.status === 200) return await r.text();
    if (r.status === 429) {
      await sleep(1500 * (i + 1));
      await refreshCookie();
      continue;
    }
    return null;
  }
  return null;
}

async function explore(kw: string): Promise<any[] | null> {
  const req = JSON.stringify({
    comparisonItem: [{ keyword: kw, geo: GEO, time: TRENDS_WINDOW }],
    category: 0,
    property: "",
  });
  const u = `https://trends.google.com/trends/api/explore?hl=${HL}&tz=${TZ}&req=${encodeURIComponent(req)}`;
  const t = await gget(u);
  if (!t) return null;
  try {
    return deprefix(t).widgets;
  } catch {
    return null;
  }
}

async function timeseries(w: any): Promise<number[] | null> {
  const u = `https://trends.google.com/trends/api/widgetdata/multiline?hl=${HL}&tz=${TZ}&req=${encodeURIComponent(
    JSON.stringify(w.request)
  )}&token=${w.token}`;
  const t = await gget(u);
  if (!t) return null;
  try {
    return deprefix(t).default.timelineData.map((d: any) => d.value[0]);
  } catch {
    return null;
  }
}

async function momentum(kw: string): Promise<TrendPoint | null> {
  const widgets = await explore(kw);
  if (!widgets) return null;
  const w = widgets.find((x) => x.id === "TIMESERIES");
  if (!w) return null;

  const vals = await timeseries(w);
  if (!vals || vals.length < 60) return null; // necesitamos ~1 año+ de historial semanal

  const current = avg(vals.slice(-4)); // últimas 4 semanas (hoy)
  const yoyIndex = vals.length - 1 - 52; // misma semana, un año calendario atrás
  const yearAgoSlice = vals.slice(Math.max(0, yoyIndex - 3), yoyIndex + 1);
  if (yearAgoSlice.length === 0) return null;
  const yearAgo = avg(yearAgoSlice);

  const pct = yearAgo > 0 ? Math.round(((current - yearAgo) / yearAgo) * 100) : 0;
  const estado: TrendPoint["estado"] = pct > 10 ? "subiendo" : pct < -10 ? "bajando" : "estable";
  return { keyword: kw, interes_actual: Math.round(current), momentum_pct: pct, estado };
}

export async function runTrendsMomentum(
  keywords: string[],
  onProgress: (current: number, total: number) => void
): Promise<TrendPoint[]> {
  await refreshCookie();
  const out: TrendPoint[] = [];
  for (let i = 0; i < keywords.length; i++) {
    const m = await momentum(keywords[i]);
    if (m) out.push(m);
    onProgress(i + 1, keywords.length);
    await sleep(SLEEP_MS);
  }
  return out;
}
