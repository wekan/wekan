'use strict';

// Plain-Node unit test (no Meteor) for #2414 reply-by-email's HMAC reply
// token: server/lib/inboundEmailReplyToken.js.
// Run: node tests/inboundEmailReplyToken.test.cjs
//
// The token is the ONLY guard on the unauthenticated inbound-email webhook
// (server/routes/inboundEmail.js), so this pins: a valid token round-trips to
// the right cardId, and a forged/tampered/malformed/wrong-secret token is
// rejected outright (the negative tests).

const assert = require('assert');

const {
  buildReplyToLocalPart,
  buildReplyToAddress,
  verifyReplyToken,
  computeCardReplyHmac,
} = require('../server/lib/inboundEmailReplyToken.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const SECRET = 'test-secret-do-not-use-in-production';
const CARD_ID = 'abc123CardId';

test('a valid token round-trips to the same cardId', () => {
  const local = buildReplyToLocalPart(CARD_ID, SECRET);
  assert.ok(local.startsWith('reply+'));
  const result = verifyReplyToken(local, SECRET);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.cardId, CARD_ID);
});

test('a full address (local@domain) also verifies', () => {
  const address = buildReplyToAddress(CARD_ID, SECRET, 'reply.example.com');
  assert.strictEqual(address, `${buildReplyToLocalPart(CARD_ID, SECRET)}@reply.example.com`);
  const result = verifyReplyToken(address, SECRET);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.cardId, CARD_ID);
});

test('a different cardId produces a different token', () => {
  const t1 = buildReplyToLocalPart('card-one', SECRET);
  const t2 = buildReplyToLocalPart('card-two', SECRET);
  assert.notStrictEqual(t1, t2);
});

// --- negative tests: a forged/tampered token must be rejected ---

test('NEGATIVE: a tampered HMAC is rejected', () => {
  const local = buildReplyToLocalPart(CARD_ID, SECRET);
  const tampered = local.slice(0, -1) + (local.slice(-1) === '0' ? '1' : '0');
  const result = verifyReplyToken(tampered, SECRET);
  assert.strictEqual(result.valid, false);
});

test('NEGATIVE: a token for one cardId cannot be reused for another', () => {
  // Forging by swapping the cardId in an otherwise-valid token, keeping the
  // original (now-mismatched) HMAC - the classic "change the id, keep the
  // signature" forgery attempt.
  const local = buildReplyToLocalPart('card-one', SECRET);
  const mac = local.slice(local.lastIndexOf('-') + 1);
  const forged = `reply+card-two-${mac}`;
  const result = verifyReplyToken(forged, SECRET);
  assert.strictEqual(result.valid, false);
});

test('NEGATIVE: a token verified against the wrong secret is rejected', () => {
  const local = buildReplyToLocalPart(CARD_ID, SECRET);
  const result = verifyReplyToken(local, 'a-completely-different-secret');
  assert.strictEqual(result.valid, false);
});

test('NEGATIVE: a guessed/made-up token (no real HMAC) is rejected', () => {
  const result = verifyReplyToken(`reply+${CARD_ID}-0000000000000000`, SECRET);
  assert.strictEqual(result.valid, false);
});

test('NEGATIVE: malformed input (no prefix, empty, non-string) is rejected', () => {
  assert.strictEqual(verifyReplyToken('not-a-reply-token@x.com', SECRET).valid, false);
  assert.strictEqual(verifyReplyToken('', SECRET).valid, false);
  assert.strictEqual(verifyReplyToken(null, SECRET).valid, false);
  assert.strictEqual(verifyReplyToken(undefined, SECRET).valid, false);
  assert.strictEqual(verifyReplyToken('reply+', SECRET).valid, false);
  assert.strictEqual(verifyReplyToken('reply+noHyphenHere', SECRET).valid, false);
});

test('NEGATIVE: no secret configured never validates (feature stays off)', () => {
  const local = buildReplyToLocalPart(CARD_ID, SECRET);
  assert.strictEqual(verifyReplyToken(local, '').valid, false);
  assert.strictEqual(buildReplyToLocalPart(CARD_ID, ''), '');
  assert.strictEqual(computeCardReplyHmac(CARD_ID, ''), '');
});

console.log(`inboundEmailReplyToken: ${passed} passed`);
