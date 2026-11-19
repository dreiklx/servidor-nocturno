/* Audio del juego.
   Del repositorio five_doors_at_freddys se conservan solo 3 sonidos genéricos de NYDER
   (destello del logo, clic de botón y error). Todo lo demás (pasos por terreno, ataques,
   impactos, victoria, derrota, ambientes y música) se sintetiza aquí con WebAudio. */
window.AUDIO = (function () {
  let ctx = null, master = null, musicGain = null, sfxGain = null, ambGain = null, muted = false, musicTimer = null, current = null, amb = null, ambName = null, noiseBuf = null;
  const files = {
    hover: 'assets/sfx/button_hover.wav',
    error: 'assets/sfx/button_error.wav',
    sparkle: 'assets/sfx/nyder_star_sparkle.wav'
  };
  const pool = {};
  const MUSIC_VOL = 0.15, AMB_VOL = 0.32;
  try { if (localStorage.getItem('nd_muted') === '1') muted = true; } catch (e) { /* sin almacenamiento */ }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = MUSIC_VOL; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 1; sfxGain.connect(master);
      ambGain = ctx.createGain(); ambGain.gain.value = AMB_VOL; ambGain.connect(master);
      const len = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    Object.keys(files).forEach(k => { try { const a = new Audio(files[k]); a.preload = 'auto'; pool[k] = a; } catch (e) { /* sin audio */ } });
    if (current) { const c = current; current = null; music(c); }
    if (ambName) { const a = ambName; ambName = null; ambient(a); }
  }

  function sfx(name, vol = 0.6) {
    if (muted) return;
    const base = pool[name];
    if (base) { try { const a = base.cloneNode(); a.volume = vol; a.play().catch(() => {}); } catch (e) { /* ignorar */ } }
  }
  function tone(freq, dur = 0.12, type = 'square', vol = 0.12, slide = 0, delay = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + dur + 0.02);
  }
  // ráfaga de ruido filtrado: pasos, golpes, viento
  function noise(dur, type, freq, vol, opt = {}) {
    if (!ctx || muted || !noiseBuf) return;
    const t = ctx.currentTime + (opt.delay || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = opt.q || 1;
    if (opt.to) f.frequency.exponentialRampToValueAtTime(opt.to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (opt.attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(opt.bus || sfxGain); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  let stepTheme = 'muelle', stepAlt = 0;
  const fx = {
    // pasos según el suelo de cada lugar
    step() {
      stepAlt ^= 1; const v = stepAlt ? 1 : 0.85;
      if (stepTheme === 'muelle') { noise(0.06, 'bandpass', 420 * v, 0.12, { q: 3 }); tone(110 * v, 0.05, 'triangle', 0.05); }
      else if (stepTheme === 'estacion') noise(0.07, 'highpass', 1800 * v, 0.07);
      else if (stepTheme === 'boveda') { noise(0.08, 'bandpass', 900 * v, 0.08, { q: 2 }); noise(0.12, 'highpass', 3000, 0.025, { delay: 0.02 }); }
      else if (stepTheme === 'mercado') noise(0.05, 'bandpass', 1200 * v, 0.07, { q: 4 });
      else if (stepTheme === 'islas') noise(0.1, 'lowpass', 700 * v, 0.07);
      else noise(0.05, 'bandpass', 800 * v, 0.07, { q: 3 });
    },
    talk() { tone(520 + Math.random() * 120, 0.03, 'square', 0.025); },
    good() { tone(660, 0.09, 'square', 0.08); tone(990, 0.18, 'square', 0.08, 0, 0.08); },
    bad() { sfx('error', 0.45); tone(170, 0.25, 'sawtooth', 0.05, -70); },
    whoosh() { noise(0.28, 'bandpass', 400, 0.16, { to: 3200, q: 2, attack: 0.05 }); },
    hit() { noise(0.14, 'lowpass', 1800, 0.28, { to: 200 }); tone(140, 0.16, 'square', 0.1, -90); },
    win() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, i === 5 ? 0.45 : 0.14, 'square', 0.07, 0, i * 0.11)); tone(262, 0.7, 'triangle', 0.08, 0, 0.55); },
    lose() { [494, 440, 392, 330].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, -20, i * 0.22)); },
    open() { noise(0.35, 'lowpass', 300, 0.25, { to: 90 }); tone(196, 0.12, 'square', 0.06, 0, 0.1); tone(294, 0.2, 'square', 0.06, 0, 0.22); },
    page() { sfx('hover', 0.3); },
    found() { tone(1046, 0.1, 'triangle', 0.09); tone(1568, 0.25, 'triangle', 0.08, 0, 0.09); noise(0.3, 'highpass', 6000, 0.03, { delay: 0.05 }); },
    sparkle() { sfx('sparkle', 0.7); },
    cart() { for (let i = 0; i < 7; i++) { noise(0.05, 'bandpass', 2400 + (i % 2) * 500, 0.04, { q: 8, delay: i * 0.18 }); } tone(1568, 0.35, 'triangle', 0.05, 0, 1.2); tone(2093, 0.4, 'triangle', 0.04, 0, 1.3); },
    bell() { tone(1568, 0.35, 'triangle', 0.06); tone(2093, 0.4, 'triangle', 0.05, 0, 0.12); },
    thunder() {
      if (!ctx || muted) return;
      const len = ctx.sampleRate * 1.4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'lowpass'; f.frequency.value = 400; g.gain.value = 0.5;
      s.buffer = buf; s.connect(f); f.connect(g); g.connect(ambGain); s.start();
    },
    train() { tone(330, 0.18, 'square', 0.03); tone(330, 0.18, 'square', 0.03, 0, 0.26); },
    // paso de un tren: rumor grave + traqueteo de rieles durante el cruce (k = cercanía 0..1)
    trainPass(dur = 2.2, k = 1) {
      if (!ctx || muted) return;
      const v = 0.2 + 0.8 * Math.max(0, Math.min(1, k));
      noise(dur, 'lowpass', 140, 0.5 * v, { attack: 0.35, bus: ambGain });
      for (let t = 0.1; t < dur - 0.15; t += 0.19) noise(0.05, 'bandpass', 1500 + (Math.round(t / 0.19) % 2) * 400, 0.16 * v, { q: 6, delay: t, bus: ambGain });
      tone(523, 0.35, 'triangle', 0.02 * v, 0, 0.05); tone(659, 0.35, 'triangle', 0.02 * v, 0, 0.05);
    },
    teleport() { tone(300, 0.4, 'sine', 0.08, 900); noise(0.4, 'highpass', 2000, 0.04, { to: 8000 }); },
    portal() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.3, 'sine', 0.06, 0, i * 0.07)); },
    // aviso del evento "en directo": dos campanazos y un brillo
    live() { [880, 1319, 880, 1319].forEach((f, i) => tone(f, 0.1, 'triangle', 0.07, 0, i * 0.11)); tone(1760, 0.35, 'sine', 0.05, 220, 0.46); }
  };

  /* -------- ambientes por lugar (ruido filtrado con modulación lenta) -------- */
  function ambient(name) {
    ambName = name;
    if (!ctx) return;
    if (amb) { try { amb.forEach(n => n.stop && n.stop()); } catch (e) { /* ya detenido */ } amb = null; }
    const cfg = { muelle: ['lowpass', 420, 0.12, 0.12], islas: ['lowpass', 520, 0.1, 0.09], boveda: ['highpass', 2500, 0.05, 0.6], mercado: ['bandpass', 900, 0.045, 0.4], estacion: ['lowpass', 160, 0.07, 0.05], torre: ['lowpass', 260, 0.05, 0.05] }[name];
    if (!cfg || !noiseBuf) return;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = cfg[0]; f.frequency.value = cfg[1]; g.gain.value = cfg[2];
    lfo.frequency.value = cfg[3]; lg.gain.value = cfg[2] * 0.45; lfo.connect(lg); lg.connect(g.gain);
    s.connect(f); f.connect(g); g.connect(ambGain); s.start(); lfo.start();
    amb = [s, lfo];
  }

  /* -------- música: secuenciador por pasos (melodías originales) -------- */
  const SONGS = {
    title: { bpm: 84, root: 45, scale: [0, 3, 5, 7, 10], bass: [0, 0, 5, 3], wave: 'triangle' },
    muelle: { bpm: 92, root: 50, scale: [0, 2, 4, 7, 9], bass: [0, 5, 3, 4], wave: 'triangle' },
    estacion: { bpm: 112, root: 47, scale: [0, 3, 5, 7, 10], bass: [0, 0, 3, 5], wave: 'square' },
    boveda: { bpm: 70, root: 43, scale: [0, 1, 5, 7, 8], bass: [0, 1, 0, 5], wave: 'sine' },
    mercado: { bpm: 104, root: 52, scale: [0, 2, 4, 7, 9], bass: [0, 4, 5, 3], wave: 'square' },
    islas: { bpm: 88, root: 49, scale: [0, 2, 4, 7, 11], bass: [0, 3, 4, 5], wave: 'triangle' },
    torre: { bpm: 96, root: 45, scale: [0, 2, 3, 7, 8], bass: [0, 5, 3, 4], wave: 'sawtooth' },
    win: { bpm: 120, root: 52, scale: [0, 2, 4, 7, 9], bass: [0, 5, 3, 4], wave: 'square' }
  };
  // Combate: estilo RPG portátil (bajo galopante + arpegio rápido + melodía), composición propia.
  const BATTLE = {
    boss: { bpm: 150, root: 45, prog: [0, 0, 3, 3, 5, 5, 1, 1], lead: [12, 15, 19, 17, 15, 12, 10, 12, 15, 17, 19, 22, 20, 19, 17, 15], minor: true },
    battle: { bpm: 140, root: 48, prog: [0, 0, 5, 5, 3, 3, 7, 7], lead: [12, 14, 16, 19, 16, 14, 12, 7, 9, 12, 14, 16, 14, 12, 9, 7], minor: false }
  };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  /* -------- Mau: música propia del jefe final (composición original, sintetizada) --------
     suspenso: zumbido grave, disonancias lentas, latido e interferencias; los silencios los pone la escena.
     menu: el suspenso con un pulso que avisa lo que viene.
     mau1/mau2/mau3: combate con percusión (bombo, caja, platillos, tambores graves), cada acto más
     rápido, más grave y más denso. epilogo: amanecer, lento y en tono mayor. */
  const MAU_SONGS = {
    suspenso: { kind: 'drone', bpm: 56, root: 33, beat: true, crackle: 0.09 },
    menu: { kind: 'drone', bpm: 70, root: 33, beat: true, crackle: 0.05, pulse: true },
    mau1: { kind: 'fight', bpm: 128, root: 38, prog: [0, 0, 1, 0, 0, 0, 3, 1], lead: [12, null, 13, 12, 7, null, 8, 7, 12, 15, 13, 12, 8, 7, 5, 7], kick: [0, 8, 10], snare: [4, 12], toms: [], pad: false, lw: 'triangle' },
    mau2: { kind: 'fight', bpm: 142, root: 37, prog: [0, 0, 1, 1, 3, 3, 1, 6], lead: [12, 13, 15, 13, 12, 8, 7, 8, 12, 13, 15, 17, 15, 13, 12, 8], kick: [0, 3, 8, 11], snare: [4, 12], toms: [6, 14, 15], pad: false, lw: 'square' },
    mau3: { kind: 'fight', bpm: 160, root: 36, prog: [0, 0, 1, 1, 8, 8, 6, 7], lead: [12, 15, 17, 18, 17, 15, 12, 13, 19, 18, 17, 15, 13, 12, 13, 15], kick: [0, 2, 4, 6, 8, 10, 12, 14], snare: [4, 12], toms: [13, 14, 15], pad: true, lw: 'sawtooth' },
    epilogo: { kind: 'dawn', bpm: 76, root: 48, prog: [0, 5, 9, 7] }
  };
  function nbus() { return songBus || musicGain; }
  function kick(t, v = 0.9) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g); g.connect(nbus()); o.start(t); o.stop(t + 0.32);
  }
  function hiss(t, dur, type, freq, vol) {
    if (!noiseBuf) return;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(nbus()); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function tom(t, f, v = 0.5) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.25);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(nbus()); o.start(t); o.stop(t + 0.37);
  }
  function mauLoop(M) {
    let step = 0;
    if (M.kind === 'drone') {
      const sd = 60 / M.bpm / 4;
      musicTimer = setInterval(() => {
        if (muted || !ctx) { step++; return; }
        const t = ctx.currentTime, bar = Math.floor(step / 16);
        if (step % 32 === 0) { note(mtof(M.root), sd * 34, 'sawtooth', 0.16, t); note(mtof(M.root + 0.12), sd * 34, 'sine', 0.3, t); }
        if (step % 32 === 16) note(mtof(M.root + 13 + (bar % 4 === 3 ? 1 : 0)), sd * 18, 'triangle', 0.1, t); // segunda menor: inquieta
        if (M.beat && (step % 16 === 0 || step % 16 === 3)) kick(t, step % 16 === 0 ? 0.5 : 0.32);                // latido
        if (M.pulse && step % 4 === 2) note(mtof(M.root + 24), sd * 0.8, 'square', 0.035, t);
        if (Math.random() < M.crackle) hiss(t, 0.05 + Math.random() * 0.1, 'highpass', 3000 + Math.random() * 4000, 0.05 + Math.random() * 0.06); // interferencia
        step++;
      }, sd * 1000);
      return;
    }
    if (M.kind === 'dawn') {
      const sd = 60 / M.bpm / 4;
      musicTimer = setInterval(() => {
        if (muted || !ctx) { step++; return; }
        const t = ctx.currentTime, bar = Math.floor(step / 16) % M.prog.length, r = M.root + M.prog[bar];
        if (step % 16 === 0) { [0, 4, 7].forEach(i => note(mtof(r + i), sd * 15, 'sine', 0.12, t)); note(mtof(r - 12), sd * 15, 'triangle', 0.3, t); }
        if (step % 2 === 0) note(mtof(r + 12 + [0, 4, 7, 12, 16, 12, 7, 4][(step / 2) % 8]), sd * 2.5, 'triangle', 0.09, t);
        step++;
      }, sd * 1000);
      return;
    }
    const sd = 60 / M.bpm / 4;
    musicTimer = setInterval(() => {
      if (muted || !ctx) { step++; return; }
      const t = ctx.currentTime, s16 = step % 16, bar = Math.floor(step / 16) % M.prog.length, r = M.root + M.prog[bar];
      if (M.kick.includes(s16)) kick(t, 0.85);
      if (M.snare.includes(s16)) { hiss(t, 0.16, 'bandpass', 1800, 0.32); tom(t, 190, 0.18); }
      if (M.toms.includes(s16)) tom(t, s16 === 15 ? 98 : 130, 0.45);
      if (s16 % 2 === 0) hiss(t, 0.03, 'highpass', 7000, s16 % 4 === 2 ? 0.06 : 0.035);           // platillo cerrado
      if (step % 64 === 0) hiss(t, 1.2, 'highpass', 5000, 0.08);                                  // platillo de choque al empezar la frase
      note(mtof(r - 12 + (s16 % 4 === 2 ? 12 : 0)), sd * 1.6, 'sawtooth', 0.11, t);                 // bajo
      if (s16 % 2 === 0) note(mtof(r - 24), sd * 1.9, 'sine', 0.42, t);                              // sub
      if (s16 % 4 === 0) { const l = M.lead[(step / 4) % M.lead.length]; if (l !== null) note(mtof(M.root + 12 + l), sd * 3.4, M.lw, M.lw === 'sawtooth' ? 0.07 : 0.1, t); }
      if (M.pad && s16 === 0) [0, 3, 7].forEach(i => { note(mtof(r + 12 + i), sd * 15.5, 'sawtooth', 0.035, t); note(mtof(r + 12 + i) * 1.006, sd * 15.5, 'sawtooth', 0.03, t); });
      step++;
    }, sd * 1000);
  }
  /* efectos de las escenas de Mau */
  const MAUFX = {
    zap() { if (!ctx || muted) return; const t = ctx.currentTime; for (let i = 0; i < 5; i++) noise(0.03 + Math.random() * 0.05, 'highpass', 2500 + Math.random() * 5000, 0.12, { delay: i * 0.04 + Math.random() * 0.03 }); tone(60, 0.25, 'sawtooth', 0.05, 0); },
    hum() { tone(55, 1.4, 'sawtooth', 0.04, -10); tone(110, 1.4, 'sine', 0.05, 0); },
    click() { noise(0.02, 'bandpass', 2400, 0.5, { q: 4 }); tone(1800, 0.02, 'square', 0.12); noise(0.05, 'lowpass', 600, 0.4, { delay: 0.03 }); },
    lightOn() { tone(120, 0.6, 'sawtooth', 0.05, 0); noise(0.6, 'bandpass', 3200, 0.05, { q: 6 }); },
    powerDown() { tone(440, 1.2, 'sawtooth', 0.06, -380); noise(1, 'lowpass', 1200, 0.12, { to: 80 }); },
    boom() { if (!ctx || muted) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.2); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + 1.7); noise(1.4, 'lowpass', 900, 0.35, { to: 60 }); },
    riser() { tone(110, 1.6, 'sawtooth', 0.05, 880); noise(1.6, 'bandpass', 400, 0.08, { to: 6000, q: 3, attack: 1.2 }); },
    glitch() { for (let i = 0; i < 6; i++) tone(200 + Math.random() * 1600, 0.03, 'square', 0.05, 0, i * 0.035); },
    heart() { tone(60, 0.18, 'sine', 0.25, -20); tone(55, 0.16, 'sine', 0.18, -15, 0.22); },
    unlock() { tone(392, 0.09, 'square', 0.07); tone(784, 0.16, 'triangle', 0.08, 0, 0.07); noise(0.08, 'highpass', 4000, 0.08, { delay: 0.02 }); },
    restore() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.35, 'triangle', 0.07, 0, i * 0.09)); },
    thunder() { noise(1.8, 'lowpass', 500, 0.4, { to: 70, attack: 0.02 }); }
  };
  Object.assign(fx, MAUFX);
  // cada pista suena por su propio bus; al cambiar de pista el bus viejo se apaga y se desconecta
  let songBus = null, liveBuses = 0;
  function retireBus() {
    if (!songBus) return;
    const old = songBus; songBus = null;
    try { old.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); } catch (e) { /* ignorar */ }
    setTimeout(() => { try { old.disconnect(); } catch (e) { /* ya desconectado */ } liveBuses--; }, 450);
  }
  function music(name) {
    if (name === 'boss' && !BATTLE.boss) name = 'battle';
    if (current === name) return;
    current = name;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (!ctx) return;
    retireBus(); // la pista anterior se apaga en 50 ms: nunca suenan dos a la vez
    if (!BATTLE[name] && !SONGS[name] && !MAU_SONGS[name]) return;
    songBus = ctx.createGain(); songBus.gain.value = 1; songBus.connect(musicGain); liveBuses++;
    if (MAU_SONGS[name]) return mauLoop(MAU_SONGS[name]);
    if (BATTLE[name]) return battleLoop(BATTLE[name]);
    const S = SONGS[name]; let step = 0;
    const stepDur = 60 / S.bpm / 2;
    let seed = name.length * 97;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const melody = Array.from({ length: 32 }, () => (rnd() < 0.62 ? S.scale[Math.floor(rnd() * S.scale.length)] + (rnd() < 0.3 ? 12 : 0) : null));
    musicTimer = setInterval(() => {
      if (muted || !ctx) { step++; return; }
      const t = ctx.currentTime;
      if (step % 8 === 0) note(mtof(S.root - 12 + S.bass[(step / 8) % S.bass.length]), stepDur * 7.5, 'triangle', 0.5, t);
      const m = melody[step % melody.length];
      if (m !== null && step % 2 === 0) note(mtof(S.root + 12 + m), stepDur * 1.6, S.wave, S.wave === 'sawtooth' || S.wave === 'square' ? 0.12 : 0.22, t);
      step++;
    }, stepDur * 1000);
  }
  function battleLoop(B) {
    let step = 0; const sd = 60 / B.bpm / 4; // semicorcheas
    const third = B.minor ? 3 : 4;
    musicTimer = setInterval(() => {
      if (muted || !ctx) { step++; return; }
      const t = ctx.currentTime, bar = Math.floor(step / 16) % B.prog.length, r = B.root + B.prog[bar];
      if (step % 2 === 0) note(mtof(r - 12 + (step % 4 === 2 ? 12 : 0)), sd * 1.8, 'triangle', 0.55, t);          // bajo galopante
      const arp = [0, third, 7, 12][step % 4]; note(mtof(r + 12 + arp), sd * 0.9, 'square', 0.06, t);            // arpegio
      if (step % 4 === 0) { const l = B.lead[(step / 4) % B.lead.length]; note(mtof(B.root + 12 + l), sd * 3.6, 'square', 0.13, t); } // melodía
      if (step % 8 === 4 && noiseBuf) { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 5000; g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); s.connect(f); f.connect(g); g.connect(songBus || musicGain); s.start(t, Math.random()); s.stop(t + 0.08); }
      step++;
    }, sd * 1000);
  }
  function note(f, dur, type, vol, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(songBus || musicGain); o.start(t); o.stop(t + dur + 0.05);
  }
  // baja la música mientras habla la narración
  function duck(on) { if (musicGain && ctx) musicGain.gain.setTargetAtTime(on ? MUSIC_VOL * 0.25 : MUSIC_VOL, ctx.currentTime, 0.2); if (ambGain && ctx) ambGain.gain.setTargetAtTime(on ? AMB_VOL * 0.25 : AMB_VOL, ctx.currentTime, 0.2); }
  function setStep(theme) { stepTheme = theme; }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('nd_muted', muted ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
    if (master) master.gain.value = muted ? 0 : 0.9;
    return muted;
  }
  /* Desbloqueo en teléfonos: el navegador deja WebAudio en pausa ("suspended") si no se reanuda
     dentro de un toque, y iOS lo silencia con el interruptor de silencio. Las narraciones usan
     <audio> y por eso sí sonaban. Se reanuda en cada gesto y al volver a la app. */
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* sin soporte */ }
    if (!ctx) init();
    if (ctx && ctx.state !== 'running') {
      ctx.resume().catch(() => {});
      try { const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(0); } catch (e) { /* ignorar */ }
    }
  }
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(t => window.addEventListener(t, unlock, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); });
  return { init, sfx, fx, music, ambient, duck, setStep, toggleMute, isMuted: () => muted, playing: () => current, debug: () => ({ current, timer: !!musicTimer, active: songBus ? 1 : 0, fading: Math.max(0, liveBuses - (songBus ? 1 : 0)) }), state: () => (ctx ? ctx.state : 'sin iniciar') };
})();
