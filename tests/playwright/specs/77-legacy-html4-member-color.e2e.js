'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('member theme has equivalent guarded HTML4 and HTML5 controls', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4color${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-member-color`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Color-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/color"] input[type="submit"]').click()]);

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="save-member-theme"])');
    await form.locator('select[name="color"]').selectOption('belize');
    await form.locator('input[name="customColor1"]').fill('#123456');
    await form.locator('input[name="allBoardsThemeTiles"]').check();
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile)
      .toMatchObject({ globalThemeColor: 'belize', globalThemeCustomColors: ['#123456'],
        allBoardsThemeTiles: true });
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-member-color.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/account/color');
    await waitForMeteor(modern);
    await expect(modern.locator('.js-select-theme[data-color="belize"] .fa-check')).toBeVisible();
    await expect(modern.locator('.js-theme-wheel').first()).toHaveValue('#123456');
    await expect(modern.locator('.js-theme-all-boards .fa-check')).toBeVisible();
    await modern.screenshot({ path: `${output}/html5-member-color.png`, fullPage: true });

    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-member-theme"])');
    await form.locator('select[name="color"]').evaluate(node => {
      node.insertAdjacentHTML('beforeend', '<option value="evil-theme">evil</option>');
      node.value = 'evil-theme';
    });
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.globalThemeColor)
      .toBe('belize');
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', source: 'memberAppearance', userId: user._id,
    })).not.toBeNull();
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) {
      db.deleteMany('eventlog', { userId: user._id });
      db.deleteMany('legacyHtml4Sessions', { userId: user._id });
      db.deleteMany('users', { _id: user._id });
    }
  }
});
