import type { ReactNode } from "react";

export type AreaRIASEC = 'Realista' | 'Investigador' | 'Artistico' | 'Social' | 'Emprendedor' | 'Convencional';

export interface OpcionTest {
  id: string;
  texto: string;
  icono: ReactNode;
  areaAfinidad: AreaRIASEC;
}

export interface PreguntaTest {
  id: number;
  pregunta: string;
  opciones: OpcionTest[];
}

export interface PerfilVocacional {
  titulo: string;
  descripcion: string;
  queryOr: string; // Para buscar en tu DB de Supabase
  color: string;
  textClass: string;
}

export interface DatosUsuario {
  nombre: string;
  email: string;
  telefono: string;
}

export interface CarreraDB {
  id?: number;
  codigo_carrera?: string | null;
  nombre_carrera: string;
  region?: string | null;
  jornada?: string | null;
  sede?: string | null;
  arancel_anual?: number | null;
  duracion_semestres?: number | null;
  empleabilidad_1er_anio?: number | null;
  ingreso_promedio_4to_anio?: string | null;
  instituciones: { nombre: string; tipo?: string | null }[];
  match?: number; // Calculado en el frontend
}