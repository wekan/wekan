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
assert.equal(Object.keys(remaining).length, 1217);

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
assert.match(kyrgyz.casSignIn, /CAS/);
assert.equal(kyrgyz['cardType-linkedBoard'], 'Байланышкан такта');
assert.match(kyrgyz['map-to-existing-user-desc'],
  /карточкалары.*комментарийлери.*аракеттери/);
assert.equal(kyrgyz['map-to-existing-user-no-results'],
  'Дал келген колдонуучулар табылган жок.');
assert.match(kyrgyz['font-preview-text'], /0123456789/);
assert.equal(kyrgyz['auto-list-width'], 'Тизменин автоматтык туурасы');
assert.match(kyrgyz['card-aging-days'], /3/);
assert.equal(kyrgyz['move-card-up'], 'Карточканы өйдө жылдыруу');
assert.equal(kyrgyz['color-red'], 'кызыл');
assert.equal(kyrgyz['color-silver'], 'күмүш');
assert.equal(kyrgyz['read-only'], 'Окуу үчүн гана');
assert.equal(kyrgyz.worker, 'Жумушчу');
const bulkCardExample = JSON.parse(kyrgyz['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(kyrgyz['custom-field-number'], 'Сан');
assert.match(kyrgyz['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(kyrgyz['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(kyrgyz['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(kyrgyz['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(kyrgyz['error-import-empty-board'], /WeKan/);
assert.equal(kyrgyz['export-card-pdf'],
  'Карточканы PDF форматына экспорттоо');
assert.match(kyrgyz['export-card-excel-fields'], /Excel/);
assert.equal(kyrgyz['filter-due-tomorrow'], 'Мөөнөтү эртең');
assert.equal(kyrgyz['filter-no-member'], 'Мүчө жок');
assert.match(kyrgyz['advanced-filter-description'],
  /== != <= >= && \|\| \( \).*Field1 == Value1.*'Field 1' == 'Value 1'.*Field1 == I\\'m.*F1 == V1 \|\| F1 == V2.*F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(kyrgyz['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(kyrgyz['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(kyrgyz['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search.*automationRules/);
assert.match(kyrgyz['import-excel-file'], /\.xlsx/);
assert.match(kyrgyz['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(kyrgyz['trello-api-import-desc'], /Trello API/);
assert.match(kyrgyz['invalid-year'], /2026/);
assert.deepEqual(tokens(kyrgyz['label-default']), ['%s']);
assert.deepEqual(tokens(kyrgyz['leave-board-pop']), ['__boardTitle__']);
assert.match(kyrgyz['listImportCardPopup-title'], /Trello/);
assert.match(kyrgyz['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(kyrgyz.normal, 'Кадимки');
assert.equal(kyrgyz['multi-selection'], 'Көп тандоо');
assert.deepEqual(tokens(kyrgyz['page-maybe-private']), ['%s']);
assert.deepEqual(tags(kyrgyz['page-maybe-private']), ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(kyrgyz['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(kyrgyz['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.match(kyrgyz['setWipLimitPopup-title'], /WIP/);
assert.match(kyrgyz['toggle-assignees'], /1-9/);
assert.match(kyrgyz['custom-top-left-corner-logo-height'], /27/);
assert.match(kyrgyz['automatic-linked-url-schemes'], /URL.*URL/);
assert.match(kyrgyz['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.equal(kyrgyz['board-templates-swimlane'], 'Такта үлгүлөрү');
assert.match(kyrgyz['attachment-transfer-limits-title'], /API/);
assert.match(kyrgyz['smtp-tls-description'], /SMTP.*TLS/);
assert.deepEqual(tokens(kyrgyz['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(kyrgyz['email-smtp-test-subject'], /SMTP/);
assert.match(kyrgyz.Node_version, /Node/);
assert.match(kyrgyz.Meteor_version, /Meteor/);
assert.match(kyrgyz.FerretDB_version, /FerretDB/);
assert.match(kyrgyz.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(kyrgyz.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(kyrgyz.DDP_transport, /DDP.*DDP_TRANSPORT/);
assert.match(kyrgyz['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/);
assert.deepEqual(tokens(kyrgyz['default-subtasks-board']), ['__board__']);
assert.match(kyrgyz['checklist-count-on-minicard'], /0\/0/);
assert.equal(kyrgyz['parent-card'], 'Ата-эне карточка');
assert.deepEqual(tokens(kyrgyz['activity-added-label']), ['%s', '%s']);
