'use strict';

// Unit tests for the board-scoped virtual->real member mapping planner
// (models/lib/boardMemberMapPlan.js). This is the security gate for mapping an imported
// VIRTUAL (placeholder) board member to a REAL user from the sidebar: it must be usable
// only by a board (or site) admin, only from an imported placeholder, only onto a real
// user, and it must never hand out a role the import did not already record.
//
// #6519: the target no longer has to be an existing active board member. After a
// Trello/CSV import the real people usually have no membership at all, so that rule left
// the picker showing nobody but the admin. A target who is already an ACTIVE member still
// keeps their own entry and role untouched; a target who is NOT a member is added with
// the PLACEHOLDER's own role - never a higher one - which is something the board admin
// doing the mapping can already do through the normal add-member flow.
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

test('an ACTIVE member target is reported as needing no membership change', () => {
  const r = planBoardMemberMapping(base);
  assert.strictEqual(r.addedMember, false, 'no membership is created for an existing member');
});

// #6519 - the reported bug: only board members could be picked, so a freshly imported
// board (where the real people are not members yet) offered nobody but the admin.
test('a target who is NOT a board member is added with the PLACEHOLDER role', () => {
  const r = planBoardMemberMapping({ ...base, targetId: 'stranger' });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.addedMember, true, 'caller must run the invite policy checks');
  const added = r.newMembers.find(m => m.userId === 'stranger');
  assert.ok(added, 'target is added to the board');
  assert.strictEqual(added.isActive, true);
  // The placeholder was a plain member, so the mapped-in user is a plain member too.
  assert.strictEqual(added.isAdmin, false, 'never more than the placeholder had');
  assert.strictEqual(added.isNoComments, false);
  assert.strictEqual(added.isCommentOnly, false);
  assert.strictEqual(added.isWorker, false);
  // The placeholder entry is gone and nobody else changed.
  assert.strictEqual(r.newMembers.find(m => m.userId === 'ph'), undefined);
  assert.deepStrictEqual(
    r.newMembers.find(m => m.userId === 'admin'),
    { userId: 'admin', isAdmin: true, isActive: true },
  );
});

test('an INACTIVE member target is reactivated with the placeholder role', () => {
  const inactiveTarget = members.map(m => (m.userId === 'bob' ? { ...m, isActive: false } : m));
  const r = planBoardMemberMapping({ ...base, members: inactiveTarget });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.addedMember, true);
  const bob = r.newMembers.find(m => m.userId === 'bob');
  assert.strictEqual(bob.isActive, true);
  assert.strictEqual(bob.isAdmin, false);
  // Exactly one entry per user - reactivating must not duplicate the membership.
  assert.strictEqual(r.newMembers.filter(m => m.userId === 'bob').length, 1);
});

// The no-escalation property, stated directly: a mapped-in user can never come out with a
// role the placeholder did not already have.
test('the added role never exceeds the placeholder role (negative)', () => {
  const restricted = [
    { userId: 'admin', isAdmin: true, isActive: true },
    { userId: 'ph', isAdmin: false, isActive: false, isCommentOnly: true },
  ];
  const r = planBoardMemberMapping({ ...base, members: restricted, targetId: 'stranger' });
  assert.strictEqual(r.ok, true);
  const added = r.newMembers.find(m => m.userId === 'stranger');
  assert.strictEqual(added.isAdmin, false, 'a comment-only placeholder cannot yield an admin');
  assert.strictEqual(added.isCommentOnly, true, 'the placeholder restriction carries over');
});

test('an admin placeholder yields an admin target only because the caller could do that anyway', () => {
  const adminPlaceholder = [
    { userId: 'admin', isAdmin: true, isActive: true },
    { userId: 'ph', isAdmin: true, isActive: false },
  ];
  const r = planBoardMemberMapping({ ...base, members: adminPlaceholder, targetId: 'stranger' });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.newMembers.find(m => m.userId === 'stranger').isAdmin, true);
});

test('a non-admin still cannot map onto a non-member (negative)', () => {
  const r = planBoardMemberMapping({ ...base, callerId: 'bob', targetId: 'stranger' });
  assert.deepStrictEqual(r, { ok: false, error: 'not-authorized' });
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
