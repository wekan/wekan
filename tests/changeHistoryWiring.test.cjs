'use strict';

// Guard: the universal change history is wired to the things that use it.
// Run: node tests/changeHistoryWiring.test.cjs
//
// docs/Features/Reports/History/History.md phase 1 (§10.1): the store, the write
// helper, and the undo/redo stack the shipped position history moves onto.
// tests/changeHistoryQuery.test.cjs covers the pure query rules; this covers the
// connections between files, which is where a subsystem like this dies quietly:
// a collection nothing imports, a method nothing calls, a keyboard shortcut
// still pointing at the old store.
//
// The appendix of History.md lists the lessons this pins:
//   * import your collection helpers - a `typeof X !== 'undefined'` guard on a
//     module export is always false, and made the position history inert;
//   * the read method must gate on board access, or a history view becomes a
//     way to read boards you cannot open.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const code = f => read(f)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

const model = code('models/changeHistory.js');
const server = code('server/models/changeHistory.js');
const cards = code('models/cards.js');
const lists = code('server/models/lists.js');
const keyboard = code('client/lib/keyboard.js');
const imports = code('server/imports.js');
const hooks = code('server/models/changeHistoryHooks.js');
const historyTable = code('client/components/history/historyTable.js');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

// ---- the collection is importable from a mutation path -----------------------

