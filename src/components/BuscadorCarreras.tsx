// src/components/BuscadorCarreras.tsx
import { useState, useEffect } from "react";
import { 
  Search, SlidersHorizontal, Building, 
  MapPin, CheckCircle2, Clock, Calculator, 
  ChevronRight, Sparkles, ChevronDown
} from "lucide-react";

// --- DATOS SIMULADOS ---
const DATOS_CARRERAS = [
  {
    id: 1,
    nombre: "Ingeniería Civil en Computación",
    sigla: "INF",
    institucion: "Universidad de Chile",
    tipoInst: "U",
    region: "rm",
    gratuidad: true,
    puntaje: "845 pts",
    duracion: "11 Semestres",
    color: "from-blue-600 to-blue-400", 
  },
  {
    id: 2,
    nombre: "Técnico en Enfermería (TENS)",
    sigla: "TEN",
    institucion: "Duoc UC",
    tipoInst: "IP",
    region: "rm",
    gratuidad: true,
    puntaje: "NEM / Notas",
    duracion: "5 Semestres",
    color: "from-[#15803d] to-emerald-400",
  },
  {
    id: 3,
    nombre: "Psicología",
    sigla: "PSI",
    institucion: "Universidad de Concepción",
    tipoInst: "U",
    region: "biobio",
    gratuidad: true,
    puntaje: "780 pts",
    duracion: "10 Semestres",
    color: "from-[#6544FF] to-[#947BFF]",
  },
  {
    id: 4,
    nombre: "Mecánica Automotriz",
    sigla: "MEC",
    institucion: "INACAP",
    tipoInst: "CFT",
    region: "valpo",
    gratuidad: true,
    puntaje: "NEM / Notas",
    duracion: "4 Semestres",
    color: "from-orange-500 to-amber-400",
  },
  {
    id: 5,
    nombre: "Arquitectura",
    sigla: "ARQ",
    institucion: "Universidad Adolfo Ibáñez",
    tipoInst: "U",
    region: "rm",
    gratuidad: false,
    puntaje: "710 pts",
    duracion: "10 Semestres",
    color: "from-rose-500 to-pink-400",
  }
];

const REGIONES = [
  { id: "todas", label: "Todas las Regiones" },
  { id: "rm", label: "Región Metropolitana" },
  { id: "valpo", label: "Valparaíso" },
  { id: "biobio", label: "Biobío" }
];

