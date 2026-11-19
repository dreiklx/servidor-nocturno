/* Lógica pura (sin DOM): reutilizada por el juego y por tools/validate.js */
window.LOGIC = (function () {

  // ---------- Planificaciones (Guía #9) ----------
  function parseSchedule(s) {
    return s.split(';').map(x => x.trim()).filter(Boolean).map(tok => {
      const m = tok.match(/^([lecr])(\d)(?:\(([A-Z])\))?$/);
      if (!m) throw new Error('Operación no válida: ' + tok);
      return { op: m[1], t: +m[2], d: m[3] || null, raw: tok };
    });
  }

  // Grafo de precedencia: arista Ti→Tj si una operación de Ti precede a otra
  // de Tj en conflicto (transacciones distintas, mismo dato, al menos una escribe).
  function precedence(s) {
    const ops = parseSchedule(s);
    const ts = [...new Set(ops.map(o => o.t))].sort((a, b) => a - b);
    const why = {};
    for (let i = 0; i < ops.length; i++) for (let j = i + 1; j < ops.length; j++) {
      const a = ops[i], b = ops[j];
      if (!a.d || !b.d || a.d !== b.d || a.t === b.t) continue;
      if (a.op !== 'e' && b.op !== 'e') continue;   // dos lecturas no chocan
      const k = a.t + '>' + b.t;
      (why[k] = why[k] || []).push(a.raw + ' antes de ' + b.raw);
    }
    const edges = Object.keys(why).map(k => k.split('>').map(Number)).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    // Orden topológico (Kahn) con desempate por número de transacción
    const indeg = {}, adj = {};
    ts.forEach(t => { indeg[t] = 0; adj[t] = []; });
    edges.forEach(([a, b]) => { adj[a].push(b); indeg[b]++; });
    const order = [], q = ts.filter(t => indeg[t] === 0);
    while (q.length) {
      q.sort((a, b) => a - b);
      const t = q.shift(); order.push(t);
      adj[t].forEach(n => { if (--indeg[n] === 0) q.push(n); });
    }
    return { ts, edges, why, cycle: order.length < ts.length, order };
  }

  // ---------- Restauración (Guía #10) ----------
  // items en orden cronológico. Cadena: último FULL → último DIFF posterior → todos los LOG posteriores.
  function restoreChain(items) {
    let f = -1;
    items.forEach((it, i) => { if (it.k === 'FULL') f = i; });
    if (f < 0) return [];
    let d = -1;
    for (let i = f + 1; i < items.length; i++) if (items[i].k === 'DIFF') d = i;
    const base = d >= 0 ? d : f;
    const chain = [items[f].id];
    if (d >= 0) chain.push(items[d].id);
    for (let i = base + 1; i < items.length; i++) if (items[i].k === 'LOG') chain.push(items[i].id);
    return chain;
  }

  function explainRestore(items) {
    const chain = restoreChain(items);
    const byId = Object.fromEntries(items.map(i => [i.id, i]));
    const parts = chain.map(id => {
      const it = byId[id];
      if (it.k === 'FULL') return `${id} (FULL del ${it.d}): es el último completo y la base de todo.`;
      if (it.k === 'DIFF') return `${id} (DIFF del ${it.d}): el último diferencial ya acumula todos los cambios desde ese FULL.`;
      return `${id} (LOG del ${it.d}): cada LOG trae solo lo ocurrido desde el anterior; no se puede saltar ninguno.`;
    });
    const skipped = items.filter(i => !chain.includes(i.id)).map(i => i.id);
    if (skipped.length) parts.push('No hacen falta: ' + skipped.join(', ') + ' (quedan cubiertos o pertenecen a una cadena anterior).');
    return parts;
  }

  // ---------- Caché cache-aside (Resumen §8) ----------
  function cacheSim(seq) {
    const cache = new Set(); const marks = []; let hits = 0, misses = 0;
    for (const s of seq) {
      if (s.op === 'inv') { cache.delete(s.k); marks.push('inv'); continue; }
      if (cache.has(s.k)) { hits++; marks.push('HIT'); }
      else { misses++; marks.push('MISS'); cache.add(s.k); }
    }
    return { marks, hits, misses, rate: 100 * hits / (hits + misses) };
  }

  // ---------- MQL (Guía #13) ----------
  function getPath(doc, path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), doc); }
  function mqlRun(docs, f, op, v) {
    return docs.filter(d => {
      const x = getPath(d, f);
      switch (op) {
        case '=': return x === v;
        case '$ne': return x !== v;
        case '$gt': return typeof x === typeof v && x > v;
        case '$gte': return typeof x === typeof v && x >= v;
        case '$lt': return typeof x === typeof v && x < v;
        case '$lte': return typeof x === typeof v && x <= v;
      }
      return false;
    });
  }
  function mqlText(f, op, v) {
    const key = f.includes('.') ? `"${f}"` : f;
    const val = typeof v === 'number' ? String(v) : `"${v}"`;
    return op === '=' ? `db.cursos.find({ ${key}: ${val} })` : `db.cursos.find({ ${key}: { ${op}: ${val} } })`;
  }

  // ---------- Utilidades ----------
  function shuffle(a, rnd = Math.random) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // Prioridad de preguntas: primero las falladas y aún no corregidas, luego las no vistas, luego el resto.
  function pickQuestions(pool, stats, n, avoid = new Set()) {
    const st = id => stats[id] || { r: 0, w: 0 };
    const pending = pool.filter(q => st(q.id).w > 0 && st(q.id).r <= st(q.id).w && !avoid.has(q.id));
    const unseen = pool.filter(q => st(q.id).r + st(q.id).w === 0 && !avoid.has(q.id));
    const rest = pool.filter(q => !pending.includes(q) && !unseen.includes(q) && !avoid.has(q.id));
    const out = [...shuffle(pending), ...shuffle(unseen), ...shuffle(rest)];
    if (out.length < n) out.push(...shuffle(pool.filter(q => !out.includes(q))));
    return out.slice(0, n);
  }

  // ---------- Mapas: comprobación de alcanzabilidad ----------
  function checkMap(m) {
    const solid = (x, y) => {
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
      const c = m.tiles[y][x];
      if (c === 'G') return false;           // las puertas se abren durante el juego
      return '~#To'.includes(c);
    };
    const entAt = {};
    m.ents.forEach(e => { if (e.solid) entAt[e.x + ',' + e.y] = e; });
    const seen = new Set([m.start.x + ',' + m.start.y]);
    const q = [[m.start.x, m.start.y]];
    const tele = {};
    m.ents.filter(e => e.type === 'tele').forEach(e => { tele[e.x + ',' + e.y] = e; });
    while (q.length) {
      const [x, y] = q.shift();
      const t = tele[x + ',' + y];
      const next = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      if (t) next.push([t.tx, t.ty]);
      for (const [nx, ny] of next) {
        const k = nx + ',' + ny;
        if (seen.has(k) || solid(nx, ny) || entAt[k]) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    const missing = [];
    m.ents.forEach(e => {
      const near = [[e.x, e.y], [e.x + 1, e.y], [e.x - 1, e.y], [e.x, e.y + 1], [e.x, e.y - 1]];
      if (!near.some(([x, y]) => seen.has(x + ',' + y))) missing.push(e.type + '@' + e.x + ',' + e.y);
    });
    return { ok: missing.length === 0, missing };
  }

  return { parseSchedule, precedence, restoreChain, explainRestore, cacheSim, mqlRun, mqlText, getPath, shuffle, pickQuestions, checkMap };
})();
