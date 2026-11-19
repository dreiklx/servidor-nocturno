# Servidor Nocturno · Informe de la actualización v5

Fecha: 2026-11-19. Se trabajó sobre el proyecto existente sin reconstruirlo: Canvas y JavaScript sin dependencias, PWA y lanzador `.exe`. No se quitaron funciones ni se cambiaron las mecánicas de los jefes.

**Para revisar las capturas:** abra `screenshots/index.html`. Son 138 capturas reales del juego en ejecución.

---

## 1. Qué se analizó primero

- **Videos.** No son archivos `<video>`. Son enseñanzas animadas en Canvas (`js/video.js`), formadas por tramos con narración MP3 (`assets/voice`) y comandos de dibujo (`js/scenes.js`). Se mantuvo ese motor y se le agregó una línea de tiempo encima.
- **Jefes.** Hay 5 jefes de fase y el Profe Mauricio (Mau). Cada jefe de fase tiene presentación, combate de preguntas con 6 de vida, derrota y portal. Mau tiene tres actos y una pantalla final. Los jefes no tienen "fases" visuales propias. Las etapas que existen son la presentación, el combate, los aciertos y errores, las herramientas, la derrota y lo que pasa después. Eso es lo que se capturó.
- **PWA.** Ya existían el manifiesto, el service worker con caché por hash y los íconos. Faltaban la bienvenida móvil, las pantallas de arranque de iOS, el soporte de audio sin conexión en Safari y el aviso de versión nueva.

## 2. Funcionalidades implementadas

### Reproductor de video (sobre el motor existente)
- Barra de progreso arrastrable con el mouse o el dedo. Muestra el tiempo al pasar por encima y vista previa del dibujo mientras se arrastra.
- Marcas en la barra donde empieza cada tramo.
- Tiempo actual y duración total. Al abrir se usa una estimación, que se reemplaza por la duración real de cada MP3 apenas se conoce.
- Botones de −10 s y +10 s, reproducir/pausa, tramo anterior y siguiente (se conservaron).
- Volumen con deslizador y botón de silencio. Se guardan en el dispositivo. En iPhone, el sistema no deja cambiar el volumen desde la página, así que ahí solo aparece silenciar.
- Velocidades de 0,5×, 1×, 1,25×, 1,5× y 2×. La preferencia que alguien tenía guardada (0,8× a 1,4×) pasa a la más cercana.
- Pantalla completa real con el Fullscreen API. En iPhone, que no la permite para elementos, el video ocupa toda la ventana. En Android además gira a horizontal.
- Los controles se esconden a los 2,8 s mientras reproduce y vuelven con el mouse, el dedo o el teclado. En el teléfono, el primer toque muestra los controles y el segundo pausa.
- Atajos de teclado: Espacio o K, J/L, Shift+flechas, ←/→ por tramo, ↑/↓, M, F y < >.
- Al buscar se reconstruye el dibujo hasta ese instante y la narración arranca en el mismo segundo.
- Buscar hasta el final no salta la "Pausa rápida": la pregunta aparece igual.

### Teléfono e instalación (PWA)
- Detección de teléfono por sistema y, como respaldo, `pointer: coarse` y `hover: none` en pantallas chicas.
- **Bienvenida móvil** (`js/install.js`), diseñada para vertical y horizontal:
  - **Android, Chrome, Edge o Samsung:** botón grande **INSTALAR APLICACIÓN**, que usa el evento real `beforeinstallprompt`. Si el navegador no lo ofrece, explica el menú ⋮.
  - **iPhone con Safari:** tres pasos ilustrados (Compartir → Añadir a pantalla de inicio → Añadir) y una flecha animada hacia el botón Compartir.
  - **iPhone con Chrome, Firefox o Edge:** los pasos equivalentes y, si no funciona, usar Safari.
  - **Dentro de Instagram, TikTok, Facebook y similares:** explica que desde ahí no se puede instalar y ofrece "Copiar el enlace".
  - Si el juego ya está instalado y se abrió desde el ícono, no aparece nada.
  - "Continuar en el navegador" sigue en la web. En Android pide pantalla completa y horizontal. La bienvenida reaparece a los 3 días.
  - Su botón reemplaza al anterior "Toque la pantalla", así que no hay un toque extra.
