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
const tigrinya = readLocale('ti');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'ti',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 2024,
  'the first three Tigrinya batches stay resolved');

for (const [key, value] of Object.entries(tigrinya)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(tigrinya.accept, 'ተቐበል');
assert.deepEqual(tokens(tigrinya['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(tigrinya['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(tigrinya['board-members-same-org-only'], /ውድብ/);
assert.match(tigrinya['board-members-same-team-only'], /ጉጅለ/);
assert.deepEqual(tokens(tigrinya['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tigrinya['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tigrinya['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.equal(tigrinya['act-importBoard'], 'ሰሌዳ __board__ ኣእትዩ');
assert.deepEqual(tokens(tigrinya['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(tigrinya['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(tigrinya['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(tigrinya['allboards.workspaces'], 'ቦታታት ስራሕ');
assert.match(tigrinya['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(tigrinya['activity-dueDate']), ['%s', '%s']);
assert.match(tigrinya['archive-permanent-delete-disabled-hint'], /ፓነል/);
assert.match(tigrinya['list-width-error-message'], /270/);
assert.equal(tigrinya['fixed-list-width'], 'ንኹሎም ዝርዝራት ሓደ ግፍሒ');
assert.match(tigrinya['set-swimlane-height-value'], /ፒክሰል/);
assert.equal(tigrinya['convertChecklistItemToCardPopup-title'], 'ናብ ካርድ ቀይር');

console.log('tigrinyaTranslationProgress: first three batches passed');
