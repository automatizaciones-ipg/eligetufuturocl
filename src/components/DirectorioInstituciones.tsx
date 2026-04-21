// src/components/DirectorioInstituciones.tsx
import { useState, useEffect } from "react";
import { 
  Building2, Map, Award, CheckCircle2, ChevronRight, 
  Search, MapPin, Globe, BookOpen, Star, ArrowLeft, Loader2, ChevronLeft,
  X, ChevronDown
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- INTERFACES SUPABASE ---
interface InstitucionDB {
  codigo_institucion: number;
  nombre: string;
  tipo: string;
  adscrita_gratuidad: boolean;
  acreditada: boolean;
  anios_acreditacion: number;
  region?: string; // Opcional por si aún no agregas la columna a tu BD
}

interface InstitucionUI extends InstitucionDB {
  color: string;
  destacada: boolean;
}

// Colores premium para rotar en los logos de las instituciones
const PALETA_COLORES = [
  "from-[#15803d] to-emerald-400",
  "from-[#6544FF] to-[#947BFF]",
  "from-orange-500 to-amber-400",
  "from-blue-600 to-cyan-400",
  "from-rose-500 to-pink-400",
  "from-[#002B49] to-[#005288]",
  "from-red-600 to-red-400"
];

// Opciones de Filtro de Acreditación
const FILTROS_ACREDITACION = [
  { id: "todas", nombre: "Todas las Instituciones" },
  { id: "7", nombre: "7 Años (Excelencia)" },
  { id: "6", nombre: "6 Años (Excelencia)" },
  { id: "5", nombre: "5 Años (Avanzada)" },
  { id: "4", nombre: "4 Años (Avanzada)" },
  { id: "3", nombre: "3 Años (Básica)" },
  { id: "0", nombre: "No Acreditada" }
];

// Regiones Oficiales de Chile
const REGIONES = [
  { id: "todas", nombre: "Todas las Regiones" },
  { id: "Arica y Parinacota", nombre: "Arica y Parinacota" },
  { id: "Tarapacá", nombre: "Tarapacá" },
  { id: "Antofagasta", nombre: "Antofagasta" },
  { id: "Atacama", nombre: "Atacama" },
  { id: "Coquimbo", nombre: "Coquimbo" },
  { id: "Valparaíso", nombre: "Valparaíso" },
  { id: "Metropolitana", nombre: "Región Metropolitana" },
  { id: "O'Higgins", nombre: "O'Higgins" },
  { id: "Maule", nombre: "Maule" },
  { id: "Ñuble", nombre: "Ñuble" },
  { id: "Biobío", nombre: "Biobío" },
  { id: "La Araucanía", nombre: "La Araucanía" },
  { id: "Los Ríos", nombre: "Los Ríos" },
  { id: "Los Lagos", nombre: "Los Lagos" },
  { id: "Aysén", nombre: "Aysén" },
  { id: "Magallanes", nombre: "Magallanes" }
];

const ITEMS_POR_PAGINA = 15;

export default function DirectorioInstituciones() {
  const [filtroAcreditacion, setFiltroAcreditacion] = useState("todas");
  const [regionActiva, setRegionActiva] = useState("todas");
  const [institucionesBD, setInstitucionesBD] = useState<InstitucionUI[]>([]);
  const [institucionesFiltradas, setInstitucionesFiltradas] = useState<InstitucionUI[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  // --- FETCH DE SUPABASE ---
  useEffect(() => {
    const fetchInstituciones = async () => {
      setCargando(true);
      try {
        const { data, error } = await supabase
          .from('instituciones')
          .select(`
            codigo_institucion,
            nombre,
            tipo,
            adscrita_gratuidad,
            acreditada,
            anios_acreditacion
            ${/* Descomenta esta línea si agregas la columna 'region' a tu BD */ ''}
            ${/* ,region */ ''}
          `)
          .order('anios_acreditacion', { ascending: false });

        if (error) throw error;

        if (data) {
          const instAdaptadas: InstitucionUI[] = data.map((item, index) => ({
            ...item,
            color: PALETA_COLORES[index % PALETA_COLORES.length],
            destacada: item.anios_acreditacion >= 6
          }));

          setInstitucionesBD(instAdaptadas);
          setInstitucionesFiltradas(instAdaptadas);
        }
      } catch (err) {
        console.error("Error cargando instituciones:", err);
      } finally {
        setCargando(false);
      }
    };

    fetchInstituciones();
  }, []);

  // --- LÓGICA DE FILTRADO Y BÚSQUEDA MULTIPLE ---
  useEffect(() => {
    if (institucionesBD.length === 0) return;
    
    setInstitucionesFiltradas([]); // Limpiamos para lanzar animación
    
    setTimeout(() => {
      let filtradas = institucionesBD;
      
      // Filtro por Acreditación
      if (filtroAcreditacion !== "todas") {
        filtradas = filtradas.filter(inst => inst.anios_acreditacion === parseInt(filtroAcreditacion));
      }

      // Filtro por Región (Aplicará si existe la columna region en BD)
      if (regionActiva !== "todas") {
        filtradas = filtradas.filter(inst => inst.region === regionActiva);
      }
      
      // Filtro por Búsqueda de texto
      if (busqueda) {
        filtradas = filtradas.filter(inst => 
          inst.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
      }
      
      setInstitucionesFiltradas(filtradas);
      setPaginaActual(1); // Volver a página 1 al filtrar
    }, 50); 
  }, [filtroAcreditacion, regionActiva, busqueda, institucionesBD]);

  // --- CONTADORES DINÁMICOS PARA EL SIDEBAR ---
  const contarInstituciones = (idAcred: string) => {
    if (idAcred === "todas") return institucionesBD.length;
    return institucionesBD.filter(inst => inst.anios_acreditacion === parseInt(idAcred)).length;
  };

  // --- PAGINACIÓN ---
  const indiceUltimoItem = paginaActual * ITEMS_POR_PAGINA;
  const indicePrimerItem = indiceUltimoItem - ITEMS_POR_PAGINA;
  const institucionesPaginadas = institucionesFiltradas.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(institucionesFiltradas.length / ITEMS_POR_PAGINA);

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

  return (
    <div className="w-full bg-[#F4F5F9] min-h-screen pb-20 selection:bg-[#7C3AED] selection:text-white overflow-hidden">
      
      {/* =========================================================================
          1. HERO SECTION (BANNER UNIFICADO)
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-20 pb-40 px-6 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="container mx-auto relative z-10 max-w-7xl">
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-12 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer animate-fade-in-up"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-[#D8B4FE] font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md animate-fade-in-up">
            <Building2 className="w-4 h-4" /> Red Educativa Nacional
          </div>

          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Directorio de <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">Instituciones</span>
          </h2>

          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Explora las universidades, institutos y centros de formación técnica de todo el país. Verifica su gratuidad y años de acreditación.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO (Buscador y Listado)
      ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto px-4 -mt-24 relative z-30">
        
        {/* BUSCADOR PREMIUM PERFECCIONADO */}
        <div className="bg-white rounded-3xl p-3 shadow-2xl shadow-gray-200/50 border border-gray-100 mb-12 flex flex-col md:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-8">
          <div className="flex-1 w-full relative flex items-center">
            <Search className="absolute left-6 w-5 h-5 text-[#6544FF]" />
            <input 
              type="text" 
              placeholder="Escribe el nombre de la institución..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-14 pr-12 py-4 rounded-2xl bg-[#F8FAFC] hover:bg-gray-100 border-2 border-transparent focus:border-[#6544FF]/30 focus:bg-white focus:ring-4 focus:ring-[#6544FF]/10 outline-none transition-all font-semibold text-gray-700 placeholder:text-gray-400 text-base md:text-lg"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda("")}
                className="absolute right-5 text-gray-400 hover:text-rose-500 transition-colors p-1 bg-white rounded-full shadow-sm border border-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="hidden md:flex items-center px-6 border-l-2 border-gray-100 shrink-0 h-10">
            <p className="text-sm font-bold text-gray-400 tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#1A1528] text-2xl">{institucionesFiltradas.length}</span> resultados
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDEBAR: FILTROS (Sticky) */}
          <div className="w-full lg:w-80 shrink-0 sticky top-24 z-20 animate-in fade-in slide-in-from-bottom-8 delay-100 space-y-6">
            
            {/* BLOQUE 1: UBICACIÓN (Select Dropdown) */}
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
              <h3 className="font-black text-lg text-[#1A1528] uppercase tracking-wider mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#6544FF]" /> Ubicación
              </h3>
              <div className="relative group">
                <select 
                  value={regionActiva}
                  onChange={(e) => setRegionActiva(e.target.value)}
                  className="w-full appearance-none bg-[#F8FAFC] border-2 border-gray-100 text-gray-700 font-bold text-sm rounded-xl py-4 pl-4 pr-10 focus:outline-none focus:border-[#6544FF]/50 focus:bg-white focus:ring-4 focus:ring-[#6544FF]/10 transition-all cursor-pointer group-hover:border-gray-200"
                >
                  {REGIONES.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-[#6544FF] transition-colors" />
              </div>
            </div>

            {/* BLOQUE 2: ACREDITACIÓN (Botones) */}
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
              <h3 className="font-black text-lg text-[#1A1528] uppercase tracking-wider mb-5 flex items-center gap-2">
                <Award className="w-5 h-5 text-[#6544FF]" /> Acreditación
              </h3>
              
              <div className="space-y-2">
                {FILTROS_ACREDITACION.map((filtro) => {
                  const count = contarInstituciones(filtro.id);
                  if (count === 0 && filtro.id !== "todas") return null; 

                  return (
                    <button
                      key={filtro.id}
                      onClick={() => setFiltroAcreditacion(filtro.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 group
                        ${filtroAcreditacion === filtro.id 
                          ? "bg-[#1A1528] text-white shadow-md scale-[1.02]" 
                          : "bg-transparent text-gray-500 hover:bg-[#F8FAFC] hover:text-[#1A1528]"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <Star className={`w-4 h-4 ${filtroAcreditacion === filtro.id ? "text-[#C1AFFF] fill-current" : "text-gray-400 group-hover:text-amber-400"}`} />
                        {filtro.nombre}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs ${filtroAcreditacion === filtro.id ? "bg-white/10 text-white" : "bg-gray-100 text-gray-400"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Banner Pequeño CTA en Sidebar */}
            <div className="bg-gradient-to-br from-[#6544FF] to-[#947BFF] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-[#6544FF]/20">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <CheckCircle2 className="w-8 h-8 mb-3 text-white/90 relative z-10" />
              <h4 className="font-black text-lg leading-tight mb-2 relative z-10">Datos Oficiales</h4>
              <p className="text-xs font-medium text-white/80 relative z-10 leading-relaxed">
                Información validada por la Comisión Nacional de Acreditación (CNA) y Mineduc.
              </p>
            </div>
          </div>

          {/* LISTA DE INSTITUCIONES (Contenido Principal) */}
          <div className="flex-1 w-full space-y-4">
            
            {cargando && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100">
                <Loader2 className="w-12 h-12 text-[#6544FF] animate-spin mb-4" />
                <p className="font-bold text-gray-500">Cargando directorio oficial...</p>
              </div>
            )}

            {!cargando && institucionesPaginadas.map((inst, i) => (
              <div 
                key={`${inst.codigo_institucion}-${paginaActual}`}
                className={`group bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-2 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 animate-in slide-in-from-bottom-8 fade-in fill-mode-both relative overflow-hidden
                  ${inst.destacada ? "border-[#6544FF]/20 hover:border-[#6544FF]/50 hover:shadow-[0_15px_40px_rgba(101,68,255,0.08)]" : "border-transparent hover:border-gray-200"}
                `}
                style={{ animationDelay: `${(i % 10) * 100}ms` }}
              >
                
                {/* Sombra de fondo si es destacada */}
                {inst.destacada && (
                  <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${inst.color} rounded-full opacity-5 blur-[60px] pointer-events-none group-hover:opacity-20 transition-opacity duration-500`}></div>
                )}

                {/* Logo o Letra Inicial */}
                <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg bg-gradient-to-br ${inst.color} transform group-hover:-rotate-3 group-hover:scale-105 transition-all duration-500`}>
                  {inst.nombre.substring(0, 2).toUpperCase()}
                </div>

                {/* Información Principal */}
                <div className="flex-1 z-10">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 shadow-sm">
                      {inst.tipo || "Educación Superior"}
                    </span>
                    {inst.adscrita_gratuidad && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1 border border-emerald-100 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" /> Gratuidad
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-black text-xl md:text-2xl text-[#1A1528] mb-1 leading-tight group-hover:text-[#6544FF] transition-colors">
                    {inst.nombre}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500 mt-3">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${inst.anios_acreditacion > 0 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-gray-400 bg-gray-50 border-gray-200'}`}>
                      <Star className={`w-4 h-4 ${inst.anios_acreditacion > 0 ? 'fill-current text-amber-500' : ''}`} />
                      {inst.anios_acreditacion > 0 ? `${inst.anios_acreditacion} Años Acreditada` : 'No Acreditada'}
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                      <BookOpen className="w-4 h-4" /> Validada SIES
                    </span>
                  </div>
                </div>

                {/* Botón de Acción Lateral */}
                <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 flex md:flex-col items-center justify-between md:justify-center gap-4 shrink-0 z-10">
                  <div className="hidden md:block text-center mb-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ver Oferta</p>
                  </div>
                  <button className="bg-[#1A1528] hover:bg-[#6544FF] text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-md group-hover:scale-110 group-hover:shadow-[0_10px_30px_rgba(101,68,255,0.3)]">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

              </div>
            ))}

            {/* PAGINACIÓN */}
            {!cargando && totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-10 mb-8 animate-in fade-in duration-500">
                <button onClick={() => { setPaginaActual(p => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }} disabled={paginaActual === 1} className="w-10 h-10 rounded-2xl border-2 border-gray-200 text-[#1A1528] flex items-center justify-center disabled:opacity-30 hover:bg-[#6544FF]/10 hover:border-[#6544FF]/30 hover:text-[#6544FF] transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {generarArregloPaginacion().map((pagina, index) => (
                  <button
                    key={index}
                    onClick={() => { if (typeof pagina === 'number') { setPaginaActual(pagina); window.scrollTo({ top: 400, behavior: 'smooth' }); } }}
                    className={`w-10 h-10 rounded-2xl font-black text-sm transition-all ${pagina === paginaActual ? 'bg-[#6544FF] text-white scale-105 border-transparent' : pagina === '...' ? 'bg-transparent border-none text-gray-400 cursor-default' : 'bg-white border-2 border-gray-200 text-slate-600 hover:border-[#6544FF]/50 hover:text-[#6544FF]'}`}
                  >
                    {pagina}
                  </button>
                ))}
                <button onClick={() => { setPaginaActual(p => Math.min(totalPaginas, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }} disabled={paginaActual === totalPaginas} className="w-10 h-10 rounded-2xl border-2 border-gray-200 text-[#1A1528] flex items-center justify-center disabled:opacity-30 hover:bg-[#6544FF]/10 hover:border-[#6544FF]/30 hover:text-[#6544FF] transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {!cargando && institucionesFiltradas.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300 animate-in fade-in duration-500">
                <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-xl text-gray-400 mb-2">No encontramos resultados</h3>
                <p className="text-gray-500 text-sm">Prueba ajustando el buscador o los filtros del menú.</p>
              </div>
            )}
          </div>

        </div>
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
      `}} />
    </div>
  );
}