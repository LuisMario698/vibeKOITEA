"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer, adminEmails } from "@/lib/supabase/server";
import { setOrderStatus } from "@/lib/orders/repo";
import type { OrderStatus } from "@/lib/menu/types";

/** Usuario con sesión y permiso de personal (tabla staff o ADMIN_EMAILS). */
export async function requireStaff() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return { sb, user: null, staff: false };
  const email = user.email.toLowerCase();
  if (adminEmails().includes(email)) return { sb, user, staff: true };
  const { data } = await sb.from("staff").select("email").eq("email", email).maybeSingle();
  return { sb, user, staff: !!data };
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/admin/login");
}

export async function changeOrderStatus(code: string, status: OrderStatus) {
  const { staff } = await requireStaff();
  if (!staff) return { ok: false as const, error: "forbidden" };
  const o = await setOrderStatus(code, status);
  return { ok: !!o };
}

type ProductPatch = Partial<{ price_mxn: number; featured: boolean; available: boolean; name_es: string; name_en: string; desc_es: string; desc_en: string }>;
export async function updateProduct(id: string, patch: ProductPatch) {
  const { sb, staff } = await requireStaff();
  if (!staff) return { ok: false as const, error: "forbidden" };
  const clean: ProductPatch = {};
  if (patch.price_mxn != null) clean.price_mxn = Math.max(0, Math.round(Number(patch.price_mxn) || 0));
  if (patch.featured != null) clean.featured = !!patch.featured;
  if (patch.available != null) clean.available = !!patch.available;
  for (const k of ["name_es", "name_en", "desc_es", "desc_en"] as const) if (typeof patch[k] === "string") clean[k] = patch[k]!.slice(0, 120);
  const { error } = await sb.from("products").update(clean).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/");
  return { ok: true as const };
}

export async function updateTopping(id: string, patch: Partial<{ available: boolean; price_mxn: number }>) {
  const { sb, staff } = await requireStaff();
  if (!staff) return { ok: false as const, error: "forbidden" };
  const clean: Partial<{ available: boolean; price_mxn: number }> = {};
  if (patch.available != null) clean.available = !!patch.available;
  if (patch.price_mxn != null) clean.price_mxn = Math.max(0, Math.round(Number(patch.price_mxn) || 0));
  const { error } = await sb.from("toppings").update(clean).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/");
  return { ok: true as const };
}

export async function updateMerch(id: string, patch: Partial<{ available: boolean; price_mxn: number }>) {
  const { sb, staff } = await requireStaff();
  if (!staff) return { ok: false as const, error: "forbidden" };
  const clean: Partial<{ available: boolean; price_mxn: number }> = {};
  if (patch.available != null) clean.available = !!patch.available;
  if (patch.price_mxn != null) clean.price_mxn = Math.max(0, Math.round(Number(patch.price_mxn) || 0));
  const { error } = await sb.from("merch").update(clean).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/");
  return { ok: true as const };
}

export interface SettingsInput {
  rate: number; whatsapp: string; instagram: string; hours: string; address: string; city: string; maps_url: string;
  tagline_es: string; tagline_en: string; origin_es: string; origin_en: string; accept_orders: boolean; table_count: number; tips: number[]; promo_es: string; promo_en: string;
}
export async function saveSettings(input: SettingsInput) {
  const { sb, staff } = await requireStaff();
  if (!staff) return { ok: false as const, error: "forbidden" };
  const row = {
    id: 1,
    rate: Math.max(1, Number(input.rate) || 18),
    whatsapp: String(input.whatsapp ?? "").replace(/\D/g, "").slice(0, 15),
    instagram: String(input.instagram ?? "").replace(/^@/, "").slice(0, 40),
    hours: String(input.hours ?? "").slice(0, 60),
    address: String(input.address ?? "").slice(0, 120),
    city: String(input.city ?? "").slice(0, 80),
    maps_url: String(input.maps_url ?? "").slice(0, 300),
    tagline_es: String(input.tagline_es ?? "").slice(0, 80), tagline_en: String(input.tagline_en ?? "").slice(0, 80),
    origin_es: String(input.origin_es ?? "").slice(0, 80), origin_en: String(input.origin_en ?? "").slice(0, 80),
    accept_orders: !!input.accept_orders,
    table_count: Math.max(1, Math.min(40, Number(input.table_count) || 8)),
    tips: Array.from(new Set((input.tips ?? []).map((n) => Math.max(0, Math.min(50, Math.round(Number(n) || 0)))))).sort((a, b) => a - b),
    promo_es: String(input.promo_es ?? "").slice(0, 140) || null, promo_en: String(input.promo_en ?? "").slice(0, 140) || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("settings").upsert(row);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/");
  return { ok: true as const };
}
