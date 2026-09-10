'use strict';

// Plain-Node unit test (no Meteor) for #2414 reply-by-email's sender-to-user
// matching: server/lib/inboundEmailUserMatch.js.
// Run: node tests/inboundEmailUserMatch.test.cjs
//
// The inbound webhook must NEVER create an anonymous/unauthenticated comment:
// a From address that matches no WeKan user is rejected, not attributed to
// nobody. This pins the matcher in isolation, with a plain array standing in
// for the Users collection.

const assert = require('assert');
const { normalizeEmail, matchSenderToUser } = require('../server/lib/inboundEmailUserMatch.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const USERS = [
  { _id: 'user1', emails: [{ address: 'alice@example.com' }] },
  { _id: 'user2', emails: [{ address: 'Bob@Example.com' }, { address: 'bob2@example.com' }] },
  { _id: 'user3', emails: [] },
];

test('matches a bare address, case-insensitively', () => {
  assert.strictEqual(matchSenderToUser('ALICE@EXAMPLE.COM', USERS)._id, 'user1');
});

test('matches a "Name <addr>" style From header', () => {
  assert.strictEqual(matchSenderToUser('Alice Example <alice@example.com>', USERS)._id, 'user1');
});

test('matches a user with multiple email addresses on any of them', () => {
  assert.strictEqual(matchSenderToUser('bob2@example.com', USERS)._id, 'user2');
});

test('a user email stored mixed-case still matches a lowercase From', () => {
  assert.strictEqual(matchSenderToUser('bob@example.com', USERS)._id, 'user2');
});

test('NEGATIVE: an unknown sender address matches no user (must be rejected, not anonymous)', () => {
  assert.strictEqual(matchSenderToUser('mallory@evil.example', USERS), null);
});

test('NEGATIVE: empty/missing From matches nobody', () => {
  assert.strictEqual(matchSenderToUser('', USERS), null);
  assert.strictEqual(matchSenderToUser(null, USERS), null);
  assert.strictEqual(matchSenderToUser(undefined, USERS), null);
});

test('NEGATIVE: a user with no email addresses can never match', () => {
  assert.strictEqual(matchSenderToUser('user3@example.com', USERS), null);
});

test('normalizeEmail extracts and lowercases the address', () => {
  assert.strictEqual(normalizeEmail('Alice <ALICE@Example.com>'), 'alice@example.com');
  assert.strictEqual(normalizeEmail('  alice@example.com  '), 'alice@example.com');
  assert.strictEqual(normalizeEmail(42), '');
});

console.log(`inboundEmailUserMatch: ${passed} passed`);
