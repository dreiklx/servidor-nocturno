// Pruebas v7: "Nueva partida" con partida guardada, composición del menú de título,
// otros menús dentro de la pantalla y la ayuda del evento de Erika.
// Todo con toques (teléfono/tablet) o clics y teclas (computadora) reales, en varios tamaños.
// Uso (con node tools/serve.js corriendo): node tools/test_v7.js [url_base] [carpeta_capturas]
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = (process.argv[2] || 'http://localhost:8642/') + 'index.html';
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : '  → ' + JSON.stringify(x).slice(0, 400))); if (!c) fails++; };
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const DEVICES = [
  { name: 'Android 915×412', w: 915, h: 412, touch: true, ua: ANDROID },
  { name: 'iPhone SE 667×375', w: 667, h: 375, touch: true, ua: IPHONE },
  { name: 'Teléfono chico 568×320', w: 568, h: 320, touch: true, ua: ANDROID },
  { name: 'Tablet 1024×768', w: 1024, h: 768, touch: true, ua: IPAD },
  { name: 'Escritorio 1280×720', w: 1280, h: 720 },
  { name: 'Escritorio 1920×1080', w: 1920, h: 1080 },
  { name: 'Ventana baja 1024×600', w: 1024, h: 600 }
];
const SAVE = JSON.stringify({ phase: 2, read: { p1l1: true, p1l2: true, p2l1: true }, talked: { p1: true, p2: true }, unlocked: 3, started: true, hearts: 4, maxHearts: 5, lemons: 2, stats: {}, defeated: {}, mg: {}, boss: { b1: true, b2: true }, playMs: 600000 });

