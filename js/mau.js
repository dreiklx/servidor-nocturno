/* =====================================================================
   MAU · el jefe final como giro de la historia
   Durante la noche, el Profe Mauricio guía a Kai por radio. En la Torre se revela que
   aprovechó el Gran Apagón para quedarse con el Servidor Central y usó a Kai para
   restaurar los cinco núcleos.
   Este archivo solo agrega presentación: escenas sobre el mapa real (cámara, luz,
   silueta, interferencias), el menú exclusivo, la apariencia del combate por acto,
   las transiciones y el epílogo. Las preguntas, la vida, la energía y el refuerzo
   siguen en game.js y ui.js sin cambios.
   El retrato de Mau se usa tal cual: la amenaza sale de la luz, las sombras y los datos.
   ===================================================================== */
window.MAU = (function () {
  const VW = 480, VH = 270;
  const G = () => window.GAMECINE;
  const ACTS = [
    { n: 'I', name: 'La máscara cae', topic: 'Transacciones y planificación', col: '#ffd34d' },
    { n: 'II', name: 'El verdadero Mau', topic: 'Respaldo y optimización', col: '#ff4d6d' },
    { n: 'III', name: 'El último servidor', topic: 'Distribuidas y NoSQL, más un repaso de todo', col: '#7ad7ff' }
  ];
  const VOICE = 'Voz en la oscuridad';
  const debug = { bar: null }; // para las pruebas: vida que muestra la barra del jefe
  let c = null, ui = null, entry = null, skipping = false, advance = null, stageName = '', titleEl = null;
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- utilidades de tiempo ---------------- */
  const wait = ms => new Promise(r => { if (skipping) return r(); const t = setTimeout(r, ms); const chk = setInterval(() => { if (skipping) { clearTimeout(t); clearInterval(chk); r(); } }, 60); setTimeout(() => clearInterval(chk), ms + 80); });
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  function tween(obj, key, to, ms) {
    return new Promise(r => {
      const from = obj[key], t0 = performance.now();
      if (skipping || ms <= 0) { obj[key] = to; return r(); }
      (function st(n) { if (skipping) { obj[key] = to; return r(); } const e = Math.min(1, (n - t0) / ms); obj[key] = from + (to - from) * ease(e); if (e < 1) requestAnimationFrame(st); else r(); })(t0);
    });
  }
  // la cámara deja el punto (wx, wy) del mundo en el centro de la pantalla
  function camTo(wx, wy, ms, zoom) {
    const cam = c.cam, tx = wx - VW / 2, ty = wy - VH / 2;
    const ps = [tween(cam, 'x', tx, ms), tween(cam, 'y', ty, ms)];
    if (zoom) ps.push(tween(c, 'zoom', zoom, ms));
    return Promise.all(ps);
  }
  function stage(n) { stageName = n; if (ui) ui.dataset.stage = n; }

  /* ---------------- capa de la escena (DOM) ---------------- */
  function begin(opt = {}) {
    skipping = false;
    const w = G().world();
    c = { cam: { x: w.cam.x, y: w.cam.y }, zoom: 1, dark: 0, letterbox: 0, static: 0, tint: null, tintA: 0, spot: null, flash: 0, boss: opt.boss || 'hidden', console: null, parts: [], stream: 0, storm: 0, dawn: 0, bossDX: 0, bossDY: 0, bossAlpha: 1, lightning: 0, glow: 0 };
    G().set(c);
    ui = UI.h('div', 'modal cine-ui');
    ui.innerHTML = `<div class="cine-sub" hidden><div class="cs-por"></div><div class="cs-body"><b class="cs-who"></b><p class="cs-text"></p></div><i class="cs-more">▼</i></div>
      <button class="cine-skip" ${opt.skippable ? '' : 'hidden'}>Saltar escena ▸▸</button><div class="mau-title" hidden></div>`;
    titleEl = ui.querySelector('.mau-title');
    ui.addEventListener('click', e => { if (e.target.closest('.cine-skip')) return; if (advance) advance(); });
    ui.querySelector('.cine-skip').addEventListener('click', e => { e.stopPropagation(); skipNow(); });
    entry = UI.open(ui, e => {
      if (['Enter', ' ', 'e', 'E'].includes(e.key)) { e.preventDefault(); if (advance) advance(); }
      else if (e.key === 'Escape' && opt.skippable) skipNow();
    });
    entry.win = () => skipNow(); // truco de prueba "ganar": termina la escena
  }
  function skipNow() { skipping = true; if (advance) advance(); }
  function end() {
    if (ui) { UI.close(ui); ui = null; }
    advance = null; skipping = false;
    G().set(null); c = null; stage('');
  }
  // subtítulo con retrato opcional; avanza solo o con un toque/Enter
  function say(who, text, por) {
    return new Promise(r => {
      if (skipping) return r();
      const box = ui.querySelector('.cine-sub'), tx = ui.querySelector('.cs-text'), pw = ui.querySelector('.cs-por');
      box.hidden = false; box.classList.toggle('voice', who === VOICE); box.classList.toggle('kai', who === 'Kai');
      ui.querySelector('.cs-who').textContent = who;
      pw.innerHTML = ''; if (por) pw.appendChild(SPR.scaled(por, 3)); pw.hidden = !por;
      let i = 0, done = false, timer = 0, auto = 0;
      const full = () => { clearInterval(timer); tx.textContent = text; ui.querySelector('.cs-more').style.visibility = 'visible'; auto = setTimeout(finish, 1500 + text.length * 32); };
      const finish = () => { if (done) return; done = true; clearTimeout(auto); clearInterval(timer); advance = null; box.hidden = true; r(); };
      ui.querySelector('.cs-more').style.visibility = 'hidden';
      tx.textContent = '';
      timer = setInterval(() => { i += 2; tx.textContent = text.slice(0, i); if (i % 8 === 0 && AUDIO.fx.talk) AUDIO.fx.talk(); if (i >= text.length) full(); }, 24);
      advance = () => { if (skipping) return finish(); if (tx.textContent.length < text.length) full(); else finish(); };
    });
  }
  async function title(top, big, sub, ms = 2600) {
    if (skipping) return;
    titleEl.innerHTML = `<small>${top}</small><b data-t="${big}">${big}</b><span>${sub}</span>`;
    titleEl.hidden = false; titleEl.classList.remove('go'); void titleEl.offsetWidth; titleEl.classList.add('go');
    await wait(ms);
    titleEl.classList.add('out'); await wait(380); titleEl.hidden = true; titleEl.classList.remove('out', 'go');
  }
  const mauP = () => SPR.mauPortrait(), kaiP = () => SPR.kaiPortrait();

  /* ---------------- dibujo sobre el mapa (lo llama game.js en cada cuadro) ---------------- */
  let shadowCv = null, darkCv = null;
  function shadow() {
    if (shadowCv) return shadowCv;
    const src = SPR.mauricio(), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
    const x = cv.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#07060d'; x.fillRect(0, 0, cv.width, cv.height);
    return (shadowCv = cv);
  }
  function tinted(col) { const src = SPR.mauricio(), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; const x = cv.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, cv.width, cv.height); return cv; }
  function toScreen(wx, wy, ox, oy, z) { return { x: (wx - ox - VW / 2) * z + VW / 2, y: (wy - oy - VH / 2) * z + VH / 2 }; }
  function overlay(g, ox, oy, z) {
    if (!c) return;
    const now = performance.now(), w = G().world();
    // tinte de color del acto
    if (c.tint && c.tintA > 0) { g.globalAlpha = c.tintA; g.fillStyle = c.tint; g.fillRect(0, 0, VW, VH); g.globalAlpha = 1; }
    // amanecer
    if (c.dawn > 0) { const gr = g.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, `rgba(255,170,90,${0.05 * c.dawn})`); gr.addColorStop(1, `rgba(255,140,60,${0.3 * c.dawn})`); g.fillStyle = gr; g.fillRect(0, 0, VW, VH); }
    // oscuridad con foco
    if (c.dark > 0) {
      if (!darkCv) { darkCv = document.createElement('canvas'); darkCv.width = VW; darkCv.height = VH; }
      const d = darkCv.getContext('2d');
      d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, VW, VH); d.fillStyle = `rgba(2,2,8,${c.dark})`; d.fillRect(0, 0, VW, VH);
      if (c.peek > 0) { // resplandor tenue de interferencia: deja intuir el sector que muestra la cámara
        d.globalCompositeOperation = 'destination-out';
        const pg = d.createRadialGradient(VW / 2, VH / 2, 10, VW / 2, VH / 2, 150); pg.addColorStop(0, `rgba(0,0,0,${c.peek})`); pg.addColorStop(1, 'rgba(0,0,0,0)');
        d.fillStyle = pg; d.fillRect(0, 0, VW, VH); d.globalCompositeOperation = 'source-over';
      }
      if (c.spot && w.boss) {
        const p = toScreen(w.boss.x + c.bossDX, w.boss.y - 14 + c.bossDY, ox, oy, z), r = c.spot.r * z;
        d.globalCompositeOperation = 'destination-out';
        const gr = d.createRadialGradient(p.x, p.y, r * 0.15, p.x, p.y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        d.fillStyle = gr; d.beginPath(); d.arc(p.x, p.y, r, 0, 7); d.fill();
        // cono de luz desde el techo
        const cg = d.createLinearGradient(0, 0, 0, p.y); cg.addColorStop(0, 'rgba(0,0,0,0.05)'); cg.addColorStop(1, 'rgba(0,0,0,0.55)');
        d.fillStyle = cg; d.beginPath(); d.moveTo(p.x - 10 * z, 0); d.lineTo(p.x + 10 * z, 0); d.lineTo(p.x + r * 0.75, p.y + r * 0.35); d.lineTo(p.x - r * 0.75, p.y + r * 0.35); d.closePath(); d.fill();
      }
      g.drawImage(darkCv, 0, 0);
      if (c.spot && w.boss) { // halo cálido sobre Mau
        const p = toScreen(w.boss.x + c.bossDX, w.boss.y - 14 + c.bossDY, ox, oy, z);
        const hg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, c.spot.r * z); hg.addColorStop(0, c.spot.c || 'rgba(255,220,150,0.16)'); hg.addColorStop(1, 'rgba(255,220,150,0)');
        g.fillStyle = hg; g.fillRect(0, 0, VW, VH);
      }
    }
    // datos que fluyen hacia Mau (acto III) o se dispersan (derrota)
    if (c.stream && w.boss) {
      const p = toScreen(w.boss.x + c.bossDX, w.boss.y - 14, ox, oy, z);
      if (c.parts.length < 70 && Math.random() < c.stream) { const a = Math.random() * 6.28, R = 180 + Math.random() * 80; c.parts.push({ x: p.x + Math.cos(a) * R, y: p.y + Math.sin(a) * R, t: now, col: Math.random() < 0.5 ? '#7ad7ff' : '#ff4d6d' }); }
      c.parts = c.parts.filter(q => { const e = (now - q.t) / 1100; if (e >= 1) return false; const k = ease(e); const x = q.x + (p.x - q.x) * k, y = q.y + (p.y - q.y) * k; g.fillStyle = q.col; g.globalAlpha = 1 - e * 0.6; g.fillRect(x, y, 2, 2); return true; });
      g.globalAlpha = 1;
    }
    if (c.burst && c.burst.length) {
      c.burst = c.burst.filter(q => { q.x += q.vx; q.y += q.vy; q.l -= 0.012; if (q.l <= 0) return false; g.globalAlpha = q.l; g.fillStyle = q.col; g.fillRect(q.x, q.y, 2, 2); return true; });
      g.globalAlpha = 1;
    }
    // tormenta y relámpagos
    if (c.storm) {
      g.strokeStyle = 'rgba(170,200,255,0.25)'; g.lineWidth = 1;
      for (let i = 0; i < 40 * c.storm; i++) { const x = (i * 97 + now * 0.35) % (VW + 40) - 20, y = (i * 53 + now * 0.6) % VH; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 8); g.stroke(); }
    }
    if (c.lightning > 0) { g.fillStyle = `rgba(220,230,255,${c.lightning})`; g.fillRect(0, 0, VW, VH); c.lightning = Math.max(0, c.lightning - 0.05); }
    // interferencia: franjas, desgarros y nieve
    if (c.static > 0) {
      const n = Math.floor(c.static * 14);
      for (let i = 0; i < n; i++) {
        const y = Math.random() * VH, h = 1 + Math.random() * 6 * c.static;
        if (Math.random() < 0.5) { const dx = (Math.random() - 0.5) * 24 * c.static; try { g.drawImage(g.canvas, 0, y * (g.canvas.width / VW), g.canvas.width, h * (g.canvas.width / VW), dx, y, VW, h); } catch (e) { /* ignorar */ } }
        else { g.fillStyle = Math.random() < 0.5 ? 'rgba(122,215,255,0.18)' : 'rgba(255,77,109,0.16)'; g.fillRect(0, y, VW, h); }
      }
      g.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 60 * c.static; i++) g.fillRect(Math.random() * VW, Math.random() * VH, 1, 1);
    }
    // líneas de barrido (muy suaves) y viñeta
    if (c.letterbox > 0 || c.dark > 0) { g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < VH; y += 3) g.fillRect(0, y, VW, 1); }
    if (c.flash > 0) { g.fillStyle = `rgba(255,250,235,${c.flash})`; g.fillRect(0, 0, VW, VH); c.flash = Math.max(0, c.flash - 0.04); }
    if (c.letterbox > 0) { const b = Math.round(32 * c.letterbox); g.fillStyle = '#000'; g.fillRect(0, 0, VW, b); g.fillRect(0, VH - b, VW, b); }
  }

  /* ---------------- 1) la revelación ---------------- */
  async function reveal({ first = true, lines = [] } = {}) {
    begin({ skippable: !first });
    const w = G().world(), B = w.boss, kaiAt = { x: w.player.x, y: w.player.y };
    stage('room');
    c.console = '#5fe39a';
    await Promise.all([tween(c, 'letterbox', 1, 700), camTo(B.x, B.y + 26, 1200)]);
    await say('Kai', '¿Profe? Ya llegué a la cima.', kaiP());
    await say('Kai', 'La consola del Servidor Central está encendida... pero aquí no hay nadie.', kaiP());
    // las luces se apagan
    stage('dimming');
    AUDIO.music(null); AUDIO.ambient(null); AUDIO.fx.powerDown && AUDIO.fx.powerDown();
    for (let i = 0; i < 7 && !skipping; i++) { c.dark = 0.25 + i * 0.09 + (i % 2 ? 0.18 : 0); if (i === 2 || i === 5) AUDIO.fx.zap(); await wait(i % 2 ? 140 : 300); }
    await tween(c, 'dark', 0.94, 1300);
    c.console = '#ff4d6d'; c.static = 0.18;
    stage('dark');
    AUDIO.music('suspenso');
    await wait(1500);
    // la voz, sin cuerpo; la cámara recorre la habitación
    stage('voice');
    c.peek = 0.42;
    camTo(104, 84, 2600, 1.5);
    await say(VOICE, 'Cinco núcleos restaurados. Uno por uno... tal como le pedí.');
    AUDIO.fx.zap(); c.static = 0.4; await wait(250); c.static = 0.18;
    camTo(312, 84, 2600, 1.5);
    await say(VOICE, 'Le dije que viera las enseñanzas con calma, que después se lo preguntaba. ¿Se acuerda?');
    camTo(B.x, 170, 2400, 1.4);
    AUDIO.fx.heart && AUDIO.fx.heart();
    await say(VOICE, 'Usted creyó que yo lo estaba guiando para salvar el puerto.');
    await camTo(B.x, B.y - 6, 1400, 1.2);
    // silencio
    stage('silence');
    AUDIO.music(null); c.static = 0; c.dark = 0.97; c.peek = 0;
    await wait(1700);
    // el interruptor
    AUDIO.fx.click(); await wait(500);
    stage('silhouette');
    c.boss = 'silhouette'; c.spot = { r: 44, c: 'rgba(255,230,180,0.12)' }; c.flash = 0.25; AUDIO.fx.lightOn();
    await wait(1400);
    // la cámara se acerca despacio
    stage('approach');
    AUDIO.fx.heart && AUDIO.fx.heart();
    const beat = setInterval(() => { if (!skipping && AUDIO.fx.heart) AUDIO.fx.heart(); }, 950);
    await camTo(B.x, B.y - 16, 3000, 2.3);
    clearInterval(beat);
    // revelación
    stage('reveal');
    AUDIO.fx.boom(); c.flash = 0.85; c.boss = 'shown'; c.spot = { r: 64, c: 'rgba(255,90,110,0.18)' }; c.dark = 0.8;
    AUDIO.music('menu');
    await wait(1100);
    await say('Profe Mauricio', lines[0] || 'Buenas noches, Kai.', mauP());
    await say('Profe Mauricio', 'El rayo no fue cosa mía. Pero un apagón así... no se desperdicia.', mauP());
    await say('Profe Mauricio', 'Con los núcleos caídos, ni yo podía tocar el Servidor Central. Necesitaba a alguien que los restaurara, uno por uno.', mauP());
    await say('Profe Mauricio', 'Alguien que aprendiera justo lo necesario. Y usted, Kai, es un excelente estudiante.', mauP());
    camTo(B.x, B.y + 6, 1500, 1.5);
    await say('Kai', '¿Todo esto... para quedarse con el servidor?', kaiP());
    await say('Profe Mauricio', 'Para que el puerto deje de depender de gente que no respalda nada. Desde esta Torre, cada COMMIT y cada permiso pasan por mí.', mauP());
    await say('Profe Mauricio', lines[1] || 'Ahora quiero ver si de verdad entendió.', mauP());
    await say('Profe Mauricio', lines[2] || 'Son tres actos.', mauP());
    stage('title');
    AUDIO.fx.riser(); c.static = 0.3; await wait(1300); c.static = 0.12;
    AUDIO.fx.boom(); c.flash = 0.6;
    await title('JEFE FINAL', 'MAU', 'El último servidor', 3000);
    // estado final aunque se haya saltado
    c.boss = 'shown';
    G().setPlayer({ x: kaiAt.x, y: kaiAt.y, dir: 'up', moving: false });
    end();
  }

  /* ---------------- 2) menú exclusivo antes de cada acto ---------------- */
  function menu(a) {
    return new Promise(resolve => {
      const S = G().state(), A = ACTS[a] || ACTS[0];
      AUDIO.music('menu');
      const m = UI.h('div', 'modal mau-menu act-' + (a + 1));
      m.innerHTML = `<canvas width="960" height="540" aria-hidden="true"></canvas>
        <div class="mm-ui">
          <div class="mm-top"><span class="mm-tag">JEFE FINAL</span><span class="mm-place">Torre del Servidor Central · 4:45 a. m.</span></div>
          <h2 class="mm-name" data-t="MAU">MAU</h2>
          <div class="mm-sub">El último servidor</div>
          <ol class="mm-acts">${ACTS.map((x, i) => `<li class="${i < a ? 'done' : i === a ? 'now' : ''}"><b>${x.n}</b><span>${x.name}</span></li>`).join('')}</ol>
          <div class="mm-info"><div class="mm-act">ACTO ${A.n} · ${A.name.toUpperCase()}</div><div class="mm-topic">${A.topic}</div>
            <div class="mm-hp">Energía de Kai <span>${'<i></i>'.repeat(S.hearts)}${'<i class="e"></i>'.repeat(Math.max(0, S.maxHearts - S.hearts))}</span></div></div>
          <button class="mm-go">COMENZAR ACTO ${A.n} <kbd>Enter</kbd></button>
        </div>`;
      const cv = m.querySelector('canvas'), x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
      const spr = SPR.mauricio(), sh = shadow(), rim = tinted(A.col), t0 = performance.now();
      const bits = Array.from({ length: 46 }, (_, i) => ({ x: Math.random() * 960, y: Math.random() * 540, v: 0.4 + Math.random() * 1.4, s: Math.random() < 0.2 ? 3 : 2 }));
      let raf = 0, done = false;
      function draw(now) {
        const t = (now - t0) / 1000, col = A.col;
        const gr = x.createRadialGradient(660, 250, 40, 660, 250, 620); gr.addColorStop(0, a === 1 ? '#2a0a14' : a === 2 ? '#081a2a' : '#1c1530'); gr.addColorStop(1, '#030308');
        x.fillStyle = gr; x.fillRect(0, 0, 960, 540);
        // columnas de datos
        x.fillStyle = col; bits.forEach(b => { b.y += b.v * (a + 1); if (b.y > 540) { b.y = -10; b.x = Math.random() * 960; } x.globalAlpha = 0.15 + 0.25 * Math.sin(t * 2 + b.x); x.fillRect(b.x, b.y, b.s, b.s * 4); });
        x.globalAlpha = 1;
        // Mau: silueta y un haz de luz que lo recorre (su retrato no se altera)
        const S2 = 18, mw = spr.width * S2, mh = spr.height * S2, mx = 660 - mw / 2, my = 520 - mh;
        x.fillStyle = 'rgba(0,0,0,0.5)'; x.beginPath(); x.ellipse(660, 520, mw * 0.45, 22, 0, 0, 7); x.fill();
        x.globalAlpha = 0.55 + 0.25 * Math.sin(t * 2); [[-4, 0], [4, 0], [0, -4]].forEach(([dx, dy]) => x.drawImage(rim, mx + dx, my + dy, mw, mh)); x.globalAlpha = 1;
        x.drawImage(sh, mx, my, mw, mh);
        const beam = 660 + Math.sin(t * 0.7) * 170;
        x.save(); x.beginPath(); x.rect(beam - 70, 0, 140, 540); x.clip(); x.globalAlpha = 0.9; x.drawImage(spr, mx, my, mw, mh); x.restore();
        const hg = x.createLinearGradient(beam - 90, 0, beam + 90, 0); hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(0.5, col === '#ff4d6d' ? 'rgba(255,90,110,0.18)' : 'rgba(255,230,170,0.16)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = hg; x.fillRect(beam - 90, 0, 180, 540);
        // contraluz
        x.globalCompositeOperation = 'lighter'; const rg = x.createRadialGradient(660, my + 40, 10, 660, my + 80, 300); rg.addColorStop(0, col + '33'); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(300, 0, 660, 540); x.globalCompositeOperation = 'source-over';
        // interferencia ocasional
        if (Math.sin(t * 3.1) > 0.97 && !reduce()) { for (let i = 0; i < 5; i++) { const y = Math.random() * 540, h = 4 + Math.random() * 14; x.drawImage(cv, 0, y, 960, h, (Math.random() - 0.5) * 30, y, 960, h); } }
        x.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < 540; y += 4) x.fillRect(0, y, 960, 2);
        if (!done) raf = requestAnimationFrame(draw);
      }
      function go() {
        if (done) return; done = true; cancelAnimationFrame(raf);
        AUDIO.fx.boom(); m.classList.add('leaving');
        setTimeout(() => { UI.close(m); resolve(); }, reduce() ? 0 : 420);
      }
      m.querySelector('.mm-go').addEventListener('click', go);
      const en = UI.open(m, e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      en.win = go;
      stage('menu');
      raf = requestAnimationFrame(draw);
      setTimeout(() => { const b = m.querySelector('.mm-go'); if (b) b.focus({ preventScroll: true }); }, 60);
    });
  }

  /* ---------------- 3) apariencia del combate por acto ---------------- */
  function battleFx(a) {
    const A = ACTS[a] || ACTS[0];
    const motes = Array.from({ length: a === 2 ? 34 : 22 }, () => ({ x: Math.random() * 480, y: Math.random() * 340, v: 0.2 + Math.random() * 0.6 }));
    const servers = [30, 72, 408, 450];
    let glitchT = 0, flashT = 0, nextBolt = performance.now() + 3500;
    let vig = null;
    function vignette() {
      if (vig) return vig;
      vig = document.createElement('canvas'); vig.width = 480; vig.height = 340; const v = vig.getContext('2d');
      const gr = v.createRadialGradient(240, 170, 120, 240, 170, 330); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)'); v.fillStyle = gr; v.fillRect(0, 0, 480, 340);
      return vig;
    }
    return {
      back(x, t, St, now) {
        // tinte del acto
        x.fillStyle = a === 0 ? 'rgba(20,8,40,0.45)' : a === 1 ? 'rgba(60,0,16,0.5)' : 'rgba(2,18,44,0.78)'; x.fillRect(-10, -10, 500, 360);
        if (a === 2) { // cima de la torre: tormenta y servidores encendidos
          const sky = x.createLinearGradient(0, 0, 0, 120); sky.addColorStop(0, 'rgba(70,110,170,0.35)'); sky.addColorStop(1, 'rgba(70,110,170,0)'); x.fillStyle = sky; x.fillRect(-10, -10, 500, 130);
          for (let k = 0; k < 7; k++) { x.fillStyle = 'rgba(20,34,60,0.8)'; x.beginPath(); x.ellipse((k * 83 + t * 6) % 560 - 40, 18 + (k % 3) * 9, 60, 16, 0, 0, 7); x.fill(); }
          for (const sx of servers) { x.fillStyle = '#16233e'; x.fillRect(sx - 14, 60, 28, 170); x.strokeStyle = 'rgba(122,215,255,0.55)'; x.lineWidth = 1.5; x.strokeRect(sx - 14, 60, 28, 170); for (let k = 0; k < 9; k++) { x.fillStyle = (k + Math.floor(t * 6) + sx) % 4 ? 'rgba(122,215,255,0.5)' : 'rgba(255,77,109,0.7)'; x.fillRect(sx - 9, 70 + k * 17, 4, 3); } }
          if (now > nextBolt && !reduce()) { flashT = now; nextBolt = now + 2600 + Math.random() * 3000; if (AUDIO.fx.thunder) AUDIO.fx.thunder(); }
        }
        if (a === 1) { // columnas rojas de datos
          x.fillStyle = 'rgba(255,77,109,0.16)'; for (let i = 0; i < 16; i++) { const cx = (i * 31 + 7) % 480, h = 40 + ((i * 53) % 90); x.fillRect(cx, ((t * 60 * (1 + i % 3)) + i * 40) % 380 - 40, 2, h); }
        }
        // foco desde arriba sobre Mau
        const cg = x.createLinearGradient(0, 0, 0, 190); cg.addColorStop(0, 'rgba(255,230,180,0)'); cg.addColorStop(1, a === 1 ? 'rgba(255,80,100,0.2)' : a === 2 ? 'rgba(122,215,255,0.18)' : 'rgba(255,220,150,0.18)');
        x.fillStyle = cg; x.beginPath(); x.moveTo(320, -10); x.lineTo(360, -10); x.lineTo(430, 190); x.lineTo(250, 190); x.closePath(); x.fill();
        // aura de datos alrededor de Mau
        const pulse = 0.5 + 0.5 * Math.sin(t * (2 + a));
        const ag = x.createRadialGradient(340, 120, 10, 340, 120, 90 + a * 12); ag.addColorStop(0, A.col + (a === 0 ? '30' : '44')); ag.addColorStop(1, 'rgba(0,0,0,0)');
        x.globalAlpha = 0.6 + 0.4 * pulse; x.fillStyle = ag; x.fillRect(220, 0, 240, 240); x.globalAlpha = 1;
        motes.forEach(m => { m.y -= m.v * (1 + a * 0.6); if (m.y < -4) { m.y = 344; m.x = Math.random() * 480; } x.fillStyle = A.col; x.globalAlpha = 0.25; x.fillRect(m.x, m.y, 2, 2); });
        x.globalAlpha = 1;
      },
      front(x, t, St, now) {
        if (a === 2) { x.strokeStyle = 'rgba(170,200,255,0.18)'; x.lineWidth = 1; for (let i = 0; i < 26; i++) { const rx = (i * 97 + now * 0.4) % 520 - 20, ry = (i * 61 + now * 0.7) % 340; x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - 3, ry + 9); x.stroke(); } }
        const ft = (now - flashT) / 300; if (ft < 1) { x.fillStyle = `rgba(220,230,255,${0.45 * (1 - ft)})`; x.fillRect(0, 0, 480, 340); }
        const gt = (now - glitchT) / 260;
        if (gt < 1) { for (let i = 0; i < 6; i++) { const y = Math.random() * 340, h = 2 + Math.random() * 8; x.fillStyle = Math.random() < 0.5 ? 'rgba(122,215,255,0.25)' : 'rgba(255,77,109,0.25)'; x.fillRect(0, y, 480, h); } }
        x.drawImage(vignette(), 0, 0);
      },
      foeBar(x, ratio, hp, max, t) {
        debug.bar = { act: a, hp, max };
        const X = 14, Y = 14, W2 = 232;
        x.fillStyle = 'rgba(8,6,16,0.92)'; x.fillRect(X, Y, W2, 62); x.strokeStyle = A.col; x.lineWidth = 2; x.strokeRect(X, Y, W2, 62);
        x.fillStyle = A.col; x.font = '20px "Pixelify Sans", monospace'; x.textAlign = 'left'; x.textBaseline = 'top'; x.fillText('MAU', X + 10, Y + 6);
        x.fillStyle = '#c9c4e8'; x.font = '10px "Pixelify Sans", monospace'; x.fillText(`ACTO ${A.n} · ${A.name.toUpperCase()}`, X + 62, Y + 12);
        // indicador de actos
        ACTS.forEach((_, i) => { x.fillStyle = i < a ? '#5a5070' : i === a ? A.col : '#2a2440'; x.fillRect(X + W2 - 54 + i * 16, Y + 9, 12, 12); x.fillStyle = '#05040a'; x.font = '8px "Pixelify Sans", monospace'; x.textAlign = 'center'; x.fillText(['I', 'II', 'III'][i], X + W2 - 48 + i * 16, Y + 11); });
        // barra segmentada (un segmento por pregunta del acto)
        const bw = W2 - 20, segs = Math.max(1, max), gap = 2, sw = (bw - gap * (segs - 1)) / segs;
        for (let i = 0; i < segs; i++) {
          const fill = Math.max(0, Math.min(1, ratio * segs - i));
          x.fillStyle = '#1d1830'; x.fillRect(X + 10 + i * (sw + gap), Y + 36, sw, 12);
          if (fill > 0) { x.fillStyle = A.col; x.globalAlpha = 0.85 + 0.15 * Math.sin(t * 5 + i); x.fillRect(X + 10 + i * (sw + gap), Y + 36, sw * fill, 12); x.globalAlpha = 1; }
        }
        x.fillStyle = '#8a84b0'; x.font = '9px "Pixelify Sans", monospace'; x.textAlign = 'right'; x.fillText(`${Math.max(0, hp)}/${max}`, X + W2 - 10, Y + 50);
        x.textAlign = 'left';
      },
      hit(who) { glitchT = performance.now(); if (who === 'foe' && AUDIO.fx.glitch) AUDIO.fx.glitch(); }
    };
  }

  /* ---------------- 4) transiciones entre actos ---------------- */
  async function transition(a, { seen = false } = {}) {
    begin({ skippable: seen, boss: 'shown' });
    const w = G().world(), B = w.boss;
    c.console = '#ff4d6d'; c.spot = { r: 60 }; c.dark = 0.45;
    AUDIO.music(null);
    await Promise.all([tween(c, 'letterbox', 1, 500), camTo(B.x, B.y - 8, 900, 1.6)]);
    if (a === 1) {
      stage('act2');
      AUDIO.fx.powerDown(); c.static = 0.5;
      for (let i = 0; i < 5 && !skipping; i++) { c.dark = i % 2 ? 0.9 : 0.5; await wait(120); }
      c.tint = '#ff1f4a'; await tween(c, 'tintA', 0.28, 900); c.static = 0.2; c.dark = 0.7; c.spot = { r: 64, c: 'rgba(255,60,90,0.22)' };
      AUDIO.music('suspenso');
      await say('Profe Mauricio', 'Nada mal. Ya no tengo que fingir que estoy de su lado.', mauP());
      await say('Profe Mauricio', 'Toda la noche le dije qué estudiar en cada zona. ¿Nunca se preguntó cómo sabía yo lo que venía?', mauP());
      AUDIO.fx.riser(); await wait(1200); AUDIO.fx.boom(); c.flash = 0.6;
      await title('ACTO II', 'EL VERDADERO MAU', 'Respaldo y optimización', 2400);
    } else {
      stage('act3');
      AUDIO.fx.thunder(); c.lightning = 0.9; c.storm = 1; c.tint = '#0a2a4a'; c.tintA = 0.3; c.dark = 0.6; c.spot = { r: 70, c: 'rgba(122,215,255,0.2)' };
      AUDIO.music('suspenso');
      c.stream = 0.7;
      await camTo(B.x, B.y - 12, 1600, 2);
      await say('Profe Mauricio', 'Cada núcleo que usted encendió me devolvió un permiso. Ya casi los tengo todos.', mauP());
      AUDIO.fx.thunder(); c.lightning = 0.8;
      await say('Profe Mauricio', 'Última prueba, Kai. Si falla, el Servidor Central es mío. Para siempre.', mauP());
      AUDIO.fx.riser(); await wait(1200); AUDIO.fx.boom(); c.flash = 0.7; c.lightning = 0.6;
      await title('ACTO III', 'EL ÚLTIMO SERVIDOR', 'Distribuidas, NoSQL y un repaso de todo', 2400);
    }
    end();
  }

  /* ---------------- 5) epílogo ---------------- */
  async function epilogue({ win = [] } = {}) {
    begin({ skippable: false, boss: 'shown' });
    const w = G().world(), B = w.boss;
    c.console = '#ff4d6d'; c.spot = { r: 70, c: 'rgba(122,215,255,0.2)' }; c.dark = 0.6; c.tint = '#0a2a4a'; c.tintA = 0.25; c.stream = 0.6;
    AUDIO.music(null); AUDIO.ambient(null);
    stage('defeat');
    await Promise.all([tween(c, 'letterbox', 1, 500), camTo(B.x, B.y - 10, 900, 1.8)]);
    // derrota: los datos lo abandonan, la luz parpadea y se aparta de la consola
    c.stream = 0; c.static = 0.45; AUDIO.fx.powerDown(); AUDIO.fx.glitch();
    const w2 = G().world(), p0 = { x: VW / 2, y: VH / 2 - 10 };
    c.burst = Array.from({ length: 60 }, () => { const a2 = Math.random() * 6.28, v = 0.6 + Math.random() * 2.2; return { x: p0.x, y: p0.y, vx: Math.cos(a2) * v, vy: Math.sin(a2) * v, l: 1, col: Math.random() < 0.5 ? '#7ad7ff' : '#ff4d6d' }; });
    for (let i = 0; i < 8 && !skipping; i++) { c.bossAlpha = i % 2 ? 0.35 : 1; await wait(110); }
    c.bossAlpha = 1; c.static = 0.08;
    await Promise.all([tween(c, 'bossDX', -34, 1300), tween(c, 'tintA', 0, 1300), tween(c, 'dark', 0.5, 1300)]);
    await wait(500);
    await say('Profe Mauricio', '...Supongo que sí entendió.', mauP());
    await say('Profe Mauricio', win[0] || 'Kai, aprobó la prueba de la Torre.', mauP());
    await say('Profe Mauricio', 'Pero el Servidor Central todavía responde a mi usuario. Sin mis permisos, aquí no arranca nada.', mauP());
    await say('Kai', 'Entonces vamos a cambiar los permisos. Usted mismo me enseñó cómo.', kaiP());
    // Kai camina hasta la consola
    stage('walk');
    const P0 = G().world().player, cx = B.x, cy = 3 * 16 + 14;
    await camTo(cx, cy + 10, 900, 1.6);
    const steps = 18;
    for (let i = 1; i <= steps && !skipping; i++) { G().setPlayer({ x: P0.x + (cx - P0.x) * i / steps, y: P0.y + (cy - P0.y) * i / steps, dir: 'up', moving: true, frame: i % 2 }); if (i % 3 === 0 && AUDIO.fx.step) AUDIO.fx.step(); await wait(55); }
    G().setPlayer({ x: cx, y: cy, dir: 'up', moving: false, frame: 0 });
    // recuperar el control
    stage('control');
    await control();
    c.console = '#7ad7ff'; c.dark = 0.2; c.spot = null; c.flash = 0.7; AUDIO.fx.restore();
    AUDIO.music('epilogo');
    stage('dawn');
    tween(c, 'dawn', 1, 4000); tween(c, 'dark', 0, 2500);
    await camTo(B.x - 10, B.y + 10, 1800, 1.3);
    await say('Profe Mauricio', '...Revocado. Limpio. Bien hecho.', mauP());
    await say('Erika Ceviches', '¡Kai! Desde la recepción se ve la Torre en azul. ¡Se encendió todo el puerto!', SPR.erikaPortrait());
    await say('Kai', 'El profe ya no tiene permisos sobre nada. El servidor vuelve a ser de todos.', kaiP());
    await say('Erika Ceviches', 'Pues que baje. Le guardé un ceviche... y le toca dar muchas explicaciones.', SPR.erikaPortrait());
    await say('Profe Mauricio', win[2] || 'Ahora vaya a descansar... pero antes, respalde. Siempre respalde.', mauP());
    stage('end');
    await title('AMANECE', 'PUERTO NYDER', 'El Servidor Central vuelve a ser de todos', 3200);
    await tween(c, 'letterbox', 0, 500);
    end();
  }

  // el panel del Servidor Central: Kai le quita el control a Mau, núcleo por núcleo
  function control() {
    return new Promise(resolve => {
      const cores = ['Muelle', 'Estación', 'Bóveda', 'Mercado', 'Archipiélago'];
      const pos = cores.map((_, i) => { const a = -Math.PI / 2 + i * (Math.PI * 2 / 5); return { x: 300 + Math.cos(a) * 190, y: 205 + Math.sin(a) * 150 }; });
      const m = UI.h('div', 'modal mau-control');
      m.innerHTML = `<div class="mc-head"><span>SERVIDOR CENTRAL · PERMISOS</span><b class="mc-owner">Propietario: <em>mauricio</em></b></div>
        <svg viewBox="0 0 600 410" aria-label="El Servidor Central y los cinco núcleos">
          ${pos.map((p, i) => `<line class="mc-link" data-i="${i}" x1="300" y1="205" x2="${p.x}" y2="${p.y}"/>`).join('')}
          <g class="mc-tower"><circle cx="300" cy="205" r="44"/><text x="300" y="200">SERVIDOR</text><text x="300" y="216">CENTRAL</text></g>
          ${pos.map((p, i) => `<g class="mc-core" data-i="${i}" transform="translate(${p.x} ${p.y})"><circle r="30"/><text y="-2">${cores[i]}</text><text class="who" y="13">mauricio</text><g class="lock" transform="translate(${(300 - p.x) * 0.45} ${(205 - p.y) * 0.45})"><rect x="-9" y="-6" width="18" height="14" rx="2"/><path d="M-5 -6 v-5 a5 5 0 0 1 10 0 v5"/></g></g>`).join('')}
        </svg>
        <div class="mc-cmd" aria-live="polite"></div>
        <button class="mc-go">RECUPERAR EL CONTROL <kbd>Enter</kbd></button>`;
      let running = false;
      const typeCmd = async text => { const el = m.querySelector('.mc-cmd'); el.textContent = ''; for (let i = 0; i <= text.length; i++) { el.textContent = text.slice(0, i); if (i % 3 === 0 && AUDIO.fx.talk) AUDIO.fx.talk(); await new Promise(r => setTimeout(r, skipping ? 0 : 22)); } };
      async function run() {
        if (running) return; running = true;
        const b = m.querySelector('.mc-go'); b.disabled = true; b.textContent = 'Recuperando el control...';
        await typeCmd('REVOKE ALL ON servidor_central FROM mauricio;');
        for (let i = 0; i < cores.length; i++) {
          m.querySelector(`.mc-core[data-i="${i}"]`).classList.add('free');
          m.querySelector(`.mc-link[data-i="${i}"]`).classList.add('free');
          m.querySelector(`.mc-core[data-i="${i}"] .who`).textContent = 'puerto_nyder';
          AUDIO.fx.unlock(); if (c) c.flash = 0.15;
          await new Promise(r => setTimeout(r, skipping ? 0 : 520));
        }
        await typeCmd('GRANT CONNECT ON servidor_central TO puerto_nyder;');
        m.querySelector('.mc-tower').classList.add('free');
        m.querySelector('.mc-owner').innerHTML = 'Propietario: <em class="ok">puerto_nyder</em> · control restaurado';
        await new Promise(r => setTimeout(r, skipping ? 0 : 1400));
        UI.close(m); resolve();
      }
      m.querySelector('.mc-go').addEventListener('click', run);
      const en = UI.open(m, e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } });
      en.win = () => { skipping = true; run(); };
      setTimeout(() => { const b = m.querySelector('.mc-go'); if (b) b.focus({ preventScroll: true }); }, 60);
    });
  }

  /* ---------------- 6) la radio de Mau al cerrar cada fase (pistas) ---------------- */
  const RADIO = {
    1: ['Kai, ¿me copia? Núcleo uno en línea. Excelente. Ese es el primero... de cinco.'],
    2: ['Núcleo dos. Los trenes ya obedecen otra vez.', 'Es increíble lo fácil que es dirigir algo cuando todos siguen el horario.'],
    3: ['Núcleo tres. Los respaldos de la bóveda ya están en mis manos... digo, a salvo.', 'Siga así.'],
    4: ['Núcleo cuatro. Todas las consultas del mercado vuelven a pasar por la Torre.', 'Así me gusta: todo por un solo lugar.'],
    5: ['Los cinco núcleos. Suba, Kai.', 'Ya casi tengo todo lo que necesito... para encender el servidor.']
  };
  async function radio(n) {
    if (!RADIO[n]) return;
    if (AUDIO.fx.zap) AUDIO.fx.zap();
    stage('radio');
    await UI.dialog(RADIO[n], { name: 'Profe Mauricio · por radio', portrait: SPR.mauPortrait() });
    stage('');
  }

  return { overlay, shadow, reveal, menu, battleFx, transition, epilogue, radio, ACTS, get stage() { return stageName; }, get active() { return !!c; }, debug };
})();
