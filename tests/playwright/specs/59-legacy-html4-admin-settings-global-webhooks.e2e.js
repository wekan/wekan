'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('Global Webhooks has equivalent secure HTML4 and HTML5 views', async ({
  browser, baseURL,
}) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4hook${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const title = `Webhook ${suffix}`;
  const url = `https://example.com/wekan/${suffix}`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'fi-FI' });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(password);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    db.updateOne('users', { _id: user._id }, {
      $set: { isAdmin: true, loginDisabled: false, 'profile.language': 'fi' },
    });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/version"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/settings/global-webhooks"] input[type="submit"]').first().click()]);

    let create = legacy.locator('form:has(input[name="webhookId"][value=""])').last();
    await create.locator('input[name="title"]').fill(title);
    await create.locator('input[name="url"]').fill(url);
    await create.locator('input[name="token"]').fill('secret-not-rendered');
    await create.locator('select[name="type"]').selectOption('bidirectional-webhooks');
    await Promise.all([legacy.waitForNavigation(), create.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('integrations', { boardId: '_global', title })?.url).toBe(url);
    await expect(legacy.locator('body')).toContainText(title);
    await expect(legacy.locator('body')).not.toContainText('secret-not-rendered');
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({ path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-global-webhooks.png`, fullPage: true });
    }

    modernContext = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 1600 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/admin/settings/global-webhooks');
    await expect(modern.locator('input[name="title"]').first()).toHaveValue(title);
    await expect(modern.locator('input[name="url"]').first()).toHaveValue(url);
    await expect(modern.locator('input[name="token"][value="secret-not-rendered"]')).toHaveCount(0);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-global-webhooks.png`, fullPage: true,
    });

    const blockedTitle = `Blocked ${suffix}`;
    create = legacy.locator('form:has(input[name="webhookId"][value=""])').last();
    await create.locator('input[name="title"]').fill(blockedTitle);
    await create.locator('input[name="url"]').fill('http://127.0.0.1/private');
    await Promise.all([legacy.waitForNavigation(), create.locator('input[type="submit"]').click()]);
    expect(db.findOne('integrations', { boardId: '_global', title: blockedTitle })).toBeNull();

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/settings/global-webhooks`);
    await expect(anonymous.locator('body')).toContainText(/Sinulla ei ole oikeutta|Not authorized/);
    await expect(anonymous.locator('body')).not.toContainText(title);
  } finally {
    db.deleteMany('integrations', { boardId: '_global', title });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) db.deleteMany('users', { _id: user._id });
  }
});
