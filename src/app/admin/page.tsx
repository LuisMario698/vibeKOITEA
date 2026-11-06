import { supabaseServer } from "@/lib/supabase/server";
import OrdersBoard, { type AdminOrder } from "@/components/admin/OrdersBoard";

export default async function OrdersPage() {
  const sb = await supabaseServer();
  const since = new Date(); since.setHours(since.getHours() - 18);
  const { data } = await sb.from("orders").select("*").gte("created_at", since.toISOString()).order("created_at", { ascending: false }).limit(200);
  return <OrdersBoard initial={(data ?? []) as AdminOrder[]} />;
}
