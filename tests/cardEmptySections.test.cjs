'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const jade = fs.readFileSync('client/components/cards/cardDetails.jade', 'utf8');
for (const [name, condition] of [
  ['Dates', 'currentBoard.hasAnyAllowsDate'],
  ['Members', 'currentBoard.hasAnyAllowsUser'],
  ['Sort', 'hasVisibleSortFields'],
]) {
  const block = jade.split(`template(name="cardFieldSection${name}")`)[1].split('\ntemplate(')[0];
  assert.ok(block.startsWith(`\n  if ${condition}\n`));
  assert.match(block, /\n      \.card-details-group/);
  assert.match(block, /\n        hr.card-details-section-rule/);
}
const js = fs.readFileSync('client/components/cards/cardDetails.js', 'utf8');
let helpers;
// The gate reads the card's own view of the board (cardAddFields.js
// cardBoardView, docs/Features/Cards/Card-Fields.md), as the fields inside do;
// here that view is the board the card gives.
vm.runInNewContext(js.match(/Template\.cardFieldSectionSort\.helpers\([\s\S]*?\n\}\);/)[0], {
  Template: { cardFieldSectionSort: { helpers: h => { helpers = h; } } },
  cardBoardView: card => card.board(),
});
const visible = (board, spent = 0) => helpers.hasVisibleSortFields.call({
  board: () => board, getSpentTime: () => spent,
});
assert.equal(visible({}), false);
assert.equal(visible(null), false);
// Spent time: the card's view of the board already reads allowsSpentTime false
// when the card has no hours and did not tick it "On this card"; ticked, the
// empty field is shown to be filled in (docs/Features/Cards/Card-Fields.md).
assert.equal(visible({ allowsSpentTime: true }), true, 'shown when the card\'s view allows it, hours or not');
assert.equal(visible({ allowsSpentTime: true }, 5), true);
assert.equal(visible({ allowsSpentTime: false }, 5), false, 'not when the view says no');
for (const field of ['allowsCardSortingByNumber', 'allowsShowLists', 'allowsFlowtime', 'allowsPomodoro']) {
  assert.equal(visible({ [field]: true }), true, `${field} alone retains the section`);
  assert.equal(visible({ [field]: false }), false);
}
console.log('Hidden card fields leave no empty group separators');
