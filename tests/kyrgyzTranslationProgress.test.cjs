const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ky'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1867);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const kyrgyz = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ky.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(kyrgyz)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kyrgyz.accept, 'Кабыл алуу');
assert.deepEqual(tokens(kyrgyz['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kyrgyz['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(kyrgyz['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(kyrgyz['act-createBoard'], /тактасын/);
assert.match(kyrgyz['act-createCard'], /карточкасын/);
assert.match(kyrgyz['act-addAttachment'], /тиркемесин/);
assert.match(kyrgyz['act-addChecklist'], /текшерүү тизмесин/);
assert.match(kyrgyz['act-addComment'], /комментарий/);
assert.match(kyrgyz['act-archivedBoard'], /Архивге/);
assert.deepEqual(tokens(kyrgyz['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(kyrgyz['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(kyrgyz['activity-imported']), ['%s', '%s', '%s']);
assert.equal(kyrgyz['allboards.workspaces'], 'Иш мейкиндиктери');
assert.match(kyrgyz['allboards.edit-workspace-icon'], /markdown/);
assert.equal(kyrgyz['workspaceActionsPopup-title'],
  'Иш мейкиндигинин жөндөөлөрү');
assert.deepEqual(tokens(kyrgyz['activity-dueDate']), ['%s', '%s']);
assert.match(kyrgyz['list-width-error-message'], /270/);
assert.match(kyrgyz['set-swimlane-height-value'], /пиксел/);
assert.equal(kyrgyz['add-checklist'], 'Текшерүү тизмесин кошуу');
assert.deepEqual(tokens(kyrgyz['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(kyrgyz['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(kyrgyz['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(kyrgyz['board-nb-stars']), ['%s']);
assert.deepEqual(tags(kyrgyz['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(kyrgyz['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  kyrgyz['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(kyrgyz['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(kyrgyz['card-comments-title']), ['%s']);
assert.equal(kyrgyz['card-edit-custom-fields'],
  'Ыңгайлаштырылган талааларды өзгөртүү');
assert.match(kyrgyz['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(kyrgyz['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(kyrgyz['importDependenciesPopup-title'],
  'Көз карандылыктарды импорттоо');
assert.equal(kyrgyz['exportChecklistPopup-title'],
  'Текшерүү тизмесин экспорттоо');
assert.equal(kyrgyz['importSwimlanePopup-title'], 'Жолду импорттоо');
