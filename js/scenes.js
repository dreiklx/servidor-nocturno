/* =====================================================================
   SERVIDOR NOCTURNO · Guiones de las enseñanzas animadas ("mini videos")
   Cada escena = beats (narración + comandos de animación), una pausa
   interactiva (quiz) y "Lo importante" (recap). Todo sale de las pizarras
   de content.js, que a su vez salen de las guías.
   Narrador: el Locutor de Radio Nocturna (voz Qwen fija). who:'e' = Erika.
   Audio esperado: assets/voice/<id>_<n>.mp3 (n = 1..beats) y <id>_r.mp3.
   Comandos (coordenadas en 480x270):
     ['spr',id,kind,x,y,escala]  ['box',id,x,y,w,h,texto,color]
     ['txt',id,x,y,texto,color,tam]  ['code',id,x,y,lineas]
     ['tbl',id,x,y,anchos,filas]  ['arrow',id,x1,y1,x2,y2,color,rotulo]
     ['mv',id,x,y,ms]  ['set',id,texto]  ['hl',id]  ['ok',id]  ['no',id]
     ['shake',id]  ['hop',id]  ['fade',id]  ['bub',id,texto]  ['w',ms]
     ['clr']  ['flash',color]  ['sfx',nombre]  ['row',id,fila]
   ===================================================================== */
