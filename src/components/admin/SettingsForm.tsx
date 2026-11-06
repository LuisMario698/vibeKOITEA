"use client";
import { useState, useTransition } from "react";
import { saveSettings, type SettingsInput } from "@/app/admin/actions";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="grid gap-1 text-sm"><span className="lb" style={{ marginBottom: 0 }}>{label}</span>{children}{hint && <span className="hint">{hint}</span>}</label>;
}

/** Ajustes del negocio: tipo de cambio, WhatsApp, horario, dirección, mesas, propinas y promo del día. */
export default function SettingsForm({ initial, payments }: { initial: SettingsInput; payments: { stripe: boolean; mp: boolean; wa: boolean } }) {
  const [f, setF] = useState(initial); const [tips, setTips] = useState(initial.tips.join(", "));
  const [pending, start] = useTransition(); const [msg, setMsg] = useState<string | null>(null);
  const set = <K extends keyof SettingsInput>(k: K, v: SettingsInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const submit = (e: React.FormEvent) => { e.preventDefault(); start(async () => { const r = await saveSettings({ ...f, tips: tips.split(/[,\s]+/).filter(Boolean).map(Number) }); setMsg(r.ok ? "Guardado. El menú se actualiza en segundos." : `No se pudo guardar: ${r.error ?? ""}`); }); };
  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-5">
      <h1 className="font-display text-2xl">Ajustes</h1>
      <section className="grid gap-3 rounded-[18px] border border-line bg-card p-4">
        <h2 className="font-display text-lg">Pedidos</h2>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={f.accept_orders} onChange={(e) => set("accept_orders", e.target.checked)} /> Recibir pedidos en línea (si lo apagas, el menú sigue visible pero sin carrito)</label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Pesos por dólar" hint="Para mostrar precios en USD a los turistas."><input className="inp" inputMode="decimal" value={f.rate} onChange={(e) => set("rate", Number(e.target.value))} /></Field>
          <Field label="Mesas"><input className="inp" inputMode="numeric" value={f.table_count} onChange={(e) => set("table_count", Number(e.target.value))} /></Field>
          <Field label="Propinas (%)" hint="Separadas por coma; 0 = sin propina."><input className="inp" value={tips} onChange={(e) => setTips(e.target.value)} /></Field>
        </div>
        <Field label="WhatsApp de la barra" hint="Solo dígitos, con lada: 52 + 10 dígitos. Aquí llegan los pedidos del enlace de WhatsApp."><input className="inp" inputMode="numeric" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))} placeholder="526381234567" /></Field>
        <p className="text-xs text-muted">Pagos en línea: Stripe {payments.stripe ? "activo" : "no configurado"} · Mercado Pago {payments.mp ? "activo" : "no configurado"} · API de WhatsApp {payments.wa ? "activa" : "no configurada"} (se configuran con variables de entorno).</p>
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
          <Field label="Horario (texto)"><input className="inp" value={f.hours} onChange={(e) => set("hours", e.target.value)} /></Field>
          <Field label="Instagram"><input className="inp" value={f.instagram} onChange={(e) => set("instagram", e.target.value)} /></Field>
          <Field label="Dirección"><input className="inp" value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Ciudad"><input className="inp" value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
        </div>
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
