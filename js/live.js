/* Evento sorpresa: "Erika Ceviches está en directo".
   Es un evento FICTICIO del juego: no se conecta a TikTok ni a ninguna cuenta real
   (TikTok no ofrece una API pública para saber si alguien transmite). Por eso todo
   lo que se ve dice "directo simulado".
   Aparece poco: como mucho una vez por sesión, después de unos minutos de juego libre,
   y nunca durante combates, videos ni menús. Con ?live=1 se fuerza para probarlo. */
window.LIVE = (function () {
  const params = new URLSearchParams(location.search);
  const FORCE = params.get('live') === '1';
  const FIRST_AT = FORCE ? 4 : 150;   // segundos de juego libre antes de poder salir
  const EVERY = 45, CHANCE = 0.07;    // cada 45 s hay un 7 % (≈ una vez cada 10 a 15 minutos)
  let played = 0, nextRoll = FIRST_AT, fired = false, notif = null, hideT = 0;

  const CHAT = [
    ['Profe Mauricio', 'se unió al directo 👀', 'mau'],
    ['kai_nocturno', '¿el ceviche tiene ROLLBACK si sale muy picante?'],
    ['Pirata Lectosucio', 'leí el precio antes del COMMIT 🏴‍☠️', 'foe'],
    ['bd2_estudiante', '¿qué nivel de aislamiento tiene el limón?'],
    ['Locomotora Interbloqueo', 'espero a que el de adelante suelte el ceviche… y él me espera a mí', 'foe'],
    ['Kraken Fragmentado', 'pido uno en cada shard', 'foe'],
    ['radio_nocturna', 'respalden antes de comer, diay'],
    ['El Gran Full Scan', 'revisé el menú completo, plato por plato', 'foe'],
    ['muelle_08', '¡saludos desde el Muelle de las Transacciones!'],
    ['Tormenta Corrupta', '¿alguien tiene un respaldo de la salsa?', 'foe'],
    ['vecina_del_mercado', 'uno con extra culantro, porfa 🍋'],
    ['kai_nocturno', 'ya voy por la torre, deséenme suerte']
  ];
  const SAY = [
    '¡Buenas noches, gente del servidor!',
    'Hoy hay ceviche ACID: Atómico, Consistente… y bien Delicioso.',
    'Si se equivoca en el examen, no se me achicopale: para eso existe el ROLLBACK.',
    '¡Kai! Deje el teléfono y vaya a repasar 😄'
  ];

  function tick(dt) {
    if (fired || notif) return;
    played += dt;
    if (played < nextRoll) return;
    nextRoll = played + EVERY;
    if (FORCE || Math.random() < CHANCE) trigger();
  }

  /* ---- la notificación ---- */
  function trigger() {
    if (notif) return; fired = true;
    const stage = document.getElementById('stage');
    notif = document.createElement('div');
    notif.className = 'live-notif'; notif.setAttribute('role', 'status');
    notif.innerHTML = `
      <div class="ln-ava"></div>
      <div class="ln-txt">
        <div class="ln-top"><span class="live-pill"><i></i>LIVE</span><span class="ln-alert">¡ALERTA!</span></div>
        <b>ERIKA CEVICHES ESTÁ EN DIRECTO EN TIKTOK</b>
        <small>Evento del juego · directo simulado</small>
      </div>
      <button class="ln-go">Ver</button>
      <button class="ln-x" aria-label="Ignorar">✕</button>`;
    if (window.SPR) notif.querySelector('.ln-ava').appendChild(SPR.scaled(SPR.erikaPortrait(), 2));
    stage.appendChild(notif);
    requestAnimationFrame(() => requestAnimationFrame(() => notif && notif.classList.add('in')));
    if (window.AUDIO && AUDIO.fx.live) AUDIO.fx.live();
    notif.querySelector('.ln-go').addEventListener('click', () => { dismiss(); open(); });
    notif.querySelector('.ln-x').addEventListener('click', dismiss);
    hideT = setTimeout(dismiss, 11000);
  }
  function dismiss() {
    clearTimeout(hideT); if (!notif) return;
    const n = notif; notif = null; n.classList.remove('in'); n.classList.add('out');
    setTimeout(() => n.remove(), 400);
  }

  /* ---- la escena del directo ---- */
  function open() {
    return new Promise(resolve => {
      const m = UI.h('div', 'modal live-modal');
      m.innerHTML = `
        <div class="lv-banner"><span class="lv-sim">DIRECTO SIMULADO</span> Este evento ocurre solo dentro de Servidor Nocturno. No es una transmisión real.</div>
        <div class="lv-phone">
          <canvas width="360" height="640"></canvas>
          <div class="lv-head"><div class="lv-ava"></div><div><b>Erika Ceviches</b><small>Puesto del Muelle</small></div><span class="live-pill"><i></i>LIVE</span><span class="lv-views">👁 <b>0</b></span></div>
          <div class="lv-say"></div>
          <div class="lv-chat"></div>
          <div class="lv-gift" hidden></div>
          <div class="lv-end" hidden><b>Erika terminó el directo</b><span>¡A estudiar! El examen no se responde solo.</span></div>
        </div>
        <button class="btn primary lv-back">Volver al juego <kbd>Esc</kbd></button>`;
      m.querySelector('.lv-ava').appendChild(SPR.scaled(SPR.erikaPortrait(), 1));
      const cv = m.querySelector('canvas'), x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
      const erika = SPR.erika(), lemon = mkLemon();
      const t0 = performance.now(); let raf = 0, done = false, chatI = 0, sayI = -1, views = 312, hearts = [];
      const timers = [];
      const later = (ms, f) => timers.push(setTimeout(f, ms));
      function addChat() {
        const [who, text, kind] = CHAT[chatI++ % CHAT.length];
        const row = UI.h('div', 'lv-msg' + (kind ? ' ' + kind : ''), `<b>${UI.esc(who)}</b> ${UI.esc(text)}`);
        const box = m.querySelector('.lv-chat'); box.appendChild(row);
        while (box.children.length > 5) box.firstChild.remove();
        if (window.AUDIO && AUDIO.fx.talk) AUDIO.fx.talk();
      }
      function nextSay() {
        sayI++; if (sayI >= SAY.length) return;
        const s = m.querySelector('.lv-say'); s.textContent = SAY[sayI]; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop');
      }
      function heart(n = 1) { for (let i = 0; i < n; i++) hearts.push({ x: 300 + Math.random() * 40, y: 600, vx: -10 + Math.random() * 20, t: performance.now() + i * 120, c: ['#ff4d6d', '#ffd34d', '#7ad7ff', '#b18cff'][Math.floor(Math.random() * 4)] }); }
      function gift() {
        const g = m.querySelector('.lv-gift'); g.hidden = false; g.innerHTML = '<b>Kai</b> envió un limoncito 🍋';
        g.classList.remove('pop'); void g.offsetWidth; g.classList.add('pop');
        if (window.AUDIO) AUDIO.fx.sparkle();
        heart(8); later(2600, () => { g.hidden = true; });
      }
      // guion del directo (unos 30 segundos)
      later(400, nextSay); later(900, addChat); later(5200, nextSay); later(12000, nextSay); later(19000, nextSay);
      for (let i = 1; i < 14; i++) later(900 + i * 1900, addChat);
      later(9000, gift); later(21000, gift);
      later(29000, () => { m.querySelector('.lv-end').hidden = false; m.classList.add('ended'); if (window.AUDIO) AUDIO.fx.bell(); });
      const tapHeart = () => { heart(3); views += 1; };
      cv.addEventListener('pointerdown', tapHeart);

      function draw(now) {
        const t = (now - t0) / 1000;
        // fondo: noche en el muelle, luces de colores y el puesto
        const gr = x.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, '#120c22'); gr.addColorStop(0.55, '#24184a'); gr.addColorStop(1, '#0b1a2e');
        x.fillStyle = gr; x.fillRect(0, 0, 360, 640);
        for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${0.25 + 0.25 * Math.sin(t * 2 + i)})`; x.fillRect((i * 97) % 360, (i * 53) % 260, 2, 2); }
        x.strokeStyle = '#3a2d5a'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 150); x.quadraticCurveTo(180, 200, 360, 150); x.stroke();
        for (let i = 0; i < 9; i++) { const lx = 20 + i * 40, ly = 150 + Math.sin(i / 8 * Math.PI) * 24; x.fillStyle = ['#ffd34d', '#ff5d6c', '#5fe39a', '#7ad7ff'][i % 4]; x.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + i); x.beginPath(); x.arc(lx, ly + 6, 5, 0, 7); x.fill(); x.globalAlpha = 1; }
        // letrero
        x.fillStyle = '#2b1d10'; x.fillRect(70, 205, 220, 44); x.strokeStyle = '#ffd34d'; x.lineWidth = 3; x.strokeRect(70, 205, 220, 44);
        x.fillStyle = '#ffd34d'; x.font = '22px "Pixelify Sans", monospace'; x.textAlign = 'center'; x.fillText('CEVICHES ERIKA', 180, 235);
        // Erika (pixel art del juego), se mueve al ritmo
        const bob = Math.round(Math.sin(t * 4) * 4);
        x.drawImage(erika, 180 - erika.width * 4, 300 + bob, erika.width * 8, erika.height * 8);
        // mostrador con vasitos
        x.fillStyle = '#7a4a2a'; x.fillRect(30, 470, 300, 26); x.fillStyle = '#5a341c'; x.fillRect(30, 496, 300, 90);
        for (let i = 0; i < 4; i++) { const cx = 75 + i * 70; x.fillStyle = '#f4f0ff'; x.fillRect(cx - 16, 446, 32, 26); x.fillStyle = '#ffb347'; x.fillRect(cx - 13, 446, 26, 8); x.fillStyle = '#5fe39a'; x.fillRect(cx - 6, 444, 5, 4); }
        x.drawImage(lemon, 296, 420, 32, 32);
        // corazones que suben
        hearts = hearts.filter(hh => now - hh.t < 2600);
        hearts.forEach(hh => { const e = (now - hh.t) / 2600; if (e < 0) return; const hx = hh.x + Math.sin(e * 9) * 10 + hh.vx * e * 4, hy = hh.y - e * 360; x.globalAlpha = 1 - e; x.fillStyle = hh.c; x.beginPath(); x.moveTo(hx, hy + 6); x.arc(hx - 4, hy, 5, Math.PI * 0.75, Math.PI * 2); x.arc(hx + 4, hy, 5, Math.PI, Math.PI * 2.25); x.closePath(); x.fill(); x.globalAlpha = 1; });
        if (Math.random() < 0.04) heart(1);
        if (Math.random() < 0.08) views += Math.floor(Math.random() * 9);
        m.querySelector('.lv-views b').textContent = views >= 1000 ? (views / 1000).toFixed(1).replace('.', ',') + ' mil' : String(views);
        if (!done) raf = requestAnimationFrame(draw);
      }
      function close() {
        if (done) return; done = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout);
        UI.close(m); resolve();
      }
      m.querySelector('.lv-back').addEventListener('click', close);
      UI.open(m, e => { if (e.key === 'Escape' || e.key === 'Enter') close(); else if (e.key === ' ') { e.preventDefault(); tapHeart(); } });
      raf = requestAnimationFrame(draw);
    });
  }
  function mkLemon() {
    const c = document.createElement('canvas'); c.width = 8; c.height = 8; const g = c.getContext('2d');
    const rows = ['..gg....', '.yyyy...', 'yyYyyy..', 'yYyyyyy.', 'yyyyyyy.', '.yyyyyy.', '..yyyy..', '........'];
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; g.fillStyle = { g: '#5fe39a', y: '#c8f05a', Y: '#f4ffb0' }[ch]; g.fillRect(i, j, 1, 1); }));
    return c;
  }

  return { tick, trigger, open };
})();
