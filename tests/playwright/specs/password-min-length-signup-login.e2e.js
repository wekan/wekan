'use strict';
// Registering and signing in, with and without PASSWORD_MIN_LENGTH
// (models/lib/passwordPolicy.js, server/passwordChangeRequired.js).
//
//  1. Sign-up through the real form: not enforced (the default) a 7-character
//     password registers - no "Internal server error", which every sign-up
//     answered while the REQUIRE_2FA wrapper broke audit-argument-checks - and
//     with an enforced minimum, a password one character too short is refused
//     and one long enough registers, for two different minimums.
//  2. An account whose password is shorter than a minimum set later: it still
//     signs in, sees only "Change your password", cannot pick another short
//     one, and once it has a long enough one EVERY session is signed out - two
//     browsers - after which the old password no longer signs in, the new one
//     does, and nothing asks again.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, loginWithCredentials, waitForMeteor } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';
const userIdIn = page => page.evaluate(() => (typeof Meteor !== 'undefined' ? Meteor.userId() : null));
const tokensOf = id => (db.findOne('users', { _id: id }).services?.resume?.loginTokens || []).length;
// Failed sign-ins and refused sign-ups count against this address (the
// unknown-user lockout), and every browser test shares it.
const resetLockout = () => db.deleteMany('AccountsLockout.Connections',
  { clientAddress: { $in: ['127.0.0.1', '::1', '::ffff:127.0.0.1'] } });

let setting;
// An ENFORCED minimum; 0 is the default: 8, reported only.
const setMinimum = min => db.updateOne('settings', { _id: setting._id }, min
  ? { $set: { 'loginOptions.passwordMinLength': min, 'loginOptions.passwordMinLengthEnforce': true } }
  : { $unset: { 'loginOptions.passwordMinLength': '', 'loginOptions.passwordMinLengthEnforce': '' } });

test.beforeEach(() => {
  setting = db.findOne('settings', {});
  db.updateOne('settings', { _id: setting._id }, { $set: { disableRegistration: false } });
  resetLockout();
});
test.afterEach(() => {
  db.updateOne('settings', { _id: setting._id }, {
    $set: { disableRegistration: !!setting.disableRegistration, loginOptions: setting.loginOptions || {} },
  });
  resetLockout();
});

