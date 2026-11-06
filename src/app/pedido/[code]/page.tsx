import type { Metadata } from "next";
import { getMenu } from "@/lib/menu/repo";
import { getOrder, ordersLive, toPublic } from "@/lib/orders/repo";
import { isCode } from "@/lib/orders/code";
import OrderPage from "./OrderPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/pedido/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: `Pedido ${decodeURIComponent(code).toUpperCase()}`, robots: { index: false, follow: false } };
}

export default async function Page({ params, searchParams }: PageProps<"/pedido/[code]">) {
  const { code: raw } = await params;
  const sp = await searchParams;
  const code = decodeURIComponent(raw).toUpperCase();
  const menu = await getMenu();
  const live = ordersLive();
  const order = isCode(code) && live ? await getOrder(code) : null;
  return <OrderPage menu={menu} code={code} live={live} initial={order ? toPublic(order) : null} paid={sp.paid === "1"} />;
}
