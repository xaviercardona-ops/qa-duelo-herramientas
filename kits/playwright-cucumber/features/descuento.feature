# language: es
Característica: Aplicar un código de descuento

  # Cuando empieces con este escenario, quita la etiqueta @pendiente: Cucumber te dirá qué pasos faltan
  # y te imprimirá el esqueleto de cada uno para que lo copies a features/pasos/.
  @pendiente
  Escenario: US-09 CA1 · DESC10 descuenta el 10 % del subtotal
    Dado que abro la tienda
    Y que agrego 1 unidad de "Mochila escolar" al carrito
    Cuando aplico el código "DESC10"
    Entonces el descuento es "6.500"
