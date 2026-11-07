import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

const OTP_TYPES: EmailOtpType[] = ["magiclink", "email", "signup", "invite", "recovery", "email_change"];

/** Entra al panel desde el enlace del correo.
    - token_hash (plantilla de correo recomendada en el README): funciona aunque el enlace se abra en otro navegador o teléfono.
    - code (flujo PKCE por defecto): solo funciona en el navegador donde se pidió el enlace. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const sb = await supabaseServer();
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    return NextResponse.redirect(new URL("/admin/login?error=link", url.origin));
  }
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    return NextResponse.redirect(new URL("/admin/login?error=browser", url.origin));
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", url.origin));
}
