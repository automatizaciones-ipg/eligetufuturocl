// src/components/MercadoLaboral.tsx
import { useState, useEffect } from "react";
import { 
  TrendingUp, Briefcase, DollarSign, Percent, 
  BarChart, ArrowUpRight, Search, GraduationCap, ArrowLeft
} from "lucide-react";

// --- DATOS REALES DEL MERCADO LABORAL CHILENO (Fuente: MiFuturo.cl Mineduc) ---
const DATOS_CARRERAS = [
  {
    id: 1,
    carrera: "Medicina",
    area: "salud",
    empleabilidad: 90.9, // Empleabilidad al 1er año
    sueldoAno1: "2.100.000",
    sueldoAno5: "3.500.000", // Sueldo al 5to año
    color: "from-[#15803d] to-emerald-400",
    tendencia: "estable",
    linkInfo: "https://www.mifuturo.cl/buscador-de-empleabilidad-e-ingresos/"
  },
  {
    id: 2,
    carrera: "Ingeniería Civil Informática / Computación",
    area: "ingenieria",
    empleabilidad: 88.5,
    sueldoAno1: "1.450.000",
    sueldoAno5: "2.400.000",
    color: "from-[#6544FF] to-[#947BFF]",
    tendencia: "alta",
    linkInfo: "https://www.mifuturo.cl/buscador-de-empleabilidad-e-ingresos/"
  },
  {
    id: 3,
    carrera: "Técnico en Minería y Metalurgia",
    area: "tecnica",
    empleabilidad: 78.4,
    sueldoAno1: "1.100.000",
    sueldoAno5: "1.650.000",
    color: "from-orange-500 to-amber-400",
    tendencia: "media",
    linkInfo: "https://www.mifuturo.cl/buscador-de-empleabilidad-e-ingresos/"
  },
  {
    id: 4,
    carrera: "Derecho",
    area: "humanidades",
    empleabilidad: 72.8,
    sueldoAno1: "1.150.000",
    sueldoAno5: "1.950.000",
    color: "from-blue-500 to-cyan-400",
    tendencia: "estable",
    linkInfo: "https://www.mifuturo.cl/buscador-de-empleabilidad-e-ingresos/"
  }
];

const AREAS = [
  { id: "todo", label: "Todas las Áreas" },
  { id: "ingenieria", label: "Ingeniería y Tecnología" },
  { id: "salud", label: "Salud" },
  { id: "tecnica", label: "Técnicas y Profesionales" },
  { id: "humanidades", label: "Humanidades y Sociales" }
];

