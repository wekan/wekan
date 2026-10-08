// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', 'is'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const icelandic = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/is.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(icelandic)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(icelandic.accept, 'Samþykkja');
assert.deepEqual(tokens(icelandic['act-addChecklistItem']),
  ['__board__', '__card__', '__checklistItem__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(icelandic['act-createBoard'], 'bjó til töflu __board__');
assert.match(icelandic['act-addAttachment'], /viðhengi/);
assert.deepEqual(tokens(icelandic['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.equal(icelandic['allboards.workspaces'], 'Vinnusvæði');
assert.equal(icelandic['workspace-settings'], 'Stillingar vinnusvæðis');
assert.equal(icelandic['home-board-badge'],
  'Heimatafla (opnast eftir innskráningu)');
assert.equal(icelandic['set-list-width-value'], 'Breidd lista (dílar)');
assert.equal(icelandic['add-checklist'], 'Bæta við gátlista');
assert.deepEqual(tokens(icelandic['and-n-other-card']), ['__count__']);
assert.equal(icelandic['board-not-found'], 'Tafla fannst ekki');
assert.deepEqual(tags(icelandic['board-private-info']), ['</strong>', '<strong>']);
assert.deepEqual(tags(icelandic['board-public-info']), ['</strong>', '<strong>']);
assert.deepEqual(tokens(icelandic['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.equal(icelandic['card-due'], 'Skilafrestur');
assert.match(icelandic['card-edit-planning-poker'], /Planning Poker/);
assert.equal(icelandic['addBoardOrgPopup-title'], 'Bæta við stofnun');
assert.equal(icelandic['importSwimlanePopup-title'], 'Flytja inn sundbraut');
assert.equal(icelandic['userPopup-title'], 'Meðlimur');
assert.equal(icelandic['map-to-existing-user-no-results'],
  'Engir samsvarandi notendur fundust.');
assert.equal(icelandic['changePermissionsPopup-title'], 'Breyta heimildum');
assert.equal(icelandic['auto-list-width'], 'Sjálfvirk listabreidd');
assert.equal(icelandic['move-card-up'], 'Færa spjald upp');
assert.equal(icelandic['color-sky'], 'himinblár');
assert.equal(icelandic['comment-only'], 'Aðeins athugasemdir');
assert.equal(icelandic['copy-link-to-clipboard'], 'Afrita tengil á klemmuspjald');
assert.equal(icelandic['custom-field-number'], 'Tala');
assert.equal(icelandic['custom-field-text'], 'Texti');
assert.deepEqual(tokens(icelandic['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(icelandic['error-list-doesNotExist'], 'Þessi listi er ekki til');
assert.equal(icelandic['export-card'], 'Flytja spjald út');
assert.equal(icelandic['filter-due-tomorrow'], 'Skil á morgun');
assert.equal(icelandic['filter-assignee-label'], 'Sía eftir ábyrgðaraðila');
assert.deepEqual(tokens(icelandic['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(icelandic['import-trello-zip-too-large'],
  '.zip-skráin er of stór til innflutnings.');
assert.equal(icelandic['trello-import-progress'], 'Framvinda innflutnings');
assert.equal(icelandic['label-default'], '%s merki (sjálfgefið)');
assert.deepEqual(tokens(icelandic['label-default']), ['%s']);
assert.deepEqual(tokens(icelandic['leave-board-pop']), ['__boardTitle__']);
assert.equal(icelandic['multi-selection'], 'Fjölval');
assert.equal(icelandic['no-archived-swimlanes'], 'Engar sundbrautir í safni.');
assert.deepEqual(tokens(icelandic['page-maybe-private']), ['%s']);
assert.deepEqual(tags(icelandic['page-maybe-private']), ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(icelandic['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(icelandic['rename-board'], 'Endurnefna töflu');
assert.equal(icelandic['starred-boards'], 'Stjörnumerktar töflur');
assert.equal(icelandic['upload-completed'], 'Upphleðslu lokið');
assert.equal(icelandic['card-templates-swimlane'], 'Spjaldasniðmát');
assert.equal(icelandic['attachment-limits'], 'Mörk');
assert.deepEqual(tokens(icelandic['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(icelandic.Database, 'Gagnagrunnur');
assert.equal(icelandic.Database_type, 'Tegund gagnagrunns');
assert.match(icelandic['org-domains-description'], /MULTITENANCY=true/);
assert.equal(icelandic['org-admin'], 'Stjórnandi stofnunar');
assert.deepEqual(tokens(icelandic['default-subtasks-board']), ['__board__']);
assert.equal(icelandic['parent-card'], 'Foreldraspjald');
assert.deepEqual(tokens(icelandic['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(icelandic['activity-set-customfield']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(icelandic['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(icelandic['r-import-done']), ['__count__']);
assert.equal(icelandic['r-board-rules'], 'Töflureglur');
assert.deepEqual(tokens(icelandic['r-import-unmapped']), ['__count__']);
assert.equal(icelandic['r-schedule-weekday'], 'Alla virka daga (mán.–fös.)');
assert.equal(icelandic['r-mark-complete'], 'Merkja spjald lokið');
assert.equal(icelandic['r-unarchived'], 'Endurheimt úr safni');
assert.equal(icelandic['r-remove-all'], 'Fjarlægja alla meðlimi af spjaldinu');
assert.equal(icelandic['r-d-send-email'], 'Senda tölvupóst');
assert.equal(icelandic['r-d-unarchive'], 'Endurheimta spjald úr safni');
assert.equal(icelandic['r-items-list'], 'atriði1,atriði2,atriði3');
assert.equal(icelandic['authentication-method'], 'Auðkenningaraðferð');
assert.deepEqual(tags(icelandic['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(icelandic['add-custom-html-before-body-end']), ['</body>']);
assert.deepEqual(tokens(icelandic['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(icelandic['duplicate-board'], 'Afrita töflu');
assert.match(icelandic['submit-on-enter-description'], /Shift\+Enter/);
assert.match(icelandic['submit-on-enter-description'], /Ctrl\/Cmd\+Enter/);
assert.equal(icelandic.monday, 'Mánudagur');
assert.equal(icelandic['roles-status-empty'], 'Engin töfluhlutverk.');
assert.equal(icelandic['create-task'], 'Búa til verk');
assert.equal(icelandic['shared-templates'], 'Sameiginleg sniðmát');
assert.deepEqual(tokens(icelandic['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(icelandic['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(icelandic['operator-board'], 'tafla');
assert.equal(icelandic['predicate-overdue'], 'komið fram yfir skiladag');
assert.deepEqual(tokens(icelandic['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(icelandic['globalSearch-instructions-operator-has']),
  tokens(english['globalSearch-instructions-operator-has']));
assert.deepEqual(tags(icelandic['globalSearch-instructions-operator-board']),
  tags(english['globalSearch-instructions-operator-board']));
assert.equal(icelandic['link-to-search'], 'Tengill á þessa leit');
assert.deepEqual(tokens(icelandic['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(icelandic['background-too-big']), ['{{size}}']);
assert.equal(icelandic['dependency-type-is-blocked-by'], 'Er hindrað af');
assert.deepEqual(tokens(icelandic['custom-field-stringtemplate-format']), ['%{value}']);
assert.match(icelandic['server-error-troubleshooting'], /sudo docker logs wekan-app/);
assert.equal(icelandic.officeReportTitle, 'Skrifstofur');
assert.match(icelandic['api-no-calls'], /WITH_API=true/);
assert.equal(icelandic['recovery-db'], 'Gagnagrunnur');
assert.equal(icelandic['copy-swimlane'], 'Afrita sundbraut');
assert.equal(icelandic['add-teams'], 'Bæta við teymum');
assert.equal(icelandic.copyChecklist, 'Afrita gátlista');
assert.equal(icelandic['attachment-move-storage-gridfs'], 'Færa viðhengi í GridFS');
assert.equal(icelandic['move-storage-fs'], 'Skráarkerfi');
assert.equal(icelandic['gridfs-file-id'], 'Auðkenni GridFS-skrár');
assert.match(icelandic['mongodb-compact-warning'], /oplog/);
assert.equal(icelandic['board-status'], 'Staða töflu');
assert.deepEqual(tokens(icelandic['drag-board-to-workspace']), ['__workspaces__']);
assert.equal(icelandic.accessibility, 'Aðgengi');
assert.equal(icelandic['accounts-lockout-locked-users'], 'Læstir notendur');
assert.equal(icelandic['accounts-lockout-period'], 'Læsingartími (sekúndur)');
assert.equal(icelandic['cron-jobs'], 'Tímasett verk');
assert.deepEqual(tokens(icelandic['database-migration-confirm']), ['__db__']);
assert.match(icelandic['database-migration-description'], /WEKAN_FERRETDB_URL/);
assert.equal(icelandic['sandstorm-migration-success'], 'Tókst');
assert.deepEqual(tags(icelandic['render-links-as-plain-text-description']),
  tags(english['render-links-as-plain-text-description']));
assert.match(icelandic['cards-loading-description'], /CARDS_LOADING_LAZY_THRESHOLD/);
assert.equal(icelandic['backup-now'], 'Taka öryggisafrit núna');
assert.equal(icelandic['backup-frequency-weekly'], 'Vikulega');
assert.match(icelandic['gcs-permissions-note'], /client_email/);
assert.equal(icelandic['cloud-connection-success'], 'Tenging tókst');
assert.equal(icelandic['gridfs-enabled'], 'GridFS virkt');
assert.match(icelandic['s3-region-description'], /us-east-1/);
assert.equal(icelandic['board-migrations'], 'Flutningar taflna');
assert.equal(icelandic['lost-cards'], 'Týnd spjöld');
assert.match(icelandic['restore-lost-cards-migration-description'], /swimlaneId/);
assert.equal(icelandic['step-convert-shared-lists'], 'Umbreyta sameiginlegum listum');
assert.equal(icelandic['step-fix-attachment-urls'], 'Lagfæra slóðir viðhengja');
assert.equal(icelandic['cpu-cores'], 'Örgjörvakjarnar');
assert.equal(icelandic['every-10-minutes'], 'Á 10 mínútna fresti');
assert.equal(icelandic['memory-usage'], 'Minnisnotkun');
assert.equal(icelandic['migration-cpu-threshold'], 'Örgjörvamörk (%)');
assert.equal(icelandic['total-attachments'], 'Heildarfjöldi viðhengja');
assert.equal(icelandic['repository'], 'Hirsla');
assert.deepEqual(tokens(icelandic['repair-broken-cards-done-unfixable']),
  ['__fixed__', '__unfixable__']);
assert.equal(icelandic['event-source'], 'Uppruni');
assert.equal(icelandic.integrityReportTitle, 'Heilleiki skráarkerfis');
assert.deepEqual(tokens(icelandic['globalSearch-instructions-operator-number']),
  ['__operator_number__']);
assert.deepEqual(tags(icelandic['globalSearch-instructions-operator-number']),
  tags(english['globalSearch-instructions-operator-number']));

const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const recoveryKeys = Object.keys(english).filter(key => key.startsWith('stuck-sync-operation-'));
assert.equal(recoveryKeys.length, 23);
for (const key of recoveryKeys) {
  assert.notEqual(icelandic[key], english[key], key);
  assert.deepEqual(translationTokens(icelandic[key]), translationTokens(english[key]), key);
}
assert.match(icelandic['stuck-sync-operation-description'], /breytingar sem þegar hafa verið gerðar haldast/);
assert.match(icelandic['stuck-sync-operation-description'], /breytingar sem eftir eru verða aldrei skrifaðar/);
assert.match(icelandic['stuck-sync-operation-reason-access-denied'], /skrifaðgang að öllum listanum/);
assert.match(icelandic['stuck-sync-operation-replayable-now'], /ekki er hægt að farga/);
assert.match(icelandic['stuck-sync-operation-not-stuck'], /ekki er hægt að farga/);
assert.match(icelandic['stuck-sync-operation-truncated'], /50 elstu/);
assert.match(icelandic['stuck-sync-operation-busy'], /samstilla þennan lista núna/);

const interruptedImportKeys = Object.keys(english).filter(key => key.startsWith('interrupted-import-'));
assert.equal(interruptedImportKeys.length, 25);
for (const key of interruptedImportKeys) {
  assert.notEqual(icelandic[key], english[key], key);
  assert.deepEqual(translationTokens(icelandic[key]), translationTokens(english[key]), key);
}
assert.match(icelandic['interrupted-import-description'], /upprunaskráin er ekki varðveitt/);
assert.match(icelandic['interrupted-import-description'], /allt sem hefur verið bætt við síðan/);
assert.match(icelandic['interrupted-import-counts'], /__swimlanes__ sundbrautir/);
assert.match(icelandic['interrupted-import-discard-confirm'], /fjarlægt varanlega/);
assert.match(icelandic['interrupted-import-keep-confirm'], /Ekkert er fjarlægt/);
assert.match(icelandic['interrupted-import-foreign-board'], /var því ekki breytt/);
assert.match(icelandic['interrupted-import-truncated'], /50 elstu/);
assert.match(icelandic['interrupted-import-scrum-busy'], /Enn er verið að skrifa eða endurheimta/);

const translatedPlanningControls = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-todoist", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "login-origin-mismatch", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const key of translatedPlanningControls) {
  assert.notEqual(icelandic[key], english[key], key);
  assert.deepEqual(translationTokens(icelandic[key]), translationTokens(english[key]), key);
}
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
  assert.ok(icelandic['import-board-instruction-orgmode'].includes(literal), literal);
}
for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
  assert.ok(icelandic['import-board-instruction-todoist'].includes(literal), literal);
}
assert.ok(icelandic['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(icelandic['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
  assert.ok(icelandic['ldap-sync-now-nothing'].includes(literal), literal);
}
assert.match(icelandic['login-origin-mismatch'], /ROOT_URL/);
assert.match(icelandic['sync-planning-hint'], /fyrsta samstilling fjarlægir aldrei/);
assert.match(icelandic['scrum-import-into-board-hint'], /aldrei tvítekin/);
assert.match(icelandic['scrum-history-checkpoint-hint'], /enginn annar hefur síðan breytt/);
assert.match(icelandic['scrum-history-checkpoint-hint'], /breytir engum færslum/);
assert.match(icelandic['login-setting-env-only'], /aðeins sýnt til lestrar/);
