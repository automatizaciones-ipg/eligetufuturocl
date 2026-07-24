-- ============================================================================
-- Panel admin de tendencias de búsqueda — esquema + seed inicial
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor del proyecto Supabase de eligetufuturo.cl
-- (el mismo que usan PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en producción).
--
-- Qué hace:
--   1. Crea las tablas del panel de scraping (histórico completo de corridas).
--   2. Habilita RLS y da acceso de solo-lectura al rol `anon` para la corrida
--      publicada (así /tendencias puede leer directo sin pasar por una API).
--   3. Siembra UNA corrida "success" con el contenido que hoy vive en
--      src/data/tendencias_busqueda.json (para no perder el copy humano ya
--      escrito) y la marca como publicada.
--
-- Es seguro re-ejecutar: los INSERT de seed están guardados con
-- WHERE NOT EXISTS, así que si ya corriste este script una vez no duplica filas.
-- ============================================================================

-- ── 1. Tablas ────────────────────────────────────────────────────────────────

create table if not exists scraping_runs (
  id                   uuid primary key default gen_random_uuid(),
  started_at           timestamptz not null default now(),
  finished_at          timestamptz,
  status               text not null check (status in ('running','success','error')),
  error_message        text,
  requests_count       int,
  sugerencias_count    int,
  carreras_detectadas  int,
  trends_window        text,        -- ej. 'today 5-y', trazabilidad de qué ventana se usó
  created_at           timestamptz not null default now()
);

create table if not exists scraping_careers (
  id              bigint generated always as identity primary key,
  run_id          uuid not null references scraping_runs(id) on delete cascade,
  termino_raw     text not null,       -- núcleo normalizado (sin tildes), clave interna
  nombre_display  text not null,       -- nombre con tildes correctas — EDITABLE
  slug_busqueda   text not null,       -- usado en /herramientas/buscador?q=
  score           numeric not null,
  apariciones     int not null,
  demanda         int not null,        -- 0-100 normalizado
  momentum_pct    numeric,             -- null si no hay dato de Trends
  estado          text,                -- 'subiendo'|'bajando'|'estable'|'sin dato'
  interes_actual  int,
  oportunidad     int not null,
  ejemplos        jsonb not null default '[]',
  nivel           text not null,       -- 'Muy buscada'|'Buscada'|'Emergente' — EDITABLE
  orden           int not null,
  created_at      timestamptz not null default now()
);
create index if not exists scraping_careers_run_id_idx on scraping_careers(run_id);

create table if not exists scraping_intenciones (
  id               bigint generated always as identity primary key,
  run_id           uuid not null references scraping_runs(id) on delete cascade,
  modificador      text not null,        -- clave canónica interna (ya deduplicada)
  etiqueta_display text not null,        -- EDITABLE (ej. "Mejor pagada")
  conteo           int not null,
  nota             text,                 -- EDITABLE, copy humano
  orden            int not null
);
create index if not exists scraping_intenciones_run_id_idx on scraping_intenciones(run_id);

create table if not exists scraping_preguntas (
  id            bigint generated always as identity primary key,
  run_id        uuid not null references scraping_runs(id) on delete cascade,
  pregunta      text not null,
  pregunta_norm text not null,   -- sin tildes, cruza con el banco de respuestas
  conteo        int not null,
  respuesta     text,            -- EDITABLE, NULL hasta que el admin la redacte
  aprobada      boolean not null default false,
  orden         int not null
);
create index if not exists scraping_preguntas_run_id_idx on scraping_preguntas(run_id);

-- Banco de respuestas reutilizable entre corridas (evita redactar lo mismo cada vez)
create table if not exists scraping_respuestas_bank (
  pregunta_norm text primary key,
  respuesta     text not null,
  updated_at    timestamptz not null default now()
);

-- Singleton: qué corrida está "publicada" (visible en /tendencias)
create table if not exists tendencias_config (
  id                smallint primary key default 1 check (id = 1),
  published_run_id  uuid references scraping_runs(id),
  updated_at        timestamptz not null default now()
);
insert into tendencias_config (id) values (1) on conflict (id) do nothing;

