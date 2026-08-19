// src/lib/noticiasIA/anthropic.ts
// Cliente delgado a la Anthropic Messages API vía fetch nativo — mismo
// espíritu "sin dependencias nuevas" que src/lib/scraper/*.ts. No usamos el
// SDK (@anthropic-ai/sdk) para no sumar una dependencia npm solo para una
// llamada semanal desde un cron.
import { CATEGORIAS_PERMITIDAS } from "./types";
import type { GeneratedArticle } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

const ARTICULO_SCHEMA = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    extracto: { type: "string" },
    categoria: { type: "string", enum: [...CATEGORIAS_PERMITIDAS] },
    cuerpo_markdown: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    image_search_keywords: { type: "array", items: { type: "string" } },
    puntos_clave: { type: "array", items: { type: "string" } },
  },
  required: [
    "titulo",
    "extracto",
    "categoria",
    "cuerpo_markdown",
    "tags",
    "image_search_keywords",
    "puntos_clave",
  ],
  additionalProperties: false,
} as const;

const TEMAS_POOL = [
  "lectura rápida y técnicas de skimming/scanning",
  "repetición espaciada y flashcards (Anki, Zettelkasten)",
  "la técnica Pomodoro y gestión del enfoque",
  "toma de notas digital para estudiantes (Cornell, mapas mentales, apps)",
  "herramientas de inteligencia artificial para estudiar",
  "hábitos de estudio basados en neurociencia (active recall, interleaving)",
  "productividad y minimalismo digital para estudiantes",
  "microcredenciales y certificaciones online gratuitas",
];

function construirPrompt(temasRecientes: string[]): string {
  const evitar = temasRecientes.length
    ? `Evita repetir estos títulos/temas ya publicados recientemente:\n${temasRecientes.map((t) => `- ${t}`).join("\n")}\n\n`
    : "";

  return `Eres un redactor editorial de "Elige Tu Futuro", un sitio chileno de orientación vocacional para estudiantes de enseñanza media y universitarios (admisión 2026). Escribe UN artículo original en español de Chile (es-CL) para la sección de tips/noticias del sitio.

Temática general (elige UN subtema concreto de esta lista, o algo muy cercano): ${TEMAS_POOL.join("; ")}.

${evitar}Requisitos del artículo:
- Dirigido a estudiantes chilenos preparando la PAES o ya en la universidad, tono cercano y motivador, sin relleno genérico de IA.
- "extracto": máximo 160 caracteres, resume el gancho del artículo.
- "categoria": una de "Tips de Estudio", "Técnicas de Estudio" o "Tendencias".
- "cuerpo_markdown": 1500-2500 palabras en Markdown, con al menos 3 secciones "### ", una cita en blockquote ("> ..."), listas donde aporten claridad, y un cierre con conclusión práctica. NO incluyas imágenes embebidas en el markdown (las imágenes se agregan aparte). NO inventes URLs ni enlaces dentro del cuerpo.
- "tags": 4 a 6 palabras clave en español, minúsculas, sin tildes si es ambiguo.
- "image_search_keywords": 2 a 3 palabras clave EN INGLÉS para buscar fotos de stock relacionadas (ej. "student reading book", "focus study desk").
- "puntos_clave": 3 a 5 oraciones, cada una autocontenida y citable por sí sola (debe tener sentido sin haber leído el resto del artículo) que respondan directamente una pregunta concreta que un estudiante haría sobre el tema. Nada de gancho ni relleno — son las respuestas, no el resumen del resumen.

Responde únicamente con el artículo en el formato solicitado.`;
}

function parseArticulo(json: unknown): GeneratedArticle {
  if (typeof json !== "object" || json === null) {
    throw new Error("Respuesta de Anthropic no es un objeto JSON.");
  }
  const a = json as Record<string, unknown>;
  if (
    typeof a.titulo !== "string" ||
    typeof a.extracto !== "string" ||
    typeof a.categoria !== "string" ||
    !CATEGORIAS_PERMITIDAS.includes(a.categoria as (typeof CATEGORIAS_PERMITIDAS)[number]) ||
    typeof a.cuerpo_markdown !== "string" ||
    !Array.isArray(a.tags) ||
    !a.tags.every((t) => typeof t === "string") ||
    !Array.isArray(a.image_search_keywords) ||
    !a.image_search_keywords.every((k) => typeof k === "string") ||
    !Array.isArray(a.puntos_clave) ||
    !a.puntos_clave.every((p) => typeof p === "string")
  ) {
    throw new Error("La respuesta de Anthropic no calza con el esquema esperado de GeneratedArticle.");
  }
  return a as unknown as GeneratedArticle;
}

export async function generarArticulo(temasRecientes: string[]): Promise<GeneratedArticle> {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Falta ANTHROPIC_API_KEY en las variables de entorno.");

  const body = {
    model: MODEL,
    max_tokens: 8000,
    output_config: {
      format: { type: "json_schema", schema: ARTICULO_SCHEMA },
    },
    messages: [{ role: "user", content: construirPrompt(temasRecientes) }],
  };

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Anthropic API respondió ${res.status}: ${detalle.slice(0, 500)}`);
  }

  const data = await res.json();

  if (data.stop_reason === "refusal") {
    throw new Error("Anthropic rechazó la generación del artículo (stop_reason: refusal).");
  }

  const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("Anthropic no devolvió contenido de texto en la respuesta.");
  }

  const parsed = JSON.parse(textBlock.text);
  return parseArticulo(parsed);
}
