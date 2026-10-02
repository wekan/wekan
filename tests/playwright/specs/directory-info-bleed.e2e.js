'use strict';
// DirectoryInfoBleed (2026-10-02): the 'setting' publication every visitor
// subscribes to carried Admin Panel -> LDAP's host, bind DN and search filter.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('the sign-in page is not sent the LDAP server details', async ({ page }) => {
  const before = db.findOne('settings', {}, { ldap: 1 });
  db.updateOne('settings', { _id: before._id }, { $set: { 'ldap.host': 'ldap.internal.example', 'ldap.authentificationUserDN': 'cn=admin,dc=example', 'ldap.enabled': false } });
  try {
    await page.goto('/sign-in');
    await page.waitForFunction(() => typeof Meteor !== 'undefined' && Meteor.connection._stores.settings);
    await expect.poll(() => page.evaluate(() => !!Meteor.connection._stores.settings._getCollection().findOne())).toBe(true);
    const ldap = await page.evaluate(() => Meteor.connection._stores.settings._getCollection().findOne().ldap || {});
    expect(ldap.host).toBeUndefined();
    expect(ldap.authentificationUserDN).toBeUndefined();
    // Whether LDAP is on is still public (negative).
    expect(ldap.enabled).toBe(false);
  } finally {
    db.updateOne('settings', { _id: before._id }, before.ldap ? { $set: { ldap: before.ldap } } : { $unset: { ldap: 1 } });
  }
});
