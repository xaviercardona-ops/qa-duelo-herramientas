// CONTROL del duelo: Playwright Test con su configuración habitual (salvo un solo worker, ver abajo).
// Usa el Chrome instalado en tu equipo (el mismo navegador que usan Selenium y Cypress en este duelo).
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // En el duelo todas las suites corren EN SERIE (un solo worker): así la comparación no depende de cuántos núcleos
  // tenga cada computador. Tres pruebas no muestran la ventaja del paralelismo: esa se consulta en la documentación.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://qa-tienda-pruebas.vercel.app',
    // Evidencia de las fallas: son estas dos líneas (por defecto, Playwright no guarda ninguna).
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
});
