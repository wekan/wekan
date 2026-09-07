'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('People Email has equivalent secret-safe HTML4 operations', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4email${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const secret = `must-not-reach-browser-${suffix}`;
  const domain = `@${suffix}.invalid`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  const originalSetting = db.findOne('settings', {});
  const originalAccount = db.findOne('accountSettings', { _id: 'accounts-allowEmailChange' });
  let admin;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    admin = db.findOne('users', { username });
    db.updateOne('users', { _id: admin._id }, {
      $set: { isAdmin: true, loginDisabled: false, 'profile.language': 'en' },
    });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/people"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/email"] input[type="submit"]').first().click()]);
    await expect(legacy.locator('input[name="mailPassword"]')).toHaveAttribute('type', 'password');
    await expect(legacy.locator('input[name="mailPassword"]')).toHaveValue('');
    await expect(legacy.locator('input[name="legacyOperation"][value="send-smtp-test-email"]'))
      .toHaveCount(1);

    const transport = legacy.locator('form:has(input[name="legacyOperation"][value="save-mail-transport"])');
    await transport.locator('select[name="mailService"]').selectOption('Gmail');
    await transport.locator('input[name="mailUsername"]').fill(`admin-${suffix}@gmail.com`);
    await transport.locator('input[name="mailPassword"]').fill(secret);
    await transport.locator('input[name="mailFrom"]').fill(`WeKan <admin-${suffix}@gmail.com>`);
    await Promise.all([legacy.waitForNavigation(), transport.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('select[name="mailService"]')).toHaveValue('Gmail');
    // No JavaScript can reveal conditional fields after a select change, so
    // SMTP's fields remain available when changing back from another service.
    await expect(legacy.locator('input[name="mailHost"]')).toBeVisible();
    await expect(legacy.locator('input[name="mailPort"]')).toBeVisible();
    await expect(legacy.locator('input[name="mailPassword"]')).toHaveValue('');
    await expect(legacy.locator('body')).not.toContainText(secret);
    await expect.poll(() => db.findOne('settings', {})?.mailServer?.passwords?.Gmail)
      .toBe(secret);

    const access = legacy.locator('form:has(input[name="legacyOperation"][value="save-email-access"])');
    await access.locator('input[name="mailDomainName"]').fill(domain);
    await access.locator('input[name="allowEmailChange"]').check();
    await Promise.all([legacy.waitForNavigation(), access.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('settings', {})?.mailDomainName).toBe(domain);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({ path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-people-email.png`, fullPage: true });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1280, height: 1800 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, admin._id, db.addResumeToken(admin._id));
    await navigateInApp(modern, '/admin/people/email');
    await waitForMeteor(modern);
    await modern.waitForFunction(() => window.Meteor.connection._stores.settings
      ?._getCollection().find().fetch().some(doc => doc.mailServer?.service === 'Gmail'));
    await modern.locator('.js-toggle-admin-mail-settings').click();
    await expect(modern.locator('#mail-service')).toHaveValue('Gmail');
    await expect(modern.locator('#mail-server-username')).toHaveValue(`admin-${suffix}@gmail.com`);
    await expect(modern.locator('#mail-server-password')).toHaveValue('');
    await expect(modern.locator('#mailDomainNamevalue')).toHaveValue(domain);
    await expect(modern.locator('#accounts-allowEmailChange')).toHaveClass(/is-checked/);
    const browserDocument = await modern.evaluate(() => window.Meteor.connection
      ._stores.settings._getCollection().find().fetch().find(doc => doc.mailServer));
    expect(JSON.stringify(browserDocument)).not.toContain(secret);
    await modern.locator('.js-toggle-allow-email-change').click();
    await modern.locator('#mailDomainNamevalue').fill(`${domain}.changed`);
    await modern.locator('button.js-save').click();
    await expect.poll(() => db.findOne('settings', {})?.mailDomainName)
      .toBe(`${domain}.changed`);
    await expect.poll(() => db.findOne('accountSettings', {
      _id: 'accounts-allowEmailChange',
    })?.booleanValue).toBe(false);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-people-email.png`, fullPage: true,
    });

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/people/email`);
    await expect(anonymous.locator('body')).toContainText(/not authorized/i);
    await expect(anonymous.locator('input[name="mailPassword"]')).toHaveCount(0);
  } finally {
    if (originalSetting) db.updateOne('settings', { _id: originalSetting._id }, {
      $set: { mailServer: originalSetting.mailServer,
        mailDomainName: originalSetting.mailDomainName || '' },
    });
    if (originalAccount) db.updateOne('accountSettings', { _id: originalAccount._id }, {
      $set: { booleanValue: originalAccount.booleanValue },
    });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (admin?._id) db.deleteMany('users', { _id: admin._id });
  }
});
