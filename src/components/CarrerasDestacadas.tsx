import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Briefcase, 
  DollarSign, 
  GraduationCap, 
  ArrowUpRight, 
  Star,
  ArrowRight,
  Loader2
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

// Rescatamos exactamente los mismos colores de tu diseño original
const PALETA_COLORES = [
  "from-[#15803d] to-emerald-400",
  "from-[#6544FF] to-[#947BFF]",
  "from-blue-600 to-cyan-400",
  "from-rose-500 to-pink-400"
];

export default function CarrerasDestacadas() {
  // --- ESTADOS ---
  const [carrerasBD, setCarrerasBD] = useState<CarreraUI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [accediendoId, setAccediendoId] = useState<string | number | null>(null);

  // --- LIMPIEZA AL VOLVER (BFCache) ---
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setAccediendoId(null);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // --- FETCH A SUPABASE (0% HARDCODEO) ---
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
          // Filtramos solo las que tengan info real
          .not('empleabilidad_1er_anio', 'is', null)
          .not('ingreso_promedio_4to_anio', 'is', null)
          // Ordenamos por empleabilidad para tener el TOP real
          .order('empleabilidad_1er_anio', { ascending: false })
          .limit(4); // Solo las top 4 para esta sección de "Destacadas"

        if (error) throw error;

        if (data) {
          const rawData = data as unknown as CarreraDB[];

          const carrerasAdaptadas: CarreraUI[] = rawData.map((item, index) => {
            const inst = Array.isArray(item.instituciones) ? item.instituciones[0] : item.instituciones;
            
            // Convertimos 0.985 a 98.5
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
        }
      } catch (err) {
        console.error("Error cargando carreras destacadas:", err);
      } finally {
        setCargando(false);
      }
    };

    fetchTopCarreras();
  }, []);

  return (
    // CONTENEDOR RAÍZ CON EL FONDO CLARO GLOBAL
    <section className="w-full bg-[#F4F5F9] pb-20">
      
      {/* =========================================================================
          1. HERO BANNER - EXACTAMENTE IGUAL A HERRAMIENTAS
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] pt-20 pb-40 px-6 overflow-hidden shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20 border-b border-white/5">
        
        {/* Fondo Animado Mesh Gradient Brutal */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/40 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#15803d]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        {/* Textos del Banner */}
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-emerald-300 font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md animate-fade-in-up">
            <Star className="w-4 h-4" /> Top Nacional
          </div>

          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Carreras <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#3B82F6] to-[#6544FF]">Destacadas</span>
          </h2>
          
          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Descubre las opciones académicas con la mayor tasa de inserción laboral y proyección de sueldos en Chile.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. TARJETAS DE CARRERAS - SUPERPUESTAS AL BANNER
      ========================================================================= */}
      <div className="w-full max-w-6xl mx-auto px-4 -mt-24 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          
          {/* LOADER MIENTRAS CONSULTA A SUPABASE */}
          {cargando ? (
            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] shadow-xl border border-gray-100">
              <Loader2 className="w-12 h-12 text-[#6544FF] animate-spin mb-4" />
              <p className="font-bold text-gray-500">Consultando datos oficiales en vivo...</p>
            </div>
          ) : (
            carrerasBD.map((carrera, i) => (
              <div 
                key={carrera.id}
                className="group bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border-2 border-transparent hover:border-[#6544FF]/30 hover:shadow-[0_20px_50px_rgba(101,68,255,0.12)] transition-all duration-300 flex flex-col animate-in slide-in-from-bottom-8 fade-in fill-mode-both hover:-translate-y-1"
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
                  
                  {/* Badge TOP Animado */}
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center gap-1 bg-[#1A1528] text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full shadow-md uppercase tracking-widest animate-pulse">
                      TOP <TrendingUp className="w-3 h-3" />
                    </span>
                    <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#6544FF]/5 transition-all">
                      <GraduationCap className="w-6 h-6 text-[#1A1528] group-hover:text-[#6544FF]" />
                    </div>
                  </div>
                </div>

                {/* Barra de Empleabilidad */}
                <div className="mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100 group-hover:bg-white transition-colors">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-gray-500 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" /> Empleabilidad (1er año)
                    </span>
                    <span className="font-black text-2xl text-[#1A1528]">{carrera.empleabilidad}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${carrera.color} relative transition-all duration-1000 ease-out`}
                      style={{ width: `${carrera.empleabilidad}%` }}
                    >
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Stats Financieros */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl relative overflow-hidden group-hover:border-[#6544FF]/20 transition-colors flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Arancel Anual</p>
                    <p className="font-black text-lg md:text-xl text-[#1A1528] flex items-center">
                      {carrera.arancel}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#1A1528] to-[#2D2442] p-4 rounded-2xl relative overflow-hidden flex flex-col justify-center group-hover:shadow-lg transition-shadow">
                    <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
                      <DollarSign className="w-20 h-20 text-white" />
                    </div>
                    <p className="text-[10px] font-bold text-[#C1AFFF] uppercase tracking-wider mb-1 relative z-10">Ingreso (4to Año)</p>
                    <p className="font-black text-sm text-white relative z-10 leading-tight">
                      {carrera.ingreso}
                    </p>
                  </div>
                </div>

                {/* =========================================================================
                    BOTÓN DE NAVEGACIÓN (CON URL REAL A ASTRO Y CARGA)
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
                        Ver carrera <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </a>
                </div>

              </div>
            ))
          )}
        </div>

        {/* =========================================================================
            3. BOTÓN ESPECTACULAR PARA VER TODO EL MERCADO LABORAL
        ========================================================================= */}
        <div className="mt-16 flex justify-center animate-in fade-in slide-in-from-bottom-8 delay-500">
          <a 
            href="/herramientas/mercado-laboral"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1A1528] text-white font-black italic uppercase tracking-wider rounded-full overflow-hidden shadow-[0_10px_40px_rgba(26,21,40,0.3)] hover:shadow-[0_15px_50px_rgba(101,68,255,0.4)] transition-all duration-300 hover:-translate-y-1"
          >
            {/* Efecto de Brillo de Fondo */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#6544FF] via-[#D946EF] to-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <span className="relative z-10 text-lg md:text-xl flex items-center gap-2">
              Ver Todo el Mercado Laboral 
            </span>
            <div className="relative z-10 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </a>
        </div>

      </div>

      {/* CSS CUSTOM ANIMACIONES */}
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
    </section>
  );
}