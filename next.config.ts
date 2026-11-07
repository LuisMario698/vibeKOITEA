import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Identificador del despliegue: versiona las cachés del service worker.
const BUILD_ID = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? Date.now().toString(36)).slice(0, 12);

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  // Modelo clásico de render (estático por defecto, dinámico al usar datos de la petición).
  cacheComponents: false,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // Las animaciones de las pantallas de la barra viven en public/pantallas/index.html
    // Base local en Docker: puente /sb → Supabase local, para abrir el sitio desde otro dispositivo o una vista previa.
    const sb = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const localDb = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(sb) ? [{ source: "/sb/:path*", destination: `${sb.replace(/\/$/, "")}/:path*` }] : [];
    return {
      beforeFiles: localDb,
      afterFiles: [
        { source: "/pantallas", destination: "/pantallas/index.html" },
        { source: "/pantallas/", destination: "/pantallas/index.html" },
      ],
      fallback: [],
    };
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
