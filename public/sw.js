/* Service worker de Koi Tea: guarda los archivos estáticos y el menú para abrir rápido con mala señal.
   - /_next/static: cache-first (nombres con hash, inmutables)
   - /img, /icons, /brand: stale-while-revalidate (nombres fijos: se refrescan en segundo plano)
   - la página del menú (/): network-first con respaldo en caché
   - nunca toca /api, /admin, /auth, /pedido ni /pantallas
   La versión llega en la URL del registro (/sw.js?v=<build>): cada despliegue estrena cachés y borra las anteriores. */
const VERSION = "koi-" + (new URL(self.location.href).searchParams.get("v") || "dev");
const STATIC = `${VERSION}-static`;
const ASSETS = `${VERSION}-assets`;
const PAGES = `${VERSION}-pages`;

self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(PAGES).then((c) => c.add("/").catch(() => undefined))); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION + "-")).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const p = url.pathname;
  if (p.startsWith("/api/") || p.startsWith("/admin") || p.startsWith("/auth/") || p.startsWith("/pedido/") || p.startsWith("/pantallas")) return;
  if (p.startsWith("/_next/static/")) {
    e.respondWith(caches.open(STATIC).then(async (c) => { const hit = await c.match(req); if (hit) return hit; const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }));
    return;
  }
  if (p.startsWith("/icons/") || p.startsWith("/img/") || p.startsWith("/brand/")) {
    e.respondWith(caches.open(ASSETS).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => undefined);
      if (hit) { e.waitUntil(net); return hit; }
      return (await net) || Response.error();
    }));
    return;
  }
  // solo la página del menú se guarda como respaldo sin conexión
  if (req.mode === "navigate" && p === "/") {
    e.respondWith((async () => {
      const c = await caches.open(PAGES);
      try { const res = await fetch(req); if (res.ok) c.put("/", res.clone()); return res; }
      catch { return (await c.match("/")) || Response.error(); }
    })());
  }
});
