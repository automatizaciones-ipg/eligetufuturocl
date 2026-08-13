// src/utils/formatters.ts

/**
 * Valida que un código (codigo_carrera / codigo_institucion) sea apto para usarse
 * como segmento de URL. Descarta datos basura que se cuelan en la ingesta —p.ej.
 * notas al pie como "FUENTE: Portal mifuturo.cl..."— que rompen el build en
 * Windows (`:` ilegal en carpetas) y generan URLs basura en producción/sitemap.
 * Los códigos válidos del SIES son cortos y sin espacios ni puntuación.
 */
export const esCodigoRutaValido = (code: unknown): boolean => {
  if (code === null || code === undefined) return false;
  const s = String(code).trim();
  return s.length > 0 && s.length <= 40 && /^[A-Za-z0-9_-]+$/.test(s);
};

export const generarTipoInst = (tipoBD: string | null) => {
    if (!tipoBD) return "N/A";
    if (tipoBD.includes("Universidades")) return "U";
    if (tipoBD.includes("Institutos")) return "IP";
    if (tipoBD.includes("Centros")) return "CFT";
    return "N/A";
  };
  
  export const generarSiglaInstitucion = (nombre: string) => {
    if (!nombre) return "N/A";
    const palabras = nombre.replace(/\b(de|en|el|la|los|las|y)\b/gi, '').split(' ').filter(p => p.trim().length > 0);
    
    if (palabras.length > 1) {
      return (palabras[0][0] + (palabras[1]?.[0] || '') + (palabras[2]?.[0] || '')).toUpperCase().substring(0, 3);
    }
    return nombre.substring(0, 3).toUpperCase();
  };
  
// ============================================================================
// Normalización de textos del SIES
// ----------------------------------------------------------------------------
// La ingesta trae los nombres EN MAYÚSCULA Y SIN TILDES ("INGENIERIA EN
// CONSTRUCCION"). Mostrarlos así en <title> y H1 castiga en buscadores: pierde
// la coincidencia con el término real que la gente escribe ("ingeniería en
// construcción") y en SERP se lee como spam. Punto único de verdad usado por
// las islas React y por las páginas .astro que arman los metadatos.
// ============================================================================

export const CONECTORES = ['de', 'en', 'el', 'la', 'los', 'las', 'y', 'del', 'a', 'por', 'con', 'para'];

export const MAPA_TILDES: Record<string, string> = {
  'actuacion': 'actuación', 'administracion': 'administración', 'ingenieria': 'ingeniería',
  'tecnico': 'técnico', 'tecnologia': 'tecnología', 'computacion': 'computación',
  'informatica': 'informática', 'psicologia': 'psicología', 'pedagogia': 'pedagogía',
  'educacion': 'educación', 'kinesiologia': 'kinesiología', 'odontologia': 'odontología',
  'fonoaudiologia': 'fonoaudiología', 'nutricion': 'nutrición', 'biologia': 'biología',
  'quimica': 'química', 'fisica': 'física', 'geologia': 'geología', 'agronomia': 'agronomía',
  'electronica': 'electrónica', 'electrica': 'eléctrica', 'mecanica': 'mecánica',
  'automatizacion': 'automatización', 'gestion': 'gestión', 'publico': 'público',
  'publicas': 'públicas', 'juridica': 'jurídica', 'politica': 'política',
  'politicas': 'políticas', 'antropologia': 'antropología', 'arqueologia': 'arqueología',
  'sociologia': 'sociología', 'filosofia': 'filosofía', 'teologia': 'teología',
  'musica': 'música', 'animacion': 'animación', 'gastronomia': 'gastronomía',
  'estetica': 'estética', 'cosmetologia': 'cosmetología', 'logistica': 'logística',
  'prevencion': 'prevención', 'construccion': 'construcción', 'comunicacion': 'comunicación',
  'diseno': 'diseño', 'parvulo': 'párvulo', 'bilingue': 'bilingüe', 'ingles': 'inglés',
  'enfermeria': 'enfermería', 'audicion': 'audición', 'optometria': 'optometría',
  'clinico': 'clínico', 'radiologia': 'radiología', 'odontologico': 'odontológico',
  'medico': 'médico', 'bioquimica': 'bioquímica', 'biotecnologia': 'biotecnología',
  'estadistica': 'estadística', 'matematica': 'matemática', 'astronomia': 'astronomía',
  'geofisica': 'geofísica', 'geografia': 'geografía', 'linguistica': 'lingüística',
  'basica': 'básica', 'plasticas': 'plásticas', 'coreografia': 'coreografía',
  'grafico': 'gráfico', 'geomatica': 'geomática', 'topografia': 'topografía',
  'hoteleria': 'hotelería', 'television': 'televisión', 'fotografia': 'fotografía',
  'religion': 'religión', 'traduccion': 'traducción', 'interpretacion': 'interpretación',
  'fraces': 'francés', 'aleman': 'alemán', 'orientacion': 'orientación',
  // Topónimos: aparecen en `sede`, que ahora forma parte del título y la
  // descripción de cada ficha de carrera. Escribirlos sin tilde pierde la
  // coincidencia con la búsqueda local ("carreras en concepción").
  'concepcion': 'Concepción', 'valparaiso': 'Valparaíso', 'chillan': 'Chillán',
  'angeles': 'Ángeles', 'maipu': 'Maipú', 'curico': 'Curicó',
  'copiapo': 'Copiapó', 'joaquin': 'Joaquín', 'quilpue': 'Quilpué',
  'penaflor': 'Peñaflor', 'tome': 'Tomé', 'canete': 'Cañete',
  'pucon': 'Pucón', 'quellon': 'Quellón', 'constitucion': 'Constitución',
  'aysen': 'Aysén', 'nunoa': 'Ñuñoa', 'vicuna': 'Vicuña'
};

