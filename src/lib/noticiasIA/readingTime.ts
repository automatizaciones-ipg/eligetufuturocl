// src/lib/noticiasIA/readingTime.ts
// El tiempo de lectura se calcula acá, contando palabras reales del cuerpo —
// no se confía en ningún número que el modelo pueda proponer.
const PALABRAS_POR_MINUTO = 200;

export function calcularTiempoLectura(cuerpoMarkdown: string): string {
  const textoPlano = cuerpoMarkdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // imágenes markdown
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ") // links markdown
    .replace(/[#>*_`~-]/g, " ");

  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;
  const minutos = Math.max(1, Math.round(palabras / PALABRAS_POR_MINUTO));
  return `${minutos} min`;
}
