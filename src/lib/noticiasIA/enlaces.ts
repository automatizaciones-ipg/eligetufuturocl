// src/lib/noticiasIA/enlaces.ts
// Banco curado de enlaces_referencia. El modelo NUNca inventa URLs externas:
// solo devuelve `tags` (ver anthropic.ts) y este código empareja esos tags
// contra un banco fijo de recursos ya verificados. Así evitamos publicar en
// vivo, sin revisión humana, un link roto o alucinado por el LLM.
import type { EnlaceReferencia } from "./types";

type EntradaBanco = {
  keywords: string[]; // se compara en minúsculas, sin tildes, contra los tags
  enlace: EnlaceReferencia;
};

const BANCO: EntradaBanco[] = [
  {
    keywords: ["lectura rapida", "lectura", "comprension lectora"],
    enlace: { titulo: "Spreeder — entrenador de lectura rápida (gratis)", url: "https://www.spreeder.com/" },
  },
  {
    keywords: ["repeticion espaciada", "memoria", "flashcards", "anki"],
    enlace: { titulo: "Anki — repetición espaciada con tarjetas", url: "https://apps.ankiweb.net/" },
  },
  {
    keywords: ["pomodoro", "productividad", "enfoque", "concentracion", "atencion"],
    enlace: { titulo: "Pomofocus — temporizador Pomodoro online", url: "https://pomofocus.io/" },
  },
  {
    keywords: ["notas", "toma de notas", "zettelkasten", "organizacion"],
    enlace: { titulo: "Notion — organiza apuntes y notas de estudio", url: "https://www.notion.com/" },
  },
  {
    keywords: ["inteligencia artificial", "ia", "herramientas ia", "tecnologia"],
    enlace: { titulo: "Google SkillShop — cursos gratuitos de IA y datos", url: "https://skillshop.withgoogle.com/" },
  },
  {
    keywords: ["habitos de estudio", "habitos", "rendimiento academico", "motivacion"],
    enlace: { titulo: "Coursera — cursos y certificados gratuitos", url: "https://www.coursera.org/" },
  },
  {
    keywords: ["microcredenciales", "certificaciones", "empleabilidad"],
    enlace: { titulo: "IBM SkillsBuild — cursos y certificaciones gratuitas", url: "https://skillsbuild.org/" },
  },
];

// Siempre garantizados: recursos propios del sitio, nunca fallan.
const ENLACES_INTERNOS: EnlaceReferencia[] = [
  { titulo: "Test Vocacional — descubre tu perfil RIASEC", url: "/herramientas/test-vocacional" },
  { titulo: "Buscador de Carreras — compara por empleabilidad y arancel", url: "/herramientas/buscador" },
];

const DIACRITICOS = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g"
);

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(DIACRITICOS, "");
}

export function armarEnlacesReferencia(tags: string[]): EnlaceReferencia[] {
  const tagsNorm = tags.map(normalizar);

  const externos = BANCO.filter((entrada) =>
    entrada.keywords.some((kw) => tagsNorm.some((tag) => tag.includes(kw) || kw.includes(tag)))
  ).map((entrada) => entrada.enlace);

  // Máximo 2 externos + 1 interno, evita listas gigantes.
  const resultado = [...externos.slice(0, 2), ENLACES_INTERNOS[0]];
  if (resultado.length < 2) resultado.push(ENLACES_INTERNOS[1]);
  return resultado;
}