-- ── 2. RLS: /tendencias lee directo con el cliente anon ─────────────────────

alter table scraping_runs enable row level security;
alter table scraping_careers enable row level security;
alter table scraping_intenciones enable row level security;
alter table scraping_preguntas enable row level security;
alter table tendencias_config enable row level security;
-- scraping_respuestas_bank NO se expone a anon (uso interno del admin).

drop policy if exists anon_read_config on tendencias_config;
create policy anon_read_config on tendencias_config for select to anon using (true);

drop policy if exists anon_read_published_run on scraping_runs;
create policy anon_read_published_run on scraping_runs for select to anon
  using (id = (select published_run_id from tendencias_config where id = 1));

drop policy if exists anon_read_published_careers on scraping_careers;
create policy anon_read_published_careers on scraping_careers for select to anon
  using (run_id = (select published_run_id from tendencias_config where id = 1));

drop policy if exists anon_read_published_intenciones on scraping_intenciones;
create policy anon_read_published_intenciones on scraping_intenciones for select to anon
  using (run_id = (select published_run_id from tendencias_config where id = 1));

drop policy if exists anon_read_published_preguntas on scraping_preguntas;
create policy anon_read_published_preguntas on scraping_preguntas for select to anon
  using (run_id = (select published_run_id from tendencias_config where id = 1)
         and respuesta is not null and aprobada = true);

-- RLS restringe FILAS, pero Postgres también exige GRANT a nivel de tabla.
grant usage on schema public to anon;
grant select on scraping_runs, scraping_careers, scraping_intenciones, scraping_preguntas, tendencias_config to anon;

-- El service_role (usado por getSupabaseServerClient()) bypassea RLS por defecto,
-- no necesita policies propias para leer/escribir todo (scraper + panel admin).

-- ── 3. Seed: corrida inicial desde tendencias_busqueda.json (copy humano) ───

-- UUID fijo para poder referenciarlo en los INSERT siguientes de forma legible.
-- (No se hardcodea como "ID generado" real del sistema; es un seed puntual.)

insert into scraping_runs (id, started_at, finished_at, status, requests_count, sugerencias_count, carreras_detectadas, trends_window)
select '00000000-0000-4000-8000-000000000001', '2026-06-29 00:00:00+00', '2026-06-29 00:00:00+00', 'success', null, null, 16, null
where not exists (select 1 from scraping_runs where id = '00000000-0000-4000-8000-000000000001');

