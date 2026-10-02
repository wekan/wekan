'use strict';
// SignupBleed, DDP sibling (2026-10-02): with registration disabled, the
// sign-up form's ATCreateUserServer call still created an account when it
// carried from: 'admin' or ldap: true.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test('with registration disabled, a client cannot sign up by claiming admin or LDAP creation', async ({ page }) => {
  const setting = db.findOne('settings', {});
  const names = [];
  // Refused sign-ups count as failed logins from this address (the unknown
  // user lockout), and every browser test shares 127.0.0.1: start clean, and
  // leave it clean.
  const resetLockout = () => db.deleteMany('AccountsLockout.Connections', { clientAddress: { $in: ['127.0.0.1', '::1', '::ffff:127.0.0.1'] } });
  // The sign-up form's own method (useraccounts), as an attacker calls it.
  const signUp = (target, username, extra = {}) => target.evaluate(async ({ username, extra }) => {
    try {
      await Meteor.callAsync('ATCreateUserServer', { username, email: `${username}@example.com`,
        password: Package['accounts-base'].Accounts._hashPassword('Correct-Horse-1'), profile: {}, ...extra });
      return 'created';
    } catch (error) { return error.reason || error.error || error.message; }
  }, { username, extra });
  try {
    resetLockout();
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    // With registration enabled, an ordinary sign-up still works (negative):
    // the guard must not break the method it wraps.
    db.updateOne('settings', { _id: setting._id }, { $set: { disableRegistration: false } });
    const ordinary = `signupok${Date.now()}`;
    names.push(ordinary);
    expect(await signUp(page, ordinary)).toBe('created');
    expect(db.findOne('users', { username: ordinary })).toBeTruthy();

    db.updateOne('settings', { _id: setting._id }, { $set: { disableRegistration: true } });
    for (const extra of [{ from: 'admin' }, { ldap: true }]) {
      // A fresh page each time: signing up logs the page in, and Meteor
      // rate-limits sign-ups per connection.
      const fresh = await page.context().newPage();
      await fresh.goto(`${BASE_URL}/sign-in`);
      await waitForMeteor(fresh);
      const username = `signupbleed${Date.now()}${Object.keys(extra)[0]}`;
      names.push(username);
      expect(await signUp(fresh, username, extra), JSON.stringify(extra)).not.toBe('created');
      expect(db.findOne('users', { username })).toBeNull();
      await fresh.close();
    }
    await expect.poll(() => db.findOne('eventlog', { bleed: 'SignupBleed', source: 'ddp:ATCreateUserServer' })?.count).toBeGreaterThanOrEqual(2);
  } finally {
    db.updateOne('settings', { _id: setting._id }, { $set: { disableRegistration: !!setting.disableRegistration } });
    db.deleteMany('users', { username: { $in: names } });
    resetLockout();
  }
});
