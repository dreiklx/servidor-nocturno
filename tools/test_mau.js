// Prueba y capturas de la pelea contra Mau (expansión cinematográfica).
// Juega todo con teclas reales: revelación, menú exclusivo, los tres actos, transiciones,
// epílogo y la recuperación del control. Verifica audio (una sola pista a la vez), que las
// mecánicas sigan iguales (vida por acto, energía, refuerzo) y que las escenas terminen.
// Uso (con node tools/serve.js corriendo): node tools/test_mau.js [carpeta_capturas]
// MOBILE=1 lo corre en un teléfono emulado (915x412).
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:8642/index.html';
const OUT = process.argv[2] ? path.resolve(process.argv[2]) : null;
const MOBILE = !!process.env.MOBILE;
const VW = MOBILE ? 915 : 1280, VH = MOBILE ? 412 : 720;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (n, c, x) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : '  → ' + JSON.stringify(x).slice(0, 300))); if (!c) fails++; };
const HELP = `window.__nd = {
  st() {
    const q = s => document.querySelector(s);
    const top = [...document.querySelectorAll('#layer > .modal')].filter(m => !m.classList.contains('out')).pop();
    const bt = q('.modal.battle2:not(.out)');
    const sub = q('.cine-sub');
    return { stage: MAU.stage, cine: !!q('.cine-ui:not(.out)'), sub: !!(sub && !sub.hidden), title: !!q('.mau-title.go'), skip: !!(q('.cine-skip') && !q('.cine-skip').hidden),
      menu: !!q('.mau-menu:not(.out)'), control: !!q('.mau-control:not(.out)'), dialog: !!(top && top.classList.contains('dialog')),
      battle: !!bt, asking: !!(bt && bt.classList.contains('asking') && bt.querySelectorAll('.bt-opts .opt:not([disabled])').length),
      next: !!(bt && !bt.querySelector('.t-next').hidden), card: !!(top && top.classList.contains('card')), audio: AUDIO.debug(), hearts: GAMECINE.state().hearts, done: GAMECINE.state().done };
  },
  answer(ok) {
    const qt = document.querySelector('.bt-q').textContent, all = CONTENT.phases.flatMap(p => p.questions);
    const btns = [...document.querySelectorAll('.bt-opts .opt')], texts = btns.map(b => b.querySelector('span').textContent);
    const q = all.filter(x => x.q === qt && (x.code || '') === ((document.querySelector('.bt-code:not([hidden])') || {}).textContent || '')).find(x => texts.includes(x.o[0])), k = texts.indexOf(q.o[0]);
    return ok ? k + 1 : btns.findIndex((b, i) => i !== k && !b.disabled) + 1;
  }
};`;

