const { Given, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Given('que abro la tienda', async function () {
  await this.page.goto('/');
});

Then('veo {int} productos', async function (cantidad) {
  await expect(this.page.getByRole('heading', { level: 3 })).toHaveCount(cantidad);
});
