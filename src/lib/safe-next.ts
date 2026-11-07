/** Destino seguro tras iniciar sesión: solo rutas propias del panel (evita redirecciones a otros sitios como //evil.com). */
export function safeNext(next: string | null | undefined): string {
  if (!next || next.includes("\\") || /[\u0000-\u001f]/.test(next)) return "/admin";
  return /^\/admin(?:[/?#]|$)/.test(next) ? next : "/admin";
}
