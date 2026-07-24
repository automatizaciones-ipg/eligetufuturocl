// src/lib/scraper/jobRunner.ts
// Estado del scraping en memoria a nivel de módulo — el adapter @astrojs/node
// en modo "standalone" corre como un único proceso Node persistente (no
// serverless), así que un Map en memoria alcanza para trackear el job en
// curso (mismo supuesto que el rate-limiter de src/middleware.ts).
import { randomUUID } from "node:crypto";
import { runPipeline } from "./pipeline";
import type { JobState } from "./types";

const jobs = new Map<string, JobState>();

export function startScrapeJob(): { jobId: string } | { error: string } {
  const yaHayUnoCorriendo = [...jobs.values()].some((j) => j.status === "running");
  if (yaHayUnoCorriendo) return { error: "Ya hay un scraping en curso." };

  const jobId = randomUUID();
  const initial: JobState = {
    id: jobId,
    status: "running",
    phase: "iniciando",
    progress: { current: 0, total: 1 },
    startedAt: Date.now(),
  };
  jobs.set(jobId, initial);

  runPipeline((patch) => {
    const current = jobs.get(jobId);
    if (current) jobs.set(jobId, { ...current, ...patch });
  }).catch((err) => {
    const current = jobs.get(jobId) ?? initial;
    const message = err instanceof Error ? err.message : String(err);
    jobs.set(jobId, { ...current, status: "error", error: message, finishedAt: Date.now() });
  });

  return { jobId };
}

export function getJobStatus(jobId: string): JobState | undefined {
  return jobs.get(jobId);
}
