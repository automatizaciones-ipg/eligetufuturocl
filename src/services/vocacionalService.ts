// src/services/vocacionalService.ts
import { supabase } from "../../lib/supabase";

export const buscarCarrerasPorPerfil = async (queryOr: string) => {
  const { data, error } = await supabase
    .from('carreras')
    .select(`nombre_carrera, instituciones!inner (nombre)`)
    .or(queryOr)
    .limit(50);
  
  if (error) throw error;
  return data;
};

export const guardarLead = async (lead: {
  nombre: string;
  correo: string;
  telefono: string;
  respuestas: Record<number, string>;
  perfil_asignado: string;
  carreras_sugeridas: string[];
}) => {
  const { error } = await supabase.from('leads_vocacional').insert([lead]);
  if (error) {
    console.error("Error guardando lead:", error);
    // Podrías lanzar a un sistema de monitoreo como Sentry aquí
  }
};