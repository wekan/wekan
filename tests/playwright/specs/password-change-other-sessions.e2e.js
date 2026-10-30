'use strict';
// "Failure to invalidate session on password change": with the same account
// signed in on two browsers, changing the password in one must sign the other
// out - not leave it signed in. Meteor's changePassword removes every login
// token but the one of the session that changed it, and a session whose token
// is gone is closed by the server; the admin's setPassword and a reset remove
// them all. This drives it in two real browser contexts.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, loginWithCredentials } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

const OLD = 'Old-Pass-6842-a';
const NEW = 'New-Pass-6842-b';
const userIdIn = page => page.evaluate(() => (typeof Meteor !== 'undefined' ? Meteor.userId() : null));
const tokensOf = id => (db.findOne('users', { _id: id }).services?.resume?.loginTokens || []).length;

test('changing the password in one browser signs the other one out', async ({ page, browser, user }) => {
  // The seeded user signs in with a token only; give it a password first. The
  // admin method does that and, by default, signs every session out.
  // Only an admin may set a password (the seeded user is not one).
  db.updateOne('users', { _id: user.id }, { $set: { isAdmin: true } });
  await loginWithToken(page, user.id, user.token);
  // Signs every session out, this one too: the call's own answer can be lost.
  await page.evaluate(async ({ id, pw }) => Meteor.callAsync('setPassword', pw, id), { id: user.id, pw: OLD })
    .catch(() => {});
  await expect.poll(() => tokensOf(user.id)).toBe(0);

  // Two browsers, each signed in with the password: two tokens.
  const contextB = await browser.newContext({ baseURL: BASE_URL });
  const pageB = await contextB.newPage();
  try {
    await loginWithCredentials(page, user.username, OLD);
    await loginWithCredentials(pageB, user.username, OLD);
    await expect.poll(() => userIdIn(page)).toBe(user.id);
    await expect.poll(() => userIdIn(pageB)).toBe(user.id);
    expect(tokensOf(user.id)).toBe(2);

    // Browser A: Member Settings -> Change Password, through the form.
    await page.locator('.js-open-header-member-menu').first().click();
    await page.locator('a.js-change-password').click();
    await page.locator('#at-field-current_password').fill(OLD);
    await page.locator('#at-field-password').fill(NEW);
    const again = page.locator('#at-field-password_again');
    if (await again.count()) await again.fill(NEW);
    await page.locator('#at-btn').click();

    // Only A's session is left, and B is signed out - not "updated".
    await expect.poll(() => tokensOf(user.id), { timeout: 20_000 }).toBe(1);
    await expect.poll(() => userIdIn(pageB), { timeout: 30_000 }).toBe(null);
    expect(await userIdIn(page)).toBe(user.id);

    // Negative: B's session - an HttpOnly cookie, which no page script can
    // read - no longer signs it in, not even after a reload.
    await pageB.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await pageB.waitForTimeout(3000);
    expect(await userIdIn(pageB)).toBe(null);
    await expect(pageB).toHaveURL(/\/sign-in/, { timeout: 15_000 });

    // And the new password is the one that works now.
    const contextC = await browser.newContext({ baseURL: BASE_URL });
    const pageC = await contextC.newPage();
    try {
      await loginWithCredentials(pageC, user.username, NEW);
      await expect.poll(() => userIdIn(pageC)).toBe(user.id);
    } finally { await contextC.close(); }
  } finally {
    await contextB.close();
  }
});
