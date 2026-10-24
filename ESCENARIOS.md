# Escenarios del duelo

Cada equipo recibe **un escenario** (y **una herramienta**; son dos sorteos independientes). El escenario es el cliente al que
le van a recomendar una herramienta: sus pesos en `MATRIZ.md` y su `ADR.md` tienen que salir de **esta** situación, no de
sus gustos.

- Los escenarios son ficticios; cualquier parecido con una empresa real es casualidad.
- Pueden hacer **preguntas al cliente** (al docente) durante la Parte 5. Si un dato no está aquí, el cliente decide si lo sabe.
- Dos equipos pueden tener el mismo escenario con herramientas distintas: al final se comparan sus recomendaciones.

## E1 · Pagos Ágiles — Fintech que despliega varias veces al día

**Quién es.** Una empresa de pagos para pequeños comercios, con sede en Bogotá.

**Situación**

- Cuatro desarrolladores full-stack (TypeScript). No hay testers dedicados: cada quien prueba lo suyo.
- Despliegan a producción entre 5 y 10 veces al día. El pipeline de integración continua debe terminar en menos de 10 minutos.
- La aplicación web es una SPA en React. Los flujos críticos son registro, cobro y comprobante.
- Hoy la regresión de esos tres flujos es manual y toma medio día.

**Lo que le duele.** Una prueba que falla «a veces» frena el despliegue de todo el equipo y, con el tiempo, termina ignorándose.

**Restricciones**

- Sin presupuesto para servicios de pago en la nube.
- Sus clientes usan Chrome en el computador y Safari en el iPhone.

**Preguntas para pesar los criterios**

1. ¿Cuánto cuesta un falso positivo en un equipo de cuatro que despliega diez veces al día?
2. ¿Qué pesa más aquí: la velocidad o la estabilidad? ¿Y el diagnóstico, si nadie tiene tiempo de depurar?
3. ¿Qué pasa con Safari? ¿Cómo lo pesan en «cobertura»?

## E2 · Banco Cumplido — Banco con auditoría y analistas que no programan

**Quién es.** Un banco mediano con una gerencia de calidad de 12 personas.

**Situación**

- Seis analistas de pruebas (la mitad casi no programa), cuatro desarrolladores (Java y TypeScript) y dos analistas de negocio que escriben los requisitos.
- Los criterios de aceptación ya se escriben en lenguaje natural, con el formato Dado / Cuando / Entonces.
- Cada versión debe poder mostrar ante auditoría qué requisito cubre cada prueba y cuál fue su resultado.
- Navegadores soportados: Chrome, Edge y Safari.

**Lo que le duele.** Las pruebas solo las entienden quienes las programaron, y la evidencia para los auditores se arma a mano en hojas de cálculo.

**Restricciones**

- Se instala en equipos corporativos; nada que dependa de servicios en la nube.
- Los cambios de proceso son lentos: lo que se adopte tiene que encajar con lo que ya escriben los analistas de negocio.

**Preguntas para pesar los criterios**

1. ¿Quién lee las pruebas además de quien las escribe? ¿Cuánto vale eso?
2. ¿Qué le pide un auditor a un informe de pruebas? ¿Qué herramientas lo entregan «de fábrica» y cuáles hay que armar?
3. Pesen el «encaje»: ¿con qué lenguaje trabajan las personas que escribirían las pruebas?

## E3 · Seguros del Valle — Aseguradora con 600 pruebas heredadas en Selenium

**Quién es.** Una aseguradora con sede en Cali y un equipo de tecnología de 11 personas.

**Situación**

- Ocho desarrolladores Java y tres testers. Tienen 600 pruebas de interfaz escritas con Selenium WebDriver en Java y una Selenium Grid propia.
- Cerca del 30 % de esas pruebas se rompe cada vez que cambia la interfaz; mantenerlas consume dos días por sprint.
- Navegadores: Chrome, Edge y Firefox. Además tienen una aplicación móvil nativa que hoy no se automatiza.
- La gerencia pregunta si «vale la pena migrar» y quiere una recomendación por escrito.

**Lo que le duele.** El costo de mantenimiento. Pero una migración completa detendría las entregas durante un trimestre.

**Restricciones**

- El equipo conoce Java; no conoce TypeScript.
- La Grid ya está pagada y la opera el área de infraestructura.

