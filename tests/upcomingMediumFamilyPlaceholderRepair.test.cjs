'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(
  ROOT, 'imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const languages = ['af', 'af_ZA', 'ro', 'ro-RO', 'zh-Hant',
  'zh-CN', 'zh-GB', 'zh-Hans', 'zh', 'zh_SG'];
const pattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(pattern) || []).sort();
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('every repaired family locale has the English placeholder inventory', () => {
  for (const language of languages) {
    const translated = read(language);
    for (const [key, source] of Object.entries(english)) {
      assert.deepStrictEqual(inventory(translated[key] || ''), inventory(source),
        `${language}:${key} changed a placeholder`);
    }
  }
});

test('Romanian repaired values reject Italian seed prose', () => {
  for (const language of ['ro', 'ro-RO']) {
    const translated = read(language);
    const values = ['act-createCustomField', 'act-deleteCustomField',
      'activity-changedListTitle', 'activity-checklist-uncompleted',
      'act-a-dueAt'].map(key => translated[key]).join('\n');
    assert.match(values, /câmpul|redenumit|nefinalizată|Scadență/);
    assert.doesNotMatch(values, /creato campo|bacheca|rinominata|Scadenza/);
  }
});

test('Chinese families reject translated application identifiers', () => {
  for (const language of languages.filter(code => code.startsWith('zh'))) {
    const values = Object.values(read(language)).join('\n');
    assert.doesNotMatch(values, /__(?:附件|卡片|清單|列表|分隔線|看板|工作空間|選取清單項目)__/);
  }
});

console.log(`\nupcomingMediumFamilyPlaceholderRepair: ${passed} tests passed`);
