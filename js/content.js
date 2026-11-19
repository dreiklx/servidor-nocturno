/* =====================================================================
   SERVIDOR NOCTURNO · Contenido de estudio
   Fuente: carpeta "Bases Examen 3" (IF0010 Bases de Datos II)
   - Temas de examen: Guías #8, #9, #10, #11, #12, #13
   - Resumen de las investigaciones (11 investigaciones finales)
   Regla de autoría: o[0] es SIEMPRE la respuesta correcta; el juego
   baraja las opciones al mostrarlas. En preguntas tf:true, o[0] es
   "Verdadero" o "Falso" según corresponda.
   ===================================================================== */
window.CONTENT = (function () {

const P = [];

/* ---------------------------------------------------------------------
   FASE 1 · MUELLE DE LAS TRANSACCIONES · Guía #8 (Concurrencia)
   --------------------------------------------------------------------- */
P.push({
  id: 'p1', num: 1, theme: 'muelle',
  name: 'Muelle de las Transacciones',
  place: 'Puerto Nyder · 11:58 p. m.',
  source: 'Guía #8 · Concurrencia · Resumen §2',
  story: [
    'Medianoche en el Puerto Nyder. El Gran Apagón dejó los barcos a medio descargar.',
    'Si se descargan la mitad de las cajas y se va la luz... ¿qué quedó guardado y qué no? Para eso existen las transacciones.'
  ],
  npc: { name: 'Capitana Marea', sprite: 'guide', tint: '#2bb3c0', lines: [
    '¡Upe, grumete Kai! Los Bichos Sucios se están jalando la carga que todavía no tiene COMMIT.',
    'Aquí nadie se mete a pelear a lo loco: vea las pizarras brillantes del almacén, que traen video. Cuando las vea, la grúa abre el muelle.',
    'Si se le olvida algo, abra la Libreta con la L. Ahí queda todo, mae.'
  ]},
  lessons: [
    { id: 'p1l1', title: 'Transacción y propiedades ACID', src: 'Guía #8',
      body: `<p>Una <b>transacción</b> es una unidad lógica de trabajo: una o más operaciones (<code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code>) que deben ejecutarse <b>completamente o no ejecutarse en absoluto</b>.</p>
<ul><li><b>A</b>tomicidad: todas las operaciones se completan o ninguna se ejecuta.</li>
<li><b>C</b>onsistencia: la base pasa de un estado válido a otro válido.</li>
<li><b>I</b> (aislamiento): las transacciones no interfieren entre sí.</li>
<li><b>D</b>urabilidad: una vez confirmados, los cambios permanecen aunque haya fallos.</li></ul>`,
      example: 'Un SINPE de ₡100: rebajar su cuenta y sumarle a la otra persona es UNA sola transacción. Si falla a la mitad, la plata no puede desaparecer (atomicidad). Si después del COMMIT se va la luz, el envío sigue hecho (durabilidad).' },
    { id: 'p1l2', title: 'COMMIT, ROLLBACK y SAVEPOINT', src: 'Guía #8',
      body: `<ul><li><code>BEGIN TRANSACTION</code>: inicia una transacción.</li>
<li><code>COMMIT</code>: guarda todos los cambios de la transacción.</li>
<li><code>ROLLBACK</code>: revierte todos los cambios desde el inicio.</li>
<li><code>SAVE TRANSACTION nombre</code>: crea un punto intermedio (savepoint).</li>
<li><code>ROLLBACK TRANSACTION nombre</code>: revierte solo hasta ese savepoint.</li></ul>
<p>Patrón con manejo de errores: el trabajo va en <code>BEGIN TRY</code>; si algo falla, el <code>BEGIN CATCH</code> hace <code>ROLLBACK</code>. En la guía se revisa <code>IF @@TRANCOUNT &gt; 0</code> para revertir solo si hay una transacción abierta.</p>`,
      code: `BEGIN TRY
  BEGIN TRANSACTION;
  UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1;
  UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2;
  COMMIT;
END TRY
BEGIN CATCH
  ROLLBACK;
  PRINT 'Error: ' + ERROR_MESSAGE();
END CATCH`,
      example: 'SAVE TRANSACTION es como guardar partida antes de un jefe: si pierde, vuelve a ese punto y no al inicio del juego.' },
    { id: 'p1l3', title: 'El log de transacciones (WAL)', src: 'Guía #8',
      body: `<p>El <b>log de transacciones</b> (WAL, <i>Write-Ahead Logging</i>) es un archivo interno que registra todas las operaciones que afectan datos <b>antes</b> de que se apliquen físicamente.</p>
<ul><li>Recuperación ante fallos (por ejemplo, tras un apagón).</li>
<li>Rehacer o deshacer operaciones (COMMIT / ROLLBACK).</li>
<li>Garantiza la <b>durabilidad</b> (la D de ACID).</li></ul>
<p>Si una transacción hizo <code>UPDATE saldo = saldo - 100</code> y hubo un fallo antes del <code>COMMIT</code>, el log puede revertir el cambio.</p>`,
      example: 'La bitácora de la capitana: primero anota “voy a mover 10 cajas” y después las mueve. Si hay apagón, la bitácora dice qué terminar y qué deshacer.' },
    { id: 'p1l4', title: 'Anomalías: sucia, no repetible y fantasma', src: 'Guía #8 · Resumen §2',
      body: `<ul><li><b>Lectura sucia</b> (dirty read): una transacción lee datos que otra <b>aún no confirma</b>. Si esa otra hace ROLLBACK, lo leído era inválido.</li>
<li><b>Lectura no repetible</b>: lee el mismo dato dos veces y obtiene valores distintos, porque otra transacción lo modificó <b>y confirmó</b> entre ambas lecturas.</li>
<li><b>Lectura fantasma</b>: repite una consulta con la misma condición y aparecen <b>filas nuevas</b> insertadas por otra transacción.</li></ul>
<p>Pista para no confundirlas: sucia = dato sin confirmar; no repetible = <i>la misma fila</i> cambió; fantasma = cambió <i>el conjunto de filas</i>.</p>`,
      example: 'Sucia: celebrar un gol que el VAR anula. No repetible: ver el precio del arroz, darse vuelta y que ya cambió. Fantasma: contar la fila del bus y al recontar hay gente nueva.' },
    { id: 'p1l5', title: 'Niveles de aislamiento', src: 'Guía #8',
      body: `<table class="mini"><tr><th>Nivel</th><th>Sucia</th><th>No repetible</th><th>Fantasma</th></tr>
<tr><td>READ UNCOMMITTED</td><td>sí</td><td>sí</td><td>sí</td></tr>
<tr><td>READ COMMITTED <small>(predeterminado en SQL Server)</small></td><td>no</td><td>sí</td><td>sí</td></tr>
<tr><td>REPEATABLE READ</td><td>no</td><td>no</td><td>sí</td></tr>
<tr><td>SERIALIZABLE <small>(el más estricto)</small></td><td>no</td><td>no</td><td>no</td></tr></table>
<p>“sí” = la anomalía puede ocurrir. Se cambia con <code>SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;</code></p>
<p>SERIALIZABLE se comporta como si las transacciones fueran secuenciales.</p>`,
      example: 'Más aislamiento es como un baño con llave: nadie le interrumpe, pero los demás hacen fila.' }
  ],
  questions: [
    { id: 'p1q1', l: 'p1l1', q: 'Una transferencia rebaja ₡100 de la cuenta 1, pero falla antes de sumarlos a la cuenta 2. ¿Qué propiedad exige deshacer el rebajo?',
      o: ['Atomicidad', 'Durabilidad', 'Aislamiento', 'Consistencia'],
      hint: 'Piense en “todo o nada”.',
      exp: 'Atomicidad: todas las operaciones se completan o ninguna se ejecuta. Como la segunda parte falló, la primera también se revierte.' },
    { id: 'p1q2', l: 'p1l1', q: 'Después del COMMIT se cae el servidor. Al reiniciar, el cambio sigue guardado. ¿Qué propiedad se cumplió?',
      o: ['Durabilidad', 'Atomicidad', 'Aislamiento', 'Consistencia'],
      hint: '¿Qué propiedad habla de lo que pasa con lo confirmado cuando hay fallos?',
      exp: 'Durabilidad: una vez confirmados, los cambios permanecen aunque haya fallos. El log de transacciones ayuda a garantizarla.' },
    { id: 'p1q3', l: 'p1l1', q: '¿Qué describe la propiedad de consistencia?',
      o: ['La base pasa de un estado válido a otro válido', 'Los cambios confirmados sobreviven a un fallo', 'Las transacciones no interfieren entre sí', 'Se completan todas las operaciones o ninguna'],
      hint: 'Las otras tres opciones son A, I y D.',
      exp: 'Consistencia: el estado de la base pasa de uno válido a otro válido (se respetan reglas e integridad).' },
    { id: 'p1q4', l: 'p1l1', q: 'Dos cajeros cobran al mismo tiempo y ninguno ve los cambios a medias del otro. ¿Qué propiedad describe esto?',
      o: ['Aislamiento', 'Atomicidad', 'Durabilidad', 'Consistencia'],
      hint: 'Es la “I” de ACID.',
      exp: 'Aislamiento: las transacciones no interfieren entre sí. El nivel de aislamiento regula cuánto se protegen.' },
    { id: 'p1q5', l: 'p1l2', q: 'Ejercicio 5 de la guía. ¿Qué actualizaciones quedan guardadas al final?',
      code: `BEGIN TRANSACTION;
UPDATE Productos SET stock = stock - 2 WHERE id_producto = 1;
SAVE TRANSACTION paso1;
UPDATE Productos SET stock = stock - 5 WHERE id_producto = 2;
SAVE TRANSACTION paso2;
UPDATE Productos SET stock = stock - 100 WHERE id_producto = 3;
ROLLBACK TRANSACTION paso2;
COMMIT;`,
      o: ['Las de los productos 1 y 2', 'Solo la del producto 1', 'Las de los productos 1, 2 y 3', 'Ninguna: se revierte todo'],
      hint: 'ROLLBACK TRANSACTION paso2 vuelve al punto “paso2”, no al inicio.',
      exp: 'El rollback parcial deshace solo lo posterior a paso2 (producto 3). El COMMIT confirma lo anterior: productos 1 y 2.' },
    { id: 'p1q6', l: 'p1l2', q: '¿Qué comando crea un punto intermedio dentro de una transacción?',
      o: ['SAVE TRANSACTION', 'BEGIN TRANSACTION', 'ROLLBACK TRANSACTION', 'COMMIT TRANSACTION'],
      hint: 'Es el “guardar partida”.',
      exp: 'SAVE TRANSACTION nombre crea un savepoint; luego ROLLBACK TRANSACTION nombre puede volver a él.' },
    { id: 'p1q7', l: 'p1l2', q: 'En el patrón TRY/CATCH de la guía, ¿dónde se escribe el ROLLBACK?',
      o: ['Dentro del bloque BEGIN CATCH', 'Justo después del BEGIN TRY', 'Antes del BEGIN TRANSACTION', 'Inmediatamente después del COMMIT'],
      hint: '¿En qué bloque cae la ejecución cuando ocurre un error?',
      exp: 'Si algo falla dentro de BEGIN TRY, la ejecución salta a BEGIN CATCH, y ahí se revierte la transacción.' },
    { id: 'p1q8', l: 'p1l2', q: 'En el CATCH aparece IF @@TRANCOUNT > 0 antes del ROLLBACK. ¿Para qué sirve?',
      o: ['Revertir solo si hay una transacción abierta', 'Contar cuántas filas cambió el UPDATE', 'Saber cuántos errores ocurrieron antes', 'Medir cuánto tiempo tardó la transacción'],
      hint: 'TRANCOUNT = contador de transacciones.',
      exp: '@@TRANCOUNT indica cuántas transacciones hay abiertas en la sesión. Si es mayor que 0, hay algo que revertir.' },
    { id: 'p1q9', l: 'p1l2', q: 'Ejercicio 4: @stock_actual vale 7 y se intentan vender 10 unidades. ¿Qué hace el código?',
      code: `IF @stock_actual >= 10
BEGIN
  UPDATE Productos SET stock = stock - 10 WHERE id_producto = 1;
  INSERT INTO DetalleFactura (...) VALUES (1, 1, 10);
  COMMIT;
END
ELSE
BEGIN
  PRINT 'Stock insuficiente';
  ROLLBACK;
END`,
      o: ['Imprime “Stock insuficiente” y hace ROLLBACK', 'Vende las 7 unidades y confirma con COMMIT', 'Deja el stock en -3 y luego hace COMMIT', 'Inserta el detalle pero no rebaja el stock'],
      hint: '¿7 >= 10?',
      exp: 'Como 7 < 10, entra al ELSE: avisa y revierte la transacción. Ningún cambio queda guardado.' },
    { id: 'p1q10', l: 'p1l3', q: 'Según la guía, el log de transacciones (WAL) registra las operaciones...',
      o: ['antes de aplicarlas físicamente', 'solo después de cada COMMIT', 'únicamente cuando hay un error', 'una vez al día, con el respaldo'],
      hint: 'WAL = Write-Ahead Logging. “Ahead” = por adelantado.',
      exp: 'Write-Ahead: primero se escribe en el log y después se aplica el cambio. Así se puede rehacer o deshacer tras un fallo.' },
    { id: 'p1q11', l: 'p1l3', tf: true, q: 'Si ocurre un fallo antes del COMMIT, el log permite revertir el UPDATE pendiente.',
      o: ['Verdadero', 'Falso'],
      hint: 'Es justo el ejemplo del saldo - 100 de la guía.',
      exp: 'Verdadero. El log registra la operación y permite deshacerla si la transacción no llegó a confirmarse.' },
    { id: 'p1q12', l: 'p1l4', q: '¿Qué anomalía ocurre aquí?',
      code: `-- A
BEGIN TRANSACTION;
UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1;
-- B (antes del COMMIT de A)
SELECT saldo FROM cuentas WHERE id = 1;
-- A hace ROLLBACK`,
      o: ['Lectura sucia', 'Lectura no repetible', 'Lectura fantasma', 'Interbloqueo'],
      hint: '¿El dato que leyó B estaba confirmado?',
      exp: 'B leyó un valor que A aún no confirmaba y que luego revirtió: lectura sucia.' },
    { id: 'p1q13', l: 'p1l4', q: '¿Qué anomalía ocurre aquí?',
      code: `-- A
BEGIN TRANSACTION;
SELECT saldo FROM cuentas WHERE id = 1;
-- B
UPDATE cuentas SET saldo = saldo + 200 WHERE id = 1;
COMMIT;
-- A
SELECT saldo FROM cuentas WHERE id = 1; -- distinto`,
      o: ['Lectura no repetible', 'Lectura sucia', 'Lectura fantasma', 'Interbloqueo'],
      hint: 'Es la misma fila, leída dos veces, y B sí confirmó.',
      exp: 'El mismo dato leído dos veces da resultados distintos porque B lo modificó y confirmó entre ambas lecturas: no repetible.' },
    { id: 'p1q14', l: 'p1l4', q: '¿Qué anomalía ocurre aquí?',
      code: `-- A
BEGIN TRANSACTION;
SELECT * FROM pedidos WHERE cliente_id = 5;
-- B
INSERT INTO pedidos VALUES (..., 5, ...);
COMMIT;
-- A
SELECT * FROM pedidos WHERE cliente_id = 5; -- fila nueva`,
      o: ['Lectura fantasma', 'Lectura sucia', 'Lectura no repetible', 'Interbloqueo'],
      hint: 'No cambió una fila existente: apareció una nueva.',
      exp: 'Con la misma condición aparecen filas nuevas insertadas por otra transacción: lectura fantasma.' },
    { id: 'p1q15', l: 'p1l4', q: '¿En qué se diferencia una lectura no repetible de una lectura sucia?',
      o: ['En la no repetible, el valor nuevo sí está confirmado', 'En la no repetible, la otra transacción no ha confirmado', 'En la no repetible aparecen filas nuevas en la consulta', 'En la no repetible, la misma transacción escribe dos veces'],
      hint: 'Fíjese en si hubo COMMIT de la otra transacción.',
      exp: 'Sucia = se lee algo sin confirmar. No repetible = entre dos lecturas, otra transacción modificó y CONFIRMÓ el dato.' },
    { id: 'p1q16', l: 'p1l5', q: '¿Cuál es el nivel de aislamiento predeterminado en SQL Server?',
      o: ['READ COMMITTED', 'READ UNCOMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
      hint: 'Solo lee datos confirmados.',
      exp: 'READ COMMITTED es la opción por defecto en SQL Server: solo lee datos confirmados.' },
    { id: 'p1q17', l: 'p1l5', q: '¿Qué nivel de aislamiento evita también las lecturas fantasma?',
      o: ['SERIALIZABLE', 'REPEATABLE READ', 'READ COMMITTED', 'READ UNCOMMITTED'],
      hint: 'Es el más estricto de los cuatro.',
      exp: 'Solo SERIALIZABLE evita las tres anomalías; actúa como si las transacciones fueran secuenciales.' },
    { id: 'p1q18', l: 'p1l5', q: 'Con READ UNCOMMITTED, ¿qué anomalías pueden ocurrir?',
      o: ['Sucia, no repetible y fantasma', 'Solo la lectura sucia', 'Solo la no repetible y la fantasma', 'Ninguna de las tres'],
      hint: 'Es el nivel más permisivo.',
      exp: 'READ UNCOMMITTED puede leer datos no confirmados, así que permite las tres anomalías.' },
    { id: 'p1q19', l: 'p1l5', q: '¿Qué anomalías evita REPEATABLE READ?',
      o: ['La sucia y la no repetible', 'Solo la lectura fantasma', 'Las tres anomalías', 'Solo la lectura sucia'],
      hint: 'Su nombre dice que las lecturas repetidas dan lo mismo... pero ¿y las filas nuevas?',
      exp: 'REPEATABLE READ evita sucia y no repetible. La fantasma todavía puede aparecer (lo evita SERIALIZABLE).' },
    { id: 'p1q20', l: 'p1l5', q: 'Complete el comando:',
      code: `____ TRANSACTION ISOLATION LEVEL SERIALIZABLE;`,
      o: ['SET', 'ALTER', 'BEGIN', 'USE'],
      hint: 'Es el mismo verbo que se usa para cambiar opciones de la sesión.',
      exp: 'SET TRANSACTION ISOLATION LEVEL <nivel>; cambia el nivel de aislamiento de la sesión.' },
    { id: 'p1q21', l: 'p1l2', tf: true, q: 'ROLLBACK (sin nombre de savepoint) revierte todos los cambios desde el inicio de la transacción.',
      o: ['Verdadero', 'Falso'],
      hint: 'Compare con ROLLBACK TRANSACTION nombre.',
      exp: 'Verdadero. Para volver solo a un punto intermedio se usa ROLLBACK TRANSACTION nombre_del_savepoint.' },
    { id: 'p1q22', l: 'p1l5', boss: true, q: 'Ejercicio 3: A usa REPEATABLE READ y B inserta una factura con la misma fecha y confirma. ¿Qué ve el segundo SELECT de A?',
      o: ['Puede ver la factura nueva: lectura fantasma', 'Nunca la ve: REPEATABLE READ lo impide', 'Recibe el error 1205 por interbloqueo', 'Ve la factura con datos sin confirmar'],
      hint: 'Revise la tabla de niveles: ¿REPEATABLE READ evita fantasmas?',
      exp: 'REPEATABLE READ no evita las lecturas fantasma. Para evitarlas, la guía indica SERIALIZABLE.' },
    { id: 'p1q23', l: 'p1l1', tf: true, boss: true, q: 'Una transacción es una unidad lógica de trabajo que puede quedar ejecutada a la mitad si falla.',
      o: ['Falso', 'Verdadero'],
      hint: 'Recuerde la definición: “completamente o no ejecutarse en absoluto”.',
      exp: 'Falso. Por definición se ejecuta completa o no se ejecuta; quedar a la mitad es justo lo que evita la atomicidad.' }
  ],
  enemy: { name: 'Bicho Sucio', sprite: 'mudbug' },
  boss: { id: 'b1', name: 'Pirata Lectosucio', sprite: 'pirate', hp: 6,
    intro: ['¡Jarrr! Yo leo la carga ANTES de que la confirmen. ¿Y qué si después hacen ROLLBACK?', 'Si tan carga es con las transacciones, ¡demuéstrelo!'],
    win: ['¡Diay, me ganó! Leer sin confirmar... qué mala idea. Me paso a READ COMMITTED.'] },
  chela: ['¡Upe, mi amor! Ceviche en vaso, atómico: o se lo come todo o no se come nada.', 'Aquí le guardo la partida. Es durable: ni con apagón se pierde, se lo juro por mi carrito.'],
  minigames: ['crane', 'sorter']
});

/* ---------------------------------------------------------------------
   FASE 2 · ESTACIÓN DE LAS PLANIFICACIONES · Guía #9
   --------------------------------------------------------------------- */
P.push({
  id: 'p2', num: 2, theme: 'estacion',
  name: 'Estación de las Planificaciones',
  place: 'Patio ferroviario · 12:40 a. m.',
  source: 'Guía #9 · Planificación de las transacciones',
  story: [
    'Los trenes de datos salieron todos a la vez y se enredaron en las vías.',
    'Para desenredarlos hay que entender las planificaciones: qué operaciones chocan, qué orden es seguro y quién espera a quién.'
  ],
  npc: { name: 'Jefa de Estación Agujas', sprite: 'guide', tint: '#e0a030', lines: [
    '¡Cuidado con los trenes! Cuando parpadea la luz roja, no se quede en la vía como poste.',
    'Los Cerrojos Errantes comen planes no serializables. Vea las pizarras antes de arrimarse.',
    'La notación es sencilla: l1(X) es “T1 lee X” y e1(X) es “T1 escribe X”. No se me enrede.'
  ]},
  lessons: [
    { id: 'p2l1', title: 'Planificaciones: serie, no serie y serializable', src: 'Guía #9',
      body: `<p>Una <b>planificación</b> es una secuencia de operaciones de varias transacciones que conserva el orden interno de cada una.</p>
<table class="mini"><tr><th>Símbolo</th><th>Significado</th></tr><tr><td>l1(X)</td><td>T1 lee X</td></tr><tr><td>e1(X)</td><td>T1 escribe X</td></tr><tr><td>c1</td><td>T1 confirma (COMMIT)</td></tr><tr><td>r1</td><td>T1 aborta (ROLLBACK)</td></tr></table>
<ul><li><b>Serie</b>: todas las operaciones de una transacción se ejecutan antes de que empiece la siguiente. Conserva la consistencia, pero limita la concurrencia.</li>
<li><b>No serie</b>: las operaciones se intercalan. Eso solo no dice si es serializable o recuperable.</li>
<li><b>Serializable</b>: equivalente a <i>alguna</i> ejecución serie. Criterios: equivalencia por conflictos y equivalencia de vistas.</li></ul>`,
      example: 'Dos cocineros y una sola cocina: en serie, uno cocina todo y luego entra el otro. Intercalado es más rápido, pero hay que cuidar que no usen la misma olla al mismo tiempo.' },
    { id: 'p2l2', title: 'Conflictos y grafo de precedencia', src: 'Guía #9',
      body: `<p>Dos operaciones están en <b>conflicto</b> si: (1) son de transacciones distintas, (2) acceden al mismo dato y (3) al menos una escribe. Pares: lectura–escritura, escritura–lectura y escritura–escritura. Dos lecturas no chocan; datos distintos tampoco.</p>
<ol><li>Cree un nodo por transacción.</li>
<li>Agregue Ti → Tj si una operación de Ti precede a otra de Tj con la que está en conflicto.</li>
<li>Si hay <b>ciclo</b>, el plan <b>no</b> es serializable por conflictos.</li>
<li>Sin ciclo: un orden topológico da el orden serie equivalente.</li></ol>
<p>Ejemplo P1: <code>l3(X); e3(X); l1(X); e1(Y); l2(Y); e2(Z)</code> → T3→T1 (por X) y T1→T2 (por Y). Sin ciclo: orden T3, T1, T2.</p>`,
      example: 'Si usted escribe en la pizarra y luego yo leo esa pizarra, usted tiene que ir antes que yo: flecha usted → yo.' },
    { id: 'p2l3', title: 'Equivalencia en vistas', src: 'Guía #9',
      body: `<p>Dos planes son <b>equivalentes en vistas</b> si mantienen:</p>
<ul><li>Las <b>lecturas de valores iniciales</b>.</li><li>La <b>relación de lectura</b> (quién lee lo que escribió quién).</li><li>La <b>escritura final</b> de cada dato.</li></ul>
<p>Todo plan serializable por conflictos es serializable en vistas, pero <b>no al revés</b>. La diferencia aparece con <b>escrituras ciegas</b> (escribir sin leer antes), como <code>V5: e1(X); e2(X); e1(X)</code>: tiene ciclo en el grafo, pero es serializable en vistas.</p>`,
      example: 'Dos versiones de un chisme son “equivalentes en vistas” si cada persona escuchó la versión de la misma fuente y el final de la historia es el mismo.' },
    { id: 'p2l4', title: 'Recuperable, cascadas y estricta', src: 'Guía #9',
      body: `<ul><li><b>Recuperable</b>: si Tj lee lo que escribió Ti, Tj solo confirma <i>después</i> de que Ti confirme. Ej.: <code>e1(X); l2(X); c1; c2</code>. No recuperable: <code>e1(X); l2(X); c2; r1</code>.</li>
<li><b>Aborto en cascada</b>: si T1 aborta, deben abortar quienes leyeron sus datos sin confirmar (y quienes leyeron de esos).</li>
<li><b>Sin abortos en cascada</b>: solo se leen datos ya confirmados. Ej.: <code>e1(X); c1; l2(X); e2(Y); c2</code>.</li>
<li><b>Estricta</b>: si una transacción escribe X, nadie lee ni sobrescribe X hasta su COMMIT o ROLLBACK.</li></ul>
<p><b>Estricta ⇒ sin cascadas ⇒ recuperable</b> (las inversas no se cumplen en general). Un COMMIT ya hecho no se deshace.</p>`,
      example: 'Si copió la tarea de un compañero y a él se la anulan, la suya también cae: eso es una cascada.' },
    { id: 'p2l5', title: 'Bloqueos, B2F e interbloqueo', src: 'Guía #9',
      body: `<table class="mini"><tr><th>Existente \\ Solicitud</th><th>S</th><th>X</th></tr><tr><td>S (compartido)</td><td>Compatible</td><td>Espera</td></tr><tr><td>X (exclusivo)</td><td>Espera</td><td>Espera</td></tr></table>
<ul><li><b>Bloqueo en dos fases (B2F/2PL)</b>: fase de <i>crecimiento</i> (adquiere, sin liberar) y fase de <i>contracción</i> (libera, sin adquirir). Si todos lo siguen, el plan es serializable por conflictos.</li>
<li><b>Interbloqueo (deadlock)</b>: T1 retiene A y espera B; T2 retiene B y espera A (espera circular). SQL Server elige una víctima: <b>error 1205</b>.</li>
<li><code>SET LOCK_TIMEOUT 15000</code>: espera hasta 15 s; <code>-1</code> = sin límite. Si se agota: <b>error 1222</b>.</li>
<li><code>UPDLOCK</code> pide bloqueo de actualización; <code>HOLDLOCK</code> aplica semántica SERIALIZABLE.</li></ul>`,
      example: 'Dos carros en un puente de una vía, cada uno esperando que el otro retroceda: espera circular. Alguien tiene que ser la “víctima” y echar para atrás.' },
    { id: 'p2l6', title: 'Marcas de tiempo y SNAPSHOT', src: 'Guía #9',
      body: `<p>Cada transacción recibe <b>TS(T)</b> al iniciar. Cada dato guarda <b>R_TS(X)</b> (mayor marca que lo leyó) y <b>W_TS(X)</b> (mayor marca que lo escribió).</p>
<ul><li><b>Lectura</b>: si TS(T) &lt; W_TS(X), T se aborta. Si no, lee y R_TS(X) = max(R_TS(X), TS(T)).</li>
<li><b>Escritura</b>: si TS(T) &lt; R_TS(X) o TS(T) &lt; W_TS(X), T se aborta. Si no, escribe y W_TS(X) = TS(T).</li></ul>
<p>Ejemplo: TS(T1)=5, TS(T2)=10. T2 escribe X (W_TS=10). T1 intenta leer X: 5 &lt; 10 → T1 se aborta.</p>
<p><b>SNAPSHOT</b> (Actividad 4): A lee 10 dentro de su instantánea aunque B confirme 4; después del COMMIT, una nueva sentencia ve 4. En READ COMMITTED (Actividad 3), A ve 10 y luego 6: dos lecturas confirmadas distintas.</p>`,
      example: 'La ficha numerada del banco: si con su ficha quiere hacer algo que ya alteró alguien con un número mayor, lo mandan a sacar una ficha nueva.' }
  ],
  questions: [
    { id: 'p2q26', l: 'p2l1', q: '¿Qué es una planificación serie?',
      o: ['Una transacción termina antes de que empiece otra', 'Las operaciones de varias transacciones se intercalan', 'Una planificación que siempre tiene un ciclo en el grafo', 'Una planificación en la que nunca hay COMMIT ni ROLLBACK'],
      hint: 'Serie = una detrás de otra.',
      exp: 'En serie, todas las operaciones de una transacción se ejecutan antes de que empiece la siguiente.' },
    { id: 'p2q27', l: 'p2l1', tf: true, q: 'En la notación de la guía, r1 significa que T1 lee un dato.',
      o: ['Falso', 'Verdadero'],
      hint: 'Leer se escribe con l: l1(X).',
      exp: 'Falso. r1 significa que T1 aborta (ROLLBACK). l1(X) es leer, e1(X) escribir y c1 confirmar.' },
    { id: 'p2q28', l: 'p2l1', q: 'Una planificación serializable es la que...',
      o: ['equivale a alguna ejecución en serie', 'se ejecuta siempre en serie, sin intercalar', 'no tiene ninguna operación de escritura', 'termina con COMMIT en todas las transacciones'],
      hint: 'Puede estar intercalada.',
      exp: 'Serializable = equivalente a alguna ejecución serie de las mismas transacciones (por conflictos o por vistas).' },
    { id: 'p2q1', l: 'p2l2', q: '¿Cuándo están en conflicto dos operaciones?',
      o: ['Distintas transacciones, mismo dato y al menos una escribe', 'Misma transacción, mismo dato y ambas escriben', 'Distintas transacciones, mismo dato y ambas solo leen', 'Distintas transacciones y datos diferentes al mismo tiempo'],
      hint: 'Son tres condiciones a la vez.',
      exp: 'Conflicto: transacciones distintas + mismo dato + al menos una escritura (l–e, e–l o e–e).' },
    { id: 'p2q2', l: 'p2l2', tf: true, q: 'l1(X) y l2(X) están en conflicto.',
      o: ['Falso', 'Verdadero'],
      hint: '¿Alguna de las dos escribe?',
      exp: 'Falso. Dos lecturas no están en conflicto.' },
    { id: 'p2q3', l: 'p2l2', q: 'Si el grafo de precedencia tiene un ciclo, el plan...',
      o: ['no es serializable por conflictos', 'es serializable por conflictos', 'es estricto y sin abortos en cascada', 'produce siempre un interbloqueo'],
      hint: 'Paso 3 de la construcción del grafo.',
      exp: 'Un ciclo significa que no existe orden serie que respete todos los conflictos: no es serializable por conflictos.' },
    { id: 'p2q4', l: 'p2l2', q: 'Ejercicio 2: ¿qué aristas tiene este plan?', code: 'l1(X); l2(X); e1(X); e2(X); c1; c2;',
      o: ['T1→T2 y T2→T1', 'Solo T1→T2', 'Solo T2→T1', 'Ninguna arista'],
      hint: 'Compare l1(X) con e2(X) y l2(X) con e1(X).',
      exp: 'l1(X) antes de e2(X) da T1→T2; l2(X) antes de e1(X) da T2→T1. Hay ciclo: no es serializable por conflictos.' },
    { id: 'p2q5', l: 'p2l2', q: 'Ejercicio 5: ¿qué orden serie equivalente tiene?', code: 'l2(X); e2(X); l1(X); e1(Y); l3(Y); e3(Z); c2; c1; c3;',
      o: ['T2, T1, T3', 'T1, T2, T3', 'T3, T1, T2', 'No tiene: hay un ciclo'],
      hint: 'X: ¿quién escribe antes de que el otro lea? Y: ¿quién escribe antes de que el otro lea?',
      exp: 'e2(X) antes de l1(X): T2→T1. e1(Y) antes de l3(Y): T1→T3. Sin ciclo: T2, T1, T3.' },
    { id: 'p2q6', l: 'p2l2', q: 'Ejercicio 3: ¿cuántas aristas tiene el grafo?', code: 'l1(X); e1(X); l2(Y); e2(Y); l1(Z); e1(Z); c1; c2;',
      o: ['Ninguna', 'Una, de T1 a T2', 'Una, de T2 a T1', 'Dos, formando un ciclo'],
      hint: '¿Las dos transacciones tocan algún dato en común?',
      exp: 'T1 usa X y Z; T2 usa Y. No comparten datos, así que no hay conflictos ni aristas. Es serializable.' },
    { id: 'p2q7', l: 'p2l3', q: 'Todo plan serializable por conflictos es...',
      o: ['también serializable en vistas', 'nunca serializable en vistas', 'siempre un plan en serie', 'siempre no recuperable'],
      hint: 'La relación entre los dos criterios va en una sola dirección.',
      exp: 'Conflictos ⇒ vistas. Lo contrario no siempre se cumple (escrituras ciegas).' },
    { id: 'p2q8', l: 'p2l3', q: 'V5: e1(X); e2(X); e1(X) es serializable en vistas pero no por conflictos. ¿Qué lo explica?',
      o: ['Las escrituras ciegas', 'Las lecturas sucias', 'El orden de los COMMIT', 'Los bloqueos compartidos'],
      hint: '¿Alguna transacción lee X antes de escribirlo?',
      exp: 'Son escrituras ciegas (sin leer antes). Ahí aparece la diferencia entre ambos criterios.' },
    { id: 'p2q9', l: 'p2l3', q: '¿Cuál NO es una condición de la equivalencia en vistas?',
      o: ['Que los COMMIT ocurran en el mismo orden', 'Que las lecturas de valores iniciales coincidan', 'Que se mantenga la relación de lectura', 'Que la escritura final sea de la misma transacción'],
      hint: 'Son tres condiciones: lecturas iniciales, relación de lectura y escritura final.',
      exp: 'El orden de los COMMIT no es parte de la definición; las otras tres sí.' },
    { id: 'p2q10', l: 'p2l4', q: '¿Cómo se clasifica este plan?', code: 'e1(X); l2(X); c2; r1;',
      o: ['No recuperable', 'Recuperable', 'Estricto', 'Sin abortos en cascada'],
      hint: 'T2 leyó de T1. ¿Quién confirmó primero?',
      exp: 'T2 confirmó usando un dato de T1, y luego T1 abortó. Ya no se puede deshacer T2: no recuperable.' },
    { id: 'p2q11', l: 'p2l4', q: 'e1(X); l2(X); c1; c2; ¿es recuperable aunque T2 hizo una lectura sucia?',
      o: ['Sí: T2 confirma después de T1', 'No: toda lectura sucia lo impide', 'No: T1 confirma antes que T2', 'Sí: porque T2 nunca escribe'],
      hint: 'Recuperable se fija en el ORDEN de los COMMIT.',
      exp: 'Sí. T2 depende de T1 y confirma después de ella. Puede haber lectura sucia y aun así ser recuperable.' },
    { id: 'p2q12', l: 'p2l4', q: 'e1(X); l2(X); e2(Y); l3(Y); e3(Z); r1; ¿Quiénes deben abortar además de T1?',
      o: ['T2 y T3', 'Solo T2', 'Solo T3', 'Ninguna'],
      hint: 'Siga la cadena: T2 lee de T1 y T3 lee de T2.',
      exp: 'Aborto en cascada: T2 leyó X de T1 y T3 leyó Y de T2. Ambas deben abortar.' },
    { id: 'p2q13', l: 'p2l4', q: 'e1(X); e2(Y); l3(Y); r1; c2; c3; ¿El aborto de T1 obliga a abortar a alguien?',
      o: ['No: nadie leyó datos de T1', 'Sí: a T2 y a T3', 'Sí: solo a T3', 'Sí: solo a T2'],
      hint: 'Compartir el plan no es lo mismo que depender de los datos.',
      exp: 'T3 lee Y de T2, no de T1. Nadie depende de X, así que nadie más aborta.' },
    { id: 'p2q14', l: 'p2l4', q: 'e1(X); c1; l2(X); e2(Y); l3(Y); r2; ¿Qué ocurre?',
      o: ['T3 aborta; T1 no se deshace', 'T1 y T3 deben deshacerse', 'Solo T2 aborta; T3 continúa', 'T1 aborta por ser la primera'],
      hint: 'T1 ya confirmó. ¿Quién leyó de T2?',
      exp: 'T3 leyó Y de T2, así que aborta en cascada. T1 ya hizo COMMIT: no se deshace.' },
    { id: 'p2q15', l: 'p2l4', q: '¿Qué relación entre propiedades es correcta?',
      o: ['Estricta ⇒ sin cascadas ⇒ recuperable', 'Recuperable ⇒ sin cascadas ⇒ estricta', 'Sin cascadas ⇒ estricta ⇒ recuperable', 'Recuperable ⇒ estricta ⇒ sin cascadas'],
      hint: 'La más exigente implica a las otras.',
      exp: 'Estricta implica sin abortos en cascada, y esta implica recuperable. Las inversas no se cumplen en general.' },
    { id: 'p2q16', l: 'p2l5', q: 'T1 tiene S(X) y T2 solicita X(X). ¿Qué pasa?',
      o: ['T2 espera', 'Se concede', 'T1 se aborta', 'T2 recibe S(X)'],
      hint: 'Tabla de compatibilidad: S existente vs X solicitado.',
      exp: 'S y X son incompatibles: T2 espera a que T1 libere.' },
    { id: 'p2q17', l: 'p2l5', q: 'T1 tiene S(X) y T2 solicita S(X). ¿Qué pasa?',
      o: ['Se concede', 'T2 espera', 'T1 se aborta', 'Error 1205'],
      hint: 'Dos lectores en el mismo recurso.',
      exp: 'S es compatible con S: varias transacciones pueden leer a la vez.' },
    { id: 'p2q18', l: 'p2l5', q: 'En la fase de contracción del bloqueo en dos fases...',
      o: ['se liberan bloqueos y no se adquieren nuevos', 'se adquieren bloqueos y no se libera ninguno', 'se convierten bloqueos S a X libremente', 'se adquieren y liberan bloqueos a la vez'],
      hint: 'Contraer = achicar.',
      exp: 'Crecimiento: adquirir (y subir de modo). Contracción: liberar o bajar de modo, sin adquirir nuevos.' },
    { id: 'p2q19', l: 'p2l5', q: 'Ante un interbloqueo, SQL Server...',
      o: ['elige una víctima y lanza el error 1205', 'espera para siempre sin avisar a nadie', 'confirma ambas transacciones a la vez', 'lanza el error 1222 a las dos sesiones'],
      hint: 'La Actividad 5 de la guía muestra este error.',
      exp: 'SQL Server detecta el ciclo, elige una víctima y le comunica el error 1205. El 1222 es por agotar LOCK_TIMEOUT.' },
    { id: 'p2q20', l: 'p2l5', q: '¿Qué significa SET LOCK_TIMEOUT 15000?',
      o: ['Esperar un bloqueo hasta 15 segundos', 'Esperar un bloqueo hasta 15 minutos', 'Bloquear la tabla durante 15 segundos', 'Reintentar la sentencia 15000 veces'],
      hint: 'El valor está en milisegundos.',
      exp: '15000 ms = 15 s de espera máxima por un bloqueo. Con -1 no hay límite.' },
    { id: 'p2q21', l: 'p2l5', q: 'En la Parte I, B espera mientras A tiene la fila. ¿Por qué no es un interbloqueo?',
      o: ['Solo B espera: no hay espera circular', 'Porque B usa READ UNCOMMITTED', 'Porque A ya hizo ROLLBACK antes', 'Porque B tiene un bloqueo S previo'],
      hint: 'Deadlock = cada una espera a la otra.',
      exp: 'A no espera a B. Es una espera simple; cuando A confirma, B continúa (y lee 7).' },
    { id: 'p2q22', l: 'p2l6', q: 'TS(T1)=5 y TS(T2)=10. T2 escribe X; luego T1 intenta leer X. ¿Resultado?',
      o: ['T1 se aborta porque 5 < W_TS(X)=10', 'T1 lee X y R_TS(X) pasa a valer 5', 'T2 se aborta por tener marca mayor', 'T1 espera a que T2 haga su COMMIT'],
      hint: 'Regla de lectura: compare TS(T) con W_TS(X).',
      exp: 'W_TS(X)=10 y TS(T1)=5 < 10: la lectura viola el orden temporal y T1 se aborta.' },
    { id: 'p2q23', l: 'p2l6', q: 'Actividad 4: A está en SNAPSHOT y lee 10. B actualiza a 4. A vuelve a leer dentro de su transacción. ¿Qué ve?',
      o: ['10, la versión de su instantánea', '4, el valor recién confirmado', 'Un error 1205 por conflicto', 'Se queda esperando a B'],
      hint: 'SNAPSHOT trabaja con versiones.',
      exp: 'Dentro de la instantánea A sigue viendo 10. Después del COMMIT, una nueva sentencia ve 4.' },
    { id: 'p2q24', l: 'p2l5', boss: true, q: 'Actividad 6: ¿cómo evitar disponibilidad negativa sin perder actualizaciones?',
      o: ['Un UPDATE que reste solo si Disponibles >= 1', 'Leer el saldo y guardar el valor calculado', 'Usar READ UNCOMMITTED en ambas sesiones', 'Quitar el CHECK y revisar al día siguiente'],
      hint: 'La guía pide un ÚNICO UPDATE y revisar @@ROWCOUNT.',
      exp: 'Un UPDATE condicionado (WHERE Disponibles >= 1) es atómico. Leer y luego guardar un valor calculado puede perder actualizaciones.' },
    { id: 'p2q25', l: 'p2l2', boss: true, q: 'Ejercicio 10: ¿es serializable por conflictos?', code: 'l3(X); e3(X); l2(X); e2(Y); l1(Y); e1(Z); l3(Z); c3; c2; c1;',
      o: ['No: T3→T2→T1→T3 es un ciclo', 'Sí: orden T3, T2, T1', 'Sí: orden T1, T2, T3', 'No: T2 y T3 nunca chocan'],
      hint: 'Revise X (T3 y T2), Y (T2 y T1) y Z (T1 y T3).',
      exp: 'X: T3→T2. Y: e2(Y) antes de l1(Y), T2→T1. Z: e1(Z) antes de l3(Z), T1→T3. Ciclo: no serializable.' }
  ],
  enemy: { name: 'Cerrojo Errante', sprite: 'lockbug' },
  boss: { id: 'b2', name: 'Locomotora Interbloqueo', sprite: 'train', hp: 6,
    intro: ['¡CHUU-CHUU! Yo retengo la vía A y espero la B. Mi otra cabeza retiene la B y espera la A.', 'Diay, ¿quién será la víctima? ¡Responda o nos quedamos aquí hasta mañana!'],
    win: ['Error 1205... fui elegida como víctima. ¡Liberando bloqueos!'] },
  chela: ['Aquí no hay deadlock, mi amor: usted agarra el vaso y yo agarro la plata. Siempre en el mismo orden.', 'Le guardo la partida en un plan serie: primero usted y después la fila, que está larguísima.'],
  minigames: ['graph', 'locks']
});

/* ---------------------------------------------------------------------
   FASE 3 · BÓVEDA DE LA TORMENTA · Guía #10 + Investigaciones (seguridad, contenedores)
   --------------------------------------------------------------------- */
P.push({
  id: 'p3', num: 3, theme: 'boveda',
  name: 'Bóveda de la Tormenta',
  place: 'Banco del Puerto · 1:30 a. m.',
  source: 'Guía #10 · Respaldo y recuperación · Resumen §5 y §6',
  story: [
    'Un rayo cayó sobre el Banco del Puerto. Los discos chisporrotean y la bóveda quedó a oscuras.',
    'Sin respaldos no hay recuperación. Y sin seguridad, cualquiera entra a la bóveda. Encienda la linterna.'
  ],
  npc: { name: 'Guardián Respaldo', sprite: 'guide', tint: '#8a7cff', lines: [
    '¡Llegó justo, mae! La tormenta corrompió la base y los Rayos Corruptos andan sueltos.',
    'Con la linterna solo ve cerquita. Las pizarras brillan: búsquelas.',
    'Aquí se aprende a respaldar, a restaurar y a cerrar bien la bóveda. Nada de dejar la puerta abierta.'
  ]},
  lessons: [
    { id: 'p3l1', title: 'Respaldo, recuperación y tipos de fallas', src: 'Guía #10',
      body: `<ul><li><b>Respaldo (backup)</b>: copia de seguridad de la base en un momento dado. Permite restaurar ante fallas físicas o lógicas.</li>
<li><b>Recuperación (recovery)</b>: devolver la base a un estado coherente después de una falla, usando los <b>archivos de respaldo</b> y los <b>logs de transacciones</b>.</li></ul>
<p><b>Tipos de fallas</b>:</p><ol><li><b>De transacción</b>: se aborta por errores lógicos o violaciones de restricciones.</li><li><b>Del sistema</b>: caída del servidor, reinicio inesperado.</li><li><b>Del disco</b>: pérdida de datos por errores en el almacenamiento físico.</li></ol>`,
      example: 'Las fotos del celular respaldadas en la nube: si se le cae el teléfono al mar (falla del disco), las recupera del respaldo.' },
    { id: 'p3l2', title: 'FULL, DIFFERENTIAL y LOG', src: 'Guía #10',
      body: `<table class="mini"><tr><th>Tipo</th><th>Qué guarda</th><th>¿Requiere FULL previo?</th><th>Tamaño</th><th>Uso</th></tr>
<tr><td>FULL</td><td>Toda la BD</td><td>No</td><td>Grande</td><td>Base de las restauraciones</td></tr>
<tr><td>DIFFERENTIAL</td><td>Cambios desde el último FULL</td><td>Sí</td><td>Medio</td><td>Respaldos frecuentes rápidos</td></tr>
<tr><td>LOG</td><td>Cambios desde el último LOG</td><td>Sí (y modelo FULL)</td><td>Pequeño</td><td>Recuperación punto a punto</td></tr></table>
<ul><li>El respaldo de LOG requiere modelo de recuperación <b>FULL o BULK_LOGGED</b>.</li>
<li>Con diferencial se restaura: <b>último FULL + último DIFFERENTIAL</b>.</li>
<li>Como cada LOG guarda solo lo ocurrido desde el LOG anterior, para llegar al momento de la falla se aplican <b>todos los LOG posteriores</b> a la última base restaurada, en orden.</li></ul>`,
      code: `SELECT name, recovery_model_desc FROM sys.databases WHERE name = 'MiBaseDeDatos';
ALTER DATABASE MiBaseDeDatos SET RECOVERY FULL;`,
      example: 'FULL = la mudanza completa. DIFFERENTIAL = todo lo que compró desde la mudanza. LOG = el recibo de cada compra, uno por uno.' },
    { id: 'p3l3', title: 'Sintaxis de BACKUP y RESTORE', src: 'Guía #10',
      body: `<ul><li>FULL es <b>implícito</b> si no se especifica el tipo.</li>
<li><code>FORMAT</code> crea un <b>nuevo conjunto de medios</b> y deja inutilizables los respaldos anteriores de ese destino.</li>
<li><code>INIT</code> sobrescribe los conjuntos de respaldo existentes y conserva el encabezado del medio. Con FORMAT, agregar INIT es redundante.</li>
<li><code>sp_addumpdevice</code> agrega un dispositivo de copias de seguridad.</li></ul>`,
      code: `BACKUP DATABASE MiBaseDeDatos TO DISK = 'C:\\Respaldo\\MiBD_FULL.bak'
  WITH FORMAT, INIT, NAME = 'Respaldo completo';
BACKUP DATABASE MiBaseDeDatos TO DISK = 'C:\\Respaldo\\MiBD_DIFF.bak'
  WITH DIFFERENTIAL, NAME = 'Respaldo diferencial';
BACKUP LOG MiBaseDeDatos TO DISK = 'C:\\Respaldo\\MiBD_LOG.trn' WITH INIT;
EXEC sp_addumpdevice 'disk', 'RESPALDO', 'C:\\BD\\RESPALDO.BAK';
RESTORE DATABASE BARES FROM DISK = 'C:\\RESPALDO\\BARES_FULL.BAK' WITH RECOVERY, REPLACE;`,
      example: 'FORMAT es comprar un cuaderno nuevo; INIT es borrar las páginas del mismo cuaderno pero conservar la portada.' },
    { id: 'p3l4', title: 'Protección de datos en SQL Server', src: 'Resumen §5 · Investigación grupo 1',
      body: `<ul><li><b>Autenticación</b> comprueba la identidad; <b>autorización</b> decide qué puede hacer. Permisos con <code>GRANT</code>, <code>DENY</code> y <code>REVOKE</code>, agrupados en <b>roles</b> con <b>mínimo privilegio</b>.</li>
<li><b>RLS (seguridad por fila)</b>: predicados de <i>filtrado</i> deciden qué filas se ven; predicados de <i>bloqueo</i> impiden escrituras que violen la política.</li>
<li><b>DDM (enmascaramiento dinámico)</b>: cambia cómo se <i>presenta</i> el dato; el valor almacenado no cambia.</li>
<li><b>Cifrado de columna</b>: protege el contenido con una clave (en el caso, AES-256 protegida por un certificado).</li>
<li><b>Auditoría</b>: registra acciones (un trigger guardó nota anterior, nueva y usuario). Una bitácora dentro de la misma base puede quedar expuesta a cuentas con muchos permisos; se propone SQL Server Audit con resultados fuera de la base.</li></ul>`,
      example: 'Un edificio: el guarda revisa su cédula (autenticación) y su tarjeta solo abre su piso (autorización). Las cámaras graban quién entró (auditoría).' },
    { id: 'p3l5', title: 'Bases de datos en contenedores', src: 'Resumen §6 · Investigación grupo 4',
      body: `<ul><li><b>Imagen</b>: empaqueta el motor y sus dependencias. <b>Contenedor</b>: instancia con procesos aislados que comparte el kernel del anfitrión. Una <b>VM</b> ejecuta su propio sistema operativo invitado.</li>
<li><b>Persistencia</b>: al eliminar el contenedor se pierde su capa de escritura. Use un <b>volumen nombrado</b> (lo administra Docker) o un <b>bind mount</b> (un directorio del host). El volumen se puede montar en un contenedor de reemplazo.</li>
<li><b>Puertos</b>: en <code>15433:1433</code>, el cliente externo usa el 15433 del host y SQL Server escucha en el 1433 del contenedor. Dentro de una red compartida se usa el nombre del servicio y el puerto interno.</li>
<li><b>Respaldo</b>: BACKUP/RESTORE (SQL Server), mysqldump (MySQL), mongodump/mongorestore (MongoDB). Para verificarlo, restaure en una instancia de prueba y consulte.</li></ul>`,
      example: 'La imagen es la receta, el contenedor es el plato servido y el volumen es la refri donde guarda lo que sobró: si bota el plato, la comida de la refri sigue ahí.' }
  ],
  questions: [
    { id: 'p3q1', l: 'p3l1', q: 'El servidor se reinicia de forma inesperada. ¿Qué tipo de falla es?',
      o: ['Falla del sistema', 'Falla de transacción', 'Falla del disco', 'Falla de restricción'],
      hint: 'La guía da tres tipos: transacción, sistema y disco.',
      exp: 'Caída del servidor o reinicio inesperado = falla del sistema.' },
    { id: 'p3q2', l: 'p3l1', q: 'Una transacción viola una restricción y se aborta. ¿Qué tipo de falla es?',
      o: ['Falla de transacción', 'Falla del sistema', 'Falla del disco', 'Falla del almacenamiento'],
      hint: 'El problema es lógico, no físico.',
      exp: 'Errores lógicos o violaciones de restricciones que abortan una transacción = falla de transacción.' },
    { id: 'p3q3', l: 'p3l1', q: 'Se dañó el almacenamiento físico y se perdieron datos. ¿Qué tipo de falla es?',
      o: ['Falla del disco', 'Falla del sistema', 'Falla de transacción', 'Falla de aislamiento'],
      hint: 'Almacenamiento físico...',
      exp: 'Pérdida de datos por errores en el almacenamiento físico = falla del disco.' },
    { id: 'p3q4', l: 'p3l1', q: 'Según la guía, ¿con qué se hace la recuperación?',
      o: ['Con archivos de respaldo y logs de transacciones', 'Solo con el último respaldo diferencial', 'Con el plan de ejecución y las estadísticas del motor', 'Con los índices y las claves foráneas'],
      hint: 'Son dos recursos.',
      exp: 'La recuperación usa los archivos de respaldo y los logs de transacciones para llegar a un estado coherente.' },
    { id: 'p3q5', l: 'p3l2', q: '¿Qué respaldo guarda los cambios desde el último FULL?',
      o: ['DIFFERENTIAL', 'LOG', 'FULL', 'BULK_LOGGED'],
      hint: 'Diferencia respecto del completo.',
      exp: 'DIFFERENTIAL: cambios desde el último FULL. LOG: cambios desde el último LOG.' },
    { id: 'p3q6', l: 'p3l2', q: '¿Qué respaldo permite recuperar hasta un punto exacto (point-in-time)?',
      o: ['LOG', 'FULL', 'DIFFERENTIAL', 'FORMAT'],
      hint: 'Es el más pequeño de los tres.',
      exp: 'El respaldo del log de transacciones permite recuperación punto a punto.' },
    { id: 'p3q7', l: 'p3l2', q: '¿Qué requiere el respaldo del log de transacciones?',
      o: ['Modelo de recuperación FULL o BULK_LOGGED', 'Modelo de recuperación SIMPLE activado', 'Que no exista ningún respaldo FULL previo', 'Que la base esté en modo de solo lectura'],
      hint: 'Revise la columna “Requiere” de la tabla.',
      exp: 'La base debe usar el modelo FULL o BULK_LOGGED (y tener un FULL previo).' },
    { id: 'p3q8', l: 'p3l2', q: 'Con respaldos diferenciales, ¿qué se restaura?',
      o: ['El último FULL y el último DIFFERENTIAL', 'Todos los DIFFERENTIAL, sin el FULL', 'El primer FULL y el primer DIFFERENTIAL', 'Solo el DIFFERENTIAL más reciente'],
      hint: 'Cada diferencial ya acumula todo desde el FULL.',
      exp: 'Se restaura el último FULL más el último DIFFERENTIAL (los diferenciales anteriores ya están incluidos en el último).' },
    { id: 'p3q9', l: 'p3l2', q: '¿Qué consulta muestra el modelo de recuperación de una base?',
      o: ['SELECT recovery_model_desc FROM sys.databases', 'ALTER DATABASE MiBaseDeDatos SET RECOVERY FULL', 'EXEC sp_addumpdevice \'disk\', \'RESPALDO\'', 'DBCC SHOW_STATISTICS(\'MiBase\', \'idx\')'],
      hint: 'Es una consulta, no un cambio.',
      exp: 'sys.databases tiene la columna recovery_model_desc. ALTER DATABASE ... SET RECOVERY sirve para cambiarlo.' },
    { id: 'p3q10', l: 'p3l3', q: 'En BACKUP ... WITH FORMAT, ¿qué hace FORMAT?',
      o: ['Crea un nuevo conjunto de medios', 'Comprime el archivo de respaldo', 'Verifica que el respaldo no esté dañado', 'Añade el respaldo al final del medio'],
      hint: 'Deja inutilizables los respaldos anteriores de ese destino.',
      exp: 'FORMAT crea un nuevo conjunto de medios; los respaldos anteriores de ese destino quedan inutilizables.' },
    { id: 'p3q11', l: 'p3l3', tf: true, q: 'Al usar FORMAT, agregar también INIT resulta redundante.',
      o: ['Verdadero', 'Falso'],
      hint: 'La guía lo dice textualmente.',
      exp: 'Verdadero. FORMAT ya reinicia el medio; INIT (sobrescribir conservando el encabezado) queda incluido.' },
    { id: 'p3q12', l: 'p3l3', q: 'Si en BACKUP DATABASE no se indica el tipo, ¿qué respaldo se hace?',
      o: ['FULL', 'DIFFERENTIAL', 'LOG', 'Ninguno: da error'],
      hint: 'Es el tipo “implícito”.',
      exp: 'FULL es implícito si no se especifica el tipo.' },
    { id: 'p3q13', l: 'p3l3', q: '¿Para qué sirve sp_addumpdevice?',
      o: ['Agregar un dispositivo de copias de seguridad', 'Crear un servidor vinculado a otra instancia remota', 'Cambiar el modelo de recuperación', 'Restaurar la base con RECOVERY'],
      hint: 'dump = volcado de respaldo.',
      exp: 'sp_addumpdevice registra un dispositivo (por ejemplo, un archivo en disco) para respaldos. Los servidores vinculados usan sp_addlinkedserver.' },
    { id: 'p3q14', l: 'p3l4', q: '¿Cuál es la diferencia entre autenticación y autorización?',
      o: ['La primera comprueba quién es; la segunda, qué puede hacer', 'La primera decide qué puede hacer; la segunda, quién es', 'Ambas significan exactamente lo mismo dentro de SQL Server', 'La primera cifra datos; la segunda los enmascara'],
      hint: 'Primero se identifica; después se dan permisos.',
      exp: 'Autenticación = identidad. Autorización = permisos de esa identidad (GRANT, DENY, REVOKE, roles).' },
    { id: 'p3q15', l: 'p3l4', q: 'Cada docente solo puede ver las notas de sus propios cursos. ¿Qué mecanismo es?',
      o: ['Seguridad por fila (RLS)', 'Enmascaramiento dinámico', 'Cifrado de columna', 'Auditoría con trigger'],
      hint: 'Se filtran FILAS según quién consulta.',
      exp: 'RLS: los predicados de filtrado determinan qué filas son visibles para cada usuario.' },
    { id: 'p3q16', l: 'p3l4', q: 'El personal ve las cédulas parcialmente ocultas, pero el valor guardado no cambia. ¿Qué mecanismo es?',
      o: ['Enmascaramiento dinámico (DDM)', 'Seguridad por fila (RLS)', 'Cifrado de columna', 'Roles con mínimo privilegio'],
      hint: 'Solo cambia la presentación.',
      exp: 'DDM cambia cómo se presenta el dato según los permisos; lo almacenado queda intacto.' },
    { id: 'p3q17', l: 'p3l4', q: 'El salario se protege con una clave simétrica AES-256 protegida por un certificado. ¿Qué mecanismo es?',
      o: ['Cifrado de columna', 'Enmascaramiento dinámico', 'Seguridad por fila', 'Auditoría'],
      hint: 'Hay una clave de por medio.',
      exp: 'Cifrado de columna: protege el contenido con una clave; descifrar se controla con permisos.' },
    { id: 'p3q18', l: 'p3l4', q: 'Un docente intenta mover una matrícula visible a un curso ajeno y se rechaza. ¿Qué lo impidió?',
      o: ['El predicado de bloqueo de RLS', 'El predicado de filtrado de RLS', 'La máscara dinámica (DDM)', 'El cifrado de la columna'],
      hint: 'La fila sí era visible; lo que se rechaza es lo que quiere dejar guardado.',
      exp: 'El predicado de bloqueo impide escrituras que violen la política. El de filtrado decide qué filas se ven.' },
    { id: 'p3q19', l: 'p3l4', q: '¿Qué comandos administran permisos en SQL Server?',
      o: ['GRANT, DENY y REVOKE', 'BEGIN, COMMIT y ROLLBACK', 'BACKUP, RESTORE y FORMAT', 'find, update y delete'],
      hint: 'Dar, negar y retirar.',
      exp: 'GRANT concede, DENY niega y REVOKE retira permisos. Se pueden agrupar en roles.' },
    { id: 'p3q20', l: 'p3l5', q: '¿Qué se pierde al eliminar un contenedor de base de datos sin volumen?',
      o: ['Su capa de escritura con los datos', 'La imagen del motor de base de datos', 'El kernel del sistema anfitrión', 'El puerto 1433 del equipo anfitrión'],
      hint: 'Por eso se usa un volumen.',
      exp: 'Al eliminar el contenedor se pierde su capa de escritura. Un volumen conserva los datos fuera de ella.' },
    { id: 'p3q21', l: 'p3l5', q: 'Con el mapeo 15433:1433, ¿qué puerto usa un cliente que está fuera de Docker?',
      o: ['El 15433 del host', 'El 1433 del host', 'El 15433 del contenedor', 'El 1433 de la red bridge'],
      hint: 'Formato host:contenedor.',
      exp: 'El cliente externo usa el 15433 del host; SQL Server escucha en el 1433 del contenedor.' },
    { id: 'p3q22', l: 'p3l5', q: '¿Qué conserva la imagen y qué conserva el volumen?',
      o: ['La imagen, el software; el volumen, los datos', 'La imagen, los datos; el volumen, el software', 'Ambos guardan solo la configuración de red', 'La imagen, los respaldos; el volumen, los logs'],
      hint: 'Se puede crear otro contenedor con la misma imagen y montar el mismo volumen.',
      exp: 'La imagen contiene el software del motor; el volumen conserva el estado de la base.' },
    { id: 'p3q23', l: 'p3l5', q: '¿En qué se diferencia un contenedor de una máquina virtual?',
      o: ['El contenedor comparte el kernel del anfitrión', 'El contenedor trae su propio sistema operativo invitado', 'La VM siempre inicia más rápido', 'La VM no puede ejecutar bases de datos'],
      hint: 'La VM tiene sistema operativo invitado propio.',
      exp: 'El contenedor comparte el kernel del anfitrión; la VM ejecuta su propio sistema operativo invitado.' },
    { id: 'p3q24', l: 'p3l5', boss: true, q: '¿Qué herramienta corresponde a respaldar y restaurar MongoDB?',
      o: ['mongodump / mongorestore', 'mysqldump', 'BACKUP / RESTORE', 'sp_addumpdevice'],
      hint: 'Cada motor tiene sus herramientas.',
      exp: 'mongodump/mongorestore en MongoDB, mysqldump en MySQL y BACKUP/RESTORE en SQL Server.' },
    { id: 'p3q25', l: 'p3l4', boss: true, q: 'Según el artículo, ¿qué limitación tiene una bitácora guardada dentro de la misma base?',
      o: ['Cuentas con muchos permisos podrían alterarla', 'No puede registrar cambios de notas', 'Solo funciona si la base está cifrada', 'Impide usar seguridad por fila'],
      hint: '¿Quién podría tocar esa tabla?',
      exp: 'Queda expuesta a cuentas con amplios permisos de estructura; se propone SQL Server Audit con resultados fuera de la base.' },
    { id: 'p3q26', l: 'p3l5', boss: true, q: '¿Cómo se verifica que un respaldo realmente sirve?',
      o: ['Restaurarlo en una instancia de prueba y consultar', 'Revisar que el archivo .bak pese más de un megabyte', 'Confiar en el mensaje de éxito del BACKUP', 'Volver a respaldarlo con FORMAT e INIT'],
      hint: 'Un respaldo vale lo que vale su restauración.',
      exp: 'Se restaura en una instancia de prueba y se comprueba que el esquema y los registros esperados estén disponibles.' }
  ],
  enemy: { name: 'Rayo Corrupto', sprite: 'cloud' },
  boss: { id: 'b3', name: 'Tormenta Corrupta', sprite: 'storm', hp: 6,
    intro: ['¡KRA-KOOOM! Partí el disco en mil pedazos. ¿Tiene su FULL? ¿Su DIFFERENTIAL? ¿Sus LOG en orden?', 'Y si no cerró bien la bóveda, ¡me llevo los salarios!'],
    win: ['¡Puta, restauró hasta el último LOG! La tormenta se disipa...'] },
  chela: ['Este limón es mi respaldo FULL y las galletas son el diferencial. Nunca salgo sin los dos.', '¿Mi receta? Cifrada con AES-256. Ni mi comadre la ve: le sale enmascarada.'],
  minigames: ['restore', 'keys']
});

/* ---------------------------------------------------------------------
   FASE 4 · MERCADO NOCTURNO DE LAS CONSULTAS · Guía #11 + Investigaciones
   --------------------------------------------------------------------- */
P.push({
  id: 'p4', num: 4, theme: 'mercado',
  name: 'Mercado Nocturno de las Consultas',
  place: 'Mercado del Puerto · 2:15 a. m.',
  source: 'Guía #11 · Optimización · Resumen §1, §3, §4, §8 y §10',
  story: [
    'En el Mercado Nocturno las consultas avanzan lentísimo. Un Gran Full Scan recorre puesto por puesto, fila por fila.',
    'Aquí se aprende a pedir solo lo necesario, a usar índices y a no hacer mil viajes por lo mismo.'
  ],
  npc: { name: 'Pulpero Índice', sprite: 'guide', tint: '#59c35b', lines: [
    '¡Bienvenido al mercado! Aquí el que sabe dónde buscar llega primero... y el que no, hace fila.',
    'Los clientes dan consejos: hábleles. Y vea las pizarras antes de toparse a las Babosas Scan.',
    'Hoy toca optimización, ORMs, caché con Redis y hasta minería de procesos. Es un brete, pero sale.'
  ]},
  lessons: [
    { id: 'p4l1', title: 'Cómo optimiza un SGBD', src: 'Guía #11',
      body: `<p><b>Optimizar</b> es que el SGBD elija la estrategia más eficiente para una consulta: menos tiempo y menos CPU, disco y memoria.</p>
<ol><li>Análisis sintáctico y semántico.</li><li>Reescritura de la consulta.</li><li>Generación de planes de ejecución.</li><li>Evaluación del costo (CPU, disco, memoria).</li><li>Selección del plan óptimo (el de menor costo estimado).</li></ol>
<ul><li><b>Heurística</b>: reglas generales, como “aplicar primero las condiciones de selección” o “reducir filas lo antes posible”.</li>
<li><b>Basada en costos</b>: estima el costo con estadísticas (cardinalidad, selectividad, número de bloques).</li></ul>
<p>Ejemplo de vinos: <code>Vinos</code> 500, <code>Cosechas</code> 1200, <code>cantidad &gt; 100</code> = 100 filas. Opciones: join→selección→proyección, <b>selección→join→proyección</b> (filtra primero) o producto cartesiano→selección→proyección.</p>`,
      example: 'Waze genera varias rutas, estima cuánto dura cada una con datos del tráfico y le da la más corta: eso es optimización basada en costos.' },
    { id: 'p4l2', title: 'Estrategias para consultas rápidas', src: 'Guía #11',
      body: `<ol><li>Índices en columnas de <code>WHERE</code>, <code>JOIN</code> y <code>ORDER BY</code>; índices compuestos si se filtra por varias columnas.</li>
<li><b>No aplicar funciones a columnas indexadas</b>: <code>YEAR(fecha) = 2024</code> impide usar el índice; mejor <code>fecha BETWEEN '2024-01-01' AND '2024-12-31'</code>.</li>
<li>Evitar <code>SELECT *</code>: solo las columnas necesarias.</li>
<li><code>EXISTS</code> en lugar de <code>IN</code> para subconsultas con muchas filas; <code>JOIN</code> en vez de subconsultas correlacionadas si es posible.</li>
<li>Filtrar temprano (WHERE antes de JOIN o agregaciones).</li>
<li>JOIN eficiente: primero las tablas con menos registros e índices en FK/PK.</li>
<li>Quitar <code>DISTINCT</code>, <code>ORDER BY</code>, <code>GROUP BY</code> o <code>UNION</code> innecesarios.</li></ol>`,
      example: 'Buscar en la guía telefónica por apellido (índice) es rapidísimo; buscar “todos los que nacieron en 2024” obliga a revisar página por página.' },
    { id: 'p4l3', title: 'Herramientas: estadísticas y plan de ejecución', src: 'Guía #11 · Resumen §1',
      body: `<ul><li><code>SET STATISTICS IO ON</code>: cuántas lecturas hace la consulta.</li>
<li><code>SET STATISTICS TIME ON</code>: tiempo de CPU y de ejecución.</li>
<li><code>DBCC SHOW_STATISTICS('Empleados','idx_fecha')</code>: detalles del índice y su distribución (histograma).</li>
<li><code>UPDATE STATISTICS Empleados</code>: actualiza estadísticas para mejorar las estimaciones.</li>
<li>Plan de ejecución real en SSMS: <b>Ctrl + M</b>. Muestra operadores (Index Scan, Index Seek, Nested Loop, Hash Join), costo relativo y si se usan índices.</li></ul>
<p>Tras <code>CREATE INDEX idx_fecha ON Empleados(fecha_contratacion)</code>, la consulta con BETWEEN puede pasar de un Scan a un <b>Index Seek</b>.</p>
<p>Ojo (Resumen §1): los índices aceleran lecturas, pero <b>añaden costo a las escrituras</b>.</p>`,
      example: 'Scan = leer el libro entero buscando una palabra. Seek = ir directo al índice del final y abrir la página exacta.' },
    { id: 'p4l4', title: 'ORMs y el problema N+1', src: 'Resumen §1, §3 y §4',
      body: `<p>El <b>ORM</b> traduce operaciones sobre objetos a consultas al SGBD. <b>N+1</b>: se listan N registros y luego se hace una consulta más por cada uno (10 clientes + sus pedidos = <b>11 consultas</b>). Solución: <b>carga anticipada</b>.</p>
<table class="mini"><tr><th>Tecnología</th><th>Carga relacionada</th><th>Transacción</th></tr>
<tr><td>EF Core (.NET)</td><td>Include</td><td>SaveChanges / BeginTransaction</td></tr>
<tr><td>Django</td><td>select_related (JOIN) / prefetch_related</td><td>transaction.atomic</td></tr>
<tr><td>Spring Boot</td><td>JOIN FETCH</td><td>@Transactional</td></tr>
<tr><td>Laravel</td><td>with (+ lockForUpdate)</td><td>DB::transaction</td></tr>
<tr><td>Node + Prisma</td><td>escrituras anidadas</td><td>$transaction</td></tr></table>
<ul><li><b>Optimista</b>: verifica al guardar que la versión no cambió (EF Core: RowVersion → DbUpdateConcurrencyException). <b>Pesimista</b>: bloquea la fila durante la operación.</li>
<li>Paginación: <code>skip/take</code> (desplazamiento, para saltar a una página) o <b>por cursor</b> (recorridos secuenciales de listas grandes). Siempre con orden estable.</li>
<li>Django: <code>aggregate</code> da un resumen global; <code>annotate</code>, un cálculo por fila.</li></ul>`,
      example: 'N+1 es ir a la pulpería diez veces por diez cosas, en vez de llevar la lista y comprar todo en un viaje.' },
    { id: 'p4l5', title: 'Caché con Redis', src: 'Resumen §8 · Investigación grupo 3',
      body: `<ul><li>Una caché guarda copias temporales de datos frecuentes para responder más rápido y leer menos del SGBD. La base principal conserva el dato oficial.</li>
<li><b>Cache aside</b>: la app consulta Redis. <b>Hit</b>: devuelve la copia. <b>Miss</b>: consulta la base, responde y guarda una copia con <b>TTL</b>.</li>
<li><b>Invalidación</b>: al confirmar un precio nuevo en la base se elimina la clave; la próxima lectura repuebla Redis.</li>
<li><b>Tasa de aciertos</b> = hits ÷ (hits + misses) × 100. Con 80 hits y 20 misses → 80 %.</li>
<li>En el caso: 120 ms directo al SGBD vs. 2 a 5 ms desde Redis. Si cada solicitud busca algo distinto, Redis ayuda poco.</li></ul>`,
      example: 'La señora del puesto ya tiene servido el ceviche más pedido (hit). Si le piden uno raro, lo prepara en el momento (miss) y deja otro listo por si acaso.' },
    { id: 'p4l6', title: 'Integración de datos y minería de procesos', src: 'Resumen §10 · Investigación grupo de minería',
      body: `<ul><li><b>Registro de eventos</b>: cada fila es una actividad en un caso. Campos mínimos: <b>caso, actividad y marca de tiempo</b> (puede llevar recurso, área o costo).</li>
<li>Preparación: correlacionar eventos con su caso, normalizar fechas, revisar duplicados. <code>JOIN</code> vincula, <code>UNION ALL</code> reúne tipos de eventos y <code>LAG</code>/<code>LEAD</code> calculan intervalos por caso.</li>
<li><b>Descubrimiento</b> reconstruye el proceso; <b>conformidad</b> lo compara con el esperado (pasos omitidos o fuera de orden); <b>mejora</b> agrega tiempos o recursos para hallar cuellos de botella.</li>
<li><b>DFG</b>: grafo de relaciones directas entre actividades. <b>Variante</b>: secuencia completa, como Recibido → Aprobado → Enviado.</li>
<li>Calidad del modelo: <b>ajuste</b>, <b>precisión</b>, <b>generalización</b> y <b>simplicidad</b>.</li></ul>`,
      example: 'Revisar el historial de un pedido de comida: Recibido → Preparando → En camino. Si salta de Recibido a Entregado, falta un paso (conformidad).' }
  ],
  questions: [
    { id: 'p4q1', l: 'p4l1', q: '¿Qué paso del proceso de optimización escoge el plan de menor costo estimado?',
      o: ['Selección del plan óptimo', 'Análisis sintáctico y semántico', 'Reescritura de la consulta', 'Generación de planes de ejecución'],
      hint: 'Es el último de los cinco pasos.',
      exp: 'Primero se generan y evalúan planes; en la selección del plan óptimo se elige el de menor costo.' },
    { id: 'p4q2', l: 'p4l1', q: '“Aplicar primero las condiciones de selección” es un ejemplo de optimización...',
      o: ['heurística', 'basada en costos', 'por fragmentación', 'por replicación'],
      hint: 'Es una regla general, no un cálculo.',
      exp: 'La optimización heurística usa reglas generales; la basada en costos usa estadísticas.' },
    { id: 'p4q3', l: 'p4l1', q: '¿Qué usa la optimización basada en costos para estimar cada plan?',
      o: ['Cardinalidad, selectividad y número de bloques', 'Reglas fijas como “filtrar lo antes posible”', 'El orden alfabético de las tablas', 'La cantidad de columnas del SELECT'],
      hint: 'Son estadísticas.',
      exp: 'Estima el costo con estadísticas como cardinalidad, selectividad y número de bloques.' },
    { id: 'p4q4', l: 'p4l1', q: 'En el ejemplo de vinos, ¿qué orden reduce más filas antes de combinar?',
      o: ['Selección, join, proyección', 'Join, selección, proyección', 'Producto cartesiano, selección, proyección', 'Proyección, producto cartesiano, selección'],
      hint: 'Regla heurística: reducir filas lo antes posible.',
      exp: 'Filtrar primero (cantidad > 100 deja 100 cosechas) hace que el join trabaje con menos filas.' },
    { id: 'p4q5', l: 'p4l2', q: '¿Por qué WHERE YEAR(fecha_contratacion) = 2020 es menos eficiente?',
      o: ['La función sobre la columna impide usar el índice', 'YEAR() devuelve las fechas con un formato incorrecto', 'SQL Server no permite comparar años', 'Obliga a ordenar toda la tabla antes de filtrar'],
      hint: 'Estrategia 2 de la guía.',
      exp: 'Aplicar una función a la columna impide usar el índice; con BETWEEN sí se puede usar.' },
    { id: 'p4q6', l: 'p4l2', q: '¿Cuál es la versión recomendada por la guía?',
      o: ['WHERE fecha BETWEEN \'2020-01-01\' AND \'2020-12-31\'', 'WHERE YEAR(fecha) = 2020', 'WHERE CONVERT(CHAR(4), fecha) = \'2020\'', 'WHERE DATEPART(year, fecha) = 2020 AND fecha IS NOT NULL'],
      hint: 'La columna debe quedar “limpia”, sin funciones.',
      exp: 'Con BETWEEN la columna queda sin funciones y SQL Server puede usar un índice sobre ella.' },
    { id: 'p4q7', l: 'p4l2', q: 'Para subconsultas con muchas filas, la guía recomienda usar...',
      o: ['EXISTS en lugar de IN', 'IN en lugar de EXISTS', 'DISTINCT dentro de la subconsulta', 'UNION en lugar de JOIN'],
      hint: 'Estrategia 4: normalización de condiciones.',
      exp: 'EXISTS en lugar de IN para subconsultas grandes, y JOIN en lugar de subconsultas correlacionadas cuando se pueda.' },
    { id: 'p4q8', l: 'p4l2', q: '¿En qué columnas conviene crear índices?',
      o: ['Las usadas en WHERE, JOIN y ORDER BY', 'Todas las columnas de todas las tablas', 'Solo las columnas de tipo texto', 'Las que nunca se consultan'],
      hint: 'Las que el motor usa para buscar, unir u ordenar.',
      exp: 'Índices en columnas de WHERE, JOIN y ORDER BY; compuestos si se filtra por varias.' },
    { id: 'p4q9', l: 'p4l3', q: '¿Qué muestra SET STATISTICS IO ON?',
      o: ['Cuántas lecturas realiza la consulta', 'El tiempo de CPU de la consulta', 'El histograma de un índice', 'El plan gráfico de ejecución con sus costos'],
      hint: 'IO = entrada/salida.',
      exp: 'STATISTICS IO muestra lecturas; STATISTICS TIME, tiempos; DBCC SHOW_STATISTICS, el histograma.' },
    { id: 'p4q10', l: 'p4l3', q: '¿Qué muestra DBCC SHOW_STATISTICS(\'Empleados\', \'idx_fecha\')?',
      o: ['Detalles del índice y su distribución', 'El número de lecturas lógicas', 'El tiempo total de la consulta', 'Los bloqueos activos en la tabla'],
      hint: 'Ahí se observa el histograma.',
      exp: 'Muestra detalles del índice y la distribución de los datos (histograma).' },
    { id: 'p4q11', l: 'p4l3', q: '¿Qué hace Ctrl + M en SSMS antes de ejecutar?',
      o: ['Incluye el plan de ejecución real', 'Activa SET STATISTICS IO y SET STATISTICS TIME', 'Crea un índice automáticamente', 'Actualiza las estadísticas'],
      hint: 'Sirve para ver operadores como Index Seek.',
      exp: 'Ctrl + M = “Incluir plan de ejecución real”: muestra operadores, costos y uso de índices.' },
    { id: 'p4q12', l: 'p4l3', q: 'Tras CREATE INDEX idx_fecha, ¿qué se espera ver en la consulta con BETWEEN?',
      o: ['Un Index Seek en lugar de un Scan', 'Un Table Scan en lugar de un Seek', 'Un Hash Join en lugar de un Seek', 'Ningún cambio en el plan'],
      hint: 'Seek = ir directo.',
      exp: 'Con el índice, el optimizador puede buscar directamente (Index Seek) en vez de recorrer todo.' },
    { id: 'p4q13', l: 'p4l3', tf: true, q: 'Los índices aceleran las lecturas, pero añaden costo a las escrituras.',
      o: ['Verdadero', 'Falso'],
      hint: 'Cada INSERT o UPDATE también debe actualizar el índice.',
      exp: 'Verdadero (Resumen §1). Por eso se crean según las consultas frecuentes, no en todas las columnas.' },
    { id: 'p4q14', l: 'p4l4', q: 'Se listan 10 clientes y luego se consultan por separado los pedidos de cada uno. ¿Cuántas consultas son?',
      o: ['11', '10', '20', '1'],
      hint: 'N + 1.',
      exp: '1 consulta para la lista + 10 (una por cliente) = 11. Es el problema N+1.' },
    { id: 'p4q15', l: 'p4l4', q: 'En Django, ¿qué usa JOIN para traer relaciones de valor único?',
      o: ['select_related', 'prefetch_related', 'annotate', 'aggregate'],
      hint: 'prefetch_related hace consultas separadas.',
      exp: 'select_related usa JOIN; prefetch_related hace consultas separadas y combina en Python.' },
    { id: 'p4q16', l: 'p4l4', q: '¿Con qué delimita Spring Boot una transacción en el servicio?',
      o: ['@Transactional', 'transaction.atomic', 'DB::transaction', '$transaction'],
      hint: 'Es una anotación de Java.',
      exp: 'Spring: @Transactional. Django: transaction.atomic. Laravel: DB::transaction. Prisma: $transaction.' },
    { id: 'p4q17', l: 'p4l4', q: '¿Con qué protege Laravel las filas mientras valida y descuenta stock?',
      o: ['lockForUpdate', 'AsNoTracking', 'JOIN FETCH', 'select_related'],
      hint: 'Es control pesimista: bloquear para actualizar.',
      exp: 'Laravel consulta los productos con lockForUpdate dentro de DB::transaction.' },
    { id: 'p4q18', l: 'p4l4', q: 'Dos vendedores leen 6 unidades a la vez. ¿Qué detecta EF Core con RowVersion?',
      o: ['Que la fila cambió: lanza DbUpdateConcurrencyException', 'Nada: el segundo guarda 4 y listo', 'Un interbloqueo entre ambos: SQL Server lanza el error 1205', 'Que falta un índice en la columna'],
      hint: 'Es control optimista.',
      exp: 'RowVersion detecta el cambio de versión y EF Core lanza DbUpdateConcurrencyException; se relee y se guarda 1.' },
    { id: 'p4q19', l: 'p4l4', q: '¿Qué diferencia hay entre el control optimista y el pesimista?',
      o: ['El optimista verifica al guardar; el pesimista bloquea', 'El optimista bloquea la fila; el pesimista verifica al final', 'Ambos bloquean la tabla completa', 'El optimista nunca detecta conflictos'],
      hint: 'Optimista: “seguro nadie lo cambió, pero lo reviso al final”.',
      exp: 'Optimista: verifica la versión al guardar. Pesimista: protege la fila con un bloqueo durante la operación.' },
    { id: 'p4q20', l: 'p4l4', q: '¿Para qué sirve mejor la paginación por cursor?',
      o: ['Recorrer en secuencia listas grandes', 'Saltar directo a la página 50', 'Ordenar al azar los resultados', 'Evitar definir un orden estable'],
      hint: 'skip/take facilita saltar a una página.',
      exp: 'El cursor parte de una posición identificable y sirve para recorridos secuenciales sobre listas grandes.' },
    { id: 'p4q21', l: 'p4l5', q: 'En cache aside, ¿qué pasa cuando hay un miss?',
      o: ['Se consulta la base, se responde y se guarda una copia con TTL', 'Se devuelve un error al usuario y se reintenta la consulta más tarde', 'Se reinicia Redis para cargar todo de nuevo', 'Se responde con la copia vieja aunque expiró'],
      hint: 'Miss = no estaba en Redis.',
      exp: 'Con miss, la app lee del SGBD, devuelve el resultado y guarda una copia con TTL.' },
    { id: 'p4q22', l: 'p4l5', q: 'Con 80 hits y 20 misses, ¿cuál es la tasa de aciertos?',
      o: ['80 %', '20 %', '25 %', '400 %'],
      hint: 'hits ÷ (hits + misses) × 100.',
      exp: '80 ÷ (80 + 20) × 100 = 80 %.' },
    { id: 'p4q23', l: 'p4l5', q: 'Se confirma un precio nuevo en la base. ¿Qué se hace con Redis?',
      o: ['Se elimina la clave del producto', 'Se copia Redis encima de la base', 'Se reinicia Redis por completo', 'Nada: la copia vieja es oficial'],
      hint: 'Invalidación explícita.',
      exp: 'Se invalida (elimina) la clave afectada; la próxima lectura trae el precio nuevo del SGBD y repuebla Redis.' },
    { id: 'p4q24', l: 'p4l6', q: '¿Cuáles son los campos mínimos de un registro de eventos?',
      o: ['Caso, actividad y marca de tiempo', 'Caso, recurso y costo', 'Actividad, área y usuario', 'Tabla de origen, columna y tipo de dato'],
      hint: 'Pedido 25, «Enviado», 10:30...',
      exp: 'Identificador del caso, actividad y marca de tiempo. Recurso, área o costo son opcionales.' },
    { id: 'p4q25', l: 'p4l6', q: 'Comparar el proceso observado con el esperado para detectar pasos omitidos es...',
      o: ['conformidad', 'descubrimiento', 'mejora', 'generalización'],
      hint: 'Se revisa si el proceso “cumple”.',
      exp: 'Conformidad compara con el proceso esperado. Descubrimiento lo reconstruye; mejora agrega tiempos o recursos.' },
    { id: 'p4q26', l: 'p4l6', q: '¿Qué ayuda a calcular intervalos entre eventos de un mismo caso?',
      o: ['LAG o LEAD', 'UNION ALL', 'DISTINCT', 'COUNT(*)'],
      hint: 'Funciones que miran la fila anterior o la siguiente.',
      exp: 'LAG/LEAD acceden al evento anterior o siguiente; UNION ALL sirve para reunir tipos de eventos.' },
    { id: 'p4q27', l: 'p4l6', boss: true, q: 'Pedido 26: Recibido → Enviado. ¿Qué permite detectar?',
      o: ['Una aprobación ausente que hay que contrastar', 'Una variante completa que respeta el orden previsto', 'Una aprobación repetida por reproceso', 'Un cuello de botella entre dos pasos'],
      hint: 'Compare con Recibido → Aprobado → Enviado.',
      exp: 'Falta “Aprobado”: hay que contrastarlo con el historial de origen.' },
    { id: 'p4q28', l: 'p4l4', boss: true, q: 'En Django, ¿qué diferencia hay entre aggregate y annotate?',
      o: ['aggregate da un resumen global; annotate, un valor por fila', 'aggregate da un valor por fila; annotate, un resumen global', 'Ambos ejecutan una transacción atómica', 'Ambos cargan relaciones con JOIN'],
      hint: 'Total de cursos vs. profesores por departamento.',
      exp: 'aggregate devuelve un resumen global (total de cursos); annotate agrega un cálculo por fila (profesores por departamento).' },
    { id: 'p4q29', l: 'p4l5', boss: true, q: '¿En qué caso Redis tendrá menos oportunidades de ayudar?',
      o: ['Cada solicitud busca un producto diferente', 'Un catálogo se lee muchas veces entre cambios', 'El mismo producto se consulta seguido', 'Se usa TTL e invalidación al editar'],
      hint: 'La caché sirve cuando se repiten las lecturas.',
      exp: 'Si casi nunca se repite la misma clave, casi todo será miss y la tasa de aciertos será baja.' }
  ],
  enemy: { name: 'Babosa Scan', sprite: 'slug' },
  boss: { id: 'b4', name: 'El Gran Full Scan', sprite: 'beetle', hp: 6,
    intro: ['Fiiila... por... fiiila... Yo leo TODO el mercado. ¿Índices? Para qué, si tengo tiempo.', 'SELECT * de la vida. ¡Pruebe que sabe hacerlo mejor!'],
    win: ['¿Index... Seek? Así se llega directo... Me voy a actualizar mis estadísticas.'] },
  chela: ['Mi ceviche tiene índice: el culantro siempre arriba, para que lo encuentre de un solo Seek.', '¿Caché? Ya tengo cinco vasitos servidos en la vitrina. Hit seguro, mi amor.'],
  minigames: ['rewrite', 'cache']
});

/* ---------------------------------------------------------------------
   FASE 5 · ARCHIPIÉLAGO DISTRIBUIDO · Guías #12 y #13 + Investigaciones
   --------------------------------------------------------------------- */
P.push({
  id: 'p5', num: 5, theme: 'islas',
  name: 'Archipiélago Distribuido',
  place: 'Islas del Puerto · 3:30 a. m.',
  source: 'Guía #12 · BD distribuidas · Guía #13 · MongoDB · Resumen §7 y §9',
  story: [
    'La base del puerto quedó repartida entre islas. Cada isla tiene un pedazo... y nadie sabe dónde está cada cosa.',
    'Para cruzar hay que entender la fragmentación, la replicación, el commit en dos fases y los documentos de MongoDB.'
  ],
  npc: { name: 'Navegante Nodo', sprite: 'guide', tint: '#3fa9f5', lines: [
    '¡Upe! Los puentes entre islas aparecen cuando cada nodo se sincroniza.',
    'Esas placas brillantes del suelo son servidores vinculados: lo llevan de una isla a otra.',
    'Las Medusas Nodo pican si no sabe dónde están los datos. Vea las pizarras antes de nadar... digo, de pelear.'
  ]},
  lessons: [
    { id: 'p5l1', title: 'Bases de datos distribuidas', src: 'Guía #12',
      body: `<p>Una <b>BDD</b> es un conjunto de bases físicamente distribuidas en varios nodos, pero lógicamente integradas: el usuario la ve como <b>una sola</b>.</p>
<p><b>Transparencias</b>: de <b>localización</b> (no sabe dónde están los datos), de <b>replicación</b> (no importa cuántas copias hay), de <b>fragmentación</b> (no sabe cómo se dividieron), de <b>concurrencia</b> (muchos usuarios sin conflictos) y de <b>fallos</b> (sigue funcionando ante fallos parciales).</p>
<ul><li><b>Homogénea</b>: todos los nodos con el mismo SGBD y sistema operativo.</li><li><b>Heterogénea</b>: distintos SGBD, esquemas y plataformas.</li></ul>
<p>Ventajas: disponibilidad, rendimiento por localización, escalabilidad, balanceo. Desventajas: complejidad, <b>costos de comunicación</b>, integridad y consistencia más difíciles, recuperación más complicada.</p>`,
      example: 'Una cadena de supermercados: usted pregunta “¿hay arroz?” y el sistema responde, aunque el dato esté en la bodega de otra provincia.' },
    { id: 'p5l2', title: 'Fragmentación y replicación', src: 'Guía #12',
      body: `<ul><li><b>Horizontal</b>: las <b>filas</b> se reparten entre nodos (Clientes por país).</li>
<li><b>Vertical</b>: las <b>columnas</b> se reparten (datos personales en un nodo, financieros en otro).</li>
<li><b>Mixta</b>: combinación de ambas.</li></ul>
<ul><li>Replicación <b>total</b>: cada nodo tiene copia completa.</li><li><b>Parcial</b>: solo ciertas partes se replican.</li><li><b>Sin replicación</b>: cada dato en un solo nodo.</li></ul>
<p>Tipos de fallo: de nodo, de red, de software y de disco. Técnicas: logs distribuidos, protocolos de recuperación y replicación redundante.</p>`,
      example: 'Horizontal: cada profe tiene la lista de SUS estudiantes. Vertical: secretaría tiene nombres y teléfonos; financiero tiene los cobros de todos.' },
    { id: 'p5l3', title: '2PC y servidores vinculados', src: 'Guía #12',
      body: `<p>ACID en entornos distribuidos: bloqueo distribuido (<b>2PL</b>), control <b>multiversión</b> y el protocolo <b>Two-Phase Commit (2PC)</b>: <b>Fase 1: Preparar</b>. <b>Fase 2: Confirmar o deshacer</b>. Si un nodo no puede prepararse, la transacción se deshace en todos para conservar la atomicidad.</p>
<p>En SQL Server Express se usan <b>servidores vinculados</b>. Requisitos: varias instancias, TCP/IP activo, acceso remoto (puerto <b>1433</b>) y autenticación mixta.</p>`,
      code: `EXEC sp_addlinkedserver @server = 'Sucursal2', @srvproduct = '',
  @provider = 'MSOLEDBSQL', @datasrc = '192.168.42.213,1433';
EXEC sp_addlinkedsrvlogin @rmtsrvname = 'Sucursal2', @useself = 'false',
  @rmtuser = 'usuario_sql', @rmtpassword = 'tu_clave';
SELECT * FROM Sucursal2.TiendaSucursal2.dbo.Productos;  -- servidor.base.esquema.tabla`,
      example: '2PC es como organizar un paseo: primero pregunta a todos “¿pueden ir?” (preparar). Solo si todos dicen sí, se confirma; si uno no puede, se cancela para todos.' },
    { id: 'p5l4', title: 'MongoDB frente a SQL Server', src: 'Guía #13',
      body: `<ul><li>NoSQL de <b>documentos</b> JSON guardados como <b>BSON</b> (JSON binario), agrupados en <b>colecciones</b>.</li>
<li><b>Esquema flexible</b>, escalabilidad <b>horizontal</b>, <b>réplicas</b> para alta disponibilidad, índices y un <b>_id</b> único por documento.</li>
<li><b>Compass</b> es el entorno gráfico que se instala con el servidor. El lenguaje es <b>MQL</b>.</li>
<li>Transacciones: desde la v4.0, con restricciones. Relaciones: manuales o embebidas (referencias o subdocumentos). Procedimientos almacenados: no nativos (la lógica va en la app).</li>
<li>SQL Server: tablas con esquema rígido, T-SQL, llaves foráneas, archivos MDF/LDF, SSMS; casos ERP, banca y contabilidad.</li></ul>`,
      example: 'SQL Server es un formulario con casillas fijas. MongoDB es una carpeta de fichas: cada ficha puede traer campos distintos.' },
    { id: 'p5l5', title: 'Consultas MQL', src: 'Guía #13',
      body: `<ul><li><code>use ucr_db</code>; <code>insertOne({...})</code>, <code>insertMany([...])</code>.</li>
<li><code>find()</code> trae todo; <code>find({ nombre: "Ariel" })</code> filtra por igualdad.</li>
<li>Comparaciones: <code>$gt</code> (&gt;), <code>$lt</code> (&lt;), <code>$gte</code> (≥), <code>$lte</code> (≤), <code>$ne</code> (≠): <code>{ edad: { $gt: 25 } }</code>.</li>
<li>AND implícito: <code>{ carne: "C789123", edad: 22 }</code>. OR explícito: <code>{ $or: [ {...}, {...} ] }</code>.</li>
<li><code>updateOne({ nombre: "Dilana" }, { $set: { edad: 27 } })</code>.</li>
<li><code>deleteOne({...})</code> y <code>deleteMany({ edad: 25 })</code>.</li>
<li>Campos de subdocumentos con punto: <code>{ "aula.ubicacion": "Edificio A" }</code> (lo piden los ejercicios 16 y 17).</li></ul>`,
      code: `db.cursos.find({ cantidad_estudiantes: { $gt: 25 } })
db.cursos.find({ $or: [ { profesor: "Ana" }, { profesor: "Carlos" } ] })`,
      example: 'find es como decirle a la bibliotecaria: “tráigame los libros de más de 300 páginas que no sean de Carlos”.' },
    { id: 'p5l6', title: 'Modelos NoSQL y búsqueda semántica', src: 'Resumen §7 y §9',
      body: `<table class="mini"><tr><th>Modelo</th><th>Uso en la tienda</th></tr><tr><td>Documentos · MongoDB</td><td>Catálogo con atributos distintos por categoría</td></tr><tr><td>Clave-valor · Redis</td><td>Carrito por id de usuario o sesión</td></tr><tr><td>Familias de columnas · Cassandra</td><td>Historial de compras por cliente o periodo</td></tr><tr><td>Grafos · Neo4j</td><td>Recomendaciones por conexiones</td></tr><tr><td>Relacional · MySQL</td><td>Pedidos, pagos e inventario oficiales</td></tr></table>
<ul><li>Escalar <b>vertical</b> = más recursos al servidor; <b>horizontal</b> = repartir entre nodos. Historial y recomendaciones toleran consistencia eventual.</li>
<li><b>Embedding</b>: vector que representa el contenido; use el mismo modelo para documentos y preguntas. En pgvector, <code>&lt;=&gt;</code> da la <b>distancia coseno</b>: <b>menor = más cercano</b>. <b>HNSW</b> acelera la búsqueda aproximada, aunque puede omitir algunos vecinos.</li>
<li><b>Precisión@k</b>: fracción relevante de los k resultados (3 de 5 → 60 %). <b>Recall</b>: proporción de relevantes recuperados.</li></ul>`,
      example: 'Búsqueda semántica: pregunta “¿qué pasa si pierdo un curso varias veces?” y encuentra el artículo de “matrícula por tercera vez”, aunque no use las mismas palabras.' }
  ],
  questions: [
    { id: 'p5q1', l: 'p5l1', q: 'Un usuario consulta clientes sin saber en qué nodo están guardados. ¿Qué transparencia es?',
      o: ['De localización', 'De replicación', 'De fragmentación', 'De fallos'],
      hint: '“No necesita saber DÓNDE están los datos”.',
      exp: 'Transparencia de localización: el usuario no necesita saber dónde están los datos.' },
    { id: 'p5q2', l: 'p5l1', q: 'Los nodos usan distintos SGBD y plataformas. ¿Qué tipo de sistema es?',
      o: ['Heterogéneo', 'Homogéneo', 'Centralizado', 'Replicado'],
      hint: 'Hetero = distinto.',
      exp: 'Heterogéneo: distintos SGBD, esquemas y plataformas. Homogéneo: mismo SGBD y SO.' },
    { id: 'p5q3', l: 'p5l1', q: '¿Cuál de estas es una DESVENTAJA de las bases distribuidas?',
      o: ['Costos de comunicación entre nodos', 'Mayor disponibilidad y confiabilidad', 'Escalabilidad agregando nodos', 'Balanceo de carga entre nodos'],
      hint: 'Tres de las opciones son ventajas de la guía.',
      exp: 'Los costos de comunicación entre nodos son una desventaja; las demás son ventajas.' },
    { id: 'p5q4', l: 'p5l2', q: 'La tabla Clientes se divide por país: cada nodo guarda las filas de su país. ¿Qué fragmentación es?',
      o: ['Horizontal', 'Vertical', 'Mixta', 'Replicación total'],
      hint: 'Se reparten FILAS.',
      exp: 'Fragmentación horizontal: las filas se dividen entre nodos.' },
    { id: 'p5q5', l: 'p5l2', q: 'Los datos personales quedan en un nodo y los financieros en otro. ¿Qué fragmentación es?',
      o: ['Vertical', 'Horizontal', 'Mixta', 'Sin replicación'],
      hint: 'Se reparten COLUMNAS.',
      exp: 'Fragmentación vertical: las columnas se dividen entre nodos.' },
    { id: 'p5q6', l: 'p5l2', q: 'Cada nodo tiene una copia completa de la base. ¿Qué tipo de replicación es?',
      o: ['Total', 'Parcial', 'Sin replicación', 'Mixta'],
      hint: 'Copia completa en cada nodo.',
      exp: 'Replicación total: cada nodo tiene una copia completa. Parcial: solo algunas partes.' },
    { id: 'p5q7', l: 'p5l3', q: '¿Cuáles son las fases del Two-Phase Commit (2PC)?',
      o: ['Preparar; luego confirmar o deshacer', 'Bloquear; luego liberar los bloqueos', 'Respaldar; luego restaurar los nodos', 'Leer; luego escribir en cada nodo'],
      hint: 'Bloquear/liberar es otro protocolo (2PL).',
      exp: '2PC: Fase 1 preparar, Fase 2 confirmar o deshacer. 2PL (crecer/contraer bloqueos) es otra cosa.' },
    { id: 'p5q8', l: 'p5l3', q: 'En 2PC, un nodo no logra prepararse. ¿Qué debe pasar?',
      o: ['Se deshace la transacción en todos los nodos', 'Se confirma solo en los nodos que pudieron', 'Se espera indefinidamente a ese nodo', 'Se confirma y luego se repara el nodo'],
      hint: 'Atomicidad, pero distribuida.',
      exp: 'Si un participante no puede prepararse, la fase 2 es deshacer en todos: o todos confirman o ninguno.' },
    { id: 'p5q9', l: 'p5l3', q: '¿Qué procedimiento crea un servidor vinculado?',
      o: ['sp_addlinkedserver', 'sp_addlinkedsrvlogin', 'sp_addumpdevice', 'sp_addrolemember'],
      hint: 'El de login configura las credenciales.',
      exp: 'sp_addlinkedserver crea el vínculo; sp_addlinkedsrvlogin configura la autenticación remota.' },
    { id: 'p5q10', l: 'p5l3', q: '¿Cómo se escribe una consulta a una tabla de un servidor vinculado?',
      o: ['Sucursal2.TiendaSucursal2.dbo.Productos', 'dbo.Sucursal2.Productos.TiendaSucursal2', 'TiendaSucursal2.Productos.Sucursal2.dbo', 'Productos.dbo.TiendaSucursal2.Sucursal2'],
      hint: 'servidor.base.esquema.tabla',
      exp: 'Nombre de cuatro partes: servidor.base.esquema.tabla.' },
    { id: 'p5q11', l: 'p5l3', q: '¿Qué puerto TCP aparece en la guía para permitir el acceso remoto a SQL Server?',
      o: ['1433', '15433', '27017', '6379'],
      hint: 'También es el puerto interno del contenedor de SQL Server.',
      exp: 'SQL Server escucha por defecto en TCP 1433 (la instancia predeterminada).' },
    { id: 'p5q12', l: 'p5l4', q: '¿En qué formato almacena MongoDB los documentos?',
      o: ['BSON', 'CSV', 'XML', 'MDF'],
      hint: 'JSON binario.',
      exp: 'MongoDB guarda los documentos como BSON (Binary JSON). MDF/LDF son archivos de SQL Server.' },
    { id: 'p5q13', l: 'p5l4', q: '¿Qué campo identifica de forma única cada documento de una colección?',
      o: ['_id', 'id_documento', 'PRIMARY', 'rowid'],
      hint: 'Empieza con guion bajo.',
      exp: 'Cada documento tiene un _id único dentro de su colección.' },
    { id: 'p5q14', l: 'p5l4', q: '¿Cómo maneja MongoDB los procedimientos almacenados, según la guía?',
      o: ['No son nativos: la lógica va en la app', 'Igual que T-SQL, con EXEC', 'Se escriben en MQL con CREATE PROC', 'Solo existen en MongoDB Compass'],
      hint: 'Revise la fila de la tabla comparativa.',
      exp: 'En MongoDB los procedimientos almacenados no son nativos; la lógica vive en la aplicación.' },
    { id: 'p5q15', l: 'p5l5', q: 'Ejercicio 3: cursos con MÁS de 25 estudiantes.',
      o: ['db.cursos.find({ cantidad_estudiantes: { $gt: 25 } })', 'db.cursos.find({ cantidad_estudiantes: { $gte: 25 } })', 'db.cursos.find({ cantidad_estudiantes: { $lt: 25 } })', 'db.cursos.find({ cantidad_estudiantes: 25 })'],
      hint: '“Más de” no incluye el 25.',
      exp: '$gt es estrictamente mayor. $gte incluiría también los cursos con 25.' },
    { id: 'p5q16', l: 'p5l5', q: 'Ejercicio 5: cursos que NO son impartidos por Carlos.',
      o: ['db.cursos.find({ profesor: { $ne: "Carlos" } })', 'db.cursos.find({ profesor: { $lt: "Carlos" } })', 'db.cursos.find({ profesor: "Carlos" })', 'db.cursos.find({ $or: [ { profesor: "Carlos" } ] })'],
      hint: 'ne = not equal.',
      exp: '$ne significa “diferente de”.' },
    { id: 'p5q17', l: 'p5l5', q: 'Ejercicio 14: cursos con más de 20 y menos de 35 estudiantes.',
      o: ['find({ cantidad_estudiantes: { $gt: 20, $lt: 35 } })', 'find({ cantidad_estudiantes: { $gte: 20, $lte: 35 } })', 'find({ $or: [ { $gt: 20 }, { $lt: 35 } ] })', 'find({ cantidad_estudiantes: { $ne: 20, $ne: 35 } })'],
      hint: 'Dos comparaciones estrictas sobre el mismo campo.',
      exp: 'Con $gt: 20 y $lt: 35 sobre el mismo campo se piden ambas condiciones (AND).' },
    { id: 'p5q18', l: 'p5l5', q: 'Ejercicio 16: cursos cuya aula está en el “Edificio A”.',
      o: ['find({ "aula.ubicacion": "Edificio A" })', 'find({ ubicacion: "Edificio A" })', 'find({ aula: "Edificio A" })', 'find({ "aula.numero": "Edificio A" })'],
      hint: 'La ubicación vive dentro del subdocumento aula.',
      exp: 'Se usa notación de punto: "aula.ubicacion".' },
    { id: 'p5q19', l: 'p5l5', q: '¿Cómo se cambia la edad de Dilana a 27?',
      o: ['updateOne({ nombre: "Dilana" }, { $set: { edad: 27 } })', 'updateOne({ edad: 27 }, { $set: { nombre: "Dilana" } })', 'insertOne({ nombre: "Dilana", edad: 27 })', 'find({ nombre: "Dilana" }, { edad: 27 })'],
      hint: 'Primero el filtro, después el cambio con $set.',
      exp: 'updateOne(filtro, { $set: {...} }): el primer objeto busca y el segundo indica qué cambiar.' },
    { id: 'p5q20', l: 'p5l5', q: 'De los 4 cursos de la guía (30, 25, 35 y 20 estudiantes), ¿cuántos quedan tras deleteMany({ cantidad_estudiantes: { $lt: 30 } })?',
      o: ['2', '1', '3', '0'],
      hint: '¿Cuáles tienen menos de 30?',
      exp: 'Se eliminan los de 25 y 20. Quedan Matemática I (30) y Biología (35): 2 cursos.' },
    { id: 'p5q21', l: 'p5l6', q: 'Recuperar el carrito por el id de la sesión. ¿Qué modelo NoSQL encaja mejor?',
      o: ['Clave-valor (Redis)', 'Grafos (Neo4j)', 'Documentos (MongoDB)', 'Columnas (Cassandra)'],
      hint: 'Acceso directo por una clave conocida.',
      exp: 'Si siempre se accede por una clave conocida, el modelo clave-valor simplifica la lectura.' },
    { id: 'p5q22', l: 'p5l6', q: 'Recomendar productos a partir de conexiones entre clientes y productos. ¿Qué modelo encaja?',
      o: ['Grafos (Neo4j)', 'Clave-valor (Redis)', 'Relacional (MySQL)', 'Columnas (Cassandra)'],
      hint: 'Recorrer conexiones.',
      exp: 'Un grafo modela directamente los recorridos cliente → producto → otros clientes → otros productos.' },
    { id: 'p5q23', l: 'p5l6', q: 'En pgvector, ¿qué devuelve el operador <=>?',
      o: ['La distancia coseno: menor es más cercano', 'La distancia coseno: mayor es más cercano', 'Cuántas palabras tienen en común', 'La precisión@k del resultado'],
      hint: 'Es una DISTANCIA.',
      exp: '<=> devuelve la distancia coseno; los valores menores indican mayor cercanía.' },
    { id: 'p5q24', l: 'p5l6', q: 'De 5 artículos devueltos, 3 son pertinentes. ¿Cuál es la precisión@5?',
      o: ['60 %', '30 %', '50 %', '35 %'],
      hint: 'Pertinentes ÷ k.',
      exp: '3 ÷ 5 = 0,6 → 60 %.' },
    { id: 'p5q25', l: 'p5l6', q: '¿Qué hace un índice HNSW en la búsqueda de vectores?',
      o: ['Acelera la búsqueda aproximada; puede omitir vecinos', 'Garantiza encontrar siempre todos los vecinos', 'Convierte el texto en embeddings', 'Cifra los vectores con AES-256'],
      hint: 'Se gana velocidad a cambio de algo.',
      exp: 'HNSW explora solo parte de los vectores: es más rápido, pero algunos resultados cercanos pueden omitirse.' },
    { id: 'p5q26', l: 'p5l5', boss: true, q: 'Ejercicio 13: cursos impartidos por Ana o Carlos.',
      o: ['find({ $or: [ { profesor: "Ana" }, { profesor: "Carlos" } ] })', 'find({ profesor: "Ana", profesor: "Carlos" })', 'find({ profesor: { $ne: "Ana" } })', 'find({ $or: { profesor: "Ana Carlos" } })'],
      hint: 'OR explícito con un arreglo de condiciones.',
      exp: '$or recibe un arreglo de condiciones. Poner la misma clave dos veces en un objeto no expresa un OR.' },
    { id: 'p5q27', l: 'p5l4', boss: true, q: '¿Desde qué versión soporta MongoDB transacciones, según la guía?',
      o: ['Desde la v4.0, con restricciones', 'Desde la v1.0, sin restricciones', 'Nunca las ha soportado', 'Solo dentro de Compass'],
      hint: 'Fila “Transacciones” de la tabla comparativa.',
      exp: 'La guía indica: transacciones desde la v4.0, con restricciones.' },
    { id: 'p5q28', l: 'p5l6', boss: true, q: '¿Qué datos de la tienda propuesta se mantienen en el motor relacional?',
      o: ['Pedidos, pagos e inventario oficiales', 'El carrito por sesión del usuario', 'Las recomendaciones de productos', 'El catálogo con atributos variables'],
      hint: 'Los que requieren comprobar importes, estados y relaciones.',
      exp: 'Pedidos y pagos tienen reglas estrictas: se mantienen en el relacional como fuente oficial.' }
  ],
  enemy: { name: 'Medusa Nodo', sprite: 'jelly' },
  boss: { id: 'b5', name: 'Kraken Fragmentado', sprite: 'kraken', hp: 6,
    intro: ['¡Cada tentáculo guarda un fragmento! Uno tiene las filas de Limón, otro las columnas de salarios...', '¿Sabe reunirme sin perder la consistencia? ¡Prepárese... y luego confirme!'],
    win: ['¡Qué mierda! Todos los nodos votaron COMMIT... Me reintegro en una sola base.'] },
  chela: ['Tengo replicación total: un puestito igualito en cada isla. Transparencia de localización, ¿vio?', 'Esquema flexible: hoy le pongo mango al ceviche y mañana no. Al estilo MongoDB.'],
  minigames: ['cut', 'mql']
});

/* ---------------------------------------------------------------------
   FINAL · TORRE DEL SERVIDOR · Profe Mauricio
   --------------------------------------------------------------------- */
const FINAL = {
  id: 'final', theme: 'torre',
  name: 'Torre del Servidor Central',
  place: 'Torre Nyder · 4:45 a. m.',
  source: 'Repaso de todas las fases',
  story: [
    'Los cinco núcleos están restaurados. Solo falta volver a encender el Servidor Central, en lo alto de la Torre.',
    'Allí lo espera el Profe Mauricio. Ha guiado toda la noche por radio... y ahora quiere ver qué aprendió.'
  ],
  boss: { id: 'bf', name: 'Profe Mauricio', sprite: 'mauricio', perPhase: 3,
    acts: [
      { title: 'Acto I · Transacciones y planificación', phases: ['p1', 'p2'],
        intro: ['Buenas noches, Kai. Bien hecho con los núcleos.', 'Pero el servidor no se enciende con suerte: se enciende con conceptos claros. Arranquemos por transacciones y planificación.'] },
      { title: 'Acto II · Respaldo y optimización', phases: ['p3', 'p4'],
        intro: ['Nada mal. Ahora, si mañana se cae el disco... ¿tiene sus respaldos? Porque “creo que sí” no es un plan.', 'Y que sus consultas no sean un Full Scan, por favor. Me da cosa.'] },
      { title: 'Acto III · Distribuidas y NoSQL, más un repaso de todo', phases: ['p5', 'p1', 'p2', 'p3', 'p4'],
        intro: ['Última parte. Datos repartidos por todo el puerto, documentos, vectores...', 'Y de vez en cuando le repito algo que antes le costó. No es venganza: así se estudia.'] }
    ],
    lines: {
      right: ['Correcto. Eso viene en la guía, así que ya sabe dónde repasarlo.', 'Muy bien. Así se responde.', '¡Diay, sí sabía! Siguiente.', 'Bien. Siguiente.', 'Correcto, y con buena justificación.'],
      wrong: ['Casi. Lea con calma la explicación; esto se repasa.', 'Tranquilo: equivocarse aquí es mejor que en el examen.', 'Esa es la trampa de siempre. Fíjese en la diferencia.', 'Respire, mae. Mire la explicación y seguimos.'],
      win: ['Kai, aprobó la prueba de la Torre.', 'El servidor está encendido, los respaldos están en orden y las consultas vuelan.', 'Ahora vaya a descansar... pero antes, respalde. Siempre respalde.'],
      lose: ['Se le acabó la energía, pero no el semestre. Erika le guardó un ceviche.', 'Repase sus errores en la Libreta y vuelva a subir.']
    }
  },
  chela: ['Ese señor de la torre es buenísima gente, pero pregunta de TODO. Cómase este, va por la casa.', 'Si se equivoca, no se me achicopale: para eso existe el ROLLBACK.']
};

/* ---------------------------------------------------------------------
   DATOS DE LOS MINIJUEGOS (todos tomados de las guías)
   --------------------------------------------------------------------- */
const MG = {
  crane: {
    title: 'La Grúa Transaccional', phase: 'p1', lessons: ['p1l2'],
    intro: 'Suba los contenedores en el orden correcto. Haga clic en las líneas de código en el orden en que deben ejecutarse.',
    rounds: [
      { name: 'Transferencia con TRY/CATCH (Guía #8)', lines: ['BEGIN TRY', 'BEGIN TRANSACTION;', 'UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1;', 'UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2;', 'COMMIT;', 'END TRY', 'BEGIN CATCH', 'ROLLBACK;', 'END CATCH'],
        why: 'Todo el trabajo va en el TRY y termina con COMMIT. Si algo falla, la ejecución salta al CATCH, que revierte con ROLLBACK.' },
      { name: 'Savepoints del Ejercicio 5', lines: ['BEGIN TRANSACTION;', 'UPDATE Productos SET stock = stock - 2 WHERE id_producto = 1;', 'SAVE TRANSACTION paso1;', 'UPDATE Productos SET stock = stock - 5 WHERE id_producto = 2;', 'SAVE TRANSACTION paso2;', 'UPDATE Productos SET stock = stock - 100 WHERE id_producto = 3;', 'ROLLBACK TRANSACTION paso2;', 'COMMIT;'],
        why: 'Tras cada paso bueno se guarda un savepoint. El error del producto 3 se revierte hasta paso2 y el COMMIT confirma los productos 1 y 2.' }
    ]
  },
  sorter: {
    title: 'Clasificador de Anomalías', phase: 'p1', lessons: ['p1l4'],
    intro: 'Cada caja trae una situación. Mándela a la bodega correcta: sucia, no repetible o fantasma.',
    bins: ['Lectura sucia', 'Lectura no repetible', 'Lectura fantasma'],
    cards: [
      { t: 'B lee el saldo que A modificó, pero A aún no confirma. Luego A hace ROLLBACK.', b: 0 },
      { t: 'Celebra un gol que segundos después el VAR anula.', b: 0 },
      { t: 'A lee el stock (10). B lo cambia a 6 y confirma. A vuelve a leer y ve 6.', b: 1 },
      { t: 'Ve el precio del arroz, se da vuelta y al volver a mirar ya cambió.', b: 1 },
      { t: 'A consulta los pedidos del cliente 5; al repetir la consulta aparece un pedido nuevo.', b: 2 },
      { t: 'Cuenta a las personas de la fila del bus; al recontar hay dos personas más.', b: 2 },
      { t: 'B lee con READ UNCOMMITTED un “Disponibles = 2” que A después revierte a 10.', b: 0 },
      { t: 'Con REPEATABLE READ, el segundo SELECT por fecha muestra una factura recién insertada.', b: 2 }
    ]
  },
  graph: {
    title: 'Grafo de Vías', phase: 'p2', lessons: ['p2l2'],
    intro: 'Conecte las estaciones. Active cada flecha Ti → Tj que justifique un conflicto y decida si el plan es serializable por conflictos.',
    pool: [
      'l1(X); e1(X); l2(X); e2(X); l1(Y); e1(Y); c1; c2;',
      'l1(X); l2(X); e1(X); e2(X); c1; c2;',
      'l1(X); e1(X); l2(Y); e2(Y); l1(Z); e1(Z); c1; c2;',
      'e1(X); e2(X); e1(X); c1; c2;',
      'l2(X); e2(X); l1(X); e1(Y); l3(Y); e3(Z); c2; c1; c3;',
      'l1(X); e1(X); l2(X); e2(Y); l3(Y); e3(Z); l1(Z); c1; c2; c3;',
      'l1(X); e1(X); l2(X); l3(X); e2(Y); e3(Z); c1; c2; c3;',
      'l1(X); e1(X); l2(X); e2(Y); l3(Y); e3(X); c1; c2; c3;',
      'l1(X); e1(Y); l2(Y); e2(Z); l3(Z); e3(X); c1; c2; c3;',
      'l3(X); e3(X); l2(X); e2(Y); l1(Y); e1(Z); l3(Z); c3; c2; c1;'
    ],
    rounds: 3
  },
  locks: {
    title: 'Cambio de Agujas', phase: 'p2', lessons: ['p2l5'],
    intro: 'Usted controla las agujas del patio. Para cada solicitud de bloqueo, decida qué ocurre.',
    choices: ['Se concede', 'Debe esperar', 'Interbloqueo: víctima (1205)'],
    rounds: [
      { t: 'T1 tiene S(X). T2 solicita S(X).', a: 0, why: 'S es compatible con S.' },
      { t: 'T1 tiene S(X). T2 solicita X(X).', a: 1, why: 'Un X es incompatible con el S existente.' },
      { t: 'T1 tiene X(X). T2 solicita S(X).', a: 1, why: 'Nadie lee con bloqueo S lo que otro tiene en X.' },
      { t: 'Nadie tiene bloqueos sobre Y. T3 solicita X(Y).', a: 0, why: 'Sin bloqueos existentes, se concede.' },
      { t: 'T1 tiene X(A) y pide X(B). T2 tiene X(B) y pide X(A).', a: 2, why: 'Espera circular: SQL Server elige una víctima y lanza el 1205.' },
      { t: 'A tiene la fila 1 con UPDLOCK, HOLDLOCK. B ejecuta un UPDATE sobre la fila 1 (LOCK_TIMEOUT 15000).', a: 1, why: 'B espera hasta que A libere (o hasta 15 s; si se agota, error 1222).' },
      { t: 'A retiene Libro 1 y espera Libro 2; B retiene Libro 2 y pide Libro 1 (LOCK_TIMEOUT -1).', a: 2, why: 'Actividad 5: ciclo de espera. Se elige una víctima con el error 1205.' }
    ]
  },
  restore: {
    title: 'Plan de Rescate', phase: 'p3', lessons: ['p3l2'],
    intro: 'Arme la cadena mínima de restauración: haga clic en los respaldos en el orden en que se aplican. Regla: último FULL, luego el último DIFFERENTIAL posterior a ese FULL y luego TODOS los LOG posteriores, en orden.',
    rounds: [
      { name: 'Semana 1', fail: 'Viernes 3:00 p. m.', items: [
        { id: 'F1', k: 'FULL', d: 'Dom' }, { id: 'L1', k: 'LOG', d: 'Lun' }, { id: 'L2', k: 'LOG', d: 'Mar' }, { id: 'D1', k: 'DIFF', d: 'Mié' }, { id: 'L3', k: 'LOG', d: 'Jue' }, { id: 'L4', k: 'LOG', d: 'Vie 12 m.' }] },
      { name: 'Semana 2 (sin LOG)', fail: 'Viernes', items: [
        { id: 'F1', k: 'FULL', d: 'Dom' }, { id: 'D1', k: 'DIFF', d: 'Mié' }, { id: 'D2', k: 'DIFF', d: 'Jue' }] },
      { name: 'Semana 3', fail: 'Jueves 11:00 p. m.', items: [
        { id: 'F1', k: 'FULL', d: 'Dom' }, { id: 'D1', k: 'DIFF', d: 'Lun' }, { id: 'F2', k: 'FULL', d: 'Mar' }, { id: 'L1', k: 'LOG', d: 'Mié' }, { id: 'L2', k: 'LOG', d: 'Jue 6 p. m.' }] }
    ]
  },
  keys: {
    title: 'Las Llaves de la Bóveda', phase: 'p3', lessons: ['p3l4'],
    intro: 'Cada cerradura pide un mecanismo de seguridad. Elija la llave correcta para cada caso del artículo de protección de datos.',
    keys: ['Roles y mínimo privilegio', 'Seguridad por fila (RLS)', 'Enmascaramiento (DDM)', 'Cifrado de columna', 'Auditoría'],
    locks: [
      { t: 'RR. HH. ejecuta un procedimiento autorizado para consultar salarios, sin acceso directo a la tabla.', a: 0 },
      { t: 'Cada docente accede solo a las notas de los cursos que tiene asignados.', a: 1 },
      { t: 'El listado muestra las cédulas parcialmente ocultas; el valor guardado no cambia.', a: 2 },
      { t: 'El salario se guarda protegido con una clave simétrica AES-256 y un certificado.', a: 3 },
      { t: 'Al cambiar una nota de 85 a 88 se registra la nota anterior, la nueva y el usuario.', a: 4 }
    ]
  },
  rewrite: {
    title: 'Puesto de Reescritura', phase: 'p4', lessons: ['p4l2'],
    intro: 'Dos vendedores ofrecen la misma consulta. Compre la más eficiente según la Guía #11.',
    rounds: [
      { a: 'SELECT * FROM Empleados\nWHERE YEAR(fecha_contratacion) = 2020;', b: 'SELECT * FROM Empleados\nWHERE fecha_contratacion BETWEEN\n  \'2020-01-01\' AND \'2020-12-31\';', best: 'b', why: 'Sin funciones sobre la columna, el motor puede usar el índice (Index Seek).' },
      { a: 'SELECT E.nombre\nFROM Empleados E\nJOIN Departamentos D ON E.departamento_id = D.id\nWHERE D.activo = 1;', b: 'SELECT nombre FROM Empleados\nWHERE departamento_id IN (\n  SELECT id FROM Departamentos WHERE activo = 1);', best: 'a', why: 'La guía presenta el IN como “subconsulta ineficiente” y el JOIN como su equivalente optimizado.' },
      { a: 'SELECT * FROM Empleados\nWHERE departamento_id = 3;', b: 'SELECT nombre, salario FROM Empleados\nWHERE departamento_id = 3;', best: 'b', why: 'Evitar SELECT *: traer solo las columnas necesarias.' },
      { a: 'SELECT DISTINCT id, nombre FROM Empleados;', b: 'SELECT id, nombre FROM Empleados;', best: 'b', why: 'id es PRIMARY KEY, así que no hay duplicados: el DISTINCT es innecesario.' },
      { a: 'Opción A: unir Vinos con TODAS las Cosechas\ny luego filtrar cantidad > 100.', b: 'Opción B: filtrar Cosechas con cantidad > 100\ny luego unir con Vinos.', best: 'b', why: 'Filtrado temprano: el join trabaja con 100 cosechas en lugar de 1200.' }
    ]
  },
  cache: {
    title: 'La Caja del Caché', phase: 'p4', lessons: ['p4l5'],
    intro: 'Usted atiende el puesto con cache aside. La caché empieza vacía y el TTL no vence durante la ronda. Prediga si cada lectura es HIT o MISS.',
    seq: [
      { op: 'get', k: 'A' }, { op: 'get', k: 'B' }, { op: 'get', k: 'A' }, { op: 'get', k: 'C' }, { op: 'get', k: 'A' },
      { op: 'inv', k: 'B', t: 'Se confirma un precio nuevo de B en la base: se invalida la clave B.' },
      { op: 'get', k: 'B' }, { op: 'get', k: 'B' }, { op: 'get', k: 'C' }, { op: 'get', k: 'D' }
    ]
  },
  cut: {
    title: 'Corte de Tablas', phase: 'p5', lessons: ['p5l2'],
    intro: 'El Archipiélago necesita repartir la tabla Clientes. Lea cada pedido y elija el tipo de corte o de replicación.',
    cols: ['id', 'nombre', 'cédula', 'país', 'tarjeta', 'límite'],
    rows: [['1', 'Ana', '7-0123', 'CR', '4111…', '500k'], ['2', 'Luis', '1-0456', 'PA', '5500…', '300k'], ['3', 'Sofía', '7-0789', 'CR', '4000…', '800k'], ['4', 'Marco', '8-0912', 'PA', '3700…', '150k']],
    rounds: [
      { t: 'El nodo de Costa Rica guarda solo los clientes de CR, y el de Panamá solo los de PA.', opts: ['Horizontal', 'Vertical', 'Mixta'], a: 0, show: 'rows' },
      { t: 'Los datos personales (nombre, cédula) en un nodo y los financieros (tarjeta, límite) en otro.', opts: ['Horizontal', 'Vertical', 'Mixta'], a: 1, show: 'cols' },
      { t: 'Panamá guarda solo los datos financieros de sus propios clientes.', opts: ['Horizontal', 'Vertical', 'Mixta'], a: 2, show: 'both' },
      { t: 'Cada isla tiene una copia completa de toda la base.', opts: ['Replicación total', 'Replicación parcial', 'Sin replicación'], a: 0, show: 'all' },
      { t: 'Solo el catálogo se copia en todas las islas; el resto vive en un nodo.', opts: ['Replicación total', 'Replicación parcial', 'Sin replicación'], a: 1, show: 'part' },
      { t: 'Cada dato se guarda en una sola isla, sin copias.', opts: ['Replicación total', 'Replicación parcial', 'Sin replicación'], a: 2, show: 'none' }
    ]
  },
  mql: {
    title: 'Consola MQL del Faro', phase: 'p5', lessons: ['p5l5'],
    intro: 'Arme la consulta con los selectores y ejecútela sobre la colección cursos de la Guía #13. Gana cuando el resultado coincide con lo que pide el ejercicio.',
    docs: [
      { nombre: 'Matemática I', profesor: 'Marta', cantidad_estudiantes: 30, aula: { numero: 'A101', ubicacion: 'Edificio A' } },
      { nombre: 'Física II', profesor: 'Carlos', cantidad_estudiantes: 25, aula: { numero: 'B202', ubicacion: 'Edificio B' } },
      { nombre: 'Biología', profesor: 'Ana', cantidad_estudiantes: 35, aula: { numero: 'C303', ubicacion: 'Edificio C' } },
      { nombre: 'Química', profesor: 'Luis', cantidad_estudiantes: 20, aula: { numero: 'A101', ubicacion: 'Edificio A' } }
    ],
    fields: ['profesor', 'cantidad_estudiantes', 'aula.numero', 'aula.ubicacion', 'nombre'],
    ops: ['=', '$gt', '$gte', '$lt', '$lte', '$ne'],
    tasks: [
      { n: 3, t: 'Mostrar los cursos con más de 25 estudiantes.', f: 'cantidad_estudiantes', op: '$gt', v: 25 },
      { n: 4, t: 'Mostrar los cursos en el aula A101.', f: 'aula.numero', op: '=', v: 'A101' },
      { n: 5, t: 'Mostrar los cursos que no son impartidos por “Carlos”.', f: 'profesor', op: '$ne', v: 'Carlos' },
      { n: 15, t: 'Mostrar los cursos que no están en el “Edificio B”.', f: 'aula.ubicacion', op: '$ne', v: 'Edificio B' }
    ]
  }
};

/* Consejos de los clientes del mercado (Fase 4) y del puerto */
const TIPS = [
  'Cliente: “Yo filtro primero y uno después. Así el JOIN carga menos”.',
  'Cliente: “Pedí diez clientes y luego sus pedidos uno por uno... once viajes. ¡N+1!”.',
  'Cliente: “Si cambian el precio, borre la clave en Redis. La próxima lectura trae el nuevo”.',
  'Cliente: “¿SELECT *? Solo si de verdad ocupa todas las columnas”.',
  'Cliente: “Ctrl + M y miro el plan. Si veo Index Seek, me voy feliz”.',
  'Cliente: “Los índices ayudan al leer, pero cada INSERT también los tiene que actualizar”.',
  'Cliente: “Mi negocio registra caso, actividad y hora. Con eso hago minería de procesos”.'
];

const VAGUE = [
  'La guía #9 empieza con una figura de “Anomalías de concurrencia” que no se pudo extraer como texto.',
  'Las guías no traen soluciones oficiales: las del juego se calcularon con las reglas de cada guía.'
];

return { phases: P, final: FINAL, mg: MG, tips: TIPS, notes: VAGUE };
})();
