'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('Settings Accessibility has equivalent admin-only HTML4 writes', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4access${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const title = `Saavutettavuus ${suffix}`;
  const content = `Saavutettava sisältö ${suffix}`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'fi-FI' });
  const legacy = await legacyContext.newPage();
  let user;
  let original;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([
      legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, {
      $set: { isAdmin: true, 'profile.language': 'fi' },
    });
    original = db.findOne('accessibilitySettings', {});

    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click(),
    ]);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/version"] input[type="submit"]')
        .first().click(),
    ]);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/accessibility"] input[type="submit"]')
        .first().click(),
    ]);

    const contentForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-accessibility-content"])',
    );
    await contentForm.locator('textarea[name="accessibilityTitle"]').fill(title);
    await contentForm.locator('textarea[name="accessibilityBody"]').fill(content);
    await Promise.all([
      legacy.waitForNavigation(), contentForm.locator('input[type="submit"]').click(),
    ]);
    const enabledForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-accessibility-enabled"])',
    );
    await enabledForm.locator('select[name="enabled"]').selectOption('true');
    await Promise.all([
      legacy.waitForNavigation(), enabledForm.locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('accessibilitySettings', {})?.title).toBe(title);
    await expect.poll(() => db.findOne('accessibilitySettings', {})?.body).toBe(content);
    await expect.poll(() => db.findOne('accessibilitySettings', {})?.enabled).toBe(true);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-settings-accessibility.png`,
        fullPage: true,
      });
    }

    const publicForm = legacy.locator('form[action="/accessibility"]').first();
    await Promise.all([
      legacy.waitForNavigation(), publicForm.locator('input[type="submit"]').click(),
    ]);
    await expect(legacy.locator('h1')).toContainText(title);
    await expect(legacy.locator('tbody')).toContainText(content);

    modernContext = await browser.newContext({ locale: 'fi-FI' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/admin/settings/accessibility');
    await waitForMeteor(modern);
    await expect(modern.locator('#admin-accessibility-title')).toHaveValue(title);
    await expect(modern.locator('#admin-accessibility-content')).toHaveValue(content);
    await expect(modern.locator('.js-toggle-accessibility .materialCheckBox'))
      .toHaveClass(/is-checked/);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-settings-accessibility.png`,
        fullPage: true,
      });
    }

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/settings/accessibility`);
    await expect(anonymous.locator('body')).toContainText(
      /Sinulla ei ole oikeutta tarkastella tätä sivua|Not authorized/,
    );
    await expect(anonymous.locator('body')).not.toContainText(content);
  } finally {
    if (original?._id) db.updateOne('accessibilitySettings', { _id: original._id }, {
      $set: {
        enabled: original.enabled === true,
        title: original.title || '',
        body: original.body || '',
      },
    });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) db.deleteMany('users', { _id: user._id });
  }
});
