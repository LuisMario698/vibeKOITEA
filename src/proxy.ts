import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refresca la sesión de Supabase y protege /admin. */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let res = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  if (!url || !anon) return res; // sin Supabase, /admin muestra la guía de configuración
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (all) => {
        all.forEach(({ name, value }) => request.cookies.set(name, value));
        res = NextResponse.next({ request });
        all.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && path.startsWith("/admin") && path !== "/admin/login") {
    const to = new URL("/admin/login", request.url); to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }
  if (user && path === "/admin/login") return NextResponse.redirect(new URL("/admin", request.url));
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
