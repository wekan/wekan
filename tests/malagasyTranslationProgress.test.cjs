// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--completed-catalog', '--list', 'mg'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 0);

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
assert.match(malagasy['list-width-error-message'], /isa feno farafahakeliny 200 piksel/);
assert.doesNotMatch(malagasy['list-width-error-message'], /270/);
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
  /GET \/rest\/api\/3\/search\/jql.*automationRules/);
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
assert.match(malagasy['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan.*sudo docker logs wekan-app/s);
assert.deepEqual(tokens(malagasy['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(malagasy['custom-field-stringtemplate-separator'],
  /&#32;.*&nbsp;/);
assert.match(malagasy['office-report-desc'], /IPv4.*IPv6/);
assert.match(malagasy.cpuReportTitle, /CPU/);
assert.match(malagasy['api-report-desc'], /REST API/);
assert.match(malagasy['api-no-calls'], /REST API.*API.*WITH_API=true/);
assert.match(malagasy['recovery-report-desc'], /MongoDB/);
assert.equal(malagasy['copy-swimlane'], 'Adikao ny lalana');
assert.match(malagasy['carbon-copy'], /Cc:/);
assert.match(malagasy.Node_heap_malloced_memory, /Node.*malloc/);
assert.match(malagasy.Node_memory_usage_rss, /Node/);
assert.match(malagasy['custom-legal-notice-link-url'], /URL/);
assert.match(malagasy['attachment-move-storage-gridfs'], /GridFS/);
assert.match(malagasy['attachment-move-storage-s3'], /S3/);
assert.match(malagasy['attachment-repair-locations-description'], /GridFS/);
assert.match(malagasy['gridfs-file-id'], /ID.*GridFS/);
assert.match(malagasy['mongodb-compact-description'],
  /MongoDB GridFS.*Compact/);
assert.match(malagasy['mongodb-compact-warning'],
  /Compact.*oplog.*Meteor/);
assert.match(malagasy['mongodb-compact-run'], /MongoDB Compact/);
assert.deepEqual(tokens(malagasy['drag-board-to-workspace']),
  ['__workspaces__']);
assert.match(malagasy['preview-pdf-not-supported'], /PDF/);
assert.match(malagasy['show-week-of-year'], /ISO 8601/);
assert.match(malagasy['import-board-zip'], /.zip.*JSON/);
assert.equal(malagasy.accessibility, 'Fahafahana miditra');
assert.match(malagasy['accounts-lockout-info'], /fidirana.*fanafihana/);
assert.match(malagasy['accounts-lockout-known-users'],
  /solonanarana.*tenimiafina/);
assert.match(malagasy['accounts-lockout-period'], /segondra/);
assert.equal(malagasy['active-cron-jobs'], 'Asa voalahatra mavitrika');
assert.equal(malagasy['board-operations'], 'Hetsiky ny solaitra');
assert.equal(malagasy['cron-job-deleted'],
  'Voafafa soa aman-tsara ny asa voalahatra');
assert.match(malagasy['s3-force-path-style-description'], /MinIO.*S3.*AWS/);
assert.match(malagasy['database-migration-description'],
  /MongoDB.*FerretDB v1.*SQLite.*WEKAN_FERRETDB_URL.*WEKAN_MONGODB_URL.*MONGO_URL.*Snap/s);
assert.deepEqual(tokens(malagasy['database-migration-confirm']), ['__db__']);
for (const term of ['Sandstorm', 'WeKan', 'MongoDB 3', 'FerretDB v1',
  'SQLite', 'files/attachments', 'files/avatars']) {
  assert.match(malagasy['sandstorm-migration-description'],
    new RegExp(escapeRegExp(term)));
}
assert.match(malagasy['cards-loading-description'],
  /WeKan.*CARDS_LOADING.*all\/lazy\/auto.*CARDS_LOADING_LAZY_THRESHOLD/s);
assert.deepEqual(tags(malagasy['render-links-as-plain-text-description']),
  ['<a href>']);
assert.match(malagasy['always-show-code-as-text-description'],
  /HTML.*<!-- -->.*JavaScript/s);
assert.match(malagasy['disable-all-import-description'],
  /WeKan JSON.*Trello.*CSV\/Excel.*Forgejo/s);
assert.match(malagasy['backup-description'],
  /backup\/YYYY\/MM\/DD\/HH_MM_SS\/backup\.zip.*S3\/MinIO.*Azure.*GCS/s);
assert.match(malagasy['backup-time'], /HH:MM/);
assert.match(malagasy['gcs-permissions-note'],
  /WeKan.*Google Cloud Console.*client_email.*Storage Object Admin/s);
assert.match(malagasy['s3-endpoint-menu-path'],
  /AWS.*S3.*URL.*MinIO.*Cloudflare R2.*Backblaze B2.*Wasabi.*DigitalOcean Spaces/s);
assert.match(malagasy['gcs-credentials-menu-path'],
  /Google Cloud Console.*IAM & Admin.*JSON/s);
assert.equal(malagasy['attachment-move-storage-azure'],
  "Afindrao any amin'ny Azure Blob Storage ny rakitra miaraka");
assert.equal(malagasy['attachment-move-storage-gcs'],
  "Afindrao any amin'ny Google Cloud Storage ny rakitra miaraka");
assert.match(malagasy['gridfs-enabled-description'], /MongoDB GridFS/);
assert.match(malagasy['gridfs-move-collectionfs-note'], /CollectionFS/);
assert.match(malagasy['s3-region-description'], /AWS S3.*us-east-1/);
assert.match(malagasy['s3-ssl-enabled-description'], /SSL\/TLS.*S3/);
assert.match(malagasy['restore-lost-cards-migration-description'],
  /swimlaneId.*listId.*Karatra very/s);
assert.match(malagasy['restore-all-archived-migration-description'],
  /swimlaneId.*listId/s);
assert.match(malagasy['fix-avatar-urls-migration-description'], /URL/);
assert.match(malagasy['run-restore-lost-cards-migration-confirm'],
  /Karatra very.*swimlaneId.*listId/s);
assert.equal(malagasy['step-fix-orphaned-cards'],
  'Amboary ny karatra kamboty');
assert.match(malagasy['step-fix-attachment-urls'], /URL/);
assert.match(malagasy['step-fix-missing-ids'], /ID/);
assert.match(malagasy['cpu-cores'], /CPU/);
assert.equal(malagasy['every-30-minutes'], 'Isaky ny 30 minitra');
assert.match(malagasy['gridfs-attachments'], /GridFS/);
assert.match(malagasy['migrate-all-to-gridfs'], /GridFS/);
assert.match(malagasy['migrate-all-to-s3'], /S3/);
assert.match(malagasy['migration-cpu-threshold'], /CPU.*%/);
assert.match(malagasy['migration-cpu-threshold-description'], /CPU.*10-90/);
assert.match(malagasy['migration-delay-ms-description'], /100-10000/);
assert.match(malagasy.otp, /OTP/);
assert.match(malagasy['api-endpoints'], /API/);
assert.match(malagasy['problems-in-progress-help'], /CPU/);
assert.deepEqual(tokens(malagasy['repair-broken-cards-done']), ['__fixed__']);
assert.deepEqual(tokens(malagasy['repair-broken-cards-done-unfixable']),
  ['__fixed__', '__unfixable__']);
assert.equal(malagasy['event-ipv4'], 'Adiresy IPv4');
assert.equal(malagasy['event-ipv6'], 'Adiresy IPv6');
assert.match(malagasy['import-here-instruction'], /WeKan.*\.json.*\.zip/);
assert.deepEqual(tokens(malagasy['globalSearch-instructions-operator-number']),
  ['__operator_number__']);
assert.match(malagasy['import-board-source'],
  /Trello.*Jira.*WeKan.*CSV.*Excel/);

const linkedCardKeys = ["attach-card", "attachCardPopup-title", "attach-card-hint", "attached-card-unavailable", "detach-card", "attach-card-self", "attach-card-limit", "attach-card-not-found", "board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "custom-field-links", "custom-field-links-hint", "custom-field-links-none", "custom-field-link-unavailable", "custom-field-link-fields", "custom-field-link-no-fields", "custom-field-link-inactive", "custom-field-unlink", "custom-field-link-target", "custom-field-link-direction", "custom-field-link-both", "custom-field-link-send", "custom-field-link-sends", "custom-field-link-receives", "custom-field-link-add", "field-link-self", "field-link-limit", "field-link-archived", "field-link-invalid", "field-link-not-found", "field-link-not-allowed", "cardCustomFieldLinksPopup-title", "cards-use-list-color"];

for (const key of linkedCardKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.equal(malagasy['attach-card'], malagasy['attachCardPopup-title']);
assert.match(malagasy['custom-field-links-hint'], /mitovy anarana sy karazana.*karatra roa.*Tsy ovaina.*karatra iray ihany/);
assert.match(malagasy['custom-field-link-inactive'], /tsy afaka manova.*karatra roa.*arisiva/);
assert.match(malagasy['custom-field-link-both'], /lalana roa/);
assert.match(malagasy['custom-field-link-send'], /lalana iray.*karatra fototra/);
assert.notEqual(malagasy['custom-field-link-sends'], malagasy['custom-field-link-receives']);
assert.match(malagasy['field-link-not-allowed'], /afaka manova.*karatra roa/);
assert.match(malagasy['attach-card-self'], /Tsy.*tenany/);
assert.match(malagasy['field-link-archived'], /Tsy.*arisiva/);
assert.match(malagasy['cards-use-list-color'], /tsy manana lokony manokana/);

const storageLegacyKeys = ["MongoDB_version", "MongoDB_storage_engine", "MongoDB_Oplog_enabled", "r-sort-by", "r-is", "r-to", "r-of", "r-d-send-email-to", "r-by", "dueCardsViewChange-choice-me", "s3-file-id", "s3-minio-storage-description", "s3-disabled", "mongodb-gridfs-storage", "s3-access-key", "s3-bucket", "s3-bucket-description", "s3-connection-failed", "s3-connection-success", "s3-enabled", "s3-endpoint", "s3-endpoint-description", "s3-minio-storage", "s3-port", "s3-port-description", "s3-region", "s3-secret-key", "s3-secret-key-required", "s3-settings-saved", "s3-ssl-enabled", "of", "s3-attachments", "s3-size"];

for (const key of storageLegacyKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.notEqual(malagasy['s3-access-key'], malagasy['s3-secret-key']);
assert.match(malagasy['s3-secret-key-required'], /Ilaina.*miafina/);
assert.match(malagasy['s3-disabled'], /Tsy mandeha/);
assert.match(malagasy['s3-endpoint-description'], /s3.amazonaws.com.*minio.example.com/);

const importGuideKeys = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-meistertask", "import-board-instruction-obsidian", "import-board-instruction-linear", "import-board-instruction-ticktick", "import-board-instruction-clickup", "import-board-instruction-nullboard", "import-board-instruction-kanri", "import-board-instruction-pivotal"];

for (const key of importGuideKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(malagasy['import-board-instruction-orgmode'].includes(literal));
assert.match(malagasy['import-board-instruction-opml'], /zanany.*naoty.*lalindalina.*efa vita/);
assert.match(malagasy['import-board-instruction-nullboard'], /\.nbx.*andalana voalohany.*raw.*solaitra voalohany/);
assert.match(malagasy['import-board-instruction-kanri'], /\.json.*solaitra voalohany/);
assert.match(malagasy['import-board-instruction-meistertask'], /daty nahavitana.*CSV/);
assert.match(malagasy['import-board-instruction-obsidian'], /\.md.*fetran’ny karatra.*arisiva/);
assert.match(malagasy['import-board-instruction-clickup'], /tsanganana rehetra/);
assert.match(malagasy['import-board-instruction-pivotal'], /Story points.*Estimate.*sprint/);

const projectImportKeys = ["import-board-instruction-tasksorg", "import-board-instruction-monday", "import-board-instruction-superproductivity", "import-board-instruction-taiga", "import-board-instruction-vikunja", "import-board-instruction-quire", "import-board-instruction-wrike", "import-board-instruction-teamwork", "import-board-instruction-businessmap", "import-board-instruction-redmine", "import-board-instruction-notion", "import-board-instruction-plane"];

for (const key of projectImportKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
for (const format of ['taiga', 'vikunja']) assert.match(malagasy[`import-board-instruction-${format}`], /Tsy ampidirina ny rakitra ampiarahina/);
assert.match(malagasy['import-board-instruction-quire'], /Tsy ao.*fanehoan-kevitra.*rakitra ampiarahina/);
assert.match(malagasy['import-board-instruction-notion'], /raha tsy misy.*voalohany.*tatitra.*Tsy ampidirina ny fifandraisana, sary ary rakitra/);
assert.match(malagasy['import-board-instruction-plane'], /Tsy misy famaritana na rakitra.*tsy ampidirina/);
assert.match(malagasy['import-board-instruction-businessmap'], /teny anglisy.*teny anglisy aloha/);
assert.match(malagasy['import-board-instruction-redmine'], /My account alohan’ny fanondranana/);
for (const literal of ['--', '##', '>>', '.xlsx', 'Tasklist', 'Estimated time']) assert.ok(malagasy['import-board-instruction-teamwork'].includes(literal));
assert.match(malagasy['import-board-instruction-tasksorg'], /daty nahavitana/);

const bulkTransferKeys = ["import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields", "csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title", "exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start", "trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access"];

for (const key of bulkTransferKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.match(malagasy['import-members-mode-placeholder'], /anarany manokana.*any aoriana/);
assert.match(malagasy['csv-mapping-description'], /ahitsio izay diso.*tsy ao amin’ny rakitra/);
assert.match(malagasy['import-many-boards-hint'], /tsy misy fampifandraisana mpikambana.*fanondranana tokana.*solaitra iray.*fa tsy/);
assert.match(malagasy['import-one-board-per-project-hint'], /ray aman-dreny.*fiankinana/);
assert.match(malagasy['export-all-boards-hint'], /azonao avoaka.*Excel.*takelaka isaky ny solaitra.*zip.*rakitra isaky ny solaitra/);
assert.equal(malagasy['export-all-boards'], malagasy['exportAllBoardsPopup-title']);
assert.ok(malagasy['trello-export-desc'].includes('"Swimlane: …"'));
assert.match(malagasy['trello-export-warnings'], /^Tsy/);
assert.match(malagasy['sandstorm-trello-access-needed'], /Tsy manana.*Internet.*alalana/);

const notificationKeys = ["sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "webhook-payload-heading", "webhook-payload-description", "webhook-payload-text", "webhook-payload-fields", "webhook-payload-field-standard", "webhook-payload-field-ids", "webhook-payload-field-names", "webhook-payload-field-links", "webhook-payload-field-actor", "webhook-payload-field-people", "webhook-payload-field-details", "webhook-hide-identity", "webhook-someone", "notification-delivery-layout-classic", "notification-delivery-layout-clear", "notification-delivery-parts", "notification-delivery-part-board", "notification-delivery-part-actor", "notification-delivery-part-card", "notification-delivery-part-details", "notification-delivery-part-dates", "notification-delivery-part-link", "notification-delivery-grouping", "notification-delivery-grouping-all", "notification-delivery-grouping-board", "notification-delivery-grouping-card", "notification-delivery-grouping-none", "notification-delivery-schedule", "notification-delivery-schedule-immediate", "notification-delivery-schedule-interval", "notification-delivery-schedule-daily", "notification-delivery-interval", "notification-delivery-minutes", "notification-delivery-quiet", "notification-delivery-quiet-clear", "notification-delivery-timezone", "notification-delivery-invalid", "notification-group-card", "notification-group-board"];

for (const key of notificationKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.ok(malagasy['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(malagasy['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
assert.match(malagasy['webhook-payload-description'], /nolovaina.*raha tsy misy napetraka.*hatramin’izay/);
assert.match(malagasy['webhook-hide-identity'], /Aza.*anarako/);
assert.ok(malagasy['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.match(malagasy['notification-delivery-quiet'], /miandrasa mandra-pahatapiny/);
assert.match(malagasy['notification-delivery-quiet-clear'], /Tsy misy/);
assert.match(malagasy['notification-delivery-grouping-all'], /tokony halefa.*hafatra iray/);
assert.notEqual(malagasy['notification-delivery-grouping-board'], malagasy['notification-delivery-grouping-card']);
assert.match(malagasy['notification-delivery-invalid'], /^Tsy/);

const workflowKeys = ["read-only-field", "r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "import-file-label", "subtask-mark-done", "subtask-mark-not-done", "subtask-done-no-permission", "blockly-ANNOUNCE_MOVE_OF", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_SET_INDEX_INPUT_TO", "blockly-PROCEDURES_DEFNORETURN_TITLE", "blockly-PROCEDURES_DEFRETURN_TITLE"];

for (const key of workflowKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
  assert.deepEqual((malagasy[key].match(/%\d+/g) || []).sort(), (english[key].match(/%\d+/g) || []).sort(), key);
}
assert.match(malagasy['read-only-field'], /mpikambana rehetra.*mpitantana solaitra ihany/);
for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows']) assert.ok(malagasy['r-wrike-workflow-note'].includes(literal));
assert.match(malagasy['r-wrike-workflow-note'], /ho vita.*Completed na Cancelled.*tsy vita.*Active na Deferred.*Tsy azo avoaka/);
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(malagasy['ldap-sync-now-nothing'].includes(literal));
assert.match(malagasy['oauth-providers-allowed-email-domains'], /faingo.*raha banga.*ekena daholo/);
assert.match(malagasy['subtask-mark-not-done'], /tsy vita/);
assert.match(malagasy['subtask-done-no-permission'], /^Tsy afaka/);
assert.notEqual(malagasy['subtask-mark-done'], malagasy['subtask-mark-not-done']);

const scrumPlanningKeys = ["scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint"];

for (const key of scrumPlanningKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.match(malagasy['scrum-releases-select-help'], /Ctrl.*Cmd.*esory ny safidy rehetra.*famoahana rehetra/);
assert.match(malagasy['scrum-import-into-board-hint'], /tsy averina foronina.*ID.*laharana sy lohatenin’ny.*avela tsy hiova.*topimaso/);
assert.match(malagasy['scrum-import-card-on-another-board'], /solaitra hafa.*tsy hiova/);
assert.match(malagasy['scrum-import-sprint-finished'], /Tsy nafindra.*efa vita/);
assert.match(malagasy['scrum-import-into-board-done'], /voarakitra.*Tantara/);
assert.match(malagasy['sync-planning-hint'], /Scrum ihany.*ID.*aloha.*anarany.*Mijanona.*eto an-toerana.*tsy manaisotra.*voalohany/);

const syncRecoveryKeys = ["stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy"];

for (const key of syncRecoveryKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.match(malagasy['stuck-sync-operation-description'], /very zo hanoratra.*tsy afaka mampifanaraka.*mijanona ny fanovana efa nampiharina.*tsy hosoratana mihitsy.*loharanony/);
assert.match(malagasy['stuck-sync-operation-discard-confirm'], /Mijanona.*tsy hosoratana mihitsy.*indray/);
assert.match(malagasy['stuck-sync-operation-reason-access-denied'], /lisitra manontolo/);
assert.match(malagasy['stuck-sync-operation-replayable-now'], /ho vita ho azy.*tsy azo ariana/);
assert.match(malagasy['stuck-sync-operation-replayable'], /ho vita ho azy.*tsy nariana/);
assert.match(malagasy['stuck-sync-operation-not-stuck'], /Tsy hita.*tsy azo ariana/);
assert.match(malagasy['stuck-sync-operation-truncated'], /50 tranainy indrindra.*havaozy/);

const importRecoveryKeys = ["interrupted-import-heading", "interrupted-import-description", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-scrum", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "interrupted-import-scrum-busy", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];

for (const key of importRecoveryKeys) {
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.match(malagasy['interrupted-import-description'], /Tsy azo tohizana.*tsy voatahiry.*rakitra loharano.*izay rehetra.*nampiana/);
assert.match(malagasy['interrupted-import-keep-confirm'], /Tsy misy esorina.*tsy ho voatanisa/);
assert.match(malagasy['interrupted-import-discard-confirm'], /voafafa tanteraka.*izay rehetra/);
assert.match(malagasy['interrupted-import-foreign-board'], /Tsy ity.*tsy novaina/);
assert.match(malagasy['scrum-history-checkpoint-hint'], /tsy omena.*olon-kafa.*tsy manova firaketana.*voarakitra/);
assert.match(malagasy['login-setting-env-only'], /mpizara ihany.*vakiana fotsiny/);
const currentMalagasyCatalog = spawnSync(process.execPath, [fillScript, '--list', 'mg'], { cwd: root, encoding: 'utf8' });
assert.equal(currentMalagasyCatalog.status, 0, currentMalagasyCatalog.stderr);
assert.deepEqual(JSON.parse(currentMalagasyCatalog.stdout), {});

for (const format of ['todoist', 'planner', 'csv', 'jira', 'excel']) {
  const key = `import-board-instruction-${format}`;
  assert.notEqual(malagasy[key], english[key], key);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.match(malagasy['import-board-instruction-todoist'], /Ao amin’ny Todoist.*Manage data > Export as CSV.*@labels.*p1.*p3/);
assert.doesNotMatch(malagasy['import-board-instruction-todoist'], /Export as a template|^In Todoist/);
assert.match(malagasy['import-board-instruction-planner'], /Export as Excel.*Export plan to Excel.*Completed By/);
assert.doesNotMatch(malagasy['import-board-instruction-planner'], /^In Microsoft/);
assert.match(malagasy['import-board-instruction-csv'], /faingo.*CSV.*kiheba.*TSV/);
assert.doesNotMatch(malagasy['import-board-instruction-csv'], /tsiahy/);
for (const literal of ['GET /rest/api/3/search/jql?jql=project=KEY&fields=*all&expand=names,schema', 'nextPageToken', '{ "issues": [...] }', '"automationRules"']) assert.ok(malagasy['import-board-instruction-jira'].includes(literal));
assert.match(malagasy['import-board-instruction-jira'], /pejy rehetra.*solaitra misaraka/);
assert.match(malagasy['import-board-instruction-excel'], /karatra iray isaky ny andalana.*dingana manaraka.*takelaka tsirairay.*andalana lohateny/);

const reportAccountKeys = ["anonymize-account", "userAnonymizePopup-title", "anonymize-account-confirm-popup", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "flow-note-processBehavior", "flow-note-sizeCycleTime"];

for (const key of reportAccountKeys) assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
assert.equal(malagasy['anonymize-account'], malagasy['userAnonymizePopup-title']);
const anonymizeWarning = malagasy['anonymize-account-confirm-popup'];
assert.match(anonymizeWarning, /solonanarana.*anarana feno.*adiresy mailaka.*esorina ny avatar.*sakanana ny fidirana/);
assert.match(anonymizeWarning, /Maharitra.*mitazona ny tantarany.*mbola mampiseho.*Tsy azo foanana/);
assert.doesNotMatch(anonymizeWarning, /fanondranana|rakitra aondrana|mpampiasa1/);
assert.match(malagasy['flow-note-agingWip'], /85%.*dimy farafahakeliny.*tsy misy.*tsy fantatra/);
assert.match(malagasy['flow-note-blockerAnalysis'], /rohy tranainy.*karatra voafafa.*misaraka.*mifanindry/);
assert.match(malagasy['flow-note-monteCarlo'], /2,000.*UTC.*tsy nahavitana.*ambony.*ambany.*tsy antoka.*3,650.*tsy misy vinavina/);
assert.match(malagasy['flow-note-processBehavior'], /Fanombohana.*namoronana.*Fiafarana.*arisiva.*roa farafahakeliny/);
assert.match(malagasy['flow-note-sizeCycleTime'], /Tsy ampidirina.*daty tsy manan-kery.*Fanombohana.*namoronana.*Fiafarana.*arisiva/);
for (const key of reportAccountKeys.filter(key => key.startsWith('flow-note-'))) assert.doesNotMatch(malagasy[key], /→|≥|≤|✓|MR̄/);

const reportLabelKeys = ["sum-of-number-fields", "wip-limit-groups", "wip-limit-group-name-placeholder", "wip-limit-group-add", "wip-limit-group-select-swimlane", "wip-limit-group-apply-swimlane", "board-view-aging-wip", "board-view-blocker-analysis", "board-view-monte-carlo", "board-view-process-behavior", "board-view-size-cycle-time", "flow-cycle-days", "flow-age-days", "flow-p85", "flow-samples", "flow-signal", "flow-unusual", "flow-blocker", "flow-episodes", "flow-active", "flow-blocked-days", "flow-unknown-start", "flow-confidence", "flow-target-count", "flow-finish-days", "flow-finish-date", "flow-capacity", "flow-beyond-horizon", "flow-mean", "flow-moving-range", "flow-mr-mean", "flow-size-source", "flow-size", "flow-error", "flow-details"];

for (const key of reportLabelKeys) assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
assert.match(malagasy['sum-of-number-fields'], /Fitambaran’ny sanda.*voamarika.*lisitra/);
for (const key of ['wip-limit-groups', 'wip-limit-group-add']) {
  assert.match(malagasy[key], /vondrona fetra WIP/i);
  assert.doesNotMatch(malagasy[key], /Alefaso/);
}
assert.match(malagasy['wip-limit-group-name-placeholder'], /vondrona.*tsy voatery/);
assert.doesNotMatch(malagasy['wip-limit-group-select-swimlane'], /solaitra/);
assert.match(malagasy['board-view-monte-carlo'], /Vinavina/);
assert.doesNotMatch(malagasy['board-view-monte-carlo'], /Histogram/);
assert.match(malagasy['flow-active'], /mbola misokatra/);
assert.match(malagasy['flow-capacity'], /farafahakeliny/);
assert.match(malagasy['flow-confidence'], /fahatokisana/);
assert.match(malagasy['flow-error'], /tatitra.*Hamarino ny sanda.*andramo indray/);


// Scheduling must retain both trigger paths and distinguish recurrence from reset.
for (const key of ['r-when-a-due-date-changed', 'r-when-a-start-date-changed',
  'r-when-a-end-date-changed', 'r-when-a-received-date-changed']) {
  assert.match(malagasy[key], /^Rehefa faritana na ovaina/);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.equal(malagasy['card-recurrence-interval'], malagasy['cardRecurrenceIntervalPopup-title']);
assert.match(malagasy['card-recurrence-interval'], /Fiverimberenan’ny karatra/);
assert.doesNotMatch(malagasy['card-recurrence-interval'], /voalohany/);
assert.match(malagasy['card-recurrence-interval-none'], /tsy miverimberina ho azy ny karatra/);
assert.match(malagasy['calendar-system-iso8601'], /gregoriana.*herinandro ISO 8601/);
assert.match(malagasy['due-reminder-invalid'], /isa manontolo.*folo.*-14.*14/);
assert.match(malagasy['time-adjustment-note'], /olona nanova ny fitambarany.*Tsy fotoam-piasana tsirairay.*Fanitsiana ny sanda miiba.*tsy voarakitra/);
assert.doesNotMatch(malagasy['time-adjustment-note'], /Δ|≠/);

for (const key of ['gcs-credentials', 'gcs-credentials-description', 'backup-description']) {
  assert.match(malagasy[key], /[Aa]ntsipiriany fanamarinana/);
  assert.doesNotMatch(malagasy[key], /fahazoan-dalana/);
  assert.deepEqual(tokens(malagasy[key]), tokens(english[key]), key);
}
assert.match(malagasy['gcs-credentials-description'], /Tsy voatery.*Avelao ho banga.*rakitra fanalahidy.*na.*mahazatra/);

assert.match(malagasy['move-reason'], /Antony famindrana.*tsy voatery/);
assert.match(malagasy['ask-move-reason'], /Angataho ny antony.*mamindra karatra/);
assert.doesNotMatch(malagasy['ask-move-reason'], /→|Famaritana/);
assert.match(malagasy['version-check-failed'], /Tsy azo nohamarinina.*laharan’ny kinova/);
assert.match(malagasy['toggle-header-icons-collapsed'], /kisary.*finday\/solosaina.*fampahafantarana/);
