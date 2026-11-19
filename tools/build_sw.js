/* Genera sw.js con la lista de archivos del juego para que funcione sin conexión.
   Uso: node tools/build_sw.js   (correr después de cambiar archivos o audios)
   La versión del caché es un hash del contenido: si algo cambia, el teléfono
   descarga la versión nueva y borra la vieja. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const INCLUDE = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets'];
// assets/splash (pantallas de arranque de iOS) y assets/screens (capturas del manifiesto) solo
// las pide el sistema al instalar: no hace falta guardarlas para jugar sin conexión.
const SKIP = /(^|\/)(OFL\.txt)$|^assets\/(splash|screens)\//;
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
// Safari pide el audio por partes (cabecera Range) y no reproduce una respuesta 200 completa:
// se arma la respuesta 206 con el pedazo pedido a partir del archivo guardado.
async function ranged(req, res) {
  const m = /bytes=(\\d*)-(\\d*)/.exec(req.headers.get('range') || '');
  if (!m || !res || res.status !== 200) return res;
  const buf = await res.arrayBuffer(), size = buf.byteLength;
  let start = m[1] === '' ? Math.max(0, size - (+m[2] || 0)) : +m[1];
  let end = m[1] !== '' && m[2] !== '' ? Math.min(+m[2], size - 1) : size - 1;
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
    'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const nav = e.request.mode === 'navigate';
  const hasRange = e.request.headers.has('range');
  e.respondWith(caches.match(nav ? './index.html' : e.request, { ignoreSearch: true }).then(hit => {
    if (hit) return hasRange ? ranged(e.request, hit) : hit;
    return fetch(e.request).then(res => {
      if (res.ok && res.status === 200 && !hasRange) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => nav ? caches.match('./index.html') : Response.error());
  }));
});
`;
fs.writeFileSync(path.join(root, 'sw.js'), tpl);
const bytes = files.reduce((a, f) => a + fs.statSync(path.join(root, f)).size, 0);
console.log(`sw.js: ${files.length} archivos, ${(bytes / 1048576).toFixed(1)} MB, caché ${version}`);
