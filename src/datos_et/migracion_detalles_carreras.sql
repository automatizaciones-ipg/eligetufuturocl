-- ============================================================================
-- Migración: detalles enriquecidos de CARRERAS (Firecrawl)
-- Ejecutar UNA vez en el SQL Editor de Supabase antes de correr
-- enriquecer_carreras_firecrawl.py
-- ============================================================================

ALTER TABLE carreras
  -- Perfil profesional investigado en la web pública: resumen, perfil de egreso,
  -- campo laboral, qué aprenderás, habilidades, título.
  ADD COLUMN IF NOT EXISTS detalles jsonb,
  ADD COLUMN IF NOT EXISTS detalles_actualizado timestamptz;

-- La página /carrera/[id] hace SELECT *, por lo que `detalles` llega
-- automáticamente al componente sin tocar la consulta.
