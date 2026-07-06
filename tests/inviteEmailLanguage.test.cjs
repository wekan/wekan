'use strict';

// Plain-Node unit test (no Meteor) for the board-invitation email language rule.
// Run: node tests/inviteEmailLanguage.test.cjs
//
// Locks in #5664: a board-invitation email is localised in the EXISTING
// recipient's own profile language, or — when the invitee is a NEW account
// created by the invite — in the INVITER's profile language, defaulting to 'en'
// (en.i18n.json) when no language is set.

const assert = require('assert');
const {
  chooseInviteEmailLanguage,
} = require('../models/lib/inviteEmailLanguage');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE ---------------------------------------------------------------
test('#5664: existing invitee uses their own (recipient) language', () => {
  assert.strictEqual(
    chooseInviteEmailLanguage({
      isNewUser: false,
      inviterLanguage: 'de',
      recipientLanguage: 'fr',
    }),
    'fr',
  );
});

test('#5664: new invitee uses the inviter language', () => {
  assert.strictEqual(
    chooseInviteEmailLanguage({
      isNewUser: true,
      inviterLanguage: 'de',
      recipientLanguage: 'fr', // must be ignored for a new user
    }),
    'de',
  );
});

// --- NEGATIVE / defaults ----------------------------------------------------
test('existing invitee with no language defaults to en (en.i18n.json)', () => {
  assert.strictEqual(
    chooseInviteEmailLanguage({ isNewUser: false, inviterLanguage: 'de', recipientLanguage: undefined }),
    'en',
  );
  assert.strictEqual(
    chooseInviteEmailLanguage({ isNewUser: false, inviterLanguage: 'de', recipientLanguage: '' }),
    'en',
  );
});

test('new invitee with an inviter that has no language defaults to en', () => {
  assert.strictEqual(
    chooseInviteEmailLanguage({ isNewUser: true, inviterLanguage: undefined, recipientLanguage: 'fr' }),
    'en',
  );
});

test('direction guard: an existing invitee never uses the inviter language', () => {
  // Recipient has no language, inviter is German — must still be en, NOT de.
  assert.strictEqual(
    chooseInviteEmailLanguage({ isNewUser: false, inviterLanguage: 'de', recipientLanguage: null }),
    'en',
  );
});

test('direction guard: a new invitee never uses the (blank) recipient language', () => {
  // New account has no real preference; the inviter language wins over recipient.
  assert.strictEqual(
    chooseInviteEmailLanguage({ isNewUser: true, inviterLanguage: 'es', recipientLanguage: 'zz' }),
    'es',
  );
});

test('missing / empty arguments fall back to en without throwing', () => {
  assert.strictEqual(chooseInviteEmailLanguage(), 'en');
  assert.strictEqual(chooseInviteEmailLanguage({}), 'en');
});

console.log(`\n${passed} tests passed`);
