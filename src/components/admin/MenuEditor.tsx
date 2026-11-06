"use client";
import { useState, useTransition } from "react";
import { updateMerch, updateProduct, updateTopping } from "@/app/admin/actions";

export interface ProductRow { id: string; category_id: string; name_es: string; name_en: string | null; price_mxn: number; featured: boolean; available: boolean; sort: number }
export interface SimpleRow { id: string; name_es: string; price_mxn: number; available: boolean; sort: number }

function Price({ value, onSave }: { value: number; onSave: (v: number) => Promise<void> }) {
  const [v, setV] = useState(String(value)); const [state, setState] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const commit = async () => { const n = Math.round(Number(v)); if (!Number.isFinite(n) || n === value) { setV(String(value)); return; } setState("saving"); try { await onSave(n); setState("ok"); } catch { setState("err"); } setTimeout(() => setState("idle"), 1500); };
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm">$
      <input className="inp w-20 py-1.5 text-right font-mono" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value.replace(/[^\d]/g, ""))} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} aria-label="Precio en pesos" />
      <span className="w-4 text-xs">{state === "saving" ? "…" : state === "ok" ? "✓" : state === "err" ? "✕" : ""}</span>
    </span>
  );
}
function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition ${on ? "border-ink bg-ink text-white" : "border-line bg-paper text-muted"}`}>
      <span className={`h-2 w-2 rounded-full ${on ? "bg-koi" : "bg-line"}`} />{label}
    </button>
  );
}

/** Editor del menú: precio, recomendado y agotado por producto; disponibilidad de toppings y merch. Los cambios se ven en el menú en segundos. */
export default function MenuEditor({ categories, products, toppings, merch }: { categories: { id: string; name_es: string }[]; products: ProductRow[]; toppings: SimpleRow[]; merch: SimpleRow[] }) {
  const [prods, setProds] = useState(products); const [tops, setTops] = useState(toppings); const [mer, setMer] = useState(merch);
  const [, start] = useTransition(); const [err, setErr] = useState<string | null>(null);
  const run = (p: Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await p; if (!r.ok) setErr(r.error ?? "No se pudo guardar"); else setErr(null); });
  const patchP = (id: string, patch: Partial<Pick<ProductRow, "price_mxn" | "featured" | "available">>) => { setProds((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))); run(updateProduct(id, patch)); };
  const patchT = (id: string, patch: Partial<Pick<SimpleRow, "price_mxn" | "available">>) => { setTops((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))); run(updateTopping(id, patch)); };
  const patchM = (id: string, patch: Partial<Pick<SimpleRow, "price_mxn" | "available">>) => { setMer((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))); run(updateMerch(id, patch)); };
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-baseline gap-3"><h1 className="font-display text-2xl">Menú</h1><p className="text-sm text-muted">Edita el precio y toca Enter. Los cambios se ven en el menú y en las pantallas en menos de un minuto.</p></div>
      {err && <p className="notice">{err}</p>}
      {categories.map((c) => (
        <section key={c.id} className="rounded-[18px] border border-line bg-card">
          <h2 className="font-display border-b border-line px-4 py-3 text-lg">{c.name_es}</h2>
          <ul className="divide-y divide-line">
            {prods.filter((p) => p.category_id === c.id).map((p) => (
              <li key={p.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${p.available ? "" : "opacity-60"}`}>
                <span className="min-w-[180px] flex-1 font-medium">{p.name_es}{p.name_en && p.name_en !== p.name_es && <span className="block text-xs text-muted">{p.name_en}</span>}</span>
                <Price value={p.price_mxn} onSave={async (v) => { setProds((xs) => xs.map((x) => (x.id === p.id ? { ...x, price_mxn: v } : x))); const r = await updateProduct(p.id, { price_mxn: v }); if (!r.ok) throw new Error(r.error); }} />
                <Toggle on={p.featured} label="Recomendado" onChange={(v) => patchP(p.id, { featured: v })} />
                <Toggle on={p.available} label={p.available ? "Disponible" : "Agotado"} onChange={(v) => patchP(p.id, { available: v })} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="rounded-[18px] border border-line bg-card">
        <h2 className="font-display border-b border-line px-4 py-3 text-lg">Toppings</h2>
        <ul className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
          {tops.map((t) => (
            <li key={t.id} className={`flex items-center gap-3 px-4 py-2.5 ${t.available ? "" : "opacity-60"}`}>
              <span className="flex-1 text-sm font-medium">{t.name_es}</span>
              <Toggle on={t.available} label={t.available ? "Disponible" : "Agotado"} onChange={(v) => patchT(t.id, { available: v })} />
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-[18px] border border-line bg-card">
        <h2 className="font-display border-b border-line px-4 py-3 text-lg">Merch</h2>
        <ul className="divide-y divide-line">
          {mer.map((m) => (
            <li key={m.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${m.available ? "" : "opacity-60"}`}>
              <span className="min-w-[180px] flex-1 font-medium">{m.name_es}</span>
              <Price value={m.price_mxn} onSave={async (v) => { setMer((xs) => xs.map((x) => (x.id === m.id ? { ...x, price_mxn: v } : x))); const r = await updateMerch(m.id, { price_mxn: v }); if (!r.ok) throw new Error(r.error); }} />
              <Toggle on={m.available} label={m.available ? "Disponible" : "Agotado"} onChange={(v) => patchM(m.id, { available: v })} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
