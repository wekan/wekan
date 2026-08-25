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
assert.equal(Object.keys(remaining).length, 1166);

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
assert.match(dzongkha.casSignIn, /CAS/);
assert.match(dzongkha['map-to-existing-user-desc'], /གནང་བ/);
assert.match(dzongkha['font-preview-text'], /0123456789/);
assert.match(dzongkha['changeLanguagePopup-title'], /སྐད་ཡིག/);
assert.match(dzongkha['card-aging-days'], /3/);
assert.match(dzongkha['move-card-up'], /ཡར/);
assert.match(dzongkha['move-list-left'], /གཡོན/);
assert.equal(dzongkha['color-black'], 'གནགཔོ།');
assert.equal(dzongkha['color-red'], 'དམརཔོ།');
assert.match(dzongkha['comment-only'], /བསམ་བཀོད/);
assert.match(dzongkha['read-only'], /ལྷག/);
assert.equal(JSON.parse(dzongkha['copyManyCardsPopup-format']).length, 3);
assert.match(dzongkha['custom-field-currency'], /དངུལ/);
assert.deepEqual(tokens(dzongkha['email-enrollAccount-text']), [
  '__url__',
  '__user__',
]);
assert.deepEqual(tokens(dzongkha['email-invite-text']), [
  '__board__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.equal(dzongkha['email-enrollAccount-text'].split('\n').length, 7);
assert.match(dzongkha['error-json-malformed'], /JSON/);
assert.match(dzongkha['error-csv-schema'], /CSV.*TSV/);
assert.match(dzongkha['error-import-empty-board'], /WeKan/);
assert.match(dzongkha['export-card-pdf'], /PDF/);
assert.match(dzongkha['export-card-excel'], /Excel/);
assert.match(dzongkha['export-card-field-board-info'], /ཆུ་ལམ/);
assert.match(dzongkha['filter-due-today'], /ད་རིས/);
assert.match(dzongkha['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(dzongkha['import-board-instruction-issues']), [
  '__endpoint__',
  '__sourceName__',
]);
assert.match(dzongkha['import-board-instruction-openproject'], /GET \/api\/v3\/work_packages/);
assert.match(dzongkha['import-board-instruction-jira'], /GET \/rest\/api\/2\/search/);
assert.match(dzongkha['import-trello-json-file-hint'], /API/);
assert.match(dzongkha['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(dzongkha['trello-api-token'], /API/);
assert.match(dzongkha['invalid-year'], /2026/);
assert.deepEqual(tokens(dzongkha['label-default']), ['%s']);
assert.deepEqual(tokens(dzongkha['leave-board-pop']), ['__boardTitle__']);
assert.match(dzongkha['leave-board'], /བྱང་གཞི/);
assert.match(dzongkha['list-archive-cards'], /ཡིག་མཛོད/);
assert.match(dzongkha['multi-selection'], /སྣ་མང/);
assert.match(dzongkha['normal-desc'], /སྒྲིག་འགོད/);
assert.deepEqual(tokens(dzongkha['page-maybe-private']), ['%s']);
assert.deepEqual(tags(dzongkha['page-maybe-private']), ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(dzongkha['remove-member-pop']), [
  '__boardTitle__',
  '__name__',
  '__username__',
]);
assert.match(dzongkha['private-desc'], /སྒེར/);
assert.match(dzongkha['shortcut-toggle-sidebar'], /ཟུར་སྒྲོམ/);
assert.match(dzongkha['spent-time-hours'], /ཆུ་ཚོད/);
assert.match(dzongkha['upload-completed'], /ལེགས་གྲུབ/);
assert.match(dzongkha['custom-login-logo-image-url'], /URL/);
assert.match(dzongkha['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(dzongkha['attachment-transfer-limits-title'], /API/);
assert.match(dzongkha['api-upload-limit-label'], /API/);
assert.match(dzongkha['smtp-tls-description'], /SMTP.*TLS/);
assert.deepEqual(tokens(dzongkha['email-invite-register-subject']), [
  '__inviter__',
]);
assert.deepEqual(tokens(dzongkha['email-invite-register-text']), [
  '__icode__',
  '__inviter__',
  '__url__',
  '__user__',
]);
assert.equal(
  dzongkha['email-invite-register-text'].split('\n').length,
  english['email-invite-register-text'].split('\n').length,
);
assert.match(dzongkha.Node_version, /Node/);
assert.match(dzongkha.Meteor_version, /Meteor/);
assert.match(dzongkha.FerretDB_version, /FerretDB/);
assert.match(dzongkha.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(dzongkha.DDP_transport, /DDP_TRANSPORT/);
assert.match(dzongkha.OS_Cpus, /OS.*CPU/);
assert.match(dzongkha['org-domains-description'], /a\.example\.com/);
assert.match(dzongkha['org-domains-description'], /kanban\.example\.org/);
assert.match(dzongkha['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(dzongkha['default-subtasks-board']), ['__board__']);
assert.match(dzongkha['checklist-count-on-minicard'], /0\/0/);
assert.deepEqual(tokens(dzongkha['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(dzongkha['activity-removed-label']), ['%s', '%s']);
assert.match(dzongkha['delete-board-confirm-popup'], /ཕྱིར་བཤིག/);
assert.deepEqual(tokens(dzongkha['activity-set-customfield']), [
  '%s',
  '%s',
  '%s',
]);
assert.deepEqual(tokens(dzongkha['activity-unset-customfield']), ['%s', '%s']);
assert.deepEqual(tokens(dzongkha['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(dzongkha['r-import-done']), ['__count__']);
assert.match(dzongkha['r-import-paste'], /JSON.*CSV.*Trello Butler/);
