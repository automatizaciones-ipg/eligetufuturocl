// src/lib/noticiasIA/categorias.ts
// Allow-list fija de categoría → color (gradiente Tailwind). El modelo solo
// elige el NOMBRE de la categoría (de una lista cerrada, ver types.ts); el
// string de `color` lo resuelve siempre este código. Nunca se usa un valor
// de color generado por el LLM: ese campo se renderiza sin sanitizar como
// `bg-gradient-to-r ${noticia.color}` en NoticiaSingle.tsx/NoticiasExplora.tsx,
// así que dejar que el modelo lo redacte abriría la puerta a clases CSS
// arbitrarias inyectadas vía contenido generado.
import type { CategoriaPermitida } from "./types";

const COLOR_POR_CATEGORIA: Record<CategoriaPermitida, string> = {
  "Tips de Estudio": "from-[#8B5CF6] to-[#D946EF]",
  "Técnicas de Estudio": "from-[#8B5CF6] to-[#D946EF]",
  Tendencias: "from-[#06B6D4] to-[#3B82F6]",
};

export function colorParaCategoria(categoria: CategoriaPermitida): string {
  return COLOR_POR_CATEGORIA[categoria];
}
