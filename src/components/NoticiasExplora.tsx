'use client';

import React, { useState, useEffect } from "react";
import { 
  Rocket, Flame, Sparkles, ArrowLeft, 
  Clock, ArrowUpRight, BookOpen, Trophy, Globe, Loader2, Compass
} from "lucide-react";
import { supabase } from "../../lib/supabase"; 
import type { Noticia, NoticiaRow } from "../types/noticia";

const CATEGORIAS: string[] = ["Todas", "Tendencias", "Inspiración", "Oportunidades", "Tips de Estudio"];

export default function NoticiasExplora() {
  const [filtroActivo, setFiltroActivo] = useState<string>("Todas");
  const [noticiasFiltradas, setNoticiasFiltradas] = useState<Noticia[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [navegandoA, setNavegandoA] = useState<string | null>(null);

  useEffect(() => {
    const fetchNoticias = async () => {
      setCargando(true);
      try {
        let query = supabase
          .from('noticias')
          .select('*')
          .eq('estado', 'activado')
          .order('created_at', { ascending: false });

        if (filtroActivo !== "Todas") {
          query = query.eq('categoria', filtroActivo);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Tipado estricto
        const rows = data as NoticiaRow[] | null;

        const noticiasFormateadas: Noticia[] = (rows || []).map((row: NoticiaRow) => ({
          id: row.id,
          titulo: row.titulo,
          extracto: row.extracto,
          categoria: row.categoria,
          color: row.color,
          autor: row.autor,
          imagenPrincipal: row.imagen_principal,
          imagenesSecundarias: row.imagenes_secundarias || [],
          cuerpoMarkdown: row.cuerpo_markdown,
          enlacesReferencia: row.enlaces_referencia || [],
          estado: row.estado,
          destacada: row.destacada,
          tiempoLectura: row.tiempo_lectura,
          tags: row.tags || [],
          createdAt: row.created_at,
        }));

        setNoticiasFiltradas(noticiasFormateadas);
      } catch (error) {
        console.error("Error crítico cargando noticias desde Supabase:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchNoticias();
  }, [filtroActivo]);

  const handleNavegar = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setNavegandoA(id);
    setTimeout(() => {
      window.location.href = `/noticia/${id}`; 
    }, 400); 
  };

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen pb-24 selection:bg-[#7C3AED] selection:text-white overflow-x-hidden">
      
      {/* =========================================================================
          HERO SECTION: Centrado, balanceado e inmersivo
          ========================================================================= */}
      <div className="relative w-full bg-[#0A0518] text-white pt-24 pb-36 px-4 sm:px-6 md:px-8 overflow-hidden border-b border-white/5 shadow-[0_20px_60px_rgba(109,40,217,0.12)] z-20">
        
        {/* Fondos abstractos y texturas */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#5B21B6]/30 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
          <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vw] bg-[#9333EA]/20 rounded-full blur-[130px] mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[70vw] h-[70vw] bg-[#3B82F6]/15 rounded-full blur-[140px] mix-blend-screen animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        </div>

        {/* Botón Volver */}
        <div className="w-full max-w-7xl mx-auto relative z-10 px-2 sm:px-4">
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center text-[#A78BFA] hover:text-white transition-all duration-300 mb-12 group font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 px-5 py-3 rounded-full border border-white/10 backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Volver atrás
          </button>
        </div>

        {/* Titular Principal */}
        <div className="w-full max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center space-y-6 px-4">
          <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/10 text-[#D8B4FE] font-black text-xs border border-white/20 uppercase tracking-widest backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 text-[#D946EF]" /> Comunidad & Tendencias
          </div>

          <h1 className="font-black italic uppercase text-4xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[0.95]">
            Explora tu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] via-[#D946EF] to-[#60A5FA]">Futuro</span>
          </h1>

          <p className="text-gray-300 max-w-2xl text-base sm:text-lg md:text-xl font-medium leading-relaxed">
            Historias que inspiran, noticias de vanguardia y las herramientas estratégicas para tomar el control absoluto de tu carrera.
          </p>
        </div>
      </div>

      {/* =========================================================================
          CONTENEDOR PRINCIPAL Y GRILLA DE CONTENIDO
          ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30 -mt-16">
        
        {/* FILTROS FLOTANTES SCROLLABLES */}
        <div className="w-full bg-white backdrop-blur-xl rounded-[2.5rem] p-3 shadow-xl shadow-slate-900/5 border border-slate-100 mb-12 flex items-center justify-start md:justify-center overflow-x-auto custom-scrollbar whitespace-nowrap gap-2">
          {CATEGORIAS.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setFiltroActivo(cat)}
              className={`px-6 py-3.5 rounded-[1.8rem] font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0
                ${filtroActivo === cat 
                  ? "bg-[#0A0518] text-white shadow-lg shadow-indigo-950/20 scale-[1.02]" 
                  : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
            >
              {cat === "Inspiración" && <Flame className={`w-3.5 h-3.5 ${filtroActivo === cat ? "text-orange-500" : ""}`} />}
              {cat === "Oportunidades" && <Trophy className={`w-3.5 h-3.5 ${filtroActivo === cat ? "text-amber-500" : ""}`} />}
              {cat === "Tendencias" && <Sparkles className={`w-3.5 h-3.5 ${filtroActivo === cat ? "text-cyan-400" : ""}`} />}
              {cat === "Tips de Estudio" && <BookOpen className={`w-3.5 h-3.5 ${filtroActivo === cat ? "text-[#6544FF]" : ""}`} />}
              {cat}
            </button>
          ))}
        </div>

        {/* CONTENIDO DINÁMICO */}
        {cargando ? (
          <div className="w-full flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-slate-100 shadow-sm animate-in fade-in duration-500">
            <Loader2 className="w-10 h-10 text-[#6544FF] animate-spin mb-4" />
            <p className="font-bold text-sm tracking-wide text-slate-400 uppercase">Cargando noticias...</p>
          </div>
        ) : (
          <div className="w-full">
            {noticiasFiltradas.length > 0 ? (
              // SOLUCIÓN ESTRUCTURAL: Grilla simétrica 1 -> 2 -> 3 columnas
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                {noticiasFiltradas.map((noticia: Noticia, i: number) => {
                  
                  // LÓGICA MAESTRA: Solo la primera noticia (i === 0) en la vista global ocupará todo el ancho para armar la portada.
                  const esEfectivamenteDestacada = noticia.destacada && filtroActivo === "Todas" && i === 0;
                  
                  return (
                    <a 
                      key={noticia.id}
                      href={`/noticia/${noticia.id}`}
                      onClick={(e) => handleNavegar(e, noticia.id)}
                      className={`group relative flex flex-col bg-white rounded-[2.5rem] p-5 shadow-[0_4px_20px_rgba(15,23,42,0.02)] border border-slate-100/80 hover:border-[#6544FF]/30 hover:shadow-[0_30px_60px_-15px_rgba(101,68,255,0.12)] transition-all duration-500 ease-out overflow-hidden cursor-pointer w-full
                        ${esEfectivamenteDestacada ? "col-span-1 sm:col-span-2 lg:col-span-3 lg:flex-row lg:p-7 gap-6 lg:gap-8" : ""}
                        ${navegandoA === noticia.id ? 'border-[#6544FF] scale-[0.99] opacity-95 z-50' : 'hover:-translate-y-2'}
                      `}
                    >
                      {/* Estado de Carga por Noticia */}
                      {navegandoA === noticia.id && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center rounded-[2.5rem] animate-in fade-in duration-200">
                          <Loader2 className="w-8 h-8 text-[#6544FF] animate-spin" />
                        </div>
                      )}

                      {/* IMAGEN FLUIDA */}
                      <div className={`relative overflow-hidden rounded-[2rem] shrink-0 bg-slate-100 w-full
                        ${esEfectivamenteDestacada ? "h-64 sm:h-80 lg:h-auto lg:w-[50%] min-h-[280px]" : "h-56 sm:h-60 mb-5"}
                      `}>
                        <div className="absolute inset-0 bg-slate-950/5 group-hover:bg-transparent transition-colors duration-500 z-10" />
                        <img 
                          src={noticia.imagenPrincipal} 
                          alt={noticia.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          loading="lazy"
                        />
                        <div className="absolute top-4 left-4 z-20">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r ${noticia.color} text-white shadow-md`}>
                            {noticia.categoria}
                          </span>
                        </div>
                      </div>

                      {/* TEXTOS Y METADATOS ALINEADOS */}
                      <div className="flex flex-col flex-1 justify-between h-full w-full">
                        <div>
                          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> 
                              {new Date(noticia.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" /> 
                              {noticia.tiempoLectura}
                            </span>
                          </div>

                          <h3 className={`font-black text-slate-800 leading-tight group-hover:text-[#6544FF] transition-colors mb-3 line-clamp-3 uppercase italic tracking-tight
                            ${esEfectivamenteDestacada ? "text-2xl sm:text-3xl lg:text-4xl" : "text-lg sm:text-xl md:text-2xl"}`}
                          >
                            {noticia.titulo}
                          </h3>
                          
                          <p className="text-slate-500 font-medium text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
                            {noticia.extracto}
                          </p>
                        </div>

                        {/* PIE DE TARJETA: Fijo en el fondo por flex-1 y justify-between */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                          <span className="text-xs font-black text-[#6544FF] uppercase tracking-widest group-hover:translate-x-1 transition-transform duration-300">
                            Leer artículo completo
                          </span>
                          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 group-hover:bg-[#6544FF] group-hover:text-white transition-all duration-300 shadow-sm">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              /* ESTADO VACÍO ESTRATÉGICO */
              <div className="w-full text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm px-4 animate-in fade-in duration-500">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-black text-xl text-slate-700 mb-1">Sin artículos en esta sección</h3>
                <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto">Pronto nuestro equipo publicará novedades en esta categoría. ¡Mantente atento!</p>
                <button onClick={() => setFiltroActivo("Todas")} className="mt-6 px-6 py-3 bg-[#0A0518] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                  Ver catálogo completo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ESTILOS Y ANIMACIONES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1); }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .custom-scrollbar::-webkit-scrollbar { height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }
      `}} />
    </div>
  );
}