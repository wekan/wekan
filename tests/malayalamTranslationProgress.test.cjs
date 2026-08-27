const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ml'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 817);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const malayalam = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ml.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(malayalam)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(malayalam.accept, 'സ്വീകരിക്കുക');
assert.match(malayalam.accept, /[\u0D00-\u0D7F]/);
assert.deepEqual(tokens(malayalam['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(malayalam['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.match(malayalam['board-members-same-org-only'], /സംഘടന/);
assert.match(malayalam['board-members-same-team-only'], /ടീമ/);
assert.deepEqual(tokens(malayalam['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(malayalam['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(malayalam['act-archivedBoard'], /ആർക്കൈവ/);
assert.deepEqual(tokens(malayalam['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(malayalam['activity-imported']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(malayalam['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(malayalam['allboards.workspaces'], 'പ്രവർത്തനസ്ഥലങ്ങൾ');
assert.match(malayalam['allboards.edit-workspace-icon'], /markdown/);
assert.equal(malayalam['workspaceActionsPopup-title'],
  'പ്രവർത്തനസ്ഥല ക്രമീകരണങ്ങൾ');
assert.deepEqual(tokens(malayalam['activity-dueDate']), ['%s', '%s']);
assert.match(malayalam['list-width-error-message'], /270/);
assert.match(malayalam['set-list-width-value'], /പിക്സൽ/);
assert.match(malayalam['set-swimlane-height-value'], /പിക്സൽ/);
assert.equal(malayalam['add-checklist'], 'ചെക്ക്‌ലിസ്റ്റ് ചേർക്കുക');
assert.deepEqual(tokens(malayalam['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(malayalam['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(malayalam['avatar-too-big']), ['__size__']);
assert.match(malayalam['board-background-image-url'], /URL/);
assert.deepEqual(tokens(malayalam['board-nb-stars']), ['%s']);
assert.deepEqual(tags(malayalam['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(malayalam['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  malayalam['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(malayalam['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(malayalam['card-comments-title']), ['%s']);
assert.equal(malayalam['card-edit-custom-fields'],
  'ഇഷ്ടാനുസൃത ഫീൽഡുകൾ തിരുത്തുക');
assert.match(malayalam['cardStartPlanningPokerPopup-title'],
  /Planning Poker/);
assert.match(malayalam['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(malayalam['importDependenciesPopup-title'],
  'ആശ്രിതത്വങ്ങൾ ഇറക്കുമതി ചെയ്യുക');
assert.equal(malayalam['exportChecklistPopup-title'],
  'ചെക്ക്‌ലിസ്റ്റ് കയറ്റുമതി ചെയ്യുക');
assert.equal(malayalam['importSwimlanePopup-title'],
  'സ്വിംലെയിൻ ഇറക്കുമതി ചെയ്യുക');
assert.match(malayalam.casSignIn, /CAS/);
assert.equal(malayalam['cardType-linkedBoard'], 'ബന്ധിപ്പിച്ച ബോർഡ്');
assert.match(malayalam['map-to-existing-user-desc'],
  /കാർഡുകളും.*അഭിപ്രായങ്ങളും.*പ്രവർത്തനവും/);
assert.equal(malayalam['map-to-existing-user-no-results'],
  'പൊരുത്തപ്പെടുന്ന ഉപയോക്താക്കളെ കണ്ടെത്തിയില്ല.');
assert.match(malayalam['font-preview-text'], /0123456789/);
assert.equal(malayalam['auto-list-width'],
  'പട്ടികയുടെ സ്വയമേവയുള്ള വീതി');
assert.match(malayalam['card-aging-days'], /3/);
assert.equal(malayalam['move-card-up'], 'കാർഡ് മുകളിലേക്ക് മാറ്റുക');
assert.equal(malayalam['color-red'], 'ചുവപ്പ്');
assert.equal(malayalam['color-silver'], 'വെള്ളിനിറം');
assert.equal(malayalam['color-magenta'], 'മജന്ത');
assert.equal(malayalam['color-white'], 'വെള്ള');
assert.equal(malayalam['read-only'], 'വായിക്കാൻ മാത്രം');
assert.equal(malayalam.worker, 'തൊഴിലാളി');
const bulkCardExample = JSON.parse(malayalam['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(malayalam['custom-field-number'], 'സംഖ്യ');
assert.match(malayalam['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(malayalam['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(malayalam['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(malayalam['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(malayalam['error-import-empty-board'], /WeKan/);
assert.match(malayalam['error-csv-schema'], /CSV.*TSV/);
assert.equal(malayalam['export-card-pdf'],
  'കാർഡ് PDF ആയി കയറ്റുമതി ചെയ്യുക');
assert.match(malayalam['export-card-excel-fields'], /Excel/);
assert.match(malayalam['export-card-excel-no-disk-space'], /Excel/);
assert.equal(malayalam['filter-due-tomorrow'], 'നാളെ അവസാനിക്കുന്നു');
assert.equal(malayalam['filter-no-member'], 'അംഗമില്ല');
assert.equal(malayalam['filter-assignee-label'],
  'ചുമതലപ്പെടുത്തിയ വ്യക്തി പ്രകാരം ഫിൽട്ടർ ചെയ്യുക');
assert.match(malayalam['advanced-filter-description'],
  /== != <= >= && \|\| \( \).*Field1 == Value1/);
assert.deepEqual(tokens(malayalam['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(malayalam['import-board-instruction-kanboard'], /Kanboard/);
assert.match(malayalam['import-board-instruction-openproject'], /OpenProject/);
assert.match(malayalam['import-board-instruction-trello'], /Trello/);
assert.match(malayalam['import-board-instruction-csv'], /CSV.*TSV/);
assert.equal(malayalam['import-trello-zip-progress'],
  '.zip-ൽ നിന്ന് ബോർഡുകൾ ഇറക്കുമതി ചെയ്യുന്നു, ദയവായി കാത്തിരിക്കുക…');
assert.match(malayalam['trello-api-key'], /Trello API.*https:\/\/trello\.com\/app-key/);
assert.equal(malayalam['trello-import-selected'],
  'തിരഞ്ഞെടുത്ത ബോർഡുകൾ ഇറക്കുമതി ചെയ്യുക');
assert.equal(malayalam['trello-cancel-delete'],
  'റദ്ദാക്കി ഇറക്കുമതി ചെയ്തവ ഇല്ലാതാക്കുക');
assert.equal(malayalam['import-map-members'], 'അംഗങ്ങളെ പൊരുത്തപ്പെടുത്തുക');
assert.match(malayalam['invalid-year'], /2026/);
assert.deepEqual(tokens(malayalam['label-default']), ['%s']);
assert.deepEqual(tokens(malayalam['leave-board-pop']), ['__boardTitle__']);
assert.match(malayalam['list-archive-cards-pop'], /“Menu”.*“Archive”/);
assert.match(malayalam['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(malayalam['multi-selection'], 'ഒന്നിലധികം തിരഞ്ഞെടുക്കൽ');
assert.equal(malayalam['no-archived-cards'], 'ആർക്കൈവിൽ കാർഡുകളില്ല.');
assert.equal(malayalam.normal, 'സാധാരണ');
assert.deepEqual(tokens(malayalam['page-maybe-private']), ['%s']);
assert.deepEqual(tags(malayalam['page-maybe-private']), ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(malayalam['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(malayalam['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.match(malayalam['setWipLimitPopup-title'], /WIP/);
assert.equal(malayalam['sidebar-open'], 'സൈഡ്ബാർ തുറക്കുക');
assert.equal(malayalam['starred-boards'], 'നക്ഷത്രമിട്ട ബോർഡുകൾ');
assert.match(malayalam['toggle-assignees'], /1-9/);
assert.match(malayalam['custom-top-left-corner-logo-height'], /27/);
assert.match(malayalam['automatic-linked-url-schemes'], /URL/);
assert.equal(malayalam['welcome-swimlane'], 'നാഴികക്കല്ല് 1');
assert.match(malayalam['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.match(malayalam['attachment-transfer-limits-title'], /API/);
assert.match(malayalam['smtp-host-description'], /SMTP/);
assert.match(malayalam['smtp-tls-description'], /SMTP.*TLS/);
assert.deepEqual(tokens(malayalam['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(malayalam['outgoing-webhooks'], 'പുറത്തേക്കുള്ള വെബ്‌ഹുക്കുകൾ');
assert.match(malayalam.Node_version, /Node/);
assert.match(malayalam.Meteor_version, /Meteor/);
assert.equal(malayalam.FerretDB_commit, 'FerretDB കമ്മിറ്റ്');
assert.match(malayalam.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(malayalam.DDP_transport, /DDP_TRANSPORT/);
assert.match(malayalam['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/);
assert.equal(malayalam['org-admin'], 'സംഘടനാ അഡ്മിൻ');
assert.deepEqual(tokens(malayalam['default-subtasks-board']), ['__board__']);
assert.match(malayalam['checklist-count-on-minicard'], /0\/0/);
assert.equal(malayalam['parent-card'], 'പാരന്റ് കാർഡ്');
assert.deepEqual(tokens(malayalam['activity-added-label']), ['%s', '%s']);
assert.equal(malayalam['boardDeletePopup-title'], 'ബോർഡ് ഇല്ലാതാക്കണോ?');
assert.deepEqual(tokens(malayalam['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(malayalam['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(malayalam['r-import-done']), ['__count__']);
assert.match(malayalam['r-import-paste'], /JSON.*CSV.*Trello Butler/);
assert.equal(malayalam['r-all-boards'], 'എല്ലാ ബോർഡുകളും');
assert.deepEqual(tokens(malayalam['r-import-unmapped']), ['__count__']);
assert.match(malayalam['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.match(malayalam['r-schedule-weekday'], /തിങ്കൾ–വെള്ളി/);
assert.equal(malayalam['r-mark-complete'],
  'കാർഡ് പൂർത്തിയായതായി അടയാളപ്പെടുത്തുക');
assert.equal(malayalam['r-unit-weeks'], 'ആഴ്ച');
assert.equal(malayalam['r-unarchived'], 'ആർക്കൈവിൽ നിന്ന് പുനഃസ്ഥാപിച്ചു');
assert.equal(malayalam['r-remove-all'],
  'കാർഡിൽ നിന്ന് എല്ലാ അംഗങ്ങളെയും നീക്കുക');
assert.equal(malayalam['r-check-all'], 'എല്ലാം അടയാളപ്പെടുത്തുക');
assert.equal(malayalam['r-d-move-to-top-gen'],
  'കാർഡ് അതിന്റെ പട്ടികയുടെ മുകളിലേക്ക് മാറ്റുക');
assert.equal(malayalam['r-d-send-email'], 'ഇമെയിൽ അയയ്ക്കുക');
assert.equal(malayalam['r-items-list'], 'ഇനം1,ഇനം2,ഇനം3');
assert.match(malayalam['r-checklist-note'], /കോമ/);
assert.equal(malayalam['authentication-method'], 'പ്രാമാണീകരണ രീതി');
assert.match(malayalam['custom-head-meta-tags'], /HTML/);
assert.match(malayalam['custom-head-manifest-content'], /JSON/);
assert.match(malayalam['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(malayalam['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(malayalam['add-custom-html-before-body-end']), ['</body>']);
assert.deepEqual(tokens(malayalam['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(malayalam['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(malayalam['submit-on-enter'],
  'Enter അമർത്തി എഡിറ്ററുകൾ സമർപ്പിക്കുക');
assert.match(malayalam['submit-on-enter-description'],
  /Enter.*Shift\+Enter.*Ctrl\/Cmd\+Enter/);
assert.equal(malayalam['roles-status-sees-assigned'],
  'ചുമതലപ്പെടുത്തിയവ മാത്രം');
assert.equal(malayalam.monday, 'തിങ്കളാഴ്ച');
assert.equal(malayalam.sunday, 'ഞായറാഴ്ച');
assert.equal(malayalam.voting, 'വോട്ടെടുപ്പ്');
assert.match(malayalam['invalid-domain'], /example\.com.*@/);
assert.equal(malayalam['shared-templates'], 'പങ്കിട്ട ടെംപ്ലേറ്റുകൾ');
assert.match(malayalam['globalSearchViewChange-choice-all-description'],
  /\*My cards\*/);
for (const key of ['board-title-not-found', 'swimlane-title-not-found',
  'list-title-not-found', 'label-not-found', 'label-color-not-found']) {
  assert.deepEqual(tokens(malayalam[key]), ['%s'], key);
}
assert.deepEqual(tokens(malayalam['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(malayalam['operator-board'], 'ബോർഡ്');
assert.equal(malayalam['operator-customfield'], 'ഇഷ്ടാനുസൃതഫീൽഡ്');
assert.equal(malayalam['predicate-overdue'], 'കാലഹരണപ്പെട്ടത്');
assert.equal(malayalam['predicate-quarter'], 'പാദവർഷം');
