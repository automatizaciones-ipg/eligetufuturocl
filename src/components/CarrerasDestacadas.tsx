import { useState, useEffect, useRef } from "react";
import { 
  Briefcase, 
  DollarSign, 
  ArrowUpRight, 
  Star,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- INTERFACES DE TYPESCRIPT ---
interface InstitucionDB {
  nombre: string;
  tipo: string;
  logo_url?: string;
}

interface CarreraDB {
  id: number;
  codigo_carrera: string | number;
  nombre_carrera: string;
  empleabilidad_1er_anio: number | null;
  ingreso_promedio_4to_anio: string | null;
  arancel_anual: number | null;
  es_promocionada?: boolean; 
  instituciones: InstitucionDB | InstitucionDB[] | null;
}

interface CarreraUI {
  id: number;
  codigo_carrera: string | number;
  carrera: string;
  institucion: string;
  tipoInst: string;
  logoInst: string;
  empleabilidad: number;
  arancel: string;
  ingreso: string;
  es_promocionada: boolean; 
  tema: {
    borderHover: string;
    textGradient: string;
    textAccent: string;
    bgBadge: string;
    textBadge: string;
    darkBox: string;
    barGradient: string;
    lightBg: string;
  };
}

// --- SISTEMA DE GRADIENTES PROFESIONALES POR ÁREA ---
const obtenerTemaPorCarrera = (nombre: string) => {
  const n = nombre.toLowerCase();
  
  if (n.includes('química') || n.includes('biología') || n.includes('ciencias') || n.includes('geología') || n.includes('física') || n.includes('agronomía')) {
    return {
      borderHover: 'hover:border-emerald-400/50 hover:shadow-[0_20px_50px_rgba(52,211,153,0.15)]',
      textGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-transparent bg-clip-text',
      textAccent: 'text-emerald-500',
      bgBadge: 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100',
      textBadge: 'text-emerald-700',
      darkBox: 'bg-[#022C22]', 
      barGradient: 'bg-gradient-to-r from-emerald-400 to-teal-400',
      lightBg: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/30'
    };
  }
  
  if (n.includes('medicina') || n.includes('enfermería') || n.includes('salud') || n.includes('obstetricia') || n.includes('odontología') || n.includes('kinesiología')) {
    return {
      borderHover: 'hover:border-rose-400/50 hover:shadow-[0_20px_50px_rgba(251,113,133,0.15)]',
      textGradient: 'bg-gradient-to-r from-rose-500 to-purple-500 text-transparent bg-clip-text',
      textAccent: 'text-rose-500',
      bgBadge: 'bg-gradient-to-r from-rose-50 to-purple-50 border border-rose-100',
      textBadge: 'text-rose-700',
      darkBox: 'bg-[#2E0F1C]', 
      barGradient: 'bg-gradient-to-r from-rose-400 to-purple-500',
      lightBg: 'bg-gradient-to-br from-rose-50/80 to-purple-50/30'
    };
  }
  
  if (n.includes('ingeniería') || n.includes('computación') || n.includes('datos') || n.includes('civil') || n.includes('arquitectura') || n.includes('software')) {
    return {
      borderHover: 'hover:border-blue-400/50 hover:shadow-[0_20px_50px_rgba(96,165,250,0.15)]',
      textGradient: 'bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text',
      textAccent: 'text-blue-500',
      bgBadge: 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100',
      textBadge: 'text-blue-700',
      darkBox: 'bg-[#0A1931]', 
      barGradient: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      lightBg: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/30'
    };
  }
  
  if (n.includes('comercial') || n.includes('administración') || n.includes('negocios') || n.includes('contabilidad') || n.includes('economía') || n.includes('finanzas')) {
    return {
      borderHover: 'hover:border-amber-400/50 hover:shadow-[0_20px_50px_rgba(251,191,36,0.15)]',
      textGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text',
      textAccent: 'text-orange-500',
      bgBadge: 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100',
      textBadge: 'text-orange-700',
      darkBox: 'bg-[#2A1700]', 
      barGradient: 'bg-gradient-to-r from-amber-400 to-orange-500',
      lightBg: 'bg-gradient-to-br from-amber-50/80 to-orange-50/30'
    };
  }

  if (n.includes('derecho') || n.includes('psicología') || n.includes('periodismo') || n.includes('educación') || n.includes('pedagogía') || n.includes('letras')) {
    return {
      borderHover: 'hover:border-violet-400/50 hover:shadow-[0_20px_50px_rgba(167,139,250,0.15)]',
      textGradient: 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-transparent bg-clip-text',
      textAccent: 'text-violet-500',
      bgBadge: 'bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100',
      textBadge: 'text-violet-700',
      darkBox: 'bg-[#1C0F2E]', 
      barGradient: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
      lightBg: 'bg-gradient-to-br from-violet-50/80 to-fuchsia-50/30'
    };
  }
  
  return {
    borderHover: 'hover:border-[#6544FF]/40 hover:shadow-[0_20px_50px_rgba(101,68,255,0.15)]',
    textGradient: 'bg-gradient-to-r from-[#6544FF] to-[#3B82F6] text-transparent bg-clip-text',
    textAccent: 'text-[#6544FF]',
    bgBadge: 'bg-gradient-to-r from-[#EEECFF] to-blue-50 border border-[#6544FF]/10',
    textBadge: 'text-[#6544FF]',
    darkBox: 'bg-[#0F0A21]',
    barGradient: 'bg-gradient-to-r from-[#6544FF] to-[#3B82F6]',
    lightBg: 'bg-gradient-to-br from-[#6544FF]/5 to-[#3B82F6]/5'
  };
};

export default function CarrerasDestacadas() {
  const [carrerasBD, setCarrerasBD] = useState<CarreraUI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [accediendoId, setAccediendoId] = useState<string | number | null>(null);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [animarBarras, setAnimarBarras] = useState(false);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setAccediendoId(null);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

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
            instituciones!inner (nombre, tipo, logo_url)
          `)
          .not('empleabilidad_1er_anio', 'is', null)
          .not('ingreso_promedio_4to_anio', 'is', null)
          .order('empleabilidad_1er_anio', { ascending: false })
          .limit(30);

        if (error) throw error;

        if (data) {
          const rawData = data as unknown as CarreraDB[];
          
          const todasAdaptadas = rawData.map((item) => {
            const inst = Array.isArray(item.instituciones) ? item.instituciones[0] : item.instituciones;
            const nombreInst = inst?.nombre || "No informada";
            const empleabilidadReal = item.empleabilidad_1er_anio 
              ? Number((item.empleabilidad_1er_anio * 100).toFixed(1)) 
              : 0;
  
            const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreInst)}&background=f4f5f9&color=6544ff&bold=true&size=128`;
  
            const llaveFiltro = item.nombre_carrera
              .trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9\s]/g, "")
              .replace(/\s+/g, " ");
  
            return {
              datosUI: {
                id: item.id,
                codigo_carrera: item.codigo_carrera,
                carrera: item.nombre_carrera.trim(),
                institucion: nombreInst,
                tipoInst: inst?.tipo || "Universidades",
                // Toma la URL WebP de Supabase, o el fallback si viene vacía
                logoInst: inst?.logo_url || fallbackLogo,
                empleabilidad: empleabilidadReal,
                arancel: item.arancel_anual ? `$${item.arancel_anual.toLocaleString('es-CL')}` : 'No informado',
                ingreso: item.ingreso_promedio_4to_anio || "No informado",
                es_promocionada: item.es_promocionada || false, 
                tema: obtenerTemaPorCarrera(item.nombre_carrera)
              },
              llave: llaveFiltro
            };
          });
  
          const filtroDefinitivo: CarreraUI[] = [];
          const nombresYaAgregados = new Set<string>();
  
          for (const item of todasAdaptadas) {
            if (!nombresYaAgregados.has(item.llave)) {
              nombresYaAgregados.add(item.llave);
              
              filtroDefinitivo.push({
                ...item.datosUI,
                es_promocionada: item.datosUI.es_promocionada || filtroDefinitivo.length === 0
              });
            }
            if (filtroDefinitivo.length >= 15) break;
          }
  
          setCarrerasBD(filtroDefinitivo);
          setTimeout(() => setAnimarBarras(true), 100);
        }
      } catch (err) {
        console.error("Error cargando carreras destacadas:", err);
      } finally {
        setCargando(false);
      }
    };
    fetchTopCarreras();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftPos(sliderRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleScrollEvent = () => {
    if (!sliderRef.current) return;
    const contenedor = sliderRef.current;
    const primeraTarjeta = contenedor.firstElementChild as HTMLElement;
    if (primeraTarjeta) {
      const anchoDesplazamiento = primeraTarjeta.offsetWidth + 24; 
      const index = Math.round(contenedor.scrollLeft / anchoDesplazamiento);
      setActiveIndex(index);
    }
  };

  const handleNavegacion = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const contenedor = sliderRef.current;
      const primeraTarjeta = contenedor.firstElementChild as HTMLElement;
      if (primeraTarjeta) {
        const anchoDesplazamiento = primeraTarjeta.offsetWidth + 24;
        const multiplicador = direction === "left" ? -anchoDesplazamiento : anchoDesplazamiento;
        contenedor.scrollBy({ left: multiplicador, behavior: "smooth" });
      }
    }
  };

  const scrollToDot = (index: number) => {
    if (sliderRef.current) {
      const primeraTarjeta = sliderRef.current.firstElementChild as HTMLElement;
      if (primeraTarjeta) {
        const anchoDesplazamiento = primeraTarjeta.offsetWidth + 24;
        sliderRef.current.scrollTo({ left: index * anchoDesplazamiento, behavior: "smooth" });
      }
    }
  };

  // --- MEJORA SEO: Generación Dinámica de JSON-LD ---
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": carrerasBD.map((carrera, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Course",
        "name": carrera.carrera,
        "description": `Carrera de ${carrera.carrera} impartida por ${carrera.institucion}. Empleabilidad al primer año: ${carrera.empleabilidad}%. Arancel anual: ${carrera.arancel}.`,
        "provider": {
          "@type": "EducationalOrganization",
          "name": carrera.institucion,
          "logo": carrera.logoInst
        }
      }
    }))
  };

  return (
    <section className="w-full bg-[#F4F5F9] pb-24 overflow-hidden tracking-tight">
      
      {/* MEJORA SEO: Inyección de Datos Estructurados para Google */}
      {carrerasBD.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      )}

      {/* 1. HERO BANNER */}
      <div className="relative w-full bg-[#0A0518] pt-24 pb-48 px-6 overflow-hidden z-20 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#15803d]/15 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 mix-blend-overlay"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-emerald-300 font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md">
            <Star className="w-4 h-4 fill-emerald-300/20" aria-hidden="true" /> Top Nacional
          </div>
          <h2 className="font-black uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-4 leading-none">
            Carreras <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#3B82F6] to-[#6544FF]">Destacadas</span>
          </h2>
          <p className="text-gray-400 max-w-2xl text-lg md:text-xl font-medium leading-relaxed">
            Explora las opciones académicas con los índices de inserción laboral y proyecciones salariales más potentes de Chile.
          </p>
        </div>
      </div>

      {/* 2. SLIDER DE CARRERAS */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 -mt-32 relative z-30">
        
        {!cargando && carrerasBD.length > 0 && (
          <div className="absolute -top-16 right-8 z-40 flex items-center gap-2.5">
            <button 
              onClick={() => handleNavegacion("left")}
              aria-label="Desplazar slider a la izquierda"
              className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white hover:text-[#0A0518] border border-white/10 flex items-center justify-center transition-all duration-300 shadow-xl backdrop-blur-md active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>
            <button 
              onClick={() => handleNavegacion("right")}
              aria-label="Desplazar slider a la derecha"
              className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white hover:text-[#0A0518] border border-white/10 flex items-center justify-center transition-all duration-300 shadow-xl backdrop-blur-md active:scale-95"
            >
              <ChevronRight className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        )}

        {cargando ? (
          <div className="w-full flex flex-col items-center justify-center py-28 bg-white rounded-[2.5rem] shadow-xl border border-gray-100">
            <Loader2 className="w-12 h-12 text-[#6544FF] animate-spin mb-4" aria-hidden="true" />
            <p className="font-bold text-gray-500">Cargando carreras destacadas...</p>
          </div>
        ) : (
          <>
            <div 
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              onScroll={handleScrollEvent}
              className={`flex w-full overflow-x-auto gap-6 pb-6 pt-2 px-2 scrollbar-none ${
                isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory scroll-smooth'
              }`}
              style={{ WebkitOverflowScrolling: "touch" }}
              role="region"
              aria-label="Lista de Carreras Destacadas"
            >
              {carrerasBD.map((carrera, i) => (
                <article 
                  key={carrera.id}
                  className={`w-[88vw] sm:w-[420px] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start bg-white rounded-[2.5rem] p-6 md:p-7 border border-gray-100/80 shadow-[0_10px_35px_rgba(0,0,0,0.03)] flex flex-col transition-all duration-300 ${carrera.tema.borderHover} hover:-translate-y-1.5 group ${isDragging ? 'pointer-events-none' : ''}`}
                  style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms both` }}
                >
                  
                  {/* Cabecera: Badges e Icono General */}
                  <header className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${carrera.tema.bgBadge} ${carrera.tema.textBadge} shadow-sm`}>
                        {carrera.tipoInst}
                      </span>
                      {carrera.es_promocionada && (
                        <span className="bg-gradient-to-r from-[#1A1528] to-[#2D2442] text-[#FACC15] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm border border-[#FACC15]/20">
                          TOP <Star className="w-3 h-3 fill-[#FACC15]" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </header>

                  {/* Títulos y Bloque Imponente de Institución */}
                  <div className="mb-6">
                    <h3 className={`font-black text-xl md:text-2xl leading-tight mb-4 uppercase tracking-tight line-clamp-2 min-h-[3.5rem] ${carrera.tema.textGradient}`} title={`Carrera: ${carrera.carrera}`}>
                      {carrera.carrera}
                    </h3>
                    
                    <div className="flex items-center gap-3.5 bg-gray-50/70 rounded-2xl p-2.5 border border-gray-100 group/inst transition-all hover:bg-white hover:shadow-md hover:border-gray-200">
                      <div className="relative shrink-0">
                        <div className={`absolute inset-0 ${carrera.tema.barGradient} rounded-xl blur-md opacity-0 group-hover/inst:opacity-30 transition-opacity duration-500`}></div>
                        
                        <div className="relative w-14 h-14 bg-white rounded-xl p-1.5 flex items-center justify-center border border-gray-200 shadow-sm overflow-hidden z-10 transition-transform duration-500 group-hover/inst:scale-[1.03]">
                          {/* MEJORA SEO: Atributo alt semántico, lazy loading */}
                          <img 
                            src={carrera.logoInst} 
                            alt={`Logotipo oficial de ${carrera.institucion}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain rounded-lg transition-transform duration-300 drop-shadow-sm"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; 
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(carrera.institucion)}&background=f4f5f9&color=6544ff&bold=true&size=128`;
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col justify-center overflow-hidden pr-2">
                        <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">
                          Impartido por
                        </span>
                        <p className="text-[13px] md:text-sm font-bold tracking-tight text-[#1A1528] uppercase truncate" title={`Institución: ${carrera.institucion}`}>
                          {carrera.institucion}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sección Empleabilidad */}
                  <div className={`rounded-2xl p-4 mb-4 border border-white/40 flex flex-col gap-3 ${carrera.tema.lightBg}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-white/50">
                          <Briefcase className={`w-4 h-4 ${carrera.tema.textAccent}`} aria-hidden="true" />
                        </div>
                        <span className="text-xs font-bold text-gray-600 leading-tight">
                          Empleabilidad<br/>al 1er Año
                        </span>
                      </div>
                      <span className={`font-black text-2xl tracking-tighter ${carrera.tema.textGradient}`}>
                        {carrera.empleabilidad}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-white/70 rounded-full h-2.5 overflow-hidden border border-white/50 shadow-inner" aria-hidden="true">
                      <div 
                        className={`h-full rounded-full ${carrera.tema.barGradient} transition-all duration-1000 ease-out`}
                        style={{ width: animarBarras ? `${carrera.empleabilidad}%` : '0%' }}
                      />
                    </div>
                  </div>

                  {/* Módulo Financiero */}
                  <div className="grid grid-cols-5 gap-3 mb-6 pointer-events-none select-none">
                    <div className="col-span-2 bg-white rounded-2xl p-3.5 border border-gray-200 flex flex-col justify-center">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
                        Arancel Anual
                      </span>
                      <span className="font-black text-[#1A1528] text-base truncate" title={`Arancel anual: ${carrera.arancel}`}>
                        {carrera.arancel}
                      </span>
                    </div>

                    <div className={`col-span-3 ${carrera.tema.darkBox} rounded-2xl p-3.5 relative overflow-hidden flex flex-col justify-center shadow-inner`}>
                      <div className="absolute -right-3 -bottom-4 opacity-[0.07]">
                        <DollarSign className="w-20 h-20 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-[9px] font-extrabold text-white/60 uppercase tracking-wider mb-1 relative z-10">
                        Sueldo Promedio
                      </span>
                      <span className="font-black text-white text-xs md:text-[11px] leading-tight tracking-tight relative z-10 block pr-2" title={`Ingreso promedio: ${carrera.ingreso}`}>
                        {carrera.ingreso}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <footer className="mt-auto pt-4 flex justify-between items-center border-t border-gray-100 justify-center">
                    {/* MEJORA SEO: aria-label explícito para el lector de pantalla */}
                    <a 
                      href={`/carrera/${carrera.codigo_carrera}`}
                      aria-label={`Ver detalles completos de la carrera ${carrera.carrera} en ${carrera.institucion}`}
                      onClick={(e) => {
                        if (isDragging) e.preventDefault();
                        else setAccediendoId(carrera.codigo_carrera);
                      }}
                      className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-all px-4 py-2.5 rounded-xl pointer-events-auto ${
                        accediendoId === carrera.codigo_carrera 
                          ? 'bg-gray-100 text-gray-400 cursor-wait' 
                          : `${carrera.tema.bgBadge} ${carrera.tema.textAccent} hover:opacity-85 active:scale-95`
                      }`}
                    >
                      {accediendoId === carrera.codigo_carrera ? (
                        <><Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> ...</>
                      ) : (
                        <>Ver detalles <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" /></>
                      )}
                    </a>
                  </footer>

                </article>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex justify-center items-center gap-2 mt-4 mb-8">
              {carrerasBD.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToDot(index)}
                  className={`transition-all duration-300 rounded-full ${
                    activeIndex === index 
                      ? 'w-8 h-2.5 bg-[#6544FF]' 
                      : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir a la página ${index + 1} del carrusel de carreras`}
                />
              ))}
            </div>
          </>
        )}

        {/* 3. BOTÓN EXTRA */}
        <div className="mt-4 flex justify-center animate-in fade-in slide-in-from-bottom-6">
          <a 
            href="/herramientas/mercado-laboral"
            aria-label="Ir a la herramienta interactiva de exploración del mercado laboral"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1A1528] text-white font-black italic uppercase tracking-wider rounded-full overflow-hidden shadow-[0_10px_40px_rgba(26,21,40,0.25)] hover:shadow-[0_15px_45px_rgba(101,68,255,0.35)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#6544FF] via-[#D946EF] to-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="relative z-10 text-sm md:text-base flex items-center gap-2">
              Explorar Mercado Laboral 
            </span>
            <div className="relative z-10 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
          </a>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.08); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 14s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animation-delay-2000 { animation-delay: 2s; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(35px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </section>
  );
}