export default function MercadoLaboral() {
  const [filtroActivo, setFiltroActivo] = useState("todo");
  const [carreras, setCarreras] = useState(DATOS_CARRERAS);

  // Animación suave al filtrar
  useEffect(() => {
    setCarreras([]); 
    setTimeout(() => {
      if (filtroActivo === "todo") {
        setCarreras(DATOS_CARRERAS);
      } else {
        setCarreras(DATOS_CARRERAS.filter(c => c.area === filtroActivo));
      }
    }, 50); 
  }, [filtroActivo]);

  return (
    <div className="w-full bg-[#F4F5F9] min-h-screen pb-20 selection:bg-[#7C3AED] selection:text-white">
      
      {/* =========================================================================
          1. HERO SECTION (BANNER) - FULL WIDTH, CURVO Y TOP ABSOLUTO
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-20 pb-40 px-6 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        
        {/* Fondo Animado Mesh Gradient Brutal */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob pointer-events-none"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000 pointer-events-none"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        </div>

        <div className="container mx-auto relative z-10 max-w-6xl">
          {/* Botón Volver */}
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
            <TrendingUp className="w-4 h-4" /> Realidad Nacional
          </div>

          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Tu Futuro en el <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">Mercado Laboral</span>
          </h2>

          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Toma decisiones informadas. Compara la empleabilidad real y la proyección de sueldos (MiFuturo.cl) de las carreras más demandadas en Chile.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO (Layout con margen negativo)
      ========================================================================= */}
      <div className="w-full max-w-6xl mx-auto px-4 -mt-24 relative z-30">
        
        {/* WIDGET ESTADÍSTICO PREMIUM - Flotando sobre el banner */}
        <div className="bg-[#1A1528] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-[#6544FF]/20 mb-16 relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(101,68,255,0.15)] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                <BarChart className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-1">Dato Clave Mineduc</p>
                <h3 className="font-black italic uppercase text-3xl text-white">Área de Tecnología</h3>
                <p className="text-gray-400 text-sm mt-1">Alta demanda e ingresos sostenidos por el boom digital.</p>
              </div>
            </div>
            
            <div className="flex gap-4 text-center items-center">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-32 backdrop-blur-sm">
                <span className="flex items-center justify-center gap-1 font-black text-4xl text-white mb-1">
                  88<Percent className="w-5 h-5 text-emerald-400" />
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Empleabilidad Promedio</span>
              </div>
              <div className="hidden sm:flex bg-[#6544FF]/20 border border-[#6544FF]/30 rounded-2xl p-5 w-32 backdrop-blur-sm flex-col justify-center">
                <TrendingUp className="w-8 h-8 text-[#C1AFFF] mx-auto mb-2" />
                <span className="text-[10px] font-bold text-[#C1AFFF] uppercase tracking-wider">En Expansión</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS DE FILTRADO */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 animate-in fade-in duration-500 delay-300">
          {AREAS.map((area) => (
            <button
              key={area.id}
              onClick={() => setFiltroActivo(area.id)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-sm flex items-center gap-2
                ${filtroActivo === area.id 
                  ? "bg-[#1A1528] text-white scale-105 shadow-lg" 
                  : "bg-white text-gray-500 hover:text-[#1A1528] hover:bg-gray-50 border border-gray-100"
                }`}
            >
              {area.label}
            </button>
          ))}
        </div>

        {/* GRID DE DATOS LABORALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {carreras.map((carrera, i) => (
            <div 
              key={carrera.id}
              className="group bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-2 border-transparent hover:border-[#6544FF]/30 hover:shadow-[0_15px_40px_rgba(101,68,255,0.08)] transition-all duration-300 flex flex-col animate-in slide-in-from-bottom-8 fade-in fill-mode-both"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              
              {/* Cabecera de la Tarjeta */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-gradient-to-r ${carrera.color} text-white bg-opacity-10 mb-3 inline-block`}>
                    {AREAS.find(a => a.id === carrera.area)?.label}
                  </span>
                  <h3 className="font-black text-2xl text-[#1A1528] leading-tight group-hover:text-[#6544FF] transition-colors">
                    {carrera.carrera}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-[#1A1528]" />
                </div>
              </div>

              {/* Progreso Empleabilidad */}
              <div className="mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-gray-500 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" /> Empleabilidad (1er año)
                  </span>
                  <span className="font-black text-2xl text-[#1A1528]">{carrera.empleabilidad}%</span>
                </div>
                {/* Barra de progreso visual */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${carrera.color} relative`}
                    style={{ width: `${carrera.empleabilidad}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Proyección de Sueldos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl relative overflow-hidden group-hover:border-[#6544FF]/20 transition-colors">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ingreso 1er Año</p>
                  <p className="font-black text-xl text-[#1A1528] flex items-center">
                    <span className="text-sm text-gray-400 mr-1">$</span>{carrera.sueldoAno1}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-[#1A1528] to-[#2D2442] p-4 rounded-2xl relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <DollarSign className="w-20 h-20 text-white" />
                  </div>
                  <p className="text-[11px] font-bold text-[#C1AFFF] uppercase tracking-wider mb-1">Ingreso 5to Año</p>
                  <p className="font-black text-xl text-white flex items-center relative z-10">
                    <span className="text-sm text-gray-400 mr-1">$</span>{carrera.sueldoAno5}
                  </p>
                </div>
              </div>

              {/* Botón Acción Oculto (Aparece al hacer hover) */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                  Fuente: MiFuturo.cl
                </span>
                
                <a 
                  href={carrera.linkInfo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-black text-[#6544FF] uppercase tracking-wider hover:gap-2 transition-all"
                >
                  Buscar en Mineduc <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* =========================================================================
          3. CSS CUSTOM PARA LAS ANIMACIONES FLUIDAS DEL BANNER
      ========================================================================= */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Flote de las esferas del Hero (Blob) */
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

        /* Fade in subiendo */
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