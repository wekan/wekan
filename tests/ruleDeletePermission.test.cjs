'use strict';

// Plain-Node unit test (no Meteor) for the board-rule delete permission helper.
// Run: node tests/ruleDeletePermission.test.cjs
//
// Regression guard for the "deleting a board rule fails with 'Access denied
// [403]'" bug. Deleting a rule used to fire three separate client-side
// Collection.remove() calls (Rules + Triggers + Actions), each gated by a
// per-collection allow() rule that resolved the board from that document's own
// boardId. When a trigger/action document had no resolvable boardId the allow
// rule returned false and Meteor rejected the mutation with 403 "Access denied",
// failing the delete even for a legitimate board admin. Deletion now runs
// through the server method `rules.deleteRule`, which authorizes ONCE with the
// predicate below and removes all three docs server-side. This test pins the
// predicate: board admins (and site admins) may delete; everyone else may not.

const assert = require('assert');
const {
  isActiveBoardAdmin,
  canDeleteBoardRule,
} = require('../models/lib/ruleDeletePermission');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const ADMIN = 'admin-user';
const MEMBER = 'member-user';
const READONLY = 'readonly-user';
const COMMENT = 'comment-user';
const OUTSIDER = 'outsider-user';

// A board mirroring the shape server/models/boards.js stores in `members`.
const board = {
  _id: 'board1',
  members: [
    { userId: ADMIN, isActive: true, isAdmin: true, isNoComments: false, isCommentOnly: false },
    { userId: MEMBER, isActive: true, isAdmin: false, isNoComments: false, isCommentOnly: false },
    { userId: READONLY, isActive: true, isAdmin: false, isReadOnly: true },
    { userId: COMMENT, isActive: true, isAdmin: false, isCommentOnly: true },
  ],
};

// --- board admin: ALLOWED ----------------------------------------------------
test('board admin may delete a rule', () => {
  assert.strictEqual(canDeleteBoardRule(board, ADMIN), true);
  assert.strictEqual(isActiveBoardAdmin(board, ADMIN), true);
});

// --- non-admin members: DENIED ----------------------------------------------
test('a plain (non-admin) board member may NOT delete a rule', () => {
  assert.strictEqual(canDeleteBoardRule(board, MEMBER), false);
});

test('a read-only board member may NOT delete a rule', () => {
  assert.strictEqual(canDeleteBoardRule(board, READONLY), false);
});

test('a comment-only board member may NOT delete a rule', () => {
  assert.strictEqual(canDeleteBoardRule(board, COMMENT), false);
});

// --- non-members: DENIED -----------------------------------------------------
test('a non-member may NOT delete a rule', () => {
  assert.strictEqual(canDeleteBoardRule(board, OUTSIDER), false);
  assert.strictEqual(isActiveBoardAdmin(board, OUTSIDER), false);
});

// --- site admin override -----------------------------------------------------
test('a WeKan site admin may delete a rule even if not a board member', () => {
  assert.strictEqual(canDeleteBoardRule(board, OUTSIDER, { isSiteAdmin: true }), true);
});

// --- inactive admin: DENIED --------------------------------------------------
test('an INACTIVE (removed) board admin may NOT delete a rule', () => {
  const b = { _id: 'b', members: [{ userId: ADMIN, isActive: false, isAdmin: true }] };
  assert.strictEqual(canDeleteBoardRule(b, ADMIN), false);
});

// --- defensive: missing / malformed input -----------------------------------
test('missing board, user or members array denies (fail-closed)', () => {
  assert.strictEqual(canDeleteBoardRule(null, ADMIN), false);
  assert.strictEqual(canDeleteBoardRule(board, undefined), false);
  assert.strictEqual(canDeleteBoardRule({ _id: 'b' }, ADMIN), false);
  // ...but a site admin is still allowed even with a null board.
  assert.strictEqual(canDeleteBoardRule(null, ADMIN, { isSiteAdmin: true }), true);
});

console.log(`\n${passed} passed`);
