'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Latin security settings retain defaults and server enforcement explanations', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  // The URL slug is 'security' (models/lib/adminUrls.js panes.security);
  // 'features-security' is the pane id, not an address.
  await navigateInApp(page, '/admin/problems/security');
  const links = page.locator('li').filter({ has: page.locator('.js-toggle-render-links-as-plain-text') }).last();
  await expect(links).toContainText('Monstra nexus ut textum simplicem');
  await expect(links).toContainText('Optio initio inactiva est');
  await expect(links).toContainText('[label](url)');
  await expect(links).not.toContainText('Latine:');
  const imports = page.locator('li').filter({ has: page.locator('.js-toggle-disable-all-import') }).last();
  await expect(imports).toContainText('serviens quamlibet petitionem importandi recusat');
});
