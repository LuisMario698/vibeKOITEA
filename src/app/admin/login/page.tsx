import KoiMark from "@/components/brand/KoiMark";
import LoginForm from "@/components/admin/LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  return (
    <div className="grid min-h-dvh place-items-center p-5">
      <div className="w-full max-w-sm rounded-[24px] border border-line bg-card p-6 shadow-[0_20px_40px_-30px_rgba(40,20,10,.4)]">
        <KoiMark mode="done" className="mx-auto w-20" />
        <h1 className="font-display mt-2 text-center text-2xl">Panel de Koi Tea</h1>
        <p className="mt-1 text-center text-sm text-muted">Precios, agotados, promos y pedidos en vivo.</p>
        <LoginForm next={typeof sp.next === "string" ? sp.next : "/admin"} error={typeof sp.error === "string" ? sp.error : null} />
      </div>
    </div>
  );
}
