// src/components/BuscadorCarreras.tsx
'use client';

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, SlidersHorizontal, Building, MapPin, Clock, Calculator, 
  ChevronRight, ChevronDown, Loader2, ChevronLeft, CheckCircle2, 
  ArrowLeft, Globe, GraduationCap,
  X
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ============================================================================
// 1. INTERFACES ESTRICTAS (TYPE-SAFETY)
// ============================================================================
interface SupabaseCarreraJoin {
  codigo_carrera: number;
  nombre_carrera: string;
  region: string | null;
  duracion_semestres: number | null;
  arancel_anual: number | null;
  instituciones: {
    nombre: string;
    tipo: string;
    logo_url?: string;
  } | { nombre: string; tipo: string; logo_url?: string }[] | null;
}

export interface CarreraUI {
  id: number;
  nombre: string;
  sigla: string;
  institucion: string;
  tipoInst: string;
  region: string;
  puntaje: string;
  duracion: string;
  color: string;
  logoUrl: string;
}

// ============================================================================
// 2. CONSTANTES Y CONFIGURACIÓN
// ============================================================================
const OPCIONES_ORDEN = [
  { id: "nombre_asc", label: "Nombre (A - Z)", min: null, max: null },
  { id: "nombre_desc", label: "Nombre (Z - A)", min: null, max: null },
  { id: "arancel_1", label: "Arancel $0 a $1.200.000", min: 0, max: 1200000 },
  { id: "arancel_2", label: "Arancel $1.200.000 a $2.200.000", min: 1200001, max: 2200000 },
  { id: "arancel_3", label: "Arancel $2.200.000 a $5.000.000", min: 2200001, max: 5000000 },
  { id: "arancel_4", label: "Arancel $5.000.000 o más", min: 5000001, max: 99999999 }
];

const PALETA_COLORES = [
  "from-[#15803d] to-emerald-400",
  "from-[#6544FF] to-[#947BFF]",
  "from-orange-500 to-amber-400",
  "from-blue-600 to-cyan-400",
  "from-rose-500 to-pink-400",
  "from-[#002B49] to-[#005288]",
  "from-red-600 to-red-400"
];

const RESULTADOS_POR_PAGINA = 15;

// ============================================================================
// 3. HELPERS DE FORMATEO
// ============================================================================
const generarTipoInst = (tipoBD: string | null): string => {
  if (!tipoBD) return "N/A";
  if (tipoBD.includes("Universidades")) return "U";
  if (tipoBD.includes("Institutos")) return "IP";
  if (tipoBD.includes("Centros")) return "CFT";
  return "N/A";
};

const generarSiglaInstitucion = (nombre: string): string => {
  if (!nombre) return "N/A";
  const palabras = nombre.replace(/\b(de|en|el|la|los|las|y)\b/gi, '').split(' ').filter(p => p.trim().length > 0);
  if (palabras.length > 1) {
    return (palabras[0][0] + (palabras[1]?.[0] || '') + (palabras[2]?.[0] || '')).toUpperCase().substring(0, 3);
  }
  return nombre.substring(0, 3).toUpperCase();
};

