'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('Organizations header changes persisted flags; invalid fields and non-admin writes are refused', async ({ page, adminUser, user }) => {
  const id = db.uid('auditOrg');
  db.insertOne('org', { _id: id, orgDisplayName: id, orgShortName: id, orgIsActive: true });
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/people/organizations');
    for (const field of ['orgSharedTemplates', 'orgSyncMembersFromAuth', 'orgPropagateMembersToBoards']) {
      for (const value of [true, false]) {
        await page.locator(`.js-org-feature-all[data-feature="${field}"][data-value="${value}"]`).click();
        await expect.poll(() => db.findOne('org', { _id: id })[field]).toBe(value);
      }
    }
    const denied = field => page.evaluate(async field => {
      try { await Meteor.callAsync('setAllOrgsFeature', field, true); return 'allowed'; }
      catch (error) { return error.error; }
    }, field);
    expect(await denied('orgIsActive')).toBe('invalid-field');
    await loginWithToken(page, user.id, user.token);
    expect(await denied('orgSharedTemplates')).toBe('not-authorized');
    expect(db.findOne('org', { _id: id }).orgSharedTemplates).toBe(false);
  } finally { db.deleteMany('org', { _id: id }); }
});
