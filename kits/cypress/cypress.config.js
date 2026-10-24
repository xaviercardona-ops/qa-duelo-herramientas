const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL ?? 'https://qa-tienda-pruebas.vercel.app',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: false,
    video: false,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});
