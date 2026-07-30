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

// ── #6559: what the flag-setters pass, and what the function accepts ─────────
//
// These two checks USED to require `propagateGroupMembersToBoards('team', team)`
// and `('org', org)` — the buggy calls. They pinned that a call happened and
// matched the argument text without asking whether the argument was right, so the
// guard held the bug in place for a release. `team` is the SELECTOR the Meteor
// method received (`{ _id: … }`, the same value passed to updateAsync beside it),
// not an id, so the member lookup compared `teams.teamId` against an object,
// matched nobody, and returned "0 members added" with no error: the Admin Panel
// checkbox went green and did nothing. They require the id now.
check('#6559: setTeamPropagateMembersToBoards propagates the team ID, not the selector', () => {
  const src = read('server/models/team.js');
  const start = src.indexOf('async setTeamPropagateMembersToBoards(');
  const body = src.slice(start, start + 1200);
  assert.ok(/propagateGroupMembersToBoards\('team', team\._id\)/.test(body),
    'must pass team._id — `team` is the { _id } selector, and an object matches no user');
  assert.ok(!/propagateGroupMembersToBoards\('team', team\)/.test(body),
    'the whole selector must never be passed again');
  assert.ok(/value === true/.test(body), 'must only propagate when turning the flag ON');
});
check('#6559: setOrgPropagateMembersToBoards propagates the org ID, not the selector', () => {
  const src = read('server/models/org.js');
  const start = src.indexOf('async setOrgPropagateMembersToBoards(');
  const body = src.slice(start, start + 1200);
  assert.ok(/propagateGroupMembersToBoards\('org', org\._id\)/.test(body),
    'must pass org._id — the report was about teams, the org column had the same bug');
  assert.ok(!/propagateGroupMembersToBoards\('org', org\)/.test(body),
    'the whole selector must never be passed again');
  assert.ok(/value === true/.test(body), 'must only propagate when turning the flag ON');
});

// The normaliser at the choke point, run for real: whatever a caller has to hand,
// only a usable id may reach the query — and anything else has to be LOUD, because
// a silent "0 members added" is exactly how this survived.
const groupIdOf = (() => {
  const src = read('server/propagateOrgTeamMembers.js');
  const at = src.indexOf('function groupIdOf(');
  assert.notStrictEqual(at, -1, 'the normaliser must exist');
  const end = src.indexOf('\n}', at) + 2;
  // eslint-disable-next-line no-new-func
  return new Function('console', `${src.slice(at, end)}\nreturn groupIdOf;`);
})();

check('#6559: an id — however the caller holds it — becomes an id', () => {
  const quiet = { warn: () => {} };
  const fn = groupIdOf(quiet);
  assert.strictEqual(fn('team', 'teamId123'), 'teamId123', 'a plain id');
  assert.strictEqual(fn('team', { _id: 'teamId123' }), 'teamId123',
    'the { _id } selector the Meteor methods receive — the #6559 case');
  assert.strictEqual(fn('org', { _id: 'orgId9', orgDisplayName: 'Acme' }), 'orgId9',
    'a whole document');
});

check('#6559: anything that is not an id is refused, and says so', () => {
  const warnings = [];
  const fn = groupIdOf({ warn: (...args) => warnings.push(args.join(' ')) });

  assert.strictEqual(fn('team', { teamShortName: 'acme' }), null,
    'a selector with no id cannot be turned into one');
  assert.strictEqual(fn('team', { _id: { $in: ['a'] } }), null, 'nor a non-string id');
  assert.strictEqual(warnings.length, 2,
    'and each one is logged — a silent no-op is what hid this bug');
  assert.ok(/cannot propagate team members/.test(warnings[0]), warnings[0]);

  // Absent is not an error: propagateAllFlaggedGroupsToBoards may pass nothing.
  warnings.length = 0;
  for (const empty of [undefined, null, '', 0]) {
    assert.ok(!fn('team', empty), `${JSON.stringify(empty)} yields no id`);
  }
  assert.deepStrictEqual(warnings, [], 'a missing group is quiet, not a complaint');
});

check('#6559: select-all propagates too, and only for the kind it was ticked on', () => {
  // The header checkbox is the same promise as the per-row one, and it did not
  // propagate at all — not even wrongly.
  for (const [file, kind, field] of [
    ['server/models/team.js', 'team', 'teamPropagateMembersToBoards'],
    ['server/models/org.js', 'org', 'orgPropagateMembersToBoards'],
  ]) {
    const src = read(file);
    const start = src.indexOf(kind === 'team' ? 'async setAllTeamsFeature(' : 'async setAllOrgsFeature(');
    assert.notStrictEqual(start, -1, `${file}: the bulk setter must exist`);
    const body = src.slice(start, start + 1200);
    assert.ok(new RegExp(`field === '${field}' && value === true`).test(body),
      `${file}: propagates only when that field is being turned ON`);
    assert.ok(new RegExp(`propagateAllFlaggedGroupsToBoards\\('${kind}'\\)`).test(body),
      `${file}: and only for ${kind}s — ticking one column must not act on the other`);
  }

  const prop = read('server/propagateOrgTeamMembers.js');
  assert.ok(/propagateAllFlaggedGroupsToBoards\(kind = null\)/.test(prop),
    'the kind filter is optional, so the LDAP cron and the method still do both');
  assert.ok(/kind === null \|\| kind === 'org'/.test(prop)
    && /kind === null \|\| kind === 'team'/.test(prop),
    'and null still means every kind');
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
