'use strict';

// OrgsTeamsBleed (SnowBleed sub-finding 2, reported 2026-01-05 by Joshua
// Rogers of Aisle Research, fixed in WeKan v8.21 by commit cabfeed9a6): the
// Meteor methods setBoardOrgs and setBoardTeams wrote a board's `orgs`,
// `teams` and `members` from whatever the caller sent, with no check of who
// the caller was - any client could attach organizations and teams to any
// board, or rewrite its member list (and so make itself an admin of it). They
// now require a signed-in BOARD ADMIN of that board and type-check every entry
// before anything is written. Later work added #5141 (only groups the admin
// belongs to, tests/boardGroupLinks.test.cjs) and #5730 (members reconciled
// against the server's list, tests/reconcileBoardTeamMembers.test.cjs).
// The methods live in server/models/boards.js today.
//
// The test runs the real method bodies against stubs. The negative test pins
// the shape for every board method that writes a board named by the caller:
// a board-admin check before the write.
//
// Not recorded in Admin Panel / Problems: this fix predates the Problems log;
// it was audited 2026-10-27 and is unchanged.
// Run: node tests/orgsTeamsBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

class MeteorError extends Error {
  constructor(error, reason) { super(reason || error); this.error = error; }
}
function check(value, pattern) {
  const ok = pattern && pattern.name === 'String' ? typeof value === 'string'
    : pattern && pattern.name === 'Boolean' ? typeof value === 'boolean'
      : pattern && pattern.name === 'Array' ? Array.isArray(value)
        : true;
  if (!ok) throw new MeteorError('match-error');
}

const src = read('server/models/boards.js');
const start = src.indexOf('  async setBoardOrgs(boardOrgsArray, currBoardId) {');
const end = src.indexOf('  async setBoardDomains(', start);
assert.ok(start > 0 && end > start, 'setBoardOrgs and setBoardTeams are in server/models/boards.js');

const boardWrites = [];
const board = {
  _id: 'board', permission: 'private', orgs: [], teams: [],
  members: [
    { userId: 'admin', isAdmin: true, isActive: true },
    { userId: 'member', isAdmin: false, isActive: true },
  ],
  hasAdmin(id) { return this.members.some(m => m.userId === id && m.isAdmin && m.isActive); },
};
const users = {
  admin: { _id: 'admin', orgs: [{ orgId: 'org' }], teams: [{ teamId: 'team' }] },
  member: { _id: 'member', orgs: [{ orgId: 'org' }], teams: [{ teamId: 'team' }] },
  outsider: { _id: 'outsider', orgs: [{ orgId: 'org' }], teams: [{ teamId: 'team' }] },
};
const libs = {
  '/models/lib/boardGroupLinks': require('../models/lib/boardGroupLinks.js'),
};
const noop = { updateAsync: async () => 0, insertAsync: async () => 'id' };
const methods = vm.runInNewContext(`({${src.slice(start, end)}})`, {
  check,
  require: name => { assert.ok(libs[name], `unexpected require ${name}`); return libs[name]; },
  Meteor: {
    Error: MeteorError,
    users: {
      findOneAsync: async id => users[id] || null,
      find: () => ({ fetchAsync: async () => [] }),
    },
  },
  ReactiveCache: { getBoard: async id => (id === 'board' ? board : null) },
  allowIsBoardAdmin: (userId, b) => b && b.hasAdmin(userId),
  Boards: { updateAsync: async (id, mod) => boardWrites.push([id, mod]) },
  reconcileBoardTeamMembers: require('../models/lib/reconcileBoardTeamMembers.js').reconcileBoardTeamMembers,
  readableWithoutMembership: () => false,
  Cards: noop, Lists: noop, Users: noop, Activities: noop,
});

const orgs = [{ orgId: 'org', orgDisplayName: 'Org', isActive: true }];
const teams = [{ teamId: 'team', teamDisplayName: 'Team', isActive: true }];
// The attacker's member list: itself as an admin.
const forgedMembers = userId => [...board.members, { userId, isAdmin: true, isActive: true }];

