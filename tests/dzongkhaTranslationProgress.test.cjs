const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'dz'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1866);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const dzongkha = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/dz.i18n.json'), 'utf8'),
);
const tokens = (value) =>
  [
    ...value.matchAll(
      /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
    ),
  ]
    .map(([token]) => token)
    .sort();
const tags = (value) =>
  [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
    .map(([tag]) => tag)
    .sort();

for (const [key, value] of Object.entries(dzongkha)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(dzongkha.accept, 'ངོས་ལེན།');
assert.deepEqual(tokens(dzongkha['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(dzongkha['act-deleteCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__swimlane__',
]);
assert.deepEqual(tokens(dzongkha['act-removeChecklistItem']), [
  '__board__',
  '__card__',
  '__checkList__',
  '__checklistItem__',
  '__list__',
  '__swimlane__',
]);
assert.match(dzongkha['act-createBoard'], /བྱང་གཞི/);
assert.match(dzongkha['act-createSwimlane'], /ཆུ་ལམ/);
assert.match(dzongkha['act-addComment'], /བསམ་བཀོད/);
assert.deepEqual(tokens(dzongkha['act-moveCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__oldList__',
  '__oldSwimlane__',
  '__swimlane__',
]);
assert.deepEqual(tokens(dzongkha['activity-checklist-completed-card']), [
  '__board__',
  '__card__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.match(dzongkha['allboards.add-workspace'], /ལཱ་གི་ས་སྒོ/);
assert.match(dzongkha['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(dzongkha['activity-dueDate']), ['%s', '%s']);
assert.match(dzongkha['home-board-remove-confirm'], /བཏོན་ནི་མེན/);
assert.match(dzongkha['list-width-error-message'], /270/);
assert.match(dzongkha['set-swimlane-height'], /ཆུ་ལམ/);
assert.match(dzongkha['convertChecklistItemToCardPopup-title'], /ཤོག་བྱང/);
assert.deepEqual(tokens(dzongkha['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(dzongkha['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(dzongkha['board-private-info']), [
  '</strong>',
  '<strong>',
]);
assert.match(dzongkha['board-private-info'], /སྒེར/);
assert.deepEqual(tags(dzongkha['board-public-info']), [
  '</strong>',
  '<strong>',
]);
assert.deepEqual(
  tokens(dzongkha['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__'],
);
assert.match(dzongkha['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(dzongkha['card-comments-title']), ['%s']);
assert.match(dzongkha['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(dzongkha['cardDependenciesPopup-title'], /བརྟེན་འབྲེལ/);
assert.match(dzongkha['addBoardOrgPopup-title'], /ལས་སྡེ/);
assert.match(dzongkha['importSwimlanePopup-title'], /ཆུ་ལམ/);
