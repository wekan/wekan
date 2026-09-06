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
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'st',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 24,
  'the first forty-two Southern Sotho batches stay resolved');

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

console.log('southernSothoTranslationProgress: first forty-two batches passed');
