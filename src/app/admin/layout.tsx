import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { supabaseConfigured } from "@/lib/supabase/env";
import { requireStaff, signOut } from "./actions";
import KoiMark from "@/components/brand/KoiMark";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function Setup() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="rounded-[22px] border border-line bg-card p-6">
        <KoiMark mode="done" className="w-16" />
        <h1 className="font-display mt-3 text-2xl">Panel de Koi Tea</h1>
        <p className="mt-2 text-sm text-muted">El panel necesita una base de datos de Supabase. Mientras no esté configurada, el menú usa los datos estáticos y los pedidos llegan solo por WhatsApp.</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>Crea un proyecto en Supabase y ejecuta <code className="font-mono text-xs">supabase/migrations/20261106000000_init.sql</code> y luego <code className="font-mono text-xs">supabase/seed.sql</code>.</li>
          <li>Agrega <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> y <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> a las variables de entorno.</li>
          <li>Da de alta el correo del personal en la tabla <code className="font-mono text-xs">staff</code> (o en <code className="font-mono text-xs">ADMIN_EMAILS</code>) y crea su usuario en Authentication.</li>
        </ol>
        <Link href="/" className="ghost mt-5">← Ver el menú</Link>
      </div>
    </div>
  );
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!supabaseConfigured()) return <Setup />;
  const { user, staff } = await requireStaff();
  if (!user) return <>{children}</>; // /admin/login
  if (!staff) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <KoiMark mode="done" className="mx-auto w-20" />
        <h1 className="font-display mt-3 text-xl">Sin acceso al panel</h1>
        <p className="mt-2 text-sm text-muted">La cuenta <b>{user.email}</b> no está en la lista del personal. Pide que la agreguen a la tabla <code className="font-mono text-xs">staff</code>.</p>
        <form action={signOut} className="mt-4"><button className="ghost">Cerrar sesión</button></form>
      </div>
    );
  }
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <Link href="/admin" className="flex items-center gap-2"><KoiMark mode="done" className="w-8" /><b className="font-display tracking-wider">KOI TEA</b><span className="hidden text-xs text-muted sm:inline">· panel</span></Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className="hidden text-sm text-muted hover:text-ink sm:inline" target="_blank">Ver menú ↗</Link>
            <form action={signOut}><button className="ghost" style={{ padding: "6px 12px", fontSize: ".8rem" }}>Salir</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
