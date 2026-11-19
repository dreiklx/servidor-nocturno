# Servidor Nocturno · Expansión cinematográfica del jefe final (v6)

Fecha: 2026-11-19. El trabajo amplió la pelea contra Mau sin reconstruir el juego:
- no se cambiaron las preguntas, la vida por acto, la energía, el refuerzo de errores ni el rescate de Erika;
- los otros cinco jefes quedaron igual;
- la arquitectura es la misma: Canvas, JavaScript sin dependencias y audio sintetizado.

**Capturas nuevas:** `screenshots/mau_cinematica/` (36, escritorio) y `screenshots/mau_cinematica_movil/` (34, teléfono). Las 138 anteriores no se tocaron.

## 1. La historia: cómo encaja el giro

Lo que ya existía no cambia:
- El rayo de las 11:58 provocó el Gran Apagón.
- Mauricio guió a Kai por radio desde la Torre ("véalas con calma, que después se lo pregunto").

Lo nuevo es su motivo. Mau no causó el apagón, pero lo aprovechó. Con los núcleos caídos, ni él podía tocar el Servidor Central. Por eso guió a Kai para que los restaurara uno por uno y aprendiera "justo lo necesario". Su objetivo era quedarse con el control: "cada COMMIT y cada permiso pasan por mí".

**Pistas nuevas.** Al terminar cada fase por primera vez, Mau habla por radio. Ahí suena como un aliado; después de la revelación, cada frase cambia de sentido:

| Fase | Radio |
|---|---|
| 1 | "Núcleo uno en línea. Excelente. Ese es el primero... de cinco." |
| 2 | "Es increíble lo fácil que es dirigir algo cuando todos siguen el horario." |
| 3 | "Los respaldos de la bóveda ya están en mis manos... digo, a salvo." |
| 4 | "Todas las consultas del mercado vuelven a pasar por la Torre. Así me gusta: todo por un solo lugar." |
| 5 | "Ya casi tengo todo lo que necesito... para encender el servidor." |

**Cómo se reaprovechan las líneas originales:**
- Las tres líneas de apertura ("Lo estuve siguiendo por la radio toda la noche", "quiero ver si de verdad entendió...", "Son tres actos...") ahora se dicen después de la revelación.
- Las líneas de victoria se convirtieron en sus últimas palabras.
- La frase de Erika "le guardé un ceviche" vuelve en el epílogo.

**Tono.** Mau no se vuelve un villano caricaturesco: habla tranquilo, como profesor, y su plan es frío. Su retrato y su sprite no se modificaron. La amenaza sale de la luz, las sombras, la silueta, el aura de datos y la composición.

## 2. Qué se implementó

### Antes de la revelación
Mau ya no aparece en la Torre. En su lugar está la consola del **Servidor Central**: verde mientras Mau parece aliado, roja con Mau y azul cuando Kai recupera el control. El objetivo sigue diciendo "el Profe Mauricio lo espera", y al llegar no hay nadie.

### La revelación (`MAU.reveal`), sobre el mapa real
1. Entran las franjas de cine. Kai dice que ya llegó y que no hay nadie.
2. Las luces parpadean y se apagan. Se oyen chispazos y la música de la Torre desaparece.
3. Empieza la pista de suspenso: zumbido grave, disonancias, latido e interferencias. Aparecen franjas y desgarros en la imagen.
4. Habla la **Voz en la oscuridad**, sin mostrarse. Mientras tanto, la cámara recorre los racks de la izquierda, los de la derecha y la escalera.
5. Silencio total de 1,7 s.
6. Clic del interruptor. Un foco cenital revela una **silueta** negra frente a la consola.
7. La cámara se acerca despacio (zoom ×2,3) sobre un latido.
8. Golpe sonoro y destello: es el **Profe Mauricio**.
9. Diálogo de la traición, con la reacción de Kai.
10. Título **JEFE FINAL · MAU · El último servidor**, con interferencia de color.

**Obligatoria la primera vez.** No hay botón para saltarla; los diálogos sí avanzan con un toque o con Enter. A partir de la segunda vez aparece **"Saltar escena ▸▸"** (o Esc). Lo mismo aplica a las transiciones de acto ya vistas.

