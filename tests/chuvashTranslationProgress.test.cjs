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
assert.equal(Object.keys(remaining).length, 666);

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
assert.deepEqual(tokens(chuvash['email-invite-register-text']), [
  '__icode__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(chuvash['smtp-host'], /SMTP/);
assert.match(chuvash['smtp-tls'], /TLS/);
assert.match(chuvash.Node_version, /Node/);
assert.match(chuvash.Meteor_version, /Meteor/);
assert.match(chuvash.FerretDB_version, /FerretDB/);
assert.match(chuvash.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(chuvash.DDP_transport, /DDP_TRANSPORT/);
assert.match(chuvash['org-domains-description'], /MULTITENANCY=true/);
assert.match(chuvash['org-domains-description'], /a\.example\.com.*kanban\.example\.org/);
assert.deepEqual(tokens(chuvash['default-subtasks-board']), ['__board__']);
assert.match(chuvash['checklist-count'], /0\/0/);
assert.match(chuvash['parent-card'], /Ашшӗ/);
assert.match(chuvash['delete-board'], /Хӑма/);
assert.deepEqual(tokens(chuvash['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(chuvash['activity-set-customfield']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(chuvash['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(chuvash['r-import-done']), ['__count__']);
assert.match(chuvash['r-board-rules'], /правил/i);
assert.match(chuvash['r-workflow-view'], /Ӗҫ йӗрки/);
assert.deepEqual(tokens(chuvash['r-import-unmapped']), ['__count__']);
assert.match(chuvash['r-schedule-weekday'], /тунти кун.*эрне кун/);
assert.match(chuvash['r-unit-minutes'], /минут/);
assert.match(chuvash['r-trigger'], /Триггер/);
assert.match(chuvash['r-unarchived'], /Архив/);
assert.match(chuvash['r-checklist'], /тӗрӗслев список/);
assert.match(chuvash['r-send-email'], /Электронлӑ ҫыру/);
assert.equal(chuvash['r-items-list'], 'пункт1,пункт2,пункт3');
assert.match(chuvash['r-in-swimlane'], /ҫул/);
assert.match(chuvash['authentication-method'], /Аутентификаци/);
assert.match(chuvash['custom-head-meta-tags'], /HTML/);
assert.match(chuvash['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(chuvash['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(chuvash['add-custom-html-before-body-end']), ['</body>']);
assert.deepEqual(tokens(chuvash['act-a-dueAt']), [
  '__card__',
  '__timeOldValue__',
  '__timeValue__',
]);
assert.equal(chuvash['act-a-dueAt'].split('\n').length, 4);
assert.deepEqual(tokens(chuvash['act-atUserComment']), [
  '__board__',
  '__card__',
  '__comment__',
  '__list__',
  '__swimlane__',
]);
assert.match(chuvash['open-many-cards-at-once-description'], /Ctrl|карточк/);
assert.match(chuvash['submit-on-enter-description'], /Shift\+Enter/);
assert.match(chuvash['submit-on-enter-description'], /Ctrl\/Cmd\+Enter/);
assert.match(chuvash['roles-info'], /Администратор/);
assert.equal(chuvash.monday, 'Тунти кун');
assert.equal(chuvash.sunday, 'Вырсарни кун');
assert.match(chuvash['invalid-domain'], /example\.com.*@/);
assert.match(chuvash['shared-templates-info'], /организаци.*команд.*домен/i);
assert.match(chuvash['dueCardsViewChange-choice-all-description'], /\*Вӗҫленӳ\*/);
assert.deepEqual(tokens(chuvash['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(chuvash['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(chuvash['n-n-of-n-cards-found']), [
  '__end__',
  '__start__',
  '__total__',
]);
assert.equal(chuvash['operator-board'], 'хӑма');
assert.equal(chuvash['operator-swimlane'], 'ҫул');
assert.equal(chuvash['predicate-overdue'], 'вӗҫленӳ вӑхӑчӗ иртнӗ');
assert.deepEqual(tokens(chuvash['operator-number-expected']), [
  '__operator__',
  '__value__',
]);
assert.deepEqual(
  tokens(chuvash['globalSearch-instructions-operator-has']),
  tokens(english['globalSearch-instructions-operator-has']),
);
assert.deepEqual(
  tags(chuvash['globalSearch-instructions-operator-board']),
  ['<title>', '<title>'],
);
assert.equal(chuvash['globalSearch-instructions-notes-2'].split('\n').length, 2);
assert.deepEqual(tokens(chuvash['import-dependencies-done']), [
  '__imported__',
  '__unmatched__',
]);
assert.deepEqual(tokens(chuvash['background-too-big']), ['{{size}}']);
assert.match(chuvash['import-dependencies-file'], /JSON.*SVG/);
assert.match(chuvash['sort-boards-title-asc'], /А → Я/);
assert.equal(chuvash['server-error-troubleshooting'].split('\n').length, 3);
assert.match(chuvash['server-error-troubleshooting'], /sudo snap logs wekan\.wekan/);
assert.match(chuvash['server-error-troubleshooting'], /sudo docker logs wekan-app/);
assert.deepEqual(tokens(chuvash['custom-field-stringtemplate-format']), [
  '%{value}',
]);
assert.match(chuvash['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
assert.match(chuvash['office-report-desc'], /IPv4.*IPv6/);
