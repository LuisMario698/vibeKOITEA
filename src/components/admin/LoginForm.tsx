"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { safeNext } from "@/lib/safe-next";

const ERR: Record<string, string> = {
  link: "El enlace ya no es válido o ya se usó. Pide uno nuevo.",
  browser: "Abre el enlace en el mismo navegador donde lo pediste (o entra con tu contraseña).",
};

export default function LoginForm({ next, error }: { next: string; error: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(error ? ERR[error] ?? ERR.link : null);
  const dest = safeNext(next);
  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password: pass });
    setBusy(false);
    if (error) { setMsg("Correo o contraseña incorrectos."); return; }
    router.replace(dest); router.refresh();
  };
  const magic = async () => {
    if (!email) { setMsg("Escribe tu correo para mandarte el enlace."); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(dest)}` } });
    setBusy(false);
    setMsg(error ? "No se pudo mandar el enlace. Intenta de nuevo." : "Listo: revisa tu correo y abre el enlace para entrar.");
  };
  return (
    <form onSubmit={signIn} className="mt-5 grid gap-3">
      <div><label className="lb" htmlFor="email">Correo</label><input id="email" className="inp" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><label className="lb" htmlFor="pass">Contraseña</label><input id="pass" className="inp" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
      {msg && <p className="notice info">{msg}</p>}
      <button className="addb dark justify-center" disabled={busy} type="submit"><span>{busy ? "Entrando…" : "Entrar"}</span></button>
      <button className="ghost justify-center" type="button" disabled={busy} onClick={magic}>Mandarme un enlace por correo</button>
    </form>
  );
}
