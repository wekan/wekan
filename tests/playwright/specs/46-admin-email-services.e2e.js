'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test.describe('Admin email services', () => {
  test.use({ storageState: undefined });

  test('admin selects a Nodemailer service without publishing its password', async ({ page, adminUser }) => {
    const setting = db.findOne('settings', {});
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/people/email');

    await page.locator('.js-toggle-admin-mail-settings').click();
    await page.locator('#mail-service').selectOption('Gmail');
    await page.locator('#mail-server-username').fill('wekan-test@gmail.com');
    await page.locator('#mail-server-password').fill('browser-must-not-receive-this');
    await page.locator('#mail-server-from').fill('WeKan <wekan-test@gmail.com>');
    await page.locator('.mail-settings-save').click();

    await expect(page.locator('#mail-server-password')).toHaveValue('');
    await waitForMeteor(page);
    const browserDocument = await page.evaluate(() => {
      const store = window.Meteor.connection._stores.settings;
      return store._getCollection().findOne();
    });
    expect(JSON.stringify(browserDocument)).not.toContain('browser-must-not-receive-this');
    expect(browserDocument.mailServer.passwordSet.Gmail).toBe(true);

    const stored = db.findOne('settings', { _id: setting._id });
    expect(stored.mailServer.passwords.Gmail).toBe('browser-must-not-receive-this');
    db.updateOne('settings', { _id: setting._id }, { $set: { mailServer: setting.mailServer } });
  });

  test('non-admin cannot save mail settings', async ({ page, user }) => {
    await loginWithToken(page, user.id, user.token);
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForMeteor(page);
    const result = await page.evaluate(async () => {
      try {
        await window.Meteor.callAsync('saveAdminMailSettings', {
          enabled: true,
          service: 'Gmail',
          configuration: { username: 'attacker', from: 'attacker@example.com' },
          password: 'attacker',
        });
        return 'allowed';
      } catch (error) {
        return error.error;
      }
    });
    expect(result).toBe('error-notAuthorized');
  });
});
