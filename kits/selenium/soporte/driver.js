// Selenium es una LIBRERÍA: solo controla el navegador. Lo demás (ejecutor, aserciones, informes)
// se arma aparte: aquí, Mocha ejecuta y el módulo assert de Node comprueba.
const { Builder, Browser } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = process.env.BASE_URL ?? 'https://qa-tienda-pruebas.vercel.app';

/** Abre Chrome (sin ventana). Selenium Manager descarga el chromedriver que corresponde, solo. */
async function crearDriver() {
  const opciones = new chrome.Options().addArguments('--headless=new', '--window-size=1280,720');
  return new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(opciones)
    // Si un alert() aparece y no decimos nada, por defecto ChromeDriver lo CIERRA por ti y lanza un error.
    // 'ignore' lo deja abierto para que la prueba lo lea y lo acepte (lo necesita US-04 CA2).
    .withCapabilities({ unhandledPromptBehavior: 'ignore' })
    .build();
}

module.exports = { BASE_URL, crearDriver };
