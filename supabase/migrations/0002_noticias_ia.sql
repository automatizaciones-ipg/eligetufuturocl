-- ============================================================================
-- Cron semanal de noticias/tips generadas por IA — tabla de auditoría
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor del proyecto Supabase de eligetufuturo.cl
-- (el mismo que usan PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en producción).
--
-- Qué hace:
--   Registra cada corrida del pipeline de src/lib/noticiasIA/pipeline.ts
--   (uno por semana, disparado por .github/workflows/cron-noticias.yml).
--   El UNIQUE en iso_week es la salvaguarda de idempotencia: si el workflow
--   se dispara dos veces la misma semana (reintento, doble click en
--   workflow_dispatch), la segunda corrida detecta el conflicto y aborta
--   antes de gastar llamadas a Anthropic/Unsplash o insertar una noticia
--   duplicada.
-- ============================================================================

create table if not exists noticias_ia_runs (
  id             uuid primary key default gen_random_uuid(),
  iso_week       text not null unique,   -- ej. '2026-W28' (America/Santiago)
  status         text not null check (status in ('running','success','error')),
  error_message  text,
  noticia_id     uuid references noticias(id),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- Solo el service_role (getSupabaseServerClient()) toca esta tabla, desde el
-- endpoint /api/cron/noticias. Se habilita RLS sin policies para que quede
-- cerrada a anon/authenticated por defecto (el service_role bypassea RLS).
alter table noticias_ia_runs enable row level security;