- Nueva opción **"Instalar aplicación"** en el menú del título. Aparece cuando hay forma de instalar y va al final, para no cambiar el orden de las demás.
- **Pantallas de arranque de iOS:** 22 imágenes para 11 familias de iPhone, en vertical y horizontal (`assets/splash`). Se generaron renderizando una página real en Chrome. Android arma la suya con el nombre, el ícono y `background_color`, que ahora es `#120c22` en vez de negro.
- **Manifiesto:** se agregaron `id`, `categories`, `purpose` en los íconos y 3 capturas (`assets/screens`) para el diálogo de instalación enriquecido de Chrome.
- **Service worker:**
  - Responde el audio por partes (`206 Partial Content`). Sin esto, Safari no reproduce la narración sin conexión.
  - Solo cae en `index.html` cuando se navega. Antes devolvía HTML a cualquier archivo que fallaba.
  - Las imágenes de arranque y las capturas no se descargan al instalar, porque solo las pide el sistema.
- **Aviso "Hay una versión nueva del juego · Actualizar".** Antes la versión nueva quedaba lista sin avisar. No recarga solo, para no cortar una partida.
- Aviso de girar el teléfono con un ícono que rota, y la fuente pixel se precarga.

### Evento: Erika Ceviches en directo (`js/live.js`)
- Una notificación animada dice "¡ALERTA! ERIKA CEVICHES ESTÁ EN DIRECTO EN TIKTOK", con insignia LIVE que pulsa, el retrato de Erika, un sonido sintetizado nuevo (`AUDIO.fx.live`) y los botones **Ver** e ignorar.
- **Ver** abre una escena con forma de teléfono:
  - Erika en su puesto, con el pixel art del juego, luces y vasitos.
  - Corazones que suben (también al tocar) y contador de espectadores.
  - Chat con mensajes de los jefes, Kai y el Profe Mauricio.
  - Regalos de "limoncito", frases de Erika y el cierre "Erika terminó el directo".
- **Es raro.** Solo aparece en el juego libre, nunca en combates, videos ni menús, después de 2,5 minutos de juego. Cada 45 s tiene un 7 % de probabilidad, con un máximo de una vez por sesión. `?live=1` lo fuerza para probarlo.
- **Queda claro que es ficción:** "Evento del juego · directo simulado" en la notificación, y "DIRECTO SIMULADO · No es una transmisión real" en la escena y en el LEEME. No usa el logo de TikTok ni da premios, así que no toca las mecánicas.

**¿Se puede saber si una cuenta real está en vivo?** No por un medio legítimo desde este juego:
- La API pública de TikTok (Display API / Login Kit) solo da datos del usuario que inicia sesión, como su perfil y sus videos. No informa si otra cuenta transmite.
- Las APIs de LIVE son para socios aprobados.
- Las librerías no oficiales que leen la web de TikTok violan sus términos, se rompen seguido y necesitan un servidor propio, porque el navegador las bloquea por CORS.

**Alternativa legítima (no implementada, se propone):** un archivo `live.json` en el mismo GitHub Pages que la dueña de la cuenta, o quien administre el juego, cambia a mano cuando de verdad está en vivo, con el enlace a su perfil. El juego mostraría "EN VIVO DE VERDAD" solo con esa marca. Limitaciones: depende de que alguien lo actualice, y con caché puede tardar unos minutos.

## 3. Archivos

**Nuevos**
- `js/install.js`, `js/live.js` y `css/v3.css`.
- `assets/splash/` (22 imágenes) y `assets/screens/wide-1..3.jpg`.
- `tools/capture.js`, `tools/plans/*.json`, `tools/boss_shots.js`, `tools/gallery.js`, `tools/gen_splash.js` y `tools/test_v5.js`.
- `screenshots/` con `index.html` y las carpetas `boss_01…05`, `mau`, `video_player`, `mobile` y `live_erika`.
- Este informe.

