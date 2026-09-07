'use strict';

// Plain-Node regression guard (no Meteor) for issue #6455: the "You have an
// unsaved description" warning could never be cleared by pressing Save.
// Run: node tests/cardDescriptionDraft.test.cjs
//
// Two bugs, both guarded here:
//  1. Closing the description editor only AVOIDED ADDING a draft when the text
//     matched the saved description; it never REMOVED a pre-existing
//     unsaved-edits record — so once the warning appeared, "View it" -> Save
//     could not clear it, only Discard could.
//  2. The comparison matched a per-line-whitespace-stripped draft against the
//     RAW stored description (or null when empty), so descriptions with
//     Markdown "  \n" hard-breaks re-created a phantom draft on every save.
//
// The behavioral part extracts the actual `normalize` arrow function from the
// component source and exercises it, so the test fails if the normalization
// semantics change; the structural part asserts the reset paths exist.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const cardDetails = read('client/components/cards/cardDetails.js');
const cardDescription = read('client/components/cards/cardDescription.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- Behavioral: the shared normalization used on BOTH sides ----------------

const normalizeSrc = cardDetails.match(
  /const normalize = (\(s\) => .*);/,
);
assert.ok(normalizeSrc, 'normalize arrow function found in cardDetails.js');
// eslint-disable-next-line no-new-func
const normalize = new Function(`return ${normalizeSrc[1]};`)();

test('normalize strips per-line trailing whitespace (Markdown hard breaks)', () => {
  assert.strictEqual(normalize('line one  \nline two\t\nend'), 'line one\nline two\nend');
});

test('normalize maps null/undefined (empty description) to empty string', () => {
  assert.strictEqual(normalize(null), '');
  assert.strictEqual(normalize(undefined), '');
});

test('normalize makes draft and hard-break description compare EQUAL (#6455 bug 2)', () => {
  const stored = 'first line  \nsecond';       // what setDescription saved (raw)
  const draftFromTextarea = 'first line\nsecond'; // what _getValue() produces
  assert.strictEqual(normalize(stored), normalize(draftFromTextarea));
});

test('negative: genuinely different drafts still compare UNEQUAL', () => {
  assert.notStrictEqual(normalize('alpha'), normalize('beta'));
  // internal (non-trailing) whitespace is content, not noise
  assert.notStrictEqual(normalize('a b'), normalize('ab'));
});

// --- Structural: the reset paths that were missing -------------------------

test('closing with a matching draft RESETS the record (bug 1 fix present)', () => {
  // The else-branch reset inside _close(); before #6455 only the set() existed.
  const closeBody = cardDetails.match(/this\._close = \(isReset = false\) => \{[\s\S]*?\n  \};/);
  assert.ok(closeBody, '_close found');
  assert.ok(
    closeBody[0].includes('UnsavedEdits.set(this._getUnsavedEditKey()'),
    'still saves a differing draft',
  );
  assert.ok(
    closeBody[0].includes('UnsavedEdits.reset(this._getUnsavedEditKey())'),
    '_close must reset the draft when it matches the saved description',
  );
});

test('both sides of the _close comparison are normalized the same way', () => {
  assert.ok(
    /draft !== normalize\(card\.getDescription\(\)\)/.test(cardDetails),
    'comparison must normalize getDescription(), not compare it raw',
  );
});

test('successful description save clears the draft explicitly (cardDetails.js)', () => {
  const submit = cardDetails.match(/async 'submit \.js-card-description'[\s\S]*?\n  \},/);
  assert.ok(submit, 'submit handler found');
  assert.ok(submit[0].includes('await card.setDescription(description);'));
  assert.ok(
    submit[0].includes("UnsavedEdits.reset({ fieldName: 'cardDescription', docId: card._id })"),
    'submit must remove the unsaved-edits record after a successful save',
  );
});

test('successful description save clears the draft explicitly (cardDescription.js)', () => {
  assert.ok(cardDescription.includes("import { UnsavedEdits } from '/client/lib/unsavedEdits';"));
  assert.ok(
    /await this\.setDescription\(description\);[\s\S]*?UnsavedEdits\.reset\(\{[\s\S]*?fieldName: 'cardComment'/.test(cardDescription) === false,
    'sanity: description form must reset the cardDescription draft, not cardComment',
  );
  assert.ok(
    /UnsavedEdits\.reset\(\{ fieldName: 'cardDescription', docId: this\._id \}\)/.test(cardDescription),
    'descriptionForm submit must remove the draft record',
  );
});

console.log(`\n${passed} tests passed`);
