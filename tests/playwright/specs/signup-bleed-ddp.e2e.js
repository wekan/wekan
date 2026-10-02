'use strict';
// SignupBleed, DDP sibling (2026-10-02): with registration disabled, the
// client's createUser call still created an account when it carried
// from: 'admin' or ldap: true.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { waitForMeteor } = require('../helpers/auth');

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test('with registration disabled, a client cannot sign up by claiming admin or LDAP creation', async ({ page }) => {
  const setting = db.findOne('settings', {});
  db.updateOne('settings', { _id: setting._id }, { $set: { disableRegistration: true } });
  const names = [];
  try {
    await page.goto(`${BASE_URL}/sign-in`);
    await waitForMeteor(page);
    for (const extra of [{ from: 'admin' }, { ldap: true }]) {
      const username = `signupbleed${Date.now()}${Object.keys(extra)[0]}`;
      names.push(username);
      const result = await page.evaluate(async ({ username, extra }) => {
        const { Accounts } = Package['accounts-base'];
        try {
          await Accounts.createUserAsync({ username, email: `${username}@example.com`, password: 'Correct-Horse-1', ...extra });
          return 'created';
        } catch (error) { return error.error || error.message; }
      }, { username, extra });
      expect(result, JSON.stringify(extra)).not.toBe('created');
      expect(db.findOne('users', { username })).toBeNull();
    }
    await expect.poll(() => db.findOne('eventlog', { bleed: 'SignupBleed', source: 'ddp:createUser' })?.count).toBeGreaterThanOrEqual(2);
  } finally {
    db.updateOne('settings', { _id: setting._id }, { $set: { disableRegistration: !!setting.disableRegistration } });
    db.deleteMany('users', { username: { $in: names } });
  }
});
