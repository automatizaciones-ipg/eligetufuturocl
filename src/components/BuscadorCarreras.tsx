// src/components/BuscadorCarreras.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import { 
  Search, SlidersHorizontal, Building, 
  MapPin, Clock, Calculator, 
  ChevronRight, Sparkles, ChevronDown, Loader2,
  ChevronLeft, CheckCircle2 
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// Importante: Usamos el "type" para evitar el error ts(1484)
import type { CarreraUI } from "../types"; 

const OPCIONES_ORDEN = [
  { id: "nombre_asc", label: "Nombre (A - Z)" },
  { id: "nombre_desc", label: "Nombre (Z - A)" },
  { id: "arancel_1", label: "Arancel $0 a $1.200.000", min: 0, max: 1200000 },
  { id: "arancel_2", label: "Arancel $1.200.000 a $2.200.000", min: 1200001, max: 2200000 },
  { id: "arancel_3", label: "Arancel $2.200.000 a $5.000.000", min: 2200001, max: 5000000 },
  { id: "arancel_4", label: "Arancel $5.000.000 - Sin límite", min: 5000001, max: 99999999 }
];

const PALETA_COLORES = [
  "from-blue-600 to-blue-400",
  "from-[#15803d] to-emerald-400",
  "from-[#6544FF] to-[#947BFF]",
  "from-orange-500 to-amber-400",
  "from-rose-500 to-pink-400"
];

const RESULTADOS_POR_PAGINA = 15; 

// --- Helpers de formateo ---

const generarTipoInst = (tipoBD: string | null) => {
  if (!tipoBD) return "N/A";
  if (tipoBD.includes("Universidades")) return "U";
  if (tipoBD.includes("Institutos")) return "IP";
  if (tipoBD.includes("Centros")) return "CFT";
  return "N/A";
};

const generarSiglaInstitucion = (nombre: string) => {
  if (!nombre) return "N/A";
  const palabras = nombre.replace(/\b(de|en|el|la|los|las|y)\b/gi, '').split(' ').filter(p => p.trim().length > 0);
  if (palabras.length > 1) {
    return (palabras[0][0] + (palabras[1]?.[0] || '') + (palabras[2]?.[0] || '')).toUpperCase().substring(0, 3);
  }
  return nombre.substring(0, 3).toUpperCase();
};

const normalizarNombreLogo = (nombre: string) => {
  return nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
};

const quitarAcentos = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const formatearTitulo = (texto: string) => {
  if (!texto) return "";
  const conectores = ['de', 'en', 'el', 'la', 'los', 'las', 'y', 'del', 'a', 'por', 'con', 'para'];
  return texto.toLowerCase().split(' ').map((palabra, index) => {
    if (index > 0 && conectores.includes(palabra)) return palabra;
    return palabra.charAt(0).toUpperCase() + palabra.slice(1);
  }).join(' ');
};