test('the attack: not signed in, an outsider, or a non-admin member - refused, nothing written', async () => {
  for (const userId of [null, 'outsider', 'member']) {
    boardWrites.length = 0;
    await assert.rejects(methods.setBoardOrgs.call({ userId }, orgs, 'board'),
      e => e.error === 'not-authorized', `setBoardOrgs as ${userId}`);
    await assert.rejects(methods.setBoardTeams.call({ userId }, teams, forgedMembers(userId || 'x'), 'board'),
      e => e.error === 'not-authorized', `setBoardTeams as ${userId}`);
    assert.deepStrictEqual(boardWrites, [], `${userId}: the board was not written`);
  }
});

test('an unknown board is refused', async () => {
  await assert.rejects(methods.setBoardOrgs.call({ userId: 'admin' }, orgs, 'nope'), e => e.error === 'board-not-found');
  await assert.rejects(methods.setBoardTeams.call({ userId: 'admin' }, teams, [], 'nope'), e => e.error === 'board-not-found');
});

test('the attack, by an admin: malformed entries are refused before the write', async () => {
  boardWrites.length = 0;
  await assert.rejects(methods.setBoardOrgs.call({ userId: 'admin' }, [{ orgId: { $ne: 1 }, orgDisplayName: 'x', isActive: true }], 'board'));
  await assert.rejects(methods.setBoardTeams.call({ userId: 'admin' }, teams, [{ userId: 'u', isAdmin: 'yes', isActive: true }], 'board'));
  await assert.rejects(methods.setBoardTeams.call({ userId: 'admin' }, teams, [{ userId: 'u', isAdmin: false, isActive: true, isReadOnly: 1 }], 'board'));
  assert.deepStrictEqual(boardWrites, []);
});

test('negative: the board admin still sets the board\'s organizations and teams', async () => {
  boardWrites.length = 0;
  await methods.setBoardOrgs.call({ userId: 'admin' }, orgs, 'board');
  await methods.setBoardTeams.call({ userId: 'admin' }, teams, board.members, 'board');
  assert.strictEqual(boardWrites.length, 2);
  assert.strictEqual(JSON.stringify(boardWrites[0]), JSON.stringify(['board', { $set: { orgs } }]));
  assert.strictEqual(JSON.stringify(boardWrites[1][1].$set.teams), JSON.stringify(teams));
});

// Negative, whole file: every board method that takes the board to write from
// the caller (`currBoardId`) and writes it checks board admin first, or hands
// the write to one that does.
test('negative: no caller-named board is written without a board-admin check', () => {
  const header = /\n  async (\w+)\([^)]*currBoardId\) \{/g;
  const heads = [...src.matchAll(header)];
  assert.ok(heads.length >= 5, 'found the currBoardId methods');
  for (let i = 0; i < heads.length; i += 1) {
    const [, name] = heads[i];
    const body = src.slice(heads[i].index, i + 1 < heads.length ? heads[i + 1].index : src.indexOf('\n});', heads[i].index));
    const write = body.indexOf('Boards.updateAsync(currBoardId');
    if (write >= 0) {
      const guard = body.search(/if \(!allowIsBoardAdmin\(userId, board\)\) \{\s*throw new Meteor\.Error\('not-authorized'/);
      assert.ok(guard >= 0 && guard < write, `${name}: board-admin check before the write`);
      assert.ok(/const userId = this\.userId;\s*if \(!userId\) \{\s*throw/.test(body), `${name}: refuses the anonymous caller`);
    } else {
      assert.match(body, /return Meteor\.callAsync\('setBoardDomains'/, `${name}: delegates to a guarded method`);
    }
  }
});

let finished = false;
// A test whose promise never settles would otherwise end the run silently.
process.on('beforeExit', () => { if (!finished) { console.error('orgsTeamsBleed: a test never settled'); process.exit(1); } });
(async () => {
  console.log('orgsTeamsBleed:');
  for (const [name, fn] of pending) {
    await fn();
    console.log('  ok -', name);
  }
  console.log(`\norgsTeamsBleed: ${pending.length} tests passed`);
  finished = true;
})().catch(e => { console.error(e); process.exit(1); });
