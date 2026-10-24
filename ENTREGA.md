# Entrega · Duelo de herramientas

**Equipo:** ______________________  
**Integrantes:** ______________________  
**Repositorio:** ______________________  
**Herramienta que nos tocó:** ☐ Selenium + Mocha &nbsp; ☐ Cypress &nbsp; ☐ Playwright + Cucumber  
**Escenario que nos tocó:** ______________________

> Completa este archivo a medida que avanzas (cada sección dice en qué parte de la guía se llena).
> Lo que se mide con números lo guarda el medidor en `medidas.json`; aquí va lo que un número no dice.
> Escribe con tus palabras: las respuestas copiadas de la guía, de otro equipo o de un asistente sin pasar por tu criterio no cuentan.

Archivos que entregan, todos en el repositorio y con `git push`:

| Archivo | Quién lo escribe | Parte |
|---|---|---|
| `ENTREGA.md` (este) | ustedes | 1 a 6 |
| `autoinforme.json` | ustedes (minutos y diagnóstico) | 2 a 4 |
| `medidas.json` y `medidas-control.json` | los genera el medidor (`npm run medir`) | 4 |
| `MATRIZ.md` | ustedes | 5 |
| `ADR.md` | ustedes | 6 |
| Las pruebas de su kit (las tres historias) | ustedes | 1 a 3 |

---

## 1. Qué hace la herramienta por nosotros (Parte 1)

Lean el ejemplo resuelto (US-01 CA1) en su kit, **línea por línea**, y los archivos de `soporte` o de configuración
que vienen con él. Para cada tarea que alguien debe cumplir en una prueba de interfaz, digan **quién la hace**:
*la herramienta sola*, *una librería que hubo que sumar* (¿cuál?) o *código nuestro*. Escriban el archivo y la línea.

| Tarea | ¿Quién la hace? | ¿Dónde lo vemos? (archivo y línea) |
|---|---|---|
| Abrir el navegador y cerrarlo al terminar | | |
| Esperar a que el elemento exista o se pueda usar | | |
| Reintentar una comprobación que todavía no se cumple | | |
| Ejecutar las pruebas, contarlas y decir cuántas pasaron | | |
| Comprobar un valor y mostrar «esperado» y «recibido» | | |
| Leer el texto de un `alert()` del navegador *(lo descubren en la Parte 2)* | | |
| Dejar evidencia (captura, video o traza) cuando una prueba falla | | |

**Con esta tabla:** ¿la herramienta que nos tocó es una *librería*, un *framework*, o una librería con piezas que
tuvimos que armar nosotros? Respondan en dos frases con la idea «la librería la llamas tú; el framework te llama a ti».

> _Respuesta:_

## 2. Bitácora de las historias (Partes 2 y 3)

Una columna por historia. «Minutos» son los mismos que anotan en `autoinforme.json`: desde que empiezan a escribir
hasta que ven la prueba en verde.

| | US-04 CA2 (7 mochilas, stock 6) | US-09 CA1 (DESC10) |
|---|---|---|
| Minutos hasta el verde | | |
| Primer intento que **no** funcionó: qué escribimos y qué dijo la herramienta | | |
| Mensaje de error que nos ayudó (o que nos confundió) | | |
| Qué tuvimos que buscar en la documentación (enlace) | | |
| Qué haría distinto un equipo con más experiencia en esta herramienta | | |

**Lo más distinto frente a US-01 CA1** (el ejemplo resuelto): ¿qué cambió al leer un `alert()`, al elegir *dentro de
una tarjeta* y al leer un valor del carrito? Piensen en esperas, selectores y en cómo leyeron el resultado.

> _Respuesta:_

## 3. Lo que medimos (Parte 4)

Pega el resumen que imprimió `npm run medir` en tu kit y en el control (Playwright Test):

```text
(resumen de tu kit)
```

```text
(resumen del control)
```