/** "INGENIERIA EN CONSTRUCCION" → "Ingeniería en Construcción". */
export const formatearTitulo = (texto: string): string => {
  if (!texto) return "";
  return texto.toLowerCase().split(' ').map((palabra, index) => {
    const palabraLimpia = palabra.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    const palabraCorregida = MAPA_TILDES[palabraLimpia]
      ? palabra.replace(palabraLimpia, MAPA_TILDES[palabraLimpia])
      : palabra;

    if (index > 0 && CONECTORES.includes(palabraCorregida)) return palabraCorregida;
    return palabraCorregida.charAt(0).toUpperCase() + palabraCorregida.slice(1);
  }).join(' ');
};

export const quitarAcentos = (str: string): string =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Convierte el campo `sede` del SIES en un nombre de lugar presentable.
 * Es la pieza que diferencia las fichas de una misma carrera: sin ella, el
 * mismo programa en 25 sedes distintas comparte t\u00edtulo y descripci\u00f3n.
 *
 *   "SEDE LOS ANGELES"                \u2192 "Los Angeles"
 *   "CASA CENTRAL (SANTIAGO)"         \u2192 "Santiago"
 *   "CASA CENTRAL"  (+ regi\u00f3n Biob\u00edo) \u2192 "Biob\u00edo"
 */
export const describirLugar = (
  sede: string | null | undefined,
  region?: string | null,
): string | null => {
  const regionLimpia = region?.trim() ? formatearTitulo(region.trim()) : null;
  const cruda = sede?.trim();
  if (!cruda) return regionLimpia;

  // "CASA CENTRAL (SANTIAGO - PROVIDENCIA)" \u2192 nos quedamos con "SANTIAGO"
  const entreParentesis = cruda.match(/\(([^)]+)\)/)?.[1];
  let base = entreParentesis ? entreParentesis.split("-")[0] : cruda;

  base = base.replace(/^(SUB-?CAMPUS|CAMPUS|SEDE|CASA CENTRAL)\s*/i, "").trim();

  // "CASA CENTRAL" sin m\u00e1s datos no dice d\u00f3nde queda: mejor la regi\u00f3n.
  if (!base) return regionLimpia;

  return formatearTitulo(base);
};

/**
 * Convierte un texto en un segmento de URL estable: min\u00fasculas, sin tildes ni
 * puntuaci\u00f3n, separado por guiones. Es la clave de las p\u00e1ginas hub
 * (`/carreras/tecnico-en-enfermeria`), as\u00ed que debe ser determinista: dos
 * nombres que solo difieran en tildes o may\u00fasculas colapsan al mismo slug, y
 * eso es deseado \u2014 son la misma carrera escrita de dos formas por el SIES.
 */
export const slugificar = (texto: string): string =>
  (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00f1/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/**
 * Recorta una meta description en el \u00faltimo espacio antes del l\u00edmite. Cortar
 * por \u00edndice fijo dejaba frases partidas a mitad de palabra ("...datos of").
 */
export const recortarDescripcion = (texto: string, max = 158): string => {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  return corte.slice(0, corte.lastIndexOf(" ")).replace(/[.,;:]$/, "") + "\u2026";
};

/**
 * Etiqueta de jornada solo cuando aporta: "Diurna" es el caso por defecto y
 * ensucia el t\u00edtulo sin diferenciar nada.
 */
export const describirJornada = (
  jornada: string | null | undefined,
): string | null => {
  const j = jornada?.trim();
  if (!j) return null;
  const normalizada = j.toLowerCase();
  if (normalizada === "diurna" || normalizada === "otra") return null;
  return formatearTitulo(j);
};

  export const normalizarNombreLogo = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };