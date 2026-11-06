import Link from "next/link";
import KoiMark from "@/components/brand/KoiMark";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="grid justify-items-center gap-3">
        <KoiMark mode="done" className="w-32" />
        <h1 className="font-display text-2xl">Esta página no existe</h1>
        <p className="text-muted">Pero el boba sí. Vuelve al menú.</p>
        <Link href="/" className="addb dark mt-2 max-w-xs justify-center">Ir al menú</Link>
      </div>
    </div>
  );
}