window.SCENES = (function () {
  const B = (say, cmds, who) => ({ say, cmds: cmds || [], who: who || 'n' });
  const S = {};
  const add = (id, bg, beats, quiz, recap) => { S[id] = { id, bg, beats, quiz, recap }; };

  /* ------------------------- FASE 1 · Guía #8 ------------------------- */
  add('p1l1', 'muelle', [
    B('Radio Nocturna, en vivo desde el muelle. Tema de hoy: transacciones. Una transacción es un paquete de operaciones que se hace completo, o no se hace del todo. No hay término medio, mae.',
      [['spr', 'kai', 'kai', 70, 150, 4], ['w', 900], ['box', 't', 150, 40, 300, 46, 'TRANSACCIÓN\n= todo o nada', 'g'], ['w', 1800], ['code', 'c', 175, 105, ['INSERT ...', 'UPDATE ...', 'DELETE ...']]]),
    B('Ejemplo: un SINPE de cien colones. Paso uno, rebajar su cuenta. Paso dos, sumarle a la otra persona. Si el sistema se cae a la mitad, la plata no puede desaparecer. Eso es la atomicidad, la A de ACID.',
      [['clr'], ['box', 'a', 30, 70, 130, 50, 'Su cuenta\n₡500', 'b'], ['box', 'b', 320, 70, 130, 50, 'Otra cuenta\n₡200', 'b'], ['spr', 'm', 'coin', 95, 140, 3], ['w', 1500], ['set', 'a', 'Su cuenta\n₡400'], ['mv', 'm', 230, 140, 900], ['w', 900], ['flash', 'r'], ['sfx', 'thunder'], ['txt', 'f', 240, 40, '¡SE CAYÓ!', 'r', 16], ['w', 1300], ['mv', 'm', 95, 140, 700], ['set', 'a', 'Su cuenta\n₡500'], ['ok', 'a'], ['txt', 'A', 240, 200, 'A = Atomicidad: se deshace todo', 'g', 12]]),
    B('La C es consistencia: la base pasa de un estado válido a otro válido. La I es aislamiento: dos transacciones al mismo tiempo no se estorban.',
      [['clr'], ['box', 'C', 40, 50, 190, 60, 'C · Consistencia\nválido → válido', 'v'], ['w', 2600], ['box', 'I', 250, 50, 190, 60, 'I · Aislamiento\nno se estorban', 'p'], ['spr', 'k1', 'kai', 300, 150, 3], ['spr', 'k2', 'guide', 380, 150, 3]]),
    B('Y la D, durabilidad: después del COMMIT, aunque se vaya la luz, el cambio sigue ahí. Así que no, el apagón no es excusa.',
      [['clr'], ['code', 'c', 40, 50, ['BEGIN TRANSACTION', '  UPDATE ...', 'COMMIT;']], ['w', 1600], ['flash', 'k'], ['sfx', 'thunder'], ['spr', 'd', 'db', 340, 70, 4], ['w', 900], ['ok', 'd'], ['box', 'D', 120, 170, 240, 34, 'D · Durabilidad: sigue guardado', 'g']])
  ], { q: 'Se rebaja la plata y el sistema se cae antes de sumarla a la otra cuenta. ¿Qué propiedad obliga a deshacer el rebajo?', o: ['Atomicidad', 'Durabilidad', 'Aislamiento'], why: 'Todo o nada: como la segunda parte falló, la primera también se revierte.' },
  ['Transacción: todo o nada.', 'ACID: atomicidad, consistencia, aislamiento y durabilidad.', 'Después del COMMIT, el cambio sobrevive a un fallo.']);

  add('p1l2', 'muelle', [
    B('BEGIN TRANSACTION abre el paquete. COMMIT guarda todos los cambios. ROLLBACK los deshace todos, desde el inicio. Así de sencillo, y aun así la gente se enreda.',
      [['code', 'c', 40, 40, ['BEGIN TRANSACTION', '  UPDATE Cajas ...', '  UPDATE Barco ...', 'COMMIT     -- guarda', 'ROLLBACK   -- deshace todo']], ['spr', 'kai', 'kai', 380, 140, 4], ['w', 2600], ['bub', 'kai', '¿Y si me arrepiento a medias?']]),
    B('Para eso está SAVE TRANSACTION: crea un punto intermedio, un savepoint. Si algo sale mal, ROLLBACK con ese nombre revierte solo hasta ahí, no hasta el inicio.',
      [['clr'], ['box', 's0', 20, 80, 95, 36, 'BEGIN', 'b'], ['box', 's1', 130, 80, 95, 36, 'paso 1', 'b'], ['box', 'sp', 240, 80, 105, 36, 'SAVE p1', 'g'], ['box', 's2', 360, 80, 100, 36, 'paso 2', 'r'], ['w', 2400], ['no', 's2'], ['arrow', 'ar', 400, 130, 292, 130, 'g', 'ROLLBACK TRANSACTION p1'], ['w', 1400], ['fade', 's2'], ['ok', 's1']]),
    B('Es como guardar partida antes del jefe: si pierde, vuelve al puestito de ceviche, no al inicio del juego.',
      [['clr'], ['spr', 'e', 'erika', 300, 130, 4], ['spr', 'cup', 'cup', 380, 160, 3], ['spr', 'kai', 'kai', 150, 140, 4], ['w', 900], ['bub', 'e', '¡Aquí le guardo, mi amor!']]),
    B('Con errores se usa TRY y CATCH: el trabajo va en BEGIN TRY. Si algo falla, el CATCH hace ROLLBACK, pero solo si arroba arroba TRANCOUNT es mayor que cero, o sea, si hay una transacción abierta.',
      [['clr'], ['code', 'c', 60, 30, ['BEGIN TRY', '  BEGIN TRANSACTION', '    UPDATE ...', '  COMMIT', 'END TRY', 'BEGIN CATCH', '  IF @@TRANCOUNT > 0', '    ROLLBACK', 'END CATCH']], ['w', 3500], ['hl', 'c']])
  ], { q: 'Hizo SAVE TRANSACTION p1 y después ROLLBACK TRANSACTION p1. ¿Qué se deshace?', o: ['Lo hecho después de p1', 'Todo desde el BEGIN', 'Nada, falta el COMMIT'], why: 'Revertir a un savepoint deshace solo hasta ese punto. Lo anterior queda pendiente de confirmar.' },
  ['COMMIT guarda; ROLLBACK deshace todo.', 'SAVE TRANSACTION marca un punto; ROLLBACK a ese nombre vuelve solo hasta ahí.', 'En el CATCH: si @@TRANCOUNT > 0, ROLLBACK.']);

  add('p1l3', 'muelle', [
    B('El log de transacciones, o WAL, es la bitácora del motor. Antes de tocar los datos, anota lo que va a hacer. Primero escribe en el log; después, en la base.',
      [['spr', 'l', 'doc', 140, 80, 4], ['spr', 'd', 'db', 330, 80, 4], ['txt', 't1', 160, 60, 'LOG', 'g', 12], ['txt', 't2', 350, 60, 'BASE', 'b', 12], ['w', 1800], ['arrow', 'a1', 60, 110, 125, 110, 'g', '1. anota'], ['w', 1500], ['arrow', 'a2', 185, 110, 320, 110, 'b', '2. aplica']]),
    B('Ejemplo: UPDATE saldo menos cien. Se anota en el log. Y justo antes del COMMIT... se va la luz. Qué torta.',
      [['clr'], ['code', 'c', 60, 50, ['UPDATE Cuentas', '  SET saldo = saldo - 100', '-- falta el COMMIT...']], ['w', 2600], ['flash', 'k'], ['sfx', 'thunder'], ['txt', 'f', 240, 170, '¡APAGÓN!', 'r', 18], ['shake', 'c']]),
    B('Al reiniciar, el motor lee la bitácora: lo que no tenía COMMIT se deshace, y lo que sí estaba confirmado se rehace. Por eso el log garantiza la durabilidad, la D de ACID.',
      [['clr'], ['spr', 'l', 'doc', 60, 90, 4], ['box', 'u', 160, 50, 280, 40, 'sin COMMIT → se deshace', 'r'], ['w', 2200], ['box', 'r', 160, 120, 280, 40, 'con COMMIT → se rehace', 'v'], ['w', 1500], ['ok', 'r']])
  ], { q: '¿Cuándo se anota una operación en el log WAL?', o: ['Antes de aplicarse', 'Después del COMMIT', 'Solo cuando hay un fallo'], why: 'Write-Ahead Logging: primero se escribe en el log y luego se aplica a los datos.' },
  ['WAL: primero se anota, después se aplica.', 'Tras un fallo: deshace lo no confirmado y rehace lo confirmado.', 'Es la base de la durabilidad.']);

  add('p1l4', 'muelle', [
    B('Tres anomalías que le van a preguntar fijo. La primera, lectura sucia: usted lee un dato que otra transacción todavía no confirma. Si esa otra hace ROLLBACK, usted leyó humo.',
      [['box', 't1', 30, 40, 200, 44, 'T1: precio = 900\n(sin COMMIT)', 'o'], ['w', 1700], ['box', 't2', 260, 40, 190, 44, 'T2 lee: 900', 'b'], ['w', 1800], ['set', 't1', 'T1: ROLLBACK\nprecio vuelve a 700'], ['no', 't2'], ['spr', 'bug', 'enemy:mudbug', 220, 150, 4], ['txt', 'n', 240, 215, 'SUCIA = dato sin confirmar', 'r', 12]]),
    B('Es como celebrar un gol que el VAR anula. La segunda, lectura no repetible: lee la misma fila dos veces y da valores distintos, porque otro la cambió y confirmó en medio.',
      [['clr'], ['box', 'p', 150, 50, 180, 50, 'Arroz: ₡1000', 'b'], ['spr', 'kai', 'kai', 80, 140, 4], ['w', 2500], ['set', 'p', 'Arroz: ₡1200'], ['shake', 'p'], ['bub', 'kai', '¿Ah? ¿No era mil?'], ['txt', 'n', 240, 215, 'NO REPETIBLE = la misma fila cambió', 'o', 12]]),
    B('La tercera, lectura fantasma: repite la misma consulta y aparecen filas nuevas que otro insertó. Cuenta la fila del bus, recuenta, y hay gente nueva.',
      [['clr'], ['spr', 'u1', 'user', 100, 100, 3], ['spr', 'u2', 'user', 150, 100, 3], ['spr', 'u3', 'user', 200, 100, 3], ['txt', 'c', 160, 60, 'COUNT = 3', 'b', 12], ['w', 2200], ['spr', 'u4', 'user', 250, 100, 3], ['spr', 'u5', 'user', 300, 100, 3], ['set', 'c', 'COUNT = 5'], ['txt', 'n', 240, 215, 'FANTASMA = cambió el conjunto de filas', 'p', 12]]),
    B('Para no confundirlas: sucia, el dato no estaba confirmado. No repetible, la misma fila cambió. Fantasma, aparecieron o desaparecieron filas.',
      [['clr'], ['box', 'a', 30, 50, 130, 70, 'SUCIA\nsin confirmar', 'r'], ['box', 'b', 175, 50, 130, 70, 'NO REPETIBLE\nmisma fila cambia', 'o'], ['box', 'c', 320, 50, 130, 70, 'FANTASMA\nfilas nuevas', 'p']])
  ], { q: 'Lee el precio de una fila; otra transacción lo cambia y confirma; al releer, sale distinto. ¿Qué anomalía es?', o: ['No repetible', 'Sucia', 'Fantasma'], why: 'La misma fila cambió entre dos lecturas, y el cambio sí estaba confirmado.' },
  ['Sucia: lee algo sin confirmar.', 'No repetible: la misma fila cambia entre lecturas.', 'Fantasma: aparecen o desaparecen filas.']);

  add('p1l5', 'muelle', [
    B('Los niveles de aislamiento deciden cuántas de esas anomalías se permiten. Más aislamiento, menos sorpresas, pero más fila para esperar. Como un baño con llave.',
      [['tbl', 't', 40, 40, [150, 80, 100, 80], [['Nivel', 'Sucia', 'No repet.', 'Fantasma'], ['READ UNCOMMITTED', 'sí', 'sí', 'sí'], ['READ COMMITTED', 'no', 'sí', 'sí'], ['REPEATABLE READ', 'no', 'no', 'sí'], ['SERIALIZABLE', 'no', 'no', 'no']]], ['txt', 'n', 240, 205, '"sí" = la anomalía puede ocurrir', 'w', 10]]),
    B('READ UNCOMMITTED permite las tres. READ COMMITTED, el predeterminado de SQL Server, evita la lectura sucia.',
      [['row', 't', 1], ['w', 2600], ['row', 't', 2]]),
    B('REPEATABLE READ evita también la no repetible, pero todavía deja pasar fantasmas. Y SERIALIZABLE, el más estricto, no permite ninguna: se comporta como si las transacciones fueran en fila.',
      [['row', 't', 3], ['w', 3200], ['row', 't', 4]]),
    B('Se cambia con SET TRANSACTION ISOLATION LEVEL y el nombre del nivel. Diay, así de fácil.',
      [['clr'], ['code', 'c', 50, 80, ['SET TRANSACTION ISOLATION LEVEL', '    SERIALIZABLE;']]])
  ], { q: '¿Cuál es el nivel más bajo que evita la lectura no repetible, pero todavía permite fantasmas?', o: ['REPEATABLE READ', 'READ COMMITTED', 'SERIALIZABLE'], why: 'REPEATABLE READ protege lo ya leído, pero no impide que se inserten filas nuevas.' },
  ['READ UNCOMMITTED: permite las tres anomalías.', 'READ COMMITTED (predeterminado): evita la sucia.', 'REPEATABLE READ evita sucia y no repetible; SERIALIZABLE evita las tres.']);

  /* ------------------------- FASE 2 · Guía #9 ------------------------- */
  add('p2l1', 'estacion', [
    B('Una planificación es el orden en que se intercalan las operaciones de varias transacciones. Ojo: cada transacción conserva su propio orden interno.',
      [['code', 'c', 40, 40, ['l1(X)   T1 lee X', 'e1(X)   T1 escribe X', 'c1      T1 confirma (COMMIT)', 'r1      T1 aborta (ROLLBACK)']], ['spr', 'tr', 'train', 380, 150, 3]]),
    B('En serie, una transacción termina completa antes de que empiece la otra. Dos cocineros, una sola cocina: primero uno, después el otro. Seguro, pero lento.',
      [['clr'], ['txt', 'h', 240, 40, 'SERIE', 'g', 14], ['box', 'a1', 20, 70, 100, 30, 'T1 · l1(X)', 'b'], ['box', 'a2', 130, 70, 100, 30, 'T1 · e1(X)', 'b'], ['w', 1200], ['box', 'b1', 250, 70, 100, 30, 'T2 · l2(X)', 'o'], ['box', 'b2', 360, 70, 100, 30, 'T2 · e2(X)', 'o'], ['spr', 'k1', 'kai', 120, 150, 3], ['spr', 'k2', 'guide', 330, 150, 3]]),
    B('No serie significa intercalado. Es más rápido, pero eso solo no dice si está bien. Lo que buscamos es que sea serializable: equivalente a alguna ejecución en serie.',
      [['clr'], ['txt', 'h', 240, 40, 'NO SERIE (intercalado)', 'o', 14], ['box', 'a1', 20, 70, 100, 30, 'T1 · l1(X)', 'b'], ['box', 'b1', 130, 70, 100, 30, 'T2 · l2(Y)', 'o'], ['box', 'a2', 240, 70, 100, 30, 'T1 · e1(X)', 'b'], ['box', 'b2', 350, 70, 110, 30, 'T2 · e2(Y)', 'o'], ['w', 2600], ['box', 'q', 120, 140, 240, 40, '¿Equivale a una serie?', 'g']]),
    B('Para saberlo hay dos criterios: equivalencia por conflictos y equivalencia de vistas. Ya viene el grafo, agárrese.',
      [['clr'], ['box', 'x', 40, 80, 190, 50, 'por CONFLICTOS\n(grafo)', 'b'], ['box', 'y', 250, 80, 190, 50, 'de VISTAS', 'p']])
  ], { q: '¿Qué significa que una planificación sea serializable?', o: ['Equivale a una serie', 'No se intercala', 'Todas confirman'], why: 'No hace falta ir en serie: basta con producir el mismo efecto que algún orden en serie.' },
  ['Planificación: intercala operaciones y respeta el orden interno de cada transacción.', 'Serie: una completa y luego la otra.', 'Serializable: equivale a alguna ejecución en serie.']);

  add('p2l2', 'estacion', [
    B('Dos operaciones están en conflicto si cumplen tres cosas: son de transacciones distintas, tocan el mismo dato, y al menos una escribe. Dos lecturas no chocan. Datos distintos, tampoco.',
      [['box', 'a', 30, 40, 420, 30, '1. Transacciones distintas', 'b'], ['w', 1600], ['box', 'b', 30, 80, 420, 30, '2. El mismo dato', 'b'], ['w', 1300], ['box', 'c', 30, 120, 420, 30, '3. Al menos una escribe', 'g'], ['w', 1600], ['box', 'd', 30, 170, 200, 30, 'l1(X) · l2(X): no', 'r'], ['box', 'e', 250, 170, 200, 30, 'e1(X) · l2(X): sí', 'v']]),
    B('Con eso se arma el grafo de precedencia: un nodo por transacción. Si una operación de T i va antes que otra de T j con la que choca, se dibuja una flecha de T i hacia T j.',
      [['clr'], ['box', 'n3', 50, 100, 60, 40, 'T3', 'p'], ['box', 'n1', 210, 100, 60, 40, 'T1', 'b'], ['box', 'n2', 370, 100, 60, 40, 'T2', 'o']]),
    B('Ejemplo de la guía: l3 de X, e3 de X, l1 de X, e1 de Y, l2 de Y, e2 de Z. T3 escribe X antes de que T1 lo lea: flecha de T3 a T1. T1 escribe Y antes de que T2 lo lea: flecha de T1 a T2.',
      [['code', 'c', 40, 30, ['l3(X); e3(X); l1(X); e1(Y); l2(Y); e2(Z)']], ['w', 3800], ['arrow', 'x', 112, 120, 208, 120, 'g', 'X'], ['w', 3600], ['arrow', 'y', 272, 120, 368, 120, 'g', 'Y']]),
    B('Si hay un ciclo, no es serializable por conflictos. Sin ciclo, se sigue el orden de las flechas: T3, T1, T2. Pura vida.',
      [['txt', 'r', 240, 190, 'Sin ciclo → orden serie: T3, T1, T2', 'v', 13], ['ok', 'n1']])
  ], { q: 'El grafo tiene T1 → T2 y T2 → T1. ¿Qué concluye?', o: ['No es serializable por conflictos', 'Equivale a la serie T1, T2', 'Es serializable, pero no recuperable'], why: 'Un ciclo significa que ningún orden en serie respeta todos los conflictos.' },
  ['Conflicto: transacciones distintas, mismo dato y al menos una escritura.', 'Flecha Ti → Tj si la operación de Ti va primero.', 'Ciclo = no serializable por conflictos; sin ciclo, el orden de las flechas.']);

  add('p2l3', 'estacion', [
    B('Equivalencia de vistas. Dos planes son equivalentes en vistas si cumplen tres cosas. Uno: quien lee el valor inicial de un dato lo sigue leyendo.',
      [['box', 'a', 30, 50, 420, 32, '1. Las mismas lecturas del valor inicial', 'b']]),
    B('Dos: se mantiene la relación de lectura, o sea, quién lee lo que escribió quién. Tres: la escritura final de cada dato la hace la misma transacción. Como un chisme: cada quien lo escuchó de la misma fuente, y el final es el mismo.',
      [['box', 'b', 30, 92, 420, 32, '2. Quién lee lo que escribió quién', 'b'], ['w', 2800], ['box', 'c', 30, 134, 420, 32, '3. La misma escritura final', 'g'], ['spr', 'u1', 'user', 120, 190, 2], ['spr', 'u2', 'user', 240, 190, 2], ['spr', 'u3', 'user', 360, 190, 2]]),
    B('Todo plan serializable por conflictos también lo es en vistas, pero no al revés. La diferencia aparece con escrituras ciegas: escribir sin haber leído antes.',
      [['clr'], ['box', 'big', 60, 40, 360, 150, '', 'p'], ['txt', 'v', 240, 60, 'Serializable en VISTAS', 'p', 12], ['box', 'small', 130, 90, 220, 70, 'por CONFLICTOS', 'b']]),
    B('Ejemplo V5: e1 de X, e2 de X, e1 de X. El grafo tiene ciclo, pero es serializable en vistas: equivale a ejecutar T2 y después T1, porque la escritura final es de T1 y nadie lee.',
      [['clr'], ['code', 'c', 90, 50, ['V5:  e1(X); e2(X); e1(X)']], ['w', 2500], ['box', 'n1', 120, 120, 60, 36, 'T1', 'b'], ['box', 'n2', 300, 120, 60, 36, 'T2', 'o'], ['arrow', 'a', 182, 128, 298, 128, 'r', ''], ['arrow', 'b2', 298, 150, 182, 150, 'r', 'ciclo'], ['w', 2200], ['txt', 'ok', 240, 205, 'Pero en VISTAS: equivale a T2, T1', 'v', 12]])
  ], { q: '¿Qué permite que un plan sea serializable en vistas sin serlo por conflictos?', o: ['Escrituras ciegas', 'Lecturas repetidas', 'Confirmaciones tempranas'], why: 'Las escrituras ciegas (sin lectura previa) crean ciclos en el grafo sin cambiar lo que nadie lee.' },
  ['Vistas: mismas lecturas iniciales, misma relación de lectura y misma escritura final.', 'Conflictos ⇒ vistas, pero no al revés.', 'La diferencia: escrituras ciegas, como V5.']);

  add('p2l4', 'estacion', [
    B('Recuperable: si T j lee lo que escribió T i, T j solo confirma después de que T i confirme. Ejemplo bueno: e1 de X, l2 de X, c1, c2.',
      [['code', 'c', 60, 50, ['e1(X); l2(X); c1; c2']], ['w', 2000], ['ok', 'c'], ['txt', 't', 240, 130, 'T2 confirma DESPUÉS de T1', 'v', 12]]),
    B('No recuperable: e1 de X, l2 de X, c2, y después r1. T2 ya confirmó algo que T1 deshizo, y un COMMIT hecho no se deshace. Un despiche.',
      [['clr'], ['code', 'c', 60, 50, ['e1(X); l2(X); c2; r1']], ['w', 2600], ['no', 'c'], ['txt', 't', 240, 130, 'T2 confirmó un dato que luego se anuló', 'r', 12]]),
    B('Aborto en cascada: si T1 aborta, también abortan quienes leyeron sus datos sin confirmar, y quienes leyeron de esos. Como copiar la tarea: si a su compañero se la anulan, a usted también.',
      [['clr'], ['box', 'd1', 40, 90, 110, 40, 'T1 aborta', 'r'], ['box', 'd2', 185, 90, 110, 40, 'T2 leyó de T1', 'o'], ['box', 'd3', 330, 90, 110, 40, 'T3 leyó de T2', 'o'], ['w', 2400], ['shake', 'd1'], ['w', 500], ['no', 'd2'], ['w', 500], ['no', 'd3']]),
    B('Sin abortos en cascada: solo se leen datos ya confirmados. Y la estricta va más allá: nadie lee ni sobrescribe X hasta que quien lo escribió confirme o aborte. Estricta implica sin cascadas, y sin cascadas implica recuperable.',
      [['clr'], ['box', 'e', 40, 90, 120, 44, 'Estricta', 'g'], ['box', 's', 185, 90, 120, 44, 'Sin cascadas', 'b'], ['box', 'r', 330, 90, 120, 44, 'Recuperable', 'v'], ['arrow', 'a1', 162, 112, 183, 112, 'w', ''], ['arrow', 'a2', 307, 112, 328, 112, 'w', '']])
  ], { q: 'En e1(X); l2(X); c2; r1, ¿qué problema hay?', o: ['No es recuperable', 'Hay un interbloqueo', 'Es estricta'], why: 'T2 confirmó leyendo un dato de T1, y después T1 abortó. Ese COMMIT ya no se puede deshacer.' },
  ['Recuperable: quien lee confirma después de quien escribió.', 'Cascada: un aborto arrastra a quienes leyeron sin confirmar.', 'Estricta ⇒ sin cascadas ⇒ recuperable.']);

  add('p2l5', 'estacion', [
    B('Bloqueos. Compartido, S, para leer: varios lectores conviven. Exclusivo, X, para escribir: con ese nadie más entra. S con S es compatible; todo lo demás espera.',
      [['tbl', 't', 90, 50, [120, 100, 100], [['tiene \\ pide', 'S', 'X'], ['S (compartido)', 'Compatible', 'Espera'], ['X (exclusivo)', 'Espera', 'Espera']]], ['spr', 'l', 'lock', 220, 160, 4]]),
    B('Bloqueo en dos fases: primero la fase de crecimiento, donde solo adquiere bloqueos. Después la de contracción, donde solo libera. Si todas lo siguen, el plan es serializable por conflictos.',
      [['clr'], ['arrow', 'up', 60, 190, 230, 60, 'v', 'crecimiento: adquiere'], ['w', 2600], ['arrow', 'down', 240, 60, 420, 190, 'o', 'contracción: libera'], ['txt', 't', 240, 215, 'B2F / 2PL', 'g', 13]]),
    B('Interbloqueo: T1 tiene A y espera B; T2 tiene B y espera A. Dos carros en un puente de una vía, y nadie retrocede. SQL Server escoge una víctima y le tira el error mil doscientos cinco.',
      [['clr'], ['spr', 'a', 'train', 90, 110, 4], ['spr', 'b', 'train', 330, 110, 4], ['mv', 'a', 170, 110, 900], ['mv', 'b', 250, 110, 900], ['w', 1000], ['sfx', 'hit'], ['shake', 'a'], ['shake', 'b'], ['txt', 'w', 240, 60, 'Espera circular', 'o', 13], ['w', 3200], ['box', 'e', 150, 170, 180, 34, 'ERROR 1205 · víctima', 'r'], ['mv', 'b', 380, 110, 700]]),
    B('Con SET LOCK_TIMEOUT quince mil, espera hasta quince segundos; menos uno significa sin límite. Si el tiempo se agota, sale el error mil doscientos veintidós.',
      [['clr'], ['code', 'c', 70, 50, ['SET LOCK_TIMEOUT 15000;  -- 15 s', 'SET LOCK_TIMEOUT -1;     -- sin límite']], ['w', 2600], ['spr', 'k', 'clock', 220, 130, 4], ['box', 'e', 150, 190, 180, 30, 'ERROR 1222', 'o']])
  ], { q: 'Dos transacciones esperan cada una el recurso que retiene la otra. ¿Qué error recibe la víctima en SQL Server?', o: ['1205', '1222', 'Ninguno: esperan para siempre'], why: 'Es un interbloqueo: SQL Server elige una víctima y le devuelve el error 1205. El 1222 es por LOCK_TIMEOUT.' },
  ['S con S convive; X choca con todo.', '2PL: primero solo adquiere, después solo libera.', 'Deadlock → error 1205. LOCK_TIMEOUT agotado → error 1222.']);

  add('p2l6', 'estacion', [
    B('Marcas de tiempo: cada transacción recibe un número al iniciar, como la ficha del banco. Cada dato recuerda la mayor marca que lo leyó y la mayor que lo escribió.',
      [['box', 'f1', 60, 50, 110, 40, 'T1 · TS 5', 'b'], ['box', 'f2', 60, 110, 110, 40, 'T2 · TS 10', 'o'], ['box', 'x', 260, 70, 180, 60, 'X\nR_TS · W_TS', 'g']]),
    B('Para leer: si su marca es menor que la marca de escritura del dato, la transacción se aborta. Para escribir: se aborta si alguien más nuevo ya lo leyó o lo escribió.',
      [['clr'], ['box', 'r', 30, 60, 420, 34, 'Leer:  TS(T) < W_TS(X) → abortar', 'b'], ['w', 3000], ['box', 'e', 30, 110, 420, 34, 'Escribir:  TS(T) < R_TS(X) o < W_TS(X) → abortar', 'o']]),
    B('Ejemplo: T1 tiene marca cinco y T2 marca diez. T2 escribe X, así que la marca de escritura de X queda en diez. T1 intenta leer X: cinco es menor que diez, y T1 se aborta. A sacar ficha nueva.',
      [['clr'], ['box', 'f2', 40, 60, 120, 40, 'T2 (10) escribe X', 'o'], ['box', 'x', 200, 60, 120, 40, 'W_TS(X) = 10', 'g'], ['w', 3800], ['box', 'f1', 40, 130, 120, 40, 'T1 (5) lee X', 'b'], ['w', 1500], ['no', 'f1'], ['txt', 't', 360, 150, '5 < 10 → aborta', 'r', 12]]),
    B('SNAPSHOT es otra idea: la transacción trabaja con una foto de los datos. A lee diez dentro de su instantánea, aunque B confirme cuatro. En READ COMMITTED, en cambio, A puede ver dos valores confirmados distintos, como el diez y luego el seis de la actividad tres.',
      [['clr'], ['spr', 'cam', 'phone', 80, 90, 4], ['box', 's', 170, 60, 270, 40, 'SNAPSHOT: A sigue viendo 10', 'v'], ['w', 3500], ['box', 'rc', 170, 130, 270, 40, 'READ COMMITTED: 10 y luego 6', 'o']])
  ], { q: 'TS(T1) = 5 y W_TS(X) = 10. T1 quiere leer X. ¿Qué pasa?', o: ['T1 se aborta', 'T1 lee y R_TS(X) = 5', 'T1 espera a que X se libere'], why: 'Leer exige TS(T) ≥ W_TS(X). Como 5 < 10, alguien más nuevo ya escribió X y T1 se aborta.' },
  ['Cada transacción tiene una marca; cada dato guarda R_TS y W_TS.', 'Si una transacción vieja toca algo que ya tocó una más nueva, se aborta.', 'SNAPSHOT: lee una foto consistente de los datos.']);

  /* ------------------------- FASE 3 · Guía #10 ------------------------ */
  add('p3l1', 'boveda', [
    B('Respaldo: una copia de la base en un momento dado. Recuperación: devolver la base a un estado coherente después de una falla, usando los respaldos y los logs.',
      [['spr', 'd', 'db', 80, 90, 4], ['arrow', 'a', 140, 110, 300, 110, 'b', 'BACKUP'], ['spr', 'c', 'box2', 320, 90, 4]]),
    B('Hay tres tipos de falla. De transacción: se aborta por un error lógico o por violar una restricción.',
      [['clr'], ['box', 't', 30, 60, 130, 70, 'TRANSACCIÓN\nerror lógico', 'o']]),
    B('Del sistema: el servidor se cae o se reinicia de golpe. Y del disco: se pierden datos por un fallo del almacenamiento físico, como el celular que se le cae al mar.',
      [['box', 's', 175, 60, 130, 70, 'SISTEMA\nse cae el server', 'p'], ['w', 2600], ['box', 'd', 320, 60, 130, 70, 'DISCO\nfalla física', 'r'], ['spr', 'ph', 'phone', 360, 160, 3], ['mv', 'ph', 360, 205, 900]]),
    B('Por eso se respalda antes, no después. Después es llorar, mae.',
      [['clr'], ['spr', 'g', 'guide', 200, 110, 4], ['bub', 'g', 'Respalde HOY.']])
  ], { q: 'Se daña físicamente el disco donde estaban los datos. ¿Qué tipo de falla es?', o: ['Del disco', 'Del sistema', 'De transacción'], why: 'Es pérdida de datos por un fallo del almacenamiento físico.' },
  ['Respaldo: copia en un momento dado. Recuperación: volver a un estado coherente.', 'Fallas: de transacción, del sistema y del disco.']);

  add('p3l2', 'boveda', [
    B('Tres tipos de respaldo. FULL guarda toda la base. Es la mudanza completa, y la base de cualquier restauración.',
      [['box', 'f', 30, 60, 130, 60, 'FULL\ntoda la BD', 'b']]),
    B('DIFFERENTIAL guarda los cambios desde el último FULL: lo que compró desde la mudanza. Necesita un FULL previo.',
      [['box', 'd', 175, 60, 130, 60, 'DIFFERENTIAL\ndesde el último FULL', 'p']]),
    B('LOG guarda los cambios desde el último LOG, como el recibo de cada compra. Es el más pequeño, permite volver a un punto exacto, y exige modelo de recuperación FULL o BULK LOGGED.',
      [['box', 'l', 320, 60, 130, 60, 'LOG\ndesde el último LOG', 'g']]),
    B('Para restaurar: el último FULL, luego el último diferencial posterior, y después todos los LOG que vengan, en orden, sin saltarse ninguno.',
      [['clr'], ['box', 'F', 20, 80, 60, 36, 'F1', 'b'], ['box', 'L1', 95, 80, 60, 36, 'L1', 'g'], ['box', 'D', 170, 80, 60, 36, 'D1', 'p'], ['box', 'L2', 245, 80, 60, 36, 'L2', 'g'], ['box', 'L3', 320, 80, 60, 36, 'L3', 'g'], ['spr', 'x', 'bolt', 405, 82, 3], ['w', 2200], ['hl', 'F'], ['w', 800], ['hl', 'D'], ['w', 800], ['hl', 'L2'], ['w', 600], ['hl', 'L3'], ['txt', 't', 240, 170, 'F1 → D1 → L2 → L3', 'v', 14]])
  ], { q: 'Orden: F1, L1, D1, L2, L3 y luego la falla. ¿Qué cadena restaura hasta la falla?', o: ['F1 → D1 → L2 → L3', 'F1 → D1 → L3', 'F1 → L1 → D1'], why: 'Último FULL, el último diferencial posterior y todos los LOG que siguen, sin saltarse ninguno.' },
  ['FULL: todo. DIFFERENTIAL: desde el último FULL. LOG: desde el último LOG.', 'LOG exige modelo FULL o BULK_LOGGED.', 'Restaurar: último FULL + último DIFF + todos los LOG siguientes.']);

  add('p3l3', 'boveda', [
    B('BACKUP DATABASE hacia un disco. Si no dice el tipo, se asume FULL. Para diferencial se agrega WITH DIFFERENTIAL, y para el log se usa BACKUP LOG.',
      [['code', 'c', 30, 40, ["BACKUP DATABASE Banco TO DISK = 'b.bak'", "BACKUP DATABASE Banco TO DISK = 'b.bak'", '   WITH DIFFERENTIAL', "BACKUP LOG Banco TO DISK = 'b.trn'"]]]),
    B('FORMAT crea un conjunto de medios nuevo y deja inservibles los respaldos anteriores de ese destino. Es comprar un cuaderno nuevo.',
      [['clr'], ['spr', 'n', 'doc', 80, 80, 4], ['box', 'f', 170, 70, 270, 50, 'FORMAT: medio nuevo,\nlo anterior no sirve', 'r']]),
    B('INIT sobrescribe los conjuntos de respaldo, pero conserva el encabezado del medio: arrancar las hojas y dejar la portada. Con FORMAT, ponerle INIT sobra.',
      [['box', 'i', 170, 140, 270, 50, 'INIT: sobrescribe,\nconserva el encabezado', 'v']]),
    B('Y sp_addumpdevice agrega un dispositivo de copias de seguridad, para no escribir la ruta cada vez.',
      [['clr'], ['code', 'c', 40, 80, ["EXEC sp_addumpdevice 'disk', 'Respaldos',", "     'C:\\respaldos\\banco.bak';"]]])
  ], { q: 'Quiere sobrescribir los respaldos del archivo, pero conservar el encabezado del medio. ¿Qué opción usa?', o: ['INIT', 'FORMAT', 'DIFFERENTIAL'], why: 'INIT sobrescribe los conjuntos y conserva el encabezado; FORMAT crea un medio nuevo.' },
  ['Sin tipo, BACKUP DATABASE es FULL.', 'FORMAT: medio nuevo. INIT: sobrescribe y conserva el encabezado.', 'sp_addumpdevice agrega un dispositivo de respaldo.']);

  add('p3l4', 'boveda', [
    B('Seguridad. Autenticación comprueba quién es usted; autorización decide qué puede hacer. El guarda revisa la cédula, y su tarjeta solo abre su piso.',
      [['spr', 'g', 'guide', 80, 110, 4], ['box', 'a', 160, 50, 280, 40, 'Autenticación: ¿quién es?', 'b'], ['w', 2300], ['box', 'z', 160, 110, 280, 40, 'Autorización: ¿qué puede hacer?', 'g'], ['spr', 'k', 'key', 300, 175, 3]]),
    B('Los permisos se dan con GRANT, se niegan con DENY y se retiran con REVOKE, agrupados en roles con mínimo privilegio: nadie recibe más de lo que necesita.',
      [['clr'], ['code', 'c', 60, 50, ['GRANT SELECT ON Notas TO rol_profe;', 'DENY  DELETE ON Notas TO rol_estudiante;', 'REVOKE UPDATE ON Notas FROM ana;']]]),
    B('RLS, seguridad por fila: los predicados de filtrado deciden qué filas ve cada quien, y los de bloqueo impiden escrituras que violen la política. El enmascaramiento dinámico solo cambia cómo se muestra el dato: el valor guardado sigue igual.',
      [['clr'], ['box', 'r', 30, 50, 200, 60, 'RLS\nfiltra filas', 'b'], ['box', 'm', 250, 50, 200, 60, 'DDM\nana@mail.com → a***@mail.com', 'p']]),
    B('El cifrado de columna protege el contenido con una clave; en el caso, AES doscientos cincuenta y seis protegida por un certificado. Y la auditoría registra quién hizo qué, como las cámaras del edificio.',
      [['box', 'c', 30, 130, 200, 60, 'Cifrado\nAES-256 + certificado', 'g'], ['w', 3000], ['box', 'u', 250, 130, 200, 60, 'Auditoría\nquién hizo qué', 'o']])
  ], { q: 'Un usuario ve el correo como a***@mail.com, pero en la tabla está completo. ¿Qué mecanismo es?', o: ['DDM', 'Cifrado de columna', 'RLS'], why: 'El enmascaramiento dinámico cambia cómo se presenta el dato; el valor almacenado no cambia.' },
  ['Autenticación: identidad. Autorización: permisos (GRANT, DENY, REVOKE).', 'RLS filtra filas; DDM enmascara sin cambiar el dato.', 'Cifrado protege el contenido; auditoría registra acciones.']);

  add('p3l5', 'boveda', [
    B('Contenedores. La imagen es la receta: empaqueta el motor y sus dependencias. El contenedor es el plato servido: procesos aislados que comparten el kernel del anfitrión. Una máquina virtual, en cambio, trae su propio sistema operativo.',
      [['spr', 'i', 'doc', 70, 80, 4], ['txt', 'ti', 90, 60, 'IMAGEN', 'b', 11], ['arrow', 'a', 130, 100, 230, 100, 'w', 'docker run'], ['spr', 'c', 'cup', 250, 80, 4], ['txt', 'tc', 270, 60, 'CONTENEDOR', 'g', 11]]),
    B('Si borra el contenedor, se pierde su capa de escritura. Para que los datos sobrevivan se usa un volumen nombrado, o un bind mount a una carpeta del host. Es la refri: bota el plato, y la comida guardada sigue ahí.',
      [['fade', 'c'], ['w', 1500], ['box', 'v', 300, 140, 150, 50, 'VOLUMEN\nlos datos siguen', 'v'], ['spr', 'd', 'db', 250, 140, 3]]),
    B('Puertos: con el mapeo quince mil cuatrocientos treinta y tres a mil cuatrocientos treinta y tres, el cliente de afuera usa el quince mil cuatrocientos treinta y tres del host, y SQL Server escucha en el mil cuatrocientos treinta y tres del contenedor.',
      [['clr'], ['box', 'h', 30, 80, 160, 60, 'HOST\n:15433', 'b'], ['box', 'k', 290, 80, 160, 60, 'CONTENEDOR\n:1433', 'g'], ['arrow', 'p', 192, 110, 288, 110, 'w', '-p 15433:1433']]),
    B('Dentro de una red compartida, los contenedores se hablan por el nombre del servicio y el puerto interno. Y para respaldar: BACKUP en SQL Server, mysqldump en MySQL, y mongodump en MongoDB.',
      [['clr'], ['code', 'c', 60, 60, ['SQL Server → BACKUP / RESTORE', 'MySQL      → mysqldump', 'MongoDB    → mongodump / mongorestore']]])
  ], { q: 'Con -p 15433:1433, ¿a qué puerto se conecta un cliente desde fuera?', o: ['15433', '1433', 'A cualquiera de los dos'], why: 'El primer número es el puerto del host; el segundo, el puerto donde escucha SQL Server dentro del contenedor.' },
  ['Imagen: receta. Contenedor: instancia aislada que comparte el kernel.', 'Volumen o bind mount: los datos sobreviven al contenedor.', 'host:contenedor, como 15433:1433.']);

  /* ------------------------- FASE 4 · Guía #11 ------------------------ */
  add('p4l1', 'mercado', [
    B('Optimizar es que el motor escoja la forma más barata de responder una consulta: menos tiempo, y menos CPU, disco y memoria. Como Waze escogiendo la ruta más corta.',
      [['spr', 'p', 'phone', 210, 80, 5], ['txt', 't', 240, 200, 'Menor costo estimado', 'g', 13]]),
    B('Los pasos: análisis sintáctico y semántico, reescritura, generación de planes, evaluación del costo, y selección del plan de menor costo estimado.',
      [['clr'], ['box', 'a', 10, 90, 86, 44, 'Análisis', 'b'], ['box', 'b', 104, 90, 86, 44, 'Reescritura', 'b'], ['box', 'c', 198, 90, 86, 44, 'Planes', 'b'], ['box', 'd', 292, 90, 86, 44, 'Costo', 'o'], ['box', 'e', 386, 90, 86, 44, 'Elegir', 'v']]),
    B('La optimización heurística usa reglas generales, como filtrar lo antes posible. La basada en costos estima con estadísticas: cardinalidad, selectividad y número de bloques.',
      [['clr'], ['box', 'h', 30, 60, 200, 70, 'HEURÍSTICA\nreglas: filtrar primero', 'p'], ['box', 'k', 250, 60, 200, 70, 'BASADA EN COSTOS\nestadísticas', 'g']]),
    B('Ejemplo de los vinos: quinientos vinos y mil doscientas cosechas, pero solo cien cosechas tienen cantidad mayor que cien. Si filtra primero y después hace el join, trabaja con cien filas en vez de mil doscientas. Así sí.',
      [['clr'], ['box', 'v', 30, 50, 130, 40, 'Vinos: 500', 'b'], ['box', 'c', 30, 110, 130, 40, 'Cosechas: 1200', 'o'], ['w', 3400], ['arrow', 'f', 162, 130, 250, 130, 'g', 'cantidad > 100'], ['box', 'r', 255, 110, 120, 40, '100 filas', 'v'], ['w', 1500], ['txt', 't', 240, 200, 'selección → join → proyección', 'v', 12]])
  ], { q: 'En el ejemplo de los vinos, filtrar Cosechas antes del JOIN aplica la regla de...', o: ['Reducir filas lo antes posible', 'Proyectar todo al inicio', 'Hacer el producto primero'], why: 'La heurística dice aplicar primero las condiciones de selección: el JOIN trabaja con 100 filas y no con 1200.' },
  ['Optimizar: el SGBD elige el plan de menor costo.', 'Heurística: reglas. Basada en costos: estadísticas.', 'Filtrar temprano reduce el trabajo.']);

  add('p4l2', 'mercado', [
    B('Estrategias para consultas rápidas. Índices en las columnas que usa en WHERE, JOIN y ORDER BY, y compuestos si filtra por varias. Es la guía telefónica ordenada por apellido.',
      [['spr', 'b', 'doc', 60, 80, 4], ['code', 'c', 150, 70, ['CREATE INDEX idx_apellido', '  ON Clientes(apellido);']]]),
    B('Pero ojo: si aplica una función a la columna indexada, como YEAR de fecha igual a dos mil veinticuatro, el índice no se puede usar. Mejor: fecha entre el primero de enero y el treinta y uno de diciembre.',
      [['clr'], ['code', 'bad', 40, 50, ['WHERE YEAR(fecha) = 2024']], ['w', 2600], ['no', 'bad'], ['w', 1600], ['code', 'good', 40, 120, ["WHERE fecha BETWEEN '2024-01-01'", "                AND '2024-12-31'"]], ['ok', 'good']]),
    B('Evite SELECT asterisco: pida solo las columnas que necesita. Para subconsultas con muchas filas, EXISTS en lugar de IN, y JOIN en vez de subconsultas correlacionadas cuando se pueda.',
      [['clr'], ['box', 'a', 30, 50, 200, 40, 'SELECT *', 'r'], ['box', 'b', 250, 50, 200, 40, 'SELECT nombre, precio', 'v'], ['w', 2600], ['box', 'c', 30, 120, 200, 40, 'IN (subconsulta)', 'o'], ['box', 'd', 250, 120, 200, 40, 'EXISTS (subconsulta)', 'v']]),
    B('Filtre temprano, empiece los JOIN por las tablas más pequeñas, y quite DISTINCT, ORDER BY o UNION que no hagan falta. Cada chunche extra cuesta.',
      [['clr'], ['spr', 'p', 'tip', 220, 90, 4], ['bub', 'p', 'Menos chunches, más rápido.']])
  ], { q: '¿Cuál condición deja usar un índice sobre fecha?', o: ["fecha BETWEEN '2024-01-01' AND '2024-12-31'", "YEAR(fecha) BETWEEN 2024 AND 2024", "YEAR(fecha) = 2024 AND fecha IS NOT NULL"], why: 'Aplicar YEAR() a la columna impide usar su índice; el rango sobre la columna sí lo permite.' },
  ['Índices en columnas de WHERE, JOIN y ORDER BY.', 'Nada de funciones sobre la columna indexada: use rangos.', 'Evite SELECT *, prefiera EXISTS y filtre temprano.']);

  add('p4l3', 'mercado', [
    B('Para medir: SET STATISTICS IO ON dice cuántas lecturas hace la consulta, y SET STATISTICS TIME ON, el tiempo de CPU y de ejecución.',
      [['code', 'c', 50, 60, ['SET STATISTICS IO ON;    -- lecturas', 'SET STATISTICS TIME ON;  -- CPU y tiempo']]]),
    B('DBCC SHOW_STATISTICS muestra los detalles de un índice y su histograma. UPDATE STATISTICS las actualiza, para que el optimizador estime mejor.',
      [['clr'], ['code', 'c', 30, 50, ["DBCC SHOW_STATISTICS('Empleados','idx_fecha');", 'UPDATE STATISTICS Empleados;']]]),
    B('Control M en SSMS activa el plan de ejecución real: operadores, costo relativo, y si usa índices. Scan lee todo el libro; Seek va directo a la página.',
      [['clr'], ['box', 's', 30, 70, 200, 60, 'SCAN\nlee todo', 'r'], ['box', 'k', 250, 70, 200, 60, 'SEEK\nva directo', 'v'], ['txt', 't', 240, 170, 'Ctrl + M = plan real', 'g', 13]]),
    B('Tras crear un índice en la fecha de contratación, la consulta con BETWEEN puede pasar de Scan a Index Seek. Pero los índices cobran: aceleran las lecturas y le agregan costo a las escrituras.',
      [['clr'], ['code', 'c', 40, 50, ['CREATE INDEX idx_fecha', '  ON Empleados(fecha_contratacion);']], ['w', 2600], ['box', 'a', 40, 130, 180, 40, 'Index Scan', 'r'], ['arrow', 'x', 222, 150, 258, 150, 'w', ''], ['box', 'b', 260, 130, 180, 40, 'Index Seek', 'v'], ['w', 2500], ['txt', 't', 240, 210, 'Ojo: las escrituras se vuelven más caras', 'o', 11]])
  ], { q: '¿Qué comando muestra cuántas lecturas hace una consulta?', o: ['SET STATISTICS IO ON', 'SET STATISTICS TIME ON', 'UPDATE STATISTICS'], why: 'IO mide lecturas; TIME mide CPU y tiempo; UPDATE STATISTICS solo actualiza las estimaciones.' },
  ['STATISTICS IO: lecturas. STATISTICS TIME: CPU y tiempo.', 'Ctrl + M: plan real. Scan lee todo; Seek va directo.', 'Los índices aceleran lecturas, pero encarecen escrituras.']);

  add('p4l4', 'mercado', [
    B('Un ORM traduce operaciones sobre objetos a consultas SQL. Muy cómodo, hasta que aparece el famoso N más uno.',
      [['box', 'o', 40, 80, 150, 50, 'objetos', 'b'], ['arrow', 'a', 192, 105, 288, 105, 'w', 'ORM'], ['spr', 'd', 'db', 320, 80, 4]]),
    B('N más uno: lista diez clientes con una consulta, y luego hace una consulta más por cada cliente para traer sus pedidos. Once consultas. Es ir a la pulpe diez veces por diez cosas.',
      [['clr'], ['spr', 'd', 'db', 380, 90, 4], ['spr', 'k', 'kai', 60, 100, 4], ['txt', 'n', 240, 40, '1 + 10 = 11 consultas', 'r', 14], ['mv', 'k', 330, 100, 600], ['mv', 'k', 60, 100, 600], ['mv', 'k', 330, 100, 600], ['mv', 'k', 60, 100, 600], ['mv', 'k', 330, 100, 600], ['mv', 'k', 60, 100, 600]]),
    B('La solución es la carga anticipada: Include en EF Core, select related o prefetch related en Django, JOIN FETCH en Spring y with en Laravel. Una lista, un solo viaje.',
      [['clr'], ['tbl', 't', 60, 40, [170, 190], [['Tecnología', 'Carga anticipada'], ['EF Core', 'Include'], ['Django', 'select_related / prefetch'], ['Spring Boot', 'JOIN FETCH'], ['Laravel', 'with']]]]),
    B('Concurrencia: la optimista revisa al guardar que la versión no cambió; en EF Core, con RowVersion, y si cambió lanza DbUpdateConcurrencyException. La pesimista bloquea la fila mientras trabaja.',
      [['clr'], ['box', 'o', 30, 60, 200, 70, 'OPTIMISTA\nrevisa la versión al guardar', 'v'], ['box', 'p', 250, 60, 200, 70, 'PESIMISTA\nbloquea la fila', 'o'], ['spr', 'l', 'lock', 330, 150, 3]])
  ], { q: 'Lista 20 pedidos y, por cada uno, consulta su cliente aparte. ¿Cuántas consultas hace?', o: ['21', '20', '2'], why: 'Una para la lista más una por cada pedido: N + 1 = 21.' },
  ['N + 1: una consulta para la lista y una más por cada registro.', 'Solución: carga anticipada (Include, select_related, JOIN FETCH, with).', 'Optimista: verifica la versión. Pesimista: bloquea.']);

  add('p4l5', 'mercado', [
    B('Una caché guarda copias temporales de lo más pedido, para responder rápido y leer menos de la base. Pero el dato oficial sigue en la base principal.',
      [['spr', 'e', 'erika', 140, 110, 4], ['spr', 'c1', 'cup', 210, 140, 3], ['spr', 'c2', 'cup', 240, 140, 3], ['spr', 'd', 'db', 360, 90, 4], ['txt', 't', 380, 70, 'BASE', 'b', 11]]),
    B('El de mango es el más pedido, mi amor: ya lo tengo servido en la vitrina. Si me piden uno raro, lo preparo en el momento y dejo otro listo por si acaso.',
      [['bub', 'e', '¡Ya está servido!'], ['ok', 'c1'], ['w', 3200], ['bub', 'e', 'Uno raro... ya se lo preparo.'], ['spr', 'c3', 'cup', 270, 140, 3]], 'e'),
    B('Eso es cache aside: la app pregunta primero a Redis. Si está, es un hit, y responde con la copia. Si no está, es un miss: consulta la base, responde, y guarda una copia con TTL. Y cuando cambia el precio en la base, se borra la clave.',
      [['clr'], ['box', 'a', 20, 90, 90, 40, 'APP', 'b'], ['box', 'r', 190, 90, 100, 40, 'REDIS', 'r'], ['box', 'd', 370, 90, 90, 40, 'BASE', 'b'], ['arrow', 'x', 112, 105, 188, 105, 'v', 'hit'], ['w', 3200], ['arrow', 'y', 292, 125, 368, 125, 'o', 'miss'], ['w', 2600], ['txt', 't', 240, 190, 'miss → guardar copia con TTL', 'g', 12]]),
    B('Tasa de aciertos: hits entre hits más misses, por cien. Ochenta hits y veinte misses: ochenta por ciento. Ciento veinte milisegundos directo a la base, contra dos a cinco desde Redis. Eso sí: si cada solicitud pide algo distinto, la caché ayuda poco.',
      [['clr'], ['box', 'f', 60, 50, 360, 40, 'hits ÷ (hits + misses) × 100', 'g'], ['w', 2500], ['box', 'e', 60, 110, 360, 40, '80 ÷ (80 + 20) × 100 = 80 %', 'v'], ['w', 2600], ['txt', 't', 240, 200, '120 ms (SGBD) vs 2-5 ms (Redis)', 'b', 12]])
  ], { q: 'Hubo 30 hits y 10 misses. ¿Cuál es la tasa de aciertos?', o: ['75 %', '30 %', '25 %'], why: '30 ÷ (30 + 10) × 100 = 75 %.' },
  ['Cache aside: hit devuelve la copia; miss va a la base y guarda copia con TTL.', 'Invalidación: al cambiar el dato, se borra la clave.', 'Tasa de aciertos = hits ÷ (hits + misses) × 100.']);

  add('p4l6', 'mercado', [
    B('Minería de procesos. Un registro de eventos tiene, como mínimo, caso, actividad y marca de tiempo. Como el historial de un pedido de comida.',
      [['tbl', 't', 60, 50, [90, 150, 120], [['caso', 'actividad', 'tiempo'], ['P-17', 'Recibido', '19:02'], ['P-17', 'Preparando', '19:05'], ['P-17', 'En camino', '19:20']]]]),
    B('Antes de analizar: correlacionar cada evento con su caso, normalizar fechas y revisar duplicados. JOIN vincula, UNION ALL reúne tipos de eventos, y LAG o LEAD calculan los intervalos por caso.',
      [['clr'], ['code', 'c', 40, 60, ['JOIN       → vincula', 'UNION ALL  → reúne eventos', 'LAG / LEAD → intervalos por caso']]]),
    B('Descubrimiento reconstruye el proceso. Conformidad lo compara con el esperado: si un pedido salta de Recibido a Entregado, falta un paso. Y mejora agrega tiempos o recursos para hallar cuellos de botella.',
      [['clr'], ['box', 'a', 20, 80, 120, 36, 'Recibido', 'b'], ['box', 'b', 180, 80, 120, 36, 'En camino', 'o'], ['box', 'c', 340, 80, 120, 36, 'Entregado', 'v'], ['w', 3000], ['fade', 'b'], ['arrow', 'x', 142, 140, 338, 140, 'r', '¿y el paso del medio?'], ['txt', 't', 240, 200, 'CONFORMIDAD', 'g', 13]]),
    B('El DFG es el grafo de relaciones directas entre actividades. Una variante es una secuencia completa. Y la calidad del modelo se mide con ajuste, precisión, generalización y simplicidad.',
      [['clr'], ['box', 'q', 60, 70, 360, 60, 'ajuste · precisión ·\ngeneralización · simplicidad', 'p']])
  ], { q: 'Un pedido pasó de Recibido a Entregado sin pasar por En camino. ¿Qué análisis lo detecta?', o: ['Conformidad', 'Descubrimiento', 'Mejora'], why: 'Conformidad compara lo ocurrido con el proceso esperado y detecta pasos omitidos o fuera de orden.' },
  ['Registro de eventos: caso, actividad y marca de tiempo.', 'Descubrimiento, conformidad y mejora.', 'Calidad: ajuste, precisión, generalización y simplicidad.']);

  /* ---------------------- FASE 5 · Guías #12 y #13 --------------------- */
  add('p5l1', 'islas', [
    B('Una base distribuida está físicamente repartida en varios nodos, pero el usuario la ve como una sola. Pregunta si hay arroz, y le responden aunque el dato esté en otra provincia.',
      [['spr', 'n1', 'srv', 60, 60, 3], ['spr', 'n2', 'srv', 210, 40, 3], ['spr', 'n3', 'srv', 360, 60, 3], ['spr', 'k', 'kai', 210, 150, 4], ['bub', 'k', '¿Hay arroz?']]),
    B('Eso se logra con transparencias. De localización: no sabe dónde están los datos. De replicación: no importa cuántas copias hay. De fragmentación: no sabe cómo se dividieron.',
      [['clr'], ['box', 'a', 20, 50, 140, 50, 'Localización', 'b'], ['box', 'b', 170, 50, 140, 50, 'Replicación', 'b'], ['box', 'c', 320, 50, 140, 50, 'Fragmentación', 'b']]),
    B('También de concurrencia, muchos usuarios sin conflictos, y de fallos: sigue funcionando aunque caiga una parte. Homogénea: todos los nodos con el mismo SGBD. Heterogénea: distintos motores y esquemas.',
      [['box', 'd', 95, 120, 140, 50, 'Concurrencia', 'p'], ['box', 'e', 245, 120, 140, 50, 'Fallos', 'p'], ['w', 3600], ['txt', 't', 240, 205, 'Homogénea = mismo SGBD · Heterogénea = distintos', 'g', 11]]),
    B('Ventajas: disponibilidad, rendimiento por cercanía y escalabilidad. Desventajas: más complejidad, costos de comunicación, y la consistencia cuesta más. Nada es gratis, mae.',
      [['clr'], ['box', 'v', 30, 60, 200, 80, 'VENTAJAS\ndisponibilidad\nescalabilidad', 'v'], ['box', 'x', 250, 60, 200, 80, 'DESVENTAJAS\ncomplejidad\ncomunicación', 'r']])
  ], { q: 'El usuario consulta sin saber en qué servidor está el dato. ¿Qué transparencia es?', o: ['De localización', 'De replicación', 'De fragmentación'], why: 'La transparencia de localización oculta dónde están físicamente los datos.' },
  ['BDD: varios nodos, una sola base para el usuario.', 'Transparencias: localización, replicación, fragmentación, concurrencia y fallos.', 'Homogénea: mismo SGBD. Heterogénea: distintos.']);

  add('p5l2', 'islas', [
    B('Fragmentar es dividir una tabla entre nodos. Horizontal: se reparten las filas, por ejemplo clientes por país. Cada profe tiene la lista de sus estudiantes.',
      [['tbl', 't', 60, 40, [120, 120, 120], [['id', 'nombre', 'país'], ['1', 'Ana', 'CR'], ['2', 'Luis', 'PA'], ['3', 'Sofía', 'CR']]], ['w', 2600], ['row', 't', 1], ['w', 500], ['row', 't', 3], ['txt', 'h', 240, 190, 'HORIZONTAL: filas por país', 'b', 12]]),
    B('Vertical: se reparten las columnas, con los datos personales en un nodo y los financieros en otro. Mixta: una combinación de ambas.',
      [['clr'], ['box', 'a', 40, 60, 180, 70, 'Nodo 1\nnombre · teléfono', 'b'], ['box', 'b', 260, 60, 180, 70, 'Nodo 2\ncobros · saldo', 'g'], ['txt', 'h', 240, 170, 'VERTICAL: columnas', 'g', 12]]),
    B('Replicación: total, cada nodo tiene copia completa; parcial, solo algunas partes; y sin replicación, cada dato vive en un solo nodo.',
      [['clr'], ['box', 'a', 20, 70, 140, 60, 'Total\ncopia completa', 'v'], ['box', 'b', 170, 70, 140, 60, 'Parcial\nalgunas partes', 'o'], ['box', 'c', 320, 70, 140, 60, 'Sin replicación\nun solo nodo', 'r']]),
    B('Los fallos pueden ser de nodo, de red, de software o de disco. Se enfrentan con logs distribuidos, protocolos de recuperación y réplicas redundantes.',
      [['clr'], ['spr', 'n1', 'srv', 100, 80, 3], ['spr', 'n2', 'srv', 330, 80, 3], ['spr', 'b', 'bolt', 225, 90, 3], ['shake', 'n2']])
  ], { q: 'Los clientes de Costa Rica quedan en un nodo y los de Panamá en otro. ¿Qué fragmentación es?', o: ['Horizontal', 'Vertical', 'Mixta'], why: 'Se reparten filas completas según una condición (el país): fragmentación horizontal.' },
  ['Horizontal: filas. Vertical: columnas. Mixta: ambas.', 'Replicación total, parcial o sin replicación.', 'Fallos: nodo, red, software y disco.']);

  add('p5l3', 'islas', [
    B('En un entorno distribuido, ACID se apoya en el bloqueo distribuido, el control multiversión y el protocolo de confirmación en dos fases, two phase commit.',
      [['spr', 'c', 'guide', 220, 50, 4], ['spr', 'n1', 'srv', 80, 140, 3], ['spr', 'n2', 'srv', 220, 150, 3], ['spr', 'n3', 'srv', 360, 140, 3]]),
    B('Fase uno, preparar: el coordinador le pregunta a cada nodo si puede confirmar. Como organizar un paseo: ¿pueden ir?',
      [['bub', 'c', '¿Pueden confirmar?'], ['w', 2000], ['bub', 'n1', 'Sí'], ['bub', 'n2', 'Sí'], ['bub', 'n3', 'Sí']]),
    B('Fase dos: si todos dicen que sí, se confirma en todos. Si uno solo no puede, se deshace en todos. Así se conserva la atomicidad.',
      [['ok', 'n1'], ['ok', 'n2'], ['ok', 'n3'], ['w', 2600], ['bub', 'n3', 'No puedo'], ['no', 'n1'], ['no', 'n2'], ['no', 'n3'], ['txt', 't', 240, 215, 'Uno no puede → se deshace en todos', 'r', 12]]),
    B('En SQL Server Express se practica con servidores vinculados. Requisitos: varias instancias, TCP IP activo, acceso remoto por el puerto mil cuatrocientos treinta y tres, y autenticación mixta.',
      [['clr'], ['box', 'r', 60, 50, 360, 100, 'Servidores vinculados\n· varias instancias · TCP/IP\n· puerto 1433 · autenticación mixta', 'b']])
  ], { q: 'En la fase de preparar, un nodo responde que no puede. ¿Qué pasa?', o: ['Se deshace en todos', 'Se confirma donde sí se pudo', 'Se reintenta solo en ese nodo'], why: '2PC conserva la atomicidad: si un nodo no puede prepararse, la transacción se deshace en todos.' },
  ['2PC: fase 1 preparar; fase 2 confirmar o deshacer.', 'Un solo "no" deshace la transacción en todos los nodos.', 'Servidores vinculados: instancias, TCP/IP, puerto 1433 y autenticación mixta.']);

  add('p5l4', 'islas', [
    B('MongoDB es NoSQL de documentos: guarda JSON en formato binario, BSON, agrupados en colecciones. Cada documento lleva un id único.',
      [['code', 'c', 60, 50, ['{', '  _id: ObjectId("..."),', '  nombre: "Ariel",', '  edad: 22', '}']], ['txt', 't', 360, 70, 'colección', 'g', 12]]),
    B('Esquema flexible: cada ficha puede traer campos distintos. SQL Server, en cambio, es un formulario de casillas fijas: tablas con esquema rígido y llaves foráneas.',
      [['clr'], ['box', 'm', 30, 60, 200, 80, 'MongoDB\nfichas con campos\ndistintos', 'v'], ['box', 's', 250, 60, 200, 80, 'SQL Server\ncasillas fijas', 'b']]),
    B('Mongo escala horizontalmente y usa réplicas. Su lenguaje es MQL, y Compass es su entorno gráfico. Tiene transacciones desde la versión cuatro, con restricciones. Procedimientos almacenados nativos, no tiene.',
      [['clr'], ['code', 'c', 60, 60, ['Lenguaje: MQL', 'GUI: Compass', 'Transacciones: desde v4.0', 'Procedimientos: no nativos']]]),
    B('SQL Server usa T SQL, archivos MDF y LDF, y SSMS. Es lo típico en ERP, banca y contabilidad.',
      [['clr'], ['spr', 'd', 'db', 200, 80, 4], ['txt', 't', 240, 190, 'T-SQL · MDF/LDF · SSMS', 'b', 12]])
  ], { q: '¿Cómo se llaman los grupos de documentos en MongoDB?', o: ['Colecciones', 'Tablas', 'Esquemas'], why: 'MongoDB agrupa documentos BSON en colecciones.' },
  ['MongoDB: documentos BSON en colecciones, esquema flexible.', 'MQL como lenguaje; Compass como GUI.', 'SQL Server: tablas con esquema rígido y T-SQL.']);

  add('p5l5', 'islas', [
    B('MQL. use ucr db selecciona la base. insertOne mete un documento, e insertMany varios. find sin filtro trae todo; find con nombre Ariel filtra por igualdad.',
      [['code', 'c', 40, 40, ['use ucr_db', 'db.estudiantes.insertOne({...})', 'db.estudiantes.find()', 'db.estudiantes.find({ nombre: "Ariel" })']]]),
    B('Comparaciones con el signo de dólar: gt, mayor que; lt, menor que; gte, mayor o igual; lte, menor o igual; y ne, distinto. Edad con gt veinticinco: mayores de veinticinco.',
      [['clr'], ['tbl', 't', 100, 40, [100, 160], [['operador', 'significa'], ['$gt', 'mayor que'], ['$lt', 'menor que'], ['$gte', 'mayor o igual'], ['$lte', 'menor o igual'], ['$ne', 'distinto']]]]),
    B('Si pone dos campos en el mismo filtro, es un AND implícito. Para OR, se escribe explícito con dólar or y una lista de condiciones.',
      [['clr'], ['code', 'a', 30, 50, ['find({ carne: "C789123", edad: 22 })   // AND']], ['w', 2600], ['code', 'o', 30, 120, ['find({ $or: [ { edad: 22 }, { edad: 25 } ] })']]]),
    B('updateOne con dólar set cambia un campo; deleteOne y deleteMany borran. Y para un campo dentro de un subdocumento se usa punto, entre comillas, como aula punto ubicación.',
      [['clr'], ['code', 'c', 20, 40, ['updateOne({ nombre: "Dilana" }, { $set: { edad: 27 } })', 'deleteMany({ edad: 25 })', 'find({ "aula.ubicacion": "Edificio A" })']]])
  ], { q: '¿Qué filtro trae a quienes tienen más de 25 años?', o: ['{ edad: { $gt: 25 } }', '{ $gt: { edad: 25 } }', '{ edad: { $lt: 25 } }'], why: 'El operador va dentro del campo: { campo: { $gt: valor } }.' },
  ['find({ campo: valor }) filtra por igualdad.', '$gt, $lt, $gte, $lte y $ne comparan; $or es explícito.', '"sub.campo" entre comillas para subdocumentos.']);

  add('p5l6', 'islas', [
    B('Cada modelo NoSQL sirve para algo. Documentos, como MongoDB: catálogo con atributos distintos. Clave valor, como Redis: el carrito por usuario. Familias de columnas, como Cassandra: historial de compras.',
      [['tbl', 't', 40, 40, [130, 270], [['Modelo', 'Uso en la tienda'], ['Documentos', 'Catálogo (MongoDB)'], ['Clave-valor', 'Carrito (Redis)'], ['Columnas', 'Historial (Cassandra)'], ['Grafos', 'Recomendaciones (Neo4j)'], ['Relacional', 'Pedidos y pagos (MySQL)']]], ['row', 't', 1], ['w', 1800], ['row', 't', 2], ['w', 1800], ['row', 't', 3]]),
    B('Grafos, como Neo4j: recomendaciones por conexiones. Y relacional, como MySQL: pedidos, pagos e inventario oficiales. Historial y recomendaciones toleran consistencia eventual; los pagos, no.',
      [['row', 't', 4], ['w', 1800], ['row', 't', 5]]),
    B('Escalar vertical es darle más recursos al mismo servidor. Horizontal es repartir la carga entre nodos.',
      [['clr'], ['spr', 'a', 'srv', 100, 60, 5], ['txt', 'v', 130, 190, 'VERTICAL', 'b', 12], ['spr', 'b1', 'srv', 290, 90, 3], ['spr', 'b2', 'srv', 340, 90, 3], ['spr', 'b3', 'srv', 390, 90, 3], ['txt', 'h', 350, 190, 'HORIZONTAL', 'g', 12]]),
    B('Búsqueda semántica: un embedding es un vector que representa el contenido, y se usa el mismo modelo para documentos y preguntas. En pgvector, el operador de distancia coseno da un número: menor es más cercano. HNSW acelera la búsqueda aproximada, aunque puede omitir algunos vecinos. Y precisión arroba k: tres relevantes de cinco, sesenta por ciento.',
      [['clr'], ['code', 'c', 30, 40, ['ORDER BY embedding <=> $pregunta   -- menor = más cercano']], ['w', 3800], ['box', 'h', 30, 110, 200, 44, 'HNSW: rápido, aproximado', 'p'], ['w', 3500], ['box', 'p', 250, 110, 200, 44, 'Precisión@5: 3/5 = 60 %', 'g']])
  ], { q: 'En pgvector, con el operador <=>, ¿qué resultado indica el documento más parecido?', o: ['La distancia menor', 'La distancia mayor', 'La más cercana a 1'], why: '<=> da la distancia coseno: cuanto menor, más cercano.' },
  ['Documentos, clave-valor, columnas, grafos y relacional: cada uno para su uso.', 'Vertical: más recursos. Horizontal: más nodos.', 'Embeddings + distancia coseno: menor = más parecido. Precisión@k = relevantes ÷ k.']);

  return S;
})();
