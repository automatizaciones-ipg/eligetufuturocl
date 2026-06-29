-- ============================================================================
-- Migración: detalles enriquecidos de instituciones (Firecrawl)
-- Ejecutar UNA vez en el SQL Editor de Supabase antes de correr
-- enriquecer_instituciones_firecrawl.py
-- ============================================================================

ALTER TABLE instituciones
  -- Datos estructurados extraídos del sitio oficial (fundación, sedes,
  -- modalidades, redes sociales, contacto de admisión, eslogan, etc.)
  ADD COLUMN IF NOT EXISTS detalles    jsonb,
  -- URL del sitio web oficial (columna "Página web" del Excel SIES)
  ADD COLUMN IF NOT EXISTS sitio_web   text,
  -- Marca de tiempo del último enriquecimiento (idempotencia / refresco)
  ADD COLUMN IF NOT EXISTS detalles_actualizado timestamptz;

-- La página /institucion/[id] hace SELECT *, por lo que `detalles` y
-- `sitio_web` llegan automáticamente al componente sin tocar consultas.
