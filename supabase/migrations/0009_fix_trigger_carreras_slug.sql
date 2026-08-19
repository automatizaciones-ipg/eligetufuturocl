-- ============================================================================
-- Fix: el trigger carreras_generar_slug() tenía un error de sintaxis
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor del proyecto Supabase de eligetufuturo.cl.
--
-- Por qué: en 0006, la función carreras_generar_slug() envolvía cada
-- segmento en un `regexp_replace(trim(...), 60)` de dos argumentos, en vez
-- de `left(trim(...), 60)`. `regexp_replace` con dos argumentos no existe en
-- Postgres (mínimo son 3: string, patrón, reemplazo) — así que CUALQUIER
-- INSERT nuevo en `carreras` con slug null fallaba con
-- "function regexp_replace(text, integer) does not exist" y abortaba la
-- fila entera. El backfill (0007) usaba la sintaxis correcta —por eso las
-- ~9.898 filas existentes quedaron con su slug bien generado— pero el
-- trigger para carreras NUEVAS quedó roto desde 0006.
--
-- Este archivo reemplaza la función con la misma lógica que ya probó
-- funcionar en el backfill (0007), y termina con un SELECT que imprime la
-- función tal como quedó guardada — pega ese resultado de vuelta en el chat,
-- no solo "Success", para confirmar de verdad que se aplicó.
-- ============================================================================

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
      left(trim(both '-' from regexp_replace(lower(unaccent(coalesce(new.nombre_carrera, ''))), '[^a-z0-9]+', '-', 'g')), 60),
      left(trim(both '-' from regexp_replace(lower(unaccent(coalesce(nombre_inst, ''))), '[^a-z0-9]+', '-', 'g')), 40),
      left(trim(both '-' from regexp_replace(lower(unaccent(coalesce(new.sede, ''))), '[^a-z0-9]+', '-', 'g')), 30),
      left(trim(both '-' from regexp_replace(lower(unaccent(coalesce(new.jornada, ''))), '[^a-z0-9]+', '-', 'g')), 20)
    ], ''),
    '-'
  );

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

-- Verificación en el mismo Run: si esto NO muestra "left(trim(both" (sin
-- ningún "regexp_replace(trim(both" envolviendo), el fix no se aplicó.
select pg_get_functiondef(oid) as funcion_guardada_ahora_mismo
from pg_proc
where proname = 'carreras_generar_slug';
