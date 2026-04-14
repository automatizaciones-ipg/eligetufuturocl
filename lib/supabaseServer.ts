import { createClient } from "@supabase/supabase-js";

export const getSupabaseServerClient = () => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing PUBLIC_SUPABASE_URL.");
  }

  // Preferimos service role para evitar bloqueos por RLS en API server.
  // Fallback a anon para no romper entorno local si aun no configuraste la service key.
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (or PUBLIC_SUPABASE_ANON_KEY fallback).");
  }

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
