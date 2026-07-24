// src/pages/api/admin/tendencias/scrape/status.ts
import type { APIRoute } from "astro";
import { jsonResponse } from "../../../../../lib/api/validators";
import { getJobStatus } from "../../../../../lib/scraper/jobRunner";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const jobId = url.searchParams.get("jobId");
  if (!jobId) return jsonResponse({ ok: false, message: "Falta jobId." }, 400);

  const job = getJobStatus(jobId);
  if (!job) return jsonResponse({ ok: false, message: "Corrida no encontrada." }, 404);

  return jsonResponse({ ok: true, job });
};
