// src/components/DirectorioInstituciones.tsx
import { useState, useEffect } from "react";
import { 
  Building2, Map, Award, CheckCircle2, ChevronRight, 
  Search, MapPin, Globe, BookOpen, Star, ArrowLeft, Loader2, ChevronLeft,
  X, ChevronDown, SlidersHorizontal, Building
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- INTERFACES SUPABASE ESTRICTAS ---
interface InstitucionDB {
  codigo_institucion: number;
  nombre: string;
  tipo: string;
  adscrita_gratuidad: boolean;
  acreditada: boolean;
  carreras?: { region: string | null }[]; 
}

interface InstitucionUI extends Omit<InstitucionDB, 'carreras'> {
  color: string;
  destacada: boolean;
  regiones: string[];
}

// Colores premium
const PALETA_COLORES = [
  "from-[#15803d] to-emerald-400",
  "from-[#6544FF] to-[#947BFF]",
  "from-orange-500 to-amber-400",
  "from-blue-600 to-cyan-400",
  "from-rose-500 to-pink-400",
  "from-[#002B49] to-[#005288]",
  "from-red-600 to-red-400"
];

const REGIONES = [
  { id: "todas", nombre: "Todas las Regiones" },
  { id: "Arica y Parinacota", nombre: "Arica y Parinacota" },
  { id: "Tarapacá", nombre: "Tarapacá" },
  { id: "Antofagasta", nombre: "Antofagasta" },
  { id: "Atacama", nombre: "Atacama" },
  { id: "Coquimbo", nombre: "Coquimbo" },
  { id: "Valparaíso", nombre: "Valparaíso" },
  { id: "Metropolitana", nombre: "Región Metropolitana" },
  { id: "Lib. Gral. B. O'Higgins", nombre: "O'Higgins" },
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
  // Estados de los Filtros
  const [regionActiva, setRegionActiva] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("Todos"); // Todos, U, IP, CFT
  const [filtroAcreditacion, setFiltroAcreditacion] = useState("Todas"); 
  const [ordenNombre, setOrdenNombre] = useState("asc"); 
  const [busqueda, setBusqueda] = useState("");
  
  // Estados de UI de los Dropdowns
  const [dropdownRegionAbierto, setDropdownRegionAbierto] = useState(false);
  const [dropdownAcreditacionAbierto, setDropdownAcreditacionAbierto] = useState(false);
  const [dropdownOrdenAbierto, setDropdownOrdenAbierto] = useState(false);
  
  const [institucionesBD, setInstitucionesBD] = useState<InstitucionUI[]>([]);
  const [institucionesFiltradas, setInstitucionesFiltradas] = useState<InstitucionUI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  
  // Estado para UX de Navegación y Logos
  const [erroresLogos, setErroresLogos] = useState<number[]>([]);
  const [navegandoA, setNavegandoA] = useState<number | null>(null);

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
            carreras ( region )
          `);

        if (error) throw error;

        if (data) {
          const instAdaptadas: InstitucionUI[] = data.map((item, index) => {
            const regionesMapeadas = item.carreras 
              ? item.carreras.map(c => c.region).filter(Boolean) as string[]
              : [];
            const regionesUnicas = Array.from(new Set(regionesMapeadas));
            
            return {
              codigo_institucion: item.codigo_institucion,
              nombre: item.nombre,
              tipo: item.tipo,
              adscrita_gratuidad: item.adscrita_gratuidad,
              acreditada: item.acreditada,
              regiones: regionesUnicas,
              color: PALETA_COLORES[index % PALETA_COLORES.length],
              destacada: item.acreditada && item.adscrita_gratuidad
            };
          });

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

  // --- LÓGICA DE FILTRADO MÚLTIPLE ---
  useEffect(() => {
    if (institucionesBD.length === 0) return;
    
    setInstitucionesFiltradas([]); 
    
    setTimeout(() => {
      let filtradas = institucionesBD;
      
      // 1. Filtro Región
      if (regionActiva !== "todas") {
        filtradas = filtradas.filter(inst => inst.regiones.includes(regionActiva));
      }

      // 2. Filtro Tipo
      if (filtroTipo !== "Todos") {
        filtradas = filtradas.filter(inst => {
          const tipoNorm = (inst.tipo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (filtroTipo === "U") return tipoNorm.includes("universidad");
          if (filtroTipo === "IP") return tipoNorm.includes("instituto") || tipoNorm === "ip";
          if (filtroTipo === "CFT") return tipoNorm.includes("centro") || tipoNorm.includes("formacion") || tipoNorm === "cft";
          return true;
        });
      }

      // 3. Filtro Acreditación
      if (filtroAcreditacion === "Acreditada") {
        filtradas = filtradas.filter(inst => inst.acreditada === true);
      } else if (filtroAcreditacion === "No Acreditada") {
        filtradas = filtradas.filter(inst => inst.acreditada === false);
      }
      
      // 4. Filtro Búsqueda Texto
      if (busqueda) {
        filtradas = filtradas.filter(inst => 
          inst.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
      }

      // 5. Ordenamiento Alfabético
      filtradas.sort((a, b) => {
        if (ordenNombre === "asc") return a.nombre.localeCompare(b.nombre);
        return b.nombre.localeCompare(a.nombre);
      });
      
      setInstitucionesFiltradas(filtradas);
      setPaginaActual(1); 
    }, 50); 
  }, [regionActiva, filtroTipo, filtroAcreditacion, ordenNombre, busqueda, institucionesBD]);

  // --- MANEJO DE IMÁGENES Y NAVEGACIÓN ---
  const handleLogoError = (id: number) => {
    if (!erroresLogos.includes(id)) {
      setErroresLogos((prev) => [...prev, id]);
    }
  };

  const obtenerSiglas = (nombre: string) => {
    return nombre.split(' ').map((n) => n[0]).join('').substring(0, 3).toUpperCase();
  };

  const generarSlugLogo = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") + ".png";
  };

  const handleNavegar = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setNavegandoA(id);
    setTimeout(() => {
      window.location.href = `/institucion/${id}`;
    }, 400); // 400ms para que la animación se vea perfecta antes de saltar de página
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
          1. HERO SECTION
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-20 pb-32 px-6 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="container mx-auto relative z-10 max-w-7xl">
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-10 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer animate-fade-in-up"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-[#D8B4FE] font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md animate-fade-in-up">
            <Building2 className="w-4 h-4" /> Red Educativa Nacional
          </div>

          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-4 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Directorio de <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">Instituciones</span>
          </h2>

          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed mb-6" style={{ animationDelay: '0.2s' }}>
            Explora las universidades, institutos y centros de formación técnica de todo el país. Verifica su gratuidad y acreditación.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO (Buscador, Filtros y Lista)
      ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto px-4 relative z-30 -mt-12">
        
        {/* BUSCADOR PREMIUM FLOTANTE */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-3 shadow-2xl shadow-indigo-900/10 border border-white mb-10 flex flex-col md:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-8">
          <div className="flex-1 w-full relative flex items-center group">
            <Search className="absolute left-6 w-5 h-5 text-gray-400 group-focus-within:text-[#6544FF] transition-colors" />
            <input 
              type="text" 
              placeholder="Escribe el nombre de la institución..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-14 pr-12 py-4 rounded-[1.5rem] bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:border-[#6544FF]/30 focus:bg-white focus:ring-4 focus:ring-[#6544FF]/10 outline-none transition-all font-semibold text-gray-700 placeholder:text-gray-400 text-base md:text-lg"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda("")}
                className="absolute right-5 text-gray-400 hover:text-rose-500 transition-colors p-1.5 bg-white hover:bg-rose-50 rounded-full shadow-sm border border-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="hidden md:flex items-center px-8 border-l-2 border-gray-100 shrink-0 h-10">
            <p className="text-sm font-bold text-gray-400 tracking-wider uppercase flex items-center gap-2">
              <span className="text-[#1A1528] text-2xl">{institucionesFiltradas.length}</span> resultados
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDEBAR: PANEL DE CONTROL COMPLETO */}
          <div className="w-full lg:w-80 shrink-0 relative lg:sticky lg:top-24 z-30 animate-in fade-in slide-in-from-bottom-8 delay-150">
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100/80">
              <h3 className="font-black text-lg text-[#1A1528] uppercase tracking-wider mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                <SlidersHorizontal className="w-5 h-5 text-[#6544FF]" /> Filtros
              </h3>

              {/* FILTRO 1: TIPO DE INSTITUCIÓN (SELECTOR HORIZONTAL) */}
              <div className="relative mb-6 mt-2">
                <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Tipo de Institución</span>
                <div className="flex items-center bg-gray-100/80 p-1.5 rounded-2xl w-full border border-gray-200/50">
                  {[
                    { id: "Todos", label: "Todos" },
                    { id: "U", label: "U" },
                    { id: "IP", label: "IP" },
                    { id: "CFT", label: "CFT" }
                  ].map((opc) => (
                    <button
                      key={opc.id}
                      onClick={() => { setFiltroTipo(opc.id); setPaginaActual(1); }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                        filtroTipo === opc.id
                          ? 'bg-white text-[#6544FF] shadow-sm ring-1 ring-black/5'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      {opc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FILTRO 2: UBICACIÓN */}
              <div className="relative mb-6">
                <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Ubicación / Región</span>
                <button onClick={() => setDropdownRegionAbierto(!dropdownRegionAbierto)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownRegionAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-[#6544FF]/70 shrink-0 mt-0.5" />
                    <span className="font-semibold text-sm text-[#1A1528] text-left whitespace-nowrap overflow-hidden text-ellipsis">
                      {REGIONES.find(r => r.id === regionActiva)?.nombre || "Todas las Regiones"}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownRegionAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
                </button>
                
                {dropdownRegionAbierto && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownRegionAbierto(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                      {REGIONES.map((reg) => (
                        <button key={reg.id} onClick={() => { setRegionActiva(reg.id); setPaginaActual(1); setDropdownRegionAbierto(false); }} 
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${regionActiva === reg.id ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}>
                          <span className="whitespace-normal break-words leading-tight">{reg.nombre}</span>
                          {regionActiva === reg.id && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* FILTRO 3: ACREDITACIÓN */}
              <div className="relative mb-6">
                <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Acreditación Institucional</span>
                <button onClick={() => setDropdownAcreditacionAbierto(!dropdownAcreditacionAbierto)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownAcreditacionAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Award className="w-4 h-4 text-[#6544FF]/70 shrink-0 mt-0.5" />
                    <span className="font-semibold text-sm text-[#1A1528] text-left whitespace-nowrap overflow-hidden text-ellipsis">
                      {filtroAcreditacion === "Todas" ? "Todas las Instituciones" : filtroAcreditacion === "Acreditada" ? "Solo Acreditadas" : "No Acreditadas"}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownAcreditacionAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
                </button>
                
                {dropdownAcreditacionAbierto && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownAcreditacionAbierto(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                      {[
                        { id: "Todas", label: "Todas las Instituciones" },
                        { id: "Acreditada", label: "Acreditada por CNA" },
                        { id: "No Acreditada", label: "No Acreditada" }
                      ].map((opc) => (
                        <button key={opc.id} onClick={() => { setFiltroAcreditacion(opc.id); setPaginaActual(1); setDropdownAcreditacionAbierto(false); }} 
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${filtroAcreditacion === opc.id ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}>
                          <span className="whitespace-normal break-words leading-tight flex items-center gap-2">
                            {opc.id === "Acreditada" && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                            {opc.label}
                          </span>
                          {filtroAcreditacion === opc.id && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* FILTRO 4: ORDENAR POR NOMBRE */}
              <div className="relative mb-4">
                <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Ordenar Resultados</span>
                <button onClick={() => setDropdownOrdenAbierto(!dropdownOrdenAbierto)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownOrdenAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <SlidersHorizontal className="w-4 h-4 text-[#6544FF]/70 shrink-0 mt-0.5" />
                    <span className="font-semibold text-sm text-[#1A1528] text-left whitespace-nowrap overflow-hidden text-ellipsis">
                      {ordenNombre === "asc" ? "Nombre (A - Z)" : "Nombre (Z - A)"}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownOrdenAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
                </button>
                
                {dropdownOrdenAbierto && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOrdenAbierto(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                      {[
                        { id: "asc", label: "Nombre (A - Z)" },
                        { id: "desc", label: "Nombre (Z - A)" }
                      ].map((opc) => (
                        <button key={opc.id} onClick={() => { setOrdenNombre(opc.id); setPaginaActual(1); setDropdownOrdenAbierto(false); }} 
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${ordenNombre === opc.id ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}>
                          <span className="whitespace-normal break-words leading-tight">{opc.label}</span>
                          {ordenNombre === opc.id && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* LISTA DE INSTITUCIONES (CON DISEÑO IDÉNTICO AL EJEMPLO) */}
          <div className="flex-1 w-full space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-2 animate-in fade-in gap-4 relative z-20">
              <p className="font-bold text-gray-500 text-xl flex items-center gap-2">
                {cargando ? <><Loader2 className="w-6 h-6 animate-spin text-[#6544FF]" /> Buscando...</> : <>Mostrando <span className="text-[#6544FF]">{institucionesFiltradas.length}</span> instituciones</>}
              </p>
            </div>

            {!cargando && institucionesPaginadas.map((inst, i) => (
              <a 
                key={`${inst.codigo_institucion}-${paginaActual}`}
                href={`/institucion/${inst.codigo_institucion}`}
                onClick={(e) => handleNavegar(e, inst.codigo_institucion)}
                className={`group relative block bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-sm border-2 overflow-hidden transition-all duration-500 ease-out
                  ${navegandoA === inst.codigo_institucion 
                    ? 'border-[#6544FF] scale-[0.98] opacity-90 shadow-inner z-50' 
                    : 'border-transparent hover:border-[#6544FF]/30 hover:-translate-y-2'
                  }`}
                style={{ animationDelay: `${(i % 10) * 50}ms` }}
              >
                
                {/* --- NUEVA CAPA DE ANIMACIÓN DE CARGA (Al hacer click) --- */}
                {navegandoA === inst.codigo_institucion && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="relative mb-3">
                      <div className="absolute inset-0 bg-[#6544FF] blur-xl opacity-40 rounded-full animate-pulse"></div>
                      <Loader2 className="w-12 h-12 text-[#6544FF] animate-spin relative z-10" />
                    </div>
                    <span className="font-black text-xl text-[#1A1528] tracking-tight animate-pulse bg-white/50 px-4 py-1 rounded-full">
                      Accediendo...
                    </span>
                  </div>
                )}

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                  
                  {/* --- CONTENEDOR DE LOGO (BLANCO CON GLOW Y ZOOM IGUAL AL EJEMPLO) --- */}
                  <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                    <div className={`absolute inset-0 bg-gradient-to-br ${inst.color} rounded-[2rem] blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500 group-hover:scale-110`}></div>
                    <div className="relative w-full h-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100/80 flex items-center justify-center overflow-hidden transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] z-10">
                      {erroresLogos.includes(inst.codigo_institucion) ? (
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${inst.color} group-hover:scale-105 transition-transform duration-500`}>
                          <span className="text-white font-black text-2xl md:text-3xl tracking-tighter drop-shadow-md">
                            {obtenerSiglas(inst.nombre)}
                          </span>
                        </div>
                      ) : (
                        <img 
                          src={`/logos/${generarSlugLogo(inst.nombre)}`} 
                          alt={inst.nombre} 
                          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-sm" 
                          onError={() => handleLogoError(inst.codigo_institucion)} 
                        />
                      )}
                    </div>
                  </div>

                  {/* INFO CENTRAL */}
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="px-4 py-1.5 rounded-xl bg-[#6544FF]/10 text-[#6544FF] text-xs font-black uppercase tracking-widest">{inst.tipo || "Institución Superior"}</span>
                      {inst.adscrita_gratuidad && (
                        <span className="px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Gratuidad
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-6 group-hover:text-[#6544FF] transition-colors">
                      {inst.nombre}
                    </h3>
                    
                    {/* CHIPS DE DETALLES */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800">
                        <Award className={`w-4 h-4 ${inst.acreditada ? 'text-amber-500' : 'text-slate-400'}`} />
                        {inst.acreditada ? `Acreditada por CNA` : 'No Acreditada'}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-sm font-semibold text-slate-600">
                        <MapPin className="w-4 h-4" /> 
                        {inst.regiones.length > 1 ? `Presencia en ${inst.regiones.length} regiones` : inst.regiones[0] || "Sede Principal"}
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-[#6544FF] group-hover:text-white transition-all shrink-0">
                    <ChevronRight className="w-6 h-6" />
                  </div>

                </div>
              </a>
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
                    className={`w-10 h-10 rounded-2xl font-black text-sm transition-all ${pagina === paginaActual ? 'bg-[#6544FF] text-white scale-105 border-transparent shadow-md' : pagina === '...' ? 'bg-transparent border-none text-gray-400 cursor-default' : 'bg-white border-2 border-gray-200 text-slate-600 hover:border-[#6544FF]/50 hover:text-[#6544FF]'}`}
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
              <div className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-gray-300 shadow-sm animate-in fade-in duration-500">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-black text-2xl text-slate-700 mb-2">No hay resultados</h3>
                <p className="text-slate-500 text-sm font-medium">No se encontró ninguna institución que cumpla con todos los filtros.</p>
                <button onClick={() => { setFiltroTipo("Todos"); setFiltroAcreditacion("Todas"); setRegionActiva("todas"); setBusqueda(""); }} className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">
                  Limpiar Filtros
                </button>
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}} />
    </div>
  );
}