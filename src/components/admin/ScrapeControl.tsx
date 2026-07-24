// src/components/admin/ScrapeControl.tsx
// Botón "INICIAR SCRAPING" + polling de progreso del panel admin oculto.
import { useEffect, useRef, useState } from "react";

type Job = {
  id: string;
  runId?: string;
  status: "running" | "success" | "error";
  phase: string;
  progress: { current: number; total: number };
  error?: string;
};

const FASE_LABEL: Record<string, string> = {
  iniciando: "Iniciando…",
  autocomplete: "Cosechando Google Autocomplete",
  catalogo: "Cruzando con el catálogo de carreras",
  trends: "Consultando Google Trends (momentum)",
  guardando: "Guardando resultados",
  listo: "Listo",
};

export default function ScrapeControl() {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  function poll(jobId: string) {
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/tendencias/scrape/status?jobId=${jobId}`);
        const data = await res.json();
        if (!data.ok) return;
        setJob(data.job);
        if (data.job.status === "success" || data.job.status === "error") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          if (data.job.status === "success" && data.job.runId) {
            window.location.href = `/admin/tendencias?run=${data.job.runId}`;
          }
        }
      } catch {
        // reintenta en el próximo tick
      }
    }, 2500);
  }

  async function iniciar() {
    setError(null);
    try {
      const res = await fetch("/api/admin/tendencias/scrape/start", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message ?? "No se pudo iniciar el scraping.");
        return;
      }
      poll(data.jobId);
    } catch {
      setError("No se pudo contactar al servidor.");
    }
  }

  const running = job?.status === "running";
  const pct = job && job.progress.total > 0 ? Math.round((job.progress.current / job.progress.total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-base-300 bg-base-200/40 p-5 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-lg">Scraping de tendencias</h2>
          <p className="text-sm text-base-content/60">
            Google Autocomplete + Google Trends (Chile). Toma entre 1 y 3 minutos.
          </p>
        </div>
        <button className="btn btn-primary" disabled={running} onClick={iniciar}>
          {running ? "Corriendo…" : "🚀 Iniciar scraping"}
        </button>
      </div>

      {error && <p className="text-error text-sm mt-3">{error}</p>}

      {job && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-base-content/60 mb-1">
            <span>{FASE_LABEL[job.phase] ?? job.phase}</span>
            <span>
              {job.progress.current}/{job.progress.total}
            </span>
          </div>
          <div className="h-2 bg-base-300 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          {job.status === "error" && <p className="text-error text-sm mt-2">Error: {job.error}</p>}
        </div>
      )}
    </div>
  );
}
