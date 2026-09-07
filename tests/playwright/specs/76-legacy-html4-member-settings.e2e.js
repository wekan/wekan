'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('member settings have equivalent bounded HTML4 and HTML5 controls', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4settings${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-member-settings`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Settings-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/settings"] input[type="submit"]').click()]);

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="save-member-settings"])');
    await form.locator('input[name="showDesktopDragHandles"]').check();
    await form.locator('input[name="submitOnEnter"]').check();
    await form.locator('input[name="openManyCardsAtOnce"]').check();
    await form.locator('input[name="rescueCardDescription"]').check();
    await form.locator('input[name="showCardsCountAt"]').fill('42');
    await form.locator('select[name="startDayOfWeek"]').selectOption('2');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile)
      .toMatchObject({ showDesktopDragHandles: true, submitOnEnter: true,
        openManyCardsAtOnce: true, rescueCardDescription: true,
        showCardsCountAt: 42, startDayOfWeek: 2 });
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-member-settings.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/account/settings');
    await waitForMeteor(modern);
    await expect(modern.locator('#show-cards-count-at')).toHaveValue('42');
    await expect(modern.locator('#start-day-of-week')).toHaveValue('2');
    await expect(modern.locator('.js-toggle-submit-on-enter .fa-check')).toBeVisible();
    await expect(modern.locator('.js-toggle-open-many-cards-at-once .fa-check')).toBeVisible();
    await expect(modern.locator('#rescue-card-description')).toHaveClass(/is-checked/);
    await modern.screenshot({ path: `${output}/html5-member-settings.png`, fullPage: true });

    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-member-settings"])');
    await form.locator('input[name="showCardsCountAt"]').fill('100001');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.showCardsCountAt)
      .toBe(42);
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', source: 'memberSettings', userId: user._id,
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
