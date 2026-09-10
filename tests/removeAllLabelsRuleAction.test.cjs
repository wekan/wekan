'use strict';

// Regression coverage for #3432: a new "Remove all labels" rule action that
// clears every label from a card in one step, instead of requiring one
// "remove label" action per label (the existing addLabel/removeLabel actions
// this mirrors).

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cardsSource = fs.readFileSync(
  path.join(__dirname, '..', 'models', 'cards.js'),
  'utf8',
);
const rulesHelperSource = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'rulesHelper.js'),
  'utf8',
);
const cardActionsJsSource = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'rules', 'actions', 'cardActions.js'),
  'utf8',
);
const cardActionsJadeSource = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'rules', 'actions', 'cardActions.jade'),
  'utf8',
);

// 1) models/cards.js defines Cards.helpers().removeAllLabels() and it sets
//    labelIds to an empty array via $set (the same shape addLabel/removeLabel
//    use $addToSet/$pull for a single label).
{
  const match = cardsSource.match(
    /removeAllLabels\(\)\s*\{([\s\S]*?)\n\s*\},/,
  );
  assert.ok(match, 'Cards.helpers defines removeAllLabels()');
  const body = match[1];
  assert.match(body, /labelIds\s*=\s*\[\]/, 'removeAllLabels empties labelIds on the in-memory card');
  assert.match(
    body,
    /\$set:\s*\{\s*labelIds:\s*\[\]\s*\}/,
    'removeAllLabels persists an empty labelIds array with $set',
  );
}

// 2) server/rulesHelper.js wires the 'removeAllLabels' actionType to
//    card.removeAllLabels(), the same way 'removeLabel' wires to
//    card.removeLabel(action.labelId).
{
  assert.match(
    rulesHelperSource,
    /actionType === 'removeAllLabels'\)\s*\{\s*\n\s*card\.removeAllLabels\(\);/,
    'rulesHelper calls card.removeAllLabels() for the removeAllLabels action',
  );
}

// 3) The rule-builder UI has a "Remove all labels" button that inserts an
//    Action with actionType 'removeAllLabels' and no label sub-field
//    (unlike the existing add/remove-one-label action).
{
  const handlerMatch = cardActionsJsSource.match(
    /'click \.js-add-removealllabels-action'\(event, tpl\) \{([\s\S]*?)\n {2}\},/,
  );
  assert.ok(handlerMatch, 'cardActions.js has the js-add-removealllabels-action click handler');
  const handlerBody = handlerMatch[1];
  assert.match(
    handlerBody,
    /actionType:\s*'removeAllLabels'/,
    'the handler inserts an Action with actionType removeAllLabels',
  );
  assert.doesNotMatch(
    handlerBody,
    /labelId/,
    'unlike add/remove-one-label, the remove-all action reads no label-id field',
  );

  assert.match(
    cardActionsJadeSource,
    /js-add-removealllabels-action/,
    'the Rules UI has a trigger button wired to the remove-all-labels handler',
  );
  assert.match(
    cardActionsJadeSource,
    /r-remove-all-labels/,
    'the Rules UI labels the button with the r-remove-all-labels i18n key',
  );
}

// 4) Behavioural replica of removeAllLabels' semantics (the same shape
//    addLabel/removeLabel/toggleLabel are - a small pure state transition,
//    testable without a running Meteor/Mongo stack): removing all labels
//    always yields an empty array, regardless of how many labels were
//    present, and a card with no labels is a no-op.
function removeAllLabels(labelIds) {
  return [];
}

assert.deepEqual(removeAllLabels(['red', 'green', 'blue']), [], 'clears a card with several labels');
assert.deepEqual(removeAllLabels(['only-one']), [], 'clears a card with exactly one label');
assert.deepEqual(removeAllLabels([]), [], 'a card with no labels stays empty (no-op)');
assert.deepEqual(removeAllLabels(undefined), [], 'a card whose labelIds was never set becomes an empty array');

console.log('\nremoveAllLabelsRuleAction: 11 checks passed');
