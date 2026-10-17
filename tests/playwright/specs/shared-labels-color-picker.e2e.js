'use strict';

// Admin Panel / Settings / Shared labels picks a label's colour with the board
// labels' own picker (labelColorPicker: palette swatches and a custom colour
// wheel), not a dropdown of colour names. Picking and saving stores the colour;
// a custom colour from the wheel is stored as its hex.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('a shared label takes its colour from the board labels\' picker', async ({ page, adminUser }) => {
  const names = [`Picked ${Date.now()}`, `Wheel ${Date.now()}`];
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await page.goto('/admin/settings/labels');
    const row = page.locator('.shared-label-row[data-id="new"]');
    await expect(row.locator('.palette-colors .js-palette-color').first()).toBeVisible({ timeout: 30_000 });
    // No dropdown of colour names any more (negative).
    await expect(page.locator('select.js-shared-label-color')).toHaveCount(0);

    // A palette swatch.
    await row.locator('.js-shared-label-name').fill(names[0]);
    const red = row.locator('.js-palette-color.card-label-red');
    await red.click();
    await expect(red.locator('.fa-check')).toBeVisible();
    await row.locator('.js-shared-label-save').click();
    await expect.poll(() => (db.findOne('sharedLabels', { name: names[0] }) || {}).color, { timeout: 15_000 }).toBe('red');

    // The custom colour wheel.
    const next = page.locator('.shared-label-row[data-id="new"]');
    await next.locator('.js-shared-label-name').fill(names[1]);
    await next.locator('.js-label-color-wheel').evaluate(input => {
      input.value = '#123456';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await next.locator('.js-shared-label-save').click();
    await expect.poll(() => (db.findOne('sharedLabels', { name: names[1] }) || {}).color, { timeout: 15_000 }).toBe('#123456');

    // A saved row shows its colour as the checked swatch. (Blaze sets an input's
    // value as a property, so the row is found by its label preview.)
    const saved = page.locator('.shared-label-row').filter({ has: page.locator('span.card-label', { hasText: names[0] }) });
    await expect(saved.locator('.js-palette-color.card-label-red .fa-check')).toBeVisible();

    // Each swatch is the size it is in an opened card's label popup (54 x 33px,
    // six to a row) and does not stretch with the window.
    for (const width of [1366, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      const box = await saved.locator('.js-palette-color').first().boundingBox();
      expect(Math.round(box.width), `swatch width at ${width}px`).toBe(54);
      expect(Math.round(box.height), `swatch height at ${width}px`).toBe(33);
    }
  } finally {
    db.deleteMany('sharedLabels', { name: { $in: names } });
  }
});
