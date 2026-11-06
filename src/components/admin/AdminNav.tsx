"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [{ href: "/admin", label: "Pedidos" }, { href: "/admin/menu", label: "Menú" }, { href: "/admin/ajustes", label: "Ajustes" }];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="ml-2 flex gap-1 overflow-x-auto no-scrollbar" aria-label="Secciones">
      {NAV.map((n) => <Link key={n.href} href={n.href} className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap hover:bg-surface ${path === n.href ? "bg-ink text-white hover:bg-ink" : ""}`}>{n.label}</Link>)}
      <a href="/pantallas/" target="_blank" rel="noopener" className="rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-muted hover:bg-surface">Pantallas ↗</a>
    </nav>
  );
}
