'use strict';

// The Upcoming release replaces Russian checklist/subtask text in Mongolian.
// Run: node tests/upcomingMongolianChecklistRepair.test.cjs

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
  'act-addSubtask', 'act-addChecklist', 'act-addChecklistItem',
  'act-removeChecklist', 'act-removeChecklistItem', 'act-completeChecklist',
  'act-uncompleteChecklist', 'activity-subtask-added',
  'activity-checklist-added', 'activity-checklist-removed',
  'activity-checklist-completed', 'activity-checklist-uncompleted',
  'activity-checklist-item-added', 'activity-checklist-item-removed',
  'activity-checklist-completed-card', 'activity-checklist-uncompleted-card',
  'add-subtask', 'add-checklist-item', 'close-add-checklist-item',
  'close-edit-checklist-item', 'convertChecklistItemToCardPopup-title',
  'subtasks', 'checklists', 'confirm-subtask-delete-popup',
  'confirm-checklist-delete-popup', 'subtaskDeletePopup-title',
  'checklistDeletePopup-title', 'export-card-subtasks',
  'default-subtasks-board', 'subtask-settings',
  'boardSubtaskSettingsPopup-title', 'deposit-subtasks-board',
  'deposit-subtasks-list', 'r-when-a-checklist', 'r-when-the-checklist',
  'r-checklist', 'r-of-checklist', 'r-d-add-checklist',
  'r-d-remove-checklist', 'r-add-checklist', 'r-checklist-note',
  'operator-checklist-text', 'predicate-checklist',
  'checklistActionsPopup-title', 'moveChecklist', 'moveChecklistPopup-title',
  'copyChecklist', 'copyChecklistPopup-title', 'subtaskActionsPopup-title',
  'show-subtasks-field',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('all checklist and subtask values differ from Russian', () => {
  for (const key of keys) {
    assert.notStrictEqual(mongolian[key], russian[key], `${key} is still Russian`);
  }
});

test('all repaired values contain Cyrillic text', () => {
  for (const key of keys) {
    assert.match(mongolian[key], /\p{Script=Cyrillic}/u, `${key} lacks Cyrillic text`);
  }
});

test('placeholders and Mongolian kanban vocabulary survive', () => {
  assert.match(mongolian['act-addChecklist'], /__checklist__/);
  assert.match(mongolian['act-addChecklistItem'], /__checklistItem__/);
  assert.strictEqual(
    (mongolian['activity-checklist-completed'].match(/%s/g) || []).length,
    2,
  );
  assert.match(mongolian['add-subtask'], /Дэд даалгавар/);
  assert.match(mongolian['add-checklist-item'], /Шалгах хууд/);
});

test('the search operator remains a single token', () => {
  assert.doesNotMatch(mongolian['operator-checklist-text'], /\s/);
});

test('common Russian checklist words do not remain (negative)', () => {
  const joined = keys.map(key => mongolian[key]).join('\n');
  assert.doesNotMatch(joined, /Подзадач|контрольн|Чек-лист|Добавить|Удалить/iu);
});

console.log(`\nupcomingMongolianChecklistRepair: ${passed} tests passed`);
