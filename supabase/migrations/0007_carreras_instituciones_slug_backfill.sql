-- ============================================================================
-- Carreras e instituciones: backfill de `slug` para las filas existentes
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor, DESPUÉS de 0006. A diferencia del
-- backfill de noticias (scripts/backfill-noticias-geo.mjs, ~25 filas vía
-- Node/REST), acá son ~9.900 + 121 filas — un UPDATE por fila vía API sería
-- lentísimo y gastaría cuota; esto corre entero dentro de Postgres.
--
-- Recorre en orden estable (por código) y usa la MISMA lógica que los
-- triggers de 0006 (slugificar + fallback numérico si colisiona). Filas
-- basura (nombre/institución/sede/jornada todos vacíos) quedan sin slug en
-- vez de forzar un candidato "" que colisiona con cualquier otra fila igual
-- de vacía —mismo criterio que ya usa esCodigoRutaValido() para códigos
-- basura del SIES. Solo toca filas con slug null o '' — es seguro volver a
-- correrlo si algo se interrumpe. Al final agrega los índices únicos
-- parciales (recién ahora que todo está poblado y sin colisiones).
-- ============================================================================

-- Por si una corrida anterior alcanzó a dejar algún slug en '' antes de
-- fallar en el índice único: se resetea a null para que el backfill de abajo
-- (que solo toca `where slug is null`) los vuelva a tomar.
update instituciones set slug = null where slug = '';
update carreras set slug = null where slug = '';

-- ─── instituciones ──────────────────────────────────────────────────────
do $$
declare
  fila record;
  base text;
  candidato text;
  intento int;
begin
  for fila in
    select codigo_institucion, nombre from instituciones
    where slug is null
    order by codigo_institucion
  loop
    base := left(
      trim(both '-' from regexp_replace(lower(unaccent(coalesce(fila.nombre, ''))), '[^a-z0-9]+', '-', 'g')),
      80
    );

    if base = '' then
      continue;
    end if;

    candidato := base;
    intento := 1;
    while exists (
      select 1 from instituciones
      where slug = candidato and codigo_institucion <> fila.codigo_institucion
    ) loop
      intento := intento + 1;
      candidato := base || '-' || intento;
    end loop;
    update instituciones set slug = candidato where codigo_institucion = fila.codigo_institucion;
  end loop;
end $$;

-- ─── carreras ───────────────────────────────────────────────────────────
do $$
declare
  fila record;
  nombre_inst text;
  base text;
  candidato text;
  intento int;
begin
  for fila in
    select codigo_carrera, codigo_institucion, nombre_carrera, sede, jornada from carreras
    where slug is null
    order by codigo_carrera
  loop
    select nombre into nombre_inst from instituciones
      where codigo_institucion = fila.codigo_institucion
      limit 1;

    base := array_to_string(
      array_remove(array[
        left(trim(both '-' from regexp_replace(lower(unaccent(coalesce(fila.nombre_carrera, ''))), '[^a-z0-9]+', '-', 'g')), 60),
        left(trim(both '-' from regexp_replace(lower(unaccent(coalesce(nombre_inst, ''))), '[^a-z0-9]+', '-', 'g')), 40),
        left(trim(both '-' from regexp_replace(lower(unaccent(coalesce(fila.sede, ''))), '[^a-z0-9]+', '-', 'g')), 30),
        left(trim(both '-' from regexp_replace(lower(unaccent(coalesce(fila.jornada, ''))), '[^a-z0-9]+', '-', 'g')), 20)
      ], ''),
      '-'
    );

    if base = '' then
      continue;
    end if;

    candidato := base;
    intento := 1;
    while exists (
      select 1 from carreras
      where slug = candidato and codigo_carrera <> fila.codigo_carrera
    ) loop
      intento := intento + 1;
      candidato := base || '-' || intento;
    end loop;

    update carreras set slug = candidato where codigo_carrera = fila.codigo_carrera;
  end loop;
end $$;

-- ─── índices únicos, ya con todo poblado ───────────────────────────────
create unique index if not exists instituciones_slug_key
  on instituciones (slug)
  where slug is not null;

create unique index if not exists carreras_slug_key
  on carreras (slug)
  where slug is not null;
