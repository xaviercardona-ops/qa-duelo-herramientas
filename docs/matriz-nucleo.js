/* Calculadora de la matriz de decisión · núcleo (sin DOM).
 * Pesos que suman 100, puntajes de 1 a 5 por herramienta, total ponderado, prueba de sensibilidad y la tabla en Markdown. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.MatrizNucleo = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Los ocho criterios de la presentación, en su orden. */
  const CRITERIOS = [
    { id: 'encaje', nombre: 'Encaje', pregunta: '¿Calza con el lenguaje, las habilidades y los procesos del equipo?' },
    { id: 'cobertura', nombre: 'Cobertura', pregunta: '¿Cubre los navegadores, móviles y APIs que se necesitan?' },
    { id: 'estabilidad', nombre: 'Estabilidad', pregunta: '¿Espera sola o las esperas se programan a mano?' },
    { id: 'diagnostico', nombre: 'Diagnóstico', pregunta: 'Cuando falla, ¿se ve por qué?' },
    { id: 'velocidad', nombre: 'Velocidad', pregunta: '¿Cuánto tarda la suite y cómo se reparte en paralelo?' },
    { id: 'integracion', nombre: 'Integración', pregunta: '¿Se lleva bien con CI, informes y Jira?' },
    { id: 'comunidad', nombre: 'Comunidad y futuro', pregunta: '¿Quién la mantiene y hasta cuándo?' },
    { id: 'costo', nombre: 'Costo total', pregunta: 'Licencias, aprendizaje y mantenimiento.' },
  ];
  /** Las tres opciones de la matriz (las mismas de la presentación). `ranura` es su color fijo. */
  const OPCIONES = [
    { id: 'selenium', nombre: 'Selenium', ranura: 1 },
    { id: 'cypress', nombre: 'Cypress', ranura: 2 },
    { id: 'playwright', nombre: 'Playwright', ranura: 3 },
  ];

  const esPeso = (x) => Number.isInteger(x) && x >= 0 && x <= 100;
  const esPuntaje = (x) => Number.isInteger(x) && x >= 1 && x <= 5;
  const redondear = (x) => Math.round(x * 100) / 100;

  const sumaPesos = (pesos) => CRITERIOS.reduce((s, c) => s + (esPeso(pesos[c.id]) ? pesos[c.id] : 0), 0);

  /** Total ponderado (máximo 5,00) por opción. null si falta algún puntaje de un criterio con peso, o si los pesos no suman 100. */
  function totales(pesos, puntajes) {
    const resultado = {};
    const completos = sumaPesos(pesos) === 100;
    for (const o of OPCIONES) {
      let suma = 0;
      let faltan = !completos;
      for (const c of CRITERIOS) {
        const peso = esPeso(pesos[c.id]) ? pesos[c.id] : 0;
        if (peso === 0) continue;
        const puntaje = puntajes?.[c.id]?.[o.id];
        if (!esPuntaje(puntaje)) {
          faltan = true;
          break;
        }
        suma += peso * puntaje;
      }
      resultado[o.id] = faltan ? null : redondear(suma / 100);
    }
    return resultado;
  }

  /** Quién gana: { ids, maximo }. Si hay empate, `ids` trae a todos los empatados. Sin totales completos: ids vacío. */
  function ganador(tot) {
    const valores = OPCIONES.map((o) => tot[o.id]);
    if (valores.some((v) => v === null || v === undefined)) return { ids: [], maximo: null };
    const maximo = Math.max(...valores);
    return { ids: OPCIONES.filter((o) => tot[o.id] === maximo).map((o) => o.id), maximo };
  }

  const mismoConjunto = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

  /**
   * Prueba de sensibilidad: pasa `paso` puntos de peso de un criterio a otro, de todas las maneras posibles,
   * y cuenta cuántas veces cambia el ganador. Devuelve { analizados, cambian, cambios: [{ sube, baja, ganan }] }.
   */
  function sensibilidad(pesos, puntajes, paso = 10) {
    const base = ganador(totales(pesos, puntajes));
    if (!base.ids.length) return null;
    let analizados = 0;
    const cambios = [];
    for (const sube of CRITERIOS) {
      for (const baja of CRITERIOS) {
        if (sube.id === baja.id || (pesos[baja.id] ?? 0) < paso) continue;
        const nuevos = { ...pesos, [sube.id]: pesos[sube.id] + paso, [baja.id]: pesos[baja.id] - paso };
        const g = ganador(totales(nuevos, puntajes));
        analizados += 1;
        // si los puntajes de un criterio que antes pesaba 0 faltan, no se puede evaluar esa reasignación
        if (!g.ids.length) {
          analizados -= 1;
          continue;
        }
        if (!mismoConjunto(g.ids, base.ids)) cambios.push({ sube: sube.id, baja: baja.id, ganan: g.ids });
      }
    }
    return { base: base.ids, analizados, cambian: cambios.length, cambios };
  }

  const celda = (texto) => String(texto ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();

  /** La tabla de MATRIZ.md ya llena, para pegarla. */
  function aMarkdown({ pesos, puntajes, evidencias = {}, escenario = '' }) {
    const tot = totales(pesos, puntajes);
    const n = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','));
    const filas = CRITERIOS.map((c, i) => {
      const p = (o) => puntajes?.[c.id]?.[o.id] ?? '';
      return `| ${i + 1} · ${c.nombre} | ${pesos[c.id] ?? ''} | ${OPCIONES.map(p).join(' | ')} | ${celda(evidencias[c.id])} |`;
    });
    const g = ganador(tot);
    return [
      escenario ? `**Escenario:** ${celda(escenario)}` : null,
      escenario ? '' : null,
      '| Criterio | Peso | Selenium | Cypress | Playwright | ¿Por qué ese peso? · Evidencia de los puntajes |',
      '|---|---:|:---:|:---:|:---:|---|',
      ...filas,
      `| **Total ponderado** (máx. 5,00) | **${sumaPesos(pesos)}** | ${OPCIONES.map((o) => `**${n(tot[o.id])}**`).join(' | ')} | ${g.ids.length ? `Gana: ${OPCIONES.filter((o) => g.ids.includes(o.id)).map((o) => o.nombre).join(' y ')}` : ''} |`,
    ]
      .filter((l) => l !== null)
      .join('\n');
  }

  return { CRITERIOS, OPCIONES, sumaPesos, totales, ganador, sensibilidad, aMarkdown, esPeso, esPuntaje };
});
