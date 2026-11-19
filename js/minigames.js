/* Minijuegos: una dinámica distinta por estación. Todos devuelven Promise<boolean>. */
window.MINI = (function () {
  const { h, esc } = UI;
  const AUTO = UI.AUTO;

  function shell(def, extraCls = '') {
    const m = h('div', 'modal card mg ' + extraCls);
    m.innerHTML = `<div class="card-head"><span class="chip">Prueba</span><span class="mg-prog"></span></div>
      <h2>${esc(def.title)}</h2><p class="mg-intro">${esc(def.intro)}</p>
      <div class="mg-body"></div><div class="mg-fb" hidden></div>
      <div class="card-foot"><span class="keyhint">Esc: salir y volver luego</span><div class="mg-actions"></div></div>`;
    const S = { m, body: m.querySelector('.mg-body'), fb: m.querySelector('.mg-fb'), actions: m.querySelector('.mg-actions'), prog: m.querySelector('.mg-prog') };
    S.feedback = (html, kind) => { S.fb.hidden = false; S.fb.className = 'mg-fb ' + (kind || ''); S.fb.innerHTML = html; };
    S.clearFb = () => { S.fb.hidden = true; };
    S.button = (label, cls, fn) => { const b = h('button', 'btn ' + (cls || ''), label); b.addEventListener('click', fn); S.actions.appendChild(b); return b; };
    return S;
  }
  function run(S, onKey) {
    return new Promise(resolve => {
      S.resolve = v => { UI.close(S.m); resolve(v); };
      const entry = UI.open(S.m, e => { if (e.key === 'Escape') { e.preventDefault(); S.resolve(false); } else if (onKey) onKey(e); });
      entry.win = () => { if (!S.won) done(S, ''); };
    });
  }
  function done(S, html) {
    S.won = true;
    AUDIO.fx.win();
    S.body.innerHTML = `<div class="mg-done">¡Prueba superada!</div>${html ? `<div class="mg-sum">${html}</div>` : ''}`;
    S.clearFb(); S.actions.innerHTML = '';
    const b = S.button('Continuar', 'primary', () => S.resolve(true));
    if (AUTO) setTimeout(() => b.click(), 0); else b.focus();
  }
  const later = fn => setTimeout(fn, AUTO ? 0 : 0);

  /* ---------- 1 · Grúa transaccional ---------- */
  function crane(def) {
    const S = shell(def, 'crane');
    let r = 0, pos = 0, errors = 0;
    function round() {
      const R = def.rounds[r]; pos = 0; S.clearFb();
      S.prog.textContent = `Ronda ${r + 1}/${def.rounds.length} · ${R.name}`;
      S.body.innerHTML = `<div class="crane-wrap"><div class="crane-stack"><div class="crane-hook">Contenedores en el barco</div><ol class="stack"></ol></div><div class="crane-pool"></div></div>`;
      const pool = S.body.querySelector('.crane-pool'), stack = S.body.querySelector('.stack');
      LOGIC.shuffle(R.lines.map((t, i) => ({ t, i }))).forEach(({ t, i }) => {
        const b = h('button', 'crate', esc(t)); b.dataset.i = i;
        b.addEventListener('click', () => {
          if (i === pos) {
            AUDIO.fx.good(); b.remove(); stack.appendChild(h('li', 'placed', esc(t))); pos++; S.clearFb();
            if (pos === R.lines.length) {
              S.feedback(`<b>¡Orden correcto!</b> ${esc(R.why)}`, 'ok');
              S.actions.innerHTML = '';
              const nb = S.button(r + 1 < def.rounds.length ? 'Siguiente ronda' : 'Terminar', 'primary', () => { S.actions.innerHTML = ''; r++; if (r < def.rounds.length) round(); else done(S, `Errores durante la prueba: ${errors}. ${errors ? 'Cada error fue una pista: repase la pizarra de COMMIT/ROLLBACK si lo necesita.' : '¡Impecable!'}`); });
              if (AUTO) later(() => nb.click());
            }
          } else {
            errors++; AUDIO.fx.bad(); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
            const exp = R.lines[pos];
            S.feedback(`Ese todavía no va. Piense: después de <code>${esc(R.lines[pos - 1] || 'nada')}</code>, ¿qué paso sigue? ${pos === 0 ? 'Todo empieza abriendo el bloque o la transacción.' : ''}${errors > 2 ? ` <i>(Pista fuerte: empieza con “${esc(exp.split(' ')[0])}”).</i>` : ''}`, 'ko');
          }
        });
        pool.appendChild(b);
      });
      if (AUTO) R.lines.forEach((_, i) => later(() => { const b = pool.querySelector(`[data-i="${i}"]`); if (b) b.click(); }));
    }
    round();
    return run(S);
  }

  /* ---------- 2 · Clasificador de anomalías ---------- */
  function sorter(def) {
    const S = shell(def, 'sorter');
    let queue = LOGIC.shuffle(def.cards.slice()), ok = 0, bad = 0;
    const defs = ['lee algo que otra transacción aún NO confirmó', 'la MISMA fila cambia entre dos lecturas, con un cambio confirmado', 'aparecen FILAS NUEVAS con la misma condición'];
    function show() {
      if (!queue.length) { done(S, `Clasificadas: ${ok} a la primera, ${bad} con segundo intento.`); return; }
      const c = queue[0]; S.clearFb();
      S.prog.textContent = `Quedan ${queue.length}`;
      S.body.innerHTML = `<div class="sort-card">${esc(c.t)}</div><div class="bins"></div>`;
      const bins = S.body.querySelector('.bins');
      def.bins.forEach((name, i) => {
        const b = h('button', 'bin', `<b>${esc(name)}</b><small>${esc(defs[i])}</small>`);
        b.addEventListener('click', () => {
          if (b.disabled) return;
          [...bins.children].forEach(x => x.disabled = true);
          if (i === c.b) { ok += c.miss ? 0 : 1; AUDIO.fx.good(); b.classList.add('right'); S.feedback(`<b>¡Bien!</b> Es ${esc(name).toLowerCase()}: ${esc(defs[i])}.`, 'ok'); queue.shift(); }
          else { bad++; c.miss = true; AUDIO.fx.bad(); b.classList.add('wrong'); bins.children[c.b].classList.add('right'); S.feedback(`Era <b>${esc(def.bins[c.b])}</b>: ${esc(defs[c.b])}. Esta caja volverá al final de la fila.`, 'ko'); queue.push(queue.shift()); }
          S.actions.innerHTML = '';
          const nb = S.button('Siguiente caja', 'primary', () => { S.actions.innerHTML = ''; show(); });
          if (AUTO) later(() => nb.click()); else nb.focus();
        });
        bins.appendChild(b);
      });
      if (AUTO) later(() => bins.children[c.b].click());
    }
    show();
    return run(S, e => { if (/^[1-3]$/.test(e.key)) { const b = S.body.querySelectorAll('.bin')[+e.key - 1]; if (b) b.click(); } else if (e.key === 'Enter') { const b = S.actions.querySelector('.primary'); if (b) b.click(); } });
  }

  /* ---------- 3 · Grafo de vías (precedencia) ---------- */
  function graph(def) {
    const S = shell(def, 'graph');
    const pool = def.pool.map((s, i) => ({ s, i, r: LOGIC.precedence(s) }));
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const two = pool.filter(p => p.r.ts.length === 2 && !p.r.cycle), three = pool.filter(p => p.r.ts.length === 3 && !p.r.cycle), cyc = pool.filter(p => p.r.cycle);
    const rounds = [pick(two), pick(three), pick(cyc)];
    let r = 0, tries = 0;
    const colors = { 1: '#6d6ff0', 2: '#f0a23c', 3: '#3cc6a0' };
    function round() {
      const P = rounds[r], R = P.r; tries = 0; S.clearFb(); S.actions.innerHTML = '';
      S.prog.textContent = `Plan ${r + 1}/3 · Ejercicio ${P.i + 1} de la Guía #9`;
      const ops = LOGIC.parseSchedule(P.s);
      const n = R.ts.length;
      const pos = n === 2 ? { 1: [70, 80], 2: [250, 80] } : { 1: [160, 30], 2: [60, 140], 3: [260, 140] };
      const all = []; R.ts.forEach(a => R.ts.forEach(b => { if (a !== b) all.push([a, b]); }));
      const on = new Set(); let verdict = null;
      S.body.innerHTML = `<div class="sched">${ops.map(o => `<span class="op" style="--c:${colors[o.t]}">${esc(o.raw)}</span>`).join('')}</div>
        <div class="graph-wrap"><svg viewBox="0 0 320 ${n === 2 ? 160 : 180}" class="gsvg"></svg>
        <div class="graph-ctrl"><div class="lbl">1. Active las aristas (Ti → Tj):</div><div class="edges"></div>
        <div class="lbl">2. Veredicto:</div><div class="verdict"><button class="vbtn" data-v="s">Serializable</button><button class="vbtn" data-v="c">No serializable (ciclo)</button></div></div></div>`;
      const svg = S.body.querySelector('svg'), eb = S.body.querySelector('.edges');
      all.forEach(([a, b]) => {
        const btn = h('button', 'ebtn', `T${a} → T${b}`);
        btn.addEventListener('click', () => { const k = a + '>' + b; on.has(k) ? on.delete(k) : on.add(k); btn.classList.toggle('on', on.has(k)); draw(); AUDIO.sfx('hover', 0.25); });
        btn.dataset.k = a + '>' + b; eb.appendChild(btn);
      });
      S.body.querySelectorAll('.vbtn').forEach(b => b.addEventListener('click', () => { verdict = b.dataset.v; S.body.querySelectorAll('.vbtn').forEach(x => x.classList.toggle('on', x === b)); }));
      function draw() {
        let s = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#ffd34d"/></marker></defs>`;
        on.forEach(k => {
          const [a, b] = k.split('>').map(Number); const [x1, y1] = pos[a], [x2, y2] = pos[b];
          const both = on.has(b + '>' + a); const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
          const sx = x1 + ux * 26, sy = y1 + uy * 26, ex = x2 - ux * 28, ey = y2 - uy * 28;
          const off = both ? 18 : 0, mx = (sx + ex) / 2 - uy * off, my = (sy + ey) / 2 + ux * off;
          s += `<path d="M${sx},${sy} Q${mx},${my} ${ex},${ey}" stroke="#ffd34d" stroke-width="3" fill="none" marker-end="url(#ar)"/>`;
        });
        R.ts.forEach(t => { const [x, y] = pos[t]; s += `<circle cx="${x}" cy="${y}" r="24" fill="${colors[t]}" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y + 6}" text-anchor="middle" font-size="18" fill="#fff" font-family="Segoe UI, sans-serif" font-weight="700">T${t}</text>`; });
        svg.innerHTML = s;
      }
      draw();
      const check = S.button('Comprobar', 'primary', () => {
        const want = new Set(R.edges.map(([a, b]) => a + '>' + b));
        const missing = [...want].filter(k => !on.has(k)), extra = [...on].filter(k => !want.has(k));
        const vOk = verdict === (R.cycle ? 'c' : 's');
        if (!verdict) { S.feedback('Falta el paso 2: elija el veredicto.', 'ko'); return; }
        if (!missing.length && !extra.length && vOk) {
          AUDIO.fx.good();
          const why = R.edges.map(([a, b]) => `T${a}→T${b}: ${R.why[a + '>' + b][0]}`).join('<br>') || 'No hay operaciones en conflicto entre transacciones.';
          S.feedback(`<b>¡Vías correctas!</b><br>${why}<br>${R.cycle ? '<b>Hay ciclo</b>: no es serializable por conflictos.' : `<b>Sin ciclo</b>: orden serie equivalente ${R.order.map(t => 'T' + t).join(', ')}.`}`, 'ok');
          S.actions.innerHTML = '';
          const nb = S.button(r < 2 ? 'Siguiente plan' : 'Terminar', 'primary', () => { r++; if (r < 3) round(); else done(S, 'Recuerde: dos lecturas no chocan; hace falta al menos una escritura sobre el mismo dato.'); });
          if (AUTO) later(() => nb.click());
        } else {
          tries++; AUDIO.fx.bad();
          let msg = '<b>Todavía no.</b>';
          if (missing.length) msg += `<br>Falta ${tries > 1 ? missing.map(k => `T${k.replace('>', '→T')} (${R.why[k][0]})`).join(', ') : missing.length + ' arista(s). Busque pares: transacciones distintas, mismo dato, al menos una escritura'}.`;
          if (extra.length) msg += `<br>Sobra ${extra.map(k => 'T' + k.replace('>', '→T')).join(', ')}: no hay una operación de la primera que preceda a otra en conflicto de la segunda.`;
          if (!vOk && !missing.length && !extra.length) msg += '<br>Las aristas están bien; revise si forman un ciclo.';
          S.feedback(msg, 'ko');
        }
      });
      if (AUTO) {
        R.edges.forEach(([a, b]) => later(() => eb.querySelector(`[data-k="${a}>${b}"]`).click()));
        later(() => { S.body.querySelector(`.vbtn[data-v="${R.cycle ? 'c' : 's'}"]`).click(); check.click(); });
      }
    }
    round();
    return run(S);
  }

  /* ---------- genérico: rondas de opción ---------- */
  function choiceRounds(def, items, render, cls) {
    const S = shell(def, cls);
    let queue = items.map((it, i) => Object.assign({ _i: i }, it)), first = 0;
    function show() {
      if (!queue.length) { done(S, `Aciertos a la primera: ${first} de ${items.length}.`); return; }
      const it = queue[0]; S.clearFb(); S.actions.innerHTML = '';
      S.prog.textContent = `Quedan ${queue.length}`;
      const { html, choices, correct, why } = render(it);
      S.body.innerHTML = html + '<div class="choices"></div>';
      const box = S.body.querySelector('.choices');
      choices.forEach((c, i) => {
        const b = h('button', 'choice', `<kbd>${i + 1}</kbd> ${c}`);
        b.addEventListener('click', () => {
          if (b.disabled) return;
          [...box.children].forEach(x => x.disabled = true);
          if (i === correct) { if (!it._miss) first++; AUDIO.fx.good(); b.classList.add('right'); S.feedback(`<b>¡Correcto!</b> ${why}`, 'ok'); queue.shift(); }
          else { it._miss = true; AUDIO.fx.bad(); b.classList.add('wrong'); box.children[correct].classList.add('right'); S.feedback(`<b>No.</b> ${why} <i>Volverá al final para repasarlo.</i>`, 'ko'); queue.push(queue.shift()); }
          const nb = S.button('Siguiente', 'primary', () => show());
          if (AUTO) later(() => nb.click()); else nb.focus();
        });
        box.appendChild(b);
      });
      if (AUTO) later(() => box.children[correct].click());
    }
    show();
    return run(S, e => { if (/^[1-9]$/.test(e.key)) { const b = S.body.querySelectorAll('.choice')[+e.key - 1]; if (b) b.click(); } else if (e.key === 'Enter') { const b = S.actions.querySelector('.primary'); if (b) b.click(); } });
  }

  /* ---------- 4 · Cambio de agujas (bloqueos) ---------- */
  function locks(def) {
    return choiceRounds(def, def.rounds, it => ({
      html: `<div class="lock-scene">${esc(it.t)}</div><table class="mini compat"><tr><th>Existente \\ Pide</th><th>S</th><th>X</th></tr><tr><td>S</td><td>Compatible</td><td>Espera</td></tr><tr><td>X</td><td>Espera</td><td>Espera</td></tr></table>`,
      choices: def.choices.map(esc), correct: it.a, why: esc(it.why)
    }), 'locks');
  }

  /* ---------- 5 · Plan de rescate (restauración) ---------- */
  function restore(def) {
    const S = shell(def, 'restore');
    let r = 0;
    function round() {
      const R = def.rounds[r], chain = LOGIC.restoreChain(R.items); let q = [];
      S.clearFb(); S.actions.innerHTML = '';
      S.prog.textContent = `Caso ${r + 1}/${def.rounds.length} · ${R.name}`;
      S.body.innerHTML = `<div class="timeline">${R.items.map(it => `<button class="bk ${it.k}" data-id="${it.id}"><b>${it.k}</b><span>${it.id}</span><small>${esc(it.d)}</small></button>`).join('')}<div class="bk fail"><small>Falla: ${esc(R.fail)}</small></div></div>
        <div class="queue-l">Orden de restauración:</div><div class="queue"><i>(vacío: haga clic en los respaldos)</i></div>`;
      const qb = S.body.querySelector('.queue');
      const paint = () => { qb.innerHTML = q.length ? q.map((id, i) => `<span class="qi">${i + 1}. ${id}</span>`).join(' → ') : '<i>(vacío: haga clic en los respaldos)</i>'; S.body.querySelectorAll('.bk[data-id]').forEach(b => b.classList.toggle('used', q.includes(b.dataset.id))); };
      S.body.querySelectorAll('.bk[data-id]').forEach(b => b.addEventListener('click', () => { if (!q.includes(b.dataset.id)) { q.push(b.dataset.id); paint(); AUDIO.sfx('hover', 0.3); } }));
      S.button('Deshacer', 'ghost', () => { q.pop(); paint(); });
      const go = S.button('Restaurar', 'primary', () => {
        if (q.join(',') === chain.join(',')) {
          AUDIO.fx.good();
          S.feedback(`<b>¡Base restaurada!</b><br>${LOGIC.explainRestore(R.items).map(esc).join('<br>')}`, 'ok');
          S.actions.innerHTML = '';
          const nb = S.button(r + 1 < def.rounds.length ? 'Siguiente caso' : 'Terminar', 'primary', () => { r++; if (r < def.rounds.length) round(); else done(S, 'Regla de oro: último FULL → último DIFF posterior → todos los LOG posteriores en orden.'); });
          if (AUTO) later(() => nb.click());
        } else {
          AUDIO.fx.bad();
          const hint = q[0] !== chain[0] ? `Empiece por el <b>último FULL</b> antes de la falla.` : q.length < chain.length ? 'Le falta al menos un respaldo: recuerde que los LOG no se pueden saltar.' : 'Sobra algún respaldo o el orden no es el correcto: ¿el diferencial ya cubre esos cambios?';
          S.feedback(`<b>La base no levanta.</b> ${hint}`, 'ko'); q = []; paint();
        }
      });
      if (AUTO) { chain.forEach(id => later(() => S.body.querySelector(`.bk[data-id="${id}"]`).click())); later(() => go.click()); }
    }
    round();
    return run(S);
  }

  /* ---------- 6 · Llaves de la bóveda (seguridad) ---------- */
  function keys(def) {
    return choiceRounds(def, def.locks, it => ({
      html: `<div class="lock-scene">${esc(it.t)}</div>`,
      choices: def.keys.map(k => esc(k)), correct: it.a,
      why: esc(['Roles con mínimo privilegio: permisos asignados por función (GRANT/DENY/REVOKE).', 'RLS: predicados de filtrado deciden qué filas ve cada usuario.', 'DDM: cambia la presentación del dato; lo almacenado queda intacto.', 'Cifrado de columna: protege el contenido con una clave; descifrar requiere permiso.', 'Auditoría: registra acciones para rastrear cambios.'][it.a])
    }), 'keys');
  }

  /* ---------- 7 · Puesto de reescritura (optimización) ---------- */
  function rewrite(def) {
    return choiceRounds(def, def.rounds, it => {
      const flip = Math.random() < 0.5;
      const A = flip ? it.b : it.a, B = flip ? it.a : it.b;
      const best = (it.best === 'a') !== flip ? 0 : 1;
      return {
        html: `<div class="duo"><div class="stall"><div class="stall-h">Vendedor 1</div><pre class="code">${esc(A)}</pre></div><div class="stall"><div class="stall-h">Vendedor 2</div><pre class="code">${esc(B)}</pre></div></div>`,
        choices: ['Comprar la del vendedor 1', 'Comprar la del vendedor 2'], correct: best, why: esc(it.why)
      };
    }, 'rewrite');
  }

  /* ---------- 8 · Caja del caché ---------- */
  function cache(def) {
    const S = shell(def, 'cache');
    const sim = LOGIC.cacheSim(def.seq);
    let i = 0, right = 0, total = 0; const cacheSet = new Set();
    function paint() {
      S.body.innerHTML = `<div class="reqs">${def.seq.map((s, j) => `<span class="req ${j < i ? 'done ' + (sim.marks[j] || '').toLowerCase() : ''} ${j === i ? 'cur' : ''} ${s.op === 'inv' ? 'inv' : ''}">${s.op === 'inv' ? '✖' + s.k : s.k}</span>`).join('')}</div>
        <div class="cache-box"><b>Redis ahora:</b> ${cacheSet.size ? [...cacheSet].map(k => `<span class="ck">${k}</span>`).join('') : '<i>vacía</i>'}</div>
        <div class="cache-q"></div>`;
    }
    function step() {
      S.actions.innerHTML = '';
      if (i >= def.seq.length) return rate();
      paint();
      const s = def.seq[i], cq = S.body.querySelector('.cache-q');
      if (s.op === 'inv') {
        cq.innerHTML = `Ojo: ${esc(s.t)}`; cacheSet.delete(s.k);
        const nb = S.button('Entendido', 'primary', () => { i++; S.clearFb(); step(); });
        if (AUTO) later(() => nb.click()); else nb.focus();
        return;
      }
      cq.innerHTML = `Llega una lectura del producto <b>${s.k}</b>. ¿Qué pasa en Redis?`;
      const truth = sim.marks[i];
      ['HIT', 'MISS'].forEach(lbl => {
        const b = S.button(lbl === 'HIT' ? 'HIT (estaba en caché)' : 'MISS (no estaba)', lbl === 'HIT' ? 'hit' : 'miss', () => {
          total++; const ok = lbl === truth; if (ok) { right++; AUDIO.fx.good(); } else AUDIO.fx.bad();
          S.feedback(`${ok ? '<b>¡Bien!</b>' : '<b>No:</b>'} ${truth === 'HIT' ? `${s.k} ya estaba en Redis: se devuelve la copia (2 a 5 ms).` : `${s.k} no estaba${cacheSet.size ? '' : ' (caché vacía)'}: se lee del SGBD (~120 ms), se responde y se guarda una copia con TTL.`}`, ok ? 'ok' : 'ko');
          if (truth === 'MISS') cacheSet.add(s.k);
          i++; step();
        });
        if (AUTO && lbl === truth) later(() => b.click());
      });
    }
    function rate() {
      paint();
      const cq = S.body.querySelector('.cache-q');
      const correct = `${Math.round(sim.rate)} %`;
      const opts = LOGIC.shuffle([correct, `${Math.round(100 * sim.hits / (def.seq.length))} %`, `${Math.round(100 * sim.misses / (sim.hits + sim.misses))} %`, `${Math.round(100 * sim.hits / sim.misses)} %`].filter((v, j, a) => a.indexOf(v) === j));
      cq.innerHTML = `Hubo <b>${sim.hits} hits</b> y <b>${sim.misses} misses</b>. ¿Cuál es la tasa de aciertos?`;
      opts.forEach(o => {
        const b = S.button(o, 'ghost', () => {
          if (o === correct) { AUDIO.fx.good(); done(S, `Tasa = hits ÷ (hits + misses) × 100 = ${sim.hits} ÷ ${sim.hits + sim.misses} × 100 ≈ ${sim.rate.toFixed(1)} %. Predicciones correctas: ${right}/${total}.<br>Ojo: la invalidación de B provocó un MISS extra, pero garantizó el precio nuevo.`); }
          else { AUDIO.fx.bad(); S.feedback(`Use la fórmula del artículo: hits ÷ (hits + misses) × 100. Las invalidaciones no cuentan como lecturas.`, 'ko'); }
        });
        if (AUTO && o === correct) later(() => b.click());
      });
    }
    step();
    return run(S);
  }

  /* ---------- 9 · Corte de tablas ---------- */
  function cut(def) {
    return choiceRounds(def, def.rounds, it => {
      const hiRow = r => (it.show === 'rows' ? (r[3] === 'CR' ? 'n1' : 'n2') : it.show === 'both' ? (r[3] === 'PA' ? 'n2' : '') : '');
      const hiCol = c => (it.show === 'cols' ? (c <= 2 ? 'n1' : c >= 4 ? 'n2' : '') : it.show === 'both' ? (c >= 4 ? 'n2c' : '') : '');
      const table = `<table class="ctab"><tr>${def.cols.map((c, i) => `<th class="${hiCol(i)}">${esc(c)}</th>`).join('')}</tr>${def.rows.map(r => `<tr class="${hiRow(r)}">${r.map((v, i) => `<td class="${hiCol(i)}">${esc(v)}</td>`).join('')}</tr>`).join('')}</table>`;
      const why = it.opts[0].startsWith('Replic')
        ? ['Total: cada nodo tiene una copia completa.', 'Parcial: solo ciertas partes se replican.', 'Sin replicación: cada dato vive en un solo nodo.'][it.a]
        : ['Horizontal: se reparten FILAS (por ejemplo, por país).', 'Vertical: se reparten COLUMNAS (personales vs. financieras).', 'Mixta: combina filas de un país con solo algunas columnas.'][it.a];
      return { html: `<div class="lock-scene">${esc(it.t)}</div>${table}`, choices: it.opts.map(esc), correct: it.a, why: esc(why) };
    }, 'cut');
  }

  /* ---------- 10 · Consola MQL ---------- */
  function mql(def) {
    const S = shell(def, 'mql');
    let k = 0;
    const values = f => {
      const vals = [...new Set(def.docs.map(d => LOGIC.getPath(d, f)))];
      if (typeof vals[0] === 'number') return [20, 25, 30, 35];
      return vals.sort();
    };
    function task() {
      const T = def.tasks[k]; S.clearFb(); S.actions.innerHTML = '';
      S.prog.textContent = `Ejercicio ${T.n} · ${k + 1}/${def.tasks.length}`;
      const expected = LOGIC.mqlRun(def.docs, T.f, T.op, T.v).map(d => d.nombre).join('|');
      S.body.innerHTML = `<div class="lock-scene">Ej. ${T.n}: ${esc(T.t)}</div>
        <div class="mql-builder">db.cursos.find({ <select class="sf">${def.fields.map(f => `<option>${f}</option>`).join('')}</select>
        <select class="so">${def.ops.map(o => `<option value="${o}">${o === '=' ? ': (igual)' : o}</option>`).join('')}</select>
        <select class="sv"></select> })</div>
        <pre class="code mql-text"></pre><div class="mql-res"></div>`;
      const sf = S.body.querySelector('.sf'), so = S.body.querySelector('.so'), sv = S.body.querySelector('.sv'), txt = S.body.querySelector('.mql-text'), res = S.body.querySelector('.mql-res');
      function fillValues() { const vs = values(sf.value); sv.innerHTML = vs.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join(''); }
      const val = () => (typeof LOGIC.getPath(def.docs[0], sf.value) === 'number' ? +sv.value : sv.value);
      const upd = () => { txt.textContent = LOGIC.mqlText(sf.value, so.value, val()); };
      sf.addEventListener('change', () => { fillValues(); upd(); }); so.addEventListener('change', upd); sv.addEventListener('change', upd);
      fillValues(); upd();
      const go = S.button('▶ Ejecutar', 'primary', () => {
        const out = LOGIC.mqlRun(def.docs, sf.value, so.value, val());
        res.innerHTML = `<b>Resultado (${out.length}):</b> ${out.length ? out.map(d => `<span class="doc">{ ${esc(d.nombre)} · ${esc(d.profesor)} · ${d.cantidad_estudiantes} · ${esc(d.aula.numero)} · ${esc(d.aula.ubicacion)} }</span>`).join('') : '<i>ningún documento</i>'}`;
        const got = out.map(d => d.nombre).join('|');
        if (got === expected && sf.value === T.f) {
          AUDIO.fx.good();
          const canon = LOGIC.mqlText(T.f, T.op, T.v);
          const same = so.value === T.op && String(val()) === String(T.v);
          S.feedback(`<b>¡Consulta correcta!</b> ${same ? '' : `Funciona con estos datos, pero la forma directa del enunciado es <code>${esc(canon)}</code>.`}`, 'ok');
          S.actions.innerHTML = '';
          const nb = S.button(k + 1 < def.tasks.length ? 'Siguiente ejercicio' : 'Terminar', 'primary', () => { k++; if (k < def.tasks.length) task(); else done(S, 'Recuerde: <code>$gt</code> &gt;, <code>$gte</code> ≥, <code>$lt</code> &lt;, <code>$lte</code> ≤, <code>$ne</code> ≠, y la notación de punto para subdocumentos: <code>"aula.numero"</code>.'); });
          if (AUTO) later(() => nb.click());
        } else {
          AUDIO.fx.bad();
          const hint = sf.value !== T.f ? 'Revise el CAMPO: ¿qué propiedad del documento menciona el enunciado?' : `El resultado no coincide (se esperaban ${expected.split('|').length} documento(s)). Revise el operador o el valor.`;
          S.feedback(hint, 'ko');
        }
      });
      if (AUTO) later(() => { sf.value = T.f; fillValues(); so.value = T.op; sv.value = String(T.v); upd(); go.click(); });
    }
    task();
    return run(S, e => { if (e.key === 'Enter' && !(e.target && e.target.tagName === 'SELECT')) { const b = S.actions.querySelector('.primary'); if (b) b.click(); } });
  }

  const impl = { crane, sorter, graph, locks, restore, keys, rewrite, cache, cut, mql };
  return { run: id => impl[id](CONTENT.mg[id]) };
})();
