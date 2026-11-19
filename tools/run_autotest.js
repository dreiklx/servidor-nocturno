// Ejecuta index.html?autotest=1 en Chrome sin ventana y muestra el resultado y los errores de consola.
// Uso: node tools/run_autotest.js [url_base]   (por defecto http://localhost:8642/)
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = process.argv[2] || 'http://localhost:8642/';
const port = 9700 + Math.floor(Math.random() * 200);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ndauto-'));
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 50 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ } await sleep(200); }
  if (ws.readyState !== 1) await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {}, errors = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description).join(' '));
  });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + 'index.html?autotest=1' });
  let res = '';
  for (let i = 0; i < 240; i++) {
    await sleep(500);
    const r = await Promise.race([sleep(4000).then(() => ({ result: { result: { value: "SIN RESPUESTA (pagina bloqueada)" } } })), send("Runtime.evaluate", { expression: 'document.title + "\\n" + (document.getElementById("autotest") ? document.getElementById("autotest").textContent : "")' })]);
    res = r.result.result.value || '';
    if (/AUTOTEST (OK|FALL)/.test(res)) break;
    if (i % 20 === 19) console.log("[" + i + "]", res.split(String.fromCharCode(10)).filter(Boolean).slice(-2).join(" | ").slice(0, 300), "errores:", errors.length, errors.slice(-1).join("").slice(0, 300));
  }
  console.log(res.slice(0, 6000));
  console.log('ERRORES DE CONSOLA:', errors.length); errors.slice(0, 10).forEach(e => console.log(' -', String(e).slice(0, 400)));
  ws.close(); ch.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
