'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

// Admin Panel / Settings / Privacy and security / Allowed addresses
// (server/adminPanelAddresses.js): a list without the admin's own address is
// warned about before saving and refused by the server, so nothing changes.
test('Admin Panel allowed addresses: a list that would lock the admin out is not saved', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'en'));
  await navigateInApp(page, '/admin/settings/security');
  const pane = page.locator('form.js-admin-panel-addresses');
  await expect(pane).toBeVisible();
  await expect(pane.locator('.js-admin-panel-your-address')).toContainText('Your address now:');
  await expect(page.locator('.js-admin-panel-address-refused')).toHaveCount(0);
  const text = pane.locator('.js-admin-panel-addresses-text');
  await text.fill('203.0.113.0/24');
  await expect(pane.locator('.js-admin-panel-addresses-lockout')).toBeVisible();
  await pane.locator('button[type="submit"]').click();
  await expect(pane.locator('.js-admin-panel-addresses-status')).toContainText('lock you out');
  const config = await page.evaluate(() => Meteor.callAsync('getAdminPanelAllowedAddresses'));
  expect(config.addresses).toEqual([]);
  // Negative: an empty list is always accepted.
  await text.fill('');
  await expect(pane.locator('.js-admin-panel-addresses-lockout')).toHaveCount(0);
});
