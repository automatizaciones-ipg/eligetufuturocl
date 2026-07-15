-- ============================================================================
-- Migración: ponderaciones de admisión, vacantes y requisito de ingreso de
-- CARRERAS (fuente oficial SIES, Oferta Académica 2026)
-- Ejecutar UNA vez en el SQL Editor de Supabase antes de correr
-- backfill_ponderaciones.py
-- ============================================================================

ALTER TABLE carreras
  -- Ponderaciones oficiales de la fórmula de postulación (% 0-100 cada una).
  -- No todas las carreras usan todos los componentes (p.ej. la mayoría no
  -- pondera Historia o Ciencias a la vez).
  ADD COLUMN IF NOT EXISTS ponderacion_notas smallint,
  ADD COLUMN IF NOT EXISTS ponderacion_ranking smallint,
  ADD COLUMN IF NOT EXISTS ponderacion_lenguaje smallint,
  ADD COLUMN IF NOT EXISTS ponderacion_matematica smallint,
  ADD COLUMN IF NOT EXISTS ponderacion_matematica2 smallint,
  ADD COLUMN IF NOT EXISTS ponderacion_historia smallint,
  ADD COLUMN IF NOT EXISTS ponderacion_ciencias smallint,
  ADD COLUMN IF NOT EXISTS ponderacion_otros smallint,
  -- Vacantes ofertadas por semestre (algunas carreras solo abren en el 1er semestre).
  ADD COLUMN IF NOT EXISTS vacantes_semestre_1 integer,
  ADD COLUMN IF NOT EXISTS vacantes_semestre_2 integer,
  -- Requisito de ingreso textual del SIES (ej. "Educación Media", "Título Profesional").
  ADD COLUMN IF NOT EXISTS requisito_ingreso text,
  -- Si la carrera participa del proceso de admisión centralizado DEMRE o tiene
  -- admisión propia (afecta si el puntaje ponderado calculado aplica o no).
  ADD COLUMN IF NOT EXISTS usa_demre boolean,
  -- Fase 2 (futura, no poblada por este script): puntaje de corte del proceso
  -- anterior, cuando se consiga la fuente oficial de matrícula. Se deja
  -- preparado para que la UI del simulador lo use apenas exista el dato.
  ADD COLUMN IF NOT EXISTS puntaje_corte_referencial integer,
  ADD COLUMN IF NOT EXISTS puntaje_corte_anio smallint,
  ADD COLUMN IF NOT EXISTS puntaje_corte_fuente text;

-- La página /carrera/[id] y el simulador hacen SELECT * / SELECT explícito de
-- estas columnas — no requieren más cambios de query para empezar a leerlas.