async function signUp(browser, username, password, min = 0) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/sign-up`);
  await waitForMeteor(page);
  // The form learns the minimum from the server just after the page loads;
  // a person has not finished typing by then, so wait as they would.
  if (min) {
    await expect.poll(() => page.evaluate(() => AccountsTemplates.getField('password').minLength)).toBe(min);
  }
  await page.locator('#at-field-username').fill(username);
  await page.locator('#at-field-email').fill(`${username}@example.com`);
  await page.locator('#at-field-password').fill(password);
  await page.locator('#at-field-password_again').fill(password);
  await page.locator('#at-btn').click();
  return { context, page };
}

test('sign-up registers when not enforced, and an enforced minimum refuses only a too short password', async ({ browser }) => {
  const names = [];
  const created = name => !!db.findOne('users', { username: name });
  try {
    // No minimum: a 7-character password registers, as it always did.
    const plain = `signup${Date.now()}a`;
    names.push(plain);
    const first = await signUp(browser, plain, 'Seven-7');
    await expect.poll(() => created(plain), { timeout: 20_000 }).toBe(true);
    await expect(first.page.getByText('Internal server error')).toHaveCount(0);
    // Registered AND signed in, with no mail server configured: the
    // verification mail cannot be sent, and that must not stop either.
    if (!process.env.MAIL_URL) {
      const id = db.findOne('users', { username: plain })._id;
      await expect.poll(() => first.page.evaluate(() => Meteor.userId()), { timeout: 20_000 }).toBe(id);
      await expect(first.page).not.toHaveURL(/\/sign-(up|in)/, { timeout: 15_000 });
    }
    await first.context.close();

    for (const min of [10, 14]) {
      setMinimum(min);
      resetLockout();
      // One character too short: refused in the form, nothing is created.
      const short = `signup${Date.now()}s${min}`;
      names.push(short);
      const tooShort = 'x'.repeat(min - 4) + 'A1-';
      expect(tooShort).toHaveLength(min - 1);
      const refused = await signUp(browser, short, tooShort, min);
      // Refused in the browser: give a submit the time it would take to arrive.
      await refused.page.waitForTimeout(2500);
      expect(created(short), `min ${min}: ${min - 1} characters`).toBe(false);
      await expect(refused.page.getByText('Internal server error')).toHaveCount(0);
      await refused.context.close();
      // Exactly long enough: registers.
      const enough = `signup${Date.now()}e${min}`;
      names.push(enough);
      const longEnough = 'y'.repeat(min - 3) + 'B2-';
      expect(longEnough).toHaveLength(min);
      const ok = await signUp(browser, enough, longEnough, min);
      await expect.poll(() => created(enough), { timeout: 20_000 }).toBe(true);
      await expect(ok.page.getByText('Internal server error')).toHaveCount(0);
      await ok.context.close();
    }
  } finally {
    db.deleteMany('users', { username: { $in: names } });
  }
});

test('a password shorter than a later minimum signs in, must be changed, and the change signs every session out', async ({ page, browser, user }) => {
  const SHORT = 'Short-7';
  const TOO_SHORT_NEW = 'Still-short';
  const LONG = 'A-much-longer-password-2026';
  // The seeded user signs in with a token only: an administrator gives it the
  // short password while no minimum is set (setPassword signs it out).
  db.updateOne('users', { _id: user.id }, { $set: { isAdmin: true } });
  await loginWithToken(page, user.id, user.token);
  await page.evaluate(async ({ id, pw }) => Meteor.callAsync('setPassword', pw, id), { id: user.id, pw: SHORT })
    .catch(() => {});
  await expect.poll(() => tokensOf(user.id)).toBe(0);
  setMinimum(12);

  const contextB = await browser.newContext({ baseURL: BASE_URL });
  const pageB = await contextB.newPage();
  try {
    // Signing in is never refused for an existing short password.
    await loginWithCredentials(page, user.username, SHORT);
    await expect.poll(() => userIdIn(page)).toBe(user.id);
    const dialog = page.locator('.password-change-required');
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await expect(dialog).toContainText('12');
    expect(db.findOne('users', { _id: user.id }).passwordChangeRequired).toBe(true);
    // A second browser, signed in the same way, is asked too.
    await loginWithCredentials(pageB, user.username, SHORT);
    await expect(pageB.locator('.password-change-required')).toBeVisible({ timeout: 20_000 });
    expect(tokensOf(user.id)).toBe(2);

    // Another short password is not accepted: still asked, still signed in.
    await dialog.locator('#at-field-current_password').fill(SHORT);
    await dialog.locator('#at-field-password').fill(TOO_SHORT_NEW);
    const again = dialog.locator('#at-field-password_again');
    if (await again.count()) await again.fill(TOO_SHORT_NEW);
    await dialog.locator('#at-btn').click();
    await page.waitForTimeout(1500);
    await expect(dialog).toBeVisible();
    expect(tokensOf(user.id)).toBe(2);

    // A long enough one: every session is signed out, this one too.
    await dialog.locator('#at-field-password').fill(LONG);
    if (await again.count()) await again.fill(LONG);
    await dialog.locator('#at-btn').click();
    await expect.poll(() => tokensOf(user.id), { timeout: 20_000 }).toBe(0);
    await expect.poll(() => userIdIn(page), { timeout: 30_000 }).toBe(null);
    await expect.poll(() => userIdIn(pageB), { timeout: 30_000 }).toBe(null);
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    expect(db.findOne('users', { _id: user.id }).passwordChangeRequired).toBeUndefined();

    // Only the new password signs in now, and nothing asks again.
    resetLockout();
    await expect(loginWithCredentials(pageB, user.username, SHORT)).rejects.toThrow();
    expect(await userIdIn(pageB)).toBe(null);
    resetLockout();
    await loginWithCredentials(page, user.username, LONG);
    await expect.poll(() => userIdIn(page)).toBe(user.id);
    await page.waitForTimeout(1500);
    await expect(page.locator('.password-change-required')).toHaveCount(0);
  } finally {
    await contextB.close();
  }
});

test('negative: not enforced, a short password signs in, is reported and is never asked to change', async ({ page, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { isAdmin: true } });
  await loginWithToken(page, user.id, user.token);
  await page.evaluate(async ({ id }) => Meteor.callAsync('setPassword', 'Short-7', id), { id: user.id }).catch(() => {});
  await expect.poll(() => tokensOf(user.id)).toBe(0);
  setMinimum(0);
  await loginWithCredentials(page, user.username, 'Short-7');
  await expect.poll(() => userIdIn(page)).toBe(user.id);
  await page.waitForTimeout(2000);
  await expect(page.locator('.password-change-required')).toHaveCount(0);
  expect(db.findOne('users', { _id: user.id }).passwordChangeRequired).toBeUndefined();
  await expect.poll(() => db.findOne('shortPasswordLogins', { userId: user.id })?.count).toBe(1);
  db.deleteMany('shortPasswordLogins', { userId: user.id });
});
