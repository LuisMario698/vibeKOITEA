"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON, SUPABASE_URL } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;
/** Cliente de Supabase para el navegador (sesión del personal en el panel). */
export function supabaseBrowser() {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
  return client;
}
