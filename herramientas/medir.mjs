#!/usr/bin/env node
/**
 * MEDIDOR DEL DUELO · mide una suite con la misma regla para cualquier herramienta.
 *
 *   npm run medir                       (desde la carpeta de tu kit: kits/<herramienta>)
 *   npm run medir -- --corridas 10      más repeticiones = estabilidad más confiable
 *   npm run medir -- --equipo equipo-3  tu nombre de equipo (también sirve EQUIPO=equipo-3)
 *   npm run medir -- --sin-red          no consulta el registro de npm
 *   npm run medir -- --actualizar-autoinforme   solo vuelve a copiar autoinforme.json en medidas.json (sin repetir las corridas)
 *
 * Qué hace:
 *   1. Ejecuta `npm test` varias veces y anota cuánto tarda cada corrida y si pasaron las 3 pruebas  → VELOCIDAD y ESTABILIDAD
 *   2. Cuenta las líneas de código de las pruebas y del soporte (sin comentarios ni líneas en blanco) → CÓDIGO
 *   3. Pregunta al registro de npm cuándo se publicó la última versión de cada paquete               → COMUNIDAD (vigencia)
 *   4. Une lo que ustedes anotaron a mano en autoinforme.json (minutos y diagnóstico)
 *   5. Escribe el resultado en medidas.json (en la raíz del repositorio): ahí lo lee el tablero de la clase.
 *
 * No necesita instalar nada: solo Node 22 o superior (el mismo que piden los kits).
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import os from 'node:os';

// ------------------------------------------------------------------ argumentos
const argumentos = process.argv.slice(2);
const valor = (nombre, porDefecto) => {
  const i = argumentos.indexOf(`--${nombre}`);
  return i >= 0 && argumentos[i + 1] && !argumentos[i + 1].startsWith('--') ? argumentos[i + 1] : porDefecto;
};
const CORRIDAS = Math.max(1, Number.parseInt(valor('corridas', '5'), 10) || 5);
const SIN_RED = argumentos.includes('--sin-red');
const SOLO_AUTOINFORME = argumentos.includes('--actualizar-autoinforme');
const EQUIPO = valor('equipo', process.env.EQUIPO ?? '');

const CARPETA = process.cwd();
const rutaKit = join(CARPETA, 'kit.json');
if (!existsSync(rutaKit)) {
  console.error('No encuentro kit.json aquí. Ejecuta este comando dentro de la carpeta de tu kit (por ejemplo kits/cypress).');
  process.exit(2);
}
const kit = JSON.parse(readFileSync(rutaKit, 'utf8'));

// La raíz del repositorio: la primera carpeta hacia arriba que tiene "herramientas/medir.mjs".
function buscarRaiz(desde) {
  for (let carpeta = desde; ; carpeta = dirname(carpeta)) {
    if (existsSync(join(carpeta, 'herramientas', 'medir.mjs'))) return carpeta;
    if (dirname(carpeta) === carpeta) return desde;
  }
}
const RAIZ = buscarRaiz(CARPETA);

// ------------------------------------------------------------------ utilidades
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const pintar = (codigo, texto) => (color ? `\x1b[${codigo}m${texto}\x1b[0m` : texto);
const verde = (t) => pintar('32', t);
const rojo = (t) => pintar('31', t);
const gris = (t) => pintar('90', t);
const negrita = (t) => pintar('1', t);

const mediana = (numeros) => {
  const orden = [...numeros].sort((a, b) => a - b);
  const mitad = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2;
};
const redondear = (n, decimales = 1) => Math.round(n * 10 ** decimales) / 10 ** decimales;

/** Ejecuta `npm test` y devuelve { codigo, segundos, salida }. */
function correrPruebas() {
  return new Promise((resolver) => {
    const inicio = process.hrtime.bigint();
    const proceso = spawn('npm test', { cwd: CARPETA, shell: true });
    let salida = '';
    proceso.stdout.on('data', (d) => (salida += d));
    proceso.stderr.on('data', (d) => (salida += d));
    proceso.on('close', (codigo) => {
      const segundos = Number(process.hrtime.bigint() - inicio) / 1e9;
      resolver({ codigo, segundos, salida: salida.replace(/\x1b\[[0-9;]*m/g, '') });
    });
  });
}

// ------------------------------------------------------------------ líneas de código
function archivosQueCoinciden(patrones) {
  // glob mínimo: "**" cruza carpetas, "*" no cruza "/".
  const aRegex = (patron) =>
    new RegExp(
      '^' +
        patron
          .split('/')
          .map((parte) => (parte === '**' ? '(?:.+/)?' : parte.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '/'))
          .join('')
          .replace(/\/$/, '') +
        '$',
    );
  const regexes = patrones.map(aRegex);
  const encontrados = [];
  const recorrer = (carpeta) => {
    for (const nombre of readdirSync(carpeta)) {
      if (['node_modules', '.git', 'informe', 'reports', 'test-results', 'playwright-report', 'screenshots', 'videos'].includes(nombre)) continue;
      const ruta = join(carpeta, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (regexes.some((r) => r.test(relative(CARPETA, ruta).split(sep).join('/')))) encontrados.push(ruta);
    }
  };
  recorrer(CARPETA);
  return encontrados;
}

function contarLineas(ruta) {
  let texto = readFileSync(ruta, 'utf8');
  if (ruta.endsWith('.json')) return texto.split('\n').filter((l) => l.trim() !== '').length;
  const esGherkin = ruta.endsWith('.feature');
  if (!esGherkin) texto = texto.replace(/\/\*[\s\S]*?\*\//g, '');
  return texto.split('\n').filter((l) => {
    const t = l.trim();
    if (t === '') return false;
    if (esGherkin) return !t.startsWith('#') || t.startsWith('# language');
    return !t.startsWith('//');
  }).length;
}

const sumar = (archivos) => archivos.reduce((s, a) => s + contarLineas(a), 0);

// ------------------------------------------------------------------ registro de npm
function consultarNpm(paquete) {
  // `time[versión]` es el momento en que se PUBLICÓ la versión más reciente (time.modified también cambia con avisos y etiquetas).
  return new Promise((resolver) => {
    const proceso = spawn(`npm view ${paquete} version time --json`, { shell: true });
    let salida = '';
    const reloj = setTimeout(() => proceso.kill(), 15_000);
    proceso.stdout.on('data', (d) => (salida += d));
    proceso.on('close', () => {
      clearTimeout(reloj);
      try {
        const datos = JSON.parse(salida);
        const fecha = datos.time[datos.version];
        resolver({ ultimaVersion: datos.version, ultimaPublicacion: fecha, dias: Math.floor((Date.now() - Date.parse(fecha)) / 86_400_000) });
      } catch {
        resolver(null);
      }
    });
    proceso.on('error', () => resolver(null));
  });
}

function versionInstalada(paquete) {
  try {
    return JSON.parse(readFileSync(join(CARPETA, 'node_modules', paquete, 'package.json'), 'utf8')).version;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ atajo: solo el autoinforme
function leerAutoinforme() {
  const ruta = join(RAIZ, 'autoinforme.json');
  if (!existsSync(ruta)) return { autoinforme: null, equipo: '' };
  try {
    const contenido = JSON.parse(readFileSync(ruta, 'utf8'));
    if (kit.autoinforme === false) return { autoinforme: null, equipo: contenido.equipo ?? '' };
    const marcas = Object.values(contenido.diagnostico ?? {});
    return { autoinforme: { ...contenido, puntosDiagnostico: marcas.filter((m) => m === true).length, sinResponder: marcas.filter((m) => m === null).length }, equipo: contenido.equipo ?? '' };
  } catch {
    console.log(rojo('\nautoinforme.json no es un JSON válido: revísalo.'));
    process.exit(1);
  }
}

if (SOLO_AUTOINFORME) {
  const destinoExistente = join(RAIZ, kit.salida ?? 'medidas.json');
  if (!existsSync(destinoExistente)) {
    console.error(`Todavía no existe ${relative(CARPETA, destinoExistente)}: primero corre \`npm run medir\` completo.`);
    process.exit(2);
  }
  const medidasPrevias = JSON.parse(readFileSync(destinoExistente, 'utf8'));
  const { autoinforme: nuevo, equipo: equipoNuevo } = leerAutoinforme();
  medidasPrevias.autoinforme = nuevo;
  medidasPrevias.equipo = EQUIPO || equipoNuevo || medidasPrevias.equipo;
  writeFileSync(destinoExistente, JSON.stringify(medidasPrevias, null, 2) + '\n');
  console.log(verde(`✓ autoinforme.json copiado en ${relative(CARPETA, destinoExistente)}`) + gris('  (las corridas no se repitieron)'));
  process.exit(0);
}

// ------------------------------------------------------------------ medición
console.log(negrita(`\nMidiendo: ${kit.nombre}`) + gris(` · ${CORRIDAS} corridas · carpeta ${relative(RAIZ, CARPETA) || '.'}`));
console.log(gris('Cada corrida ejecuta `npm test` completo (abre y cierra el navegador). Puede tardar unos minutos.\n'));

const corridas = [];
const patron = new RegExp(kit.resultado);
for (let i = 1; i <= CORRIDAS; i += 1) {
  const r = await correrPruebas();
  const pasan = Number(r.salida.match(patron)?.[1] ?? 0);
  const completa = r.codigo === 0 && pasan === kit.pruebasEsperadas;
  corridas.push({ segundos: redondear(r.segundos, 2), pasan, completa });
  console.log(`  corrida ${i}/${CORRIDAS}  ${String(redondear(r.segundos)).padStart(5)} s   ${completa ? verde('✓ pasan las ' + pasan) : rojo(`✗ pasan ${pasan} de ${kit.pruebasEsperadas}`)}`);
  if (!completa && corridas.filter((c) => !c.completa).length <= 3) {
    console.log(gris(`    (Corrida ${i} con problemas. Últimas líneas de la salida:)`));
    for (const linea of r.salida.trim().split('\n').slice(-12)) console.log(gris('    ' + linea));
  }
}

const segundos = corridas.map((c) => c.segundos);
const completas = corridas.filter((c) => c.completa).length;

const archivosPruebas = archivosQueCoinciden(kit.pruebas);
const archivosSoporte = archivosQueCoinciden(kit.soporte);
const codigo = { pruebas: sumar(archivosPruebas), soporte: sumar(archivosSoporte) };
codigo.total = codigo.pruebas + codigo.soporte;

const paquetes = {};
for (const paquete of kit.paquetes) {
  paquetes[paquete] = { instalada: versionInstalada(paquete), ...(SIN_RED ? {} : ((await consultarNpm(paquete)) ?? {})) };
}

let autoinforme = null;
let equipoDeclarado = '';
const rutaAuto = join(RAIZ, 'autoinforme.json');
if (existsSync(rutaAuto)) {
  try {
    const contenido = JSON.parse(readFileSync(rutaAuto, 'utf8'));
    equipoDeclarado = contenido.equipo ?? '';
    if (kit.autoinforme !== false) {
      autoinforme = contenido;
      const marcas = Object.values(autoinforme.diagnostico ?? {});
      autoinforme.puntosDiagnostico = marcas.filter((m) => m === true).length;
      autoinforme.sinResponder = marcas.filter((m) => m === null).length;
    }
  } catch {
    console.log(rojo('\nautoinforme.json no es un JSON válido: revísalo (no se incluyó en medidas.json).'));
  }
}

const medidas = {
  esquema: 1,
  equipo: EQUIPO || equipoDeclarado,
  herramienta: kit.herramienta,
  nombre: kit.nombre,
  fecha: new Date().toISOString(),
  entorno: { node: process.version, sistema: `${os.platform()} ${os.arch()}` },
  corridas: {
    total: CORRIDAS,
    completas,
    conFallos: CORRIDAS - completas,
    segundos,
    mediana: redondear(mediana(segundos), 2),
    minimo: Math.min(...segundos),
    maximo: Math.max(...segundos),
  },
  pruebas: { esperadas: kit.pruebasEsperadas, pasanEnLaUltimaCorrida: corridas.at(-1).pasan },
  codigo,
  paquetes,
  autoinforme,
};

const destino = join(RAIZ, kit.salida ?? 'medidas.json');
writeFileSync(destino, JSON.stringify(medidas, null, 2) + '\n');

// ------------------------------------------------------------------ resumen
console.log(negrita('\nResumen'));
console.log(`  Velocidad ......... mediana ${medidas.corridas.mediana} s  (mínimo ${medidas.corridas.minimo} · máximo ${medidas.corridas.maximo})`);
console.log(`  Estabilidad ....... ${completas} de ${CORRIDAS} corridas completas${completas === CORRIDAS ? '' : rojo('  ← hay corridas con fallos: ¿la prueba o la herramienta?')}`);
console.log(`  Código ............ ${codigo.pruebas} líneas de pruebas + ${codigo.soporte} de soporte = ${codigo.total}`);
for (const [paquete, d] of Object.entries(paquetes)) {
  console.log(`  ${paquete.padEnd(19, '.').slice(0, 19)} ${d.instalada ?? '?'} instalada` + (d.dias != null ? gris(` · última publicación hace ${d.dias} días (v${d.ultimaVersion})`) : gris(' · sin datos del registro')));
}
if (kit.autoinforme !== false) {
  const faltan = autoinforme?.sinResponder ? rojo(`  ← faltan ${autoinforme.sinResponder} respuestas del diagnóstico`) : '';
  console.log(`  Autoinforme ....... ${autoinforme ? `minutos ${JSON.stringify(autoinforme.minutos ?? {})}, diagnóstico ${autoinforme.puntosDiagnostico}/5${faltan}` : gris('no hay autoinforme.json todavía')}`);
}
console.log(verde(`\n✓ Guardado en ${relative(CARPETA, destino)}`) + gris('  (haz commit y push: el tablero de la clase lo lee de tu repositorio)\n'));
process.exit(completas === CORRIDAS ? 0 : 1);
