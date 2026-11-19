# Servidor Nocturno · Informe v7: revisión final antes de compartir

Fecha: 2026-11-19. Son correcciones puntuales. No se cambiaron las mecánicas, las preguntas, los jefes ni la historia de Mau.

## 1. "Nueva partida" con una partida guardada (teléfono)

**Reproducción.** En un teléfono emulado (915×412) con una partida guardada, se tocó Título → Nueva partida. Apareció el cuadro "¿Empezar de cero?" con su borde superior en **−169 px**, fuera de la pantalla. Sus dos opciones ("Sí, nueva partida" y "No, volver") quedaron entre −122 y −46 px. Solo se veía la mitad inferior vacía del cuadro, sobre el logo, y no había forma de seguir.

**Causa.** Todos los menús del juego usan a la vez las clases `card` y `menu`:
- `.menu` centra el cuadro con `top: 50%` y lo sube media altura con `transform: translateY(-50%)`.
- `.card` fija `top` y `bottom`.
- En pantallas chicas, la regla de teléfono `.card { top: 3%; bottom: 3% }` (en `css/v2.css`) se carga después y anula el `top: 50%`, pero el `translateY(-50%)` se mantiene.

Resultado: el cuadro ocupa toda la altura y además sube la mitad de su alto, así que su parte de arriba queda fuera de la pantalla. En escritorio no se notaba porque ahí gana `top: 50%`, pero el cuadro quedaba con un alto fijo. Un menú largo, como "Elegir fase", podía quedar cortado en una ventana baja.

**Solución (en la causa).**
- **`UI.confirm` (nueva, en `js/ui.js`):** una ventana de confirmación propia.
  - Ocupa toda la pantalla y centra el cuadro con flex, sin `top` ni `translate`. Si no cabe, tiene scroll interno.
  - Título **¿INICIAR UNA NUEVA PARTIDA?**, el texto pedido y los botones **CANCELAR** y **SÍ, NUEVA PARTIDA**, de al menos 44 px de alto.
  - **"Cancelar" queda enfocado por defecto.** Los toques que llegan en los primeros 400 ms se ignoran, así que el mismo toque que eligió "Nueva partida" no puede confirmar. Si ese toque cae sobre "Sí", el foco vuelve a "Cancelar".
  - Esc, o tocar fuera del cuadro, cancela.
- **`css/v7.css`:** reglas con selectores más específicos (`.modal.card.menu:not(.title-menu)`) que centran todos los demás menús, sin importar el orden de los archivos: pausa, elegir fase, Erika y copia de seguridad.
- **Comportamiento:**
  - **Cancelar** cierra la ventana, vuelve al menú y deja la partida guardada exactamente igual.
  - **Sí, nueva partida** hace lo mismo que antes: empieza la historia y la Fase 1 desde cero.

**Otros dispositivos.** La prueba también encontró que en los teléfonos la última opción del menú de título ("Instalar aplicación") quedaba cortada. Quedó corregido con la misma regla.

## 2. El menú de título tapaba el logo

**Reproducción.** En escritorio (1280×720, 1366×768, 1920×1080 y 1024×640), el panel del menú quedaba corrido a la izquierda, entre el 5 % y el 45 % del ancho, encima de "NOCTURNO" y del subtítulo.

**Causa.** Otra colisión entre las mismas clases. La regla genérica `.card.menu { left: 25%; right: 25% }` se carga después de `.modal.title-menu { left: 50%; transform: translate(-50%) }` y tiene la misma especificidad, así que la pisa. El resultado es `left: 25%` con un corrimiento del 50 % del ancho del panel. Además, el menú creció a 8 opciones y ya no cabía debajo del logo en una sola columna.

**Solución.**
- **Escritorio:** el menú queda centrado **debajo del logo**, con las opciones en dos columnas. Se ven el logo, el subtítulo, la luna y el pie.
- **Teléfonos y pantallas 4:3 o más angostas, como las tablets:** el logo va a la izquierda y el menú a la derecha. Es el diseño que ya tenía el teléfono, y ahora también se aplica en 4:3, donde el juego agranda la letra.

## 3. Evento de Erika Ceviches: cómo funciona (según el código) y la ayuda nueva

**El evento no cambió.** Solo se agregó una explicación dentro del juego:
- en **Cómo jugar → "¿Cómo funciona?"** (desde el título o la pausa);
- en el botón **"¿Qué es esto?"** dentro del propio directo.

No aparece sola ni interrumpe nada.

**Cómo funciona (`js/live.js`):**

