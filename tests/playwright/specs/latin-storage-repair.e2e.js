'use strict';
const { test, expect } = require('../fixtures');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Latin storage settings explain repair and the default destination', async ({ page, adminUser }) => {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await navigateInApp(page, '/admin/attachments/move');
  const repair = page.locator('.move-repair-section');
  await expect(repair.locator('h4')).toHaveText('Corrige locos fasciculorum');
  await expect(repair.locator('.description')).toContainText('verum locum indicet');
  await expect(repair).not.toContainText('Latine:');
  await expect(repair.locator('button')).toHaveText('Corrige locos fasciculorum');
  await navigateInApp(page, '/admin/attachments/default-save-storage');
  await expect(page.locator('#attachment-default-storage-setting .description')).toHaveText('Elige repositorium in quo adiuncta nuper immissa serventur.');
  await expect(page.locator('.js-default-save-storage')).toBeVisible();
});
