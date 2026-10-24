#!/usr/bin/env node
/**
 * Corre un comando con la Tienda Escolar encendida.
 *
 *   node herramientas/con-tienda.mjs <comando y argumentos…>      (así lo usan los `npm test` de los kits)
 *
 *  · Si BASE_URL ya está definida (por ejemplo, la tienda real), no enciende nada: solo corre el comando.
 *  · Si no, enciende la copia fija de la tienda en un puerto libre, define BASE_URL, corre el comando
 *    y la apaga al terminar. El código de salida es el del comando.
 *
 * Es igual para las tres herramientas: por eso no cuenta como «código de soporte» de ninguna.
 */
import { spawn } from 'node:child_process';
import { iniciarTienda } from './servir-tienda.mjs';

const comando = process.argv.slice(2).join(' ');
if (!comando) {
  console.error('Uso: node herramientas/con-tienda.mjs <comando…>');
  process.exit(2);
}

const entorno = { ...process.env };
let tienda = null;
if (!entorno.BASE_URL) {
  tienda = await iniciarTienda();
  entorno.BASE_URL = tienda.url;
}

const hijo = spawn(comando, { shell: true, stdio: 'inherit', env: entorno });
for (const senal of ['SIGINT', 'SIGTERM']) process.on(senal, () => hijo.kill(senal));

const codigo = await new Promise((resolver) => {
  hijo.on('close', (c, senal) => resolver(c ?? (senal ? 1 : 0)));
  hijo.on('error', () => resolver(1));
});

await tienda?.cerrar();
process.exit(codigo);