export default function BuscadorCarreras() {
  // --- ESTADOS ---
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [regionFiltro, setRegionFiltro] = useState("todas"); 
  const [institucionFiltro, setInstitucionFiltro] = useState("todas");
  const [orden, setOrden] = useState("nombre_asc"); 
  
  const [carreras, setCarreras] = useState<CarreraUI[]>([]);
  const [listaInstituciones, setListaInstituciones] = useState<{nombre: string}[]>([]);
  const [listaRegiones, setListaRegiones] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [erroresLogos, setErroresLogos] = useState<Record<string, boolean>>({});

  const [dropdownRegionAbierto, setDropdownRegionAbierto] = useState(false);
  const [dropdownInstitucionAbierto, setDropdownInstitucionAbierto] = useState(false);
  const [dropdownOrdenAbierto, setDropdownOrdenAbierto] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);

  // --- CARGA INICIAL DE FILTROS ---
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

  // --- FUNCIÓN MAESTRA DE BÚSQUEDA ---
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

      // Filtro de Texto
      if (busqueda.length >= 3) {
        const busquedaLimpia = quitarAcentos(busqueda);
        query = query.ilike('nombre_carrera', `%${busquedaLimpia}%`);
      }

      // Filtro Tipo Institución
      if (tipoFiltro !== "todos") {
        let tipoBD = "";
        if (tipoFiltro === "U") tipoBD = "Universidades";
        if (tipoFiltro === "IP") tipoBD = "Institutos Profesionales";
        if (tipoFiltro === "CFT") tipoBD = "Centros de Formación Técnica";
        if (tipoBD) query = query.eq('instituciones.tipo', tipoBD);
      }

      // Filtro Institución
      if (institucionFiltro !== "todas") {
        query = query.eq('instituciones.nombre', institucionFiltro);
      }

      // Filtro Región
      if (regionFiltro !== "todas") {
        query = query.eq('region', regionFiltro); 
      }

      // --- FILTROS DE ARANCEL ---
      const opcionArancel = OPCIONES_ORDEN.find(o => o.id === orden);
      if (opcionArancel && orden.startsWith("arancel_")) {
        query = query.gte('arancel_anual', opcionArancel.min || 0);
        query = query.lte('arancel_anual', opcionArancel.max || 99999999);
      }

      // --- ORDENAMIENTO ---
      if (orden === "nombre_desc") {
        query = query.order('nombre_carrera', { ascending: false });
      } else {
        query = query.order('nombre_carrera', { ascending: true });
      }

      // Paginación
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
            nombre: formatearTitulo(item.nombre_carrera),
            sigla: generarSiglaInstitucion(instNombre), 
            institucion: formatearTitulo(instNombre),
            tipoInst: generarTipoInst(item.instituciones?.tipo),
            region: item.region || "No informada",
            puntaje: item.arancel_anual ? `$${item.arancel_anual.toLocaleString('es-CL')}` : "No informado",
            duracion: item.duracion_semestres ? `${item.duracion_semestres} Sem. ` : "No informada",
            color: PALETA_COLORES[index % PALETA_COLORES.length],
            logoArchivo: `${normalizarNombreLogo(instNombre)}.png`
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

  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchCarreras(); }, 300); 
    return () => clearTimeout(timeoutId);
  }, [fetchCarreras]);

  const handleLogoError = (carreraId: string) => {
    setErroresLogos(prev => ({ ...prev, [carreraId]: true }));
  };

  const totalPaginas = Math.ceil(totalResultados / RESULTADOS_POR_PAGINA);

  const formatRegionLabel = (region: string) => {
    if (region === "todas") return "Todas las Regiones";
    if (region === "Metropolitana") return "Región Metropolitana";
    return `Región de ${region}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      
      {/* HEADER BUSCADOR */}
      <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-[#6544FF]/20 mb-12 relative overflow-hidden animate-in fade-in slide-in-from-top-8">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-br from-[#6544FF]/30 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-black italic uppercase text-4xl md:text-5xl text-white tracking-tight mb-6 leading-tight">
            Encuentra tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6544FF] to-cyan-400">Carrera Ideal</span>
          </h2>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#6544FF] to-cyan-400 rounded-2xl blur-md opacity-25 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative bg-white rounded-2xl p-2 flex items-center shadow-lg">
              <div className="pl-4 pr-2 text-gray-400"><Search className="w-6 h-6" /></div>
              <input 
                type="text" 
                placeholder="Ej: Enfermería, Computación, Arquitectura..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-[#1A1528] placeholder:text-gray-400 py-3 outline-none"
              />
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
            
            {/* Tipo Institución */}
            <div className="mb-8 mt-2">
              <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Tipo de Institución</span>
              <div className="bg-gray-100/70 p-1.5 rounded-2xl flex border border-gray-200/50">
                {["todos", "U", "IP", "CFT"].map((tipo) => (
                  <button key={tipo} onClick={() => { setTipoFiltro(tipo); setPaginaActual(1); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 capitalize ${tipoFiltro === tipo ? 'bg-white text-[#6544FF] shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-[#1A1528] hover:bg-gray-200/50'}`}>
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown Orden y Arancel */}
            <div className="relative mb-8">
              <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Ordenar y Filtrar Precio</span>
              <button onClick={() => setDropdownOrdenAbierto(!dropdownOrdenAbierto)}
                className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownOrdenAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-start gap-2 flex-1">
                  <Calculator className="w-4 h-4 text-[#6544FF]/70 shrink-0 mt-0.5" />
                  <span className="font-semibold text-sm text-[#1A1528] text-left">
                    {OPCIONES_ORDEN.find(o => o.id === orden)?.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownOrdenAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
              </button>
              
              {dropdownOrdenAbierto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOrdenAbierto(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                    {OPCIONES_ORDEN.map((opc) => (
                      <button key={opc.id} onClick={() => { setOrden(opc.id); setPaginaActual(1); setDropdownOrdenAbierto(false); }} 
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${orden === opc.id ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}>
                        <span className="whitespace-normal break-words leading-tight">{opc.label}</span>
                        {orden === opc.id && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dropdown Institución */}
            <div className="relative mb-8">
              <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Institución</span>
              <button onClick={() => setDropdownInstitucionAbierto(!dropdownInstitucionAbierto)}
                className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownInstitucionAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-start gap-2 flex-1">
                  <Building className="w-4 h-4 text-[#6544FF]/70 shrink-0 mt-0.5" />
                  <span className="font-semibold text-sm text-[#1A1528] text-left">
                    {institucionFiltro === "todas" ? "Todas las Instituciones" : formatearTitulo(institucionFiltro)}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownInstitucionAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
              </button>
              
              {dropdownInstitucionAbierto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownInstitucionAbierto(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                    <button onClick={() => { setInstitucionFiltro("todas"); setPaginaActual(1); setDropdownInstitucionAbierto(false); }} 
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${institucionFiltro === "todas" ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}>
                      <span className="whitespace-normal break-words leading-tight">Todas las Instituciones</span>
                      {institucionFiltro === "todas" && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                    </button>
                    {listaInstituciones.map((inst, idx) => (
                      <button key={idx} onClick={() => { setInstitucionFiltro(inst.nombre); setPaginaActual(1); setDropdownInstitucionAbierto(false); }} 
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${institucionFiltro === inst.nombre ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}>
                        <span className="pr-2 whitespace-normal break-words leading-tight">{formatearTitulo(inst.nombre)}</span>
                        {institucionFiltro === inst.nombre && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dropdown Región */}
            <div className="relative">
              <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Región</span>
              <button onClick={() => setDropdownRegionAbierto(!dropdownRegionAbierto)}
                className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none gap-2 ${dropdownRegionAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-start gap-2 flex-1">
                  <MapPin className="w-4 h-4 text-[#6544FF]/70 shrink-0 mt-0.5" />
                  <span className="font-semibold text-sm text-[#1A1528] text-left">
                    {formatRegionLabel(regionFiltro)}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-300 ${dropdownRegionAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
              </button>

              {dropdownRegionAbierto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownRegionAbierto(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
                    <button onClick={() => { setRegionFiltro("todas"); setPaginaActual(1); setDropdownRegionAbierto(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${regionFiltro === "todas" ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}>
                      <span className="whitespace-normal break-words leading-tight">Todas las Regiones</span>
                      {regionFiltro === "todas" && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                    </button>
                    {listaRegiones.map(regionName => (
                      <button key={regionName} onClick={() => { setRegionFiltro(regionName); setPaginaActual(1); setDropdownRegionAbierto(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-start justify-between gap-2 transition-colors ${regionFiltro === regionName ? 'bg-[#6544FF]/10 text-[#6544FF]' : 'text-slate-700 hover:bg-gray-100'}`}>
                        <span className="pr-2 whitespace-normal break-words leading-tight">{formatRegionLabel(regionName)}</span>
                        {regionFiltro === regionName && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 px-2 animate-in fade-in gap-4 relative z-20">
            <p className="font-bold text-gray-500 text-sm flex items-center gap-2">
              {cargando ? <><Loader2 className="w-4 h-4 animate-spin text-[#6544FF]" /> Buscando...</> : <>Mostrando <span className="text-[#1A1528]">{carreras.length}</span> de <span className="text-[#1A1528]">{totalResultados}</span> carreras</>}
            </p>
          </div>

          {!cargando && carreras.map((carrera, i) => (
            <a key={carrera.id} href={`/carrera/${carrera.id}`}
               className="group relative block bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-sm border-2 border-transparent hover:border-[#6544FF]/30 hover:-translate-y-2 transition-all duration-500 overflow-hidden"
               style={{ animationDelay: `${i * 50}ms` }}>
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                
                {/* --- NUEVO CONTENEDOR DE LOGO --- */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                  {/* Resplandor animado de fondo */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${carrera.color} rounded-[2rem] blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500 group-hover:scale-110`}></div>
                  
                  {/* Contenedor principal del Logo */}
                  <div className="relative w-full h-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100/80 flex items-center justify-center overflow-hidden transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] z-10">
                    {erroresLogos[carrera.id] ? (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${carrera.color} group-hover:scale-105 transition-transform duration-500`}>
                        <span className="text-white font-black text-2xl md:text-3xl tracking-tighter drop-shadow-md">
                          {carrera.sigla}
                        </span>
                      </div>
                    ) : (
                      <img 
                        src={`/logos/${carrera.logoArchivo}`} 
                        alt={carrera.institucion} 
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-sm" 
                        onError={() => handleLogoError(carrera.id)} 
                      />
                    )}
                  </div>
                </div>
                {/* --- FIN NUEVO CONTENEDOR DE LOGO --- */}

                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-4 py-1.5 rounded-xl bg-[#6544FF]/10 text-[#6544FF] text-xs font-black uppercase tracking-widest">{carrera.tipoInst}</span>
                    <span className="px-4 py-1.5 rounded-xl bg-slate-100/80 text-slate-500 text-xs font-bold uppercase flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {carrera.region}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-6 group-hover:text-[#6544FF] transition-colors">{carrera.nombre}</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-sm font-semibold text-slate-600"><Building className="w-4 h-4" /> {carrera.institucion}</div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-sm font-bold text-slate-800"><Calculator className="w-4 h-4" /> {carrera.puntaje}</div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl text-sm font-semibold text-slate-600"><Clock className="w-4 h-4" /> {carrera.duracion}</div>
                  </div>
                </div>
                
                <div className="w-full md:w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-[#6544FF] group-hover:text-white transition-all">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </a>
          ))}

          {/* PAGINACIÓN */}
          {!cargando && totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
               <button 
                 onClick={() => { 
                   setPaginaActual(p => Math.max(1, p - 1)); 
                   window.scrollTo({ top: 0, behavior: 'smooth' }); 
                 }} 
                 disabled={paginaActual === 1} 
                 className="w-12 h-12 rounded-2xl border-2 border-gray-200 text-[#1A1528] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
               
               <span className="font-black text-slate-700">Página {paginaActual} de {totalPaginas}</span>
               
               <button 
                 onClick={() => { 
                   setPaginaActual(p => p + 1); 
                   window.scrollTo({ top: 0, behavior: 'smooth' }); 
                 }} 
                 disabled={paginaActual >= totalPaginas} 
                 className="w-12 h-12 rounded-2xl border-2 border-gray-200 text-[#1A1528] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}