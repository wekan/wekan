'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('member language has equivalent HTML4 and HTML5 views and rejects unknown tags', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4language${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-member-language`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Language-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/language"] input[type="submit"]').click()]);

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="set-member-language"])');
    await expect(form.locator('select[name="language"] option')).toHaveCount(245);
    await form.locator('select[name="language"]').selectOption('fi');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.language).toBe('fi');
    await expect(legacy.locator('h1')).toContainText('Vaihda kieltä');
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-member-language.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/account/language');
    await waitForMeteor(modern);
    await expect(modern.locator('.pop-over-list li', { hasText: 'Suomi' })).toHaveClass(/active/);
    await modern.screenshot({ path: `${output}/html5-member-language.png`, fullPage: true });

    form = legacy.locator('form:has(input[name="legacyOperation"][value="set-member-language"])');
    await form.locator('select[name="language"]').evaluate(select => {
      const option = document.createElement('option');
      option.value = 'not-a-language';
      option.selected = true;
      select.appendChild(option);
    });
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.language).toBe('fi');
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', source: 'memberLanguage', userId: user._id,
    })).not.toBeNull();
  } finally {
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) {
      db.deleteMany('eventlog', { userId: user._id });
      db.deleteMany('users', { _id: user._id });
    }
  }
});
