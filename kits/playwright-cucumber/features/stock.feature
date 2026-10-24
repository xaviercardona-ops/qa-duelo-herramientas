# language: es
Característica: Agregar productos sin superar el stock

  # Cuando empieces con este escenario, quita la etiqueta @pendiente: Cucumber te dirá qué pasos faltan
  # y te imprimirá el esqueleto de cada uno para que lo copies a features/pasos/.
  @pendiente
  Escenario: US-04 CA2 · No deja agregar 7 mochilas de una vez y avisa
    Dado que abro la tienda
    Cuando intento agregar 7 unidades de "Mochila escolar"
    Entonces veo el aviso "Solo hay 6 unidades"
    Y el carrito sigue vacío
