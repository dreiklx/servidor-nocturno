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
    portal() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.3, 'sine', 0.06, 0, i * 0.07)); }
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
  function music(name) {
    if (name === 'boss' && !BATTLE.boss) name = 'battle';
    if (current === name) return;
    current = name;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (!ctx) return;
    if (BATTLE[name]) return battleLoop(BATTLE[name]);
    if (!SONGS[name]) return;
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
      if (step % 8 === 4 && noiseBuf) { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 5000; g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); s.connect(f); f.connect(g); g.connect(musicGain); s.start(t, Math.random()); s.stop(t + 0.08); }
      step++;
    }, sd * 1000);
  }
  function note(f, dur, type, vol, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + dur + 0.05);
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
  return { init, sfx, fx, music, ambient, duck, setStep, toggleMute, isMuted: () => muted };
})();
