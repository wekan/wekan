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
