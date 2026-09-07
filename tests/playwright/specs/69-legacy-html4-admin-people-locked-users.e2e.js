'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('People Locked Users has equivalent settings and unlock operations', async ({ browser, baseURL }) => {
  test.setTimeout(180_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4lock${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const lockedOne = db.seedUser();
  const lockedTwo = db.seedUser();
  const until = Date.now() + 600_000;
  const state = { lockedUntil: until, byAddress: {
    test1: { unlockTime: until, failedAttempts: 4, lastFailedAttempt: Date.now() },
  } };
  db.updateOne('users', { _id: lockedOne.id }, {
    $set: { 'services.accounts-lockout': state },
  });
  db.updateOne('users', { _id: lockedTwo.id }, {
    $set: { 'services.accounts-lockout': state },
  });
  const ids = ['known-failuresBeforeLockout', 'known-lockoutPeriod', 'known-failureWindow',
    'unknown-failuresBeforeLockout', 'unknown-lockoutPeriod', 'unknown-failureWindow'];
  const originals = Object.fromEntries(ids.map(id => [id, db.findOne('lockoutSettings', { _id: id })]));
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
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
      legacy.locator('form[action="/admin/people/locked-users"] input[type="submit"]').first().click()]);
    await expect(legacy.locator('body')).toContainText(lockedOne.username);
    await expect(legacy.locator('body')).toContainText(lockedTwo.username);

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="save-lockout-settings"])');
    await form.locator('input[name="knownFailuresBeforeLockout"]').fill('5');
    await form.locator('input[name="knownLockoutPeriod"]').fill('70');
    await form.locator('input[name="knownFailureWindow"]').fill('16');
    await form.locator('input[name="unknownFailuresBeforeLockout"]').fill('6');
    await form.locator('input[name="unknownLockoutPeriod"]').fill('80');
    await form.locator('input[name="unknownFailureWindow"]').fill('17');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    expect(db.findOne('lockoutSettings', { _id: 'known-failuresBeforeLockout' }).value).toBe(5);

    form = legacy.locator(`form:has(input[name="legacyOperation"][value="request-unlock-user"]):has(input[name="targetUserId"][value="${lockedOne.id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator(`form:has(input[name="legacyOperation"][value="unlock-user"]):has(input[name="targetUserId"][value="${lockedOne.id}"])`);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    expect(db.findOne('users', { _id: lockedOne.id }).services?.['accounts-lockout']).toBeUndefined();
    await expect(legacy.locator('body')).not.toContainText(lockedOne.username);
    await expect(legacy.locator('body')).toContainText(lockedTwo.username);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({
        path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-people-locked-users.png`,
        fullPage: true,
      });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1600, height: 2400 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, admin._id, db.addResumeToken(admin._id));
    await navigateInApp(modern, '/admin/people/locked-users');
    await waitForMeteor(modern);
    await expect(modern.locator('.locked-users-settings')).toContainText(lockedTwo.username);
    await expect(modern.locator('#known-failures-before-lockout')).toHaveValue('5');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-people-locked-users.png`,
      fullPage: true,
    });

    form = legacy.locator('form:has(input[name="legacyOperation"][value="request-unlock-all"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="unlock-all-users"])');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    expect(db.findOne('users', { _id: lockedTwo.id }).services?.['accounts-lockout']).toBeUndefined();

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/people/locked-users`);
    await expect(anonymous.locator('body')).toContainText(/not authorized/i);
    await expect(anonymous.locator('body')).not.toContainText(lockedTwo.username);
  } finally {
    for (const [id, doc] of Object.entries(originals)) {
      if (doc) db.updateOne('lockoutSettings', { _id: id }, { $set: { value: doc.value } });
    }
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    db.cleanup({ userIds: [lockedOne.id, lockedTwo.id, ...(admin?._id ? [admin._id] : [])] });
  }
});
