// Prueba la PWA en Chrome sin ventana: service worker, recarga sin conexión, guardado y recuperación.
// Uso: node tools/test_pwa.js [url_base]   (por defecto http://localhost:8642/)
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = process.argv[2] || 'http://localhost:8642/';
const port = 9500 + Math.floor(Math.random() * 100);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'ndpwa-'))}`, 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 50 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ } await sleep(200); }
  if (ws.readyState !== 1) await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {};
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result.result ? r.result.result.value : r.result; };
  const ok = (name, cond, extra = '') => console.log((cond ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? ' · ' + extra : ''));
  await send('Page.enable'); await send('Network.enable');
  await send('Page.navigate', { url: base + 'index.html' }); await sleep(2500);
  const man = await ev(`fetch('manifest.webmanifest').then(r => r.json()).then(m => m.name + ' | ' + m.display + ' | ' + m.icons.length + ' íconos')`);
  ok('manifiesto válido', /NYDER/.test(man), man);
  const sw = await ev(`navigator.serviceWorker.ready.then(r => !!r.active)`);
  ok('service worker activo', sw === true);
  await sleep(4000); // deja terminar el precache
  const cached = await ev(`caches.keys().then(ks => Promise.all(ks.map(k => caches.open(k).then(c => c.keys().then(x => k + ':' + x.length)))).then(a => a.join(',')))`);
  ok('archivos en caché', /:\d{2,}/.test(cached), cached);
  // guardado: escribe una partida como lo hace el juego y comprueba que el menú la ofrece al volver
  await ev(`localStorage.setItem('nightdare_bd2_v1', JSON.stringify({ phase: 2, read: { p1l1: true, p1l2: true }, stats: {}, talked: {}, defeated: {}, mg: {}, boss: {}, hearts: 4, maxHearts: 5, lemons: 2, unlocked: 3, chelaSeen: {}, chelaLemon: {}, playMs: 0, started: true }))`);
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await send('Page.reload', { ignoreCache: false }); await sleep(3000);
  const off = await ev(`document.title + ' | press=' + !document.getElementById('press').hidden + ' | scripts=' + (typeof window.VIDEO + typeof window.SCENES + typeof window.SAVEIO)`);
  ok('carga sin conexión', /Servidor Nocturno/.test(off) && /objectobjectobject/.test(off), off);
  const voice = await ev(`fetch('assets/voice/p1l1_1.mp3').then(r => r.status + ' ' + r.headers.get('content-type')).catch(e => 'error ' + e)`);
  ok('voz disponible sin conexión', /^200/.test(voice), voice);
  const saved = await ev(`(() => { const s = JSON.parse(localStorage.getItem('nightdare_bd2_v1') || 'null'); return s ? 'fase ' + (s.phase + 1) + ', ' + Object.keys(s.read).length + ' pizarras' : 'nada'; })()`);
  ok('partida recuperada tras recargar', /fase 3/.test(saved), saved);
  // el menú de título debe ofrecer "Continuar" habilitado
  await ev(`(document.getElementById('press').click(), true)`); await sleep(4500);
  const menu = await ev(`[...document.querySelectorAll('.menu-item')].map(b => (b.disabled ? '(x)' : '') + b.querySelector('.mi-l').textContent).join(' / ')`);
  ok('menú ofrece Continuar', /(^| \/ )Continuar/.test(menu), menu);
  const exp = await ev(`(() => { const r = SAVEIO.exportFile(); return r.ok + ' ' + r.msg; })()`);
  ok('exportar copia', /^true/.test(exp), exp);
  ws.close(); ch.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
