"use client";
import { useState, useTransition } from "react";
import { saveSettings, type SettingsInput } from "@/app/admin/actions";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="grid content-start gap-1 text-sm"><span className="lb" style={{ marginBottom: 0 }}>{label}</span>{children}{hint && <span className="hint">{hint}</span>}</label>;
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const mins = (v: string) => { const [h, m] = v.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
type Day = { open: boolean; from: string; to: string };

/** Ajustes del negocio: tipo de cambio, WhatsApp, horario, dirección, mesas, propinas y promo del día. */
export default function SettingsForm({ initial, payments }: { initial: SettingsInput; payments: { stripe: boolean; mp: boolean; wa: boolean; live: boolean } }) {
  const [f, setF] = useState(initial); const [tips, setTips] = useState(initial.tips.join(", "));
  // los números se editan como texto (para poder escribir "17.5") y se convierten al guardar
  const [rate, setRate] = useState(String(initial.rate)); const [tables, setTables] = useState(String(initial.table_count));
  const [days, setDays] = useState<Day[]>(() => Array.from({ length: 7 }, (_, i) => { const d = initial.schedule[i]; return d ? { open: true, from: hhmm(d[0]), to: hhmm(d[1]) } : { open: false, from: "11:00", to: "21:30" }; }));
  const [pending, start] = useTransition(); const [msg, setMsg] = useState<string | null>(null);
  const set = <K extends keyof SettingsInput>(k: K, v: SettingsInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const setDay = (i: number, p: Partial<Day>) => setDays((ds) => ds.map((d, k) => (k === i ? { ...d, ...p } : d)));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = Number(rate.replace(",", "."));
    if (!(r >= 1 && r <= 100)) { setMsg("Revisa el tipo de cambio: escribe cuántos pesos vale un dólar (por ejemplo 17.5)."); return; }
    const schedule = days.map((d) => { if (!d.open) return null; const a = mins(d.from); let b = mins(d.to); if (b === 0) b = 1440; return b > a ? ([a, b] as [number, number]) : null; });
    start(async () => {
      const res = await saveSettings({ ...f, rate: r, table_count: Number(tables) || initial.table_count, schedule, tips: tips.split(/[,\s]+/).filter(Boolean).map(Number) });
      setMsg(res.ok ? "Guardado. El menú se actualiza en segundos." : `No se pudo guardar: ${res.error ?? ""}`);
    });
  };
  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-5">
      <h1 className="font-display text-2xl">Ajustes</h1>
      <section className="grid gap-3 rounded-[18px] border border-line bg-card p-4">
        <h2 className="font-display text-lg">Pedidos</h2>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={f.accept_orders} onChange={(e) => set("accept_orders", e.target.checked)} /> Recibir pedidos en línea (si lo apagas, el menú sigue visible pero sin carrito)</label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Pesos por dólar" hint="Para mostrar precios en USD a los turistas."><input className="inp" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))} /></Field>
          <Field label="Mesas"><input className="inp" inputMode="numeric" value={tables} onChange={(e) => setTables(e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label="Propinas (%)" hint="Separadas por coma; 0 = sin propina."><input className="inp" value={tips} onChange={(e) => setTips(e.target.value)} /></Field>
        </div>
        <Field label="WhatsApp de la barra" hint="Solo dígitos, con lada: 52 + 10 dígitos. Aquí llegan los pedidos del enlace de WhatsApp."><input className="inp" inputMode="numeric" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))} placeholder="526381234567" /></Field>
        <p className="text-xs text-muted">Pagos en línea: Stripe {payments.stripe ? "activo" : "no configurado"} · Mercado Pago {payments.mp ? "activo" : "no configurado"} · API de WhatsApp {payments.wa ? "activa" : "no configurada"} (se configuran con variables de entorno{payments.live ? "" : "; el pago en línea necesita la clave de servicio de Supabase"}).</p>
      </section>
      <section className="grid gap-3 rounded-[18px] border border-line bg-card p-4">
        <h2 className="font-display text-lg">Promo del día</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="En español" hint="Se muestra arriba del menú. Déjalo vacío para ocultarlo."><input className="inp" value={f.promo_es} onChange={(e) => set("promo_es", e.target.value)} placeholder="2×1 en fruit tea de 4 a 6" /></Field>
          <Field label="En inglés"><input className="inp" value={f.promo_en} onChange={(e) => set("promo_en", e.target.value)} placeholder="2 for 1 fruit tea, 4 to 6 pm" /></Field>
        </div>
      </section>
      <section className="grid gap-3 rounded-[18px] border border-line bg-card p-4">
        <h2 className="font-display text-lg">Negocio</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Horario (texto que se muestra)" hint="Por ejemplo: Todos los días 11:00 – 21:30"><input className="inp" value={f.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
          <Field label="Instagram"><input className="inp" value={f.instagram} onChange={(e) => set("instagram", e.target.value)} /></Field>
          <Field label="Dirección"><input className="inp" value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Ciudad"><input className="inp" value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
        </div>
        <fieldset className="grid gap-2">
          <legend className="lb">Horario por día (para “Abierto ahora” y Google)</legend>
          {days.map((d, i) => (
            <div key={i} className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex w-32 items-center gap-2"><input type="checkbox" checked={d.open} onChange={(e) => setDay(i, { open: e.target.checked })} /> {DAYS[i]}</label>
              {d.open ? (
                <>
                  <input className="inp" style={{ width: 124 }} type="time" aria-label={`${DAYS[i]}: abre`} value={d.from} onChange={(e) => setDay(i, { from: e.target.value })} />
                  <span className="text-muted">a</span>
                  <input className="inp" style={{ width: 124 }} type="time" aria-label={`${DAYS[i]}: cierra`} value={d.to} onChange={(e) => setDay(i, { to: e.target.value })} />
                </>
              ) : <span className="text-muted">Cerrado</span>}
            </div>
          ))}
        </fieldset>
        <Field label="Enlace de Google Maps"><input className="inp" value={f.maps_url} onChange={(e) => set("maps_url", e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Frase (español)"><input className="inp" value={f.tagline_es} onChange={(e) => set("tagline_es", e.target.value)} /></Field>
          <Field label="Frase (inglés)"><input className="inp" value={f.tagline_en} onChange={(e) => set("tagline_en", e.target.value)} /></Field>
          <Field label="Origen (español)"><input className="inp" value={f.origin_es} onChange={(e) => set("origin_es", e.target.value)} /></Field>
          <Field label="Origen (inglés)"><input className="inp" value={f.origin_en} onChange={(e) => set("origin_en", e.target.value)} /></Field>
        </div>
      </section>
      {msg && <p className="notice info">{msg}</p>}
      <button className="addb dark justify-center sm:max-w-xs" disabled={pending} type="submit"><span>{pending ? "Guardando…" : "Guardar cambios"}</span></button>
    </form>
  );
}
