// Comprueba que el audio (WebAudio: música y efectos) queda activo tras el primer toque o clic,
// en PC (clic) y en teléfono emulado (toque), con el flujo real: inicio → intro → menú.
// Uso: node tools/test_audio_inicio.js [url_base]
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = (process.argv[2] || 'http://localhost:8642/') + 'index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(mobile) {
  const port = 9100 + Math.floor(Math.random() * 100);
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'ndaud-'))}`, 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 50 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ } await sleep(200); }
  if (ws.readyState !== 1) await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {};
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); return r.result.result ? r.result.result.value : undefined; };
  await send('Page.enable');
  const W = mobile ? 844 : 1280, H = mobile ? 390 : 720;
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: base }); await sleep(2500);
  const before = await ev('AUDIO.state()');
  if (mobile) {
    // v5: en teléfono primero aparece la bienvenida (instalar app); su botón "Continuar en el navegador"
    // es el toque que reemplaza a "Toque la pantalla". Se toca ese botón, igual que una persona.
    const b = await ev(`(() => { const e = document.querySelector('#install .ins-skip'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    const p = b || { x: W / 2, y: H / 2 };
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  else { await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: W / 2, y: H / 2, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: W / 2, y: H / 2, button: 'left', clickCount: 1 }); }
  await sleep(4500); // intro de NYDER + menú
  const after = await ev('AUDIO.state()');
  const menu = await ev(`(() => { const m = document.querySelector('.title-menu'); if (!m) return 'sin menú'; const r = m.getBoundingClientRect(); return Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' dentro=' + (r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight); })()`);
  console.log((mobile ? 'Teléfono (toque)' : 'PC (clic)') + `: audio antes=${before} · después=${after} · menú ${menu}`);
  ws.close(); ch.kill();
  return after === 'running' && /dentro=true/.test(menu);
}
(async () => { const a = await run(false), b = await run(true); console.log(a && b ? 'TODO OK' : 'FALLA'); process.exit(a && b ? 0 : 1); })().catch(e => { console.error(e); process.exit(1); });
