/* Audio: efectos del repositorio Five Doors at Freddy's (copias en assets/sfx)
   y música ambiental generada con WebAudio (sin archivos externos). */
window.AUDIO = (function () {
  let ctx = null, master = null, musicGain = null, muted = false, musicTimer = null, current = null;
  const files = {
    hover: 'assets/sfx/button_hover.wav',
    error: 'assets/sfx/button_error.wav',
    found: 'assets/sfx/collectible_found.wav',
    door: 'assets/sfx/door.wav',
    sparkle: 'assets/sfx/nyder_star_sparkle.wav'
  };
  const pool = {};
  try { if (localStorage.getItem('nd_muted') === '1') muted = true; } catch (e) {}

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
    } catch (e) { ctx = null; }
    Object.keys(files).forEach(k => { try { const a = new Audio(files[k]); a.preload = 'auto'; pool[k] = a; } catch (e) {} });
  }

  function sfx(name, vol = 0.6) {
    if (muted) return;
    const base = pool[name];
    if (base) {
      try { const a = base.cloneNode(); a.volume = vol; a.play().catch(() => {}); return; } catch (e) {}
    }
  }

  function tone(freq, dur = 0.12, type = 'square', vol = 0.12, slide = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  const fx = {
    step() { tone(90 + Math.random() * 30, 0.04, 'triangle', 0.03); },
    talk() { tone(520 + Math.random() * 120, 0.03, 'square', 0.025); },
    good() { tone(660, 0.09, 'square', 0.09); setTimeout(() => tone(990, 0.16, 'square', 0.09), 80); },
    bad() { sfx('error', 0.5); tone(160, 0.25, 'sawtooth', 0.06, -80); },
    hit() { tone(220, 0.08, 'square', 0.1, -120); },
    open() { sfx('door', 0.45); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'square', 0.08), i * 110)); },
    page() { sfx('hover', 0.35); },
    found() { sfx('found', 0.45); },
    sparkle() { sfx('sparkle', 0.7); },
    thunder() {
      if (!ctx || muted) return;
      const len = ctx.sampleRate * 1.4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'lowpass'; f.frequency.value = 400; g.gain.value = 0.35;
      s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start();
    },
    train() { tone(330, 0.2, 'square', 0.05); setTimeout(() => tone(330, 0.2, 'square', 0.05), 260); }
  };

  // Música: secuencias pentatónicas suaves por fase
  const SONGS = {
    title: { bpm: 84, root: 45, scale: [0, 3, 5, 7, 10], bass: [0, 0, 5, 3], wave: 'triangle' },
    muelle: { bpm: 92, root: 50, scale: [0, 2, 4, 7, 9], bass: [0, 5, 3, 4], wave: 'triangle' },
    estacion: { bpm: 112, root: 47, scale: [0, 3, 5, 7, 10], bass: [0, 0, 3, 5], wave: 'square' },
    boveda: { bpm: 70, root: 43, scale: [0, 1, 5, 7, 8], bass: [0, 1, 0, 5], wave: 'sine' },
    mercado: { bpm: 104, root: 52, scale: [0, 2, 4, 7, 9], bass: [0, 4, 5, 3], wave: 'square' },
    islas: { bpm: 88, root: 49, scale: [0, 2, 4, 7, 11], bass: [0, 3, 4, 5], wave: 'triangle' },
    torre: { bpm: 96, root: 45, scale: [0, 2, 3, 7, 8], bass: [0, 5, 3, 4], wave: 'sawtooth' },
    boss: { bpm: 132, root: 45, scale: [0, 1, 3, 7, 8], bass: [0, 0, 1, 0], wave: 'sawtooth' },
    win: { bpm: 120, root: 52, scale: [0, 2, 4, 7, 9], bass: [0, 5, 3, 4], wave: 'square' }
  };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function music(name) {
    if (current === name) return;
    current = name;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (!ctx || !SONGS[name]) return;
    const S = SONGS[name]; let step = 0;
    const stepDur = 60 / S.bpm / 2;
    let seed = name.length * 97;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const melody = Array.from({ length: 32 }, () => (rnd() < 0.62 ? S.scale[Math.floor(rnd() * S.scale.length)] + (rnd() < 0.3 ? 12 : 0) : null));
    musicTimer = setInterval(() => {
      if (muted || !ctx) { step++; return; }
      const t = ctx.currentTime;
      if (step % 8 === 0) {
        const b = S.bass[(step / 8) % S.bass.length];
        note(mtof(S.root - 12 + b), stepDur * 7.5, 'triangle', 0.5, t);
      }
      const m = melody[step % melody.length];
      if (m !== null && step % 2 === 0) note(mtof(S.root + 12 + m), stepDur * 1.6, S.wave, S.wave === 'sawtooth' || S.wave === 'square' ? 0.12 : 0.22, t);
      step++;
    }, stepDur * 1000);
  }
  function note(f, dur, type, vol, t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + dur + 0.05);
  }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('nd_muted', muted ? '1' : '0'); } catch (e) {}
    if (master) master.gain.value = muted ? 0 : 0.9;
    return muted;
  }
  return { init, sfx, fx, music, toggleMute, isMuted: () => muted };
})();
