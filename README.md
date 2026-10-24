# Duelo de herramientas · Verificación y validación (Tema 3.2)

Actividad del curso de **Verificación y validación de software** (Tema 3.2: frameworks y librerías de automatización).
Tres herramientas, **una misma regla**: cada equipo prueba **una** (Selenium + Mocha, Cypress o Playwright + Cucumber) con los
**mismos tres criterios de aceptación** de la Tienda Escolar, la **mide** con el mismo instrumento y, con la evidencia de
**toda** la clase, **recomienda una herramienta** a un cliente concreto, por escrito (un ADR).

- **Duración:** ≈ 2 h 20 min (7 partes) · equipos de 3 (mínimo 2), un repositorio por equipo
- **Qué necesitan:** [Node.js](https://nodejs.org) **22 o superior** (lo exigen Cypress 16 y Selenium 4.51), Git, **Google Chrome** y un editor (VS Code recomendado)
- **Internet:** para instalar, para `git push` y para el tablero. La tienda corre en su equipo (copia fija), así que las pruebas y las mediciones no dependen de la red

## Empieza aquí

1. Lee la **guía** (pasos, tiempos, rúbrica): https://qa-duelo-herramientas.vercel.app/guia.html
2. Crea el repositorio de tu equipo con **Use this template** (botón verde de esta página) y clónalo.
3. **La víspera**, instala el kit de la herramienta que te toque (ver abajo): hay descargas grandes.
4. En la clase, el docente reparte herramienta y escenario. Sigan las partes de la guía.

```bash
cd kits/selenium            # o kits/cypress, o kits/playwright-cucumber
npm install
npm test                    # 1 prueba pasa y 2 están pendientes: ese es su punto de partida
npm run medir               # Parte 4: mide la suite (5 corridas; mejor: npm run medir -- --corridas 10)
```

## Preparación previa (la víspera de la clase)

| Kit | Qué descarga | Comprobación |
|---|---|---|
| `kits/selenium` | ≈ 40 MB de paquetes. La **primera vez** que corre, Selenium Manager baja el *chromedriver* que corresponde a su Chrome | `npm install && npm test` |
| `kits/cypress` | ≈ 30 MB de paquetes **y** el binario de Cypress (unos 600 MB ya instalado: con buena conexión tarda menos de un minuto —en nuestra prueba, 39 s—; con una lenta, varios). La primera vez que corre `npm test`, Cypress verifica su binario y tarda más (18 s en nuestra prueba) | `npm install && npm test` |
| `kits/playwright-cucumber` | ≈ 50 MB de paquetes. No descarga navegadores: usa su Chrome | `npm install && npm test` |
| `control/playwright` | ≈ 20 MB. **Todos los equipos lo necesitan** para la Parte 4 (es la vara con que se mide) | `npm install && npm test` (deben pasar 3 pruebas) |

Si `npm test` no arranca, revisen la sección «Problemas frecuentes» de la guía antes de pedir ayuda.

## Qué hay en cada carpeta

```text
kits/
  selenium/              Selenium WebDriver + Mocha (ejecutor) + assert de Node (aserciones)
  cypress/               Cypress
  playwright-cucumber/   Playwright (como librería) + Cucumber (BDD en Gherkin, en español)
    …/pruebas, cypress/e2e o features/   AQUÍ escriben: CA1 viene resuelto; CA2 y CA3 son su trabajo
control/playwright/      EL CONTROL: las mismas 3 pruebas ya escritas en Playwright Test. Se mide en SU máquina
herramientas/
  medir.mjs              El medidor: velocidad, estabilidad, código, vigencia de paquetes → medidas.json
  con-tienda.mjs         Enciende la tienda local, corre el comando y la apaga (lo usa cada `npm test`)
  servir-tienda.mjs      El servidor estático de la tienda (sin dependencias)
tienda/                  La Tienda Escolar: copia fija exportada del sitio de las clases. No se edita
docs/                    El sitio del duelo: guía, presentación del tema, tablero de la clase y calculadora de la matriz
ENTREGA.md               Lo que entregan: bitácora, mediciones, reflexión
MATRIZ.md                La matriz de decisión ponderada (Parte 5)
ADR.md                   El registro de la decisión (Parte 6)
ESCENARIOS.md            Los seis clientes posibles (el docente asigna uno a cada equipo)
autoinforme.json         Lo que el medidor no puede saber: minutos que tardaron y el diagnóstico del fallo
```

## Los tres criterios de aceptación

Salen del backlog de la Tienda Escolar (<https://qa-tienda-pruebas.vercel.app/backlog-jira.html>):

| Historia | Criterio | Cómo se ve en la tienda |
|---|---|---|
| US-01 CA1 | El catálogo muestra 8 productos | Ocho tarjetas con su `<h3>` *(viene resuelto)* |
| US-04 CA2 | No deja agregar 7 mochilas de una vez (stock 6) y avisa | Un `alert()` con «Solo hay 6 unidades…» y el carrito sigue en «Tu carrito está vacío.» |
| US-09 CA1 | El código `DESC10` descuenta el 10 % del subtotal | Con una Mochila escolar ($ 65.000), la fila «Descuento» muestra $ 6.500 |

## Medir y entregar

```bash
cd kits/<su-herramienta> && npm run medir -- --corridas 10      # escribe ../../medidas.json
cd ../../control/playwright && npm run medir -- --corridas 10   # escribe ../../medidas-control.json
```

Completen `autoinforme.json` (minutos y diagnóstico), `ENTREGA.md`, `MATRIZ.md` y `ADR.md`, y súbanlo todo:

```bash
git add -A
git commit -m "Duelo: mediciones, matriz y ADR"
git pull && git push
```

El **tablero de la clase** lee `medidas.json` y `medidas-control.json` de los repositorios de los equipos (los repositorios
deben ser **públicos**, o el docente recoge los archivos a mano): https://qa-duelo-herramientas.vercel.app/tablero.html

## ¿Y la tienda real?

Las pruebas corren contra la copia de `tienda/`. Si alguna vez quieren probar contra el sitio publicado, definan `BASE_URL`:

```bash
BASE_URL=https://qa-tienda-pruebas.vercel.app npm test                 # macOS / Linux
$env:BASE_URL = "https://qa-tienda-pruebas.vercel.app"; npm test       # Windows PowerShell
```

**No lo hagan durante las mediciones.** Con varias corridas seguidas, Vercel puede responder con su *punto de control de
seguridad* (un 403): nos pasó con Cypress al medirlo contra el sitio publicado. Además, la red añade un ruido que no tiene
nada que ver con la herramienta.