- Mediana de nuestro kit: ______ s · Mediana del control en **nuestra** máquina: ______ s · **Veces el control** (kit ÷ control): ______
- Corridas completas de nuestro kit: ______ de ______
- Líneas de código (pruebas + soporte): ______
- Puntos de diagnóstico (de 5): ______

**El fallo a propósito.** ¿Qué rompieron y cómo? Pega las primeras 10 líneas de lo que dijo la herramienta y señala
qué ayudaba a encontrar la causa y qué faltaba.

```text
(salida del fallo)
```

**Las cinco preguntas del diagnóstico** (se contestan **con el kit tal como llegó**, y el «sí» o «no» va en `autoinforme.json`).
En la última columna digan *de dónde vino* cada evidencia: de la **herramienta** (sola), de la **configuración del kit** o de
**código nuestro**.

| Pregunta (campo en `autoinforme.json`) | ¿Sí o no? | ¿De dónde vino? |
|---|:---:|---|
| ¿El mensaje dice **qué** falló (el elemento o la comprobación), sin que haya que adivinar? (`diceQueFallo`) | | |
| ¿Muestra el valor **esperado** y el **recibido**? (`esperadoYRecibido`) | | |
| ¿Señala la **línea de nuestra prueba** donde falló? (`lineaDeLaPrueba`) | | |
| ¿Quedó una **captura de pantalla** (o un video) de la falla en el disco? (`capturaOVideo`) | | |
| ¿Quedó una **traza o un informe** para repasar la falla paso a paso sin volver a correrla? (`trazaOInforme`) | | |

**Tres cosas que nuestra medición NO demuestra** (pistas: cuántas pruebas, cuántas corridas, cuántas máquinas,
qué mide el tiempo, qué cuenta una «línea de código»):

1.
2.
3.

## 4. Mirando el tablero (Parte 5)

Abran el tablero de la clase (el enlace lo da el docente) y respondan **con datos del tablero**, no con opiniones:

1. ¿Qué herramienta fue más rápida, medida en «veces el control»? ¿Y la más estable? ¿Hubo diferencias grandes **dentro** de una misma herramienta entre equipos? ¿A qué lo atribuyen?
2. ¿Qué herramienta dejó mejor diagnóstico y qué parte vino «de fábrica» o la tuvo que armar el equipo?
3. Un dato del tablero que les pareció raro. ¿Qué preguntarían a ese equipo antes de usarlo como evidencia?

> _Respuestas:_

## 5. Matriz y decisión (Partes 5 y 6)

☐ `MATRIZ.md` completa (pesos que suman 100, puntajes con evidencia, total y prueba de sensibilidad)  
☐ `ADR.md` completo (una página, con consecuencias negativas y qué nos haría cambiar de opinión)  
☐ `medidas.json`, `medidas-control.json` y `autoinforme.json` en el repositorio, con `git push`

**Nuestra recomendación en una frase:**

> _…_

## 6. Reflexión

1. Antes de medir, ¿qué herramienta habríamos recomendado? ¿Cambió algo después de ver los datos de **todas** las herramientas? Si la que recomendamos no es la que nos tocó, ¿por qué? Si lo es, ¿qué habría pasado si nos hubiera tocado otra?
2. ¿Qué evidencia nos hizo falta y no pudimos medir en esta actividad (por ejemplo: 300 pruebas en lugar de 3, otros navegadores, un mes de mantenimiento)?
3. En una automatización real, ¿qué parte del esfuerzo creen que es **escribir** las primeras pruebas y qué parte es **mantenerlas**? ¿Qué parte de esto no capta nuestra actividad?
4. Si el cliente fuera la empresa donde quieren trabajar, ¿qué pesos cambiarían en la matriz?
5. Si usaron un asistente de IA: ¿en qué momentos ayudó y en cuáles hubo que corregirlo? ¿Cómo cambia eso lo que significan los minutos de `autoinforme.json`?
