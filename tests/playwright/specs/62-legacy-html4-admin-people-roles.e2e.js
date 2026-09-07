'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

const SETTING_ID = 'inviteToBoardRoles';

test('People Roles has equivalent complete HTML4 operations', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = db.uniqueSuffix();
  const username = `html4roles${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let original;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, {
      $set: { isAdmin: true, loginDisabled: false, 'profile.language': 'en' },
    });
    original = db.findOne('inviteToBoardRolesSettings', { _id: SETTING_ID });

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/people"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/roles"] input[type="submit"]').first().click()]);

    const save = legacy.locator('form:has(input[name="legacyOperation"][value="save-invite-roles"])');
    for (const box of await save.locator('input[name="allowedRoles"]').all()) {
      if (await box.isChecked()) await box.uncheck();
    }
    await save.locator('input[name="allowedRoles"][value="board-admin"]').check();
    await save.locator('input[name="allowedRoles"][value="worker"]').check();
    await Promise.all([legacy.waitForNavigation(), save.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('inviteToBoardRolesSettings', {
      _id: SETTING_ID,
    })?.allowedRoles).toEqual(['board-admin', 'worker']);
    await expect(legacy.locator('body')).toContainText('Assigned only');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-people-roles.png`, fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1280, height: 1800 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/admin/people/roles');
    await waitForMeteor(modern);
    await expect(modern.locator('.js-toggle-role[data-role="worker"] .materialCheckBox'))
      .toHaveClass(/is-checked/);
    await expect(modern.locator('.js-toggle-role[data-role="normal"] .materialCheckBox'))
      .not.toHaveClass(/is-checked/);
    await expect(modern.locator('.table-page-table tr').filter({ hasText: 'Worker' }))
      .toContainText('Yes');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-people-roles.png`, fullPage: true,
    });

    const all = legacy.locator('form:has(input[name="legacyOperation"][value="all-invite-roles"])');
    await Promise.all([legacy.waitForNavigation(), all.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('inviteToBoardRolesSettings', {
      _id: SETTING_ID,
    })?.allowedRoles?.length).toBe(9);
    const clear = legacy.locator('form:has(input[name="legacyOperation"][value="clear-invite-roles"])');
    await Promise.all([legacy.waitForNavigation(), clear.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('inviteToBoardRolesSettings', {
      _id: SETTING_ID,
    })?.allowedRoles).toEqual([]);

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/people/roles`);
    await expect(anonymous.locator('body')).toContainText(/not authorized/i);
    await expect(anonymous.locator('input[name="allowedRoles"]')).toHaveCount(0);
  } finally {
    if (original) {
      db.updateOne('inviteToBoardRolesSettings', { _id: SETTING_ID }, {
        $set: { allowedRoles: original.allowedRoles || [], modifiedAt: new Date() },
      });
    }
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) db.deleteMany('users', { _id: user._id });
  }
});
