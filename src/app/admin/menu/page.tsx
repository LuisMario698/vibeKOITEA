import { supabaseServer } from "@/lib/supabase/server";
import MenuEditor, { type ProductRow, type SimpleRow } from "@/components/admin/MenuEditor";

export default async function MenuPage() {
  const sb = await supabaseServer();
  const [cats, prods, tops, merch] = await Promise.all([
    sb.from("categories").select("id,name_es").order("sort"),
    sb.from("products").select("id,category_id,name_es,name_en,price_mxn,featured,available,sort").order("sort"),
    sb.from("toppings").select("id,name_es,price_mxn,available,sort").order("sort"),
    sb.from("merch").select("id,name_es,price_mxn,available,sort").order("sort"),
  ]);
  return <MenuEditor categories={(cats.data ?? []) as { id: string; name_es: string }[]} products={(prods.data ?? []) as ProductRow[]} toppings={(tops.data ?? []) as SimpleRow[]} merch={(merch.data ?? []) as SimpleRow[]} />;
}
