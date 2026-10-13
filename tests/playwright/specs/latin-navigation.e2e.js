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

test('Latin shortcut page distinguishes joining and assigning a card', async ({ loggedInPage: page }) => {
  const { navigateInApp } = require('../helpers/auth');
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/shortcuts');
  await expect(page.locator('#content')).toContainText('Adde te ipsum chartae praesenti');
  await expect(page.locator('#content')).toContainText('Assigna te ipsum chartae praesenti');
  await expect(page.locator('#content')).toContainText('Filtra chartas mihi assignatas');
  await expect(page.locator('#content')).toContainText('Electio plurium rerum titulos 1-9 addit');
  await expect(page.locator('#content')).toContainText('Electio plurium rerum titulos 1-9 removet');
  await expect(page.locator('#content')).not.toContainText('Latine: Adde yourself');
});