| Pregunta | Respuesta |
|---|---|
| ¿Cuándo aparece? | Solo durante la exploración libre del mapa. Nunca en combates, videos, pruebas, diálogos ni menús. Recién después de 150 s (2,5 min) de exploración en la sesión |
| ¿Es aleatorio? ¿Probabilidad? | Sí. Cada 45 s de exploración hay un 7 % de probabilidad: en promedio unos 10 minutos de exploración después de esos 2,5 min. En los 10 minutos siguientes aparece con un 61 % de probabilidad |
| ¿Puede salir más de una vez? | No: como máximo una vez cada vez que se abre el juego |
| ¿Qué pasa cuando aparece? | Un aviso arriba, con la insignia LIVE, el retrato de Erika, el texto "¡ALERTA! ERIKA CEVICHES ESTÁ EN DIRECTO EN TIKTOK" y "Evento del juego · directo simulado", más un sonido. Se puede tocar **Ver** o cerrarlo; si no se toca, se va solo a los 11 s |
| ¿Qué muestra el directo? | Una pantalla de teléfono: Erika en su puesto (pixel art), luces, el letrero "CEVICHES ERIKA" y vasitos. Además: **espectadores ficticios** (empiezan en 312 y suben solos), **chat simulado** (12 mensajes de Kai, personajes del puerto, los cinco jefes y el Profe Mauricio), 4 frases de Erika y dos regalos "Kai envió un limoncito" |
| ¿Sonidos y animaciones? | Aviso sonoro, sonidos del chat, brillo de los regalos y campana al terminar. Animaciones de Erika, las luces, los corazones y el chat |
| ¿Se puede interactuar? | Solo tocando la pantalla del directo (o Espacio) para mandar corazones (+1 espectador). No se puede escribir en el chat. Dura unos 30 s y termina con "Erika terminó el directo". Esc o el botón vuelven al juego |
| ¿Afecta la partida? | **No.** No da limoncitos ni energía, no guarda nada y no cambia preguntas ni combates. El juego queda en pausa mientras está abierto |
| ¿Se puede activar a mano? | Sí, para pruebas: `?live=1` lo hace aparecer a los 4 s de exploración. `?shot=p1&ui=live` lo muestra directo |
| ¿Es TikTok real? | **No.** Es un directo simulado: no se conecta a internet ni a ninguna cuenta. TikTok no ofrece una API pública para saber si otra cuenta transmite en vivo |

**Recomendaciones (no implementadas):**
- Avisar en la Libreta si el directo ya salió en la sesión, para quien quiera verlo de nuevo.
- Permitir volver a verlo desde Cómo jugar una vez que haya salido.

## 4. Archivos
- **Nuevos:** `css/v7.css`, `tools/test_v7.js`, `screenshots/v7_correcciones/` (17 capturas) y este informe.
- **Modificados:**
  - `js/ui.js`: `UI.confirm`.
  - `js/game.js`: Nueva partida usa `UI.confirm`; Cómo jugar enlaza a la ayuda.
  - `js/live.js`: `LIVE.info()` y el botón "¿Qué es esto?". El evento no cambió.
  - `index.html`, `sw.js` (regenerado), `tools/gallery.js`, `screenshots/index.html`, `LEEME.txt` y `docs/ARQUITECTURA.md`.

## 5. Pruebas
**`tools/test_v7.js` (nueva):** 116 verificaciones. Usa toques reales en teléfonos y tablet, y clics y teclas en escritorio. Cubre 7 tamaños:
- Android 915×412;
- iPhone SE 667×375;
- teléfono chico 568×320;
- tablet 1024×768;
- escritorio 1280×720 y 1920×1080;
- ventana baja 1024×600.

En cada tamaño verifica:
- el menú de título no tapa ningún texto (se mide el texto real), cabe en la pantalla y todas sus opciones se ven completas;
- aparece la confirmación con el texto pedido, completa y dentro de la pantalla, con botones de 44 px o más;
- un toque accidental inmediato no borra nada y "Cancelar" queda enfocado;
- **Cancelar conserva la partida guardada byte por byte;**
- en escritorio, Enter y Esc cancelan;
- "Elegir fase" cabe en la pantalla;
- **confirmar empieza desde cero en la Fase 1.**

Además verifica la ayuda del evento (contenido y acceso desde Cómo jugar y desde el directo), que el evento sigue apareciendo y que no cambia la partida.

**Contra la versión publicada antes de corregir**, la prueba falla como se esperaba: no hay confirmación usable y la última opción del menú queda cortada. Eso confirma que reproduce el problema.

**Resto de las pruebas:** todas en verde. `validate`, `test_v5`, `test_retos`, `test_pwa`, `test_audio_inicio`, `run_autotest` y `test_mau` (escritorio y teléfono). No se eliminó ni debilitó ninguna prueba.
