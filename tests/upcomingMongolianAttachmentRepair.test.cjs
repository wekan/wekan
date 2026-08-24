'use strict';

// The Upcoming release replaces Russian attachment controls in Mongolian.
// Run: node tests/upcomingMongolianAttachmentRepair.test.cjs

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
  'attachment', 'attachment-delete-pop', 'attachmentDeletePopup-title',
  'attachments', 'attachmentActionsPopup-title', 'attachment-move-storage-fs',
  'attachment-move-storage-gridfs', 'attachment-move',
  'move-all-attachments-to-fs', 'move-all-attachments-to-gridfs',
  'move-all-attachments-of-board-to-fs',
  'move-all-attachments-of-board-to-gridfs', 'move-progress-file',
  'move-progress-cancel', 'attachmentRenamePopup-title',
];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('attachment controls differ from Russian except the shared loanword', () => {
  for (const key of keys.filter(key => key !== 'move-progress-file')) {
    assert.notStrictEqual(mongolian[key], russian[key], `${key} is still Russian`);
  }
  assert.strictEqual(mongolian['move-progress-file'], 'Файл');
});

test('all repaired values contain Cyrillic text', () => {
  for (const key of keys) {
    assert.match(mongolian[key], /\p{Script=Cyrillic}/u, `${key} lacks Cyrillic text`);
  }
});

test('storage product names and Mongolian attachment vocabulary survive', () => {
  assert.match(mongolian.attachment, /Хавсралт/);
  assert.match(mongolian['attachment-move-storage-gridfs'], /GridFS/);
  assert.match(mongolian['move-all-attachments-of-board-to-fs'], /Самбар/);
});

test('common Russian attachment words do not remain (negative)', () => {
  const joined = keys.map(key => mongolian[key]).join('\n');
  assert.doesNotMatch(joined, /Вложени|Переместить|Удалить|Отмена|Переименовать/);
});

console.log(`\nupcomingMongolianAttachmentRepair: ${passed} tests passed`);
