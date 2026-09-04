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

test('a description edit records what it was and what it became', () => {
  assert.match(cards, /async setDescription\(description\) \{/,
    'History.md §10.2 makes Description the first content group');
  const setter = cards.slice(cards.indexOf('async setDescription(description)'));
  const body = setter.slice(0, setter.indexOf('\n  },'));
  assert.match(body, /const previous = this\.getDescription\(\);/,
    'the previous text has to be read BEFORE the write, or it is gone');
  assert.ok(body.indexOf('const previous') < body.indexOf('updateAsync'),
    'reading it after the update would record the new value twice');
  assert.match(body, /group: 'description'/);
  assert.match(body, /changeType: 'edited'/);
  assert.match(body, /previousContent: \{ text:/);
  assert.match(body, /newContent: \{ text:/);
});

test('the card helper reaches the collection by a real require', () => {
  assert.match(cards, /require\('\/models\/changeHistory'\)\.default/,
    'lazy, because this file is isomorphic - but a real reference, not a global');
  assert.doesNotMatch(cards, /typeof\s+ChangeHistory\s*!==\s*'undefined'/,
    'the guard that made the last history inert must not reappear');
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

// One rule instead of a case per action type: undo applies previousContent,
// redo applies newContent. That is why 'added', 'removed', 'edited' and 'moved'
// all work without the applier knowing which it is handling.
test('undo applies the previous content and redo the new one', () => {
  assert.match(server, /direction === 'undo' \? row\.previousContent : row\.newContent/,
    'the single rule that covers every change type');
  assert.match(server, /applyRow\(row, 'undo'\)/);
  assert.match(server, /applyRow\(row, 'redo'\)/);
});

// History.md §8.2: a restore goes through the SAME setters as an ordinary edit,
// so validation, hooks and Activities still run. A raw update would skip all of
// them and leave the board in a state no normal edit could produce.
test('restoring goes through the setters, not a raw write', () => {
  const appliers = server.slice(server.indexOf('async function applyCardContent'),
    server.indexOf('const APPLIERS'));
  assert.match(appliers, /card\.setDescription\(content\.text\)/);
  assert.match(appliers, /card\.setTitle\(content\.text\)/);
  assert.match(appliers, /card\.move\(/);
  assert.doesNotMatch(appliers, /Cards\.direct/,
    'a restore is an ordinary edit and must run the ordinary hooks');
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
});

console.log(`changeHistoryWiring: ${passed} tests passed`);
