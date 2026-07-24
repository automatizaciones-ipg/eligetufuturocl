// src/lib/scraper/types.ts
export type CareerCandidate = {
  termino: string; // núcleo normalizado (sin tildes)
  score: number;
  apariciones: number;
  ejemplos: string[];
};

export type TrendPoint = {
  keyword: string;
  interes_actual: number;
  momentum_pct: number;
  estado: "subiendo" | "bajando" | "estable";
};

export type BuiltCareer = {
  termino_raw: string;
  nombre_display: string;
  slug_busqueda: string;
  score: number;
  apariciones: number;
  demanda: number;
  momentum_pct: number | null;
  estado: string;
  interes_actual: number | null;
  oportunidad: number;
  ejemplos: string[];
  nivel: string;
  orden: number;
};

export type JobStatus = "running" | "success" | "error";

export type JobState = {
  id: string;
  runId?: string;
  status: JobStatus;
  phase: string;
  progress: { current: number; total: number };
  startedAt: number;
  finishedAt?: number;
  error?: string;
};
