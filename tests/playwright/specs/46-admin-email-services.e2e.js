'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test.describe('Admin email services', () => {
  test.use({ storageState: undefined });

  test('admin selects a Nodemailer service without publishing its password', async ({ page, adminUser }) => {
    const setting = db.findOne('settings', { mailServer: { $exists: true } });
    try {
      await loginWithToken(page, adminUser.id, adminUser.token);
      await navigateInApp(page, '/admin/people/email');
      await waitForMeteor(page);
      await page.waitForFunction(() => window.Meteor.connection._stores.settings
        ?._getCollection().find().fetch().some(doc => doc.mailServer));

      await page.locator('.js-toggle-admin-mail-settings').click();
      await expect(page.locator('#mail-service')).toBeVisible();
      await page.locator('#mail-service').selectOption('Gmail');
      await page.locator('#mail-server-username').fill('wekan-test@gmail.com');
      await page.locator('#mail-server-password').fill('browser-must-not-receive-this');
      await page.locator('#mail-server-from').fill('WeKan <wekan-test@gmail.com>');
      await page.locator('.mail-settings-save').click();

      await expect(page.locator('#mail-server-password')).toHaveValue('');
      await waitForMeteor(page);
      await page.waitForFunction(() => {
        const store = window.Meteor.connection._stores.settings;
        return store._getCollection().find().fetch()
          .some(document => document.mailServer?.passwordSet?.Gmail === true);
      });
      const browserDocument = await page.evaluate(() => {
        const store = window.Meteor.connection._stores.settings;
        return store._getCollection().find().fetch()
          .find(document => document.mailServer);
      });
      expect(JSON.stringify(browserDocument)).not.toContain('browser-must-not-receive-this');
      expect(browserDocument.mailServer.passwordSet.Gmail).toBe(true);

      const stored = db.findOne('settings', { _id: setting._id });
      expect(stored.mailServer.passwords.Gmail).toBe('browser-must-not-receive-this');
    } finally {
      await page.evaluate(async () => {
        try {
          await window.Meteor.callAsync('saveAdminMailSettings', {
            enabled: false, service: 'SMTP', configuration: {}, password: '',
          });
        } catch (_error) { /* a pre-login failure changed no transport */ }
      }).catch(() => {});
      db.updateOne('settings', { _id: setting._id }, { $set: { mailServer: setting.mailServer } });
    }
  });

  test('non-admin cannot save mail settings', async ({ page, user }) => {
    await loginWithToken(page, user.id, user.token);
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
        return { error: error.error, reason: error.reason, message: error.message };
      }
    });
    expect(result.error, JSON.stringify(result)).toBe('error-notAuthorized');
  });
});
