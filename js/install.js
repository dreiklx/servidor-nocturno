/* Instalación como aplicación (PWA) y bienvenida para teléfonos.
   - Android / Chrome / Edge / Samsung: se guarda el evento "beforeinstallprompt" y el botón
     INSTALAR APLICACIÓN abre el diálogo real del navegador. Si el navegador no lo ofrece,
     se explica cómo hacerlo desde su menú.
   - iPhone / iPad: Safari no tiene ese evento; se muestran los pasos de Compartir →
     Añadir a pantalla de inicio. Si ya se abrió desde el ícono (standalone), no se muestra nada.
   - Navegadores dentro de otras apps (Instagram, TikTok, Facebook…): no pueden instalar;
     se pide abrir el enlace en el navegador.
   También avisa cuando hay una versión nueva del juego en caché. */
window.INSTALL = (function () {
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const inApp = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|BytedanceWebview|Line\/|Snapchat|Twitter/i.test(ua);
  const iosOther = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  const isMobile = isIOS || isAndroid || (navigator.userAgentData && navigator.userAgentData.mobile) ||
    (window.matchMedia && matchMedia('(pointer: coarse) and (hover: none)').matches && Math.min(screen.width, screen.height) < 820);
  const standalone = () => (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: minimal-ui)').matches)) || navigator.standalone === true;
  const KEY = 'nd_install_seen';
  let deferred = null, installed = false;
  const listeners = new Set();
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; listeners.forEach(f => f()); });
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; listeners.forEach(f => f()); });

  const ICON = {
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 7.6 6.9l1.4 1.4 2-2V15h2V6.3l2 2 1.4-1.4z"/><path d="M5 10h3v2H7v8h10v-8h-1v-2h3v12H5z"/></svg>',
    add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5zm6 3h2v3h3v2h-3v3h-2v-3H8v-2h3z"/></svg>',
    dots: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z"/></svg>',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zM5.6 13.4a9 9 0 0 1 12.8 0l-1.5 1.5a7 7 0 0 0-9.8 0zM2.3 10.1a13.6 13.6 0 0 1 19.4 0l-1.5 1.5a11.5 11.5 0 0 0-16.4 0z"/><path d="M3 3l18 18-1.4 1.4L1.6 4.4z"/></svg>',
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z"/></svg>'
  };

  function shouldWelcome() {
    if (!isMobile || standalone()) return false;
    try { const t = +localStorage.getItem(KEY) || 0; return Date.now() - t > 3 * 24 * 3600 * 1000; } catch (e) { return true; }
  }
  function canOffer() { return !standalone() && !installed && (isMobile || !!deferred); }

  function steps(list) { return `<ol class="ins-steps">${list.map(s => `<li><span class="ins-n"></span><span>${s}</span></li>`).join('')}</ol>`; }
  function body() {
    if (installed) return { kind: 'done', html: `<div class="ins-ok">${ICON.check}<p><b>¡Listo!</b> Servidor Nocturno quedó instalado. Ábralo desde el ícono de su pantalla de inicio para jugar en pantalla completa.</p></div>` };
    if (inApp) return { kind: 'inapp', html: `<p class="ins-lead">Está viendo el juego dentro de otra app, y desde aquí no se puede instalar.</p>${steps([`Toque el menú <i class="ins-ic">${ICON.dots}</i> o «⋯» de esta app.`, `Elija <b>«Abrir en el navegador»</b> (${isIOS ? 'Safari' : 'Chrome'}).`, 'Ahí podrá instalarlo con un toque.'])}<button class="ins-btn ins-copy">Copiar el enlace</button>` };
    if (isIOS && !iosOther) return { kind: 'ios', html: `<p class="ins-lead">En iPhone se instala desde Safari en tres toques:</p>${steps([`Toque <b>Compartir</b> <i class="ins-ic">${ICON.share}</i> en la barra de Safari.`, `Elija <b>«Añadir a pantalla de inicio»</b> <i class="ins-ic">${ICON.add}</i> (deslice hacia abajo si no lo ve).`, 'Toque <b>«Añadir»</b> y abra el juego desde el ícono nuevo.'])}<div class="ins-arrow" aria-hidden="true">${ICON.share}<span>Compartir está aquí abajo</span></div>` };
    if (iosOther) return { kind: 'ios-other', html: `<p class="ins-lead">En este navegador del iPhone:</p>${steps([`Toque <b>Compartir</b> <i class="ins-ic">${ICON.share}</i> (junto a la barra de direcciones).`, `Elija <b>«Añadir a pantalla de inicio»</b> <i class="ins-ic">${ICON.add}</i>.`, 'Si no aparece, abra este mismo enlace en <b>Safari</b>.'])}` };
    if (deferred) return { kind: 'prompt', html: `<button class="ins-btn ins-main">${ICON.home}<span>INSTALAR APLICACIÓN</span></button><p class="ins-small">El navegador le pedirá confirmar. No ocupa casi espacio y se puede quitar cuando quiera.</p>` };
    if (isAndroid) return { kind: 'android-menu', html: `<p class="ins-lead">Instálelo desde el menú del navegador:</p>${steps([`Toque el menú <i class="ins-ic">${ICON.dots}</i> (arriba a la derecha).`, 'Elija <b>«Instalar aplicación»</b> o <b>«Agregar a la pantalla principal»</b>.', 'Abra el juego desde el ícono nuevo.'])}<p class="ins-small">Si el navegador ofrece instalarlo, aquí aparecerá un botón directo.</p>` };
    return { kind: 'other', html: `<p class="ins-lead">Use la opción «Instalar» o «Agregar a pantalla de inicio» de su navegador.</p>` };
  }

  // Pantalla completa y horizontal en Android al seguir en el navegador (iPhone no lo permite).
  function goFullscreen() {
    const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req || standalone() || isIOS) return;
    try {
      const p = req.call(el, { navigationUI: 'hide' });
      const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* sin soporte */ } };
      if (p && p.then) p.then(lock, () => {}); else lock();
    } catch (e) { /* sin soporte */ }
  }

  function welcome(opt = {}) {
    return new Promise(resolve => {
      const box = document.createElement('div');
      box.id = 'install'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'ins-title');
      box.className = (isIOS && !iosOther ? 'ios' : '') + (opt.fromMenu ? ' menu' : '');
      const paint = () => {
        const b = body();
        box.dataset.kind = b.kind;
        box.innerHTML = `
          <div class="ins-card">
            <div class="ins-top">
              <img class="ins-logo" src="assets/icons/icon-192.png" alt="">
              <div><div class="ins-studio">NYDER GAMES</div><h2 id="ins-title">SERVIDOR <span>NOCTURNO</span></h2></div>
            </div>
            <p class="ins-why">Se juega mejor como <b>aplicación</b>:</p>
            <ul class="ins-perks">
              <li>${ICON.full}<span>Pantalla completa, sin las barras del navegador</span></li>
              <li>${ICON.wifi}<span>Funciona sin internet después de la primera carga</span></li>
              <li>${ICON.home}<span>Ícono propio en su pantalla de inicio</span></li>
            </ul>
            <div class="ins-body">${b.html}</div>
            <button class="ins-skip">${opt.fromMenu ? 'Volver' : 'Continuar en el navegador'}</button>
            ${opt.fromMenu ? '' : '<p class="ins-foot">Gire el teléfono a horizontal para jugar.</p>'}
          </div>`;
        const main = box.querySelector('.ins-main');
        if (main) main.addEventListener('click', async () => {
          const ev = deferred; if (!ev) return;
          main.disabled = true;
          try { await ev.prompt(); const r = await ev.userChoice; if (r && r.outcome === 'accepted') installed = true; } catch (e) { /* el navegador lo rechazó */ }
          deferred = null; paint();
        });
        const copy = box.querySelector('.ins-copy');
        if (copy) copy.addEventListener('click', () => {
          const url = location.href.split('?')[0];
          const ok = () => { copy.textContent = 'Enlace copiado ✓'; };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, () => { copy.textContent = url; });
          else copy.textContent = url;
        });
        box.querySelector('.ins-skip').addEventListener('click', () => {
          try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* sin almacenamiento */ }
          if (!opt.fromMenu) goFullscreen();
          listeners.delete(paint);
          box.classList.add('out'); setTimeout(() => box.remove(), 220);
          resolve(installed ? 'installed' : 'browser');
        });
      };
      listeners.add(paint); paint();
      document.body.appendChild(box);
      requestAnimationFrame(() => box.classList.add('in'));
    });
  }

  /* ---- Service worker: registro y aviso de versión nueva ---- */
  function registerSW() {
    if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http') || /[?&](autotest|shot)=/.test(location.search)) return;
    window.addEventListener('load', () => {
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').catch(() => {});
      let shown = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || shown) return; shown = true;
        const t = document.createElement('div'); t.id = 'sw-update';
        t.innerHTML = '<span>Hay una versión nueva del juego.</span><button>Actualizar</button><button class="x" aria-label="Más tarde">✕</button>';
        t.querySelector('button').addEventListener('click', () => location.reload());
        t.querySelector('.x').addEventListener('click', () => t.remove());
        document.body.appendChild(t);
      });
    });
  }
  registerSW();

  return { shouldWelcome, welcome, canOffer, standalone, goFullscreen, get info() { return { isIOS, isAndroid, inApp, iosOther, isMobile: !!isMobile, standalone: standalone(), prompt: !!deferred, installed }; } };
})();