const quitarAcentos = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const formatearTitulo = (texto: string): string => {
  if (!texto) return "";
  const conectores = ['de', 'en', 'el', 'la', 'los', 'las', 'y', 'del', 'a', 'por', 'con', 'para'];
  
  const mapaTildes: Record<string, string> = {
    'actuacion': 'actuación', 'administracion': 'administración', 'ingenieria': 'ingeniería',
    'tecnico': 'técnico', 'tecnologia': 'tecnología', 'computacion': 'computación',
    'informatica': 'informática', 'psicologia': 'psicología', 'pedagogia': 'pedagogía',
    'educacion': 'educación', 'kinesiologia': 'kinesiología', 'odontologia': 'odontología',
    'fonoaudiologia': 'fonoaudiología', 'nutricion': 'nutrición', 'biologia': 'biología',
    'quimica': 'química', 'fisica': 'física', 'geologia': 'geología', 'agronomia': 'agronomía',
    'electronica': 'electrónica', 'electrica': 'eléctrica', 'mecanica': 'mecánica',
    'automatizacion': 'automatización', 'gestion': 'gestión', 'publico': 'público',
    'publicas': 'públicas', 'juridica': 'jurídica', 'politica': 'política',
    'politicas': 'políticas', 'antropologia': 'antropología', 'arqueologia': 'arqueología',
    'sociologia': 'sociología', 'filosofia': 'filosofía', 'teologia': 'teología',
    'musica': 'música', 'animacion': 'animación', 'gastronomia': 'gastronomía',
    'estetica': 'estética', 'cosmetologia': 'cosmetología', 'logistica': 'logística',
    'prevencion': 'prevención', 'construccion': 'construcción', 'comunicacion': 'comunicación',
    'diseno': 'diseño', 'parvulo': 'párvulo', 'bilingue': 'bilingüe', 'ingles': 'inglés',
    'enfermeria': 'enfermería', 'audicion': 'audición', 'optometria': 'optometría',
    'clinico': 'clínico', 'radiologia': 'radiología', 'odontologico': 'odontológico',
    'medico': 'médico', 'bioquimica': 'bioquímica', 'biotecnologia': 'biotecnología',
    'estadistica': 'estadística', 'matematica': 'matemática', 'astronomia': 'astronomía',
    'geofisica': 'geofísica', 'geografia': 'geografía', 'linguistica': 'lingüística',
    'basica': 'básica', 'plasticas': 'plásticas', 'coreografia': 'coreografía', 
    'grafico': 'gráfico', 'geomatica': 'geomática', 'topografia': 'topografía', 
    'hoteleria': 'hotelería', 'television': 'televisión', 'fotografia': 'fotografía', 
    'religion': 'religión', 'traduccion': 'traducción', 'interpretacion': 'interpretación', 
    'fraces': 'francés', 'aleman': 'alemán', 'orientacion': 'orientación'
  };

  return texto.toLowerCase().split(' ').map((palabra, index) => {
    const palabraLimpia = palabra.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const palabraCorregida = mapaTildes[palabraLimpia] 
      ? palabra.replace(palabraLimpia, mapaTildes[palabraLimpia]) 
      : palabra;

    if (index > 0 && conectores.includes(palabraCorregida)) return palabraCorregida;
    return palabraCorregida.charAt(0).toUpperCase() + palabraCorregida.slice(1);
  }).join(' ');
};

const formatRegionLabel = (region: string): string => {
  if (region === "todas") return "Todas las Regiones";
  if (region === "Metropolitana") return "Región Metropolitana";
  return `Región de ${region}`;
};