(async () => {
  const port = 9200 + Math.floor(Math.random() * 90);
  const ch = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'ndmau-'))}`, `--window-size=${VW},${VH}`, 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ } if (!ws) await sleep(200); }
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {}; const errors = new Set();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } else if (m.method === 'Runtime.exceptionThrown') errors.add((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text); });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async e => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  const key = async (k, after = 160) => {
    const text = k.length === 1 ? k : k === 'Enter' ? '\r' : undefined, code = /^[0-9]$/.test(k) ? 'Digit' + k : k.length === 1 ? 'Key' + k.toUpperCase() : k, vk = { Enter: 13, Escape: 27 }[k] || k.toUpperCase().charCodeAt(0);
    await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key: k, code, text, windowsVirtualKeyCode: vk });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); await sleep(after);
  };
  const tap = async sel => { // toque o clic real en el centro del elemento
    const b = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, in: r.right <= innerWidth && r.bottom <= innerHeight && r.left >= 0 && r.top >= 0 }; })()`);
    if (!b) return null;
    if (MOBILE) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x, y: b.y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
    else for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: b.x, y: b.y, button: 'left', clickCount: 1 });
    await sleep(200); return b;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: MOBILE ? 2 : 1, mobile: MOBILE });
  if (MOBILE) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  let n = 0; const shots = []; const taken = new Set();
  async function shot(name, note) {
    if (!OUT || taken.has(name)) return; taken.add(name);
    const f = path.join(OUT, String(++n).padStart(2, '0') + '_' + name + '.png'); fs.mkdirSync(OUT, { recursive: true });
    const r = await send('Page.captureScreenshot', { format: 'png', fromSurface: true }); fs.writeFileSync(f, Buffer.from(r.result.data, 'base64'));
    shots.push({ file: path.basename(f), note }); console.log('    ' + path.basename(f));
  }
  const st = () => ev('__nd.st()');
  const waitFor = async (fn, ms = 15000) => { const t0 = Date.now(); let s; while (Date.now() - t0 < ms) { s = await st(); if (fn(s)) return s; await sleep(120); } return s; };
  const nav = async q => { await send('Page.navigate', { url: BASE + '?' + q }); await sleep(1800); await ev(HELP); };

  /* ---------------- partida completa contra Mau ---------------- */
  console.log(MOBILE ? 'Mau en teléfono' : 'Mau en escritorio');
  await nav('shot=final&ui=final&act=0&read=1&pause=1');
  await sleep(500); await shot('habitacion_antes', 'La cima de la Torre antes de la revelación: la consola del Servidor Central y nadie a la vista.');
  ok('antes de la revelación Mau no aparece en el mapa', await ev(`!GAMECINE.state().mauSeen && !document.querySelector('.cine-ui')`) === true);
  await ev('(window.__startBoss(), 0)');
  let s = await waitFor(x => x.cine && x.sub, 6000);
  ok('la primera vez no hay botón para saltar la escena', s.skip === false);
  const audioLog = {}, seenStages = new Set(), busMax = { v: 0 };
  const STAGE_SHOT = { room: ['habitacion_segura', 'Kai llega: la consola está encendida, pero no hay nadie.', 400], dark: ['habitacion_a_oscuras', 'Las luces se apagan y la consola cambia a rojo.', 900], voice: ['voz_en_la_oscuridad', 'Mau habla sin aparecer; la cámara recorre la habitación.', 1400], silence: ['silencio', 'Silencio total antes del interruptor.', 700], silhouette: ['silueta', 'Clic del interruptor: un foco revela una silueta.', 1100], approach: ['la_camara_se_acerca', 'La cámara se acerca despacio a la silueta.', 1800], reveal: ['revelacion', 'Es el Profe Mauricio.', 1300], title: ['titulo_jefe_final', 'Título del jefe final.', 2600], act2: ['transicion_acto2', 'Transición al Acto II: luz roja e interferencia.', 1500], act3: ['transicion_acto3', 'Transición al Acto III: tormenta y datos que fluyen hacia Mau.', 2200], defeat: ['derrota_de_mau', 'Derrota de Mau: los datos lo abandonan.', 700], walk: ['kai_va_a_la_consola', 'Kai camina hasta la consola.', 500], dawn: ['amanecer', 'Control recuperado: la Torre pasa a azul y amanece.', 2200], end: ['amanece_en_puerto_nyder', 'Título de cierre.', 2300] };
  const actShots = {}; let act = 0, wrongDone = false, menus = 0, hpSeen = [], ended = false;
  for (let guard = 0; guard < 900 && !ended; guard++) {
    s = await st();
    busMax.v = Math.max(busMax.v, s.audio.active);
    if (s.stage && !seenStages.has(s.stage)) { seenStages.add(s.stage); audioLog[s.stage] = s.audio.current; const sh = STAGE_SHOT[s.stage]; if (sh) { await sleep(sh[2]); await shot(sh[0], sh[1]); } if (s.stage === 'title' || s.stage === 'act2' || s.stage === 'act3') { await waitFor(x => x.title, 6000); await sleep(1300); await shot(s.stage === 'title' ? 'titulo_mau' : s.stage + '_titulo', 'Título en pantalla.'); } continue; }
    if (s.card) { await sleep(700); await shot('pantalla_final', 'Pantalla final con las consecuencias de la traición.'); ended = true; break; }
    if (s.control) {
      await sleep(600); await shot('servidor_central_bajo_mau', 'El panel del Servidor Central: los cinco núcleos encadenados al usuario de Mau.');
      const b = await tap('.mc-go'); ok('el botón "Recuperar el control" se ve y se puede tocar', b && b.in, b);
      await sleep(1900); await shot('recuperando_el_control', 'Kai revoca los permisos: los núcleos pasan uno por uno a todo el puerto.');
      await waitFor(x => !x.control, 15000); continue;
    }
    if (s.menu) {
      menus++; audioLog['menu' + act] = s.audio.current;
      await sleep(1300); await shot('menu_acto' + (act + 1), `Menú exclusivo antes del Acto ${['I', 'II', 'III'][act]}.`);
      if (act === 0) { const b = await tap('.mm-go'); ok('el botón COMENZAR del menú se ve y se puede tocar', b && b.in, b); } else await key('Enter', 300);
      await sleep(600); continue;
    }
    if (s.cine && s.sub) { await key('Enter', 220); continue; }
    if (s.dialog) { await key('Enter', 240); continue; }
    if (s.asking) {
      await sleep(400);
      if (!actShots[act]) {
        actShots[act] = true; audioLog['battle' + act] = s.audio.current;
        const bar = await ev('MAU.debug && MAU.debug.bar'); hpSeen[act] = bar;
        await shot('acto' + (act + 1) + '_inicio', `Inicio del combate del Acto ${['I', 'II', 'III'][act]}.`);
      }
      if (act === 0 && !wrongDone) {
        wrongDone = true; const h0 = s.hearts;
        await key(String(await ev('__nd.answer(false)')), 420); await shot('acto1_ataque_de_mau', 'Error de Kai: ataque de Mau con interferencia.');
        const s2 = await waitFor(x => x.next); ok('un error sigue quitando 1 de energía', s2.hearts === h0 - 1, [h0, s2.hearts]);
        await key('Enter', 300); continue;
      }
      await key(String(await ev('__nd.answer(true)')), 360);
      if (!taken.has('acto' + (act + 1) + '_combate')) await shot('acto' + (act + 1) + '_combate', `Combate del Acto ${['I', 'II', 'III'][act]}: ataque de Kai.`);
      await waitFor(x => x.next || !x.battle, 8000);
      await sleep(250);
      const last = (await ev('MAU.debug.bar && MAU.debug.bar.hp')) === 0;
      await key('Enter', 140);
      if (last) { await shot('acto' + (act + 1) + '_mau_cae', `Último acierto del Acto ${['I', 'II', 'III'][act]}.`); await waitFor(x => !x.battle, 6000); act++; }
      continue;
    }
    if (s.next) { await key('Enter', 200); continue; }
    await sleep(150);
  }
  if (!ended) console.log('  DIAGNÓSTICO último estado:', JSON.stringify(await st()), await ev("[document.querySelector('.bt-msg span') && document.querySelector('.bt-msg span').textContent, document.querySelector('.bt-q') && document.querySelector('.bt-q').textContent.slice(0,60), [...document.querySelectorAll('.bt-opts .opt')].map(b => b.disabled + ':' + b.className).join(' '), MAU.debug.bar]"));
  ok('se recorren los tres actos y el epílogo hasta la pantalla final', ended && act === 3, { ended, act });
  ok('la partida queda terminada (S.done)', await ev('GAMECINE.state().done') === true);
  ok('aparecen las escenas de revelación, transiciones y epílogo', ['room', 'dark', 'voice', 'silence', 'silhouette', 'reveal', 'title', 'act2', 'act3', 'defeat', 'control', 'dawn', 'end'].every(k => seenStages.has(k)), [...seenStages]);
  ok('un menú exclusivo antes de cada acto', menus === 3, menus);
  ok('vida de Mau por acto igual que antes (6, 6 y 7 preguntas)', hpSeen.map(b => b && b.max).join(',') === '6,6,7', hpSeen);
  ok('música: suspenso en la oscuridad, silencio antes del interruptor', audioLog.dark === 'suspenso' && audioLog.silence === null, audioLog);
  ok('música: menú propio y una pista distinta en cada acto', audioLog.menu0 === 'menu' && audioLog.battle0 === 'mau1' && audioLog.battle1 === 'mau2' && audioLog.battle2 === 'mau3', audioLog);
  ok('música de cierre en el epílogo', audioLog.dawn === 'epilogo', audioLog.dawn);
  ok('nunca suenan dos pistas a la vez (pista activa ≤ 1; la anterior se apaga en 50 ms)', busMax.v <= 1, busMax.v);

  if (!MOBILE) {
    /* ---------------- revancha: la escena se puede saltar ---------------- */
    console.log('Revancha');
    await nav('shot=final&ui=final&act=0&read=1&seen=1&pause=1');
    ok('después de la revelación, Mau ya se ve en la Torre', await ev('GAMECINE.state().mauSeen') === true);
    await ev('(window.__startBoss(), 0)');
    s = await waitFor(x => x.cine && x.sub, 6000);
    ok('en la revancha aparece "Saltar escena"', s.skip === true);
    await shot('revancha_saltar_escena', 'En la revancha se puede saltar la escena.');
    await tap('.cine-skip');
    s = await waitFor(x => x.menu, 6000);
    ok('saltar la escena lleva directo al menú del jefe', s.menu === true, s.stage);
    ok('al saltar no queda música duplicada', s.audio.active <= 1 && s.audio.current === 'menu', s.audio);
    /* ---------------- derrota de Kai: el sistema de siempre ---------------- */
    console.log('Derrota de Kai');
    await nav('shot=final&ui=final&act=1&hearts=1&read=1&seen=1');
    s = await waitFor(x => x.cine || x.menu, 6000);
    ok('al volver a un acto ya visto, la transición se puede saltar', s.skip === true || s.menu, s);
    if (s.skip) await tap('.cine-skip');
    await waitFor(x => x.menu, 6000); await key('Enter', 600);
    for (let i = 0; i < 20; i++) { s = await st(); if (s.asking) break; if (s.dialog) await key('Enter', 250); else await sleep(150); }
    await key(String(await ev('__nd.answer(false)')), 400); await waitFor(x => x.next); await key('Enter', 400);
    s = await waitFor(x => x.dialog && !x.battle, 8000);
    ok('si Kai pierde, aparece el mensaje de derrota de siempre', s.dialog === true);
    /* ---------------- pistas por radio ---------------- */
    await nav('shot=p3&ui=mauradio&n=3'); await sleep(900);
    const rt = await ev(`(document.querySelector('.modal.dialog .dlg-name') || {}).textContent + ' | ' + (document.querySelector('.modal.dialog .dlg-text') || {}).textContent`);
    ok('al cerrar una fase, Mau deja una pista por radio', /radio/.test(rt), rt);
    await key('Enter', 400); await shot('pista_por_radio', 'Pista por radio al cerrar la Fase 3 ("ya están en mis manos... digo, a salvo").');
  }
  if (errors.size) console.log('Errores de la página:', [...errors].join(' | ').slice(0, 800));
  ok('sin errores de JavaScript', errors.size === 0, [...errors]);
  if (OUT) fs.writeFileSync(path.join(OUT, 'capturas.json'), JSON.stringify(shots, null, 1));
  console.log(fails ? `\n${fails} FALLA(S)` : '\nTODO OK');
  ws.close(); ch.kill(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
