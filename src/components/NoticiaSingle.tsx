'use client';

import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, BookOpen, Calendar, User, Link2, Share2, Bookmark, ArrowUpRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "../../lib/supabase";
import type { Noticia, NoticiaRow } from "../types/noticia";

interface NoticiaSingleProps {
  noticiaId: string; 
}

export default function NoticiaSingle({ noticiaId }: NoticiaSingleProps) {
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorSeguridad, setErrorSeguridad] = useState<boolean>(false);

  useEffect(() => {
    const fetchNoticiaCompleta = async () => {
      // Cápsula de seguridad: Validar formato UUIDv4 para prevenir inyecciones o peticiones basura
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(noticiaId)) {
        console.error("Alerta de seguridad: ID de noticia con formato inválido.");
        setErrorSeguridad(true);
        setCargando(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('noticias')
          .select('*')
          .eq('id', noticiaId)
          .eq('estado', 'activado') // Seguridad: Solo permitir leer artículos activos
          .single();

        if (error) throw error;

        if (data) {
          const rowData = data as NoticiaRow;
          const mapeada: Noticia = {
            id: rowData.id,
            titulo: rowData.titulo,
            extracto: rowData.extracto,
            categoria: rowData.categoria,
            color: rowData.color,
            autor: rowData.autor,
            imagenPrincipal: rowData.imagen_principal,
            imagenesSecundarias: rowData.imagenes_secundarias || [],
            cuerpoMarkdown: rowData.cuerpo_markdown,
            enlacesReferencia: rowData.enlaces_referencia || [],
            estado: rowData.estado,
            destacada: rowData.destacada,
            tiempoLectura: rowData.tiempo_lectura,
            tags: rowData.tags || [],
            createdAt: rowData.created_at,
          };
          setNoticia(mapeada);
        }
      } catch (err) {
        console.error("Error obteniendo el artículo:", err);
      } finally {
        setCargando(false);
      }
    };

    if (noticiaId) fetchNoticiaCompleta();
  }, [noticiaId]);

  // =========================================================================
  // UI SKELETON: Carga ultra sutil y veloz (Mejor UX percibido)
  // =========================================================================
  if (cargando) {
    return (
      <div className="w-full bg-[#F8FAFC] min-h-screen pb-32 animate-pulse">
        
        {/* Portada esqueleto */}
        <header className="w-full max-w-5xl mx-auto pt-8 px-4">
          <div className="w-full h-[45vh] bg-slate-200 rounded-[3rem]" />
        </header>

        {/* Metadatos esqueleto */}
        <section className="w-full max-w-3xl mx-auto mt-6 px-4">
          <div className="w-full h-12 bg-slate-200 rounded-[1.5rem] flex items-center px-4">
            <span className="text-xs font-bold text-slate-400 tracking-wide">Cargando noticia...</span>
          </div>
        </section>

        {/* Cuerpo esqueleto */}
        <main className="w-full max-w-3xl mx-auto mt-8 px-4">
          <div className="bg-white rounded-[3rem] p-8 md:p-14 border border-slate-100 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-6" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
          </div>
        </main>
      </div>
    );
  }

  // Control de errores / No encontrado / Violación de seguridad
  if (!noticia || errorSeguridad) {
    return (
      <div className="w-full min-h-screen bg-[#F4F5F9] flex flex-col items-center justify-center px-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center max-w-md border border-slate-100">
          <h3 className="font-black text-2xl text-slate-800 mb-2">Artículo no disponible</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">El contenido solicitado no existe o no cuentas con los permisos para visualizarlo.</p>
          <a href="/noticias" className="px-6 py-3 bg-[#1A1528] text-white rounded-xl font-bold transition-transform hover:scale-105 inline-block">
            Volver a Noticias
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen pb-32 selection:bg-[#7C3AED] selection:text-white">

      {/* PORTADA PRINCIPAL (HERO) */}
      <header className="w-full max-w-5xl mx-auto pt-8 px-4">
        <div className="relative w-full h-[50vh] md:h-[60vh] rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />
          <img 
            src={noticia.imagenPrincipal} 
            alt={noticia.titulo} 
            className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-700"
          />
          
          <div className="absolute bottom-0 inset-x-0 p-6 md:p-12 z-20 flex flex-col justify-end">
            <div className="mb-4">
              <span className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-gradient-to-r ${noticia.color} text-white shadow-xl`}>
                {noticia.categoria}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl italic uppercase">
              {noticia.titulo}
            </h1>
          </div>
        </div>
      </header>

      {/* DETALLES DE METADATOS */}
      <section className="w-full max-w-3xl mx-auto mt-8 px-4 flex flex-wrap items-center gap-6 text-xs md:text-sm font-bold text-slate-500 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <User className="w-4 h-4" />
          </div>
          <span>Por <span className="text-slate-800">{noticia.autor}</span></span>
        </div>
        <div className="h-4 w-px bg-slate-200 hidden md:block" />
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{new Date(noticia.createdAt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="h-4 w-px bg-slate-200 hidden md:block" />
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span>Lectura estimada: {noticia.tiempoLectura}</span>
        </div>
      </section>

      {/* CUERPO DEL POST */}
      <main className="w-full max-w-3xl mx-auto mt-10 px-4">
        <div className="bg-white rounded-[3rem] p-8 md:p-14 shadow-xl shadow-slate-900/5 border border-slate-100/80 animate-in fade-in slide-in-from-bottom-6 duration-500">
          
          <p className="text-xl md:text-2xl font-medium text-slate-600 leading-relaxed italic border-l-4 border-[#6544FF] pl-6 mb-10">
            "{noticia.extracto}"
          </p>

          <article className="prose prose-slate max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 className="text-3xl md:text-4xl font-black text-slate-800 mt-10 mb-4 tracking-tight uppercase italic leading-tight" {...props} />,
                h2: ({ ...props }) => <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-8 mb-3 tracking-tight" {...props} />,
                h3: ({ ...props }) => <h3 className="text-xl md:text-2xl font-bold text-slate-800 mt-6 mb-2" {...props} />,
                p: ({ ...props }) => <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-6" {...props} />,
                strong: ({ ...props }) => <strong className="font-black text-slate-900 bg-indigo-50/80 px-1 rounded" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-600 font-medium" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal pl-6 space-y-2 mb-6 text-slate-600 font-medium" {...props} />,
                li: ({ ...props }) => <li className="pl-1" {...props} />,
                blockquote: ({ ...props }) => (
                  <blockquote className="bg-[#0A0518]/5 rounded-[2rem] p-6 my-8 border-l-8 border-[#1A1528] italic text-slate-700 font-medium" {...props} />
                ),
                img: ({ ...props }) => (
                  <img className="w-full rounded-[2rem] my-8 shadow-md object-cover max-h-[400px]" alt={props.alt || "Imagen complementaria"} {...props} />
                ),
                hr: () => <hr className="my-10 border-slate-100" />
              }}
            >
              {noticia.cuerpoMarkdown}
            </ReactMarkdown>
          </article>

          {/* Enlaces de referencia tipados */}
          {noticia.enlacesReferencia.length > 0 && (
            <div className="mt-14 pt-8 border-t border-slate-100">
              <h4 className="font-black text-lg text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#6544FF]" /> Recursos y Fuentes Oficiales
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {noticia.enlacesReferencia.map((ref: { titulo: string; url: string }, idx: number) => (
                  <a 
                    key={idx} 
                    href={ref.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#6544FF]/30 hover:bg-white transition-all duration-300 group"
                  >
                    <span className="text-sm font-bold text-slate-700 group-hover:text-[#6544FF] transition-colors truncate pr-2">{ref.titulo}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#6544FF] transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {noticia.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {noticia.tags.map((tag: string) => (
                <span key={tag} className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-200 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}