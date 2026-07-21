'use strict';

// Unit tests for the board-scoped virtual->real member mapping planner
// (models/lib/boardMemberMapPlan.js). This is the security gate for mapping an imported
// VIRTUAL (placeholder) board member to an existing REAL board user from the sidebar:
// it must be usable only by a board (or site) admin, only onto an existing ACTIVE real
// member of the board, and it must NEVER change any role — so it can never escalate.
//
// Run: node tests/boardMemberMapPlan.test.cjs

const assert = require('assert');
const { planBoardMemberMapping } = require('../models/lib/boardMemberMapPlan.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// A board: admin (real), normal member "bob" (real), a virtual placeholder "ph".
const members = [
  { userId: 'admin', isAdmin: true, isActive: true },
  { userId: 'bob', isAdmin: false, isActive: true },
  { userId: 'ph', isAdmin: false, isActive: false },
];
const base = {
  members,
  placeholderId: 'ph',
  targetId: 'bob',
  callerId: 'admin',
  placeholderIsImported: true,
  targetIsImported: false,
  callerIsSiteAdmin: false,
};

console.log('boardMemberMapPlan:');

test('board admin maps a virtual member onto an existing active real member', () => {
  const r = planBoardMemberMapping(base);
  assert.strictEqual(r.ok, true);
  // The placeholder entry is removed; every other entry (incl. the target and its role)
  // is left EXACTLY as it was — no escalation.
  assert.deepStrictEqual(r.newMembers, [
    { userId: 'admin', isAdmin: true, isActive: true },
    { userId: 'bob', isAdmin: false, isActive: true },
  ]);
  const bob = r.newMembers.find(m => m.userId === 'bob');
  assert.strictEqual(bob.isAdmin, false, 'target keeps its own (non-admin) role');
});

test('a non-admin board member cannot map', () => {
  const r = planBoardMemberMapping({ ...base, callerId: 'bob' });
  assert.deepStrictEqual(r, { ok: false, error: 'not-authorized' });
});

test('a site admin who is not a board member may map', () => {
  const r = planBoardMemberMapping({ ...base, callerId: 'someSiteAdmin', callerIsSiteAdmin: true });
  assert.strictEqual(r.ok, true);
});

test('source must be an imported placeholder', () => {
  const r = planBoardMemberMapping({ ...base, placeholderIsImported: false });
  assert.deepStrictEqual(r, { ok: false, error: 'not-a-placeholder' });
});

test('target must be a REAL (non-imported) user', () => {
  const r = planBoardMemberMapping({ ...base, targetIsImported: true });
  assert.deepStrictEqual(r, { ok: false, error: 'target-not-real' });
});

test('target must be an ACTIVE member of this board', () => {
  const inactiveTarget = members.map(m => (m.userId === 'bob' ? { ...m, isActive: false } : m));
  const r = planBoardMemberMapping({ ...base, members: inactiveTarget });
  assert.deepStrictEqual(r, { ok: false, error: 'target-not-board-member' });

  const r2 = planBoardMemberMapping({ ...base, targetId: 'stranger' });
  assert.deepStrictEqual(r2, { ok: false, error: 'target-not-board-member' });
});

test('placeholder must be a member of this board', () => {
  const r = planBoardMemberMapping({ ...base, placeholderId: 'ghost' });
  assert.deepStrictEqual(r, { ok: false, error: 'placeholder-not-member' });
});

test('placeholder and target must differ', () => {
  const r = planBoardMemberMapping({ ...base, targetId: 'ph' });
  assert.deepStrictEqual(r, { ok: false, error: 'bad-map' });
});

test('an inactive board-admin entry does not authorize', () => {
  const inactiveAdmin = [
    { userId: 'admin', isAdmin: true, isActive: false },
    { userId: 'bob', isAdmin: false, isActive: true },
    { userId: 'ph', isAdmin: false, isActive: false },
  ];
  const r = planBoardMemberMapping({ ...base, members: inactiveAdmin });
  assert.deepStrictEqual(r, { ok: false, error: 'not-authorized' });
});

console.log(`\n${passed} tests passed`);
