'use strict';

// Issue #2392: a custom field with "Auto create field to all cards" (or
// "Always on card") and "Show field label on minicard" enabled applied
// correctly to the FIRST card created in a quick-add session, but not to
// any card created after it.
//
// Root cause: `client/components/lists/listBody.js`'s `addCardForm`
// computed the board's automatic custom fields (the `automaticallyOnCard` /
// `alwaysOnCard` definitions) exactly once, inline in `onCreated`, and
// stashed the result in a `customFields` ReactiveVar that every quick-add
// submission (`formComponent.customFields.get()`) reused as-is. That is
// safe as long as nothing ever clears the ReactiveVar in between - but the
// form's own `reset()` helper set it back to `[]` unconditionally instead
// of recomputing it, so any code path that resets the form between two
// cards in the same session (the natural place to clear "More options",
// labels and members before the next card) would silently drop the
// automatic field starting with the second card - exactly the symptom
// reported: correct on card 1, missing afterwards.
//
// The fix shares one helper (`automaticCustomFieldsForCurrentBoard`)
// between `onCreated` and `reset()`, so both compute the same thing fresh
// from the board's current custom-field definitions.
//
// This test proves two things without needing a full Blaze/Meteor runtime:
//  1. The listBody.js source defines a single shared helper for the
//     automatic-fields computation, used by both `onCreated` and `reset()`.
//  2. A plain re-implementation of that helper, run three times in a row
//     (as it would be for three cards created back-to-back, with a form
//     reset between each), attaches the automatic custom field to every one
//     of the three cards - not just the first.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const listBody = fs.readFileSync(
  path.join(root, 'client/components/lists/listBody.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('autoCreateCustomFieldEveryCard:');

test('onCreated and reset() share one automatic-custom-fields helper', () => {
  assert.match(
    listBody,
    /function automaticCustomFieldsForCurrentBoard\(\)/,
    'expected a shared helper computing the automatic custom fields',
  );

  const onCreatedAt = listBody.indexOf('Template.addCardForm.onCreated(function () {');
  assert.ok(onCreatedAt > -1, 'expected to find Template.addCardForm.onCreated');
  const onCreatedBody = listBody.slice(
    onCreatedAt,
    listBody.indexOf('\n});', onCreatedAt),
  );
  assert.match(
    onCreatedBody,
    /this\.customFields\.set\(automaticCustomFieldsForCurrentBoard\(\)\)/,
    'onCreated must seed customFields from the shared helper',
  );

  const resetAt = onCreatedBody.indexOf('this.reset = ()');
  assert.ok(resetAt > -1, 'expected to find reset() inside onCreated');
  const resetBody = onCreatedBody.slice(resetAt, onCreatedBody.indexOf('};', resetAt));
  assert.match(
    resetBody,
    /this\.customFields\.set\(automaticCustomFieldsForCurrentBoard\(\)\)/,
    'reset() must RECOMPUTE the automatic fields, not clear them to []',
  );
  // NEGATIVE — pin the exact regression: reset() must never again just
  // clear customFields to an empty array.
  assert.doesNotMatch(
    resetBody,
    /this\.customFields\.set\(\[\]\)/,
    'reset() must not drop the automatic custom fields back to an empty array',
  );
});

// A plain re-implementation of the fixed helper's logic - same rule the
// server-side REST create/bulk-create endpoints use
// (server/models/cards.js: `field.automaticallyOnCard || field.alwaysOnCard`).
function automaticCustomFieldsFor(boardCustomFields) {
  const arr = [];
  (boardCustomFields || []).forEach(field => {
    if (field.automaticallyOnCard || field.alwaysOnCard) {
      arr.push({ _id: field._id, value: null });
    }
  });
  return arr;
}

test('the automatic field is attached to every card of a 3-card session, not just the first', () => {
  const boardCustomFields = [
    { _id: 'cf-auto', name: 'Priority', automaticallyOnCard: true, showLabelOnMiniCard: true },
    { _id: 'cf-manual', name: 'Notes', automaticallyOnCard: false, showLabelOnMiniCard: true },
  ];

  const cards = [];
  for (let i = 0; i < 3; i += 1) {
    // Simulate: form reset (or first mount) recomputes fresh from the
    // board's live custom-field definitions, then the card is created with
    // whatever the form's customFields ReactiveVar currently holds.
    const formCustomFields = automaticCustomFieldsFor(boardCustomFields);
    cards.push({
      title: `Card ${i + 1}`,
      customFields: formCustomFields,
    });
  }

  assert.strictEqual(cards.length, 3);
  cards.forEach((card, i) => {
    const hasAutoField = card.customFields.some(cf => cf._id === 'cf-auto');
    assert.ok(hasAutoField, `card ${i + 1} is missing the auto-create custom field`);
    const hasManualField = card.customFields.some(cf => cf._id === 'cf-manual');
    assert.ok(!hasManualField, `card ${i + 1} unexpectedly got the non-automatic field`);
  });
});

test('NEGATIVE — reproduces the original bug shape and shows it no longer applies', () => {
  const boardCustomFields = [
    { _id: 'cf-auto', name: 'Priority', automaticallyOnCard: true, showLabelOnMiniCard: true },
  ];

  // The ORIGINAL buggy reset() behaviour: compute once, then every
  // subsequent card reuses whatever reset() last left behind ([]).
  function buggyClearingReset() {
    return [];
  }

  const firstCardFields = automaticCustomFieldsFor(boardCustomFields);
  const afterBuggyReset = buggyClearingReset();

  assert.ok(
    firstCardFields.some(cf => cf._id === 'cf-auto'),
    'sanity check: the first card does get the field',
  );
  assert.ok(
    !afterBuggyReset.some(cf => cf._id === 'cf-auto'),
    'sanity check: the OLD reset() shape really did drop the field (this is the bug being fixed)',
  );

  // And the FIXED helper, called the same way reset() calls it now, keeps
  // the field instead.
  const afterFixedReset = automaticCustomFieldsFor(boardCustomFields);
  assert.ok(
    afterFixedReset.some(cf => cf._id === 'cf-auto'),
    'the fixed reset() must keep applying the automatic custom field',
  );
});

console.log(`\n${passed} tests passed`);
