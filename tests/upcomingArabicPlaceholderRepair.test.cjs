'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const pattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(pattern) || []).sort();
for (const language of ['ar', 'ar-DZ', 'ar-EG', 'ary']) {
  const translated = read(language);
  for (const [key, source] of Object.entries(english)) {
    assert.deepStrictEqual(inventory(translated[key] || ''), inventory(source),
      `${language}:${key} changed a placeholder`);
  }
  const repaired = ['act-addAttachment', 'act-removeChecklistItem',
    'act-setCustomField', 'email-invite-text'].map(key => translated[key]).join('\n');
  assert.match(repaired, /[\u0600-\u06ff]/u);
  assert.doesNotMatch(repaired, /__(?:مرفق|بطاقة|قائمة|لوحة|عضو)__/u);
}
console.log('upcomingArabicPlaceholderRepair: 2 tests passed');
