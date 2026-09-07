'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

async function html4Login(browser, baseURL, username, password) {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const page = await context.newPage();
  await page.goto(`${baseURL}/sign-in`);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([page.waitForNavigation(), page.locator('input[type="submit"]').click()]);
  return { context, page };
}

test('member password has equivalent HTML4 and HTML5 views and verifies the old secret', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4password${suffix}`;
  const oldPassword = `Old-${suffix}!`;
  const newPassword = `New-${suffix}!`;
  const output = `${process.cwd()}/../../.tools/html4-member-password`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  const extraContexts = [];
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(oldPassword);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/password"] input[type="submit"]').click()]);

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="change-own-password"])');
    const current = form.locator('input[name="currentPassword"]');
    const next = form.locator('input[name="newPassword"]');
    const again = form.locator('input[name="passwordAgain"]');
    await expect(current).toHaveAttribute('autocomplete', 'current-password');
    await expect(next).toHaveAttribute('autocomplete', 'new-password');
    await expect(again).toHaveAttribute('autocomplete', 'new-password');
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-member-password.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/account/password');
    await waitForMeteor(modern);
    await expect(modern.locator('.js-current-password')).toBeVisible();
    await expect(modern.locator('.js-new-password')).toBeVisible();
    await expect(modern.locator('.js-password-again')).toBeVisible();
    await modern.screenshot({ path: `${output}/html5-member-password.png`, fullPage: true });

    await current.fill('wrong-current-password');
    await next.fill(newPassword);
    await again.fill(newPassword);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText('Invalid username or password');
    const oldStillWorks = await html4Login(browser, baseURL, username, oldPassword);
    extraContexts.push(oldStillWorks.context);
    await expect(oldStillWorks.page.locator('body')).toContainText(username);

    form = legacy.locator('form:has(input[name="legacyOperation"][value="change-own-password"])');
    await form.locator('input[name="currentPassword"]').fill(oldPassword);
    await form.locator('input[name="newPassword"]').fill(newPassword);
    await form.locator('input[name="passwordAgain"]').fill(newPassword);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText('Saved');

    const oldRejected = await html4Login(browser, baseURL, username, oldPassword);
    extraContexts.push(oldRejected.context);
    await expect(oldRejected.page).toHaveURL(/login=failed/);
    const newWorks = await html4Login(browser, baseURL, username, newPassword);
    extraContexts.push(newWorks.context);
    await expect(newWorks.page.locator('body')).toContainText(username);
  } finally {
    for (const context of extraContexts) await context.close();
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) {
      db.deleteMany('legacyHtml4Sessions', { userId: user._id });
      db.deleteMany('eventlog', { userId: user._id });
      db.deleteMany('users', { _id: user._id });
    }
  }
});
