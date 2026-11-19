/* Extrae las líneas de narración de js/scenes.js a JSON para sintetizarlas con Qwen3-TTS.
   Uso: node tools/voice_lines.js <salida.json>
   Cada línea: { id: 'p1l1_1' | 'p1l1_r', speaker: 'n' | 'f', text }
   Los resúmenes ("Lo importante") se convierten a texto pronunciable. */
const fs = require('fs');
global.window = {};
require('../js/scenes.js');

const SPOKEN = [
  [/R_TS y W_TS/g, 'su marca de lectura y su marca de escritura'], [/select_related/g, 'select related'],
  [/find\(\{ campo: valor \}\)/g, 'find con campo y valor'],
  [/@@TRANCOUNT > 0/g, 'arroba arroba TRANCOUNT es mayor que cero'],
  [/\$gt, \$lt, \$gte, \$lte y \$ne/g, 'dólar gt, lt, gte, lte y ne'],
  [/\$or/g, 'dólar or'],
  [/"sub\.campo"/g, 'sub punto campo'],
  [/15433:1433/g, 'quince mil cuatrocientos treinta y tres a mil cuatrocientos treinta y tres'],
  [/host:contenedor/g, 'host y contenedor'],
  [/1205/g, 'mil doscientos cinco'], [/1222/g, 'mil doscientos veintidós'], [/1433/g, 'mil cuatrocientos treinta y tres'],
  [/Precisión@k/g, 'Precisión arroba k'], [/BULK_LOGGED/g, 'BULK LOGGED'], [/SELECT \*/g, 'SELECT asterisco'],
  [/Ti → Tj/g, 'de T i a T j'], [/Conflictos ⇒ vistas/g, 'Conflictos implica vistas'],
  [/ ⇒ /g, ' implica '], [/ → /g, ' a '], [/ ÷ /g, ' entre '], [/ × 100/g, ' por cien'], [/ \+ /g, ' más '],
  [/N más 1/g, 'N más uno'], [/\(([^)]*)\)/g, ', $1,'], [/%/g, ' por ciento'], [/:/g, ','], [/;/g, ','], [/\s+,/g, ','], [/,\s*\./g, '.'], [/,,/g, ',']
];
function speak(t) { let s = t; for (const [a, b] of SPOKEN) s = s.replace(a, b); return s.replace(/\s+/g, ' ').trim(); }

const out = [];
for (const sc of Object.values(window.SCENES)) {
  sc.beats.forEach((b, i) => out.push({ id: `${sc.id}_${i + 1}`, speaker: b.who === 'e' ? 'f' : 'n', text: b.say }));
  out.push({ id: `${sc.id}_r`, speaker: 'n', text: 'Lo importante. ' + sc.recap.map(speak).join(' ') });
}
const dest = process.argv[2];
if (dest) fs.writeFileSync(dest, JSON.stringify({ lines: out }, null, 1));
const bad = out.filter(l => /[→⇒÷×@$<>{}\[\]*_]/.test(l.text.replace(/SET STATISTICS|LOCK_TIMEOUT|SHOW_STATISTICS|sp_addumpdevice|DbUpdateConcurrencyException|ucr db/g, '')));
console.log(out.length, 'líneas;', out.reduce((a, l) => a + l.text.split(/\s+/).length, 0), 'palabras;', bad.length, 'con símbolos');
bad.forEach(l => console.log(' !', l.id, l.text));
