/* Tablero de la clase · interfaz.
 * Lee medidas.json y medidas-control.json de los repositorios de los equipos (o de archivos sueltos), y dibuja una
 * comparación por herramienta: un gráfico de puntos por criterio (un punto por equipo) y la tabla con todos los datos.
 * Todo lo que viene de fuera se escribe con textContent: nunca se interpreta como HTML. */
(function () {
  'use strict';

  const N = window.TableroNucleo;
  const SVG = 'http://www.w3.org/2000/svg';
  const $ = (selector, raiz = document) => raiz.querySelector(selector);

  /** Crea un nodo. Con prefijo «svg:» crea un elemento SVG. Los hijos de texto van como texto, nunca como HTML. */
  function el(etiqueta, atributos = {}, ...hijos) {
    const nodo = etiqueta.startsWith('svg:') ? document.createElementNS(SVG, etiqueta.slice(4)) : document.createElement(etiqueta);
    for (const [clave, valor] of Object.entries(atributos)) {
      if (valor === false || valor === null || valor === undefined) continue;
      if (clave.startsWith('on') && typeof valor === 'function') nodo.addEventListener(clave.slice(2), valor);
      else nodo.setAttribute(clave, valor === true ? '' : String(valor));
    }
    for (const hijo of hijos.flat()) {
      if (hijo === null || hijo === undefined || hijo === false) continue;
      nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
    }
    return nodo;
  }

  const estado = {
    equipos: [],
    problemas: [], // { origen, motivo }
    origen: null, // 'repos' | 'archivos' | 'ejemplo'
    leidos: 0,
    pedidos: 0,
    orden: { columna: 'herramienta', dir: 1 },
    resaltado: null,
    cargando: false,
  };

  // ------------------------------------------------------------------ los gráficos
  const rotuloEje = (valor, decimales = 0, sufijo = '') => `${N.numero(valor, decimales)}${sufijo}`;
  const PANELES = [
    {
      id: 'velocidad',
      titulo: 'Velocidad',
      pregunta: 'Tiempo de la suite en veces el del control (Playwright Test), medidos en la misma máquina. 1× es igual que el control.',
      valor: (e) => e.metricas.vecesControl,
      formato: (v) => `${N.numero(v, 2)}×`,
      eje: (v) => rotuloEje(v, v % 1 ? 1 : 0, '×'),
      referencia: 1,
      sinDato: 'sin control',
    },
    {
      id: 'estabilidad',
      titulo: 'Estabilidad',
      pregunta: 'De cada 100 corridas, cuántas pasaron las tres pruebas.',
      valor: (e) => e.metricas.estabilidad * 100,
      formato: (v) => `${N.numero(v, 0)} %`,
      eje: (v) => rotuloEje(v),
      fijo: [0, 100],
    },
    {
      id: 'diagnostico',
      titulo: 'Diagnóstico',
      pregunta: 'Respuestas «sí» a las cinco preguntas sobre el fallo a propósito.',
      valor: (e) => e.metricas.diagnostico,
      formato: (v) => `${N.numero(v)} de 5`,
      eje: (v) => rotuloEje(v),
      fijo: [0, 5],
      objetivo: 5,
      sinDato: 'sin autoinforme',
    },
    {
      id: 'codigo',
      titulo: 'Código',
      pregunta: 'Líneas de pruebas y de soporte, sin comentarios ni líneas en blanco.',
      valor: (e) => e.metricas.codigo,
      formato: (v) => `${N.numero(v)} líneas`,
      eje: (v) => rotuloEje(v),
    },
    {
      id: 'esfuerzo',
      titulo: 'Esfuerzo',
      pregunta: 'Minutos para escribir US-04 CA2 y US-09 CA1, según el autoinforme.',
      valor: (e) => e.metricas.minutosEscritura,
      formato: (v) => `${N.numero(v)} min`,
      eje: (v) => rotuloEje(v),
      sinDato: 'sin minutos',
    },
    {
      id: 'vigencia',
      titulo: 'Vigencia',
      pregunta: 'Días desde que se publicó el paquete menos reciente del kit. Reciente no es «mejor».',
      valor: (e) => e.metricas.diasPaquete,
      formato: (v) => `${N.numero(v)} días`,
      eje: (v) => rotuloEje(v),
      sinDato: 'sin datos de npm',
    },
  ];

  const R = 5; // radio de la marca: 10 px con su anillo de 2 px (el relleno visible mide 8 px)
  const SEPARACION = 12; // lo mínimo que separa dos puntos de la misma fila
  const BUSQUEDA = 18; // radio (px) en que el puntero «encuentra» un punto: un blanco de más de 24 px
  const MARGEN = { izq: 124, der: 16, arriba: 8, abajo: 28 };

  function dibujarGrafico(def, equipos, ancho) {
    const datos = equipos.map((e) => ({ e, v: def.valor(e) })).filter((d) => typeof d.v === 'number' && Number.isFinite(d.v));
    const dom = N.dominio(datos.map((d) => d.v), { fijo: def.fijo ?? null, objetivo: def.objetivo ?? 4 });
    const x0 = MARGEN.izq;
    const x1 = Math.max(ancho - MARGEN.der, x0 + 80);
    const x = (v) => x0 + ((v - dom.min) / (dom.max - dom.min)) * (x1 - x0);

    // una fila por herramienta; la altura crece si hay que apilar puntos
    let cursor = MARGEN.arriba;
    const filas = N.HERRAMIENTAS.map((h) => {
      const items = datos.filter((d) => d.e.herramienta === h.id);
      const capas = N.apilar(items.map((d) => x(d.v)), SEPARACION);
      const mayor = capas.reduce((m, c) => Math.max(m, Math.ceil(c / 2)), 0);
      const alto = Math.max(58, 26 + (mayor * 2 + 1) * SEPARACION);
      const fila = { h, items, capas, top: cursor, alto, centro: cursor + alto / 2, mediana: N.mediana(items.map((d) => d.v)) };
      cursor += alto;
      return fila;
    });
    const yEje = cursor;
    const alto = yEje + MARGEN.abajo;

    const puntos = [];
    const svg = el('svg:svg', { viewBox: `0 0 ${ancho} ${alto}`, width: ancho, height: alto, role: 'group', 'aria-label': `${def.titulo}: ${def.pregunta}`, class: 'grafico' });

    // rejilla: hairlines verticales, sólidas y recesivas
    for (const t of dom.ticks) {
      svg.append(el('svg:line', { x1: x(t), x2: x(t), y1: MARGEN.arriba, y2: yEje, class: 'rejilla' }));
      svg.append(el('svg:text', { x: x(t), y: yEje + 17, 'text-anchor': 'middle', class: 'eje-texto' }, def.eje(t)));
    }
    svg.append(el('svg:line', { x1: x0, x2: x1, y1: yEje, y2: yEje, class: 'eje' }));
    if (def.referencia !== undefined && def.referencia >= dom.min && def.referencia <= dom.max) {
      svg.append(el('svg:line', { x1: x(def.referencia), x2: x(def.referencia), y1: MARGEN.arriba, y2: yEje, class: 'referencia' }));
    }

    for (const fila of filas) {
      const { h, items } = fila;
      // etiqueta directa de la fila: nombre de la herramienta y, debajo, el resumen
      const etiqueta = el('svg:text', { x: 0, y: fila.centro - (h.etiqueta.length === 2 ? 14 : 6), class: 'fila-texto' });
      h.etiqueta.forEach((linea, i) => etiqueta.append(el('svg:tspan', { x: 0, dy: i === 0 ? 0 : 15 }, linea)));
      etiqueta.append(el('svg:tspan', { x: 0, dy: 16, class: 'fila-resumen' }, items.length ? `med. ${def.formato(fila.mediana)}` : 'sin datos'));
      svg.append(etiqueta);

      if (items.length) {
        svg.append(el('svg:line', { x1: x(fila.mediana), x2: x(fila.mediana), y1: fila.centro - 16, y2: fila.centro + 16, class: 'mediana' }));
      }

      items.forEach((d, i) => {
        const cx = x(d.v);
        const cy = fila.centro + N.desplazamiento(fila.capas[i], SEPARACION);
        const grupo = el('svg:g', {
          class: `punto s${h.ranura}`,
          'data-eq': d.e.clave,
          tabindex: 0,
          role: 'img',
          'aria-label': `${d.e.nombre}, ${h.nombre}: ${def.titulo.toLowerCase()} ${def.formato(d.v)}`,
        });
        grupo.append(el('svg:circle', { cx, cy, r: R, class: 'marca' }));
        const mostrar = () => {
          resaltar(d.e.clave);
          mostrarTip(grupo, def, d);
        };
        grupo.addEventListener('focus', mostrar);
        grupo.addEventListener('blur', () => {
          resaltar(null);
          ocultarTip();
        });
        puntos.push({ cx, cy, grupo, d });
        svg.append(grupo);
      });
    }

    // El blanco de apuntar es el punto MÁS CERCANO dentro de BUSQUEDA px (no hay que acertarle a una marca de 10 px,
    // y los puntos apilados no se tapan unos a otros).
    const cercano = (evento) => {
      const caja = svg.getBoundingClientRect();
      const escala = caja.width / ancho || 1;
      const px = (evento.clientX - caja.left) / escala;
      const py = (evento.clientY - caja.top) / escala;
      let mejor = null;
      let distancia = BUSQUEDA;
      for (const punto of puntos) {
        const d = Math.hypot(punto.cx - px, punto.cy - py);
        if (d <= distancia) {
          distancia = d;
          mejor = punto;
        }
      }
      return mejor;
    };
    const apuntar = (evento) => {
      const punto = cercano(evento);
      if (!punto) {
        resaltar(null);
        ocultarTip();
        return;
      }
      resaltar(punto.d.e.clave);
      mostrarTip(punto.grupo, def, punto.d);
    };
    svg.addEventListener('pointermove', apuntar);
    svg.addEventListener('pointerdown', apuntar);
    svg.addEventListener('pointerleave', () => {
      resaltar(null);
      ocultarTip();
    });
    if (def.referencia !== undefined) svg.append(el('svg:text', { x: x(def.referencia), y: MARGEN.arriba + 3, 'text-anchor': 'start', dx: 4, class: 'referencia-texto' }, '= control'));

    const faltan = equipos.length - datos.length;
    const nota = faltan > 0 ? el('p', { class: 'faltan' }, `${faltan} de ${equipos.length} equipos sin este dato${def.sinDato ? ` (${def.sinDato})` : ''}: no se dibujan; están en la tabla.`) : null;
    return { svg, nota };
  }

  // ------------------------------------------------------------------ tooltip
  const tip = $('#tip');

  function mostrarTip(ancla, def, d) {
    const h = N.HERRAMIENTAS.find((x) => x.id === d.e.herramienta);
    const m = d.e.metricas;
    tip.replaceChildren(
      el('div', { class: 'tip-valor' }, def.formato(d.v)),
      el('div', { class: 'tip-fila' }, el('i', { class: `llave s${h.ranura}` }), d.e.nombre),
      el('div', { class: 'tip-detalle' }, `${h.nombre} · ${m.completas} de ${m.corridas} corridas completas · mediana ${N.segundos(m.mediana)}`),
    );
    tip.hidden = false;
    const caja = ancla.getBoundingClientRect();
    const ancho = tip.offsetWidth;
    const izq = Math.min(Math.max(8, caja.left + caja.width / 2 - ancho / 2), window.innerWidth - ancho - 8);
    const arriba = caja.top - tip.offsetHeight - 8;
    tip.style.left = `${izq}px`;
    tip.style.top = `${arriba < 8 ? caja.bottom + 8 : arriba}px`;
  }
  function ocultarTip() {
    tip.hidden = true;
  }

  function resaltar(clave) {
    estado.resaltado = clave;
    const raiz = $('#resultados');
    if (clave) raiz.dataset.resaltado = clave;
    else delete raiz.dataset.resaltado;
    for (const nodo of raiz.querySelectorAll('[data-eq]')) nodo.classList.toggle('resaltado', Boolean(clave) && nodo.getAttribute('data-eq') === clave);
  }

  // ------------------------------------------------------------------ la tabla
  const AVISO_CORTO = {
    'sin-control': 'sin control',
    'no-pasan': 'no pasan las 3',
    inestable: 'inestable',
    'pocas-corridas': 'pocas corridas',
    'sin-autoinforme': 'sin autoinforme',
    'autoinforme-incompleto': 'autoinforme incompleto',
  };
  const NUM = (v) => (v === null || v === undefined ? '—' : N.numero(v));
  const COLUMNAS = [
    { id: 'nombre', titulo: 'Equipo', clave: (e) => e.nombre.toLowerCase(), celda: (e) => el('td', { class: 'equipo' }, el('i', { class: `llave s${e.ranura}`, 'aria-hidden': 'true' }), el('span', {}, e.nombre), el('small', {}, e.fuente)) },
    { id: 'herramienta', titulo: 'Herramienta', clave: (e) => e.ranura, celda: (e) => el('td', {}, e.herramientaNombre) },
    { id: 'pruebas', titulo: 'Pasan', num: true, clave: (e) => e.metricas.pasan / e.metricas.esperadas, celda: (e) => el('td', { class: 'num' }, `${e.metricas.pasan}/${e.metricas.esperadas}`) },
    { id: 'estabilidad', titulo: 'Corridas completas', num: true, clave: (e) => e.metricas.estabilidad, celda: (e) => el('td', { class: 'num' }, `${e.metricas.completas}/${e.metricas.corridas}`) },
    { id: 'mediana', titulo: 'Mediana', num: true, clave: (e) => e.metricas.mediana, celda: (e) => el('td', { class: 'num' }, N.segundos(e.metricas.mediana)) },
    { id: 'veces', titulo: '× control', num: true, clave: (e) => e.metricas.vecesControl, celda: (e) => el('td', { class: 'num' }, N.veces(e.metricas.vecesControl)) },
    { id: 'codigo', titulo: 'Líneas', num: true, clave: (e) => e.metricas.codigo, celda: (e) => el('td', { class: 'num' }, NUM(e.metricas.codigo)) },
    { id: 'minutos', titulo: 'Minutos CA2+CA3', num: true, clave: (e) => e.metricas.minutosEscritura, celda: (e) => el('td', { class: 'num' }, NUM(e.metricas.minutosEscritura)) },
    { id: 'diagnostico', titulo: 'Diagnóstico', num: true, clave: (e) => e.metricas.diagnostico, celda: (e) => el('td', { class: 'num' }, e.metricas.diagnostico === null ? '—' : `${e.metricas.diagnostico} de 5`) },
    { id: 'dias', titulo: 'Días del paquete', num: true, clave: (e) => e.metricas.diasPaquete, celda: (e) => el('td', { class: 'num' }, NUM(e.metricas.diasPaquete)) },
    {
      id: 'avisos',
      titulo: 'Avisos',
      clave: (e) => e.avisos.length,
      celda: (e) =>
        el(
          'td',
          { class: 'avisos-celda' },
          e.avisos.length
            ? e.avisos.map((a) => el('span', { class: 'ficha aviso', title: a.texto }, el('span', { 'aria-hidden': 'true' }, '⚠ '), AVISO_CORTO[a.codigo] ?? a.codigo))
            : el('span', { class: 'ok' }, el('span', { 'aria-hidden': 'true' }, '✓ '), 'sin avisos'),
        ),
    },
  ];

  function ordenados() {
    const col = COLUMNAS.find((c) => c.id === estado.orden.columna) ?? COLUMNAS[0];
    const dir = estado.orden.dir;
    return [...estado.equipos].sort((a, b) => {
      const va = col.clave(a);
      const vb = col.clave(b);
      const sinA = va === null || va === undefined;
      const sinB = vb === null || vb === undefined;
      if (sinA || sinB) return sinA === sinB ? 0 : sinA ? 1 : -1; // lo que falta, siempre al final
      if (va < vb) return -dir;
      if (va > vb) return dir;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
  }

  function dibujarTabla() {
    const cabecera = el('tr', {});
    for (const c of COLUMNAS) {
      const activa = estado.orden.columna === c.id;
      const boton = el(
        'button',
        {
          type: 'button',
          class: 'orden',
          onclick: () => {
            estado.orden = { columna: c.id, dir: activa ? -estado.orden.dir : 1 };
            dibujarTabla();
          },
        },
        c.titulo,
        el('span', { 'aria-hidden': 'true', class: 'flecha' }, activa ? (estado.orden.dir === 1 ? ' ▲' : ' ▼') : ''),
      );
      cabecera.append(el('th', { scope: 'col', class: c.num ? 'num' : null, 'aria-sort': activa ? (estado.orden.dir === 1 ? 'ascending' : 'descending') : 'none' }, boton));
    }
    const cuerpo = el('tbody', {});
    for (const e of ordenados()) {
      const fila = el('tr', { 'data-eq': e.clave, tabindex: 0 }, COLUMNAS.map((c) => c.celda(e)));
      fila.addEventListener('pointerenter', () => resaltar(e.clave));
      fila.addEventListener('pointerleave', () => resaltar(null));
      fila.addEventListener('focus', () => resaltar(e.clave));
      fila.addEventListener('blur', () => resaltar(null));
      cuerpo.append(fila);
    }
    $('#tabla').replaceChildren(el('thead', {}, cabecera), cuerpo);
  }

  // ------------------------------------------------------------------ la página
  let ultimoAncho = 0;
  function dibujarPaneles() {
    const contenedor = $('#paneles');
    if (!estado.equipos.length) {
      contenedor.replaceChildren();
      return;
    }
    // primero el marco (la rejilla de CSS reparte el ancho); después se mide cada uno y se dibuja su gráfico
    const figuras = PANELES.map((def) =>
      el('figure', { class: 'panel', 'data-panel': def.id }, el('figcaption', {}, el('h3', {}, def.titulo), el('p', { class: 'pregunta' }, def.pregunta)), el('div', { class: 'lienzo' })),
    );
    contenedor.replaceChildren(...figuras);
    figuras.forEach((figura, i) => {
      const lienzo = figura.querySelector('.lienzo');
      const { svg, nota } = dibujarGrafico(PANELES[i], estado.equipos, Math.max(280, Math.floor(lienzo.clientWidth)));
      lienzo.append(svg);
      if (nota) figura.append(nota);
    });
    ultimoAncho = contenedor.clientWidth;
    if (estado.resaltado) resaltar(estado.resaltado);
  }

  function dibujarLeyenda() {
    const nodos = N.HERRAMIENTAS.map((h) => {
      const n = estado.equipos.filter((e) => e.herramienta === h.id).length;
      return el('li', {}, el('i', { class: `llave s${h.ranura}`, 'aria-hidden': 'true' }), h.nombre, el('small', {}, ` · ${n} ${n === 1 ? 'equipo' : 'equipos'}`));
    });
    $('#leyenda').replaceChildren(...nodos);
  }

  const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  function haceCuanto(fechaIso) {
    const minutos = Math.round((Date.parse(fechaIso) - Date.now()) / 60000);
    if (Math.abs(minutos) < 60) return relativo.format(minutos, 'minute');
    if (Math.abs(minutos) < 1440) return relativo.format(Math.round(minutos / 60), 'hour');
    return relativo.format(Math.round(minutos / 1440), 'day');
  }

  function dibujarResumen() {
    const equipos = estado.equipos;
    const corridas = equipos.reduce((s, e) => s + e.metricas.corridas, 0);
    const reciente = equipos.map((e) => Date.parse(e.fecha)).reduce((m, t) => Math.max(m, t), 0);
    $('#resumen').replaceChildren(
      el('span', {}, el('b', {}, equipos.length), equipos.length === 1 ? ' equipo' : ' equipos'),
      el('span', {}, el('b', {}, corridas), ' corridas medidas'),
      el('span', {}, 'última medición ', el('b', {}, reciente ? haceCuanto(new Date(reciente).toISOString()) : '—')),
    );
    $('#banner-ejemplo').hidden = estado.origen !== 'ejemplo';
  }

  function dibujarAvisos() {
    const lista = $('#lista-avisos');
    const filas = [];
    for (const e of estado.equipos) for (const a of e.avisos) filas.push(el('li', {}, el('strong', {}, e.nombre), ' — ', a.texto));
    lista.replaceChildren(...filas);
    $('#bloque-avisos').hidden = filas.length === 0;
  }

  function dibujarEstado() {
    const nodos = [];
    if (estado.origen === 'repos' && estado.pedidos) {
      nodos.push(el('p', { class: estado.leidos === estado.pedidos ? 'bien' : 'mal' }, `${estado.leidos} de ${estado.pedidos} repositorios leídos.`));
    }
    if (estado.problemas.length) {
      nodos.push(
        el(
          'ul',
          { class: 'problemas' },
          estado.problemas.map((p) => el('li', {}, el('span', { 'aria-hidden': 'true' }, '✗ '), el('code', {}, p.origen), ' — ', p.motivo)),
        ),
      );
    }
    $('#estado').replaceChildren(...nodos);
  }

  function dibujarTodo() {
    const hay = estado.equipos.length > 0;
    $('#resultados').hidden = !hay;
    $('#vacio').hidden = hay || estado.cargando;
    dibujarEstado();
    if (!hay) return;
    dibujarResumen();
    dibujarLeyenda();
    dibujarPaneles();
    dibujarTabla();
    dibujarAvisos();
  }

  // ------------------------------------------------------------------ cargar: repositorios de GitHub
  async function leerJSON(url) {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), 15000);
    try {
      // Sin cabeceras propias: una que no sea «simple» (por ejemplo Cache-Control) obliga a una petición previa (preflight) que
      // raw.githubusercontent.com rechaza (lo comprobamos con Chrome). El «?t=» evita la copia del navegador; la de GitHub (hasta 5 min) no se puede saltar.
      const respuesta = await fetch(`${url}?t=${Date.now()}`, { signal: control.signal });
      if (!respuesta.ok) return { http: respuesta.status };
      const texto = await respuesta.text();
      if (texto.length > 500000) return { error: 'El archivo es demasiado grande para ser un medidas.json.' };
      try {
        return { datos: JSON.parse(texto) };
      } catch {
        return { error: 'No es un JSON válido (¿quedó a medias o con marcas de merge?).' };
      }
    } catch (error) {
      return { error: error.name === 'AbortError' ? 'GitHub tardó demasiado en responder.' : 'No se pudo conectar con GitHub (¿hay internet?).' };
    } finally {
      clearTimeout(reloj);
    }
  }

  function motivoHttp(codigo, rama) {
    if (codigo === 404) return `No encuentro medidas.json en la rama «${rama}». ¿El repositorio es público? ¿Ya hicieron push de medidas.json?`;
    if (codigo === 403 || codigo === 429) return 'GitHub está limitando las lecturas: espera un minuto y vuelve a cargar.';
    return `GitHub respondió ${codigo}.`;
  }

  async function cargarRepositorio(fuente) {
    const urls = N.urlsDeRepositorio(fuente);
    const [m, c] = await Promise.all([leerJSON(urls.medidas), leerJSON(urls.control)]);
    if (m.http) return { fuente, problema: motivoHttp(m.http, fuente.rama) };
    if (m.error) return { fuente, problema: m.error };
    const malos = N.validarMedidas(m.datos, 'kit');
    if (malos.length) return { fuente, problema: `medidas.json: ${malos[0]}` };
    let control = null;
    let notaControl = null;
    if (c.datos) {
      const maloC = N.validarMedidas(c.datos, 'control');
      if (maloC.length) notaControl = `medidas-control.json: ${maloC[0]}`;
      else control = c.datos;
    } else if (c.error) notaControl = `medidas-control.json: ${c.error}`;
    return { fuente, medidas: m.datos, control, notaControl };
  }

  async function cargarDesdeRepos() {
    const { fuentes, errores } = N.analizarRepositorios($('#repos').value);
    estado.problemas = errores.map((e) => ({ origen: e.texto, motivo: e.motivo }));
    if (!fuentes.length) {
      estado.equipos = [];
      estado.origen = null;
      estado.pedidos = 0;
      estado.leidos = 0;
      if (!errores.length) estado.problemas.push({ origen: 'repositorios', motivo: 'Escribe al menos un repositorio, como usuario/duelo-equipo-1.' });
      dibujarTodo();
      return;
    }
    estado.cargando = true;
    $('#cargar').disabled = true;
    $('#estado').replaceChildren(el('p', { class: 'cargando' }, `Leyendo ${fuentes.length} ${fuentes.length === 1 ? 'repositorio' : 'repositorios'}…`));
    $('#resultados').classList.add('refrescando'); // se conserva lo que había, atenuado; no hay parpadeo
    const resultados = await Promise.all(fuentes.map(cargarRepositorio));
    const equipos = [];
    for (const r of resultados) {
      if (r.problema) {
        estado.problemas.push({ origen: r.fuente.repo, motivo: r.problema });
        continue;
      }
      if (r.notaControl) estado.problemas.push({ origen: r.fuente.repo, motivo: `${r.notaControl} (se mide sin control).` });
      equipos.push(N.construirEquipo({ fuente: { etiqueta: r.fuente.repo, clave: r.fuente.clave }, medidas: r.medidas, control: r.control }));
    }
    estado.equipos = N.desambiguar(equipos);
    estado.origen = 'repos';
    estado.pedidos = fuentes.length;
    estado.leidos = equipos.length;
    estado.cargando = false;
    $('#cargar').disabled = false;
    $('#resultados').classList.remove('refrescando');
    escribirHash(fuentes);
    dibujarTodo();
  }

  // ------------------------------------------------------------------ cargar: archivos sueltos y ejemplo
  async function cargarDesdeArchivos(lista) {
    const archivos = [];
    const problemas = [];
    for (const archivo of lista) {
      if (archivo.size > 500000) {
        problemas.push({ origen: archivo.name, motivo: 'El archivo es demasiado grande para ser un medidas.json.' });
        continue;
      }
      try {
        archivos.push({ nombre: archivo.name, datos: JSON.parse(await archivo.text()) });
      } catch {
        problemas.push({ origen: archivo.name, motivo: 'No es un JSON válido.' });
      }
    }
    const { equipos, problemas: otros } = N.agruparArchivos(archivos);
    estado.problemas = [...problemas, ...otros];
    estado.equipos = N.desambiguar(equipos.map((g) => N.construirEquipo({ fuente: { etiqueta: g.etiqueta, clave: g.clave }, medidas: g.medidas, control: g.control })));
    estado.origen = 'archivos';
    estado.pedidos = 0;
    dibujarTodo();
  }

  function cargarEjemplo() {
    const datos = N.datosDeEjemplo();
    estado.problemas = [];
    estado.equipos = N.desambiguar(datos.map((d) => N.construirEquipo({ fuente: { etiqueta: d.etiqueta, clave: d.etiqueta }, medidas: d.medidas, control: d.control })));
    estado.origen = 'ejemplo';
    estado.pedidos = 0;
    dibujarTodo();
  }

  // ------------------------------------------------------------------ el enlace del tablero (la lista de repositorios va en el #)
  function escribirHash(fuentes) {
    const valor = fuentes.map((f) => (f.rama === 'HEAD' ? f.repo : `${f.repo}@${f.rama}`)).join(',');
    try {
      history.replaceState(null, '', `${location.pathname}${location.search}#r=${encodeURIComponent(valor).replace(/%2C/g, ',').replace(/%2F/g, '/').replace(/%40/g, '@')}`);
    } catch {
      /* algunos entornos (vista previa, file://) no permiten cambiar la dirección */
    }
  }

  function leerHash() {
    const m = /(?:^#|&)r=([^&]*)/.exec(location.hash);
    if (!m) return '';
    try {
      return decodeURIComponent(m[1]).split(',').join('\n');
    } catch {
      return '';
    }
  }

  async function copiarEnlace() {
    const { fuentes } = N.analizarRepositorios($('#repos').value);
    if (fuentes.length) escribirHash(fuentes);
    const aviso = $('#aviso-copiado');
    try {
      await navigator.clipboard.writeText(location.href);
      aviso.textContent = 'Enlace copiado.';
    } catch {
      aviso.textContent = 'No pude copiarlo solo: copia la dirección del navegador.';
    }
    setTimeout(() => (aviso.textContent = ''), 3500);
  }

  // ------------------------------------------------------------------ arranque
  function iniciar() {
    $('#cargar').addEventListener('click', cargarDesdeRepos);
    $('#ejemplo').addEventListener('click', cargarEjemplo);
    $('#copiar').addEventListener('click', copiarEnlace);
    $('#archivos').addEventListener('change', (evento) => {
      if (evento.target.files.length) cargarDesdeArchivos([...evento.target.files]);
      evento.target.value = '';
    });
    let pendiente = null;
    new ResizeObserver(() => {
      clearTimeout(pendiente);
      pendiente = setTimeout(() => {
        if (estado.equipos.length && $('#paneles').clientWidth !== ultimoAncho) dibujarPaneles();
      }, 120);
    }).observe($('#paneles'));

    const guardado = leerHash();
    if (guardado) {
      $('#repos').value = guardado;
      cargarDesdeRepos();
    } else {
      dibujarTodo();
    }
  }

  iniciar();
})();
