// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', 'ht'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);

const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const creole = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/ht.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(/__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)].map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)].map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(creole)) {
  if (value !== english[key]) assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(creole.accept, 'Aksepte');
assert.match(creole['act-createBoard'], /tablo/i);
assert.match(creole['act-createCard'], /kat/i);
assert.deepEqual(tokens(creole['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(creole['act-moveCard']),
  ['__board__', '__card__', '__list__', '__oldList__', '__oldSwimlane__', '__swimlane__']);
assert.equal(creole['allboards.workspaces'], 'Espas travay');
assert.equal(creole['home-board-badge'], 'Tablo Akèy (ouvri apre koneksyon)');
assert.equal(creole['set-list-width-value'], 'Lajè lis (piksèl)');
assert.deepEqual(tokens(creole['and-n-other-card']), ['__count__']);
assert.deepEqual(tags(creole['board-private-info']), ['</strong>', '<strong>']);
assert.equal(creole['board-not-found'], 'Tablo pa jwenn');
assert.deepEqual(tags(creole['board-public-info']), ['</strong>', '<strong>']);
assert.deepEqual(tokens(creole['board-open-and-move-between-remaining-and-workspaces']),
  ['__workspaces__']);
assert.equal(creole['card-due'], 'Dat limit');
assert.equal(creole['vote-for-it'], 'pou li');
assert.match(creole['card-edit-planning-poker'], /Planning Poker/);
assert.equal(creole['importSwimlanePopup-title'], 'Enpòte kouloir');
assert.equal(creole['userPopup-title'], 'Manm');
assert.equal(creole['map-to-existing-user-no-results'],
  'Pa jwenn okenn itilizatè ki koresponn.');
assert.equal(creole['changePermissionsPopup-title'], 'Chanje otorizasyon');
assert.equal(creole['auto-list-width'], 'Lajè otomatik lis');
assert.equal(creole['move-card-up'], 'Deplase kat anlè');
assert.equal(creole['color-sky'], 'ble syèl');
assert.equal(creole['comment-only'], 'Kòmantè sèlman');
assert.equal(creole['copy-link-to-clipboard'], 'Kopye lyen nan papye-presse');
assert.equal(creole['custom-field-number'], 'Nimewo');
assert.equal(creole['custom-field-text'], 'Tèks');
assert.deepEqual(tokens(creole['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.equal(creole['error-list-doesNotExist'], 'Lis sa a pa egziste');
assert.equal(creole['export-card'], 'Ekspòte kat');
assert.equal(creole['filter-overdue'], 'Anreta');
assert.equal(creole['filter-no-member'], 'San manm');
assert.equal(creole['filter-assignee-label'], 'Filtre pa moun ki asiyen');
assert.deepEqual(tokens(creole['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.equal(creole['import-trello-zip-too-many-files'],
  '.zip la gen twòp fichye pou enpòte.');
assert.equal(creole['trello-import-progress'], 'Pwogrè enpòtasyon');
assert.equal(creole['invalid-year'],
  'Ane pa valab. Tanpri tape tout kat chif yo, pa egzanp 2026.');
assert.deepEqual(tokens(creole['label-default']), ['%s']);
assert.deepEqual(tokens(creole['leave-board-pop']), ['__boardTitle__']);
assert.equal(creole['multi-selection'], 'Seleksyon miltip');
assert.equal(creole['no-archived-swimlanes'], 'Pa gen kouloir nan Achiv.');
assert.deepEqual(tokens(creole['page-maybe-private']), ['%s']);
assert.deepEqual(tags(creole['page-maybe-private']), ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(creole['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(creole['sidebar-close'], 'Fèmen ba lateral');
assert.equal(creole['starred-boards'], 'Tablo favori');
assert.equal(creole['upload-completed'], 'Voye a fini');
assert.equal(creole['wipLimitErrorPopup-title'], 'Limit WIP pa valab');
assert.equal(creole['attachment-limit-mode-unlimited'], 'San limit');
assert.deepEqual(tokens(creole['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(creole.Database, 'Bazdone');
assert.equal(creole.Database_type, 'Tip bazdone');
assert.match(creole.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(creole['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(creole['default-subtasks-board']), ['__board__']);
assert.equal(creole['parent-card'], 'Kat paran');
assert.deepEqual(tokens(creole['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(creole['activity-set-customfield']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(creole['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(creole['r-import-done']), ['__count__']);
assert.deepEqual(tokens(creole['r-import-unmapped']), ['__count__']);
assert.equal(creole['r-schedule-weekday'], 'Chak jou lasemèn (Lendi–Vandredi)');
assert.equal(creole['r-mark-complete'], 'Make kat kòm fini');
assert.equal(creole['r-the-board'], 'tablo a');
assert.equal(creole['r-remove-all'], 'Retire tout manm sou kat la');
assert.equal(creole['r-d-move-to-bottom-gen'], 'Deplase kat anba lis li a');
assert.equal(creole['r-d-archive'], 'Deplase kat nan Achiv');
assert.equal(creole['r-items-list'], 'eleman1,eleman2,eleman3');
assert.equal(creole['authentication-method'], 'Metòd otantifikasyon');
assert.deepEqual(tags(creole['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(creole['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(creole['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(creole['open-many-cards-at-once'], 'Louvri plizyè kat anmenmtan');
assert.equal(creole['roles-status-sees-assigned'], 'Sa ki asiyen sèlman');
assert.equal(creole.sunday, 'Dimanch');
assert.equal(creole['shared-templates'], 'Modèl pataje');
assert.equal(creole['globalSearchViewChange-choice-me'], 'Kat mwen yo');
assert.deepEqual(tokens(creole['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(creole['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(creole['operator-limit'], 'plafon');
assert.equal(creole['predicate-quarter'], 'trimès');
assert.deepEqual(tokens(creole['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(creole['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.deepEqual(tags(creole['globalSearch-instructions-operator-board']),
  ['<title>', '<title>']);
assert.equal(creole['card-dependencies'], 'Depandans');
assert.deepEqual(tokens(creole['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(creole['background-too-big']), ['{{size}}']);
assert.equal(creole['location-latitude'], 'Latitid');
assert.deepEqual(tokens(creole['custom-field-stringtemplate-format']), ['%{value}']);
assert.match(creole['server-error-troubleshooting'], /sudo docker logs wekan-app/);
assert.match(creole['api-no-calls'], /WITH_API=true/);
assert.equal(creole['recovery-db'], 'Bazdone');
assert.equal(creole['cardDetailsPopup-title'], 'Detay kat');
assert.equal(creole['add-teams'], 'Ajoute ekip');
assert.match(creole.Node_heap_total_heap_size, /Node/);
assert.equal(creole['attachment-move-storage-s3'], 'Deplase pyès atache nan S3');
assert.equal(creole['move-storage-fs'], 'Sistèm fichye');
assert.equal(creole['attachment-repair-done'], 'Reparasyon fini.');
assert.match(creole['mongodb-compact-warning'], /Meteor/);
assert.equal(creole['board-status'], 'Estati tablo');
assert.deepEqual(tokens(creole['drag-board-to-workspace']), ['__workspaces__']);
assert.equal(creole['accessibility'], 'Aksesibilite');
assert.equal(creole['accounts-lockout-unlock-all'], 'Debloke tout');
assert.equal(creole['attachments-path'], 'Chemen pyès atache');
assert.equal(creole['cron-migrations'], 'Migrasyon pwograme');
assert.equal(creole['cron-job-deleted'], 'Travay pwograme a efase avèk siksè');
assert.deepEqual(tokens(creole['database-migration-confirm']), ['__db__']);
assert.match(creole['database-migration-description'], /WEKAN_FERRETDB_URL/);
assert.match(creole['cards-loading-description'], /CARDS_LOADING_LAZY_THRESHOLD/);
assert.deepEqual(tags(creole['render-links-as-plain-text-description']), ['<a href>']);
assert.equal(creole['backup-done'], 'Sovgad fini');
assert.equal(creole['backup-frequency-weekly'], 'Chak semèn');
assert.equal(creole['gcs-bucket'], 'Resipyan GCS');
assert.match(creole['gcs-permissions-note'], /client_email/);
assert.equal(creole['gridfs-enabled'], 'GridFS aktive');
assert.equal(creole['migration-progress'], 'Pwogrè migrasyon');
assert.match(creole['s3-region-description'], /us-east-1/);
assert.equal(creole['lost-cards'], 'Kat pèdi');
assert.match(creole['restore-lost-cards-migration-description'], /swimlaneId/);
assert.equal(creole['step-validate-migration'], 'Valide migrasyon');
assert.equal(creole['step-fix-attachment-urls'], 'Korije URL pyès atache');
assert.equal(creole['every-6-hours'], 'Chak 6 èdtan');
assert.equal(creole['job-queue'], 'Fil datant travay');
assert.equal(creole['memory-usage'], 'Itilizasyon memwa');
assert.equal(creole['migration-cpu-threshold'], 'Papòt CPU (%)');
assert.equal(creole['unmigrated-boards'], 'Tablo ki poko migre');
assert.equal(creole['current-step'], 'Etap aktyèl');
assert.deepEqual(tokens(creole['repair-broken-cards-done-unfixable']),
  ['__fixed__', '__unfixable__']);
assert.equal(creole['event-source'], 'Sous');
assert.equal(creole['event-ipv6'], 'Adrès IPv6');
assert.deepEqual(tokens(creole['globalSearch-instructions-operator-number']),
  ['__operator_number__']);
assert.deepEqual(tags(creole['globalSearch-instructions-operator-number']),
  ['<number>', '<number>']);

const reviewedLinkedCardKeys = ["attach-card", "attachCardPopup-title", "attach-card-hint", "attached-card-unavailable", "detach-card", "attach-card-self", "attach-card-limit", "attach-card-not-found", "board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "custom-field-links", "custom-field-links-hint", "custom-field-links-none", "custom-field-link-unavailable", "custom-field-link-fields", "custom-field-link-no-fields", "custom-field-link-inactive", "custom-field-unlink", "custom-field-link-target", "custom-field-link-direction", "custom-field-link-both", "custom-field-link-send", "custom-field-link-sends", "custom-field-link-receives", "custom-field-link-add", "field-link-self", "field-link-limit", "field-link-archived", "field-link-invalid", "field-link-not-found", "field-link-not-allowed", "cardCustomFieldLinksPopup-title"];
for (const key of reviewedLinkedCardKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.doesNotMatch(creole[key], /\b(?:Attach card|Custom fields|Both ways|One way|Paused|cannot|not found)\b/, key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
assert.equal(creole['attach-card'], creole['attachCardPopup-title']);
assert.match(creole['custom-field-links-hint'], /menm non ak menm kalite sou toude/);
assert.match(creole['custom-field-links-hint'], /yon sèl kat rete san chanjman/);
assert.match(creole['custom-field-link-inactive'], /pa ka modifye toude kat yo ankò.*achive/);
assert.match(creole['custom-field-link-both'], /toude sans/);
assert.match(creole['custom-field-link-send'], /yon sèl sans.*kat prensipal/);
assert.notEqual(creole['custom-field-link-sends'], creole['custom-field-link-receives']);
assert.match(creole['field-link-not-allowed'], /modifye toude kat/);
assert.match(creole['attach-card-self'], /pa ka atache ak tèt li/);

assert.equal(creole['r-to'], 'bay', 'mail recipient placeholder');
assert.match(creole['s3-secret-key-required'], /obligatwa/);
assert.notEqual(creole['s3-connection-success'], creole['s3-connection-failed']);
assert.notEqual(creole['s3-access-key'], creole['s3-secret-key']);
assert.ok(creole['s3-endpoint-description'].includes('minio.example.com'));
assert.ok(creole['s3-minio-storage-description'].includes('DigitalOcean Spaces'));

const reviewedImportGuideKeys = ["cards-use-list-color", "import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-meistertask", "import-board-instruction-obsidian", "import-board-instruction-linear", "import-board-instruction-ticktick", "import-board-instruction-clickup", "import-board-instruction-nullboard", "import-board-instruction-kanri"];
for (const key of reviewedImportGuideKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.doesNotMatch(creole[key], /\b(?:Paste an|In Todoist|then paste|become lists|their children|first board is imported)\b/, key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
assert.match(creole['cards-use-list-color'], /pa gen koulè pa yo/);
assert.match(creole['import-board-instruction-opml'], /pitit yo vin kat.*pi fon yo vin lis verifikasyon/);
assert.match(creole['import-board-instruction-opml'], /fini yo enpòte kòm fini/);
for (const marker of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(creole['import-board-instruction-orgmode'].includes(marker));
for (const format of ['nullboard', 'kanri']) assert.match(creole[`import-board-instruction-${format}`], /premye tablo/);
assert.match(creole['import-board-instruction-nullboard'], /etikèt raw/);
assert.match(creole['import-board-instruction-clickup'], /tout kolòn yo/);
assert.match(creole['import-board-instruction-meistertask'], /kenbe dat yo te fini an/);

const reviewedProjectImportKeys = ["import-board-instruction-pivotal", "import-board-instruction-tasksorg", "import-board-instruction-monday", "import-board-instruction-superproductivity", "import-board-instruction-taiga", "import-board-instruction-vikunja", "import-board-instruction-quire", "import-board-instruction-wrike", "import-board-instruction-teamwork"];
for (const key of reviewedProjectImportKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.doesNotMatch(creole[key], /\b(?:then paste|become lists|not imported|choose that file|with their)\b/, key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
for (const format of ['taiga', 'vikunja']) assert.match(creole[`import-board-instruction-${format}`], /Pyès atache yo pa enpòte/);
assert.match(creole['import-board-instruction-quire'], /Kòmantè ak pyès atache yo pa nan CSV/);
assert.match(creole['import-board-instruction-superproductivity'], /travay achive yo vin kat achive/);
assert.match(creole['import-board-instruction-tasksorg'], /kenbe dat yo te fini an/);
assert.match(creole['import-board-instruction-taiga'], /dekonprese.*\.json\.gz.*anvan/);
for (const marker of ['--', '##', '>>']) assert.ok(creole['import-board-instruction-teamwork'].includes(marker));
assert.match(creole['import-board-instruction-teamwork'], /yon nivo pi fon/);
assert.match(creole['import-board-instruction-wrike'], /Priority, Duration.*chan pèsonalize/);

const reviewedImportMappingKeys = ["import-board-instruction-businessmap", "import-board-instruction-redmine", "import-board-instruction-notion", "import-board-instruction-plane", "import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields"];
for (const key of reviewedImportMappingKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
  assert.doesNotMatch(creole[key], /\b(?:then paste|become lists|People in the file|Choose an existing|not in the file)\b/, key);
}
assert.match(creole['import-board-instruction-businessmap'], /non kolòn yo an anglè.*anvan/);
assert.match(creole['import-board-instruction-redmine'], /lang ou an anglè.*My account.*anvan/);
assert.match(creole['import-board-instruction-notion'], /premye kolòn.*rapò enpòtasyon an di kiyès/);
assert.match(creole['import-board-instruction-notion'], /Relasyon, imaj ak pyès atache yo pa enpòte/);
assert.match(creole['import-board-instruction-plane'], /pa gen deskripsyon ni pyès atache/);
assert.match(creole['import-members-mode-placeholder'], /non pa yo.*itilizatè reyèl pita/);
assert.equal(new Set(['map', 'placeholder', 'me'].map(mode => creole[`import-members-mode-${mode}`])).size, 3);
assert.match(creole['csv-mapping-list-missing'], /sèl lis kote tout kat yo/);
assert.deepEqual(tokens(creole['csv-mapping-column-number']), ['__number__']);

const reviewedBulkImportKeys = ["csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title", "exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start"];
for (const key of reviewedBulkImportKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
  assert.doesNotMatch(creole[key], /\b(?:Each sheet|Choose several|Export all boards|without member mapping|Include attachments)\b/, key);
}
assert.match(creole['import-many-boards-hint'], /san asosye manm yo/);
assert.match(creole['import-many-boards-hint'], /yon sèl ekspòtasyon.*yon sèl tablo/);
assert.match(creole['import-many-boards-hint'], /olye de sa ki nan chan anlè/);
assert.match(creole['import-one-board-per-project-hint'], /depandans ant tablo sa yo.*rapò/);
assert.match(creole['export-all-boards-hint'], /gen dwa ekspòte.*yon sèl liv travay.*\.zip/);
assert.equal(creole['export-all-boards'], creole['exportAllBoardsPopup-title']);
assert.ok(creole['trello-export-desc'].includes('Swimlane: …'));
assert.match(creole['trello-export-desc'], /tounen kouloir ankò/);

const reviewedNotificationKeys = ["trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access", "sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "webhook-payload-heading", "webhook-payload-description", "webhook-payload-text", "webhook-payload-fields", "webhook-payload-field-standard", "webhook-payload-field-ids", "webhook-payload-field-names", "webhook-payload-field-links", "webhook-payload-field-actor", "webhook-payload-field-people", "webhook-payload-field-details", "webhook-hide-identity", "webhook-someone", "notification-delivery-layout-classic", "notification-delivery-layout-clear", "notification-delivery-parts", "notification-delivery-part-board", "notification-delivery-part-actor", "notification-delivery-part-card", "notification-delivery-part-details", "notification-delivery-part-dates", "notification-delivery-part-link", "notification-delivery-grouping", "notification-delivery-grouping-all", "notification-delivery-grouping-board", "notification-delivery-grouping-card", "notification-delivery-grouping-none", "notification-delivery-schedule", "notification-delivery-schedule-immediate", "notification-delivery-schedule-interval", "notification-delivery-schedule-daily", "notification-delivery-interval", "notification-delivery-minutes", "notification-delivery-quiet", "notification-delivery-quiet-clear", "notification-delivery-timezone", "notification-delivery-invalid", "notification-group-card", "notification-group-board"];
for (const key of reviewedNotificationKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
  assert.doesNotMatch(creole[key], /\b(?:One per board|Every few minutes|Leave my name|outgoing webhooks|could not be saved)\b/, key);
}
assert.match(creole['webhook-payload-description'], /paramèt li eritye.*si pa gen anyen.*toujou konn voye/);
assert.match(creole['webhook-hide-identity'], /Pa mete non mwen/);
assert.match(creole['notification-delivery-quiet'], /tann yo fini/);
assert.equal(new Set(['all', 'board', 'card', 'none'].map(mode => creole[`notification-delivery-grouping-${mode}`])).size, 4);
assert.match(creole['external-link-rules-description'], /\[\{identifier\}:\{number\}\] = https:\/\/tracker\.example\.com\/\{identifier\}\/\{number\}/);
assert.ok(creole['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
assert.ok(creole['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.match(creole['sandstorm-trello-access-needed'], /pa gen aksè Entènèt poukont li/);

const reviewedWorkflowPlanningKeys = ["read-only-field", "r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "import-file-label", "subtask-mark-done", "subtask-mark-not-done", "subtask-done-no-permission", "blockly-ANNOUNCE_MOVE_OF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_SET_INDEX_INPUT_TO", "blockly-LOGIC_OPERATION_OR", "blockly-PROCEDURES_DEFNORETURN_TITLE", "blockly-CONTROLS_FOREACH_INPUT_DO", "blockly-CONTROLS_FOR_INPUT_DO", "blockly-CONTROLS_IF_IF_TITLE_IF", "blockly-CONTROLS_IF_MSG_THEN", "blockly-CONTROLS_WHILEUNTIL_INPUT_DO", "blockly-PROCEDURES_DEFRETURN_TITLE", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched"];
for (const key of reviewedWorkflowPlanningKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
  assert.deepEqual([...creole[key].matchAll(/%\d+/g)].map(m => m[0]).sort(), [...english[key].matchAll(/%\d+/g)].map(m => m[0]).sort(), key);
}
assert.match(creole['read-only-field'], /tout manm wè.*sèlman administratè/);
assert.match(creole['r-wrike-workflow-note'], /GET \/workflows/);
assert.match(creole['r-wrike-workflow-note'], /Fini oswa Anile.*pa fini.*Aktif oswa Ranvwaye/);
assert.match(creole['r-wrike-workflow-note'], /pa ka ekspòte soti nan Wrike/);
for (const variable of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(creole['ldap-sync-now-nothing'].includes(variable));
assert.match(creole['oauth-providers-allowed-email-domains'], /si li vid, tout domèn/);
assert.notEqual(creole['subtask-mark-done'], creole['subtask-mark-not-done']);
assert.match(creole['subtask-done-no-permission'], /pa ka chanje/);
assert.match(creole['scrum-import-into-board-hint'], /pa janm double.*ID.*nimewo ak tit.*san chanjman/);
assert.match(creole['scrum-releases-select-help'], /Ctrl.*Cmd.*tout seleksyon.*tout vèsyon/);

const reviewedPlanningRecoveryKeys = ["scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy", "interrupted-import-heading", "interrupted-import-description", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-scrum", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "interrupted-import-scrum-busy"];
for (const key of reviewedPlanningRecoveryKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
assert.match(creole['sync-planning-hint'], /sèlman pandan Scrum aktive.*ID sous li anvan.*dapre non/);
assert.match(creole['sync-planning-hint'], /chanjman planifikasyon lokal rete.*premye senkronizasyon.*pa janm retire/);
assert.match(creole['stuck-sync-operation-description'], /chanjman ki deja aplike yo rete.*pa janm ekri.*konpare lis la ak sous li ankò/);
assert.match(creole['stuck-sync-operation-replayable-now'], /fini poukont li.*pa ka abandone/);
assert.match(creole['interrupted-import-description'], /pa ka kontinye.*fichye sous li a pa konsève/);
assert.match(creole['interrupted-import-description'], /tout sa ki sou li.*bagay ki te ajoute/);
assert.match(creole['interrupted-import-keep-confirm'], /Pa gen anyen ki retire/);
assert.match(creole['interrupted-import-discard-confirm'], /tout sa ki sou li.*efase nèt/);
assert.match(creole['interrupted-import-foreign-board'], /Se pa enpòtasyon sa a.*pa t modifye/);

const reviewedHistoryRecoveryKeys = ["scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const key of reviewedHistoryRecoveryKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
assert.match(creole['scrum-history-checkpoint-stuck'], /defè, refè oswa retabli.*bloke.*rezoud/);
assert.match(creole['scrum-history-checkpoint-hint'], /sèlman si pa gen lòt moun.*san li pa chanje okenn dosye/);
assert.match(creole['scrum-history-checkpoint-discard-confirm'], /ansanm ak chanjman.*deja ekri/);
assert.match(creole['scrum-history-checkpoint-ask-admin'], /administratè tablo/);
assert.match(creole['login-setting-env-only'], /sèlman anviwònman sèvè.*lekti sèlman/);

for (const key of ['import-board-instruction-todoist', 'import-board-instruction-planner']) {
  assert.ok(creole[key].startsWith('Nan '), key);
  assert.doesNotMatch(creole[key], /In Todoist|In Microsoft Planner|become lists|choose Export/);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
assert.ok(creole['import-board-instruction-todoist'].includes('Manage data > Export as CSV'));
assert.match(creole['import-board-instruction-todoist'], /@labels.*p1 rive p3/);
assert.ok(creole['import-board-instruction-planner'].includes('Export as Excel (nan Planner klasik: Export plan to Excel)'));
assert.match(creole['import-board-instruction-planner'], /Progress, Priority ak Completed By.*chan pèsonalize/);
const currentCatalog = spawnSync(process.execPath, [fillScript, '--list', 'ht'], { cwd: root, encoding: 'utf8' });
assert.equal(currentCatalog.status, 0, currentCatalog.stderr);
assert.deepEqual(JSON.parse(currentCatalog.stdout), {}, 'No current Haitian English placeholders remain; semantic review is separate');

const reviewedRuleSemanticsKeys = ["r-w-attachment-added", "r-when-a-attach", "r-when-a-due-date-changed", "r-when-a-start-date-changed", "r-when-a-end-date-changed", "r-when-a-received-date-changed", "r-uncheck-all", "r-uncheck", "r-d-uncheck-all", "r-d-uncheck-one", "r-when-a-assignee", "r-when-the-assignee", "r-assignee"];
for (const key of reviewedRuleSemanticsKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
for (const field of ['due', 'start', 'end', 'received']) {
  assert.match(creole[`r-when-a-${field}-date-changed`], /^Lè .*defini oswa chanje$/);
}
for (const key of ['r-uncheck', 'r-uncheck-all', 'r-d-uncheck-all', 'r-d-uncheck-one']) {
  assert.match(creole[key], /^Retire .*mak/);
  assert.doesNotMatch(creole[key], /Dezaktive/);
}
assert.match(creole['r-w-attachment-added'], /pyès atache/);
assert.match(creole['r-when-a-attach'], /pyès atache/);
assert.equal(creole['r-assignee'], 'moun ki asiyen');

const reviewedAttachmentTermKeys = ["act-addAttachment", "act-deleteAttachment", "add-attachment", "attachment", "attachment-delete-pop", "attachment-soft-delete-pop", "attachmentDeletePopup-title", "attachments", "card-edit-attachments", "export-board-without-attachments", "import-attachments-zip", "import-trello-json-file-hint", "import-trello-zip-file-hint", "trello-api-import-desc", "attachment-transfer-limits-title", "attachment-transfer-limits-saved", "attachment-transfer-limits-save-failed", "attachment-upload-limit-label", "attachment-download-limit-label", "badge-attachment-on-minicard", "attachment-count", "activity-delete-attach", "activity-delete-attach-card", "my-attachments", "attachmentActionsPopup-title", "attachment-move-storage-fs", "attachment-move-storage-gridfs", "attachment-move-storage-s3", "attachment-move", "move-all-attachments-to-fs", "move-all-attachments-to-gridfs", "move-all-attachments-to-s3", "move-all-attachments-of-board-to-fs", "move-all-attachments-of-board-to-gridfs", "move-all-attachments-of-board-to-s3", "move-all-attachments", "attachment-repair-locations-description", "move-scope-both", "default-save-storage-description", "attachment-id", "import-board-zip", "attachment-storage-configuration", "attachments-path", "attachments-path-description", "database-migration-description", "database-migration-confirm", "sandstorm-migration-description", "disable-all-export-description", "backup-description", "backup-scope-description", "backup-restore-confirm", "attachment-move-storage-azure", "attachment-move-storage-gcs", "gridfs-move-collectionfs-note", "attachment-migration", "attachment-monitoring", "attachment-settings", "fix-all-file-urls-migration-description", "run-fix-all-file-urls-migration-confirm", "step-fix-attachment-urls", "step-scan-files", "filesystem-attachments", "gridfs-attachments", "migrated-attachments", "migration-batch-size-description", "remaining-attachments", "total-attachments", "email-to-card-part-attachments"];
for (const key of reviewedAttachmentTermKeys) {
  assert.match(creole[key], /pyès atache/i, key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
for (const [key, value] of Object.entries(creole)) assert.doesNotMatch(value, /pyès jwenn/i, key);
assert.match(creole['attachment-soft-delete-pop'], /fichye li a konsève.*retabli/);
assert.match(creole['attachment-delete-pop'], /pèmanan.*Pa gen fason/);

const reviewedSubtaskChecklistKeys = ["act-addSubtask", "activity-subtask-added", "add-subtask", "add-existing-card-as-subtask", "addExistingSubtaskPopup-title", "convertChecklistItemToSubtask-title", "checklistItem-linked-subtask", "subtasks", "confirm-subtask-delete-popup", "subtaskDeletePopup-title", "export-card-subtasks", "default-subtasks-board", "subtask-settings", "boardSubtaskSettingsPopup-title", "deposit-subtasks-board", "deposit-subtasks-list", "other-parent-cards", "remove-parent-card", "subtaskActionsPopup-title", "show-subtasks-field", "hideCompletedSubtasks", "add-existing-card-as-subtask-empty", "add-checklist-item", "checklists", "checklist-ding-sound", "checklist-ding-sound-description", "copyChecklistFromTemplate", "copyChecklistFromTemplatePopup-title", "editChecklistItemsAsTextPopup-title", "attachment-soft-delete-pop"];
for (const key of reviewedSubtaskChecklistKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
  assert.doesNotMatch(creole[key], /sou-tach|soutach|soutravay|su-tach|ti-tach/i, key);
}
assert.equal(creole.subtasks, 'Sou-travay');
assert.match(creole['add-existing-card-as-subtask-empty'], /kat ki koresponn/);
assert.match(creole['copyChecklistFromTemplate'], /soti nan modèl/);
assert.equal(creole['copyChecklistFromTemplate'], creole['copyChecklistFromTemplatePopup-title']);
assert.match(creole['checklist-ding-sound-description'], /lis verifikasyon.*dezaktive pa defo/);
assert.match(creole['attachment-soft-delete-pop'], /^Pyès atache a retire.*fichye li a konsève/);

const reviewedCalendarCoreKeys = ["calendar-system", "calendar-system-gregorian", "calendar-system-jalali", "calendar-system-buddhist", "calendar-system-chinese", "calendar-system-coptic", "calendar-system-dangi", "calendar-system-ethioaa", "calendar-system-ethiopic", "calendar-system-hebrew", "calendar-system-indian", "calendar-system-iso8601", "calendar-system-japanese", "calendar-system-roc", "board-view-roadmap", "roadmap-empty-no-custom-fields", "bucket-example", "userAnonymizePopup-title", "board-view-timeline-showing", "cardAssigneePopup-title"];
for (const key of reviewedCalendarCoreKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
for (const [key, value] of Object.entries(creole)) {
  if (key.startsWith('calendar-system')) assert.doesNotMatch(value, /calendrier|grégorien|hébraïque|japonais/i, key);
}
assert.match(creole['calendar-system-iso8601'], /gregoryen.*semèn ISO 8601/);
assert.match(creole['calendar-system-indian'], /nasyonal.*End/);
assert.notEqual(creole['calendar-system-ethioaa'], creole['calendar-system-ethiopic']);
assert.match(creole['calendar-system-jalali'], /Jalali.*pès/);
assert.equal(creole['calendar-system-roc'], 'Kalandriye Minguo');
assert.match(creole['bucket-example'], /bagay mwen vle fè nan lavi/);
assert.doesNotMatch(creole['bucket-example'], /Bokit/);
assert.match(creole['userAnonymizePopup-title'], /kont.*anonim/);
assert.doesNotMatch(creole['userAnonymizePopup-title'], /enpòte/);
assert.doesNotMatch(creole['board-view-timeline-showing'], /apati/);

const reviewedUploadControlKeys = ["close-board-pop", "custom-field-dropdownMultiSelect", "createTemplateContainerPopup-title", "export-card-attachment-uploaded-by", "export-card-attachment-uploaded-at", "feature-views-map-desc", "map-view-empty", "map-view-upload", "default-save-storage-description", "filter-creator-label"];
for (const key of reviewedUploadControlKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
for (const key of ['export-card-attachment-uploaded-by', 'export-card-attachment-uploaded-at', 'feature-views-map-desc', 'map-view-empty', 'map-view-upload', 'default-save-storage-description']) {
  assert.match(creole[key], /voye/i, key);
  assert.doesNotMatch(creole[key], /telechaje/i, key);
}
assert.match(creole['map-view-empty'], /administratè tablo.*plan etaj.*plan sit.*desen/);
assert.match(creole['close-board-pop'], /Achiv.*paj Tout tablo/);
assert.doesNotMatch(creole['close-board-pop'], /antèt paj akèy/);
assert.match(creole['custom-field-dropdownMultiSelect'], /Lis dewoulant.*chwazi plizyè/);
assert.equal(creole['createTemplateContainerPopup-title'], creole['add-template-container']);

const reviewedSettingsMeaningKeys = ["custom-private-desc", "custom-private-desc-placeholder", "custom-public-desc", "custom-public-desc-placeholder", "starred-swimlanes", "automatic-linked-url-schemes", "external-link-pattern", "external-link-pattern-description", "smtp-host", "email-templates-title", "email-templates-invite-subject", "email-templates-invite-body", "email-templates-activity-subject", "email-templates-activity-body"];
for (const key of reviewedSettingsMeaningKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
for (const visibility of ['private', 'public']) {
  assert.match(creole[`custom-${visibility}-desc-placeholder`], /Kite vid.*deskripsyon pa defo/);
  assert.doesNotMatch(creole[`custom-${visibility}-desc-placeholder`], /default/);
}
assert.equal(creole['smtp-host'], 'Sèvè SMTP');
assert.doesNotMatch(creole['smtp-host'], /Lame/);
assert.match(creole['automatic-linked-url-schemes'], /lyen ou ka klike.*chak liy/);
assert.match(creole['external-link-pattern-description'], /#1234.*youn nan de chan yo vid/);
for (const part of ['subject', 'body']) {
  assert.match(creole[`email-templates-invite-${part}`], /imèl envitasyon/);
  assert.match(creole[`email-templates-activity-${part}`], /imèl notifikasyon aktivite/);
}
assert.match(creole['starred-swimlanes'], /Kouloir/);
assert.doesNotMatch(creole['starred-swimlanes'], /naje/);

const reviewedAdminPrecedenceKeys = ["Platform", "org-domains-description", "org-admins-description", "lock-list-width-resize", "lock-swimlane-height-resize", "toggle-header-icons-collapsed", "assignee", "assignees", "no-assignee", "cardAssigneesPopup-title", "notification-settings-popup-description", "notification-activity-assignees", "notification-activity-created", "notification-settings-tray"];
for (const key of reviewedAdminPrecedenceKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
assert.equal(creole.Platform, 'Platfòm');
assert.match(creole['org-domains-description'], /Non sèvè.*a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true.*Kite vid/);
assert.doesNotMatch(creole['org-domains-description'], /lame/i);
assert.match(creole['org-admins-description'], /pa janm.*estati Administratè.*pa janm.*administratè sit/);
assert.doesNotMatch(creole['org-admins-description'], /drapo/);
assert.match(creole['notification-settings-popup-description'], /Panno administrasyon.*paramèt tablo.*ranplase.*paramèt manm.*ranplase/);
assert.doesNotMatch(creole['notification-settings-popup-description'], /Anilasyon/);
assert.equal(creole['cardAssigneesPopup-title'], creole['cardAssigneePopup-title']);
assert.match(creole['toggle-header-icons-collapsed'], /mobil ak òdinatè.*notifikasyon/);

const reviewedDueSearchKeys = ["my-attachments", "board-table-group-by-swimlane-on", "board-table-group-by-swimlane-off", "dueCards-title", "dueCardsViewChange-title", "dueCardsViewChangePopup-title", "dueCards-noResults-title", "operator-attachment-text", "predicate-attachment"];
for (const key of reviewedDueSearchKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
for (const key of ['dueCards-title', 'dueCardsViewChange-title', 'dueCardsViewChangePopup-title', 'dueCards-noResults-title']) {
  assert.match(creole[key], /gen dat limit/);
  assert.doesNotMatch(creole[key], /rive nan limit|anreta/);
}
assert.equal(creole['my-attachments'], 'Pyès atache mwen yo');
assert.equal(creole['predicate-attachment'], 'pyès-atache');
assert.equal(creole['operator-attachment-text'], creole['predicate-attachment']);
assert.doesNotMatch(creole['predicate-attachment'], /\s/);
for (const [key, value] of Object.entries(creole)) assert.doesNotMatch(value, /pyès[ -]jwenn/i, key);

// Exercise the production parser with real locale values, including negation.
const searchVm = require('node:vm');
const searchContext = { TAPi18n: { __: key => creole[key] || key }, Boards: { colorMap: () => ({}) }, console };
searchVm.createContext(searchContext);
searchVm.runInContext(fs.readFileSync(path.join(root, 'config/search-const.js'), 'utf8').replace(/export /g, '') + '\n' +
  fs.readFileSync(path.join(root, 'config/query-classes.js'), 'utf8').replace(/import[\s\S]*?from ['"][^'"]+['"];\s*/g, '').replace(/export /g, '') + '\nthis.Query = Query;', searchContext);
for (const absent of [false, true]) {
  const query = new searchContext.Query();
  query.buildParams(`${creole['operator-has']}:${absent ? '-' : ''}${creole['predicate-attachment']}`);
  assert.equal(query.hasErrors(), false);
  assert.deepEqual(JSON.parse(JSON.stringify(query.getQueryParams().getPredicate('has'))), { field: 'attachment', exists: !absent });
}
const invalidAttachmentQuery = new searchContext.Query();
invalidAttachmentQuery.buildParams(`${creole['operator-has']}:nonexistent-field`);
assert.equal(invalidAttachmentQuery.hasErrors(), true);

const reviewedRecurrenceKeys = ["checkAllItems", "checklist-reset-interval", "checklistResetIntervalPopup-title", "checklist-reset-interval-none", "card-recurrence-interval", "cardRecurrenceIntervalPopup-title", "card-recurrence-interval-none", "accounts-lockout-known-users"];
for (const key of reviewedRecurrenceKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
assert.match(creole.checkAllItems, /Mete mak/);
assert.match(creole['checklist-reset-interval'], /Retire mak/);
assert.match(creole['card-recurrence-interval'], /Repetisyon kat/);
assert.notEqual(creole['card-recurrence-interval'], creole['checklist-reset-interval']);
assert.equal(creole['card-recurrence-interval'], creole['cardRecurrenceIntervalPopup-title']);
assert.equal(creole['checklist-reset-interval'], creole['checklistResetIntervalPopup-title']);
assert.match(creole['card-recurrence-interval-none'], /pa repete kat/);
assert.match(creole['checklist-reset-interval-none'], /pa retire mak/);
assert.match(creole['accounts-lockout-known-users'], /sistèm nan rekonèt.*non itilizatè kòrèk, move modpas/);

assert.equal(creole['anonymize-account'], creole['userAnonymizePopup-title']);
const accountWarning = creole['anonymize-account-confirm-popup'];
assert.match(accountWarning, /non itilizatè.*non konplè.*adrès imèl.*pou tout tan/);
assert.match(accountWarning, /retire avatar.*dezaktive koneksyon/);
assert.match(accountWarning, /tablo, kat ak kòmantè.*konsève istorik.*toujou montre kont.*anonim/);
assert.match(accountWarning, /pa ka defèt/);
assert.doesNotMatch(accountWarning, /ekspòtasyon|Fichye ekspòte|pa defo/);
assert.notEqual(accountWarning, creole['anonymize-export-users-description']);
assert.deepEqual(tokens(accountWarning), tokens(english['anonymize-account-confirm-popup']));

const reviewedStorageCredentialKeys = ["backup-description", "continuous-backup-key-file", "continuous-backup-upload-none", "continuous-backup-saved", "gcs-credentials", "gcs-credentials-description", "gcs-permissions-note", "gcs-key-filename-menu-path"];
for (const key of reviewedStorageCredentialKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
for (const key of ['backup-description', 'gcs-credentials', 'gcs-credentials-description']) {
  assert.match(creole[key], /enfòmasyon otantifikasyon/i);
  assert.doesNotMatch(creole[key], /kalifikasyon/i);
}
assert.match(creole['gcs-credentials-description'], /Opsyonèl.*Kite vid.*fichye kle.*pa defo/);
assert.match(creole['continuous-backup-key-file'], /deyò repètwa destinasyon.*64.*16.*san li.*pa ka retabli/);
assert.match(creole['continuous-backup-saved'], /^Paramèt/);
for (const literal of ['client_email', 'Storage Object Admin', 'New principals']) assert.ok(creole['gcs-permissions-note'].includes(literal));
for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data']) assert.ok(creole['backup-description'].includes(literal));

const reviewedWipSummaryKeys = ['wip-limit-groups', 'wip-limit-group-name-placeholder', 'wip-limit-group-add', 'wip-limit-group-select-swimlane', 'wip-limit-group-apply-swimlane', 'sum-of-number-fields'];
for (const key of reviewedWipSummaryKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
for (const key of ['wip-limit-groups', 'wip-limit-group-add']) {
  assert.match(creole[key], /gwoup limit WIP/i);
  assert.doesNotMatch(creole[key], /aktive/i);
}
assert.match(creole['wip-limit-group-name-placeholder'], /gwoup.*opsyonèl/);
for (const key of ['wip-limit-group-select-swimlane', 'wip-limit-group-apply-swimlane']) {
  assert.match(creole[key], /kouloir/);
  assert.doesNotMatch(creole[key], /tablo/i);
}
assert.match(creole['sum-of-number-fields'], /Sòm valè.*nimerik.*ki make.*anlè lis/);
assert.doesNotMatch(creole['sum-of-number-fields'], /kantite chan/);

const reviewedFlowMeaningKeys = ["list-sync-last-synced-never", "drag-to-reorder", "board-view-aging-wip", "board-view-blocker-analysis", "board-view-monte-carlo", "board-view-process-behavior", "board-view-size-cycle-time", "flow-age-days", "flow-p85", "flow-samples", "flow-signal", "flow-unusual", "flow-blocker", "flow-episodes", "flow-active", "flow-blocked-days", "flow-unknown-start", "flow-confidence", "flow-target-count", "flow-finish-days", "flow-finish-date", "flow-target-date", "flow-capacity", "flow-beyond-horizon", "flow-mean", "flow-moving-range", "flow-mr-mean", "flow-size-source", "flow-size", "flow-error", "flow-details", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "flow-note-processBehavior", "flow-note-sizeCycleTime", "move-reason", "ask-move-reason", "time-adjustments"];

for (const key of reviewedFlowMeaningKeys) {
  assert.notEqual(creole[key], english[key], key);
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
}
assert.equal(creole['list-sync-last-synced-never'], 'Pa janm');
assert.match(creole['drag-to-reorder'], /^Trennen.*Touch flèch monte ak desann/);
assert.match(creole['board-view-monte-carlo'], /Previzyon/);
assert.doesNotMatch(creole['board-view-monte-carlo'], /Istogram/);
assert.match(creole['board-view-blocker-analysis'], /Analiz blokaj/);
assert.match(creole['flow-active'], /toujou ouvè/);
assert.match(creole['flow-confidence'], /konfyans/);
assert.match(creole['flow-error'], /chaje rapò.*Verifye valè.*eseye ankò/);
assert.match(creole['flow-capacity'], /Omwen/);
assert.match(creole['flow-note-agingWip'], /etap aktyèl.*Ba wouj.*85%.*omwen senk.*istorik antre.*manke.*enkoni/);
assert.match(creole['flow-note-blockerAnalysis'], /kòmanse ak fini.*ansyen lyen.*enkoni.*kat ki efase.*istorik.*konsève.*sipèpoze.*apa/);
assert.match(creole['flow-note-monteCarlo'], /2,000.*UTC.*okenn kat pa fini.*siperyè.*enferyè.*sipoze.*pa yon garanti.*3,650.*pa gen previzyon/);
assert.match(creole['flow-note-processBehavior'], /Kòmansman.*kreyasyon.*Fen.*achiv.*youn apre lòt.*limit natirèl.*omwen de.*valab/);
assert.match(creole['flow-note-sizeCycleTime'], /Planning Poker.*nimerik.*an jou.*pa pran.*manke.*pa valab.*Kòmansman.*kreyasyon.*Fen.*achiv/);
for (const key of ['flow-note-agingWip', 'flow-note-blockerAnalysis', 'flow-note-monteCarlo', 'flow-note-processBehavior', 'flow-note-sizeCycleTime']) {
  assert.doesNotMatch(creole[key], /→|≥|≤|✓|MR̄/);
}
assert.match(creole['move-reason'], /Rezon.*opsyonèl/);
assert.match(creole['ask-move-reason'], /rezon.*deplase kat/);
assert.match(creole['time-adjustments'], /Ajisteman tan selon otè/);

for (const key of ['import-board-instruction-jira', 'import-board-instruction-excel', 'scrum-import-into-board-hint', 'list-sync-description']) {
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
  assert.notEqual(creole[key], english[key], key);
}
for (const literal of ['GET /rest/api/3/search/jql?jql=project=KEY&fields=*all&expand=names,schema', 'nextPageToken', '{ "issues": [...] }', '"automationRules"']) {
  assert.ok(creole['import-board-instruction-jira'].includes(literal), literal);
}
assert.match(creole['import-board-instruction-jira'], /san fields.*sèlman ID.*tout paj.*yon sèl.*chak paj.*tablo apa/);
assert.match(creole['import-board-instruction-excel'], /yon kat pou chak ranje.*Pwochen etap.*kolòn.*chan.*Chak fèy.*ranje antèt.*tablo/);
assert.doesNotMatch(creole['import-board-instruction-excel'], /menm kolòn ak ekspòtasyon Excel/);
assert.match(creole['scrum-import-into-board-hint'], /Gade apèsi a anvan/);
assert.doesNotMatch(creole['scrum-import-into-board-hint'], /aperçu/);
assert.match(creole['list-sync-description'], /sistèm swivi ekstèn.*aryèplan.*15 minit.*Senkwonize kounye a.*imedyatman/);
assert.doesNotMatch(creole['list-sync-description'], /swiv-mak/);

for (const key of ['version-check-failed', 'linkCardToBoardPopup-title', 'linkCardToNewBoard', 'email-bounces-description']) {
  assert.deepEqual(tokens(creole[key]), tokens(english[key]), key);
  assert.notEqual(creole[key], english[key], key);
}
assert.match(creole['version-check-failed'], /pa t posib.*verifye nimewo vèsyon/);
assert.equal(creole['linkCardToBoardPopup-title'], 'Lye ak yon tablo');
assert.doesNotMatch(creole['linkCardToBoardPopup-title'], /sa a/);
assert.match(creole['linkCardToNewBoard'], /Kreye yon tablo apati kat sa a/);
assert.match(creole['email-bounces-description'], /Chak kalite.*pwòp aksyon.*kantite retou.*papòt ki fikse/);
assert.doesNotMatch(creole['email-bounces-description'], /konbyen fwa sa a/);
