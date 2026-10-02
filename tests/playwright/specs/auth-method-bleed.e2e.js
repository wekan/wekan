'use strict';
// AuthMethodBleed (2026-10-02): 'user-authenticationMethod' answered any
// signed-in user with any user's organizations, teams and login method.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

test('a user cannot look up another user\'s organizations and teams', async ({ page, user, user2 }) => {
  db.updateOne('users', { _id: user2.id }, { $set: { orgs: [{ orgId: 'secretOrg', orgDisplayName: 'Secret Org' }], authenticationMethod: 'ldap' } });
  await loginWithToken(page, user.id, user.token);
  const seen = await page.evaluate(async ({ other, self }) => {
    await new Promise(resolve => Meteor.subscribe('user-authenticationMethod', other, { onReady: resolve, onStop: resolve }));
    const otherDoc = Meteor.users.find().fetch().find(u => u.username === other);
    await new Promise(resolve => Meteor.subscribe('user-authenticationMethod', self, { onReady: resolve, onStop: resolve }));
    const selfDoc = Meteor.users.find().fetch().find(u => u.username === self);
    return { otherOrgs: otherDoc && otherDoc.orgs, otherMethod: otherDoc && otherDoc.authenticationMethod, selfSeen: !!selfDoc };
  }, { other: user2.username, self: user.username });
  expect(seen.otherOrgs).toBeUndefined();
  expect(seen.otherMethod).toBeUndefined();
  // The caller's own record still answers (negative).
  expect(seen.selfSeen).toBe(true);
});
