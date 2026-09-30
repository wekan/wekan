'use strict';

// Plain-Node unit test (no Meteor) for the reply-by-email token (#2414):
// server/lib/inboundEmailReplyToken.js. Run: node tests/inboundEmailReplyToken.test.cjs
//
// ReplyBleed (GHSA-mc7c-cv99-64h7): the token used to sign only the card, so
// every recipient of a card's notification held the same address, and the
// comment author came from the From field. It now binds the card AND the one
// recipient, and expires. This pins: a token round-trips to that card and
// user; another recipient's token differs; tampering with the card, the user or
// the expiry breaks the MAC; an expired or pre-fix token is refused.

const assert = require('assert');
const {
  buildReplyToLocalPart, buildReplyToAddress, verifyReplyToken, computeReplyMac, replyDays,
} = require('../server/lib/inboundEmailReplyToken.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const SECRET = 'test-secret-do-not-use-in-production';
const CARD = 'abc123CardId4567x';
const ALICE = 'aliceUserId123456';
const BOB = 'bobUserId12345678';
const NOW = new Date('2026-09-30T12:00:00Z');
const DAY = 86400000;
const token = (userId = ALICE, cardId = CARD, now = NOW, days = 30) =>
  buildReplyToLocalPart({ cardId, userId, secret: SECRET, now, days });

test('a token round-trips to its card AND its recipient', () => {
  const local = token();
  assert.ok(local.startsWith('reply+'));
  assert.deepStrictEqual(verifyReplyToken(local, SECRET, NOW), { valid: true, cardId: CARD, userId: ALICE });
});

test('a full address, and a "Name <address>" recipient, verify too', () => {
  const address = buildReplyToAddress({ cardId: CARD, userId: ALICE, secret: SECRET, now: NOW, days: 30, domain: 'reply.example.com' });
  assert.strictEqual(address, `${token()}@reply.example.com`);
  assert.strictEqual(verifyReplyToken(address, SECRET, NOW).userId, ALICE);
  assert.strictEqual(verifyReplyToken(`WeKan <${address}>`, SECRET, NOW).userId, ALICE);
});

test('two Meteor ids fit the 64-character SMTP local-part limit', () => {
  assert.ok(token().length <= 64, `${token().length} characters`);
});

test('recipients of the same card get different addresses (negative)', () => {
  assert.notStrictEqual(token(ALICE), token(BOB));
});

test('swapping the recipient into another user\'s token breaks the MAC (negative)', () => {
  const [card, , expiry, mac] = token(ALICE).slice('reply+'.length).split('.');
  assert.strictEqual(verifyReplyToken(`reply+${card}.${BOB}.${expiry}.${mac}`, SECRET, NOW).reason, 'bad-hmac');
});

test('moving a token to another card breaks the MAC (negative)', () => {
  const [, user, expiry, mac] = token().slice('reply+'.length).split('.');
  assert.strictEqual(verifyReplyToken(`reply+otherCard12345678.${user}.${expiry}.${mac}`, SECRET, NOW).reason, 'bad-hmac');
});

test('extending the expiry breaks the MAC (negative)', () => {
  const [card, user, expiry, mac] = token().slice('reply+'.length).split('.');
  const later = (parseInt(expiry, 36) + 365).toString(36);
  assert.strictEqual(verifyReplyToken(`reply+${card}.${user}.${later}.${mac}`, SECRET, NOW).reason, 'bad-hmac');
});

test('a token is valid through its last day and refused after it', () => {
  const local = token(ALICE, CARD, NOW, 30);
  assert.strictEqual(verifyReplyToken(local, SECRET, new Date(NOW.getTime() + 30 * DAY)).valid, true);
  assert.strictEqual(verifyReplyToken(local, SECRET, new Date(NOW.getTime() + 31 * DAY)).reason, 'expired');
});

test('the pre-fix card-only token is recognized and refused (negative)', () => {
  assert.strictEqual(verifyReplyToken(`reply+${CARD}-0123456789abcdef`, SECRET, NOW).reason, 'legacy-token');
});

test('a wrong secret, a forged MAC and malformed input are refused (negative)', () => {
  assert.strictEqual(verifyReplyToken(token(), 'another-secret', NOW).reason, 'bad-hmac');
  const local = token();
  const forged = local.slice(0, -1) + (local.endsWith('0') ? '1' : '0');
  assert.strictEqual(verifyReplyToken(forged, SECRET, NOW).reason, 'bad-hmac');
  for (const bad of ['not-a-reply-token@x.com', '', null, undefined, 'reply+', 'reply+a.b.c', 'reply+a.b.c.d.e', 42]) {
    assert.strictEqual(verifyReplyToken(bad, SECRET, NOW).valid, false, String(bad));
  }
  assert.strictEqual(verifyReplyToken(local, '', NOW).valid, false);
});

test('nothing is minted without a secret, a recipient or a well-formed id (negative)', () => {
  assert.strictEqual(buildReplyToLocalPart({ cardId: CARD, userId: ALICE, secret: '', now: NOW, days: 30 }), '');
  assert.strictEqual(buildReplyToLocalPart({ cardId: CARD, secret: SECRET, now: NOW, days: 30 }), '');
  assert.strictEqual(buildReplyToLocalPart({ cardId: 'a.b', userId: ALICE, secret: SECRET, now: NOW, days: 30 }), '');
  assert.strictEqual(buildReplyToAddress({ cardId: CARD, userId: ALICE, secret: SECRET, now: NOW, days: 30 }), '');
  assert.strictEqual(computeReplyMac({ cardId: CARD, secret: SECRET, expiry: '1' }), '');
});

test('INBOUND_EMAIL_REPLY_DAYS defaults to 30 and is bounded', () => {
  assert.strictEqual(replyDays({}), 30);
  assert.strictEqual(replyDays({ INBOUND_EMAIL_REPLY_DAYS: '7' }), 7);
  for (const bad of ['0', '366', '1.5', 'x']) assert.throws(() => replyDays({ INBOUND_EMAIL_REPLY_DAYS: bad }));
});

console.log(`inboundEmailReplyToken: ${passed} passed`);
