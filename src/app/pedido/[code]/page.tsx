import type { Metadata } from "next";
import { getMenu } from "@/lib/menu/repo";
import { getOrderForTracking, ordersLive, toPublic } from "@/lib/orders/repo";
import { isCode } from "@/lib/orders/code";
import OrderPage from "./OrderPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/pedido/[code]">): Promise<Metadata> {
  const { code } = await params;
  const c = code.toUpperCase();
  return { title: isCode(c) ? `Pedido ${c}` : "Pedido", robots: { index: false, follow: false } };
}

export default async function Page({ params, searchParams }: PageProps<"/pedido/[code]">) {
  const { code: raw } = await params;
  const sp = await searchParams;
  const code = raw.toUpperCase();
  const token = typeof sp.t === "string" ? sp.t : "";
  const menu = await getMenu();
  const live = ordersLive();
  const order = isCode(code) && live && token ? await getOrderForTracking(code, token) : null;
  return <OrderPage menu={menu} code={code} token={token} live={live} initial={order ? toPublic(order) : null} paidReturn={sp.paid === "1"} />;
}