**Preguntas para pesar los criterios**

1. La decisión no es solo «cuál es mejor»: es «migrar, migrar por partes o quedarse». ¿Cómo lo reflejan en la matriz y en el ADR?
2. ¿Qué evidencia de este duelo (3 pruebas en JavaScript) se puede trasladar a un equipo de Java con 600 pruebas, y cuál no?
3. ¿Qué haría cambiar de opinión a la gerencia?

## E4 · Agencia Pixel — Agencia con 12 proyectos web pequeños

**Quién es.** Una agencia de desarrollo web de 15 personas en Medellín.

**Situación**

- Doce proyectos web de 2 a 4 meses (a veces WordPress, a veces React). Cada trimestre llegan practicantes nuevos.
- Antes de entregar a cada cliente se necesita un conjunto mínimo de pruebas de humo: inicio de sesión, compra y formulario de contacto.
- No existe un equipo de QA: cada proyecto arma lo suyo y cada uno lo hace distinto.

**Lo que le duele.** Cada proyecto reinventa su automatización y, cuando el practicante se va, nadie sabe cómo correr las pruebas.

**Restricciones**

- Presupuesto bajo y poco tiempo para configurar.
- Nadie quiere convertirse en «el experto» de una herramienta.

**Preguntas para pesar los criterios**

1. ¿Qué herramienta tiene la menor curva para un practicante? ¿Cómo lo midieron en el duelo?
2. ¿Cuánto cuesta arrancar un proyecto nuevo (instalación, configuración, primera prueba verde)?
3. Quienes desarrollan los proyectos de WordPress escriben PHP, no JavaScript: ¿en qué lenguajes se pueden escribir las pruebas con cada opción? Verifíquenlo en la documentación.

## E5 · Escuela de Testers — Equipo de QA manual que empieza a automatizar

**Quién es.** El área de calidad de una empresa de software de 60 personas.

**Situación**

- Ocho testers manuales con mucha experiencia en el negocio y poca programación (algo de SQL, algo de JavaScript).
- La empresa les da tres meses para automatizar la regresión de un producto web, con una persona de desarrollo que los apoya medio día a la semana.
- Cuando una prueba falla, quien la escribió tiene que entender solo qué pasó.

**Lo que le duele.** El miedo a «romper» algo y a no entender los mensajes de error. La última vez que lo intentaron, abandonaron.

**Restricciones**

- Necesitan material y comunidad en español.
- Lo que aprendan debería servirles también en su próximo empleo.

**Preguntas para pesar los criterios**

1. ¿Qué mensaje de error ayuda más a quien está aprendiendo? Usen su fallo a propósito y los de los demás equipos.
2. ¿La herramienta enseña o castiga? ¿Qué papel juegan Gherkin y la comunidad?
3. ¿Cuánto pesa «lo que sirve en el próximo empleo» dentro de «comunidad y futuro»?

## E6 · Entidad Pública — Entidad del Estado con contrato de largo plazo

**Quién es.** Una entidad pública que contrata software para operarlo y mantenerlo durante diez años.

**Situación**

- Cambia de proveedor entre licitaciones: lo que se entregue debe poder heredarlo otro equipo.
- Las reglas de contratación favorecen estándares abiertos y software sin dependencia de un único fabricante.
- Navegadores corporativos: Chrome, Edge y Firefox, con versiones controladas por el área de TI. Algunos funcionarios usan equipos antiguos.
- Una auditoría anual revisa que las pruebas se puedan repetir con el mismo resultado.

**Lo que le duele.** Que la herramienta que se elija hoy deje de existir, o cambie de licencia, dentro de cinco años.

**Restricciones**

- Sin servicios de pago ni dependencia de la nube.
- La documentación y los acuerdos de uso deben poder entregarse al siguiente proveedor.

**Preguntas para pesar los criterios**

1. ¿Qué significa «estándar abierto» y cuál de las tres opciones se apoya en uno? Verifíquenlo en la documentación.
2. ¿Cuánto pesan la edad del proyecto, su gobierno y su licencia dentro de «comunidad y futuro»?
3. ¿Qué evidencia del duelo (por ejemplo, la fecha de la última publicación) dice poco sobre diez años, y por qué?
