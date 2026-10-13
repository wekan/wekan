'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Latin version page distinguishes allocated, used and peak memory', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/settings/version');
  await expect(page.getByText('Usus memoriae Node: magnitudo tota acervi assignati', { exact: true })).toBeVisible();
  await expect(page.getByText('Usus memoriae Node: memoria re vera adhibita', { exact: true })).toBeVisible();
  await expect(page.getByText('Acervus Node: maxima memoria per malloc assignata', { exact: true })).toBeVisible();
  await expect(page.getByText('Acervus Node: memoria inutilis exemplari bituum superscribitur', { exact: true })).toBeVisible();
});
