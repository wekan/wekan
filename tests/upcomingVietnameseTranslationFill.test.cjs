'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
for (const language of ['vi', 'vi-VN']) {
  const translated = JSON.parse(fs.readFileSync(path.join(ROOT,
    'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
  assert.strictEqual(translated.checklist, 'Danh sách kiểm tra');
  assert.match(translated['font-preview-text'], /[ăâúóư]/u);
  assert.strictEqual(translated['gcs-bucket'], 'Nhóm chứa');
}
console.log('upcomingVietnameseTranslationFill: 6 tests passed');
