'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const strings = require('../../../imports/i18n/data/co.i18n.json');

test('Corsican lockout settings distinguish wrong passwords from unknown usernames', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/admin/people/locked-users');
  const pane = page.locator('.locked-users-settings');
  await expect(pane.locator('h4')).toHaveText([
    strings['accounts-lockout-known-users'], strings['accounts-lockout-unknown-users'],
  ]);
  await expect(pane).toContainText('parolla d’intrata sbagliata');
  await expect(pane).toContainText('nome d’utilizatore chì ùn esiste micca');
  await expect(pane).not.toContainText('Impostazioni');
  await expect(pane.locator('#known-failures-before-lockout')).toBeVisible();
  await expect(pane.locator('#unknown-failures-before-lockout')).toBeVisible();
});
