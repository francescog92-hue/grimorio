/* Grimorio: funzionamento offline. La versione cambia a ogni aggiornamento dell'app. */
const CACHE = "grimorio-43049075a08f";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "fonts/fonts.css",
  "fonts/AlegreyaSans-italic-400-latin-ext.woff2",
  "fonts/AlegreyaSans-italic-400-latin.woff2",
  "fonts/AlegreyaSans-normal-400-latin-ext.woff2",
  "fonts/AlegreyaSans-normal-400-latin.woff2",
  "fonts/AlegreyaSans-normal-500-latin-ext.woff2",
  "fonts/AlegreyaSans-normal-500-latin.woff2",
  "fonts/AlegreyaSans-normal-700-latin-ext.woff2",
  "fonts/AlegreyaSans-normal-700-latin.woff2",
  "fonts/AlegreyaSans-normal-800-latin-ext.woff2",
  "fonts/AlegreyaSans-normal-800-latin.woff2",
  "fonts/IMFellEnglish-italic-400-latin.woff2",
  "fonts/IMFellEnglish-normal-400-latin.woff2",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];
self.addEventListener("install", e => {
  // cache:"reload" scavalca la cache del browser: la nuova versione non può ricevere file vecchi
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache:"reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.endsWith(".apk")) return;
  if (req.mode === "navigate"){
    // La pagina (che contiene tutta l'app): prima la rete, così con internet è sempre l'ultima versione;
    // senza rete, o se la rete non risponde entro 4 secondi, la copia salvata sul dispositivo.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 4000);
        const resp = await fetch(req.url, { cache:"no-cache", credentials:"same-origin", signal:ctrl.signal });
        clearTimeout(timer);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const copy = resp.clone();
        await cache.put("index.html", copy.clone());
        await cache.put("./", copy);
        return resp;
      } catch (err) {
        return (await cache.match("index.html")) || (await cache.match("./")) || Response.error();
      }
    })());
    return;
  }
  // Caratteri, icone e il resto: dalla copia sul dispositivo.
  e.respondWith(
    caches.match(req, { ignoreSearch:true }).then(hit => hit || fetch(req).then(resp => {
      if (resp.ok){ const copy = resp.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return resp;
    }).catch(() => Response.error()))
  );
});
