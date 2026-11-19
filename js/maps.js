/* Mapas de las fases. Cada mapa se construye con rectángulos y coordenadas
   explícitas; tools/validate.js comprueba que todo sea alcanzable.
   Tiles: ~ agua/vacío · # muro · . piso · , piso alterno · _ puente · = riel
          T obstáculo · o farol · G puerta (se abre con el progreso) */
window.MAPS = (function () {
  function grid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
  function rect(g, x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = ch; }
  function frame(g, x, y, w, h, ch) { for (let i = x; i < x + w; i++) { g[y][i] = ch; g[y + h - 1][i] = ch; } for (let j = y; j < y + h; j++) { g[j][x] = ch; g[j][x + w - 1] = ch; } }
  function put(g, list, ch) { list.forEach(([x, y]) => { g[y][x] = ch; }); }

  // Entidades comunes. lessons: [[x,y,idxLeccion]], enemies: [[x,y,zona]]
  function ents(spec) {
    const out = [];
    const S = (type, x, y, extra) => out.push(Object.assign({ type, x, y, solid: true }, extra || {}));
    if (spec.npc) S('npc', spec.npc[0], spec.npc[1]);
    (spec.lessons || []).forEach(([x, y, i]) => S('lesson', x, y, { idx: i }));
    (spec.enemies || []).forEach(([x, y, z], k) => S('enemy', x, y, { zone: z, key: 'e' + k, solid: false }));
    (spec.mg || []).forEach(([x, y], i) => S('mg', x, y, { idx: i }));
    if (spec.chela) S('chela', spec.chela[0], spec.chela[1]);
    if (spec.boss) S('boss', spec.boss[0], spec.boss[1]);
    (spec.tips || []).forEach(([x, y]) => S('tip', x, y, { solid: false }));
    (spec.tele || []).forEach(([x, y, tx, ty]) => S('tele', x, y, { tx, ty, solid: false }));
    if (spec.lib) S('lib', spec.lib[0], spec.lib[1]);
    return out;
  }

  const defs = {
    /* ---------------- FASE 1 · MUELLE ---------------- */
    p1() {
      const w = 56, h = 26, g = grid(w, h, '~');
      frame(g, 2, 6, 14, 13, '#'); rect(g, 3, 7, 12, 11, '.');               // almacén
      rect(g, 16, 5, 18, 16, ',');                                            // muelle B
      rect(g, 36, 8, 17, 15, ',');                                            // muelle C
      rect(g, 40, 1, 11, 6, ',');                                             // cubierta del jefe
      put(g, [[3, 7], [14, 7], [3, 17], [14, 17], [16, 5], [33, 5], [16, 20], [33, 20], [36, 8], [52, 8], [36, 22], [52, 22], [40, 1], [50, 1]], 'o');
      put(g, [[19, 7], [20, 7], [19, 8], [20, 8], [25, 11], [26, 11], [22, 16], [23, 16], [22, 17], [29, 7], [30, 7], [30, 15], [31, 15],
              [41, 14], [42, 14], [41, 15], [48, 19], [49, 19], [44, 20], [38, 17], [39, 17], [50, 15]], 'T');
      put(g, [[3, 9], [3, 10], [12, 15], [13, 15], [4, 15]], 'T');           // cajas del almacén
      const gates = [
        { id: 1, cells: [[15, 11], [15, 12]] },
        { id: 2, cells: [[34, 12], [35, 12], [34, 13], [35, 13]] },
        { id: 3, cells: [[44, 7], [45, 7]] }];
      const e = ents({
        npc: [5, 11], lessons: [[6, 7, 0], [10, 7, 1], [14, 11, 2], [18, 13, 3], [28, 18, 4]],
        enemies: [[23, 9, 1], [27, 14, 1], [31, 10, 1], [40, 11, 2], [46, 17, 2], [50, 12, 2]],
        mg: [[32, 18], [38, 20]], chela: [42, 9], boss: [45, 3] });
      return { w, h, g, gates, ents: e, start: { x: 8, y: 13 }, zoneLessons: [[0, 1, 2], [3, 4]] };
    },

    /* ---------------- FASE 2 · ESTACIÓN ---------------- */
    p2() {
      const w = 40, h = 44, g = grid(w, h, '#');
      rect(g, 4, 2, 32, 10, '.');                                             // andén
      rect(g, 3, 13, 34, 12, ',');                                            // patio B
      rect(g, 3, 26, 34, 12, ',');                                            // patio C
      rect(g, 10, 39, 20, 4, '.');                                            // casa de máquinas
      rect(g, 3, 16, 34, 1, '='); rect(g, 3, 21, 34, 1, '='); rect(g, 3, 30, 34, 1, '='); rect(g, 3, 34, 34, 1, '=');
      put(g, [[4, 2], [35, 2], [4, 11], [35, 11], [3, 13], [36, 13], [3, 24], [36, 24], [3, 26], [36, 26], [3, 37], [36, 37], [10, 39], [29, 39]], 'o');
      put(g, [[11, 18], [12, 18], [27, 18], [28, 18], [17, 23], [33, 23], [8, 27], [9, 27], [24, 32], [25, 32], [12, 36], [31, 36]], 'T');
      put(g, [[10, 5], [11, 5], [28, 8], [29, 8]], 'T');                      // bancas
      const gates = [
        { id: 1, cells: [[19, 12], [20, 12]] },
        { id: 2, cells: [[19, 25], [20, 25]] },
        { id: 3, cells: [[19, 38], [20, 38]] }];
      const e = ents({
        npc: [26, 5], lessons: [[8, 2, 0], [14, 2, 1], [20, 2, 2], [34, 14, 3], [5, 19, 4], [25, 23, 5]],
        enemies: [[8, 14, 1], [30, 19, 1], [14, 23, 1], [7, 28, 2], [31, 32, 2], [16, 36, 2]],
        mg: [[20, 19], [28, 27]], chela: [24, 36], boss: [20, 40] });
      const trains = [16, 21, 30, 34].map((y, i) => ({ y, x0: 3, x1: 36, period: 7.5 + i * 1.3, offset: i * 2.1, len: 7 }));
      return { w, h, g, gates, ents: e, start: { x: 20, y: 8 }, trains, zoneLessons: [[0, 1, 2], [3, 4, 5]] };
    },

    /* ---------------- FASE 3 · BÓVEDA ---------------- */
    p3() {
      const w = 48, h = 34, g = grid(w, h, '#');
      rect(g, 2, 2, 14, 12, '.');                                             // vestíbulo
      rect(g, 17, 2, 15, 14, ',');                                            // pasillo de cajas
      rect(g, 17, 17, 29, 15, '.');                                           // bóveda principal
      rect(g, 2, 19, 14, 13, ',');                                            // cámara acorazada (jefe)
      put(g, [[2, 2], [15, 2], [2, 13], [15, 13], [17, 2], [31, 2], [17, 15], [31, 15], [17, 17], [45, 17], [17, 31], [45, 31], [2, 19], [15, 19], [2, 31], [15, 31]], 'o');
      put(g, [[20, 8], [21, 8], [25, 5], [25, 6], [25, 11], [26, 11], [29, 6], [29, 7],
              [23, 21], [24, 21], [31, 20], [31, 21], [35, 25], [36, 25], [41, 21], [42, 21], [24, 27], [25, 27], [33, 29], [40, 27], [40, 28]], 'T');
      put(g, [[5, 9], [12, 9]], 'T');
      const gates = [
        { id: 1, cells: [[16, 7], [16, 8]] },
        { id: 2, cells: [[24, 16], [25, 16]] },
        { id: 3, cells: [[16, 25], [16, 26]] }];
      const e = ents({
        npc: [6, 7], lessons: [[4, 2, 0], [9, 2, 1], [14, 6, 2], [30, 3, 3], [18, 14, 4]],
        enemies: [[20, 5, 1], [28, 9, 1], [22, 13, 1], [21, 19, 2], [38, 23, 2], [28, 29, 2]],
        mg: [[31, 14], [44, 30]], chela: [18, 28], boss: [8, 25] });
      return { w, h, g, gates, ents: e, start: { x: 8, y: 11 }, zoneLessons: [[0, 1, 2], [3, 4]] };
    },

    /* ---------------- FASE 4 · MERCADO ---------------- */
    p4() {
      const w = 54, h = 34, g = grid(w, h, '#');
      rect(g, 2, 12, 16, 14, ',');                                            // plaza
      rect(g, 19, 7, 17, 24, '.');                                            // pasillos B
      rect(g, 37, 7, 15, 24, ',');                                            // pasillos C
      rect(g, 38, 1, 13, 5, '.');                                             // bodega del jefe
      put(g, [[2, 12], [17, 12], [2, 25], [17, 25], [19, 7], [35, 7], [19, 30], [35, 30], [37, 7], [51, 7], [37, 30], [51, 30], [38, 1], [50, 1]], 'o');
      // puestos (filas con pasillos)
      [[22, 11], [29, 11], [22, 17], [29, 17], [22, 23], [29, 23]].forEach(([x, y]) => rect(g, x, y, 4, 1, 'T'));
      [[40, 12], [46, 12], [40, 20], [46, 20]].forEach(([x, y]) => rect(g, x, y, 3, 1, 'T'));
      put(g, [[5, 18], [6, 18], [13, 21]], 'T');
      const gates = [
        { id: 1, cells: [[18, 18], [18, 19]] },
        { id: 2, cells: [[36, 18], [36, 19]] },
        { id: 3, cells: [[43, 6], [44, 6]] }];
      const e = ents({
        npc: [6, 15], lessons: [[4, 12, 0], [9, 12, 1], [14, 12, 2], [34, 14, 3], [20, 28, 4], [27, 20, 5]],
        enemies: [[27, 9, 1], [21, 15, 1], [33, 26, 1], [44, 9, 2], [39, 16, 2], [49, 25, 2]],
        mg: [[27, 29], [44, 28]], chela: [41, 8], boss: [44, 3],
        tips: [[10, 22], [25, 14], [31, 20], [42, 17], [48, 15]] });
      return { w, h, g, gates, ents: e, start: { x: 10, y: 19 }, zoneLessons: [[0, 1, 2], [3, 4, 5]] };
    },

    /* ---------------- FASE 5 · ISLAS ---------------- */
    p5() {
      const w = 60, h = 34, g = grid(w, h, '~');
      rect(g, 2, 12, 14, 12, '.'); rect(g, 4, 14, 10, 8, ',');               // isla A
      rect(g, 20, 6, 14, 22, '.'); rect(g, 22, 9, 10, 15, ',');              // isla B
      rect(g, 38, 10, 18, 21, '.'); rect(g, 40, 13, 14, 15, ',');            // isla C
      rect(g, 40, 1, 14, 5, '.');                                            // islote del jefe
      put(g, [[2, 12], [15, 12], [2, 23], [15, 23], [20, 6], [33, 6], [20, 27], [33, 27], [38, 10], [55, 10], [38, 30], [55, 30], [40, 1], [53, 1]], 'o');
      put(g, [[6, 16], [12, 21], [25, 12], [29, 18], [24, 24], [43, 16], [50, 19], [45, 26], [52, 13]], 'T');
      const gates = [
        { id: 1, cells: [[16, 17], [17, 17], [18, 17], [19, 17], [16, 18], [17, 18], [18, 18], [19, 18]] },
        { id: 2, cells: [[34, 16], [35, 16], [36, 16], [37, 16], [34, 17], [35, 17], [36, 17], [37, 17]] },
        { id: 3, cells: [[46, 6], [47, 6], [46, 7], [47, 7], [46, 8], [47, 8], [46, 9], [47, 9]] }];
      const e = ents({
        npc: [6, 13], lessons: [[4, 12, 0], [9, 12, 1], [14, 15, 2], [22, 7, 3], [31, 14, 4], [21, 25, 5]],
        enemies: [[26, 10, 1], [30, 22, 1], [23, 17, 1], [42, 14, 2], [52, 24, 2], [44, 28, 2]],
        mg: [[32, 26], [54, 28]], chela: [44, 11], boss: [47, 3],
        tele: [[31, 8, 4, 22], [4, 22, 31, 8]] });
      return { w, h, g, gates, ents: e, start: { x: 8, y: 18 }, zoneLessons: [[0, 1, 2], [3, 4, 5]] };
    },

    /* ---------------- FINAL · TORRE ---------------- */
    final() {
      const w = 26, h = 30, g = grid(w, h, '#');
      rect(g, 4, 2, 18, 8, '.');                                              // despacho del servidor
      rect(g, 9, 10, 8, 13, ',');                                             // escalera
      rect(g, 4, 23, 18, 6, '.');                                             // recepción
      put(g, [[4, 2], [21, 2], [4, 9], [21, 9], [4, 23], [21, 23], [4, 28], [21, 28]], 'o');
      put(g, [[6, 4], [6, 5], [6, 6], [19, 4], [19, 5], [19, 6], [9, 12], [16, 12], [9, 16], [16, 16], [9, 20], [16, 20]], 'T');
      const e = ents({ chela: [7, 25], lib: [18, 25], boss: [13, 4] });
      return { w, h, g, gates: [], ents: e, start: { x: 13, y: 27 }, zoneLessons: [] };
    }
  };

  function build(id) {
    const d = defs[id]();
    d.gates.forEach(gt => gt.cells.forEach(([x, y]) => { d.g[y][x] = 'G'; }));
    return { id, w: d.w, h: d.h, tiles: d.g.map(r => r.join('')), gates: d.gates, ents: d.ents, start: d.start, trains: d.trains || [], zoneLessons: d.zoneLessons };
  }
  return { defs, build };
})();
