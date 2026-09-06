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
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 1924,
  'the first five 50-value Tigre batches stay resolved');

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
assert.deepEqual(tokens(tigre['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(tigre['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(tigre['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(tigre['allboards.workspaces'], 'ቦታታት ዕዮ');
assert.match(tigre['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(tigre['activity-dueDate']), ['%s', '%s']);
assert.match(tigre['archive-permanent-delete-disabled-hint'], /ፓነል/);
assert.match(tigre['list-width-error-message'], /270/);
assert.equal(tigre['fixed-list-width'], 'ንኩሎም ዝርዝራት ሓደ ግፍሒ');
assert.match(tigre['set-swimlane-height-value'], /ፒክሰል/);
assert.equal(tigre['convertChecklistItemToCardPopup-title'],
  'ናብ ካርድ ቀይር');
assert.deepEqual(tokens(tigre['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(tigre['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(tigre['avatar-too-big']), ['__size__']);
assert.match(tigre['board-background-image-url'], /URL/);
assert.deepEqual(tokens(tigre['board-nb-stars']), ['%s']);
assert.deepEqual(tags(tigre['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(tigre['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  tigre['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(tigre['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(tigre['card-comments-title']), ['%s']);
assert.match(tigre['mobile-desktop-toggle'], /ሞባይል.*ዴስክቶፕ/);

console.log('tigreTranslationProgress: first five batches passed');
