"use client";
import { useEffect, useMemo, useState } from "react";
import type { Menu } from "@/lib/menu/types";
import { MenuProvider } from "./MenuContext";
import StoreHydrator from "@/components/StoreHydrator";
import Splash from "./Splash";
import PondHero from "./PondHero";
import Chips from "./Chips";
import { CategorySections, FeaturedRail, InfoFooter, MerchSection, ToppingsSection } from "./Sections";
import DrinkSheet from "./DrinkSheet";
import MerchSheet from "./MerchSheet";
import OrderFlow from "@/components/cart/OrderFlow";
import CartBar from "@/components/cart/CartBar";
import Toast from "@/components/ui/Toast";
import { useUI } from "@/lib/store/ui";
import { useCart } from "@/lib/store/cart";
import { useT } from "@/lib/i18n/useT";
import { L } from "@/lib/menu/helpers";
import { hasWebGL } from "@/lib/three/common";

function Promo({ menu }: { menu: Menu }) {
  const { lang } = useT();
  if (!menu.settings.promo) return null;
  return <div className="sec" style={{ paddingBottom: 0 }}><p className="notice info">✨ {L(menu.settings.promo, lang)}</p></div>;
}

function Shell({ menu }: { menu: Menu }) {
  const { t, lang } = useT();
  const { drink, merch, orderOpen, showToast } = useUI();
  const [ready, setReady] = useState(false);
  const overlay = !!drink || !!merch || orderOpen;
  const chips = useMemo(() => [...menu.categories.map((c) => ({ id: c.id, label: L(c.name, lang) })), ...(menu.merch.some((m) => m.available) ? [{ id: "merch", label: t("merch") }] : []), { id: "tops", label: t("tops") }], [menu, lang, t]);

  // precalienta el vaso 3D cuando el navegador está libre, para que la primera ficha abra al instante
  useEffect(() => {
    if (!ready || !hasWebGL()) return;
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    idle(() => { import("@/lib/three/cup").then((m) => m.getCup()).catch(() => undefined); }, { timeout: 4000 });
  }, [ready]);
  // regreso de un pago cancelado: el pedido pendiente se cancela y el carrito sigue intacto para reintentar
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.get("cancel")) return;
    const code = q.get("code");
    const a = useCart.getState().active;
    if (a && a.pending && a.code === code) {
      void fetch(`/api/orders/${a.code}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: a.token }), keepalive: true }).catch(() => undefined);
      useCart.getState().setActive(null);
    }
    showToast(t("payCancelled")); history.replaceState(null, "", "/");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // precios del carrito al día con el menú vigente (por si cambiaron desde la última visita)
  useEffect(() => {
    const go = () => useCart.getState().reprice(menu);
    if (useCart.persist.hasHydrated()) go();
    return useCart.persist.onFinishHydration(go);
  }, [menu]);

  return (
    <>
      <Splash onDone={() => setReady(true)} />
      <div className="app" inert={overlay}>
        <aside><PondHero paused={overlay} /></aside>
        <main>
          <Chips items={chips} label={t("cats")} />
          <Promo menu={menu} />
          <FeaturedRail />
          <CategorySections />
          <MerchSection />
          <ToppingsSection />
          <InfoFooter />
        </main>
      </div>
      <DrinkSheet />
      <MerchSheet />
      <OrderFlow />
      <CartBar />
      <Toast />
    </>
  );
}

export default function MenuApp({ menu }: { menu: Menu }) {
  return (
    <MenuProvider value={menu}>
      <StoreHydrator />
      <Shell menu={menu} />
    </MenuProvider>
  );
}
