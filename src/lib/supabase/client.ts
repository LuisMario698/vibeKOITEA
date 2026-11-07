"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON, SUPABASE_URL } from "./env";

/** Base local (Docker) vista desde otro dominio, por ejemplo una vista previa remota: el navegador no puede llegar a
    127.0.0.1, así que habla con la base por /sb en el mismo dominio del sitio (ver rewrites en next.config.ts). */
const LOCAL_DB = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(SUPABASE_URL);
const sameHost = () => /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname);

let client: ReturnType<typeof createBrowserClient> | null = null;
/** Cliente de Supabase para el navegador (sesión del personal en el panel). */
export function supabaseBrowser() {
  if (client) return client;
  if (LOCAL_DB && !sameHost()) {
    // misma cookie de sesión que espera el servidor (se nombra según el host de la base)
    const name = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
    client = createBrowserClient(`${window.location.origin}/sb`, SUPABASE_ANON, { cookieOptions: { name } });
  } else {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return client;
}
