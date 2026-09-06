const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const tigre = readLocale('tig');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'tig',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 2124,
  'the first 50-value Tigre batch stays resolved');

for (const [key, value] of Object.entries(tigre)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(tigre.accept, 'ተቐበል');
assert.deepEqual(tokens(tigre['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(tigre['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(tigre['act-deleteCard'], /መገዲ/);
assert.match(tigre['board-members-same-org-only'], /ውድብ/);
assert.match(tigre['board-members-same-team-only'], /ጉጅለ/);
assert.deepEqual(tokens(tigre['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tigre['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tigre['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.equal(tigre['act-importBoard'], 'ሰሌዳ __board__ ኣእተወ');
assert.match(tigre['act-addAttachment'], /ተለጣፊ/);
assert.match(tigre['act-addChecklist'], /ናይ ምርመራ ዝርዝር/);

console.log('tigreTranslationProgress: first batch passed');
