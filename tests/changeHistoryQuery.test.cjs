'use strict';

// Guard: the universal change history's query rules.
// Run: node tests/changeHistoryQuery.test.cjs
//
// docs/Features/Reports/History/History.md §6 and its appendix: the paging,
// search and selection logic is kept pure so it can be tested without Meteor or
// a database, "à la models/lib/undoRedoSelection.js". This is that test.
//
// Two of these rules are security, not ergonomics. A scope resolves to the id
// column a row is filtered by, so getting it wrong shows one board's history
// under another board's menu; and a selection that does not normalise its input
// is a restore that applies the wrong rows. Both are silent when wrong.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const {
  scopeSelector, matchesSearch, selectionToIds, SCOPES, SCOPE_COLUMN,
} = require(path.join(ROOT, 'models', 'lib', 'changeHistoryQuery'));

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

// ---- scope -> selector -------------------------------------------------------

test('each container scope filters on its own id column', () => {
  assert.deepEqual(scopeSelector({ scope: 'board', scopeId: 'b1' }), { boardId: 'b1' });
  assert.deepEqual(scopeSelector({ scope: 'swimlane', scopeId: 's1' }), { swimlaneId: 's1' });
  assert.deepEqual(scopeSelector({ scope: 'list', scopeId: 'l1' }), { listId: 'l1' });
  assert.deepEqual(scopeSelector({ scope: 'card', scopeId: 'c1' }), { cardId: 'c1' });
  assert.deepEqual(SCOPES.sort(), ['board', 'card', 'list', 'swimlane']);
});

// Scopes NEST: a card's history is inside its list's, inside its swimlane's,
// inside the board's. That works only because the write side stamps every
// container id on every row, so the read side is one equality rather than a
// join the database cannot do. If a row ever stops carrying them, a swimlane's
// history silently loses its cards' rows.
test('nesting is what the id columns buy, and every scope has one', () => {
  for (const scope of SCOPES) {
    const column = SCOPE_COLUMN[scope];
    assert.ok(column, `${scope} must map to an id column`);
    assert.deepEqual(scopeSelector({ scope, scopeId: 'x' }), { [column]: 'x' });
  }
});

test('group, user and entity narrow a scope rather than replace it', () => {
  assert.deepEqual(
    scopeSelector({ scope: 'card', scopeId: 'c1', group: 'description' }),
    { cardId: 'c1', group: 'description' });
  assert.deepEqual(
    scopeSelector({ scope: 'board', scopeId: 'b1', userId: 'u1' }),
    { boardId: 'b1', userId: 'u1' });
  assert.deepEqual(
    scopeSelector({ scope: 'card', scopeId: 'c1', group: 'checklists', userId: 'u1' }),
    { cardId: 'c1', group: 'checklists', userId: 'u1' });
  assert.deepEqual(
    scopeSelector({ entityType: 'checklist', entityId: 'k1' }),
    { entityType: 'checklist', entityId: 'k1' });
});

test('the Member view is a bare userId, with no scope at all', () => {
  assert.deepEqual(scopeSelector({ userId: 'u1' }), { userId: 'u1' });
});

// Negative: a selector that silently matches everything is the whole log handed
// to whoever asked. An unknown or half-given scope must be an error.
test('a scope that does not resolve is refused, never widened (negative)', () => {
  assert.throws(() => scopeSelector({ scope: 'everything', scopeId: 'x' }), /unknown scope/);
  assert.throws(() => scopeSelector({ scope: 'board' }), /needs a scopeId/);
  assert.throws(() => scopeSelector({ scope: 'card', scopeId: '' }), /needs a scopeId/);
  assert.throws(() => scopeSelector({ scopeId: 'b1' }), /without a scope/);
});

test('no request at all is an empty selector, and the caller must not run it', () => {
  // The server refuses this case explicitly ('Ask for a scope or a user'); the
  // helper stays honest about what it was given rather than inventing a filter.
  assert.deepEqual(scopeSelector({}), {});
  assert.deepEqual(scopeSelector(), {});
});

// ---- search ------------------------------------------------------------------

const ROW = {
  changeType: 'edited',
  group: 'description',
  entityType: 'card',
  previousContent: { text: 'Buy milk' },
  newContent: { text: 'Buy oat milk and bread' },
};

test('search looks inside the content, case-insensitively', () => {
  assert.equal(matchesSearch(ROW, 'oat'), true);
  assert.equal(matchesSearch(ROW, 'OAT MILK'), true);
  assert.equal(matchesSearch(ROW, 'bread'), true);
  assert.equal(matchesSearch(ROW, 'Buy milk'), true, 'the previous value is searchable too');
  assert.equal(matchesSearch(ROW, 'description'), true, 'so is the group');
  assert.equal(matchesSearch(ROW, 'edited'), true, 'and the change type');
  assert.equal(matchesSearch(ROW, 'wine'), false);
});

test('an empty search matches everything', () => {
  for (const term of ['', '   ', null, undefined]) {
    assert.equal(matchesSearch(ROW, term), true, JSON.stringify(term));
  }
});

