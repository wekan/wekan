'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp, waitForMeteor } = require('../helpers/auth');

test('member profile has one shared HTML4 and HTML5 write boundary', async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const suffix = db.uniqueSuffix();
  const username = `html4profile${suffix}`;
  const changedUsername = `html4profilechanged${suffix}`;
  const email = `${username}@wekan-test.invalid`;
  const changedEmail = `${changedUsername}@wekan-test.invalid`;
  const output = `${process.cwd()}/../../.tools/html4-member-profile`;
  const usernameSetting = db.findOne('accountSettings', { _id: 'accounts-allowUserNameChange' });
  const emailSetting = db.findOne('accountSettings', { _id: 'accounts-allowEmailChange' });
  const legacyContext = await browser.newContext({ javaScriptEnabled: false, locale: 'en-US' });
  const legacy = await legacyContext.newPage();
  let user;
  let modernContext;
  try {
    db.updateOne('accountSettings', { _id: 'accounts-allowUserNameChange' },
      { $set: { booleanValue: true } });
    db.updateOne('accountSettings', { _id: 'accounts-allowEmailChange' },
      { $set: { booleanValue: true } });
    await legacy.goto(`${baseURL}/sign-up`);
    await legacy.locator('input[name="username"]').fill(username);
    await legacy.locator('input[name="email"]').fill(email);
    await legacy.locator('input[name="password"]').fill(`Profile-${suffix}!`);
    await Promise.all([legacy.waitForNavigation(), legacy.locator('input[type="submit"]').click()]);
    user = db.findOne('users', { username });

    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/allboards"] input[type="submit"]').click()]);
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/profile"] input[type="submit"]').click()]);
    let form = legacy.locator('form:has(input[name="legacyOperation"][value="update-own-profile"])');
    await expect(form.locator('input[name="fullname"]')).toBeVisible();
    await expect(form.locator('input[name="username"]')).toBeVisible();
    await expect(form.locator('input[name="initials"]')).toBeVisible();
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await form.locator('input[name="fullname"]').fill(`HTML4 Profile ${suffix}`);
    await form.locator('input[name="username"]').fill(changedUsername);
    await form.locator('input[name="initials"]').fill('HP');
    await form.locator('input[name="email"]').fill(changedEmail);
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.username)
      .toBe(changedUsername);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.emails?.[0])
      .toEqual({ address: changedEmail, verified: false });
    await expect.poll(() => db.findOne('users', { _id: user._id })?.profile?.fullname)
      .toBe(`HTML4 Profile ${suffix}`);
    fs.mkdirSync(output, { recursive: true });
    await legacy.screenshot({ path: `${output}/html4-member-profile.png`, fullPage: true });

    modernContext = await browser.newContext({ locale: 'en-US' });
    const modern = await modernContext.newPage();
    await loginWithToken(modern, user._id, db.addResumeToken(user._id));
    await navigateInApp(modern, '/account/profile');
    await waitForMeteor(modern);
    await expect(modern.locator('.js-profile-fullname')).toHaveValue(`HTML4 Profile ${suffix}`);
    await expect(modern.locator('.js-profile-username')).toHaveValue(changedUsername);
    await expect(modern.locator('.js-profile-email')).toHaveValue(changedEmail);
    await modern.screenshot({ path: `${output}/html5-member-profile.png`, fullPage: true });

    // A signed form is still untrusted: changing a policy-disabled hidden identity
    // value must neither write it nor silently ignore the attempted bypass.
    db.updateOne('accountSettings', { _id: 'accounts-allowUserNameChange' },
      { $set: { booleanValue: false } });
    db.updateOne('accountSettings', { _id: 'accounts-allowEmailChange' },
      { $set: { booleanValue: false } });
    await Promise.all([legacy.waitForNavigation(),
      legacy.locator('form[action="/account/profile"] input[type="submit"]').first().click()]);
    form = legacy.locator('form:has(input[name="legacyOperation"][value="update-own-profile"])');
    await form.locator('input[name="username"]').evaluate(node => {
      node.value = 'forged-disabled-identity';
    });
    await Promise.all([legacy.waitForNavigation(), form.locator('input[type="submit"]').click()]);
    await expect.poll(() => db.findOne('users', { _id: user._id })?.username)
      .toBe(changedUsername);
    await expect.poll(() => db.findOne('eventlog', {
      stream: 'security', source: 'memberProfile', userId: user._id,
    })).not.toBeNull();
  } finally {
    if (usernameSetting) db.updateOne('accountSettings', { _id: usernameSetting._id },
      { $set: { booleanValue: usernameSetting.booleanValue } });
    if (emailSetting) db.updateOne('accountSettings', { _id: emailSetting._id },
      { $set: { booleanValue: emailSetting.booleanValue } });
    if (modernContext) await modernContext.close();
    await legacyContext.close();
    if (user?._id) {
      db.deleteMany('eventlog', { userId: user._id });
      db.deleteMany('users', { _id: user._id });
    }
  }
});
