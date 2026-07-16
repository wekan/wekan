'use strict';

// Plain-Node regression guard (no Meteor) for issue #6456: creating a subtask
// crashed with "Exception while invoking method 'addSubtaskCard' — insert is
// not available on the server. Please use insertAsync() instead."
// Run: node tests/subtasksDefaultBoard.test.cjs
//
// Root cause: the lazily-creating getters for the default subtasks board/list
// (getDefaultSubtasksBoardId / getDefaultSubtasksListId) used the SYNC
// Boards.insert / Swimlanes.insert / Lists.insert / Boards.update APIs, which
// Meteor 3 removed from the server — and addSubtaskCard's async path funneled
// straight into them. The date-settings twins had the same sync calls and no
// Meteor.isServer guard at all (the #2256/#3868 client-side-creation class).
//
// The fix: the sync getters are PURE (no creation), and the server-side lazy
// creation lives in the *Async variants using the async APIs.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const boards = fs.readFileSync(path.join(repoRoot, 'models/boards.js'), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function extract(name) {
  // matches "  name() {" or "  async name() {" up to its closing "  },"
  const m = boards.match(new RegExp(`(?:async )?${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\},`));
  assert.ok(m, `${name} found in models/boards.js`);
  return m[0];
}

// --- The async creators use the Meteor 3 server APIs -------------------------

test('getDefaultSubtasksBoardAsync creates the helper board with async APIs', () => {
  const fn = extract('getDefaultSubtasksBoardAsync');
  assert.ok(fn.includes('await Boards.insertAsync('));
  assert.ok(fn.includes('await Swimlanes.insertAsync('));
  assert.ok(fn.includes('await this.setSubtasksDefaultBoardId('));
  assert.ok(fn.includes('Meteor.isServer'), 'creation stays server-only (#3868/#2256)');
});

test('getDefaultSubtasksListAsync creates the landing list with async APIs', () => {
  const fn = extract('getDefaultSubtasksListAsync');
  assert.ok(fn.includes('await Lists.insertAsync('));
  assert.ok(fn.includes('await this.getDefaultSwimlineAsync()'),
    'the sync getDefaultSwimline returns a Promise on the server — must await the async variant');
  assert.ok(fn.includes('await this.setSubtasksDefaultListId('));
  assert.ok(fn.includes('Meteor.isServer'));
});

// --- The sync getters are pure (no creation) ---------------------------------

test('sync getters no longer create anything', () => {
  for (const name of [
    'getDefaultSubtasksBoardId',
    'getDefaultSubtasksListId',
    'getDefaultDateSettingsBoardId',
    'getDefaultDateSettingsListId',
  ]) {
    const fn = extract(name);
    assert.ok(!/\binsert(Async)?\(/.test(fn), `${name} must not insert`);
    assert.ok(!/\bupdate(Async)?\(/.test(fn), `${name} must not update`);
  }
});

// --- NEGATIVE: the removed sync server APIs must not come back ---------------

test('models/boards.js has no sync collection writes left (#6456)', () => {
  assert.ok(!/\bBoards\.insert\(/.test(boards), 'sync Boards.insert throws on the Meteor 3 server');
  assert.ok(!/\bLists\.insert\(/.test(boards), 'sync Lists.insert throws on the Meteor 3 server');
  assert.ok(!/\bSwimlanes\.insert\(/.test(boards), 'sync Swimlanes.insert throws on the Meteor 3 server');
  assert.ok(!/\bBoards\.update\(/.test(boards), 'sync Boards.update throws on the Meteor 3 server');
});

console.log(`\n${passed} tests passed`);
