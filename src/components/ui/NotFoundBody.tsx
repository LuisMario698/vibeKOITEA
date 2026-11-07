"use client";
import Link from "next/link";
import KoiMark from "@/components/brand/KoiMark";
import StoreHydrator from "@/components/StoreHydrator";
import { useT } from "@/lib/i18n/useT";

export default function NotFoundBody() {
  const { t } = useT();
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <StoreHydrator />
      <div className="grid justify-items-center gap-3">
        <KoiMark mode="done" className="w-32" />
        <h1 className="font-display text-2xl">{t("nf")}</h1>
        <p className="text-muted">{t("nfH")}</p>
        <Link href="/" className="addb dark mt-2 max-w-xs justify-center">{t("nfBtn")}</Link>
      </div>
    </div>
  );
}
