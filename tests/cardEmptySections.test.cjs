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
vm.runInNewContext(js.match(/Template\.cardFieldSectionSort\.helpers\([\s\S]*?\n\}\);/)[0], {
  Template: { cardFieldSectionSort: { helpers: h => { helpers = h; } } },
});
const visible = (board, spent = 0) => helpers.hasVisibleSortFields.call({
  board: () => board, getSpentTime: () => spent,
});
assert.equal(visible({}), false);
assert.equal(visible(null), false);
assert.equal(visible({ allowsSpentTime: true }), false, 'no empty spent-time section');
assert.equal(visible({ allowsSpentTime: true }, 5), true);
assert.equal(visible({ allowsSpentTime: false }, 5), false);
for (const field of ['allowsCardSortingByNumber', 'allowsShowLists', 'allowsFlowtime', 'allowsPomodoro']) {
  assert.equal(visible({ [field]: true }), true, `${field} alone retains the section`);
  assert.equal(visible({ [field]: false }), false);
}
console.log('Hidden card fields leave no empty group separators');
