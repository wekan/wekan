'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readLanguage = code => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'imports/i18n/data', `${code}.i18n.json`),
  'utf8',
));
const english = readLanguage('en');
const repairedLanguages = ['ace', 'id', 'tr', 'zh-TW'];
const tokenPattern = /__[^\s]+?__|%(?:\d+\$)?[A-Za-z]/g;
const inventory = value => (value.match(tokenPattern) || []).sort();

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('every repaired locale has the English placeholder inventory', () => {
  for (const language of repairedLanguages) {
    const translated = readLanguage(language);
    for (const [key, source] of Object.entries(english)) {
      assert.deepStrictEqual(
        inventory(translated[key] || ''), inventory(source),
        `${language}:${key} changed a placeholder`,
      );
    }
  }
});

test('Acehnese repaired prose rejects its Indonesian seed vocabulary', () => {
  const translated = readLanguage('ace');
  const values = [
    translated['act-addAttachment'], translated['email-invite-text'],
    translated['remove-member-pop'],
  ].join('\n');
  assert.match(values, /(?:geutamah|geuundang|geuhapus|kad|senarai)/);
  assert.doesNotMatch(values, /menambahkan|mengundang|Hapus|kartu|daftar/);
});

test('Turkish checklist values preserve case-sensitive application tokens', () => {
  const translated = readLanguage('tr');
  assert.match(translated['act-addChecklistItem'], /__checklistItem__/);
  assert.match(translated['act-removeChecklistItem'], /__checkList__/);
  assert.doesNotMatch(
    `${translated['act-addChecklistItem']} ${translated['act-removeChecklistItem']}`,
    /__checklistitem__/,
  );
});

test('Traditional Chinese activity values reject translated token names', () => {
  const translated = readLanguage('zh-TW');
  const values = Object.values(translated).join('\n');
  assert.doesNotMatch(values, /__(?:附件|卡片|清單|分隔線|看板|選取清單項目)__/);
});

console.log(`\nupcomingSevenPlaceholderRepair: ${passed} tests passed`);
