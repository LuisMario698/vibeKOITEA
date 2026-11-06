import localFont from "next/font/local";

// Tipografías autoalojadas (archivos de Fontsource en node_modules). Se sirven desde el mismo dominio,
// con preload y métricas de respaldo: ninguna petición sale a Google. (Las rutas deben ser literales.)
export const shippori = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource/shippori-mincho/files/shippori-mincho-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/shippori-mincho/files/shippori-mincho-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
});

export const zenKaku = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource/zen-kaku-gothic-new/files/zen-kaku-gothic-new-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/zen-kaku-gothic-new/files/zen-kaku-gothic-new-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/zen-kaku-gothic-new/files/zen-kaku-gothic-new-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});

export const plexMono = localFont({
  variable: "--font-mono",
  display: "swap",
  src: [
    { path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
});

export const dela = localFont({
  variable: "--font-poster",
  display: "swap",
  preload: false,
  src: [{ path: "../../node_modules/@fontsource/dela-gothic-one/files/dela-gothic-one-latin-400-normal.woff2", weight: "400", style: "normal" }],
});

export const fontClasses = `${shippori.variable} ${zenKaku.variable} ${plexMono.variable} ${dela.variable}`;
