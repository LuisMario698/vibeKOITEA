"use client";
import Link from "next/link";
import type { Menu } from "@/lib/menu/types";
import type { PublicOrder } from "@/lib/orders/types";
import { MenuProvider } from "@/components/menu/MenuContext";
import StoreHydrator from "@/components/StoreHydrator";
import OrderView from "@/components/cart/OrderView";
import Toast from "@/components/ui/Toast";
import { useCart } from "@/lib/store/cart";
import { useT } from "@/lib/i18n/useT";
import KoiMark from "@/components/brand/KoiMark";

function Inner({ code, live, initial, paid }: { code: string; live: boolean; initial: PublicOrder | null; paid: boolean }) {
  const { t } = useT();
  const active = useCart((s) => s.active);
  const local = active?.code === code ? active.local : null;
  const known = !!initial || !!local;
  return (
    <div className="mx-auto max-w-[520px] px-4 pb-16 pt-[max(20px,env(safe-area-inset-top))]">
      <header className="mb-4 flex items-center gap-3">
        <Link href="/" className="bk inline-grid h-10 w-10 place-items-center rounded-full bg-surface" aria-label={t("backMenu")}>←</Link>
        <KoiMark mode="done" className="w-9" />
        <div><b className="font-display text-lg">Koi Tea</b><p className="text-xs text-muted">{t("trackTitle")}</p></div>
      </header>
      {known ? (
        <div className="rounded-[22px] border border-line bg-paper p-4">
          <OrderView code={code} live={live} initial={initial} local={local} paidBanner={paid && !(initial?.paid)} />
        </div>
      ) : (
        <div className="emptyc"><KoiMark mode="done" /><b>{t("notFound")}</b><span>{t("notFoundH")}</span><Link className="more" style={{ maxWidth: 240 }} href="/">{t("backMenu")}</Link></div>
      )}
      <Toast />
    </div>
  );
}

export default function OrderPage({ menu, ...rest }: { menu: Menu; code: string; live: boolean; initial: PublicOrder | null; paid: boolean }) {
  return (
    <MenuProvider value={menu}>
      <StoreHydrator />
      <Inner {...rest} />
    </MenuProvider>
  );
}
