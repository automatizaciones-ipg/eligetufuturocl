// src/components/CalculadoraNem.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Calculator, ChevronDown, Info, ArrowLeft, Search,
  Scale, Loader2, GraduationCap, MapPin, Building, X, CheckCircle2,
  AlertTriangle, Trash2, Landmark, XCircle
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { generarTipoInst, generarSiglaInstitucion } from "../utils/formatters";
import { enlaceCarrera } from "../utils/enlaces";
import { formatearTitulo, quitarAcentos, PALETA_COLORES, barajar } from "./BuscadorCarreras";

// ============================================================================
// TIPOS
// ============================================================================
interface InstitucionJoin {
  nombre: string;
  tipo: string;
  logo_url?: string;
}

// Columnas que HOY existen de verdad en Supabase (ver migracion_ponderaciones_carreras.sql,
// que todavía no se ha corrido en producción). jornada/sede/codigo_institucion
// se piden solo para cruzar con el JSON de ponderaciones — no se muestran en la UI.
interface CarreraSupabaseRaw {
  id: number;
  // OJO: codigo_carrera es `text` en Supabase (no numérico), y el SIES a veces
  // mete códigos basura duplicados ahí — la identidad única real es `id`
  // (bigint PK). codigo_carrera ya no se usa para el link (ver slug).
  codigo_carrera: string;
  slug: string;
  codigo_institucion: number | null;
  nombre_carrera: string;
  jornada: string | null;
  sede: string | null;
  region: string | null;
  arancel_anual: number | null;
  duracion_semestres: number | null;
  empleabilidad_1er_anio: number | null;
  acreditacion_carrera: string | null;
  instituciones: InstitucionJoin | InstitucionJoin[] | null;
}

// Ponderaciones oficiales SIES resueltas contra /data/ponderaciones_carreras.json
// (stopgap MIENTRAS no se corre la migración en Supabase — ver STOPGAP_PONDERACIONES
// más abajo). El día que la migración + backfill corran, estos mismos campos
// van a venir directo de Supabase y este cruce cliente-side se puede borrar.
interface PonderacionResuelta {
  requisito_ingreso: string | null;
  usa_demre: boolean | null;
  puntaje_corte_referencial: number | null;
  ponderacion_notas: number | null;
  ponderacion_ranking: number | null;
  ponderacion_lenguaje: number | null;
  ponderacion_matematica: number | null;
  ponderacion_matematica2: number | null;
  ponderacion_historia: number | null;
  ponderacion_ciencias: number | null;
  ponderacion_otros: number | null;
}

// Forma final que usan calcularPuntajePonderado/adaptarCarrera: la fila real
// de Supabase + su ponderación resuelta (por JSON hoy, por Supabase mañana).
type CarreraPonderadaDB = CarreraSupabaseRaw & PonderacionResuelta;

const SIN_PONDERACION: PonderacionResuelta = {
  requisito_ingreso: null,
  usa_demre: null,
  puntaje_corte_referencial: null,
  ponderacion_notas: null,
  ponderacion_ranking: null,
  ponderacion_lenguaje: null,
  ponderacion_matematica: null,
  ponderacion_matematica2: null,
  ponderacion_historia: null,
  ponderacion_ciencias: null,
  ponderacion_otros: null,
};

interface MapaPonderaciones {
  preciso: Record<string, PonderacionResuelta>;
  respaldo: Record<string, PonderacionResuelta>;
}

// Mismo criterio de limpieza que src/datos_et/backfill_ponderaciones.py
// (limpiar_texto) — tiene que dar EXACTO el mismo resultado o las claves no
// cruzan nunca.
function limpiarTextoMatch(valor: string | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  return valor
    .toUpperCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/'/g, "")
    .replace(/-/g, " ");
}

// STOPGAP: mientras `migracion_ponderaciones_carreras.sql` no se corra en
// producción, las ponderaciones no viven en Supabase — se resuelven acá
// contra un JSON estático generado desde el CSV oficial del SIES
// (src/datos_et/exportar_ponderaciones_json.py). Mismo match de 2 niveles
// (institución+carrera+jornada+sede, con respaldo institución+carrera) que
// usa el backfill real. Cuando la migración exista, borrar esta función y
// pedir las columnas directo a Supabase en CAMPOS_SIMULADOR.
function resolverPonderacion(item: CarreraSupabaseRaw, mapa: MapaPonderaciones | null): PonderacionResuelta {
  if (!mapa || item.codigo_institucion === null) return SIN_PONDERACION;
  const nombreClean = limpiarTextoMatch(item.nombre_carrera);
  const keyRespaldo = `${item.codigo_institucion}_${nombreClean}`;
  const keyPreciso = `${keyRespaldo}_${limpiarTextoMatch(item.jornada)}_${limpiarTextoMatch(item.sede)}`;
  return mapa.preciso[keyPreciso] ?? mapa.respaldo[keyRespaldo] ?? SIN_PONDERACION;
}

interface PuntajeCalculado {
  total: number;
  parcial: boolean;
  faltantes: string[];
  otrosPct: number;
  // true cuando NINGÚN componente tiene ponderación conocida (no matcheó con
  // el SIES) — distinto de "parcial" (matcheó, pero al usuario le falta
  // ingresar algún puntaje). No es lo mismo "no sabemos la fórmula" que
  // "sabemos la fórmula pero falta un dato tuyo".
  sinFormula: boolean;
}

interface CarreraSimuladorUI {
  id: number;
  codigoCarrera: string;
  slug: string;
  nombre: string;
  institucion: string;
  tipoInst: string;
  sigla: string;
  region: string;
  arancel: string;
  duracion: string;
  empleabilidad: string;
  acreditacion: string;
  requisitoIngreso: string | null;
  usaDemre: boolean | null;
  corteReferencial: number | null;
  logoUrl: string;
  color: string;
  puntaje: PuntajeCalculado;
  veredicto: Veredicto;              // v1: vs promedio de admitidos (SIES)
  veredictoCorte: VeredictoCorte | null;  // Parte 2: vs corte real (DEMRE)
}

interface PuntajesEntrada {
  nem: number;
  ranking: number;
  lenguaje?: number;
  matematica?: number;
  matematica2?: number;
  historia?: number;
  ciencias?: number;
}

// Referencia de ingreso del cohorte 2025 (promedios de matrícula oficiales
// SIES/MINEDUC), resuelta contra /data/referencia_ingreso.json. Join DIRECTO por
// codigo_carrera (a diferencia de las ponderaciones, que cruzan por texto).
// OJO: es un PROMEDIO de los admitidos, NO el corte / último seleccionado — por
// eso el veredicto v1 dice "sobre/bajo el promedio", nunca "no alcanzas" (el
// rojo "te faltan X pts" llega con el corte DEMRE, ver plan Parte 2).
interface ReferenciaIngreso {
  promedio_paes?: number;
  promedio_nem?: number;   // escala 1-7 (nota), comparable al promedio de media del alumno
  pct_paes?: string;
}
type MapaReferencia = Record<string, ReferenciaIngreso>;

// Veredicto "¿cómo te comparás con los admitidos 2025?" por carrera.
type EstadoVeredicto = "sobre" | "bajo" | "pendiente" | "sin_ref";
interface Veredicto {
  estado: EstadoVeredicto;
  metric: "paes" | "nem" | null;   // qué señal se comparó
  refValor: number | null;         // valor de referencia (promedio de admitidos)
  tuValor: number | null;          // tu valor comparable
  brecha: number | null;           // cuánto te falta para el promedio (>0), 0 si estás sobre
}

