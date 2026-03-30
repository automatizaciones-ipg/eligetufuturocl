// src/components/BuscadorCarreras.tsx
import { useState, useEffect, useCallback } from "react";
import { 
  Search, SlidersHorizontal, Building, 
  MapPin, Clock, Calculator, 
  ChevronRight, Sparkles, ChevronDown, Loader2,
  ChevronLeft, CheckCircle2 
} from "lucide-react";
import { supabase } from "../../lib/supabase"; 

interface CarreraUI {
  id: string;
  nombre: string;
  sigla: string;
  institucion: string;
  tipoInst: string;
  region: string;
  puntaje: string;
  duracion: string;
  color: string;
  logoArchivo: string; // Nueva propiedad
}

const REGIONES = [
  { id: "todas", label: "Todas las Regiones", keyword: "" },
  { id: "arica", label: "Región de Arica y Parinacota", keyword: "Arica" },
  { id: "tarapaca", label: "Región de Tarapacá", keyword: "Tarapacá" },
  { id: "antofagasta", label: "Región de Antofagasta", keyword: "Antofagasta" },
  { id: "atacama", label: "Región de Atacama", keyword: "Atacama" },
  { id: "coquimbo", label: "Región de Coquimbo", keyword: "Coquimbo" },
  { id: "valpo", label: "Región de Valparaíso", keyword: "Valparaíso" },
  { id: "rm", label: "Región Metropolitana", keyword: "Metropolitana" },
  { id: "ohiggins", label: "Región de O'Higgins", keyword: "O'Higgins" },
  { id: "maule", label: "Región del Maule", keyword: "Maule" },
  { id: "nuble", label: "Región de Ñuble", keyword: "Ñuble" },
  { id: "biobio", label: "Región del Biobío", keyword: "Biobío" },
  { id: "araucania", label: "Región de La Araucanía", keyword: "Araucanía" },
  { id: "losrios", label: "Región de Los Ríos", keyword: "Ríos" },
  { id: "loslagos", label: "Región de Los Lagos", keyword: "Lagos" },
  { id: "aysen", label: "Región de Aysén", keyword: "Aysén" },
  { id: "magallanes", label: "Región de Magallanes", keyword: "Magallanes" }
];

const OPCIONES_ORDEN = [
  { id: "nombre_asc", label: "Nombre (A - Z)" },
  { id: "nombre_desc", label: "Nombre (Z - A)" },
  { id: "arancel_asc", label: "Menor Arancel" }
];

const PALETA_COLORES = [
  "from-blue-600 to-blue-400",
  "from-[#15803d] to-emerald-400",
  "from-[#6544FF] to-[#947BFF]",
  "from-orange-500 to-amber-400",
  "from-rose-500 to-pink-400"
];

const RESULTADOS_POR_PAGINA = 15; 

const generarTipoInst = (tipoBD: string | null) => {
  if (!tipoBD) return "N/A";
  if (tipoBD.includes("Universidades")) return "U";
  if (tipoBD.includes("Institutos")) return "IP";
  if (tipoBD.includes("Centros")) return "CFT";
  return "N/A";
};

const generarSigla = (nombre: string) => {
  const palabras = nombre.replace(/de|en|el|la|los/gi, '').split(' ').filter(p => p.length > 0);
  if (palabras.length > 1) {
    return (palabras[0][0] + (palabras[1]?.[0] || '') + (palabras[2]?.[0] || '')).toUpperCase().substring(0, 3);
  }
  return nombre.substring(0, 3).toUpperCase();
};

// NUEVA FUNCIÓN: Transforma el nombre exacto a formato archivo
const normalizarNombreLogo = (nombre: string) => {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[^a-z0-9\s-]/g, "") // Quita caracteres especiales
    .trim()
    .replace(/\s+/g, "-"); // Cambia espacios por guiones
};

