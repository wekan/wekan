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
const tajik = readLocale('tg');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'tg',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 2074,
  'the first two Tajik batches stay resolved');

for (const [key, value] of Object.entries(tajik)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(tajik.accept, 'Қабул кардан');
assert.deepEqual(tokens(tajik['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(tajik['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(tajik['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(tajik['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(tajik['board-members-same-org-only'], /Ташкилот/);
assert.match(tajik['board-members-same-team-only'], /Даста/);
assert.equal(tajik['act-importBoard'], 'тахтаи __board__-ро ворид кард');
assert.deepEqual(tokens(tajik['act-moveCard']),
  ['__board__', '__card__', '__list__', '__oldList__', '__oldSwimlane__',
    '__swimlane__']);
assert.deepEqual(tokens(tajik['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(tajik['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(tajik['allboards.workspaces'], 'Фазоҳои корӣ');
assert.match(tajik['allboards.edit-workspace-icon'], /markdown/);

console.log('tajikTranslationProgress: first two batches passed');
