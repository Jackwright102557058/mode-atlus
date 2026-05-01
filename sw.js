const MODE_ATLAS_VERSION = '2.11.4';
const CACHE_NAME = 'mode-atlas-v' + MODE_ATLAS_VERSION;
const CORE_ASSETS = [
  './',
  './assets/android-chrome-512.png',
  './assets/app/mode-atlas-app-runtime.js',
  './assets/app/mode-atlas-early-loader.js',
  './assets/app/mode-atlas-head-bootstrap.js',
  './assets/app/mode-atlas-qol.js',
  './assets/app/mode-atlas-sounds.js',
  './assets/app/mode-atlas-stable-controls.js',
  './assets/app/mode-atlas-storage.js',
  './assets/apple-touch-icon.png',
  './assets/css/mode-atlas-default-page.css',
  './assets/css/mode-atlas-home-page.css',
  './assets/css/mode-atlas-kana-page.css',
  './assets/css/mode-atlas-page-shared.css',
  './assets/css/mode-atlas-qol.css',
  './assets/css/mode-atlas-reverse-input-control-fix.css',
  './assets/css/mode-atlas-reverse-page.css',
  './assets/css/mode-atlas-study-shared.css',
  './assets/css/mode-atlas-test-page.css',
  './assets/css/mode-atlas-wordbank-page.css',
  './assets/data/mode-atlas-kana-data.js',
  './assets/favicon-32.png',
  './assets/mode-atlas-icon.svg',
  './assets/pages/mode-atlas-default-page.js',
  './assets/pages/mode-atlas-home-page.js',
  './assets/pages/mode-atlas-kana-dashboard-fallback.js',
  './assets/pages/mode-atlas-kana-page.js',
  './assets/pages/mode-atlas-reverse-page.js',
  './assets/pages/mode-atlas-test-page.js',
  './assets/pages/mode-atlas-wordbank-page.js',
  './assets/results/mode-atlas-results-engine.js',
  './assets/results/mode-atlas-results-storage.js',
  './assets/results/mode-atlas-results-ui.js',
  './assets/social-preview.svg',
  './assets/trainer/mode-atlas-modifier-direct-click-repair.js',
  './assets/trainer/mode-atlas-modifier-keep-open.js',
  './assets/trainer/mode-atlas-reverse-input-control-fix.js',
  './assets/trainer/mode-atlas-session-controls.js',
  './assets/trainer/mode-atlas-trainer-core.js',
  './assets/trainer/mode-atlas-trainer-shared.js',
  './assets/ui/mode-atlas-profile-drawer-bindings.js',
  './assets/ui/mode-atlas-study-cloud-bindings.js',
  './assets/ui/mode-atlas-study-nav-hidden.js',
  './assets/ui/mode-atlas-verified-preset-confusable.js',
  './cloud-sync.js',
  './default.html',
  './firebase-config.js',
  './index.html',
  './kana.html',
  './reverse.html',
  './site.webmanifest',
  './test.html',
  './wordbank.html'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
    } catch (err) {
      // Network-first app: cache failures should never block installation.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME && /^mode-atlas-/i.test(k)).map(k => caches.delete(k)));
      await self.clients.claim();
    } catch (err) {}
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone()).catch(()=>{});
      return fresh;
    } catch (err) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
