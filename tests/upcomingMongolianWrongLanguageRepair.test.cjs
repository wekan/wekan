'use strict';

// The Upcoming release replaces Russian archive/board controls in Mongolian.
// Run: node tests/upcomingMongolianWrongLanguageRepair.test.cjs

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
  'add-template', 'archive', 'archive-all', 'archive-board', 'archive-card',
  'archive-list', 'archive-swimlane', 'archive-selection',
  'archiveBoardPopup-title', 'archived-items', 'archived-boards',
  'restore-board', 'no-archived-boards', 'archives', 'template', 'templates',
  'template-container', 'add-template-container', 'assign-member', 'back',
  'cancel', 'boards', 'board-view', 'board-view-cal',
  'board-view-swimlanes', 'board-view-collapse', 'board-view-gantt',
  'board-view-lists', 'board-view-table',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the repaired controls no longer equal their Russian translations', () => {
  for (const key of keys.filter(key => key !== 'archives')) {
    assert.notStrictEqual(mongolian[key], russian[key], `${key} is still Russian`);
  }
});

test('the shared Archive loanword remains valid Mongolian', () => {
  assert.strictEqual(mongolian.archives, 'Архив');
});

test('every repaired control contains Cyrillic text', () => {
  for (const key of keys) {
    assert.match(mongolian[key], /\p{Script=Cyrillic}/u, `${key} lacks Cyrillic text`);
  }
});

test('the controls use established Mongolian board vocabulary', () => {
  assert.match(mongolian['archive-board'], /Самбар/);
  assert.match(mongolian['archive-card'], /Карт/);
  assert.match(mongolian['archive-list'], /Жагсаалт/);
  assert.match(mongolian['archive-swimlane'], /Усан зам/);
  assert.match(mongolian.template, /Загвар/);
});

test('common Russian UI words do not remain in this batch (negative)', () => {
  const joined = keys.map(key => mongolian[key]).join('\n');
  assert.doesNotMatch(joined, /Доски|Карточк|Списк|Шаблон|Отмена|Назад/);
});

console.log(`\nupcomingMongolianWrongLanguageRepair: ${passed} tests passed`);
