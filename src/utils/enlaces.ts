// src/utils/enlaces.ts
// Punto único para construir las URLs de ficha de carrera/institución. Antes
// cada componente interpolaba `codigo_carrera`/`codigo_institucion` a mano
// (~17 lugares) — eso fue justo lo que dejó URLs con el código crudo del
// SIES (ej. /carrera/I31S1C47J1V1) en vez de un nombre legible. Ahora todo
// pasa por acá, sobre el `slug` que ya viene resuelto en la fila (columna
// real en Supabase, poblada por trigger — ver supabase/migrations/0006 y 0007).
export const enlaceCarrera = (slug: string): string => `/carrera/${slug}`;
export const enlaceInstitucion = (slug: string): string => `/institucion/${slug}`;
