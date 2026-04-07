// src/utils/formatters.ts
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