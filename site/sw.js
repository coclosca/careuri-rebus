/* PlayLudiq · offline cache (service worker).
   Network first for EVERYTHING: online visitors always get the newest files
   (no "close the app to update"); the saved copy is used only offline.
   RULE: when you add, rename or delete a file in site/, update PRECACHE_FILES
   and raise CACHE_VERSION. tools/check-site.mjs fails if the list is wrong. */
const CACHE_VERSION = "playludiq-v42";
const OFFLINE_FALLBACK = "index.html";
const PRECACHE_FILES = [
  "./",
  "index.html", "jocuri.html", "scoala.html", "404.html",
  "confidentialitate.html", "cookies.html", "termeni.html",
  "integrame.html", "cuvantul.html", "criptograma.html", "roata.html", "potriviri.html",
  "quiz.html", "trivia.html", "fotbal.html",
  "piramida.html", "napoleon.html", "ceasul.html", "klondike.html",
  "septica.html", "popa.html", "macao.html",
  "manifest.json",
  "styles/tokens.css", "styles/base.css", "styles/components.css", "styles/legal.css", "styles/game.css",
  "shared/theme/theme.js", "shared/page-loader/page-loader.js", "shared/consent/consent.js", "shared/consent/consent.css", "shared/pwa/register-service-worker.js",
  "assets/icons/icons.svg", "assets/icons/icon-192.png", "assets/icons/icon-512.png",
  "assets/fonts/bricolage-grotesque-latin.woff2", "assets/fonts/bricolage-grotesque-latin-ext.woff2",
  "assets/fonts/source-sans-3-latin.woff2", "assets/fonts/source-sans-3-latin-ext.woff2",
  "features/home/home.js",
  "features/integrame/integrame.styles.css", "features/integrame/integrame.data.js", "features/integrame/integrame.game.js",
  "features/cuvantul/cuvantul.styles.css", "features/cuvantul/cuvantul.data.js", "features/cuvantul/cuvantul.game.js",
  "features/criptograma/criptograma.styles.css", "features/criptograma/criptograma.game.js",
  "features/roata/roata.styles.css", "features/roata/roata.game.js",
  "features/potriviri/potriviri.styles.css", "features/potriviri/potriviri.game.js",
  "features/quiz/quiz.styles.css", "features/quiz/quiz.data.js", "features/quiz/quiz.game.js",
  "features/trivia/trivia.styles.css", "features/trivia/trivia.data.js", "features/trivia/trivia.game.js",
  "features/fotbal/fotbal.styles.css", "features/fotbal/fotbal.data.js", "features/fotbal/fotbal.game.js",
  "features/piramida/piramida.styles.css", "features/piramida/piramida.game.js",
  "features/napoleon/napoleon.styles.css", "features/napoleon/napoleon.game.js",
  "features/ceasul/ceasul.styles.css", "features/ceasul/ceasul.game.js",
  "features/klondike/klondike.styles.css", "features/klondike/klondike.game.js",
  "features/septica/septica.styles.css", "features/septica/septica.game.js",
  "features/popa/popa.styles.css", "features/popa/popa.game.js",
  "features/macao/macao.styles.css", "features/macao/macao.game.js",
  "features/scoala/scoala.styles.css", "features/scoala/scoala.data.js", "features/scoala/scoala.game.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_VERSION).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await saveCopy(request, response);
    return response;
  } catch (networkError) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return caches.match(OFFLINE_FALLBACK);
    throw networkError;
  }
}

async function saveCopy(request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE_VERSION);
  await cache.put(request, response.clone());
}
