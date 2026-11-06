import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { fontClasses } from "./fonts";
import SWRegister from "@/components/SWRegister";
import { siteUrl } from "@/lib/supabase/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Koi Tea · Boba Shop · Puerto Peñasco", template: "%s · Koi Tea" },
  description: "Menú digital de Koi Tea Boba Shop en Puerto Peñasco (Rocky Point): milk tea, fruit tea y smoothies con ingredientes importados de Taiwán. Arma tu bebida y pide para llevar.",
  applicationName: "Koi Tea",
  keywords: ["boba", "bubble tea", "Puerto Peñasco", "Rocky Point", "milk tea", "Koi Tea"],
  openGraph: { type: "website", locale: "es_MX", alternateLocale: "en_US", siteName: "Koi Tea Boba Shop", title: "Koi Tea · Boba Shop · Puerto Peñasco", description: "Milk tea, fruit tea y smoothies con ingredientes de Taiwán. Arma tu bebida y pide para llevar." },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Koi Tea" },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FBF6EF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={fontClasses}>
      <body>
        {children}
        <SWRegister />
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
