/* Copia de seguridad del avance: exportar / importar un archivo .json.
   La partida vive en localStorage del dispositivo (misma clave que la versión 1,
   así no se pierde el avance que ya existía). Sin cuentas ni nube. */
window.SAVEIO = (function () {
  const KEY = 'nightdare_bd2_v1';
  // Pide al navegador que no borre los datos del sitio por falta de espacio.
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* sin soporte */ }

  function exportFile() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) return { ok: false, msg: 'Todavía no hay una partida guardada para exportar.' };
    const data = { juego: 'servidor-nocturno', version: 1, fecha: new Date().toISOString(), partida: JSON.parse(raw) };
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    a.download = `servidor-nocturno-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
    a.href = URL.createObjectURL(blob); document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return { ok: true, msg: 'Copia descargada: ' + a.download };
  }

  function importFile() {
    return new Promise(resolve => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
      inp.addEventListener('change', () => {
        const f = inp.files && inp.files[0]; if (!f) { resolve({ ok: false, msg: 'No se eligió ningún archivo.' }); return; }
        const r = new FileReader();
        r.onload = () => {
          try {
            const d = JSON.parse(r.result);
            const p = d && d.juego === 'servidor-nocturno' ? d.partida : null;
            if (!p || typeof p !== 'object' || !('phase' in p) || !p.read) throw new Error('formato');
            localStorage.setItem(KEY, JSON.stringify(p));
            resolve({ ok: true, msg: 'Partida restaurada. Elija "Continuar".' });
          } catch (e) { resolve({ ok: false, msg: 'Ese archivo no es una copia válida de Servidor Nocturno.' }); }
        };
        r.onerror = () => resolve({ ok: false, msg: 'No se pudo leer el archivo.' });
        r.readAsText(f);
      });
      inp.click();
    });
  }
  return { KEY, exportFile, importFile };
})();
