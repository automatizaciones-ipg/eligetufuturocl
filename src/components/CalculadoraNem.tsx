// src/components/CalculadoraNem.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Calculator, BookOpen, ChevronDown, Info, ArrowLeft, Search,
  Scale, Loader2, GraduationCap, MapPin, Building, X, CheckCircle2,
  AlertTriangle, Trash2, Landmark
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { generarTipoInst, generarSiglaInstitucion, esCodigoRutaValido } from "../utils/formatters";
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
  // (bigint PK). codigo_carrera se usa solo para armar el link a /carrera/[id].
  codigo_carrera: string;
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

// Adapta una fila de Supabase a la UI del simulador
function adaptarCarrera(item: CarreraPonderadaDB, puntajes: PuntajesEntrada, index: number): CarreraSimuladorUI {
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
    nombre: formatearTitulo(item.nombre_carrera),
    institucion: formatearTitulo(instNombre),
    tipoInst: generarTipoInst(instObj?.tipo || null),
    sigla: generarSiglaInstitucion(instNombre),
    region: item.region || "No informada",
    arancel: item.arancel_anual ? `$${item.arancel_anual.toLocaleString('es-CL')}` : "No informado",
    duracion: item.duracion_semestres ? `${item.duracion_semestres} Semestres` : "No informada",
    empleabilidad: item.empleabilidad_1er_anio ? `${item.empleabilidad_1er_anio}%` : "No informada",
    acreditacion: item.acreditacion_carrera || "No informada",
    requisitoIngreso: item.requisito_ingreso,
    usaDemre: item.usa_demre,
    corteReferencial: item.puntaje_corte_referencial,
    logoUrl: logoUrl || fallbackLogo,
    color: PALETA_COLORES[index % PALETA_COLORES.length],
    puntaje: calcularPuntajePonderado(item, puntajes),
  };
}

// STOPGAP: solo columnas que YA existen en Supabase hoy. codigo_institucion/
// jornada/sede se piden únicamente para cruzar con el JSON de ponderaciones
// (resolverPonderacion) — no se muestran en la UI. Cuando exista la migración,
// sumar acá requisito_ingreso/usa_demre/puntaje_corte_referencial/ponderacion_*
// y borrar el cruce por JSON.
const CAMPOS_SIMULADOR = `
  id, codigo_carrera, codigo_institucion, nombre_carrera, jornada, sede,
  region, arancel_anual, duracion_semestres,
  empleabilidad_1er_anio, acreditacion_carrera,
  instituciones!inner (nombre, tipo, logo_url)
`;

const RESULTADOS_INICIALES = 9;
const RESULTADOS_INCREMENTO = 9;
// Apenas el usuario tiene un NEM calculable, el orden por puntaje deja de ser
// "reordenar los mismos 9 alfabéticos" y pasa a traer un universo más
// representativo (ej. todas las variantes de "Enfermería" que matcheen el
// filtro activo) para que el reordenamiento instantáneo tenga sentido real.
const RESULTADOS_MINIMO_ORDENADO = 30;