// THE lesson of #6478, and the reason this store is shaped differently from the
// one it replaces. models/userPositionHistory.js imports Cards, Lists and the
// rest so its undo() can write to them - which makes it unimportable FROM those
// files, which is why models/cards.js guarded on an assumed global and recorded
// nothing for years. Keeping the collection dependency-free is what stops that
// happening again, so it is a rule, not an accident.
test('the collection imports no other model, so any model can import it', () => {
  const modelImports = [...model.matchAll(/^import .*? from '([^']+)'/gm)].map(m => m[1]);
  const offending = modelImports.filter(spec => /^\/models\//.test(spec));
  assert.deepEqual(offending, [],
    'importing a model here would make this collection unimportable from that ' +
    'model, which is exactly how the position history became inert');
  assert.match(model, /const \{ SimpleSchema \} = require\('\/imports\/simpleSchema'\)/);
});

test('applying a change to a document lives on the server, not in the collection', () => {
  assert.doesNotMatch(model, /Cards\.|Lists\.|Swimlanes\.|Checklists\./,
    'the collection must not write to entities; that is what forces the import cycle');
  assert.match(server, /import Cards from '\/models\/cards'/,
    'the server side may import whatever it needs, because nothing imports it');
});

// ---- recording is wired where the doc says ----------------------------------

// One change must produce ONE row. Recording a description both in the setter
// and in the field-diffing hook would need two presses of Ctrl+Z to put a single
// edit back - so the setter records nothing and the hook records everything.
test('a field edit is recorded once, by the hook, not twice', () => {
  const setter = cards.slice(cards.indexOf('async setDescription(description)'));
  const body = setter.slice(0, setter.indexOf('\n  },'));
  assert.doesNotMatch(body, /recordCardChange|ChangeHistory/,
    'the hook already records this edit; recording it here too would double it');
  assert.match(hooks, /Cards, 'card'/,
    'and the hook must actually be attached to Cards');
});

test('the card helper reaches the collection by a real require', () => {
  assert.match(cards, /require\('\/models\/changeHistory'\)\.default/,
    'lazy, because this file is isomorphic - but a real reference, not a global');
  assert.doesNotMatch(cards, /typeof\s+ChangeHistory\s*!==\s*'undefined'/,
    'the guard that made the last history inert must not reappear');
});

// The hook is the choke point of History.md §5: one place that also catches the
// REST API, the importers and the rules engine, none of which call the client
// setters. A per-setter rollout would have recorded an edit made in the UI and
// silently missed the same edit made over the API.
test('every entity that can be edited is hooked', () => {
  for (const entity of ['card', 'list', 'swimlane', 'checklist', 'checklistItem', 'comment']) {
    assert.match(hooks, new RegExp(`'${entity}'`),
      `${entity} edits must be recorded`);
  }
  assert.match(hooks, /after\.update\(async function/, 'updates are diffed');
  assert.match(hooks, /after\.insert/, 'and sub-entities appearing');
  assert.match(hooks, /after\.remove/, 'and disappearing');
  assert.match(hooks, /this\.previous/,
    'the diff needs the document as it was, which is what after.update carries');
});

test('a card move is recorded once, as a move, not as four field edits', () => {
  const { NEVER_RECORD, groupForField } = require(
    path.join(ROOT, 'models', 'lib', 'changeHistoryGroups'));
  for (const field of ['boardId', 'swimlaneId', 'listId', 'sort']) {
    assert.ok(NEVER_RECORD.has(field),
      `${field} must be excluded, or one drag becomes four rows`);
    assert.equal(groupForField('card', field), null);
  }
  assert.match(cards, /group: 'position'/,
    'Card.move records the whole move itself, as one change');
});

test('list moves, deletes and restores are recorded too', () => {
  assert.match(lists, /import ChangeHistory from '\/models\/changeHistory'/);
  const records = [...lists.matchAll(/ChangeHistory\.record\(\{[\s\S]*?\}\);/g)].map(m => m[0]);
  assert.ok(records.length >= 3,
    `expected the move, the soft delete and the restore, found ${records.length}`);
  const groups = records.map(r => (/group: '(\w+)'/.exec(r) || [])[1]);
  assert.ok(groups.includes('position'), 'a list move');
  assert.ok(groups.filter(g => g === 'lifecycle').length >= 2,
    'the soft delete and its restore, which is what makes #1023 undoable');
});

// Container scopes are a plain equality only because every row carries every
// container id it sits inside. A recording site that omits them silently drops
// its rows out of the swimlane and board views.
test('every recorded row carries the ids its scopes filter on', () => {
  for (const [name, text] of [['models/cards.js', cards], ['server/models/lists.js', lists]]) {
    for (const call of [...text.matchAll(/ChangeHistory\.record\(\{[\s\S]*?\n\s*\}\);/g)].map(m => m[0])) {
      assert.match(call, /boardId/, `${name}: a row with no boardId is in no board's history`);
    }
  }
  const helper = cards.slice(cards.indexOf('async function recordCardChange'));
  for (const column of ['boardId', 'swimlaneId', 'listId', 'cardId']) {
    assert.match(helper, new RegExp(`${column}:`),
      `a card row must carry ${column} or it drops out of that scope's view`);
  }
});

// ---- undo / redo is now the whole history, not just positions ---------------

test('the keyboard reads the unified store', () => {
  assert.match(keyboard, /changeHistory\.undoLast/,
    'History.md §7c: Ctrl+Z restores the last own change, of any kind');
  assert.match(keyboard, /changeHistory\.redoLast/);
  assert.doesNotMatch(keyboard, /userPositionHistory\.undoLast/,
    'the position-only methods are superseded, not kept alongside');
});

test('undo and redo use the same pure selection rule as before', () => {
  assert.match(server, /import \{ pickUndo, pickRedo \} from '\/models\/lib\/undoRedoSelection'/,
    'the rule was already unit-tested; a second copy of it would drift');
  assert.match(server, /'changeHistory\.undoLast'/);
  assert.match(server, /'changeHistory\.redoLast'/);
});

test('restore, undo and redo refuse tampered history', () => {
  assert.match(model, /previousHash/);
  assert.match(model, /integrityHash/);
  assert.match(model, /hashHistoryRow/);
  assert.match(server, /requireHistoryIntegrity\(row, this\)/);
  assert.match(server, /HISTORY_INTEGRITY_FAILED/);
  assert.match(server, /key: 'integrity\.history'/);
  assert.match(model, /superseded: true/,
    'a new branch preserves invalidated redo rows instead of deleting the hash chain');
});

test('history has no client or API mutation surface', () => {
  const routes = fs.readdirSync(path.join(ROOT, 'server/routes'))
    .filter(name => name.endsWith('.js'))
    .map(name => read(`server/routes/${name}`)).join('\n');
  const publications = read('server/imports.js');
  assert.doesNotMatch(routes, /ChangeHistory|changeHistory/,
    'REST routes must not expose history mutation');
  assert.doesNotMatch(publications, /publications\/changeHistory/,
    'history is read through an access-checked method, not a client-writable publication');
  assert.doesNotMatch(model, /allow\s*\(/,
    'the collection must not grant direct client writes');
  const calls = [...historyTable.matchAll(/Meteor\.call\(['"]([^'"]+)/g)].map(match => match[1]);
  assert.ok(calls.every(name => ['changeHistory.page', 'changeHistory.restore'].includes(name)),
    `unexpected history UI method: ${calls.join(', ')}`);
});

// One rule instead of a case per action type: undo applies previousContent,
// redo applies newContent. That is why 'added', 'removed', 'edited' and 'moved'
// all work without the applier knowing which it is handling.
//
// The rule used to be an inline ternary here and this test matched its text. It
// now lives in `contentForDirection` in models/lib/changeHistoryGroups.js -
// moved there when RESTORE turned out to need a third direction of its own
// (restoring a row must apply the value that row SHOWS, not the one before it;
// see tests/historyRestoreAppliesWhatIsShown.test.cjs). So this asserts the
// behaviour by running it, which a move like that cannot break, and checks only
// that the server still calls into it.
test('undo applies the previous content and redo the new one', () => {
  const { contentForDirection } = require('../models/lib/changeHistoryGroups');
  const row = {
    previousContent: { field: 'title', value: 'before' },
    newContent: { field: 'title', value: 'after' },
  };
  assert.deepEqual(contentForDirection(row, 'undo'), row.previousContent);
  assert.deepEqual(contentForDirection(row, 'redo'), row.newContent);

  assert.match(server, /contentForDirection\(row, direction\)/,
    'applyRow must use the shared rule rather than a second copy of it');
  assert.match(server, /applyRow\(row, 'undo'\)/);
  assert.match(server, /applyRow\(row, 'redo'\)/);
});

// History.md §8.2: a restore goes through the SAME setters as an ordinary edit,
// so validation, hooks and Activities still run. A raw update would skip all of
// them and leave the board in a state no normal edit could produce.
// History.md §8.2: a restore re-applies content through the same path an
// ordinary edit uses, so validation, hooks and Activities all still run. In
// WeKan the Activities ARE the after.update hooks, so a collection update is
// that path - `.direct` is the thing that would skip them, and is what this
// forbids. A move is the exception: four fields that only mean anything
// together, so it goes back through Card.move.
test('restoring runs the ordinary hooks, never a direct write', () => {
  const appliers = server.slice(server.indexOf('async function applyFieldContent'),
    server.indexOf('const APPLIERS'));
  assert.match(appliers, /collection\.updateAsync\(row\.entityId/,
    'the generic case writes the recorded field back through the collection');
  assert.match(appliers, /card\.move\(/,
    'a move is put back as a move, not as four separate field writes');
  for (const direct of [/Cards\.direct/, /Lists\.direct/, /Swimlanes\.direct/,
    /collection\.direct/]) {
    assert.doesNotMatch(appliers, direct,
      'a restore is an ordinary edit; .direct would skip the activities it should log');
  }
});

// An applier that cannot put a row back has to say so. Reporting success for a
// change it did not apply is worse than failing: the row is marked undone, so
// the user cannot even try again.
test('an applier that cannot apply reports it, and the row stays', () => {
  const appliers = server.slice(server.indexOf('async function applyFieldContent'),
    server.indexOf('async function applyRow'));
  assert.match(appliers, /if \(!existing\) return false;/,
    'an entity that no longer exists cannot be restored');
  const undo = server.slice(server.indexOf("'changeHistory.undoLast'"));
  assert.match(undo, /if \(!applied\) return \{ undone: false, reason: 'not-applicable' \};/,
    'and the row must not be marked undone when nothing was undone');
});

test('a restore is itself recorded, for both people involved', () => {
  const restore = server.slice(server.indexOf("'changeHistory.restore'"));
  assert.match(restore, /changeType: 'restored'/);
  assert.match(restore, /restoredFromId: row\._id/,
    'the provenance must survive after the row scrolls off the page');
  assert.match(restore, /userId: row\.userId/,
    'one row attributed to whoever made the change being restored');
  assert.match(restore, /userId: this\.userId/,
    'and one to whoever pressed Restore');
  assert.match(restore, /batchId/,
    'a multi-row restore is one logical change and undoes as one');
  assert.match(restore, /rows\.sort\(\(a, b\) => new Date\(a\.createdAt\) - new Date\(b\.createdAt\)\)/,
    'History.md §8.4: oldest to newest, or the last write wins the wrong way');
});

// ---- permission --------------------------------------------------------------

// A history view that skipped this would be a way to read the contents of
// boards you cannot open - the changes carry the text of every edit.
test('every method gates on board access', () => {
  for (const method of ['changeHistory.page', 'changeHistory.undoLast',
    'changeHistory.redoLast', 'changeHistory.restore']) {
    const at = server.indexOf(`'${method}'`);
    assert.ok(at > 0, `${method} must exist`);
    const body = server.slice(at, at + 2600);
    assert.match(body, /requireBoardVisible|requireBoardWrite/,
      `${method} must check the caller may see the board`);
    assert.match(body, /this\.userId/, `${method} must require a logged-in caller`);
  }
});

test('reading someone else-s history is limited to boards the caller can see', () => {
  const page = server.slice(server.indexOf("'changeHistory.page'"));
  assert.match(page, /Boards\.userBoardIds\(this\.userId\)/,
    'the Member view must never become "show me everything that person did"');
  assert.match(page, /selector\.boardId = \{ \$in: boardIds \}/);
});

test('changing something requires write access, not just visibility', () => {
  for (const method of ['changeHistory.undoLast', 'changeHistory.redoLast',
    'changeHistory.restore']) {
    const at = server.indexOf(`'${method}'`);
    const body = server.slice(at, at + 2600);
    assert.match(body, /requireBoardWrite/,
      `${method} writes to the board, so read access is not enough`);
  }
});

test('the page size is clamped, so one call cannot ask for the whole log', () => {
  assert.match(server, /MAX_PAGE_SIZE/);
  assert.match(server, /Math\.min\(MAX_PAGE_SIZE/);
  assert.match(server, /import \{ pageInfo \} from '\/models\/lib\/tablePage'/,
    'History.md §6: use the shared paginator, do not add a second one');
});

test('the server side is registered, or none of it runs', () => {
  assert.match(imports, /import '\/server\/models\/changeHistory';/);
  assert.match(imports, /import '\/server\/models\/changeHistoryHooks';/,
    'an unregistered hook file records nothing at all');
});

console.log(`changeHistoryWiring: ${passed} tests passed`);
