import { createClient } from '@supabase/supabase-js';

// Importamos las variables de entorno de Astro de forma segura
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Exportamos una única instancia para usarla en todo el proyecto
export const supabase = createClient(supabaseUrl, supabaseAnonKey);