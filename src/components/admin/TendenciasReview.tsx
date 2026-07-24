// src/components/admin/TendenciasReview.tsx
// Revisión/edición de una corrida de scraping + publicación a /tendencias.
import { useState } from "react";

type Career = {
  id: number;
  nombre_display: string;
  slug_busqueda: string;
  demanda: number;
  nivel: string;
  momentum_pct: number | null;
  estado: string;
  oportunidad: number;
};
type Intencion = { id: number; etiqueta_display: string; conteo: number; nota: string | null };
type Pregunta = { id: number; pregunta: string; respuesta: string | null; aprobada: boolean };

type Props = {
  run: { id: string; status: string; started_at: string };
  careers: Career[];
  intenciones: Intencion[];
  preguntas: Pregunta[];
  isPublished: boolean;
};

type SaveStatus = "guardando" | "ok" | "error" | undefined;

const NIVELES = ["Muy buscada", "Buscada", "Emergente"];

async function guardar(url: string, body: object): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return { ok: false, message: "No se pudo contactar al servidor." };
  }
}

export default function TendenciasReview({ run, careers, intenciones, preguntas, isPublished }: Props) {
  const [rows, setRows] = useState(careers);
  const [mods, setMods] = useState(intenciones);
  const [qs, setQs] = useState(preguntas);
  const [status, setStatus] = useState<Record<string, SaveStatus>>({});
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);

  function markStatus(key: string, value: SaveStatus) {
    setStatus((prev) => ({ ...prev, [key]: value }));
    if (value === "ok") {
      setTimeout(() => setStatus((prev) => ({ ...prev, [key]: undefined })), 1500);
    }
  }

  async function updateCareer(id: number, patch: Partial<Career>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    markStatus(`career-${id}`, "guardando");
    const res = await guardar("/api/admin/tendencias/careers/update", { id, ...patch });
    markStatus(`career-${id}`, res.ok ? "ok" : "error");
  }

  async function updateIntencion(id: number, patch: Partial<Intencion>) {
    setMods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    markStatus(`int-${id}`, "guardando");
    const res = await guardar("/api/admin/tendencias/intenciones/update", { id, ...patch });
    markStatus(`int-${id}`, res.ok ? "ok" : "error");
  }

  async function updatePregunta(id: number, patch: Partial<Pregunta>) {
    setQs((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    markStatus(`q-${id}`, "guardando");
    const res = await guardar("/api/admin/tendencias/preguntas/update", { id, ...patch });
    markStatus(`q-${id}`, res.ok ? "ok" : "error");
  }

  async function publicar() {
    setPublishing(true);
    setPublishMsg(null);
    const res = await guardar("/api/admin/tendencias/publish", { runId: run.id });
    setPublishing(false);
    setPublishMsg(res.ok ? "Publicado. /tendencias ya muestra esta corrida." : res.message ?? "Error al publicar.");
    if (res.ok) window.location.reload();
  }

  return (
    <div className="space-y-10">
      <section className="flex items-center justify-between flex-wrap gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-4">
        <div>
          <p className="text-sm">
            Corrida <span className="font-mono">{run.id.slice(0, 8)}</span> · {run.status}
            {isPublished && <span className="ml-2 text-primary font-semibold">PUBLICADA</span>}
          </p>
          <p className="text-xs text-base-content/60">{new Date(run.started_at).toLocaleString("es-CL")}</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          disabled={run.status !== "success" || isPublished || publishing}
          onClick={publicar}
        >
          {publishing ? "Publicando…" : isPublished ? "Ya publicada" : "Publicar esta corrida"}
        </button>
      </section>
      {publishMsg && <p className="text-sm">{publishMsg}</p>}

      <section>
        <h2 className="font-bold mb-3">Carreras ({rows.length})</h2>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Slug búsqueda</th>
                <th>Demanda</th>
                <th>Momentum</th>
                <th>Nivel</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td>
                    <input
                      className="input input-bordered input-xs w-40"
                      defaultValue={c.nombre_display}
                      onBlur={(e) => updateCareer(c.id, { nombre_display: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="input input-bordered input-xs w-40"
                      defaultValue={c.slug_busqueda}
                      onBlur={(e) => updateCareer(c.id, { slug_busqueda: e.target.value })}
                    />
                  </td>
                  <td>{c.demanda}/100</td>
                  <td>
                    {c.momentum_pct === null
                      ? "s/d"
                      : `${c.momentum_pct > 0 ? "+" : ""}${c.momentum_pct}% (${c.estado})`}
                  </td>
                  <td>
                    <select
                      className="select select-bordered select-xs"
                      value={c.nivel}
                      onChange={(e) => updateCareer(c.id, { nivel: e.target.value })}
                    >
                      {NIVELES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-xs text-base-content/50 whitespace-nowrap">
                    {status[`career-${c.id}`] === "guardando" && "Guardando…"}
                    {status[`career-${c.id}`] === "ok" && "✓"}
                    {status[`career-${c.id}`] === "error" && "Error"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-3">Intenciones ({mods.length})</h2>
        <div className="space-y-2">
          {mods.map((m) => (
            <div key={m.id} className="rounded-xl border border-base-300 p-3 flex flex-wrap gap-3 items-center">
              <input
                className="input input-bordered input-xs w-40"
                defaultValue={m.etiqueta_display}
                onBlur={(e) => updateIntencion(m.id, { etiqueta_display: e.target.value })}
              />
              <span className="text-xs text-base-content/50 whitespace-nowrap">{m.conteo} señales</span>
              <input
                className="input input-bordered input-xs flex-1 min-w-[200px]"
                defaultValue={m.nota ?? ""}
                placeholder="Nota (copy humano)"
                onBlur={(e) => updateIntencion(m.id, { nota: e.target.value })}
              />
              <span className="text-xs text-base-content/50 w-16">
                {status[`int-${m.id}`] === "guardando" && "Guardando…"}
                {status[`int-${m.id}`] === "ok" && "✓"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-3">Preguntas ({qs.length})</h2>
        <p className="text-xs text-base-content/60 mb-3">
          Solo las preguntas con respuesta Y aprobadas se muestran en /tendencias.
        </p>
        <div className="space-y-3">
          {qs.map((q) => (
            <div key={q.id} className="rounded-xl border border-base-300 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-medium text-sm">{q.pregunta}</p>
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={q.aprobada}
                    onChange={(e) => updatePregunta(q.id, { aprobada: e.target.checked })}
                  />
                  Aprobada
                </label>
              </div>
              <textarea
                className="textarea textarea-bordered textarea-sm w-full"
                rows={2}
                defaultValue={q.respuesta ?? ""}
                placeholder="Redacta la respuesta…"
                onBlur={(e) => updatePregunta(q.id, { respuesta: e.target.value })}
              />
              <span className="text-xs text-base-content/50">
                {status[`q-${q.id}`] === "guardando" && "Guardando…"}
                {status[`q-${q.id}`] === "ok" && "✓ Guardado"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
