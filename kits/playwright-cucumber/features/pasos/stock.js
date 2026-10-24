const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

/**
 * Pasos de features/stock.feature (US-04 CA2).
 *
 * Cada paso del escenario necesita una definición con el MISMO texto. Quita @pendiente de features/stock.feature,
 * corre `npm test` y, por cada paso que falte, Cucumber te imprime el esqueleto para copiar aquí.
 *
 * Cómo se escriben (mira features/pasos/catalogo.js, que ya está resuelto):
 *   Given('texto con {int} o {string}', async function (numero, texto) { ... });
 *
 * Dentro del paso:
 *   · this.page es la página de Playwright (la misma API que ya conoces).
 *   · this.avisos es la lista de textos de los alert() que aparecieron (features/soporte/mundo.js ya los escucha).
 *
 * Pasos que debes definir aquí:
 *   When('intento agregar {int} unidades de {string}', ...)   → ubicar la tarjeta del producto, escribir la cantidad, «Agregar»
 *   Then('veo el aviso {string}', ...)                         → comprobar que algún aviso contiene ese texto
 *   Then('el carrito sigue vacío', ...)                        → comprobar que se ve «Tu carrito está vacío.»
 */
