/* Genera sw.js con la lista de archivos del juego para que funcione sin conexión.
   Uso: node tools/build_sw.js   (correr después de cambiar archivos o audios)
   La versión del caché es un hash del contenido: si algo cambia, el teléfono
   descarga la versión nueva y borra la vieja. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const INCLUDE = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets'];
const SKIP = /(^|\/)(OFL\.txt)$/;
const files = [];
function walk(rel) {
  const abs = path.join(root, rel);
  if (fs.statSync(abs).isDirectory()) fs.readdirSync(abs).sort().forEach(f => walk(rel + '/' + f));
  else if (!SKIP.test(rel)) files.push(rel);
}
INCLUDE.forEach(walk);
const h = crypto.createHash('sha1');
files.forEach(f => h.update(f).update(fs.readFileSync(path.join(root, f))));
const version = h.digest('hex').slice(0, 10);
const tpl = `/* Generado por tools/build_sw.js — no editar a mano. */
const CACHE = 'servidor-nocturno-${version}';
const FILES = ${JSON.stringify(['./'].concat(files), null, 0)};
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
`;
fs.writeFileSync(path.join(root, 'sw.js'), tpl);
const bytes = files.reduce((a, f) => a + fs.statSync(path.join(root, f)).size, 0);
console.log(`sw.js: ${files.length} archivos, ${(bytes / 1048576).toFixed(1)} MB, caché ${version}`);