### Menú exclusivo (`MAU.menu`, antes de cada acto)
- Pantalla completa propia, con fondo cinematográfico oscuro.
- Mau aparece como silueta con contraluz del color del acto. Un haz de luz lo recorre y deja ver su retrato real mientras pasa.
- Columnas de datos, interferencia ocasional y líneas de barrido.
- Título "MAU" con desfase de color, "El último servidor" y "Torre del Servidor Central · 4:45 a. m.".
- Indicador I · II · III (hecho, actual, pendiente), nombre y tema del acto, energía actual de Kai y el botón **COMENZAR ACTO N**.
- Música propia del menú.

### Los tres actos (`MAU.battleFx`, solo presentación)

| Acto | Identidad | Ambiente del combate | Música |
|---|---|---|---|
| I · La máscara cae | Dorado | Foco cálido desde arriba, aura de datos y polvo en el aire | `mau1`: 128 BPM, bombo y caja, melodía tensa |
| II · El verdadero Mau | Rojo | Tinte rojo, columnas de datos rojas, aura más intensa | `mau2`: 142 BPM, doble bombo y tambores graves, melodía más agresiva |
| III · El último servidor | Azul tormenta | Cielo de tormenta con nubes, servidores encendidos, lluvia y relámpagos cada 2,6 a 5,6 s | `mau3`: 160 BPM, bombo continuo, coro sintetizado, máxima intensidad |

Común a los tres actos:
- **Barra de vida propia:** "MAU", el nombre del acto, el indicador I/II/III y **un segmento por pregunta del acto**.
- **Interferencia de color** en cada golpe, además de la viñeta.

Las **transiciones** son escenas cortas sobre el mapa:
- **Acto II:** parpadeo, luz roja, interferencia y dos líneas de Mau. Una de ellas es una pista: "¿Nunca se preguntó cómo sabía yo lo que venía?".
- **Acto III:** relámpagos, tormenta y datos que fluyen hacia Mau.

Las dos terminan con un aumento de tensión, un golpe sonoro y el título del acto.

### Epílogo (`MAU.epilogue`)
1. **Derrota:** los datos abandonan a Mau, que parpadea entre interferencias y se aparta de la consola.
2. **Últimas palabras:** "...Supongo que sí entendió" y "Kai, aprobó la prueba de la Torre" (línea original). Después admite que el servidor todavía responde a su usuario.
3. **Reacción de Kai:** "Entonces vamos a cambiar los permisos. Usted mismo me enseñó cómo." Kai camina hasta la consola.
4. **Recuperar el control:**
   - Un panel muestra el Servidor Central y los cinco núcleos, encadenados con candados al usuario `mauricio`.
   - El jugador toca **RECUPERAR EL CONTROL**.
   - Cada núcleo se libera: el candado se rompe, la línea pasa de rojo a azul y el dueño cambia a `puerto_nyder`.
   - Los comandos `REVOKE`/`GRANT` aparecen solo como subtítulo de esa animación.
5. **Consecuencias:**
   - La Torre pasa a azul y amanece, con la música de cierre.
   - Erika avisa que se encendió todo el puerto.
   - Mau queda sin permisos y "con muchas explicaciones que dar".
   - Mau cierra con "respalde. Siempre respalde."
6. Título **AMANECE · PUERTO NYDER**. Después viene la pantalla final de siempre, con un párrafo nuevo: Mau ya no controla la Torre y ningún usuario tiene todos los permisos.

### Audio (todo original y sintetizado, sin licencias de terceros)
- **Pistas nuevas:** `suspenso`, `menu`, `mau1`, `mau2`, `mau3` y `epilogo`.
- **Efectos nuevos:** chispazo eléctrico, apagón, interruptor, encendido de foco, latido, golpe grave, aumento de tensión, interferencia, trueno, candado y restauración.
- **Sin pistas duplicadas:** cada pista suena por su propio bus. Al cambiar de pista, el bus anterior se apaga en unos 50 ms y se desconecta. Esto se aplica también a la música que ya existía.

