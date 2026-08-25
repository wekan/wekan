const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ckb'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 1216);

const english = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'),
);
const kurdish = JSON.parse(
  fs.readFileSync(path.join(root, 'imports/i18n/data/ckb.i18n.json'), 'utf8'),
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

for (const [key, value] of Object.entries(kurdish)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kurdish.accept, 'پەسەندکردن');
assert.deepEqual(tokens(kurdish['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kurdish['act-addChecklistItem']), [
  '__board__',
  '__card__',
  '__checklistItem__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.deepEqual(tokens(kurdish['act-removeChecklistItem']), [
  '__board__',
  '__card__',
  '__checkList__',
  '__checklistItem__',
  '__list__',
  '__swimlane__',
]);
assert.match(kurdish['act-createBoard'], /تەختە/);
assert.match(kurdish['act-createSwimlane'], /ڕێڕەو/);
assert.match(kurdish['act-addComment'], /لێدوان/);
assert.match(kurdish['act-archivedCard'], /ئەرشیف/);
assert.deepEqual(tokens(kurdish['act-moveCard']), [
  '__board__',
  '__card__',
  '__list__',
  '__oldList__',
  '__oldSwimlane__',
  '__swimlane__',
]);
assert.deepEqual(tokens(kurdish['activity-checklist-completed-card']), [
  '__board__',
  '__card__',
  '__checklist__',
  '__list__',
  '__swimlane__',
]);
assert.match(kurdish['allboards.add-workspace'], /شوێنی کار/);
assert.match(kurdish['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(kurdish['activity-dueDate']), ['%s', '%s']);
assert.match(kurdish['home-board-remove-confirm'], /ناسڕدرێتەوە/);
assert.match(kurdish['list-width-error-message'], /270/);
assert.match(kurdish['set-swimlane-height'], /ڕێڕەو/);
assert.match(kurdish['convertChecklistItemToCardPopup-title'], /کارت/);
assert.deepEqual(tokens(kurdish['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(kurdish['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(kurdish['board-private-info']), [
  '</strong>',
  '<strong>',
]);
assert.match(kurdish['board-private-info'], /تایبەت/);
assert.deepEqual(tags(kurdish['board-public-info']), [
  '</strong>',
  '<strong>',
]);
assert.deepEqual(
  tokens(kurdish['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__'],
);
assert.match(kurdish['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(kurdish['card-comments-title']), ['%s']);
assert.match(kurdish['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(kurdish['cardDependenciesPopup-title'], /پشتبەستە/);
assert.match(kurdish['addBoardOrgPopup-title'], /ڕێکخراو/);
assert.match(kurdish['importSwimlanePopup-title'], /ڕێڕەو/);
assert.match(kurdish.casSignIn, /CAS/);
assert.match(kurdish['map-to-existing-user-desc'], /مۆڵەت/);
assert.match(kurdish['font-preview-text'], /0123456789/);
assert.match(kurdish['changeLanguagePopup-title'], /زمان/);
assert.match(kurdish['card-aging-days'], /3/);
assert.match(kurdish['move-card-up'], /سەرەوە/);
assert.match(kurdish['move-list-left'], /چەپ/);
assert.equal(kurdish['color-black'], 'ڕەش');
assert.equal(kurdish['color-red'], 'سوور');
assert.match(kurdish['comment-only'], /لێدوان/);
assert.match(kurdish['read-only'], /خوێندنەوە/);
assert.equal(JSON.parse(kurdish['copyManyCardsPopup-format']).length, 3);
assert.match(kurdish['custom-field-currency'], /دراو/);
assert.deepEqual(tokens(kurdish['email-enrollAccount-text']), [
  '__url__',
  '__user__',
]);
assert.deepEqual(tokens(kurdish['email-invite-text']), [
  '__board__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(kurdish['error-json-malformed'], /JSON/);
assert.match(kurdish['error-csv-schema'], /CSV.*TSV/);
assert.match(kurdish['error-import-empty-board'], /WeKan/);
assert.match(kurdish['export-card-pdf'], /PDF/);
assert.match(kurdish['export-card-excel'], /Excel/);
assert.match(kurdish['export-card-field-board-info'], /ڕێڕەو/);
assert.match(kurdish['filter-due-today'], /ئەمڕۆ/);
assert.match(kurdish['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(kurdish['import-board-instruction-issues']), [
  '__endpoint__',
  '__sourceName__',
]);
assert.match(kurdish['import-board-instruction-openproject'], /GET \/api\/v3\/work_packages/);
assert.match(kurdish['import-board-instruction-jira'], /GET \/rest\/api\/2\/search/);
assert.match(kurdish['import-trello-json-file-hint'], /API/);
assert.match(kurdish['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(kurdish['trello-api-token'], /API/);
assert.match(kurdish['invalid-year'], /2026/);
assert.deepEqual(tokens(kurdish['label-default']), ['%s']);
assert.deepEqual(tokens(kurdish['leave-board-pop']), ['__boardTitle__']);
assert.match(kurdish['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.match(kurdish['no-archived-swimlanes'], /ڕێڕەو/);
assert.match(kurdish['normal-assigned-only-desc'], /ئاسایی/);
assert.deepEqual(tokens(kurdish['page-maybe-private']), ['%s']);
assert.deepEqual(tags(kurdish['page-maybe-private']), [
  '</a>',
  "<a href='%s'>",
]);
assert.deepEqual(tokens(kurdish['remove-member-pop']), [
  '__boardTitle__',
  '__name__',
  '__username__',
]);
assert.match(kurdish['public-desc'], /Google/);
assert.match(kurdish['toggle-assignees'], /1-9/);
assert.match(kurdish['custom-top-left-corner-logo-height'], /27/);
assert.match(kurdish['automatic-linked-url-schemes'], /URL/);
assert.match(kurdish['attachment-transfer-limits-title'], /API/);
assert.deepEqual(tokens(kurdish['email-invite-register-text']), [
  '__icode__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.match(kurdish['smtp-host'], /SMTP/);
assert.match(kurdish['smtp-tls'], /TLS/);
assert.match(kurdish.Node_version, /Node/);
assert.match(kurdish.Meteor_version, /Meteor/);
assert.match(kurdish.FerretDB_version, /FerretDB/);
assert.match(kurdish.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(kurdish.DDP_transport, /DDP_TRANSPORT/);
assert.match(kurdish['org-domains-description'], /MULTITENANCY=true/);
assert.match(kurdish['org-domains-description'], /a\.example\.com.*kanban\.example\.org/);
assert.deepEqual(tokens(kurdish['default-subtasks-board']), ['__board__']);
assert.match(kurdish['checklist-count'], /0\/0/);
assert.match(kurdish['parent-card'], /باوک/);
assert.match(kurdish['delete-board'], /تەختە/);
assert.deepEqual(tokens(kurdish['activity-added-label']), ['%s', '%s']);
