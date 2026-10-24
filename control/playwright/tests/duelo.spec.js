const { test, expect } = require('@playwright/test');

// Los tres criterios del duelo (historias de https://qa-tienda-pruebas.vercel.app/backlog-jira.html)
test.describe('Duelo · tres criterios de aceptación', () => {
  test('US-01 CA1: el catálogo muestra 8 productos', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(8);
  });

  test('US-04 CA2: no deja agregar 7 mochilas de una vez (stock 6) y avisa', async ({ page }) => {
    await page.goto('/');
    const tarjeta = page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Mochila escolar', level: 3 }) });

    // El aviso es un alert() del navegador: el manejador se registra ANTES de hacer clic.
    let aviso = '';
    page.once('dialog', async (dialogo) => {
      aviso = dialogo.message();
      await dialogo.accept();
    });
    await tarjeta.getByRole('spinbutton').fill('7');
    await tarjeta.getByRole('button', { name: 'Agregar' }).click();

    expect(aviso).toContain('Solo hay 6 unidades');
    await expect(page.getByText('Tu carrito está vacío.')).toBeVisible();
  });

  test('US-09 CA1: DESC10 descuenta el 10 % del subtotal', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('.rounded-lg')
      .filter({ has: page.getByRole('heading', { name: 'Mochila escolar', level: 3 }) })
      .getByRole('button', { name: 'Agregar' })
      .click();

    const carrito = page.locator('.rounded-lg').filter({ has: page.getByRole('heading', { name: 'Carrito' }) });
    await carrito.getByPlaceholder('Código de descuento').fill('DESC10');
    await carrito.getByRole('button', { name: 'Aplicar' }).click();

    // Mochila: $ 65.000 → el 10 % es $ 6.500
    await expect(carrito.locator('dl > div').filter({ hasText: /^Descuento/ }).locator('dd')).toContainText('6.500');
  });
});
