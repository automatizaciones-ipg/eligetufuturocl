-- ============================================================================
-- Carreras: restricción única real sobre codigo_carrera
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor del proyecto Supabase de eligetufuturo.cl.
--
-- Por qué: `carreras` solo tenía `id` (bigint) como primary key —
-- `codigo_carrera` no tenía ninguna restricción. src/datos_et/inyector.py
-- (el cargador de datos SIES) hacía un `insert()` plano sin upsert: si
-- alguien lo volvía a correr sobre la tabla ya cargada, nada en la base lo
-- impedía y duplicaba las ~9.900 filas enteras. Ya se corrigió el script
-- para chequear códigos existentes antes de insertar, pero esta restricción
-- es la protección de fondo: ninguna vía de inserción futura (otro script,
-- un insert manual) puede duplicar codigo_carrera, la base lo rechaza sola.
--
-- Antes de crear la restricción hay que limpiar las únicas filas que hoy la
-- violarían: 3 filas con codigo_carrera = literal texto de una nota al pie
-- del SIES ("FUENTE: Portal mifuturo.cl..."), basura de ingesta que nunca
-- se muestra ni enlaza en el sitio (ya las descarta esCodigoRutaValido() en
-- src/utils/formatters.ts en todos los puntos que arman rutas).
-- ============================================================================

delete from carreras
where codigo_carrera = 'FUENTE: Portal mifuturo.cl, de la Subsecretaría de Educación Superior';

alter table carreras
  add constraint carreras_codigo_carrera_key unique (codigo_carrera);
