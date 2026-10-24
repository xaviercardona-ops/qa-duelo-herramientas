# Copia fija de la Tienda Escolar

Esta carpeta es la **Tienda Escolar** de las clases de pruebas (https://qa-tienda-pruebas.vercel.app), exportada como
sitio estático y **congelada**: así todos los equipos miden contra exactamente lo mismo, sin depender de internet.

- Origen: https://github.com/xaviercardona-ops/qa-tienda-pruebas (commit `e2f40f6`, Next.js 16.3.3, `output: "export"`)
- No la editen: `npm test` la enciende sola en un puerto libre (`herramientas/con-tienda.mjs`) y la apaga al terminar.
- Para verla en el navegador: `node herramientas/servir-tienda.mjs` y abran http://127.0.0.1:3100
