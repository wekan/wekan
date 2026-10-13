'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');
const strings = require('../../../imports/i18n/data/co.i18n.json');

test('Corsican passwordless settings retain their email and environment prerequisites', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/admin/people/passwordless');
  const hint = page.getByText(strings['passwordless-hint'], { exact: true });
  await expect(hint).toBeVisible();
  await expect(hint).toContainText('MAIL_URL');
  await expect(hint).toContainText('PASSWORDLESS_ENABLED');
  await expect(hint).not.toContainText('Richiede');
  await expect(page.locator('.js-toggle-passwordless-enabled')).toContainText(strings['passwordless-enabled']);
});
