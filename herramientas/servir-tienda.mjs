#!/usr/bin/env node
/**
 * Sirve la copia fija de la Tienda Escolar (carpeta tienda/) por HTTP. Sin dependencias.
 *
 *   node herramientas/servir-tienda.mjs [puerto]      (por defecto 3100) y abre http://127.0.0.1:3100
 *
 * Normalmente no hace falta ejecutarlo a mano: `npm test` lo enciende y lo apaga con herramientas/con-tienda.mjs.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TIENDA = join(RAIZ, 'tienda');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/** Enciende la tienda. `puerto: 0` pide al sistema un puerto libre. Devuelve { url, puerto, cerrar }. */
export function iniciarTienda({ puerto = 0, carpeta = TIENDA } = {}) {
  const servidor = createServer(async (peticion, respuesta) => {
    try {
      const ruta = decodeURIComponent(new URL(peticion.url, 'http://tienda.local').pathname);
      const pedido = normalize(ruta === '/' ? '/index.html' : ruta);
      const archivo = resolve(carpeta, '.' + sep + pedido);
      if (archivo !== carpeta && !archivo.startsWith(carpeta + sep)) throw Object.assign(new Error('fuera de la tienda'), { code: 'ENOENT' });
      const contenido = await readFile(archivo);
      respuesta.writeHead(200, { 'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
      respuesta.end(contenido);
    } catch {
      const noEncontrada = await readFile(join(carpeta, '404.html')).catch(() => Buffer.from('No encontrado'));
      respuesta.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      respuesta.end(noEncontrada);
    }
  });

  return new Promise((resolver, rechazar) => {
    servidor.once('error', rechazar);
    servidor.listen(puerto, '127.0.0.1', () => {
      const { port } = servidor.address();
      resolver({
        puerto: port,
        url: `http://127.0.0.1:${port}`,
        cerrar: () => new Promise((listo) => { servidor.closeAllConnections?.(); servidor.close(() => listo()); }),
      });
    });
  });
}

// Si se ejecuta directamente (no importado), se queda encendido.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const puerto = Number.parseInt(process.argv[2] ?? '3100', 10);
  try {
    const tienda = await iniciarTienda({ puerto });
    console.log(`Tienda Escolar (copia fija) en ${tienda.url}  ·  Ctrl+C para apagarla`);
  } catch (error) {
    console.error(error.code === 'EADDRINUSE' ? `El puerto ${puerto} está ocupado: prueba con otro (node herramientas/servir-tienda.mjs 3200).` : error.message);
    process.exit(1);
  }
}
