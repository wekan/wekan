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
const tswana = readLocale('tn');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'tn',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 1824,
  'the first seven 50-value Tswana batches stay resolved');

for (const [key, value] of Object.entries(tswana)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(tswana.accept, 'Amogela');
assert.deepEqual(tokens(tswana['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(tswana['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(tswana['act-addAttachment'], /se se tshwaraganeng/);
assert.match(tswana['act-addChecklist'], /lenaane la tlhatlhobo/);
assert.match(tswana['board-members-same-org-only'], /Mokgatlhong/);
assert.match(tswana['board-members-same-team-only'], /Setlhopheng/);

assert.deepEqual(tokens(tswana['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(tswana['activity-imported']), ['%s', '%s', '%s']);
assert.equal(tswana['allboards.workspaces'], 'Mafelo a tiro');
assert.match(tswana['allboards.edit-workspace-icon'], /markdown/);

assert.deepEqual(tokens(tswana['activity-dueDate']), ['%s', '%s']);
assert.match(tswana['list-width-error-message'], /270/);
assert.match(tswana['set-swimlane-height-value'], /dipiksele/);
assert.equal(tswana['convertChecklistItemToCardPopup-title'],
  'Fetolela go karata');

assert.deepEqual(tokens(tswana['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(tswana['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(tswana['board-private-info']),
  ['</strong>', '<strong>']);
assert.match(tswana['board-background-image-url'], /URL/);

assert.deepEqual(tags(tswana['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  tswana['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(tswana['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(tswana['card-comments-title']), ['%s']);

assert.match(tswana['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(tswana['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(tswana['importSwimlanePopup-title'], 'Tlisetsa tsela');
assert.match(tswana['addBoardOrgPopup-title'], /Mokgatlho/);

assert.match(tswana.casSignIn, /CAS/);
assert.match(tswana['map-to-existing-user-desc'], /ditetla/);
assert.match(tswana['font-preview-text'], /0123456789/);
assert.equal(tswana['restoreArchivedListToSwimlanePopup-title'],
  'Busetsa lenaane mo tseleng');

console.log('tswanaTranslationProgress: first seven batches passed');
