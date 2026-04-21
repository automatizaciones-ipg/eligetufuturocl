import { useState, useEffect } from "react";
import { 
  Rocket, Flame, Sparkles, ArrowLeft, 
  Clock, ArrowUpRight, BookOpen, Trophy
} from "lucide-react";

// --- TIPADO ESTRICTO ---
interface Noticia {
  id: string;
  titulo: string;
  extracto: string;
  categoria: string;
  fecha: string;
  tiempoLectura: string;
  imagen: string;
  color: string;
  destacada?: boolean;
}

// --- DATOS SIMULADOS (Para visualizar el diseño premium) ---
const MOCK_NOTICIAS: Noticia[] = [
  {
    id: "1",
    titulo: "El 80% de los trabajos del 2030 aún no existen: Cómo prepararte",
    extracto: "La inteligencia artificial y la automatización están transformando el mercado. Descubre las habilidades blandas que las empresas están buscando hoy.",
    categoria: "Tendencias",
    fecha: "Hoy",
    tiempoLectura: "5 min",
    imagen: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
    color: "from-blue-600 to-cyan-400",
    destacada: true
  },
  {
    id: "2",
    titulo: "De la frustración al éxito: 3 estudiantes que cambiaron de carrera",
    extracto: "Equivocarse de carrera no es el fin del mundo. Conoce la historia de quienes encontraron su verdadera pasión en el segundo intento.",
    categoria: "Inspiración",
    fecha: "Hace 2 días",
    tiempoLectura: "4 min",
    imagen: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop",
    color: "from-orange-500 to-amber-400"
  },
  {
    id: "3",
    titulo: "Nuevas becas tecnológicas: Estudia programación con costo cero",
    extracto: "El gobierno e instituciones privadas acaban de liberar más de 5.000 cupos para bootcamps de desarrollo web y ciencia de datos.",
    categoria: "Oportunidades",
    fecha: "Hace 4 días",
    tiempoLectura: "3 min",
    imagen: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop",
    color: "from-[#15803d] to-emerald-400"
  },
  {
    id: "4",
    titulo: "Hábitos atómicos para sobrevivir a la universidad sin estrés",
    extracto: "Técnicas de estudio comprobadas por neurocientíficos para aprender más rápido, retener información y dormir tus 8 horas.",
    categoria: "Tips de Estudio",
    fecha: "Hace 1 semana",
    tiempoLectura: "6 min",
    imagen: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop",
    color: "from-[#6544FF] to-[#947BFF]"
  }
];

const CATEGORIAS = ["Todas", "Tendencias", "Inspiración", "Oportunidades", "Tips de Estudio"];

