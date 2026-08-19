// src/lib/noticiasIA/types.ts
export const CATEGORIAS_PERMITIDAS = [
  "Tips de Estudio",
  "Técnicas de Estudio",
  "Tendencias",
] as const;

export type CategoriaPermitida = (typeof CATEGORIAS_PERMITIDAS)[number];

// Forma exacta que le exigimos al modelo devolver (ver anthropic.ts).
// El código valida esta forma antes de confiar en cualquier campo.
export type GeneratedArticle = {
  titulo: string;
  extracto: string;
  categoria: CategoriaPermitida;
  cuerpo_markdown: string;
  tags: string[];
  image_search_keywords: string[];
  puntos_clave: string[];
};

export type UnsplashImages = {
  principal: string;
  secundarias: string[];
};

export type EnlaceReferencia = {
  titulo: string;
  url: string;
};

export type PipelineResult =
  | { status: "success"; noticiaId: string; isoWeek: string }
  | { status: "already_ran"; isoWeek: string }
  | { status: "error"; isoWeek: string; message: string };
