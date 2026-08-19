-- ============================================================================
-- Noticias: generar `slug` automáticamente al insertar (trigger)
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor del proyecto Supabase de eligetufuturo.cl,
-- DESPUÉS de 0003_noticias_slug_y_resumen.sql.
--
-- Por qué: las noticias se publican directo en la tabla `noticias` (Supabase
-- Studio / inserts manuales), sin pasar por src/lib/noticiasIA/pipeline.ts
-- (ese pipeline sí arma el slug en TypeScript, pero solo corre si se usa el
-- cron de IA — que hoy no se está usando). Un insert manual sin este trigger
-- dejaría `slug` en null, y la ficha /noticia/[slug] no tendría URL.
--
-- Qué hace: antes de cada INSERT en `noticias`, si la fila no trae un `slug`
-- ya escrito a mano, lo genera a partir de `titulo` (minúsculas, sin tildes/ñ,
-- separado por guiones — mismo criterio que slugificar() en
-- src/utils/formatters.ts) + un sufijo de 8 caracteres del `id` para
-- garantizar que nunca choque con otro. Si alguien SÍ escribe un slug al
-- publicar, el trigger lo respeta tal cual (no lo pisa).
-- ============================================================================

create extension if not exists unaccent;

create or replace function noticias_generar_slug()
returns trigger as $$
declare
  base text;
begin
  if new.slug is not null and length(trim(new.slug)) > 0 then
    return new;
  end if;

  base := lower(unaccent(coalesce(new.titulo, '')));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  base := left(base, 80);

  new.slug := base || '-' || left(new.id::text, 8);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_noticias_generar_slug on noticias;

create trigger trg_noticias_generar_slug
  before insert on noticias
  for each row
  execute function noticias_generar_slug();
