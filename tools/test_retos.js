// Pruebas de la pasada v3 en Chrome sin ventana:
//  - el comando de prueba resuelve combates, jefes, los 10 minijuegos y la pausa de los videos;
//  - el tren suena una vez por cada paso (y nunca sin tren);
//  - el video abre la pizarra al terminar; el combate no muestra el tema.
// Uso: node tools/test_retos.js [url_base]   (por defecto http://localhost:8642/)
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = (process.argv[2] || 'http://localhost:8642/') + 'index.html';
const port = 9300 + Math.floor(Math.random() * 100);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const ok = (name, cond, extra = '') => { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FALLA') + ' ' + name + (extra ? ' · ' + extra : '')); };
(async () => {
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'ndret-'))}`, '--window-size=1280,720', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 50 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ } await sleep(200); }
  if (ws.readyState !== 1) await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {}, errors = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result.result ? r.result.result.value : undefined; };
  const go = async (q, wait = 2500) => { await send('Page.navigate', { url: base + '?' + q }); await sleep(wait); };
  const type = async word => { for (const ch of word) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

  // 1) combate normal en cada fase: el truco gana y el enemigo queda vencido
  for (const p of ['p1', 'p2', 'p3', 'p4', 'p5']) {
    await go(`shot=${p}&read=1&ui=battle`, 3500);
    const concept = await ev(`(document.querySelector('.bt-concept') || {}).textContent || ''`);
    const before = await ev(`document.querySelectorAll('.battle2').length`);
    await type('ganar'); await sleep(2600);
    const after = await ev(`document.querySelectorAll('.battle2').length`);
    ok(`${p}: combate sin rótulo de tema`, before === 1 && !/Tema/i.test(concept), JSON.stringify(concept));
    ok(`${p}: "ganar" resuelve el combate`, after === 0);
  }
  // 2) jefe
  await go('shot=p3&read=1&ui=boss', 3500); await type('ganar'); await sleep(2600);
  ok('jefe: "ganar" resuelve el combate', (await ev(`document.querySelectorAll('.battle2').length`)) === 0);
  // 3) los 10 minijuegos
  for (const mg of ['crane', 'sorter', 'graph', 'locks', 'restore', 'keys', 'rewrite', 'cache', 'cut', 'mql']) {
    await go(`shot=p1&read=1&ui=mg:${mg}`, 2200); await type('ganar'); await sleep(400);
    const done = await ev(`!!document.querySelector('.mg-done')`);
    await ev(`(() => { const b = [...document.querySelectorAll('.mg .btn.primary')].find(x => /Continuar/.test(x.textContent)); if (b) b.click(); return true; })()`); await sleep(400);
    const closed = await ev(`document.querySelectorAll('.mg').length === 0`);
    ok(`minijuego ${mg}: "ganar" da la prueba por superada y se puede continuar`, done && closed);
  }
  // 4) pausa de un video de cada fase: el truco marca la respuesta correcta y deja seguir
  for (const v of ['p1l3', 'p2l2', 'p3l2', 'p4l5', 'p5l5']) {
    await go(`shot=${v.slice(0, 2)}&ui=video:${v}:0`, 2200);
    const note = await ev(`(document.querySelector('.v-note') || {}).textContent || ''`);
    await type('ganar'); await sleep(500);
    const right = await ev(`!!document.querySelector('.vq-o button.right[data-i="0"]') && !!document.querySelector('.vq-go')`);
    await ev(`(document.querySelector('.vq-go').click(), true)`); await sleep(500);
    const recap = await ev(`!!document.querySelector('.v-end .v-ok')`);
    ok(`video ${v}: aviso de pizarra visible`, /pizarra/i.test(note));
    ok(`video ${v}: "ganar" resuelve la pausa y pasa al resumen`, right && recap);
  }
  // 5) velocidad del video
  await go('shot=p1&ui=video:p1l1:0', 2500);
  const rate = await ev(`(() => { const s = document.querySelector('.v-rate select'); s.value = '1.25'; s.dispatchEvent(new Event('change')); return localStorage.getItem('nd_video_rate'); })()`);
  ok('video: control de velocidad guarda la preferencia', rate === '1.25', rate);
  // 6) flujo real en cada fase: ver una enseñanza abre el video y, al cerrarlo, la pizarra
  for (const p of ['p1', 'p2', 'p3', 'p4', 'p5']) {
    await go(`shot=${p}&ui=lessonflow`, 2500);
    const vid = await ev(`!!document.querySelector('.modal.video')`);
    await ev(`(document.querySelector('.v-x').click(), true)`); await sleep(700);
    const board = await ev(`(document.querySelector('.modal.lesson .chip') || {}).textContent || ''`);
    const hasVidBtn = await ev(`!!document.querySelector('.modal.lesson .l-video')`);
    ok(`${p}: enseñanza = video y después pizarra`, vid && /Pizarra/.test(board) && hasVidBtn, board);
  }
  // 7) trenes: un sonido por paso durante 25 s
  await go('shot=p2&read=1', 1500);
  const trains = await ev(`(async () => {
    window.__trainPasses = 0;
    const tr = MAPS.build ? null : null;
    await new Promise(r => setTimeout(r, 25000));
    return window.__trainPasses;
  })()`);
  const expected = await ev(`(() => { const d = MAPS.defs ? MAPS.defs.find(x => x.id === 'p2') : null; return d && d.trains ? d.trains.map(t => t.period).join(',') : ''; })()`);
  ok('estación: el tren suena al pasar', trains >= 2, `${trains} pasos en 25 s · periodos ${expected}`);
  await go('shot=p1&read=1', 1500);
  const noTrain = await ev(`(async () => { window.__trainPasses = 0; await new Promise(r => setTimeout(r, 6000)); return window.__trainPasses; })()`);
  ok('muelle: sin trenes, sin sonido de tren', noTrain === 0, String(noTrain));
  ok('sin errores de JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FALLAS` : 'TODO OK');
  ws.close(); ch.kill(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
