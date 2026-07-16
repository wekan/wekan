'use strict';

// Plain-Node regression guard (no Meteor) for issue #6472: rules with
// actionType moveCardToTop / moveCardToBottom did nothing.
// Run: node tests/ruleMoveAction.test.cjs
//
// Five silent bugs (the activity hook swallows rule-action errors):
//  1. an unresolved destination list crashed on list.cardsUnfiltered — now the
//     action falls back to the card's CURRENT list (staying on the card's own
//     board and swimlane),
//  2. the classic wizard's generic "move to top/bottom" stored listTitle,
//     which the rule engine never reads (it reads listName),
//  3. an empty destination made Math.min()/Math.max() of nothing write a
//     corrupt sort of +/-Infinity,
//  4. the rules JSON/CSV import created rules with raw client inserts that
//     the board-admin-only allow rules reject into minimongo limbo — and a
//     trigger document missing a matching field (e.g. userId) can never
//     match, since the matcher queries every field with {$in: [value, '*']},
//  5. rules.createRule let an empty boardId ('') from a not-yet-loaded board
//     selector override the real board.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const rulesHelper = read('server/rulesHelper.js');
const boardActions = read('client/components/rules/actions/boardActions.js');
const importExport = read('client/components/rules/rulesImportExport.js');
const rulesButton = read('server/rulesButton.js');
const lists = read('models/lists.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- Bug 1: unresolved list must not crash ----------------------------------

test('unresolved listName falls back to the card’s current list', () => {
  assert.ok(rulesHelper.includes('let fellBackToCardList = false;'));
  assert.ok(/if \(!list\) \{[\s\S]*?list = await card\.list\(\);[\s\S]*?fellBackToCardList = true;/.test(rulesHelper));
});

test('fallback move stays on the card’s own board and swimlane', () => {
  assert.ok(/if \(fellBackToCardList\) \{\s*\n\s*destBoardId = list\.boardId;\s*\n\s*swimlaneId = card\.swimlaneId;/.test(rulesHelper));
});

test('negative: the crashing unguarded pattern is gone', () => {
  // Old code: Math.min(...(await list.cardsUnfiltered(swimlaneId)).map(...))
  // dereferenced `list` (possibly undefined) and spread possibly-empty sorts.
  assert.ok(!/Math\.min\(\s*\.\.\.\(await list\.cardsUnfiltered/.test(rulesHelper));
  assert.ok(!/Math\.max\(\s*\.\.\.\(await list\.cardsUnfiltered/.test(rulesHelper));
});

// --- Bug 3: empty destination must not write sort +/-Infinity ---------------

test('destination sorts are filtered to finite numbers with a 0 fallback', () => {
  assert.ok(rulesHelper.includes('.filter(Number.isFinite)'));
  assert.ok(rulesHelper.includes('destSorts.length ? Math.min(...destSorts) : 0'));
  assert.ok(rulesHelper.includes('destSorts.length ? Math.max(...destSorts) : 0'));
});

test('behavior: the guarded min/max never produces Infinity', () => {
  // Same expressions as the fix, exercised directly.
  const top = (destSorts) => (destSorts.length ? Math.min(...destSorts) : 0) - 1;
  const bottom = (destSorts) => (destSorts.length ? Math.max(...destSorts) : 0) + 1;
  assert.strictEqual(top([]), -1);
  assert.strictEqual(bottom([]), 1);
  assert.strictEqual(top([5, 2, 9]), 1);
  assert.strictEqual(bottom([5, 2, 9]), 10);
  // negative: the OLD expressions did produce Infinity on empty input
  assert.strictEqual(Math.min(...[]), Infinity);
  assert.strictEqual(Math.max(...[]), -Infinity);
});

// --- Bug 2: wizard field names -----------------------------------------------

test('generic move wizard stores listName/swimlaneName wildcards', () => {
  assert.ok(/listName: '\*',\s*\n\s*swimlaneName: '\*',/.test(boardActions));
});

test('negative: no action is created with the unread listTitle field', () => {
  // (the word may appear in comments; only the actual object property matters)
  assert.ok(!/^\s*listTitle: '\*',$/m.test(boardActions));
});

test('rule engine treats a MISSING listName like the * wildcard', () => {
  assert.ok(/if \(action\.listName === '\*' \|\| !action\.listName\) \{/.test(rulesHelper),
    'old wizard rules with only listTitle stored must still work');
});

// --- Bug 4: JSON/CSV import ---------------------------------------------------

test('import creates rules via the rules.createRule server method', () => {
  assert.ok(/Meteor\.call\(\s*\n?\s*'rules\.createRule',/.test(importExport));
  assert.ok(!/Triggers\.insert\(/.test(importExport), 'no raw client trigger inserts');
  assert.ok(!/Actions\.insert\(/.test(importExport), 'no raw client action inserts');
  assert.ok(!/Rules\.insert\(/.test(importExport), 'no raw client rule inserts');
});

// Extract and exercise the real normalizeTrigger from the import module.
const fieldsSrc = importExport.match(/const TRIGGER_MATCHING_FIELDS = \[[\s\S]*?\];/);
const fnSrc = importExport.match(/function normalizeTrigger\(trigger\) \{[\s\S]*?\n\}/);
assert.ok(fieldsSrc && fnSrc, 'normalizeTrigger and its field list found');
// eslint-disable-next-line no-new-func
const normalizeTrigger = new Function(
  `${fieldsSrc[0]}\n${fnSrc[0]}\nreturn normalizeTrigger;`,
)();

test('import defaults missing trigger matching fields to the * wildcard', () => {
  const out = normalizeTrigger({ activityType: 'completeChecklist', checklistName: 'Done' });
  assert.strictEqual(out.userId, '*', 'a JSON trigger without userId must still match');
  assert.strictEqual(out.listName, '*');
  assert.strictEqual(out.swimlaneName, '*');
  assert.strictEqual(out.checklistName, 'Done', 'explicit values are kept');
  assert.strictEqual(out.activityType, 'completeChecklist');
});

test('negative: explicit trigger values are never overwritten', () => {
  const out = normalizeTrigger({ activityType: 'createCard', userId: 'abc', cardTitle: 'T' });
  assert.strictEqual(out.userId, 'abc');
  assert.strictEqual(out.cardTitle, 'T');
});

test('empty-string trigger values become the wildcard too', () => {
  const out = normalizeTrigger({ activityType: 'createCard', userId: '' });
  assert.strictEqual(out.userId, '*');
});

// --- Bug 5: empty boardId in rules.createRule --------------------------------

test('rules.createRule falls back when the action posts an empty boardId', () => {
  assert.ok(rulesButton.includes('if (!actionDoc.boardId) actionDoc.boardId = boardId;'));
});

// --- Companion fix: server-side orphaned-cards fallback actually resolves ----

test('List.orphanedCardsSwimlaneIds resolves the async server lookup', () => {
  const fn = lists.match(/orphanedCardsSwimlaneIds\(swimlaneId\) \{[\s\S]*?\n  \},/);
  assert.ok(fn, 'orphanedCardsSwimlaneIds found');
  assert.ok(fn[0].includes("typeof swimlanes.then === 'function'"),
    'server Promise from ReactiveCache.getSwimlanes must be awaited, not read synchronously');
});

console.log(`\n${passed} tests passed`);
