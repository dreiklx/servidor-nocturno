// Arma screenshots/index.html: una galería para revisar todas las capturas (doble clic para abrirla).
// Uso: node tools/gallery.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'screenshots');
let notes = {}; try { JSON.parse(fs.readFileSync(path.join(dir, 'capturas_jefes.json'), 'utf8')).forEach(n => { notes[n.dir + '/' + n.file] = n.note; }); } catch (e) { /* sin notas */ }
for (const d of ['mau_cinematica', 'mau_cinematica_movil']) { try { JSON.parse(fs.readFileSync(path.join(dir, d, 'capturas.json'), 'utf8')).forEach(n => { notes[d + '/' + n.file] = n.note; }); } catch (e) { /* sin notas */ } }
const SECTIONS = [
  ['v7_correcciones', 'Correcciones v7: Nueva partida, menú de título y ayuda del evento', 'La confirmación de Nueva partida y el menú de título en 7 tamaños (teléfonos, tablet y escritorio), y la ayuda del evento de Erika.'],
  ['mau_cinematica', 'Mau · El último servidor (expansión cinematográfica)', 'Revelación, menú exclusivo, los tres actos, el epílogo con la recuperación del control, la revancha y una pista por radio. Escritorio 1280×720.'],
  ['mau_cinematica_movil', 'Mau en el teléfono', 'La misma pelea en un teléfono emulado (915×412), con toques reales.'],
  ['mau', 'Profe Mauricio · versión anterior de la pelea', 'Introducción, los tres actos con sus cambios, ataques, herramientas, derrota de Mau, pantalla final y también qué pasa si Kai pierde.'],
  ['boss_01_pirata_lectosucio', 'Jefe 1 · Pirata Lectosucio', 'Fase 1 · Muelle de las Transacciones'],
  ['boss_02_locomotora_interbloqueo', 'Jefe 2 · Locomotora Interbloqueo', 'Fase 2 · Estación de las Planificaciones'],
  ['boss_03_tormenta_corrupta', 'Jefe 3 · Tormenta Corrupta', 'Fase 3 · Bóveda de la Tormenta'],
  ['boss_04_el_gran_full_scan', 'Jefe 4 · El Gran Full Scan', 'Fase 4 · Mercado Nocturno'],
  ['boss_05_kraken_fragmentado', 'Jefe 5 · Kraken Fragmentado', 'Fase 5 · Archipiélago Distribuido'],
  ['video_player', 'Reproductor de video', 'Controles nuevos sobre el reproductor Canvas existente.'],
  ['mobile', 'Teléfono', 'Bienvenida para instalar (Android, iPhone, dentro de otra app), juego, video, combate y evento.'],
  ['live_erika', 'Evento: Erika Ceviches en directo (simulado)', 'Evento ficticio del juego; no se conecta a TikTok.']
];
const human = f => f.replace(/\.png$/, '').replace(/^\d+_/, '').replace(/_/g, ' ');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let body = '', total = 0;
for (const [d, title, sub] of SECTIONS) {
  const p = path.join(dir, d); if (!fs.existsSync(p)) continue;
  const files = fs.readdirSync(p).filter(f => /\.png$/.test(f)).sort();
  total += files.length;
  body += `<section id="${d}"><h2>${esc(title)} <small>${files.length} capturas</small></h2><p class="sub">${esc(sub)}</p><div class="grid">` +
    files.map(f => `<figure><a href="${d}/${f}" target="_blank"><img loading="lazy" src="${d}/${f}" alt="${esc(human(f))}"></a><figcaption><b>${esc(f.slice(0, 2))}</b> ${esc(human(f))}${notes[d + '/' + f] ? `<span>${esc(notes[d + '/' + f])}</span>` : ''}</figcaption></figure>`).join('') + '</div></section>';
}
const nav = SECTIONS.filter(([d]) => fs.existsSync(path.join(dir, d))).map(([d, t]) => `<a href="#${d}">${esc(t.split(' · ')[0])}</a>`).join('');
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Capturas · Servidor Nocturno</title><style>
:root { color-scheme: dark; } body { margin: 0; background: #0b0c18; color: #eef0ff; font: 15px/1.45 system-ui, sans-serif; }
header { position: sticky; top: 0; z-index: 2; background: #0b0c18f0; border-bottom: 1px solid #3b3f6e; padding: 12px 16px; }
h1 { margin: 0 0 6px; font-size: 20px; } h1 span { color: #ffd34d; } nav { display: flex; flex-wrap: wrap; gap: 6px; }
nav a { color: #eef0ff; text-decoration: none; border: 1px solid #3b3f6e; border-radius: 99px; padding: 3px 10px; font-size: 13px; } nav a:hover { border-color: #ffd34d; }
section { padding: 8px 16px 20px; } h2 { margin: 18px 0 2px; font-size: 18px; } h2 small { color: #a9aed6; font-weight: 400; font-size: 13px; } .sub { margin: 0 0 10px; color: #a9aed6; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
figure { margin: 0; background: #1b1e33; border: 1px solid #3b3f6e; border-radius: 10px; overflow: hidden; }
img { display: block; width: 100%; height: auto; background: #000; } figcaption { padding: 8px 10px; font-size: 13px; }
figcaption b { color: #ffd34d; margin-right: 4px; } figcaption span { display: block; color: #a9aed6; margin-top: 2px; }
</style></head><body><header><h1>Servidor Nocturno · <span>capturas reales del juego</span> (${total})</h1><nav>${nav}</nav></header>${body}
<p style="padding:0 16px 24px;color:#a9aed6">Generadas con tools/boss_shots.js y tools/capture.js jugando el juego en Chrome sin ventana. Ninguna imagen está retocada.</p></body></html>`);
console.log(`screenshots/index.html · ${total} capturas`);
