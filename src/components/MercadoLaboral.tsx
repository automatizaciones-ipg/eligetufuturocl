// src/components/MercadoLaboral.tsx
'use client';

import { useState, useEffect } from "react";
import { 
  TrendingUp, Briefcase, DollarSign,
  BarChart, ArrowLeft, Loader2, ChevronLeft, ChevronRight,
  Star
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ============================================================================
// INTERFACES (Tipado Estricto)
// ============================================================================
interface CarreraDB {
  id: number;
  codigo_carrera: string | number;
  nombre_carrera: string;
  empleabilidad_1er_anio: number | null;
  ingreso_promedio_4to_anio: string | null;
  arancel_anual: number | null;
  instituciones: {
    nombre: string;
    tipo: string;
    logo_url?: string;
  } | {
    nombre: string;
    tipo: string;
    logo_url?: string;
  }[] | null;
}

interface TemaCarrera {
  borderHover: string;
  textGradient: string;
  textAccent: string;
  bgBadge: string;
  textBadge: string;
  darkBox: string;
  barGradient: string;
  lightBg: string;
  badgeTipoFondo: string;
  badgeTipoTexto: string;
}

interface CarreraUI {
  id: number;
  codigo_carrera: string | number;
  carrera: string;
  institucion: string;
  tipoInst: string;
  tipoInstCompleto: string;
  empleabilidad: number;
  arancel: string;
  ingreso: string;
  logoUrl: string;
  sigla: string;
  tema: TemaCarrera;
}

// ============================================================================
// CONSTANTES
// ============================================================================
const TIPOS_INSTITUCION = [
  { id: "todo", label: "Todas las Instituciones" },
  { id: "Universidades", label: "Universidades" },
  { id: "Institutos Profesionales", label: "Institutos Profesionales" },
  { id: "Centros de Formación Técnica", label: "Centros de Formación" }
];

const ITEMS_POR_PAGINA = 12;

// ============================================================================
// HELPERS
// ============================================================================
const generarSiglaInstitucion = (nombre: string): string => {
  if (!nombre) return "N/A";
  const palabras = nombre
    .replace(/\b(de|en|el|la|los|las|y)\b/gi, '')
    .split(' ')
    .filter(p => p.trim().length > 0);
  if (palabras.length > 1) {
    return (palabras[0][0] + (palabras[1]?.[0] || '') + (palabras[2]?.[0] || ''))
      .toUpperCase()
      .substring(0, 3);
  }
  return nombre.substring(0, 3).toUpperCase();
};

const obtenerTipoInstCompleto = (tipo: string): string => {
  if (!tipo) return "Institución";
  if (tipo.includes("Universidad")) return "Universidades";
  if (tipo.includes("Instituto")) return "Institutos Profesionales";
  if (tipo.includes("Centro")) return "Centros de Formación Técnica";
  return tipo;
};

// ============================================================================
// SISTEMA DE TEMAS POR ÁREA DE CONOCIMIENTO (TailwindCSS Puro)
// ============================================================================
const obtenerTemaPorCarrera = (nombre: string): TemaCarrera => {
  const n = nombre.toLowerCase();
  
  // Salud / Medicina
  if (/medicina|enfermería|salud|obstetricia|odontología|kinesiología|fonoaudiología|nutrición|terapia|farmacia|bioquímica|biomedicina|clínica|médico|quirúrgica|pediatría|geriatría|psiquiatría|radiología|veterinaria/i.test(n)) {
    return {
      borderHover: 'hover:border-rose-400/50 hover:shadow-[0_20px_50px_rgba(251,113,133,0.15)]',
      textGradient: 'bg-gradient-to-r from-rose-500 to-pink-500 text-transparent bg-clip-text',
      textAccent: 'text-rose-500',
      bgBadge: 'bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100',
      textBadge: 'text-rose-700',
      darkBox: 'bg-[#2E0F1C]',
      barGradient: 'bg-gradient-to-r from-rose-400 to-pink-500',
      lightBg: 'bg-gradient-to-br from-rose-50/80 to-pink-50/30',
      badgeTipoFondo: 'bg-rose-600',
      badgeTipoTexto: 'text-white',
    };
  }
  
  // Ingeniería / Tecnología
  if (/ingeniería|ingeniero|computación|informática|software|sistemas|eléctrica|electrónica|mecánica|industrial|civil|telecomunicaciones|robótica|automatización|datos|programación|desarrollo|redes|tecnología|información/i.test(n)) {
    return {
      borderHover: 'hover:border-blue-400/50 hover:shadow-[0_20px_50px_rgba(96,165,250,0.15)]',
      textGradient: 'bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text',
      textAccent: 'text-blue-500',
      bgBadge: 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100',
      textBadge: 'text-blue-700',
      darkBox: 'bg-[#0A1931]',
      barGradient: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      lightBg: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/30',
      badgeTipoFondo: 'bg-blue-600',
      badgeTipoTexto: 'text-white',
    };
  }
  
  // Negocios / Administración
  if (/administración|contador|auditor|economía|negocios|comercio|marketing|finanzas|recursos humanos|contabilidad|gestión|emprendimiento|banca|logística|comercial/i.test(n)) {
    return {
      borderHover: 'hover:border-amber-400/50 hover:shadow-[0_20px_50px_rgba(251,191,36,0.15)]',
      textGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text',
      textAccent: 'text-orange-500',
      bgBadge: 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100',
      textBadge: 'text-orange-700',
      darkBox: 'bg-[#2A1700]',
      barGradient: 'bg-gradient-to-r from-amber-400 to-orange-500',
      lightBg: 'bg-gradient-to-br from-amber-50/80 to-orange-50/30',
      badgeTipoFondo: 'bg-amber-600',
      badgeTipoTexto: 'text-white',
    };
  }
  
  // Derecho / Ciencias Sociales / Humanidades
  if (/derecho|leyes|jurídica|abogado|ciencia política|sociología|antropología|filosofía|historia|letras|literatura|periodismo|comunicación|relaciones públicas|trabajo social|servicio social|psicología|pedagogía|educación|docencia|enseñanza|profesor|parvul/i.test(n)) {
    return {
      borderHover: 'hover:border-violet-400/50 hover:shadow-[0_20px_50px_rgba(167,139,250,0.15)]',
      textGradient: 'bg-gradient-to-r from-violet-600 to-purple-500 text-transparent bg-clip-text',
      textAccent: 'text-violet-500',
      bgBadge: 'bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100',
      textBadge: 'text-violet-700',
      darkBox: 'bg-[#1C0F2E]',
      barGradient: 'bg-gradient-to-r from-violet-500 to-purple-500',
      lightBg: 'bg-gradient-to-br from-violet-50/80 to-purple-50/30',
      badgeTipoFondo: 'bg-violet-600',
      badgeTipoTexto: 'text-white',
    };
  }
  
  // Ciencias / Matemáticas / Naturales
  if (/química|física|biología|matemática|estadística|geología|astronomía|geofísica|ambiental|recursos naturales|agronomía|forestal|oceanografía|meteorología/i.test(n)) {
    return {
      borderHover: 'hover:border-emerald-400/50 hover:shadow-[0_20px_50px_rgba(52,211,153,0.15)]',
      textGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-transparent bg-clip-text',
      textAccent: 'text-emerald-500',
      bgBadge: 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100',
      textBadge: 'text-emerald-700',
      darkBox: 'bg-[#022C22]',
      barGradient: 'bg-gradient-to-r from-emerald-400 to-teal-400',
      lightBg: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/30',
      badgeTipoFondo: 'bg-emerald-600',
      badgeTipoTexto: 'text-white',
    };
  }
  
  // Arte / Diseño / Creatividad
  if (/arte|diseño|música|teatro|danza|cinematografía|audiovisual|animación|fotografía|arquitectura|ilustración|gráfico|multimedia|creativo/i.test(n)) {
    return {
      borderHover: 'hover:border-fuchsia-400/50 hover:shadow-[0_20px_50px_rgba(232,121,249,0.15)]',
      textGradient: 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-transparent bg-clip-text',
      textAccent: 'text-fuchsia-500',
      bgBadge: 'bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-100',
      textBadge: 'text-fuchsia-700',
      darkBox: 'bg-[#2A0A2E]',
      barGradient: 'bg-gradient-to-r from-fuchsia-400 to-pink-500',
      lightBg: 'bg-gradient-to-br from-fuchsia-50/80 to-pink-50/30',
      badgeTipoFondo: 'bg-fuchsia-600',
      badgeTipoTexto: 'text-white',
    };
  }
  
  // Hotelería / Turismo / Gastronomía
  if (/hotelería|turismo|gastronomía|chef|cocina|pastelería|hospitalidad|eventos|viajes/i.test(n)) {
    return {
      borderHover: 'hover:border-yellow-400/50 hover:shadow-[0_20px_50px_rgba(250,204,21,0.15)]',
      textGradient: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-transparent bg-clip-text',
      textAccent: 'text-yellow-600',
      bgBadge: 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100',
      textBadge: 'text-yellow-700',
      darkBox: 'bg-[#2A2000]',
      barGradient: 'bg-gradient-to-r from-yellow-400 to-amber-400',
      lightBg: 'bg-gradient-to-br from-yellow-50/80 to-amber-50/30',
      badgeTipoFondo: 'bg-yellow-600',
      badgeTipoTexto: 'text-white',
    };
  }
  
  // Deportes / Actividad Física
  if (/deporte|educación física|entrenamiento|preparador físico|recreación/i.test(n)) {
    return {
      borderHover: 'hover:border-green-400/50 hover:shadow-[0_20px_50px_rgba(74,222,128,0.15)]',
      textGradient: 'bg-gradient-to-r from-green-500 to-lime-500 text-transparent bg-clip-text',
      textAccent: 'text-green-500',
      bgBadge: 'bg-gradient-to-r from-green-50 to-lime-50 border border-green-100',
      textBadge: 'text-green-700',
      darkBox: 'bg-[#0A2E0A]',
      barGradient: 'bg-gradient-to-r from-green-400 to-lime-400',
      lightBg: 'bg-gradient-to-br from-green-50/80 to-lime-50/30',
      badgeTipoFondo: 'bg-green-600',
      badgeTipoTexto: 'text-white',
    };
  }
  
  // Construcción / Oficios
  if (/construcción|topografía|minería|metalurgia|mecánica automotriz|eléctrica industrial|soldadura|carpintería|albañilería|gasfitería|refrigeración|climatización|seguridad|prevención/i.test(n)) {
    return {
      borderHover: 'hover:border-stone-400/50 hover:shadow-[0_20px_50px_rgba(168,162,158,0.15)]',
      textGradient: 'bg-gradient-to-r from-stone-600 to-neutral-500 text-transparent bg-clip-text',
      textAccent: 'text-stone-500',
      bgBadge: 'bg-gradient-to-r from-stone-50 to-neutral-50 border border-stone-100',
      textBadge: 'text-stone-700',
      darkBox: 'bg-[#1C1917]',
      barGradient: 'bg-gradient-to-r from-stone-400 to-neutral-400',
      lightBg: 'bg-gradient-to-br from-stone-50/80 to-neutral-50/30',
      badgeTipoFondo: 'bg-stone-600',
      badgeTipoTexto: 'text-white',
    };
  }
  
  // Default: Violeta institucional
  return {
    borderHover: 'hover:border-[#6544FF]/40 hover:shadow-[0_20px_50px_rgba(101,68,255,0.15)]',
    textGradient: 'bg-gradient-to-r from-[#6544FF] to-[#3B82F6] text-transparent bg-clip-text',
    textAccent: 'text-[#6544FF]',
    bgBadge: 'bg-gradient-to-r from-[#EEECFF] to-blue-50 border border-[#6544FF]/10',
    textBadge: 'text-[#6544FF]',
    darkBox: 'bg-[#0F0A21]',
    barGradient: 'bg-gradient-to-r from-[#6544FF] to-[#3B82F6]',
    lightBg: 'bg-gradient-to-br from-[#6544FF]/5 to-[#3B82F6]/5',
    badgeTipoFondo: 'bg-[#6544FF]',
    badgeTipoTexto: 'text-white',
  };
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function MercadoLaboral() {
  const [filtroActivo, setFiltroActivo] = useState("todo");
  const [carrerasBD, setCarrerasBD] = useState<CarreraUI[]>([]);
  const [carrerasFiltradas, setCarrerasFiltradas] = useState<CarreraUI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [accediendoId, setAccediendoId] = useState<string | number | null>(null);
  const [erroresLogos, setErroresLogos] = useState<number[]>([]);
  const [animarBarras, setAnimarBarras] = useState(false);

  // ==========================================================================
  // BUG FIX: Limpiar "Accediendo..." al volver atrás (BFCache)
  // ==========================================================================
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setAccediendoId(null);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // ==========================================================================
  // FETCH A SUPABASE
  // ==========================================================================
  useEffect(() => {
    const fetchTopCarreras = async () => {
      setCargando(true);
      try {
        const { data, error } = await supabase
          .from('carreras')
          .select(`
            id,
            codigo_carrera,
            nombre_carrera,
            empleabilidad_1er_anio,
            ingreso_promedio_4to_anio,
            arancel_anual,
            instituciones!inner (
              nombre,
              tipo,
              logo_url
            )
          `)
          .not('empleabilidad_1er_anio', 'is', null)
          .not('ingreso_promedio_4to_anio', 'is', null)
          .order('empleabilidad_1er_anio', { ascending: false })
          .limit(200);

        if (error) throw error;

        if (data && data.length > 0) {
          const rawData = data as unknown as CarreraDB[];

          const nombresAgregados = new Set<string>();
          const carrerasUnicas: CarreraUI[] = [];

          for (const item of rawData) {
            const llave = item.nombre_carrera
              .trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9\s]/g, "")
              .replace(/\s+/g, " ");

            if (!nombresAgregados.has(llave)) {
              nombresAgregados.add(llave);
              
              const inst = Array.isArray(item.instituciones) ? item.instituciones[0] : item.instituciones;
              const instNombre = inst?.nombre || "No informada";
              const instTipo = inst?.tipo || "Universidades";
              const empleabilidadReal = item.empleabilidad_1er_anio
                ? Number((item.empleabilidad_1er_anio * 100).toFixed(1))
                : 0;
              const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(instNombre)}&background=f4f5f9&color=6544ff&bold=true&size=128`;

              carrerasUnicas.push({
                id: item.id,
                codigo_carrera: item.codigo_carrera,
                carrera: item.nombre_carrera.trim(),
                institucion: instNombre,
                tipoInst: instTipo,
                tipoInstCompleto: obtenerTipoInstCompleto(instTipo),
                empleabilidad: empleabilidadReal,
                arancel: item.arancel_anual ? `$${item.arancel_anual.toLocaleString('es-CL')}` : 'No informado',
                ingreso: item.ingreso_promedio_4to_anio || "No informado",
                logoUrl: inst?.logo_url || fallbackLogo,
                sigla: generarSiglaInstitucion(instNombre),
                tema: obtenerTemaPorCarrera(item.nombre_carrera),
              });
            }
          }

          setCarrerasBD(carrerasUnicas);
          setCarrerasFiltradas(carrerasUnicas);
          setTimeout(() => setAnimarBarras(true), 100);
        }
      } catch (err) {
        console.error("Error cargando mercado laboral:", err);
      } finally {
        setCargando(false);
      }
    };

    fetchTopCarreras();
  }, []);

  // ==========================================================================
  // FILTRADO LOCAL
  // ==========================================================================
  useEffect(() => {
    if (carrerasBD.length === 0) return;

    setCarrerasFiltradas([]);
    setAnimarBarras(false);
    setTimeout(() => {
      if (filtroActivo === "todo") {
        setCarrerasFiltradas(carrerasBD);
      } else {
        setCarrerasFiltradas(carrerasBD.filter(c => c.tipoInst === filtroActivo));
      }
      setPaginaActual(1);
      setTimeout(() => setAnimarBarras(true), 100);
    }, 50);
  }, [filtroActivo, carrerasBD]);

  // ==========================================================================
  // MANEJO DE IMÁGENES Y NAVEGACIÓN
  // ==========================================================================
  const handleLogoError = (id: number) => {
    if (!erroresLogos.includes(id)) {
      setErroresLogos((prev) => [...prev, id]);
    }
  };

  const handleNavegar = (e: React.MouseEvent, codigo: string | number) => {
    e.preventDefault();
    setAccediendoId(codigo);
    setTimeout(() => {
      window.location.href = `/carrera/${codigo}`;
    }, 400);
  };

  // ==========================================================================
  // PAGINACIÓN
  // ==========================================================================
  const indiceUltimoItem = paginaActual * ITEMS_POR_PAGINA;
  const indicePrimerItem = indiceUltimoItem - ITEMS_POR_PAGINA;
  const carrerasPaginadas = carrerasFiltradas.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(carrerasFiltradas.length / ITEMS_POR_PAGINA);

  const esVistaTopNacional = paginaActual === 1 && filtroActivo === "todo";

  const generarArregloPaginacion = () => {
    const paginas: (number | string)[] = [];
    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      if (paginaActual <= 3) {
        paginas.push(1, 2, 3, 4, '...', totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        paginas.push(1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
      } else {
        paginas.push(1, '...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas);
      }
    }
    return paginas;
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="w-full bg-[#F4F5F9] min-h-screen pb-20 selection:bg-[#7C3AED] selection:text-white overflow-hidden">
      
      {/* =========================================================================
          1. HERO SECTION
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-20 pb-40 px-6 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="container mx-auto relative z-10 max-w-6xl">
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-12 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer animate-fade-in-up"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-[#D8B4FE] font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md animate-fade-in-up">
            <TrendingUp className="w-4 h-4" /> Datos Oficiales Mineduc
          </div>

          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Top Empleabilidad <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">Mercado Laboral</span>
          </h2>

          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Toma decisiones informadas. Descubre las carreras con mayor empleabilidad real y proyección de sueldos en Chile (Datos actualizados SIES).
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO
      ========================================================================= */}
      <div className="w-full max-w-6xl mx-auto px-4 -mt-24 relative z-30">
        
        {/* WIDGET ESTADÍSTICO PREMIUM */}
        <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-[#6544FF]/20 mb-16 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.15)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner shrink-0 transition-all duration-300">
                {esVistaTopNacional ? <BarChart className="w-10 h-10 text-emerald-400" /> : <Briefcase className="w-10 h-10 text-emerald-400" />}
              </div>
              <div>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">
                  {esVistaTopNacional ? "Ranking Nacional Absoluto" : "Exploración General"}
                </p>
                <h3 className="font-black italic uppercase text-3xl text-white">
                  {esVistaTopNacional ? "Alta Demanda" : "Opciones Laborales"}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {esVistaTopNacional 
                    ? "El top de carreras con la mejor inserción laboral del país." 
                    : "Explorando alternativas académicas con datos validados."}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 text-center items-center shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-32 backdrop-blur-sm">
                <span className="flex items-center justify-center gap-1 font-black text-4xl text-white mb-1">
                  TOP<TrendingUp className="w-5 h-5 text-emerald-400" />
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ranking SIES</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS DE FILTRADO */}
        <div className="w-full relative mb-12 animate-in fade-in duration-500 delay-300">
          <div className="flex overflow-x-auto hide-scrollbar justify-start md:justify-center gap-3 pb-4 snap-x">
            {TIPOS_INSTITUCION.map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => setFiltroActivo(tipo.id)}
                className={`shrink-0 whitespace-nowrap snap-center px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-sm flex items-center gap-2
                  ${filtroActivo === tipo.id 
                    ? "bg-[#1A1528] text-white scale-105 shadow-lg" 
                    : "bg-white text-gray-500 hover:text-[#1A1528] hover:bg-gray-50 border border-gray-100"
                  }`}
              >
                {tipo.label}
              </button>
            ))}
          </div>
        </div>

        {/* ESTADO DE CARGA */}
        {cargando && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#6544FF] animate-spin mb-4" />
            <p className="font-bold text-gray-500">Consultando datos oficiales...</p>
          </div>
        )}

        {/* ================================================================
            GRID DE CARDS 3x3 - TAMAÑOS COMPACTOS Y LEGIBLES
        ================================================================ */}
        {!cargando && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {carrerasPaginadas.map((carrera, i) => {
              const esCarreraTop = carrera.empleabilidad >= 90.0;

              return (
                <article 
                  key={`${carrera.id}-${paginaActual}`}
                  style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 50}ms both` }}
                >
                  <a
                    href={`/carrera/${carrera.codigo_carrera}`}
                    onClick={(e) => handleNavegar(e, carrera.codigo_carrera)}
                    className={`group relative flex flex-col bg-white rounded-[2.5rem] p-5 border border-gray-100/80 shadow-[0_10px_35px_rgba(0,0,0,0.03)] transition-all duration-300 h-full cursor-pointer ${carrera.tema.borderHover} hover:-translate-y-1.5`}
                  >
                    
                    {/* Capa de carga */}
                    {accediendoId === carrera.codigo_carrera && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 rounded-[2.4rem]">
                        <div className="relative mb-3">
                          <div className="absolute inset-0 bg-[#6544FF] blur-xl opacity-40 rounded-full animate-pulse"></div>
                          <Loader2 className="w-10 h-10 text-[#6544FF] animate-spin relative z-10" />
                        </div>
                        <span className="font-bold text-base text-[#1A1528] tracking-tight animate-pulse">
                          Accediendo...
                        </span>
                      </div>
                    )}

                    {/* ============================================
                        CABECERA: BADGE TIPO + TOP
                    ============================================ */}
                    <header className="flex justify-between items-start mb-4 gap-2">
                      <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full ${carrera.tema.badgeTipoFondo} ${carrera.tema.badgeTipoTexto} shadow-sm`}>
                        {carrera.tipoInstCompleto}
                      </span>
                      {esCarreraTop && (
                        <span className="shrink-0 bg-gradient-to-r from-[#1A1528] to-[#2D2442] text-[#FACC15] text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-sm border border-[#FACC15]/20">
                          TOP <Star className="w-2.5 h-2.5 fill-[#FACC15]" aria-hidden="true" />
                        </span>
                      )}
                    </header>

                    {/* ============================================
                        TÍTULO + INSTITUCIÓN CON LOGO
                    ============================================ */}
                    <div className="mb-4">
                      <h3 className={`font-black text-base md:text-lg leading-tight mb-3 uppercase tracking-tight line-clamp-2 min-h-[2.5rem] ${carrera.tema.textGradient}`} title={`Carrera: ${carrera.carrera}`}>
                        {carrera.carrera}
                      </h3>
                      
                      {/* Bloque de Institución con Logo */}
                      <div className="flex items-center gap-2.5 bg-gray-50/70 rounded-2xl p-2.5 border border-gray-100 transition-all hover:bg-white hover:shadow-md hover:border-gray-200">
                        <div className="relative shrink-0">
                          <div className={`absolute inset-0 ${carrera.tema.barGradient} rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                          
                          <div className="relative w-11 h-11 bg-white rounded-xl p-1.5 flex items-center justify-center border border-gray-200 shadow-sm overflow-hidden z-10 transition-transform duration-500 group-hover:scale-[1.03]">
                            {erroresLogos.includes(carrera.id) ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-500 rounded-lg">
                                <span className="text-white font-black text-xs tracking-tighter">
                                  {carrera.sigla}
                                </span>
                              </div>
                            ) : (
                              <img 
                                src={carrera.logoUrl}
                                alt={`Logotipo oficial de ${carrera.institucion}`}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain rounded-lg transition-transform duration-300 drop-shadow-sm"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(carrera.institucion)}&background=f4f5f9&color=6544ff&bold=true&size=128`;
                                  handleLogoError(carrera.id);
                                }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden pr-1 min-w-0">
                          <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">
                            Impartido por
                          </span>
                          <p className="text-[11px] font-bold tracking-tight text-[#1A1528] uppercase truncate" title={`Institución: ${carrera.institucion}`}>
                            {carrera.institucion}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ============================================
                        SECCIÓN EMPLEABILIDAD
                    ============================================ */}
                    <div className={`rounded-2xl p-3.5 mb-4 border border-white/40 flex flex-col gap-2.5 ${carrera.tema.lightBg}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white rounded-lg shadow-sm border border-white/50">
                            <Briefcase className={`w-3 h-3 ${carrera.tema.textAccent}`} aria-hidden="true" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-600 leading-tight">
                            Empleabilidad 1er Año
                          </span>
                        </div>
                        <span className={`font-black text-lg tracking-tighter ${carrera.tema.textGradient}`}>
                          {carrera.empleabilidad}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden border border-white/50 shadow-inner" aria-hidden="true">
                        <div 
                          className={`h-full rounded-full ${carrera.tema.barGradient} transition-all duration-1000 ease-out`}
                          style={{ width: animarBarras ? `${carrera.empleabilidad}%` : '0%' }}
                        ></div>
                      </div>
                    </div>

                    {/* ============================================
                        MÓDULO FINANCIERO
                    ============================================ */}
                    <div className="grid grid-cols-5 gap-2.5 mb-4">
                      <div className="col-span-2 bg-white rounded-2xl p-3 border border-gray-200 flex flex-col justify-center">
                        <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                          Arancel
                        </span>
                        <span className="font-black text-[#1A1528] text-xs md:text-sm truncate" title={`Arancel anual: ${carrera.arancel}`}>
                          {carrera.arancel}
                        </span>
                      </div>

                      <div className={`col-span-3 ${carrera.tema.darkBox} rounded-2xl p-3 relative overflow-hidden flex flex-col justify-center shadow-inner`}>
                        <div className="absolute -right-2 -bottom-3 opacity-[0.06]">
                          <DollarSign className="w-14 h-14 text-white" aria-hidden="true" />
                        </div>
                        <span className="text-[8px] font-extrabold text-white/60 uppercase tracking-wider mb-1 relative z-10">
                          Sueldo Promedio
                        </span>
                        <span className="font-black text-white text-[10px] leading-tight tracking-tight relative z-10 block pr-1" title={`Ingreso promedio: ${carrera.ingreso}`}>
                          {carrera.ingreso}
                        </span>
                      </div>
                    </div>

                    {/* ============================================
                        FOOTER: FUENTE SIES
                    ============================================ */}
                    <footer className="mt-auto pt-3 border-t border-gray-100 flex justify-end items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        Fuente: SIES
                      </span>
                    </footer>

                  </a>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINACIÓN */}
        {!cargando && totalPaginas > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-14 mb-8">
            <button 
              onClick={() => { 
                setPaginaActual(p => Math.max(1, p - 1)); 
                window.scrollTo({ top: 400, behavior: 'smooth' }); 
              }} 
              disabled={paginaActual === 1} 
              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl border-2 border-gray-200 text-[#1A1528] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#6544FF]/10 hover:border-[#6544FF]/30 hover:text-[#6544FF] transition-all duration-300"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1 md:gap-2 mx-2">
              {generarArregloPaginacion().map((pagina, index) => {
                if (pagina === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="w-8 h-10 flex items-center justify-center text-gray-400 font-bold">
                      ...
                    </span>
                  );
                }
                
                const esPaginaActual = pagina === paginaActual;
                
                return (
                  <button
                    key={`page-${pagina}`}
                    onClick={() => {
                      setPaginaActual(pagina as number);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-sm md:text-base transition-all duration-300
                      ${esPaginaActual 
                        ? 'bg-[#6544FF] text-white shadow-md shadow-[#6544FF]/30 scale-105 border-transparent' 
                        : 'bg-white border-2 border-gray-200 text-slate-600 hover:border-[#6544FF]/50 hover:text-[#6544FF]'
                      }`}
                  >
                    {pagina}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => { 
                setPaginaActual(p => Math.min(totalPaginas, p + 1)); 
                window.scrollTo({ top: 400, behavior: 'smooth' }); 
              }} 
              disabled={paginaActual >= totalPaginas} 
              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl border-2 border-gray-200 text-[#1A1528] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#6544FF]/10 hover:border-[#6544FF]/30 hover:text-[#6544FF] transition-all duration-300"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {!cargando && carrerasFiltradas.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200 mt-6">
            <h3 className="font-bold text-xl text-gray-400">No se encontraron carreras con datos para este filtro.</h3>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
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
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}