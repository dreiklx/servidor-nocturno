/* SERVIDOR NOCTURNO · motor del juego (NYDER Games) */
(function () {
  const AUTO = UI.AUTO;
  const params = new URLSearchParams(location.search || location.hash.slice(1));
  const TS = 16, VW = 480, VH = 270;
  const canvas = document.getElementById('screen');
  const g = canvas.getContext('2d');
  const light = document.createElement('canvas'); light.width = VW; light.height = VH;
  const lg = light.getContext('2d');

  /* ======================= Estado y guardado ======================= */
  const SAVE_KEY = 'nightdare_bd2_v1';
  const fresh = () => ({ phase: 0, read: {}, talked: {}, defeated: {}, mg: {}, boss: {}, stats: {}, hearts: 5, maxHearts: 5, lemons: 3,
    unlocked: 1, checkpoint: null, finalAct: 0, done: false, chelaSeen: {}, chelaLemon: {}, playMs: 0, started: false });
  let S = fresh();
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); return true; } catch (e) { return false; } }
  function loadSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? Object.assign(fresh(), JSON.parse(s)) : null; } catch (e) { return null; } }

  const PH = CONTENT.phases.concat([CONTENT.final]);
  const FINAL_IDX = PH.length - 1;
  const lessonById = {}; const qById = {};
  CONTENT.phases.forEach(p => { p.lessons.forEach(l => { lessonById[l.id] = l; }); p.questions.forEach(q => { qById[q.id] = q; q.phase = p.id; }); });

  /* ======================= Temas visuales ======================= */
  const THEMES = {
    muelle: { under: ',', dark: 0.6, tint: '8,14,38', wall: ['#22252e', '#2c303b'], water: ['#0b2a45', '#0f3658'], floor: { '.': ['#3b404c', '#363b46'], ',': ['#6b4a2e', '#5e4128'], '_': ['#7a5634', '#6a4a2c'] }, T: 'container', lamp: '#ffcf7a', open: '_', gate: 'container', music: 'muelle' },
    estacion: { under: ',', dark: 0.55, tint: '16,10,30', wall: ['#1c1820', '#26212b'], floor: { '.': ['#57525e', '#4f4a56'], ',': ['#3b3630', '#35302b'], '=': ['#3b3630', '#35302b'] }, T: 'bench', lamp: '#ffe08a', open: ',', gate: 'barrier', music: 'estacion' },
    boveda: { under: '.', dark: 0.93, tint: '4,6,16', wall: ['#262935', '#2f3341'], floor: { '.': ['#3c3a48', '#353342'], ',': ['#30364a', '#2a3042'] }, T: 'safe', lamp: '#9fb0ff', open: '.', gate: 'vault', music: 'boveda' },
    mercado: { under: ',', dark: 0.5, tint: '24,10,8', wall: ['#2a1e18', '#33251d'], floor: { ',': ['#4a4038', '#443a33'], '.': ['#5a4e40', '#544839'] }, T: 'stall', lamp: '#ffb35a', open: ',', gate: 'shutter', music: 'mercado' },
    islas: { under: ',', dark: 0.45, tint: '4,14,34', water: ['#0a3a52', '#0d4762'], wall: ['#22303a', '#2a3a46'], floor: { '.': ['#c7b27a', '#bfa970'], ',': ['#3f7d4a', '#3a7444'], '_': ['#8a6a42', '#7a5c38'] }, T: 'palm', lamp: '#ffe9a8', open: '_', gate: 'ghost', music: 'islas' },
    torre: { under: '.', dark: 0.62, tint: '6,8,22', wall: ['#14161f', '#1a1d28'], floor: { '.': ['#2b2f3d', '#272b38'], ',': ['#3a2b52', '#35274b'] }, T: 'rack', lamp: '#7ad7ff', open: '.', gate: 'barrier', music: 'torre' }
  };

  /* ======================= Mundo ======================= */
  let W = null;
  const P = { x: 0, y: 0, dir: 'down', frame: 0, anim: 0, moving: false, stepT: 0 };
  let cam = { x: 0, y: 0 }, time = 0, fade = 0, shake = 0, flash = 0, nextFlash = 6, particles = [], teleLock = null, mode = 'boot', trainHitCd = 0;
  const keys = {};
  const hash = (x, y) => { let n = x * 374761393 + y * 668265263; n = (n ^ (n >> 13)) * 1274126177; return ((n ^ (n >> 16)) >>> 0) / 4294967295; };

  function loadPhase(i, opt = {}) {
    UI.theme = PH[i].theme || 'final';
    AUDIO.setStep(PH[i].theme || 'torre'); AUDIO.ambient(PH[i].theme || 'torre');
    const def = PH[i];
    const map = MAPS.build(def.id);
    const theme = THEMES[def.theme];
    W = { i, def, map, theme, tiles: map.tiles.map(r => r.split('')), ents: [], gatesOpen: new Set(), stat: null };
    S.phase = i;
    const dkey = def.id; S.defeated[dkey] = S.defeated[dkey] || {};
    map.ents.forEach(e => {
      const r = Object.assign({}, e, { px: e.x * TS + 8, py: e.y * TS + 12, hx: e.x * TS + 8, hy: e.y * TS + 12, t: Math.random() * 10, vx: 0, vy: 0 });
      if (e.type === 'enemy' && S.defeated[dkey][e.key]) return;
      W.ents.push(r);
    });
    if (S.boss[def.boss && def.boss.id] && def.id !== 'final') spawnPortal();
    W.gateWater = new Set();
    map.gates.forEach(gt => gt.cells.forEach(([x, y]) => { if (theme.water && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => (W.tiles[y + b] || [])[x + a] === '~')) W.gateWater.add(x + ',' + y); }));
    map.gates.forEach(gt => { if (gateOk(gt.id)) openGate(gt, true); });
    let sp = map.start;
    if (opt.spawn) sp = opt.spawn;
    else if (S.checkpoint && S.checkpoint.phase === i) sp = { x: S.checkpoint.x, y: S.checkpoint.y };
    P.x = sp.x * TS + 8; P.y = sp.y * TS + 12; P.dir = 'down';
    W.stat = renderStatic();
    snapCam();
    AUDIO.music(theme.music);
    particles = []; teleLock = null;
    updateHud(true);
  }

  function spawnPortal() {
    const b = W.ents.find(e => e.type === 'boss');
    if (b && !W.ents.some(e => e.type === 'portal')) W.ents.push({ type: 'portal', x: b.x, y: b.y, px: b.x * TS + 8, py: b.y * TS + 12, solid: false, t: 0 });
    if (b) b.gone = true;
  }

  /* ---------- puertas y progreso ---------- */
  function zoneLessons(z) { return (W.map.zoneLessons[z] || []).map(i => W.def.lessons[i].id); }
  function zoneEnemies(z) { return W.map.ents.filter(e => e.type === 'enemy' && e.zone === z); }
  function enemiesLeft(z) { return zoneEnemies(z).filter(e => !S.defeated[W.def.id][e.key]).length; }
  function gateOk(id) {
    const d = W.def;
    if (id === 1) return zoneLessons(0).every(l => S.read[l]);
    if (id === 2) return enemiesLeft(1) === 0 && !!S.mg[d.minigames[0]] && zoneLessons(1).every(l => S.read[l]);
    if (id === 3) return enemiesLeft(2) === 0 && !!S.mg[d.minigames[1]];
    return false;
  }
  function openGate(gt, silent) {
    if (W.gatesOpen.has(gt.id)) return;
    W.gatesOpen.add(gt.id);
    gt.cells.forEach(([x, y]) => { W.tiles[y][x] = W.theme.open; });
    W.stat = renderStatic();
    if (!silent) {
      AUDIO.fx.open(); shake = 8;
      gt.cells.forEach(([x, y]) => burst(x * TS + 8, y * TS + 8, '#ffd34d', 10));
      UI.toast(gt.id === 3 ? '¡Se abrió el camino al jefe!' : '¡Se abrió un nuevo paso!', 'gold');
    }
  }
  function updateGates() { W.map.gates.forEach(gt => { if (!W.gatesOpen.has(gt.id) && gateOk(gt.id)) openGate(gt, false); }); updateHud(true); }

  function objective() {
    const d = W.def, id = d.id;
    const ent = t => W.ents.find(e => e.type === t);
    const it = (t, done) => ({ t, done: !!done });
    if (id === 'final') {
      if (!S.chelaSeen.final) return { text: 'Hable con Erika en la recepción', target: ent('chela'), head: 'Antes de subir', list: [it('Hablar con Erika (guarda la partida)', false), it('Enfrentar al Profe Mauricio', false)] };
      if (!S.done) return { text: 'Suba a la cima: el Profe Mauricio lo espera', target: ent('boss'), head: 'Examen final', list: [it('Hablar con Erika', true), it('Superar los 3 actos del Profe Mauricio', false)] };
      return { text: '¡Servidor encendido! Gracias por jugar.', target: null, head: 'Listo', list: [] };
    }
    if (!S.talked[id]) return { text: `Hable con ${d.npc.name} (el signo !)`, target: ent('npc'), head: 'Para empezar', list: [it(`Hablar con ${d.npc.name}`, false)] };
    const title = l => lessonById[l].title;
    const lessonEnt = ids => W.ents.find(e => e.type === 'lesson' && ids.includes(d.lessons[e.idx].id) && !S.read[d.lessons[e.idx].id]);
    const nearestEnemy = z => W.ents.filter(e => e.type === 'enemy' && e.zone === z).sort((a, b) => dist(a.px, a.py, P.x, P.y) - dist(b.px, b.py, P.x, P.y))[0];
    const mgEnt = k => W.ents.find(e => e.type === 'mg' && e.idx === k);
    const mgName = k => CONTENT.mg[d.minigames[k]].title;
    if (!W.gatesOpen.has(1)) {
      const z = zoneLessons(0);
      return { text: `Vea las pizarras brillantes (${z.filter(l => S.read[l]).length}/${z.length})`, target: lessonEnt(z), head: 'Para abrir el primer paso', list: z.map(l => it('Ver: ' + title(l), S.read[l])) };
    }
    if (!W.gatesOpen.has(2)) {
      const z = zoneLessons(1), left = enemiesLeft(1), mgd = !!S.mg[d.minigames[0]];
      const t = lessonEnt(z) || (left ? nearestEnemy(1) : null) || (!mgd ? mgEnt(0) : null);
      const list = z.map(l => it('Ver: ' + title(l), S.read[l])).concat([it(`Vencer ${d.enemy.name} (${3 - left}/3)`, !left), it(`Prueba: ${mgName(0)}`, mgd)]);
      const nx = list.find(x => !x.done);
      return { text: nx ? nx.t : 'Siga al marcador', target: t, head: 'Para abrir el segundo paso', list };
    }
    if (!W.gatesOpen.has(3)) {
      const z = zoneLessons(2), left = enemiesLeft(2), mgd = !!S.mg[d.minigames[1]];
      const t = lessonEnt(z) || (left ? nearestEnemy(2) : null) || (!mgd ? mgEnt(1) : null);
      const list = z.map(l => it('Ver: ' + title(l), S.read[l])).concat([it(`Vencer ${d.enemy.name} (${3 - left}/3)`, !left), it(`Prueba: ${mgName(1)}`, mgd)]);
      const nx = list.find(x => !x.done);
      return { text: nx ? nx.t : 'Siga al marcador', target: t, head: 'Para llegar al jefe', list };
    }
    if (!S.boss[d.boss.id]) {
      const list = [it('Pasar por el puesto de Erika Ceviches (guarda)', S.chelaSeen[id]), it(`Vencer a ${d.boss.name}`, false)];
      if (!S.chelaSeen[id]) return { text: 'Pase por el puesto de Erika Ceviches', target: ent('chela'), head: 'Antes del jefe', list };
      return { text: `Enfrente a ${d.boss.name}`, target: ent('boss'), head: 'Jefe de la fase', list };
    }
    return { text: 'Entre al portal para seguir', target: ent('portal'), head: 'Fase superada', list: [it('Entrar al portal', false)] };
  }

  /* ======================= Render estático ======================= */
  function renderStatic() {
    const m = W.map, th = W.theme;
    const c = document.createElement('canvas'); c.width = m.w * TS; c.height = m.h * TS;
    const x = c.getContext('2d');
    const isWall = (i, j) => j < 0 || i < 0 || j >= m.h || i >= m.w || W.tiles[j][i] === '#';
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
      const ch = W.tiles[j][i], X = i * TS, Y = j * TS, r = hash(i, j);
      if (ch === '~' || (ch === 'G' && W.gateWater && W.gateWater.has(i + ',' + j))) continue;
      if (ch === '#') {
        x.fillStyle = th.wall[(i + j) % 2]; x.fillRect(X, Y, TS, TS);
        x.fillStyle = 'rgba(255,255,255,0.04)'; if (r < 0.5) x.fillRect(X + 2, Y + 3, 5, 2);
        if (!isWall(i, j + 1)) { x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(X, Y + 11, TS, 5); x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(X, Y + 11, TS, 1); }
        continue;
      }
      const base = th.floor[ch] || th.floor['.'] || th.floor[','];
      drawFloor(x, ch, base, X, Y, r, i, j);
      if (j > 0 && W.tiles[j - 1][i] === '#') { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(X, Y, TS, 4); }
      if (ch === 'T') drawObstacle(x, th.T, X, Y, r, i, j);
      if (ch === 'o') drawLampPost(x, X, Y, th.lamp);
    }
    return c;
  }
  function drawFloor(x, ch, base, X, Y, r, i, j) {
    const th = W.theme;
    const fl = ch === 'T' || ch === 'o' || ch === 'G' ? (th.floor[th.under] || base) : base;
    x.fillStyle = fl[(i + j) % 2]; x.fillRect(X, Y, TS, TS);
    if (ch === ',' && th.T === 'container') { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(X, Y + 5, TS, 1); x.fillRect(X, Y + 11, TS, 1); if (r < 0.3) x.fillRect(X + (r * 40 | 0) % 14, Y + 2, 1, 2); }
    else if (ch === '_') { x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(X + 4, Y, 1, TS); x.fillRect(X + 10, Y, 1, TS); x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(X, Y, TS, 1); }
    else if (ch === '=') {
      for (let s = 0; s < 16; s += 4) { x.fillStyle = '#5a3b22'; x.fillRect(X + s, Y + 2, 2, 12); }
      x.fillStyle = '#9aa0ad'; x.fillRect(X, Y + 4, TS, 2); x.fillRect(X, Y + 10, TS, 2);
      x.fillStyle = '#d6dbe6'; x.fillRect(X, Y + 4, TS, 1); x.fillRect(X, Y + 10, TS, 1);
    } else {
      x.fillStyle = 'rgba(255,255,255,0.05)'; if (r < 0.35) x.fillRect(X + (r * 97 | 0) % 13, Y + (r * 53 | 0) % 13, 2, 2);
      x.fillStyle = 'rgba(0,0,0,0.12)'; if (r > 0.75) x.fillRect(X + (r * 31 | 0) % 12, Y + (r * 71 | 0) % 12, 3, 1);
      if (th.T === 'safe' && ch === '.' && (i + j) % 2) { x.fillStyle = 'rgba(255,255,255,0.03)'; x.fillRect(X, Y, TS, TS); }
    }
  }
  function drawObstacle(x, kind, X, Y, r, i, j) {
    if (kind === 'container') {
      const cols = ['#b8452f', '#2f6db8', '#3a9a5a', '#c99a2e']; const c = cols[Math.floor(r * 4)];
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(X + 1, Y + 13, 15, 3);
      x.fillStyle = c; x.fillRect(X, Y - 3, 16, 15);
      x.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 2; k < 16; k += 3) x.fillRect(X + k, Y - 3, 1, 15);
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(X, Y - 3, 16, 2);
    } else if (kind === 'bench') {
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(X + 1, Y + 11, 15, 3);
      x.fillStyle = '#7a4f2b'; x.fillRect(X + 1, Y + 3, 14, 4); x.fillRect(X + 1, Y + 8, 14, 3);
      x.fillStyle = '#2b2b33'; x.fillRect(X + 2, Y + 11, 2, 3); x.fillRect(X + 12, Y + 11, 2, 3);
    } else if (kind === 'safe') {
      x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(X + 1, Y + 13, 15, 3);
      x.fillStyle = '#5b6274'; x.fillRect(X + 1, Y - 2, 14, 15); x.fillStyle = '#7b8396'; x.fillRect(X + 1, Y - 2, 14, 2);
      x.fillStyle = '#c9cfdb'; x.beginPath(); x.arc(X + 8, Y + 5, 3, 0, 7); x.fill(); x.fillStyle = '#3a3f4c'; x.fillRect(X + 8, Y + 3, 1, 3);
    } else if (kind === 'stall') {
      const cols = [['#d8433b', '#f4efe0'], ['#2f8fd8', '#f4efe0'], ['#e0a030', '#5a2a10'], ['#3aa05a', '#f4efe0']]; const [a, b] = cols[Math.floor(r * 4)];
      x.fillStyle = '#5a3b22'; x.fillRect(X, Y + 4, 16, 10); x.fillStyle = '#7a5232'; x.fillRect(X, Y + 4, 16, 2);
      for (let k = 0; k < 16; k += 4) { x.fillStyle = k % 8 ? a : b; x.fillRect(X + k, Y - 4, 4, 6); }
      const fr = ['#ff6a3d', '#ffd34d', '#7ad35a', '#e04a8a'];
      for (let k = 0; k < 4; k++) { x.fillStyle = fr[(k + (r * 9 | 0)) % 4]; x.fillRect(X + 2 + k * 3, Y + 7, 2, 2); }
    } else if (kind === 'palm') {
      x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.ellipse(X + 8, Y + 14, 6, 2, 0, 0, 7); x.fill();
      if (r < 0.3) { x.fillStyle = '#6a6f78'; x.fillRect(X + 3, Y + 6, 10, 8); x.fillStyle = '#868c96'; x.fillRect(X + 4, Y + 6, 8, 2); return; }
      x.fillStyle = '#7a5530'; for (let k = 0; k < 19; k++) x.fillRect(X + 6 + Math.round(Math.sin(k / 6) * 2), Y + 12 - k, 3, 1);
      const cx = X + 8, cy = Y - 7;
      [[1, 0], [-1, 0], [1, 0.5], [-1, 0.5], [0.6, -0.7], [-0.6, -0.7]].forEach(([dx, dy], n) => { x.fillStyle = n % 2 ? '#2f8a46' : '#4fb062'; for (let k = 0; k < 8; k++) x.fillRect(cx + Math.round(dx * k), cy + Math.round(dy * k + k * k / 12), 2, 2); });
      x.fillStyle = '#5a3a20'; x.fillRect(cx - 1, cy + 1, 3, 3);
    } else if (kind === 'rack') {
      x.fillStyle = '#0d0f16'; x.fillRect(X + 1, Y - 6, 14, 20); x.fillStyle = '#232838'; x.fillRect(X + 2, Y - 5, 12, 18);
      for (let k = 0; k < 5; k++) { x.fillStyle = '#121520'; x.fillRect(X + 3, Y - 4 + k * 3.5, 10, 2); }
    }
  }
  function drawLampPost(x, X, Y, col) {
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(X + 5, Y + 13, 7, 2);
    x.fillStyle = '#1b1d24'; x.fillRect(X + 7, Y - 6, 2, 20);
    x.fillStyle = col; x.fillRect(X + 5, Y - 9, 6, 4);
    x.fillStyle = '#fff'; x.fillRect(X + 7, Y - 8, 2, 2);
  }

  /* ======================= Colisiones ======================= */
  function tileAt(px, py) { const i = Math.floor(px / TS), j = Math.floor(py / TS); if (i < 0 || j < 0 || i >= W.map.w || j >= W.map.h) return '#'; return W.tiles[j][i]; }
  function solidEntAt(i, j) { return W.ents.some(e => e.solid && !e.gone && e.x === i && e.y === j); }
  function blocked(px, py) {
    const pts = [[px - 5, py - 5], [px + 5, py - 5], [px - 5, py], [px + 5, py]];
    return pts.some(([x, y]) => { const c = tileAt(x, y); if ('~#ToG'.includes(c)) return true; return solidEntAt(Math.floor(x / TS), Math.floor(y / TS)); });
  }
  const dist = (a, b, c, d) => Math.hypot(a - c, b - d);

  /* ======================= Actualización ======================= */
  function update(dt) {
    time += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 30);
    if (trainHitCd > 0) trainHitCd -= dt;
    particles = particles.filter(p => (p.life -= dt) > 0);
    particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; });
    weather(dt);
    if (mode !== 'play' || UI.busy() || fade > 0.01) { P.moving = false; return; }
    S.playMs += dt * 1000;
    // movimiento
    let dx = 0, dy = 0;
    if (keys.ArrowLeft || keys.a || keys.A) dx -= 1;
    if (keys.ArrowRight || keys.d || keys.D) dx += 1;
    if (keys.ArrowUp || keys.w || keys.W) dy -= 1;
    if (keys.ArrowDown || keys.s || keys.S) dy += 1;
    P.moving = !!(dx || dy);
    if (P.moving) {
      const sp = (keys.Shift ? 115 : 78) * dt, n = Math.hypot(dx, dy);
      dx = dx / n * sp; dy = dy / n * sp;
      if (Math.abs(dx) > Math.abs(dy)) P.dir = dx < 0 ? 'left' : 'right'; else P.dir = dy < 0 ? 'up' : 'down';
      if (!blocked(P.x + dx, P.y)) P.x += dx;
      if (!blocked(P.x, P.y + dy)) P.y += dy;
      P.anim += dt * (keys.Shift ? 12 : 8); P.frame = Math.floor(P.anim) % 2;
      P.stepT -= dt; if (P.stepT <= 0) { AUDIO.fx.step(); P.stepT = keys.Shift ? 0.2 : 0.3; }
    } else { P.frame = 0; }
    // entidades
    W.ents.forEach(e => {
      e.t += dt;
      if (e.type === 'enemy' || e.type === 'tip') wander(e, dt, e.type === 'enemy' ? 14 : 18);
      if (e.type === 'portal' && dist(e.px, e.py, P.x, P.y) < 14 && e.t > 1 && e.t < 1.2) e.t = 0.5; // no entrar sin querer
    });
    // contacto con enemigos
    const foe = W.ents.find(e => e.type === 'enemy' && dist(e.px, e.py, P.x, P.y) < 12);
    if (foe) { enemyBattle(foe); return; }
    // portal y teletransporte
    const pi = Math.floor(P.x / TS), pj = Math.floor((P.y - 3) / TS);
    const portal = W.ents.find(e => e.type === 'portal' && e.t > 1.2 && dist(e.px, e.py - 4, P.x, P.y) < 12);
    if (portal) { finishPhase(); return; }
    const tp = W.ents.find(e => e.type === 'tele' && e.x === pi && e.y === pj);
    if (tp && teleLock !== tp.x + ',' + tp.y) { teleport(tp); return; }
    if (!tp) teleLock = null;
    // trenes
    if (W.map.trains.length) trains();
    updateCam(dt);
    if ((time * 4 | 0) % 2 === 0) updateHud();
  }

  function wander(e, dt, speed) {
    e.wt = (e.wt || 0) - dt;
    if (e.wt <= 0) { e.wt = 1 + Math.random() * 2.2; const a = Math.random() * 6.28; const go = Math.random() < 0.7; e.vx = go ? Math.cos(a) * speed : 0; e.vy = go ? Math.sin(a) * speed : 0; }
    const nx = e.px + e.vx * dt, ny = e.py + e.vy * dt;
    if (dist(nx, ny, e.hx, e.hy) > 26 || blockedFor(nx, ny)) { e.vx *= -1; e.vy *= -1; return; }
    e.px = nx; e.py = ny;
  }
  function blockedFor(px, py) { const c1 = tileAt(px - 5, py - 3), c2 = tileAt(px + 5, py); if ('~#ToG='.includes(c1) || '~#ToG='.includes(c2)) return true; return solidEntAt(Math.floor(px / TS), Math.floor(py / TS)); }

  /* ---------- trenes (Fase 2) ---------- */
  function trainState(tr) {
    const cross = 2.2, c = (time + tr.offset) % tr.period;
    const span = (tr.x1 - tr.x0 + 1 + tr.len) * TS;
    if (c < cross) { const head = tr.x0 * TS + (c / cross) * span; return { on: true, head, tail: head - tr.len * TS, warn: false }; }
    return { on: false, warn: c > tr.period - 1.6 };
  }
  function trains() {
    W.map.trains.forEach(tr => {
      const st = trainState(tr);
      if (st.warn && !tr.warned && dist(P.x, P.y, P.x, tr.y * TS + 8) < 120) { AUDIO.fx.train(); tr.warned = true; }
      if (!st.warn) tr.warned = false;
      if (st.on) {
        const pj = Math.floor((P.y - 3) / TS);
        if (pj === tr.y && P.x > st.tail - 4 && P.x < st.head + 4 && trainHitCd <= 0) {
          trainHitCd = 1;
          const up = !blocked(P.x, (tr.y - 1) * TS + 12) && W.tiles[tr.y - 1][Math.floor(P.x / TS)] !== '=';
          P.y = (up ? tr.y - 1 : tr.y + 1) * TS + 12;
          shake = 10; AUDIO.fx.hit();
          UI.toast('¡Uff! El tren de datos pasó rozando. Espere a que se apague la luz roja.', 'warn');
        }
        if (Math.random() < 0.4) particles.push({ x: st.head - 6, y: tr.y * TS - 6, vx: -20 + Math.random() * 10, vy: -18, life: 0.9, c: 'rgba(220,220,230,0.5)', s: 3 });
      }
    });
  }

  async function teleport(tp) {
    mode = 'busy';
    AUDIO.fx.sparkle();
    await fadeTo(1, 250);
    P.x = tp.tx * TS + 8; P.y = tp.ty * TS + 12; teleLock = tp.tx + ',' + tp.ty; snapCam();
    UI.toast('Servidor vinculado: <code>Sucursal.Isla.dbo.Muelle</code>', 'gold');
    await fadeTo(0, 250);
    mode = 'play';
  }

  /* ======================= Clima y partículas ======================= */
  function burst(x, y, c, n = 14) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, s = 20 + Math.random() * 60; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, g: 60, life: 0.5 + Math.random() * 0.5, c, s: 2 }); } }
  function weather(dt) {
    if (!W) return;
    const th = W.def.theme, vx = cam.x, vy = cam.y;
    if (th === 'boveda') {
      for (let k = 0; k < 3; k++) particles.push({ x: vx + Math.random() * (VW + 60), y: vy - 10, vx: -60, vy: 320, life: 0.9, c: 'rgba(150,170,255,0.35)', s: 1, rain: true });
      nextFlash -= dt; if (nextFlash <= 0) { flash = 1; nextFlash = 7 + Math.random() * 7; setTimeout(() => AUDIO.fx.thunder(), 180); }
    }
    if (th === 'mercado' && Math.random() < dt * 6) particles.push({ x: vx + Math.random() * VW, y: vy + VH + 4, vx: (Math.random() - 0.5) * 8, vy: -14 - Math.random() * 10, life: 6, c: Math.random() < 0.5 ? '#ffb35a' : '#ff7a3a', s: 2, glow: true });
    if (th === 'islas' && Math.random() < dt * 4) particles.push({ x: vx + Math.random() * VW, y: vy + Math.random() * VH, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 3, c: '#d8ff7a', s: 1, glow: true });
    if (th === 'torre' && Math.random() < dt * 8) particles.push({ x: vx + Math.random() * VW, y: vy + VH, vx: 0, vy: -30, life: 5, c: Math.random() < 0.5 ? '#7ad7ff' : '#6d6ff0', s: 1, glow: true });
    if (th === 'muelle' && Math.random() < dt * 3) particles.push({ x: vx + Math.random() * VW, y: vy + Math.random() * VH, vx: 0, vy: 0, life: 0.6, c: 'rgba(200,230,255,0.7)', s: 1, sparkle: true });
    if (flash > 0) flash = Math.max(0, flash - dt * 4);
  }

  /* ======================= Cámara ======================= */
  function camTarget() {
    const mw = W.map.w * TS, mh = W.map.h * TS;
    let x = P.x - VW / 2, y = P.y - VH / 2;
    x = mw <= VW ? (mw - VW) / 2 : Math.max(0, Math.min(mw - VW, x));
    y = mh <= VH ? (mh - VH) / 2 : Math.max(0, Math.min(mh - VH, y));
    return { x, y };
  }
  function snapCam() { cam = camTarget(); }
  function updateCam(dt) { const t = camTarget(); cam.x += (t.x - cam.x) * Math.min(1, dt * 8); cam.y += (t.y - cam.y) * Math.min(1, dt * 8); }

  /* ======================= Dibujo ======================= */
  function render() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    if (mode === 'title' || mode === 'boot' || !W) { drawTitleBg(); return; }
    const th = W.theme;
    const sx = shake ? (Math.random() - 0.5) * shake : 0, sy = shake ? (Math.random() - 0.5) * shake : 0;
    const ox = Math.round(cam.x + sx), oy = Math.round(cam.y + sy);
    g.fillStyle = '#05060c'; g.fillRect(0, 0, VW, VH);
    // agua animada
    if (th.water) {
      const i0 = Math.max(0, Math.floor(ox / TS)), j0 = Math.max(0, Math.floor(oy / TS));
      for (let j = j0; j < Math.min(W.map.h, j0 + 19); j++) for (let i = i0; i < Math.min(W.map.w, i0 + 32); i++) {
        if (W.tiles[j][i] !== '~' && W.tiles[j][i] !== 'G') continue;
        const X = i * TS - ox, Y = j * TS - oy;
        g.fillStyle = th.water[(i + j) % 2]; g.fillRect(X, Y, TS, TS);
        const w = Math.sin(time * 1.6 + i * 0.7 + j * 1.3);
        if (w > 0.6) { g.fillStyle = 'rgba(160,210,255,0.18)'; g.fillRect(X + 3 + (w * 4 | 0), Y + 6, 6, 1); }
      }
    }
    g.drawImage(W.stat, -ox, -oy);
    // puertas cerradas
    W.map.gates.forEach(gt => { if (!W.gatesOpen.has(gt.id)) gt.cells.forEach(([i, j]) => drawGate(i * TS - ox, j * TS - oy, W.gateWater.has(i + ',' + j) ? 'ghost' : th.gate, gt)); });
    // trenes
    W.map.trains.forEach(tr => drawTrain(tr, ox, oy));
    // entidades + jugador ordenados por y
    const list = W.ents.filter(e => !e.gone || e.type === 'boss').map(e => ({ y: e.py, d: () => drawEnt(e, ox, oy) }));
    list.push({ y: P.y, d: () => drawPlayer(ox, oy) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
    // partículas
    particles.forEach(p => {
      if (p.rain) { g.strokeStyle = p.c; g.beginPath(); g.moveTo(p.x - ox, p.y - oy); g.lineTo(p.x - ox - 2, p.y - oy + 6); g.stroke(); return; }
      g.fillStyle = p.c; const a = p.sparkle ? Math.sin(p.life * 10) : 1; g.globalAlpha = Math.max(0, Math.min(1, a * Math.min(1, p.life * 2))); g.fillRect(p.x - ox, p.y - oy, p.s, p.s); g.globalAlpha = 1;
    });
    drawLighting(ox, oy);
    drawMarkers(ox, oy);
    if (flash > 0) { g.fillStyle = `rgba(220,230,255,${flash * 0.55})`; g.fillRect(0, 0, VW, VH); }
    if (fade > 0) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, VW, VH); }
  }

  function drawGate(X, Y, kind, gt) {
    if (kind === 'container') { g.fillStyle = '#e07a2a'; g.fillRect(X, Y - 3, 16, 17); g.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 2; k < 16; k += 3) g.fillRect(X + k, Y - 3, 1, 17); g.fillStyle = '#ffd34d'; g.fillRect(X + 2, Y + 4, 12, 2); }
    else if (kind === 'barrier') { g.fillStyle = '#2b2b33'; g.fillRect(X, Y, 16, 16); for (let k = 0; k < 16; k += 4) { g.fillStyle = (k / 4) % 2 ? '#f4f0ff' : '#d8433b'; g.fillRect(X + k, Y + 6, 4, 4); } if (Math.sin(time * 6) > 0) { g.fillStyle = '#ff3b3b'; g.fillRect(X + 7, Y + 1, 2, 2); } }
    else if (kind === 'vault') { g.fillStyle = '#4a5064'; g.fillRect(X, Y, 16, 16); g.fillStyle = '#8890a6'; g.beginPath(); g.arc(X + 8, Y + 8, 6, 0, 7); g.fill(); g.fillStyle = '#2a2f3c'; g.save(); g.translate(X + 8, Y + 8); g.rotate(time); g.fillRect(-1, -6, 2, 12); g.fillRect(-6, -1, 12, 2); g.restore(); }
    else if (kind === 'shutter') { g.fillStyle = '#5a5f6a'; g.fillRect(X, Y, 16, 16); g.fillStyle = '#3c4049'; for (let k = 1; k < 16; k += 3) g.fillRect(X, Y + k, 16, 1); g.fillStyle = '#e0a030'; g.fillRect(X + 6, Y + 12, 4, 2); }
    else if (kind === 'ghost') { g.strokeStyle = `rgba(180,230,255,${0.25 + 0.15 * Math.sin(time * 3)})`; g.setLineDash([2, 2]); g.strokeRect(X + 1.5, Y + 1.5, 13, 13); g.setLineDash([]); }
  }
  function drawTrain(tr, ox, oy) {
    const st = trainState(tr), Y = tr.y * TS - oy;
    // semáforos
    [tr.x0 - 1, tr.x1 + 1].forEach(i => { const X = i * TS - ox; g.fillStyle = '#111'; g.fillRect(X + 6, Y - 10, 4, 10); g.fillStyle = (st.warn || st.on) && Math.sin(time * 14) > 0 ? '#ff3b3b' : '#3a1010'; g.fillRect(X + 6, Y - 10, 4, 4); });
    if (!st.on) return;
    const x0 = st.tail - ox;
    for (let k = 0; k < tr.len; k++) {
      const X = x0 + k * TS; const head = k === tr.len - 1;
      g.fillStyle = head ? '#c0392b' : (k % 2 ? '#2f6db8' : '#3a9a5a'); g.fillRect(X + 1, Y - 6, 14, 18);
      g.fillStyle = '#f4f0ff'; if (!head) { g.fillRect(X + 3, Y - 3, 4, 4); g.fillRect(X + 9, Y - 3, 4, 4); }
      g.fillStyle = '#111'; g.fillRect(X + 2, Y + 10, 4, 3); g.fillRect(X + 10, Y + 10, 4, 3);
      if (head) { g.fillStyle = '#ffe066'; g.fillRect(X + 12, Y, 3, 4); }
    }
  }

  function drawEnt(e, ox, oy) {
    const X = Math.round(e.px - ox), Y = Math.round(e.py - oy), bob = Math.sin(e.t * 3) * 1.5;
    const shadow = (w = 6) => { g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(X, Y + 1, w, 2, 0, 0, 7); g.fill(); };
    switch (e.type) {
      case 'npc': shadow(); g.drawImage(SPR.guide(W.def.npc.tint), X - 8, Y - 15); if (!S.talked[W.def.id]) bubble(X, Y - 20, '!'); break;
      case 'tip': shadow(); g.drawImage(SPR.tipNpc(e.x + e.y), X - 8, Y - 15 + (Math.abs(e.vx) + Math.abs(e.vy) > 0 ? Math.abs(Math.sin(e.t * 8)) * -1 : 0)); break;
      case 'lesson': {
        const L = W.def.lessons[e.idx], read = S.read[L.id];
        g.fillStyle = '#3a2a1a'; g.fillRect(X - 1, Y - 6, 2, 8);
        g.fillStyle = read ? '#2a3a2e' : '#1c2a3a'; g.fillRect(X - 8, Y - 16, 16, 11);
        g.fillStyle = read ? '#4fd18b' : `rgba(122,215,255,${0.6 + 0.4 * Math.sin(time * 4)})`; g.fillRect(X - 7, Y - 15, 14, 1); g.fillRect(X - 7, Y - 12, 10, 1); g.fillRect(X - 7, Y - 9, 12, 1);
        g.strokeStyle = read ? '#4fd18b' : '#7ad7ff'; g.strokeRect(X - 8.5, Y - 16.5, 17, 12);
        if (!read) bubble(X, Y - 22, '?'); else { g.fillStyle = '#4fd18b'; g.fillRect(X + 5, Y - 19, 2, 2); g.fillRect(X + 7, Y - 21, 2, 2); }
        break; }
      case 'enemy': {
        shadow(7); const spr = SPR.enemy(W.def.enemy.sprite);
        g.drawImage(spr, X - 8, Y - 15 + bob);
        break; }
      case 'mg': {
        const done = S.mg[W.def.minigames[e.idx]];
        g.fillStyle = '#20232e'; g.fillRect(X - 7, Y - 4, 14, 6); g.fillStyle = '#343a4c'; g.fillRect(X - 7, Y - 4, 14, 2);
        const c = done ? '#4fd18b' : '#ffd34d';
        g.fillStyle = c; g.save(); g.translate(X, Y - 13 + bob); g.rotate(time * 1.5); g.fillRect(-4, -4, 8, 8); g.restore();
        g.fillStyle = '#1a1020'; g.font = '8px "Pixelify Sans", monospace'; g.textAlign = 'center'; g.fillText(done ? '✓' : '★', X, Y - 10 + bob);
        break; }
      case 'chela': drawCart(X, Y); break;
      case 'boss': {
        if (e.gone) break;
        const spr = W.def.id === 'final' ? SPR.mauricio() : SPR.enemy(W.def.boss.sprite);
        const s = W.def.id === 'final' ? 2 : 3;
        g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(X, Y + 2, 8 * s / 2 + 4, 4, 0, 0, 7); g.fill();
        if (W.def.id !== 'final') { g.fillStyle = `rgba(255,60,90,${0.15 + 0.1 * Math.sin(time * 3)})`; g.beginPath(); g.arc(X, Y - 8 * s, 10 * s, 0, 7); g.fill(); }
        g.drawImage(spr, X - 8 * s, Y - 16 * s + (W.def.id === 'final' ? 0 : bob * 2), 16 * s, 16 * s);
        const name = W.def.boss.name; label(X, Y - 16 * s - 4, name, '#ff8fa0');
        break; }
      case 'portal': {
        for (let k = 0; k < 3; k++) { g.strokeStyle = `rgba(${k ? '122,215,255' : '255,211,77'},${0.8 - k * 0.2})`; g.lineWidth = 2; g.beginPath(); g.ellipse(X, Y - 6, 9 - k * 2 + Math.sin(time * 4 + k) * 1.5, 12 - k * 3, 0, 0, 7); g.stroke(); }
        g.lineWidth = 1; label(X, Y - 22, 'Portal', '#ffd34d');
        break; }
      case 'tele': {
        g.strokeStyle = `rgba(122,215,255,${0.5 + 0.4 * Math.sin(time * 5)})`; g.beginPath(); g.ellipse(X, Y - 4, 7, 3, 0, 0, 7); g.stroke();
        g.fillStyle = 'rgba(122,215,255,0.25)'; g.beginPath(); g.ellipse(X, Y - 4, 5, 2, 0, 0, 7); g.fill();
        break; }
      case 'lib': {
        g.fillStyle = '#3a2a1a'; g.fillRect(X - 8, Y - 18, 16, 20); const bc = ['#d8433b', '#2f8fd8', '#e0a030', '#3aa05a', '#8a3fc4'];
        for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) { g.fillStyle = bc[(k + r) % 5]; g.fillRect(X - 7 + k * 3, Y - 17 + r * 6, 2, 5); }
        label(X, Y - 22, 'Libreta', '#7ad7ff');
        break; }
    }
  }
  function drawCart(X, Y) {
    // sombrilla
    for (let k = 0; k < 28; k += 4) { g.fillStyle = (k / 4) % 2 ? '#f4efe0' : '#2fa8a0'; g.fillRect(X - 20 + k, Y - 34, 4, 5); }
    g.fillStyle = '#5a3b22'; g.fillRect(X + 7, Y - 29, 2, 18);
    // carrito
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X - 18, Y, 30, 3);
    g.fillStyle = '#2fa8a0'; g.fillRect(X - 18, Y - 12, 26, 12); g.fillStyle = '#7ad7c8'; g.fillRect(X - 18, Y - 12, 26, 2);
    g.fillStyle = '#f4efe0'; g.fillRect(X - 16, Y - 8, 22, 5); g.fillStyle = '#d8433b'; g.font = '6px "Pixelify Sans", monospace'; g.textAlign = 'center'; g.fillText('CEVICHE', X - 5, Y - 3.5);
    // vasitos
    for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(X - 15 + k * 5, Y - 16, 4, 4); g.fillStyle = '#ff9a5a'; g.fillRect(X - 15 + k * 5, Y - 16, 4, 2); }
    g.fillStyle = '#111'; g.beginPath(); g.arc(X - 13, Y + 1, 2.5, 0, 7); g.arc(X + 5, Y + 1, 2.5, 0, 7); g.fill();
    g.drawImage(SPR.chela(), X + 6, Y - 16);
    if (!S.chelaSeen[W.def.id]) bubble(X + 14, Y - 22, '♥');
    label(X - 2, Y - 38, 'Erika Ceviches', '#ffb35a');
  }
  function bubble(X, Y, ch) {
    const b = Math.sin(time * 5) * 1.5;
    g.fillStyle = '#ffd34d'; g.fillRect(X - 4, Y - 5 + b, 9, 9); g.fillStyle = '#1a1020'; g.font = 'bold 8px "Pixelify Sans", monospace'; g.textAlign = 'center'; g.fillText(ch, X + 0.5, Y + 2.5 + b);
  }
  function label(X, Y, t, c) { g.font = '8px "Pixelify Sans", monospace'; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillText(t, X + 1, Y + 1); g.fillStyle = c; g.fillText(t, X, Y); }

  function drawPlayer(ox, oy) {
    const X = Math.round(P.x - ox), Y = Math.round(P.y - oy);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(X, Y + 1, 5, 2, 0, 0, 7); g.fill();
    g.drawImage(SPR.kai(P.dir, P.moving ? P.frame : 0), X - 8, Y - 15 - (P.moving && P.frame ? 1 : 0));
  }

  function drawLighting(ox, oy) {
    const th = W.theme;
    let dark = th.dark;
    if (dark <= 0) return;
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, VW, VH);
    lg.fillStyle = `rgba(${th.tint},${dark})`; lg.fillRect(0, 0, VW, VH);
    lg.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a = 1) => { const gr = lg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); lg.fillStyle = gr; lg.beginPath(); lg.arc(x, y, r, 0, 7); lg.fill(); };
    const pr = W.def.theme === 'boveda' ? 64 : 92;
    hole(P.x - ox, P.y - oy - 6, pr + Math.sin(time * 3) * 2);
    if (W.def.theme === 'boveda') { // linterna en la dirección de la mirada
      const d = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[P.dir];
      hole(P.x - ox + d[0] * 46, P.y - oy - 6 + d[1] * 46, 48, 0.9);
    }
    const i0 = Math.floor(ox / TS) - 4, j0 = Math.floor(oy / TS) - 4;
    for (let j = Math.max(0, j0); j < Math.min(W.map.h, j0 + 26); j++) for (let i = Math.max(0, i0); i < Math.min(W.map.w, i0 + 40); i++) if (W.tiles[j][i] === 'o') hole(i * TS + 8 - ox, j * TS - 6 - oy, 58 + Math.sin(time * 2 + i) * 2, 0.95);
    W.ents.forEach(e => {
      const x = e.px - ox, y = e.py - oy; if (x < -60 || y < -60 || x > VW + 60 || y > VH + 60) return;
      if (e.type === 'lesson' && !S.read[W.def.lessons[e.idx].id]) hole(x, y - 10, 30, 0.8);
      else if (e.type === 'chela') hole(x, y - 10, 56, 0.95);
      else if (e.type === 'mg' || e.type === 'portal' || e.type === 'tele') hole(x, y - 8, 34, 0.85);
      else if (e.type === 'boss' && !e.gone) hole(x, y - 20, 70, 0.9);
      else if (e.type === 'npc') hole(x, y - 8, 36, 0.7);
    });
    W.map.trains.forEach(tr => { const st = trainState(tr); if (st.on) hole(st.head - ox + 10, tr.y * TS - oy, 46, 0.9); });
    lg.globalCompositeOperation = 'source-over';
    g.drawImage(light, 0, 0);
    // halos cálidos
    g.globalCompositeOperation = 'lighter';
    for (let j = Math.max(0, j0); j < Math.min(W.map.h, j0 + 26); j++) for (let i = Math.max(0, i0); i < Math.min(W.map.w, i0 + 40); i++) if (W.tiles[j][i] === 'o') {
      const x = i * TS + 8 - ox, y = j * TS - 6 - oy, gr = g.createRadialGradient(x, y, 0, x, y, 30);
      gr.addColorStop(0, th.lamp + '55'); gr.addColorStop(1, th.lamp + '00'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill();
    }
    particles.forEach(p => { if (p.glow) { g.fillStyle = p.c + '66'; g.fillRect(p.x - ox - 1, p.y - oy - 1, 3, 3); } });
    if (W.def.theme === 'muelle') { // faro
      const a = time * 0.6, cx = -ox + 2 * TS, cy = -oy - 30;
      g.fillStyle = 'rgba(255,240,180,0.025)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 700, a, a + 0.12); g.closePath(); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  }

  function drawMarkers(ox, oy) {
    if (mode !== 'play') return;
    const it = nearestInteract();
    if (it) { const X = it.px - ox, Y = it.py - oy - (it.type === 'boss' ? 54 : it.type === 'chela' ? 46 : 26); g.fillStyle = '#f4f0ff'; g.fillRect(X - 5, Y - 6 + Math.sin(time * 6), 11, 10); g.fillStyle = '#1a1020'; g.font = 'bold 8px "Pixelify Sans", monospace'; g.textAlign = 'center'; g.fillText('E', X + 0.5, Y + 2 + Math.sin(time * 6)); }
    const ob = objective(); const t = ob.target;
    if (!t || t.gone) return;
    const tx = t.px - ox, ty = t.py - oy - 10;
    if (tx > 10 && tx < VW - 10 && ty > 10 && ty < VH - 10) {
      if (dist(t.px, t.py, P.x, P.y) > 40) { g.strokeStyle = `rgba(255,211,77,${0.5 + 0.4 * Math.sin(time * 5)})`; g.beginPath(); g.arc(tx, ty + 10, 12 + Math.sin(time * 5) * 2, 0, 7); g.stroke(); }
      return;
    }
    const cx = VW / 2, cy = VH / 2, a = Math.atan2(ty - cy, tx - cx);
    const r = Math.min((VW / 2 - 18) / Math.abs(Math.cos(a) || 0.001), (VH / 2 - 18) / Math.abs(Math.sin(a) || 0.001));
    const ax = cx + Math.cos(a) * r, ay = cy + Math.sin(a) * r;
    g.save(); g.translate(ax, ay); g.rotate(a); g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(9, 0); g.lineTo(-5, -6); g.lineTo(-2, 0); g.lineTo(-5, 6); g.closePath(); g.fill(); g.restore();
  }

  /* ---------- fondo del título ---------- */
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random() * VW, y: Math.random() * 150, s: Math.random() < 0.15 ? 2 : 1, t: Math.random() * 6 }));
  function drawTitleBg() {
    const gr = g.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, '#0a0b1e'); gr.addColorStop(0.6, '#1d1f3a'); gr.addColorStop(1, '#262a40');
    g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
    stars.forEach(s => { g.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(time + s.t))})`; g.fillRect(s.x, s.y, s.s, s.s); });
    g.fillStyle = '#f4f0d0'; g.beginPath(); g.arc(390, 52, 18, 0, 7); g.fill(); g.fillStyle = '#1d1f3a'; g.beginPath(); g.arc(398, 46, 16, 0, 7); g.fill();
    // ciudad / puerto
    g.fillStyle = '#0d0e1c';
    [[0, 150, 40, 80], [36, 170, 30, 60], [70, 140, 26, 90], [100, 160, 44, 70], [150, 120, 20, 110], [176, 165, 40, 60], [222, 150, 36, 80], [262, 172, 50, 60], [320, 130, 22, 100], [346, 160, 40, 70], [392, 176, 30, 60], [428, 150, 52, 80]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
    for (let k = 0; k < 40; k++) { const x = (k * 53) % 470 + 5, y = 150 + (k * 37) % 70; g.fillStyle = Math.sin(time * 2 + k) > 0.6 ? '#ffd34d' : '#6d6ff0'; if (k % 3) g.fillRect(x, y, 2, 2); }
    // torre del servidor
    g.fillStyle = '#121428'; g.fillRect(150, 70, 20, 160); g.fillStyle = Math.sin(time * 3) > 0 ? '#ff3b5b' : '#5b1a2a'; g.fillRect(158, 64, 4, 6);
    // mar
    g.fillStyle = '#0a1a33'; g.fillRect(0, 222, VW, 48);
    for (let k = 0; k < 30; k++) { const x = (k * 37 + time * 12) % (VW + 20) - 10; g.fillStyle = 'rgba(160,200,255,0.25)'; g.fillRect(x, 228 + (k * 13) % 36, 8, 1); }
    g.fillStyle = 'rgba(244,240,208,0.25)'; for (let k = 0; k < 6; k++) g.fillRect(380 + Math.sin(time * 2 + k) * 4, 228 + k * 6, 20 - k * 2, 1);
  }

  /* ======================= Interacción ======================= */
  function nearestInteract() {
    if (!W) return null;
    let best = null, bd = 1e9;
    const f = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[P.dir];
    W.ents.forEach(e => {
      if (e.gone || e.type === 'enemy' || e.type === 'portal' || e.type === 'tele') return;
      const ex = e.x * TS + 8, ey = e.y * TS + 8;
      const d = dist(ex, ey, P.x, P.y - 6);
      const reach = e.type === 'chela' || e.type === 'boss' ? 30 : 24;
      if (d > reach) return;
      const facing = (ex - P.x) * f[0] + (ey - (P.y - 6)) * f[1];
      const score = d - Math.max(0, facing) * 0.5;
      if (score < bd) { bd = score; best = e; }
    });
    return best;
  }

  async function interact(e) {
    if (!e) return;
    mode = 'busy';
    try {
      const d = W.def;
      if (e.type === 'npc') {
        await UI.dialog(d.npc.lines, { name: d.npc.name, portrait: SPR.guidePortrait(d.npc.tint) });
        if (!S.talked[d.id]) { S.talked[d.id] = true; UI.toast('Nuevo objetivo: lea las pizarras brillantes', 'gold'); }
      } else if (e.type === 'lesson') {
        const L = d.lessons[e.idx], first = !S.read[L.id];
        if (!S.talked[d.id] && d.id !== 'final') { await UI.dialog([`Primero hable con ${d.npc.name} (el del signo !): le explica qué pasa aquí.`], { name: 'Kai', portrait: SPR.kaiPortrait() }); }
        else {
          const tag = `Enseñanza ${e.idx + 1}/${d.lessons.length}`;
          const r = window.VIDEO && VIDEO.has(L.id) ? await VIDEO.play(L.id, { title: L.title, tag }) : 'board';
          if (r === 'board') await UI.lesson(L, { tag: `Pizarra ${e.idx + 1}/${d.lessons.length}` });
          if (first) { S.read[L.id] = true; AUDIO.fx.found(); burst(e.px, e.py - 12, '#7ad7ff', 16); UI.toast('Guardado en la Libreta (L): video y pizarra', 'blue'); updateGates(); }
        }
      } else if (e.type === 'mg') {
        const id = d.minigames[e.idx], def = CONTENT.mg[id];
        const need = def.lessons.filter(l => !S.read[l]);
        if (need.length) { await UI.dialog([`Esta prueba usa la pizarra “${lessonById[need[0]].title}”. Léala primero; está brillando en el mapa.`], { name: 'Kai', portrait: SPR.kaiPortrait() }); }
        else if (S.mg[id]) {
          const k = await UI.menu(def.title, [{ label: 'Jugar otra vez (para practicar)' }, { label: 'Seguir explorando' }], { auto: 1 });
          if (k === 0) await MINI.run(id);
        } else {
          const ok = await MINI.run(id);
          if (ok) { S.mg[id] = true; UI.toast(`Prueba superada: ${def.title}`, 'gold'); burst(e.px, e.py - 12, '#ffd34d', 24); updateGates(); save(); }
        }
      } else if (e.type === 'chela') await chela();
      else if (e.type === 'boss') { if (d.id === 'final') await finalBoss(); else await bossBattle(e); }
      else if (e.type === 'tip') await UI.dialog([CONTENT.tips[(e.x * 7 + e.y) % CONTENT.tips.length]], { name: 'Cliente del mercado', portrait: SPR.scaled(SPR.tipNpc(e.x + e.y), 1) });
      else if (e.type === 'lib') await UI.notebook(S, null);
    } finally { if (mode === 'busy') mode = 'play'; updateHud(true); }
  }

  /* ======================= Combates ======================= */
  function statAnswer(q, ok) {
    const s = S.stats[q.id] = S.stats[q.id] || { r: 0, w: 0 };
    if (ok) s.r++; else s.w++;
  }
  function autoDrive(wrongFirst) {
    if (!AUTO) return;
    let wrongDone = !wrongFirst;
    const tick = () => {
      const b = window.__battle; if (!b || b.finished) return;
      if (!b.q || !b.map.length) { setTimeout(tick, 0); return; }
      if (!b.answered) {
        let k = b.map.findIndex(x => x.i === 0);
        if (!wrongDone) { k = b.map.findIndex(x => x.i !== 0); wrongDone = true; }
        b.answer(k);
      } else b.cont();
      setTimeout(tick, 0);
    };
    setTimeout(tick, 0);
  }

  async function enemyBattle(e) {
    if (mode !== 'play') return;
    mode = 'busy';
    const d = W.def, lessons = zoneLessons(e.zone - 1);
    const unread = lessons.filter(l => !S.read[l]);
    if (unread.length) {
      await UI.dialog([`El ${d.enemy.name} le habla en un idioma que aún no entiende...`, `Lea primero la pizarra “${lessonById[unread[0]].title}”.`], { name: 'Kai', portrait: SPR.kaiPortrait() });
      const a = Math.atan2(P.y - e.py, P.x - e.px); P.x += Math.cos(a) * 18; P.y += Math.sin(a) * 18; if (blocked(P.x, P.y)) { P.x -= Math.cos(a) * 18; P.y -= Math.sin(a) * 18; }
      e.px = e.hx; e.py = e.hy; mode = 'play'; return;
    }
    AUDIO.music('battle'); AUDIO.fx.hit(); shake = 6;
    const pool = d.questions.filter(q => lessons.includes(q.l) && !q.boss);
    const h0 = S.hearts;
    const p = UI.battle({
      name: d.enemy.name, sprite: SPR.enemy(d.enemy.sprite), hp: 2, state: S, tag: 'RETO',
      taunt: '¡Grrr! ¿Leyó la pizarra?',
      nextQuestion: asked => LOGIC.pickQuestions(pool, S.stats, 1, asked)[0],
      lessonOf: q => lessonById[q.l], onAnswer: statAnswer,
      lines: { right: ['¡Ay! ¡Eso sí lo sabía!', '¡Ugh!', '¡Auch, bien respondido!'], wrong: ['¡Je! Casi...', '¡Fallo! Lea la explicación.', 'Mmm, no. ¡Pero ya aprendió!'] }
    });
    autoDrive(AUTO && !S._autoWrong); if (AUTO) S._autoWrong = true;
    const res = await p;
    AUDIO.music(W.theme.music);
    if (res.won) {
      S.defeated[d.id][e.key] = true;
      W.ents = W.ents.filter(x => x !== e);
      burst(e.px, e.py - 8, '#ff8fa0', 20); AUDIO.fx.win();
      let msg = `¡${d.enemy.name} disipado!`;
      if (!res.cheated && S.hearts === h0 && S.lemons < 5) { S.lemons++; msg += ' Sin fallos: +1 limoncito'; }
      UI.toast(msg, 'gold');
      updateGates(); save();
      mode = 'play';
    } else await faint();
  }

  async function bossBattle(e) {
    const d = W.def;
    if (S.boss[d.boss.id]) return;
    await UI.dialog(d.boss.intro, { name: d.boss.name, portrait: SPR.scaled(SPR.enemy(d.boss.sprite), 1) });
    AUDIO.music('boss');
    const p = UI.battle({
      name: d.boss.name, sprite: SPR.enemy(d.boss.sprite), hp: d.boss.hp, state: S, boss: true, tag: 'JEFE · FASE ' + d.num,
      taunt: d.boss.intro[d.boss.intro.length - 1],
      nextQuestion: asked => LOGIC.pickQuestions(d.questions, S.stats, 1, asked)[0],
      lessonOf: q => lessonById[q.l], onAnswer: statAnswer,
      lines: { right: ['¡Argh! ¡Eso dolió!', '¡Imposible! ¿Quién le enseñó eso?', '¡Grr! Correcto...', '¡Me está debilitando!'], wrong: ['¡Jajá! ¡Fallo!', '¡Eso no dice la guía!', '¡Más le vale leer la explicación!'] }
    });
    autoDrive(AUTO);
    const res = await p;
    if (res.won) {
      S.boss[d.boss.id] = true; S.unlocked = Math.max(S.unlocked, W.i + 2);
      AUDIO.fx.win(); AUDIO.music('win'); shake = 12;
      burst(e.px, e.py - 20, '#ffd34d', 40); burst(e.px, e.py - 20, '#ff8fa0', 30);
      await UI.dialog(d.boss.win, { name: d.boss.name, portrait: SPR.scaled(SPR.enemy(d.boss.sprite), 1) });
      spawnPortal(); save();
      UI.toast('¡Núcleo restaurado! Entre al portal.', 'gold');
    } else await faint();
  }

  async function faint() {
    mode = 'busy';
    AUDIO.music(W.theme.music);
    await fadeTo(1, 500);
    const cp = S.checkpoint && S.checkpoint.phase === W.i ? S.checkpoint : null;
    P.x = (cp ? cp.x : W.map.start.x) * TS + 8; P.y = (cp ? cp.y : W.map.start.y) * TS + 12; P.dir = 'down'; snapCam();
    S.hearts = S.maxHearts; S.lemons = Math.max(S.lemons, 2);
    const met = Object.keys(S.chelaSeen).length > 0 || S.rescued;
    let cart = null;
    if (!cp) { // Erika todavía no está aquí: llega empujando el carrito, y solo entonces habla
      cart = { type: 'chela', rescue: true, px: P.x + 150, py: P.y + 2, t: 0 };
      W.ents.push(cart);
    }
    await fadeTo(0, 400);
    if (cart) {
      if (AUDIO.fx.cart) AUDIO.fx.cart();
      await new Promise(r => { if (AUTO) { cart.px = P.x + 26; r(); return; } const x0 = cart.px, t0 = performance.now(); (function st(n) { const e = Math.min(1, (n - t0) / 1400); cart.px = x0 + (P.x + 26 - x0) * (1 - Math.pow(1 - e, 2)); if (e < 1) requestAnimationFrame(st); else r(); })(t0); });
    }
    const lines = met
      ? ['¡Upe! ¿Otra vez en el suelo, mi amor? Venga, tómese este ceviche bien frío.', 'Lo que falló quedó en su Libreta. Repase la explicación y vuelva a intentarlo.']
      : ['¡Diay, mae! Lo vi caerse desde la esquina y me vine con todo y carrito. Soy Erika, la de los ceviches en vaso.', 'Tome, uno bien frío, por cuenta de la casa. Lo que falló quedó en su Libreta: repáselo y vuelva con todo.'];
    S.rescued = true;
    await UI.dialog(lines, { name: 'Erika Ceviches', portrait: SPR.erikaPortrait() });
    if (cart) { // se despide y sigue hacia su puesto
      await new Promise(r => { if (AUTO) { r(); return; } const x0 = cart.px, t0 = performance.now(); (function st(n) { const e = Math.min(1, (n - t0) / 900); cart.px = x0 + 160 * e * e; if (e < 1) requestAnimationFrame(st); else r(); })(t0); });
      W.ents = W.ents.filter(e => e !== cart);
      UI.toast('Erika siguió hacia su puesto: ahí puede guardar antes del jefe', 'blue');
    }
    save(); mode = 'play';
  }

  async function chela() {
    const d = W.def, id = d.id;
    const first = !S.chelaSeen[id];
    if (first) {
      S.chelaSeen[id] = true;
      await UI.dialog(d.chela, { name: 'Erika Ceviches', portrait: SPR.erikaPortrait() });
    }
    S.checkpoint = { phase: W.i, x: Math.floor(P.x / TS), y: Math.floor(P.y / TS) };
    save();
    if (first) UI.toast('Punto de control guardado', 'blue');
    let loop = true, guard = 0;
    while (loop && guard++ < 20) {
      const pend = Object.keys(S.stats).filter(k => S.stats[k].w > 0 && S.stats[k].r <= S.stats[k].w && qById[k]);
      const items = [
        { label: 'Comer ceviche en vaso', sub: S.hearts < S.maxHearts ? 'Recupera toda la energía' : 'Ya está a tope, pero igual está rico' },
        { label: 'Guardar partida aquí', sub: 'Si se queda sin energía, vuelve a este puesto' },
        { label: 'Pedir limoncitos', sub: S.chelaLemon[id] ? 'Ya le di los de esta zona' : '+2 limoncitos (máx. 5): descartan una opción incorrecta', disabled: !!S.chelaLemon[id] || S.lemons >= 5 },
        { label: `Repasar mis errores (${pend.length})`, sub: pend.length ? 'Preguntas que falló, sin perder energía' : 'No tiene errores pendientes', disabled: !pend.length },
        { label: 'Conversar' },
        { label: 'Seguir' }];
      const k = await UI.menu('Ceviches “La Transacción”', items, { portrait: SPR.chelaPortrait(), name: 'Erika Ceviches', text: 'Diay, mi amor, o todo o nada. ¿Qué le sirvo?', auto: AUTO ? (guard === 1 ? 0 : 5) : null });
      if (k === 0) { S.hearts = S.maxHearts; AUDIO.fx.found(); burst(P.x, P.y - 10, '#ff9a5a', 18); UI.toast('Energía al máximo', 'gold'); }
      else if (k === 1) { S.checkpoint = { phase: W.i, x: Math.floor(P.x / TS), y: Math.floor(P.y / TS) }; UI.toast(save() ? 'Partida guardada' : 'No se pudo guardar en este navegador', save() ? 'blue' : 'warn'); }
      else if (k === 2) { S.lemons = Math.min(5, S.lemons + 2); S.chelaLemon[id] = true; AUDIO.fx.found(); UI.toast('+2 limoncitos', 'gold'); }
      else if (k === 3) await review(pend);
      else if (k === 4) await UI.dialog([pickChela()], { name: 'Erika Ceviches', portrait: SPR.erikaPortrait() });
      else loop = false;
    }
    save();
  }
  const CHELA_EXTRA = [
    'Mi sobrino estudia en la U. Dice que lo más difícil es diferenciar la fantasma de la no repetible. Fantasma: filas nuevas. ¡Apúntelo!',
    'Yo respaldo la receta todos los domingos: FULL. Y entre semana, solo lo que cambio: diferencial. Una no nace sabiendo.',
    'Cuando se me acaban los vasos, espero a que se libere uno. Eso es un bloqueo, ¿verdad? Yo le digo “esperar el turno”.',
    'El secreto del ceviche es limón fresco y no dejar transacciones abiertas. Lo segundo me lo dijo un cliente; yo ni sé qué es.',
    'Si uno me pide sin cebolla y otro con doble cebolla al mismo tiempo, los atiendo serializable: uno y después el otro. Pura vida.',
    'El profe Mauricio pasa por aquí los viernes. Pide uno grande y se pone a revisar exámenes. Qué miedo, mae.'];
  const pickChela = () => CHELA_EXTRA[Math.floor(Math.random() * CHELA_EXTRA.length)].concat('');

  async function review(ids) {
    const list = LOGIC.shuffle(ids).slice(0, 5).map(id => qById[id]);
    let k = 0;
    const p = UI.battle({
      name: 'Repaso con Erika', sprite: SPR.erika(), hp: list.length, state: S, safe: true, tag: 'REPASO SIN RIESGO',
      taunt: 'Tranquilo, aquí no se pierde energía.',
      nextQuestion: () => list[k++] || list[list.length - 1],
      lessonOf: q => lessonById[q.l], onAnswer: statAnswer,
      lines: { right: ['¡Eso, mi amor!', '¡Ve que sí se sabía!'], wrong: ['No se preocupe, lea la explicación.', 'Ay, casi. Ahora ya lo sabe.'] }
    });
    autoDrive(false);
    await p;
  }

  /* ---------- jefe final ---------- */
  async function finalBoss() {
    const F = CONTENT.final.boss;
    const MP = SPR.mauPortrait();
    if (S.finalAct === 0) await UI.dialog(['Buenas noches, Kai. Lo estuve siguiendo por la radio toda la noche.', 'Restauró los cinco núcleos. Ahora quiero ver si de verdad entendió... o si fue pura suerte.', 'Son tres actos. Si se equivoca, le explico y se lo vuelvo a preguntar más adelante. Así se estudia.'], { name: 'Profe Mauricio', portrait: MP });
    for (let a = S.finalAct; a < F.acts.length; a++) {
      const act = F.acts[a];
      await UI.dialog(act.intro, { name: 'Profe Mauricio · ' + act.title, portrait: MP });
      // cola de preguntas del acto
      let queue = [];
      const asked = new Set();
      if (a < 2) act.phases.forEach(pid => queue.push(...LOGIC.pickQuestions(PH.find(p => p.id === pid).questions, S.stats, F.perPhase)));
      else {
        queue.push(...LOGIC.pickQuestions(PH.find(p => p.id === 'p5').questions, S.stats, F.perPhase));
        ['p1', 'p2', 'p3', 'p4'].forEach(pid => queue.push(...LOGIC.pickQuestions(PH.find(p => p.id === pid).questions, S.stats, 1)));
      }
      const hp = queue.length;
      AUDIO.music('boss');
      const p = UI.battle({
        name: 'Profe Mauricio', sprite: SPR.mauricio(), hp, state: S, boss: true, tag: 'EXAMEN FINAL · ' + act.title,
        taunt: 'Con calma. Lea toda la pregunta antes de responder.',
        nextQuestion: () => { const q = queue.shift(); if (q) asked.add(q.id); return q; },
        lessonOf: q => lessonById[q.l],
        onAnswer: (q, ok) => {
          statAnswer(q, ok);
          if (!ok) { // refuerzo: otra pregunta del mismo tema (o la misma) vuelve al final del acto
            const same = PH.find(p => p.id === q.phase).questions.filter(x => x.l === q.l && !asked.has(x.id) && !queue.includes(x));
            queue.push(same.length ? same[Math.floor(Math.random() * same.length)] : q);
          }
        },
        lines: F.lines
      });
      autoDrive(AUTO && a === 0);
      const res = await p;
      if (!res.won) {
        await UI.dialog(F.lines.lose, { name: 'Profe Mauricio', portrait: MP });
        S.finalAct = a; await faint(); return;
      }
      S.finalAct = a + 1; S.hearts = Math.min(S.maxHearts, S.hearts + 2); save();
      AUDIO.fx.win(); shake = 10;
      if (a < F.acts.length - 1) UI.toast(`${act.title} superado · +2 de energía`, 'gold');
    }
    S.done = true; save();
    AUDIO.music('win');
    await UI.dialog(F.lines.win, { name: 'Profe Mauricio', portrait: MP });
    await ending();
  }

  /* ======================= Flujo de fases ======================= */
  function fadeTo(v, ms) {
    return new Promise(res => {
      if (AUTO) { fade = v; res(); return; }
      const f0 = fade, t0 = performance.now();
      const step = () => { const k = Math.min(1, (performance.now() - t0) / ms); fade = f0 + (v - f0) * k; if (k < 1) requestAnimationFrame(step); else res(); };
      step();
    });
  }

  async function phaseIntro(i) {
    const d = PH[i];
    const num = d.num ? `FASE ${d.num}` : 'FINAL';
    await UI.card(`<span class="ph-num">${num}</span>${UI.esc(d.name)}`, `<p class="ph-place">${UI.esc(d.place)}</p><p class="ph-src">${UI.esc(d.source)}</p>${d.story.map(s => `<p>${UI.esc(s)}</p>`).join('')}
      ${d.lessons ? `<div class="ph-topics"><b>Temas de esta fase</b><ul>${d.lessons.map(l => `<li>${UI.esc(l.title)}</li>`).join('')}</ul></div>` : ''}`, '¡Vamos!', 'phase-card');
  }

  async function enterPhase(i, opt = {}) {
    mode = 'busy';
    await fadeTo(1, 300);
    const replay = PH[i].boss && S.boss[PH[i].boss.id] && opt.replay;
    if (replay) { S.defeated[PH[i].id] = {}; }
    loadPhase(i, opt);
    await fadeTo(0, 400);
    if (!opt.quiet) await phaseIntro(i);
    if (PH[i].id === 'final' && !S.chelaSeen.final) UI.toast('Erika también tiene puestito en la Torre', 'blue');
    mode = 'play';
    save();
  }

  async function finishPhase() {
    mode = 'busy';
    AUDIO.fx.sparkle();
    const d = W.def;
    let r = 0, w = 0; d.questions.forEach(q => { const s = S.stats[q.id]; if (s) { r += s.r; w += s.w; } });
    const pct = r + w ? Math.round(100 * r / (r + w)) : 0;
    await fadeTo(1, 400);
    await UI.card(`Fase ${d.num} completada`, `<p><b>${UI.esc(d.name)}</b></p><p>Precisión en esta fase: <b>${pct} %</b> (${r} correctas, ${w} por mejorar).</p>
      <p>Temas dominados:</p><ul>${d.lessons.map(l => `<li>${UI.esc(l.title)}</li>`).join('')}</ul>
      ${w ? '<p>Sus errores quedaron guardados: el Profe Mauricio y Erika se los volverán a preguntar.</p>' : '<p>¡Sin errores! Impresionante.</p>'}`, 'Siguiente', 'phase-card');
    S.checkpoint = null;
    const next = W.i + 1;
    if (next <= FINAL_IDX) { S.unlocked = Math.max(S.unlocked, next + 1); await enterPhase(next); }
  }

  async function ending() {
    mode = 'busy';
    await fadeTo(1, 800);
    let r = 0, w = 0; Object.values(S.stats).forEach(s => { r += s.r; w += s.w; });
    const per = CONTENT.phases.map(p => { let a = 0, b = 0; p.questions.forEach(q => { const s = S.stats[q.id]; if (s) { a += s.r; b += s.w; } }); return `<li>Fase ${p.num} · ${UI.esc(p.name)}: ${a + b ? Math.round(100 * a / (a + b)) : 0} %</li>`; }).join('');
    await UI.card('Amanece en Puerto Nyder', `<p>El Servidor Central está encendido. Los trenes van en orden, la bóveda tiene respaldos, el mercado usa índices y las islas están sincronizadas.</p>
      <p><b>Resultado global:</b> ${r} respuestas correctas y ${w} por repasar (${r + w ? Math.round(100 * r / (r + w)) : 0} %).</p><ul>${per}</ul>
      <p>Tiempo de juego: ${Math.round(S.playMs / 60000)} min.</p><p class="credits">Una aventura de <b>NYDER GAMES</b><br>Contenido: Guías #8 a #13 y Resumen de las investigaciones · IF0010 Bases de Datos II<br>Sonidos y logo: proyecto Five Doors at Freddy's (dreiklx)</p>
      <p>¡Mucha suerte en el examen! Puede volver a cualquier fase desde el menú para repasar.</p>`, 'Volver al título', 'phase-card');
    if (!AUTO) await toTitle();
  }

  /* ======================= Título y menús ======================= */
  const titleEl = document.getElementById('title');
  /* Presentación de NYDER Games: misma secuencia que el juego de FNAF del repo
     (250 ms negro, 800 de entrada, 1300 visible con destello en la estrella, 650 de salida). */
  async function splash() {
    const sp = document.getElementById('splash'), cv = document.getElementById('splash-cv'), x = cv.getContext('2d');
    sp.hidden = false; sp.classList.remove('out');
    const img = new Image(); img.src = 'assets/img/nyder_games_splash.png';
    await new Promise(r => { if (img.complete) r(); img.onload = r; img.onerror = r; });
    if (AUTO || !img.naturalWidth) { sp.hidden = true; return; }
    const IW = img.naturalWidth, IH = img.naturalHeight, w = cv.width * 0.62, h = w * IH / IW, ox = (cv.width - w) / 2, oy = (cv.height - h) / 2, k = w / IW;
    // máscara de la estrella violeta, generada en memoria desde el propio PNG (si el navegador lo permite)
    let mask = null;
    try {
      const c2 = document.createElement('canvas'); c2.width = IW; c2.height = IH; const g2 = c2.getContext('2d'); g2.drawImage(img, 0, 0);
      const d = g2.getImageData(0, 0, IW, IH), px = d.data;
      for (let i = 0; i < px.length; i += 4) { const r = px[i], gg = px[i + 1], bb = px[i + 2]; if (px[i + 3] > 0 && bb > r + 40 && bb > gg + 40) { px[i] = 236; px[i + 1] = 228; px[i + 2] = 255; } else px[i + 3] = 0; }
      g2.putImageData(d, 0, 0); mask = c2;
    } catch (e) { mask = null; }
    const SX = ox + 1080 * k, SY = oy + 262 * k; // centro de la estrella
    const T_BLACK = 250, T_IN = 800, T_SHOW = 1300, T_OUT = 650, t0 = performance.now();
    let sparkled = false, skip = false;
    const onSkip = () => { skip = true; };
    sp.addEventListener('click', onSkip); window.addEventListener('keydown', onSkip, { once: true });
    await new Promise(done => {
      (function frame(now) {
        const t = now - t0;
        x.fillStyle = '#000'; x.fillRect(0, 0, cv.width, cv.height);
        let a = 0;
        if (t < T_BLACK) a = 0; else if (t < T_BLACK + T_IN) a = (t - T_BLACK) / T_IN; else if (t < T_BLACK + T_IN + T_SHOW) a = 1; else a = Math.max(0, 1 - (t - T_BLACK - T_IN - T_SHOW) / T_OUT);
        x.globalAlpha = a; x.drawImage(img, ox, oy, w, h);
        // destello: espera 120 ms, sube 420 (cuadrática), se sostiene 60, se apaga 600
        const ts = t - (T_BLACK + T_IN) - 120;
        let br = 0;
        if (ts >= 0 && ts < 420) br = Math.pow(ts / 420, 2); else if (ts >= 420 && ts < 480) br = 1; else if (ts >= 480 && ts < 1080) br = 1 - (ts - 480) / 600;
        if (ts >= 160 && !sparkled) { sparkled = true; AUDIO.fx.sparkle(); }
        if (br > 0) {
          if (mask) { x.globalAlpha = a * br; x.drawImage(mask, ox, oy, w, h); }
          const R = 140 * k * 2.2, gr = x.createRadialGradient(SX, SY, 0, SX, SY, R);
          gr.addColorStop(0, `rgba(230,215,255,${0.55 * br})`); gr.addColorStop(1, 'rgba(180,140,255,0)');
          x.globalAlpha = a; x.fillStyle = gr; x.beginPath(); x.arc(SX, SY, R, 0, 7); x.fill();
          if (br > 0.55) { // chispazo de cuatro puntas cerca del pico
            const L = 30 + 110 * br; x.globalAlpha = a * (br - 0.55) / 0.45; x.fillStyle = '#fff';
            x.beginPath(); x.moveTo(SX, SY - L); x.lineTo(SX + 3, SY); x.lineTo(SX, SY + L); x.lineTo(SX - 3, SY); x.closePath(); x.fill();
            x.beginPath(); x.moveTo(SX - L, SY); x.lineTo(SX, SY + 3); x.lineTo(SX + L, SY); x.lineTo(SX, SY - 3); x.closePath(); x.fill();
          }
        }
        x.globalAlpha = 1;
        if (skip || t >= T_BLACK + T_IN + T_SHOW + T_OUT) done(); else requestAnimationFrame(frame);
      })(performance.now());
    });
    sp.removeEventListener('click', onSkip); window.removeEventListener('keydown', onSkip);
    sp.hidden = true;
  }
  async function toTitle() {
    mode = 'title'; W = null; fade = 0; AUDIO.ambient(null);
    document.getElementById('hud').hidden = true;
    AUDIO.music('title');
    titleEl.hidden = false;
    const saved = loadSave();
    const items = [
      { label: 'Nueva partida', sub: 'Empieza desde la Fase 1' },
      { label: 'Continuar', sub: saved ? `Fase ${Math.min(saved.phase + 1, 5)}${saved.phase === FINAL_IDX ? ' · Torre final' : ''} · ${Object.keys(saved.read).length} pizarras leídas` : 'No hay partida guardada', disabled: !saved },
      { label: 'Elegir fase (repaso)', sub: saved && saved.unlocked > 1 ? 'Vuelva a cualquier fase desbloqueada' : 'Se desbloquean al vencer a cada jefe', disabled: !(saved && saved.unlocked > 1) },
      { label: 'Cómo jugar' },
      { label: 'Material del curso' },
      { label: AUDIO.isMuted() ? 'Sonido: apagado' : 'Sonido: encendido' },
      { label: 'Copia de seguridad', sub: 'Exportar o importar su avance (.json)' }];
    const k = await UI.menu('Menú', items, { cls: 'title-menu', cancel: false });
    if (k === 0) {
      if (saved) { const c = await UI.menu('¿Empezar de cero?', [{ label: 'Sí, nueva partida', sub: 'Se borra el progreso guardado' }, { label: 'No, volver' }]); if (c !== 0) return toTitle(); }
      S = fresh(); S.started = true; titleEl.hidden = true; await story(); return enterPhase(0);
    }
    if (k === 1) { S = saved; titleEl.hidden = true; return enterPhase(S.phase, { quiet: false }); }
    if (k === 2) {
      const opts = PH.map((p, i) => ({ label: p.num ? `Fase ${p.num} · ${p.name}` : `Final · ${p.name}`, sub: p.source, disabled: i >= saved.unlocked }));
      const c = await UI.menu('Elegir fase', opts);
      if (c < 0) return toTitle();
      S = saved; S.checkpoint = null; titleEl.hidden = true; return enterPhase(c, { replay: true });
    }
    if (k === 3) { await howTo(); return toTitle(); }
    if (k === 4) { await material(); return toTitle(); }
    if (k === 5) { AUDIO.toggleMute(); return toTitle(); }
    if (k === 6) { await backupMenu(); return toTitle(); }
    return toTitle();
  }
  async function story() {
    titleEl.hidden = true;
    await UI.dialog(['Puerto Nyder. 11:57 p. m.', 'Usted es Kai, pasante del turno de noche en el centro de datos del puerto.', 'A las 11:58 cae un rayo. El Gran Apagón corrompe la base de datos central: transacciones a medias, trenes de datos enredados, respaldos perdidos, consultas lentísimas y nodos a la deriva.', 'En el muelle, Erika Ceviches abre su carrito de ceviche en vaso, como todas las noches. Dicen que ni el apagón la hace cerrar.', 'La radio chisporrotea...'], { name: 'Narrador' });
    await UI.dialog(['Kai, ¿me copia? Habla Mauricio, desde la Torre del Servidor.', 'Hay que restaurar cinco núcleos antes del amanecer. En cada zona hay enseñanzas con lo que necesita saber: véalas con calma, que después se lo pregunto.', 'Cuando termine, suba a la Torre. Yo mismo voy a revisar que todo quedó bien.'], { name: 'Profe Mauricio (radio)', portrait: SPR.mauPortrait() });
  }
  async function howTo() {
    await UI.card('Cómo jugar', `<ul class="howto">
      <li><b>Computadora:</b> <kbd>WASD</kbd>/<kbd>flechas</kbd> moverse · <kbd>Shift</kbd> correr · <kbd>E</kbd>/<kbd>Espacio</kbd> hablar o usar · <kbd>L</kbd> Libreta · <kbd>M</kbd> sonido · <kbd>Esc</kbd> pausa</li>
      <li><b>Teléfono:</b> joystick a la izquierda, botón <b>A</b> para hablar y continuar, <b>Correr</b> para ir más rápido. Toque las respuestas.</li>
      <li><b>Combates:</b> responda bien y Kai ataca; si falla, el enemigo ataca, ve por qué y esa pregunta vuelve en el mismo combate. <kbd>1</kbd>-<kbd>4</kbd> responder · <kbd>H</kbd> pista · <kbd>J</kbd> limoncito · <kbd>K</kbd> pizarra.</li></ul>
      <p><b>Cada fase:</b> hablar con el guía → ver las enseñanzas (video narrado + pizarra) → vencer enemigos y superar pruebas → pasar por Erika Ceviches → jefe. Arriba a la derecha siempre dice qué falta.</p>
      <p>Solo le preguntan lo que ya vio. Si se queda sin energía, Erika lo recoge y no pierde lo avanzado. Los <b>limoncitos</b> descartan una opción incorrecta.</p>`, 'Entendido');
  }
  async function material() {
    await UI.card('Material del curso usado', `<p>Todo el contenido sale de la carpeta <code>Bases Examen 3</code> (IF0010 Bases de Datos II):</p><ul>
      ${CONTENT.phases.map(p => `<li><b>Fase ${p.num}:</b> ${UI.esc(p.source)}</li>`).join('')}</ul>
      <p><b>Notas:</b></p><ul>${CONTENT.notes.map(n => `<li>${UI.esc(n)}</li>`).join('')}</ul>`, 'Volver');
  }
  async function backupMenu() {
    const c = await UI.menu('Copia de seguridad', [
      { label: 'Exportar mi avance', sub: 'Descarga un archivo .json para guardarlo donde quiera' },
      { label: 'Importar una copia', sub: 'Reemplaza el avance de este dispositivo' },
      { label: 'Volver' }]);
    if (c === 0) { const r = SAVEIO.exportFile(); await UI.card('Copia de seguridad', `<p>${UI.esc(r.msg)}</p>`, 'Volver'); }
    else if (c === 1) {
      const ok = await UI.menu('¿Reemplazar el avance actual?', [{ label: 'Sí, elegir archivo' }, { label: 'No' }]);
      if (ok === 0) { const r = await SAVEIO.importFile(); await UI.card('Copia de seguridad', `<p>${UI.esc(r.msg)}</p>`, 'Volver'); }
    }
  }
  async function pauseMenu() {
    if (mode !== 'play' || UI.busy()) return;
    mode = 'busy';
    const k = await UI.menu('Pausa', [{ label: 'Continuar' }, { label: 'Libreta de estudio' }, { label: 'Cómo jugar' }, { label: AUDIO.isMuted() ? 'Activar sonido' : 'Silenciar' }, { label: 'Guardar y volver al título' }, { label: 'Guardar y exportar copia', sub: 'Descarga un .json con su avance' }]);
    if (k === 1) await UI.notebook(S, W.def.id);
    else if (k === 2) await howTo();
    else if (k === 3) { AUDIO.toggleMute(); updateHud(true); }
    else if (k === 4) { save(); mode = 'busy'; await fadeTo(1, 300); await toTitle(); return; }
    else if (k === 5) { save(); const r = SAVEIO.exportFile(); UI.toast(r.msg, r.ok ? 'blue' : 'warn'); }
    mode = 'play';
  }

  /* ======================= HUD ======================= */
  let hudCache = '';
  function updateHud(force) {
    const hud = document.getElementById('hud');
    if (!W || mode === 'title') { hud.hidden = true; return; }
    hud.hidden = false;
    const ob = objective();
    const key = [W.i, S.hearts, S.lemons, ob.text, JSON.stringify(ob.list || []), AUDIO.isMuted()].join('|');
    if (!force && key === hudCache) return; hudCache = key;
    document.getElementById('hud-phase').textContent = W.def.num ? `F${W.def.num} · ${W.def.name}` : W.def.name;
    document.getElementById('hud-hearts').innerHTML = Array.from({ length: S.maxHearts }, (_, i) => `<i class="heart ${i < S.hearts ? '' : 'empty'}"></i>`).join('');
    document.getElementById('hud-lemons').innerHTML = `<i class="lemon"></i>${S.lemons}`;
    document.getElementById('hud-obj').textContent = ob.text;
    const cl = document.getElementById('hud-list');
    if (cl) cl.innerHTML = ob.list && ob.list.length ? `<div class="cl-head">${UI.esc(ob.head || '')}</div>` + ob.list.map(x => `<div class="cl ${x.done ? 'done' : ''}"><i></i>${UI.esc(x.t)}</div>`).join('') : '';
    document.getElementById('btn-sound').classList.toggle('off', AUDIO.isMuted());
  }

  /* ======================= Entrada ======================= */
  window.addEventListener('keydown', e => {
    AUDIO.init();
    if (UI.busy()) { UI.key(e); if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); return; }
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (mode !== 'play') return;
    if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') interact(nearestInteract());
    else if (e.key === 'l' || e.key === 'L') { mode = 'busy'; UI.notebook(S, W.def.id).then(() => { mode = 'play'; }); }
    else if (e.key === 'm' || e.key === 'M') { AUDIO.toggleMute(); updateHud(true); }
    else if (e.key === 'Escape') pauseMenu();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; if (e.key.length === 1) { keys[e.key.toLowerCase()] = false; keys[e.key.toUpperCase()] = false; } });
  window.addEventListener('blur', () => Object.keys(keys).forEach(k => keys[k] = false));
  document.getElementById('btn-notebook').addEventListener('click', () => { if (mode === 'play' && !UI.busy()) { mode = 'busy'; UI.notebook(S, W.def.id).then(() => { mode = 'play'; }); } });
  document.getElementById('btn-sound').addEventListener('click', () => { AUDIO.init(); AUDIO.toggleMute(); updateHud(true); });
  document.getElementById('btn-menu').addEventListener('click', () => pauseMenu());

  /* ======================= Escalado ======================= */
  function fit() {
    const stage = document.getElementById('stage');
    const w = Math.min(window.innerWidth, window.innerHeight * 16 / 9);
    stage.style.width = w + 'px'; stage.style.height = (w * 9 / 16) + 'px';
    document.documentElement.style.setProperty('--u', (w / 100) + 'px');
  }
  window.addEventListener('resize', fit); fit();

  /* ======================= Bucle ======================= */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    try { update(dt); render(); } catch (err) { console.error(err); }
    requestAnimationFrame(loop);
  }

  /* ======================= Arranque ======================= */
  async function boot() {
    UI.init();
    requestAnimationFrame(loop);
    if (AUTO) return autotest();
    const shot = params.get('shot');
    if (shot) return shotMode(shot);
    const gate = document.getElementById('press');
    gate.hidden = false;
    await new Promise(res => { const go = () => { window.removeEventListener('keydown', go); gate.removeEventListener('click', go); res(); }; window.addEventListener('keydown', go); gate.addEventListener('click', go); });
    AUDIO.init(); gate.hidden = true;
    await splash();
    toTitle();
  }

  // Modo captura: ?shot=p3&ui=battle|lesson|chela|mg:graph&read=1
  async function shotMode(id) {
    const i = PH.findIndex(p => p.id === id);
    S = fresh();
    if (params.get('read')) { PH.forEach(p => (p.lessons || []).forEach(l => { S.read[l.id] = true; })); PH.forEach(p => { S.talked[p.id] = true; }); }
    loadPhase(Math.max(0, i));
    const sx = params.get('x'), sy = params.get('y');
    if (sx) { P.x = +sx * TS + 8; P.y = +sy * TS + 12; snapCam(); }
    mode = 'play'; titleEl.hidden = true;
    const ui = params.get('ui') || '';
    if (ui === 'battle') { const e = W.ents.find(x => x.type === 'enemy'); if (e) enemyBattle(e); }
    else if (ui === 'boss') { const e = W.ents.find(x => x.type === 'boss'); if (e && W.def.id !== 'final') { UI.battle({ name: W.def.boss.name, sprite: SPR.enemy(W.def.boss.sprite), hp: W.def.boss.hp, state: S, boss: true, tag: 'JEFE', nextQuestion: () => W.def.questions[3], lessonOf: q => lessonById[q.l], onAnswer: () => {}, taunt: W.def.boss.intro[0] }); } else if (W.def.id === 'final') { UI.battle({ name: 'Profe Mauricio', sprite: SPR.mauricio(), hp: 6, state: S, boss: true, tag: 'EXAMEN FINAL · Acto I', nextQuestion: () => CONTENT.phases[1].questions[4], lessonOf: q => lessonById[q.l], onAnswer: () => {}, taunt: 'Con calma. Lea toda la pregunta antes de responder.' }); } }
    else if (ui === 'lesson') UI.lesson(W.def.lessons[+(params.get('n') || 0)]);
    else if (ui === 'chela') { const e = W.ents.find(x => x.type === 'chela'); interact(e); }
    else if (ui === 'dialog') UI.dialog(['Buenas noches, Kai. Lo estuve siguiendo por la radio toda la noche.'], { name: 'Profe Mauricio', portrait: SPR.mauPortrait() });
    else if (ui.startsWith('mg:')) MINI.run(ui.slice(3));
    else if (ui === 'title') { W = null; mode = 'title'; titleEl.hidden = false; UI.menu('Menú', [{ label: 'Nueva partida' }, { label: 'Continuar' }, { label: 'Elegir fase (repaso)' }, { label: 'Cómo jugar' }], { cls: 'title-menu' }); }
    else if (ui === 'notebook') UI.notebook(S, W.def.id);
    else if (ui.startsWith('video:')) { const [, vid, b, st] = ui.split(':'); VIDEO.play(vid, { title: (lessonById[vid] || {}).title, tag: 'Enseñanza', beat: +b || 0, start: st, freeze: params.get('freeze') ? +params.get('freeze') : 0 }); }
    else if (ui === 'faint') faint();
    else if (ui === 'splash') splash();
    else if (ui === 'hud') updateHud(true);
  }

  /* ======================= Prueba automática ======================= */
  async function autotest() {
    const out = document.getElementById('autotest');
    const log = [], errs = [];
    window.addEventListener('error', ev => errs.push(String(ev.message)));
    const origErr = console.error; console.error = (...a) => { errs.push(a.map(String).join(' ')); origErr(...a); };
    const t0 = performance.now();
    const NL = String.fromCharCode(10);
    const step = m => { out.textContent = 'EN CURSO: ' + m + NL + log.join(NL) + NL + errs.join(NL); };
    window.__atStep = step;
    try {
      S = fresh(); titleEl.hidden = true;
      for (let i = 0; i < CONTENT.phases.length; i++) {
        S._autoWrong = false;
        loadPhase(i); mode = 'play';
        const d = W.def, find = t => W.ents.filter(e => e.type === t);
        step(d.id + ' npc'); await interact(find('npc')[0]);
        const zl = W.map.zoneLessons;
        for (const idx of zl[0]) await interact(W.ents.find(e => e.type === 'lesson' && e.idx === idx));
        if (!W.gatesOpen.has(1)) throw new Error(d.id + ': la puerta 1 no abrió');
        // prueba de desmayo y reaparición en la Fase 1
        if (i === 0) { S.hearts = 1; S._autoWrong = false; await enemyBattle(find('enemy')[0]); if (S.hearts !== S.maxHearts) throw new Error('El desmayo no restauró la energía'); log.push('p1: desmayo y reaparición OK'); }
        for (const idx of zl[1]) await interact(W.ents.find(e => e.type === 'lesson' && e.idx === idx));
        step(d.id + ' enemigos 1'); for (const e of find('enemy').filter(e => e.zone === 1)) { mode = 'play'; await enemyBattle(e); }
        step(d.id + ' prueba 1');
        await interact(W.ents.find(e => e.type === 'mg' && e.idx === 0));
        if (!W.gatesOpen.has(2)) throw new Error(d.id + ': la puerta 2 no abrió');
        step(d.id + ' enemigos 2'); for (const e of find('enemy').filter(e => e.zone === 2)) { mode = 'play'; await enemyBattle(e); }
        step(d.id + ' prueba 2');
        await interact(W.ents.find(e => e.type === 'mg' && e.idx === 1));
        if (!W.gatesOpen.has(3)) throw new Error(d.id + ': la puerta 3 no abrió');
        step(d.id + ' chela'); await interact(find('chela')[0]);
        if (!S.checkpoint) throw new Error('Erika no guardó el punto de control');
        S.hearts = S.maxHearts;
        step(d.id + ' jefe'); await interact(find('boss')[0]);
        if (!S.boss[d.boss.id]) throw new Error(d.id + ': el jefe no fue derrotado');
        if (!W.ents.some(e => e.type === 'portal')) throw new Error(d.id + ': no apareció el portal');
        objective(); render();
        const st = d.questions.reduce((a, q) => { const s = S.stats[q.id]; return a + (s ? s.r + s.w : 0); }, 0);
        log.push(`${d.id}: OK · pizarras ${d.lessons.filter(l => S.read[l.id]).length}/${d.lessons.length} · enemigos ${Object.keys(S.defeated[d.id]).length}/6 · pruebas ${d.minigames.filter(m => S.mg[m]).join('+')} · jefe ✔ · respuestas registradas ${st}`);
      }
      // repaso de errores con Erika (sin perder energía)
      const pend = Object.keys(S.stats).filter(k => S.stats[k].w > 0 && S.stats[k].r <= S.stats[k].w);
      const h0 = S.hearts; await review(pend.slice(0, 3)); if (S.hearts !== h0) throw new Error('El repaso quitó energía');
      log.push(`Repaso de errores: ${Math.min(3, pend.length)} preguntas sin perder energía OK`);
      loadPhase(FINAL_IDX); mode = 'play';
      await interact(W.ents.find(e => e.type === 'chela'));
      S.hearts = S.maxHearts;
      const before = Object.keys(S.stats).length;
      step('final'); const fb = finalBoss();
      await fb;
      if (!S.done) throw new Error('El jefe final no terminó');
      log.push(`final: OK · 3 actos · preguntas vistas en total ${Object.keys(S.stats).length} (antes del final ${before})`);
      const covered = CONTENT.phases.map(p => p.id + ':' + p.questions.filter(q => S.stats[q.id]).length + '/' + p.questions.length).join(' ');
      log.push('Cobertura de preguntas: ' + covered);
      // render de cada fase para detectar errores de dibujo
      for (let i = 0; i < PH.length; i++) { loadPhase(i); mode = 'play'; for (let k = 0; k < 5; k++) { update(0.05); render(); } }
      log.push('Render de las 6 zonas OK');
    } catch (err) { errs.push('FALLO: ' + (err && err.stack || err)); }
    const ok = errs.length === 0;
    out.textContent = JSON.stringify({ ok, ms: Math.round(performance.now() - t0), log, errors: errs }, null, 1);
    out.hidden = false;
    document.title = ok ? 'AUTOTEST OK' : 'AUTOTEST FALLO';
  }

  // Carga de la fuente antes de arrancar
  (document.fonts && document.fonts.load ? document.fonts.load('16px "Pixelify Sans"').catch(() => {}) : Promise.resolve()).then(boot);
})();
