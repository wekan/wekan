'use strict';

// Plain-Node regression guard (no Meteor) for issue #3626, sub-request 3:
// "add an EXISTING card as a subtask of the current card, directly from the
// parent card's Subtasks UI" (search/pick), instead of only being able to
// create a brand-new subtask card.
//
// Source-level checks only (no Meteor runtime here): confirm the new
// "Add existing card as subtask" popup exists, that picking a result reuses
// the EXACT existing `setParentId` method (the same one every other
// re-parenting call site uses, with its #3328 cycle guard) rather than a new
// bespoke method, and that it does not create a new card the way
// `addSubtaskCard` does. Run: node tests/addExistingCardAsSubtask3626.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const jadeSrc = fs.readFileSync(
  path.join(repoRoot, 'client/components/cards/subtasks.jade'),
  'utf8',
);
const jsSrc = fs.readFileSync(
  path.join(repoRoot, 'client/components/cards/subtasks.js'),
  'utf8',
);
const cardsSrc = fs.readFileSync(path.join(repoRoot, 'models/cards.js'), 'utf8');
const enI18n = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function extractMethod(src, name) {
  const m = src.match(new RegExp(`(?:async )?${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\},`));
  assert.ok(m, `${name} found`);
  return m[0];
}

// --- The UI affordance exists ----------------------------------------------

test('the Subtasks section has an "add existing card" trigger alongside "add a new subtask"', () => {
  assert.match(jadeSrc, /js-add-existing-subtask/, 'a trigger element with this class exists');
  // It lives inside the same `if canModifyCard` block as the existing
  // "add a new subtask" affordance, not gated behind something else.
  const canModifyBlock = jadeSrc.slice(jadeSrc.indexOf('if canModifyCard'));
  assert.match(canModifyBlock.slice(0, canModifyBlock.indexOf('template(name="subtaskDetail"')), /js-add-existing-subtask/);
});

test('the popup template used to pick an existing card is registered', () => {
  assert.match(jadeSrc, /template\(name="addExistingSubtaskPopup"\)/);
  assert.match(jadeSrc, /js-select-existing-subtask/, 'each search result is selectable');
});

test('clicking the trigger opens that exact popup (Popup.open("addExistingSubtask"))', () => {
  assert.match(jsSrc, /'click \.js-add-existing-subtask'[\s\S]{0,120}Popup\.open\('addExistingSubtask'\)/);
});

// --- It reuses setParentId, the exact existing re-parenting method --------

test('picking a card calls targetCard.setParentId(...), not a new bespoke method', () => {
  const handler = jsSrc.slice(
    jsSrc.indexOf("'click .js-select-existing-subtask'"),
    jsSrc.indexOf('});', jsSrc.indexOf("'click .js-select-existing-subtask'")),
  );
  assert.match(handler, /targetCard\.setParentId\(parentId\)/);
});

test('picking a card does NOT create a new card (no addSubtaskCard / Cards.insert call)', () => {
  const handler = jsSrc.slice(
    jsSrc.indexOf("'click .js-select-existing-subtask'"),
    jsSrc.indexOf('});', jsSrc.indexOf("'click .js-select-existing-subtask'")),
  );
  assert.ok(!/addSubtaskCard/.test(handler), 'must not call the card-creating server method');
  assert.ok(!/Cards\.insert/.test(handler), 'must not insert a new card document');
});

test('picking a card sets ONLY the parent link -- no other field of the target card is touched', () => {
  const handler = jsSrc.slice(
    jsSrc.indexOf("'click .js-select-existing-subtask'"),
    jsSrc.indexOf('});', jsSrc.indexOf("'click .js-select-existing-subtask'")),
  );
  // The only mutating call on targetCard in this handler is setParentId.
  const mutatingCalls = [...handler.matchAll(/targetCard\.(\w+)\(/g)].map(m => m[1]);
  assert.deepStrictEqual(mutatingCalls, ['setParentId']);
});

test('setParentId itself (models/cards.js) still has its #3328 cycle guard', () => {
  const fn = extractMethod(cardsSrc, 'setParentId');
  assert.ok(fn.includes('wouldCreateCycle'), 'cycle protection must still gate every caller, including this new one');
});

// --- Candidate search excludes anything setParentId would refuse anyway ----

test('the candidate list helper filters out ancestors of the current card up front', () => {
  const helper = jsSrc.slice(
    jsSrc.indexOf('function existingSubtaskCandidatesFor'),
    jsSrc.indexOf('\n}\n', jsSrc.indexOf('function existingSubtaskCandidatesFor')),
  );
  assert.match(helper, /parentId/, 'walks parentId chain');
  assert.match(helper, /cardId/);
});

// --- i18n ---------------------------------------------------------------

test('the new action label exists in en.i18n.json, in the order Subtasks UI keys use', () => {
  assert.strictEqual(enI18n['add-existing-card-as-subtask'], 'Add Existing Card as Subtask');
  const keys = Object.keys(enI18n);
  assert.strictEqual(
    keys[keys.indexOf('add-subtask') + 1],
    'add-existing-card-as-subtask',
    'inserted right after add-subtask, so every locale file agrees on where it sits',
  );
});

console.log(`\n${passed} tests passed`);
