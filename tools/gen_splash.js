// Genera las pantallas de arranque de iOS (apple-touch-startup-image) para iPhone, en vertical
// y horizontal, y las enlaza en index.html entre <!-- splash:start --> y <!-- splash:end -->.
// Android arma su pantalla de arranque solo, con el nombre, el ícono y background_color del manifiesto.
// Uso (con node tools/serve.js corriendo): node tools/gen_splash.js
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:8642/';
const root = path.join(__dirname, '..'), outDir = path.join(root, 'assets', 'splash');
// ancho y alto en puntos (vertical) y escala de pantalla de cada familia de iPhone
const DEVICES = [[440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2], [320, 568, 2]];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = (w, h) => `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
@font-face { font-family: P; src: url('${BASE}assets/fonts/PixelifySans.ttf'); }
html, body { margin: 0; width: 100%; height: 100%; background: #120c22; }
body { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ${Math.round(Math.min(w, h) * 0.05)}px; font-family: P, monospace; color: #fff; }
img { width: ${Math.round(Math.min(w, h) * 0.34)}px; height: auto; border-radius: 22%; image-rendering: pixelated; }
h1 { margin: 0; font-size: ${Math.round(Math.min(w, h) * 0.085)}px; line-height: 1.05; text-align: center; letter-spacing: .02em; }
h1 span { color: #ffd34d; }
p { margin: 0; font-size: ${Math.round(Math.min(w, h) * 0.035)}px; color: #a9aed6; letter-spacing: .3em; }
</style></head><body><img src="${BASE}assets/icons/icon-512.png"><h1>SERVIDOR<br><span>NOCTURNO</span></h1><p>NYDER GAMES</p></body></html>`;

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const port = 9800 + Math.floor(Math.random() * 100);
  const ch = spawn(CHROME, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'ndsplash-'))}`, 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ } if (!ws) await sleep(200); }
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {};
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  const links = [];
  for (const [pw, ph, dpr] of DEVICES) {
    for (const orient of ['portrait', 'landscape']) {
      const w = orient === 'portrait' ? pw : ph, h = orient === 'portrait' ? ph : pw;
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: true });
      // misma procedencia que el servidor para poder usar la fuente del juego
      await send('Page.navigate', { url: BASE + 'manifest.webmanifest' }); await sleep(300);
      await send('Runtime.evaluate', { expression: `document.open(); document.write(${JSON.stringify(page(w, h))}); document.close(); document.fonts.ready.then(() => new Promise(r => { const i = document.querySelector('img'); i.complete ? r() : i.onload = r; }))`, awaitPromise: true });
      await sleep(250);
      const r = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const name = `iphone-${w * dpr}x${h * dpr}.png`;
      fs.writeFileSync(path.join(outDir, name), Buffer.from(r.result.data, 'base64'));
      links.push(`<link rel="apple-touch-startup-image" media="screen and (device-width: ${pw}px) and (device-height: ${ph}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${orient})" href="assets/splash/${name}">`);
    }
  }
  ws.close(); ch.kill();
  const idxPath = path.join(root, 'index.html');
  let html = fs.readFileSync(idxPath, 'utf8');
  const block = `<!-- splash:start (generado por tools/gen_splash.js) -->\n${links.join('\n')}\n<!-- splash:end -->`;
  if (/<!-- splash:start[\s\S]*?<!-- splash:end -->/.test(html)) html = html.replace(/<!-- splash:start[\s\S]*?<!-- splash:end -->/, block);
  else html = html.replace('<link rel="stylesheet" href="css/style.css">', block + '\n<link rel="stylesheet" href="css/style.css">');
  fs.writeFileSync(idxPath, html);
  const bytes = fs.readdirSync(outDir).reduce((a, f) => a + fs.statSync(path.join(outDir, f)).size, 0);
  console.log(`${links.length} pantallas de arranque, ${(bytes / 1048576).toFixed(2)} MB en assets/splash`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
