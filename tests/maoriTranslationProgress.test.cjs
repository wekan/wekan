const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'mi'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 667);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const maori = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/mi.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(maori)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(maori.accept, 'Whakaae');
assert.deepEqual(tokens(maori['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(maori['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(maori['board-members-same-org-only'], /Whakahaere/);
assert.match(maori['board-members-same-team-only'], /Tīma/);
assert.deepEqual(tokens(maori['due-date-changed-times']), ['%s']);
assert.deepEqual(tokens(maori['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(maori['act-addAttachment'], /āpitihanga/);
assert.match(maori['act-addChecklist'], /rārangi arowhai/);
assert.match(maori['act-createCustomField'], /āpure ritenga/);
assert.match(maori['act-archivedBoard'], /Pūranga/);
assert.deepEqual(tokens(maori['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(maori['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(maori['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(maori['allboards.workspaces'], 'Ngā mokowāmahi');
assert.match(maori['allboards.edit-workspace-icon'], /markdown/);
assert.equal(maori['workspaceActionsPopup-title'],
  'Ngā Tautuhinga Mokowāmahi');
assert.deepEqual(tokens(maori['activity-dueDate']), ['%s', '%s']);
assert.match(maori['list-width-error-message'], /270/);
assert.match(maori['set-list-width-value'], /pika/);
assert.match(maori['set-swimlane-height-value'], /pika/);
assert.equal(maori['add-checklist'], 'Tāpiri Rārangi Arowhai');
assert.deepEqual(tokens(maori['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(maori['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(maori['avatar-too-big']), ['__size__']);
assert.match(maori['board-background-image-url'], /URL/);
assert.deepEqual(tokens(maori['board-nb-stars']), ['%s']);
assert.deepEqual(tags(maori['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(maori['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  maori['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(maori['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(maori['card-comments-title']), ['%s']);
assert.equal(maori['card-edit-custom-fields'], 'Whakatika āpure ritenga');
assert.match(maori['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(maori['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(maori['importDependenciesPopup-title'],
  'Kawemai whirinakitanga');
assert.equal(maori['exportChecklistPopup-title'],
  'Kaweake rārangi arowhai');
assert.equal(maori['importSwimlanePopup-title'], 'Kawemai kauhanga');
assert.match(maori.casSignIn, /CAS/);
assert.equal(maori['cardType-linkedBoard'], 'Papa Hono');
assert.match(maori['map-to-existing-user-desc'],
  /kāri.*tākupu.*mahi/);
assert.equal(maori['map-to-existing-user-no-results'],
  'Kāore i kitea he kaiwhakamahi ōrite.');
assert.match(maori['font-preview-text'], /0123456789/);
assert.equal(maori['auto-list-width'], 'Whānui rārangi aunoa');
assert.match(maori['card-aging-days'], /3/);
assert.equal(maori['move-card-up'], 'Neke kāri ki runga');
assert.equal(maori['color-red'], 'whero');
assert.equal(maori['color-silver'], 'hiriwa');
assert.equal(maori['color-magenta'], 'whero waiporoporo');
assert.equal(maori['color-white'], 'mā');
assert.equal(maori['read-only'], 'Pānui Anake');
assert.equal(maori.worker, 'Kaimahi');
const bulkCardExample = JSON.parse(maori['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(maori['custom-field-number'], 'Tau');
assert.match(maori['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(maori['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(maori['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(maori['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(maori['error-import-empty-board'], /WeKan/);
assert.equal(maori['export-card-pdf'], 'Kaweake kāri ki PDF');
assert.match(maori['export-card-excel-fields'], /Excel/);
assert.match(maori['export-card-excel-no-disk-space'], /Excel/);
assert.equal(maori['filter-due-tomorrow'], 'Ka tika āpōpō');
assert.equal(maori['filter-no-member'], 'Kāore he mema');
assert.match(maori['advanced-filter-description'],
  /== != <= >= && \|\| \( \).*Field1 == Value1.*'Field 1' == 'Value 1'.*Field1 == I\\'m.*F1 == V1 \|\| F1 == V2.*F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(maori['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(maori['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(maori['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search.*automationRules/);
assert.match(maori['import-excel-file'], /.xlsx/);
assert.match(maori['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(maori['trello-api-import-desc'], /Trello/);
assert.match(maori['trello-api-import-desc'], /API/);
assert.match(maori['invalid-year'], /2026/);
assert.deepEqual(tokens(maori['label-default']), ['%s']);
assert.deepEqual(tokens(maori['leave-board-pop']), ['__boardTitle__']);
assert.match(maori['listImportCardPopup-title'], /Trello/);
assert.match(maori['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(maori.normal, 'Pūnoa');
assert.equal(maori['multi-selection'], 'Tīpakonga-maha');
assert.deepEqual(tokens(maori['page-maybe-private']), ['%s']);
assert.deepEqual(tags(maori['page-maybe-private']),
  ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(maori['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(maori['sandstorm-remove-member-warning'],
  /WeKan.*Sandstorm.*Sandstorm/);
assert.match(maori['setWipLimitPopup-title'], /WIP/);
assert.match(maori['toggle-assignees'], /1-9/);
assert.match(maori['custom-top-left-corner-logo-height'], /27/);
assert.match(maori['automatic-linked-url-schemes'], /URL.*URL/);
assert.equal(maori['board-templates-swimlane'], 'Ngā Tātauira Papa');
assert.match(maori['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(maori['attachment-transfer-limits-title'], /API/);
assert.match(maori['smtp-tls-description'], /TLS.*SMTP/);
assert.deepEqual(tokens(maori['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(maori['email-smtp-test-subject'], /SMTP/);
assert.match(maori.Node_version, /Node/);
assert.match(maori.Meteor_version, /Meteor/);
assert.match(maori.FerretDB_version, /FerretDB/);
assert.match(maori.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(maori.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(maori.DDP_transport, /DDP.*DDP_TRANSPORT/);
assert.match(maori['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/);
assert.deepEqual(tokens(maori['default-subtasks-board']), ['__board__']);
assert.match(maori['checklist-count-on-minicard'], /0\/0/);
assert.equal(maori['parent-card'], 'Kāri matua');
assert.deepEqual(tokens(maori['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(maori['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(maori['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(maori['r-import-done']), ['__count__']);
assert.match(maori['r-import-trello-note'], /Trello/);
assert.equal((maori['r-import-trello-note'].match(/Butler/g) || []).length, 2);
assert.equal(maori['r-workspace'], 'Mokowāmahi');
assert.match(maori['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(maori['r-import-unmapped']), ['__count__']);
assert.match(maori['r-schedule-weekday'], /Mane–Paraire/);
assert.match(maori['r-for-n-days'], /N/);
assert.equal(maori['r-card-button'], 'Pātene kāri');
assert.equal(maori['r-card'], 'kāri');
assert.equal(maori['r-list'], 'rārangi');
assert.equal(maori['r-checklist'], 'rārangi arowhai');
assert.equal(maori['r-d-move-to-top-gen'],
  'Neke kāri ki runga o tōna rārangi');
assert.equal(maori['r-d-send-email'], 'Tuku īmēra');
assert.equal(maori['r-items-list'], 'tūemi1,tūemi2,tūemi3');
assert.equal(maori['r-add-swimlane'], 'Tāpiri kauhanga');
assert.match(maori['custom-head-meta-tags'], /HTML/);
assert.match(maori['custom-head-manifest-content'], /JSON/);
assert.match(maori['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(maori['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(maori['add-custom-html-before-body-end']), ['</body>']);
assert.match(maori['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(maori['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(maori['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(maori['submit-on-enter-description'],
  /Enter.*Shift\+Enter.*Ctrl\/Cmd\+Enter.*Enter/);
assert.match(maori['roles-info'], /Paewhiri Kaiwhakahaere/);
assert.equal(maori.monday, 'Mane');
assert.equal(maori.sunday, 'Rātapu');
assert.equal(maori.voting, 'Pōti');
assert.match(maori['invalid-domain'], /example\.com.*@/);
assert.equal(maori.person, 'Tangata');
assert.match(maori['dueCardsViewChange-choice-all-description'],
  /\*Tika\*/);
assert.deepEqual(tokens(maori['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(maori['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(maori['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(maori['operator-board'], 'papa');
assert.equal(maori['operator-swimlane'], 'kauhanga');
assert.equal(maori['operator-checklist-text'], 'rārangi-arowhai');
assert.equal(maori['predicate-overdue'], 'hipa-wā');
assert.deepEqual(tokens(maori['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(maori['globalSearch-instructions-description']),
  ['__operator_list__']);
assert.deepEqual(tokens(maori['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.match(maori['globalSearch-instructions-notes-2'], /\*OR\*/);
assert.match(maori['globalSearch-instructions-notes-3'], /\*AND\*/);
assert.equal(maori['number'], 'Tau');
assert.equal(maori['card-dependencies'], 'Ngā Whirinakitanga');
assert.deepEqual(tokens(maori['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(maori['background-too-big']), ['{{size}}']);
assert.equal(maori['location-address'], 'Wāhitau');
assert.equal(maori['location-latitude'], 'Ahopae');
assert.match(maori['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan.*sudo docker logs wekan-app/s);
assert.deepEqual(tokens(maori['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.equal(maori['reports'], 'Ngā Pūrongo');
assert.match(maori['office-report-desc'], /IPv4.*IPv6/);
