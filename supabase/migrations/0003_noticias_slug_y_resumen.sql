-- ============================================================================
-- Noticias: URL con nombre (slug) + resumen citable para GEO
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor del proyecto Supabase de eligetufuturo.cl
-- (el mismo que usan PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en producción).
--
-- Qué hace:
--   · slug          URL legible ("nombre" del artículo) para reemplazar el
--     UUID crudo en /noticia/<id>. La puebla src/lib/noticiasIA/pipeline.ts
--     en cada noticia nueva; para las ya publicadas hay que correr
--     scripts/backfill-noticias-geo.mjs ANTES de desplegar el código que
--     empieza a resolver /noticia/[slug] por esta columna.
--   · puntos_clave  3 a 5 oraciones autocontenidas y citables (pensadas para
--     que un motor de IA pueda extraer una respuesta directa sin leer el
--     artículo completo). Mismo origen: pipeline para noticias nuevas,
--     scripts/backfill-noticias-geo.mjs para las existentes.
--
-- El índice único es parcial (`where slug is not null`) a propósito: permite
-- que las columnas se agreguen y el backfill se corra en filas ya existentes
-- sin que la migración misma falle por violar unicidad contra un default.
-- ============================================================================

alter table noticias add column if not exists slug text;
alter table noticias add column if not exists puntos_clave text[];

create unique index if not exists noticias_slug_key
  on noticias (slug)
  where slug is not null;
