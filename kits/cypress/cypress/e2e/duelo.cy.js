/**
 * Cypress · los tres criterios del duelo.
 *
 * CA1 viene RESUELTO: léanlo, ejecútenlo (npm test) y entiendan cada línea ANTES de escribir los otros dos.
 * Los otros dos están en `it.skip(...)`: cambien `it.skip` por `it` cuando empiecen a implementarlos.
 */
describe('Duelo · tres criterios de aceptación', () => {
  // ------------------------------------------------------------------ EJEMPLO RESUELTO
  it('US-01 CA1: el catálogo muestra 8 productos', () => {
    cy.visit('/');

    // Cypress reintenta el comando y la aserción hasta que se cumplan (o se acabe el tiempo).
    cy.get('h3').should('have.length', 8);
  });

  // ------------------------------------------------------------------ TU TURNO · US-04 CA2
  it.skip('US-04 CA2: no deja agregar 7 mochilas de una vez (stock 6) y avisa', () => {
    // Dado   un producto con stock 6 (la Mochila escolar),
    // Cuando intento agregar 7 unidades de una vez,
    // Entonces veo un aviso con el stock disponible y no se agrega nada.
    //
    // Pistas:
    //  · cy.contains('h3', 'Mochila escolar').parent() es la tarjeta del producto; con .within(() => { ... })
    //    todo lo que escribas dentro se busca solo en esa tarjeta.
    //  · Cantidad: cy.get('input[type=number]').clear().type('7').   Botón: cy.contains('button', 'Agregar').click().
    //  · El aviso es un alert(): Cypress lo acepta solo, pero para LEER su texto hay que escuchar el evento
    //    ANTES del clic: const aviso = cy.stub().as('aviso'); cy.on('window:alert', aviso);
    //    y después: cy.get('@aviso').should('have.been.calledWithMatch', /texto/).
    //  · «Nada se agrega» = cy.contains('Tu carrito está vacío.').should('be.visible').
  });

  // ------------------------------------------------------------------ TU TURNO · US-09 CA1
  it.skip('US-09 CA1: DESC10 descuenta el 10 % del subtotal', () => {
    // Dado   un carrito con productos (1 Mochila escolar, $ 65.000),
    // Cuando aplico el código DESC10,
    // Entonces el descuento es el 10 % del subtotal: $ 6.500.
    //
    // Pistas:
    //  · Agregar la mochila: el botón «Agregar» de SU tarjeta (la cantidad por defecto es 1).
    //  · El campo del código: cy.get('input[placeholder="Código de descuento"]').type('DESC10'); botón «Aplicar».
    //  · El valor está en la fila cuyo <dt> empieza por «Descuento»:
    //    cy.contains('dt', /^Descuento/).siblings('dd').should('contain.text', '...').
  });
});
