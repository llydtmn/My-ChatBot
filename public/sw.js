// Llyd-Bot service worker.
// Caches the app shell so it opens fast and works offline. Chat, Supabase and the
// Worker are different origins, so they always go to the network (never cached).
// Bump VERSION if you ever need to force every phone to drop its old cache.
const VERSION = "v1";
const CACHE = `llyd-bot-${VERSION}`;
const PRECACHE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith("llyd-bot-") && key !== CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function saveCopy(request, response) {
  if (response && response.ok && response.type === "basic") {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase, Worker, fonts: network only
  if (url.pathname === "/sw.js") return;
  // Audio/video use partial (Range) responses, which can't be cached safely.
  if (request.headers.has("range") || request.destination === "audio" || request.destination === "video") return;

  // Page loads: network first, so a new deploy shows up right away; cache when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => saveCopy(new Request("/"), response))
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Vite's hashed files (/assets/...) never change, so cache first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => saveCopy(request, response)))
    );
    return;
  }

  // Everything else (icons, manifest): network first, cache as fallback.
  event.respondWith(
    fetch(request)
      .then((response) => saveCopy(request, response))
      .catch(() => caches.match(request))
  );
});
