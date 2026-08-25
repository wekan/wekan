const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'cv'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1366);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const chuvash = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/cv.i18n.json'), 'utf8'),
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

for (const [key, value] of Object.entries(chuvash)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(chuvash.accept, 'Йышӑнас');
assert.deepEqual(tokens(chuvash['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(chuvash['act-deleteCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__swimlane__',
]);
assert.deepEqual(tokens(chuvash['act-removeChecklistItem']), [
  '__board__',
  '__card__',
  '__checkList__',
  '__checklistItem__',
  '__list__',
  '__swimlane__',
]);
assert.match(chuvash['act-createBoard'], /хӑм/);
assert.match(chuvash['act-createSwimlane'], /ҫул/);
assert.match(chuvash['act-addComment'], /хушса калан/);
assert.match(chuvash['act-archivedCard'], /архив/);
assert.deepEqual(tokens(chuvash['act-moveCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__oldList__',
  '__oldSwimlane__',
  '__swimlane__',
]);
assert.deepEqual(tokens(chuvash['activity-checklist-completed-card']), [
  '__board__',
  '__card__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.match(chuvash['allboards.add-workspace'], /Ӗҫ вырӑн/);
assert.match(chuvash['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(chuvash['activity-dueDate']), ['%s', '%s']);
assert.match(chuvash['home-board-remove-confirm'], /кӑларса пӑрахӑнмасть/);
assert.match(chuvash['list-width-error-message'], /270/);
assert.match(chuvash['set-swimlane-height'], /Ҫул/);
assert.match(chuvash['convertChecklistItemToCardPopup-title'], /Карточк/);
assert.deepEqual(tokens(chuvash['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(chuvash['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(chuvash['board-private-info']), [
  '</strong>',
  '<strong>',
]);
assert.match(chuvash['board-private-info'], /харпӑрлӑ/);
assert.deepEqual(tags(chuvash['board-public-info']), [
  '</strong>',
  '<strong>',
]);
assert.deepEqual(
  tokens(chuvash['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__'],
);
assert.match(chuvash['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(chuvash['card-comments-title']), ['%s']);
assert.match(chuvash['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(chuvash['cardDependenciesPopup-title'], /Ҫыхӑнулӑх/);
assert.match(chuvash['addBoardOrgPopup-title'], /Организаци/);
assert.match(chuvash['importSwimlanePopup-title'], /Ҫул/);
assert.match(chuvash.casSignIn, /CAS/);
assert.match(chuvash['map-to-existing-user-desc'], /ирӗк/);
assert.match(chuvash['font-preview-text'], /0123456789/);
assert.match(chuvash['changeLanguagePopup-title'], /Чӗлхе/);
assert.match(chuvash['card-aging-days'], /3/);
assert.match(chuvash['move-card-up'], /ҫӳлелле/);
assert.match(chuvash['move-list-left'], /сулахаялла/);
assert.equal(chuvash['color-black'], 'хура');
assert.equal(chuvash['color-red'], 'хӗрлӗ');
assert.match(chuvash['comment-only'], /Хушса калама/);
assert.match(chuvash['read-only'], /Вулама/);
assert.equal(JSON.parse(chuvash['copyManyCardsPopup-format']).length, 3);
assert.match(chuvash['custom-field-currency'], /Укҫа/);
assert.deepEqual(tokens(chuvash['email-enrollAccount-text']), [
  '__url__',
  '__user__',
]);
assert.deepEqual(tokens(chuvash['email-invite-text']), [
  '__board__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(chuvash['error-json-malformed'], /JSON/);
assert.match(chuvash['error-csv-schema'], /CSV.*TSV/);
assert.match(chuvash['error-import-empty-board'], /WeKan/);
assert.match(chuvash['export-card-pdf'], /PDF/);
assert.match(chuvash['export-card-excel'], /Excel/);
assert.match(chuvash['export-card-field-board-info'], /Ҫул/);
assert.match(chuvash['filter-due-today'], /Паян/);
assert.match(chuvash['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(chuvash['import-board-instruction-issues']), [
  '__endpoint__',
  '__sourceName__',
]);
assert.match(chuvash['import-board-instruction-openproject'], /GET \/api\/v3\/work_packages/);
assert.match(chuvash['import-board-instruction-jira'], /GET \/rest\/api\/2\/search/);
assert.match(chuvash['import-trello-json-file-hint'], /API/);
assert.match(chuvash['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(chuvash['trello-api-token'], /API/);
assert.match(chuvash['invalid-year'], /2026/);
assert.deepEqual(tokens(chuvash['label-default']), ['%s']);
assert.deepEqual(tokens(chuvash['leave-board-pop']), ['__boardTitle__']);
assert.match(chuvash['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.match(chuvash['no-archived-swimlanes'], /ҫул/);
assert.match(chuvash['normal-assigned-only-desc'], /Нормаллӑ/);
assert.deepEqual(tokens(chuvash['page-maybe-private']), ['%s']);
assert.deepEqual(tags(chuvash['page-maybe-private']), [
  '</a>',
  "<a href='%s'>",
]);
assert.deepEqual(tokens(chuvash['remove-member-pop']), [
  '__boardTitle__',
  '__name__',
  '__username__',
]);
assert.match(chuvash['public-desc'], /Google/);
assert.match(chuvash['toggle-assignees'], /1-9/);
assert.match(chuvash['custom-top-left-corner-logo-height'], /27/);
assert.match(chuvash['automatic-linked-url-schemes'], /URL/);
assert.match(chuvash['attachment-transfer-limits-title'], /API/);
