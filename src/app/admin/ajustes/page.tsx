import { supabaseServer } from "@/lib/supabase/server";
import SettingsForm from "@/components/admin/SettingsForm";
import type { SettingsInput } from "../actions";
import { DEFAULT_SETTINGS } from "@/lib/menu/data";

export default async function SettingsPage() {
  const sb = await supabaseServer();
  const { data } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
  const r = (data ?? {}) as Record<string, unknown>;
  const initial: SettingsInput = {
    rate: Number(r.rate ?? 18), whatsapp: String(r.whatsapp ?? ""), instagram: String(r.instagram ?? "koitea.mx"), hours: String(r.hours ?? "11:00 – 21:30"),
    address: String(r.address ?? ""), city: String(r.city ?? ""), maps_url: String(r.maps_url ?? ""),
    tagline_es: String(r.tagline_es ?? ""), tagline_en: String(r.tagline_en ?? ""), origin_es: String(r.origin_es ?? ""), origin_en: String(r.origin_en ?? ""),
    accept_orders: r.accept_orders !== false, table_count: Number(r.table_count ?? 8), tips: Array.isArray(r.tips) ? (r.tips as number[]) : [0, 10, 15],
    promo_es: String(r.promo_es ?? ""), promo_en: String(r.promo_en ?? ""),
    schedule: Array.isArray(r.schedule) ? (r.schedule as SettingsInput["schedule"]) : DEFAULT_SETTINGS.schedule,
  };
  return <SettingsForm initial={initial} payments={{ stripe: !!process.env.STRIPE_SECRET_KEY, mp: !!process.env.MP_ACCESS_TOKEN, wa: !!process.env.WHATSAPP_TOKEN, live: !!process.env.SUPABASE_SERVICE_ROLE_KEY }} />;
}
