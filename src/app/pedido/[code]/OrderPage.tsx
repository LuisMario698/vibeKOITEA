"use client";
import Link from "next/link";
import type { Menu } from "@/lib/menu/types";
import type { PublicOrder } from "@/lib/orders/types";
import { MenuProvider } from "@/components/menu/MenuContext";
import StoreHydrator from "@/components/StoreHydrator";
import OrderView from "@/components/cart/OrderView";
import Toast from "@/components/ui/Toast";
import { useEffect } from "react";
import { useCart } from "@/lib/store/cart";
import { useT } from "@/lib/i18n/useT";
import KoiMark from "@/components/brand/KoiMark";

type Props = { code: string; token: string; live: boolean; initial: PublicOrder | null; paidReturn: boolean };

function Inner({ code, token, live, initial, paidReturn }: Props) {
  const { t } = useT();
  const active = useCart((s) => s.active);
  const mine = active?.code === code && (!token || active.token === token) ? active : null;
  const local = mine?.local ?? null;
  const tk = token || mine?.token || "";
  const known = !!initial || !!local;
  // De vuelta del pago: el pedido deja de estar pendiente y el carrito se vacía (ya se pagó lo que contenía).
  useEffect(() => {
    if (!paidReturn || !mine?.pending) return;
    const c = useCart.getState();
    c.setActive({ ...mine, pending: false }); c.clear();
  }, [paidReturn, mine]);
  return (
    <div className="mx-auto max-w-[520px] px-4 pb-16 pt-[max(20px,env(safe-area-inset-top))]">
      <header className="mb-4 flex items-center gap-3">
        <Link href="/" className="bk inline-grid h-10 w-10 place-items-center rounded-full bg-surface" aria-label={t("backMenu")}>←</Link>
        <KoiMark mode="done" className="w-9" />
        <div><b className="font-display text-lg">Koi Tea</b><p className="text-xs text-muted">{t("trackTitle")}</p></div>
      </header>
      {known ? (
        <div className="rounded-[22px] border border-line bg-paper p-4">
          <OrderView code={code} token={tk} live={live} initial={initial} local={local} paidReturn={paidReturn} />
        </div>
      ) : (
        <div className="emptyc"><KoiMark mode="done" /><b>{t("notFound")}</b><span>{t("notFoundH")}</span><Link className="more" style={{ maxWidth: 240 }} href="/">{t("backMenu")}</Link></div>
      )}
      <Toast />
    </div>
  );
}

export default function OrderPage({ menu, ...rest }: { menu: Menu } & Props) {
  return (
    <MenuProvider value={menu}>
      <StoreHydrator />
      <Inner {...rest} />
    </MenuProvider>
  );
}
