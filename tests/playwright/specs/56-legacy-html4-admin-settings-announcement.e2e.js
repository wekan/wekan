'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('Settings Announcement has equivalent admin-only HTML4 writes', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4announce${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const message = `Saavutettava ilmoitus ${suffix}`;
  const legacyContext = await browser.newContext({
    javaScriptEnabled: false,
    locale: 'fi-FI',
  });
  const legacy = await legacyContext.newPage();
  let user;
  let announcement;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([
      legacy.waitForNavigation(),
      legacy.locator('input[type="submit"]').click(),
    ]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, {
      $set: { isAdmin: true, 'profile.language': 'fi' },
    });
    announcement = db.findOne('announcements', {});

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
      legacy.locator('form[action="/admin/settings/announcement"] input[type="submit"]')
        .first().click(),
    ]);
    await expect(legacy.locator('h1')).toContainText('Ilmoitus');

    const bodyForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-announcement-body"])',
    );
    await bodyForm.locator('textarea[name="announcementBody"]').fill(message);
    await Promise.all([
      legacy.waitForNavigation(),
      bodyForm.locator('input[type="submit"]').click(),
    ]);
    const enabledForm = legacy.locator(
      'form:has(input[name="legacyOperation"][value="set-announcement-enabled"])',
    );
    await enabledForm.locator('select[name="enabled"]').selectOption('true');
    await Promise.all([
      legacy.waitForNavigation(),
      enabledForm.locator('input[type="submit"]').click(),
    ]);
    await expect.poll(() => db.findOne('announcements', {})?.body).toBe(message);
    await expect.poll(() => db.findOne('announcements', {})?.enabled).toBe(true);

    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-admin-settings-announcement.png`,
        fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'fi-FI' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/admin/settings/announcement');
    await waitForMeteor(modern);
    await expect(modern.locator('#admin-announcement')).toHaveValue(message);
    await expect(modern.locator('.js-toggle-activemessage .materialCheckBox'))
      .toHaveClass(/is-checked/);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      await modern.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-admin-settings-announcement.png`,
        fullPage: true,
      });
    }

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/settings/announcement`);
    await expect(anonymous.locator('body')).toContainText(
      /Sinulla ei ole oikeutta tarkastella tätä sivua|Not authorized/,
    );
    await expect(anonymous.locator('body')).not.toContainText(message);
  } finally {
    if (announcement?._id) db.updateOne('announcements', { _id: announcement._id }, {
      $set: { enabled: announcement.enabled === true, body: announcement.body || '' },
    });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) db.deleteMany('users', { _id: user._id });
  }
});