// A date change is a number until something renders it. If search only looked
// at strings, "the value I can see on screen is not findable" would follow.
test('numbers, booleans and dates in the content are searchable', () => {
  const when = new Date('2026-09-04T12:00:00.000Z');
  const row = {
    changeType: 'edited', group: 'dates',
    newContent: { millis: 1757000000000, allDay: true, at: when },
  };
  assert.equal(matchesSearch(row, '1757000000000'), true);
  assert.equal(matchesSearch(row, 'true'), true);
  assert.equal(matchesSearch(row, '2026-09-04'), true);
});

test('nested and array content is searchable, to a bounded depth', () => {
  const row = { changeType: 'edited', newContent: { items: [{ title: 'needle' }] } };
  assert.equal(matchesSearch(row, 'needle'), true);

  // A blackbox field is whatever a caller put in it, so a cyclic or very deep
  // object must not be able to hang the server.
  const deep = { a: { b: { c: { d: { e: { f: 'far too deep' } } } } } };
  assert.equal(matchesSearch({ changeType: 'edited', newContent: deep }, 'far too deep'), false);
  const cyclic = { name: 'top' };
  cyclic.self = cyclic;
  assert.equal(matchesSearch({ changeType: 'edited', newContent: cyclic }, 'top'), true);
});

test('a missing row never matches (negative)', () => {
  assert.equal(matchesSearch(null, 'anything'), false);
  assert.equal(matchesSearch(undefined, 'anything'), false);
});

// ---- selection ---------------------------------------------------------------

test('a selection is accepted as a Set, an array or a checked map', () => {
  assert.deepEqual(selectionToIds(new Set(['a', 'b'])), ['a', 'b']);
  assert.deepEqual(selectionToIds(['a', 'b']), ['a', 'b']);
  assert.deepEqual(selectionToIds({ a: true, b: true, c: false }), ['a', 'b']);
  assert.deepEqual(selectionToIds('a'), ['a']);
});

// Order and uniqueness are not cosmetic: a multi-row restore applies oldest to
// newest and must not apply the same row twice (History.md §8.4).
test('duplicates are dropped and order is kept', () => {
  assert.deepEqual(selectionToIds(['b', 'a', 'b', 'a']), ['b', 'a']);
});

test('junk in a selection is dropped, not restored (negative)', () => {
  assert.deepEqual(selectionToIds([null, '', 0, false, {}, [], 'ok']), ['ok']);
  assert.deepEqual(selectionToIds(null), []);
  assert.deepEqual(selectionToIds(undefined), []);
  assert.deepEqual(selectionToIds(123), []);
  assert.deepEqual(selectionToIds({}), []);
});

// ---- the store keeps the promises the snap merge depends on ------------------

// History.md §9a: two copies of a database are mergeable only because history is
// append-only and its ids are never reused. If a row could be updated in place,
// the merge would have to choose between two versions of it, which is exactly
// what §9a says it must never have to do.
test('rows are append-only apart from the undo flag', () => {
  const model = fs.readFileSync(path.join(ROOT, 'models', 'changeHistory.js'), 'utf8');
  const server = fs.readFileSync(path.join(ROOT, 'server', 'models', 'changeHistory.js'), 'utf8');
  const updates = [...server.matchAll(/ChangeHistory\.updateAsync\([^;]*?\$set: \{([^}]*)\}/gs)]
    .map(m => m[1].trim());
  assert.ok(updates.length > 0, 'the undo/redo stack does flip a flag');
  for (const fields of updates) {
    assert.match(fields, /^undone:/,
      `only the undo flag may be updated in place, found: ${fields}`);
    assert.doesNotMatch(fields, /previousContent|newContent|userId|createdAt|entityId/,
      'content, authorship and time are immutable once written');
  }
  assert.doesNotMatch(model, /ChangeHistory\.update/,
    'the collection itself must not offer an update path');
});

// The one deletion the spec allows, and the reason for it: a superseded redo
// entry must never be able to re-apply stale content over newer work.
test('the only rows ever removed are a superseded redo stack', () => {
  const model = fs.readFileSync(path.join(ROOT, 'models', 'changeHistory.js'), 'utf8');
  const removals = [...model.matchAll(/removeAsync\(([^)]*)\)/g)].map(m => m[1]);
  assert.deepEqual(removals, ["{ userId, boardId, undone: true }"],
    'a history that can be removed for any other reason is not append-only');
});

test('the snap merge list knows about the collection', () => {
  const chooser = fs.readFileSync(
    path.join(ROOT, 'snap-src', 'bin', 'database-choose.mjs'), 'utf8');
  const list = /const MERGE_COLLECTIONS = \[([\s\S]*?)\];/.exec(chooser);
  assert.ok(list, 'database-choose.mjs must still define MERGE_COLLECTIONS');
  assert.match(list[1], /'changeHistory'/,
    'History.md §9a.4: the list is the only place the snap learns which ' +
    'collections carry history, so a row written on the copy that is not ' +
    'served would be stranded');
});

console.log(`changeHistoryQuery: ${passed} tests passed`);
