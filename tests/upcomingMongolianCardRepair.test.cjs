'use strict';

// The Upcoming release replaces Russian card controls in Mongolian.
// Run: node tests/upcomingMongolianCardRepair.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const mongolian = readLanguage('mn');
const russian = readLanguage('ru');
const keys = [
  'card-archived', 'card-comments-title', 'card-delete-notice',
  'card-delete-pop', 'card-delete-suggest-archive', 'card-archive-pop',
  'card-archive-suggest-cancel', 'card-due', 'card-due-on', 'card-spent',
  'card-edit-attachments', 'card-edit-custom-fields', 'card-edit-labels',
  'card-edit-members', 'card-labels-title', 'card-members-title', 'card-start',
  'card-start-on', 'cardAttachmentsPopup-title',
  'cardCustomField-datePopup-title', 'cardCustomFieldsPopup-title',
  'cardStartVotingPopup-title', 'card-edit-voting',
  'cardStartPlanningPokerPopup-title', 'card-edit-planning-poker',
  'cardDeletePopup-title', 'cardArchivePopup-title',
  'cardDetailsActionsPopup-title', 'cardAssigneePopup-title',
  'cardLabelsPopup-title', 'cardMorePopup-title', 'cardTemplatePopup-title',
  'card-templates-swimlane', 'card-received', 'card-received-on', 'card-end',
  'card-end-on', 'card-sorting-by-number', 'card-settings',
  'card-sorting-by-number-on-minicard', 'cardAssigneesPopup-title',
  'cardDetailsPopup-title', 'card-show-lists',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('all card controls differ from their Russian translations', () => {
  for (const key of keys) {
    assert.notStrictEqual(mongolian[key], russian[key], `${key} is still Russian`);
  }
});

test('all repaired card controls contain Cyrillic text', () => {
  for (const key of keys) {
    assert.match(mongolian[key], /\p{Script=Cyrillic}/u, `${key} lacks Cyrillic text`);
  }
});

test('card placeholders and established Mongolian terms survive', () => {
  assert.match(mongolian['card-comments-title'], /%s/);
  assert.match(mongolian['card-delete-notice'], /карт/i);
  assert.match(mongolian['card-edit-attachments'], /Хавсралт/);
  assert.match(mongolian['card-edit-labels'], /Шошг/);
  assert.match(mongolian['cardAssigneePopup-title'], /Хариуцагч/);
});

test('common Russian card words do not remain (negative)', () => {
  const joined = keys.map(key => mongolian[key]).join('\n');
  assert.doesNotMatch(joined, /Карточк|Удалить|Изменить|Настройки|Исполнитель|Метки/);
});

console.log(`\nupcomingMongolianCardRepair: ${passed} tests passed`);