export default function CalculadoraNem() {
  // --- NOTAS / NEM / RANKING (existente) ---
  const [notas, setNotas] = useState({ n1: "", n2: "", n3: "", n4: "" });
  const [resultados, setResultados] = useState({ promedio: 0, nem: 0, ranking: 0 });

  // --- PAES (opcional) ---
  const [paesActivo, setPaesActivo] = useState(false);
  const [paes, setPaes] = useState({ lenguaje: "", matematica: "", matematica2: "", historia: "", ciencias: "" });

  // --- BUSCADOR DE CARRERAS ---
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [regionFiltro, setRegionFiltro] = useState("todas");
  const [listaRegiones, setListaRegiones] = useState<string[]>([]);
  const [dropdownRegionAbierto, setDropdownRegionAbierto] = useState(false);
  const [limite, setLimite] = useState(RESULTADOS_INICIALES);
  // Datos crudos de Supabase para la búsqueda/página actual (solo cambian por
  // búsqueda/filtro/paginación, NUNCA por notas o PAES — el puntaje se calcula
  // 100% en el cliente para que se sienta instantáneo mientras escribes).
  const [rawCarreras, setRawCarreras] = useState<CarreraSupabaseRaw[]>([]);
  // Cache acumulada por id: mantiene vivas (recalculables) las carreras que el
  // usuario ya agregó al comparador aunque cambie de búsqueda después.
  const [rawPorId, setRawPorId] = useState<Map<number, CarreraSupabaseRaw>>(new Map());
  const [totalResultados, setTotalResultados] = useState(0);
  const [cargando, setCargando] = useState(false);
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
    lenguaje: paesActivo ? parsePuntajePaes(paes.lenguaje) : undefined,
    matematica: paesActivo ? parsePuntajePaes(paes.matematica) : undefined,
    matematica2: paesActivo ? parsePuntajePaes(paes.matematica2) : undefined,
    historia: paesActivo ? parsePuntajePaes(paes.historia) : undefined,
    ciencias: paesActivo ? parsePuntajePaes(paes.ciencias) : undefined,
  }), [
    resultados.nem, resultados.ranking, paesActivo,
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

  // Solo consulta Supabase por búsqueda/filtro/región/paginación — las notas y
  // los puntajes PAES NUNCA disparan una consulta nueva, se recalculan en el
  // cliente (ver `carreras` más abajo) para que la respuesta sea instantánea.
  const buscarCarrerasSeq = useRef(0);
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
        busqueda.trim().length < 3 && tipoFiltro === "Todos" && regionFiltro === "todas" && !tieneNem;

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
      if (esVigente()) setCargando(false);
    }
  }, [busqueda, tipoFiltro, regionFiltro, limite, tieneNem]);

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
      adaptarCarrera({ ...item, ...resolverPonderacion(item, ponderacionesMapa) }, puntajesEntrada, i)
    );
    // Las priorizadas (IPG/UA de modo explorar) se muestran aunque no tengan
    // fórmula conocida — es una regla de negocio explícita, no un resultado
    // real de búsqueda como en modoBusqueda.
    const visibles = modoBusqueda
      ? adaptadas
      : adaptadas.filter(c => !c.puntaje.sinFormula || prioridadIds.has(c.id));
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
  }, [rawCarreras, puntajesEntrada, ponderacionesMapa, modoBusqueda, prioridadIds]);

  // Fuera del modo búsqueda, filtrar "sin fórmula" puede dejar una página casi
  // vacía si por mala suerte el tramo alfabético fetcheado tiene pocos matches
  // (~32-64% de las carreras tiene ponderación conocida, no todas). Mientras
  // haya menos de una página completa visible Y todavía queden filas crudas
  // por traer, se pide más automáticamente — sin esto, "Todos"/"U"/"IP"/"CFT"
  // podrían mostrar 2 o 3 tarjetas sueltas en vez de una página llena.
  // Tope duro (no depende de totalResultados, que puede ser ~10.000): sin él,
  // una racha de mala suerte reintenta sin parar y satura de renders.
  const LIMITE_MAXIMO_AUTOCARGA = RESULTADOS_INICIALES * 6;
  useEffect(() => {
    if (modoBusqueda || cargando || errorCarga) return;
    if (carreras.length < RESULTADOS_INICIALES && limite < Math.min(totalResultados, LIMITE_MAXIMO_AUTOCARGA)) {
      setLimite(l => Math.min(l + RESULTADOS_INCREMENTO, totalResultados, LIMITE_MAXIMO_AUTOCARGA));
    }
  }, [modoBusqueda, cargando, errorCarga, carreras.length, limite, totalResultados]);

  // Comparador: recalculado en vivo desde la cache por id, así si el usuario
  // edita sus notas DESPUÉS de armar el comparador, los puntajes mostrados
  // siguen siendo coherentes con lo último que ingresó (no quedan congelados).
  const comparando = useMemo(() => {
    return comparandoIds
      .map(id => rawPorId.get(id))
      .filter((item): item is CarreraSupabaseRaw => !!item)
      .map((item, i) => adaptarCarrera({ ...item, ...resolverPonderacion(item, ponderacionesMapa) }, puntajesEntrada, i));
  }, [comparandoIds, rawPorId, puntajesEntrada, ponderacionesMapa]);

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

          {/* COLUMNA IZQUIERDA - FORMULARIO */}
          <div className="lg:col-span-7 space-y-6">

            {/* Notas */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#6544FF]/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-[#6544FF]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1528]">Tus Notas de Media</h2>
                  <p className="text-sm text-gray-500">Ingresa tus promedios anuales finales.</p>
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
            </div>

            {/* PAES (opcional) */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setPaesActivo(!paesActivo)}
                aria-expanded={paesActivo}
                className="w-full p-6 flex items-center justify-between bg-white hover:bg-[#fafafa] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className={`w-5 h-5 transition-colors duration-300 ${paesActivo ? 'text-[#6544FF]' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <span className="font-bold text-[#1A1528] block">Agregar puntajes PAES</span>
                    <span className="text-xs text-gray-400">Opcional — para calcular tu puntaje ponderado por carrera</span>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${paesActivo ? 'rotate-180' : ''}`} />
              </button>

              {paesActivo && (
                <div className="px-6 pb-6 border-t border-gray-100 bg-[#fafafa]/50">
                  <p className="text-sm text-gray-500 my-4">
                    Ingresa solo los puntajes que ya tengas (100 a 1000 pts). Los que dejes vacíos
                    se marcarán como pendientes en el simulador de carreras.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { id: "lenguaje", label: "Comp. Lectora" },
                      { id: "matematica", label: "Matemática 1" },
                      { id: "matematica2", label: "Matemática 2" },
                      { id: "historia", label: "Historia y Cs. Sociales" },
                      { id: "ciencias", label: "Ciencias" },
                    ].map((p) => (
                      <div key={p.id} className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 ml-1">{p.label}</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={paes[p.id as keyof typeof paes]}
                          onChange={(e) => handlePaesInput(e, p.id as keyof typeof paes)}
                          placeholder="Ej: 650"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-bold text-[#1A1528] focus:outline-none focus:ring-2 focus:ring-[#6544FF]/50 placeholder:font-normal placeholder:text-gray-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

                {paesActivo && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Lectora", val: paes.lenguaje },
                      { label: "Mate 1", val: paes.matematica },
                      { label: "Mate 2", val: paes.matematica2 },
                      { label: "Historia", val: paes.historia },
                      { label: "Ciencias", val: paes.ciencias },
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
      <div className="max-w-7xl mx-auto px-4 mt-16 relative z-20">

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
              onChange={(e) => { setBusqueda(e.target.value); setLimite(RESULTADOS_INICIALES); }}
              className="w-full pl-14 pr-12 py-4 rounded-[1.5rem] bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:border-[#6544FF]/30 focus:bg-white focus:ring-4 focus:ring-[#6544FF]/10 outline-none transition-all font-semibold text-gray-700 placeholder:text-gray-400 text-base md:text-lg"
            />
            {busqueda && (
              <button
                onClick={() => { setBusqueda(""); setLimite(RESULTADOS_INICIALES); }}
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
                onClick={() => { setTipoFiltro(opc.id); setLimite(RESULTADOS_INICIALES); }}
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
                    onClick={() => { setRegionFiltro("todas"); setLimite(RESULTADOS_INICIALES); setDropdownRegionAbierto(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between gap-2 transition-colors ${regionFiltro === "todas" ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}
                  >
                    Todas las Regiones
                    {regionFiltro === "todas" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  </button>
                  {listaRegiones.map((reg) => (
                    <button
                      key={reg}
                      onClick={() => { setRegionFiltro(reg); setLimite(RESULTADOS_INICIALES); setDropdownRegionAbierto(false); }}
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
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-4 mb-8 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Carreras ordenadas por tu puntaje ponderado — se recalcula al instante con cada nota o puntaje PAES que agregues.
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
                    {comparando.map((c) => (
                      <td key={c.id} className="py-3 px-3">
                        {c.puntaje.sinFormula ? (
                          <span className="text-xs font-semibold text-gray-400">Sin fórmula</span>
                        ) : (
                          <>
                            <span className="text-2xl font-black text-[#6544FF]">{c.puntaje.total || "---"}</span>
                            {c.puntaje.parcial && <span className="block text-[10px] font-bold text-amber-600 mt-0.5">Parcial</span>}
                          </>
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
                    {comparando.map((c) => (
                      <td key={c.id} className="py-3 px-3 text-sm font-semibold text-gray-700">{c.arancel}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">Duración</td>
                    {comparando.map((c) => (
                      <td key={c.id} className="py-3 px-3 text-sm font-semibold text-gray-700">{c.duracion}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">Empleabilidad 1er año</td>
                    {comparando.map((c) => (
                      <td key={c.id} className="py-3 px-3 text-sm font-semibold text-gray-700">{c.empleabilidad}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-sm font-bold text-gray-500">Acreditación</td>
                    {comparando.map((c) => (
                      <td key={c.id} className="py-3 px-3 text-sm font-semibold text-gray-700">{c.acreditacion}</td>
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
        ) : cargando && carreras.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#6544FF]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carreras.map((carrera, idx) => {
              const seleccionada = comparando.some(c => c.id === carrera.id);
              const comparadorLleno = comparando.length >= 3 && !seleccionada;
              const detalleValido = esCodigoRutaValido(carrera.codigoCarrera);
              // Solo en la primera posición del orden actual, y solo cuando
              // realmente sabemos su fórmula — nunca "mejor opción" para una
              // carrera sin ponderación conocida.
              const esMejorOpcion = idx === 0 && puntajesEntrada.nem > 0 && !carrera.puntaje.sinFormula;
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
                        href={`/carrera/${carrera.codigoCarrera}`}
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
              {modoBusqueda
                ? "Prueba con otro nombre, tipo de institución o región."
                : "Ninguna carrera de este filtro tiene fórmula de puntaje disponible todavía. Prueba buscando por nombre — ahí sí se muestra el catálogo completo."}
            </p>
          </div>
        )}

        {!errorCarga && !cargando && carreras.length > 0 && limite < totalResultados && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setLimite(l => l + RESULTADOS_INCREMENTO)}
              className="px-8 py-3.5 bg-white border-2 border-gray-200 hover:border-[#6544FF]/40 text-[#1A1528] font-bold rounded-2xl transition-all hover:shadow-md"
            >
              {modoBusqueda
                ? `Cargar más carreras (${carreras.length} de ${totalResultados})`
                : `Cargar más carreras (${carreras.length} con fórmula disponible, de ${totalResultados} en total)`}
            </button>
          </div>
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
