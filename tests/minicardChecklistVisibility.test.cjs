'use strict';

// Reported by email with a screenshot (Swedish): "Även om jag avmarkerar 'Visa på
// minikort' (och vill dölja checklistan på minikortet) så..." - even after
// unchecking "Show on minicard" for a checklist, the checklist stays on the
// minicard. The picture shows the switch off and the checklist there anyway.
// Run: node tests/minicardChecklistVisibility.test.cjs
//
// It was off for everybody, because the minicard asked
//
//     board.allowsChecklistsOnMinicard || checklist.showChecklistAtMinicard
//
// and the board flag defaults to TRUE. An OR cannot be argued with: while the
// board setting is on, no value of the checklist's own field changes the answer.
// The popup drew the switch from the raw field, which starts false - so it read
// OFF beside a checklist that was plainly showing, and clicking it wrote true and
// changed nothing visible. Clicking again wrote false and changed nothing either.
//
// The two settings are a DEFAULT and an OVERRIDE. That needs three states, which
// is why the field lost `defaultValue: false`: with every checklist born false,
// "hidden" and "not chosen" are the same value and an override cannot exist.
// Documents written under the old default carry a false that meant "follow the
// board", so the schema-upgrade step clears exactly those, once.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const {
  isChecklistShownAtMinicard,
  toggledChecklistAtMinicard,
} = require('../models/lib/minicardChecklistVisibility.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('minicardChecklistVisibility:');

test('an unset checklist follows the board, either way', () => {
  assert.strictEqual(isChecklistShownAtMinicard({}, true), true);
  assert.strictEqual(isChecklistShownAtMinicard({}, false), false);
  assert.strictEqual(isChecklistShownAtMinicard({ showChecklistAtMinicard: undefined }, true), true,
    'an explicitly undefined field is still "no opinion"');
});

test('the checklist overrides the board - which is the reported case', () => {
  // The board default is on, and this checklist says no. Before the fix the OR
  // ignored it and the checklist stayed on the minicard.
  assert.strictEqual(isChecklistShownAtMinicard({ showChecklistAtMinicard: false }, true), false,
    'unchecking "Show on minicard" has to hide it even while the board default is on');
  assert.strictEqual(isChecklistShownAtMinicard({ showChecklistAtMinicard: true }, false), true,
    'and the other direction still works: one checklist shown on a board that shows none');
});

test('the toggle flips what is on screen, not the stored field (negative)', () => {
  // The dead-toggle bug in one line: with the board default on and no opinion
  // stored, flipping the FIELD writes true - which is what it already looked like.
  assert.strictEqual(toggledChecklistAtMinicard({}, true), false,
    'a checklist that is showing must be hidden by the first click');
  assert.strictEqual(toggledChecklistAtMinicard({}, false), true,
    'and one that is hidden must be shown by it');
  assert.strictEqual(toggledChecklistAtMinicard({ showChecklistAtMinicard: false }, true), true);
  assert.strictEqual(toggledChecklistAtMinicard({ showChecklistAtMinicard: true }, true), false);
  // Two clicks return to where they started, whatever the board says.
  for (const boardAllows of [true, false]) {
    let checklist = {};
    checklist = { showChecklistAtMinicard: toggledChecklistAtMinicard(checklist, boardAllows) };
    const once = isChecklistShownAtMinicard(checklist, boardAllows);
    checklist = { showChecklistAtMinicard: toggledChecklistAtMinicard(checklist, boardAllows) };
    assert.strictEqual(isChecklistShownAtMinicard(checklist, boardAllows), boardAllows,
      'back to what the board says');
    assert.notStrictEqual(once, boardAllows, 'and the first click did change it');
  }
});

test('junk is not a decision (negative)', () => {
  // Only true and false are opinions. A string, a number or null is what a bad
  // import or an old REST client writes, and none of them may quietly mean "hide".
  for (const junk of [null, 0, 1, '', 'true', 'false', {}, []]) {
    assert.strictEqual(isChecklistShownAtMinicard({ showChecklistAtMinicard: junk }, true), true,
      `${JSON.stringify(junk)} is not an override, so the board default stands`);
    assert.strictEqual(isChecklistShownAtMinicard({ showChecklistAtMinicard: junk }, false), false);
  }
  assert.strictEqual(isChecklistShownAtMinicard(null, true), true, 'no checklist at all does not throw');
  assert.strictEqual(isChecklistShownAtMinicard(undefined, false), false);
});

test('the board flag is only a default: unset board setting hides nothing it should not', () => {
  // getMinicardFlag-style callers pass undefined when a board predates the field.
  assert.strictEqual(isChecklistShownAtMinicard({}, undefined), false,
    'no board answer and no checklist answer: not shown, rather than a crash');
  assert.strictEqual(isChecklistShownAtMinicard({ showChecklistAtMinicard: true }, undefined), true,
    'but an explicit checklist choice still stands on its own');
});

test('the schema no longer forces a default, and the model uses the shared rule', () => {
  const m = read('models/checklists.js');
  // Comments out first: the field's own comment explains what `defaultValue:
  // false` used to do, and that sentence is not a declaration.
  const at = m.indexOf('showChecklistAtMinicard: {');
  const field = m.slice(at, at + 1400)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  assert.ok(/optional: true/.test(field) && !/defaultValue: false/.test(field),
    'a stored false has to be able to mean "this one, hidden" - with a default ' +
    'every checklist is born hidden and the override cannot exist');
  assert.ok(/isChecklistShownAtMinicard/.test(m) && /toggledChecklistAtMinicard/.test(m),
    'the model asks the shared rule rather than keeping a second copy of it');
});

test('the minicard and the popup ask the same question', () => {
  const minicard = read('client/components/cards/minicard.js');
  assert.ok(/isChecklistShownAtMinicard\(checklist, currentBoard\.allowsChecklistsOnMinicard\)/
    .test(minicard),
    'the minicard must not go back to board || checklist - that OR is the bug');
  assert.ok(!/allowsChecklistsOnMinicard \|\| checklist\.showChecklistAtMinicard/.test(minicard),
    'and the old expression must be gone, not just bypassed');
  const checklistsJs = read('client/components/cards/checklists.js');
  assert.ok(/shownAtMinicard\(\)/.test(checklistsJs),
    'the popup needs a helper for the effective value; reading the raw field is ' +
    'what made the switch read OFF beside a visible checklist');
  assert.ok(/toggleShowChecklistAtMinicard\(boardAllowsChecklistsOnMinicard\(checklist\)\)/
    .test(checklistsJs),
    'and the click has to pass the board default, or the flip is of the field again');
  const jade = read('client/components/cards/checklists.jade');
  assert.ok(/if shownAtMinicard/.test(jade) && !/if checklist\.showChecklistAtMinicard/.test(jade),
    'the template draws the effective value');
});

console.log(`\nminicardChecklistVisibility: ${passed} tests passed`);
