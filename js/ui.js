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
  function key(e) { const top = stack[stack.length - 1]; if (top && top.onKey) top.onKey(e); }

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
        <div class="card-foot"><span class="keyhint">Enter para continuar</span><button class="btn primary">${esc(opt.button || '¡Entendido!')}</button></div>`;
      const done = () => { close(m); AUDIO.fx.page(); resolve(); };
      m.querySelector('.btn').addEventListener('click', done);
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
  function battle(cfg) {
    return new Promise(resolve => {
      const S = cfg.state;
      const m = h('div', 'modal battle' + (cfg.boss ? ' boss' : ''));
      m.innerHTML = `
        <div class="b-left">
          <div class="b-tag">${esc(cfg.tag || (cfg.boss ? 'JEFE' : 'RETO'))}</div>
          <div class="b-sprite"></div>
          <div class="b-name">${esc(cfg.name)}</div>
          <div class="b-hp"></div>
          <div class="b-speech"></div>
          <div class="b-me"><div class="hearts"></div><div class="lemons"></div></div>
        </div>
        <div class="b-right">
          <div class="b-concept"></div>
          <div class="b-q"></div>
          <pre class="code b-code" hidden></pre>
          <div class="b-opts"></div>
          <div class="b-hint" hidden></div>
          <div class="b-feedback" hidden></div>
          <div class="b-tools">
            <button class="btn ghost t-hint">💡 Pista <kbd>H</kbd></button>
            <button class="btn ghost t-lemon">🍋 Limoncito <kbd>J</kbd></button>
            <button class="btn ghost t-lesson">📖 Pizarra <kbd>K</kbd></button>
            <button class="btn primary t-next" hidden>Continuar <kbd>Enter</kbd></button>
          </div>
        </div>`;
      const $ = s => m.querySelector(s);
      const spr = SPR.scaled(cfg.sprite, cfg.boss ? 7 : 6); spr.className = 'b-spr';
      $('.b-sprite').appendChild(spr);
      let hp = cfg.hp, asked = new Set(), q = null, map = [], answered = false, finished = false, opts = [];
      function paintHp() { $('.b-hp').innerHTML = Array.from({ length: cfg.hp }, (_, i) => `<i class="${i < hp ? 'on' : ''}"></i>`).join(''); }
      function paintMe() {
        $('.hearts').innerHTML = Array.from({ length: S.maxHearts }, (_, i) => `<i class="heart ${i < S.hearts ? '' : 'empty'}"></i>`).join('');
        $('.lemons').textContent = '🍋 × ' + S.lemons;
        $('.t-lemon').disabled = S.lemons <= 0 || answered || !q || q.tf || map.filter(x => x.alive).length <= 2;
      }
      function say(t) { $('.b-speech').textContent = t || ''; }
      function nextQ() {
        q = cfg.nextQuestion(asked);
        if (!q) { finish(true); return; }
        asked.add(q.id); answered = false;
        const L = cfg.lessonOf(q);
        $('.b-concept').innerHTML = `Concepto: <b>${esc(L ? L.title : '')}</b>`;
        $('.b-q').textContent = q.q;
        const code = $('.b-code');
        if (q.code) { code.hidden = false; code.textContent = q.code; } else code.hidden = true;
        $('.b-hint').hidden = true; $('.b-feedback').hidden = true; $('.t-next').hidden = true;
        $('.t-hint').hidden = false; $('.t-lemon').hidden = false; $('.t-lesson').hidden = false;
        const box = $('.b-opts'); box.innerHTML = '';
        let order;
        if (q.tf) order = ['Verdadero', 'Falso'].map(lbl => q.o.indexOf(lbl));
        else order = LOGIC.shuffle(q.o.map((_, i) => i));
        map = order.map(i => ({ i, alive: true }));
        opts = order.map((oi, k) => {
          const b = h('button', 'opt' + (q.tf ? ' tf' : ''), `<kbd>${k + 1}</kbd><span>${esc(q.o[oi])}</span>`);
          b.dataset.correct = oi === 0 ? '1' : '0';
          b.addEventListener('click', () => answer(k));
          box.appendChild(b); return b;
        });
        paintMe();
        box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
      }
      function answer(k) {
        if (answered || finished || !map[k].alive) return;
        answered = true;
        const ok = map[k].i === 0;
        opts.forEach((b, j) => { b.disabled = true; if (map[j].i === 0) b.classList.add('right'); });
        if (!ok) opts[k].classList.add('wrong');
        cfg.onAnswer(q, ok);
        const fb = $('.b-feedback'); fb.hidden = false;
        fb.className = 'b-feedback ' + (ok ? 'ok' : 'ko');
        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        if (ok) {
          hp--; paintHp(); AUDIO.fx.good(); AUDIO.fx.hit();
          spr.classList.remove('hurt'); void spr.offsetWidth; spr.classList.add('hurt');
          fb.innerHTML = `<b>¡Correcto!</b> ${esc(q.exp)}`;
          say(cfg.lines && cfg.lines.right ? pick(cfg.lines.right) : '¡Ugh!');
        } else {
          if (!cfg.safe) S.hearts = Math.max(0, S.hearts - 1);
          AUDIO.fx.bad();
          m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake');
          const right = q.o[0];
          fb.innerHTML = `<b>No exactamente.</b> La respuesta correcta es <b>“${esc(right)}”</b>. ${esc(q.exp)} <span class="again">Esta pregunta volverá más adelante para repasarla.</span>`;
          say(cfg.lines && cfg.lines.wrong ? pick(cfg.lines.wrong) : '¡Je!');
        }
        $('.t-hint').hidden = true; $('.t-lemon').hidden = true;
        $('.t-next').hidden = false; $('.t-next').focus({ preventScroll: true });
        paintMe();
      }
      function cont() {
        if (!answered || finished) return;
        if (hp <= 0) { finish(true); return; }
        if (!cfg.safe && S.hearts <= 0) { finish(false); return; }
        if (cfg.onTurn) cfg.onTurn({ hp, say });
        nextQ();
      }
      function finish(won) {
        finished = true;
        close(m); resolve({ won });
      }
      $('.t-next').addEventListener('click', cont);
      $('.t-hint').addEventListener('click', () => { if (!q || answered) return; const hb = $('.b-hint'); hb.hidden = false; hb.innerHTML = '💡 ' + esc(q.hint); AUDIO.fx.page(); });
      $('.t-lemon').addEventListener('click', () => {
        if (!q || answered || q.tf || S.lemons <= 0) return;
        const wrong = map.map((x, j) => ({ x, j })).filter(o => o.x.alive && o.x.i !== 0);
        if (wrong.length <= 1) return;
        const o = wrong[Math.floor(Math.random() * wrong.length)];
        o.x.alive = false; opts[o.j].classList.add('gone'); opts[o.j].disabled = true;
        S.lemons--; paintMe(); AUDIO.fx.found();
      });
      $('.t-lesson').addEventListener('click', () => { const L = cfg.lessonOf(q); if (L) lesson(L, { tag: 'Repaso', button: 'Volver al reto' }); });
      paintHp(); say(cfg.taunt || '');
      open(m, e => {
        if (/^[1-4]$/.test(e.key) && !answered) { const k = +e.key - 1; if (opts[k]) answer(k); }
        else if ((e.key === 'Enter' || e.key === ' ') && answered) { e.preventDefault(); cont(); }
        else if ((e.key === 'h' || e.key === 'H') && !answered) $('.t-hint').click();
        else if ((e.key === 'j' || e.key === 'J') && !answered) $('.t-lemon').click();
        else if (e.key === 'k' || e.key === 'K') $('.t-lesson').click();
      });
      nextQ();
      // API para la prueba automática
      m._auto = { answer, cont, get q() { return q; }, get map() { return map; }, get answered() { return answered; }, get finished() { return finished; } };
      if (AUTO) window.__battle = m._auto;
    });
  }

  /* ---------------- Libreta de estudio ---------------- */
  function notebook(state, focusPhase) {
    return new Promise(resolve => {
      const m = h('div', 'modal card notebook');
      const phases = CONTENT.phases;
      let tab = Math.max(0, phases.findIndex(p => p.id === focusPhase));
      m.innerHTML = `<h2>📓 Libreta de estudio</h2><div class="tabs"></div><div class="card-scroll nb-list"></div>
        <div class="card-foot"><span class="keyhint">←/→ cambiar fase · Esc cerrar</span><button class="btn primary">Cerrar</button></div>`;
      const tabs = m.querySelector('.tabs'), list = m.querySelector('.nb-list');
      phases.forEach((p, i) => { const b = h('button', 'tab', 'F' + p.num); b.title = p.name; b.addEventListener('click', () => { tab = i; paint(); }); tabs.appendChild(b); });
      function paint() {
        [...tabs.children].forEach((b, i) => b.classList.toggle('sel', i === tab));
        const p = phases[tab]; list.innerHTML = '';
        const qs = p.questions; let r = 0, w = 0, pend = 0;
        qs.forEach(q => { const s = state.stats[q.id]; if (s) { r += s.r; w += s.w; if (s.w > s.r) pend++; } });
        list.appendChild(h('div', 'nb-head', `<b>Fase ${p.num} · ${esc(p.name)}</b><br><small>${esc(p.source)}</small><br><small>Respuestas: ${r} correctas · ${w} incorrectas · ${pend} por repasar</small>`));
        p.lessons.forEach(L => {
          const read = !!state.read[L.id];
          const b = h('button', 'nb-item' + (read ? '' : ' locked'), read ? `📖 ${esc(L.title)}` : '🔒 Pizarra aún no leída');
          if (read) b.addEventListener('click', () => lesson(L, { tag: 'Libreta', button: 'Volver' }));
          list.appendChild(b);
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

  return { init, h, esc, open, close, busy, key, toast, dialog, lesson, menu, card, battle, notebook, wait, AUTO, portraitEl };
})();