(async () => {
  const port = 9100 + Math.floor(Math.random() * 90);
  const ch = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'ndv7-'))}`, 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ } if (!ws) await sleep(200); }
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {}; const errors = new Set();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } else if (m.method === 'Runtime.exceptionThrown') errors.add((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text); });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  await send('Page.enable'); await send('Runtime.enable');
  let dev = null, n = 0;
  const rect = sel => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);
  const press = async sel => { // toque o clic real en el centro del elemento
    const b = await rect(sel); if (!b) return null; const x = b.l + b.w / 2, y = b.t + b.h / 2;
    if (dev.touch) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    return b;
  };
  const key = async k => { const vk = { Enter: 13, Escape: 27 }[k]; await send('Input.dispatchKeyEvent', { type: k === 'Enter' ? 'keyDown' : 'rawKeyDown', key: k, code: k, text: k === 'Enter' ? '\r' : undefined, windowsVirtualKeyCode: vk }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: vk }); await sleep(250); };
  const until = async (expr, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await sleep(100); } return false; };
  const shot = async name => { if (!OUT) return; fs.mkdirSync(OUT, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, String(++n).padStart(2, '0') + '_' + name + '.png'), Buffer.from(r.result.data, 'base64')); };
  const inside = (a, v) => a && a.l >= -0.5 && a.t >= -0.5 && a.r <= v.w + 0.5 && a.b <= v.h + 0.5;
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
  // rectángulos del texto real (no de la caja de bloque) del logo y los textos del título
  const TEXTS = `(() => { const out = []; ['#title .t-studio', '#title h1', '#title .t-sub', '#title .t-copy'].forEach(s => { const e = document.querySelector(s); if (!e || !e.offsetParent && getComputedStyle(e).position !== 'absolute') return; const rg = document.createRange(); rg.selectNodeContents(e); [...rg.getClientRects()].forEach(r => { if (r.width > 1 && r.height > 1) out.push({ s, l: r.left, t: r.top, r: r.right, b: r.bottom }); }); }); return out; })()`;
  const hit = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
  async function toTitle() {
    await send('Page.navigate', { url: base }); await sleep(1200);
    await ev(`(localStorage.clear(), localStorage.setItem('nd_install_seen', String(Date.now())), localStorage.setItem('nightdare_bd2_v1', ${JSON.stringify(SAVE)}), 0)`);
    await send('Page.navigate', { url: base }); await sleep(1300);
    await press('#press');
    return until(`!!document.querySelector('.modal.title-menu.in')`, 9000);
  }

  for (const d of DEVICES) {
    dev = d; console.log(d.name);
    await send('Emulation.setDeviceMetricsOverride', { width: d.w, height: d.h, deviceScaleFactor: 1, mobile: !!d.touch });
    await send('Emulation.setTouchEmulationEnabled', { enabled: !!d.touch, maxTouchPoints: d.touch ? 5 : 0 });
    await send('Emulation.setUserAgentOverride', { userAgent: d.ua || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' });
    const vp = { w: d.w, h: d.h };
    ok('llega al menú de título con una partida guardada', await toTitle());
    await sleep(500);
    /* --- menú de título: nada tapado --- */
    const menu = await rect('.modal.title-menu'), texts = await ev(TEXTS);
    const overl = texts.filter(t => hit(t, menu) > 0).map(t => t.s);
    ok('el menú de título no tapa el logo ni los textos', overl.length === 0, { overl, menu });
    ok('el menú de título cabe en la pantalla', inside(menu, vp), menu);
    const clipped = await ev(`(() => { const m = document.querySelector('.modal.title-menu').getBoundingClientRect(); return [...document.querySelectorAll('.modal.title-menu .menu-item')].filter(b => { const r = b.getBoundingClientRect(); return r.bottom > m.bottom + 1 || r.top < m.top - 1; }).map(b => b.textContent.slice(0, 20)); })()`);
    ok('todas las opciones del menú se ven completas', clipped.length === 0, clipped);
    await shot(slug(d.name) + '_titulo');
    /* --- Nueva partida: confirmación visible --- */
    await press('.modal.title-menu .menu-item');
    ok('aparece la confirmación', await until(`!!document.querySelector('.modal.confirm.in')`, 4000));
    await sleep(120);
    await press('.cf-yes'); await sleep(150); // toque inmediato: no debe confirmar
    ok('un toque inmediato (accidental) no borra la partida', await ev(`!!document.querySelector('.modal.confirm.in')`) === true);
    await sleep(500);
    const box = await rect('.cf-box'), bn = await rect('.cf-no'), by = await rect('.cf-yes');
    const txt = await ev(`document.querySelector('.cf-box').innerText`);
    ok('título, texto y botones de la confirmación correctos', /¿INICIAR UNA NUEVA PARTIDA\?/.test(txt) && /partida anterior guardada/.test(txt) && /CANCELAR/.test(txt) && /SÍ, NUEVA PARTIDA/.test(txt), txt);
    ok('la confirmación y sus dos botones están completos dentro de la pantalla', inside(box, vp) && inside(bn, vp) && inside(by, vp), { box, bn, by, vp });
    if (d.touch) ok('botones de al menos 44 px de alto para el dedo', bn.h >= 43.5 && by.h >= 43.5, [bn.h, by.h]);
    ok('"Cancelar" queda enfocado por defecto', await ev(`document.activeElement === document.querySelector('.cf-no')`) === true);
    await shot(slug(d.name) + '_confirmacion');
    /* --- Cancelar conserva la partida --- */
    await press('.cf-no');
    ok('Cancelar cierra la ventana y vuelve al menú', await until(`!document.querySelector('.modal.confirm') && !!document.querySelector('.modal.title-menu.in')`, 4000));
    ok('Cancelar conserva la partida guardada intacta', await ev(`localStorage.getItem('nightdare_bd2_v1')`) === SAVE);
    if (!d.touch) { // teclado: Enter sobre la confirmación = Cancelar (foco por defecto)
      await press('.modal.title-menu .menu-item'); await until(`!!document.querySelector('.modal.confirm.in')`, 4000); await sleep(500);
      await key('Enter');
      ok('con teclado, Enter cancela (no borra por accidente)', await until(`!document.querySelector('.modal.confirm') && !!document.querySelector('.modal.title-menu.in')`, 3000) && await ev(`localStorage.getItem('nightdare_bd2_v1')`) === SAVE);
      await press('.modal.title-menu .menu-item'); await until(`!!document.querySelector('.modal.confirm.in')`, 4000); await sleep(500);
      await key('Escape');
      ok('Esc también cancela', await until(`!document.querySelector('.modal.confirm')`, 3000));
    }
    /* --- otro menú: Elegir fase --- */
    const items = await ev(`[...document.querySelectorAll('.modal.title-menu .menu-item')].map(b => b.textContent)`);
    await press(`.modal.title-menu .menu-item:nth-child(${items.findIndex(t => /Elegir fase/.test(t)) + 1})`);
    await until(`!!document.querySelector('.modal.card.menu:not(.title-menu).in')`, 4000); await sleep(300);
    const fm = await rect('.modal.card.menu:not(.title-menu)');
    ok('el menú "Elegir fase" queda completo dentro de la pantalla', inside(fm, vp), fm);
    await key('Escape'); await until(`!!document.querySelector('.modal.title-menu.in')`, 4000);
    /* --- Confirmar inicia desde cero --- */
    await press('.modal.title-menu .menu-item'); await until(`!!document.querySelector('.modal.confirm.in')`, 4000); await sleep(500);
    await press('.cf-yes');
    ok('confirmar abre el inicio de la historia', await until(`!!document.querySelector('.modal.dialog')`, 5000));
    for (let i = 0; i < 25 && await ev(`!!document.querySelector('.modal.dialog, .modal.card')`); i++) { await press('.modal.dialog, .modal.card .btn'); await sleep(350); }
    const st = await ev(`(() => { const s = GAMECINE.state(); return { phase: s.phase, read: Object.keys(s.read).length, boss: Object.keys(s.boss).length, hearts: s.hearts, started: s.started }; })()`);
    ok('la partida nueva empieza desde cero en la Fase 1', st.phase === 0 && st.read === 0 && st.boss === 0 && st.hearts === 5 && st.started === true, st);
  }

  /* --- ayuda del evento de Erika --- */
  dev = DEVICES[0];
  console.log('Ayuda del evento de Erika (teléfono)');
  await send('Emulation.setDeviceMetricsOverride', { width: dev.w, height: dev.h, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await toTitle();
  const it2 = await ev(`[...document.querySelectorAll('.modal.title-menu .menu-item')].map(b => b.textContent)`);
  await press(`.modal.title-menu .menu-item:nth-child(${it2.findIndex(t => /Cómo jugar/.test(t)) + 1})`);
  await until(`!!document.querySelector('.hw-live')`, 4000);
  await sleep(400); await shot('como_jugar_con_evento');
  await press('.hw-live');
  ok('desde "Cómo jugar" se abre la explicación del evento', await until(`!!document.querySelector('.modal.live-info.in')`, 3000));
  const info = await ev(`document.querySelector('.modal.live-info').innerText`);
  ok('aclara que es un DIRECTO SIMULADO y no una transmisión real de TikTok', /DIRECTO SIMULADO/.test(info) && /No es una transmisión real de TikTok/.test(info));
  ok('explica cuándo aparece (2,5 minutos, cada 45 s, 7 %, una vez por sesión)', /2,5 minutos/.test(info) && /45 segundos/.test(info) && /7 %/.test(info) && /una vez/.test(info));
  ok('explica que no afecta la partida', /No\. Es solo un momento visual/.test(info));
  await sleep(300); await shot('ayuda_evento_erika');
  await press('.modal.live-info .btn.primary'); await sleep(400);
  // el evento sigue funcionando igual y su escena tiene el botón de ayuda
  await send('Page.navigate', { url: base + '?shot=p1&ui=hud&live=1' }); await sleep(1500);
  ok('el evento sigue apareciendo durante el juego libre', await until(`!!document.querySelector('.live-notif.in')`, 12000));
  await press('.ln-go'); await until(`!!document.querySelector('.modal.live-modal.in')`, 3000); await sleep(600);
  await press('.lv-help');
  ok('dentro del directo, "¿Qué es esto?" abre la misma explicación', await until(`!!document.querySelector('.modal.live-info.in')`, 3000));
  await sleep(300); await shot('ayuda_desde_el_directo');
  ok('ver el evento no cambia la partida (energía, limoncitos)', await ev(`(() => { const s = GAMECINE.state(); return s.hearts === 5 && s.lemons === 3; })()`) === true);

  if (errors.size) console.log('Errores de la página:', [...errors].join(' | ').slice(0, 600));
  ok('sin errores de JavaScript', errors.size === 0, [...errors]);
  console.log(fails ? `\n${fails} FALLA(S)` : '\nTODO OK');
  ws.close(); ch.kill(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