**Modificados**
- `js/video.js`: los controles del reproductor. El motor de animación y la pausa rápida siguen igual.
- `js/game.js`, con cambios acotados:
  - La bienvenida al arrancar en teléfonos.
  - La opción "Instalar aplicación" en el título.
  - Una línea para el `tick` del evento.
  - Modos de captura nuevos: `ui=install`, `ui=live`, `ui=bossfight`, `ui=final&act=N`, `hearts=` y `pause=1`.
- `js/audio.js`: el sonido `live`.
- `index.html`: los scripts nuevos, `v3.css`, las pantallas de iOS y la precarga de la fuente. El registro del SW pasó a `install.js`.
- `manifest.webmanifest`, `tools/build_sw.js` y `sw.js` (regenerado).
- `tools/test_audio_inicio.js`: en el teléfono ahora toca "Continuar en el navegador", por el flujo nuevo.
- `.gitignore`: excepción para `assets/screens/*.jpg`, porque `*.jpg` estaba excluido entero.
- `LEEME.txt`, `docs/ARQUITECTURA.md` y `dist/ServidorNocturno.exe` (recompilado, porque empaqueta los archivos).

## 4. Pruebas ejecutadas (todas en verde al final)

| Prueba | Resultado |
|---|---|
| `node tools/test_v5.js` (nueva) | 37/37. Chrome reporta **0 errores de instalabilidad**, el audio responde 206 sin conexión, los ±10 s, el arrastre, el volumen, la velocidad, la pantalla completa y el autoocultado funcionan, hay una bienvenida correcta para Android, iPhone con Safari, iPhone con Chrome y TikTok, y el evento aparece. Sin errores de JS |
| `node tools/test_retos.js` (existente) | TODO OK |
| `node tools/run_autotest.js` (juega todo el juego) | 0 errores de consola |
| `node tools/test_pwa.js` (existente) | 8/8 |
| `node tools/test_audio_inicio.js` (existente, adaptado) | TODO OK en PC y en teléfono |
| `node tools/validate.js` | 0 errores, 0 avisos |

Las pruebas usan Chrome sin ventana con eventos reales de mouse, teclado y toque, en escritorio a 1280×720 y en teléfono emulado: Pixel a 915×412 y 412×915, iPhone a 390×844 y a 844×390.

## 5. Resultado de las pruebas móviles
- Bienvenida en vertical y horizontal sin cortes ni desplazamiento horizontal (`screenshots/mobile/01, 11, 13, 14`).
- El video ocupa todo el escenario en horizontal, con botones de 34 a 36 px como mínimo. Los subtítulos suben para no tapar los controles.
- El combate de jefes y el de Mau se ven completos en horizontal (`mobile/04`, `08`).
- El evento y su escena se adaptan (`mobile/09`, `10`).
- En vertical se muestra el aviso de girar con animación. El juego en sí es 16:9 y se juega en horizontal, igual que antes.
- **No se pudo probar en un teléfono físico.** Todo fue emulación de Chrome. El diálogo real de instalación de Android, el flujo de Safari en iPhone y el audio sin conexión en un iPhone real hay que confirmarlos en el dispositivo.

## 6. Estado
- **Instalación PWA:** lista. Chrome confirma que es instalable y el `beforeinstallprompt` real se disparó en las pruebas. En iPhone se instala solo desde "Añadir a pantalla de inicio", que es lo que el sistema permite. Si un navegador no ofrece instalar, el juego no muestra el botón: explica la opción del menú o sigue como página web. No se promete instalación en todos los navegadores.
- **Reproductor:** completo y probado en escritorio y teléfono emulado. La pantalla completa real no se puede verificar en Chrome sin ventana; ahí se probó el modo de respaldo, que es el mismo que usa iPhone.
- **Evento de Erika:** completo, simulado y rotulado como tal. No hay integración real con TikTok (ver la sección 2).
- **Capturas:**
  - Mau: 29 capturas, con los tres actos, los cambios entre actos, los ataques de los dos lados, las herramientas, la derrota de Mau, la pantalla final y la derrota de Kai con el rescate.
  - 5 jefes con 16 capturas cada uno.
  - 11 del reproductor, 14 de teléfono y 4 del evento.

