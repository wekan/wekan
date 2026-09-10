'use strict';
(async () => {

// Plain-Node unit test (no Meteor) for #2731: anonymize a user account as a
// GDPR-friendlier alternative to full deletion. Covers the pure decision and
// update-shape logic in models/lib/userAnonymization.js, which
// server/models/users.js's anonymizeUser Meteor method drives.
//
// The key contrast with removeUser (tests/userDeletionCleanup.test.cjs):
// anonymizeUser must NEVER prune or touch board/card/comment references to
// the userId - only the Users document's own PII fields change. That is
// asserted here as a negative test against buildAnonymizeUpdate's shape (it
// touches no board/card/list/comment field at all) and, in
// tests/userDeletionCleanup.test.cjs, buildUserDeletionCleanupPlan is the
// ONLY place those references are pruned - anonymizeUser never calls it.

const assert = require('assert');
const { decideAnonymize, buildAnonymizeUpdate } = require('../models/lib/userAnonymization.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const SELF = 'user1';
const OTHER = 'user2';
const ADMIN = 'admin1';

test('self-service: an account owner may anonymize themselves', () => {
  const decision = decideAnonymize({
    currentUserId: SELF,
    currentUser: { _id: SELF, isAdmin: false },
    targetUserId: SELF,
    targetUser: { _id: SELF, isAdmin: false },
    adminsCount: undefined,
  });
  assert.deepStrictEqual(decision, { allowed: true, isSelf: true });
});

test('admin-triggered: an admin may anonymize another user', () => {
  const decision = decideAnonymize({
    currentUserId: ADMIN,
    currentUser: { _id: ADMIN, isAdmin: true },
    targetUserId: OTHER,
    targetUser: { _id: OTHER, isAdmin: false },
    adminsCount: 2,
  });
  assert.deepStrictEqual(decision, { allowed: true, isSelf: false });
});

test('negative: a non-admin cannot anonymize another user', () => {
  const decision = decideAnonymize({
    currentUserId: SELF,
    currentUser: { _id: SELF, isAdmin: false },
    targetUserId: OTHER,
    targetUser: { _id: OTHER, isAdmin: false },
    adminsCount: undefined,
  });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.error, 'not-authorized');
});

test('negative: the last administrator cannot be anonymized by another admin', () => {
  const decision = decideAnonymize({
    currentUserId: ADMIN,
    currentUser: { _id: ADMIN, isAdmin: true },
    targetUserId: OTHER,
    targetUser: { _id: OTHER, isAdmin: true },
    adminsCount: 1,
  });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.reason, 'Cannot anonymize the last administrator');
});

test('negative: a logged-out caller is refused', () => {
  const decision = decideAnonymize({
    currentUserId: undefined,
    currentUser: null,
    targetUserId: OTHER,
    targetUser: { _id: OTHER },
    adminsCount: undefined,
  });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.error, 'not-authorized');
});

test('negative: an unknown target user is refused', () => {
  const decision = decideAnonymize({
    currentUserId: ADMIN,
    currentUser: { _id: ADMIN, isAdmin: true },
    targetUserId: 'ghost',
    targetUser: null,
    adminsCount: 1,
  });
  assert.strictEqual(decision.allowed, false);
  assert.strictEqual(decision.error, 'user-not-found');
});

test('buildAnonymizeUpdate scrubs PII fields and sets the login-disabled flag', () => {
  const update = buildAnonymizeUpdate('deleted-user-abc123');
  assert.strictEqual(update.$set.username, 'deleted-user-abc123');
  assert.strictEqual(update.$set['profile.fullname'], 'deleted-user-abc123');
  assert.strictEqual(update.$set['profile.avatarUrl'], '');
  assert.deepStrictEqual(update.$set.emails, [
    { address: 'deleted-user-abc123@anonymized.invalid', verified: false },
  ]);
  assert.strictEqual(update.$set.loginDisabled, true);
  assert.strictEqual(update.$set.anonymized, true);
  assert.ok(update.$set.anonymizedAt instanceof Date);
  assert.strictEqual(update.$set['services.resume.loginTokens'], '');
  assert.strictEqual(update.$unset['services.password'], '');
});

test('negative: buildAnonymizeUpdate never touches a board/card/comment field', () => {
  // The whole point of anonymizeUser vs removeUser is that references are left
  // alone. buildAnonymizeUpdate's modifier is the entire write anonymizeUser
  // issues (a single Users.updateAsync(targetUserId, ...)); assert its $set/
  // $unset paths are all Users-document-only fields, never touching a
  // collection- or reference-shaped path such as "members", "assignees",
  // "watchers", "boardId" or "cardId".
  const update = buildAnonymizeUpdate('deleted-user-xyz789');
  const touchedPaths = [
    ...Object.keys(update.$set),
    ...Object.keys(update.$unset),
  ];
  const referenceShapedPattern = /members|assignees|requesters|assigners|watchers|boardId|cardId|swimlaneId|listId/i;
  touchedPaths.forEach(p => {
    assert.ok(!referenceShapedPattern.test(p), `unexpected reference-shaped path touched: ${p}`);
  });
});

test('buildAnonymizeUpdate rejects an empty placeholder', () => {
  assert.throws(() => buildAnonymizeUpdate(''), /non-empty placeholder/);
  assert.throws(() => buildAnonymizeUpdate(undefined), /non-empty placeholder/);
});

test('an anonymized user cannot log in afterward', () => {
  // Mirrors server/authentication.js's Accounts.validateLoginAttempt guard
  // (`return !user.loginDisabled;`) exactly, so this pins the same predicate
  // that actually gates login against the field anonymizeUser sets.
  const validateLoginAttempt = options => !options.user.loginDisabled;

  const update = buildAnonymizeUpdate('deleted-user-loginblock');
  const anonymizedUser = { _id: OTHER, loginDisabled: update.$set.loginDisabled };
  assert.strictEqual(validateLoginAttempt({ user: anonymizedUser }), false);

  const normalUser = { _id: OTHER, loginDisabled: false };
  assert.strictEqual(validateLoginAttempt({ user: normalUser }), true);
});

console.log(`\n${passed} tests passed.`);

})().catch(e => { console.error(e); process.exit(1); });
