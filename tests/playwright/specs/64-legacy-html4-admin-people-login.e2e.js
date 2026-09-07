'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('People Login has equivalent complete HTML4 operations', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const suffix = db.uniqueSuffix();
  const username = `html4login${suffix}`;
  const password = `Legacy-${suffix}-Pass!`;
  const oidcText = `HTML4 OIDC ${suffix}`;
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  const originalSetting = db.findOne('settings', {});
  const originalUsername = db.findOne('accountSettings', {
    _id: 'accounts-allowUserNameChange',
  });
  const originalDelete = db.findOne('accountSettings', { _id: 'accounts-allowUserDelete' });
  let admin;
  let board;
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
    board = db.seedBoard({ ownerId: admin._id, title: `Invite Board ${suffix}` });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/people"] input[type="submit"]').first().click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/admin/people/login"] input[type="submit"]').first().click()]);
    await expect(legacy.locator('input[name="loginAllowKey"]')).toHaveCount(5);

    async function setAllow(key, wanted) {
      const form = legacy.locator(`form:has(input[name="loginAllowKey"][value="${key}"])`);
      const target = await form.locator('input[name="allowed"]').inputValue();
      if ((target === 'true') === wanted) {
        await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
      }
    }
    await setAllow('forgotPassword', false);
    await setAllow('registration', false);
    await setAllow('usernameChange', true);
    await setAllow('userDelete', true);
    await setAllow('displayAuthenticationMethod', false);
    await expect(legacy.locator('textarea[name="invitationEmails"]')).toHaveCount(1);
    await expect(legacy.locator(`input[name="invitationBoards"][value="${board.boardId}"]`))
      .toHaveCount(1);
    const invitation = legacy.locator('form:has(textarea[name="invitationEmails"])');
    await Promise.all([legacy.waitForNavigation(), invitation.locator('input[type="submit"]').click()]);
    await expect(legacy.locator('body')).toContainText('Done');

    const identity = legacy.locator('form:has(input[name="legacyOperation"][value="save-login-identity"])');
    await identity.locator('select[name="defaultAuthenticationMethod"]').selectOption('password');
    await identity.locator('input[name="oidcBtnText"]').fill(oidcText);
    await Promise.all([legacy.waitForNavigation(), identity.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('settings', {})?.oidcBtnText).toBe(oidcText);
    await expect.poll(() => db.findOne('accountSettings', {
      _id: 'accounts-allowUserNameChange',
    })?.booleanValue).toBe(true);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) {
      fs.mkdirSync(process.env.WEKAN_HTML4_SCREENSHOTS, { recursive: true });
      await legacy.screenshot({ path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html4-people-login.png`, fullPage: true });
    }

    modernContext = await browser.newContext({ locale: 'en-US',
      viewport: { width: 1280, height: 1800 } });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, admin._id, db.addResumeToken(admin._id));
    await navigateInApp(modern, '/admin/people/login');
    await waitForMeteor(modern);
    await expect(modern.locator('.js-toggle-forgot-password .materialCheckBox'))
      .not.toHaveClass(/is-checked/);
    await expect(modern.locator('.js-toggle-registration .materialCheckBox'))
      .not.toHaveClass(/is-checked/);
    await expect(modern.locator('.js-toggle-username-change .materialCheckBox'))
      .toHaveClass(/is-checked/);
    await expect(modern.locator('#defaultAuthenticationMethod')).toHaveValue('password');
    await expect(modern.locator('#oidcBtnTextvalue')).toHaveValue(oidcText);
    await expect(modern.locator('.invite-people')).toBeVisible();
    await expect(modern.locator('.js-toggle-board-choose', {
      hasText: `Invite Board ${suffix}`,
    })).toBeVisible();
    await modern.locator('.js-toggle-username-change').click();
    await expect.poll(() => db.findOne('accountSettings', {
      _id: 'accounts-allowUserNameChange',
    })?.booleanValue).toBe(false);
    await expect(modern.locator('.js-toggle-username-change .materialCheckBox'))
      .not.toHaveClass(/is-checked/);
    if (process.env.WEKAN_HTML4_SCREENSHOTS) await modern.screenshot({
      path: `${process.env.WEKAN_HTML4_SCREENSHOTS}/html5-people-login.png`, fullPage: true,
    });

    const anonymous = await legacyContext.newPage();
    await anonymous.goto(`${baseURL}/admin/people/login`);
    await expect(anonymous.locator('body')).toContainText(/not authorized/i);
    await expect(anonymous.locator('input[name="loginAllowKey"]')).toHaveCount(0);
  } finally {
    if (originalSetting) db.updateOne('settings', { _id: originalSetting._id }, {
      $set: { disableForgotPassword: originalSetting.disableForgotPassword,
        disableRegistration: originalSetting.disableRegistration,
        displayAuthenticationMethod: originalSetting.displayAuthenticationMethod,
        defaultAuthenticationMethod: originalSetting.defaultAuthenticationMethod,
        oidcBtnText: originalSetting.oidcBtnText || '' },
    });
    if (originalUsername) db.updateOne('accountSettings', { _id: originalUsername._id }, {
      $set: { booleanValue: originalUsername.booleanValue },
    });
    if (originalDelete) db.updateOne('accountSettings', { _id: originalDelete._id }, {
      $set: { booleanValue: originalDelete.booleanValue },
    });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (admin?._id) db.deleteMany('users', { _id: admin._id });
    if (board?.boardId) db.cleanup({ boardIds: [board.boardId] });
  }
});
