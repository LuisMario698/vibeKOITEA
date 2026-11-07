"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { changeOrderStatus } from "@/app/admin/actions";
import type { OrderItem, OrderStatus } from "@/lib/menu/types";
import { mxn } from "@/lib/money";

export interface AdminOrder {
  id: string; code: string; status: OrderStatus; type: "togo" | "table"; table_no: number | null; name: string; phone: string; cc: string; lang: string;
  items: OrderItem[]; subtotal: number; tip: number; total: number; pm: "express" | "card" | "mp" | "bar"; paid: boolean; created_at: string; updated_at: string;
}
const ST = ["Recibido", "Preparando", "Listo", "Entregado"];
const NEXT = ["Empezar", "Marcar listo", "Entregado"];
const PM: Record<AdminOrder["pm"], string> = { express: "pago exprés", card: "tarjeta", mp: "Mercado Pago", bar: "en barra" };

/** Pedido en línea que todavía no se paga: no se prepara hasta que el banco lo confirme. */
const awaiting = (o: Pick<AdminOrder, "pm" | "paid">) => o.pm !== "bar" && !o.paid;

function elapsed(iso: string, now: number | null) { if (now == null) return "–:––"; const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

/** Pedidos en vivo: cada pedido es una ficha con botones Empezar · Marcar listo · Entregado. Se actualiza solo. */
export default function OrdersBoard({ initial }: { initial: AdminOrder[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initial);
  // null hasta montar: así el HTML del servidor y el del navegador coinciden
  const [now, setNow] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [tab, setTab] = useState<"active" | "done">("active");
  const knownIds = useRef(new Set(initial.filter((o) => !awaiting(o)).map((o) => o.id)));
  const busy = useRef(new Set<string>());

  const refetch = useCallback(async () => {
    const since = new Date(); since.setHours(since.getHours() - 18);
    const { data } = await supabaseBrowser().from("orders").select("*").gte("created_at", since.toISOString()).order("created_at", { ascending: false }).limit(200);
    if (!data) return;
    const list = data as AdminOrder[];
    // suena cuando llega un pedido listo para preparar (en barra, o en línea ya pagado)
    const ready = list.filter((o) => !awaiting(o));
    const fresh = ready.filter((o) => !knownIds.current.has(o.id));
    ready.forEach((o) => knownIds.current.add(o.id));
    if (fresh.length && sound) chime();
    setOrders(list);
  }, [sound]);

  useEffect(() => {
    const ch = supabaseBrowser().channel("orders-board").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { void refetch(); }).subscribe();
    const poll = setInterval(() => void refetch(), 30000); // respaldo por si el tiempo real se desconecta
    const first = requestAnimationFrame(() => setNow(Date.now()));
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { supabaseBrowser().removeChannel(ch); clearInterval(poll); clearInterval(tick); cancelAnimationFrame(first); };
  }, [refetch]);

  const advance = async (o: AdminOrder, status: OrderStatus) => {
    if (busy.current.has(o.id)) return; busy.current.add(o.id);
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, status } : x)));
    const r = await changeOrderStatus(o.id, status);
    busy.current.delete(o.id);
    if (!r.ok) void refetch();
  };
  const active = orders.filter((o) => o.status < 3 && !awaiting(o)), done = orders.filter((o) => o.status >= 3);
  // los pagos abandonados de hace más de una hora ya no se muestran
  const waiting = orders.filter((o) => o.status === 0 && awaiting(o) && (now == null || now - new Date(o.created_at).getTime() < 3600e3));
  const list = tab === "active" ? active : done;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl">Pedidos</h1>
        <div className="seg dark" role="group" aria-label="Mostrar">
          <button aria-pressed={tab === "active"} onClick={() => setTab("active")}>En curso · {active.length}</button>
          <button aria-pressed={tab === "done"} onClick={() => setTab("done")}>Entregados y cancelados · {done.length}</button>
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Sonido al llegar un pedido</label>
      </div>
      {tab === "active" && waiting.length > 0 && (
        <details className="rounded-[14px] border border-dashed border-line px-4 py-2 text-sm text-muted">
          <summary className="cursor-pointer">Esperando pago en línea · {waiting.length} <span className="text-xs">(aparecen arriba cuando el pago se confirma; si no, se cancelan solos)</span></summary>
          <ul className="mt-2 grid gap-1">
            {waiting.map((o) => <li key={o.id} className="flex items-center justify-between gap-2"><span className="font-mono">{o.code} · {PM[o.pm]} · {mxn(o.total)}{o.name ? ` · ${o.name}` : ""}</span><span className="tabular">{elapsed(o.created_at, now)}</span></li>)}
          </ul>
        </details>
      )}
      {!list.length && <p className="rounded-[18px] border border-dashed border-line p-10 text-center text-sm text-muted">{tab === "active" ? "Cuando alguien pida desde el menú, el pedido aparece aquí al instante." : "Todavía no hay pedidos entregados hoy."}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((o) => (
          <article key={o.id} className={`grid gap-2 rounded-[18px] border-l-4 bg-card p-4 shadow-[0_1px_0_var(--line)] ${o.status === 0 ? "border-koi" : o.status === 1 ? "border-[#E9A23B]" : o.status === 2 ? "border-good" : "border-line"}`} style={{ animation: "upin .5s var(--ease)" }}>
            <div className="flex items-center justify-between gap-2">
              <b className="font-mono text-xl">{o.code}</b>
              <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-[.66rem] uppercase tracking-wider">{o.type === "table" ? `Mesa ${o.table_no}` : "Para llevar"}</span>
            </div>
            {o.name && <div className="text-sm font-medium">{o.name}{o.phone ? <span className="text-muted"> · +{o.cc} {o.phone}</span> : null}</div>}
            <ul className="grid gap-1 text-sm">
              {o.items.map((it, i) => <li key={i}>{it.qty}× {it.name.es}{it.detail.es && <span className="text-muted"> · {it.detail.es}</span>}</li>)}
            </ul>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className={o.paid ? "text-good" : "text-warn"}>{o.paid ? `✓ Pagado · ${PM[o.pm]}` : o.pm === "bar" ? `Por cobrar ${mxn(o.total)}` : `Pago en línea pendiente ${mxn(o.total)}`}{o.tip ? ` · propina ${mxn(o.tip)}` : ""}</span>
              <span className="text-muted tabular">{elapsed(o.created_at, now)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-[.7rem] uppercase tracking-wider text-muted">{o.status === 9 ? "Cancelado" : ST[o.status]}</span>
              <div className="flex gap-2">
                {o.status < 3 && <button className="rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface" onClick={() => { if (confirm(`¿Cancelar el pedido ${o.code}?`)) void advance(o, 9); }}>Cancelar</button>}
                {o.status < 3 && <button className="rounded-xl bg-ink px-3.5 py-2 text-sm font-bold text-white active:scale-95" onClick={() => void advance(o, (o.status + 1) as OrderStatus)}>{NEXT[o.status]}</button>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

let ctx: AudioContext | null = null;
function chime() {
  try {
    ctx = ctx ?? new AudioContext();
    const t = ctx.currentTime;
    [[880, 0], [1174.66, 0.12]].forEach(([f, d]) => { const o = ctx!.createOscillator(), g = ctx!.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.18, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5); o.connect(g).connect(ctx!.destination); o.start(t + d); o.stop(t + d + 0.55); });
  } catch { /* sin audio */ }
}