insert into scraping_careers (run_id, termino_raw, nombre_display, slug_busqueda, score, apariciones, demanda, momentum_pct, estado, interes_actual, oportunidad, ejemplos, nivel, orden)
select * from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'psicologia',                 'Psicología',                  'psicología',                  100::numeric, 1, 100, null::numeric, 'sin dato', null::int, 100, '["estudiar psicología online","psicología mejor pagada"]'::jsonb, 'Muy buscada', 1),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'derecho',                    'Derecho',                     'derecho',                     89,  1, 89,  null, 'sin dato', null, 89,  '["estudiar derecho online","derecho en chile"]'::jsonb, 'Muy buscada', 2),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'veterinaria',                'Veterinaria',                 'veterinaria',                 82,  1, 82,  null, 'sin dato', null, 82,  '["estudiar veterinaria en chile","veterinaria online"]'::jsonb, 'Muy buscada', 3),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'enfermeria',                 'Enfermería',                  'enfermería',                  81,  1, 81,  null, 'sin dato', null, 81,  '["estudiar enfermería online","enfermería en chile"]'::jsonb, 'Muy buscada', 4),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'logistica',                  'Logística',                   'logística',                   81,  1, 81,  null, 'sin dato', null, 81,  '["técnico en logística","ingeniería en logística"]'::jsonb, 'Muy buscada', 5),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'kinesiologia',               'Kinesiología',                'kinesiología',                67,  1, 67,  null, 'sin dato', null, 67,  '["estudiar kinesiología","kinesiología en chile"]'::jsonb, 'Buscada', 6),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'gastronomia',                'Gastronomía',                 'gastronomía',                 60,  1, 60,  null, 'sin dato', null, 60,  '["estudiar gastronomía en chile","gastronomía online"]'::jsonb, 'Buscada', 7),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'historia',                   'Historia',                    'historia',                    57,  1, 57,  null, 'sin dato', null, 57,  '["estudiar historia","pedagogía en historia"]'::jsonb, 'Buscada', 8),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'odontologia',                'Odontología',                 'odontología',                 57,  1, 57,  null, 'sin dato', null, 57,  '["estudiar odontología","odontología en chile"]'::jsonb, 'Buscada', 9),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'contabilidad',               'Contabilidad',                'contabilidad',                57,  1, 57,  null, 'sin dato', null, 57,  '["estudiar contabilidad online","contador auditor"]'::jsonb, 'Buscada', 10),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'nutricion',                  'Nutrición',                   'nutrición',                   54,  1, 54,  null, 'sin dato', null, 54,  '["estudiar nutrición","nutrición online"]'::jsonb, 'Buscada', 11),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'marketing digital',          'Marketing Digital',           'marketing digital',           54,  1, 54,  null, 'sin dato', null, 54,  '["estudiar marketing digital","marketing digital online"]'::jsonb, 'Buscada', 12),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'recursos humanos',           'Recursos Humanos',            'recursos humanos',            49,  1, 49,  null, 'sin dato', null, 49,  '["técnico en recursos humanos","recursos humanos online"]'::jsonb, 'Buscada', 13),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'cosmetologia',               'Cosmetología',                'cosmetología',                46,  1, 46,  null, 'sin dato', null, 46,  '["estudiar cosmetología","técnico en cosmetología"]'::jsonb, 'Buscada', 14),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'administracion de empresas', 'Administración de Empresas',  'administración de empresas',  56,  1, 56,  null, 'sin dato', null, 56,  '["técnico en administración de empresas","administración online"]'::jsonb, 'Buscada', 15),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'medicina',                   'Medicina',                    'medicina',                    46,  1, 46,  null, 'sin dato', null, 46,  '["estudiar medicina","medicina en chile"]'::jsonb, 'Buscada', 16)
) as v(run_id, termino_raw, nombre_display, slug_busqueda, score, apariciones, demanda, momentum_pct, estado, interes_actual, oportunidad, ejemplos, nivel, orden)
where not exists (select 1 from scraping_careers where run_id = '00000000-0000-4000-8000-000000000001');

insert into scraping_intenciones (run_id, modificador, etiqueta_display, conteo, nota, orden)
select * from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'online',            'Online',            521, 'La mayoría busca estudiar a distancia.', 1),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'mejor pagada',      'Mejor pagada',      389, 'El sueldo es decisivo al elegir.', 2),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'gratis',            'Gratis / con beca', 86,  'Gratuidad y becas pesan mucho.', 3),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'a distancia',       'A distancia',       22,  'Flexibilidad horaria.', 4),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'vespertino',        'Vespertino',        14,  'Para quienes trabajan.', 5),
  ('00000000-0000-4000-8000-000000000001'::uuid, 'sin matematicas',   'Sin matemáticas',   8,   'Buscan carreras sin matemática.', 6)
) as v(run_id, modificador, etiqueta_display, conteo, nota, orden)
where not exists (select 1 from scraping_intenciones where run_id = '00000000-0000-4000-8000-000000000001');

