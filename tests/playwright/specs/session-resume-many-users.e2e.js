'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('#6701 restores a session with 1600 LDAP users without publishing the directory', async ({ page, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { authenticationMethod: 'ldap', 'services.ldap': { id: user.id } } });
  const prefix = db.uid('resume-directory-');
  const users = Array.from({ length: 1600 }, (_, i) => ({
    _id: `${prefix}${i}`, username: `${prefix}${i}`,
    authenticationMethod: 'ldap',
    services: { ldap: { id: `${prefix}${i}` } },
    profile: { fullname: `Directory user ${i}` },
    createdAt: new Date(),
  }));
  db.insertMany('users', users);
  try {
    await loginWithToken(page, user.id, user.token);
    const started = Date.now();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => (
      typeof Meteor !== 'undefined' && !Meteor.loggingIn() && Meteor.userId()
    ))).toBe(user.id);
    expect(Date.now() - started).toBeLessThan(15_000);
    expect(await page.evaluate(prefix => Meteor.users.find({ _id: { $regex: `^${prefix}` } }).count(), prefix)).toBe(0);
    // A directory sync while a session is active must not rewind the oplog
    // checkpoint or leave the next resume waiting for already processed writes.
    db.deleteMany('users', { _id: { $in: users.map(u => u._id) } });
    const afterSync = Date.now();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => (
      typeof Meteor !== 'undefined' && !Meteor.loggingIn() && Meteor.userId()
    ))).toBe(user.id);
    expect(Date.now() - afterSync).toBeLessThan(15_000);
    await page.context().clearCookies();
    await page.context().addCookies([{
      name: 'meteor_login_token', value: 'invalid-session-token',
      url: process.env.WEKAN_BASE_URL || 'http://localhost:3000', httpOnly: true,
    }]);
    await page.goto('/sign-in');
    await expect(page.locator('#at-field-username_and_email, #at-field-email, #at-field-username').first()).toBeVisible();
    expect(await page.evaluate(() => Meteor.userId())).toBeNull();
  } finally {
    db.deleteMany('users', { _id: { $in: users.map(u => u._id) } });
  }
});
