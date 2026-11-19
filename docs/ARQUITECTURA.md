# Arquitectura de Servidor Nocturno

El índice se generó con **Graphify** el 2026-11-19 a partir del código (AST): 331 nodos, 665 aristas y 22 comunidades.
- Grafo interactivo: `graphify-out/graph.html`.
- Reporte completo: `graphify-out/GRAPH_REPORT.md`.
- Para regenerarlo: `/graphify .` (el archivo `.graphifyignore` excluye assets, audios y la carpeta `dist`).

## Capas

| Capa | Archivo | Qué hace |
|---|---|---|
| Datos de estudio | `js/content.js` | Fases, pizarras, 134 preguntas (`o[0]` es la correcta), jefes, minijuegos y diálogos |
| Guiones de video | `js/scenes.js` | 28 enseñanzas animadas: cada una tiene beats (narración y comandos de animación), una pausa interactiva y el resumen "Lo importante" |
| Lógica pura | `js/logic.js` | Grafo de precedencia, cadena de restauración, simulación de caché, evaluador MQL, prioridad de preguntas (los errores primero) y alcanzabilidad de mapas |
| Mapas | `js/maps.js` | Cinco lugares distintos y la Torre, construidos con rectángulos; puertas por zonas |
| Arte | `js/sprites.js` | Pixel art dibujado en código: Kai, guías, Erika Ceviches, Profe Mauricio y enemigos |
| Audio | `js/audio.js` | Tres sonidos NYDER del repo de FNAF. Todo lo demás es sintetizado: pasos por terreno, ataques, ambientes por lugar y música de combate |
| Interfaz | `js/ui.js` | Pila de ventanas (diálogo, pizarra, menú, libreta) y **combate por turnos** (`battle()`, el nodo más conectado) |
| Videos | `js/video.js` | Reproductor en Canvas que interpreta los comandos de `scenes.js` y reproduce `assets/voice/*.mp3` (voz Qwen) |
| Minijuegos | `js/minigames.js` | Diez pruebas, dos por fase |
| Guardado | `js/save.js` | localStorage y exportar o importar una copia `.json` |
| Táctil | `js/touch.js` | Joystick y botones que emiten los mismos eventos de teclado |
| Motor | `js/game.js` | Bucle, cámara, render, objetivos con checklist, combates, rescate de Erika, jefe final en 3 actos, intro de NYDER, autotest y modo captura |
| Sin conexión | `sw.js` y `manifest.webmanifest` | PWA instalable. `tools/build_sw.js` genera la lista de caché con un hash del contenido |

## Flujo de una fase

1. Se habla con el guía.
2. Se ven las enseñanzas: video narrado y luego la pizarra.
3. Se abren las puertas al vencer enemigos y superar los minijuegos.
4. Se pasa por el puesto de Erika, que guarda la partida.
5. Se pelea con el jefe y se cruza el portal.

En los combates, responder bien hace que Kai ataque. Si se falla, el enemigo ataca, se explica el porqué y esa pregunta vuelve en el mismo combate. Un error deja de estar pendiente solo cuando se responde bien más veces de las que se falló. El repaso con Erika y el Profe Mauricio prioriza esas preguntas.

## Herramientas (`tools/`)

| Herramienta | Uso |
|---|---|
| `validate.js` | Revisa las preguntas, el sesgo de longitud, los grafos, las restauraciones, la caché, MQL y los mapas |
| `run_autotest.js` | Juega todo el juego en Chrome sin ventana: `node tools/run_autotest.js http://localhost:8642/` |
| `serve.js` | Servidor local para probar la PWA |
| `shots.js` | Capturas de pantalla |
| `voice_lines.js` → `synth_qwen.py` → `encode_voice.sh` | Narración con Qwen3-TTS desde el entorno de Story Lab y conversión a MP3 |
| `exe/` | Lanzador portable para Windows: `node tools/exe/build_exe.js` |
