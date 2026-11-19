/* Interfaz en DOM sobre el canvas: diálogos, pizarras, combates, menús y libreta. */
window.UI = (function () {
  const stack = [];
  let layer, toastBox;
  const AUTO = /[?&]autotest=1/.test(location.search);
  const wait = ms => new Promise(r => setTimeout(r, AUTO ? 0 : ms));

  function init() { layer = document.getElementById('layer'); toastBox = document.getElementById('toast'); }
  function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function open(el, onKey) {
    layer.appendChild(el); const entry = { el, onKey }; stack.push(entry);
    if (AUTO) el.classList.add('in'); else requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    return entry;
  }
  function close(el) {
    const i = stack.findIndex(s => s.el === el); if (i >= 0) stack.splice(i, 1);
    el.classList.remove('in'); el.classList.add('out');
    setTimeout(() => el.remove(), AUTO ? 0 : 160);
  }
  function busy() { return stack.length > 0; }
  let typedBuf = '';
  function key(e) {
    if (e.key && /^[a-zñ]$/i.test(e.key)) {
      typedBuf = (typedBuf + e.key.toLowerCase()).slice(-5);
      if (typedBuf === 'ganar') {
        typedBuf = '';
        for (let i = stack.length - 1; i >= 0; i--) if (stack[i].win) { stack[i].win(); return; }
      }
    }
    const top = stack[stack.length - 1]; if (top && top.onKey) top.onKey(e);
  }

  function portraitEl(cv, scale = 4) {
    const wrap = h('div', 'portrait');
    if (cv) wrap.appendChild(SPR.scaled(cv, scale));
    return wrap;
  }

  function toast(text, kind = '') {
    const t = h('div', 'toast ' + kind, text);
    toastBox.appendChild(t);
    setTimeout(() => t.classList.add('in'), 10);
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, AUTO ? 10 : 2600);
  }

  /* ---------------- Diálogo ---------------- */
  function dialog(lines, speaker = {}) {
    return new Promise(resolve => {
      if (AUTO) { resolve(); return; }
      const box = h('div', 'modal dialog');
      if (speaker.portrait) box.appendChild(portraitEl(speaker.portrait, 4));
      const body = h('div', 'dlg-body');
      if (speaker.name) body.appendChild(h('div', 'dlg-name', esc(speaker.name)));
      const txt = h('div', 'dlg-text'); body.appendChild(txt);
      const more = h('div', 'dlg-more', '▼'); body.appendChild(more);
      box.appendChild(body);
      let i = 0, shown = 0, full = '', timer = null;
      function show() {
        full = lines[i]; shown = 0; txt.textContent = ''; more.style.visibility = 'hidden';
        clearInterval(timer);
        timer = setInterval(() => {
          shown += 2; txt.textContent = full.slice(0, shown);
          if (shown % 6 === 0) AUDIO.fx.talk();
          if (shown >= full.length) { clearInterval(timer); more.style.visibility = 'visible'; }
        }, 22);
      }
      function next() {
        if (shown < full.length) { shown = full.length; txt.textContent = full; clearInterval(timer); more.style.visibility = 'visible'; return; }
        i++; if (i >= lines.length) { clearInterval(timer); close(box); resolve(); } else show();
      }
      box.addEventListener('click', next);
      open(box, e => { if (['Enter', ' ', 'e', 'E', 'Escape'].includes(e.key)) { e.preventDefault(); next(); } });
      show();
    });
  }

  /* ---------------- Pizarra (lección) ---------------- */
  function lesson(L, opt = {}) {
    return new Promise(resolve => {
      if (AUTO) { resolve(); return; }
      const m = h('div', 'modal card lesson');
      m.innerHTML = `<div class="card-head"><span class="chip">${esc(opt.tag || 'Pizarra')}</span><span class="src">Fuente: ${esc(L.src)}</span></div>
        <h2>${esc(L.title)}</h2>
        <div class="card-scroll"><div class="lesson-body">${L.body}</div>
        ${L.code ? `<pre class="code">${esc(L.code)}</pre>` : ''}
        <div class="example"><b>Ejemplo cotidiano</b><p>${esc(L.example)}</p></div></div>
        <div class="card-foot">${window.VIDEO && VIDEO.has(L.id) ? '<button class="btn ghost l-video">▶ Ver el video</button>' : '<span class="keyhint">Enter para continuar</span>'}<button class="btn primary l-ok">${esc(opt.button || 'Entendido')}</button></div>`;
      const done = () => { close(m); AUDIO.fx.page(); resolve(); };
      m.querySelector('.l-ok').addEventListener('click', done);
      const vb = m.querySelector('.l-video'); if (vb) vb.addEventListener('click', () => VIDEO.play(L.id, { title: L.title, tag: 'Repaso en video' }));
      open(m, e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); done(); } else if (e.key === 'ArrowDown') m.querySelector('.card-scroll').scrollBy(0, 40); else if (e.key === 'ArrowUp') m.querySelector('.card-scroll').scrollBy(0, -40); });
      AUDIO.fx.page();
    });
  }

  /* ---------------- Menú ---------------- */
  function menu(title, items, opt = {}) {
    return new Promise(resolve => {
      if (AUTO && opt.auto != null) { resolve(opt.auto); return; }
      const m = h('div', 'modal card menu' + (opt.cls ? ' ' + opt.cls : ''));
      let html = '';
      if (opt.portrait || opt.text) html += `<div class="menu-top"><div class="ph"></div><div class="menu-text">${opt.name ? `<div class="dlg-name">${esc(opt.name)}</div>` : ''}${opt.text ? `<p>${esc(opt.text)}</p>` : ''}</div></div>`;
      html += `<h2>${esc(title)}</h2><div class="menu-list"></div>`;
      m.innerHTML = html;
      if (opt.portrait) m.querySelector('.ph').appendChild(portraitEl(opt.portrait, 4));
      const list = m.querySelector('.menu-list');
      let sel = items.findIndex(it => !it.disabled);
      const btns = items.map((it, i) => {
        const b = h('button', 'menu-item' + (it.disabled ? ' disabled' : ''), `<span class="mi-l">${esc(it.label)}</span>${it.sub ? `<span class="mi-s">${esc(it.sub)}</span>` : ''}`);
        b.addEventListener('click', () => { if (!it.disabled) pick(i); });
        b.addEventListener('mouseenter', () => { if (!it.disabled) { sel = i; paint(); } });
        list.appendChild(b); return b;
      });
      function paint() { btns.forEach((b, i) => b.classList.toggle('sel', i === sel)); }
      function pick(i) { AUDIO.fx.page(); close(m); resolve(i); }
      function move(d) { let n = sel; for (let k = 0; k < items.length; k++) { n = (n + d + items.length) % items.length; if (!items[n].disabled) break; } sel = n; paint(); AUDIO.sfx('hover', 0.25); }
      paint();
      open(m, e => {
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') { e.preventDefault(); if (sel >= 0) pick(sel); }
        else if (e.key === 'Escape' && opt.cancel !== false) { e.preventDefault(); close(m); resolve(-1); }
        else if (/^[1-9]$/.test(e.key)) { const i = +e.key - 1; if (items[i] && !items[i].disabled) pick(i); }
      });
    });
  }

  /* ---------------- Tarjeta informativa ---------------- */
  function card(title, html, button = 'Continuar', cls = '') {
    return new Promise(resolve => {
      if (AUTO) { resolve(); return; }
      const m = h('div', 'modal card ' + cls);
      m.innerHTML = `<h2>${title}</h2><div class="card-scroll">${html}</div><div class="card-foot"><span class="keyhint">Enter</span><button class="btn primary">${esc(button)}</button></div>`;
      const done = () => { close(m); resolve(); };
      m.querySelector('.btn').addEventListener('click', done);
      open(m, e => { if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); done(); } });
    });
  }

  /* ---------------- Combate de preguntas ---------------- */
  // cfg: { name, title, sprite, hp, boss, nextQuestion(asked) → q|null, lessonOf(q), state, onAnswer(q, ok),
  //        lines: {right:[], wrong:[]}, tag }
  /* ---------------- Combate por turnos (presentación tipo RPG clásico, arte propio) ----------------
     Responder bien = Kai lanza un poder. Fallar = el enemigo ataca, se explica el porqué
     y esa pregunta vuelve más adelante en el mismo combate (segunda oportunidad). */
  const MOVES = {
    muelle: { me: ['COMMIT Relámpago', 'Ancla ACID', 'ROLLBACK Total', 'Escudo Savepoint'], foe: ['Lectura Sucia', 'Lodo sin COMMIT'], c: '#7ad7ff', bg: ['#0b1030', '#1d3a6a'] },
    estacion: { me: ['Grafo sin Ciclos', 'Candado 2PL', 'Ficha de Tiempo', 'Flash SNAPSHOT'], foe: ['Espera Circular', 'Bloqueo X'], c: '#ffd34d', bg: ['#140c22', '#4a2a30'] },
    boveda: { me: ['Restauración Total', 'Rayo DIFF', 'Cadena de LOGs', 'Escudo AES-256'], foe: ['Corrupción', 'Falla de Disco'], c: '#b18cff', bg: ['#0a0a14', '#2a2850'] },
    mercado: { me: ['Index Seek', 'Golpe SARGable', 'Carga Anticipada', 'Caché Hit'], foe: ['Full Scan', 'Consulta N+1'], c: '#ff9a6a', bg: ['#1a0c1c', '#4a2038'] },
    islas: { me: ['Doble Fase 2PC', 'Réplica Total', 'Filtro $gt', 'Corte Horizontal'], foe: ['Partición de Red', 'Nodo Caído'], c: '#5fe3c0', bg: ['#06202a', '#0d4a58'] },
    final: { me: ['COMMIT Relámpago', 'Index Seek', 'Restauración Total', 'Doble Fase 2PC'], foe: ['Pregunta Capciosa', 'Revisión de Examen'], c: '#ffd34d', bg: ['#140a24', '#3a1a48'] }
  };
  function battle(cfg) {
    return new Promise(resolve => {
      const S = cfg.state, th = MOVES[cfg.theme || UI.theme] || MOVES.final;
      const m = h('div', 'modal battle2' + (cfg.boss ? ' boss' : '') + (cfg.skin ? ' skin-' + cfg.skin : ''));
      const FX = cfg.fx || null; // presentación opcional (jefe final): no cambia la lógica del combate
      m.innerHTML = `
        <div class="bt-arena"><canvas width="960" height="680"></canvas></div>
        <div class="bt-msg"><span></span><i class="bt-more">▼</i></div>
        <div class="bt-panel">
          <div class="bt-concept"></div>
          <div class="bt-q"></div>
          <pre class="code bt-code" hidden></pre>
          <div class="bt-opts"></div>
          <div class="bt-hint" hidden></div>
          <div class="bt-feedback" hidden></div>
          <div class="bt-tools">
            <button class="btn ghost t-hint">Pista <kbd>H</kbd></button>
            <button class="btn ghost t-lemon">Limoncito <kbd>J</kbd></button>
            <button class="btn ghost t-lesson">Pizarra <kbd>K</kbd></button>
            <button class="btn primary t-next" hidden>Continuar <kbd>Enter</kbd></button>
          </div>
        </div>`;
      const $ = s => m.querySelector(s);
      const cv = $('canvas'), x = cv.getContext('2d'); x.scale(2, 2); x.imageSmoothingEnabled = false;
      const foeCv = cfg.sprite, meCv = SPR.kai('up', 0);
      let hp = cfg.hp, shownHp = cfg.hp, shownHearts = S.hearts, asked = new Set(), retry = [], sinceRetry = 0, q = null, isRetry = false, map = [], answered = false, finished = false, opts = [], busyAnim = false, raf = 0, typed = '', cheated = false;
      const A = { foeX: 0, foeY: 0, foeFlash: 0, foeAlpha: 1, foeDrop: 0, meX: 0, meY: 0, meFlash: 0, meAlpha: 1, shot: null, shake: 0, flash: 0, flashC: '#fff', t0: performance.now(), sparks: [] };
      const pick = arr => arr[Math.floor(Math.random() * arr.length)];
      const sleep = ms => new Promise(r => setTimeout(r, AUTO ? 0 : ms));

      function rr(X, Y, w, hh, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + hh, r); x.arcTo(X + w, Y + hh, X, Y + hh, r); x.arcTo(X, Y + hh, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
      function infoBox(X, Y, name, ratio, label) {
        x.fillStyle = 'rgba(250,246,236,0.96)'; rr(X, Y, 200, 56, 7); x.fill(); x.strokeStyle = '#2a2040'; x.lineWidth = 2.5; x.stroke();
        x.fillStyle = '#2a2040'; x.font = '15px "Pixelify Sans", monospace'; x.textAlign = 'left'; x.textBaseline = 'top'; x.fillText(name, X + 10, Y + 6);
        x.font = '11px "Pixelify Sans", monospace'; x.fillText('PS', X + 10, Y + 31);
        x.fillStyle = '#3a3050'; rr(X + 32, Y + 30, 158, 11, 3); x.fill();
        const c = ratio > 0.5 ? '#38c870' : ratio > 0.2 ? '#f0c030' : '#e04040';
        x.fillStyle = c; rr(X + 34, Y + 32, Math.max(0, 154 * ratio), 7, 2); x.fill();
        if (label) { x.fillStyle = '#5a5070'; x.font = '10px "Pixelify Sans", monospace'; x.textAlign = 'right'; x.fillText(label, X + 192, Y + 44); }
      }
      function draw(now) {
        const t = (now - A.t0) / 1000;
        x.save();
        if (A.shake > 0) { x.translate((Math.random() - 0.5) * A.shake, (Math.random() - 0.5) * A.shake); A.shake *= 0.86; if (A.shake < 0.3) A.shake = 0; }
        const g = x.createLinearGradient(0, 0, 0, 340); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]);
        x.fillStyle = g; x.fillRect(-10, -10, 500, 360);
        x.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 30; i++) if ((i + Math.floor(t * 2)) % 6) x.fillRect((i * 83) % 480, (i * 41) % 150, 1, 1);
        x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(-10, 230, 500, 120);
        // plataformas
        x.fillStyle = 'rgba(0,0,0,0.35)'; x.beginPath(); x.ellipse(340, 182, 100, 20, 0, 0, 7); x.fill();
        x.fillStyle = th.c; x.globalAlpha = 0.25; x.beginPath(); x.ellipse(340, 180, 96, 18, 0, 0, 7); x.fill();
        x.globalAlpha = 0.35; x.beginPath(); x.ellipse(130, 318, 120, 22, 0, 0, 7); x.fill(); x.globalAlpha = 1;
        if (FX && FX.back) FX.back(x, t, A, now);
        // enemigo
        const fs = cfg.boss ? 8 : 7, fw = foeCv.width * fs, fh = foeCv.height * fs;
        if (A.foeAlpha > 0) {
          x.globalAlpha = A.foeAlpha * (A.foeFlash > 0 && Math.floor(now / 70) % 2 ? 0.2 : 1);
          const bob = Math.sin(t * 2.4) * 2;
          x.drawImage(foeCv, 340 - fw / 2 + A.foeX, 176 - fh + bob + A.foeY + A.foeDrop, fw, fh);
          x.globalAlpha = 1;
        }
        // Kai de espaldas
        const ms = 9, mw = meCv.width * ms, mh = meCv.height * ms;
        x.globalAlpha = A.meAlpha * (A.meFlash > 0 && Math.floor(now / 70) % 2 ? 0.2 : 1);
        x.drawImage(meCv, 130 - mw / 2 + A.meX, 322 - mh + A.meY + Math.sin(t * 2) * 1, mw, mh);
        x.globalAlpha = 1;
        // proyectil
        if (A.shot) {
          const s = A.shot, e = Math.min(1, (now - s.t) / s.d), px = s.x1 + (s.x2 - s.x1) * e, py = s.y1 + (s.y2 - s.y1) * e - Math.sin(e * Math.PI) * 30;
          x.fillStyle = s.c; x.shadowColor = s.c; x.shadowBlur = 14;
          x.beginPath(); x.arc(px, py, 7 + Math.sin(now / 40) * 2, 0, 7); x.fill();
          for (let k = 1; k < 5; k++) { const ee = Math.max(0, e - k * 0.04); x.globalAlpha = 0.5 - k * 0.1; x.beginPath(); x.arc(s.x1 + (s.x2 - s.x1) * ee, s.y1 + (s.y2 - s.y1) * ee - Math.sin(ee * Math.PI) * 30, 6 - k, 0, 7); x.fill(); }
          x.globalAlpha = 1; x.shadowBlur = 0;
        }
        // chispas de impacto
        A.sparks = A.sparks.filter(p => (p.life -= 0.016) > 0);
        A.sparks.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; x.fillStyle = p.c; x.globalAlpha = Math.min(1, p.life * 2); x.fillRect(p.x, p.y, 3, 3); });
        x.globalAlpha = 1;
        if (FX && FX.front) FX.front(x, t, A, now);
        // cajas de info
        shownHp += (hp - shownHp) * 0.08; shownHearts += (S.hearts - shownHearts) * 0.08;
        if (FX && FX.foeBar) FX.foeBar(x, Math.max(0, shownHp) / cfg.hp, hp, cfg.hp, t); else infoBox(14, 16, cfg.name, Math.max(0, shownHp) / cfg.hp, cfg.tag || (cfg.boss ? 'JEFE' : ''));
        infoBox(266, 262, 'Kai', Math.max(0, shownHearts) / S.maxHearts, `${S.hearts}/${S.maxHearts} · limoncitos ${S.lemons}`);
        x.restore();
        if (A.flash > 0) { x.fillStyle = A.flashC; x.globalAlpha = A.flash; x.fillRect(0, 0, 480, 340); x.globalAlpha = 1; A.flash = Math.max(0, A.flash - 0.06); }
        A.foeFlash = Math.max(0, A.foeFlash - 16); A.meFlash = Math.max(0, A.meFlash - 16);
        raf = requestAnimationFrame(draw);
      }
      function burstAt(X, Y, c, n = 18) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 1 + Math.random() * 3; A.sparks.push({ x: X, y: Y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, c, life: 0.6 + Math.random() * 0.4 }); } }
      function tween(obj, key, to, ms) { return new Promise(r => { if (AUTO) { obj[key] = to; r(); return; } const from = obj[key], t0 = performance.now(); (function st(n) { const e = Math.min(1, (n - t0) / ms); obj[key] = from + (to - from) * (e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2); if (e < 1) requestAnimationFrame(st); else r(); })(t0); }); }
      async function msg(text, ms = 900) {
        const el = $('.bt-msg span'); el.textContent = '';
        if (AUTO) { el.textContent = text; return; }
        for (let i = 0; i <= text.length; i += 2) { el.textContent = text.slice(0, i); await sleep(14); }
        el.textContent = text; await sleep(ms);
      }
      async function attackFoe(move) {
        await msg(`¡Kai usó ${move}!`, 250);
        AUDIO.fx.whoosh ? AUDIO.fx.whoosh() : AUDIO.fx.page();
        await tween(A, 'meY', -10, 120); await tween(A, 'meY', 0, 120);
        A.shot = { x1: 165, y1: 250, x2: 340, y2: 140, c: th.c, t: performance.now(), d: 420 };
        await sleep(420); A.shot = null;
        AUDIO.fx.hit(); A.flash = 0.7; A.flashC = '#ffffff'; A.shake = 8; A.foeFlash = 600; burstAt(340, 140, th.c, 26); if (FX && FX.hit) FX.hit('foe', A);
        hp--; await tween(A, 'foeX', 10, 60); await tween(A, 'foeX', -8, 60); await tween(A, 'foeX', 0, 60);
        await msg(isRetry ? '¡Segunda oportunidad aprovechada!' : pick(['¡Es muy efectivo!', '¡Golpe crítico de conocimiento!', '¡Le dio de lleno!']), 600);
        say(cfg.lines && cfg.lines.right ? pick(cfg.lines.right) : '');
      }
      async function attackMe(move) {
        await msg(`¡${cfg.name} usó ${move}!`, 250);
        await tween(A, 'foeX', -40, 160); AUDIO.fx.bad(); A.flash = 0.6; A.flashC = '#ff3040'; A.shake = 12; A.meFlash = 600; burstAt(130, 270, '#ff5d6c', 22); if (FX && FX.hit) FX.hit('me', A);
        await tween(A, 'foeX', 0, 200);
        if (!cfg.safe) S.hearts = Math.max(0, S.hearts - 1);
        await msg(cfg.safe ? 'Repaso sin castigo: no pierde energía.' : 'Kai perdió 1 de energía.', 500);
        say(cfg.lines && cfg.lines.wrong ? pick(cfg.lines.wrong) : '');
      }
      function say(t) { if (t) { const el = $('.bt-msg span'); el.textContent = `${cfg.name}: “${t}”`; } }
      function paintTools() {
        $('.t-lemon').textContent = ''; $('.t-lemon').innerHTML = `Limoncito ×${S.lemons} <kbd>J</kbd>`;
        $('.t-lemon').disabled = S.lemons <= 0 || answered || !q || q.tf || map.filter(o => o.alive).length <= 2;
      }
      function nextQ() {
        isRetry = false; q = null;
        if (retry.length && sinceRetry >= 1) { q = retry.shift(); isRetry = true; sinceRetry = 0; }
        if (!q) { q = cfg.nextQuestion(asked); sinceRetry++; }
        if (!q && retry.length) { q = retry.shift(); isRetry = true; }
        if (!q) { hp = 0; victory(); return; }
        asked.add(q.id); answered = false;
        $('.bt-concept').innerHTML = isRetry ? '<b class="again-tag">Otra oportunidad</b>' : '';
        $('.bt-q').textContent = q.q;
        const code = $('.bt-code'); if (q.code) { code.hidden = false; code.textContent = q.code; } else code.hidden = true;
        $('.bt-hint').hidden = true; $('.bt-feedback').hidden = true; $('.t-next').hidden = true;
        ['.t-hint', '.t-lemon', '.t-lesson'].forEach(s => $(s).hidden = false);
        const box = $('.bt-opts'); box.innerHTML = ''; box.classList.toggle('tf2', !!q.tf);
        const order = q.tf ? ['Verdadero', 'Falso'].map(lbl => q.o.indexOf(lbl)) : LOGIC.shuffle(q.o.map((_, i) => i));
        map = order.map(i => ({ i, alive: true }));
        opts = order.map((oi, k) => {
          const b = h('button', 'opt move' + (q.tf ? ' tf' : ''), `<kbd>${k + 1}</kbd><span>${esc(q.o[oi])}</span>`);
          b.addEventListener('click', () => answer(k)); box.appendChild(b); return b;
        });
        paintTools(); m.classList.add('asking');
        box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
        if (!AUTO) msg(isRetry ? 'Ya vio la explicación. Inténtelo de nuevo:' : '¿Qué hará Kai? Elija la respuesta correcta para atacar.', 0);
      }
      async function answer(k) {
        if (answered || finished || busyAnim || !map[k] || !map[k].alive) return;
        answered = true; busyAnim = true; m.classList.remove('asking');
        const ok = map[k].i === 0;
        opts.forEach((b, j) => { b.disabled = true; if (map[j].i === 0 && ok) b.classList.add('right'); });
        if (!ok) opts[k].classList.add('wrong');
        if (!cheated) cfg.onAnswer(q, ok);
        ['.t-hint', '.t-lemon'].forEach(s => $(s).hidden = true);
        if (ok) await attackFoe(th.me[Math.floor(Math.random() * th.me.length)]);
        else { await attackMe(pick(th.foe)); retry.push(q); sinceRetry = 0; opts.forEach((b, j) => { if (map[j].i === 0) b.classList.add('right'); }); }
        const fb = $('.bt-feedback'); fb.hidden = false; fb.className = 'bt-feedback ' + (ok ? 'ok' : 'ko');
        fb.innerHTML = ok ? `<b>Correcto.</b> ${esc(q.exp)}` : `<b>La correcta era “${esc(q.o[0])}”.</b> ${esc(q.exp)} <span class="again">Esta pregunta vuelve en este combate.</span>`;
        busyAnim = false;
        $('.t-next').hidden = false; $('.t-next').focus({ preventScroll: true });
        paintTools();
      }
      async function cont() {
        if (!answered || finished || busyAnim) return;
        if (hp <= 0) { await victory(); return; }
        if (!cfg.safe && S.hearts <= 0) { await defeat(); return; }
        if (cfg.onTurn) cfg.onTurn({ hp, say });
        nextQ();
      }
      async function victory() {
        busyAnim = true; finished = true; m.classList.remove('asking'); $('.bt-panel').classList.add('dim');
        AUDIO.fx.hit(); A.flash = 0.9; A.flashC = '#ffffff';
        await Promise.all([tween(A, 'foeDrop', 40, 600), tween(A, 'foeAlpha', 0, 600)]);
        AUDIO.fx.win();
        await msg(cfg.boss ? `¡${cfg.name} fue derrotado!` : `¡${cfg.name} se disipó!`, 900);
        close(m); cancelAnimationFrame(raf); resolve({ won: true, cheated });
      }
      async function defeat() {
        busyAnim = true; finished = true; m.classList.remove('asking');
        await Promise.all([tween(A, 'meY', 30, 700), tween(A, 'meAlpha', 0, 700)]);
        AUDIO.fx.lose ? AUDIO.fx.lose() : AUDIO.fx.bad();
        await msg('Kai se quedó sin energía...', 1100);
        close(m); cancelAnimationFrame(raf); resolve({ won: false });
      }
      $('.t-next').addEventListener('click', cont);
      $('.bt-msg').addEventListener('click', () => { if (answered && !busyAnim) cont(); });
      $('.t-hint').addEventListener('click', () => { if (!q || answered) return; const hb = $('.bt-hint'); hb.hidden = false; hb.textContent = 'Pista: ' + q.hint; AUDIO.fx.page(); });
      $('.t-lemon').addEventListener('click', () => {
        if (!q || answered || q.tf || S.lemons <= 0) return;
        const wrong = map.map((o, j) => ({ o, j })).filter(o => o.o.alive && o.o.i !== 0);
        if (wrong.length <= 1) return;
        const o = pick(wrong); o.o.alive = false; opts[o.j].classList.add('gone'); opts[o.j].disabled = true;
        S.lemons--; paintTools(); AUDIO.fx.found();
      });
      $('.t-lesson').addEventListener('click', () => { const L = cfg.lessonOf(q); if (L) lesson(L, { tag: 'Repaso', button: 'Volver al combate' }); });
      const entry = open(m, e => {
        if (/^[1-4]$/.test(e.key) && !answered) { const k = +e.key - 1; if (opts[k]) answer(k); }
        else if ((e.key === 'Enter' || e.key === ' ') && answered) { e.preventDefault(); cont(); }
        else if ((e.key === 'h' || e.key === 'H') && !answered) $('.t-hint').click();
        else if ((e.key === 'j' || e.key === 'J') && !answered) $('.t-lemon').click();
        else if (e.key === 'k' || e.key === 'K') $('.t-lesson').click();
      });
      entry.win = () => { if (finished) return; cheated = true; hp = 0; answered = true; busyAnim = false; victory(); };
      raf = requestAnimationFrame(draw);
      (async () => {
        if (!AUTO) { A.foeX = 160; A.meX = -160; tween(A, 'foeX', 0, 500); await tween(A, 'meX', 0, 500); }
        await msg(cfg.boss ? `¡${cfg.name} le cierra el paso!` : `¡Apareció ${cfg.name}!`, 500);
        if (cfg.taunt) { say(cfg.taunt); await sleep(900); }
        nextQ();
      })();
      // API para la prueba automática
      m._auto = { answer, cont, get q() { return q; }, get map() { return map; }, get answered() { return answered && !busyAnim; }, get finished() { return finished; } };
      if (AUTO) window.__battle = m._auto;
    });
  }

  /* ---------------- Libreta de estudio ---------------- */
  function notebook(state, focusPhase) {
    return new Promise(resolve => {
      const m = h('div', 'modal card notebook');
      const phases = CONTENT.phases;
      let tab = Math.max(0, phases.findIndex(p => p.id === focusPhase));
      m.innerHTML = `<h2>Libreta de estudio</h2><div class="tabs"></div><div class="card-scroll nb-list"></div>
        <div class="card-foot"><span class="keyhint">←/→ cambiar fase · Esc cerrar</span><button class="btn primary">Cerrar</button></div>`;
      const tabs = m.querySelector('.tabs'), list = m.querySelector('.nb-list');
      phases.forEach((p, i) => { const b = h('button', 'tab', 'F' + p.num); b.title = p.name; b.addEventListener('click', () => { tab = i; paint(); }); tabs.appendChild(b); });
      function paint() {
        [...tabs.children].forEach((b, i) => b.classList.toggle('sel', i === tab));
        const p = phases[tab]; list.innerHTML = '';
        const qs = p.questions; let r = 0, w = 0, pend = 0;
        qs.forEach(q => { const s = state.stats[q.id]; if (s) { r += s.r; w += s.w; if (s.w > 0 && s.r <= s.w) pend++; } });
        list.appendChild(h('div', 'nb-head', `<b>Fase ${p.num} · ${esc(p.name)}</b><br><small>${esc(p.source)}</small><br><small>Respuestas: ${r} correctas · ${w} incorrectas · ${pend} por repasar</small>`));
        p.lessons.forEach(L => {
          const read = !!state.read[L.id];
          const row = h('div', 'nb-row');
          const b = h('button', 'nb-item' + (read ? '' : ' locked'), read ? esc(L.title) : 'Pizarra aún no vista');
          if (read) b.addEventListener('click', () => lesson(L, { tag: 'Libreta', button: 'Volver' }));
          row.appendChild(b);
          if (read && window.VIDEO && VIDEO.has(L.id)) { const v = h('button', 'nb-vid', '▶ Video'); v.addEventListener('click', () => VIDEO.play(L.id, { title: L.title, tag: 'Libreta' })); row.appendChild(v); }
          list.appendChild(row);
        });
      }
      const done = () => { close(m); resolve(); };
      m.querySelector('.btn').addEventListener('click', done);
      open(m, e => {
        if (e.key === 'Escape' || e.key === 'l' || e.key === 'L' || e.key === 'Enter') { e.preventDefault(); done(); }
        else if (e.key === 'ArrowRight') { tab = (tab + 1) % phases.length; paint(); }
        else if (e.key === 'ArrowLeft') { tab = (tab + phases.length - 1) % phases.length; paint(); }
      });
      paint();
    });
  }

  const api = { init, h, esc, open, close, busy, key, toast, dialog, lesson, menu, card, battle, notebook, wait, AUTO, portraitEl, theme: 'muelle' };
  return api;
})();
