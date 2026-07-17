'use strict';

// Plain-Node unit test (no Meteor) for the invitation-code email rules.
// Run: node tests/invitationCodeEmail.test.cjs
//
// Regression guard for #4043 ("Sometimes user get board invitation by mail
// without invitation code"): recipients received an invitation email whose
// code the sign-up form rejected with "The invitation code doesn't exist".
// Sign-up only accepts { code: <string from the form>, email, valid: true }
// (server/models/users.js onCreateUser), so the sending side
// (server/models/settings.js sendInvitation / sendInvitationEmail) must:
//   - store the invitee email lowercase (Mongo matching is case sensitive);
//   - on RE-INVITE, overwrite a stale/invalid code with a fresh valid one
//     instead of re-mailing a code that can never validate;
//   - refuse (loudly) to send an email for a missing/invalid code;
//   - on SMTP failure, only delete a code created by this very invite — never
//     a pre-existing one whose code was already delivered in an earlier email.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  normalizeInviteEmail,
  hasUsableCode,
  isInvitationCodeSendable,
  buildReinviteModifier,
  shouldRemoveInvitationOnEmailFailure,
} = require('../models/lib/invitationCodeEmail');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Deterministic stand-in for getRandomNum(100000, 999999).
const generateCode = () => 654321;

// Mimic the sign-up lookup selector { code, email, valid: true } from
// server/models/users.js onCreateUser, with Mongo's exact-match semantics
// (strict type and case sensitivity).
function signupLookupMatches(doc, typedCode, typedEmail) {
  return (
    doc.code === typedCode && doc.email === typedEmail && doc.valid === true
  );
}

// --- POSITIVE ----------------------------------------------------------------

test('normalizeInviteEmail lowercases and trims the address', () => {
  assert.strictEqual(
    normalizeInviteEmail('  User@Example.COM \n'),
    'user@example.com',
  );
  assert.strictEqual(normalizeInviteEmail('plain@example.com'), 'plain@example.com');
});

test('a valid pending invitation is sendable', () => {
  assert.strictEqual(
    isInvitationCodeSendable({ code: '123456', valid: true }),
    true,
  );
});

test('a legacy invitation without a valid field is still sendable', () => {
  // Documents predating the `valid` defaultValue must keep working.
  assert.strictEqual(isInvitationCodeSendable({ code: '123456' }), true);
});

test('re-invite of a STILL-VALID invitation keeps its code (earlier email stays usable)', () => {
  const invitation = { _id: 'i1', code: '111111', valid: true, email: 'a@b.c' };
  const modifier = buildReinviteModifier(invitation, ['board1'], generateCode);
  assert.deepStrictEqual(modifier, { $set: { boardsToBeInvited: ['board1'] } });
  // No code/valid churn: the code delivered in the first email still validates.
  assert.strictEqual('code' in modifier.$set, false);
  assert.strictEqual('valid' in modifier.$set, false);
});

test('#4043: re-invite of an INVALIDATED invitation overwrites it with a fresh valid code', () => {
  const invitation = { _id: 'i1', code: '111111', valid: false, email: 'a@b.c' };
  const modifier = buildReinviteModifier(invitation, ['board1', 'board2'], generateCode);
  assert.deepStrictEqual(modifier.$set.boardsToBeInvited, ['board1', 'board2']);
  assert.strictEqual(modifier.$set.code, '654321'); // String, not Number
  assert.strictEqual(typeof modifier.$set.code, 'string');
  assert.strictEqual(modifier.$set.valid, true);

  // The document after the update matches what sign-up will look for.
  const updatedDoc = { ...invitation, ...modifier.$set };
  assert.strictEqual(signupLookupMatches(updatedDoc, '654321', 'a@b.c'), true);
});

test('SMTP failure on a NEW invitation rolls the code back (nothing was ever delivered)', () => {
  assert.strictEqual(
    shouldRemoveInvitationOnEmailFailure({ isNewInvitation: true }),
    true,
  );
});

// --- NEGATIVE ----------------------------------------------------------------

test('normalizeInviteEmail returns "" for non-string input (caller skips it)', () => {
  assert.strictEqual(normalizeInviteEmail(null), '');
  assert.strictEqual(normalizeInviteEmail(undefined), '');
  assert.strictEqual(normalizeInviteEmail(123456), '');
  assert.strictEqual(normalizeInviteEmail({}), '');
});

