# Graph Report - Nightdare-BD2-Juego  (2026-11-19)

## Corpus Check
- 21 files · ~56,852 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .bat 1)

## Summary
- 331 nodes · 665 edges · 22 communities (16 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Motor del juego
- Interfaz y combate
- Audio y música
- Minijuegos
- Videos de enseñanza
- Lanzador .exe
- Sprites
- Mapas
- Lógica de BD
- Service worker
- Validador
- Compilación .exe
- Dibujo de entidades
- Prueba automática
- Líneas de voz
- Servidor local
- Capturas
- Controles táctiles

## God Nodes (most connected - your core abstractions)
1. `battle()` - 18 edges
2. `tone()` - 15 edges
3. `play()` - 13 edges
4. `update()` - 12 edges
5. `enemyBattle()` - 12 edges
6. `toTitle()` - 12 edges
7. `make()` - 11 edges
8. `h()` - 11 edges
9. `esc()` - 11 edges
10. `loadPhase()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `locks()` --indirect_call--> `esc()`  [INFERRED]
  js/minigames.js → js/ui.js
- `round()` --indirect_call--> `esc()`  [INFERRED]
  js/minigames.js → js/ui.js
- `cut()` --indirect_call--> `esc()`  [INFERRED]
  js/minigames.js → js/ui.js

## Import Cycles
- None detected.

## Communities (22 total, 6 thin omitted)

### Community 0 - "Motor del juego"
Cohesion: 0.09
Nodes (63): autoDrive(), autotest(), backupMenu(), blocked(), blockedFor(), boot(), bossBattle(), burst() (+55 more)

### Community 1 - "Interfaz y combate"
Cohesion: 0.14
Nodes (32): battle(), answer(), attackFoe(), attackMe(), burstAt(), cont(), defeat(), draw() (+24 more)

### Community 2 - "Audio y música"
Cohesion: 0.14
Nodes (25): ambient(), bad(), battleLoop(), bell(), cart(), found(), good(), hit() (+17 more)

### Community 3 - "Minijuegos"
Cohesion: 0.16
Nodes (23): cache(), paint(), rate(), step(), choiceRounds(), show(), crane(), round() (+15 more)

### Community 4 - "Videos de enseñanza"
Cohesion: 0.20
Nodes (21): bounds(), drawBg(), drawObj(), icon(), mkObj(), play(), finish(), frame() (+13 more)

### Community 6 - "Sprites"
Cohesion: 0.31
Nodes (14): enemy(), erika(), erikaPortrait(), flip(), guide(), guidePortrait(), kai(), kaiPortrait() (+6 more)

### Community 7 - "Mapas"
Cohesion: 0.47
Nodes (11): ents(), final(), frame(), grid(), p1(), p2(), p3(), p4() (+3 more)

### Community 8 - "Lógica de BD"
Cohesion: 0.23
Nodes (8): explainRestore(), getPath(), mqlRun(), parseSchedule(), pickQuestions(), precedence(), restoreChain(), shuffle()

### Community 9 - "Service worker"
Cohesion: 0.17
Nodes (10): bytes, crypto, files, fs, h, INCLUDE, path, root (+2 more)

### Community 11 - "Validador"
Cohesion: 0.18
Nodes (7): ctx, fs, ids, mcAll, path, root, vm

### Community 12 - "Compilación .exe"
Cohesion: 0.20
Nodes (9): { execFileSync }, files, fs, ico, INCLUDE, path, root, rsp (+1 more)

### Community 13 - "Dibujo de entidades"
Cohesion: 0.32
Nodes (5): bubble(), drawCart(), drawEnt(), label(), S

### Community 14 - "Prueba automática"
Cohesion: 0.25
Nodes (4): fs, os, path, { spawn }

### Community 15 - "Líneas de voz"
Cohesion: 0.29
Nodes (4): bad, fs, out, SPOKEN

### Community 16 - "Servidor local"
Cohesion: 0.29
Nodes (5): fs, http, path, root, TYPES

### Community 17 - "Capturas"
Cohesion: 0.29
Nodes (4): fs, path, { spawn }, specs

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `keys()` connect `Minijuegos` to `Motor del juego`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `battle()` (e.g. with `cont()` and `draw()`) actually correct?**
  _`battle()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Motor del juego` be split into smaller, more focused modules?**
  _Cohesion score 0.09086538461538461 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `Interfaz y combate` to `Minijuegos`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `play()` (e.g. with `frame()` and `togglePlay()`) actually correct?**
  _`play()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Interfaz y combate` be split into smaller, more focused modules?**
  _Cohesion score 0.13813813813813813 - nodes in this community are weakly interconnected._
- **Should `Audio y música` be split into smaller, more focused modules?**
  _Cohesion score 0.135632183908046 - nodes in this community are weakly interconnected._