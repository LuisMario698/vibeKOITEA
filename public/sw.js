/* Service worker de Koi Tea: guarda los archivos estáticos y el menú para abrir rápido con mala señal.
   - /_next/static: cache-first (son inmutables)
   - navegación e imágenes: network-first con respaldo en caché
   - nunca toca /api ni /admin */
const VERSION = "koi-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;

self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(PAGES).then((c) => c.add("/").catch(() => undefined))); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/pedido/")) return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/img/") || url.pathname.startsWith("/brand/")) {
    e.respondWith(caches.open(STATIC).then(async (c) => { const hit = await c.match(req); if (hit) return hit; const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }));
    return;
  }
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith((async () => {
      const c = await caches.open(PAGES);
      try { const res = await fetch(req); if (res.ok) c.put("/", res.clone()); return res; }
      catch { return (await c.match("/")) || Response.error(); }
    })());
  }
});