## 7. Problemas encontrados
**Errores que ya existían (corregidos):**
1. En tramos sin audio, la velocidad se aplicaba dos veces, así que a 1,4× el tramo duraba menos de lo debido.
2. Pasar de tramo con el video en pausa hacía sonar la narración igual.
3. El service worker devolvía `index.html` cuando fallaba un audio o una imagen, en vez de dar error.
4. Sin conexión, Safari no puede reproducir audio que recibe completo cuando lo pidió por partes.
5. Al publicar una versión nueva no se avisaba.

**Error introducido por estos cambios y corregido:** en el teléfono, al pausar tocando el video, el clic de compatibilidad que el navegador genera después del toque caía en el ▶ grande y volvía a reproducir. Se detectó en las pruebas táctiles.

**Notas:**
- Los tests de captura `ui=bossfight` y `ui=final` llaman al flujo real (`interact`), así que no hay atajos que alteren los combates.

## 8. Auditoría · mejoras propuestas (no implementadas: piden su visto bueno)

| # | Qué | Problema que resuelve | Cómo | Impacto |
|---|---|---|---|---|
| 1 | Cámara más ancha en teléfonos | En pantallas 19,5:9 el juego 16:9 deja franjas negras a los lados (unos 90 px por lado en un Pixel) | Calcular el ancho lógico del Canvas según la pantalla (480 a 560) y ajustar `camTarget`/`render` | Alto en teléfonos; el mapa se ve más amplio |
| 2 | Descarga progresiva de la narración | La primera visita descarga 11,7 MB, casi todo MP3, en datos móviles | Precargar solo el código y la voz de la fase 1, y bajar el resto en segundo plano o por fase, con barra de progreso en la bienvenida | Alto: primera carga mucho más rápida |
| 3 | Pantalla de error recuperable | Si algo falla, el bucle solo lo registra en consola y el juego puede quedar trabado | `window.onerror` y `unhandledrejection` muestran "Algo salió mal · Guardar copia · Recargar" | Medio: protege el progreso |
| 4 | Aviso de guardado fallido | `save()` devuelve `false` (modo privado o sin espacio) y nadie se entera | Mostrar un aviso y ofrecer la copia `.json` | Medio |
| 5 | Presentación de jefe | Los jefes entran directo con un diálogo | Una tarjeta de 1,5 s con el nombre, un barrido y un sonido antes del diálogo (no cambia la mecánica) | Medio-alto en lo visual |
| 6 | Música por jefe y por acto de Mau | Todos los jefes usan `music('boss')` | Variar tempo y tonalidad del sintetizador por jefe y subir la intensidad por acto | Medio |
| 7 | Accesibilidad en combate | Correcto e incorrecto se distinguen sobre todo por color, y los mensajes no se anuncian | Íconos ✓/✗ además del color, `aria-live` en `.bt-msg` y opción de tamaño de letra | Medio |
| 8 | Vibración en Android | Los golpes no se sienten en el teléfono | `navigator.vibrate(30)` en aciertos y errores, con opción para apagarla | Bajo-medio |
| 9 | Estadísticas en la Libreta | El progreso por fase solo se ve al final | Porcentaje por fase y "Repasar mis errores" en la Libreta | Medio para estudiar |
| 10 | Directo "real" opcional | El evento es solo simulado | El `live.json` controlado por la dueña de la cuenta (ver la sección 2) | Bajo; depende de quien lo actualice |

## 9. Cómo repetir todo
```
node tools/serve.js                         # en otra terminal
node tools/test_v5.js
node tools/boss_shots.js screenshots        # 5 jefes + Mau + derrota de Kai
for p in video_player mobile_android mobile_portrait mobile_ios mobile_inapp live_and_store; do node tools/capture.js tools/plans/$p.json; done
node tools/gallery.js                       # screenshots/index.html
node tools/build_sw.js                      # después de cambiar archivos
```
