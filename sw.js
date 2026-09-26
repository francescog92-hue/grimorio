/* Grimorio: funzionamento offline. La versione cambia a ogni aggiornamento dell'app. */
const CACHE = "grimorio-b9ff153c7dd0";
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
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch:true }).then(hit => hit || fetch(req).then(resp => {
      if (resp.ok){ const copy = resp.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return resp;
    }).catch(() => req.mode === "navigate" ? caches.match("index.html") : Response.error()))
  );
});
