// Cucumber solo ejecuta escenarios: el navegador lo pone Playwright (como LIBRERÍA) y lo armamos aquí.
// Esto es lo que, en Playwright Test o en Cypress, ya viene hecho.
const { After, AfterAll, Before, BeforeAll, World, setDefaultTimeout, setWorldConstructor } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL ?? 'https://qa-tienda-pruebas.vercel.app';
setDefaultTimeout(30_000);

let navegador;

class Mundo extends World {
  // Un contexto limpio por escenario: así cada uno es independiente de los demás.
  async abrir() {
    this.contexto = await navegador.newContext({ baseURL: BASE_URL });
    this.page = await this.contexto.newPage();
    this.avisos = []; // los textos de los alert() que aparezcan
    this.page.on('dialog', async (dialogo) => {
      this.avisos.push(dialogo.message());
      await dialogo.accept();
    });
  }
}

setWorldConstructor(Mundo);

BeforeAll(async () => {
  // El Chrome instalado en tu equipo: el mismo navegador que usan Selenium y Cypress en este duelo.
  navegador = await chromium.launch({ channel: 'chrome' });
});

Before(async function () {
  await this.abrir();
});

After(async function () {
  // Cucumber no deja una captura de pantalla por sí solo: si la quieren cuando algo falla, hay que pedirla aquí
  // (es un reto opcional de la guía). Lo que sí queda siempre es el informe HTML: informe/cucumber.html.
  await this.contexto.close();
});

AfterAll(async () => {
  await navegador.close();
});
