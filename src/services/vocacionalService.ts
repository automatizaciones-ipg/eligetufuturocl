import { supabase } from "../../lib/supabase";
import type { CarreraDB, DatosUsuario, AreaRIASEC } from "../types/vocacional";

export const buscarCarrerasPorPerfil = async (queryOr: string): Promise<CarreraDB[]> => {
  const { data, error } = await supabase
    .from('carreras')
    .select(`
      id,
      codigo_carrera,
      nombre_carrera,
      region,
      jornada,
      sede,
      arancel_anual,
      duracion_semestres,
      empleabilidad_1er_anio,
      ingreso_promedio_4to_anio,
      instituciones!inner (nombre, tipo)
    `)
    .or(queryOr)
    .limit(60);
  
  if (error) {
    console.error("Error fetching carreras:", error);
    throw error;
  }
  
  // Hacemos un cast seguro ya que conocemos la estructura de la DB
  return data as unknown as CarreraDB[];
};

type LeadPayloadConDatos = {
  datos: DatosUsuario;
  respuestas: Record<number, string>;
  perfil_asignado: AreaRIASEC;
  carreras_sugeridas?: string[];
};

type LeadPayloadPlano = {
  nombre: string;
  correo: string;
  telefono: string;
  respuestas: Record<number, string>;
  perfil_asignado: AreaRIASEC;
  carreras_sugeridas?: string[];
};

type LeadPayload = LeadPayloadConDatos | LeadPayloadPlano;

const esLeadConDatos = (lead: LeadPayload): lead is LeadPayloadConDatos => {
  return "datos" in lead;
};

export const guardarLead = async (lead: LeadPayload): Promise<void> => {
  const payload = {
    nombre: esLeadConDatos(lead) ? lead.datos.nombre : lead.nombre,
    correo: esLeadConDatos(lead) ? lead.datos.email : lead.correo,
    telefono: esLeadConDatos(lead) ? lead.datos.telefono : lead.telefono,
    respuestas: lead.respuestas,
    perfil_asignado: lead.perfil_asignado,
    carreras_sugeridas: lead.carreras_sugeridas ?? []
  };

  const { error } = await supabase.from('leads_vocacional').insert([payload]);
  
  if (error) {
    console.error("Error guardando lead en Supabase:", error);
    throw new Error("No se pudo guardar el prospecto");
  }
};