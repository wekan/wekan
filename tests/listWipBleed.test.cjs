'use strict';

// ListWIPBleed (SnowBleed sub-finding 9, reported 2026-01-05 by Joshua Rogers
// of Aisle Research, fixed in WeKan v8.21 by commit 8c0b4f79d8): the Meteor
// methods applyWipLimit, enableWipLimit and enableSoftLimit took a listId and
// changed that list's WIP limit with no check at all - any DDP client, signed
// in or not, could set, enable or disable the WIP limit of any list on any
// board. They now require a signed-in BOARD ADMIN of the list's board, the
// same people the list menu offers "Set WIP limit" to
// (client/components/lists/listHeader.jade: `if currentUser.isBoardAdmin`).
// The methods live in server/models/lists.js today.
//
// The test runs the real method bodies against stubs. The negative test walks
// the server tree: no server-side code path that calls setWipLimit,
// toggleWipLimit or toggleSoftLimit may do so without a board-admin check.
//
// Not recorded in Admin Panel / Problems: this fix predates the Problems log;
// it was audited 2026-10-27 and is unchanged.
// Run: node tests/listWipBleed.test.cjs

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
    : pattern && pattern.name === 'Number' ? typeof value === 'number'
      : true;
  if (!ok) throw new MeteorError('match-error');
}

// The real method bodies.
const src = read('server/models/lists.js');
const start = src.indexOf('  async applyWipLimit(listId, limit) {');
const end = src.indexOf('  async boardListRepairNeeded(', start);
assert.ok(start > 0 && end > start, 'the WIP-limit methods are in server/models/lists.js');

const writes = [];
const list = {
  _id: 'list', boardId: 'board',
  getWipLimit: async option => ({ value: 3, enabled: false, soft: false }[option]),
  setWipLimit: async v => writes.push(['value', v]),
  toggleWipLimit: async v => writes.push(['enabled', v]),
  toggleSoftLimit: async v => writes.push(['soft', v]),
};
const board = {
  _id: 'board',
  members: [{ userId: 'admin', isAdmin: true }, { userId: 'member', isAdmin: false }],
  hasAdmin: id => id === 'admin',
};
const methods = vm.runInNewContext(`({${src.slice(start, end)}})`, {
  check,
  Meteor: { Error: MeteorError },
  ReactiveCache: {
    getList: async id => (id === 'list' ? list : null),
    getBoard: async id => (id === 'board' ? board : null),
  },
});

const calls = [
  ['applyWipLimit', ['list', 5]],
  ['enableWipLimit', ['list']],
  ['enableSoftLimit', ['list']],
];

test('the attack: not signed in, an outsider, or a non-admin member - refused, nothing written', async () => {
  for (const userId of [null, 'outsider', 'member']) {
    for (const [name, args] of calls) {
      writes.length = 0;
      await assert.rejects(methods[name].apply({ userId }, args), e => e.error === 'not-authorized', `${name} as ${userId}`);
      assert.deepStrictEqual(writes, [], `${name} as ${userId} wrote nothing`);
    }
  }
});

test('an unknown list is refused before anything is written', async () => {
  for (const [name, args] of calls) {
    writes.length = 0;
    await assert.rejects(methods[name].apply({ userId: 'admin' }, ['nope', ...args.slice(1)]), e => e.error === 'list-not-found');
    assert.deepStrictEqual(writes, []);
  }
});

test('negative: the board admin still sets, enables and softens the limit', async () => {
  writes.length = 0;
  await methods.applyWipLimit.call({ userId: 'admin' }, 'list', 5);
  assert.deepStrictEqual(writes, [['value', 5]]);
  writes.length = 0;
  await methods.applyWipLimit.call({ userId: 'admin' }, 'list', NaN);
  assert.deepStrictEqual(writes, [['value', 1]], 'a NaN limit is stored as 1');
  writes.length = 0;
  await methods.enableWipLimit.call({ userId: 'admin' }, 'list');
  assert.deepStrictEqual(writes, [['enabled', true]]);
  writes.length = 0;
  await methods.enableSoftLimit.call({ userId: 'admin' }, 'list');
  assert.deepStrictEqual(writes, [['soft', true]]);
});

// Negative, whole tree: every server-side caller of the WIP-limit writers sits
// in a method that checks board admin first. Client code is excluded: a client
// write goes through the Lists allow rules (server/permissions/lists.js).
test('negative: no server-side WIP-limit write without a board-admin check', () => {
  const skip = new Set(['node_modules', '_build', '.build', '.tools', '.git', 'client', 'tests', '.meteor']);
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.(c|m)?js$/.test(entry.name)) files.push(rel);
    }
  };
  for (const dir of ['server', 'models', 'packages', 'imports']) walk(dir);
  let found = 0;
  for (const file of files) {
    if (file.endsWith('.client.js')) continue;
    const text = read(file);
    for (const m of text.matchAll(/\.(setWipLimit|toggleWipLimit|toggleSoftLimit)\(/g)) {
      // The enclosing method: from the nearest preceding method header.
      const before = text.slice(0, m.index);
      const methodStart = before.lastIndexOf('\n  async ');
      assert.ok(methodStart >= 0, `${file}: ${m[1]} outside a method`);
      const body = before.slice(methodStart);
      assert.ok(/hasAdmin\(this\.userId\)|allowIsBoardAdmin(OrSiteAdmin)?\(/.test(body),
        `${file}: ${m[1]}() is reached without a board-admin check`);
      found += 1;
    }
  }
  assert.ok(found >= 4, `found the known callers (${found})`);
});

let finished = false;
// A test whose promise never settles would otherwise end the run silently.
process.on('beforeExit', () => { if (!finished) { console.error('listWipBleed: a test never settled'); process.exit(1); } });
(async () => {
  console.log('listWipBleed:');
  for (const [name, fn] of pending) {
    await fn();
    console.log('  ok -', name);
  }
  console.log(`\nlistWipBleed: ${pending.length} tests passed`);
  finished = true;
})().catch(e => { console.error(e); process.exit(1); });
