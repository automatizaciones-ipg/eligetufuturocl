// src/components/DirectorioInstituciones.tsx
import { useState, useEffect } from "react";
import { 
  Building2, Map, Award, CheckCircle2, ChevronRight, 
  Search, MapPin, Globe, BookOpen, Star
} from "lucide-react";

// --- DATOS SIMULADOS (Contexto Chile) ---
const REGIONES = [
  { id: "todas", nombre: "Todo el País", count: 124 },
  { id: "rm", nombre: "Región Metropolitana", count: 45 },
  { id: "valpo", nombre: "Valparaíso", count: 18 },
  { id: "biobio", nombre: "Biobío", count: 15 },
  { id: "norte", nombre: "Zona Norte", count: 22 },
  { id: "sur", nombre: "Zona Sur", count: 24 }
];

const INSTITUCIONES = [
  {
    id: 1,
    nombre: "Universidad de Chile",
    sigla: "UCHILE",
    tipo: "Universidad Pública",
    region: "rm",
    acreditacion: 7,
    gratuidad: true,
    carreras: 82,
    color: "from-blue-600 to-blue-400",
    destacada: true
  },
  {
    id: 2,
    nombre: "Pontificia Universidad Católica de Valparaíso",
    sigla: "PUCV",
    tipo: "Universidad Tradicional",
    region: "valpo",
    acreditacion: 7,
    gratuidad: true,
    carreras: 64,
    color: "from-amber-500 to-yellow-400",
    destacada: true
  },
  {
    id: 3,
    nombre: "Duoc UC",
    sigla: "DUOC",
    tipo: "Instituto Profesional",
    region: "rm",
    acreditacion: 7,
    gratuidad: true,
    carreras: 75,
    color: "from-[#002B49] to-[#005288]",
    destacada: false
  },
  {
    id: 4,
    nombre: "Universidad de Concepción",
    sigla: "UDEC",
    tipo: "Universidad Tradicional",
    region: "biobio",
    acreditacion: 7,
    gratuidad: true,
    carreras: 91,
    color: "from-[#15803d] to-emerald-400",
    destacada: true
  },
  {
    id: 5,
    nombre: "INACAP",
    sigla: "INACAP",
    tipo: "CFT / IP",
    region: "norte",
    acreditacion: 6,
    gratuidad: true,
    carreras: 50,
    color: "from-red-600 to-red-400",
    destacada: false
  }
];

