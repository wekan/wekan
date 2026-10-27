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
  // Reached in-app, /shortcuts opens keyboardShortcuts as a MODAL over the
  // previous page (config/router.js, previousPath set), so the list is not
  // inside #content - which still holds All Boards. Read the list itself.
  const list = page.locator('.shortcuts-list');
  await expect(list).toContainText('Adde te ipsum chartae praesenti');
  await expect(list).toContainText('Assigna te ipsum chartae praesenti');
  await expect(list).toContainText('Filtra chartas mihi assignatas');
  await expect(list).toContainText('Electio plurium rerum titulos 1-9 addit');
  await expect(list).toContainText('Electio plurium rerum titulos 1-9 removet');
  await expect(list).not.toContainText('Latine: Adde yourself');
});
