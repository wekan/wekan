'use strict';
const { test, expect } = require('../fixtures');

test('Latin skip link names the main content and retains its target', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  const link = page.locator('a.skip-link');
  await expect(link).toHaveText('Transi ad materiam principalem');
  await expect(link).toHaveAttribute('href', '#content');
  await link.focus();
  await expect(link).toBeVisible();
  await expect(link).not.toContainText('Latine:');
  await expect(page.locator('#content')).toHaveCount(1);
});
