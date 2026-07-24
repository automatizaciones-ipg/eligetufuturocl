'use client';

import { useState, useEffect, useRef } from "react";
import {
  Clock,
  User,
  Calendar,
  ArrowUpRight,
  Compass,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Flame,
  Trophy,
  Loader2
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import GenerandoLoader from "./GenerandoLoader";

// --- INTERFACES DE TYPESCRIPT ---
interface NoticiaDB {
  id: string | number;
  titulo: string;
  extracto: string;
  categoria: string;
  autor: string;
  imagen_principal: string;
  tiempo_lectura: string;
  created_at: string;
  destacada?: boolean;
}

interface NoticiaUI {
  id: string | number;
  titulo: string;
  extracto: string;
  categoria: string;
  autor: string;
  imagenPrincipal: string;
  tiempoLectura: string;
  fechaFormateada: string;
  fechaRaw: string;
  destacada: boolean;
  tema: {
    borderHover: string;
    textGradient: string;
    textAccent: string;
    bgBadge: string;
    textBadge: string;
    darkBox: string;
    barGradient: string;
    lightBg: string;
  };
}

// --- SISTEMA DE GRADIENTES PROFESIONALES POR CATEGORÍA ---
const obtenerTemaPorCategoria = (categoria: string) => {
  const c = categoria.toLowerCase();
  
  if (c.includes('tendencias') || c.includes('tech') || c.includes('innovación')) {
    return {
      borderHover: 'hover:border-cyan-400/50 hover:shadow-[0_20px_50px_rgba(34,211,238,0.15)]',
      textGradient: 'bg-gradient-to-r from-cyan-600 to-blue-500 text-transparent bg-clip-text',
      textAccent: 'text-cyan-500',
      bgBadge: 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100',
      textBadge: 'text-cyan-700',
      darkBox: 'bg-[#081E26]', 
      barGradient: 'bg-gradient-to-r from-cyan-400 to-blue-500',
      lightBg: 'bg-gradient-to-br from-cyan-50/80 to-blue-50/30'
    };
  }
  
  if (c.includes('inspiración') || c.includes('historias') || c.includes('motivación')) {
    return {
      borderHover: 'hover:border-orange-400/50 hover:shadow-[0_20px_50px_rgba(251,146,60,0.15)]',
      textGradient: 'bg-gradient-to-r from-orange-500 to-red-500 text-transparent bg-clip-text',
      textAccent: 'text-orange-500',
      bgBadge: 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100',
      textBadge: 'text-orange-700',
      darkBox: 'bg-[#2A1408]', 
      barGradient: 'bg-gradient-to-r from-orange-400 to-red-500',
      lightBg: 'bg-gradient-to-br from-orange-50/80 to-red-50/30'
    };
  }
  
  if (c.includes('oportunidades') || c.includes('becas') || c.includes('concursos')) {
    return {
      borderHover: 'hover:border-amber-400/50 hover:shadow-[0_20px_50px_rgba(251,191,36,0.15)]',
      textGradient: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-transparent bg-clip-text',
      textAccent: 'text-amber-600',
      bgBadge: 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100',
      textBadge: 'text-amber-800',
      darkBox: 'bg-[#261B03]', 
      barGradient: 'bg-gradient-to-r from-amber-400 to-yellow-500',
      lightBg: 'bg-gradient-to-br from-amber-50/80 to-yellow-50/30'
    };
  }
  
  if (c.includes('tips') || c.includes('estudio') || c.includes('técnicas')) {
    return {
      borderHover: 'hover:border-violet-400/50 hover:shadow-[0_20px_50px_rgba(167,139,250,0.15)]',
      textGradient: 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-transparent bg-clip-text',
      textAccent: 'text-violet-500',
      bgBadge: 'bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100',
      textBadge: 'text-violet-700',
      darkBox: 'bg-[#180B2B]', 
      barGradient: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
      lightBg: 'bg-gradient-to-br from-violet-50/80 to-fuchsia-50/30'
    };
  }
  
  return {
    borderHover: 'hover:border-[#6544FF]/40 hover:shadow-[0_20px_50px_rgba(101,68,255,0.15)]',
    textGradient: 'bg-gradient-to-r from-[#6544FF] to-[#3B82F6] text-transparent bg-clip-text',
    textAccent: 'text-[#6544FF]',
    bgBadge: 'bg-gradient-to-r from-[#EEECFF] to-blue-50 border border-[#6544FF]/10',
    textBadge: 'text-[#6544FF]',
    darkBox: 'bg-[#0F0A21]',
    barGradient: 'bg-gradient-to-r from-[#6544FF] to-[#3B82F6]',
    lightBg: 'bg-gradient-to-br from-[#6544FF]/5 to-[#3B82F6]/5'
  };
};

function procesarNoticias(rawData: NoticiaDB[]): NoticiaUI[] {
  const fallbackImg = "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop";
  return rawData.map((item) => {
    const fechaLegible = new Date(item.created_at).toLocaleDateString('es-CL', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    return {
      id: item.id, titulo: item.titulo.trim(), extracto: item.extracto,
      categoria: item.categoria || "General", autor: item.autor || "Equipo Editorial",
      imagenPrincipal: item.imagen_principal || fallbackImg,
      tiempoLectura: item.tiempo_lectura || "5 min",
      fechaFormateada: fechaLegible, fechaRaw: item.created_at,
      destacada: item.destacada || false,
      tema: obtenerTemaPorCategoria(item.categoria || "")
    };
  });
}

const CACHE_NOTICIAS = 'etf_noticias_v1';
const CACHE_NOTICIAS_TTL = 5 * 60 * 1000;

export default function NoticiasDestacadas({ datosIniciales }: { datosIniciales?: NoticiaDB[] }) {
  const [noticiasUI, setNoticiasUI] = useState<NoticiaUI[]>(
    () => datosIniciales?.length ? procesarNoticias(datosIniciales) : []
  );
  const [cargando, setCargando] = useState(!datosIniciales?.length);
  const [accediendoId, setAccediendoId] = useState<string | number | null>(null);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [animarBarras, setAnimarBarras] = useState(false);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setAccediendoId(null);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    const fetchTopNoticias = async () => {
      setCargando(true);
      try {
        // Asumiendo una tabla 'noticias' en Supabase. Ajusta los campos según tu DB.
        const { data, error } = await supabase
          .from('noticias')
          .select('id, titulo, extracto, categoria, autor, imagen_principal, tiempo_lectura, created_at, destacada')
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) throw error;

        if (data) {
          const resultado = procesarNoticias(data as unknown as NoticiaDB[]);
          setNoticiasUI(resultado);
          setTimeout(() => setAnimarBarras(true), 100);
          try {
            sessionStorage.setItem(CACHE_NOTICIAS, JSON.stringify({ data: resultado, ts: Date.now() }));
          } catch {}
        }
      } catch (err) {
        console.error("Error cargando noticias destacadas:", err);
      } finally {
        setCargando(false);
      }
    };

    // 1. Datos pre-cargados en build-time: cero fetch, guardar en caché y activar barras
    if (datosIniciales?.length) {
      try {
        sessionStorage.setItem(CACHE_NOTICIAS, JSON.stringify({ data: noticiasUI, ts: Date.now() }));
      } catch {}
      setTimeout(() => setAnimarBarras(true), 100);
      return;
    }

    // 2. Caché sessionStorage (navegaciones SPA o visitas repetidas dentro de 5 min).
    //    Se ignora cualquier caché vacía para que nunca bloquee el render.
    try {
      const raw = sessionStorage.getItem(CACHE_NOTICIAS);
      if (raw) {
        const { data: cached, ts } = JSON.parse(raw) as { data: NoticiaUI[]; ts: number };
        if (Array.isArray(cached) && cached.length > 0 && Date.now() - ts < CACHE_NOTICIAS_TTL) {
          setNoticiasUI(cached);
          setCargando(false);
          setTimeout(() => setAnimarBarras(true), 100);
          return;
        }
      }
    } catch {}

    // 3. Fetch de red (primera visita sin datos pre-cargados)
    fetchTopNoticias();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftPos(sliderRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const handleScrollEvent = () => {
    if (!sliderRef.current) return;
    const contenedor = sliderRef.current;
    const primeraTarjeta = contenedor.firstElementChild as HTMLElement;
    if (primeraTarjeta) {
      const anchoDesplazamiento = primeraTarjeta.offsetWidth + 24; 
      const index = Math.round(contenedor.scrollLeft / anchoDesplazamiento);
      setActiveIndex(index);
    }
  };

  const handleNavegacion = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const contenedor = sliderRef.current;
      const primeraTarjeta = contenedor.firstElementChild as HTMLElement;
      if (primeraTarjeta) {
        const anchoDesplazamiento = primeraTarjeta.offsetWidth + 24;
        const multiplicador = direction === "left" ? -anchoDesplazamiento : anchoDesplazamiento;
        contenedor.scrollBy({ left: multiplicador, behavior: "smooth" });
      }
    }
  };

  const scrollToDot = (index: number) => {
    if (sliderRef.current) {
      const primeraTarjeta = sliderRef.current.firstElementChild as HTMLElement;
      if (primeraTarjeta) {
        const anchoDesplazamiento = primeraTarjeta.offsetWidth + 24;
        sliderRef.current.scrollTo({ left: index * anchoDesplazamiento, behavior: "smooth" });
      }
    }
  };

  const renderIconoCategoria = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('tips') || c.includes('estudio')) return <BookOpen className="w-3.5 h-3.5" />;
    if (c.includes('inspiración')) return <Flame className="w-3.5 h-3.5" />;
    if (c.includes('oportunidades')) return <Trophy className="w-3.5 h-3.5" />;
    return <Sparkles className="w-3.5 h-3.5" />;
  };

  return (
    <section className="w-full bg-[#F4F5F9] pb-24 overflow-hidden tracking-tight border-t border-gray-200/30">
      
      {/* 1. HERO BANNER */}
      <div className="relative w-full bg-[#0A0518] pt-24 pb-48 px-6 overflow-hidden z-20 border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#6544FF]/15 rounded-full blur-[60px] md:blur-[140px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#D946EF]/10 rounded-full blur-[60px] md:blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-15 mix-blend-overlay"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 text-purple-300 font-bold text-sm mb-2 border border-white/20 uppercase tracking-widest backdrop-blur-md">
            <Compass className="w-4 h-4 text-fuchsia-400" /> Explora Tu Futuro
          </div>
          <h2 className="font-black uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-tight mb-4 leading-none">
            Noticias de <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-[#3B82F6]">Interés Diario</span>
          </h2>
          <p className="text-gray-400 max-w-2xl text-lg md:text-xl font-medium leading-relaxed">
            Mantente al día con tips de estudio, tendencias académicas y las mejores herramientas para potenciar tu rendimiento.
          </p>
        </div>
      </div>

      {/* 2. SLIDER DE NOTICIAS */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 -mt-32 relative z-30">
        
        {!cargando && noticiasUI.length > 0 && (
          <div className="absolute -top-16 right-8 z-40 flex items-center gap-2.5">
            <button 
              onClick={() => handleNavegacion("left")}
              className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white hover:text-[#0A0518] border border-white/10 flex items-center justify-center transition-all duration-300 shadow-xl backdrop-blur-md active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => handleNavegacion("right")}
              className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white hover:text-[#0A0518] border border-white/10 flex items-center justify-center transition-all duration-300 shadow-xl backdrop-blur-md active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {cargando ? (
          <GenerandoLoader
            tipo="noticias"
            mensajes={[
              "Recuperando artículos...",
              "Clasificando por relevancia...",
              "Preparando noticias...",
            ]}
            className="min-h-[340px]"
          />
        ) : (
          <>
            <div 
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              onScroll={handleScrollEvent}
              className={`flex w-full overflow-x-auto gap-6 pb-6 pt-2 px-2 scrollbar-none ${
                isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory scroll-smooth'
              }`}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {noticiasUI.map((noticia, i) => (
                <div 
                  key={noticia.id}
                  className={`w-[88vw] sm:w-[420px] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start bg-white rounded-[2.5rem] p-6 md:p-7 border border-gray-100/80 shadow-[0_10px_35px_rgba(0,0,0,0.03)] flex flex-col transition-all duration-300 ${noticia.tema.borderHover} hover:-translate-y-1.5 group ${isDragging ? 'pointer-events-none' : ''}`}
                  style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms both` }}
                >
                  
                  {/* Cabecera: Badges */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 ${noticia.tema.bgBadge} ${noticia.tema.textBadge} shadow-sm`}>
                        {renderIconoCategoria(noticia.categoria)}
                        {noticia.categoria}
                      </span>
                      {noticia.destacada && (
                        <span className="bg-gradient-to-r from-[#1A1528] to-[#2D2442] text-[#FACC15] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm border border-[#FACC15]/20">
                          Nueva <Flame className="w-3 h-3 fill-[#FACC15]" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Título e Imagen */}
                  <div className="mb-6">
                    <h3 className={`font-black text-xl md:text-2xl leading-tight mb-4 uppercase tracking-tight line-clamp-2 min-h-[3.5rem] ${noticia.tema.textGradient}`} title={noticia.titulo}>
                      {noticia.titulo}
                    </h3>
                    
                    <div className="relative w-full h-40 md:h-48 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm mb-4">
                      <img 
                        src={noticia.imagenPrincipal} 
                        alt={noticia.titulo}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0518]/40 to-transparent opacity-60"></div>
                    </div>

                    <p className="text-gray-500 font-medium text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
                      {noticia.extracto}
                    </p>
                  </div>

                  {/* Sección Tiempo de Lectura (Similar a Empleabilidad) */}
                  <div className={`rounded-2xl p-4 mb-4 border border-white/40 flex flex-col gap-3 ${noticia.tema.lightBg}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-white/50">
                          <Clock className={`w-4 h-4 ${noticia.tema.textAccent}`} />
                        </div>
                        <span className="text-xs font-bold text-gray-600 leading-tight">
                          Tiempo de<br/>Lectura
                        </span>
                      </div>
                      <span className={`font-black text-xl tracking-tighter ${noticia.tema.textGradient}`}>
                        {noticia.tiempoLectura}
                      </span>
                    </div>
                    
                    <div className="w-full bg-white/70 rounded-full h-2.5 overflow-hidden border border-white/50 shadow-inner">
                      <div 
                        className={`h-full rounded-full ${noticia.tema.barGradient} transition-all duration-1000 ease-out`}
                        style={{ width: animarBarras ? '100%' : '0%' }}
                      />
                    </div>
                  </div>

                  {/* Módulo de Metadatos (Similar a Bloque Financiero) */}
                  <div className="grid grid-cols-5 gap-3 mb-6 pointer-events-none select-none">
                    <div className="col-span-2 bg-white rounded-2xl p-3.5 border border-gray-200 flex flex-col justify-center">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" /> Publicado
                      </span>
                      <span className="font-bold text-[#1A1528] text-xs uppercase truncate">
                        {noticia.fechaFormateada}
                      </span>
                    </div>

                    <div className={`col-span-3 ${noticia.tema.darkBox} rounded-2xl p-3.5 relative overflow-hidden flex flex-col justify-center shadow-inner`}>
                      <div className="absolute -right-2 -bottom-2 opacity-[0.07]">
                        <User className="w-14 h-14 text-white" />
                      </div>
                      <span className="text-[9px] font-extrabold text-white/60 uppercase tracking-wider mb-1 relative z-10">
                        Por
                      </span>
                      <span className="font-black text-white text-xs md:text-[11px] leading-tight tracking-tight relative z-10 block pr-2 truncate">
                        {noticia.autor}
                      </span>
                    </div>
                  </div>

                  {/* Footer Con Enlace Seguro */}
                  <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-100 justify-center">
                    <a 
                      href={`/noticia/${noticia.id}`}
                      onClick={(e) => {
                        if (isDragging) e.preventDefault();
                        else setAccediendoId(noticia.id);
                      }}
                      className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-all px-4 py-2.5 rounded-xl pointer-events-auto ${
                        accediendoId === noticia.id 
                          ? 'bg-gray-100 text-gray-400 cursor-wait' 
                          : `${noticia.tema.bgBadge} ${noticia.tema.textAccent} hover:opacity-85 active:scale-95`
                      }`}
                    >
                      {accediendoId === noticia.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> ...</>
                      ) : (
                        <>Leer Artículo <ArrowUpRight className="w-3.5 h-3.5" /></>
                      )}
                    </a>
                  </div>

                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex justify-center items-center gap-0 mt-4 mb-8">
              {noticiasUI.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToDot(index)}
                  className="p-4 flex items-center justify-center"
                  aria-label={`Ir a noticia ${index + 1}`}
                >
                  <span className={`block rounded-full transition-all duration-300 ${
                    activeIndex === index
                      ? 'w-8 h-2.5 bg-[#6544FF]'
                      : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'
                  }`} />
                </button>
              ))}
            </div>
          </>
        )}

        {/* 3. BOTÓN REDIRECCIÓN A PAGE: NOTICIAS */}
        <div className="mt-4 flex justify-center animate-in fade-in slide-in-from-bottom-6">
          <a 
            href="/noticias"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1A1528] text-white font-black italic uppercase tracking-wider rounded-full overflow-hidden shadow-[0_10px_40px_rgba(26,21,40,0.25)] hover:shadow-[0_15px_45px_rgba(101,68,255,0.35)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#6544FF] via-[#D946EF] to-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="relative z-10 text-sm md:text-base flex items-center gap-2">
              Ingresar al Centro de Noticias
            </span>
            <div className="relative z-10 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </a>
        </div>

      </div>

    </section>
  );
}