// ============================================================================
// 4. COMPONENTE PRINCIPAL
// ============================================================================
export default function BuscadorCarreras() {
  // --- ESTADOS DE BÚSQUEDA Y FILTROS ---
  const [busqueda, setBusqueda] = useState<string>("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("Todos");
  const [regionFiltro, setRegionFiltro] = useState<string>("todas"); 
  const [institucionFiltro, setInstitucionFiltro] = useState<string>("todas");
  const [orden, setOrden] = useState<string>("nombre_asc");
  
  // --- ESTADOS DE DATOS ---
  const [carreras, setCarreras] = useState<CarreraUI[]>([]);
  const [listaInstituciones, setListaInstituciones] = useState<{nombre: string}[]>([]);
  const [listaRegiones, setListaRegiones] = useState<string[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  
  // --- ESTADOS UI ---
  const [erroresLogos, setErroresLogos] = useState<number[]>([]);
  const [dropdownRegionAbierto, setDropdownRegionAbierto] = useState<boolean>(false);
  const [dropdownInstitucionAbierto, setDropdownInstitucionAbierto] = useState<boolean>(false);
  const [dropdownOrdenAbierto, setDropdownOrdenAbierto] = useState<boolean>(false);
  const [navegandoA, setNavegandoA] = useState<number | null>(null);
  
  // --- PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [totalResultados, setTotalResultados] = useState<number>(0);

  // Restaurar estado al volver atrás
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setNavegandoA(null);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Carga inicial de Filtros Dinámicos
  useEffect(() => {
    const cargarFiltros = async () => {
      try {
        const { data: instData } = await supabase.from('instituciones').select('nombre').order('nombre');
        if (instData) {
          const unicas = Array.from(new Set(instData.map(i => i.nombre))).map(nombre => ({ nombre }));
          setListaInstituciones(unicas);
        }
        const { data: regData } = await supabase.from('carreras').select('region').not('region', 'is', null);
        if (regData) {
          const regionesUnicas = Array.from(new Set(regData.map(r => r.region))).sort() as string[];
          setListaRegiones(regionesUnicas);
        }
      } catch (err) {
        console.error("Error cargando filtros:", err);
      }
    };
    cargarFiltros();
  }, []);

  // --- CONSULTA SERVER-SIDE A SUPABASE ---
  const fetchCarreras = useCallback(async () => {
    setCargando(true);
    try {
      let query = supabase
        .from('carreras')
        .select(`
          codigo_carrera,
          nombre_carrera,
          region,
          duracion_semestres,
          arancel_anual,
          instituciones!inner (nombre, tipo, logo_url)
        `, { count: 'exact' });

      // 1. Filtro Texto
      if (busqueda.length >= 3) {
        const busquedaLimpia = quitarAcentos(busqueda);
        query = query.ilike('nombre_carrera', `%${busquedaLimpia}%`);
      }

      // 2. Filtro Tipo Institución
      if (tipoFiltro !== "Todos") {
        let tipoBD = "";
        if (tipoFiltro === "U") tipoBD = "Universidades";
        if (tipoFiltro === "IP") tipoBD = "Institutos Profesionales";
        if (tipoFiltro === "CFT") tipoBD = "Centros de Formación Técnica";
        if (tipoBD) query = query.eq('instituciones.tipo', tipoBD);
      }

      // 3. Filtro Institución Específica
      if (institucionFiltro !== "todas") {
        query = query.eq('instituciones.nombre', institucionFiltro);
      }

      // 4. Filtro Región
      if (regionFiltro !== "todas") {
        query = query.eq('region', regionFiltro);
      }

      // 5. Filtro Arancel y Orden
      const opcionArancel = OPCIONES_ORDEN.find(o => o.id === orden);
      if (opcionArancel && orden.startsWith("arancel_")) {
        query = query.gte('arancel_anual', opcionArancel.min || 0);
        query = query.lte('arancel_anual', opcionArancel.max || 99999999);
      }

      if (orden === "nombre_desc") {
        query = query.order('nombre_carrera', { ascending: false });
      } else {
        query = query.order('nombre_carrera', { ascending: true });
      }

      // 6. Paginación y Ejecución
      const from = (paginaActual - 1) * RESULTADOS_POR_PAGINA;
      const to = from + RESULTADOS_POR_PAGINA - 1;
      const { data, count, error } = await query.range(from, to);

      if (error) throw error;
      if (count !== null) setTotalResultados(count);

      if (data) {
        const bdData = data as unknown as SupabaseCarreraJoin[];
        const resultadosAdaptados: CarreraUI[] = bdData.map((item, index) => {
          const instObj = Array.isArray(item.instituciones) ? item.instituciones[0] : item.instituciones;
          const instNombre = instObj?.nombre || "Institución Desconocida";
          const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(instNombre)}&background=f4f5f9&color=6544ff&bold=true&size=128`;
          
          // ============================================================
          // 🔧 AJUSTE PRECISO PARA CARGAR LOGOS DESDE SUPABASE STORAGE
          // ============================================================
          let logoUrl = "";
          const rawLogo = instObj?.logo_url;
          if (rawLogo) {
            if (rawLogo.startsWith("http")) {
              logoUrl = rawLogo;
            } else {
              const bucket = "logos_instituciones";
              // Usar variable pública de Astro (PUBLIC_SUPABASE_URL)
              // @ts-ignore - import.meta.env es provisto por Astro
              const baseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
              if (!baseUrl) {
                console.error("⚠️ No se encontró la URL pública de Supabase. Define PUBLIC_SUPABASE_URL en tu .env");
                logoUrl = ""; // Forzará el fallback
              } else {
                logoUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${rawLogo}`;
              }
            }
          }
          
          return {
            id: item.codigo_carrera,
            nombre: formatearTitulo(item.nombre_carrera),
            sigla: generarSiglaInstitucion(instNombre),
            institucion: formatearTitulo(instNombre),
            tipoInst: generarTipoInst(instObj?.tipo || null),
            region: item.region || "No informada",
            puntaje: item.arancel_anual ? `$${item.arancel_anual.toLocaleString('es-CL')}` : "Arancel no informado",
            duracion: item.duracion_semestres ? `${item.duracion_semestres} Semestres` : "Duración no informada",
            color: PALETA_COLORES[index % PALETA_COLORES.length],
            logoUrl: logoUrl || fallbackLogo
          };
        });
        setCarreras(resultadosAdaptados);
      }
    } catch (err) {
      console.error("Error consultando Supabase:", err);
    } finally {
      setCargando(false);
    }
  }, [busqueda, tipoFiltro, regionFiltro, institucionFiltro, paginaActual, orden]);

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchCarreras(); }, 300); 
    return () => clearTimeout(timeoutId);
  }, [fetchCarreras]);

  const handleLogoError = (id: number) => {
    if (!erroresLogos.includes(id)) {
      setErroresLogos((prev) => [...prev, id]);
    }
  };

  const handleNavegarACarrera = (e: React.MouseEvent<HTMLAnchorElement>, id: number) => {
    e.preventDefault();
    setNavegandoA(id);
    setTimeout(() => {
      window.location.href = `/carrera/${id}`;
    }, 400); 
  };

  const totalPaginas = Math.ceil(totalResultados / RESULTADOS_POR_PAGINA);

  const generarArregloPaginacion = () => {
    const paginas: (number | string)[] = [];
    if (totalPaginas <= 5) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      if (paginaActual <= 3) paginas.push(1, 2, 3, '...', totalPaginas);
      else if (paginaActual >= totalPaginas - 2) paginas.push(1, '...', totalPaginas - 2, totalPaginas - 1, totalPaginas);
      else paginas.push(1, '...', paginaActual, '...', totalPaginas);
    }
    return paginas;
  };

  // --- DATOS ESTRUCTURADOS SEO ---
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": carreras.length,
    "itemListElement": carreras.map((carrera, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Course",
        "name": carrera.nombre,
        "description": `Carrera de ${carrera.nombre} impartida por ${carrera.institucion} en ${carrera.region}. Duración: ${carrera.duracion}. Arancel: ${carrera.puntaje}.`,
        "provider": {
          "@type": "EducationalOrganization",
          "name": carrera.institucion,
          "logo": carrera.logoUrl
        }
      }
    }))
  };

  return (
    <main className="w-full bg-[#F4F5F9] min-h-screen pb-20 selection:bg-[#7C3AED] selection:text-white overflow-hidden">
      
      {/* INYECCIÓN JSON-LD SEO */}
      {carreras.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      )}

      {/* =========================================================================
          1. HERO SECTION (BANNER UNIFICADO IDENTICO A INSTITUCIONES)
      ========================================================================= */}
      <header className="relative w-full bg-[#0A0518] text-white pt-20 pb-32 px-6 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <nav className="container mx-auto relative z-10 max-w-7xl" aria-label="Navegación superior">
          <button 
            onClick={() => window.history.back()} 
            aria-label="Volver a la página anterior"
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-10 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer animate-fade-in-up"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" aria-hidden="true" />
            Volver
          </button>
        </nav>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-[#D8B4FE] font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md animate-fade-in-up">
            <GraduationCap className="w-4 h-4" aria-hidden="true" /> Oferta Académica Nacional
          </div>

          <h1 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-4 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Encuentra tu <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">Carrera Ideal</span>
          </h1>

          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed mb-6" style={{ animationDelay: '0.2s' }}>
            Busca y compara miles de carreras, filtra por arancel, sede o tipo de institución para tomar la mejor decisión.
          </p>
        </div>
      </header>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO (Buscador, Filtros y Lista)
      ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 relative z-30 -mt-12" aria-label="Sección de búsqueda y resultados">
        
        {/* BUSCADOR PREMIUM FLOTANTE */}
        <search className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-3 shadow-2xl shadow-indigo-900/10 border border-white mb-10 flex flex-col md:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-8">
          <div className="flex-1 w-full relative flex items-center group">
            <Search className="absolute left-6 w-5 h-5 text-gray-400 group-focus-within:text-[#6544FF] transition-colors" aria-hidden="true" />
            <input 
              type="search" 
              placeholder="Ej: Enfermería, Computación, Derecho..."
              aria-label="Buscar por nombre de carrera"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
              className="w-full pl-14 pr-12 py-4 rounded-[1.5rem] bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:border-[#6544FF]/30 focus:bg-white focus:ring-4 focus:ring-[#6544FF]/10 outline-none transition-all font-semibold text-gray-700 placeholder:text-gray-400 text-base md:text-lg"
            />
            {busqueda && (
              <button 
                onClick={() => { setBusqueda(""); setPaginaActual(1); }}
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
                className="absolute right-5 text-gray-400 hover:text-rose-500 transition-colors p-1.5 bg-white hover:bg-rose-50 rounded-full shadow-sm border border-gray-100"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="hidden md:flex items-center px-8 border-l-2 border-gray-100 shrink-0 h-10" aria-live="polite">
            <p className="text-sm font-bold text-gray-400 tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#1A1528] text-2xl">{totalResultados}</span> resultados
            </p>
          </div>
        </search>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDEBAR: PANEL DE CONTROL COMPLETO */}
          <aside className="w-full lg:w-80 shrink-0 relative lg:sticky lg:top-24 z-30 animate-in fade-in slide-in-from-bottom-8 delay-150" aria-label="Filtros de búsqueda">
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100/80">
              <h2 className="font-black text-lg text-[#1A1528] uppercase tracking-wider mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                <SlidersHorizontal className="w-5 h-5 text-[#6544FF]" aria-hidden="true" /> Filtros
              </h2>

              {/* FILTRO 1: TIPO DE INSTITUCIÓN (SELECTOR HORIZONTAL) */}
              <fieldset className="relative mb-6 mt-2">
                <legend className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Tipo de Institución</legend>
                <div className="flex items-center bg-gray-100/80 p-1.5 rounded-2xl w-full border border-gray-200/50" role="group" aria-label="Filtrar por tipo de institución">
                  {[
                    { id: "Todos", label: "Todos" },
                    { id: "U", label: "U", title: "Universidades" },
                    { id: "IP", label: "IP", title: "Institutos Profesionales" },
                    { id: "CFT", label: "CFT", title: "Centros de Formación Técnica" }
                  ].map((opc) => (
                    <button
                      key={opc.id}
                      onClick={() => { setTipoFiltro(opc.id); setPaginaActual(1); }}
                      aria-pressed={tipoFiltro === opc.id}
                      title={opc.title || opc.label}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                        tipoFiltro === opc.id
                          ? 'bg-white text-[#6544FF] shadow-sm ring-1 ring-black/5'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      {opc.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* FILTRO 2: UBICACIÓN */}
              <div className="relative mb-6">
                <span id="region-filter-label" className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Sede / Región</span>
                <button 
                  onClick={() => setDropdownRegionAbierto(!dropdownRegionAbierto)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownRegionAbierto}
                  aria-labelledby="region-filter-label"
                  className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownRegionAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-[#6544FF]/70 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-semibold text-sm text-[#1A1528] text-left whitespace-nowrap overflow-hidden text-ellipsis">
                      {formatRegionLabel(regionFiltro)}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownRegionAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} aria-hidden="true" />
                </button>
                
                {dropdownRegionAbierto && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownRegionAbierto(false)} aria-hidden="true"></div>
                    <div role="listbox" aria-labelledby="region-filter-label" className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                      <button 
                        role="option" 
                        aria-selected={regionFiltro === "todas"}
                        onClick={() => { setRegionFiltro("todas"); setPaginaActual(1); setDropdownRegionAbierto(false); }} 
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${regionFiltro === "todas" ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}
                      >
                        <span className="whitespace-normal break-words leading-tight">Todas las Regiones</span>
                        {regionFiltro === "todas" && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
                      </button>
                      {listaRegiones.map((reg) => (
                        <button 
                          key={reg} 
                          role="option" 
                          aria-selected={regionFiltro === reg}
                          onClick={() => { setRegionFiltro(reg); setPaginaActual(1); setDropdownRegionAbierto(false); }} 
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${regionFiltro === reg ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}
                        >
                          <span className="whitespace-normal break-words leading-tight">{formatRegionLabel(reg)}</span>
                          {regionFiltro === reg && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* FILTRO 3: INSTITUCIÓN ESPECÍFICA */}
              <div className="relative mb-6">
                <span id="inst-filter-label" className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Filtrar Institución</span>
                <button 
                  onClick={() => setDropdownInstitucionAbierto(!dropdownInstitucionAbierto)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownInstitucionAbierto}
                  aria-labelledby="inst-filter-label"
                  className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownInstitucionAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Building className="w-4 h-4 text-[#6544FF]/70 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-semibold text-sm text-[#1A1528] text-left whitespace-nowrap overflow-hidden text-ellipsis">
                      {institucionFiltro === "todas" ? "Todas las Instituciones" : formatearTitulo(institucionFiltro)}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownInstitucionAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} aria-hidden="true" />
                </button>
                
                {dropdownInstitucionAbierto && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownInstitucionAbierto(false)} aria-hidden="true"></div>
                    <div role="listbox" aria-labelledby="inst-filter-label" className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                      <button 
                        role="option"
                        aria-selected={institucionFiltro === "todas"}
                        onClick={() => { setInstitucionFiltro("todas"); setPaginaActual(1); setDropdownInstitucionAbierto(false); }} 
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${institucionFiltro === "todas" ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}
                      >
                        <span className="whitespace-normal break-words leading-tight">Todas las Instituciones</span>
                        {institucionFiltro === "todas" && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
                      </button>
                      {listaInstituciones.map((inst, idx) => (
                        <button 
                          key={idx} 
                          role="option"
                          aria-selected={institucionFiltro === inst.nombre}
                          onClick={() => { setInstitucionFiltro(inst.nombre); setPaginaActual(1); setDropdownInstitucionAbierto(false); }} 
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${institucionFiltro === inst.nombre ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}
                        >
                          <span className="whitespace-normal break-words leading-tight pr-2">{formatearTitulo(inst.nombre)}</span>
                          {institucionFiltro === inst.nombre && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* FILTRO 4: ORDENAR Y PRECIO */}
              <div className="relative mb-4">
                <span id="order-filter-label" className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Ordenar y Precio</span>
                <button 
                  onClick={() => setDropdownOrdenAbierto(!dropdownOrdenAbierto)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOrdenAbierto}
                  aria-labelledby="order-filter-label"
                  className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownOrdenAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Calculator className="w-4 h-4 text-[#6544FF]/70 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-semibold text-sm text-[#1A1528] text-left whitespace-nowrap overflow-hidden text-ellipsis">
                      {OPCIONES_ORDEN.find(o => o.id === orden)?.label}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownOrdenAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} aria-hidden="true" />
                </button>
                
                {dropdownOrdenAbierto && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOrdenAbierto(false)} aria-hidden="true"></div>
                    <div role="listbox" aria-labelledby="order-filter-label" className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                      {OPCIONES_ORDEN.map((opc) => (
                        <button 
                          key={opc.id} 
                          role="option"
                          aria-selected={orden === opc.id}
                          onClick={() => { setOrden(opc.id); setPaginaActual(1); setDropdownOrdenAbierto(false); }} 
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${orden === opc.id ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}
                        >
                          <span className="whitespace-normal break-words leading-tight">{opc.label}</span>
                          {orden === opc.id && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>
          </aside>

          {/* LISTA DE CARRERAS (BENTO CARDS GEMELAS A INSTITUCIONES) */}
          <div className="flex-1 w-full space-y-6" aria-live="polite">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-2 animate-in fade-in gap-4 relative z-20">
              <p className="font-bold text-gray-500 text-xl flex items-center gap-2">
                {cargando ? <><Loader2 className="w-6 h-6 animate-spin text-[#6544FF]" aria-hidden="true" /> Buscando...</> : <>Mostrando <span className="text-[#6544FF]">{carreras.length}</span> de <span className="text-[#6544FF]">{totalResultados}</span> carreras</>}
              </p>
            </div>

            {!cargando && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {carreras.map((carrera, i) => (
                  <article key={`${carrera.id}-${paginaActual}`}>
                    <a 
                      href={`/carrera/${carrera.id}`}
                      onClick={(e) => handleNavegarACarrera(e, carrera.id)}
                      aria-label={`Ver detalles de la carrera ${carrera.nombre} impartida por ${carrera.institucion}`}
                      title={`Ver detalles de ${carrera.nombre}`}
                      className={`group relative flex flex-col bg-white rounded-[2.5rem] p-[2px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500 ease-out h-full cursor-pointer
                        ${navegandoA === carrera.id 
                          ? 'scale-[0.98] opacity-90 z-50' 
                          : 'hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]'
                        }`}
                      style={{ animationDelay: `${(i % 10) * 50}ms` }}
                    >
                      
                      {/* --- BORDE CON GRADIENTE SUTIL (visible solo en hover) --- */}
                      <div className={`absolute inset-0 rounded-[2.5rem] bg-gradient-to-br ${carrera.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} aria-hidden="true"></div>

                      {/* --- CONTENIDO INTERNO DE LA CARD --- */}
                      <div className="relative flex flex-col bg-white rounded-[2.4rem] p-6 h-full z-10">
                        
                        {/* --- CAPA DE ANIMACIÓN DE CARGA --- */}
                        {navegandoA === carrera.id && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 rounded-[2.3rem]">
                            <div className="relative mb-3">
                              <div className="absolute inset-0 bg-[#6544FF] blur-xl opacity-40 rounded-full animate-pulse" aria-hidden="true"></div>
                              <Loader2 className="w-12 h-12 text-[#6544FF] animate-spin relative z-10" aria-hidden="true" />
                            </div>
                            <span className="font-bold text-lg text-[#1A1528] tracking-tight animate-pulse">
                              Accediendo...
                            </span>
                          </div>
                        )}

                        {/* FX Luces Fondo sutiles */}
                        <div className={`absolute -right-20 -top-40 w-[25rem] h-[25rem] bg-gradient-to-br ${carrera.color} rounded-full opacity-[0.04] blur-[100px] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none`} aria-hidden="true"></div>

                        {/* ============================================
                            1. FILA SUPERIOR: LOGO + BADGES
                        ============================================ */}
                        <div className="relative z-10 flex items-center gap-4 mb-5">
                          {/* Logo institucional */}
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 shrink-0 group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] group-hover:-translate-y-0.5 transition-all duration-500">
                            {erroresLogos.includes(carrera.id) ? (
                              <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${carrera.color}`}>
                                <span className="text-white font-black text-base tracking-tighter">
                                  {carrera.sigla}
                                </span>
                              </div>
                            ) : (
                              <img 
                                src={carrera.logoUrl} 
                                alt={`Logotipo de ${carrera.institucion}`} 
                                loading="lazy"
                                className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500 ease-out" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(carrera.institucion)}&background=f4f5f9&color=6544ff&bold=true&size=128`;
                                  handleLogoError(carrera.id);
                                }} 
                              />
                            )}
                          </div>

                          {/* Badges: Tipo + Región */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r ${carrera.color} text-white shadow-sm`}>
                              {carrera.tipoInst}
                            </span>
                            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center gap-1.5">
                              <MapPin className="w-3 h-3" aria-hidden="true" /> 
                              {carrera.region}
                            </span>
                          </div>
                        </div>

                        {/* ============================================
                            2. NOMBRE DE LA CARRERA
                        ============================================ */}
                        <div className="relative z-10 mb-4">
                          <h3 className="text-lg font-bold text-[#1A1528] tracking-normal group-hover:text-[#6544FF] transition-colors duration-300 line-clamp-2 leading-relaxed">
                            {carrera.nombre}
                          </h3>
                        </div>

                        {/* ============================================
                            3. INSTITUCIÓN
                        ============================================ */}
                        <div className="relative z-10 flex items-center gap-2 mb-5 text-sm text-slate-500">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="font-medium truncate">{carrera.institucion}</span>
                        </div>

                        {/* ============================================
                            4. MÉTRICAS: ARANCEL + DURACIÓN
                        ============================================ */}
                        <div className="relative z-10 grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-100">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Calculator className="w-3 h-3" aria-hidden="true" /> Arancel
                            </span>
                            <span className="text-sm font-bold text-slate-800 truncate">
                              {carrera.puntaje}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3" aria-hidden="true" /> Duración
                            </span>
                            <span className="text-sm font-bold text-slate-800 truncate">
                              {carrera.duracion}
                            </span>
                          </div>
                        </div>

                      </div>
                    </a>
                  </article>
                ))}
              </div>
            )}

            {/* PAGINACIÓN EXACTAMENTE IGUAL AL DE INSTITUCIONES */}
            {!cargando && totalPaginas > 1 && (
              <nav aria-label="Paginación de resultados" className="flex flex-wrap items-center justify-center gap-2 mt-10 mb-8 animate-in fade-in duration-500">
                <button 
                  onClick={() => { setPaginaActual(p => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }} 
                  disabled={paginaActual === 1} 
                  aria-label="Página anterior"
                  className="w-10 h-10 rounded-2xl border-2 border-gray-200 text-[#1A1528] flex items-center justify-center disabled:opacity-30 hover:bg-[#6544FF]/10 hover:border-[#6544FF]/30 hover:text-[#6544FF] transition-all"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>
                {generarArregloPaginacion().map((pagina, index) => (
                  <button
                    key={index}
                    onClick={() => { if (typeof pagina === 'number') { setPaginaActual(pagina); window.scrollTo({ top: 400, behavior: 'smooth' }); } }}
                    aria-label={typeof pagina === 'number' ? `Ir a la página ${pagina}` : 'Puntos suspensivos'}
                    aria-current={pagina === paginaActual ? "page" : undefined}
                    disabled={pagina === '...'}
                    className={`w-10 h-10 rounded-2xl font-black text-sm transition-all ${pagina === paginaActual ? 'bg-[#6544FF] text-white scale-105 border-transparent shadow-md' : pagina === '...' ? 'bg-transparent border-none text-gray-400 cursor-default' : 'bg-white border-2 border-gray-200 text-slate-600 hover:border-[#6544FF]/50 hover:text-[#6544FF]'}`}
                  >
                    {pagina}
                  </button>
                ))}
                <button 
                  onClick={() => { setPaginaActual(p => Math.min(totalPaginas, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }} 
                  disabled={paginaActual === totalPaginas} 
                  aria-label="Página siguiente"
                  className="w-10 h-10 rounded-2xl border-2 border-gray-200 text-[#1A1528] flex items-center justify-center disabled:opacity-30 hover:bg-[#6544FF]/10 hover:border-[#6544FF]/30 hover:text-[#6544FF] transition-all"
                >
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </nav>
            )}

            {/* FALLBACK NO ENCONTRADO - IDENTICO A INSTITUCIONES */}
            {!cargando && carreras.length === 0 && (
              <div className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-gray-300 shadow-sm animate-in fade-in duration-500" role="alert">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                <h3 className="font-black text-2xl text-slate-700 mb-2">No encontramos carreras</h3>
                <p className="text-slate-500 text-sm font-medium">No hay resultados para tu búsqueda. Prueba con otros filtros.</p>
                <button 
                  onClick={() => { setTipoFiltro("Todos"); setRegionFiltro("todas"); setInstitucionFiltro("todas"); setBusqueda(""); }} 
                  aria-label="Restablecer todos los filtros de búsqueda"
                  className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}} />
    </main>
  );
}