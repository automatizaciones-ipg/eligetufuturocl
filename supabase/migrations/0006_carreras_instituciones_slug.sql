-- ============================================================================
-- Carreras e instituciones: generar `slug` automáticamente al insertar
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor del proyecto Supabase de eligetufuturo.cl.
--
-- Por qué: /carrera/<codigo_carrera> (ej. I31S1C47J1V1) e
-- /institucion/<codigo_institucion> usan el código crudo del SIES como URL —
-- mismo problema que tenían las noticias con el UUID. La reingesta de datos
-- (scripts Python de src/datos_et/) inserta/actualiza filas directo en
-- Supabase, así que —igual que con noticias— el slug tiene que generarse en
-- la propia base de datos (trigger), no solo en el índice TypeScript
-- (src/services/carrerasIndex.ts), para que cualquier consulta (índice,
-- listadosSSR.ts, componentes client-side, /api/buscar) lo traiga gratis con
-- un simple `select`.
--
-- instituciones.slug = slugificar(nombre).
-- carreras.slug = slugificar(nombre_carrera)-slugificar(institución.nombre)
--                 -slugificar(sede)-slugificar(jornada), resolviendo el
--                 nombre de la institución con un select a instituciones.
-- Ambos con fallback numérico (-2, -3...) si colisionan, igual que el
-- trigger de noticias (0004/0005).
--
-- Qué NO decide este trigger: cuál código es el "elegido" cuando el mismo
-- programa+institución+sede+jornada tiene varias filas duplicadas por
-- basura de ingesta SIES — eso lo sigue resolviendo `canonico` en
-- carrerasIndex.ts (decide qué fila genera página, no qué slug tiene).
-- ============================================================================

create extension if not exists unaccent;

alter table instituciones add column if not exists slug text;
alter table carreras add column if not exists slug text;

-- Índices no-únicos primero: el backfill (0007) necesita buscar "¿ya existe
-- este candidato?" miles de veces; sin índice cada chequeo es un escaneo
-- secuencial. El índice único parcial (que sí exige no-colisión) se agrega
-- recién en 0007, después de poblar todas las filas existentes.
create index if not exists instituciones_slug_idx on instituciones (slug);
create index if not exists carreras_slug_idx on carreras (slug);

-- ─── instituciones ──────────────────────────────────────────────────────
create or replace function instituciones_generar_slug()
returns trigger as $$
declare
  base text;
  candidato text;
  intento int := 1;
begin
  if new.slug is not null and length(trim(new.slug)) > 0 then
    return new;
  end if;

  base := lower(unaccent(coalesce(new.nombre, '')));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  base := left(base, 80);

  -- Fila basura (nombre vacío/null): se deja sin slug en vez de forzar un
  -- candidato "" que colisionaría con cualquier otra fila igual de vacía.
  if base = '' then
    return new;
  end if;

  candidato := base;
  while exists (select 1 from instituciones where slug = candidato) loop
    intento := intento + 1;
    candidato := base || '-' || intento;
  end loop;

  new.slug := candidato;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_instituciones_generar_slug on instituciones;

create trigger trg_instituciones_generar_slug
  before insert on instituciones
  for each row
  execute function instituciones_generar_slug();

-- ─── carreras ───────────────────────────────────────────────────────────
create or replace function carreras_generar_slug()
returns trigger as $$
declare
  nombre_inst text;
  base text;
  candidato text;
  intento int := 1;
begin
  if new.slug is not null and length(trim(new.slug)) > 0 then
    return new;
  end if;

  select nombre into nombre_inst from instituciones
    where codigo_institucion = new.codigo_institucion
    limit 1;

  base := array_to_string(
    array_remove(array[
      left(regexp_replace(trim(both '-' from regexp_replace(lower(unaccent(coalesce(new.nombre_carrera, ''))), '[^a-z0-9]+', '-', 'g')), 60), 60),
      left(regexp_replace(trim(both '-' from regexp_replace(lower(unaccent(coalesce(nombre_inst, ''))), '[^a-z0-9]+', '-', 'g')), 40), 40),
      left(regexp_replace(trim(both '-' from regexp_replace(lower(unaccent(coalesce(new.sede, ''))), '[^a-z0-9]+', '-', 'g')), 30), 30),
      left(regexp_replace(trim(both '-' from regexp_replace(lower(unaccent(coalesce(new.jornada, ''))), '[^a-z0-9]+', '-', 'g')), 20), 20)
    ], ''),
    '-'
  );

  -- Fila basura (programa+institución+sede+jornada todos vacíos): se deja
  -- sin slug en vez de forzar un candidato "" que colisionaría con
  -- cualquier otra fila igual de vacía.
  if base = '' then
    return new;
  end if;

  candidato := base;
  while exists (select 1 from carreras where slug = candidato) loop
    intento := intento + 1;
    candidato := base || '-' || intento;
  end loop;

  new.slug := candidato;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_carreras_generar_slug on carreras;

create trigger trg_carreras_generar_slug
  before insert on carreras
  for each row
  execute function carreras_generar_slug();
