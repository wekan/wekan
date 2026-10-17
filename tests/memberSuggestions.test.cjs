'use strict';

// Suggested members (docs/Features/Cards/Suggested-Members.md): the points,
// who is never suggested, and the popups that draw them.
//
// Run: node tests/memberSuggestions.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { suggestMembers } = require('../models/lib/memberSuggestions.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const card = { _id: 'c', labelIds: ['bug'], listId: 'todo', swimlaneId: 's1', members: ['carol'], assignees: [] };
const others = [
  { _id: 'o1', labelIds: ['bug'], listId: 'done', swimlaneId: 's2', members: ['alice'] },
  { _id: 'o2', labelIds: ['bug'], listId: 'todo', swimlaneId: 's1', assignees: ['alice'] },
  { _id: 'o3', labelIds: [], listId: 'todo', swimlaneId: 's2', members: ['bob'] },
  { _id: 'o4', labelIds: ['x'], listId: 'other', swimlaneId: 's9', members: ['dave'] },
  { _id: 'o5', labelIds: ['bug'], listId: 'todo', members: ['carol', 'eve'] },
  { _id: 'o6', labelIds: ['bug'], listId: 'todo', members: ['zed'], archived: true },
];
const active = ['alice', 'bob', 'carol', 'dave', 'eve', 'zed'];

console.log('memberSuggestions:');

test('the people of cards like this one, most points first', () => {
  const got = suggestMembers(card, others, active);
  assert.deepStrictEqual(got.map(s => s.userId), ['alice', 'eve', 'bob']);
  assert.strictEqual(got[0].points, 2 + 4, 'label (2) + label, list and swimlane (4)');
});

test('who is never suggested (negative)', () => {
  const got = suggestMembers(card, others, active).map(s => s.userId);
  assert.ok(!got.includes('carol'), 'already a member');
  assert.ok(!got.includes('dave'), 'nothing in common');
  assert.ok(!got.includes('zed'), 'only from open cards');
  assert.ok(!suggestMembers(card, others, ['bob']).some(s => s.userId === 'alice'), 'not an active member');
  // As assignees, a member of the card may still be suggested.
  assert.ok(suggestMembers({ ...card, members: [], assignees: ['alice'] }, others, active, { field: 'assignees' }).every(s => s.userId !== 'alice'));
  assert.deepStrictEqual(suggestMembers(null, others, active), []);
});

test('the Members and Assignees popups draw them, behind Board Settings / Card', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  assert.match(jade, /template\(name="cardMembersPopup"\)[\s\S]*?if suggestedMembers\.length[\s\S]*?a\.name\.js-select-member/);
  assert.match(jade, /template\(name="cardAssigneesPopup"\)[\s\S]*?if suggestedMembers\.length[\s\S]*?a\.name\.js-select-assignee/);
  assert.match(read('client/lib/suggestedMembers.js'), /board\.allowsSuggestedMembersOnCard === false\) return \[\];/);
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');
  const row = CARD_SETTINGS_ROWS.find(r => r.key === 'suggestedMembers');
  assert.ok(row && row.card.field === 'allowsSuggestedMembersOnCard' && !row.minicard);
  assert.ok(require('../models/lib/cardFieldVisibility.js').CARD_FIELD_KEYS.includes('suggestedMembers'));
});

console.log(`\nmemberSuggestions: ${passed} tests passed`);
