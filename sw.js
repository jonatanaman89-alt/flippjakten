// Flippjakten Väst – service worker (genererad av agent/build-public.mjs 2026-11-12T19:05:48.855Z)
// Sidan hämtas alltid från nätet först; lyckas det sparas en kopia. Utan nät visas den senast sparade kopian.
// Ikoner och manifest sparas också, men inget från andra sajter (typsnitt m.m.) cachas.
// Alla sökvägar räknas från mappen där sw.js ligger, så sajten fungerar både på en egen domän och i en undermapp
// (t.ex. GitHub Pages: namn.github.io/flippjakten/).
const CACHE = "flippjakten-v2";
const BASE = new URL("./", self.location).pathname;
const SHELL = ["", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"].map((p) => BASE + p);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // andra sajter: låt webbläsaren sköta det
  const isIndex = url.pathname === BASE || url.pathname === BASE + "index.html";
  if (req.mode === "navigate" || isIndex) {
    e.respondWith(fetch(req).then((res) => {
      // Spara bara själva sidan som BASE (inte t.ex. manifestet om någon öppnar det direkt i en flik)
      if (res.ok && isIndex) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(BASE, copy)); }
      return res;
    }).catch(() => caches.match(BASE).then((hit) => hit || Response.error())));
    return;
  }
  if (SHELL.includes(url.pathname)) {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copy)); }
      return res;
    }).catch(() => caches.match(url.pathname).then((hit) => hit || Response.error())));
  }
});
