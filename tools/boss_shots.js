// Capturas reales de cada jefe y sus etapas: el juego corre en Chrome sin ventana y se juega
// el encuentro completo con teclas reales (diálogos, preguntas, aciertos, un error, pista,
// limoncito, golpe final, derrota del jefe y lo que pasa después). Nada se retoca.
// Uso (con node tools/serve.js corriendo): node tools/boss_shots.js [carpeta=screenshots] [jefes=p1,p2,p3,p4,p5,mau,mau-derrota]
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://localhost:8642/index.html';
const OUT = path.resolve(process.argv[2] || 'screenshots');
const ONLY = (process.argv[3] || 'p1,p2,p3,p4,p5,mau,mau-derrota').split(',');
const VW = +(process.env.VW || 1280), VH = +(process.env.VH || 720);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BOSSES = { p1: 'boss_01_pirata_lectosucio', p2: 'boss_02_locomotora_interbloqueo', p3: 'boss_03_tormenta_corrupta', p4: 'boss_04_el_gran_full_scan', p5: 'boss_05_kraken_fragmentado' };
// Funciones de ayuda dentro de la página: solo LEEN la pantalla y el contenido del curso
// para saber qué botón es la respuesta correcta (igual que un jugador que estudió).
const HELP = `window.__nd = {
  st() {
    const top = [...document.querySelectorAll('#layer > .modal')].filter(m => !m.classList.contains('out')).pop();
    const bt = document.querySelector('.modal.battle2:not(.out)');
    return { top: top ? top.className : '', dialog: !!(top && top.classList.contains('dialog')), dlgName: top && top.querySelector('.dlg-name') ? top.querySelector('.dlg-name').textContent : '',
      typing: !!(top && top.querySelector('.dlg-more') && top.querySelector('.dlg-more').style.visibility === 'hidden'),
      battle: !!bt, asking: !!(bt && bt.classList.contains('asking') && bt.querySelectorAll('.bt-opts .opt:not([disabled])').length),
      next: !!(bt && !bt.querySelector('.t-next').hidden), msg: bt ? bt.querySelector('.bt-msg span').textContent : '',
      again: !!(bt && bt.querySelector('.again-tag')), card: !!(top && top.classList.contains('card')), toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '),
      lemon: !!(bt && !bt.querySelector('.t-lemon').hidden && !bt.querySelector('.t-lemon').disabled), cine: !!document.querySelector('.cine-ui:not(.out), .mau-menu:not(.out), .mau-control:not(.out)') };
  },
  answer(ok) {
    const qt = document.querySelector('.bt-q').textContent;
    const all = CONTENT.phases.flatMap(p => p.questions);
    const btns = [...document.querySelectorAll('.bt-opts .opt')];
    const texts = btns.map(b => b.querySelector('span').textContent);
    const q = all.filter(x => x.q === qt && (x.code || '') === ((document.querySelector('.bt-code:not([hidden])') || {}).textContent || '')).find(x => texts.includes(x.o[0]));
    const k = texts.indexOf(q.o[0]);
    if (ok) return k + 1;
    return btns.findIndex((b, i) => i !== k && !b.disabled) + 1;
  }
};`;

