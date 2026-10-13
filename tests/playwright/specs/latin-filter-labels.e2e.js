'use strict';
const { test, expect } = require('../fixtures');

test('Latin due-date filters distinguish missing dates from today', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await page.locator('.js-open-filter-view').click();
  const noDate = page.locator('.js-toggle-no-due-date-filter');
  const today = page.locator('.js-toggle-due-today-filter');
  await expect(noDate).toContainText('Sine die debito');
  await expect(today).toContainText('Debitum hodie');
  await expect(today).not.toContainText('Latine:');
  await today.locator('input').check();
  await expect(today.locator('input')).toBeChecked();
  await expect(noDate.locator('input')).not.toBeChecked();
  await noDate.locator('input').check();
  await expect(noDate.locator('input')).toBeChecked();
  await expect(today.locator('input')).not.toBeChecked();
});
