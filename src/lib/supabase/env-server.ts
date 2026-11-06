import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON, SUPABASE_URL, supabaseConfigured } from "./env";

/** Cliente anónimo de solo lectura para el servidor (menú público). */
export function supabaseAnon() {
  if (!supabaseConfigured()) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false, autoRefreshToken: false } });
}
