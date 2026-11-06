import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Intercambia el código del enlace mágico por una sesión y entra al panel. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/admin", url.origin));
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", url.origin));
}
