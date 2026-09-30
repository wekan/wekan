'use strict';

// Guard: Restore gives you the value the row you picked was SHOWING.
// Run: node tests/historyRestoreAppliesWhatIsShown.test.cjs
//
// Reported as "when I try to restore card description from card history, it
// restores wrong history, that I did not select" - and the selection was never
// wrong. The server restored exactly the row whose checkbox was ticked; it just
// applied the wrong half of it.
//
// A row carries two contents, before and after. The History table shows the
// AFTER - History.md §7: the content column is "the new text" - and Restore
// applied the BEFORE, because it reused the undo path. So picking the row that
// displayed the description you wanted handed you the description from the row
// above it, and picking a row twice in a row walked backwards through history.
//
// The rule this pins is one sentence: the row a reader picks and the value they
// get are the same thing. Undo is deliberately the other way round - it reverses
// your last change - and the two only look alike when the row you pick happens
// to be the last one, which is exactly why this went unnoticed until somebody
// restored an older description.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { contentForDirection } = require('../models/lib/changeHistoryGroups');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

const edit = (before, after) => ({
  group: 'description',
  changeType: 'edited',
  previousContent: { field: 'description', value: before },
  newContent: { field: 'description', value: after },
});

// ---- the rule itself ----------------------------------------------------------

test('restore applies the content the row displays', () => {
  const row = edit('first draft', 'the one I want back');
  assert.deepEqual(contentForDirection(row, 'restore'),
    { field: 'description', value: 'the one I want back' });
});

test('undo still applies the content from before the change', () => {
  const row = edit('first draft', 'the one I want back');
  assert.deepEqual(contentForDirection(row, 'undo'),
    { field: 'description', value: 'first draft' });
});

// THE regression, stated as the reporter would: pick a row, get that row.
test('restoring an older row does not hand back its neighbour (negative)', () => {
  const history = [edit('A', 'B'), edit('B', 'C'), edit('C', 'D')];
  for (const row of history) {
    const applied = contentForDirection(row, 'restore');
    assert.equal(applied.value, row.newContent.value,
      'the value restored must be the value the row shows');
    assert.notEqual(applied.value, row.previousContent.value,
      'never the previous one - that is the row above in the table');
  }
});

test('a removal restores what it removed', () => {
  const removal = {
    group: 'description',
    changeType: 'removed',
    previousContent: { field: 'description', value: 'text that was deleted' },
    newContent: null,
  };
  assert.deepEqual(contentForDirection(removal, 'restore'),
    { field: 'description', value: 'text that was deleted' },
    'there is no new content to apply, so restoring means putting back the old');
});

test('an addition restores the thing that was added', () => {
  const addition = {
    group: 'description',
    changeType: 'added',
    previousContent: null,
    newContent: { field: 'description', value: 'the first description' },
  };
  assert.deepEqual(contentForDirection(addition, 'restore'),
    { field: 'description', value: 'the first description' });
  assert.equal(contentForDirection(addition, 'undo'), null,
    'undoing an addition removes it, which is unchanged');
});

test('junk is refused rather than throwing (negative)', () => {
  assert.equal(contentForDirection(null, 'restore'), undefined);
  assert.equal(contentForDirection(undefined, 'undo'), undefined);
});

// ---- and the wiring, so the rule is the one actually used ---------------------

// Locate a method by its DEFINITION, `async 'name'(`, not by the first mention
// of its name. The file used to mention each name only once; since the Scrum
// undo/redo rate limit (DDPRateLimiter.addRule near the top) also lists
// 'changeHistory.undoLast', the first mention is no longer the method, and a
// slice from restore to the first undoLast came back EMPTY - which failed the
// positive assertions and would have silently passed every doesNotMatch.
const methodAt = (server, name) => {
  const at = server.indexOf(`async '${name}'(`);
  assert.ok(at >= 0, `server/models/changeHistory.js defines ${name}`);
  return at;
};
const restoreMethod = server => {
  const body = server.slice(methodAt(server, 'changeHistory.restore'),
    methodAt(server, 'changeHistory.undoLast'));
  assert.ok(body.length > 0, 'the restore method body was found (an empty slice proves nothing)');
  return body;
};


test('the restore method asks for the restore direction, not undo', () => {
  const server = read('server/models/changeHistory.js');
  const method = restoreMethod(server);
  assert.match(method, /applyRow\(row, 'restore'\)/,
    'this line is the bug: it read `applyRow(row, \'undo\')`');
  assert.doesNotMatch(method, /applyRow\(row, 'undo'\)/);
});

test('and undo/redo still use their own directions', () => {
  const server = read('server/models/changeHistory.js');
  const undo = server.slice(methodAt(server, 'changeHistory.undoLast'),
    methodAt(server, 'changeHistory.redoLast'));
  // Undo/redo claim the row first and apply it through applyClaimed, which
  // passes the same direction on to applyRow.
  assert.match(undo, /applyClaimed\(row, 'undo', claim\)/,
    'Ctrl+Z reverses the last change and must not become a restore');
  assert.match(server.slice(methodAt(server, 'changeHistory.redoLast')), /applyClaimed\(row, 'redo', claim\)/);
  assert.match(server, /applied = await applyRow\(row, direction\);/);
});

// The display side of the same sentence. If this ever shows previousContent,
// the pairing breaks again from the other end.
test('the table shows the content that restore applies', () => {
  const js = read('client/components/history/historyTable.js');
  assert.match(js, /const content = row\.newContent \|\| row\.previousContent;/,
    'History.md §7: the content column holds the new text - and restore must ' +
    'apply that same one');
});

// A restore is itself recorded, and must describe what IT did - not repeat the
// restored row's own before/after, which is a different change and, after two
// restores, a false one.
test('the appended rows describe the restore, not the row restored', () => {
  const server = read('server/models/changeHistory.js');
  const method = restoreMethod(server);
  assert.match(method, /const displaced = await currentContentOf\(row\)/,
    'the live value has to be read BEFORE the write');
  assert.match(method, /previousContent: displaced/);
  assert.match(method, /newContent: restoredContent/);
  assert.doesNotMatch(method, /previousContent: row\.newContent/,
    'that was the old wiring, and it recorded the opposite of what happened');
});

console.log(`historyRestoreAppliesWhatIsShown: ${passed} tests passed`);
