'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
for (const [locale, language, known, unknown, rejected] of [
  ['co', 'Corsican', 'parolla d’intrata sbagliata', 'nome d’utilizatore chì ùn esiste micca', 'Impostazioni'],
  ['la', 'Latin', 'nomen usoris rectum, tessera falsa', 'nomen usoris quod non exstat', 'Latine:'],
]) {
const strings = require(`../../../imports/i18n/data/${locale}.i18n.json`);

test(`${language} lockout settings distinguish wrong passwords from unknown usernames`, async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(code => Meteor.callAsync('setLanguage', code), locale);
  await navigateInApp(page, '/admin/people/locked-users');
  const pane = page.locator('.locked-users-settings');
  await expect(pane.locator('h4')).toHaveText([
    strings['accounts-lockout-known-users'], strings['accounts-lockout-unknown-users'],
  ]);
  await expect(pane).toContainText(known);
  await expect(pane).toContainText(unknown);
  await expect(pane).not.toContainText(rejected);
  await expect(pane.locator('#known-failures-before-lockout')).toBeVisible();
  await expect(pane.locator('#unknown-failures-before-lockout')).toBeVisible();
});
}