export default function BuscadorCarreras() {
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [soloGratuidad, setSoloGratuidad] = useState(false);
  const [regionFiltro, setRegionFiltro] = useState("todas");
  const [carreras, setCarreras] = useState(DATOS_CARRERAS);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  useEffect(() => {
    setCarreras([]); 
    setTimeout(() => {
      let result = DATOS_CARRERAS;

      if (busqueda) {
        result = result.filter(c => 
          c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          c.institucion.toLowerCase().includes(busqueda.toLowerCase())
        );
      }
      if (tipoFiltro !== "todos") {
        result = result.filter(c => c.tipoInst === tipoFiltro);
      }
      if (soloGratuidad) {
        result = result.filter(c => c.gratuidad);
      }
      if (regionFiltro !== "todas") {
        result = result.filter(c => c.region === regionFiltro);
      }

      setCarreras(result);
    }, 50);
  }, [busqueda, tipoFiltro, soloGratuidad, regionFiltro]);

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
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-[#1A1528] placeholder:text-gray-400 py-3 outline-none"
              />
              <button className="hidden md:flex items-center gap-2 bg-[#1A1528] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-[#6544FF] transition-colors">
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
            
            <div className="mb-8">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl transition-all duration-300 ${soloGratuidad ? 'bg-emerald-100/50 text-emerald-600 shadow-[0_2px_10px_rgba(16,185,129,0.2)]' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-[#1A1528] text-sm">Gratuidad</span>
                    <span className="block text-xs text-gray-500">Solo inst. adscritas</span>
                  </div>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${soloGratuidad ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${soloGratuidad ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <input type="checkbox" className="sr-only" checked={soloGratuidad} onChange={() => setSoloGratuidad(!soloGratuidad)} />
              </label>
            </div>

            <div className="mb-8">
              <span className="block font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Tipo de Institución</span>
              <div className="bg-gray-100/70 p-1.5 rounded-2xl flex border border-gray-200/50">
                {["todos", "U", "IP", "CFT"].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setTipoFiltro(tipo)}
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
                onClick={() => setDropdownAbierto(!dropdownAbierto)}
                className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-white border text-left rounded-2xl transition-all duration-300 outline-none
                  ${dropdownAbierto ? 'border-[#6544FF]/50 ring-4 ring-[#6544FF]/10 bg-white' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#6544FF]/70" />
                  <span className="font-semibold text-sm text-[#1A1528]">
                    {REGIONES.find(r => r.id === regionFiltro)?.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${dropdownAbierto ? 'rotate-180 text-[#6544FF]' : ''}`} />
              </button>

              {dropdownAbierto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownAbierto(false)}></div>
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {REGIONES.map(r => (
                      <button 
                        key={r.id}
                        onClick={() => {
                          setRegionFiltro(r.id);
                          setDropdownAbierto(false);
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
          
          <div className="flex justify-between items-center mb-2 px-2 animate-in fade-in">
            <p className="font-bold text-gray-500 text-sm">
              Mostrando <span className="text-[#1A1528]">{carreras.length}</span> resultados
            </p>
          </div>

          {carreras.map((carrera, i) => (
            <div 
              key={carrera.id}
              className={`group bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-2 border-transparent hover:border-[#6544FF]/20 hover:shadow-[0_15px_40px_rgba(101,68,255,0.08)] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 animate-in slide-in-from-bottom-8 fade-in fill-mode-both relative overflow-hidden`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              
              <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${carrera.color} rounded-full opacity-5 blur-[60px] pointer-events-none group-hover:opacity-20 transition-opacity duration-500`}></div>

              {/* Logo / Sigla */}
              <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg bg-gradient-to-br ${carrera.color} transform group-hover:-rotate-3 group-hover:scale-105 transition-all duration-500`}>
                {carrera.sigla}
              </div>

              {/* Información Principal */}
              <div className="flex-1 w-full">
                
                {/* 🔴 AQUÍ ESTÁ EL TOQUE ELEGANTE 🔴 */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {/* Mini Badge oscuro para U, IP, CFT */}
                  <div className="flex items-center justify-center px-2.5 h-[26px] rounded bg-[#1A1528] text-white shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-wider">{carrera.tipoInst}</span>
                  </div>
                  
                  {/* Badge Gratuidad */}
                  {carrera.gratuidad && (
                    <span className="h-[26px] px-2.5 rounded bg-emerald-50 text-emerald-600 flex items-center gap-1.5 border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 
                      <span className="text-[10px] font-bold uppercase tracking-widest mt-px">Gratuidad</span>
                    </span>
                  )}
                </div>
                
                <h3 className="font-black text-xl md:text-2xl text-[#1A1528] mb-1 leading-tight group-hover:text-[#6544FF] transition-colors">
                  {carrera.nombre}
                </h3>
                
                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500 mt-3">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-gray-400" />
                    {carrera.institucion}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-gray-400" />
                    Corte: <span className="text-[#1A1528]">{carrera.puntaje}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {carrera.duracion}
                  </span>
                </div>
              </div>

              {/* Botón de Acción Lateral */}
              <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 flex md:flex-col items-center justify-between md:justify-center gap-4 shrink-0 z-10">
                <div className="hidden md:block text-center mb-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ver Malla</p>
                </div>
                <button className="bg-[#1A1528] hover:bg-[#6544FF] text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-md group-hover:shadow-[0_10px_30px_rgba(101,68,255,0.3)]">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

            </div>
          ))}

          {/* Empty State */}
          {carreras.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 mt-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-black text-xl text-[#1A1528] mb-2">Sin resultados</h3>
              <p className="text-gray-500 text-sm font-medium">Intenta ajustar los filtros o cambiar la región.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}