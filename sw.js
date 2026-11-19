/* Generado por tools/build_sw.js — no editar a mano. */
const CACHE = 'servidor-nocturno-89593f2c79';
const FILES = ["./","index.html","manifest.webmanifest","css/style.css","css/v2.css","js/audio.js","js/content.js","js/game.js","js/logic.js","js/maps.js","js/minigames.js","js/save.js","js/scenes.js","js/sprites.js","js/touch.js","js/ui.js","js/video.js","assets/fonts/PixelifySans.ttf","assets/icons/apple-180.png","assets/icons/icon-192.png","assets/icons/icon-512.png","assets/icons/maskable-512.png","assets/img/nyder_games_splash.png","assets/img/nyder_logo.png","assets/sfx/button_error.wav","assets/sfx/button_hover.wav","assets/sfx/nyder_star_sparkle.wav"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('servidor-nocturno-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
