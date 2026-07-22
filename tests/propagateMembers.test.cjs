'use strict';

// Unit + wiring tests for the per-org/team "Propagate Members To Boards" flag
// (#4737/#5850). The flag was stored/shown in the Admin Panel but never acted on
// — the propagation method had NO caller (dead code). Run:
//   node tests/propagateMembers.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { membersToAddToBoard } = require('../models/lib/propagateMembers');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const M = (userId, extra = {}) => ({ userId, isActive: true, ...extra });

// ── membersToAddToBoard (add-only) ──────────────────────────────────────────
check('adds the members that are not already on the board, as active non-admins', () => {
  const out = membersToAddToBoard([M('a')], ['a', 'b', 'c']);
  assert.deepStrictEqual(out.map(m => m.userId), ['b', 'c']);
  assert.ok(out.every(m => m.isActive === true && m.isAdmin === false && m.isWorker === false));
});
check('add-only: never removes or modifies existing members (returns only additions)', () => {
  assert.deepStrictEqual(membersToAddToBoard([M('a', { isAdmin: true })], ['a']), [],
    'an existing member (even admin) is never re-added or changed');
});
check('de-duplicates the incoming member ids', () => {
  const out = membersToAddToBoard([], ['x', 'x', 'y']);
  assert.deepStrictEqual(out.map(m => m.userId), ['x', 'y']);
});
check('empty when everyone is already a member', () => {
  assert.deepStrictEqual(membersToAddToBoard([M('a'), M('b')], ['a', 'b']), []);
});
check('negative: tolerates missing/invalid inputs without throwing', () => {
  assert.deepStrictEqual(membersToAddToBoard(undefined, ['a']).map(m => m.userId), ['a']);
  assert.deepStrictEqual(membersToAddToBoard([M('a')], undefined), []);
  assert.deepStrictEqual(membersToAddToBoard([null, {}, M('a')], ['a', '', null, 5, 'b'])
    .map(m => m.userId), ['b']);
});

// ── wiring: the flag now actually propagates (the dead-code fix) ─────────────
check('#4737/#5850: setTeamPropagateMembersToBoards propagates when turned on', () => {
  const src = read('server/models/team.js');
  const start = src.indexOf('async setTeamPropagateMembersToBoards(');
  const body = src.slice(start, start + 800);
  assert.ok(/propagateGroupMembersToBoards\('team', team\)/.test(body),
    'must propagate the team when the flag is set');
  assert.ok(/value === true/.test(body), 'must only propagate when turning the flag ON');
});
check('#4737/#5850: setOrgPropagateMembersToBoards propagates when turned on', () => {
  const src = read('server/models/org.js');
  const start = src.indexOf('async setOrgPropagateMembersToBoards(');
  const body = src.slice(start, start + 800);
  assert.ok(/propagateGroupMembersToBoards\('org', org\)/.test(body),
    'must propagate the org when the flag is set');
  assert.ok(/value === true/.test(body), 'must only propagate when turning the flag ON');
});
check('the propagation function is exported + used by the (formerly dead) method', () => {
  const src = read('server/propagateOrgTeamMembers.js');
  assert.ok(/export async function propagateGroupMembersToBoards/.test(src),
    'single-group propagation must be exported for the flag-setters');
  assert.ok(/membersToAddToBoard\(board\.members, memberUserIds\)/.test(src),
    'propagation must use the tested membersToAddToBoard helper');
  assert.ok(/return await propagateAllFlaggedGroupsToBoards\(\)/.test(src),
    'the Meteor method must delegate to the shared implementation');
});
check('propagation stays add-only + skips template boards (regression)', () => {
  const src = read('server/propagateOrgTeamMembers.js');
  assert.ok(/type: 'board'/.test(src), 'only regular boards (type board) are propagated to');
  assert.ok(/\$push: \{ members:/.test(src), 'members are ADDED ($push), never overwritten');
  assert.ok(!/\$set: \{ members/.test(src), 'must never $set/overwrite the members array');
});

console.log(`\npropagateMembers: ${passed} checks passed`);
