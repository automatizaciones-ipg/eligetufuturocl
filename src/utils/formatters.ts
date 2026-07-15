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
  
  export const normalizarNombreLogo = (nombre: string) => {
    return nombre
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };