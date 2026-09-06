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
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 1774,
  'the first eight Tajik batches stay resolved');

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
assert.deepEqual(tokens(tajik['activity-dueDate']), ['%s', '%s']);
assert.match(tajik['list-width-error-message'], /270/);
assert.equal(tajik['fixed-list-width'],
  'Паҳноии яксон барои ҳамаи рӯйхатҳо');
assert.match(tajik['set-swimlane-height-value'], /пиксел/);
assert.equal(tajik['convertChecklistItemToCardPopup-title'],
  'Ба корт табдил додан');
assert.deepEqual(tokens(tajik['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(tajik['avatar-too-big']), ['__size__']);
assert.match(tajik['board-background-image-url'], /URL/);
assert.deepEqual(tokens(tajik['board-nb-stars']), ['%s']);
assert.deepEqual(tags(tajik['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(tajik['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  tajik['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(tajik['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(tajik['card-comments-title']), ['%s']);
assert.equal(tajik['mobile-mode'], 'Ҳолати мобилӣ');
assert.equal(tajik['positiveVoteMembersPopup-title'], 'Тарафдорон');
assert.equal(tajik['negativeVoteMembersPopup-title'], 'Мухолифон');
assert.match(tajik['poker-delete-pop'], /Planning Poker/);
assert.equal(tajik['cardDependenciesPopup-title'],
  'Илова кардани вобастагӣ');
assert.equal(tajik['exportChecklistPopup-title'],
  'Содир кардани рӯйхати санҷиш');
assert.match(tajik.casSignIn, /CAS/);
assert.equal(tajik['cardType-linkedCard'], 'Корти пайвастшуда');
assert.match(tajik['map-to-existing-user-desc'], /иҷозати бештар/);
assert.match(tajik['font-preview-text'], /0123456789/);
assert.equal(tajik['changeLanguagePopup-title'], 'Тағйир додани забон');
assert.equal(tajik['auto-list-width'], 'Паҳноии худкори рӯйхат');
assert.match(tajik['card-aging-days'], /3/);
assert.match(tajik['card-aging-tier3'], /Дараҷаи 3/);
assert.equal(tajik['color-darkgreen'], 'сабзи торик');
assert.equal(tajik['color-sky'], 'осмонӣ');

console.log('tajikTranslationProgress: first eight batches passed');
