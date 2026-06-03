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