export default function BuscadorCarreras() {
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [regionFiltro, setRegionFiltro] = useState("todas");
  const [orden, setOrden] = useState("nombre_asc"); 
  
  const [carreras, setCarreras] = useState<CarreraUI[]>([]);
  const [cargando, setCargando] = useState(false);
  
  // ESTADO PARA MANEJAR IMÁGENES ROTAS O FALTANTES
  const [erroresLogos, setErroresLogos] = useState<Record<string, boolean>>({});

  const [dropdownRegionAbierto, setDropdownRegionAbierto] = useState(false);
  const [dropdownOrdenAbierto, setDropdownOrdenAbierto] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);

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
          instituciones!inner (nombre, tipo)
        `, { count: 'exact' });

      if (busqueda.length >= 3) {
        query = query.ilike('nombre_carrera', `%${busqueda}%`);
      }

      if (tipoFiltro !== "todos") {
        let tipoBD = "";
        if (tipoFiltro === "U") tipoBD = "Universidades";
        if (tipoFiltro === "IP") tipoBD = "Institutos Profesionales";
        if (tipoFiltro === "CFT") tipoBD = "Centros de Formación Técnica";
        if (tipoBD) query = query.eq('instituciones.tipo', tipoBD);
      }

      const regionSel = REGIONES.find(r => r.id === regionFiltro);
      if (regionSel && regionSel.keyword !== "") {
        query = query.ilike('region', `%${regionSel.keyword}%`);
      }

      if (orden === "nombre_asc") {
        query = query.order('nombre_carrera', { ascending: true });
      } else if (orden === "nombre_desc") {
        query = query.order('nombre_carrera', { ascending: false });
      } else if (orden === "arancel_asc") {
        query = query.order('arancel_anual', { ascending: true, nullsFirst: false });
      }

      const from = (paginaActual - 1) * RESULTADOS_POR_PAGINA;
      const to = from + RESULTADOS_POR_PAGINA - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;
      if (count !== null) setTotalResultados(count);

      if (data) {
        let resultadosAdaptados: CarreraUI[] = data.map((item: any, index: number) => {
          const instNombre = item.instituciones?.nombre || "Institución Desconocida";
          return {
            id: item.codigo_carrera,
            nombre: item.nombre_carrera,
            sigla: generarSigla(item.nombre_carrera),
            institucion: instNombre,
            tipoInst: generarTipoInst(item.instituciones?.tipo),
            region: item.region || "No informada",
            puntaje: item.arancel_anual ? `$${item.arancel_anual.toLocaleString('es-CL')}` : "No informado",
            duracion: item.duracion_semestres ? `${item.duracion_semestres} Sem. ` : "No informada",
            color: PALETA_COLORES[index % PALETA_COLORES.length],
            logoArchivo: `${normalizarNombreLogo(instNombre)}.png` // Se genera el nombre del archivo
          };
        });

        setCarreras(resultadosAdaptados);
      }
    } catch (err) {
      console.error("Error consultando Supabase:", err);
    } finally {
      setCargando(false);
    }
  }, [busqueda, tipoFiltro, regionFiltro, paginaActual, orden]); 

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCarreras();
    }, 300); 
    return () => clearTimeout(timeoutId);
  }, [fetchCarreras]);

  const handleLogoError = (carreraId: string) => {
    setErroresLogos(prev => ({ ...prev, [carreraId]: true }));
  };

  const totalPaginas = Math.ceil(totalResultados / RESULTADOS_POR_PAGINA);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      
      {/* HEADER BUSCADOR MAESTRO */}
      <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-[#6544FF]/20 mb-12 relative overflow-hidden animate-in fade-in slide-in-from-top-8">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-[#6544FF]/30 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-black italic uppercase text-4xl md:text-5xl text-white tracking-tight mb-6 leading-tight">
            Encuentra tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6544FF] to-cyan-400">Carrera Ideal</span>
          </h2>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#6544FF] to-cyan-400 rounded-2xl blur-md opacity-25 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative bg-white rounded-2xl p-2 flex items-center shadow-lg">
              <div className="pl-4 pr-2 text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Ej: Enfermería, Computación, Arquitectura..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-[#1A1528] placeholder:text-gray-400 py-3 outline-none"
              />
              <button 
                onClick={fetchCarreras}
                className="hidden md:flex items-center gap-2 bg-[#1A1528] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-[#6544FF] transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        
        {/* PANEL DE CONTROL (Filtros) */}
        <div className="w-full lg:w-80 shrink-0 sticky top-24 z-30 animate-in fade-in slide-in-from-bottom-8 delay-150">
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100/80">
            <h3 className="font-black text-lg text-[#1A1528] uppercase tracking-wider mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
              <SlidersHorizontal className="w-5 h-5 text-[#6544FF]" /> Filtros
            </h3>
            
            <div className="mb-8 mt-2">
              <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Tipo de Institución</span>
              <div className="bg-gray-100/70 p-1.5 rounded-2xl flex border border-gray-200/50">
                {["todos", "U", "IP", "CFT"].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => { setTipoFiltro(tipo); setPaginaActual(1); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 capitalize
                      ${tipoFiltro === tipo 
                        ? 'bg-white text-[#6544FF] shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-[#1A1528] hover:bg-gray-200/50'}`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Región</span>
              
              <button 
                onClick={() => setDropdownRegionAbierto(!dropdownRegionAbierto)}
                className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none
                  ${dropdownRegionAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#6544FF]/70" />
                  <span className="font-semibold text-sm text-[#1A1528] truncate max-w-[180px]">
                    {REGIONES.find(r => r.id === regionFiltro)?.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownRegionAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
              </button>

              {dropdownRegionAbierto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownRegionAbierto(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                    {REGIONES.map(r => (
                      <button 
                        key={r.id}
                        onClick={() => {
                          setRegionFiltro(r.id);
                          setPaginaActual(1);
                          setDropdownRegionAbierto(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between
                          ${regionFiltro === r.id 
                            ? 'bg-[#6544FF]/5 text-[#6544FF]' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#1A1528]'}
                        `}
                      >
                        {r.label}
                        {regionFiltro === r.id && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* RESULTADOS DE CARRERAS */}
        <div className="flex-1 w-full space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-2 animate-in fade-in gap-4 relative z-20">
            <p className="font-bold text-gray-500 text-sm flex items-center gap-2">
              {cargando ? (
                <><Loader2 className="w-4 h-4 animate-spin text-[#6544FF]" /> Buscando en la base de datos...</>
              ) : (
                <>Mostrando <span className="text-[#1A1528]">{carreras.length}</span> de <span className="text-[#1A1528]">{totalResultados}</span> carreras</>
              )}
            </p>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden sm:block shrink-0">
                Ordenar por:
              </span>
              
              <div className="relative w-full sm:w-auto">
                <button 
                  onClick={() => setDropdownOrdenAbierto(!dropdownOrdenAbierto)}
                  className={`w-full sm:w-48 flex items-center justify-between px-4 py-2.5 bg-white border text-left rounded-xl transition-all duration-300 outline-none shadow-sm
                    ${dropdownOrdenAbierto ? 'border-[#6544FF]/50 ring-2 ring-[#6544FF]/10' : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <span className="font-semibold text-sm text-[#1A1528] truncate">
                    {OPCIONES_ORDEN.find(o => o.id === orden)?.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownOrdenAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
                </button>

                {dropdownOrdenAbierto && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOrdenAbierto(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] right-0 w-full sm:w-48 bg-white border border-gray-100 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      {OPCIONES_ORDEN.map(o => (
                        <button 
                          key={o.id}
                          onClick={() => {
                            setOrden(o.id);
                            setPaginaActual(1);
                            setDropdownOrdenAbierto(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between
                            ${orden === o.id 
                              ? 'bg-[#6544FF]/5 text-[#6544FF]' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-[#1A1528]'}
                          `}
                        >
                          {o.label}
                          {orden === o.id && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {!cargando && carreras.map((carrera, i) => (
            <div 
              key={carrera.id}
              className={`group bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-2 border-transparent hover:border-[#6544FF]/20 hover:shadow-[0_15px_40px_rgba(101,68,255,0.08)] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 animate-in slide-in-from-bottom-8 fade-in fill-mode-both relative overflow-hidden`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              
              <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${carrera.color} rounded-full opacity-5 blur-[60px] pointer-events-none group-hover:opacity-20 transition-opacity duration-500`}></div>

              {/* RENDERIZADO INTELIGENTE DE LOGO O SIGLA */}
              <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg bg-gradient-to-br ${carrera.color} transform group-hover:-rotate-3 group-hover:scale-105 transition-all duration-500 overflow-hidden`}>
                {erroresLogos[carrera.id] ? (
                  <span className="text-white">{carrera.sigla}</span>
                ) : (
                  <img 
                    src={`/logos/${carrera.logoArchivo}`} 
                    alt={`Logo ${carrera.institucion}`} 
                    className="w-full h-full object-contain bg-white p-2"
                    onError={() => handleLogoError(carrera.id)}
                  />
                )}
              </div>

              <div className="flex-1 w-full z-10">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="flex items-center justify-center px-2.5 h-[26px] rounded bg-[#1A1528] text-white shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-wider">{carrera.tipoInst}</span>
                  </div>
                </div>
                
                <h3 className="font-black text-xl md:text-2xl text-[#1A1528] mb-1 leading-tight group-hover:text-[#6544FF] transition-colors">
                  {carrera.nombre}
                </h3>
                
                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500 mt-3">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="truncate max-w-[200px] md:max-w-none">{carrera.institucion}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-gray-400" />
                    Arancel: <span className="text-[#1A1528]">{carrera.puntaje}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {carrera.duracion}
                  </span>
                </div>
              </div>

              <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 flex md:flex-col items-center justify-between md:justify-center gap-4 shrink-0 z-10">
                <div className="hidden md:block text-center mb-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ver Detalles</p>
                </div>
                <a 
                  href={`/carrera/${carrera.id}`}
                  className="bg-[#1A1528] hover:bg-[#6544FF] text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-md group-hover:shadow-[0_10px_30px_rgba(101,68,255,0.3)]"
                >
                  <ChevronRight className="w-6 h-6" />
                </a>
              </div>

            </div>
          ))}

          {/* CONTROLES DE PAGINACIÓN */}
          {!cargando && totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-100 animate-in fade-in">
              <button
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
                className="p-3 rounded-2xl border border-gray-200 text-gray-500 bg-white hover:text-[#6544FF] hover:border-[#6544FF]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-[#1A1528]">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {totalResultados} Resultados
                </span>
              </div>

              <button
                onClick={() => setPaginaActual(prev => prev + 1)}
                disabled={paginaActual >= totalPaginas}
                className="p-3 rounded-2xl border border-gray-200 text-gray-500 bg-white hover:text-[#6544FF] hover:border-[#6544FF]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Empty State */}
          {!cargando && carreras.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 mt-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-black text-xl text-[#1A1528] mb-2">Sin resultados</h3>
              <p className="text-gray-500 text-sm font-medium">Intenta ajustar los filtros, usar menos letras o cambiar la región.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}