insert into scraping_preguntas (run_id, pregunta, pregunta_norm, conteo, respuesta, aprobada, orden)
select * from (values
  ('00000000-0000-4000-8000-000000000001'::uuid,
   '¿Qué estudiar para trabajar en un banco?', 'que estudiar para trabajar en un banco', 1,
   'Carreras como Contador Auditor, Ingeniería Comercial y Administración tienen alta inserción en banca. Compáralas por empleabilidad e ingreso en nuestro buscador de carreras.', true, 1),
  ('00000000-0000-4000-8000-000000000001'::uuid,
   '¿Qué estudiar para trabajar desde casa?', 'que estudiar para trabajar desde casa', 1,
   'Áreas como Marketing Digital, Análisis de Datos, Diseño y Desarrollo de Software permiten trabajo remoto. Muchas se imparten en modalidad online en Chile.', true, 2),
  ('00000000-0000-4000-8000-000000000001'::uuid,
   '¿Dónde estudiar Gastronomía en Chile?', 'donde estudiar gastronomia en chile', 1,
   'Varios IP y CFT ofrecen Gastronomía a lo largo del país. Filtra por región, arancel y empleabilidad en el buscador de carreras de Elige Tu Futuro.', true, 3),
  ('00000000-0000-4000-8000-000000000001'::uuid,
   '¿Dónde estudiar Psicología en Chile?', 'donde estudiar psicologia en chile', 1,
   'Psicología se imparte en numerosas universidades en todas las regiones. Compara aranceles, acreditación y empleabilidad antes de decidir.', true, 4),
  ('00000000-0000-4000-8000-000000000001'::uuid,
   '¿Se puede estudiar online en Chile?', 'se puede estudiar online en chile', 1,
   'Sí. Muchas carreras técnicas y profesionales tienen modalidad online o a distancia. Es lo que más buscan los estudiantes en 2026.', true, 5),
  ('00000000-0000-4000-8000-000000000001'::uuid,
   '¿Cuáles son las carreras mejor pagadas en Chile?', 'cuales son las carreras mejor pagadas en chile', 1,
   'Suelen liderar las del área de la salud e ingenierías. Revisa el ingreso promedio al 4° año por carrera en nuestro buscador con datos del SIES/MINEDUC.', true, 6)
) as v(run_id, pregunta, pregunta_norm, conteo, respuesta, aprobada, orden)
where not exists (select 1 from scraping_preguntas where run_id = '00000000-0000-4000-8000-000000000001');

-- Alimenta el banco de respuestas para que corridas futuras del scraper real
-- autocompleten estas mismas preguntas (o equivalentes) sin redactar de nuevo.
insert into scraping_respuestas_bank (pregunta_norm, respuesta)
values
  ('que estudiar para trabajar en un banco', 'Carreras como Contador Auditor, Ingeniería Comercial y Administración tienen alta inserción en banca. Compáralas por empleabilidad e ingreso en nuestro buscador de carreras.'),
  ('que estudiar para trabajar desde casa', 'Áreas como Marketing Digital, Análisis de Datos, Diseño y Desarrollo de Software permiten trabajo remoto. Muchas se imparten en modalidad online en Chile.'),
  ('donde estudiar gastronomia en chile', 'Varios IP y CFT ofrecen Gastronomía a lo largo del país. Filtra por región, arancel y empleabilidad en el buscador de carreras de Elige Tu Futuro.'),
  ('donde estudiar psicologia en chile', 'Psicología se imparte en numerosas universidades en todas las regiones. Compara aranceles, acreditación y empleabilidad antes de decidir.'),
  ('se puede estudiar online en chile', 'Sí. Muchas carreras técnicas y profesionales tienen modalidad online o a distancia. Es lo que más buscan los estudiantes en 2026.'),
  ('cuales son las carreras mejor pagadas en chile', 'Suelen liderar las del área de la salud e ingenierías. Revisa el ingreso promedio al 4° año por carrera en nuestro buscador con datos del SIES/MINEDUC.')
on conflict (pregunta_norm) do update set respuesta = excluded.respuesta, updated_at = now();

-- Publica esta corrida (queda visible de inmediato en /tendencias una vez
-- migrada la página al esquema Supabase).
update tendencias_config set published_run_id = '00000000-0000-4000-8000-000000000001', updated_at = now() where id = 1;

-- ============================================================================
-- Verificación rápida (opcional, puedes correr esto después para confirmar):
--   select * from tendencias_config;
--   select count(*) from scraping_careers where run_id = (select published_run_id from tendencias_config where id=1);
-- ============================================================================
