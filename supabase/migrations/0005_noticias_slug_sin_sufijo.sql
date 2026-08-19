-- ============================================================================
-- Noticias: slug limpio (sin el sufijo hex del id) + limpieza de los que ya
-- se generaron con sufijo
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor del proyecto Supabase de eligetufuturo.cl,
-- DESPUÉS de 0004_noticias_slug_autogenerado.sql.
--
-- Por qué: el trigger de 0004 armaba el slug como
-- "titulo-en-palabras-a8e5b2c7" (8 caracteres del id) para garantizar que
-- nunca chocara con otro. Eso deja URLs con un "número" al final que no
-- aporta nada legible. Reemplaza esa función por una que solo agrega un
-- sufijo (-2, -3...) SI de verdad hay una colisión de título — igual que
-- WordPress/la mayoría de los CMS — y deja el slug limpio en el caso normal.
--
-- También reescribe, una sola vez, las noticias que ya quedaron publicadas
-- con el sufijo hex (las que pasaron por 0004 o por el backfill), para que
-- las URLs recién publicadas hoy también queden limpias. No toca slugs
-- escritos a mano (los que no terminan en el patrón "-xxxxxxxx" hex).
-- ============================================================================

create or replace function noticias_generar_slug()
returns trigger as $$
declare
  base text;
  candidato text;
  intento int := 1;
begin
  if new.slug is not null and length(trim(new.slug)) > 0 then
    return new;
  end if;

  base := lower(unaccent(coalesce(new.titulo, '')));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  base := left(base, 80);

  candidato := base;
  while exists (select 1 from noticias where slug = candidato) loop
    intento := intento + 1;
    candidato := base || '-' || intento;
  end loop;

  new.slug := candidato;
  return new;
end;
$$ language plpgsql;

-- Limpieza única de las filas ya publicadas con el sufijo hex de 0004/el
-- backfill. Recorre en orden estable (created_at) para que, si dos títulos
-- quedan idénticos al pelarles el sufijo, el segundo reciba "-2" en vez de
-- chocar.
do $$
declare
  fila record;
  base text;
  candidato text;
  intento int;
begin
  for fila in
    select id, slug from noticias
    where slug ~ '-[0-9a-f]{8}$'
    order by created_at
  loop
    base := regexp_replace(fila.slug, '-[0-9a-f]{8}$', '');
    candidato := base;
    intento := 1;
    while exists (select 1 from noticias where slug = candidato and id <> fila.id) loop
      intento := intento + 1;
      candidato := base || '-' || intento;
    end loop;
    update noticias set slug = candidato where id = fila.id;
  end loop;
end $$;