test('#4043: an invalidated invitation is NOT sendable', () => {
  assert.strictEqual(
    isInvitationCodeSendable({ code: '123456', valid: false }),
    false,
  );
});

test('#4043: a missing/empty/non-string code is NOT sendable', () => {
  assert.strictEqual(isInvitationCodeSendable(null), false);
  assert.strictEqual(isInvitationCodeSendable(undefined), false);
  assert.strictEqual(isInvitationCodeSendable({ valid: true }), false);
  assert.strictEqual(isInvitationCodeSendable({ code: '', valid: true }), false);
  // A Number code can never match the string typed into the sign-up form.
  assert.strictEqual(isInvitationCodeSendable({ code: 123456, valid: true }), false);
  assert.strictEqual(hasUsableCode({ code: 123456 }), false);
});

test('re-invite regenerates when the stored code is a Number or missing', () => {
  for (const invitation of [
    { _id: 'i1', code: 111111, valid: true }, // legacy Number code
    { _id: 'i1', valid: true }, // no code at all
    { _id: 'i1', code: '', valid: true }, // empty code
    null, // no document
  ]) {
    const modifier = buildReinviteModifier(invitation, ['b'], generateCode);
    assert.strictEqual(modifier.$set.code, '654321');
    assert.strictEqual(modifier.$set.valid, true);
  }
});

test('a Number code in the document never matches the sign-up (string) lookup', () => {
  // This is exactly why buildReinviteModifier/hasUsableCode require a string.
  const doc = { code: 123456, email: 'a@b.c', valid: true };
  assert.strictEqual(signupLookupMatches(doc, '123456', 'a@b.c'), false);
});

test('a mixed-case stored email never matches the lowercased sign-up address', () => {
  const doc = { code: '123456', email: 'User@Example.com', valid: true };
  assert.strictEqual(signupLookupMatches(doc, '123456', 'user@example.com'), false);
  // ...which is why sendInvitation must store normalizeInviteEmail(rawEmail).
  const stored = { ...doc, email: normalizeInviteEmail('User@Example.com') };
  assert.strictEqual(signupLookupMatches(stored, '123456', 'user@example.com'), true);
});

test('#4043: SMTP failure on a RE-INVITE must NOT delete the pre-existing code', () => {
  // Deleting it would invalidate the code already delivered in an earlier email.
  assert.strictEqual(
    shouldRemoveInvitationOnEmailFailure({ isNewInvitation: false }),
    false,
  );
  assert.strictEqual(shouldRemoveInvitationOnEmailFailure({}), false);
  assert.strictEqual(shouldRemoveInvitationOnEmailFailure(), false);
});

// --- WIRING ------------------------------------------------------------------
// The helpers only protect #4043 if server/models/settings.js actually uses
// them; guard the wiring so a refactor cannot silently regress.

test('server/models/settings.js is wired to the #4043 helpers', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'models', 'settings.js'),
    'utf8',
  );
  assert.ok(
    src.includes("require('/models/lib/invitationCodeEmail')"),
    'settings.js must require models/lib/invitationCodeEmail',
  );
  assert.ok(
    src.includes('normalizeInviteEmail(rawEmail)'),
    'sendInvitation must normalize the invitee email',
  );
  assert.ok(
    src.includes('buildReinviteModifier(invitation, boards'),
    'the re-invite branch must build its modifier via buildReinviteModifier',
  );
  assert.ok(
    src.includes('isInvitationCodeSendable(icode)'),
    'sendInvitationEmail must guard with isInvitationCodeSendable',
  );
  assert.ok(
    src.includes('shouldRemoveInvitationOnEmailFailure({ isNewInvitation })'),
    'the SMTP-failure rollback must be gated on isNewInvitation',
  );
  assert.ok(
    src.includes("sendInvitationEmail(invitation._id, { isNewInvitation: false })"),
    're-invites must be flagged as pre-existing invitations',
  );
  assert.ok(
    !/catch \(e\) \{\s*await InvitationCodes\.removeAsync\(_id\);/.test(src),
    'the unconditional remove-on-email-failure must not come back',
  );
});

console.log(`\n${passed} tests passed`);
