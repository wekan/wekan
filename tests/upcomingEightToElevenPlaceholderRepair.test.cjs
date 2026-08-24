'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`), 'utf8',
));
const english = read('en');
const languages = ['lv', 'nb', 'oc', 'zh-HK'];
const pattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(pattern) || []).sort();
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('every repaired locale has the English placeholder inventory', () => {
  for (const language of languages) {
    const translated = read(language);
    for (const [key, source] of Object.entries(english)) {
      assert.deepStrictEqual(inventory(translated[key] || ''), inventory(source),
        `${language}:${key} changed a placeholder`);
    }
  }
});

test('Latvian and Norwegian reject mistyped application identifiers', () => {
  const latvian = read('lv');
  const norwegian = read('nb');
  const values = [latvian['act-withBoardTitle'],
    ...['act-addAttachment', 'act-deleteAttachment',
      'act-addChecklist', 'act-removeChecklist',
      'act-joinMember', 'act-unjoinMember',
      'globalSearch-instructions-operator-team']
      .map(key => norwegian[key])].join('\n');
  assert.doesNotMatch(values, /__laud__|__subtask__|__label__|__operator_org__/);
});

test('Occitan repaired values reject French seed prose and translated tokens', () => {
  const translated = read('oc');
  const values = ['act-setCustomField', 'globalSearch-instructions-operator-at',
    'globalSearch-instructions-operator-has'].map(key => translated[key]).join('\n');
  assert.match(values, /modificat|abreviacion|cerca/);
  assert.doesNotMatch(values, /a édité|raccourci|où |__astacament__|__comptar__/);
});

test('Hong Kong Chinese rejects translated placeholder names', () => {
  const values = Object.values(read('zh-HK')).join('\n');
  assert.doesNotMatch(values, /__(?:附件|卡片|清單|分隔線|看板|工作空間|選取清單項目)__/);
});

console.log(`\nupcomingEightToElevenPlaceholderRepair: ${passed} tests passed`);
