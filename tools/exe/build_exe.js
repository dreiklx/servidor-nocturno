/* Compila dist/ServidorNocturno.exe (portable, un solo archivo) con el csc.exe de .NET Framework 4
   que trae Windows. No instala nada. Uso: node tools/exe/build_exe.js
   Requiere: assets/icons/app.ico (se genera con ffmpeg si falta). */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..', '..');
const CSC = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe';
const INCLUDE = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets'];
const files = [];
(function walkAll() {
  const walk = rel => { const abs = path.join(root, rel); if (fs.statSync(abs).isDirectory()) fs.readdirSync(abs).forEach(f => walk(rel + '/' + f)); else files.push(rel); };
  INCLUDE.forEach(walk);
})();
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const ico = path.join(root, 'assets', 'icons', 'app.ico');
const rsp = [
  '/nologo', '/target:winexe', '/optimize+', '/platform:anycpu',
  `/out:"${path.join(root, 'dist', 'ServidorNocturno.exe')}"`,
  fs.existsSync(ico) ? `/win32icon:"${ico}"` : '',
  '/r:System.Windows.Forms.dll',
  ...files.map(f => `/resource:"${path.join(root, f)}",game/${f}`),
  `"${path.join(__dirname, 'Launcher.cs')}"`
].filter(Boolean).join('\n');
const rspPath = path.join(root, 'dist', 'build.rsp');
fs.writeFileSync(rspPath, rsp);
try { execFileSync(CSC, ['@' + rspPath], { stdio: 'inherit' }); }
finally { fs.unlinkSync(rspPath); }
const size = fs.statSync(path.join(root, 'dist', 'ServidorNocturno.exe')).size;
console.log(`dist/ServidorNocturno.exe · ${files.length} archivos embebidos · ${(size / 1048576).toFixed(1)} MB`);