### Rendimiento
- No hay librerías nuevas.
- Las partículas tienen un máximo (unas 70) y la oscuridad usa un lienzo auxiliar reutilizado.
- No hay desenfoques costosos.
- Con `prefers-reduced-motion` se apagan los relámpagos y la interferencia del menú.

## 3. Archivos
**Nuevos**
- `js/mau.js` y `css/mau.css`.
- `tools/test_mau.js`.
- `screenshots/mau_cinematica/` y `screenshots/mau_cinematica_movil/`.
- Este informe.

**Modificados**
- `js/game.js`:
  - estado guardado: `mauSeen`, `mauRadio` y `mauActs`;
  - `window.GAMECINE` para cámara, zoom y cómo se ve Mau;
  - la consola del Servidor Central y Mau oculto hasta la revelación;
  - las llamadas a las escenas en `finalBoss`;
  - la radio en `finishPhase`;
  - el párrafo nuevo de la pantalla final;
  - modos de captura `seen`, `maumenu`, `mauepi` y `mauradio`.

  La lógica de las preguntas y los actos es la misma. En la prueba automática (`AUTO`), la pelea se juega exactamente como antes.
- `js/ui.js`: ganchos opcionales `cfg.skin`/`cfg.fx` en el combate, solo de dibujo. Sin ellos, el combate es idéntico.
- `js/audio.js`: un bus por pista, las pistas y los efectos de Mau, y `AUDIO.debug()`.
- `index.html`, `sw.js` (regenerado), `tools/boss_shots.js` (adaptado al flujo nuevo), `LEEME.txt`, `docs/ARQUITECTURA.md` y `dist/ServidorNocturno.exe` (recompilado).

## 4. Pruebas

| Prueba | Resultado |
|---|---|
| `node tools/test_mau.js` en escritorio (nueva) | 22/22 |
| `MOBILE=1 node tools/test_mau.js` en teléfono a 915×412 (nueva) | 15/15. Los botones se tocan con eventos táctiles reales y quedan dentro de la pantalla |
| `node tools/test_retos.js` | TODO OK |
| `node tools/run_autotest.js` (juega el juego completo) | 0 errores |
| `node tools/test_pwa.js` | 8/8 |
| `node tools/test_audio_inicio.js` | TODO OK |
| `node tools/test_v5.js` | 37/37 |
| `node tools/validate.js` | 0 errores, 0 avisos |
| `boss_shots.js` con el jefe 1 y Mau | Jefe 1 con las mismas 16 etapas; Mau llega hasta la pantalla final |

**Lo que verifica `test_mau.js`:**
- Mau no aparece antes de la revelación, y la primera vez no hay botón para saltar.
- Se recorren las 13 escenas y los tres actos completos hasta la pantalla final.
- Hay un menú antes de cada acto.
- La vida de Mau sigue siendo la de antes: 6, 6 y 7 preguntas.
- Un error sigue quitando 1 de energía.
- La música es la correcta en cada momento: suspenso en la oscuridad, silencio antes del interruptor, una pista propia en el menú y en cada acto, y cierre en el epílogo.
- **Nunca hay más de una pista activa.**
- En la revancha aparece "Saltar escena", lleva directo al menú y no deja música duplicada.
- Si Kai pierde, aparece el mensaje de siempre y empieza el rescate.
- La radio deja su pista al cerrar una fase.
- No hay errores de JavaScript.

**Límites honestos:**
- Las pruebas usan Chrome sin ventana con el audio en silencio. Se comprobó qué pista suena en cada momento y que nunca haya dos activas, pero no se escuchó cómo suena la mezcla. Conviene escucharla una vez en un equipo real y ajustar el volumen si hace falta.
- No se probó en un teléfono físico.

## 5. Propuestas (no implementadas)
- **Voz grabada para Mau en la revelación.** Hoy la escena usa subtítulos. Se podría generar con el mismo proceso Qwen de la narración, pero conviene aprobar la voz antes.
- **Logro o registro en la Libreta** con las cinco pistas de la radio, para releerlas después de la revelación.
