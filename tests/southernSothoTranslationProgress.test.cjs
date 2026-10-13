// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const sesotho = readLocale('st');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%(?:\d+\$)?[A-Za-z]|%\d+|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'st',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'Southern Sotho stays complete after all forty-three batches');

for (const [key, value] of Object.entries(sesotho)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.deepEqual(tokens(sesotho['act-moveCard']),
  ['__board__', '__card__', '__list__', '__oldList__', '__oldSwimlane__',
    '__swimlane__']);
assert.deepEqual(tokens(sesotho['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(sesotho['allboards.workspaces'], 'Dibaka tsa mosebetsi');
assert.equal(sesotho.actions, 'Diketso');
assert.equal(sesotho['allboards.workspace-color'], 'Mmala');
assert.deepEqual(tokens(sesotho['activity-dueDate']), ['%s', '%s']);
assert.equal(sesotho['fixed-list-width'],
  'Bophara bo tshwanang bakeng sa manane ohle');
assert.equal(sesotho['add-members'], 'Eketsa ditho');
assert.deepEqual(tokens(sesotho['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(sesotho['avatar-too-big']), ['__size__']);
assert.deepEqual(tags(sesotho['board-private-info']),
  ['</strong>', '<strong>']);
assert.equal(sesotho['board-not-found'], 'Boto ha e a fumanwa');
assert.deepEqual(tags(sesotho['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  sesotho['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.deepEqual(tokens(sesotho['card-comments-title']), ['%s']);
assert.equal(sesotho['mobile-mode'], 'Mokgwa wa selefouno');
assert.equal(sesotho['positiveVoteMembersPopup-title'], 'Batsehetsi');
assert.equal(sesotho['vote-question'], 'Potso ya kgetho');
assert.match(sesotho['poker-delete-pop'], /Planning Poker/);
assert.equal(sesotho['exportChecklistPopup-title'],
  'Ntsha lenane la tlhahlobo');
assert.equal(sesotho['cardType-linkedCard'], 'Karete e hoketsweng');
assert.match(sesotho['map-to-existing-user-desc'], /ditumello/);
assert.match(sesotho['font-preview-text'], /0123456789/);
assert.equal(sesotho['changeLanguagePopup-title'], 'Fetola puo');
assert.equal(sesotho['auto-list-width'], 'Bophara bo iketsang ba lenane');
assert.match(sesotho['card-aging-tier3'], /Mokgahlelo wa 3/);
assert.equal(sesotho['color-darkgreen'], 'botala bo lefifi');
assert.equal(sesotho['color-sky'], 'bolou ba lehodimo');
assert.equal(sesotho['read-only'], 'Ho bala feela');
assert.equal(sesotho['confirm-move-list-to-swimlane'],
  'Fallisetsa lenane lena le dikarete tsohle tsa lona tseleng e nngwe?');
assert.equal(JSON.parse(sesotho['copyManyCardsPopup-format']).length, 3);
assert.equal(sesotho['custom-field-currency'], 'Tjhelete');
assert.deepEqual(tokens(sesotho['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(sesotho['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.match(sesotho['error-json-schema'], /JSON/);
assert.match(sesotho['error-import-empty-board'], /WeKan/);
assert.equal(sesotho['error-user-notAllowSelf'], 'O ke ke wa imema ka bowena');
assert.match(sesotho['export-card-excel-no-disk-space'], /Excel/);
assert.equal(sesotho['filter-overdue'], 'E fetilwe ke nako');
assert.equal(sesotho['filter-no-member'], 'Ha ho setho');
assert.match(sesotho['advanced-filter-description'], /F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(sesotho['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(sesotho['import-board-instruction-jira'], /automationRules/);
assert.match(sesotho['import-trello-json-file-hint'], /Trello API/);
assert.match(sesotho['trello-api-key'], /https:\/\/trello\.com\/app-key/);
assert.match(sesotho['trello-api-import-desc'], /Trello API/);
assert.equal(sesotho['invalid-year'],
  'Selemo ha se sebetse. Ka kopo ngola dipalo tsohle tse nne, mohlala 2026.');
assert.equal(sesotho['label-create'], 'Theha leibole');
assert.deepEqual(tokens(sesotho['label-default']), ['%s']);
assert.deepEqual(tokens(sesotho['leave-board-pop']), ['__boardTitle__']);
assert.equal(sesotho.menu, 'Lenane la dikgetho');
assert.equal(sesotho.normal, 'Tlwaelehileng');
assert.deepEqual(tokens(sesotho['page-maybe-private']), ['%s']);
assert.deepEqual(tags(sesotho['page-maybe-private']),
  ['</a>', "<a href='%s'>"]);
assert.deepEqual(tokens(sesotho['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.equal(sesotho['sidebar-close'], 'Kwala bara e ka thoko');
assert.match(sesotho['toggle-assignees'], /1-9/);
assert.equal(sesotho['upload-completed'], 'Ho kenya ho phethilwe');
assert.match(sesotho['custom-top-left-corner-logo-height'], /27/);
assert.equal(sesotho['welcome-list2'], 'Tse tswetseng pele');
assert.deepEqual(tokens(sesotho['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(sesotho['attachment-transfer-limits-description'], /API/);
assert.match(sesotho['smtp-tls-description'], /TLS.*SMTP/);
assert.equal(sesotho.Database, 'Polokelo ya data');
assert.match(sesotho.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(sesotho.DDP_transport, /DDP_TRANSPORT/);
assert.match(sesotho['org-domains-description'], /MULTITENANCY=true/);
assert.equal(sesotho['org-admin'], 'Molaodi wa Mokgatlo');
assert.deepEqual(tokens(sesotho['default-subtasks-board']), ['__board__']);
assert.equal(sesotho['delete-board'], 'Hlakola boto');
assert.equal(sesotho['checklist-count-on-minicard'],
  'Palo ya dintho tsa lenane la tlhahlobo (0/0) kareteng e nyenyane');
assert.equal(sesotho['parent-card'], 'Karete ya motswadi');
assert.deepEqual(tokens(sesotho['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(sesotho['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(sesotho['r-import-done']), ['__count__']);
assert.match(sesotho['r-import-trello-note'], /Trello.*Butler/);
assert.match(sesotho['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(sesotho['r-import-unmapped']), ['__count__']);
assert.equal(sesotho['r-schedule-daily'], 'Letsatsi le leng le le leng');
assert.equal(sesotho['r-mark-complete'], 'Tshwaya karete e phethilwe');
assert.equal(sesotho['r-unarchived'], 'E buseditswe ho tswa Polokelong');
assert.equal(sesotho['r-remove-all'], 'Tlosa ditho tsohle kareteng');
assert.equal(sesotho['r-send-email'], 'Romela imeile');
assert.equal(sesotho['r-d-move-to-top-gen'],
  'Fallisetsa karete hodimo lenaneng la yona');
assert.equal(sesotho['r-items-list'], 'ntho1,ntho2,ntho3');
assert.match(sesotho['r-checklist-note'], /dikoma/);
assert.match(sesotho['custom-head-manifest-content'], /JSON/);
assert.match(sesotho['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(sesotho['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(sesotho['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(sesotho['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(sesotho['drag-to-resize-sidebar'],
  'Hula ho fetola boholo ba bara e ka thoko');
assert.match(sesotho['submit-on-enter-description'], /Shift\+Enter.*Ctrl\/Cmd\+Enter/);
assert.equal(sesotho['roles-status-sees-assigned'], 'Tse abetsweng feela');
assert.equal(sesotho.monday, 'Mantaha');
assert.equal(sesotho.sunday, 'Sontaha');
assert.match(sesotho['invalid-domain'], /example\.com.*@/);
assert.equal(sesotho['globalSearchViewChange-choice-me'], 'Dikarete tsa ka');
assert.deepEqual(tokens(sesotho['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(sesotho['swimlane-title-not-found']), ['%s']);
assert.deepEqual(tokens(sesotho['list-title-not-found']), ['%s']);
assert.deepEqual(tokens(sesotho['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
for (const key of ['operator-customfield', 'operator-attachment-text',
  'operator-checklist-text', 'predicate-overdue']) {
  assert.doesNotMatch(sesotho[key], /\s/, `${key}: parser-safe single word`);
}
assert.equal(sesotho['operator-board'], 'boto');
assert.deepEqual(tokens(sesotho['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(sesotho['globalSearch-instructions-description']),
  ['__operator_list__']);
assert.deepEqual(tokens(sesotho['globalSearch-instructions-notes-3-2']),
  ['__predicate_month__', '__predicate_quarter__', '__predicate_week__',
    '__predicate_year__']);
assert.match(sesotho['globalSearch-instructions-notes-2'], /\*OR\*/);
assert.deepEqual(tokens(sesotho['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(sesotho['background-too-big']), ['{{size}}']);
assert.match(sesotho['import-dependencies-file'], /JSON.*SVG/);
assert.equal(sesotho.location, 'Sebaka');
assert.deepEqual(tokens(sesotho['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(sesotho['custom-field-stringtemplate-separator'],
  /&#32;.*&nbsp;/);
assert.match(sesotho['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan.*sudo docker logs wekan-app/s);
assert.match(sesotho['office-report-desc'], /IPv4.*IPv6/);
assert.equal(sesotho.securityReportTitle, 'Tlaleho ya tshireletso');
assert.match(sesotho['api-report-desc'], /REST API/);
assert.match(sesotho['api-no-calls'], /WITH_API=true/);
assert.match(sesotho['recovery-report-desc'], /MongoDB/);
assert.equal(sesotho['copy-swimlane'], 'Kopitsa tsela');
assert.equal(sesotho['history-change-moved'], 'E tsamaisitswe');
assert.match(sesotho['email-domain-allowed-to-invite'], /Domeine ya imeile/);
assert.match(sesotho.Node_heap_malloced_memory, /Node.*malloc/);
assert.match(sesotho['custom-legal-notice-link-url'], /URL/);
assert.equal(sesotho.copyChecklist, 'Kopitsa lenane la tlhahlobo');
assert.match(sesotho.newLineNewItem, /=/);
assert.match(sesotho['attachment-repair-locations-description'],
  /GridFS/);
assert.match(sesotho['move-scope-both'], /Diphuthelwana.*diavatar/);
assert.equal(sesotho['gridfs-file-id'], 'ID ya faele ya GridFS');
assert.match(sesotho['mongodb-compact-warning'],
  /Compact.*replica.*oplog.*Meteor/);
assert.match(sesotho['mongodb-compact-run'], /MongoDB Compact/);
assert.deepEqual(tokens(sesotho['drag-board-to-workspace']),
  ['__workspaces__']);
assert.match(sesotho['preview-pdf-not-supported'], /PDF/);
assert.match(sesotho['show-week-of-year'], /ISO 8601/);
assert.match(sesotho['import-board-zip'], /\.zip.*JSON/);
assert.equal(sesotho['collapse-checklist'], 'Mena lenane la tlhahlobo');
assert.equal(sesotho.accessibility, 'Phihlello');
assert.match(sesotho['accounts-lockout-info'], /ditlhaselo/);
assert.match(sesotho['accounts-lockout-known-users'], /phasewete/);
assert.equal(sesotho['accounts-lockout-unlock-all'], 'Notlolla bohle');
assert.match(sesotho['attachments-path-description'], /difaele/);
assert.match(sesotho['s3-force-path-style-description'], /MinIO.*S3.*AWS/);
assert.match(sesotho['database-migration-description'],
  /MongoDB.*FerretDB v1.*SQLite.*127\.0\.0\.1:27018.*127\.0\.0\.1:27019.*WEKAN_FERRETDB_URL.*WEKAN_MONGODB_URL.*MONGO_URL.*Snap/s);
assert.deepEqual(tokens(sesotho['database-migration-confirm']), ['__db__']);
assert.equal(sesotho['cron-job-started'],
  'Mosebetsi o rerilweng o qadile ka katleho');
assert.match(sesotho['sandstorm-migration-description'],
  /Sandstorm.*MongoDB 3.*FerretDB v1.*SQLite.*files\/attachments.*files\/avatars/s);
assert.match(sesotho['cards-loading-description'],
  /CARDS_LOADING.*CARDS_LOADING_LAZY_THRESHOLD/);
assert.deepEqual(tags(sesotho['render-links-as-plain-text-description']),
  ['<a href>']);
assert.match(sesotho['always-show-code-as-text-description'],
  /HTML.*<!-- -->.*JavaScript/);
assert.match(sesotho['backup-description'],
  /backup\/YYYY\/MM\/DD\/HH_MM_SS\/backup\.zip.*S3\/MinIO.*Azure.*GCS/s);
assert.match(sesotho['backup-time'], /HH:MM/);
assert.match(sesotho['gcs-permissions-note'],
  /Google Cloud Console.*client_email.*JSON.*Storage Object Admin/s);
assert.match(sesotho['s3-endpoint-menu-path'],
  /AWS.*S3.*MinIO.*Cloudflare R2.*Backblaze B2.*Wasabi.*DigitalOcean Spaces/);
assert.match(sesotho['gcs-credentials-menu-path'],
  /IAM & Admin.*Service accounts.*JSON/s);
assert.equal(sesotho['cloud-secret-none'], '(ha e a behwa)');
assert.match(sesotho['attachment-move-storage-azure'], /Azure Blob Storage/);
assert.match(sesotho['gridfs-enabled-description'], /MongoDB GridFS/);
assert.match(sesotho['gridfs-move-collectionfs-note'], /CollectionFS/);
assert.match(sesotho['s3-region-description'], /AWS S3.*us-east-1/);
assert.match(sesotho['s3-ssl-enabled-description'], /SSL\/TLS.*S3/);
assert.match(sesotho['restore-lost-cards-migration-description'],
  /swimlaneId.*listId/);
assert.match(sesotho['restore-all-archived-migration-description'],
  /swimlaneId.*listId/);
assert.match(sesotho['fix-avatar-urls-migration'], /URL/);
assert.match(sesotho['run-restore-all-archived-migration-confirm'], /TSOHLE/);
assert.equal(sesotho['lost-cards'], 'Dikarete tse lahlehileng');
assert.match(sesotho['step-fix-avatar-urls'], /URL/);
assert.match(sesotho['step-fix-missing-ids'], /ID/);
assert.equal(sesotho['cpu-usage'], 'Tshebediso ya CPU');
assert.equal(sesotho['every-10-minutes'],
  'Metsotso e meng le e meng e 10');
assert.match(sesotho['gridfs-attachments'], /GridFS/);
assert.match(sesotho['migration-batch-size-description'], /1-100/);
assert.match(sesotho['migration-cpu-threshold-description'], /CPU.*10-90/);
assert.match(sesotho['migration-delay-ms-description'], /100-10000/);
assert.match(sesotho['migration-info-text'], /sebatli/);
assert.equal(sesotho.showChecklistAtMinicard,
  'Bontsha lenane la tlhahlobo kareteng e nyenyane');
assert.match(sesotho['api-endpoints'], /API/);
assert.match(sesotho['username-too-short'], /3/);
assert.match(sesotho['problems-in-progress-help'], /CPU/);
assert.deepEqual(tokens(sesotho['repair-broken-cards-done-unfixable']),
  ['__fixed__', '__unfixable__']);
assert.deepEqual(tokens(sesotho['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);
assert.match(sesotho['event-ip'], /IP/);
assert.match(sesotho.integrityReportTitle, /tsamaiso ya difaele/);
assert.deepEqual(tokens(sesotho['globalSearch-instructions-operator-number']),
  ['__operator_number__']);
assert.deepEqual(tags(sesotho['globalSearch-instructions-operator-number']),
  ['<number>', '<number>']);
assert.doesNotMatch(sesotho['operator-number'], /\s/);
assert.match(sesotho['import-board-source'], /Trello.*Jira.*WeKan.*CSV.*Excel/);

console.log('southernSothoTranslationProgress: historical catalog and card-link checks passed');

const translatedCardLinkKeys = ["attach-card", "attachCardPopup-title", "attach-card-hint", "attached-card-unavailable", "detach-card", "attach-card-self", "attach-card-limit", "attach-card-not-found", "board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "custom-field-links", "custom-field-links-hint", "custom-field-links-none", "custom-field-link-unavailable", "custom-field-link-fields", "custom-field-link-no-fields", "custom-field-link-inactive", "custom-field-unlink", "custom-field-link-target", "custom-field-link-direction", "custom-field-link-both", "custom-field-link-send", "custom-field-link-sends", "custom-field-link-receives", "custom-field-link-add", "field-link-self", "field-link-limit", "field-link-archived", "field-link-invalid", "field-link-not-found", "field-link-not-allowed", "cardCustomFieldLinksPopup-title", "cards-use-list-color"];
for (const key of translatedCardLinkKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['custom-field-links-hint'], /lebitso le mofuta o tshwanang/);
assert.match(sesotho['custom-field-links-hint'], /kareteng e le nngwe feela ha di fetolwe/);
assert.match(sesotho['custom-field-link-inactive'], /ha a sa kgona.*ka bobedi, kapa.*polokelong/);
assert.match(sesotho['custom-field-link-both'], /^Ditsela ka bobedi/);
assert.match(sesotho['custom-field-link-send'], /^Tsela e le nngwe.*e ka sehloohong/);
assert.notEqual(sesotho['custom-field-link-sends'], sesotho['custom-field-link-receives']);
assert.match(sesotho['field-link-not-allowed'], /hlophisa dikarete ka bobedi/);
assert.match(sesotho['attach-card-self'], /e ke ke.*boyona/);
assert.match(sesotho['attached-card-unavailable'], /sa kgoneng ho e bona/);
assert.match(sesotho['cards-use-list-color'], /tse se nang mmala wa tsona/);

const translatedImportHelpKeys = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-meistertask", "import-board-instruction-obsidian", "import-board-instruction-linear", "import-board-instruction-ticktick", "import-board-instruction-clickup", "import-board-instruction-nullboard", "import-board-instruction-kanri", "import-board-instruction-pivotal", "import-board-instruction-tasksorg", "import-board-instruction-monday", "import-board-instruction-superproductivity", "import-board-instruction-taiga", "import-board-instruction-vikunja", "import-board-instruction-quire", "import-board-instruction-wrike", "import-board-instruction-teamwork", "import-board-instruction-businessmap", "import-board-instruction-redmine", "import-board-instruction-notion", "import-board-instruction-plane"];
for (const key of translatedImportHelpKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
for (const format of ['taiga', 'vikunja']) {
  assert.match(sesotho[`import-board-instruction-${format}`], /Diphuthelwana ha di kenngwe/);
}
assert.match(sesotho['import-board-instruction-quire'], /Ditshwaelo le diphuthelwana ha di yo/);
assert.match(sesotho['import-board-instruction-notion'], /Dikamano, ditshwantsho le diphuthelwana ha di kenngwe/);
assert.match(sesotho['import-board-instruction-notion'], /ha e le siyo.*kholomo ya pele.*tlaleho/);
assert.match(sesotho['import-board-instruction-plane'], /ha e na ditlhaloso kapa diphuthelwana.*ha di kenngwe/);
for (const format of ['nullboard', 'kanri']) assert.match(sesotho[`import-board-instruction-${format}`], /boto ya.*pele/);
assert.match(sesotho['import-board-instruction-redmine'], /Senyesemane ho My account pele/);
assert.match(sesotho['import-board-instruction-businessmap'], /mabitso.*Senyesemane.*Title, Column, Lane, Owner, Deadline/);
assert.match(sesotho['import-board-instruction-teamwork'], /-, # kapa >.*--, ## kapa >>/);
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(sesotho['import-board-instruction-orgmode'].includes(literal), literal);
for (const [format, literal] of [['obsidian', '.md'], ['nullboard', '.nbx'], ['taiga', '.json.gz'], ['vikunja', 'data.json'], ['monday', '.xlsx'], ['redmine', '% Done'], ['superproductivity', 'sp-backup']]) {
  assert.ok(sesotho[`import-board-instruction-${format}`].includes(literal), literal);
}

const translatedImportControlKeys = ["import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields", "csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title", "exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start", "trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access", "sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "webhook-payload-heading", "webhook-payload-description", "webhook-payload-text", "webhook-payload-fields", "webhook-payload-field-standard", "webhook-payload-field-ids", "webhook-payload-field-names", "webhook-payload-field-links", "webhook-payload-field-actor", "webhook-payload-field-people", "webhook-payload-field-details", "webhook-hide-identity", "webhook-someone", "notification-delivery-layout-classic"];
for (const key of translatedImportControlKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['import-members-mode-placeholder'], /mabitso a bona.*basebedisi ba nnete hamorao/);
assert.equal(sesotho['import-members-mode-me'], 'Ba etse bohle nna');
assert.match(sesotho['csv-mapping-description'], /fetola tse fosahetseng.*ha e yo faeleng/);
assert.match(sesotho['csv-mapping-list-missing'], /ha e na kholomo.*lenane le le leng.*dikarete tsohle/);
assert.deepEqual(tokens(sesotho['csv-mapping-column-number']), ['__number__']);
assert.deepEqual(tokens(sesotho['import-many-progress']), ['__done__', '__name__', '__total__']);
assert.match(sesotho['import-many-boards-hint'], /ntle le ho hokahanya ditho.*Vikunja, Notion, Plane.*WeKan.*boto e le nngwe/);
assert.match(sesotho['import-many-boards-hint'], /ho ena le karolo e ka hodimo/);
assert.match(sesotho['export-all-boards-hint'], /eo o ka e ntshang.*Excel.*leqephe.*\.zip.*faele/);
assert.ok(sesotho['trello-export-desc'].includes('"Swimlane: …"'));
assert.match(sesotho['sandstorm-trello-access-needed'], /ha e na phihlello.*Qala ka ho dumella/);
for (const key of ['external-link-rules-description', 'external-link-identifier-aliases']) {
  const braces = value => value.match(/\{(?:number|identifier)\}/g) || [];
  assert.deepEqual(braces(sesotho[key]), braces(english[key]), key);
}
assert.ok(sesotho['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.match(sesotho['webhook-payload-description'], /peakanyo e futsitsweng.*ha ho sa behwa letho/);
assert.match(sesotho['webhook-payload-field-standard'], /WEBHOOKS_ATTRIBUTES/);
assert.match(sesotho['webhook-hide-identity'], /^Se kenye lebitso la ka/);

const translatedNotificationSettingKeys = ["notification-delivery-layout-clear", "notification-delivery-parts", "notification-delivery-part-board", "notification-delivery-part-actor", "notification-delivery-part-card", "notification-delivery-part-details", "notification-delivery-part-dates", "notification-delivery-part-link", "notification-delivery-grouping", "notification-delivery-grouping-all", "notification-delivery-grouping-board", "notification-delivery-grouping-card", "notification-delivery-grouping-none", "notification-delivery-schedule", "notification-delivery-schedule-immediate", "notification-delivery-schedule-interval", "notification-delivery-schedule-daily", "notification-delivery-interval", "notification-delivery-minutes", "notification-delivery-quiet", "notification-delivery-quiet-clear", "notification-delivery-timezone", "notification-delivery-invalid", "notification-group-card", "notification-group-board", "read-only-field", "r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "card-field-visibility", "card-field-visibility-desc", "import-file-label", "subtask-mark-done", "subtask-mark-not-done", "subtask-done-no-permission"];
for (const key of translatedNotificationSettingKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['notification-delivery-quiet'], /ema ho fihlela di fela/);
assert.equal(sesotho['notification-delivery-schedule-daily'], 'Hang ka letsatsi');
assert.notEqual(sesotho['notification-delivery-grouping-card'], sesotho['notification-delivery-grouping-board']);
assert.deepEqual(tokens(sesotho['notification-group-card']), ['__card__', '__count__']);
assert.deepEqual(tokens(sesotho['notification-group-board']), ['__board__', '__count__']);
assert.match(sesotho['read-only-field'], /setho se seng le se seng.*balaodi ba boto feela/);
assert.match(sesotho['r-wrike-workflow-note'], /phethilwe.*Completed kapa Cancelled.*sa phethwa.*Active kapa Deferred/);
assert.match(sesotho['r-wrike-workflow-note'], /GET \/workflows/);
assert.match(sesotho['r-wrike-workflow-note'], /boiketsetso e ke ke ya ntshuwa/);
assert.deepEqual(tokens(sesotho['r-import-wrike-workflow-done']), ['__lists__', '__name__', '__rules__', '__skipped__']);
for (const variable of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(sesotho['ldap-sync-now-nothing'].includes(variable), variable);
assert.deepEqual(tokens(sesotho['ldap-sync-now-error']), ['%s']);
assert.match(sesotho['oauth-providers-allowed-email-domains'], /dikoma.*ha ho sa ngolwa letho.*dumellwa tsohle/);
assert.match(sesotho['card-field-visibility-desc'], /Ha ho data ya karete kapa peakanyo ya boto e fetohang/);
assert.match(sesotho['card-field-visibility-desc'], /tshwaya hape.*kamoo e neng e behilwe kateng/);
assert.match(sesotho['subtask-mark-not-done'], /o sa phethwa/);
assert.match(sesotho['subtask-done-no-permission'], /O ke ke wa fetola/);

const translatedBlocklyControlKeys = ["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_MUTATOR_CLOSED"];
for (const key of translatedBlocklyControlKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.deepEqual(tokens('boloko %1, %2, %1'), ['%1', '%1', '%2']);
assert.notDeepEqual(tokens('%1'), tokens('%2'));
assert.notDeepEqual(tokens('%1'), tokens('%1 %1'));
assert.match(sesotho['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /e se nnete/);
assert.match(sesotho['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /e le nnete/);
assert.match(sesotho['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'], /^Tswa potolohong/);
assert.match(sesotho['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'], /Tlola tse setseng.*phetapheto e latelang/);
assert.match(sesotho['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'], /feela ka hare ho potoloho/);
assert.match(sesotho['blockly-COLOUR_BLEND_TOOLTIP'], /0.0 - 1.0/);
assert.match(sesotho['blockly-COLOUR_RGB_TOOLTIP'], /pakeng tsa 0 le 100/);
assert.deepEqual(tokens(sesotho['blockly-CONTROLS_FOR_TITLE']), ['%1', '%2', '%3', '%4']);
assert.match(sesotho['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /Ha ho kgonehe ho hlakola.*karolo ya tlhaloso/);

for (const key of ["blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CAPS_LOCK_KEY", "blockly-COMMAND_KEY", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROL_KEY", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-HOME_KEY", "blockly-INSERT_KEY", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PAUSE_KEY", "blockly-SHIFT_KEY", "blockly-SPACE_KEY", "blockly-TAB_KEY"]) assert.equal(sesotho[key], english[key], key);

const translatedBlocklyListKeys = ["blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM"];
for (const key of translatedBlocklyListKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.notEqual(sesotho['blockly-INPUT_LABEL_MATH_DIVIDEND'], sesotho['blockly-INPUT_LABEL_MATH_DIVISOR']);
assert.equal(sesotho['blockly-INPUT_LABEL_MATH_DIVIDEND'], 'palo e arolwang');
assert.equal(sesotho['blockly-INPUT_LABEL_MATH_DIVISOR'], 'palo e arolang');
assert.match(sesotho['blockly-LISTS_CREATE_EMPTY_TOOLTIP'], /bolelele ba 0.*se nang direkoto/);
for (const suffix of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
  const get = sesotho[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_${suffix}`];
  const remove = sesotho[`blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_${suffix}`];
  const both = sesotho[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_${suffix}`];
  assert.match(get, /^Kgutlisa/);
  assert.doesNotMatch(get, /Tlosa/);
  assert.match(remove, /^Tlosa/);
  assert.doesNotMatch(remove, /kgutlis/);
  assert.match(both, /^Tlosa mme o kgutlise/);
}
assert.match(sesotho['blockly-LISTS_GET_SUBLIST_TOOLTIP'], /kopi ya karolo/);
assert.match(sesotho['blockly-LISTS_REVERSE_TOOLTIP'], /kopi ya lenane.*qetellong ho ya qalong/);
assert.match(sesotho['blockly-LISTS_INDEX_OF_TOOLTIP'], /Kgutlisa %1 haeba ntho e sa fumanwe/);
assert.match(sesotho['blockly-LISTS_INDEX_FROM_END_TOOLTIP'], /ya ho qetela/);
assert.match(sesotho['blockly-LISTS_INDEX_FROM_START_TOOLTIP'], /ya pele/);
assert.deepEqual(tokens(sesotho['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT']), ['%1', '%2']);
assert.match(sesotho['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /Tshwara %1.*ebe %2 ho amohela/);
assert.match(sesotho['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST'], /qalong/);
assert.match(sesotho['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST'], /qetellong/);

const translatedBlocklyMathKeys = ["blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA"];
for (const key of translatedBlocklyMathKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['blockly-LISTS_SORT_TOOLTIP'], /kopi ya lenane/);
assert.notEqual(sesotho['blockly-LISTS_SORT_ORDER_ASCENDING'], sesotho['blockly-LISTS_SORT_ORDER_DESCENDING']);
assert.match(sesotho['blockly-LISTS_SORT_TYPE_IGNORECASE'], /sa natse ditlhaku tse kgolo le tse nyenyane/);
assert.match(sesotho['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /dikenyo ka bobedi/);
assert.match(sesotho['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /bonyane kenyo e le nngwe/);
for (const strict of ['GT', 'LT']) assert.doesNotMatch(sesotho[`blockly-LOGIC_COMPARE_TOOLTIP_${strict}`], /lekana/);
for (const inclusive of ['GTE', 'LTE']) assert.match(sesotho[`blockly-LOGIC_COMPARE_TOOLTIP_${inclusive}`], /kapa e lekana/);
assert.match(sesotho['blockly-LOGIC_COMPARE_TOOLTIP_NEQ'], /di sa lekane/);
assert.match(sesotho['blockly-LOGIC_NEGATE_TOOLTIP'], /nnete haeba kenyo e se nnete.*ha se nnete haeba kenyo e le nnete/);
for (const branch of ['IF_TRUE', 'IF_FALSE', 'CONDITION']) assert.ok(sesotho['blockly-LOGIC_TERNARY_TOOLTIP'].includes(sesotho[`blockly-LOGIC_TERNARY_${branch}`]));
assert.match(sesotho['blockly-MATH_ATAN2_TOOLTIP'], /dikhato.*-180.*180/);
assert.match(sesotho['blockly-MATH_CONSTRAIN_TOOLTIP'], /ho kenyelletswa meedi eo/);
assert.match(sesotho['blockly-MATH_IS_PRIME'], /kgolo ho 1.*ntle le masalla feela ka 1 le ka boyona/);
assert.match(sesotho['blockly-MATH_IS_NEGATIVE'], /tlase ho 0/);
assert.match(sesotho['blockly-MATH_IS_POSITIVE'], /hodimo ho 0/);
assert.match(sesotho['blockly-MATH_MODULO_TOOLTIP'], /masalla/);
assert.match(sesotho['blockly-MATH_ONLIST_TOOLTIP_MODE'], /lenane la dintho.*hangata ka ho fetisisa/);
for (const literal of ['π (3.141…)', 'e (2.718…)', 'φ (1.618…)', 'sqrt(2) (1.414…)', 'sqrt(½) (0.707…)', '∞']) assert.ok(sesotho['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal), literal);

const translatedBlocklyProcedureKeys = ["blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK"];
for (const key of translatedBlocklyProcedureKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0[.]0 [(]e kenyeleditswe[)].*1[.]0 [(]e sa kenyeletswa[)]/);
assert.match(sesotho['blockly-MATH_RANDOM_INT_TOOLTIP'], /ho kenyelletswa meedi eo/);
assert.match(sesotho['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'], /tlase/);
assert.match(sesotho['blockly-MATH_ROUND_OPERATOR_ROUNDUP'], /hodimo/);
for (const key of ['COS', 'SIN', 'TAN']) assert.match(sesotho[`blockly-MATH_TRIG_TOOLTIP_${key}`], /dikhato [(]eseng diradiane[)]/);
assert.match(sesotho['blockly-MATH_SINGLE_TOOLTIP_NEG'], /letshwao le fetotsweng/);
assert.match(sesotho['blockly-MATH_SINGLE_TOOLTIP_ABS'], /ntle le letshwao/);
assert.match(sesotho['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /sa kgutliseng sephetho/);
assert.match(sesotho['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /e kgutlisang sephetho/);
assert.match(sesotho['blockly-PROCEDURES_CALLRETURN_TOOLTIP'], /sebedise sephetho sa yona/);
assert.doesNotMatch(sesotho['blockly-PROCEDURES_CALLNORETURN_TOOLTIP'], /sebedise sephetho/);
assert.match(sesotho['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /Ha ho kgonehe.*boloko ba tlhaloso bo thibetswe/);
assert.match(sesotho['blockly-PROCEDURES_IFRETURN_WARNING'], /feela ka hare ho tlhaloso/);
assert.match(sesotho['blockly-SCREENREADER_MODE_DISABLED'], /o timme.*ho o bulela/);
assert.match(sesotho['blockly-SCREENREADER_MODE_ENABLED'], /o butswe.*ho o tima/);
assert.match(sesotho['blockly-RENAME_VARIABLE_TITLE'], /tsohle.*%1/);

const translatedBlocklyTextKeys = ["blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-UNDO", "blockly-UNNAMED_KEY", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload"];
for (const key of translatedBlocklyTextKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['blockly-TEXT_LENGTH_TOOLTIP'], /ho kenyelletswa dibaka/);
assert.match(sesotho['blockly-TEXT_REPLACE_TOOLTIP'], /makgetlo ohle/);
assert.match(sesotho['blockly-TEXT_INDEXOF_TOOLTIP'], /mongolo wa pele.*mongolong wa bobedi.*%1 haeba mongolo o sa fumanwe/);
assert.match(sesotho['blockly-TEXT_TRIM_TOOLTIP'], /kopi.*ntlheng e le nngwe kapa dintlheng ka bobedi/);
assert.match(sesotho['blockly-TEXT_CHARAT_FROM_END'], /ho tloha qetellong/);
assert.doesNotMatch(sesotho['blockly-TEXT_CHARAT_FROM_START'], /qetellong/);
for (const literal of ['Enter', 'Shift+Enter', 'Escape']) assert.ok(sesotho['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(literal), literal);
assert.match(sesotho['blockly-WORKSPACE_SEARCH_INPUT_LABEL'], /Enter bakeng sa e latelang.*Shift[+]Enter bakeng sa e fetileng/);
assert.ok(sesotho['blockly-WORKSPACE_CONTENTS_COMMENTS_MANY'].startsWith(' '));
assert.deepEqual(tokens(sesotho['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE']), ['%2']);
assert.deepEqual(tokens(sesotho['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO']), ['%2']);
assert.equal(sesotho['blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF'], sesotho['blockly-CONTROLS_IF_MSG_ELSEIF']);
assert.equal(sesotho['blockly-CONTROLS_IF_ELSE_TITLE_ELSE'], sesotho['blockly-CONTROLS_IF_MSG_ELSE']);
assert.equal(sesotho['blockly-PROCEDURES_DEFRETURN_COMMENT'], sesotho['blockly-PROCEDURES_DEFNORETURN_COMMENT']);
assert.equal(sesotho['blockly-PROCEDURES_DEFRETURN_PROCEDURE'], sesotho['blockly-PROCEDURES_DEFNORETURN_PROCEDURE']);
assert.match(sesotho['r-blocks-invalid'], /e le nngwe feela.*ketso e le nngwe.*sa hokahanang kapa tse eketsehileng pele o boloka/);
assert.match(sesotho['r-blocks-conflict'], /fetohile.*molao o bolokilweng hape pele o boloka/);
assert.match(sesotho['r-blocks-permission'], /Tumello ya molaodi wa boto/);

const fullSesothoInventory = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'), '--list', 'st',
], { cwd: root, encoding: 'utf8' });
assert.equal(fullSesothoInventory.status, 0, fullSesothoInventory.stderr);
assert.deepEqual(Object.keys(JSON.parse(fullSesothoInventory.stdout)), [],
  'Southern Sotho has no remaining non-exempt English placeholders');

const translatedScrumPlanningKeys = ["board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-release-scope", "scrum-releases-select-help", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help"];
for (const key of translatedScrumPlanningKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.equal(sesotho['board-view-product-backlog'], sesotho['scrum-product-backlog']);
assert.equal(sesotho['board-view-sprints'], sesotho['scrum-sprints']);
assert.equal(sesotho['scrum-backlog'], sesotho['scrum-category-backlog']);
assert.match(sesotho['scrum-releases-select-help'], /tse mmalwa.*Ctrl.*Cmd.*Mac.*tlosa dikgetho tsohle.*dintshong tsohle/);
assert.match(sesotho['scrum-report-help'], /tse sa tsejweng.*ka thoko.*ha se ditekanyo tsa lefela/);
assert.match(sesotho['scrum-report-help'], /feela ha diyuniti tsa tekanyo le melao di tshwana/);
assert.match(sesotho['scrum-confirm-close'], /sa phethwang.*sebakeng se kgethilweng/);
assert.match(sesotho['scrum-confirm-cancel'], /di dula e le karolo ya yona ho fihlela di abelwa hape/);
assert.match(sesotho['scrum-partial-report'], /feela dikarete tseo o di abetsweng hona jwale/);
assert.match(sesotho['scrum-daily-observations-help'], /ya pele e rekotilweng.*UTC.*nako e bontshitsweng/);
assert.match(sesotho['scrum-daily-observations-help'], /se nang data ha a bontshwe/);
assert.match(sesotho['scrum-daily-observations-help'], /ha di rekote phetoho e nngwe le e nngwe.*qetellong ya letsatsi/);
assert.match(sesotho['scrum-daily-observations-help'], /tse sa tsejweng ha se lefela/);
assert.match(sesotho['scrum-daily-observations-help'], /karolo ena.*ditemoho.*bareng ya disebediswa.*diphetho/);
assert.deepEqual(tokens(sesotho['scrum-total']), ['__count__', '__estimate__', '__unknown__']);

const translatedScrumSyncKeys = ["scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded"];
for (const key of translatedScrumSyncKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['scrum-daily-truncated'], /366.*moraorao/);
assert.match(sesotho['scrum-daily-observations-export-help'], /ya pele.*UTC.*ha a bontshwe.*ha di rekote.*ha se lefela/);
assert.match(sesotho['scrum-import-pending'], /ha ho a phethwa.*ho ntsha ditlaleho ha ho fumanehe/);
assert.match(sesotho['scrum-import-into-board-hint'], /ha di etswe habeli.*ID.*nomoro le sehlooho.*sa tsamaellaneng.*ha di fetolwe.*ponelopele pele/);
assert.match(sesotho['scrum-import-card-ambiguous'], /tse fetang e le nngwe/);
assert.match(sesotho['scrum-import-card-on-another-board'], /boto e nngwe.*ha e a fetolwa/);
assert.match(sesotho['sync-conflict-hint'], /kgetho ka nngwe.*Ha ho letho le romelwang tsamaisong ya mohlodi/);
assert.match(sesotho['sync-conflict-review-complete'], /o di abetsweng.*Lenane lohle ha le a amahanngwa/);
assert.match(sesotho['sync-conflict-detach-hint'], /Tlosa feela.*di dula ho WeKan/);
assert.match(sesotho['sync-conflict-archive-hint'], /ha e sa le teng.*di thibela.*Dikarete tse nyenyane ha di fetolwe/);
assert.match(sesotho['sync-conflict-creation-hint'], /ya pele e sa fetolwa.*Ho leka hape.*eo hape/);
assert.match(sesotho['sync-preview-saved'], /dipeakanyo tse bolokilweng.*hlahloba mohlodi hape/);
assert.match(sesotho['sync-preview-scope'], /e nngwe e ka siuwa/);
assert.match(sesotho['sync-preview-truncated'], /100 tsa pele/);

const translatedSyncReportKeys = ["sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint"];
for (const key of translatedSyncReportKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['sync-source-scope'], /boleng ba tsona ha bo bontshwe/);
assert.match(sesotho['sync-source-truncated'], /100.*kgutsufaditsweng/);
assert.match(sesotho['sync-report-retention'], /20.*matsatsi a 30/);
assert.match(sesotho['sync-report-partial'], /ho ka be ho fetotse.*di ke ke tsa tswella kapa tsa etsolla/);
assert.match(sesotho['sync-report-unavailable'], /ho ngola lenaneng lohle.*seva e fumanehang/);
assert.match(sesotho['sync-recovery-description'], /ntse ho etswa kapa ho sitisitswe.*Ntjhafatsa.*di ke ke tsa tswella kapa tsa etsolla/);
for (const key of ['sync-estimate-field-hint', 'sync-time-estimate-hint']) {
  assert.match(sesotho[key], /boleng bo siyo mohloding bo a iphapanyetswa|Boleng bo siyo mohloding bo a iphapanyetswa/);
  assert.match(sesotho[key], /null e boletsweng ka ho hlaka e hlakola boleng/);
  assert.match(sesotho[key], /dikgohlano/);
}
assert.match(sesotho['sync-time-estimate-hint'], /karolo e le nngwe feela/);
assert.notEqual(sesotho['email-failure-smtp-temporary'], sesotho['email-failure-smtp-rejected']);
assert.match(sesotho['email-failure-delivery-unconfirmed'], /ha ho a kgona ho netefatswa.*pele o leka hape/);
assert.match(sesotho['sync-planning-hint'], /feela ha Scrum e buletswe.*pele ka ID.*ebe ka lebitso/);
assert.match(sesotho['sync-planning-hint'], /ho fihlela mohlodi o fetola.*ha pele ha ho ke ho tlosa moralo/);

const translatedRecoveryFinalKeys = ["activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-unavailable", "stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy", "interrupted-import-heading", "interrupted-import-description", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-scrum", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "interrupted-import-scrum-busy", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const key of translatedRecoveryFinalKeys) {
  assert.notEqual(sesotho[key], english[key], `${key}: no English placeholder`);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['activity-recovery-description'], /ha ho ke ho theha ketsahalo hape/);
assert.match(sesotho['activity-recovery-denied'], /ha di sa dumella/);
assert.match(sesotho['activity-recovery-cancel-confirm'], /ka ho sa feleng.*se ke ke sa tswellwa hape.*diimeile|ka ho sa feleng.*se ke ke sa tswellwa hape.*Diimeile/);
assert.match(sesotho['activity-recovery-cancel-confirm'], /moleng.*seng di fihlile ha di kgutliswe/);
assert.match(sesotho['stuck-sync-operation-description'], /diphetoho tse seng di sebedisitswe di sala.*ha di ngolwe le ka mohla/);
assert.match(sesotho['stuck-sync-operation-replayable-now'], /e tla iphethela.*e ke ke ya lahlwa/);
assert.match(sesotho['stuck-sync-operation-replayable'], /e tla iphethela.*ha e a lahlwa/);
assert.match(sesotho['interrupted-import-description'], /ho ke ke ha tswellwa.*faele ya mohlodi ha e bolokwe/);
assert.match(sesotho['interrupted-import-description'], /tsohle tse kentsweng.*ho tloha ka nako eo/);
assert.match(sesotho['interrupted-import-discard-confirm'], /tsohle.*ka ho sa feleng/);
assert.match(sesotho['interrupted-import-keep-confirm'], /Ha ho letho le tloswang/);
assert.match(sesotho['interrupted-import-foreign-board'], /ha e a thehwa.*ha e a angwa/);
for (const key of ['stuck-sync-operation-truncated', 'interrupted-import-truncated']) assert.match(sesotho[key], /50 tsa kgale ka ho fetisisa/);
assert.match(sesotho['scrum-history-checkpoint-hint'], /feela ha ho se motho e mong ya fetotseng.*ha ho fetole direkoto/);
assert.match(sesotho['scrum-history-checkpoint-stuck'], /ho thibetswe ho fihlela e rarollwa/);
assert.match(sesotho['login-setting-env-only'], /tikoloho ya seva feela.*ho bala feela/);

// Historical review through source key 219: meaning, not merely tokens.
const titleArguments = ['New title', 'Original card'];
const renderedTitleActivity = sesotho['activity-changedTitle'].replace(/%s/g, () => titleArguments.shift());
assert.equal(renderedTitleActivity, 'o fetotse sehlooho ho New title bakeng sa Original card');
assert.notEqual(renderedTitleActivity, 'o fetotse sehlooho sa New title ho Original card');
assert.match(sesotho['set-default-board-template'], /ka boiketsetso.*ha ho thehwa boto/);
assert.doesNotMatch(sesotho['set-default-board-template'], /boitshepo/);
assert.match(sesotho['swimlane-height-error-message'], /palo e felletseng e kgolo ho 0/);
assert.doesNotMatch(sesotho['swimlane-height-error-message'], /e ntle/);
assert.match(sesotho['add-existing-card-as-subtask-empty'], /tse tsamaellanang/);

// Historical review through key 454: preserve the actual control meanings.
assert.match(sesotho['avatar-too-big'], /boholo bo dumelletsweng.*__size__/);
assert.match(sesotho['board-view-timeline-showing'], /ka nako ya/);
assert.doesNotMatch(sesotho['board-view-timeline-showing'], /ho tloha/);
assert.match(sesotho['roadmap-group-by'], /ka dihlopha/);
assert.doesNotMatch(sesotho['roadmap-group-by'], /Sekaseka/);
assert.equal(sesotho['board-view-pulse'], 'Ho otla ha pelo');
assert.match(sesotho['card-has-unread-comments'], /ditshwaelo tse sa balwang/);
assert.doesNotMatch(sesotho['card-has-unread-comments'], /ntjha/);
assert.equal(sesotho['due-today'], 'E lokela ho phethwa kajeno');
assert.match(sesotho['due-days-overdue'], /fetilwe ke nako.*%s/);
assert.equal(sesotho['userAnonymizePopup-title'], 'Pata boitsebiso ba akhaonto');
assert.doesNotMatch(sesotho['userAnonymizePopup-title'], /kenngwang/);
assert.equal(sesotho['cardLabelsPopup-title'], 'Dileibole');

// Historical review through key 589: archive location and reusable templates.
assert.match(sesotho['close-board-pop'], /Polokelo.*leqepheng la Diboto tsohle/);
assert.doesNotMatch(sesotho['close-board-pop'], /hloohong.*lapeng/);
assert.equal(sesotho.worker, 'Mosebeletsi');
assert.notEqual(sesotho.worker, 'Mosebetsi');
assert.equal(sesotho['save-card-as-template'], 'Boloka e le thempleite');
assert.doesNotMatch(sesotho['save-card-as-template'], /Setshwantsho/);

// Historical review through key 813: literal filter examples and import limits.
assert.equal(sesotho['custom-fields'], 'Dikarolo tse ikgethileng');
assert.doesNotMatch(sesotho['custom-fields'], /Masimo/);
for (const key of ['export-card-excel-no-disk-space', 'export-card-excel-free']) {
  assert.match(sesotho[key], /se sa sebediswang/);
  assert.doesNotMatch(sesotho[key], /mahala/);
}
const escapedApostropheExample = "Field1 == I" + String.fromCharCode(92) + "'m";
for (const example of [escapedApostropheExample, "'Field 1' == 'Value 1'", 'F1 == V1 || F1 == V2', 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) {
  assert.ok(english['advanced-filter-description'].includes(example));
  assert.ok(sesotho['advanced-filter-description'].includes(example), example);
}
assert.doesNotMatch(sesotho['advanced-filter-description'], /I’m/);
assert.match(sesotho['advanced-filter-description'], /matshwao a qotso a le mong/);
assert.match(sesotho['import-board-instruction-markdown'], /matshwao a dikulo.*se nang mabokose a ho tshwaya.*dikarete tse sa phethwang/);

// Historical review through key 929: stale English differs from current English
// and therefore requires semantic coverage beyond the placeholder inventory.
for (const format of ['taskwarrior', 'focalboard', 'todoist', 'planner']) {
  const value = sesotho[`import-board-instruction-${format}`];
  assert.match(value, /dileibole/);
  assert.doesNotMatch(value, /ditlhaku|^In /);
}
assert.match(sesotho['import-board-instruction-todoist'], /Manage data > Export as CSV/);
assert.doesNotMatch(sesotho['import-board-instruction-todoist'], /Export as a template/);
assert.match(sesotho['import-board-instruction-planner'], /Export as Excel.*Planner ya kgale: Export plan to Excel/);
assert.match(sesotho['import-board-instruction-jira'], /fields=[*]all&expand=names,schema/);
assert.match(sesotho['import-board-instruction-jira'], /ntle le fields.*feela di-ID/);
assert.match(sesotho['import-board-instruction-jira'], /nextPageToken.*maqephe ohle.*issues.*leqephe ka leng.*boto ya lona/);
assert.match(sesotho['import-board-instruction-excel'], /karete e le nngwe moleng ka mong/);
assert.match(sesotho['import-board-instruction-excel'], /Mohato o latelang.*kholomo/);
assert.match(sesotho['import-board-instruction-excel'], /Leqephe ka leng le nang le mola wa dihlooho le fetoha boto/);

// Historical review through key 1129: labels and visibility controls.
assert.equal(sesotho.labels, sesotho['cardLabelsPopup-title']);
assert.notEqual(sesotho.labels, 'Ditlhaku');
assert.equal(sesotho['linkCardToBoardPopup-title'], 'Hokela botong');
assert.doesNotMatch(sesotho['linkCardToBoardPopup-title'], /ena/);
assert.match(sesotho.linkCardToNewBoard, /Theha boto ho tswa kareteng ena/);
assert.equal(sesotho.public, 'Ya setjhaba');
assert.notEqual(sesotho.public, 'Phatlalatsa');
for (const [mode, visibility] of [['public', 'setjhaba'], ['private', 'poraefete']]) {
  assert.equal(sesotho[`custom-${mode}-desc`], `Tlhaloso e ikgethileng ya boto ya ${visibility}`);
  assert.equal(sesotho[`custom-${mode}-desc-placeholder`], `Siya e se na letho ho sebedisa tlhaloso ya kamehla ya boto ya ${visibility}`);
  assert.notEqual(sesotho[`custom-${mode}-desc`], sesotho[`custom-${mode}-desc-placeholder`]);
}
assert.equal(sesotho['no-starred-items'], 'Ha o eso tshwaye letho ka naledi.');

// Historical review through key 1279: link settings and email templates.
assert.match(sesotho['automatic-linked-url-schemes'], /etswa mahokelo a ka tobetsoang ka boiketsetso/);
assert.doesNotMatch(sesotho['automatic-linked-url-schemes'], /ho tobetswa ka boiketsetso/);
assert.match(sesotho['external-link-pattern'], /tsamaiso ya kantle ya ho sala ditaba morao/);
assert.match(sesotho['external-link-pattern-description'], /ka boiketsetso.*#1234.*efe kapa efe.*tse pedi.*se na letho.*tima/);
assert.doesNotMatch(sesotho['external-link-pattern-description'], /boitshepo/);
assert.match(sesotho['external-link-pattern-url'], /Thempleite.*[{]number[}]/);
assert.doesNotMatch(sesotho['external-link-pattern-url'], /Setshwantsho/);
assert.match(sesotho['attachment-transfer-limits-invalid-value'], /bo boholo ho 0/);
assert.doesNotMatch(sesotho['attachment-transfer-limits-invalid-value'], /motle/);
assert.equal(sesotho['email-templates-title'], 'Dithempleite tsa imeile');
for (const [part, noun] of [['subject', 'Sehlooho'], ['body', 'Mongolo']]) {
  assert.equal(sesotho[`email-templates-invite-${part}`], `${noun} ${part === 'subject' ? 'sa' : 'wa'} imeile ya memo`);
  assert.equal(sesotho[`email-templates-activity-${part}`], `${noun} ${part === 'subject' ? 'sa' : 'wa'} imeile ya tsebiso ya ketsahalo`);
  assert.notEqual(sesotho[`email-templates-invite-${part}`], sesotho[`email-templates-activity-${part}`]);
}

// Historical review through key 1416: technical names do not exempt prose.
for (const key of ['MongoDB_version', 'MongoDB_storage_engine', 'MongoDB_Oplog_enabled']) {
  assert.notEqual(sesotho[key], english[key]);
  assert.match(sesotho[key], /MongoDB/);
}
assert.match(sesotho.MongoDB_version, /tsamaellanang/);
assert.match(sesotho.MongoDB_storage_engine, /Enjene ya polokelo/);
assert.match(sesotho.MongoDB_Oplog_enabled, /Oplog.*e buletswe/);
assert.doesNotMatch(sesotho.MongoDB_Oplog_enabled, /enabled/);
assert.equal(sesotho['card-field-order'], 'Tatellano ya dikarolo tsa karete');
assert.doesNotMatch(sesotho['card-field-order'], /masimo/);
assert.equal(sesotho['card-field-order-move-up'], 'Fallisetsa hodimo');
assert.equal(sesotho['card-field-order-move-down'], 'Fallisetsa tlase');
assert.notEqual(sesotho['card-field-order-move-up'], sesotho['card-field-order-move-down']);

// Product names remain recognizable while storage prose is translated.
for (const key of ["s3-file-id", "s3-minio-storage-description", "s3-disabled", "mongodb-gridfs-storage", "s3-access-key", "s3-bucket", "s3-bucket-description", "s3-connection-failed", "s3-connection-success", "s3-enabled", "s3-endpoint", "s3-endpoint-description", "s3-minio-storage", "s3-port", "s3-port-description", "s3-region", "s3-secret-key", "s3-secret-key-required", "s3-settings-saved", "s3-ssl-enabled", "s3-attachments", "s3-size"]) {
  assert.notEqual(sesotho[key], english[key], key);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.match(sesotho['s3-disabled'], /e kwetswe/);
assert.match(sesotho['s3-enabled'], /e buletswe/);
assert.match(sesotho['s3-connection-failed'], /e hlolehile/);
assert.match(sesotho['s3-connection-success'], /e atlehile/);
assert.match(sesotho['s3-secret-key-required'], /lekunutu.*se a hlokahala/);
assert.notEqual(sesotho['s3-access-key'], sesotho['s3-secret-key']);
for (const provider of ['AWS S3', 'MinIO', 'Cloudflare R2', 'Backblaze B2', 'Wasabi', 'DigitalOcean Spaces']) {
  assert.ok(sesotho['s3-minio-storage-description'].includes(provider));
}
for (const host of ['s3.amazonaws.com', 'minio.example.com']) assert.ok(sesotho['s3-endpoint-description'].includes(host));

// Historical review through key 1589: rule states and event conditions.
assert.equal(sesotho['r-rule-enabled'], 'E buletswe');
assert.equal(sesotho['r-rule-disabled'], 'E kwetswe');
assert.notEqual(sesotho['r-rule-enabled'], sesotho['r-rule-disabled']);
assert.equal(sesotho['r-toggle-rule-enabled'], 'Bulela kapa kwala molao ona');
assert.equal(sesotho['r-format-auto'], 'Lemoha ka boiketsetso');
assert.doesNotMatch(sesotho['r-format-auto'], /Ithute/);
assert.equal(sesotho['r-sort-by'], 'ka');
assert.equal(sesotho['r-is'], 'e');
for (const key of ['r-when-a-assignee', 'r-when-the-assignee']) assert.match(sesotho[key], /^Ha motho ya abetsweng/);
for (const kind of ['due', 'start', 'end', 'received']) {
  assert.match(sesotho[`r-when-a-${kind}-date-changed`], /^Ha letsatsi.*le behwa kapa le fetolwa$/);
}
assert.equal(sesotho['r-remove-all-labels'], 'Tlosa dileibole tsohle kareteng');
assert.doesNotMatch(sesotho['r-remove-all-labels'], /dipheo/);

// Short function words are translations, not technical-name exemptions.
for (const key of ["r-to", "r-of", "r-d-send-email-to", "r-by", "dueCardsViewChange-choice-me", "of", "blockly-ANNOUNCE_MOVE_OF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_SET_INDEX_INPUT_TO", "blockly-LOGIC_OPERATION_OR", "blockly-PROCEDURES_DEFNORETURN_TITLE", "blockly-CONTROLS_FOREACH_INPUT_DO", "blockly-CONTROLS_FOR_INPUT_DO", "blockly-CONTROLS_IF_IF_TITLE_IF", "blockly-CONTROLS_IF_MSG_THEN", "blockly-CONTROLS_WHILEUNTIL_INPUT_DO", "blockly-PROCEDURES_DEFRETURN_TITLE"]) {
  assert.notEqual(sesotho[key], english[key], key);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]), key);
}
assert.equal(sesotho['blockly-ANNOUNCE_MOVE_OF'], '%1 ho tse %2');
assert.equal(sesotho['blockly-LOGIC_OPERATION_OR'], 'kapa');
assert.equal(sesotho['blockly-CONTROLS_IF_MSG_IF'], 'ha');
assert.equal(sesotho['blockly-CONTROLS_REPEAT_INPUT_DO'], 'etsa');
assert.equal(sesotho['dueCardsViewChange-choice-me'], 'Nna');
assert.equal(sesotho['r-of'], sesotho.of);
assert.notEqual(sesotho['blockly-CONTROLS_IF_MSG_IF'], sesotho['blockly-CONTROLS_REPEAT_INPUT_DO']);

// Historical review through key 1844: setting scope and configuration precedence.
assert.match(sesotho['r-trigger-vars-hint'], /^Dikarolo tsa/);
assert.doesNotMatch(sesotho['r-trigger-vars-hint'], /Masimo/);
for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
  assert.ok(sesotho['r-trigger-vars-hint'].includes(token));
}
assert.match(sesotho['oauth-providers-hint'], /OAUTH_[*]_ENABLED.*bo behilweng mona bo nka sebaka/);
assert.match(sesotho['oauth-providers-hint'], /Sephiri se bolokwa ho seva.*ha se bontshwe le ka mohla/);
assert.doesNotMatch(sesotho['oauth-providers-hint'], /seforong|environment variable/);
for (const [scope, term] of [['public', 'setjhaba'], ['private', 'poraefete']]) {
  assert.equal(sesotho[`default-on-${scope}-board`], `Ya kamehla botong ya ${term}`);
  assert.equal(sesotho[`show-on-${scope}-board`], `Bontsha botong ya ${term}`);
  assert.doesNotMatch(sesotho[`show-on-${scope}-board`], /boteng/);
}
assert.match(sesotho['toggle-header-icons-collapsed'], /ditsebiso mohaleng\/komporong/);

// Historical review through key 1989: eligibility and numeric constraints.
assert.match(sesotho['shared-templates-info'], /feela basebedisi.*Dithempleite e nang le dikahare/);
assert.doesNotMatch(sesotho['shared-templates-info'], /e seng feela/);
assert.equal(sesotho['my-attachments'], 'Diphuthelwana tsa ka');
for (const state of ['on', 'off']) {
  assert.match(sesotho[`board-table-group-by-swimlane-${state}`], /ka tsela/);
  assert.doesNotMatch(sesotho[`board-table-group-by-swimlane-${state}`], /ka mola/);
}
assert.match(sesotho['board-table-group-by-swimlane-on'], /di hlophisitswe.*Tobetsa.*lenane le bataletseng/);
assert.match(sesotho['board-table-group-by-swimlane-off'], /lenane le bataletseng.*Tobetsa.*ka tsela/);
assert.match(sesotho['operator-limit-invalid'], /palo e felletseng e kgolo ho 0/);
assert.doesNotMatch(sesotho['operator-limit-invalid'], /e ntle/);
assert.deepEqual(tokens(sesotho['operator-limit-invalid']), ['%s']);

// Historical review through key 2134: numeric constraints retain their signs.
assert.match(sesotho['globalSearch-instructions-operator-limit'], /palo e felletseng e kgolo ho 0/);
assert.match(sesotho['globalSearch-instructions-notes-3-2'], /palo e felletseng e kgolo ho 0 kapa e ka tlase ho 0/);
for (const key of ['globalSearch-instructions-operator-limit', 'globalSearch-instructions-notes-3-2']) {
  assert.doesNotMatch(sesotho[key], /e ntle|e mpe/);
  assert.deepEqual(tokens(sesotho[key]), tokens(english[key]));
}
assert.match(sesotho['background-too-big'], /Boholo bo dumelletsweng.*[{][{]size[}][}]/);
assert.deepEqual(tokens(sesotho['background-too-big']), tokens(english['background-too-big']));

// Historical review through key 2349: report metrics and template source.
assert.equal(sesotho['recovery-severity'], 'Boima ba bothata');
assert.notEqual(sesotho['recovery-severity'], 'Bohloko');
assert.equal(sesotho.copyChecklistFromTemplate, sesotho['copyChecklistFromTemplatePopup-title']);
assert.match(sesotho.copyChecklistFromTemplate, /ho tswa thempleiteng/);
assert.doesNotMatch(sesotho.copyChecklistFromTemplate, /Mohlala/);
assert.match(sesotho['translation-number'], /Palo ya mela.*phetolelo/);
assert.doesNotMatch(sesotho['translation-number'], /meretlwa/);
assert.match(sesotho['board-status-remaining-time-total'], /letsatsing la ho qetela/);
assert.doesNotMatch(sesotho['board-status-remaining-time-total'], /ho fela/);

// Historical review through key 2479: reset and recurrence are distinct actions.
assert.equal(sesotho['checklist-reset-interval'], sesotho['checklistResetIntervalPopup-title']);
assert.equal(sesotho['card-recurrence-interval'], sesotho['cardRecurrenceIntervalPopup-title']);
assert.notEqual(sesotho['checklist-reset-interval'], sesotho['card-recurrence-interval']);
assert.match(sesotho['checklist-reset-interval'], /seta botjha/);
assert.match(sesotho['card-recurrence-interval'], /ipheta ha karete/);
assert.match(sesotho['checklist-reset-interval-none'], /E kwetswe.*ha e setwe botjha/);
assert.match(sesotho['card-recurrence-interval-none'], /E kwetswe.*ha e iphete/);
for (const key of ['checklist-reset-interval', 'card-recurrence-interval']) assert.doesNotMatch(sesotho[key], /hoesa/);
assert.equal(sesotho['admin-people-last-active'], 'E qetetse ho sebetsa');
assert.equal(sesotho['cron-error-severity'], sesotho['recovery-severity']);
assert.notEqual(sesotho['cron-error-severity'], 'Bohloko');

// Historical review through key 2599: account effects and backup boundaries.
assert.equal(sesotho['anonymize-account'], sesotho['userAnonymizePopup-title']);
const accountWarning = sesotho['anonymize-account-confirm-popup'];
for (const phrase of ['lebitso la mosebedisi', 'lebitso le felletseng', 'aterese ya imeile', 'ka ho sa feleng', 'se tlosa setshwantsho', 'se thibela ho kena', 'di boloka nalane', 'e ke ke ya etsollwa']) {
  assert.ok(accountWarning.includes(phrase), phrase);
}
assert.notEqual(accountWarning, sesotho['anonymize-export-users-description']);
assert.doesNotMatch(accountWarning, /ho ntsha boto|Ka kamehla e timme/);
assert.equal(sesotho['backup-scope-instance'], 'Tsamaiso ena yohle ya WeKan');
assert.match(sesotho['backup-scope-description'], /ha e na diakhaonto tsa basebedisi kapa ditlhophiso tsa tsamaiso ena ya WeKan/);
assert.match(sesotho['backup-scope-description'], /ho ngola feela dibotong tseo Mokgatlo oo o leng monga tsona/);
assert.doesNotMatch(sesotho['backup-scope-description'], /Mohlala|mohlala/);

// Historical review through key 2839: archive state is not saved state.
assert.match(sesotho['s3-endpoint-menu-path'], /sebaka sa kgokelo sa sebaka se kgethilweng/);
assert.doesNotMatch(sesotho['s3-endpoint-menu-path'], /endpoint ya region/);
assert.equal(sesotho['s3-region-description'], 'Sebaka sa AWS S3 (mohlala, us-east-1)');
for (const key of ['restore-all-archived-migration', 'restore-all-archived-migration-description', 'run-restore-all-archived-migration-confirm']) {
  assert.match(sesotho[key], /tse isitsweng polokelong/);
  assert.doesNotMatch(sesotho[key], /tse bolokilweng/);
}
assert.match(sesotho['run-restore-lost-cards-migration-confirm'], /feela dintho tse sa iswang polokelong/);
assert.match(sesotho['run-restore-all-archived-migration-confirm'], /ha se kgutlisetswe habonolo/);
assert.match(sesotho['step-fix-orphaned-cards'], /lehokelo le nepahetseng la lenane kapa tsela/);
assert.doesNotMatch(sesotho['step-fix-orphaned-cards'], /monga/);

// Historical review through key 2999: groups, data fields and severity.
assert.equal(sesotho['event-severity'], sesotho['recovery-severity']);
assert.notEqual(sesotho['event-severity'], 'Bohloko');
assert.match(sesotho['api-endpoints'], /kgokelo.*API/);
assert.match(sesotho['sum-of-number-fields'], /dikarolo tse ikgethang tsa dinomoro.*tshwailweng/);
assert.doesNotMatch(sesotho['sum-of-number-fields'], /masimo/);
assert.match(sesotho['date-range-of-fields'], /pakeng tsa matsatsi.*tshwailweng/);
assert.match(sesotho['wip-limit-groups'], /Dihlopha.*WIP/);
assert.match(sesotho['wip-limit-group-add'], /sehlopha.*WIP/);
assert.doesNotMatch(sesotho['wip-limit-group-add'], /Bulela/);
assert.match(sesotho['wip-limit-group-name-placeholder'], /sehlopha.*boikhethelo/);
assert.equal(sesotho['wip-limit-group-select-swimlane'], 'Kgetha tsela');
assert.doesNotMatch(sesotho['wip-limit-group-select-swimlane'], /boto/);
assert.equal(sesotho['wip-limit-group-apply-swimlane'], 'Sebedisa tseleng');

// Historical review through key 3169: restore report caveats lost to shorthand.
assert.match(sesotho['list-sync-description'], /metsotso e meng le e meng e 15/);
assert.ok(sesotho['list-sync-description'].includes(sesotho['list-sync-now']));
assert.equal(sesotho['list-sync-credential'], 'Bopaki ba ho kena');
assert.doesNotMatch(sesotho['list-sync-credential'], /Tumello/);
assert.match(sesotho['list-sync-credential-status-unset'], /ha bo eso/);
assert.match(sesotho['list-sync-now-error'], /ho hlolehile: %s/);
assert.match(sesotho['flow-note-agingWip'], /bonyane dinako tse hlano/);
assert.match(sesotho['flow-note-agingWip'], /nalane.*siyo.*ha e tsejwe/);
assert.match(sesotho['flow-note-blockerAnalysis'], /Dikarete tse hlakotsweng.*dikopi tsa nalane/);
assert.match(sesotho['flow-note-blockerAnalysis'], /nako e le nngwe.*ka thoko/);
for (const phrase of ['2,000', 'UTC', 'ho seng letho le phethilweng', 'mohatleng o ka hodimo', 'mohatleng o ka tlase', 'ha se tiisetso', '3,650', 'ha ho kgakanyo']) assert.ok(sesotho['flow-note-monteCarlo'].includes(phrase), phrase);
for (const key of ['flow-note-processBehavior', 'flow-note-sizeCycleTime']) {
  assert.match(sesotho[key], /ho theha haeba/);
  assert.match(sesotho[key], /ho isa polokelong haeba/);
}
assert.match(sesotho['flow-note-processBehavior'], /bonyane diphetho tse pedi tse nepahetseng/);
assert.match(sesotho['flow-note-sizeCycleTime'], /matsatsi a sa nepahalang di a tlohelwa/);
assert.match(sesotho['time-adjustment-note'], /ha se dinako tsa mosebetsi ka bonngwe/);
assert.match(sesotho['time-adjustment-note'], /ka tlase ho lefela ke ditokiso/);
assert.match(sesotho['time-adjustment-note'], /sa tlalehwang e ke ke ya abelwa motho/);
assert.match(sesotho['move-reason'], /boikhethelo/);
assert.match(sesotho['flow-error'], /Hlahloba boleng mme o leke hape/);
assert.notEqual(sesotho['flow-size'], sesotho['flow-mean']);
assert.doesNotMatch(sesotho['flow-size-source'], /Masimo/);

// Historical review through key 3729: angle units and movement instructions.
assert.match(sesotho['blockly-MATH_ATAN2_TOOLTIP'], /thanjente e kgutlisetsang morao.*[(]X, Y[)].*dikhato.*-180.*180/);
assert.doesNotMatch(sesotho['blockly-MATH_ATAN2_TOOLTIP'], /arctangent|dikereiti/);
for (const suffix of ['COS', 'SIN', 'TAN']) {
  const text = sesotho[`blockly-MATH_TRIG_TOOLTIP_${suffix}`];
  assert.match(text, /ka dikhato [(]eseng diradiane[)]/);
  assert.doesNotMatch(text, /dikereiti/);
}
assert.match(sesotho['blockly-SHORTCUTS_MOVE_UP'], /Suthisetsa hodimo/);
assert.match(sesotho['blockly-SHORTCUTS_MOVE_DOWN'], /Suthisetsa tlase/);
assert.notEqual(sesotho['blockly-SHORTCUTS_MOVE_UP'], sesotho['blockly-SHORTCUTS_MOVE_DOWN']);
// Keep the already correct endpoints, negation and destructive list operations.
assert.match(sesotho['blockly-LOGIC_NEGATE_TOOLTIP'], /nnete haeba kenyo e se nnete.*ha se nnete haeba kenyo e le nnete/);
assert.match(sesotho['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST'], /Tlosa mme o kgutlise.*ya pele/);
assert.match(sesotho['blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST'], /^Kgutlisa.*ya pele/);

// Historical review through key 4069: Scrum estimates and recovery boundaries.
assert.equal(sesotho['scrum-estimate'], 'Tekanyo');
assert.notEqual(sesotho['scrum-estimate'], 'Boholo');
assert.match(sesotho['scrum-rollover-progress'], /potoloho ya Scrum.*__done__.*__total__/);
assert.doesNotMatch(sesotho['scrum-rollover-progress'], /sprint/);
assert.match(sesotho['scrum-report-help'], /sa tsejweng.*ka thoko.*ha se ditekanyo tsa lefela/);
assert.match(sesotho['scrum-confirm-cancel'], /di dula e le karolo ya yona ho fihlela di abelwa hape/);
assert.match(sesotho['sync-conflict-hint'], /Ha ho letho le romelwang tsamaisong ya mohlodi/);
assert.match(sesotho['sync-conflict-review-complete'], /Lenane lohle ha le a amahanngwa/);
assert.match(sesotho['email-recovery-confirm-cancel'], /di ke ke tsa kgutlisetswa.*kamora kopo ena e tla bolokwa/);
assert.match(sesotho['activity-recovery-cancel-confirm'], /Sena se ke ke sa tswellwa hape.*ha di kgutliswe/);

// Historical review through key 4269: email limits, labels and sender direction.
assert.match(sesotho['email-to-card-webhook'], /Mailgun, SendGrid, Postmark.*sefetisi sa melaetsa ya MIME e sa fetolwang/);
assert.doesNotMatch(sesotho['email-to-card-webhook'], /MIME relay/);
assert.match(sesotho['email-to-card-part-description'], /Dikahare tsa imeile/);
assert.match(sesotho['email-to-card-off-member-off'], /^O timme/);
assert.match(sesotho['feature-views-email-desc'], /dileibole ke dileibole/);
assert.doesNotMatch(sesotho['feature-views-email-desc'], /ditlhaku/);
assert.match(sesotho['email-view-not-receiving'], /Ditlhophiso tsa ditsebiso/);
assert.match(sesotho['email-view-too-many-recipients'], /ba sa feteng 20/);
assert.doesNotMatch(sesotho['email-view-too-many-recipients'], /20 feela/);
assert.match(sesotho['email-bounces-category-hard-desc'], /domeine/);
assert.match(sesotho['email-bounces-ses-description'], /aterese eo WeKan e romelang ho tloha ho eona/);
assert.match(sesotho['email-bounces-ses-description'], /Bounce le Complaint.*SNS.*HTTPS/);
