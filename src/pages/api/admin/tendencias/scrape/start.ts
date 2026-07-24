// src/pages/api/admin/tendencias/scrape/start.ts
import type { APIRoute } from "astro";
import { jsonResponse } from "../../../../../lib/api/validators";
import { startScrapeJob } from "../../../../../lib/scraper/jobRunner";

export const prerender = false;

export const POST: APIRoute = async () => {
  const result = startScrapeJob();
  if ("error" in result) return jsonResponse({ ok: false, message: result.error }, 409);
  return jsonResponse({ ok: true, jobId: result.jobId });
};
