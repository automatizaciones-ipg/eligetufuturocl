// src/components/MercadoLaboral.tsx
import { useState, useEffect } from "react";
import { 
  TrendingUp, Briefcase, DollarSign, Percent, 
  BarChart, ArrowUpRight, GraduationCap, ArrowLeft, Loader2, ChevronLeft, ChevronRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- INTERFACES DE TYPESCRIPT (Tipado Estricto) ---
interface InstitucionDB {
  nombre: string;
  tipo: string;
}

interface CarreraDB {
  id: number;
  codigo_carrera: string | number;
  nombre_carrera: string;
  empleabilidad_1er_anio: number | null;
  ingreso_promedio_4to_anio: string | null;
  arancel_anual: number | null;
  instituciones: InstitucionDB | InstitucionDB[] | null;
}

interface CarreraUI {
  id: number;
  codigo_carrera: string | number;
  carrera: string;
  institucion: string;
  tipoInst: string;
  empleabilidad: number;
  arancel: string;
  ingreso: string;
  color: string;
}

// Colores premium para rotar en las tarjetas
const PALETA_COLORES = [
  "from-[#15803d] to-emerald-400",
  "from-[#6544FF] to-[#947BFF]",
  "from-orange-500 to-amber-400",
  "from-blue-600 to-cyan-400",
  "from-rose-500 to-pink-400"
];

const TIPOS_INSTITUCION = [
  { id: "todo", label: "Todas las Instituciones" },
  { id: "Universidades", label: "Universidades" },
  { id: "Institutos Profesionales", label: "Institutos Profesionales" },
  { id: "Centros de Formación Técnica", label: "Centros de Formación" }
];

const ITEMS_POR_PAGINA = 40;

export default function MercadoLaboral() {
  const [filtroActivo, setFiltroActivo] = useState("todo");
  const [carrerasBD, setCarrerasBD] = useState<CarreraUI[]>([]);
  const [carrerasFiltradas, setCarrerasFiltradas] = useState<CarreraUI[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para la paginación
  const [paginaActual, setPaginaActual] = useState(1);

  // --- NUEVO ESTADO: Controla qué carrera se está cargando (Click en Ver Detalle) ---
  const [accediendoId, setAccediendoId] = useState<string | number | null>(null);

  // --- LIMPIEZA AL VOLVER (BFCache) ---
  // Si el usuario presiona "Atrás" en el navegador, restauramos el botón a la normalidad
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setAccediendoId(null);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // --- FETCH A SUPABASE (TODAS LAS CARRERAS VALIDAS) ---
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
            instituciones!inner (nombre, tipo)
          `)
          // SOLO traemos las que tienen datos reales inyectados
          .not('empleabilidad_1er_anio', 'is', null)
          .not('ingreso_promedio_4to_anio', 'is', null)
          // Ordenamos para mostrar siempre el TOP con mayor empleabilidad
          .order('empleabilidad_1er_anio', { ascending: false });

        if (error) throw error;

        if (data) {
          const rawData = data as unknown as CarreraDB[];

          const carrerasAdaptadas: CarreraUI[] = rawData.map((item, index) => {
            const inst = Array.isArray(item.instituciones) ? item.instituciones[0] : item.instituciones;
            
            // CORRECCIÓN MATEMÁTICA: Convertir 0.855 a 85.5
            const empleabilidadReal = item.empleabilidad_1er_anio 
              ? Number((item.empleabilidad_1er_anio * 100).toFixed(1)) 
              : 0;

            return {
              id: item.id,
              codigo_carrera: item.codigo_carrera,
              carrera: item.nombre_carrera,
              institucion: inst?.nombre || "No informada",
              tipoInst: inst?.tipo || "Universidades",
              empleabilidad: empleabilidadReal,
              arancel: item.arancel_anual ? `$${item.arancel_anual.toLocaleString('es-CL')}` : 'No informado',
              ingreso: item.ingreso_promedio_4to_anio || "No informado",
              color: PALETA_COLORES[index % PALETA_COLORES.length]
            };
          });

          setCarrerasBD(carrerasAdaptadas);
          setCarrerasFiltradas(carrerasAdaptadas);
        }
      } catch (err) {
        console.error("Error cargando mercado laboral:", err);
      } finally {
        setCargando(false);
      }
    };

    fetchTopCarreras();
  }, []);

  // --- LÓGICA DE FILTRADO SUAVE Y RESET DE PAGINACIÓN ---
  useEffect(() => {
    if (carrerasBD.length === 0) return;
    
    setCarrerasFiltradas([]); // Limpiamos para lanzar la animación
    setTimeout(() => {
      if (filtroActivo === "todo") {
        setCarrerasFiltradas(carrerasBD);
      } else {
        setCarrerasFiltradas(carrerasBD.filter(c => c.tipoInst === filtroActivo));
      }
      setPaginaActual(1); // Volver a la página 1 al cambiar de filtro
    }, 50); 
  }, [filtroActivo, carrerasBD]);

  // --- CÁLCULOS DE PAGINACIÓN ---
  const indiceUltimoItem = paginaActual * ITEMS_POR_PAGINA;
  const indicePrimerItem = indiceUltimoItem - ITEMS_POR_PAGINA;
  const carrerasPaginadas = carrerasFiltradas.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(carrerasFiltradas.length / ITEMS_POR_PAGINA);

  // --- LÓGICA REALISTA PARA EL WIDGET (Ya no aplica a las tarjetas) ---
  // Es la vista del TOP Nacional SOLO si estás viendo la página 1 de TODAS las instituciones.
  const esVistaTopNacional = paginaActual === 1 && filtroActivo === "todo";

  // --- FUNCIÓN INTELIGENTE DE ARREGLO DE PAGINACIÓN ---
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

  return (
    <div className="w-full bg-[#F4F5F9] min-h-screen pb-20 selection:bg-[#7C3AED] selection:text-white overflow-hidden">
      
      {/* =========================================================================
          1. HERO SECTION (BANNER)
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
        
        {/* WIDGET ESTADÍSTICO PREMIUM - Dinámico según filtro y página */}
        <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-[#6544FF]/20 mb-16 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.15)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner shrink-0 transition-all duration-300">
                {esVistaTopNacional ? <BarChart className="w-10 h-10 text-emerald-400" /> : <Briefcase className="w-10 h-10 text-emerald-400" />}
              </div>
              <div>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1 transition-all">
                  {esVistaTopNacional ? "Ranking Nacional Absoluto" : "Exploración General"}
                </p>
                <h3 className="font-black italic uppercase text-3xl text-white transition-all">
                  {esVistaTopNacional ? "Alta Demanda" : "Opciones Laborales"}
                </h3>
                <p className="text-gray-400 text-sm mt-1 transition-all">
                  {esVistaTopNacional 
                    ? "El top de carreras con la mejor inserción laboral del país." 
                    : "Explorando alternativas académicas con datos validados."}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 text-center items-center shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-32 backdrop-blur-sm transition-all duration-300">
                <span className="flex items-center justify-center gap-1 font-black text-4xl text-white mb-1">
                  {esVistaTopNacional ? (
                    <>TOP<TrendingUp className="w-5 h-5 text-emerald-400" /></>
                  ) : (
                    <span className="text-3xl">INFO</span>
                  )}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {esVistaTopNacional ? "Ranking SIES" : "Datos SIES"}
                </span>
              </div>
              <div className="hidden sm:flex bg-[#6544FF]/20 border border-[#6544FF]/30 rounded-2xl p-5 w-32 backdrop-blur-sm flex-col justify-center transition-all duration-300">
                <Briefcase className="w-8 h-8 text-[#C1AFFF] mx-auto mb-2" />
                <span className="text-[10px] font-bold text-[#C1AFFF] uppercase tracking-wider">Empleabilidad</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS DE FILTRADO POR INSTITUCIÓN */}
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

        {/* GRID DE DATOS LABORALES (PAGINADO) */}
        {!cargando && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {carrerasPaginadas.map((carrera, i) => {
              
              // =========================================================
              // REGLA MATEMÁTICA REAL: Solo es TOP si empleabilidad es >= 90%
              // =========================================================
              const esCarreraTop = carrera.empleabilidad >= 90.0;

              return (
                <div 
                  key={`${carrera.id}-${paginaActual}`}
                  className="group bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-2 border-transparent hover:border-[#6544FF]/30 hover:shadow-[0_15px_40px_rgba(101,68,255,0.08)] transition-all duration-300 flex flex-col animate-in slide-in-from-bottom-8 fade-in fill-mode-both"
                  style={{ animationDelay: `${(i % 10) * 100}ms` }}
                >
                  
                  {/* Cabecera de la Tarjeta */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="pr-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gradient-to-r ${carrera.color} text-white bg-opacity-10 mb-3 inline-block shadow-sm`}>
                        {carrera.tipoInst}
                      </span>
                      <h3 className="font-black text-2xl text-[#1A1528] leading-tight group-hover:text-[#6544FF] transition-colors mb-2">
                        {carrera.carrera}
                      </h3>
                      <p className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
                        {carrera.institucion}
                      </p>
                    </div>
                    
                    {/* Contenedor Flex para alinear el TOP con el ícono de Graduación */}
                    <div className="flex items-center gap-3">
                      {esCarreraTop && (
                        <span 
                          title="Carrera de Alta Demanda (≥90% Empleabilidad SIES)"
                          className="hidden sm:flex items-center gap-1 bg-[#1A1528] text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md uppercase tracking-widest animate-fade-in-up"
                        >
                          TOP <TrendingUp className="w-3 h-3 text-emerald-400" />
                        </span>
                      )}
                      <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-6 h-6 text-[#1A1528]" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-gray-500 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" /> Empleabilidad (1er año)
                      </span>
                      <span className="font-black text-2xl text-[#1A1528]">{carrera.empleabilidad}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${carrera.color} relative`}
                        style={{ width: `${carrera.empleabilidad}%` }}
                      >
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl relative overflow-hidden group-hover:border-[#6544FF]/20 transition-colors flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Arancel Anual</p>
                      <p className="font-black text-lg md:text-xl text-[#1A1528] flex items-center">
                        {carrera.arancel}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-[#1A1528] to-[#2D2442] p-4 rounded-2xl relative overflow-hidden flex flex-col justify-center">
                      <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                        <DollarSign className="w-20 h-20 text-white" />
                      </div>
                      <p className="text-[10px] font-bold text-[#C1AFFF] uppercase tracking-wider mb-1 relative z-10">Ingreso (4to Año)</p>
                      <p className="font-black text-sm text-white relative z-10 leading-tight">
                        {carrera.ingreso}
                      </p>
                    </div>
                  </div>

                  {/* =========================================================================
                      BOTÓN DE NAVEGACIÓN (CON EFECTO DE CARGA "ACCEDIENDO")
                  ========================================================================= */}
                  <div className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      Fuente: SIES
                    </span>
                    
                    <a 
                      href={`/carrera/${carrera.codigo_carrera}`}
                      onClick={() => setAccediendoId(carrera.codigo_carrera)}
                      className={`flex items-center gap-1.5 text-sm font-black text-[#6544FF] uppercase tracking-wider transition-all bg-[#6544FF]/5 px-4 py-2 rounded-xl 
                        ${accediendoId === carrera.codigo_carrera 
                          ? 'opacity-80 cursor-wait pointer-events-none' 
                          : 'hover:gap-2 hover:bg-[#6544FF]/10'
                        }`}
                    >
                      {accediendoId === carrera.codigo_carrera ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Accediendo
                        </>
                      ) : (
                        <>
                          Ver detalle <ArrowUpRight className="w-4 h-4" />
                        </>
                      )}
                    </a>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            NUEVA PAGINACIÓN NUMÉRICA INTEGRADA
        ========================================================================= */}
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
            
            {/* Números de página con lógica de puntos suspensivos */}
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
                setPaginaActual(p => p + 1); 
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
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 mt-6">
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
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}