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
assert.equal(Object.keys(remaining).length, 1417);

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
