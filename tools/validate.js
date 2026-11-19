// Validador del contenido y de la lógica de los minijuegos.
// Uso:  node tools/validate.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ['js/content.js', 'js/logic.js', 'js/maps.js']) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
}
const C = ctx.window.CONTENT, L = ctx.window.LOGIC, M = ctx.window.MAPS;
let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('ERROR  ' + m); };
const warn = (m) => { warns++; console.log('AVISO  ' + m); };

// ---------- preguntas ----------
const ids = new Set();
let total = 0, longest = 0, shortest = 0;
for (const ph of C.phases) {
  const lessonIds = new Set(ph.lessons.map(l => l.id));
  let n = 0, lg = 0, perLesson = {};
  for (const q of ph.questions) {
    total++; n++;
    if (ids.has(q.id)) err('id repetido ' + q.id); ids.add(q.id);
    if (!lessonIds.has(q.l)) err(q.id + ' lección inexistente ' + q.l);
    perLesson[q.l] = (perLesson[q.l] || 0) + 1;
    if (!q.hint || !q.exp) err(q.id + ' sin pista o explicación');
    if (q.tf) { if (!['Verdadero', 'Falso'].includes(q.o[0]) || q.o.length !== 2) err(q.id + ' tf mal formado'); continue; }
    if (q.o.length < 3) err(q.id + ' pocas opciones');
    if (new Set(q.o).size !== q.o.length) err(q.id + ' opciones repetidas');
    const lens = q.o.map(s => s.length);
    const max = Math.max(...lens), min = Math.min(...lens);
    if (lens[0] === max && lens.filter(x => x === max).length === 1) { lg++; longest++; }
    if (lens[0] === min && lens.filter(x => x === min).length === 1) shortest++;
    const hint = q.hint.toLowerCase(), ans = q.o[0].toLowerCase();
    if (ans.length > 6 && hint.includes(ans)) warn(q.id + ' la pista contiene la respuesta literal');
  }
  for (const l of ph.lessons) if (!perLesson[l.id]) warn(ph.id + ' lección sin preguntas: ' + l.id);
  const mc = ph.questions.filter(q => !q.tf).length;
  console.log(`${ph.id}: ${n} preguntas (${mc} de opción múltiple); correcta = la más larga en ${lg}/${mc} (${Math.round(100 * lg / mc)} %); por lección ${JSON.stringify(perLesson)}`);
  if (lg / mc > 0.35) warn(ph.id + ' sesgo de longitud alto');
}
const mcAll = C.phases.reduce((a, p) => a + p.questions.filter(q => !q.tf).length, 0);
console.log(`TOTAL ${total} preguntas · correcta más larga: ${longest}/${mcAll} (${Math.round(100 * longest / mcAll)} %) · correcta más corta: ${shortest}/${mcAll} (${Math.round(100 * shortest / mcAll)} %)`);

// ---------- lógica de minijuegos ----------
if (L) {
  console.log('\nGrafos de precedencia (Guía #9):');
  C.mg.graph.pool.forEach((s, i) => {
    const r = L.precedence(s);
    console.log(`  ${String(i + 1).padStart(2)}. ${s.padEnd(58)} aristas: ${r.edges.map(e => 'T' + e[0] + '→T' + e[1]).join(', ') || 'ninguna'} · ${r.cycle ? 'CICLO (no serializable)' : 'serializable, orden ' + r.order.map(t => 'T' + t).join(', ')}`);
  });
  const chk = (s, exp) => { const r = L.precedence(s); const got = r.cycle ? 'ciclo' : r.order.join(','); if (got !== exp) err('grafo ' + s + ' esperado ' + exp + ' obtenido ' + got); };
  chk('l2(X); e2(X); l1(X); e1(Y); l3(Y); e3(Z); c2; c1; c3;', '2,1,3');
  chk('l1(X); l2(X); e1(X); e2(X); c1; c2;', 'ciclo');
  chk('l3(X); e3(X); l2(X); e2(Y); l1(Y); e1(Z); l3(Z); c3; c2; c1;', 'ciclo');
  chk('l3(X); e3(X); l1(X); e1(Y); l2(Y); e2(Z); c3; c1; c2;', '3,1,2');
  console.log('\nRestauraciones:');
  C.mg.restore.rounds.forEach(r => console.log('  ' + r.name + ' → ' + L.restoreChain(r.items).join(' → ')));
  const rc = C.mg.restore.rounds.map(r => L.restoreChain(r.items).join(','));
  if (rc[0] !== 'F1,D1,L3,L4' || rc[1] !== 'F1,D2' || rc[2] !== 'F2,L1,L2') err('cadena de restauración inesperada ' + rc.join(' | '));
  const cs = L.cacheSim(C.mg.cache.seq);
  console.log('\nCaché: ' + cs.marks.join(' ') + ` · hits ${cs.hits} misses ${cs.misses} · tasa ${cs.rate.toFixed(1)} %`);
  console.log('\nConsola MQL:');
  C.mg.mql.tasks.forEach(t => console.log(`  Ej. ${t.n}: ${L.mqlText(t.f, t.op, t.v)} → ${L.mqlRun(C.mg.mql.docs, t.f, t.op, t.v).map(d => d.nombre).join(', ')}`));
  // casos verificados a mano
  const names = (f, op, v) => L.mqlRun(C.mg.mql.docs, f, op, v).map(d => d.nombre).join('|');
  if (names('cantidad_estudiantes', '$gt', 25) !== 'Matemática I|Biología') err('MQL $gt 25');
  if (names('aula.ubicacion', '$ne', 'Edificio B') !== 'Matemática I|Biología|Química') err('MQL $ne Edificio B');
}

// ---------- mapas ----------
if (M && L) {
  console.log('\nMapas:');
  for (const id of Object.keys(M.defs)) {
    const m = M.build(id);
    const r = L.checkMap(m);
    console.log(`  ${id}: ${m.w}x${m.h} · entidades ${m.ents.length} · ${r.ok ? 'todo alcanzable' : 'NO ALCANZABLE: ' + r.missing.join(', ')}`);
    if (!r.ok) err('mapa ' + id + ' con entidades inalcanzables');
  }
}

console.log(`\n${errors} errores, ${warns} avisos`);
process.exit(errors ? 1 : 0);
