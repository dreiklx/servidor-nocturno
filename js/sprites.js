/* Pixel art propio del juego (dibujado en código).
   Los sprites frontales se definen con media fila (8 o 12 px) y se reflejan. */
window.SPR = (function () {
  const cache = {};

  function mirror(half) { return half.map(r => r + r.split('').reverse().join('')); }

  function make(rows, pal, scale = 1) {
    const h = rows.length, w = rows[0].length;
    const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale;
    const x = c.getContext('2d');
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const ch = rows[j][i]; if (ch === '.' || ch === ' ') continue;
      const col = pal[ch]; if (!col) continue;
      x.fillStyle = col; x.fillRect(i * scale, j * scale, scale, scale);
    }
    return c;
  }
  function flip(cv) {
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
    const x = c.getContext('2d'); x.translate(cv.width, 0); x.scale(-1, 1); x.drawImage(cv, 0, 0); return c;
  }

  /* ---------------- Kai (jugador) ---------------- */
  const KAI = { k: '#2a1d3a', s: '#e8b48a', e: '#1a1020', h: '#5b5fe0', H: '#3f43b8', w: '#f4f0ff', p: '#2b2f4a', b: '#121220', y: '#ffd34d' };
  const kaiTop = {
    down: mirror(['........', '.....kkk', '....kkkk', '...kkkkk', '...kksss', '...ksess', '....ssss', '.....sss', '....hhhh', '...hhhhw', '..shhhhh', '..shhhhH', '...hhhhH']),
    up: mirror(['........', '.....kkk', '....kkkk', '...kkkkk', '...kkkkk', '...kkkkk', '....kkkk', '.....sss', '....hhhh', '...hhhhh', '..shhhhh', '..shhhhH', '...hhhhH']),
    side: ['................', '......kkkkk.....', '.....kkkkkkk....', '....kkkkkkkkk...', '....kkkkkssss...', '....kkkksses....', '....kkkssssss...', '.....kkssss.....', '.....hhhhhh.....', '....hhhhhhhh....', '....hhhHHhhh....', '....hhhshhhh....', '.....hhhhhh.....']
  };
  const legsFront = [mirror(['....pppp', '....pp..', '....bb..']), mirror(['....pppp', '.....pp.', '.....bb.'])];
  const legsSide = [['.....pppppp.....', '.....pp..pp.....', '.....bb..bb.....'], ['......pppp......', '......pppp......', '......bbbb......']];

  function kai(dir, frame) {
    const key = 'kai' + dir + frame;
    if (cache[key]) return cache[key];
    let rows;
    if (dir === 'down' || dir === 'up') rows = kaiTop[dir].concat(legsFront[frame]);
    else rows = kaiTop.side.concat(legsSide[frame]);
    let cv = make(rows, KAI);
    if (dir === 'left') cv = flip(cv);
    return (cache[key] = cv);
  }

  /* ---------------- NPCs ---------------- */
  function guide(tint) {
    const key = 'guide' + tint; if (cache[key]) return cache[key];
    const pal = { t: tint, T: shade(tint, -40), s: '#d79a6c', e: '#1a1020', c: '#3a3550', C: '#2a2638', w: '#f4f0ff', b: '#121220', k: '#2b1d14' };
    const rows = mirror(['........', '....tttt', '...ttttt', '..TTTTTT', '...kssss', '...ssess', '...sssss', '....ssss', '...cccww', '..cccccw', '..sccccc', '..sccccC', '...ccccC', '....cccc', '....cc..', '....bb..']);
    return (cache[key] = make(rows, pal));
  }

  function chela() {
    if (cache.chela) return cache.chela;
    const pal = { r: '#d8433b', R: '#a52a25', s: '#c98a5a', e: '#2a1408', m: '#7a2a20', o: '#f08a24', w: '#fff6e6', d: '#5a2a10', g: '#d9d9d9' };
    const rows = mirror(['........', '.....rrr', '....rrrr', '...rRrrr', '...rssss', '...ssess', '...sssss', '....ssmm', '...oooww', '..ooowww', '..sowwww', '..sowwww', '...owwww', '...ooooo', '....oo..', '....dd..']);
    return (cache.chela = make(rows, pal));
  }

  // Profe Mauricio: pelo corto oscuro, sonrisa amable, barba corta, polo roja con cuello azul marino.
  const MAU = { k: '#1e1a18', s: '#d9a27a', S: '#c08860', g: '#a87b5c', e: '#1a1010', m: '#7a2a20', w: '#ffffff', r: '#c8262c', R: '#9c1c22', n: '#1d2a4a', p: '#3a3a44', b: '#141418' };
  function mauricio() {
    if (cache.mau) return cache.mau;
    const rows = mirror(['........', '....kkkk', '...kkkkk', '...kssss', '...sssss', '...ssess', '...sssss', '....gmww', '.....ggg', '...rnnnn', '..rrrrnn', '..rsssss', '..rRRRRR', '...rrrrr', '...pppp.', '...bbb..']);
    return (cache.mau = make(rows, MAU));
  }
  function mauPortrait() {
    if (cache.mauP) return cache.mauP;
    const rows = mirror([
      '............', '........kkkk', '......kkkkkk', '.....kkkkkkk', '.....kkkksss', '....kkssssss', '....ksssssss', '....ssssssss',
      '...sskkkssss', '...ssswessss', '...sssssssss', '....sssssssS', '....sgsssssS', '....ggsmwwww', '.....ggggggg', '......gggggg',
      '.......sssss', '.....nnnssss', '...rrrnnnsss', '..rrrrrnnnss', '.rrrrrrrnnns', '.rrrrrrrrrnn', 'rrrrrrrrrrrr', 'rRrrrrrrrrrr']);
    return (cache.mauP = make(rows, MAU));
  }
  function kaiPortrait() {
    if (cache.kaiP) return cache.kaiP;
    const rows = mirror([
      '............', '........kkkk', '......kkkkkk', '.....kkkkkkk', '....kkkkkkkk', '....kkkkkkkk', '....kkkkksss', '....kkksssss',
      '....kksskkss', '....ksswesss', '....ksssssss', '.....sssssss', '.....ssssssS', '......sssmmm', '.......sssss', '........ssss',
      '.......hhhss', '.....hhhhhhw', '...hhhhhhhhw', '..hhhhhhhhhw', '.hhhhhhhhhhh', '.hhhhhhhhhhh', 'hhhhhhhhhhhh', 'hhhhhhhhhhhh']);
    return (cache.kaiP = make(rows, Object.assign({}, KAI, { S: '#c99470', m: '#8a3a3a' })));
  }
  function chelaPortrait() {
    if (cache.chP) return cache.chP;
    const pal = { r: '#d8433b', R: '#a52a25', s: '#c98a5a', S: '#b07448', e: '#2a1408', w: '#ffffff', m: '#7a2a20', o: '#f08a24', a: '#fff6e6', y: '#ffd34d' };
    const rows = mirror([
      '............', '.......rrrrr', '.....rrrrrrr', '....rrRrrrrr', '...rrrrrrrrr', '...rrrssssss', '...rrsssssss', '....ssssssss',
      '....sskkssss', '....sswessss', '....ssssssss', '....ssssssss', '....sssssssS', '.....sssmwww', '.....sssssss', '......ssssss',
      '.......sssss', '.....oooaaaa', '...ooooaaaaa', '..oooooaaaay', '.ooooooaaaaa', '.ooooooaaaaa', 'oooooooaaaaa', 'oooooooaaaaa']);
    pal.k = '#3a2014';
    return (cache.chP = make(rows, pal));
  }
  function guidePortrait(tint) {
    const key = 'gP' + tint; if (cache[key]) return cache[key];
    const pal = { t: tint, T: shade(tint, -40), s: '#d79a6c', S: '#bb7f55', e: '#1a1020', w: '#fff', k: '#2b1d14', c: '#3a3550', m: '#7a3a2a' };
    const rows = mirror([
      '............', '.......ttttt', '.....ttttttt', '....tttttttt', '..TTTTTTTTTT', '....kkssssss', '....ksssssss', '....ssssssss',
      '....sskkssss', '....sswessss', '....ssssssss', '....sssssssS', '.....sssssss', '.....ssssmmm', '......ssssss', '.......sssss',
      '........ssss', '.....ccccsss', '...ccccccccc', '..cccccccccc', '.ccccccccccc', '.ccccccccccc', 'cccccccccccc', 'cccccccccccc']);
    return (cache[key] = make(rows, pal));
  }

  /* ---------------- Enemigos y jefes (diseños originales) ---------------- */
  const ENEMY = {
    mudbug: { pal: { u: '#6b4a2b', U: '#8f6a40', w: '#f4efe0', k: '#120c06', m: '#3a2412', d: '#4a321c' },
      rows: mirror(['........', '........', '........', '......UU', '....UUuu', '...Uuuuu', '..Uuwwuu', '..uuwkuu', '.uuuuuuu', '.uuuummm', '.uuuuuuu', 'uuuuuuuu', 'uuuuuuuu', '.udu.uud', '..d....d', '........']) },
    pirate: { pal: { u: '#6b4a2b', U: '#8f6a40', w: '#f4efe0', k: '#120c06', m: '#3a2412', d: '#4a321c', h: '#1b1b24', y: '#e8c64a', r: '#c0392b' },
      rows: mirror(['....hhhh', '..hhhhhh', '.hhhhywy', 'hhhhhhhh', '...rrrrr', '...Uuuuu', '..Uukkuu', '..ukkkuu', '.uuuuuuu', '.uuuummm', '.uuuumwm', 'uuuuuuuu', 'uuuuuuuu', '.udu.uud', '..d....d', '........']) },
    lockbug: { pal: { g: '#9aa3b5', G: '#6b7385', y: '#e0b030', Y: '#b07f12', k: '#2a1a05', w: '#fff', e: '#111' },
      rows: mirror(['........', '.....ggg', '....gG..', '....g...', '....g...', '..yyyyyy', '..yYyyyy', '..yywwyy', '..yywe.y', '..yyyyyy', '..yyyykk', '..yyyyyk', '..YYYYYY', '...Y.Y..', '...Y.Y..', '........']) },
    train: { pal: { r: '#b8322c', R: '#7d1f1b', k: '#1b1b22', y: '#ffe066', g: '#8c8c9c', w: '#e8e8f0', s: '#555566' },
      rows: mirror(['........', '...kkkkk', '..kRRRRR', '..kRrrrr', '..kRwwrr', '..kRwwrr', '..kRrrrr', '.yykrrrr', '.yykrrrr', '..kRRRRR', '.ggggggg', '.gsssggg', '.ggggggg', '..kk..kk', '.kkkk.kk', '..kk..kk']) },
    cloud: { pal: { c: '#4a4f6a', C: '#6c7194', w: '#e8eaff', k: '#0c0c18', y: '#ffe14a' },
      rows: mirror(['........', '........', '.....CCC', '...CCCcc', '..CCcccc', '.Ccccccc', '.ccwkcck', '.ccwwccc', 'cccccccc', 'cccccccc', '.ccccccc', '....yy..', '...yy...', '....yy..', '.....y..', '........']) },
    storm: { pal: { c: '#2e3150', C: '#4c5180', w: '#ff5a5a', k: '#0a0a12', y: '#ffe14a', Y: '#fff7b0' },
      rows: mirror(['.....CCC', '...CCCcc', '..CCcccc', '.CCccccc', 'Cccccccc', 'ccwwkccc', 'ccwkkccc', 'cccccccc', 'cccccyyc', '.cccyYcc', '..ccyyc.', '...yY...', '..yY....', '...yy...', '....y...', '........']) },
    slug: { pal: { l: '#5aa83a', L: '#3f7d26', w: '#fff', k: '#111', s: '#c9a24a', S: '#94711f' },
      rows: mirror(['........', '...k....', '...l....', '...l....', '....llll', '...lllll', '..llwkll', '..llwwll', '..llllll', '..lllkkk', '.lllllll', '.lllllll', 'Llllllll', 'LLLLLLLL', '........', '........']) },
    beetle: { pal: { b: '#2f6b4f', B: '#1c4634', g: '#7fd6a8', w: '#fff', k: '#0b0b0b', y: '#ffd34d', c: '#a8e0ff', C: '#5fa8d0' },
      rows: mirror(['..k.....', '...k....', '....bbbb', '...bbbbb', '..bbwkbb', '..bbbbbb', '.BBBBBBB', '.bgbbbbb', 'bbgbbbyb', 'bbbbbbBb', 'bbbbbbBb', 'bgbbbbBb', '.bbbbbbb', '.k.k..k.', 'k..k...k', '........']) },
    jelly: { pal: { j: '#5ad1e6', J: '#2aa3bf', w: '#fff', k: '#0b2030', p: '#ff8fd1' },
      rows: mirror(['........', '.....JJJ', '...JJjjj', '..Jjjjjj', '..jjwkjj', '..jjjjjj', '..jjjjpp', '..jjjjjj', '..JJJJJJ', '...j.j.j', '...j.j.j', '..j..j.j', '..j.j..j', '...j..j.', '........', '........']) },
    kraken: { pal: { o: '#8a3fc4', O: '#5e2690', w: '#fff', k: '#120020', y: '#ffd34d', p: '#ff8fd1' },
      rows: mirror(['....OOOO', '..OOoooo', '.Oooooo.', '.oooooo.', 'ooowkooo', 'ooowwooo', 'oooooooo', 'oooooppp', '.ooooooo', '.oo.oo.o', 'oo.oo.oo', 'o..o..oo', 'o.oo.oo.', '.oo.oo..', 'o..o....', '........']) }
  };
  function enemy(name) {
    if (cache['en' + name]) return cache['en' + name];
    const d = ENEMY[name];
    return (cache['en' + name] = make(d.rows, d.pal));
  }

  function tipNpc(seed) {
    const key = 'tip' + seed; if (cache[key]) return cache[key];
    const cols = ['#e05a5a', '#5ab0e0', '#e0c35a', '#8be05a', '#c05ae0', '#e08a5a'];
    const pal = { c: cols[seed % cols.length], C: shade(cols[seed % cols.length], -45), s: ['#e8b48a', '#c98a5a', '#8d5a3a', '#f0c8a0'][seed % 4], k: ['#2a1d14', '#1a1a1a', '#6a4a2a', '#3a2a1a'][seed % 4], e: '#111', b: '#151515', p: '#2f3240' };
    const rows = mirror(['........', '.....kkk', '....kkkk', '...kkkkk', '...kssss', '...ssess', '....ssss', '.....sss', '....cccc', '...ccccc', '..sccccc', '..scccCC', '...ccccC', '....pppp', '....pp..', '....bb..']);
    return (cache[key] = make(rows, pal));
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Portada a escala para la interfaz (canvas → dataURL no necesario: se copia el canvas)
  function scaled(cv, s) {
    const c = document.createElement('canvas'); c.width = cv.width * s; c.height = cv.height * s;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(cv, 0, 0, c.width, c.height); return c;
  }

  return { kai, guide, chela, mauricio, mauPortrait, kaiPortrait, chelaPortrait, guidePortrait, enemy, tipNpc, shade, scaled, ENEMY };
})();
