'use strict';

// Plain-Node unit test (no Meteor) for who authors an inbound reply (#2414):
// server/lib/inboundEmailUserMatch.js, and a source guard over the webhook.
// Run: node tests/inboundEmailUserMatch.test.cjs
//
// ReplyBleed (GHSA-mc7c-cv99-64h7): the author used to be whichever user owned
// the reply's From address - a field the sender controls. The reporter's
// attack is reproduced here as data: a reply to Alice's token with Bob's From
// address must be refused, not become Bob's comment.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { normalizeEmail, senderIsUser, replyAuthorDecision } = require('../server/lib/inboundEmailUserMatch.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const ALICE = { _id: 'alice', emails: [{ address: 'Alice@Example.com' }, { address: 'alice2@example.com' }] };
const BOB = { _id: 'bob', emails: [{ address: 'bob@example.com' }] };
const member = (userId, extra = {}) => ({ userId, isActive: true, ...extra });
const BOARD = { _id: 'board', members: [member('alice'), member('bob')] };
const CARD = { _id: 'card', boardId: 'board', assignees: [] };
const decide = (over = {}) => replyAuthorDecision({ user: ALICE, fromAddress: 'alice@example.com', card: CARD, board: BOARD, ...over });

test('normalizeEmail handles bare and "Name <addr>" forms', () => {
  assert.strictEqual(normalizeEmail('Alice <ALICE@example.com> '), 'alice@example.com');
  assert.strictEqual(normalizeEmail(null), '');
});

test('the recipient replying from any of their own addresses is accepted', () => {
  assert.deepStrictEqual(decide(), { ok: true });
  assert.deepStrictEqual(decide({ fromAddress: 'Alice <ALICE2@EXAMPLE.COM>' }), { ok: true });
});

test('the advisory\'s attack: Alice\'s reply address, Bob\'s From -> refused and logged (negative)', () => {
  const result = decide({ fromAddress: 'bob@example.com' });
  assert.deepStrictEqual([result.ok, result.code, result.log], [false, 403, true]);
});

test('an unknown or empty From is refused and logged (negative)', () => {
  for (const from of ['mallory@evil.example', '', null, undefined]) {
    const result = decide({ fromAddress: from });
    assert.deepStrictEqual([result.ok, result.log], [false, true], String(from));
  }
  assert.strictEqual(senderIsUser('bob@example.com', ALICE), false);
  assert.strictEqual(senderIsUser('bob@example.com', BOB), true);
});

test('a missing or disabled recipient is refused, quietly (negative)', () => {
  assert.deepStrictEqual([decide({ user: null }).ok, decide({ user: null }).log], [false, false]);
  const disabled = decide({ user: { ...ALICE, loginDisabled: true } });
  assert.deepStrictEqual([disabled.ok, disabled.log], [false, false]);
});

test('a recipient who can no longer comment is refused (negative)', () => {
  const board = roles => ({ ...BOARD, members: [member('alice', roles)] });
  assert.strictEqual(decide({ board: { ...BOARD, members: [] } }).ok, false, 'removed from the board');
  assert.strictEqual(decide({ board: { ...BOARD, members: [member('alice', { isActive: false })] } }).ok, false, 'deactivated');
  assert.strictEqual(decide({ board: board({ isNoComments: true }) }).ok, false, 'no-comments role');
  assert.strictEqual(decide({ board: board({ isReadOnly: true }) }).ok, false, 'read-only role');
  assert.strictEqual(decide({ board: board({ isCommentOnly: true }) }).ok, true, 'comment-only may comment');
});

test('an assigned-only member may reply only on cards assigned to them', () => {
  const board = { ...BOARD, members: [member('alice', { isCommentAssignedOnly: true })] };
  assert.strictEqual(decide({ board }).ok, false);
  assert.strictEqual(decide({ board, card: { ...CARD, assignees: ['alice'] } }).ok, true);
});

test('a card whose board is not the one checked is refused (negative)', () => {
  assert.strictEqual(decide({ board: { ...BOARD, _id: 'other' } }).ok, false);
  assert.strictEqual(decide({ board: null }).ok, false);
});

// The fault must not exist anywhere: nothing chooses an author by searching
// users for a From address, and the webhook takes its author from the token.
test('no code picks a comment author from the From address (tree-wide negative)', () => {
  const root = path.join(__dirname, '..');
  const skip = new Set(['node_modules', '.meteor', '.tools', '_build', '.build', '.git', 'tests', 'old-CHANGELOG']);
  const offenders = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name) || entry.name.startsWith('_build')) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(c|m)?js$/.test(entry.name)) {
        const src = fs.readFileSync(file, 'utf8');
        if (/matchSenderToUser/.test(src)) offenders.push(path.relative(root, file));
      }
    }
  })(root);
  assert.deepStrictEqual(offenders, []);
  const route = fs.readFileSync(path.join(root, 'server/routes/inboundEmail.js'), 'utf8');
  assert.ok(/findOneAsync\(verification\.userId/.test(route), 'the author is loaded by the token\'s userId');
  assert.ok(/replyAuthorDecision\(/.test(route), 'the route asks replyAuthorDecision');
  assert.ok(!/getUsers\(/.test(route), 'the route never searches all users');
  assert.ok(/userId: user\._id/.test(route));
  assert.ok(/INBOUND_EMAIL_WEBHOOK_SECRET/.test(route) && /timingSafeEqual/.test(route), 'the provider secret is compared in constant time');
  const queue = fs.readFileSync(path.join(root, 'server/notifications/emailQueue.js'), 'utf8');
  assert.ok(/buildReplyToAddress\(\{ cardId, userId,/.test(queue), 'every reply address names its recipient');
});

console.log(`inboundEmailUserMatch: ${passed} passed`);
