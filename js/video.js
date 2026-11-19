/* Reproductor de enseñanzas animadas ("mini videos") en Canvas.
   Lee los guiones de SCENES, reproduce la narración Qwen (assets/voice/*.mp3)
   y, si un audio no está, sigue con subtítulos y lo dice en pantalla. */
window.VIDEO = (function () {
  const W = 480, H = 270, Q = 2; // lienzo lógico y escala interna para texto nítido
  const COL = { g: '#ffd34d', r: '#ff5d6c', v: '#5fe39a', b: '#7ad7ff', p: '#b18cff', o: '#ffa94d', w: '#f4f0ff', k: '#000000' };
  const col = c => COL[c] || c || COL.w;
  const FONT = '"Pixelify Sans", monospace', MONO = 'Consolas, "Courier New", monospace';
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  let voiceStatus = null; // null = sin probar, true = hay voz, false = falta algún audio

  /* ---------------- Iconos en pixel art (dibujados con rectángulos) ---------------- */
  const ICON_ROWS = {
    coin: [['..yyyy..', '.yYYYYy.', 'yYyyyyYy', 'yYy₡₡yYy', 'yYyyyyYy', 'yYyyyyYy', '.yYYYYy.', '..yyyy..'], { y: '#ffd34d', Y: '#c99a1a', '₡': '#7a5a00' }],
    db: [['.bbbbbb.', 'bBBBBBBb', 'bbbbbbbb', 'bBBBBBBb', 'bbbbbbbb', 'bBBBBBBb', 'bbbbbbbb', '.bbbbbb.'], { b: '#7ad7ff', B: '#2b7a9c' }],
    doc: [['wwwwww..', 'wkkkkww.', 'wwwwwwww', 'wkkkkkkw', 'wwwwwwww', 'wkkkkkkw', 'wwwwwwww', 'wwwwwwww'], { w: '#f4f0ff', k: '#6a6390' }],
    cup: [['.wwwwww.', 'woooooow', '.orrgro.', '.ororoo.', '.oogroo.', '..oooo..', '..wwww..', '...ww...'], { w: '#f4f0ff', o: '#ffb347', r: '#ff6a4d', g: '#5fe39a' }],
    user: [['..kkkk..', '.kssssk.', '.ksekes.', '..ssss..', '.bbbbbb.', 'bbbbbbbb', 'sbbbbbbs', '.pp..pp.'], { k: '#2a1d3a', s: '#e0a97a', e: '#1a1020', b: '#5b8de0', p: '#2b2f4a' }],
    bolt: [['....yy..', '...yy...', '..yy....', '.yyyyyy.', '....yy..', '...yy...', '..yy....', '.y......'], { y: '#ffd34d' }],
    train: [['..rrrr..', '.rwwwwr.', 'rrrrrrrr', 'rRRRRRRr', 'rrrrrrrr', 'yrrrrrry', '.kk..kk.', '.kk..kk.'], { r: '#d8433b', R: '#a52a25', w: '#bfe8ff', y: '#ffd34d', k: '#222' }],
    lock: [['..kkkk..', '.k....k.', '.k....k.', 'yyyyyyyy', 'yYYYYYYy', 'yYYkkYYy', 'yYYkkYYy', 'yyyyyyyy'], { k: '#9aa3b8', y: '#ffd34d', Y: '#c99a1a' }],
    clock: [['..wwww..', '.wkkkkw.', 'wkkwkkkw', 'wkkwkkkw', 'wkkwwwkw', 'wkkkkkkw', '.wkkkkw.', '..wwww..'], { w: '#f4f0ff', k: '#2a2440' }],
    key: [['.yyy....', 'y...y...', 'y...yyyy', 'y...y.y.', '.yyy..y.', '........', '........', '........'], { y: '#ffd34d' }],
    phone: [['.kkkkkk.', '.kbbbbk.', '.kbbbbk.', '.kbbbbk.', '.kbbbbk.', '.kbbbbk.', '.kkwwkk.', '.kkkkkk.'], { k: '#2a2440', b: '#7ad7ff', w: '#f4f0ff' }],
    box2: [['oooooooo', 'oOOOOOOo', 'oOoooooo', 'oOOOOOOo', 'oooooooo', 'oOOOOOOo', 'oOOOOOOo', 'oooooooo'], { o: '#c08040', O: '#8a5a2a' }],
    srv: [['kkkkkkkk', 'kbkkkkgk', 'kkkkkkkk', 'kbkkkkgk', 'kkkkkkkk', 'kbkkkkgk', 'kkkkkkkk', '.k....k.'], { k: '#3a3550', b: '#7ad7ff', g: '#5fe39a' }]
  };
  const iconCache = {};
  function icon(name) {
    if (iconCache[name]) return iconCache[name];
    const def = ICON_ROWS[name]; if (!def) return null;
    const [rows, pal] = def; const c = document.createElement('canvas'); c.width = 8; c.height = 8;
    const x = c.getContext('2d');
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
    return (iconCache[name] = c);
  }
  const TINT = { muelle: '#2bb3c0', estacion: '#e0a030', boveda: '#8a7cff', mercado: '#ff7a59', islas: '#3fd0a0' };
  function spriteOf(kind, bg) {
    if (kind === 'kai') return SPR.kai('down', 0);
    if (kind === 'erika') return SPR.erika();
    if (kind === 'mau') return SPR.mauricio();
    if (kind === 'guide') return SPR.guide(TINT[bg] || '#2bb3c0');
    if (kind === 'tip') return SPR.tipNpc(3);
    if (kind.startsWith('enemy:')) return SPR.enemy(kind.slice(6));
    return icon(kind);
  }

  /* ---------------- Fondos por lugar ---------------- */
  function drawBg(x, bg, t) {
    const sky = { muelle: ['#0b1030', '#1a2350'], estacion: ['#140c22', '#2a1838'], boveda: ['#0a0a14', '#1a1830'], mercado: ['#1a0c1c', '#3a1830'], islas: ['#06202a', '#0d3a48'] }[bg] || ['#0b0b18', '#1b1b30'];
    const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 26; i++) { const sx = (i * 97) % W, sy = (i * 53) % 120; if ((i + Math.floor(t * 2)) % 7) x.fillRect(sx, sy, 1, 1); }
    if (bg === 'muelle' || bg === 'islas') {
      x.fillStyle = bg === 'islas' ? '#0e5a6a' : '#13305a'; x.fillRect(0, 222, W, 48);
      x.fillStyle = 'rgba(160,220,255,0.35)';
      for (let i = 0; i < 16; i++) x.fillRect((i * 37 + t * 14) % (W + 20) - 10, 230 + (i % 3) * 12 + Math.sin(t * 2 + i) * 2, 10, 1);
      if (bg === 'muelle') { x.fillStyle = '#4a3020'; x.fillRect(0, 216, W, 8); x.fillStyle = '#2e1d12'; for (let i = 0; i < W; i += 24) x.fillRect(i, 216, 2, 8); }
      else { x.fillStyle = '#2a6a3a'; x.beginPath(); x.ellipse(70, 226, 60, 10, 0, 0, 7); x.ellipse(410, 228, 70, 12, 0, 0, 7); x.fill(); }
    } else if (bg === 'estacion') {
      x.fillStyle = '#2a2230'; x.fillRect(0, 222, W, 48);
      x.fillStyle = '#6a5a50'; x.fillRect(0, 232, W, 3); x.fillRect(0, 252, W, 3);
      x.fillStyle = '#4a3a30'; for (let i = 0; i < W; i += 16) x.fillRect(i, 230, 6, 28);
    } else if (bg === 'boveda') {
      x.fillStyle = '#1c1a2c'; for (let j = 0; j < 270; j += 18) for (let i = (j / 18) % 2 ? 0 : 20; i < W; i += 40) x.fillRect(i, j, 38, 16);
      x.fillStyle = 'rgba(10,10,20,0.55)'; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(140,170,255,0.25)';
      for (let i = 0; i < 30; i++) { const rx = (i * 61 + t * 160) % W, ry = (i * 37 + t * 320) % H; x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - 3, ry + 9); x.stroke(); }
    } else if (bg === 'mercado') {
      x.fillStyle = '#2a1424'; x.fillRect(0, 222, W, 48);
      for (let i = 0; i < 12; i++) { x.fillStyle = ['#ffd34d', '#ff7a59', '#5fe39a', '#7ad7ff'][i % 4]; x.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + i); x.fillRect(20 + i * 40, 14 + Math.sin(i) * 4, 4, 4); }
      x.globalAlpha = 1; x.strokeStyle = 'rgba(255,255,255,0.2)'; x.beginPath(); x.moveTo(0, 16); for (let i = 0; i <= W; i += 40) x.lineTo(i, 16 + Math.sin(i) * 4); x.stroke();
    }
  }

  /* ---------------- Objetos de escena ---------------- */
  function mkObj(o) { return Object.assign({ a: 0, sc: 0.6, born: 0, q: [], fx: [] }, o); }
  function wrapLines(x, text, maxW) {
    const out = [];
    String(text).split('\n').forEach(par => {
      let line = '';
      par.split(' ').forEach(w => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; });
      out.push(line);
    });
    return out;
  }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

  function bounds(o) {
    if (o.type === 'spr') { const c = o.cv; return { x: o.x, y: o.y, w: c ? c.width * o.s : 32, h: c ? c.height * o.s : 32 }; }
    if (o.type === 'box' || o.type === 'code' || o.type === 'tbl') return { x: o.x, y: o.y, w: o.w || 200, h: o.h || 40 };
    if (o.type === 'txt') return { x: o.x - 80, y: o.y - 10, w: 160, h: 20 };
    return { x: o.x || 0, y: o.y || 0, w: 20, h: 20 };
  }

  function drawObj(x, o, now) {
    const age = now - o.born, k = Math.min(1, age / 260);
    const alpha = o.fade != null ? Math.max(0, 1 - (now - o.fade) / 400) : k;
    if (alpha <= 0) return;
    let dx = 0, dy = 0;
    o.fx.forEach(f => {
      const e = (now - f.t) / f.d; if (e < 0 || e > 1) return;
      if (f.k === 'shake') dx += Math.sin(e * 40) * 4 * (1 - e);
      if (f.k === 'hop') dy -= Math.sin(e * Math.PI) * 14;
    });
    const s = 0.85 + 0.15 * ease(k);
    const b = bounds(o), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    x.save(); x.globalAlpha = alpha; x.translate(cx + dx, cy + dy); x.scale(s, s); x.translate(-cx, -cy);
    if (o.type === 'spr' && o.cv) {
      const bob = o.kind === 'kai' || o.kind === 'erika' || o.kind === 'guide' || o.kind === 'mau' ? Math.round(Math.sin(now / 300 + o.x) * 1.5) : 0;
      x.imageSmoothingEnabled = false; x.drawImage(o.cv, Math.round(o.x), Math.round(o.y + bob), o.cv.width * o.s, o.cv.height * o.s);
    } else if (o.type === 'box') {
      const c = col(o.c);
      x.fillStyle = 'rgba(16,12,32,0.92)'; rr(x, o.x, o.y, o.w, o.h, 6); x.fill();
      x.lineWidth = 2; x.strokeStyle = c; x.stroke();
      x.fillStyle = c; x.globalAlpha = alpha * 0.18; rr(x, o.x, o.y, o.w, o.h, 6); x.fill(); x.globalAlpha = alpha;
      if (o.text) {
        let size = 12; x.font = `${size}px ${FONT}`;
        let lines = wrapLines(x, o.text, o.w - 12);
        while (lines.length * (size + 3) > o.h - 6 && size > 8) { size--; x.font = `${size}px ${FONT}`; lines = wrapLines(x, o.text, o.w - 12); }
        x.fillStyle = '#f4f0ff'; x.textAlign = 'center'; x.textBaseline = 'middle';
        const lh = size + 3, top = o.y + o.h / 2 - (lines.length - 1) * lh / 2;
        lines.forEach((ln, i) => { x.fillStyle = i === 0 && lines.length > 1 ? c : '#f4f0ff'; x.fillText(ln, o.x + o.w / 2, top + i * lh); });
      }
    } else if (o.type === 'txt') {
      x.font = `${o.size || 12}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillText(o.text, o.x + 1, o.y + 1);
      x.fillStyle = col(o.c); x.fillText(o.text, o.x, o.y);
    } else if (o.type === 'code') {
      x.font = `11px ${MONO}`;
      const lines = o.lines, w = Math.max(...lines.map(l => x.measureText(l).width)) + 20, h = lines.length * 14 + 14;
      o.w = w; o.h = h;
      x.fillStyle = 'rgba(8,6,20,0.95)'; rr(x, o.x, o.y, w, h, 5); x.fill(); x.strokeStyle = '#4a4380'; x.lineWidth = 1.5; x.stroke();
      const shown = Math.floor(age / 22); let n = 0;
      x.textAlign = 'left'; x.textBaseline = 'top';
      lines.forEach((l, i) => {
        const part = l.slice(0, Math.max(0, shown - n)); n += l.length;
        x.fillStyle = /^\s*--|\/\//.test(l) ? '#8a86a8' : /^(BEGIN|END|COMMIT|ROLLBACK|SET|SELECT|UPDATE|INSERT|DELETE|IF|BACKUP|CREATE|DBCC|EXEC|WHERE|GRANT|DENY|REVOKE|use|db\.|find|update|delete)/i.test(l.trim()) ? '#ffd34d' : '#d8e6ff';
        x.fillText(part, o.x + 10, o.y + 8 + i * 14);
      });
    } else if (o.type === 'tbl') {
      const rows = o.rows, cw = o.cols, rh = 22, w = cw.reduce((a, c) => a + c, 0);
      o.w = w; o.h = rows.length * rh;
      rows.forEach((r, j) => {
        let X = o.x; const Y = o.y + j * rh;
        const hl = o.hl === j ? 0.5 + 0.5 * Math.sin(now / 160) : 0;
        x.fillStyle = j === 0 ? 'rgba(255,211,77,0.18)' : hl ? `rgba(122,215,255,${0.15 + hl * 0.25})` : 'rgba(16,12,32,0.9)';
        x.fillRect(o.x, Y, w, rh);
        r.forEach((cell, i) => {
          x.font = `${j === 0 ? 11 : 11}px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
          x.fillStyle = j === 0 ? '#ffd34d' : cell === 'sí' || cell === 'Espera' ? '#ff8a96' : cell === 'no' || cell === 'Compatible' ? '#5fe39a' : '#f4f0ff';
          x.fillText(cell, X + cw[i] / 2, Y + rh / 2);
          X += cw[i];
        });
        x.strokeStyle = 'rgba(255,255,255,0.12)'; x.strokeRect(o.x + 0.5, Y + 0.5, w - 1, rh - 1);
      });
    } else if (o.type === 'arrow') {
      const p = Math.min(1, age / 500), ex = o.x1 + (o.x2 - o.x1) * p, ey = o.y1 + (o.y2 - o.y1) * p, c = col(o.c);
      x.strokeStyle = c; x.fillStyle = c; x.lineWidth = 2.5; x.beginPath(); x.moveTo(o.x1, o.y1); x.lineTo(ex, ey); x.stroke();
      const a = Math.atan2(o.y2 - o.y1, o.x2 - o.x1);
      x.beginPath(); x.moveTo(ex, ey); x.lineTo(ex - 9 * Math.cos(a - 0.45), ey - 9 * Math.sin(a - 0.45)); x.lineTo(ex - 9 * Math.cos(a + 0.45), ey - 9 * Math.sin(a + 0.45)); x.closePath(); x.fill();
      if (o.label && p >= 1) { x.font = `10px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'bottom'; x.fillStyle = c; x.fillText(o.label, (o.x1 + o.x2) / 2, (o.y1 + o.y2) / 2 - 4); }
    }
    // resaltado
    if (o.hlT && now - o.hlT < 1600) {
      const e = (now - o.hlT) / 1600; x.strokeStyle = '#ffd34d'; x.globalAlpha = alpha * (1 - e) * (0.6 + 0.4 * Math.sin(now / 80));
      x.lineWidth = 3; rr(x, b.x - 5, b.y - 5, b.w + 10, b.h + 10, 8); x.stroke(); x.globalAlpha = alpha;
    }
    x.restore();
    // insignias ✓ / ✗
    if (o.mark) {
      const mk = Math.min(1, (now - o.mark.t) / 220), X = b.x + b.w - 4, Y = b.y - 4;
      x.save(); x.translate(X, Y); x.scale(mk, mk);
      x.fillStyle = o.mark.ok ? '#2fae6a' : '#d8433b'; x.beginPath(); x.arc(0, 0, 10, 0, 7); x.fill();
      x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath();
      if (o.mark.ok) { x.moveTo(-5, 0); x.lineTo(-1, 4); x.lineTo(5, -4); } else { x.moveTo(-4, -4); x.lineTo(4, 4); x.moveTo(4, -4); x.lineTo(-4, 4); }
      x.stroke(); x.restore();
    }
    // globo de diálogo
    if (o.bub && now - o.bub.t < 3200) {
      x.font = `10px ${FONT}`;
      const lines = wrapLines(x, o.bub.text, 150), w = Math.max(...lines.map(l => x.measureText(l).width)) + 14, h = lines.length * 13 + 10;
      let X = b.x + b.w / 2 - w / 2, Y = b.y - h - 10; X = Math.max(4, Math.min(W - w - 4, X)); Y = Math.max(4, Y);
      x.fillStyle = '#fffaf0'; rr(x, X, Y, w, h, 6); x.fill();
      x.beginPath(); x.moveTo(b.x + b.w / 2 - 4, Y + h); x.lineTo(b.x + b.w / 2, Y + h + 7); x.lineTo(b.x + b.w / 2 + 4, Y + h); x.fill();
      x.fillStyle = '#1a1030'; x.textAlign = 'left'; x.textBaseline = 'top';
      lines.forEach((l, i) => x.fillText(l, X + 7, Y + 5 + i * 13));
    }
  }

  /* ---------------- Ejecutor de comandos ---------------- */
  function runCmd(st, c, now) {
    const [op, id] = c, o = st.objs.get(id);
    switch (op) {
      case 'clr': st.objs.clear(); break;
      case 'spr': { const cv = spriteOf(c[2], st.bg); st.objs.set(id, mkObj({ type: 'spr', kind: c[2], cv, x: c[3], y: c[4], s: c[5] || 3, born: now })); break; }
      case 'box': st.objs.set(id, mkObj({ type: 'box', x: c[2], y: c[3], w: c[4], h: c[5], text: c[6], c: c[7], born: now })); break;
      case 'txt': st.objs.set(id, mkObj({ type: 'txt', x: c[2], y: c[3], text: c[4], c: c[5], size: c[6], born: now })); break;
      case 'code': st.objs.set(id, mkObj({ type: 'code', x: c[2], y: c[3], lines: c[4], born: now })); AUDIO.fx.talk && AUDIO.fx.talk(); break;
      case 'tbl': st.objs.set(id, mkObj({ type: 'tbl', x: c[2], y: c[3], cols: c[4], rows: c[5], born: now })); break;
      case 'arrow': st.objs.set(id, mkObj({ type: 'arrow', x1: c[2], y1: c[3], x2: c[4], y2: c[5], c: c[6], label: c[7], born: now })); break;
      case 'mv': if (o) o.q.push({ x: c[2], y: c[3], d: c[4] || 600 }); break;
      case 'set': if (o) { o.text = c[2]; o.fx.push({ k: 'hop', t: now, d: 300 }); } break;
      case 'hl': if (o) o.hlT = now; break;
      case 'row': if (o) o.hl = c[2]; break;
      case 'ok': if (o) { o.mark = { ok: true, t: now }; AUDIO.fx.good(); } break;
      case 'no': if (o) { o.mark = { ok: false, t: now }; AUDIO.fx.bad(); } break;
      case 'shake': if (o) o.fx.push({ k: 'shake', t: now, d: 450 }); break;
      case 'hop': if (o) o.fx.push({ k: 'hop', t: now, d: 400 }); break;
      case 'fade': if (o) o.fade = now; break;
      case 'bub': if (o) o.bub = { text: c[2], t: now }; break;
      case 'flash': st.flash = { c: col(c[1]), t: now, d: c[1] === 'k' ? 900 : 350 }; break;
      case 'sfx': if (AUDIO.fx[c[1]]) AUDIO.fx[c[1]](); break;
    }
  }
  function stepMoves(st, dt) {
    st.objs.forEach(o => {
      const m = o.q[0]; if (!m) return;
      if (m.sx == null) { m.sx = o.x; m.sy = o.y; m.e = 0; }
      m.e += dt / m.d; const k = ease(Math.min(1, m.e));
      o.x = m.sx + (m.x - m.sx) * k; o.y = m.sy + (m.y - m.sy) * k;
      if (m.e >= 1) o.q.shift();
    });
  }

  /* ---------------- Reproductor ---------------- */
  function play(id, opt = {}) {
    const sc = window.SCENES && SCENES[id];
    if (!sc || UI.AUTO) return Promise.resolve('done');
    return new Promise(resolve => {
      const m = UI.h('div', 'modal video');
      m.innerHTML = `
        <div class="v-head"><span class="v-tag">${UI.esc(opt.tag || 'Enseñanza')}</span><b>${UI.esc(opt.title || '')}</b><button class="v-x" aria-label="Cerrar video">✕</button></div>
        <div class="v-stage"><canvas width="${W * Q}" height="${H * Q}"></canvas>
          <div class="v-sub"><span class="v-who"></span><span class="v-line"></span></div>
          <div class="v-quiz" hidden></div>
          <div class="v-big" hidden>▶</div>
        </div>
        <div class="v-ctrl">
          <button class="v-prev" aria-label="Anterior">⏮</button>
          <button class="v-play" aria-label="Pausa">⏸</button>
          <button class="v-next" aria-label="Siguiente">⏭</button>
          <div class="v-dots"></div>
          <span class="v-voice"></span>
        </div>`;
      const $ = s => m.querySelector(s);
      const cv = $('canvas'), x = cv.getContext('2d'); x.scale(Q, Q);
      const st = { bg: sc.bg, objs: new Map(), flash: null };
      const total = sc.beats.length;
      let beat = -1, phase = 'beats', playing = true, clock = 0, cmdIdx = 0, waitUntil = 0, beatEnd = 0, audio = null, audioDone = false, raf = 0, last = performance.now(), done = false, missingVoice = false;
      $('.v-dots').innerHTML = Array.from({ length: total + 2 }, (_, i) => `<i data-i="${i}"></i>`).join('');
      function paintDots() { m.querySelectorAll('.v-dots i').forEach((d, i) => { const cur = phase === 'beats' ? beat : phase === 'quiz' ? total : total + 1; d.className = i < cur ? 'done' : i === cur ? 'on' : ''; }); }
      function setVoiceLabel() { $('.v-voice').textContent = missingVoice ? 'Sin narración en este tramo · subtítulos' : 'Narración: voz Qwen'; $('.v-voice').classList.toggle('warn', missingVoice); }
      function stopAudio() { if (audio) { audio.pause(); audio.onended = null; audio.onerror = null; audio = null; } }
      function startAudio(file, text) {
        stopAudio(); audioDone = false;
        const est = Math.max(3000, text.split(/\s+/).length / 2.6 * 1000);
        beatEnd = est; // se corrige con la duración real
        const a = new Audio('assets/voice/' + file + '.mp3'); audio = a;
        a.onloadedmetadata = () => { if (isFinite(a.duration)) beatEnd = a.duration * 1000 + 350; };
        a.onended = () => { audioDone = true; };
        a.onerror = () => { if (audio === a) { missingVoice = true; voiceStatus = false; audio = null; audioDone = false; setVoiceLabel(); } };
        if (window.AUDIO && AUDIO.duck) AUDIO.duck(true);
        const p = a.play(); if (p && p.catch) p.catch(() => {});
      }
      function sub(who, text) { $('.v-who').textContent = who; $('.v-line').textContent = text; $('.v-sub').classList.remove('pop'); void $('.v-sub').offsetWidth; $('.v-sub').classList.add('pop'); }
      function goBeat(i) {
        stopAudio(); phase = 'beats'; beat = i; clock = 0; cmdIdx = 0; waitUntil = 0;
        // reconstruye el estado visual: aplica de golpe los beats anteriores
        st.objs.clear(); st.flash = null;
        for (let j = 0; j < i; j++) sc.beats[j].cmds.forEach(c => { if (c[0] !== 'w' && c[0] !== 'sfx' && c[0] !== 'flash' && c[0] !== 'ok' && c[0] !== 'no') runCmd(st, c, -9999); });
        const dead = [];
        st.objs.forEach((o, k) => { o.q.forEach(mm => { o.x = mm.x; o.y = mm.y; }); o.q = []; o.fx = []; o.bub = null; if (o.fade != null) dead.push(k); });
        dead.forEach(k => st.objs.delete(k));
        const b = sc.beats[i];
        sub(b.who === 'e' ? 'Erika' : 'Radio Nocturna', b.say);
        startAudio(`${sc.id}_${i + 1}`, b.say);
        paintDots(); $('.v-quiz').hidden = true;
      }
      function showQuiz() {
        stopAudio(); phase = 'quiz'; paintDots();
        if (window.AUDIO && AUDIO.duck) AUDIO.duck(false);
        const qz = sc.quiz, box = $('.v-quiz'); box.hidden = false;
        const order = LOGIC.shuffle(qz.o.map((_, i) => i));
        box.innerHTML = `<div class="vq-tag">Pausa rápida</div><div class="vq-q">${UI.esc(qz.q)}</div><div class="vq-o">${order.map((oi, k) => `<button data-i="${oi}"><kbd>${k + 1}</kbd> ${UI.esc(qz.o[oi])}</button>`).join('')}</div><div class="vq-why" hidden></div>`;
        sub('Su turno', 'Responda. Si falla, le explico y lo intenta otra vez.');
        box.querySelectorAll('.vq-o button').forEach(bt => bt.addEventListener('click', () => {
          const ok = bt.dataset.i === '0', why = box.querySelector('.vq-why');
          why.hidden = false;
          if (ok) {
            AUDIO.fx.good(); bt.classList.add('right'); box.querySelectorAll('.vq-o button').forEach(b2 => b2.disabled = true);
            why.innerHTML = `<b>¡Eso!</b> ${UI.esc(qz.why)} <button class="btn primary vq-go">Ver lo importante ▸</button>`;
            why.querySelector('.vq-go').addEventListener('click', showRecap); why.querySelector('.vq-go').focus({ preventScroll: true });
          } else {
            AUDIO.fx.bad(); bt.classList.add('wrong'); bt.disabled = true;
            why.innerHTML = `<b>Todavía no.</b> ${UI.esc(qz.why)} Pruebe otra opción.`;
          }
        }));
      }
      function showRecap() {
        phase = 'recap'; paintDots(); $('.v-quiz').hidden = true;
        st.objs.clear();
        st.objs.set('rt', mkObj({ type: 'txt', x: W / 2, y: 34, text: 'LO IMPORTANTE', c: 'g', size: 18, born: performance.now() }));
        sc.recap.forEach((r, i) => st.objs.set('r' + i, mkObj({ type: 'box', x: 30, y: 60 + i * 50, w: 420, h: 42, text: r, c: ['b', 'v', 'p'][i % 3], born: performance.now() + 700 + i * 1100 })));
        sub('Radio Nocturna', 'Lo importante: ' + sc.recap.join(' · '));
        startAudio(`${sc.id}_r`, sc.recap.join(' '));
        const end = UI.h('div', 'v-end');
        end.innerHTML = `<button class="btn ghost v-again">↺ Ver otra vez</button><button class="btn ghost v-board">Ver la pizarra</button><button class="btn primary v-ok">Listo <kbd>Enter</kbd></button>`;
        $('.v-ctrl').appendChild(end);
        end.querySelector('.v-again').addEventListener('click', () => { end.remove(); goBeat(0); });
        end.querySelector('.v-board').addEventListener('click', () => finish('board'));
        end.querySelector('.v-ok').addEventListener('click', () => finish('done'));
        end.querySelector('.v-ok').focus({ preventScroll: true });
      }
      function finish(r) {
        if (done) return; done = true; stopAudio(); cancelAnimationFrame(raf);
        if (window.AUDIO && AUDIO.duck) AUDIO.duck(false);
        UI.close(m); resolve(r);
      }
      function togglePlay() {
        playing = !playing; $('.v-play').textContent = playing ? '⏸' : '▶'; $('.v-big').hidden = playing;
        if (audio) { if (playing) audio.play().catch(() => {}); else audio.pause(); }
      }
      function frame(now) {
        const dt = Math.min(50, now - last); last = now;
        if (playing && phase === 'beats') {
          clock += dt;
          const b = sc.beats[beat];
          while (cmdIdx < b.cmds.length && clock >= waitUntil) {
            const c = b.cmds[cmdIdx++];
            if (c[0] === 'w') waitUntil = clock + c[1]; else runCmd(st, c, now);
          }
          stepMoves(st, dt);
          const cmdsDone = cmdIdx >= b.cmds.length && clock >= waitUntil;
          const voiceDone = audio ? audioDone : clock >= beatEnd;
          if (cmdsDone && voiceDone && clock > 1200) { if (beat + 1 < total) goBeat(beat + 1); else showQuiz(); }
        } else if (playing) stepMoves(st, dt);
        x.clearRect(0, 0, W, H); drawBg(x, st.bg, now / 1000);
        st.objs.forEach(o => { if (o.born <= now) drawObj(x, o, now); });
        if (st.flash) { const e = (now - st.flash.t) / st.flash.d; if (e < 1) { x.fillStyle = st.flash.c; x.globalAlpha = st.flash.c === '#000000' ? Math.min(1, (1 - e) * 1.4) : (1 - e) * 0.6; x.fillRect(0, 0, W, H); x.globalAlpha = 1; } else st.flash = null; }
        raf = requestAnimationFrame(frame);
      }
      $('.v-x').addEventListener('click', () => finish('skip'));
      $('.v-play').addEventListener('click', togglePlay);
      $('.v-stage canvas').addEventListener('click', () => { if (phase === 'beats') togglePlay(); });
      $('.v-big').addEventListener('click', togglePlay);
      $('.v-prev').addEventListener('click', () => { if (phase === 'beats') goBeat(Math.max(0, beat - 1)); else { m.querySelector('.v-end') && m.querySelector('.v-end').remove(); goBeat(total - 1); } });
      $('.v-next').addEventListener('click', () => { if (phase === 'beats') { if (beat + 1 < total) goBeat(beat + 1); else showQuiz(); } });
      UI.open(m, e => {
        if (e.key === ' ' && phase === 'beats') { e.preventDefault(); togglePlay(); }
        else if (e.key === 'ArrowRight') $('.v-next').click();
        else if (e.key === 'ArrowLeft') $('.v-prev').click();
        else if (e.key === 'Escape') finish('skip');
        else if (phase === 'quiz' && /^[1-3]$/.test(e.key)) { const b = m.querySelectorAll('.vq-o button')[+e.key - 1]; if (b && !b.disabled) b.click(); }
        else if (e.key === 'Enter') { const go = m.querySelector('.vq-go') || m.querySelector('.v-ok'); if (go) { e.preventDefault(); go.click(); } }
      });
      setVoiceLabel();
      if (opt.start === 'quiz') { beat = total - 1; showQuiz(); } else if (opt.start === 'recap') showRecap(); else goBeat(opt.beat || 0);
      if (opt.freeze) { playing = false; }
      raf = requestAnimationFrame(frame);
      if (opt.freeze) setTimeout(() => { clock = opt.freeze; const b = sc.beats[beat]; if (b) { while (cmdIdx < b.cmds.length) { const c = b.cmds[cmdIdx++]; if (c[0] !== 'w') runCmd(st, c, performance.now() - 2000); } st.objs.forEach(o => { o.q.forEach(mm => { o.x = mm.x; o.y = mm.y; }); o.q = []; }); } stopAudio(); }, 50);
    });
  }

  return { play, has: id => !!(window.SCENES && SCENES[id]), get voiceStatus() { return voiceStatus; } };
})();
