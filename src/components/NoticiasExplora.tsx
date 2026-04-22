// src/components/NoticiasExplora.tsx
'use client';

import React, { useState, useEffect } from "react";
import { 
  Rocket, Flame, Sparkles, ArrowLeft, 
  Clock, ArrowUpRight, BookOpen, Trophy, Globe, Loader2, Compass
} from "lucide-react";
// import { supabase } from "../../lib/supabase"; // <- Listo para cuando conectes la BD

// ============================================================================
// 1. INTERFACES ESTRICTAS (DB READY)
// ============================================================================
export interface Noticia {
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

// ============================================================================
// 2. MOCK DATA (Estructurada como vendría de Supabase)
// ============================================================================
const MOCK_NOTICIAS: Noticia[] = [
  {
    id: "1",
    titulo: "El 80% de los trabajos del 2030 aún no existen: Cómo prepararte",
    extracto: "La inteligencia artificial y la automatización están transformando el mercado. Descubre las habilidades blandas que las empresas están buscando hoy y cómo destacar.",
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
    extracto: "Técnicas de estudio comprobadas por neurocientíficos para aprender más rápido, retener información y dormir tus 8 horas diarias.",
    categoria: "Tips de Estudio",
    fecha: "Hace 1 semana",
    tiempoLectura: "6 min",
    imagen: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop",
    color: "from-[#6544FF] to-[#947BFF]"
  }
];

const CATEGORIAS = ["Todas", "Tendencias", "Inspiración", "Oportunidades", "Tips de Estudio"];

// ============================================================================
// 3. COMPONENTE PRINCIPAL
// ============================================================================
export default function NoticiasExplora() {
  const [filtroActivo, setFiltroActivo] = useState<string>("Todas");
  const [noticiasFiltradas, setNoticiasFiltradas] = useState<Noticia[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [navegandoA, setNavegandoA] = useState<string | null>(null);

  // --- PREPARADO PARA SUPABASE (DB READY) ---
  useEffect(() => {
    const fetchNoticias = async () => {
      setCargando(true);
      try {
        // AQUÍ IRÁ TU CÓDIGO REAL:
        // const { data, error } = await supabase.from('noticias').select('*');
        // if (error) throw error;
        // setNoticiasFiltradas(data);
        
        // Simulación de carga desde BD
        await new Promise(resolve => setTimeout(resolve, 600)); 
        
        if (filtroActivo === "Todas") {
          setNoticiasFiltradas(MOCK_NOTICIAS);
        } else {
          setNoticiasFiltradas(MOCK_NOTICIAS.filter(n => n.categoria === filtroActivo));
        }
      } catch (error) {
        console.error("Error cargando noticias:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchNoticias();
  }, [filtroActivo]);

  // Manejador de navegación fluida
  const handleNavegar = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setNavegandoA(id);
    setTimeout(() => {
      window.location.href = `/noticia/${id}`; // Asegúrate de crear esta ruta en Astro
    }, 400); 
  };

  return (
    <div className="w-full bg-[#F4F5F9] min-h-screen pb-20 selection:bg-[#7C3AED] selection:text-white overflow-hidden">
      
      {/* =========================================================================
          1. HERO SECTION (Banner Gemelo a Carreras/Instituciones)
      ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-20 pb-32 px-6 overflow-visible border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.15)] z-20">
        
        {/* Fondo Animado Mesh Gradient Original */}
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
            <Compass className="w-4 h-4" /> Comunidad & Tendencias
          </div>

          <h2 className="font-black italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-4 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Explora tu <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#D946EF] to-[#3B82F6]">Futuro</span>
          </h2>

          <p className="text-gray-300 max-w-2xl text-lg md:text-xl animate-fade-in-up font-medium leading-relaxed mb-6" style={{ animationDelay: '0.2s' }}>
            Historias que inspiran, noticias de vanguardia y los mejores consejos para que tomes el control de tu camino profesional.
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. ÁREA DE CONTENIDO (Layout Superpuesto)
      ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto px-4 relative z-30 -mt-12">
        
        {/* BARRA DE FILTROS FLOTANTE (Estilo Glassmorphism Premium) */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-3 shadow-2xl shadow-indigo-900/10 border border-white mb-10 flex items-center justify-start md:justify-center overflow-x-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-8">
          <div className="flex gap-2 min-w-max px-2 py-1">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltroActivo(cat)}
                className={`px-6 py-3 rounded-[1.5rem] font-bold text-sm transition-all duration-300 flex items-center gap-2
                  ${filtroActivo === cat 
                    ? "bg-[#1A1528] text-white shadow-md scale-105" 
                    : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
              >
                {cat === "Inspiración" && <Flame className={`w-4 h-4 ${filtroActivo === cat ? "text-orange-500" : ""}`} />}
                {cat === "Oportunidades" && <Trophy className={`w-4 h-4 ${filtroActivo === cat ? "text-amber-500" : ""}`} />}
                {cat === "Tendencias" && <Sparkles className={`w-4 h-4 ${filtroActivo === cat ? "text-cyan-400" : ""}`} />}
                {cat === "Tips de Estudio" && <BookOpen className={`w-4 h-4 ${filtroActivo === cat ? "text-[#6544FF]" : ""}`} />}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* GRID DE NOTICIAS */}
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
            <Loader2 className="w-12 h-12 text-[#6544FF] animate-spin mb-4" />
            <p className="font-bold text-slate-500">Cargando las últimas novedades...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 relative pb-20">
            {noticiasFiltradas.map((noticia, i) => (
              <a 
                key={noticia.id}
                href={`/noticia/${noticia.id}`}
                onClick={(e) => handleNavegar(e, noticia.id)}
                className={`group relative flex flex-col bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 border-transparent hover:border-[#6544FF]/30 hover:shadow-[0_20px_80px_-15px_rgba(101,68,255,0.2)] transition-all duration-500 ease-out animate-in slide-in-from-bottom-8 fade-in fill-mode-both overflow-hidden cursor-pointer
                  ${noticia.destacada && filtroActivo === "Todas" ? "md:col-span-2 lg:col-span-2 md:flex-row md:p-6 gap-6" : ""}
                  ${navegandoA === noticia.id ? 'border-[#6544FF] scale-[0.98] opacity-90 shadow-inner z-50' : 'hover:-translate-y-2'}
                `}
                style={{ animationDelay: `${(i % 10) * 50}ms` }}
              >
                
                {/* Capa de Animación de Carga (Al hacer click) */}
                {navegandoA === noticia.id && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 rounded-[2.5rem]">
                    <div className="relative mb-3">
                      <div className="absolute inset-0 bg-[#6544FF] blur-xl opacity-40 rounded-full animate-pulse"></div>
                      <Loader2 className="w-10 h-10 text-[#6544FF] animate-spin relative z-10" />
                    </div>
                  </div>
                )}

                {/* Imagen del Artículo */}
                <div className={`relative overflow-hidden rounded-[2rem] shrink-0
                  ${noticia.destacada && filtroActivo === "Todas" ? "w-full md:w-1/2 min-h-[250px] md:min-h-[350px]" : "w-full h-56 md:h-64 mb-6"}
                `}>
                  <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                  <img 
                    src={noticia.imagen} 
                    alt={noticia.titulo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl bg-gradient-to-r ${noticia.color} text-white shadow-lg backdrop-blur-md`}>
                      {noticia.categoria}
                    </span>
                  </div>
                </div>

                {/* Contenido de la Tarjeta */}
                <div className={`flex flex-col flex-1 ${noticia.destacada && filtroActivo === "Todas" ? "justify-center py-4 pr-2" : ""}`}>
                  
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {noticia.fecha}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {noticia.tiempoLectura}</span>
                  </div>

                  <h3 className={`font-black text-slate-800 leading-tight group-hover:text-[#6544FF] transition-colors mb-3 line-clamp-3 
                    ${noticia.destacada && filtroActivo === "Todas" ? "text-2xl md:text-3xl lg:text-4xl" : "text-xl md:text-2xl"}`}
                  >
                    {noticia.titulo}
                  </h3>
                  
                  <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed mb-6 flex-1 line-clamp-3">
                    {noticia.extracto}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100/80">
                    <span className="text-sm font-black text-[#6544FF] uppercase tracking-wider group-hover:translate-x-1 transition-transform duration-300">
                      Leer artículo
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-[#6544FF] group-hover:text-white transition-colors duration-300 shadow-sm group-hover:shadow-[0_5px_15px_rgba(101,68,255,0.4)]">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>

              </a>
            ))}
          </div>
        )}

        {/* =========================================================================
            3. FALLBACK NO ENCONTRADO (Mismo diseño que el resto de buscadores)
        ========================================================================= */}
        {!cargando && noticiasFiltradas.length === 0 && (
          <div className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-gray-300 shadow-sm animate-in fade-in duration-500">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-black text-2xl text-slate-700 mb-2">No encontramos artículos</h3>
            <p className="text-slate-500 text-sm font-medium">Aún no hemos publicado noticias en esta categoría.</p>
            <button onClick={() => setFiltroActivo("Todas")} className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">
              Ver todas las noticias
            </button>
          </div>
        )}

      </div>

      {/* =========================================================================
          4. CSS CUSTOM PARA LAS ANIMACIONES FLUIDAS
      ========================================================================= */}
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
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `}} />
    </div>
  );
}