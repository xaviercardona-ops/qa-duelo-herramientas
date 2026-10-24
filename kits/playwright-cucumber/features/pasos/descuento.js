const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

/**
 * Pasos de features/descuento.feature (US-09 CA1).
 *
 * Pasos que debes definir aquí (el texto debe coincidir con el del escenario):
 *   Given('que agrego {int} unidad(es) de {string} al carrito', ...)  → tarjeta del producto, cantidad, «Agregar»
 *   When('aplico el código {string}', ...)                            → campo «Código de descuento» y botón «Aplicar»
 *   Then('el descuento es {string}', ...)                             → la fila «Descuento» del carrito contiene ese valor
 *
 * Pista: el paso de agregar se parece mucho al de features/pasos/stock.js. ¿Lo van a repetir o a compartir?
 * (Con Cucumber, un paso definido en un archivo sirve a TODOS los escenarios.)
 */
