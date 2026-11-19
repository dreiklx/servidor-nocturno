// Pruebas de la actualización v5: reproductor, instalación (PWA), modo sin conexión con Range,
// bienvenida móvil por plataforma y evento "Erika en directo".
// Uso (con node tools/serve.js corriendo): node tools/test_v5.js [url_base]
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = (process.argv[2] || 'http://localhost:8642/');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra).slice(0, 300))); if (!cond) fails++; };
const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  ioschrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
  tiktok: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 musical_ly_2023 BytedanceWebview'
};

(async () => {
  const port = 9600 + Math.floor(Math.random() * 200);
  const ch = spawn(CHROME, ['--headless=new', '--mute-audio', '--autoplay-policy=no-user-gesture-required', `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'ndv5-'))}`, 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ } if (!ws) await sleep(200); }
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {}; const errors = [];
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text); });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? 'EXC ' + JSON.stringify(r.result.exceptionDetails).slice(0, 200) : r.result.result.value; };
  const go = async (q, ms = 2000) => { await send('Page.navigate', { url: base + 'index.html' + (q ? '?' + q : '') }); await sleep(ms); };
  const device = async (mobile, w, h, ua) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
    await send('Emulation.setUserAgentOverride', { userAgent: ua || '' });
  };
  await send('Page.enable'); await send('Runtime.enable');

  console.log('PWA');
  await device(false, 1280, 720);
  await go('', 2500);
  ok('en computadora no aparece la bienvenida de teléfonos', await ev(`!document.getElementById('install')`) === true);
  const inst = await send('Page.getInstallabilityErrors');
  const errs = (inst.result && inst.result.installabilityErrors) || [];
  ok('Chrome considera el juego instalable (sin errores de instalabilidad)', errs.length === 0, errs);
  const man = await send('Page.getAppManifest');
  ok('manifiesto sin errores de lectura', man.result && (!man.result.errors || man.result.errors.length === 0), man.result && man.result.errors);
  const manJ = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.webmanifest'), 'utf8'));
  const missing = [...manJ.icons, ...(manJ.screenshots || [])].filter(i => !fs.existsSync(path.join(__dirname, '..', i.src)));
  ok('íconos y capturas del manifiesto existen', missing.length === 0, missing);
  ok('service worker activo', await ev('navigator.serviceWorker.ready.then(r => !!r.active)') === true);
  await go('', 2000); // segunda carga: ya controlada por el service worker
  ok('pantallas de arranque de iOS enlazadas', await ev(`document.querySelectorAll('link[rel="apple-touch-startup-image"]').length`) >= 20);
  await send('Network.enable'); await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const rng = await ev(`fetch('assets/voice/p1l1_1.mp3', { headers: { Range: 'bytes=100-1099' } }).then(r => r.status + ' ' + r.headers.get('Content-Range') + ' ' + r.headers.get('Content-Length'))`);
  ok('sin conexión: el audio responde por partes (206, como pide Safari)', /^206 bytes 100-1099\/\d+ 1000$/.test(rng), rng);
  const full = await ev(`fetch('assets/voice/p1l1_1.mp3').then(r => r.status)`);
  ok('sin conexión: el audio completo también responde', full === 200, full);
  const navOff = await ev(`fetch('index.html?x=1', { mode: 'same-origin' }).then(r => r.status)`);
  ok('sin conexión: la página carga desde la caché', navOff === 200, navOff);
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  console.log('Reproductor');
  await go('shot=p1&ui=video:p1l1:0', 2600);
  const r0 = await ev(`(() => { const q = s => document.querySelector(s); return { prog: !!q('.v-prog'), dur: q('.v-dur').textContent, chaps: document.querySelectorAll('.v-chap i').length, rates: [...q('.v-rate select').options].map(o => o.value).join(','), btns: ['.v-play','.v-back','.v-fwd','.v-mute','.v-fs','.v-volr','.v-cur'].every(s => q(s)) }; })()`);
  ok('barra de progreso con marcas de tramo y duración total', r0.prog && r0.chaps >= 2 && /^\d+:\d\d$/.test(r0.dur) && r0.dur !== '0:00', r0);
  ok('velocidades 0,5× 1× 1,25× 1,5× 2×', r0.rates === '0.5,1,1.25,1.5,2', r0.rates);
  ok('botones: reproducir, ±10 s, volumen, silencio, pantalla completa y tiempo', r0.btns, r0);
  const t = () => ev(`document.querySelector('.v-cur').textContent`);
  const toS = s => { const [m, x] = String(s).split(':'); return +m * 60 + +x; };
  await ev(`document.querySelector('.v-play').click()`); // pausa para medir sin que avance
  const a0 = toS(await t());
  await ev(`document.querySelector('.v-fwd').click()`); await sleep(200);
  const a1 = toS(await t());
  ok('+10 s adelanta 10 segundos', a1 - a0 >= 9 && a1 - a0 <= 11, [a0, a1]);
  await ev(`document.querySelector('.v-back').click()`); await sleep(200);
  const a2 = toS(await t());
  ok('−10 s retrocede 10 segundos', Math.abs(a2 - a0) <= 1, [a0, a2]);
  // arrastre real con el mouse sobre la barra
  const box = await ev(`(() => { const r = document.querySelector('.v-track').getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + box.w * 0.1, y: box.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x + box.w * 0.1, y: box.y, button: 'left', clickCount: 1 });
  for (let i = 1; i <= 6; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x + box.w * (0.1 + 0.6 * i / 6), y: box.y, button: 'left', buttons: 1 }); await sleep(40); }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + box.w * 0.7, y: box.y, button: 'left', clickCount: 1 }); await sleep(300);
  const total = toS(await ev(`document.querySelector('.v-dur').textContent`)), dragged = toS(await t());
  ok('arrastrar la barra lleva al punto elegido (≈70 %)', Math.abs(dragged - total * 0.7) <= 2, [dragged, total]);
  const sub = await ev(`document.querySelector('.v-line').textContent`);
  ok('al buscar, el subtítulo corresponde al tramo nuevo', sub.length > 10, sub);
  await ev(`(() => { const s = document.querySelector('.v-rate select'); s.value = '2'; s.dispatchEvent(new Event('change')); })()`);
  ok('velocidad 2× se guarda', await ev(`localStorage.getItem('nd_video_rate')`) === '2');
  await ev(`(() => { const r = document.querySelector('.v-volr'); r.value = '0.4'; r.dispatchEvent(new Event('input')); })()`);
  ok('volumen se guarda', await ev(`localStorage.getItem('nd_video_vol')`) === '0.4');
  await ev(`document.querySelector('.v-mute').click()`);
  ok('silenciar la narración', await ev(`localStorage.getItem('nd_video_muted')`) === '1' && /Activar/.test(await ev(`document.querySelector('.v-mute').getAttribute('aria-label')`)));
  await ev(`document.querySelector('.v-mute').click()`);
  await ev(`document.querySelector('.v-fs').click()`); await sleep(500);
  ok('pantalla completa (real o de respaldo)', await ev(`!!document.fullscreenElement || document.querySelector('.modal.video').classList.contains('pfs')`) === true);
  await ev(`document.querySelector('.v-fs').click()`); await sleep(300);
  ok('salir de pantalla completa', await ev(`!document.fullscreenElement && !document.querySelector('.modal.video').classList.contains('pfs')`) === true);
  await ev(`document.querySelector('.v-play').click()`); // reproducir
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 640, y: 60 }); await sleep(3400);
  ok('los controles se esconden solos al reproducir', await ev(`document.querySelector('.modal.video').classList.contains('idle')`) === true);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 640, y: 300 }); await sleep(150);
  ok('y vuelven al mover el mouse', await ev(`!document.querySelector('.modal.video').classList.contains('idle')`) === true);
  await go('shot=p1&ui=video:p1l1:0', 2400);
  await ev(`(() => { const s = document.querySelector('.v-rate select'); s.value = '1'; s.dispatchEvent(new Event('change')); })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 640, y: 300 });
  const end = await ev(`(() => { const r = document.querySelector('.v-track').getBoundingClientRect(); return { x: r.right - 1, y: r.top + r.height / 2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: end.x, y: end.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', clickCount: 1 });
  const quiz = await ev(`new Promise(r => { const t0 = Date.now(); (function w() { if (document.querySelector('.v-quiz:not([hidden])')) r(true); else if (Date.now() - t0 > 6000) r(false); else setTimeout(w, 100); })(); })`);
  ok('saltar al final no se salta la "Pausa rápida": la pregunta aparece', quiz === true);

  console.log('Bienvenida en teléfonos');
  for (const [k, kind] of [['android', /prompt|android-menu/], ['ios', /^ios$/], ['ioschrome', /ios-other/], ['tiktok', /inapp/]]) {
    await device(true, 412, 915, UA[k]);
    await go('', 2200);
    const got = await ev(`(document.getElementById('install') || {}).dataset ? document.getElementById('install').dataset.kind : 'NO'`);
    ok(`${k}: muestra la bienvenida adecuada (${got})`, kind.test(got), got);
  }
  await ev(`document.querySelector('.ins-skip').click()`); await sleep(400);
  ok('“Continuar en el navegador” cierra la bienvenida', await ev(`!document.getElementById('install')`) === true);
  await go('', 2200);
  ok('no se repite en la siguiente visita (vuelve a los 3 días)', await ev(`!document.getElementById('install')`) === true);

  console.log('Evento Erika en directo (simulado)');
  await go('shot=p1&ui=hud&live=1', 1500);
  const notif = await ev(`new Promise(r => { const t0 = Date.now(); (function w() { const n = document.querySelector('.live-notif'); if (n) r(n.textContent.replace(/\\s+/g, ' ')); else if (Date.now() - t0 > 9000) r(''); else setTimeout(w, 100); })(); })`);
  ok('aparece durante el juego libre', /ERIKA CEVICHES ESTÁ EN DIRECTO/.test(notif), notif);
  ok('la notificación dice que es simulado', /simulado/i.test(notif), notif);
  await ev(`document.querySelector('.ln-go').click()`); await sleep(1500);
  const lv = await ev(`(() => ({ open: !!document.querySelector('.modal.live-modal'), banner: document.querySelector('.lv-banner').textContent, busy: UI.busy() }))()`);
  ok('“Ver” abre la escena y pausa el juego', lv.open && lv.busy, lv);
  ok('la escena aclara que no es una transmisión real', /No es una transmisión real/.test(lv.banner), lv.banner);
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(400);
  ok('Esc vuelve al juego', await ev(`!document.querySelector('.modal.live-modal') && !UI.busy()`) === true);
  await go('shot=p1&ui=hud', 1500); await sleep(6000);
  ok('sin ?live=1 no aparece enseguida (es raro)', await ev(`!document.querySelector('.live-notif')`) === true);

  if (errors.length) console.log('Errores de la página:', [...new Set(errors)].join(' | ').slice(0, 800));
  ok('sin errores de JavaScript en la página', errors.length === 0, [...new Set(errors)]);
  console.log(fails ? `\n${fails} FALLA(S)` : '\nTODO OK');
  ws.close(); ch.kill(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
