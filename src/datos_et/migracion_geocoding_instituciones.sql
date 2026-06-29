-- ============================================================================
-- Migración: coordenadas reales de instituciones
-- Ejecutar UNA vez en el SQL Editor de Supabase antes de correr
-- geocodificar_instituciones.py
-- ============================================================================

ALTER TABLE instituciones
  ADD COLUMN IF NOT EXISTS latitud   double precision,
  ADD COLUMN IF NOT EXISTS longitud  double precision,
  ADD COLUMN IF NOT EXISTS direccion text;

-- Índice opcional: acelera filtros "instituciones ya geocodificadas".
CREATE INDEX IF NOT EXISTS idx_instituciones_coords
  ON instituciones (latitud, longitud);

-- Nota: la página /institucion/[id] hace SELECT *, por lo que estas columnas
-- llegan automáticamente al componente sin tocar el código de consulta.
