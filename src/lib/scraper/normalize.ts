// src/lib/scraper/normalize.ts
// Normalización de términos de búsqueda: núcleo (sin tildes) para matching
// interno, y recuperación del nombre "bonito" (con tildes) para mostrar.
//
// FIX tildes (bug conocido del scraper original: nunca se restauraban) +
// FIX conector "de"/"la"/"el" removido de nombres compuestos (ej. "administración
// de empresas" perdía el "de") + FIX intenciones duplicadas ("mejor pagada" /
// "mejor pagadas" se contaban por separado).

export const norm = (s: string): string =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "") // quita marcas diacríticas combinantes (tildes)
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Intenciones semilla: cada una se expande con a-z para descubrir el long tail.
export const INTENTS = [
  "estudiar ",
  "carrera de ",
  "tecnico en ",
  "ingenieria en ",
  "donde estudiar ",
  "quiero estudiar ",
  "pedagogia en ",
  "tecnico de nivel superior en ",
];

// Seeds sueltas para captar modos/intención de compra.
export const EXTRA_SEEDS = [
  "carreras mejor pagadas ",
  "carreras con futuro ",
  "carreras online ",
  "que estudiar ",
  "carreras tecnicas ",
  "carreras cortas ",
];

// Prefijos de intención a remover para quedarnos con el "núcleo" de la carrera.
export const STRIP = [
  "tecnico de nivel superior en ",
  "donde estudiar ",
  "quiero estudiar ",
  "carrera de ",
  "tecnico en ",
  "ingenieria en ",
  "pedagogia en ",
  "estudiar ",
  "carrera ",
  "que es ",
  "estudia ",
];

// Modificadores que revelan intención (se cuentan y se quitan del núcleo).
export const MODS = [
  "online",
  "a distancia",
  "semipresencial",
  "vespertino",
  "gratis",
  "sueldo",
  "mejor pagada",
  "mejor pagadas",
  "malla",
  "arancel",
  "puntaje",
  "beca",
  "part time",
  "sin matematicas",
  "nocturno",
  "en chile",
  "santiago",
  "duracion",
  "campo laboral",
];

// Variantes de un mismo modificador → forma canónica (evita duplicados como
// "mejor pagada" / "mejor pagadas" contados por separado). Mapa explícito, no
// stemming genérico, para no romper palabras que ya terminan en "s" (ej. "gratis").
export const MOD_CANONICAL: Record<string, string> = {
  "mejor pagadas": "mejor pagada",
};

// Conectores vacíos a remover del término final. OJO: "de", "la", "el" se
// excluyen a propósito — para cuando llegamos aquí ya se quitaron los prefijos
// de intención completos (STRIP), así que un "de"/"la"/"el" remanente casi
// siempre es parte legítima del nombre de una carrera (ej. "administración DE
// empresas", "ingeniería DE ejecución", "técnico DE turismo").
const CONNECTORS_TO_STRIP = /\b(en|online|chile|y|para|con)\b/g;

export function stripConnectors(s: string): string {
  return s.replace(CONNECTORS_TO_STRIP, " ");
}

/**
 * Extrae el núcleo de una sugerencia de autocomplete (sin prefijos de
 * intención ni modificadores), y reporta cada modificador detectado (ya
 * canonicalizado) vía onModifier.
 */
export function extractCore(sug: string, onModifier?: (canonicalMod: string) => void): string {
  let s = norm(sug);

  for (const m of MODS) {
    if (s.includes(m)) onModifier?.(MOD_CANONICAL[m] ?? m);
  }

  for (const p of STRIP) {
    if (s.startsWith(p)) {
      s = s.slice(p.length);
      break;
    }
  }

  for (const m of MODS) {
    s = s.replace(new RegExp(`\\b${escapeRegExp(m)}\\b`, "g"), " ");
  }

  s = stripConnectors(s).replace(/\s+/g, " ").trim();
  return s;
}

export function deriveNivel(demanda: number): string {
  if (demanda >= 80) return "Muy buscada";
  if (demanda >= 50) return "Buscada";
  return "Emergente";
}

export function titleCase(s: string): string {
  return s.replace(/(^|\s)([a-zà-ÿ])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

const CONNECTOR_TOKENS = new Set(["de", "la", "el", "en", "y", "para", "con"]);

function significantTokens(s: string): string[] {
  return norm(s)
    .split(" ")
    .filter((t) => t && !CONNECTOR_TOKENS.has(t))
    .sort();
}

// Diccionario chico de respaldo (términos frecuentes del propio scraper que
// pueden no estar en el catálogo real de carreras de Supabase).
const FALLBACK_DISPLAY: Record<string, string> = {
  psicologia: "Psicología",
  derecho: "Derecho",
  veterinaria: "Veterinaria",
  enfermeria: "Enfermería",
  logistica: "Logística",
  kinesiologia: "Kinesiología",
  gastronomia: "Gastronomía",
  historia: "Historia",
  odontologia: "Odontología",
  contabilidad: "Contabilidad",
  quimica: "Química",
  nutricion: "Nutrición",
  informatica: "Informática",
  cosmetologia: "Cosmetología",
  medicina: "Medicina",
  pedagogia: "Pedagogía",
  ciberseguridad: "Ciberseguridad",
  "recursos humanos": "Recursos Humanos",
  "marketing digital": "Marketing Digital",
  "ingenieria comercial": "Ingeniería Comercial",
  "analista de datos": "Analista de Datos",
  "administracion de empresas": "Administración de Empresas",
  "administracion empresas": "Administración de Empresas",
};

/** Mapa norm(nombre_carrera) → nombre_carrera, construido desde el catálogo real (SIES/MINEDUC). */
export function buildCatalogMap(nombres: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const nombre of nombres) {
    const key = norm(nombre);
    if (key && !map.has(key)) map.set(key, nombre);
  }
  return map;
}

/**
 * Recupera el nombre "bonito" (con tildes) de un núcleo normalizado:
 * 1) match exacto contra el catálogo real de carreras,
 * 2) match por tokens significativos (ignora conectores) contra el catálogo,
 * 3) diccionario manual de respaldo,
 * 4) Title Case del término tal cual (mejor esfuerzo, nunca minúsculas planas).
 */
export function resolveDisplayName(core: string, catalogMap: Map<string, string>): string {
  const exact = catalogMap.get(core);
  if (exact) return exact;

  const coreTokens = significantTokens(core);
  if (coreTokens.length > 0) {
    for (const [key, value] of catalogMap) {
      const keyTokens = significantTokens(key);
      if (keyTokens.length === coreTokens.length && keyTokens.every((t, i) => t === coreTokens[i])) {
        return value;
      }
    }
  }

  const fallback = FALLBACK_DISPLAY[core];
  if (fallback) return fallback;

  return titleCase(core);
}
