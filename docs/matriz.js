/* Calculadora de la matriz · interfaz.
 * Lo que se escribe se queda en este navegador (localStorage, si está disponible). Nada se envía a ningún servidor. */
(function () {
  'use strict';

  const M = window.MatrizNucleo;
  const $ = (selector) => document.querySelector(selector);
  const CLAVE = 'duelo-matriz-v1';

  function el(etiqueta, atributos = {}, ...hijos) {
    const nodo = document.createElement(etiqueta);
    for (const [clave, valor] of Object.entries(atributos)) {
      if (valor === false || valor === null || valor === undefined) continue;
      nodo.setAttribute(clave, valor === true ? '' : String(valor));
    }
    for (const hijo of hijos.flat()) {
      if (hijo === null || hijo === undefined || hijo === false) continue;
      nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
    }
    return nodo;
  }

  const coma = (v) => (v === null || v === undefined ? '—' : v.toFixed(2).replace('.', ','));
  const nombreCriterio = (id) => M.CRITERIOS.find((c) => c.id === id).nombre;
  const nombreOpcion = (id) => M.OPCIONES.find((o) => o.id === id).nombre;

  // ------------------------------------------------------------------ las filas de la matriz
  const entradas = {}; // { [criterio]: { peso, evidencia, puntajes: { [opcion]: select } } }

  function construirFilas() {
    const cuerpo = $('#filas');
    for (const c of M.CRITERIOS) {
      const peso = el('input', { type: 'number', inputmode: 'numeric', min: 0, max: 100, step: 1, 'aria-label': `Peso de ${c.nombre}`, placeholder: '0' });
      const evidencia = el('input', { type: 'text', class: 'evidencia', maxlength: 300, autocomplete: 'off', 'aria-label': `Por qué ese peso y evidencia de los puntajes de ${c.nombre}` });
      const puntajes = {};
      const fila = el('tr', {}, el('td', { class: 'criterio' }, el('strong', {}, c.nombre), el('small', {}, c.pregunta)), el('td', { class: 'num' }, peso));
      for (const o of M.OPCIONES) {
        const s = el('select', { 'aria-label': `Puntaje de ${o.nombre} en ${c.nombre}` }, el('option', { value: '' }, '—'), ...[1, 2, 3, 4, 5].map((n) => el('option', { value: n }, n)));
        puntajes[o.id] = s;
        fila.append(el('td', { class: 'num' }, s));
      }
      fila.append(el('td', {}, evidencia));
      cuerpo.append(fila);
      entradas[c.id] = { peso, evidencia, puntajes };
      for (const campo of [peso, evidencia, ...Object.values(puntajes)]) {
        campo.addEventListener('input', recalcular);
        campo.addEventListener('change', recalcular);
      }
    }
  }

  // ------------------------------------------------------------------ leer y escribir el estado
  function leer() {
    const pesos = {};
    const puntajes = {};
    const evidencias = {};
    for (const c of M.CRITERIOS) {
      const e = entradas[c.id];
      const n = Number.parseInt(e.peso.value, 10);
      pesos[c.id] = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
      evidencias[c.id] = e.evidencia.value;
      puntajes[c.id] = {};
      for (const o of M.OPCIONES) {
        const v = Number.parseInt(e.puntajes[o.id].value, 10);
        if (Number.isFinite(v)) puntajes[c.id][o.id] = v;
      }
    }
    return { escenario: $('#escenario').value, pesos, puntajes, evidencias };
  }

  function escribir(estado) {
    $('#escenario').value = estado?.escenario ?? '';
    for (const c of M.CRITERIOS) {
      const e = entradas[c.id];
      const peso = estado?.pesos?.[c.id];
      e.peso.value = Number.isInteger(peso) && peso > 0 ? String(peso) : '';
      e.evidencia.value = estado?.evidencias?.[c.id] ?? '';
      for (const o of M.OPCIONES) {
        const v = estado?.puntajes?.[c.id]?.[o.id];
        e.puntajes[o.id].value = M.esPuntaje(v) ? String(v) : '';
      }
    }
  }

  function guardar(estado) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch {
      /* sin almacenamiento (ventana privada, vista previa): la calculadora funciona igual */
    }
  }
  function recuperar() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------------ calcular y dibujar
  function recalcular() {
    const estado = leer();
    guardar(estado);
    const suma = M.sumaPesos(estado.pesos);

    const pesos = $('#estado-pesos');
    pesos.className = `estado-pesos ${suma === 100 ? 'bien' : 'mal'}`;
    pesos.textContent = suma === 100 ? '✓ Los pesos suman 100.' : suma < 100 ? `✗ Los pesos suman ${suma}: faltan ${100 - suma} puntos por repartir.` : `✗ Los pesos suman ${suma}: sobran ${suma - 100} puntos.`;

    const tot = M.totales(estado.pesos, estado.puntajes);
    const g = M.ganador(tot);
    const faltan = M.CRITERIOS.filter((c) => estado.pesos[c.id] > 0).reduce((n, c) => n + M.OPCIONES.filter((o) => !M.esPuntaje(estado.puntajes[c.id]?.[o.id])).length, 0);
    $('#totales').replaceChildren(
      ...M.OPCIONES.map((o) => {
        const gana = g.ids.includes(o.id);
        return el(
          'div',
          { class: `tile s${o.ranura}${gana ? ' gano' : ''}` },
          el('span', { class: 'rotulo' }, el('i', { class: `llave s${o.ranura}`, 'aria-hidden': 'true' }), o.nombre),
          el('span', { class: 'valor' }, coma(tot[o.id])),
          el('span', { class: 'de' }, 'de 5,00'),
          el('span', { class: 'gana' }, gana ? (g.ids.length > 1 ? '▲ empata' : '▲ gana') : ''),
        );
      }),
    );

    dibujarSensibilidad(estado, suma, faltan, g);
    $('#markdown').textContent = M.aMarkdown(estado);
  }

  function dibujarSensibilidad(estado, suma, faltan, g) {
    const caja = $('#sensibilidad');
    if (suma !== 100) {
      caja.replaceChildren(el('p', {}, 'Cuando los pesos sumen 100 y todos los puntajes estén llenos, aquí verás si el resultado aguanta que muevan 10 puntos de un criterio a otro.'));
      return;
    }
    if (faltan > 0) {
      caja.replaceChildren(el('p', {}, `Faltan ${faltan} puntaje${faltan === 1 ? '' : 's'} en criterios con peso: la prueba de sensibilidad necesita la matriz completa.`));
      return;
    }
    const s = M.sensibilidad(estado.pesos, estado.puntajes, 10);
    if (!s) {
      caja.replaceChildren(el('p', {}, 'No se puede hacer la prueba con esta matriz.'));
      return;
    }
    const hijos = [];
    if (g.ids.length > 1) hijos.push(el('p', {}, el('strong', {}, 'Hay un empate: '), 'la matriz no decide. Ese es un resultado válido: díganlo en el ADR y desempaten con un criterio explícito.'));
    if (s.cambian === 0) {
      hijos.push(el('p', {}, el('strong', {}, 'Firme frente a los pesos. '), `Probé las ${s.analizados} maneras de pasar 10 puntos de un criterio a otro y el resultado no cambia.`));
    } else {
      hijos.push(el('p', {}, el('strong', {}, 'Frágil. '), `El resultado cambia en ${s.cambian} de las ${s.analizados} maneras de pasar 10 puntos de un criterio a otro. Algunas:`));
      hijos.push(
        el(
          'ul',
          {},
          s.cambios.slice(0, 4).map((c) => el('li', {}, `Si suben «${nombreCriterio(c.sube)}» y bajan «${nombreCriterio(c.baja)}», ${c.ganan.length > 1 ? 'empatan' : 'gana'} ${c.ganan.map(nombreOpcion).join(' y ')}.`)),
        ),
      );
      hijos.push(el('p', {}, 'Díganlo en el ADR: una decisión que depende de 10 puntos de peso necesita más evidencia o una conversación con el cliente.'));
    }
    hijos.push(el('p', {}, el('small', {}, 'Esta prueba solo mueve los pesos. No mide qué tan seguros son los puntajes: eso lo dicen sus evidencias.')));
    caja.replaceChildren(...hijos);
  }

  // ------------------------------------------------------------------ botones
  async function copiar() {
    const aviso = $('#aviso-copiado');
    try {
      await navigator.clipboard.writeText($('#markdown').textContent);
      aviso.textContent = 'Tabla copiada.';
    } catch {
      const rango = document.createRange();
      rango.selectNodeContents($('#markdown'));
      const seleccion = window.getSelection();
      seleccion.removeAllRanges();
      seleccion.addRange(rango);
      aviso.textContent = 'La seleccioné: copia con Ctrl+C (o ⌘C).';
    }
    setTimeout(() => (aviso.textContent = ''), 3500);
  }

  function empezarDeCero() {
    if (!window.confirm('¿Borrar todo lo que escribieron en la calculadora?')) return;
    escribir(null);
    recalcular();
  }

  construirFilas();
  escribir(recuperar());
  $('#escenario').addEventListener('input', recalcular);
  $('#copiar').addEventListener('click', copiar);
  $('#limpiar').addEventListener('click', empezarDeCero);
  recalcular();
})();
