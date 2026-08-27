const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'mg'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 717);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const malagasy = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/mg.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(malagasy)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(malagasy.accept, 'Ekeo');
assert.deepEqual(tokens(malagasy['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(malagasy['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(malagasy['board-members-same-org-only'], /fikambanana/);
assert.match(malagasy['board-members-same-team-only'], /ekipa/);
assert.deepEqual(tokens(malagasy['due-date-changed-times']), ['%s']);
assert.deepEqual(tokens(malagasy['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(malagasy['act-addAttachment'], /rakitra/);
assert.match(malagasy['act-addChecklist'], /lisitra fanamarinana/);
assert.match(malagasy['act-createCustomField'], /saha namboarina/);
assert.match(malagasy['act-archivedBoard'], /arisiva/);
assert.deepEqual(tokens(malagasy['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(malagasy['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(malagasy['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(malagasy['allboards.workspaces'], 'Toeram-piasana');
assert.match(malagasy['allboards.edit-workspace-icon'], /markdown/);
assert.equal(malagasy['workspaceActionsPopup-title'],
  'Fikirana toeram-piasana');
assert.deepEqual(tokens(malagasy['activity-dueDate']), ['%s', '%s']);
assert.match(malagasy['list-width-error-message'], /270/);
assert.match(malagasy['set-list-width-value'], /piksel/);
assert.match(malagasy['set-swimlane-height-value'], /piksel/);
assert.equal(malagasy['add-checklist'], 'Ampio lisitra fanamarinana');
assert.deepEqual(tokens(malagasy['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(malagasy['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(malagasy['avatar-too-big']), ['__size__']);
assert.match(malagasy['board-background-image-url'], /URL/);
assert.deepEqual(tokens(malagasy['board-nb-stars']), ['%s']);
assert.deepEqual(tags(malagasy['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(malagasy['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  malagasy['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(malagasy['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(malagasy['card-comments-title']), ['%s']);
assert.equal(malagasy['card-edit-custom-fields'],
  'Ovay ny saha namboarina');
assert.match(malagasy['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(malagasy['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(malagasy['importDependenciesPopup-title'],
  'Manafatra fiankinana');
assert.equal(malagasy['exportChecklistPopup-title'],
  'Manondrana lisitra fanamarinana');
assert.equal(malagasy['importSwimlanePopup-title'], 'Manafatra lalana');
assert.match(malagasy.casSignIn, /CAS/);
assert.equal(malagasy['cardType-linkedBoard'], 'Solaitra mifandray');
assert.match(malagasy['map-to-existing-user-desc'],
  /karatra.*fanamarihana.*hetsika/);
assert.equal(malagasy['map-to-existing-user-no-results'],
  'Tsy nahitana mpampiasa mifanaraka.');
assert.match(malagasy['font-preview-text'], /0123456789/);
assert.equal(malagasy['auto-list-width'],
  "Sakan'ny lisitra mandeha ho azy");
assert.match(malagasy['card-aging-days'], /3/);
assert.equal(malagasy['move-card-up'], 'Afindrao miakatra ny karatra');
assert.equal(malagasy['color-red'], 'mena');
assert.equal(malagasy['color-silver'], 'volafotsy');
assert.equal(malagasy['color-magenta'], 'mena volomparasy');
assert.equal(malagasy['color-white'], 'fotsy');
assert.equal(malagasy['read-only'], 'Vakiana ihany');
assert.equal(malagasy.worker, 'Mpiasa');
const bulkCardExample = JSON.parse(malagasy['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(malagasy['custom-field-number'], 'Isa');
assert.match(malagasy['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(malagasy['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(malagasy['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(malagasy['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(malagasy['error-import-empty-board'], /WeKan/);
assert.equal(malagasy['export-card-pdf'], 'Manondrana karatra ho PDF');
assert.match(malagasy['export-card-excel-fields'], /Excel/);
assert.match(malagasy['export-card-excel-no-disk-space'], /Excel/);
assert.equal(malagasy['filter-due-tomorrow'], 'Voatondro rahampitso');
assert.equal(malagasy['filter-no-member'], 'Tsy misy mpikambana');
assert.match(malagasy['advanced-filter-description'],
  /== != <= >= && \|\| \( \).*Field1 == Value1.*'Field 1' == 'Value 1'.*Field1 == I\\'m.*F1 == V1 \|\| F1 == V2.*F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(malagasy['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(malagasy['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(malagasy['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search.*automationRules/);
assert.match(malagasy['import-excel-file'], /.xlsx/);
assert.match(malagasy['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(malagasy['trello-api-import-desc'], /Trello API/);
assert.match(malagasy['invalid-year'], /2026/);
assert.deepEqual(tokens(malagasy['label-default']), ['%s']);
assert.deepEqual(tokens(malagasy['leave-board-pop']), ['__boardTitle__']);
assert.match(malagasy['listImportCardPopup-title'], /Trello/);
assert.match(malagasy['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(malagasy.normal, 'Mahazatra');
assert.equal(malagasy['multi-selection'], 'Safidy maro');
assert.deepEqual(tokens(malagasy['page-maybe-private']), ['%s']);
assert.deepEqual(tags(malagasy['page-maybe-private']),
  ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(malagasy['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(malagasy['sandstorm-remove-member-warning'],
  /WeKan.*Sandstorm.*Sandstorm/);
assert.match(malagasy['setWipLimitPopup-title'], /WIP/);
assert.match(malagasy['toggle-assignees'], /1-9/);
assert.match(malagasy['custom-top-left-corner-logo-height'], /27/);
assert.match(malagasy['automatic-linked-url-schemes'], /URL.*URL/);
assert.equal(malagasy['board-templates-swimlane'],
  'Lasitry ny solaitra');
assert.match(malagasy['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(malagasy['attachment-transfer-limits-title'], /API/);
assert.match(malagasy['smtp-tls-description'], /TLS.*SMTP/);
assert.deepEqual(tokens(malagasy['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(malagasy['email-smtp-test-subject'], /SMTP/);
assert.match(malagasy.Node_version, /Node/);
assert.match(malagasy.Meteor_version, /Meteor/);
assert.match(malagasy.FerretDB_version, /FerretDB/);
assert.match(malagasy.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(malagasy.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(malagasy.DDP_transport, /DDP.*DDP_TRANSPORT/);
assert.match(malagasy['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/);
assert.deepEqual(tokens(malagasy['default-subtasks-board']), ['__board__']);
assert.match(malagasy['checklist-count-on-minicard'], /0\/0/);
assert.equal(malagasy['parent-card'], 'Karatra ray aman-dreny');
assert.deepEqual(tokens(malagasy['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(malagasy['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(malagasy['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(malagasy['r-import-done']), ['__count__']);
assert.match(malagasy['r-import-trello-note'], /Trello.*Butler.*Butler/);
assert.equal(malagasy['r-workspace'], 'Toeram-piasana');
assert.match(malagasy['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(malagasy['r-import-unmapped']), ['__count__']);
assert.match(malagasy['r-schedule-weekday'], /Alats–Zoma/);
assert.match(malagasy['r-for-n-days'], /N/);
assert.equal(malagasy['r-card-button'], 'Bokotra karatra');
assert.equal(malagasy['r-card'], 'karatra');
assert.equal(malagasy['r-list'], 'lisitra');
assert.equal(malagasy['r-checklist'], 'lisitra fanamarinana');
assert.equal(malagasy['r-d-move-to-top-gen'],
  "Afindrao eo an-tampon'ny lisiny ny karatra");
assert.equal(malagasy['r-d-send-email'], 'Mandefasa mailaka');
assert.equal(malagasy['r-items-list'], 'singa1,singa2,singa3');
assert.equal(malagasy['r-add-swimlane'], 'Ampio lalana');
assert.match(malagasy['custom-head-meta-tags'], /HTML/);
assert.match(malagasy['custom-head-manifest-content'], /JSON/);
assert.match(malagasy['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(malagasy['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(malagasy['add-custom-html-before-body-end']), ['</body>']);
assert.match(malagasy['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(malagasy['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(malagasy['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(malagasy['submit-on-enter-description'],
  /Enter.*Shift\+Enter.*Ctrl\/Cmd\+Enter.*Enter/);
assert.match(malagasy['roles-info'], /Tontonana mpitantana/);
assert.equal(malagasy.monday, 'Alatsinainy');
assert.equal(malagasy.sunday, 'Alahady');
assert.equal(malagasy.voting, 'Fifidianana');
assert.match(malagasy['invalid-domain'], /example\.com.*@/);
assert.equal(malagasy.person, 'Olona');
assert.match(malagasy['dueCardsViewChange-choice-all-description'],
  /\*Voatondro\*/);
assert.deepEqual(tokens(malagasy['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(malagasy['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(malagasy['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(malagasy['operator-board'], 'solaitra');
assert.equal(malagasy['operator-swimlane'], 'lalana');
assert.equal(malagasy['operator-checklist-text'], 'lisitra-fanamarinana');
assert.equal(malagasy['predicate-overdue'], 'tara');
assert.deepEqual(tokens(malagasy['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(malagasy['globalSearch-instructions-description']),
  ['__operator_list__']);
assert.deepEqual(tokens(malagasy['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.match(malagasy['globalSearch-instructions-notes-2'], /\*OR\*/);
assert.match(malagasy['globalSearch-instructions-notes-3'], /\*AND\*/);
assert.match(malagasy['sort-boards-title-asc'], /A → Z/);
assert.match(malagasy['import-dependencies-file'], /JSON.*SVG/);
assert.deepEqual(tokens(malagasy['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(malagasy['background-too-big']), ['{{size}}']);
assert.equal(malagasy['location-open-map'], "Sokafy amin'ny sarintany");
