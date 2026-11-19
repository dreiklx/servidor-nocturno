/* Controles táctiles: joystick virtual + botón A (acción / continuar) + Correr.
   Envían los mismos eventos de teclado que usa el juego, así no hay dos lógicas distintas. */
(function () {
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const fire = (type, key) => window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
  const held = new Set();
  function setDir(dirs) {
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach(k => {
      const want = dirs.includes(k);
      if (want && !held.has(k)) { held.add(k); fire('keydown', k); }
      else if (!want && held.has(k)) { held.delete(k); fire('keyup', k); }
    });
  }
  function show(on) {
    const t = document.getElementById('touch'); if (!t) return;
    t.hidden = !on; document.body.classList.toggle('touch', on);
  }
  function rotateHint() {
    const r = document.getElementById('rotate'); if (!r) return;
    r.hidden = !(document.body.classList.contains('touch') && window.innerHeight > window.innerWidth);
  }
  window.addEventListener('DOMContentLoaded', () => {
    const stick = document.getElementById('stick'), knob = document.getElementById('stick-knob');
    const btnA = document.getElementById('tb-a'), btnRun = document.getElementById('tb-run');
    if (!stick) return;
    if (coarse) show(true);
    window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { show(true); rotateHint(); } }, { passive: true });
    window.addEventListener('resize', rotateHint); rotateHint();

    let sid = null;
    function move(e) {
      const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy; const R = r.width / 2, d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const dirs = [], dead = R * 0.28;
      if (dy < -dead) dirs.push('ArrowUp'); if (dy > dead) dirs.push('ArrowDown');
      if (dx < -dead) dirs.push('ArrowLeft'); if (dx > dead) dirs.push('ArrowRight');
      setDir(dirs);
    }
    stick.addEventListener('pointerdown', e => { sid = e.pointerId; stick.setPointerCapture(sid); move(e); e.preventDefault(); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === sid) move(e); });
    const end = e => { if (e.pointerId !== sid) return; sid = null; knob.style.transform = ''; setDir([]); };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);

    btnA.addEventListener('pointerdown', e => { e.preventDefault(); fire('keydown', 'Enter'); setTimeout(() => fire('keyup', 'Enter'), 60); });
    let running = false;
    btnRun.addEventListener('pointerdown', e => { e.preventDefault(); running = !running; btnRun.classList.toggle('on', running); fire(running ? 'keydown' : 'keyup', 'Shift'); });
  });
})();
