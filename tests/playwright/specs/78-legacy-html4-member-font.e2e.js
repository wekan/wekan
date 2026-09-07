'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('member font has equivalent guarded HTML4 and HTML5 controls', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const username = `html4font${suffix}`;
  const output = `${process.cwd()}/../../.tools/html4-member-font`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(`${username}@wekan-test.invalid`);
    await legacy.locator('input[name="password"]').fill(`Font-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/font"] input[type="submit"]').click()]);

    let form = legacy.locator('form:has(input[name="legacyOperation"][value="save-member-font"])');
    await form.locator('select[name="font"]').selectOption('DejaVu Sans');
    await form.locator('select[name="size"]').selectOption('large');
    await form.locator('input[name="textColor"]').fill('#654321');
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile)
      .toMatchObject({ uiFont: 'DejaVu Sans', uiFontSize: 'large', uiTextColor: '#654321' });
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-member-font.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/account/font');
    await waitForMeteor(modern);
    await expect(modern.locator('.js-ui-font-btn[data-font="DejaVu Sans"]')).toHaveClass(/active/);
    await expect(modern.locator('.js-ui-font-size-btn[data-size="large"]')).toHaveClass(/active/);
    await expect(modern.locator('.js-ui-text-color')).toHaveValue('#654321');
    await modern.screenshot({ path: `${output}/html5-member-font.png`, fullPage: true });

    form = legacy.locator('form:has(input[name="legacyOperation"][value="save-member-font"])');
    await form.locator('select[name="font"]').evaluate(node => {
      node.insertAdjacentHTML('beforeend', '<option value="url(evil)">evil</option>');
      node.value = 'url(evil)';
    });
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.uiFont)
      .toBe('DejaVu Sans');
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
