/* Tablero de la clase · núcleo (sin DOM).
 * Lee, valida y resume las mediciones de los equipos. Lo usan la página (window.TableroNucleo) y las pruebas de Node.
 * Los datos vienen de repositorios ajenos: todo se trata como no confiable (se valida, se recorta y se muestra con textContent). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.TableroNucleo = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Las tres herramientas del duelo, en el orden en que se dibujan. `ranura` es su color fijo (1 a 3) en todos los gráficos. */
  const HERRAMIENTAS = [
    { id: 'selenium', nombre: 'Selenium + Mocha', etiqueta: ['Selenium', '+ Mocha'], ranura: 1 },
    { id: 'cypress', nombre: 'Cypress', etiqueta: ['Cypress'], ranura: 2 },
    { id: 'playwright-cucumber', nombre: 'Playwright + Cucumber', etiqueta: ['Playwright', '+ Cucumber'], ranura: 3 },
  ];
  const ID_CONTROL = 'playwright';
  const CLAVES_DIAGNOSTICO = ['diceQueFallo', 'esperadoYRecibido', 'lineaDeLaPrueba', 'capturaOVideo', 'trazaOInforme'];

  // ------------------------------------------------------------------ fuentes: repositorios de GitHub
  const RE_USUARIO = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
  const RE_REPO = /^[A-Za-z0-9._-]{1,100}$/;
  const RE_RAMA = /^[A-Za-z0-9._/-]{1,100}$/;

  function analizarToken(token) {
    const t = token.trim();
    let usuario;
    let repo;
    let rama = null;
    const url = t.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:\/tree\/([^\s#?]+?))?\/?(?:[#?].*)?$/i);
    if (url) {
      [, usuario, repo, rama] = url;
    } else {
      const corto = t.match(/^([^/\s@]+)\/([^/\s@]+?)(?:\.git)?(?:@(\S+))?$/);
      if (!corto) return { error: 'No parece «usuario/repositorio».' };
      [, usuario, repo, rama] = corto;
    }
    rama = rama || 'HEAD';
    if (!RE_USUARIO.test(usuario)) return { error: `«${usuario}» no es un usuario de GitHub válido.` };
    if (!RE_REPO.test(repo) || repo === '.' || repo === '..') return { error: `«${repo}» no es un nombre de repositorio válido.` };
    if (!RE_RAMA.test(rama) || rama.includes('..')) return { error: `«${rama}» no es una rama válida.` };
    return { repo: `${usuario}/${repo}`, rama, clave: `${usuario}/${repo}@${rama}`.toLowerCase() };
  }

  /** Texto libre (un repositorio por línea, o separados por comas) → { fuentes, errores }. */
  function analizarRepositorios(texto) {
    const fuentes = [];
    const errores = [];
    const vistas = new Set();
    for (const linea of String(texto ?? '').split(/\r?\n/)) {
      const sinComentario = linea.replace(/(^|\s)#.*$/, '');
      for (const token of sinComentario.split(/[\s,;]+/).filter(Boolean)) {
        const r = analizarToken(token);
        if (r.error) errores.push({ texto: token.slice(0, 80), motivo: r.error });
        else if (!vistas.has(r.clave)) {
          vistas.add(r.clave);
          fuentes.push(r);
        }
      }
    }
    return { fuentes, errores };
  }

  /** Dirección de los dos archivos que lee el tablero (raw.githubusercontent.com permite leerlos desde cualquier página). */
  function urlsDeRepositorio(fuente) {
    const rama = fuente.rama.split('/').map(encodeURIComponent).join('/');
    const base = `https://raw.githubusercontent.com/${fuente.repo}/${rama}`;
    return { medidas: `${base}/medidas.json`, control: `${base}/medidas-control.json` };
  }

  // ------------------------------------------------------------------ validación
  const esObjeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
  const esNumero = (x, min = 0, max = 1e7) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
  const esEntero = (x, min = 0, max = 1e6) => esNumero(x, min, max) && Number.isInteger(x);

  /** Recorta y limpia un texto que viene de fuera. */
  function texto(x, max = 60) {
    if (typeof x !== 'string') return '';
    // eslint-disable-next-line no-control-regex
    return x.replace(/[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  /** ¿Es un medidas.json usable? rol: 'kit' | 'control'. Devuelve la lista de problemas (vacía si está bien). */
  function validarMedidas(obj, rol) {
    const problemas = [];
    if (!esObjeto(obj)) return ['El archivo no contiene un objeto JSON.'];
    if (obj.esquema !== 1) {
      problemas.push(typeof obj.esquema === 'number' && obj.esquema > 1 ? 'Lo escribió una versión más nueva del medidor: actualiza el tablero.' : 'No parece un archivo del medidor (falta «esquema»: 1).');
      return problemas;
    }
    if (rol === 'control') {
      if (obj.herramienta !== ID_CONTROL) problemas.push(`El control debe ser de «${ID_CONTROL}», no de «${texto(String(obj.herramienta), 30)}».`);
    } else if (!HERRAMIENTAS.some((h) => h.id === obj.herramienta)) {
      problemas.push(`Herramienta desconocida: «${texto(String(obj.herramienta), 30)}».`);
    }
    const c = obj.corridas;
    if (!esObjeto(c)) problemas.push('Falta «corridas».');
    else {
      if (!esEntero(c.total, 1, 1000)) problemas.push('«corridas.total» no es un entero válido.');
      if (!esEntero(c.completas, 0, 1000) || c.completas > c.total) problemas.push('«corridas.completas» no es válido.');
      if (!esNumero(c.mediana, 0, 36000)) problemas.push('«corridas.mediana» no es un número válido.');
      if (!Array.isArray(c.segundos) || c.segundos.length < 1 || !c.segundos.every((s) => esNumero(s, 0, 36000))) problemas.push('«corridas.segundos» no es una lista de tiempos válida.');
    }
    if (!esObjeto(obj.pruebas) || !esEntero(obj.pruebas.esperadas, 1, 1000) || !esEntero(obj.pruebas.pasanEnLaUltimaCorrida, 0, 1000)) problemas.push('Falta «pruebas» o no es válido.');
    if (rol !== 'control' && (!esObjeto(obj.codigo) || !esEntero(obj.codigo.total, 0, 1e6))) problemas.push('Falta «codigo.total».');
    if (typeof obj.fecha !== 'string' || Number.isNaN(Date.parse(obj.fecha))) problemas.push('«fecha» no es una fecha válida.');
    return problemas;
  }

  // ------------------------------------------------------------------ resumen de un equipo
  const mediana = (valores) => {
    const v = valores.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b);
    if (!v.length) return null;
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  };

  const minutosValidos = (x) => (esNumero(x, 0, 1000) ? x : null);

  /**
   * Une el medidas.json de un equipo (y el de su control, si lo hay) en un registro normalizado.
   * `fuente` = { etiqueta, clave } (de dónde salió). Asume que `medidas` ya pasó validarMedidas.
   */
  function construirEquipo({ fuente, medidas, control = null }) {
    const m = medidas;
    const herramienta = HERRAMIENTAS.find((h) => h.id === m.herramienta);
    const controlValido = control && validarMedidas(control, 'control').length === 0 ? control : null;
    const auto = esObjeto(m.autoinforme) ? m.autoinforme : null;
    const diag = auto && esObjeto(auto.diagnostico) ? auto.diagnostico : null;
    const minutos = auto && esObjeto(auto.minutos) ? auto.minutos : {};

    const ca2 = minutosValidos(minutos.ca2);
    const ca3 = minutosValidos(minutos.ca3);
    const paquetes = esObjeto(m.paquetes)
      ? Object.entries(m.paquetes)
          .filter(([, d]) => esObjeto(d))
          .map(([nombre, d]) => ({
            nombre: texto(nombre, 60),
            instalada: texto(String(d.instalada ?? ''), 20) || null,
            ultimaVersion: texto(String(d.ultimaVersion ?? ''), 20) || null,
            dias: esEntero(d.dias, -1, 36500) ? Math.max(0, d.dias) : null,
          }))
      : [];
    const dias = paquetes.map((p) => p.dias).filter((d) => d !== null);

    const total = m.corridas.total;
    const completas = m.corridas.completas;
    const vecesControl = controlValido && completas >= 1 && controlValido.corridas.completas >= 1 && controlValido.corridas.mediana > 0 ? m.corridas.mediana / controlValido.corridas.mediana : null;
    const diagnostico = diag ? CLAVES_DIAGNOSTICO.filter((k) => diag[k] === true).length : null;
    const diagSinResponder = diag ? CLAVES_DIAGNOSTICO.filter((k) => typeof diag[k] !== 'boolean').length : null;

    const metricas = {
      pasan: m.pruebas.pasanEnLaUltimaCorrida,
      esperadas: m.pruebas.esperadas,
      corridas: total,
      completas,
      estabilidad: completas / total,
      mediana: m.corridas.mediana,
      minimo: esNumero(m.corridas.minimo, 0, 36000) ? m.corridas.minimo : null,
      maximo: esNumero(m.corridas.maximo, 0, 36000) ? m.corridas.maximo : null,
      controlMediana: controlValido ? controlValido.corridas.mediana : null,
      vecesControl,
      codigo: m.codigo.total,
      codigoPruebas: esEntero(m.codigo.pruebas) ? m.codigo.pruebas : null,
      codigoSoporte: esEntero(m.codigo.soporte) ? m.codigo.soporte : null,
      minutosInstalacion: minutosValidos(minutos.instalacion),
      minutosCA2: ca2,
      minutosCA3: ca3,
      minutosEscritura: ca2 !== null && ca3 !== null ? ca2 + ca3 : null,
      diagnostico,
      diagSinResponder,
      diasPaquete: dias.length ? Math.max(...dias) : null,
    };

    const avisos = [];
    if (!controlValido) avisos.push({ codigo: 'sin-control', texto: 'Sin medición del control: la velocidad no se puede normalizar.' });
    if (metricas.pasan < metricas.esperadas) avisos.push({ codigo: 'no-pasan', texto: `En la última corrida pasan ${metricas.pasan} de ${metricas.esperadas} pruebas.` });
    if (completas < total) avisos.push({ codigo: 'inestable', texto: `Solo ${completas} de ${total} corridas completas.` });
    if (total < 5) avisos.push({ codigo: 'pocas-corridas', texto: `Solo ${total} corrida${total === 1 ? '' : 's'}: la mediana es poco confiable.` });
    if (!auto) avisos.push({ codigo: 'sin-autoinforme', texto: 'Sin autoinforme: faltan los minutos y el diagnóstico.' });
    else if (diagSinResponder > 0 || ca2 === null || ca3 === null) avisos.push({ codigo: 'autoinforme-incompleto', texto: 'El autoinforme tiene respuestas sin llenar.' });

    return {
      clave: fuente.clave,
      nombre: texto(m.equipo, 50) || fuente.etiqueta || 'Equipo sin nombre',
      fuente: fuente.etiqueta,
      herramienta: herramienta.id,
      herramientaNombre: herramienta.nombre,
      ranura: herramienta.ranura,
      fecha: m.fecha,
      escenario: auto ? texto(auto.escenario, 40) : '',
      usoDeIA: auto ? texto(auto.usoDeIA, 40) : '',
      entorno: esObjeto(m.entorno) ? { node: texto(String(m.entorno.node ?? ''), 20), sistema: texto(String(m.entorno.sistema ?? ''), 30) } : null,
      paquetes,
      metricas,
      avisos,
    };
  }

  /** Si dos equipos se llaman igual, añade de dónde salió cada uno. */
  function desambiguar(equipos) {
    const cuenta = new Map();
    for (const e of equipos) cuenta.set(e.nombre.toLowerCase(), (cuenta.get(e.nombre.toLowerCase()) ?? 0) + 1);
    return equipos.map((e) => (cuenta.get(e.nombre.toLowerCase()) > 1 ? { ...e, nombre: `${e.nombre} (${e.fuente})` } : e));
  }

  // ------------------------------------------------------------------ archivos sueltos (alternativa a GitHub)
  const normalizarNombre = (s) => texto(s, 80).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /**
   * archivos: [{ nombre, datos }] ya leídos como JSON. Agrupa por equipo (campo «equipo»; si falta, por nombre del archivo).
   * Devuelve { equipos: [{ clave, etiqueta, medidas, control }], problemas: [{ origen, motivo }] }.
   */
  function agruparArchivos(archivos) {
    const grupos = new Map();
    const problemas = [];
    for (const { nombre, datos } of archivos) {
      const esControl = esObjeto(datos) && (datos.herramienta === ID_CONTROL || /control/i.test(nombre));
      const rol = esControl ? 'control' : 'kit';
      const malos = validarMedidas(datos, rol);
      if (malos.length) {
        problemas.push({ origen: texto(nombre, 60), motivo: malos[0] });
        continue;
      }
      const etiqueta = texto(datos.equipo, 50) || texto(nombre.replace(/\.json$/i, '').replace(/[-_ ]?control/i, ''), 50) || 'Equipo sin nombre';
      const clave = `archivo:${normalizarNombre(etiqueta)}`;
      const grupo = grupos.get(clave) ?? { clave, etiqueta, medidas: null, control: null };
      const previo = grupo[rol === 'control' ? 'control' : 'medidas'];
      if (previo) {
        problemas.push({ origen: texto(nombre, 60), motivo: `Hay dos archivos de ${rol === 'control' ? 'control' : 'medidas'} del equipo «${etiqueta}»: se usa el más reciente.` });
        if (Date.parse(previo.fecha) >= Date.parse(datos.fecha)) continue;
      }
      grupo[rol === 'control' ? 'control' : 'medidas'] = datos;
      grupos.set(clave, grupo);
    }
    const equipos = [];
    for (const g of grupos.values()) {
      if (!g.medidas) problemas.push({ origen: g.etiqueta, motivo: 'Solo llegó el archivo del control: falta medidas.json del equipo.' });
      else equipos.push(g);
    }
    return { equipos, problemas };
  }

  // ------------------------------------------------------------------ estadística y escalas
  /** Valores por herramienta: { [id]: { valores, mediana, n } } sobre los equipos que tienen el dato. */
  function resumirPorHerramienta(equipos, extraer) {
    const resultado = {};
    for (const h of HERRAMIENTAS) {
      const valores = equipos.filter((e) => e.herramienta === h.id).map(extraer).filter((v) => typeof v === 'number' && Number.isFinite(v));
      resultado[h.id] = { valores, mediana: mediana(valores), n: valores.length };
    }
    return resultado;
  }

  /** Las marcas de un eje entre `min` y `max`, de `paso` en `paso`. */
  function marcas(min, max, paso) {
    const ticks = [];
    const desde = Math.ceil(min / paso - 1e-9);
    const hasta = Math.floor(max / paso + 1e-9);
    // «+ 0» convierte −0 en 0: Intl lo escribiría como «−0».
    for (let k = desde; k <= hasta; k += 1) ticks.push(Math.round(k * paso * 1e9) / 1e9 + 0);
    return ticks;
  }

  /** Paso "redondo" (1, 2, 2,5, 5 × 10^k) para recorrer un rango con unas `objetivo` marcas. */
  function pasoBonito(min, max, objetivo) {
    if (!(max > min)) max = min + 1;
    const crudo = (max - min) / objetivo;
    const mag = 10 ** Math.floor(Math.log10(crudo));
    const norm = crudo / mag;
    return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  }

  /** Marcas "redondas" para un eje. Devuelve { ticks, paso }. */
  function ticksBonitos(min, max, objetivo = 4) {
    if (!(max > min)) max = min + 1;
    const paso = pasoBonito(min, max, objetivo);
    return { ticks: marcas(min, max, paso), paso };
  }

  /** Dominio del eje: arranca en 0 (las longitudes y los conteos no se recortan) y termina en una marca redonda. */
  function dominio(valores, { fijo = null, desdeCero = true, objetivo = 4 } = {}) {
    if (fijo) return { min: fijo[0], max: fijo[1], ...ticksBonitos(fijo[0], fijo[1], objetivo) };
    const finitos = valores.filter((v) => Number.isFinite(v));
    const lo = desdeCero ? 0 : Math.min(...finitos, 0);
    const hi = finitos.length ? Math.max(...finitos) : 0;
    const paso = pasoBonito(lo, hi, objetivo);
    const max = Math.round(Math.max(Math.ceil(hi / paso - 1e-9), 1) * paso * 1e9) / 1e9;
    return { min: lo, max, ticks: marcas(lo, max, paso), paso };
  }

  /** Reparte puntos que se pisan en capas (0, 1, 2…). `posiciones` en px; `separacion` en px. Devuelve la capa de cada punto. */
  function apilar(posiciones, separacion) {
    const orden = posiciones.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x || a.i - b.i);
    const ultimas = [];
    const capas = new Array(posiciones.length);
    for (const { x, i } of orden) {
      let c = 0;
      while (c < ultimas.length && x - ultimas[c] < separacion) c += 1;
      ultimas[c] = x;
      capas[i] = c;
    }
    return capas;
  }

  /** Capa → desplazamiento vertical simétrico: 0, −1, +1, −2, +2… por `paso`. */
  function desplazamiento(capa, paso) {
    if (capa === 0) return 0;
    const k = Math.ceil(capa / 2);
    return (capa % 2 === 1 ? -k : k) * paso;
  }

  // ------------------------------------------------------------------ formato (es-CO)
  const formatos = {};
  function numero(v, decimales = 0) {
    if (v === null || v === undefined || !Number.isFinite(v)) return '—';
    const clave = String(decimales);
    formatos[clave] = formatos[clave] ?? new Intl.NumberFormat('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
    return formatos[clave].format(v);
  }
  const veces = (v) => (v === null || v === undefined ? '—' : `${numero(v, 1)}×`);
  const segundos = (v) => (v === null || v === undefined ? '—' : `${numero(v, v < 10 ? 2 : 1)} s`);

  // ------------------------------------------------------------------ datos de ejemplo (para ensayar el tablero)
  /** Generador determinista (mulberry32): el ejemplo es siempre el mismo. */
  function azar(semilla) {
    let a = semilla >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Mediciones de referencia de una máquina "promedio" (mediana en segundos, líneas, antigüedad de paquetes). */
  const BASE_EJEMPLO = {
    control: { mediana: 1.79, codigo: 48 },
    selenium: { mediana: 2.15, codigo: 68, paquetes: { 'selenium-webdriver': ['4.51.0', 14], mocha: ['12.0.3', 23] } },
    cypress: { mediana: 4.31, codigo: 37, paquetes: { cypress: ['16.2.0', 9] } },
    'playwright-cucumber': { mediana: 1.88, codigo: 97, paquetes: { '@cucumber/cucumber': ['13.3.0', 19], '@playwright/test': ['1.64.1', 9] } },
  };

  const EQUIPOS_EJEMPLO = [
    { nombre: 'Los Pioneros', herramienta: 'selenium', maquina: 1.0, minutos: [32, 24, 12], diag: [1, 1, 1, 0, 0], falla: 0 },
    { nombre: 'Debuggers', herramienta: 'cypress', maquina: 1.0, minutos: [18, 12, 22], diag: [1, 1, 1, 1, 0], falla: 0 },
    { nombre: 'Gherkin Gang', herramienta: 'playwright-cucumber', maquina: 1.0, minutos: [27, 22, 9], diag: [1, 1, 1, 1, 1], falla: 0 },
    { nombre: 'Byte Me', herramienta: 'selenium', maquina: 1.45, minutos: [40, 35, 15], diag: [1, 1, 0, 0, 0], falla: 0 },
    { nombre: 'QA Cuántico', herramienta: 'cypress', maquina: 1.3, minutos: [15, 14, 30], diag: [1, 1, 1, 1, 0], falla: 1 },
    { nombre: 'Los Verificadores', herramienta: 'playwright-cucumber', maquina: 0.85, minutos: [24, 20, 11], diag: [1, 1, 1, 1, 0], sinControl: true },
    { nombre: 'Test & Go', herramienta: 'selenium', maquina: 0.9, minutos: [28, 21, 10], diag: [1, 1, 1, 0, 0], falla: 0 },
    { nombre: 'Cobertura Total', herramienta: 'cypress', maquina: 1.1, minutos: [20, 16, 18], diag: [1, 1, null, 1, 0], falla: 0 },
    { nombre: 'Casos de Uso', herramienta: 'playwright-cucumber', maquina: 1.2, minutos: [35, 30, 10], diag: [1, 1, 1, 1, 1], falla: 0 },
  ];

  function medicionEjemplo(base, factor, rnd, { corridas = 10, falla = 0, nombre, ahora }) {
    const segundosCorridas = Array.from({ length: corridas }, () => Math.round(base.mediana * factor * (0.9 + rnd() * 0.25) * 100) / 100);
    const orden = [...segundosCorridas].sort((a, b) => a - b);
    return { segundosCorridas, orden, mediana: mediana(segundosCorridas), completas: corridas - falla, nombre, ahora };
  }

  /** Devuelve [{ etiqueta, medidas, control }] con el mismo formato que leería de los repositorios. */
  function datosDeEjemplo(ahora = Date.now()) {
    const rnd = azar(2026);
    return EQUIPOS_EJEMPLO.map((eq, i) => {
      const base = BASE_EJEMPLO[eq.herramienta];
      const corridas = 10;
      const fecha = new Date(ahora - (3 + i * 4) * 60000).toISOString();
      const k = medicionEjemplo(base, eq.maquina, rnd, { corridas, falla: eq.falla ?? 0 });
      const c = medicionEjemplo(BASE_EJEMPLO.control, eq.maquina, rnd, { corridas });
      const [instalacion, ca2, ca3] = eq.minutos;
      const diag = {};
      CLAVES_DIAGNOSTICO.forEach((clave, n) => {
        diag[clave] = eq.diag[n] === null ? null : eq.diag[n] === 1;
      });
      const medidas = {
        esquema: 1,
        equipo: eq.nombre,
        herramienta: eq.herramienta,
        nombre: HERRAMIENTAS.find((h) => h.id === eq.herramienta).nombre,
        fecha,
        entorno: { node: 'v24.0.0', sistema: 'ejemplo' },
        corridas: { total: corridas, completas: k.completas, conFallos: corridas - k.completas, segundos: k.segundosCorridas, mediana: Math.round(k.mediana * 100) / 100, minimo: k.orden[0], maximo: k.orden.at(-1) },
        pruebas: { esperadas: 3, pasanEnLaUltimaCorrida: 3 },
        codigo: { pruebas: base.codigo - 15, soporte: 15, total: base.codigo + (i % 3) * 2 },
        paquetes: Object.fromEntries(Object.entries(base.paquetes).map(([nombre, [version, dias]]) => [nombre, { instalada: version, ultimaVersion: version, ultimaPublicacion: new Date(ahora - dias * 86400000).toISOString(), dias }])),
        autoinforme: {
          equipo: eq.nombre,
          integrantes: [],
          escenario: `E${(i % 6) + 1}`,
          usoDeIA: i % 4 === 0 ? 'consultas' : 'ninguno',
          minutos: { instalacion, ca2, ca3 },
          diagnostico: diag,
          notas: '',
          puntosDiagnostico: eq.diag.filter((x) => x === 1).length,
        },
      };
      const control = eq.sinControl
        ? null
        : {
            esquema: 1,
            equipo: eq.nombre,
            herramienta: ID_CONTROL,
            nombre: 'Playwright Test (control)',
            fecha,
            entorno: medidas.entorno,
            corridas: { total: corridas, completas: corridas, conFallos: 0, segundos: c.segundosCorridas, mediana: Math.round(c.mediana * 100) / 100, minimo: c.orden[0], maximo: c.orden.at(-1) },
            pruebas: { esperadas: 3, pasanEnLaUltimaCorrida: 3 },
            codigo: { pruebas: 34, soporte: 14, total: 48 },
            paquetes: {},
            autoinforme: null,
          };
      return { etiqueta: `ejemplo-${i + 1}`, medidas, control };
    });
  }

  return {
    HERRAMIENTAS,
    ID_CONTROL,
    CLAVES_DIAGNOSTICO,
    analizarRepositorios,
    urlsDeRepositorio,
    validarMedidas,
    construirEquipo,
    desambiguar,
    agruparArchivos,
    mediana,
    resumirPorHerramienta,
    ticksBonitos,
    dominio,
    apilar,
    desplazamiento,
    numero,
    veces,
    segundos,
    texto,
    datosDeEjemplo,
  };
});
