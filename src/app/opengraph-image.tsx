import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const alt = "Koi Tea · Boba Shop · Puerto Peñasco";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  const [font, mark] = await Promise.all([
    readFile(path.join(process.cwd(), "node_modules/@fontsource/shippori-mincho/files/shippori-mincho-latin-800-normal.woff")).catch(() => null),
    readFile(path.join(process.cwd(), "public/icons/og-mark.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`).catch(() => null),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "linear-gradient(135deg,#FFFBF5 0%,#FBF6EF 50%,#F3E9DC 100%)", color: "#27211E", padding: 72, fontFamily: "Shippori" }}>
        {mark && <img src={mark} width={360} height={360} alt="" style={{ borderRadius: 40 }} />}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 64 }}>
          <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: 8, lineHeight: 1 }}>KOI TEA</div>
          <div style={{ fontSize: 34, marginTop: 20, color: "#6E625A", letterSpacing: 6 }}>BOBA SHOP · PUERTO PEÑASCO</div>
          <div style={{ display: "flex", marginTop: 36, gap: 14 }}>
            {["Milk Tea", "Fruit Tea", "Smoothies"].map((s) => <div key={s} style={{ fontSize: 26, padding: "10px 22px", borderRadius: 999, background: "#27211E", color: "#FBF6EF" }}>{s}</div>)}
          </div>
          <div style={{ fontSize: 26, marginTop: 36, color: "#D9442A" }}>Ingredientes importados de Taiwán · Pide para llevar</div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Shippori", data: font, weight: 800, style: "normal" }] : [] },
  );
}
