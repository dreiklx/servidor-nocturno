// Capturas de pantalla con Chrome DevTools Protocol (sin dependencias).
// Uso: node tools/shots.js <carpeta_salida> "nombre|query" ...
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = process.argv[2];
const specs = process.argv.slice(3);
const base = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const port = 9333 + Math.floor(Math.random() * 300);
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const userDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ndshot-'));
  const ch = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json`); const list = await r.json(); const pg = list.find(t => t.type === 'page'); if (pg) { ws = new WebSocket(pg.webSocketDebuggerUrl); break; } } catch (e) {}
    await sleep(200);
  }
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {};
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  for (const spec of specs) {
    const i1 = spec.indexOf('|'), i2 = spec.indexOf('|', i1 + 1);
    const name = spec.slice(0, i1), q = i2 < 0 ? spec.slice(i1 + 1) : spec.slice(i1 + 1, i2), extra = i2 < 0 ? '' : spec.slice(i2 + 1);
    await send('Page.navigate', { url: base + '?' + q });
    await sleep(1800);
    if (extra) { const ex = await send('Runtime.evaluate', { expression: extra, awaitPromise: true }); if (ex.result.exceptionDetails) console.log('EXC', JSON.stringify(ex.result.exceptionDetails).slice(0, 300)); else if (ex.result.result.value) console.log('=>', ex.result.result.value); await sleep(900); }
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 45, fromSurface: true, clip: { x: 0, y: 0, width: 1280, height: 720, scale: 0.45 } });
    fs.writeFileSync(path.join(out, name + '.jpg'), Buffer.from(r.result.data, 'base64'));
    const ev = await send('Runtime.evaluate', { expression: 'location.search + " press=" + document.getElementById("press").hidden + " hud=" + document.getElementById("hud").hidden + " " + (window.__err||"")' });
    console.log(name, fs.statSync(path.join(out, name + '.jpg')).size, ev.result.result.value);
  }
  ws.close(); ch.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
