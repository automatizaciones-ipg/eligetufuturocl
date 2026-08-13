// src/types/noticia.ts

// Tipo para el uso interno en el Front-End (CamelCase)
export interface Noticia {
    id: string;
    titulo: string;
    extracto: string;
    categoria: string;
    color: string;
    autor: string;
    imagenPrincipal: string;
    imagenesSecundarias: string[];
    cuerpoMarkdown: string;
    enlacesReferencia: Array<{ titulo: string; url: string }>;
    estado: 'activado' | 'desactivado';
    destacada: boolean;
    tiempoLectura: string;
    tags: string[];
    createdAt: string;
  }
  
  // Tipo exacto de cómo viene la fila desde PostgreSQL (Snake_Case)
  export interface NoticiaRow {
    id: string;
    titulo: string;
    extracto: string;
    categoria: string;
    color: string;
    autor: string;
    imagen_principal: string;
    imagenes_secundarias: string[] | null;
    cuerpo_markdown: string;
    enlaces_referencia: Array<{ titulo: string; url: string }> | null;
    estado: 'activado' | 'desactivado';
    destacada: boolean;
    tiempo_lectura: string;
    tags: string[] | null;
    created_at: string;
  }

/**
 * Convierte la fila snake_case de Supabase al modelo camelCase del front.
 * Punto único de mapeo: lo usan tanto el servidor (para sembrar el HTML de
 * /noticia/[id] y /noticias) como los componentes que refrescan en cliente.
 */
export function mapearNoticia(row: NoticiaRow): Noticia {
  return {
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
  };
}