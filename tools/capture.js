// Capturas por guion con Chrome DevTools Protocol (sin dependencias, Node 22+).
// Uso: node tools/capture.js plan.json
// El plan es { base, out, viewport: { w, h, mobile, dpr }, ua, preview, steps: [...] } y cada paso es uno de:
//   { nav: "shot=p1&ui=boss" }          abre index.html?<query> (o una URL completa si empieza con http)
//   { wait: 800 }                       espera en milisegundos
//   { until: "expr js", timeout: 8000 } espera a que la expresión sea verdadera
//   { eval: "código js" }               evalúa en la página (admite promesas)
//   { key: "Enter" }                    tecla real (Input.dispatchKeyEvent)
//   { click: "selector" }               clic real del mouse en el centro del elemento
//   { tap: "selector" }                 toque real (eventos táctiles) en el centro del elemento
//   { drag: "selector", from: 0.2, to: 0.7 }  arrastra sobre el elemento (fracción del ancho)
//   { shot: "carpeta/nombre" }          guarda <out>/carpeta/nombre.png (y una vista previa chica si preview)
//   { log: "expr js" }                  imprime el valor
// Las capturas salen del juego en ejecución: no se retocan.
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const plan = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = plan.base || 'http://localhost:8642/index.html';
const out = path.resolve(plan.out || 'screenshots');
const vp = Object.assign({ w: 1280, h: 720, mobile: false, dpr: 1 }, plan.viewport || {});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 9400 + Math.floor(Math.random() * 400);

(async () => {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ndcap-'));
  const args = ['--headless=new', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, `--window-size=${vp.w},${vp.h}`, 'about:blank'];
  const ch = spawn(CHROME, args, { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 60 && !ws; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = list.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ }
    if (!ws) await sleep(200);
  }
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {}; const errors = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description).join(' '));
  });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, mobile: !!vp.mobile, screenOrientation: vp.w > vp.h ? { type: 'landscapePrimary', angle: 90 } : { type: 'portraitPrimary', angle: 0 } });
  if (vp.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (plan.ua) await send('Emulation.setUserAgentOverride', { userAgent: plan.ua, platform: plan.platform || '' });
  const center = async sel => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, w: r.width }; })()`);
  let n = 0;
  for (const s of plan.steps) {
    try {
      if (s.nav != null) { await send('Page.navigate', { url: /^https?:|^file:/.test(s.nav) ? s.nav : base + '?' + s.nav }); await sleep(s.settle || 1600); }
      else if (s.wait) await sleep(s.wait);
      else if (s.until) { const t0 = Date.now(); while (!(await ev(s.until))) { if (Date.now() - t0 > (s.timeout || 8000)) { console.log('TIMEOUT', s.until); break; } await sleep(120); } }
      else if (s.eval) await ev(s.eval);
      else if (s.log) console.log('LOG', JSON.stringify(await ev(s.log)));
      else if (s.key) {
        const k = s.key, text = k.length === 1 ? k : k === 'Enter' ? '\r' : undefined;
        const code = k.length === 1 ? (/[0-9]/.test(k) ? 'Digit' + k : 'Key' + k.toUpperCase()) : k;
        const vk = { Enter: 13, Escape: 27, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, ' ': 32 }[k] || (k.length === 1 ? k.toUpperCase().charCodeAt(0) : 0);
        await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key: k, code, text, windowsVirtualKeyCode: vk });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
        await sleep(s.after || 120);
      } else if (s.click) {
        const c = await center(s.click); if (!c) { console.log('NO ELEMENT', s.click); continue; }
        for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: c.x, y: c.y, button: 'left', clickCount: 1 });
        await sleep(s.after || 150);
      } else if (s.tap) {
        const c = await center(s.tap); if (!c) { console.log('NO ELEMENT', s.tap); continue; }
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y }] });
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await sleep(s.after || 200);
      } else if (s.drag) {
        const c = await center(s.drag); if (!c) { console.log('NO ELEMENT', s.drag); continue; }
        const x0 = c.l + c.w * s.from, x1 = c.l + c.w * s.to;
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0, y: c.y });
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: c.y, button: 'left', clickCount: 1 });
        for (let i = 1; i <= 8; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + (x1 - x0) * i / 8, y: c.y, button: 'left', buttons: 1 }); await sleep(40); }
        if (s.shotMid) await shot(s.shotMid);
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x1, y: c.y, button: 'left', clickCount: 1 });
        await sleep(s.after || 300);
      } else if (s.shot) await shot(s.shot);
    } catch (e) { console.log('STEP ERROR', JSON.stringify(s).slice(0, 120), String(e.message || e).slice(0, 300)); }
  }
  async function shot(name) {
    const jpg = /\.jpg$/.test(name); // "nombre.jpg" guarda en JPEG (para el manifiesto)
    const file = path.join(out, jpg ? name : name + '.png'); fs.mkdirSync(path.dirname(file), { recursive: true });
    const r = await send('Page.captureScreenshot', jpg ? { format: 'jpeg', quality: 82, fromSurface: true } : { format: 'png', fromSurface: true, captureBeyondViewport: false });
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    if (plan.preview) { // vista previa chica (para revisar rápido)
      const pf = path.join(plan.preview, name.replace(/[\\/]/g, '__') + '.jpg'); fs.mkdirSync(path.dirname(pf), { recursive: true });
      const sc = Math.min(1, (plan.previewW || 560) / vp.w);
      const p = await send('Page.captureScreenshot', { format: 'jpeg', quality: plan.previewQ || 38, fromSurface: true, clip: { x: 0, y: 0, width: vp.w, height: vp.h, scale: sc } });
      fs.writeFileSync(pf, Buffer.from(p.result.data, 'base64'));
    }
    console.log('SHOT', ++n, name);
  }
  if (errors.length) console.log('PAGE ERRORS', JSON.stringify([...new Set(errors)]).slice(0, 1500));
  ws.close(); ch.kill();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
