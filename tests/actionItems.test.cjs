'use strict';

// Action items from a comment or a description (docs/Features/Cards/Action-Items.md).
//
// Run: node tests/actionItems.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { actionItems } = require('../models/lib/actionItems.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('actionItems:');

test('the four line shapes of the guide', () => {
  const got = actionItems('Notes\nTODO: Book the venue\n- [ ] Order the badges\n@alice Send the agenda\nTODO: @bob Check the budget', ['alice', 'bob']);
  assert.deepStrictEqual(got, [
    { title: 'Book the venue', username: null },
    { title: 'Order the badges', username: null },
    { title: 'Send the agenda', username: 'alice' },
    { title: 'Check the budget', username: 'bob' },
  ]);
});

test('a mention of a non-member stays in the title; code and prose are not items (negative)', () => {
  assert.deepStrictEqual(actionItems('@mallory Steal the keys', ['alice']), [{ title: '@mallory Steal the keys', username: null }]);
  assert.deepStrictEqual(actionItems('We discussed TODO lists\n```\nTODO: in code\n```\n- [x] done already\nmail me@alice.example'), []);
  assert.deepStrictEqual(actionItems(''), []);
});

test('the comment and the card menu offer it behind Board Settings / Card; cards go to the top of the list', () => {
  assert.match(read('client/components/activities/comments.jade'), /if actionItemsOf this\n\s+= ' - '\n\s+a\.js-comment-action-items/);
  // In the card menu's Set color / Drawing group (tests/cardActionsOrder.test.cjs),
  // which is for who may change the card.
  assert.match(read('client/components/cards/cardDetails.jade'), /if canModifyCard\n\s+unless currentUser\.isWorker\n[\s\S]{0,700}if actionItemsOf this\n\s+li\n\s+a\.js-description-action-items/);
  const js = read('client/components/cards/fromText.js');
  assert.match(js, /boardFlagOn\('allowsActionItemsOnCard', card\.boardId\)/);
  assert.match(js, /const members = board && board\.activeMembers \? board\.activeMembers\(\) : \[\];/, 'only active members become members');
  assert.match(js, /let sort = first && typeof first\.sort === 'number' \? first\.sort - 1 : 0;/);
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');
  assert.ok(CARD_SETTINGS_ROWS.find(r => r.key === 'actionItems').card.field === 'allowsActionItemsOnCard');
});

console.log(`\nactionItems: ${passed} tests passed`);