// Promedio simple de las PAES que el alumno realmente ingresó (las presentes en
// puntajesEntrada según los switches activos). null si no ingresó ninguna.
function promedioPaesAlumno(p: PuntajesEntrada): number | null {
  const vals = [p.lenguaje, p.matematica, p.matematica2, p.historia, p.ciencias]
    .filter((v): v is number => typeof v === "number" && v > 0);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

// Compara al alumno con la referencia de admitidos. Prefiere PAES (más
// discriminante); si no hay PAES comparable, cae a NEM (nota 1-7). Nunca marca
// "no alcanzas" — es un promedio, no un corte (ver ReferenciaIngreso).
function computarVeredicto(
  ref: ReferenciaIngreso | undefined,
  tuPaes: number | null,
  promedioMedia: number,
): Veredicto {
  if (!ref) return { estado: "sin_ref", metric: null, refValor: null, tuValor: null, brecha: null };

  if (tuPaes !== null && typeof ref.promedio_paes === "number") {
    const brecha = Math.round((ref.promedio_paes - tuPaes) * 10) / 10;
    return { estado: brecha <= 0 ? "sobre" : "bajo", metric: "paes", refValor: ref.promedio_paes, tuValor: tuPaes, brecha: brecha > 0 ? brecha : 0 };
  }
  if (promedioMedia > 0 && typeof ref.promedio_nem === "number") {
    const brecha = Math.round((ref.promedio_nem - promedioMedia) * 100) / 100;
    return { estado: brecha <= 0 ? "sobre" : "bajo", metric: "nem", refValor: ref.promedio_nem, tuValor: promedioMedia, brecha: brecha > 0 ? brecha : 0 };
  }
  // Hay referencia, pero el alumno aún no ingresó un dato comparable.
  return { estado: "pendiente", metric: null, refValor: ref.promedio_paes ?? ref.promedio_nem ?? null, tuValor: null, brecha: null };
}

// ============================================================================
// CORTE DEMRE (último seleccionado ponderado) — Parte 2
// ============================================================================
// A diferencia de la referencia SIES (que es un PROMEDIO), el corte es el
// puntaje del ÚLTIMO seleccionado del cohorte = el mínimo ponderado con que se
// entró. Por eso acá SÍ corresponde el veredicto duro "te alcanza / no alcanza,
// te faltan X pts" en rojo. Se resuelve contra /data/cortes_carreras.json con
// el MISMO match difuso de 2 niveles que las ponderaciones (institución +
// carrera [+ jornada + sede]), porque el dato DEMRE se cruza por texto.
// Años que trackeamos para el histórico (del más viejo al más nuevo).
const ANIOS_CORTE = [2024, 2025, 2026] as const;

interface CorteCarrera {
  corte_2024?: number | null;
  corte_2025?: number | null;
  corte_2026?: number | null;
}
interface MapaCortes {
  preciso: Record<string, CorteCarrera>;
  respaldo: Record<string, CorteCarrera>;
}

// Veredicto duro contra el corte real (rojo/verde). null cuando no hay corte
// para la carrera o el alumno todavía no tiene un ponderado calculable.
interface VeredictoCorte {
  alcanza: boolean;
  anioReciente: number;
  corteReciente: number;
  faltan: number;   // >0 si no alcanza el corte más reciente
  parcial: boolean; // el ponderado del alumno aún está incompleto (faltan puntajes)
  historico: { anio: number; corte: number; alcanza: boolean }[];
}

function resolverCorte(item: CarreraSupabaseRaw, mapa: MapaCortes | null): CorteCarrera | null {
  if (!mapa || item.codigo_institucion === null) return null;
  const nombreClean = limpiarTextoMatch(item.nombre_carrera);
  const keyRespaldo = `${item.codigo_institucion}_${nombreClean}`;
  const keyPreciso = `${keyRespaldo}_${limpiarTextoMatch(item.jornada)}_${limpiarTextoMatch(item.sede)}`;
  return mapa.preciso[keyPreciso] ?? mapa.respaldo[keyRespaldo] ?? null;
}

// Compara el ponderado del alumno contra el corte real por año.
function computarVeredictoCorte(
  corte: CorteCarrera | null,
  puntaje: PuntajeCalculado,
): VeredictoCorte | null {
  if (!corte || puntaje.sinFormula || puntaje.total <= 0) return null;
  const historico: { anio: number; corte: number; alcanza: boolean }[] = [];
  for (const anio of ANIOS_CORTE) {
    const c = corte[`corte_${anio}` as keyof CorteCarrera];
    if (typeof c === "number") {
      historico.push({ anio, corte: c, alcanza: puntaje.total >= c });
    }
  }
  if (historico.length === 0) return null;
  const reciente = historico[historico.length - 1];
  return {
    alcanza: reciente.alcanza,
    anioReciente: reciente.anio,
    corteReciente: reciente.corte,
    faltan: reciente.alcanza ? 0 : Math.round(reciente.corte - puntaje.total),
    parcial: puntaje.parcial,
    historico,
  };
}

// ============================================================================
// FÓRMULA DE PUNTAJE PONDERADO (usa la ponderación REAL de cada carrera, SIES)
// ============================================================================
function calcularPuntajePonderado(
  carrera: CarreraPonderadaDB,
  puntajes: PuntajesEntrada
): PuntajeCalculado {
  const componentes: { peso: number | null; valor: number | undefined; nombre: string }[] = [
    { peso: carrera.ponderacion_notas, valor: puntajes.nem, nombre: "NEM" },
    { peso: carrera.ponderacion_ranking, valor: puntajes.ranking, nombre: "Ranking" },
    { peso: carrera.ponderacion_lenguaje, valor: puntajes.lenguaje, nombre: "Comp. Lectora" },
    { peso: carrera.ponderacion_matematica, valor: puntajes.matematica, nombre: "Matemática 1" },
    { peso: carrera.ponderacion_matematica2, valor: puntajes.matematica2, nombre: "Matemática 2" },
    { peso: carrera.ponderacion_historia, valor: puntajes.historia, nombre: "Historia" },
    { peso: carrera.ponderacion_ciencias, valor: puntajes.ciencias, nombre: "Ciencias" },
  ];

  const sinFormula = componentes.every(c => !c.peso);

  let total = 0;
  let parcial = false;
  const faltantes: string[] = [];

  for (const c of componentes) {
    if (!c.peso) continue; // esta carrera no pondera este componente
    if (c.valor === undefined || c.valor <= 0) {
      parcial = true;
      faltantes.push(c.nombre);
      continue;
    }
    total += (c.peso / 100) * c.valor;
  }

  return { total: Math.round(total), parcial, faltantes, otrosPct: carrera.ponderacion_otros || 0, sinFormula };
}

// Adapta una fila de Supabase a la UI del simulador. `referencia` y
// `promedioMedia` alimentan el veredicto "¿cómo te comparás con los admitidos?".
function adaptarCarrera(
  item: CarreraPonderadaDB,
  puntajes: PuntajesEntrada,
  index: number,
  referencia?: ReferenciaIngreso,
  promedioMedia: number = 0,
  corte?: CorteCarrera | null,
): CarreraSimuladorUI {
  const puntajeCalc = calcularPuntajePonderado(item, puntajes);
  const instObj = Array.isArray(item.instituciones) ? item.instituciones[0] : item.instituciones;
  const instNombre = instObj?.nombre || "Institución Desconocida";
  const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(instNombre)}&background=f4f5f9&color=6544ff&bold=true&size=128`;
  let logoUrl = "";
  const rawLogo = instObj?.logo_url;
  if (rawLogo) {
    if (rawLogo.startsWith("http")) {
      logoUrl = rawLogo;
    } else {
      // @ts-ignore - import.meta.env es provisto por Astro
      const baseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      logoUrl = baseUrl ? `${baseUrl}/storage/v1/object/public/logos_instituciones/${rawLogo}` : "";
    }
  }

  return {
    id: item.id,
    codigoCarrera: item.codigo_carrera,
    slug: item.slug,
    nombre: formatearTitulo(item.nombre_carrera),
    institucion: formatearTitulo(instNombre),
    tipoInst: generarTipoInst(instObj?.tipo || null),
    sigla: generarSiglaInstitucion(instNombre),
    region: item.region || "No informada",
    arancel: item.arancel_anual ? `$${item.arancel_anual.toLocaleString('es-CL')}` : "No informado",
    duracion: item.duracion_semestres ? `${item.duracion_semestres} Semestres` : "No informada",
    // La BD guarda empleabilidad como fracción (0.898...) — misma convención
    // de formato que formatoPorcentaje en CarreraDetalle.tsx.
    empleabilidad: item.empleabilidad_1er_anio ? `${(item.empleabilidad_1er_anio * 100).toFixed(1)}%` : "No informada",
    acreditacion: item.acreditacion_carrera || "No informada",
    requisitoIngreso: item.requisito_ingreso,
    usaDemre: item.usa_demre,
    corteReferencial: item.puntaje_corte_referencial,
    logoUrl: logoUrl || fallbackLogo,
    color: PALETA_COLORES[index % PALETA_COLORES.length],
    puntaje: puntajeCalc,
    veredicto: computarVeredicto(referencia, promedioPaesAlumno(puntajes), promedioMedia),
    veredictoCorte: computarVeredictoCorte(corte ?? null, puntajeCalc),
  };
}

// STOPGAP: solo columnas que YA existen en Supabase hoy. codigo_institucion/
// jornada/sede se piden únicamente para cruzar con el JSON de ponderaciones
// (resolverPonderacion) — no se muestran en la UI. Cuando exista la migración,
// sumar acá requisito_ingreso/usa_demre/puntaje_corte_referencial/ponderacion_*
// y borrar el cruce por JSON.
const CAMPOS_SIMULADOR = `
  id, codigo_carrera, slug, codigo_institucion, nombre_carrera, jornada, sede,
  region, arancel_anual, duracion_semestres,
  empleabilidad_1er_anio, acreditacion_carrera,
  instituciones!inner (nombre, tipo, logo_url)
`;

const RESULTADOS_INICIALES = 9;
const RESULTADOS_INCREMENTO = 9;
// Paginación de resultados: siempre se muestran 9 tarjetas por página (en vez
// de acumular hacia abajo con "Cargar más"). `limite` sigue siendo el tamaño
// de la ventana cruda que se trae de Supabase; la página visible es un slice
// cliente-side de la lista ya filtrada/ordenada.
const RESULTADOS_POR_PAGINA = 9;
// Apenas el usuario tiene un NEM calculable, el orden por puntaje deja de ser
// "reordenar los mismos 9 alfabéticos" y pasa a traer un universo más
// representativo (ej. todas las variantes de "Enfermería" que matcheen el
// filtro activo) para que el reordenamiento instantáneo tenga sentido real.
const RESULTADOS_MINIMO_ORDENADO = 30;

// Números de página a mostrar en la barra de paginación: primera, última y
// una ventana alrededor de la actual, con "..." donde se salta un tramo.
function rangoPaginas(actual: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const nums = new Set<number>([1, total, actual - 1, actual, actual + 1]);
  const orden = [...nums].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const salida: (number | "...")[] = [];
  let previo = 0;
  for (const n of orden) {
    if (previo && n - previo > 1) salida.push("...");
    salida.push(n);
    previo = n;
  }
  return salida;
}

// Extrae el número de un string ya formateado para la UI ("$1.234.567",
// "85%", "10 Semestres") — usado por el comparador para destacar el mejor
// valor de cada fila. "No informado"/"No informada" → null (no comparable).
function numeroDe(txt: string): number | null {
  const digitos = txt.replace(/\D/g, "");
  return digitos ? Number(digitos) : null;
}

// Estado de los 5 puntajes PAES (strings tal cual los tipea el usuario).
type PaesState = { lenguaje: string; matematica: string; matematica2: string; historia: string; ciencias: string };
type PaesKey = keyof PaesState;

// Sección opcional de puntajes PAES con switch on/off. Definida a nivel de
// módulo (no dentro del componente) para que su identidad sea estable y React
// no la remonte en cada render — si no, los inputs perderían el foco al tipear.
function SeccionPaes({
  numero, titulo, subtitulo, activo, onToggle, campos, paes, onInput,
}: {
  numero: number;
  titulo: string;
  subtitulo: string;
  activo: boolean;
  onToggle: () => void;
  campos: { id: PaesKey; label: string }[];
  paes: PaesState;
  onInput: (e: React.ChangeEvent<HTMLInputElement>, key: PaesKey) => void;
}) {
  return (
    <section className={`bg-white rounded-[2rem] shadow-sm border overflow-hidden transition-colors ${activo ? 'border-[#6544FF]/30' : 'border-gray-100'}`}>
      <div className="p-6 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg transition-colors ${activo ? 'bg-[#6544FF] text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>{numero}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl md:text-2xl font-bold text-[#1A1528]">{titulo}</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Opcional</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{subtitulo}</p>
        </div>
        {/* Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          aria-label={`Activar ${titulo}`}
          onClick={onToggle}
          className={`relative w-12 h-7 rounded-full shrink-0 mt-1 transition-colors cursor-pointer ${activo ? 'bg-[#6544FF]' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${activo ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {activo && (
        <div className="px-6 pb-6 border-t border-gray-100 bg-[#fafafa]/50">
          <p className="text-xs text-gray-400 my-4">
            Ingresa solo los puntajes que ya tengas (100 a 1000 pts). Los que dejes vacíos se marcan como pendientes.
          </p>
          <div className={`grid grid-cols-2 ${campos.length > 2 ? 'md:grid-cols-3' : ''} gap-4`}>
            {campos.map((p) => (
              <div key={p.id} className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 ml-1">{p.label}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={paes[p.id]}
                  onChange={(e) => onInput(e, p.id)}
                  placeholder="Ej: 650"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-[#1A1528] focus:outline-none focus:ring-2 focus:ring-[#6544FF]/50 placeholder:font-normal placeholder:text-gray-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// Badge "¿cómo te comparás con los admitidos 2025?" que va en cada tarjeta.
// v1 (base SIES): compara contra el PROMEDIO de matrícula, así que usa verde
// (sobre) / ámbar (bajo) — NUNCA rojo "no alcanzas", porque un promedio no es
// un corte. El rojo llega en la Parte 2 con el corte real DEMRE.
function VeredictoBadge({ v }: { v: Veredicto }) {
  if (v.estado === "sin_ref") {
    return (
      <p className="text-[11px] text-gray-400 font-medium mb-4 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0" />
        Sin referencia de ingreso 2025 para esta carrera.
      </p>
    );
  }

  const esPaes = v.metric === "paes";
  // "promedio de notas" (no "NEM") para el metric de nota: evita confundir con
  // el "Puntaje NEM" 100-1000 que muestra el panel de resultados de arriba.
  const queMetrica = esPaes ? "promedio PAES" : "promedio de notas";
  const fmtRef = esPaes ? v.refValor?.toFixed(0) : v.refValor?.toFixed(1);
  const fmtTu = esPaes ? v.tuValor?.toFixed(0) : v.tuValor?.toFixed(1);

  if (v.estado === "pendiente") {
    return (
      <div className="rounded-xl px-3 py-2.5 mb-4 bg-slate-50 border border-slate-200">
        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          Admitidos 2025 · {queMetrica} {fmtRef}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">Ingresa tus puntajes arriba para compararte.</p>
      </div>
    );
  }

  if (v.estado === "sobre") {
    return (
      <div className="rounded-xl px-3 py-2.5 mb-4 bg-emerald-50 border border-emerald-200">
        <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Sobre el promedio de admitidos
        </p>
        <p className="text-[10px] text-emerald-600/90 mt-0.5">
          Tu {queMetrica} {fmtTu} · admitidos 2025 {fmtRef}
        </p>
      </div>
    );
  }

  // estado "bajo"
  const brechaTxt = esPaes ? `${v.brecha?.toFixed(0)} pts` : `${v.brecha?.toFixed(1)} de nota`;
  return (
    <div className="rounded-xl px-3 py-2.5 mb-4 bg-amber-50 border border-amber-200">
      <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Bajo el promedio de admitidos
      </p>
      <p className="text-[10px] text-amber-600/90 mt-0.5">
        Te faltan {brechaTxt} · tu {queMetrica} {fmtTu} vs {fmtRef}
      </p>
    </div>
  );
}

// Veredicto DURO contra el corte real DEMRE (Parte 2): rojo si no alcanzas el
// último seleccionado, verde si sí, + histórico por año coloreado. Se muestra
// en vez del badge de promedio cuando hay corte para la carrera.
function VeredictoCorteBadge({ v, tuPuntaje }: { v: VeredictoCorte; tuPuntaje: number }) {
  const alcanza = v.alcanza;
  return (
    <div className={`rounded-xl px-3 py-3 mb-4 border ${alcanza ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
      <div className="flex items-start gap-1.5">
        {alcanza
          ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          : <XCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
        <div className="min-w-0">
          <p className={`text-xs font-bold ${alcanza ? "text-emerald-700" : "text-rose-700"}`}>
            {alcanza ? "Te alcanza" : `No alcanzas — te faltan ${v.faltan} pts`}
          </p>
          <p className={`text-[10px] mt-0.5 ${alcanza ? "text-emerald-600/90" : "text-rose-600/90"}`}>
            Tu {tuPuntaje} vs último seleccionado {v.corteReciente} (Adm. {v.anioReciente}){v.parcial ? " · estimado, faltan puntajes" : ""}
          </p>
        </div>
      </div>
      {/* Histórico de cortes por año, coloreado según si tu puntaje alcanzaba */}
      <div className="grid grid-cols-3 gap-1.5 mt-2.5">
        {v.historico.map((h) => (
          <div key={h.anio} className={`rounded-lg text-center py-1 border-t-2 ${h.alcanza ? "border-emerald-400 bg-emerald-50/60" : "border-rose-400 bg-rose-50/60"}`}>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Adm. {h.anio}</div>
            <div className={`text-xs font-black ${h.alcanza ? "text-emerald-700" : "text-rose-700"}`}>{h.corte}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalculadoraNem() {
  // --- NOTAS / NEM / RANKING (existente) ---
  const [notas, setNotas] = useState({ n1: "", n2: "", n3: "", n4: "" });
  const [resultados, setResultados] = useState({ promedio: 0, nem: 0, ranking: 0 });

  // --- PAES (opcional, dos secciones con switch independiente) ---
  // Sección 2: pruebas obligatorias del sistema (Comp. Lectora + Matemática 1).
  // Sección 3: pruebas electivas (Matemática 2 + Historia + Ciencias).
  const [paesObligatoriasActivo, setPaesObligatoriasActivo] = useState(false);
  const [paesElectivasActivo, setPaesElectivasActivo] = useState(false);
  const [paes, setPaes] = useState({ lenguaje: "", matematica: "", matematica2: "", historia: "", ciencias: "" });

  // --- BUSCADOR DE CARRERAS ---
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [regionFiltro, setRegionFiltro] = useState("todas");
  const [listaRegiones, setListaRegiones] = useState<string[]>([]);
  const [dropdownRegionAbierto, setDropdownRegionAbierto] = useState(false);
  const [limite, setLimite] = useState(RESULTADOS_INICIALES);
  // Página visible (1-based). Cambiar de búsqueda/filtro siempre vuelve a la 1.
  const [pagina, setPagina] = useState(1);
  // Filtro por cohorte: muestra solo carreras donde el alumno está SOBRE el
  // promedio de admitidos 2025 (veredicto === "sobre"). Se aplica cliente-side
  // sobre la lista ya adaptada; la auto-carga de abajo rellena si queda corta.
  const [soloAlcanzo, setSoloAlcanzo] = useState(false);
  // Filtro "solo carreras con corte real": la búsqueda normal trae ~limite
  // carreras por nombre y las universidades con corte (pocas) pueden no
  // surfacear. Este toggle consulta Supabase restringido a las instituciones
  // que SÍ tienen corte, para que sus veredictos rojo/verde se vean.
  const [soloConCorte, setSoloConCorte] = useState(false);
  // Datos crudos de Supabase para la búsqueda/página actual (solo cambian por
  // búsqueda/filtro/paginación, NUNCA por notas o PAES — el puntaje se calcula
  // 100% en el cliente para que se sienta instantáneo mientras escribes).
  const [rawCarreras, setRawCarreras] = useState<CarreraSupabaseRaw[]>([]);
  // Cache acumulada por id: mantiene vivas (recalculables) las carreras que el
  // usuario ya agregó al comparador aunque cambie de búsqueda después.
  const [rawPorId, setRawPorId] = useState<Map<number, CarreraSupabaseRaw>>(new Map());
  const [totalResultados, setTotalResultados] = useState(0);
  // Parte en true: la primera consulta SIEMPRE corre al montar, y así el HTML
  // estático (SSR/pre-hidratación) muestra el spinner en vez de un "No
  // encontramos carreras" falso mientras llegan los primeros datos.
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  // IDs de las carreras IPG/U. Autónoma priorizadas por MODO EXPLORAR (ver
  // buscarCarreras). Muchas de estas no matchean con el JSON de ponderaciones
  // (quedan "sin fórmula") — sin este set se filtrarían igual que cualquier
  // otra carrera sin fórmula y la regla de negocio "IPG/UA siempre primero"
  // nunca se cumpliría en la práctica.
  const [prioridadIds, setPrioridadIds] = useState<Set<number>>(new Set());
  // STOPGAP: JSON de ponderaciones SIES (ver arriba). null mientras carga o
  // si no está disponible — resolverPonderacion degrada a "sin fórmula".
  const [ponderacionesMapa, setPonderacionesMapa] = useState<MapaPonderaciones | null>(null);
  // Referencia de ingreso 2025 (promedios de matrícula SIES), keyed por
  // codigo_carrera. null mientras carga o si falla — el veredicto degrada a
  // "sin referencia".
  const [referenciaMapa, setReferenciaMapa] = useState<MapaReferencia | null>(null);
  // Cortes DEMRE (último seleccionado ponderado por año), match difuso
  // institución+carrera. null mientras carga o si no existe el JSON todavía —
  // el veredicto de corte degrada y cae al de promedio SIES.
  const [cortesMapa, setCortesMapa] = useState<MapaCortes | null>(null);

  // --- COMPARADOR (máx. 3, guarda solo el id — el resto se recalcula en vivo) ---
  const [comparandoIds, setComparandoIds] = useState<number[]>([]);

  const parseNota = (val: string) => {
    const num = parseFloat(val.replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  // Un puntaje PAES real siempre está en [100, 1000]. Mientras el usuario está
  // a mitad de tipear (ej. "6" de "650") NO hay que aceptarlo como válido ni
  // "clampearlo" a 100 — eso mostraría un puntaje ponderado falso a medio
  // escribir. Se trata como pendiente hasta que el número completo caiga en rango.
  const parsePuntajePaes = (val: string): number | undefined => {
    const num = parseFloat(val.replace(",", "."));
    if (isNaN(num) || num < 100 || num > 1000) return undefined;
    return Math.round(num);
  };

  useEffect(() => {
    const n1 = parseNota(notas.n1);
    const n2 = parseNota(notas.n2);
    const n3 = parseNota(notas.n3);
    const n4 = parseNota(notas.n4);

    const promediosValidos = [n1, n2, n3, n4].filter(n => n >= 1 && n <= 7);

    if (promediosValidos.length > 0) {
      const suma = promediosValidos.reduce((a, b) => a + b, 0);
      const promedioExacto = Math.floor((suma / promediosValidos.length) * 100) / 100;

      let puntajeNem = 0;
      if (promedioExacto >= 4.0) {
        puntajeNem = Math.round((promedioExacto - 4.0) * 300 + 100);
      }
      puntajeNem = Math.min(Math.max(puntajeNem, 0), 1000);

      // Sin datos históricos del colegio para simular el bono de Ranking,
      // se usa el NEM como piso real (así es como parte del puntaje Ranking
      // funciona en la práctica cuando no hay antecedentes de curso/colegio).
      const puntajeRanking = puntajeNem;

      setResultados({
        promedio: promedioExacto,
        nem: puntajeNem,
        ranking: puntajeRanking
      });
    } else {
      setResultados({ promedio: 0, nem: 0, ranking: 0 });
    }
  }, [notas]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const val = e.target.value;
    if (/^(\d*[.,]?\d{0,1})$/.test(val) || val === "") {
      setNotas(prev => ({ ...prev, [key]: val }));
    }
  };

  const handlePaesInput = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof paes) => {
    const val = e.target.value;
    if (/^\d{0,4}$/.test(val)) {
      setPaes(prev => ({ ...prev, [key]: val }));
    }
  };

  // Memoizado por valores primitivos: solo cambia cuando un puntaje realmente
  // cambia, así el recálculo (instantáneo, sin red) no se dispara de más.
  const puntajesEntrada: PuntajesEntrada = useMemo(() => ({
    nem: resultados.nem,
    ranking: resultados.ranking,
    lenguaje: paesObligatoriasActivo ? parsePuntajePaes(paes.lenguaje) : undefined,
    matematica: paesObligatoriasActivo ? parsePuntajePaes(paes.matematica) : undefined,
    matematica2: paesElectivasActivo ? parsePuntajePaes(paes.matematica2) : undefined,
    historia: paesElectivasActivo ? parsePuntajePaes(paes.historia) : undefined,
    ciencias: paesElectivasActivo ? parsePuntajePaes(paes.ciencias) : undefined,
  }), [
    resultados.nem, resultados.ranking, paesObligatoriasActivo, paesElectivasActivo,
    paes.lenguaje, paes.matematica, paes.matematica2, paes.historia, paes.ciencias,
  ]);

  // Apenas el usuario termina de ingresar sus 4 notas (nem calculable por
  // primera vez), traemos un universo más grande que los 9 iniciales — si no,
  // "ordenar por tu puntaje" solo reordena los mismos 9 nombres alfabéticos
  // de siempre, que no es lo que el alumno espera al ver "cambiar la lista".
  const tieneNem = puntajesEntrada.nem > 0;
  useEffect(() => {
    if (tieneNem) {
      setLimite(l => Math.max(l, RESULTADOS_MINIMO_ORDENADO));
    }
  }, [tieneNem]);

  // Carga inicial de regiones disponibles
  useEffect(() => {
    const cargarRegiones = async () => {
      const { data } = await supabase.from('carreras').select('region').not('region', 'is', null);
      if (data) {
        setListaRegiones(Array.from(new Set(data.map(r => r.region))).sort() as string[]);
      }
    };
    cargarRegiones();
  }, []);

  // STOPGAP: carga UNA vez el JSON estático de ponderaciones (generado desde
  // el CSV oficial del SIES, ver src/datos_et/exportar_ponderaciones_json.py)
  // mientras Supabase no tenga las columnas reales. Es un asset público
  // cacheable por el navegador, no bloquea el resto de la calculadora si
  // tarda o falla — sin él, las carreras igual cargan, solo sin puntaje.
  useEffect(() => {
    let cancelado = false;
    fetch('/data/ponderaciones_carreras.json')
      .then(r => (r.ok ? r.json() : null))
      .then((mapa: MapaPonderaciones | null) => {
        if (!cancelado && mapa) setPonderacionesMapa(mapa);
      })
      .catch(() => {
        // Sin JSON, todas las carreras quedan "sin fórmula" — degrada con
        // gracia, no es un error fatal del simulador.
      });
    return () => { cancelado = true; };
  }, []);

  // Carga UNA vez la referencia de ingreso 2025 (promedios de matrícula SIES,
  // ver src/datos_et/exportar_referencia_ingreso_json.py). Keyed por
  // codigo_carrera → lookup directo. No bloqueante; si falla, el veredicto
  // degrada a "sin referencia".
  useEffect(() => {
    let cancelado = false;
    fetch('/data/referencia_ingreso.json')
      .then(r => (r.ok ? r.json() : null))
      .then((mapa: MapaReferencia | null) => {
        if (!cancelado && mapa) setReferenciaMapa(mapa);
      })
      .catch(() => { /* sin referencia — degrada con gracia */ });
    return () => { cancelado = true; };
  }, []);

  // Carga UNA vez los cortes DEMRE (último seleccionado por año). El JSON puede
  // no existir todavía (Parte 2 aún sin poblar) → 404 → degrada al veredicto de
  // promedio SIES. Ver src/datos_et/exportar_cortes_json.py.
  useEffect(() => {
    let cancelado = false;
    fetch('/data/cortes_carreras.json')
      .then(r => (r.ok ? r.json() : null))
      .then((mapa: MapaCortes | null) => {
        if (!cancelado && mapa) setCortesMapa(mapa);
      })
      .catch(() => { /* sin cortes — usa el veredicto de promedio */ });
    return () => { cancelado = true; };
  }, []);

  // Códigos de institución que tienen AL MENOS un corte (derivados del JSON de
  // cortes). Alimenta el toggle "solo con corte" para restringir la consulta.
  const institucionesConCorte = useMemo(() => {
    const set = new Set<number>();
    if (cortesMapa) {
      for (const key of [...Object.keys(cortesMapa.preciso), ...Object.keys(cortesMapa.respaldo)]) {
        const cod = Number(key.split("_")[0]);
        if (!Number.isNaN(cod)) set.add(cod);
      }
    }
    return set;
  }, [cortesMapa]);

  // Solo consulta Supabase por búsqueda/filtro/región/paginación — las notas y
  // los puntajes PAES NUNCA disparan una consulta nueva, se recalculan en el
  // cliente (ver `carreras` más abajo) para que la respuesta sea instantánea.
  const buscarCarrerasSeq = useRef(0);
  // Última ventana (`limite`) cuyo fetch YA terminó. Permite distinguir "los
  // datos en pantalla corresponden al limite actual" de "hay un fetch en
  // camino por un limite recién subido" (ver ventanaCompleta más abajo).
  const limiteFetcheado = useRef(0);
  const buscarCarreras = useCallback(async () => {
    // Esta callback se recrea cuando cambia cualquiera de sus dependencias, y
    // el efecto de más abajo dispara una corrida nueva por cada cambio. Sin
    // esta guarda, una corrida vieja que termina DESPUÉS que una más nueva
    // podría pisar el resultado correcto con uno obsoleto.
    const miSeq = ++buscarCarrerasSeq.current;
    const esVigente = () => miSeq === buscarCarrerasSeq.current;
    setCargando(true);
    setErrorCarga(false);
    try {
      // MODO EXPLORAR: sin búsqueda/filtros activos y sin NEM calculado aún
      // (el alumno no ha ingresado notas) → mostramos siempre carreras de IPG
      // y U. Autónoma primero (regla de negocio, mismo criterio que el modo
      // explorar de BuscadorCarreras), variando cuáles en cada carga. Apenas
      // hay NEM real, esto se apaga solo y pasa a mandar el puntaje ponderado
      // real (ver `carreras` más abajo).
      const modoExplorar =
        busqueda.trim().length < 3 && tipoFiltro === "Todos" && regionFiltro === "todas" && !tieneNem && !soloConCorte;

      if (modoExplorar) {
        const { count } = await supabase
          .from('carreras')
          .select('id', { count: 'exact', head: true });
        const total = count || 0;
        setTotalResultados(total);

        const vistos = new Set<number>();
        const acumulado: CarreraSupabaseRaw[] = [];
        const prioridad = new Set<number>();

        const [{ data: ipg }, { data: ua }] = await Promise.all([
          supabase.from('carreras').select(CAMPOS_SIMULADOR).ilike('instituciones.nombre', '%ipg%').limit(30),
          supabase.from('carreras').select(CAMPOS_SIMULADOR).ilike('instituciones.nombre', '%aut_noma%').limit(30),
        ]);
        const muestra = (arr: unknown[] | null, n: number) =>
          barajar((arr || []) as CarreraSupabaseRaw[]).slice(0, n);
        for (const it of [...muestra(ipg, 3), ...muestra(ua, 3)]) {
          if (it && !vistos.has(it.id)) { vistos.add(it.id); acumulado.push(it); prioridad.add(it.id); }
        }
        setPrioridadIds(prioridad);

        // Relleno general: solo ~32-64% de las carreras matchea con el JSON
        // de ponderaciones (queda "sin fórmula" y el useMemo de más abajo la
        // esconde), así que se trae bastante más que `limite` en bruto —
        // el efecto de auto-carga de más abajo (con tope duro) cubre el resto
        // si aun así no alcanza.
        if (acumulado.length < limite) {
          const rango = limite * 4;
          const maxOffset = Math.max(0, total - rango);
          const offset = Math.floor(Math.random() * (maxOffset + 1));
          const { data: generales } = await supabase
            .from('carreras')
            .select(CAMPOS_SIMULADOR)
            .order('id')
            .range(offset, offset + rango - 1);
          for (const it of barajar((generales || []) as CarreraSupabaseRaw[])) {
            if (!vistos.has(it.id)) { vistos.add(it.id); acumulado.push(it); }
          }
        }

        if (!esVigente()) return;
        setRawCarreras(acumulado);
        setRawPorId(prev => {
          const next = new Map(prev);
          acumulado.forEach(f => next.set(f.id, f));
          return next;
        });
        return;
      }

      // Fuera de modo explorar (búsqueda activa, filtro/región activos, o ya
      // hay NEM real) no corresponde priorizar IPG/UA — se apaga solo.
      setPrioridadIds(new Set());

      // STOPGAP: no se filtra por ponderación acá (esas columnas no existen
      // en Supabase todavía) — se trae la carrera igual y se resuelve su
      // ponderación después contra el JSON (puede quedar "sin fórmula").
      let query = supabase
        .from('carreras')
        .select(CAMPOS_SIMULADOR, { count: 'exact' });

      if (busqueda.length >= 3) {
        query = query.ilike('nombre_carrera', `%${quitarAcentos(busqueda)}%`);
      }
      if (tipoFiltro !== "Todos") {
        const tipoBD = tipoFiltro === "U" ? "Universidades" : tipoFiltro === "IP" ? "Institutos Profesionales" : "Centros de Formación Técnica";
        query = query.eq('instituciones.tipo', tipoBD);
      }
      if (regionFiltro !== "todas") {
        query = query.eq('region', regionFiltro);
      }
      // "Solo con corte": restringe a las instituciones que tienen corte, para
      // que sus carreras (pocas) surfaceen en vez de perderse en el tope.
      if (soloConCorte && institucionesConCorte.size > 0) {
        query = query.in('codigo_institucion', Array.from(institucionesConCorte));
      }

      const { data, count, error } = await query
        .order('nombre_carrera', { ascending: true })
        .range(0, limite - 1);

      if (error) throw error;
      if (!esVigente()) return;
      if (count !== null) setTotalResultados(count);
      if (data) {
        const filas = data as unknown as CarreraSupabaseRaw[];
        setRawCarreras(filas);
        setRawPorId(prev => {
          const next = new Map(prev);
          filas.forEach(f => next.set(f.id, f));
          return next;
        });
      }
    } catch (err) {
      if (!esVigente()) return;
      console.error("Error consultando carreras del simulador:", err);
      setErrorCarga(true);
      setRawCarreras([]);
    } finally {
      if (esVigente()) {
        setCargando(false);
        limiteFetcheado.current = limite;
      }
    }
  }, [busqueda, tipoFiltro, regionFiltro, limite, tieneNem, soloConCorte, institucionesConCorte]);

  useEffect(() => {
    const timeoutId = setTimeout(() => { buscarCarreras(); }, 300);
    return () => clearTimeout(timeoutId);
  }, [buscarCarreras]);

  // Modo búsqueda = el usuario está buscando por nombre (mismo umbral que
  // dispara el ilike en buscarCarreras). Navegando por filtros (Todos/U/IP/CFT)
  // sin texto, solo tiene sentido mostrar carreras donde SÍ podemos calcular
  // un puntaje real — buscando por nombre, se muestran todas (el alumno
  // quiere ver el catálogo completo de esa carrera, tenga fórmula o no).
  const modoBusqueda = busqueda.trim().length >= 3;

  // Lista mostrada: recalcula el puntaje ponderado de cada carrera al vuelo
  // apenas cambian notas/PAES (sin red), filtra "sin fórmula" fuera del modo
  // búsqueda, y ordena por mejor puntaje una vez que el usuario ya tiene un
  // NEM calculado — para que las carreras donde le conviene más aparezcan
  // primero, no solo alfabéticamente.
  const carreras = useMemo(() => {
    const adaptadas = rawCarreras.map((item, i) =>
      adaptarCarrera(
        { ...item, ...resolverPonderacion(item, ponderacionesMapa) },
        puntajesEntrada, i,
        referenciaMapa?.[item.codigo_carrera], resultados.promedio,
        resolverCorte(item, cortesMapa),
      )
    );
    // Las priorizadas (IPG/UA de modo explorar) se muestran aunque no tengan
    // fórmula conocida — es una regla de negocio explícita, no un resultado
    // real de búsqueda como en modoBusqueda.
    let visibles = modoBusqueda
      ? adaptadas
      : adaptadas.filter(c => !c.puntaje.sinFormula || prioridadIds.has(c.id));
    // "Solo con corte": deja solo las que tienen corte real (universidades).
    if (soloConCorte) visibles = visibles.filter(c => c.veredictoCorte !== null);
    // Filtro por cohorte (1d): solo carreras donde estás sobre el promedio.
    if (soloAlcanzo) visibles = visibles.filter(c => c.veredicto.estado === "sobre");
    if (puntajesEntrada.nem <= 0) return visibles;
    return [...visibles].sort((a, b) => {
      // Las carreras sin fórmula oficial conocida siempre van al final —
      // nunca "empatan en 0" con una carrera que sí tiene fórmula pero a la
      // que todavía le falta un puntaje tuyo (esas dos cosas no son lo mismo).
      const sinFormulaA = a.puntaje.sinFormula ? 1 : 0;
      const sinFormulaB = b.puntaje.sinFormula ? 1 : 0;
      if (sinFormulaA !== sinFormulaB) return sinFormulaA - sinFormulaB;
      return b.puntaje.total - a.puntaje.total || a.nombre.localeCompare(b.nombre);
    });
  }, [rawCarreras, puntajesEntrada, ponderacionesMapa, referenciaMapa, cortesMapa, resultados.promedio, modoBusqueda, prioridadIds, soloAlcanzo, soloConCorte]);

  // ── PAGINACIÓN ─────────────────────────────────────────────────────────
  // La página visible es un slice cliente-side de `carreras` (ya filtrada y
  // ordenada). Para que la página actual siempre pueda llenarse, la ventana
  // cruda (`limite`) se agranda sola mientras falten tarjetas visibles y
  // queden filas por traer. Fuera del modo búsqueda el filtro "sin fórmula"
  // descarta filas (~32-64% matchea), por eso el objetivo se persigue con un
  // tope duro proporcional a la página — sin él, una racha de mala suerte
  // reintentaría sin parar y saturaría de renders/consultas.
  const objetivoVisibles = pagina * RESULTADOS_POR_PAGINA;
  const capAutocarga = Math.min(objetivoVisibles * 6, 600);
  // true cuando las filas crudas ya alcanzaron la ventana pedida — es decir,
  // NO hay un fetch pendiente por un `limite` recién subido. Crítico: el fetch
  // se dispara con debounce de 300ms y `cargando` recién se prende ahí; sin
  // esta guarda, los efectos de abajo re-actúan durante esa ventana con datos
  // viejos (subiendo `limite` hasta el tope y gatillando un snap-back falso a
  // la página 1).
  const ventanaCompleta =
    limiteFetcheado.current >= limite && rawCarreras.length >= Math.min(limite, totalResultados);
  useEffect(() => {
    if (cargando || errorCarga || !ventanaCompleta) return;
    if (carreras.length < objetivoVisibles && limite < Math.min(totalResultados, capAutocarga)) {
      // Salta directo al objetivo (páginas profundas en modo búsqueda no
      // necesitan N roundtrips de a 9) y de ahí crece por incrementos.
      setLimite(l => Math.min(Math.max(l + RESULTADOS_INCREMENTO, objetivoVisibles), totalResultados, capAutocarga));
    }
  }, [cargando, errorCarga, ventanaCompleta, carreras.length, limite, totalResultados, objetivoVisibles, capAutocarga]);

  // Si el usuario quedó parado en una página que ya no existe (cambió el
  // universo de resultados y no hay más filas que traer), vuelve a la última
  // página real en vez de mostrar una grilla vacía.
  useEffect(() => {
    if (cargando || errorCarga || !ventanaCompleta || pagina === 1) return;
    const sinMasDatos = limite >= Math.min(totalResultados, capAutocarga);
    if (sinMasDatos && carreras.length <= (pagina - 1) * RESULTADOS_POR_PAGINA) {
      setPagina(Math.max(1, Math.ceil(carreras.length / RESULTADOS_POR_PAGINA)));
    }
  }, [cargando, errorCarga, ventanaCompleta, pagina, limite, totalResultados, capAutocarga, carreras.length]);

  // En modo búsqueda (sin toggles cliente-side) la lista visible es 1:1 con
  // las filas de Supabase → el total de páginas es exacto. Con filtros que
  // esconden filas en el cliente solo conocemos las páginas ya materializadas,
  // más una tentativa mientras queden filas crudas por traer.
  const totalPaginasExactas = modoBusqueda && !soloAlcanzo && !soloConCorte
    ? Math.max(1, Math.ceil(totalResultados / RESULTADOS_POR_PAGINA))
    : null;
  const paginasConocidas = Math.max(1, Math.ceil(carreras.length / RESULTADOS_POR_PAGINA));
  const quedanFilasPorTraer = limite < totalResultados;
  const totalPaginas = totalPaginasExactas ?? (quedanFilasPorTraer ? paginasConocidas + 1 : paginasConocidas);
  const hayPaginaSiguiente = pagina < totalPaginas;
  const carrerasPagina = carreras.slice((pagina - 1) * RESULTADOS_POR_PAGINA, pagina * RESULTADOS_POR_PAGINA);

  // Comparador: recalculado en vivo desde la cache por id, así si el usuario
  // edita sus notas DESPUÉS de armar el comparador, los puntajes mostrados
  // siguen siendo coherentes con lo último que ingresó (no quedan congelados).
  const comparando = useMemo(() => {
    return comparandoIds
      .map(id => rawPorId.get(id))
      .filter((item): item is CarreraSupabaseRaw => !!item)
      .map((item, i) => adaptarCarrera(
        { ...item, ...resolverPonderacion(item, ponderacionesMapa) },
        puntajesEntrada, i,
        referenciaMapa?.[item.codigo_carrera], resultados.promedio,
        resolverCorte(item, cortesMapa),
      ));
  }, [comparandoIds, rawPorId, puntajesEntrada, ponderacionesMapa, referenciaMapa, cortesMapa, resultados.promedio]);

  // Todo cambio de búsqueda/filtro reinicia la ventana cruda Y la página.
  const reiniciarPaginacion = () => {
    setLimite(RESULTADOS_INICIALES);
    setPagina(1);
  };

  // Ancla para volver al inicio de la sección de resultados al cambiar de página.
  const resultadosRef = useRef<HTMLDivElement>(null);
  const cambiarPagina = (p: number) => {
    setPagina(p);
    resultadosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleComparar = (carrera: CarreraSimuladorUI) => {
    setComparandoIds(prev => {
      const yaEsta = prev.includes(carrera.id);
      if (yaEsta) return prev.filter(id => id !== carrera.id);
      if (prev.length >= 3) return prev;
      return [...prev, carrera.id];
    });
  };

  const formatRegionLabel = (region: string): string => {
    if (region === "todas") return "Todas las Regiones";
    if (region === "Metropolitana") return "Región Metropolitana";
    return `Región de ${region}`;
  };

  const hayCorteEnComparador = comparando.some(c => c.corteReferencial !== null);

  // Índice de la carrera con el mejor valor de una fila del comparador.
  // Devuelve -1 (nadie destacado) si hay menos de 2 valores comparables —
  // "mejor" solo tiene sentido cuando efectivamente se compara contra algo.
  const mejorEn = (vals: (number | null)[], modo: "max" | "min"): number => {
    let mejorIdx = -1;
    let mejorVal: number | null = null;
    vals.forEach((v, i) => {
      if (v === null) return;
      if (mejorVal === null || (modo === "max" ? v > mejorVal : v < mejorVal)) {
        mejorVal = v;
        mejorIdx = i;
      }
    });
    const comparables = vals.filter((v): v is number => v !== null);
    // Nada que destacar si hay menos de 2 valores o si el mejor está empatado
    // (marcar "mejor" un 10 semestres contra otros dos de 10 sería engañoso).
    if (comparables.length < 2 || comparables.filter(v => v === mejorVal).length > 1) return -1;
    return mejorIdx;
  };
  const idxMejorPuntaje = mejorEn(comparando.map(c => (c.puntaje.sinFormula || c.puntaje.total <= 0) ? null : c.puntaje.total), "max");
  const idxMejorArancel = mejorEn(comparando.map(c => numeroDe(c.arancel)), "min");
  const idxMejorDuracion = mejorEn(comparando.map(c => numeroDe(c.duracion)), "min");
  const idxMejorEmpleabilidad = mejorEn(comparando.map(c => numeroDe(c.empleabilidad)), "max");

  // Celda del comparador que destaca en verde el mejor valor de su fila.
  const CeldaComparador = ({ valor, esMejor }: { valor: string; esMejor: boolean }) => (
    <td className="py-3 px-3 text-sm font-semibold text-gray-700">
      {esMejor ? (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-1 font-bold">
          {valor}
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        </span>
      ) : valor}
    </td>
  );

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-gray-800 font-sans selection:bg-[#7C3AED] selection:text-white pb-20">

      {/* =========================================================================
          HERO SECTION - IDÉNTICO A CARRERADETALLE
      ========================================================================= */}
      <header className="relative w-full bg-[#0A0518] text-white pt-20 pb-40 px-6 overflow-hidden border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">

        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-12 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full mb-6 animate-fade-in-up">
            <Calculator className="w-4 h-4 text-[#A78BFA]" />
            <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Simulador de Admisión 2026</span>
          </div>

          <h1 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Calcula tu <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">NEM y tu Carrera Ideal</span>
          </h1>

          <p className="text-gray-300 max-w-2xl text-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Ingresa tus notas y puntajes PAES, y descubre tu puntaje ponderado real
            en miles de carreras — con la fórmula oficial de cada una.
          </p>
        </div>
      </header>

      {/* =========================================================================
          BLOQUE 1: NOTAS, PAES Y RESULTADOS
      ========================================================================= */}
      <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-30">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* COLUMNA IZQUIERDA - FORMULARIO (3 secciones ordenadas) */}
          <div className="lg:col-span-7 space-y-5">

            {/* ── SECCIÓN 1: NOTAS (obligatoria) ─────────────────────────── */}
            <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-[#6544FF] text-white flex items-center justify-center shrink-0 font-black text-lg shadow-sm">1</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-bold text-[#1A1528]">Tus notas de media</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#6544FF]/10 text-[#6544FF] px-2 py-0.5 rounded-full">Obligatorio</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">Con esto calculamos tu <strong className="font-semibold text-gray-600">NEM</strong> y <strong className="font-semibold text-gray-600">Ranking</strong>. Ingresa tus promedios anuales finales.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "n1", label: "1º Medio", placeholder: "Ej: 6.2" },
                  { id: "n2", label: "2º Medio", placeholder: "Ej: 6.5" },
                  { id: "n3", label: "3º Medio", placeholder: "Ej: 6.8" },
                  { id: "n4", label: "4º Medio", placeholder: "Ej: 6.7" }
                ].map((curso) => (
                  <div key={curso.id} className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">{curso.label}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={notas[curso.id as keyof typeof notas]}
                      onChange={(e) => handleInput(e, curso.id)}
                      placeholder={curso.placeholder}
                      className="w-full bg-[#fafafa] border border-gray-200 rounded-2xl px-4 py-3 text-lg font-bold text-[#1A1528] focus:outline-none focus:ring-2 focus:ring-[#6544FF]/50 focus:border-[#6544FF] transition-all placeholder:font-normal placeholder:text-gray-300"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* ── SECCIÓN 2: PAES OBLIGATORIAS (opcional, switch) ────────── */}
            <SeccionPaes
              numero={2}
              titulo="Puntajes PAES obligatorias"
              subtitulo="Competencia Lectora y Matemática 1 (M1) — las rinde todo el mundo."
              activo={paesObligatoriasActivo}
              onToggle={() => setPaesObligatoriasActivo(v => !v)}
              campos={[
                { id: "lenguaje", label: "Comp. Lectora" },
                { id: "matematica", label: "Matemática 1 (M1)" },
              ]}
              paes={paes}
              onInput={handlePaesInput}
            />

            {/* ── SECCIÓN 3: PAES ELECTIVAS (opcional, switch) ──────────── */}
            <SeccionPaes
              numero={3}
              titulo="Puntajes PAES electivas"
              subtitulo="Matemática 2, Historia o Ciencias — solo las que rendiste según tu carrera."
              activo={paesElectivasActivo}
              onToggle={() => setPaesElectivasActivo(v => !v)}
              campos={[
                { id: "matematica2", label: "Matemática 2 (M2)" },
                { id: "historia", label: "Historia y Cs. Sociales" },
                { id: "ciencias", label: "Ciencias" },
              ]}
              paes={paes}
              onInput={handlePaesInput}
            />
          </div>

          {/* COLUMNA DERECHA - RESULTADOS */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 bg-[#130E24] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">

              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#6544FF] rounded-full blur-3xl opacity-20 pointer-events-none" aria-hidden="true"></div>

              <h3 className="relative text-white font-bold text-xl mb-8 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#6544FF]" />
                Tus Resultados:
              </h3>

              <div className="relative space-y-8">

                <div className="border-b border-white/10 pb-4">
                  <p className="text-gray-400 text-sm font-medium mb-1">Promedio de Media</p>
                  <div className="text-5xl font-black text-white tracking-tighter">
                    {resultados.promedio > 0 ? resultados.promedio.toFixed(2) : "-.--"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Puntaje NEM</p>
                    <div className="text-3xl font-black text-[#947BFF]">
                      {resultados.nem > 0 ? resultados.nem : "---"}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6544FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>
                    <p className="relative text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Ranking</p>
                    <div className="relative text-3xl font-black text-[#C1AFFF]">
                      {resultados.ranking > 0 ? resultados.ranking : "---"}
                    </div>
                  </div>
                </div>

                {(paesObligatoriasActivo || paesElectivasActivo) && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Lectora", val: paesObligatoriasActivo ? paes.lenguaje : "" },
                      { label: "Mate 1", val: paesObligatoriasActivo ? paes.matematica : "" },
                      { label: "Mate 2", val: paesElectivasActivo ? paes.matematica2 : "" },
                      { label: "Historia", val: paesElectivasActivo ? paes.historia : "" },
                      { label: "Ciencias", val: paesElectivasActivo ? paes.ciencias : "" },
                    ].filter(p => p.val).map((p) => (
                      <div key={p.label} className="bg-white/5 rounded-xl px-4 py-2.5 border border-white/10 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-semibold">{p.label}</span>
                        <span className="text-sm font-black text-white">{p.val}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-[#6544FF]/10 rounded-xl p-4 flex gap-3 items-start border border-[#6544FF]/20">
                  <Info className="w-5 h-5 text-[#947BFF] shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Esta es una simulación basada en la escala de transformación lineal DEMRE. Los puntajes oficiales pueden variar ligeramente según la tabla específica de tu rama educacional (HC, TP).
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          BLOQUE 2: BUSCA TU CARRERA + PUNTAJE PONDERADO REAL
      ========================================================================= */}
      <div ref={resultadosRef} className="max-w-7xl mx-auto px-4 mt-16 relative z-20 scroll-mt-6">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#6544FF]/10 text-[#6544FF] font-bold text-sm mb-4 uppercase tracking-widest">
            <Scale className="w-4 h-4" /> Puntaje Ponderado por Carrera
          </div>
          <h2 className="font-black text-3xl md:text-4xl text-[#1A1528] tracking-tight mb-3">
            Busca tu carrera y descubre tu puntaje
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Aplicamos la fórmula oficial de ponderación de cada carrera (fuente SIES) a tus
            puntajes para mostrarte un resultado real, no un estimado genérico.
          </p>
        </div>

        {/* BUSCADOR */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-3 shadow-2xl shadow-indigo-900/10 border border-white mb-8 flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full relative flex items-center group">
            <Search className="absolute left-6 w-5 h-5 text-gray-400 group-focus-within:text-[#6544FF] transition-colors" />
            <input
              type="search"
              placeholder="Ej: Enfermería, Ingeniería, Derecho..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); reiniciarPaginacion(); }}
              className="w-full pl-14 pr-12 py-4 rounded-[1.5rem] bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:border-[#6544FF]/30 focus:bg-white focus:ring-4 focus:ring-[#6544FF]/10 outline-none transition-all font-semibold text-gray-700 placeholder:text-gray-400 text-base md:text-lg"
            />
            {busqueda && (
              <button
                onClick={() => { setBusqueda(""); reiniciarPaginacion(); }}
                className="absolute right-5 text-gray-400 hover:text-rose-500 transition-colors p-1.5 bg-white hover:bg-rose-50 rounded-full shadow-sm border border-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/50 shrink-0" role="group">
            {[
              { id: "Todos", label: "Todos" },
              { id: "U", label: "U" },
              { id: "IP", label: "IP" },
              { id: "CFT", label: "CFT" }
            ].map((opc) => (
              <button
                key={opc.id}
                onClick={() => { setTipoFiltro(opc.id); reiniciarPaginacion(); }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                  tipoFiltro === opc.id
                    ? 'bg-white text-[#6544FF] shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
              >
                {opc.label}
              </button>
            ))}
          </div>

          <div className="relative shrink-0 w-full md:w-56">
            <button
              onClick={() => setDropdownRegionAbierto(!dropdownRegionAbierto)}
              className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownRegionAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MapPin className="w-4 h-4 text-[#6544FF]/70 shrink-0" />
                <span className="font-semibold text-sm text-[#1A1528] whitespace-nowrap overflow-hidden text-ellipsis">
                  {formatRegionLabel(regionFiltro)}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownRegionAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
            </button>

            {dropdownRegionAbierto && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownRegionAbierto(false)}></div>
                <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 custom-scrollbar">
                  <button
                    onClick={() => { setRegionFiltro("todas"); reiniciarPaginacion(); setDropdownRegionAbierto(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-2 transition-colors ${regionFiltro === "todas" ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}
                  >
                    Todas las Regiones
                    {regionFiltro === "todas" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                  {listaRegiones.map((reg) => (
                    <button
                      key={reg}
                      onClick={() => { setRegionFiltro(reg); reiniciarPaginacion(); setDropdownRegionAbierto(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-2 transition-colors ${regionFiltro === reg ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}
                    >
                      <span className="truncate">{formatRegionLabel(reg)}</span>
                      {regionFiltro === reg && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {resultados.nem === 0 ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4 mb-8 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            Ingresa tus notas de 1º a 4º medio arriba para calcular tu puntaje ponderado real por carrera.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-4 mb-8 text-sm font-medium">
            <div className="flex items-center gap-3 flex-1">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Carreras ordenadas por tu puntaje ponderado — se recalcula al instante con cada nota o puntaje PAES que agregues.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {institucionesConCorte.size > 0 && (
                <button
                  type="button"
                  onClick={() => { setSoloConCorte(v => !v); reiniciarPaginacion(); }}
                  aria-pressed={soloConCorte}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    soloConCorte
                      ? 'bg-[#6544FF] text-white border-[#6544FF]'
                      : 'bg-white text-[#6544FF] border-[#6544FF]/30 hover:bg-[#6544FF]/10'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  Solo con puntaje de corte
                </button>
              )}
              {referenciaMapa && (
                <button
                  type="button"
                  onClick={() => { setSoloAlcanzo(v => !v); reiniciarPaginacion(); }}
                  aria-pressed={soloAlcanzo}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    soloAlcanzo
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Solo donde alcanzo el promedio
                </button>
              )}
            </div>
          </div>
        )}

        {/* COMPARADOR */}
        {comparando.length > 0 && (
          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg text-[#1A1528] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#6544FF]" /> Comparando {comparando.length} de 3 carreras
              </h3>
              <button
                onClick={() => setComparandoIds([])}
                className="text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpiar
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-4 pr-4 w-40">Carrera</th>
                    {comparando.map((c) => (
                      <th key={c.id} className="text-left pb-4 px-3 min-w-[180px]">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-sm text-[#1A1528] leading-snug line-clamp-2">{c.nombre}</p>
                            <p className="text-xs text-gray-400 font-medium mt-1">{c.institucion}</p>
                          </div>
                          <button onClick={() => toggleComparar(c)} className="text-gray-300 hover:text-rose-500 transition-colors shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">Puntaje Ponderado</td>
                    {comparando.map((c, i) => (
                      <td key={c.id} className="py-3 px-3">
                        {c.puntaje.sinFormula ? (
                          <span className="text-xs font-semibold text-gray-400">Sin fórmula</span>
                        ) : (
                          <>
                            <span className="flex items-center gap-1.5">
                              <span className="text-2xl font-black text-[#6544FF]">{c.puntaje.total || "---"}</span>
                              {i === idxMejorPuntaje && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">Mejor</span>
                              )}
                            </span>
                            {c.puntaje.parcial && <span className="block text-[10px] font-bold text-amber-600 mt-0.5">Parcial</span>}
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                  {/* Veredicto: mismo criterio que las tarjetas — corte real
                      DEMRE si existe; si no, comparación vs promedio SIES. */}
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">¿Te alcanza?</td>
                    {comparando.map((c) => (
                      <td key={c.id} className="py-3 px-3">
                        {c.veredictoCorte ? (
                          c.veredictoCorte.alcanza ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Te alcanza (corte {c.veredictoCorte.anioReciente})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                              <XCircle className="w-3.5 h-3.5 shrink-0" /> Te faltan {c.veredictoCorte.faltan} pts
                            </span>
                          )
                        ) : c.veredicto.estado === "sobre" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Sobre el promedio
                          </span>
                        ) : c.veredicto.estado === "bajo" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Bajo el promedio
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-400">Sin referencia</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  {hayCorteEnComparador && (
                    <tr>
                      <td className="py-3 pr-4 text-sm font-bold text-gray-500">Corte Referencial</td>
                      {comparando.map((c) => (
                        <td key={c.id} className="py-3 px-3 text-sm font-bold text-gray-700">
                          {c.corteReferencial ?? "Próximamente"}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">Arancel Anual</td>
                    {comparando.map((c, i) => (
                      <CeldaComparador key={c.id} valor={c.arancel} esMejor={i === idxMejorArancel} />
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">Duración</td>
                    {comparando.map((c, i) => (
                      <CeldaComparador key={c.id} valor={c.duracion} esMejor={i === idxMejorDuracion} />
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">Empleabilidad 1er año</td>
                    {comparando.map((c, i) => (
                      <CeldaComparador key={c.id} valor={c.empleabilidad} esMejor={i === idxMejorEmpleabilidad} />
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">Acreditación</td>
                    {comparando.map((c) => (
                      <td key={c.id} className="py-3 px-3 text-sm font-semibold text-gray-700">{c.acreditacion}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">Ficha</td>
                    {comparando.map((c) => (
                      <td key={c.id} className="py-3 px-3">
                        {c.slug ? (
                          <a
                            href={enlaceCarrera(c.slug)}
                            className="inline-block text-xs font-bold text-[#6544FF] bg-[#6544FF]/10 hover:bg-[#6544FF]/20 rounded-xl px-4 py-2 transition-colors"
                          >
                            Ver detalle
                          </a>
                        ) : (
                          <span className="text-xs font-semibold text-gray-300">No disponible</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RESULTADOS */}
        {errorCarga ? (
          <div className="text-center py-20 bg-rose-50/60 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-rose-200">
            <AlertTriangle className="w-16 h-16 text-rose-300 mx-auto mb-4" />
            <h3 className="font-black text-2xl text-slate-700 mb-2">No pudimos cargar las carreras</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">Ocurrió un problema de conexión con la base de datos. Intenta de nuevo.</p>
            <button
              onClick={() => buscarCarreras()}
              className="px-6 py-3 bg-[#6544FF] hover:bg-[#5638e0] text-white font-bold rounded-2xl transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : cargando && carrerasPagina.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#6544FF]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carrerasPagina.map((carrera, idx) => {
              const seleccionada = comparando.some(c => c.id === carrera.id);
              const comparadorLleno = comparando.length >= 3 && !seleccionada;
              const detalleValido = Boolean(carrera.slug);
              // Solo en la primera posición del orden actual (página 1), y
              // solo cuando realmente sabemos su fórmula — nunca "mejor
              // opción" para una carrera sin ponderación conocida.
              const esMejorOpcion = idx === 0 && pagina === 1 && puntajesEntrada.nem > 0 && !carrera.puntaje.sinFormula;
              return (
                <article
                  key={carrera.id}
                  className={`relative flex flex-col bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border transition-all duration-300 ${esMejorOpcion ? 'border-emerald-400 ring-2 ring-emerald-400/20' : seleccionada ? 'border-[#6544FF] ring-2 ring-[#6544FF]/20' : 'border-gray-100'}`}
                >
                  {esMejorOpcion && (
                    <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      Mejor puntaje para ti
                    </span>
                  )}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#fafafa] border border-gray-100 shrink-0">
                      <img
                        src={carrera.logoUrl}
                        alt={`Logotipo de ${carrera.institucion}`}
                        loading="lazy"
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(carrera.institucion)}&background=f4f5f9&color=6544ff&bold=true&size=128`;
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#1A1528] leading-snug line-clamp-2">{carrera.nombre}</h3>
                      <p className="text-xs text-gray-400 font-medium truncate mt-1 flex items-center gap-1">
                        <Building className="w-3 h-3 shrink-0" /> {carrera.institucion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${carrera.color} text-white`}>
                      {carrera.tipoInst}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {carrera.region}
                    </span>
                    {carrera.usaDemre === false && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center gap-1">
                        <Landmark className="w-3 h-3" /> Admisión propia
                      </span>
                    )}
                  </div>

                  <div className="bg-[#F4F5F9] rounded-2xl p-4 mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tu Puntaje Ponderado</p>
                    {carrera.puntaje.sinFormula ? (
                      <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                        Fórmula oficial no disponible todavía para esta carrera.
                      </p>
                    ) : (
                      <>
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-black text-[#6544FF] leading-none">
                            {carrera.puntaje.total > 0 ? carrera.puntaje.total : "---"}
                          </span>
                          <span className="text-xs text-gray-400 font-semibold mb-1">pts</span>
                        </div>
                        {carrera.puntaje.parcial && (
                          <p className="text-[11px] text-amber-600 font-semibold mt-2 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            Falta: {carrera.puntaje.faltantes.join(", ")}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Veredicto: corte real DEMRE (rojo/verde) si existe; si no,
                      comparación vs promedio de admitidos SIES (verde/ámbar) */}
                  {carrera.veredictoCorte
                    ? <VeredictoCorteBadge v={carrera.veredictoCorte} tuPuntaje={carrera.puntaje.total} />
                    : <VeredictoBadge v={carrera.veredicto} />}

                  <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-100 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Arancel</span>
                      <span className="text-sm font-bold text-slate-800">{carrera.arancel}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duración</span>
                      <span className="text-sm font-bold text-slate-800">{carrera.duracion}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {detalleValido ? (
                      <a
                        href={enlaceCarrera(carrera.slug)}
                        className="flex-1 text-center text-xs font-bold text-[#6544FF] bg-[#6544FF]/10 hover:bg-[#6544FF]/20 rounded-xl py-2.5 transition-colors"
                      >
                        Ver detalle
                      </a>
                    ) : (
                      <span
                        title="Esta carrera no tiene ficha propia disponible (código de origen inválido)"
                        className="flex-1 text-center text-xs font-bold text-gray-300 bg-gray-50 rounded-xl py-2.5 cursor-not-allowed select-none"
                      >
                        Ficha no disponible
                      </span>
                    )}
                    <button
                      onClick={() => toggleComparar(carrera)}
                      disabled={comparadorLleno}
                      title={comparadorLleno ? "Máximo 3 carreras para comparar" : "Agregar al comparador"}
                      className={`flex-1 text-xs font-bold rounded-xl py-2.5 transition-colors flex items-center justify-center gap-1.5 ${
                        seleccionada
                          ? 'bg-[#6544FF] text-white'
                          : comparadorLleno
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" /> {seleccionada ? 'En comparador' : 'Comparar'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!errorCarga && !cargando && carreras.length === 0 && (
          <div className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-gray-300">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-black text-2xl text-slate-700 mb-2">No encontramos carreras</h3>
            <p className="text-slate-500 text-sm font-medium">
              {soloConCorte
                ? "No hay carreras con puntaje de corte para este filtro. Los cortes existen solo en universidades que los publican — prueba sin búsqueda o con otro nombre."
                : soloAlcanzo
                  ? "Ninguna carrera aquí queda sobre el promedio de admitidos con tus puntajes actuales. Desactiva el filtro o sube tus puntajes."
                  : modoBusqueda
                    ? "Prueba con otro nombre, tipo de institución o región."
                    : "Ninguna carrera de este filtro tiene fórmula de puntaje disponible todavía. Prueba buscando por nombre — ahí sí se muestra el catálogo completo."}
            </p>
          </div>
        )}

        {/* PAGINACIÓN: 9 tarjetas por página, en vez de acumular hacia abajo */}
        {!errorCarga && carreras.length > 0 && (totalPaginas > 1 || pagina > 1) && (
          <nav aria-label="Paginación de resultados" className="flex flex-col items-center gap-3 mt-10">
            <div className="flex items-center gap-1.5 flex-wrap justify-center bg-white rounded-2xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
              <button
                onClick={() => cambiarPagina(pagina - 1)}
                disabled={pagina <= 1 || cargando}
                aria-label="Página anterior"
                className="px-4 py-2.5 text-xs font-bold rounded-xl transition-all text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              {rangoPaginas(pagina, totalPaginas).map((p, i) =>
                p === "..." ? (
                  <span key={`gap-${i}`} className="px-2 text-gray-300 font-bold select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => cambiarPagina(p)}
                    disabled={cargando && p !== pagina}
                    aria-current={p === pagina ? "page" : undefined}
                    className={`min-w-[2.5rem] px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                      p === pagina
                        ? 'bg-[#6544FF] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-[#6544FF]/10 hover:text-[#6544FF]'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => cambiarPagina(pagina + 1)}
                disabled={!hayPaginaSiguiente || cargando}
                aria-label="Página siguiente"
                className="px-4 py-2.5 text-xs font-bold rounded-xl transition-all text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {totalPaginasExactas
                ? `Página ${pagina} de ${totalPaginasExactas} · ${totalResultados.toLocaleString('es-CL')} carreras encontradas`
                : `Página ${pagina} · ${carreras.length} carreras con fórmula disponible de ${totalResultados.toLocaleString('es-CL')} en total`}
            </p>
          </nav>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 12s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}} />
    </div>
  );
}
