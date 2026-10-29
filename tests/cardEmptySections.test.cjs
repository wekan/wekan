'use strict';
// Hidden card fields leave no empty section on the opened card.
//
// 2026-10-28: the opened card draws Card Settings' sections, and the gate of
// each is one function, cardDetails.js cardSectionHasContent, instead of an
// `if` at the top of each group template (Dates, Members, Sort - the Sort group
// is gone, split into Card and Time). This suite pins that gate: a section
// whose fields the card's view of the board all turns off is not listed, so
// it draws no heading and no rule.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const js = fs.readFileSync('client/components/cards/cardDetails.js', 'utf8');
const src = js.match(/function cardSectionHasContent\([\s\S]*?\n\}\n/)[0];
const ctx = {
  Utils: { canModifyCard: card => card.may !== false },
  ReactiveCache: { getCurrentUser: () => ({ isWorker: () => false }) },
  riskOf: card => card.risk || null,
  cardHasButtons: card => Boolean(card.buttons),
  cardSectionFields: () => ['scrumSprint'],
  require: () => ({ boardAllows: (board, key) => Boolean(board.scrum && board.scrum[key]) }),
};
vm.runInNewContext(`${src}\nthis.has = cardSectionHasContent;`, ctx);
const has = (board, id, card = {}) => ctx.has(card, board, id);

assert.equal(has(null, 'date'), false, 'no board, nothing');
assert.equal(has({}, 'date'), false, 'Date with no date allowed');
assert.equal(has({ allowsDueDate: true }, 'date'), true);
assert.equal(has({ allowsAtRiskOnCard: true }, 'date', { risk: { text: 'x' } }), true, 'At risk alone keeps Date');
assert.equal(has({ allowsAtRiskOnCard: false }, 'date', { risk: { text: 'x' } }), false);
assert.equal(has({}, 'members'), false);
assert.equal(has({ allowsAssignedBy: true }, 'members'), true);
// Card: the old Dependencies section and the first half of the old Sort group.
assert.equal(has({}, 'card'), false, 'Card with nothing of its own');
for (const field of ['allowsDependencies', 'allowsCardSortingByNumber', 'allowsShowLists']) {
  assert.equal(has({ [field]: true }, 'card'), true, `${field} alone retains Card`);
}
assert.equal(has({ allowsCardButtonsOnCard: true }, 'card', { buttons: true }), true, 'card buttons, when there are some');
assert.equal(has({ allowsCardButtonsOnCard: true }, 'card', { buttons: false }), false);
// Time: the second half of the old Sort group. The card's view of the board
// already reads allowsSpentTime false when the card has no hours and did not
// tick it "On this card" (docs/Features/Cards/Card-Fields.md).
assert.equal(has({}, 'time'), false);
for (const field of ['allowsSpentTime', 'allowsFlowtime', 'allowsPomodoro']) {
  assert.equal(has({ [field]: true }, 'time'), true, `${field} alone retains Time`);
  assert.equal(has({ [field]: false }, 'time'), false);
}
assert.equal(has({}, 'labels'), false);
assert.equal(has({ allowsLocation: true }, 'labels'), true);
assert.equal(has({}, 'scrum'), false, 'Scrum without an allowed field (#6830)');
assert.equal(has({ scrum: { scrumSprint: true } }, 'scrum'), true);
assert.equal(has({ allowsCustomFields: true }, 'customFields', { may: false }), false, 'Custom Fields for a writer');
assert.equal(has({ allowsTextNotes: true }, 'attachments'), true, 'Text notes alone retain Attachments');
assert.equal(has({ allowsComments: true }, 'unknown'), false, 'an unknown section is never drawn');

// The loop draws one wrapper per listed section, and only listed sections.
const jade = fs.readFileSync('client/components/cards/cardDetails.jade', 'utf8');
assert.match(jade, /each section in orderedCardFieldSections\n\s+\.card-details-section\(data-card-section="\{\{section\}\}"/);
assert.match(js, /\.filter\(id => cardSectionHasContent\(card, board, id\)\)/);
console.log('Hidden card fields leave no empty section');
