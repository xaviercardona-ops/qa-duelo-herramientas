const assert = require('node:assert/strict');
const { By, until, Key } = require('selenium-webdriver');
const { BASE_URL, crearDriver } = require('../soporte/driver');

/**
 * Selenium + Mocha · los tres criterios del duelo.
 *
 * CA1 viene RESUELTO: léanlo, ejecútenlo (npm test) y entiendan cada línea ANTES de escribir los otros dos.
 * Los otros dos están en `it.skip(...)`: cambien `it.skip` por `it` cuando empiecen a implementarlos.
 */
describe('Duelo · tres criterios de aceptación', function () {
  let driver;

  // Selenium no trae ejecutor: hay que abrir y cerrar el navegador a mano, en cada prueba.
  beforeEach(async () => {
    driver = await crearDriver();
  });
  afterEach(async () => {
    await driver.quit();
  });

  // ------------------------------------------------------------------ EJEMPLO RESUELTO
  it('US-01 CA1: el catálogo muestra 8 productos', async () => {
    await driver.get(BASE_URL);
    // Selenium no espera por ti: hay que esperar a mano a que existan los elementos.
    await driver.wait(until.elementLocated(By.css('h3')), 5000);

    const productos = await driver.findElements(By.css('h3'));
    assert.equal(productos.length, 8);
  });

  // ------------------------------------------------------------------ TU TURNO · US-04 CA2
  it.skip('US-04 CA2: no deja agregar 7 mochilas de una vez (stock 6) y avisa', async () => {
    // Dado   un producto con stock 6 (la Mochila escolar),
    // Cuando intento agregar 7 unidades de una vez,
    // Entonces veo un aviso con el stock disponible y no se agrega nada.
    //
    // Pistas:
    //  · La tarjeta de la mochila es el <div class="rounded-lg"> que contiene el <h3> «Mochila escolar»
    //    (XPath: //h3[normalize-space()='...']/ancestor::div[contains(@class,'rounded-lg')][1]).
    //  · El campo de cantidad ya trae un 1 y sendKeys escribe AL FINAL (daría 17): selecciónenlo antes con
    //    sendKeys(Key.chord(Key.CONTROL, 'a'), '7')  (en macOS también sirve Key.COMMAND).
    //  · El aviso es un alert() del navegador: until.alertIsPresent() → driver.switchTo().alert() → getText() → accept().
    //  · «Nada se agrega» = el carrito sigue diciendo «Tu carrito está vacío.»
  });

  // ------------------------------------------------------------------ TU TURNO · US-09 CA1
  it.skip('US-09 CA1: DESC10 descuenta el 10 % del subtotal', async () => {
    // Dado   un carrito con productos (1 Mochila escolar, $ 65.000),
    // Cuando aplico el código DESC10,
    // Entonces el descuento es el 10 % del subtotal: $ 6.500.
    //
    // Pistas:
    //  · Agregar la mochila: el botón «Agregar» de SU tarjeta (la cantidad por defecto es 1).
    //  · El campo del código se ubica por su placeholder: input[placeholder='Código de descuento'].
    //  · El valor está en la fila cuyo <dt> empieza por «Descuento»: su hermano <dd> (XPath: following-sibling::dd).
    //  · React dibuja esa fila DESPUÉS del clic en «Aplicar»: espérala con driver.wait(...) antes de leerla.
  });
});
