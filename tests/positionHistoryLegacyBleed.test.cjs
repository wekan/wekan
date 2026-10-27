'use strict';

// PositionHistoryLegacyBleed (SnowBleed sub-finding 5, reported 2026-01-05 by
// Joshua Rogers of Aisle Research, fixed in WeKan v8.21 by commit 55576ec177,
// whose CHANGELOG entry calls it "PositionHistoryBleed"): the original-position
// methods of server/methods/positionHistory.js - positionHistory.trackSwimlane,
// trackList, trackCard, get*OriginalPosition, has*Moved, get*Description,
// getBoardHistory and getBoardHistoryByType - took an id and answered (or
// wrote) for it with no check of who asked, so anybody could read the
// structure and history of a private board, or write its position records.
// Every one now requires a signed-in caller who can read the board
// (models/lib/boardVisibility.js canReadBoard), and the card methods apply the
// assigned-only board roles as well (GHSA-r4gm-mjj9-g3x8).
//
// NOT the later PositionHistoryBleed of the Hall of Fame (GHSA-5fc2-m4gw-j6qq,
// forged undo history across boards, 2026-08-25), which is a different fault
// in the undo/redo path; this file covers only the legacy SnowBleed methods.
//
// The test runs the real methods file against stubs. The negative test pins
// that every method of the file is guarded, and that no other file defines
// positionHistory.* methods that could skip the guard.
//
// Not recorded in Admin Panel / Problems: this fix predates the Problems log;
// it was audited 2026-10-27 and is unchanged.
// Run: node tests/positionHistoryLegacyBleed.test.cjs

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

const src = read('server/methods/positionHistory.js');
const visibility = read('models/lib/boardVisibility.js').replace(/export \{ canReadBoard \};/, '');

const boards = {
  priv: {
    _id: 'priv',
    members: [
      { userId: 'member', isActive: true },
      { userId: 'assigned', isActive: true, isReadAssignedOnly: true },
    ],
    isVisibleBy: user => !!user && ['member', 'assigned'].includes(user._id),
  },
  pub: { _id: 'pub', members: [], isVisibleBy: () => true },
};
const answered = [];
const entity = (boardId, extra = {}) => new Proxy({ boardId, ...extra }, {
  get(target, prop) {
    if (prop in target || prop === 'then' || typeof prop === 'symbol') return target[prop];
    return () => { answered.push(prop); return `answer:${String(prop)}`; };
  },
});
const docs = {
  sPriv: entity('priv'), lPriv: entity('priv'), cPriv: entity('priv', { assignees: [] }),
  sPub: entity('pub'), lPub: entity('pub'), cPub: entity('pub', { assignees: [] }),
};
const finder = { findOneAsync: async id => docs[id] || null };
let methods;
vm.runInNewContext(`${visibility}\n${src.replace(/^import .*;$/gm, '')}`, {
  check() {},
  require: name => {
    assert.strictEqual(name, '/models/lib/boardCardScope');
    return require('../models/lib/boardCardScope.js');
  },
  Meteor: { Error: MeteorError, methods: m => { methods = m; } },
  ReactiveCache: {
    getBoard: async id => boards[id] || null,
    getCards: async () => [],
  },
  Swimlanes: finder, Lists: finder, Cards: finder,
  PositionHistory: { find: () => ({ fetchAsync: async () => { answered.push('history'); return []; } }) },
});

// Each method, with the id of something on the private board and on the public one.
const ids = name => {
  if (/BoardHistory/.test(name)) return [['priv', 'list'], ['pub', 'list']];
  const kind = /Swimlane/.test(name) ? 's' : /List/.test(name) ? 'l' : 'c';
  return [[`${kind}Priv`], [`${kind}Pub`]];
};
const names = Object.keys(methods);

test('every original-position method of the file is exercised', () => {
  assert.strictEqual(names.length, 14, names.join(', '));
});

test('the attack: not signed in - refused for every method, even on a public board', async () => {
  for (const name of names) {
    for (const args of ids(name)) {
      answered.length = 0;
      await assert.rejects(methods[name].apply({ userId: null }, args), e => e.error === 'not-authorized', name);
      assert.deepStrictEqual(answered, [], `${name}: nothing answered`);
    }
  }
});

test('the attack: an outsider asking about a private board - refused, nothing answered', async () => {
  for (const name of names) {
    answered.length = 0;
    await assert.rejects(methods[name].apply({ userId: 'outsider' }, ids(name)[0]), e => e.error === 'not-authorized', name);
    assert.deepStrictEqual(answered, [], `${name}: nothing answered`);
  }
});

test('the attack: an assigned-only member asking about a card not assigned to them - refused', async () => {
  for (const name of names.filter(n => /Card/.test(n))) {
    await assert.rejects(methods[name].apply({ userId: 'assigned' }, ['cPriv']), e => e.error === 'not-authorized', name);
  }
});

test('negative: a member of the board, and anybody on a public board, still get the answer', async () => {
  for (const name of names) {
    for (const [userId, args] of [['member', ids(name)[0]], ['outsider', ids(name)[1]]]) {
      answered.length = 0;
      await methods[name].apply({ userId }, args);
      assert.strictEqual(answered.length, 1, `${name} as ${userId}`);
    }
  }
});

// Negative, whole tree: the guard is on every method, in the same order -
// signed in, then the board's read policy - and the methods exist nowhere else.
test('negative: no positionHistory.* method skips the guard, here or elsewhere', () => {
  const heads = [...src.matchAll(/\n  async '(positionHistory\.\w+)'\(/g)];
  assert.strictEqual(heads.length, 14);
  for (let i = 0; i < heads.length; i += 1) {
    const body = src.slice(heads[i].index, i + 1 < heads.length ? heads[i + 1].index : src.length);
    const signedIn = body.search(/if \(!this\.userId\) \{\s*throw new Meteor\.Error\('not-authorized'/);
    const policy = body.indexOf('await assertCanReadBoard(this.userId,');
    const answer = body.search(/return |\.find\(/);
    assert.ok(signedIn >= 0 && policy > signedIn && answer > policy, `${heads[i][1]}: guarded before it answers`);
  }
  const skip = new Set(['node_modules', '_build', '.build', '.tools', '.git', 'tests', '.meteor']);
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    if (skip.has(entry.name)) return [];
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : /\.(c|m)?js$/.test(entry.name) ? [rel] : [];
  });
  for (const file of ['server', 'models', 'packages', 'imports'].flatMap(walk)) {
    if (file === path.join('server', 'methods', 'positionHistory.js')) continue;
    assert.doesNotMatch(read(file), /^\s*(async\s+)?['"]positionHistory\.\w+['"]\s*\(/m, `${file} defines a positionHistory method`);
  }
});

let finished = false;
// A test whose promise never settles would otherwise end the run silently.
process.on('beforeExit', () => { if (!finished) { console.error('positionHistoryLegacyBleed: a test never settled'); process.exit(1); } });
(async () => {
  console.log('positionHistoryLegacyBleed:');
  for (const [name, fn] of pending) {
    await fn();
    console.log('  ok -', name);
  }
  console.log(`\npositionHistoryLegacyBleed: ${pending.length} tests passed`);
  finished = true;
})().catch(e => { console.error(e); process.exit(1); });
