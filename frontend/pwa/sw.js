/* Service worker de Cantine Vatel (généré au build : VERSION et PRECACHE sont injectés).
 *
 * - Coquille de l'application (HTML, JS, CSS, icônes) en cache : démarrage hors ligne.
 * - Navigation : réseau d'abord, coquille en cache si hors ligne.
 * - API, données personnelles, tickets : JAMAIS mis en cache (autre origine, ou /api, ou
 *   requête authentifiée). Seules les ressources statiques publiques sont conservées.
 * - Mise à jour : le nouveau service worker attend l'accord de l'utilisateur (SKIP_WAITING).
 */
const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const CACHE_COQUILLE = `vatel-coquille-${VERSION}`;
const CACHE_POLICES = "vatel-polices-v1";
const POLICES = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_COQUILLE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((k) => k.startsWith("vatel-coquille-") && k !== CACHE_COQUILLE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.headers.has("Authorization")) return;
  const url = new URL(req.url);

  // Polices Google : cache longue durée (ressources publiques et immuables).
  if (POLICES.includes(url.origin)) {
    event.respondWith(
      caches.open(CACHE_POLICES).then((c) =>
        c.match(req).then((r) => r || fetch(req).then((rep) => (rep.ok || rep.type === "opaque" ? (c.put(req, rep.clone()), rep) : rep))),
      ),
    );
    return;
  }
  // Toute autre origine (dont l'API sur le port 8000) : réseau uniquement, rien en cache.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api") || url.pathname.startsWith("/static")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html", { cacheName: CACHE_COQUILLE })),
    );
    return;
  }
  // Ressources du build (noms hachés) et icônes : cache d'abord.
  event.respondWith(
    caches.match(req, { cacheName: CACHE_COQUILLE }).then(
      (r) =>
        r ||
        fetch(req).then((rep) => {
          if (rep.ok && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/"))) {
            const copie = rep.clone();
            caches.open(CACHE_COQUILLE).then((c) => c.put(req, copie));
          }
          return rep;
        }),
    ),
  );
});
