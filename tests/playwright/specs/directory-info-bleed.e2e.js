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
    // The settings were changed straight in the database just above, and the
    // publication delivers that change a moment later: wait for the public
    // field to arrive, so the private ones are checked on the CHANGED document
    // rather than on the one the page received before the update.
    await expect.poll(() => page.evaluate(() => {
      const doc = Meteor.connection._stores.settings._getCollection().findOne();
      return doc && doc.ldap && doc.ldap.enabled;
    })).toBe(false);
    const ldap = await page.evaluate(() => Meteor.connection._stores.settings._getCollection().findOne().ldap || {});
    expect(ldap.host).toBeUndefined();
    expect(ldap.authentificationUserDN).toBeUndefined();
    // Whether LDAP is on is still public (negative).
    expect(ldap.enabled).toBe(false);
  } finally {
    db.updateOne('settings', { _id: before._id }, before.ldap ? { $set: { ldap: before.ldap } } : { $unset: { ldap: 1 } });
  }
});