(async () => {
  const port = 9500 + Math.floor(Math.random() * 300);
  const ch = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required', `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'ndboss-'))}`, `--window-size=${VW},${VH}`, 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 60 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = l.find(t => t.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch (e) { /* aún no */ } if (!ws) await sleep(200); }
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = {}; const errors = new Set();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
    else if (m.method === 'Runtime.exceptionThrown') errors.add((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  const key = async (k, after = 160) => {
    const text = k.length === 1 ? k : k === 'Enter' ? '\r' : undefined;
    const code = /^[0-9]$/.test(k) ? 'Digit' + k : k.length === 1 ? 'Key' + k.toUpperCase() : k;
    const vk = { Enter: 13, Escape: 27 }[k] || k.toUpperCase().charCodeAt(0);
    await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key: k, code, text, windowsVirtualKeyCode: vk });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
    await sleep(after);
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false });
  let dir = '', n = 0;
  const log = [];
  async function shot(name, note) {
    const file = path.join(OUT, dir, String(++n).padStart(2, '0') + '_' + name + '.png');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const r = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    log.push({ dir, file: path.basename(file), note: note || '' });
    console.log('  ' + path.join(dir, path.basename(file)));
  }
  const st = () => ev('__nd.st()');
  async function waitFor(fn, ms = 15000) { const t0 = Date.now(); let s; while (Date.now() - t0 < ms) { s = await st(); if (fn(s)) return s; await sleep(120); } return s; }
  // termina de escribir el diálogo actual (un Enter si todavía está escribiendo)
  async function fullDialog() { const s = await st(); if (s.dialog && s.typing) await key('Enter', 250); }
  async function open(q, pauseShot) {
    await send('Page.navigate', { url: BASE + '?' + q }); await sleep(1800);
    await ev(HELP);
  }

  /* ---------------- un jefe de fase ---------------- */
  async function phaseBoss(pid) {
    dir = BOSSES[pid]; n = 0;
    console.log(dir);
    await open(`shot=${pid}&ui=bossfight&read=1&pause=1`);
    await sleep(600); await shot('jefe_en_el_mapa', 'El jefe esperando en su zona del mapa, antes de hablarle.');
    await ev('(window.__startBoss(), 0)'); await sleep(700);
    await fullDialog(); await shot('presentacion', 'Diálogo de presentación del jefe.');
    let s = await st();
    while (s.dialog) { await key('Enter', 260); await fullDialog(); s = await st(); }
    s = await waitFor(x => x.asking);
    await sleep(700); await shot('combate_inicio', 'Arranque del combate: vida del jefe, energía de Kai y la primera pregunta.');
    await key('h', 400); await shot('pista', 'Herramienta "Pista" (H).');
    await key(String(await ev('__nd.answer(true)')), 330); await shot('ataque_de_kai', 'Respuesta correcta: Kai ataca (animación en curso).');
    await waitFor(x => x.next); await sleep(250); await shot('respuesta_correcta', 'Explicación de la respuesta correcta.');
    await key('Enter', 300);
    let hits = 1, hp = 6, shotAgain = false, shotLemon = false, shotLow = false;
    await waitFor(x => x.asking); await sleep(400);
    await key(String(await ev('__nd.answer(false)')), 330); await shot('ataque_del_jefe', 'Respuesta incorrecta: el jefe ataca y Kai pierde energía.');
    await waitFor(x => x.next); await sleep(250); await shot('respuesta_incorrecta', 'Se muestra la correcta y por qué; la pregunta volverá en este combate.');
    await key('Enter', 300);
    for (let guard = 0; guard < 30; guard++) {
      s = await waitFor(x => x.asking || !x.battle, 20000);
      if (!s.battle) break;
      await sleep(350);
      if (s.again && !shotAgain) { shotAgain = true; await shot('otra_oportunidad', 'La pregunta fallada vuelve: "Otra oportunidad".'); }
      if (!shotLemon && s.lemon) { shotLemon = true; await key('j', 600); await shot('limoncito', 'Herramienta "Limoncito" (J): descarta opciones incorrectas.'); }
      if (hp - hits === 1 && !shotLow) { shotLow = true; await shot('jefe_al_limite', 'Al jefe le queda un solo golpe.'); }
      const last = hp - hits === 1;
      await key(String(await ev('__nd.answer(true)')), last ? 260 : 200); hits++;
      if (last) await shot('golpe_final', 'Golpe final: el ataque que deja al jefe sin vida.');
      s = await waitFor(x => x.next || !x.battle); if (!s.battle) break;
      await key('Enter', 120); // "Continuar": si al jefe no le queda vida, empieza su derrota
      s = await st();
      if (s.battle && !s.asking) { // no vino otra pregunta: es la derrota del jefe
        // la captura en PNG tarda: se espera directo al mensaje completo para no perderlo
        await waitFor(x => /derrotado!/.test(x.msg) || !x.battle, 4000);
        await shot('derrota_del_jefe', 'Mensaje de victoria del combate.');
        break;
      }
    }
    s = await waitFor(x => x.dialog, 8000); await sleep(400); await fullDialog();
    await shot('dialogo_de_derrota', 'Lo que dice el jefe al perder.');
    while ((await st()).dialog) { await key('Enter', 260); await fullDialog(); }
    await sleep(500); await shot('portal_abierto', 'Núcleo restaurado: aparece el portal y el aviso.');
    await sleep(1800); await shot('despues_del_combate', 'El mapa después del combate, con el portal activo.');
  }

  /* ---------------- Profe Mauricio (jefe final en tres actos) ---------------- */
  async function mau() {
    dir = 'mau'; n = 0; console.log(dir);
    await open('shot=final&ui=final&act=0&read=1&pause=1');
    await sleep(600); await shot('torre_mau_en_el_mapa', 'La Torre del Servidor con el Profe Mauricio esperando.');
    await ev('(window.__startBoss(), 0)'); await sleep(700);
    await fullDialog(); await shot('introduccion', 'Introducción del Profe Mauricio.');
    let wrongDone = false, act = 0;
    for (let guard = 0; guard < 400; guard++) {
      const s = await st();
      if (s.cine) { await key('Enter', 300); continue; } // v6: escenas, menú y panel del jefe final
      if (s.card) { await sleep(600); await shot('pantalla_final', 'Pantalla posterior: "Amanece en Puerto Nyder", resultados y créditos.'); break; }
      if (s.dialog) {
        if (/Acto/.test(s.dlgName) && !s.typing) {
          const tag = ['acto1', 'acto2', 'acto3'][act] || 'acto';
          if (!log.some(l => l.dir === 'mau' && l.file.includes(tag + '_presentacion'))) await shot(tag + '_presentacion', 'Presentación del ' + s.dlgName.replace('Profe Mauricio · ', '') + '.');
        }
        if (act >= 3 && !s.typing && !log.some(l => l.file.includes('dialogo_de_victoria'))) await shot('dialogo_de_victoria', 'El Profe Mauricio reconoce la victoria de Kai.');
        await key('Enter', 260); continue;
      }
      if (s.asking) {
        await sleep(350);
        const tag = ['acto1', 'acto2', 'acto3'][act];
        if (!log.some(l => l.file.includes(tag + '_combate_inicio'))) {
          await shot(tag + '_combate_inicio', `Arranque del combate del ${['Acto I', 'Acto II', 'Acto III'][act]}.`);
          if (act === 0) { await key('h', 400); await shot('acto1_pista', 'Pista durante el examen final.'); }
          if (act === 1) { await key('j', 600); await shot('acto2_limoncito', 'Limoncito durante el examen final.'); }
        }
        if (act === 0 && !wrongDone) {
          wrongDone = true;
          await key(String(await ev('__nd.answer(false)')), 330); await shot('acto1_ataque_de_mau', 'Error: el Profe Mauricio "ataca".');
          await waitFor(x => x.next); await sleep(250); await shot('acto1_respuesta_incorrecta', 'Explicación y refuerzo: vuelve otra pregunta del mismo tema.');
          await key('Enter', 300); continue;
        }
        await key(String(await ev('__nd.answer(true)')), 300);
        if (act === 0 && !log.some(l => l.file.includes('acto1_ataque_de_kai'))) await shot('acto1_ataque_de_kai', 'Acierto: ataque de Kai.');
        await waitFor(x => x.next || !x.battle, 8000);
        if (act === 2 && !log.some(l => l.file.includes('acto3_respuesta_correcta'))) { await sleep(200); await shot('acto3_respuesta_correcta', 'Explicación tras un acierto en el Acto III.'); }
        await key('Enter', 120);
        const r = await st();
        if (r.battle && !r.asking) { // sin más preguntas: el acto termina
          const nm = ['Acto I', 'Acto II', 'Acto III'][act], tg = ['acto1', 'acto2', 'acto3'][act];
          await shot(tg + '_mau_vencido', `Último acierto del ${nm}: el Profe Mauricio cae.`);
          await waitFor(x => /derrotad/.test(x.msg) || !x.battle, 4000);
          await shot(tg + '_superado', `Fin del ${nm}.`);
          await waitFor(x => !x.battle, 4000); await sleep(250);
          act++;
          if (act < 3) { const t = await st(); if (t.toast) await shot(tg + '_aviso_de_energia', 'Aviso entre actos: acto superado y +2 de energía.'); }
        }
        continue;
      }
      if (s.next) { await key('Enter', 250); continue; }
      await sleep(150);
    }
  }

  /* ---------------- Mau gana: cuando Kai se queda sin energía ---------------- */
  async function mauDefeat() {
    dir = 'mau'; n = 50; console.log('mau (derrota de Kai)');
    await open('shot=final&ui=final&act=1&hearts=1&read=1');
    await sleep(700);
    while ((await st()).dialog) { await key('Enter', 260); await fullDialog(); }
    await waitFor(x => x.asking); await sleep(400);
    await key(String(await ev('__nd.answer(false)')), 330);
    await waitFor(x => x.next); await sleep(200); await shot('kai_sin_energia', 'Con 1 de energía, un error deja a Kai sin energía.');
    await key('Enter', 600); await sleep(500); await shot('kai_cae', 'Animación de derrota de Kai.');
    await waitFor(x => x.dialog, 6000); await sleep(400); await fullDialog(); await shot('mau_gana_dialogo', 'Mensaje del Profe Mauricio cuando Kai pierde.');
    while ((await st()).dialog) { await key('Enter', 300); await fullDialog(); }
    await sleep(1500); await shot('rescate_de_erika', 'Después de perder: el rescate (Erika lleva a Kai a su puesto).');
    await sleep(2500); await shot('rescate_de_erika_2', 'Continuación del rescate.');
  }

  for (const k of ONLY) {
    try {
      if (BOSSES[k]) await phaseBoss(k);
      else if (k === 'mau') await mau();
      else if (k === 'mau-derrota') await mauDefeat();
    } catch (e) { console.log('ERROR en', k, String(e.message || e).slice(0, 300)); }
  }
  fs.mkdirSync(OUT, { recursive: true });
  const idxFile = path.join(OUT, 'capturas_jefes.json');
  let prev = []; try { prev = JSON.parse(fs.readFileSync(idxFile, 'utf8')); } catch (e) { /* nuevo */ }
  const key2 = l => l.dir + '/' + l.file;
  fs.writeFileSync(idxFile, JSON.stringify(prev.filter(p => !log.some(l => key2(l) === key2(p))).concat(log).sort((x, y) => key2(x).localeCompare(key2(y))), null, 1));
  if (errors.size) console.log('ERRORES DE LA PÁGINA:', [...errors].join(' || ').slice(0, 1500));
  ws.close(); ch.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