export default function NoticiasExplora() {
  const [filtroActivo, setFiltroActivo] = useState("Todas");
  const [noticiasFiltradas, setNoticiasFiltradas] = useState<Noticia[]>([]);

  // Efecto de filtrado suave (como en el Mercado Laboral)
  useEffect(() => {
    setNoticiasFiltradas([]); // Limpiamos para reiniciar animación
    setTimeout(() => {
      if (filtroActivo === "Todas") {
        setNoticiasFiltradas(MOCK_NOTICIAS);
      } else {
        setNoticiasFiltradas(MOCK_NOTICIAS.filter(n => n.categoria === filtroActivo));
      }
    }, 50);
  }, [filtroActivo]);

  return (
    <div className="w-full bg-[#F4F5F9] min-h-screen pb-20 selection:bg-[#7C3AED] selection:text-white">
      
      {/* =========================================================================
          1. HERO SECTION (BANNER) - Estilo idéntico a Mercado Laboral
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-20 pb-40 px-6 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        
        {/* Fondo Animado Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[10%] w-[50vw] h-[50vw] bg-[#E11D48]/30 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] bg-[#8B5CF6]/30 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-30%] left-[30%] w-[60vw] h-[60vw] bg-[#F59E0B]/20 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="container mx-auto relative z-10 max-w-6xl">
          {/* Botón Volver */}
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#F87171] hover:text-white transition-all duration-300 mb-12 group font-semibold text-sm tracking-wide bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer animate-fade-in-up"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Volver
          </button>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-[#FDA4AF] font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md animate-fade-in-up">
            <Rocket className="w-4 h-4" /> Comunidad & Tendencias
          </div>

          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-6 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Explora tu <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F43F5E] via-[#D946EF] to-[#8B5CF6]">Futuro</span>
          </h2>

          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Historias que inspiran, noticias de vanguardia y los mejores consejos para que tomes el control de tu camino profesional.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO (Layout superpuesto)
      ========================================================================= */}
      <div className="w-full max-w-6xl mx-auto px-4 -mt-24 relative z-30">
        
        {/* TABS DE FILTRADO (Categorías) */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 animate-in fade-in duration-500">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroActivo(cat)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 shadow-sm flex items-center gap-2
                ${filtroActivo === cat 
                  ? "bg-[#1A1528] text-white scale-105 shadow-lg" 
                  : "bg-white text-gray-500 hover:text-[#1A1528] hover:bg-gray-50 border border-gray-100"
                }`}
            >
              {cat === "Inspiración" && <Flame className="w-4 h-4" />}
              {cat === "Oportunidades" && <Trophy className="w-4 h-4" />}
              {cat === "Tendencias" && <Sparkles className="w-4 h-4" />}
              {cat}
            </button>
          ))}
        </div>

        {/* GRID DE NOTICIAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative pt-20">
          {noticiasFiltradas.map((noticia, i) => (
            <article 
              key={noticia.id}
              className={`group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-2 border-transparent hover:border-[#6544FF]/30 hover:shadow-[0_20px_50px_rgba(101,68,255,0.12)] transition-all duration-500 animate-in slide-in-from-bottom-8 fade-in fill-mode-both cursor-pointer
                ${noticia.destacada && filtroActivo === "Todas" ? "md:col-span-2 lg:col-span-2 flex-row md:flex-row" : ""}
              `}
              style={{ animationDelay: `${(i % 10) * 100}ms` }}
            >
              {/* Imagen Superior / Lateral si es destacada */}
              <div className={`relative overflow-hidden ${noticia.destacada && filtroActivo === "Todas" ? "w-full md:w-1/2 min-h-[300px]" : "w-full h-56 shrink-0"}`}>
                <div className="absolute inset-0 bg-gray-900/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                <img 
                  src={noticia.imagen} 
                  alt={noticia.titulo}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-gradient-to-r ${noticia.color} text-white shadow-lg backdrop-blur-md`}>
                    {noticia.categoria}
                  </span>
                </div>
              </div>

              {/* Contenido de la Tarjeta */}
              <div className={`p-8 flex flex-col flex-1 ${noticia.destacada && filtroActivo === "Todas" ? "w-full md:w-1/2 justify-center" : ""}`}>
                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {noticia.fecha}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {noticia.tiempoLectura}</span>
                </div>

                <h3 className={`font-black text-[#1A1528] leading-tight group-hover:text-[#6544FF] transition-colors mb-4 ${noticia.destacada && filtroActivo === "Todas" ? "text-3xl" : "text-xl"}`}>
                  {noticia.titulo}
                </h3>
                
                <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8 flex-1">
                  {noticia.extracto}
                </p>

                <div className="mt-auto flex items-center text-sm font-black text-[#6544FF] uppercase tracking-wider group-hover:translate-x-2 transition-transform duration-300">
                  Leer artículo <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {noticiasFiltradas.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 mt-6">
            <h3 className="font-bold text-xl text-gray-400">No hay noticias en esta categoría por el momento.</h3>
          </div>
        )}

      </div>

      {/* =========================================================================
          3. CSS CUSTOM PARA LAS ANIMACIONES
      ========================================================================= */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 15s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
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