export default function DirectorioInstituciones() {
  const [regionActiva, setRegionActiva] = useState("todas");
  const [instituciones, setInstituciones] = useState(INSTITUCIONES);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    setInstituciones([]); 
    setTimeout(() => {
      let filtradas = INSTITUCIONES;
      if (regionActiva !== "todas") {
        filtradas = filtradas.filter(inst => inst.region === regionActiva);
      }
      if (busqueda) {
        filtradas = filtradas.filter(inst => 
          inst.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
          inst.sigla.toLowerCase().includes(busqueda.toLowerCase())
        );
      }
      setInstituciones(filtradas);
    }, 50); 
  }, [regionActiva, busqueda]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      
      {/* HEADER COMPACTO Y ESPECTACULAR */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-16 relative">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#6544FF]/10 text-[#6544FF] font-bold text-sm mb-4 border border-[#6544FF]/20 uppercase tracking-widest animate-in fade-in slide-in-from-top-4">
            <Building2 className="w-4 h-4" /> Red Educativa Nacional
          </div>
          <h2 className="font-black italic uppercase text-4xl md:text-5xl text-[#1A1528] tracking-tight leading-[1.05] animate-in fade-in zoom-in-95 duration-700">
            Directorio de <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6544FF] to-[#947BFF]">Instituciones</span>
          </h2>
        </div>

        {/* BUSCADOR PREMIUM */}
        <div className="w-full lg:w-96 relative animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por nombre o sigla..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-[#6544FF]/30 focus:ring-4 focus:ring-[#6544FF]/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR: FILTRO POR REGIONES (Sticky) */}
        <div className="w-full lg:w-80 shrink-0 sticky top-24 z-20 animate-in fade-in slide-in-from-bottom-8">
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
            <h3 className="font-black text-lg text-[#1A1528] uppercase tracking-wider mb-6 flex items-center gap-2">
              <Map className="w-5 h-5 text-[#6544FF]" /> Explorar por Zona
            </h3>
            
            <div className="space-y-2">
              {REGIONES.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setRegionActiva(region.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 group
                    ${regionActiva === region.id 
                      ? "bg-[#1A1528] text-white shadow-md" 
                      : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-[#1A1528]"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className={`w-4 h-4 ${regionActiva === region.id ? "text-[#C1AFFF]" : "text-gray-400 group-hover:text-[#6544FF]"}`} />
                    {region.nombre}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs ${regionActiva === region.id ? "bg-white/10 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {region.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Banner Pequeño CTA en Sidebar */}
            <div className="mt-8 bg-gradient-to-br from-[#6544FF] to-[#947BFF] rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <Award className="w-8 h-8 mb-3 text-white/90" />
              <h4 className="font-black text-lg leading-tight mb-1">Acreditación</h4>
              <p className="text-xs font-medium text-white/80 mb-4">Asegúrate de elegir una institución certificada por la CNA.</p>
              <button className="text-xs font-bold bg-white text-[#6544FF] px-4 py-2 rounded-lg w-full hover:shadow-lg transition-all">
                Saber más
              </button>
            </div>
          </div>
        </div>

        {/* LISTA DE INSTITUCIONES (Contenido Principal) */}
        <div className="flex-1 w-full space-y-4">
          {instituciones.map((inst, i) => (
            <div 
              key={inst.id}
              className={`group bg-white rounded-3xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-2 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 animate-in slide-in-from-bottom-8 fade-in fill-mode-both relative overflow-hidden
                ${inst.destacada ? "border-[#6544FF]/20 hover:border-[#6544FF]/50" : "border-transparent hover:border-gray-200"}
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              
              {/* Sombra de fondo si es destacada */}
              {inst.destacada && (
                <div className={`absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br ${inst.color} rounded-full opacity-5 blur-[60px] pointer-events-none group-hover:opacity-20 transition-opacity duration-500`}></div>
              )}

              {/* Logo o Letra Inicial */}
              <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg bg-gradient-to-br ${inst.color} transform group-hover:-rotate-3 group-hover:scale-105 transition-all duration-500`}>
                {inst.sigla.slice(0, 2)}
              </div>

              {/* Información Principal */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                    {inst.tipo}
                  </span>
                  {inst.gratuidad && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1 border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3" /> Adscrita a Gratuidad
                    </span>
                  )}
                </div>
                
                <h3 className="font-black text-xl md:text-2xl text-[#1A1528] mb-1 leading-tight group-hover:text-[#6544FF] transition-colors">
                  {inst.nombre}
                </h3>
                
                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500 mt-3">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {REGIONES.find(r => r.id === inst.region)?.nombre}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    {inst.carreras} Carreras
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                    <Star className="w-4 h-4 fill-current" />
                    {inst.acreditacion} Años Acreditada
                  </span>
                </div>
              </div>

              {/* Botón de Acción Lateral */}
              <div className="w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 flex md:flex-col items-center justify-between md:justify-center gap-4 shrink-0">
                <div className="hidden md:block text-center mb-2">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ver Perfil</p>
                </div>
                <button className="bg-[#1A1528] hover:bg-[#6544FF] text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-md group-hover:shadow-[0_10px_30px_rgba(101,68,255,0.3)]">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

            </div>
          ))}

          {instituciones.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-bold text-xl text-gray-400 mb-2">No encontramos resultados</h3>
              <p className="text-gray-500 text-sm">Prueba ajustando el buscador o la región seleccionada.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}