'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root,
  'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'nd'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 117);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const ndebele = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/nd.i18n.json'), 'utf8'));
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(ndebele)) {
  assert.deepEqual(tokens(value), tokens(english[key]), key);
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(ndebele.accept, 'Yamukela');
assert.deepEqual(tokens(ndebele['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(ndebele['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(ndebele['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.deepEqual(tokens(ndebele['act-setCustomField']),
  ['__board__', '__card__', '__customFieldValue__', '__customField__',
    '__list__', '__swimlane__']);
assert.match(ndebele['act-createBoard'], /ibhodi/);
assert.match(ndebele['act-createCard'], /ikhadi/);
assert.match(ndebele['act-createList'], /uluhlu/);
assert.match(ndebele['act-createSwimlane'], /umzila/);
assert.match(ndebele['act-addAttachment'], /okunamathiselweyo/);
assert.match(ndebele['act-addChecklist'], /uluhlu lokuhlola/);
assert.deepEqual(tokens(ndebele['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(ndebele['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(ndebele['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.equal(ndebele['allboards.workspaces'], 'Izindawo zokusebenza');
assert.match(ndebele['allboards.edit-workspace-icon'], /markdown/);
assert.deepEqual(tokens(ndebele['activity-dueDate']), ['%s', '%s']);
assert.match(ndebele['set-list-width-value'], /amaphikseli/);
assert.match(ndebele['list-width-error-message'], /270/);
assert.match(ndebele['set-swimlane-height-value'], /amaphikseli/);
assert.equal(ndebele['add-checklist'], 'Engeza uluhlu lokuhlola');
assert.deepEqual(tokens(ndebele['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(ndebele['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(ndebele['avatar-too-big']), ['__size__']);
assert.match(ndebele['board-background-image-url'], /URL/);
assert.deepEqual(tokens(ndebele['board-nb-stars']), ['%s']);
assert.deepEqual(tags(ndebele['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(ndebele['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  ndebele['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(ndebele['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(ndebele['card-comments-title']), ['%s']);
assert.equal(ndebele['card-edit-custom-fields'],
  'Hlela izinkambu ezenziwe ngokwezifiso');
assert.match(ndebele['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(ndebele['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(ndebele['importDependenciesPopup-title'], 'Ngenisa ukuncika');
assert.equal(ndebele['addBoardOrgPopup-title'], 'Engeza inhlangano');
assert.equal(ndebele['addBoardTeamPopup-title'], 'Engeza iqembu');
assert.match(ndebele.casSignIn, /CAS/);
assert.equal(ndebele['change-permissions'], 'Tshintsha izimvumo');
assert.match(ndebele['font-preview-text'], /0123456789/);
assert.equal(ndebele['font-size-largest'], 'Okukhulu kulakho konke');
assert.equal(ndebele['changeLanguagePopup-title'], 'Tshintsha ulimi');
assert.match(ndebele['card-aging-days'], /3/);
assert.equal(ndebele['color-black'], 'mnyama');
assert.equal(ndebele['color-green'], 'luhlaza');
assert.equal(ndebele['color-red'], 'bomvu');
assert.equal(ndebele['color-sky'], 'sibhakabhaka');
assert.equal(ndebele['color-white'], 'mhlophe');
assert.equal(ndebele['color-yellow'], 'phuzi');
assert.deepEqual(JSON.parse(ndebele['copyManyCardsPopup-format']).map(card =>
  Object.keys(card).sort()), [
  ['description', 'title'],
  ['description', 'title'],
  ['description', 'title'],
]);
assert.match(ndebele['custom-field-dropdown-options-placeholder'], /Enter/);
assert.match(ndebele['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(ndebele['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(ndebele['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(ndebele['email-resetPassword-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(ndebele['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(ndebele['error-json-malformed'], /JSON/);
assert.match(ndebele['error-csv-schema'], /CSV.*TSV/);
assert.match(ndebele['export-card-pdf'], /PDF/);
assert.match(ndebele['export-card-excel'], /Excel/);
assert.match(ndebele['export-card-excel-no-disk-space'], /Excel.*diski/);
assert.equal(ndebele['filter-due-tomorrow'], 'Kuphela kusasa');
for (const literal of ['==', '!=', '<=', '>=', '&&', '||', '/Tes.*/i']) {
  assert.match(ndebele['advanced-filter-description'],
    new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.deepEqual(tokens(ndebele['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(ndebele['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(ndebele['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search/);
assert.match(ndebele['import-trello-json-file-hint'], /API/);
assert.match(ndebele['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(ndebele['trello-api-import-desc'], /Trello API/);
assert.match(ndebele['invalid-year'], /2026/);
assert.deepEqual(tokens(ndebele['label-default']), ['%s']);
assert.deepEqual(tokens(ndebele['leave-board-pop']), ['__boardTitle__']);
assert.match(ndebele['listImportCardPopup-title'], /Trello/);
assert.match(ndebele['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(ndebele['my-boards'], 'Amabhodi ami');
assert.deepEqual(tokens(ndebele['page-maybe-private']), ['%s']);
assert.deepEqual(tags(ndebele['page-maybe-private']),
  ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(ndebele['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(ndebele['sandstorm-remove-member-warning'], /Sandstorm/);
assert.match(ndebele['sandstorm-remove-member-warning'], /WeKan/);
assert.match(ndebele['search-example'], /Enter/);
assert.match(ndebele['setWipLimitPopup-title'], /WIP/);
assert.equal(ndebele['starred-boards'], 'Amabhodi afakwe inkanyezi');
assert.equal(ndebele['subscribe'], 'Bhalisa');
assert.equal(ndebele.team, 'Iqembu');
assert.equal(ndebele.upload, 'Layisha');
assert.match(ndebele['custom-help-link-url'], /URL/);
assert.match(ndebele['automatic-linked-url-schemes'], /URL/);
assert.equal(ndebele['welcome-list1'], 'Okuyisisekelo');
assert.match(ndebele['wipLimitErrorPopup-title'], /WIP/);
assert.match(ndebele['attachment-transfer-limits-title'], /API/);
assert.equal(ndebele['attachment-limits'], 'Imikhawulo');
assert.equal(ndebele.registration, 'Ukubhalisa');
assert.match(ndebele['smtp-host'], /SMTP/);
assert.match(ndebele['smtp-tls'], /TLS/);
assert.deepEqual(tokens(ndebele['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.equal(ndebele.Database, 'Isizindalwazi');
assert.match(ndebele.Database_type, /sizindalwazi/);
assert.match(ndebele.FerretDB_version, /FerretDB/);
assert.match(ndebele.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(ndebele.DDP_transport, /DDP_TRANSPORT/);
assert.equal(ndebele.days, 'izinsuku');
assert.equal(ndebele.visibility, 'Ukubonakala');
assert.match(ndebele['org-domains-description'], /MULTITENANCY=true/);
assert.equal(ndebele['card-received'], 'Kwamukelwe');
assert.equal(ndebele['assigned-by'], 'Kwabelwe ngu');
assert.equal(ndebele['delete-board'], 'Susa ibhodi');
assert.deepEqual(tokens(ndebele['default-subtasks-board']), ['__board__']);
assert.equal(ndebele['card-settings'], 'Izilungiselelo zekhadi');
assert.match(ndebele['checklist-count-on-minicard'], /0\/0/);
assert.deepEqual(tokens(ndebele['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(ndebele['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.equal(ndebele['r-rule'], 'Umthetho');
assert.equal(ndebele['r-add-trigger'], 'Engeza isiqalisi');
assert.deepEqual(tokens(ndebele['r-w-every-day-at']), ['__time__']);
assert.match(ndebele['r-export-json'], /JSON/);
assert.match(ndebele['r-import-csv'], /CSV/);
assert.deepEqual(tokens(ndebele['r-import-done']), ['__count__']);
assert.match(ndebele['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(ndebele['r-import-unmapped']), ['__count__']);
assert.match(ndebele['r-schedule-weekday'], /Mvu.*Hla/);
assert.match(ndebele['r-for-n-days'], /N/);
assert.equal(ndebele['r-trigger'], 'Isiqalisi');
assert.equal(ndebele['r-action'], 'Isenzo');
assert.equal(ndebele['r-the-board'], 'ibhodi');
assert.equal(ndebele['r-list'], 'uluhlu');
assert.equal(ndebele['r-label'], 'ilebula');
assert.equal(ndebele['r-member'], 'ilunga');
assert.equal(ndebele['r-checklist'], 'uluhlu lokuhlola');
assert.equal(ndebele['r-send-email'], 'Thumela i-imeyili');
assert.equal(ndebele['r-create-card'], 'Dala ikhadi elitsha');
assert.equal(ndebele['r-in-swimlane'], 'emzileni');
assert.match(ndebele['r-items-list'], /into1,into2,into3/);
assert.equal(ndebele['authentication-method'], 'Indlela yokuqinisekisa');
assert.match(ndebele['custom-head-meta-tags'], /HTML/);
assert.match(ndebele['custom-head-manifest-content'], /JSON/);
assert.match(ndebele['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.equal(ndebele['board-member-list'], 'Uluhlu lwamalunga ebhodi');
assert.deepEqual(tags(ndebele['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(ndebele['add-custom-html-before-body-end']), ['</body>']);
assert.match(ndebele['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(ndebele['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(ndebele['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(ndebele['submit-on-enter'], /Enter/);
assert.match(ndebele['submit-on-enter-description'],
  /Enter.*Shift\+Enter.*Ctrl\/Cmd\+Enter/);
assert.equal(ndebele['show-on-card'], 'Bonisa ekhadini');
assert.equal(ndebele.roles, 'Izindima');
assert.match(ndebele['roles-info'], /Phaneli yomlawuli/);
assert.equal(ndebele.monday, 'UMvulo');
assert.equal(ndebele.sunday, 'ISonto');
assert.equal(ndebele.owner, 'Umnikazi');
assert.equal(ndebele.domains, 'Izizinda');
assert.match(ndebele['invalid-domain'], /example\.com.*@/);
assert.equal(ndebele['myCardsViewChange-choice-table'], 'Ithebula');
assert.match(ndebele['dueCardsViewChange-choice-all-description'],
  /\*Lokuphela\*/);
assert.match(ndebele['globalSearchViewChange-choice-all-description'],
  /\*Amakhadi ami\*/);
assert.deepEqual(tokens(ndebele['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(ndebele['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(ndebele['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(ndebele['operator-board'], 'ibhodi');
assert.equal(ndebele['operator-swimlane'], 'umzila');
assert.equal(ndebele['operator-list'], 'uluhlu');
assert.equal(ndebele['operator-customfield'], 'inkambu-ngokwezifiso');
assert.equal(ndebele['predicate-quarter'], 'ikota');
assert.equal(ndebele['predicate-assignee'], 'owabelweyo');
assert.deepEqual(tokens(ndebele['operator-number-expected']),
  ['__operator__', '__value__']);
assert.equal(ndebele['next-page'], 'Ikhasi elilandelayo');
assert.deepEqual(tokens(ndebele['globalSearch-instructions-operator-has']), [
  '__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
  '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
  '__predicate_end__', '__predicate_member__', '__predicate_start__',
]);
assert.deepEqual(tokens(ndebele['globalSearch-instructions-notes-3-2']),
  ['__predicate_month__', '__predicate_quarter__', '__predicate_week__',
    '__predicate_year__']);
assert.equal(ndebele['link-to-search'], 'Isixhumanisi salokhu kusesha');
assert.equal(ndebele.number, 'Inombolo');
assert.match(ndebele['sort-boards-title-asc'], /A → Z/);
assert.equal(ndebele['card-dependencies'], 'Ukuncika');
assert.match(ndebele['import-dependencies-file'], /JSON.*SVG/);
assert.deepEqual(tokens(ndebele['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(ndebele['background-too-big']), ['{{size}}']);
assert.equal(ndebele.location, 'Indawo');
assert.match(ndebele['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan.*sudo docker logs wekan-app/s);
assert.deepEqual(tokens(ndebele['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(ndebele['custom-field-stringtemplate-separator'],
  /&#32;.*&nbsp;/);
assert.equal(ndebele.reports, 'Imibiko');
assert.match(ndebele.cpuReportTitle, /CPU/);
assert.match(ndebele['office-report-desc'], /IPv4.*IPv6/);
assert.match(ndebele['api-report-desc'], /REST API/);
assert.match(ndebele['api-no-calls'], /WITH_API=true/);
assert.match(ndebele['recovery-report-desc'], /MongoDB/);
assert.equal(ndebele['recovery-db'], 'Isizindalwazi');
assert.equal(ndebele['copy-swimlane'], 'Kopela umzila');
assert.match(ndebele['carbon-copy'], /Cc:/);
assert.equal(ndebele['cardDetailsPopup-title'], 'Imininingwane yekhadi');
assert.equal(ndebele['add-teams'], 'Engeza amaqembu');
assert.match(ndebele.Node_heap_total_heap_size, /Node.*heap/);
assert.match(ndebele.Node_memory_usage_rss, /Node/);
assert.match(ndebele['custom-legal-notice-link-url'], /URL/);
assert.equal(ndebele.copyChecklist, 'Kopela uluhlu lokuhlola');
assert.match(ndebele['attachment-move-storage-gridfs'], /GridFS/);
assert.match(ndebele['attachment-move-storage-s3'], /S3/);
assert.match(ndebele['move-all-attachments-of-board-to-gridfs'], /GridFS/);
assert.equal(ndebele['move-scope-avatars'], 'Izithombe zabasebenzisi');
assert.match(ndebele['gridfs-file-id'], /GridFS/);
assert.match(ndebele['mongodb-compact-description'], /MongoDB GridFS.*Compact/);
assert.match(ndebele['mongodb-compact-warning'], /oplog.*Meteor/);
assert.equal(ndebele.action, 'Isenzo');
assert.equal(ndebele['board-status'], 'Isimo sebhodi');
assert.match(ndebele['preview-pdf-not-supported'], /PDF/);
assert.deepEqual(tokens(ndebele['drag-board-to-workspace']), ['__workspaces__']);
assert.match(ndebele['show-week-of-year'], /ISO 8601/);
assert.match(ndebele['import-board-zip'], /.zip.*JSON/);
assert.equal(ndebele.support, 'Ukusekela');
assert.equal(ndebele.accessibility, 'Ukufinyeleleka');
assert.match(ndebele['accounts-lockout-settings'], /ekuhlaselweni ngamandla/);
assert.match(ndebele['accounts-lockout-period'], /imizuzwana/);
assert.equal(ndebele['admin-people-filter-all'], 'Bonke abasebenzisi');
assert.equal(ndebele['accounts-lockout-unlock-all'], 'Vula bonke');
assert.equal(ndebele['cron-jobs'], 'Imisebenzi ehleliweyo');
assert.match(ndebele['attachments-path-description'], /okunamathiselweyo/);
assert.match(ndebele['avatars-path-description'], /zithombe zabasebenzisi/);
assert.equal(ndebele['cron-error-message'], 'Umlayezo wephutha');
assert.match(ndebele['s3-force-path-style-description'], /MinIO.*S3.*AWS/);
assert.match(ndebele['database-migration-description'],
  /MongoDB.*FerretDB v1.*SQLite.*WEKAN_FERRETDB_URL.*WEKAN_MONGODB_URL.*MONGO_URL/s);
assert.deepEqual(tokens(ndebele['database-migration-confirm']), ['__db__']);
assert.match(ndebele['sandstorm-migration-description'],
  /WeKan.*Sandstorm.*MongoDB 3.*FerretDB v1.*SQLite/s);
assert.match(ndebele['cards-loading-description'],
  /WeKan.*CARDS_LOADING.*CARDS_LOADING_LAZY_THRESHOLD/);
assert.deepEqual(tags(ndebele['render-links-as-plain-text-description']),
  ['<a href>']);
assert.match(ndebele['always-show-code-as-text-description'],
  /HTML.*<!-- -->.*JavaScript/s);
assert.match(ndebele['disable-import-avatars-description'],
  /WeKan JSON.*Trello.*LDAP.*OIDC\/OAuth2/s);
assert.match(ndebele['backup-description'],
  /backup\/YYYY\/MM\/DD\/HH_MM_SS\/backup\.zip.*S3\/MinIO.*Azure.*GCS/s);
assert.match(ndebele['backup-time'], /HH:MM/);
assert.match(ndebele['backup-day-of-month'], /1-28/);
assert.match(ndebele['gcs-permissions-note'],
  /WeKan.*Google Cloud Console.*client_email.*JSON.*Storage Object Admin/s);
assert.match(ndebele['s3-endpoint-menu-path'],
  /AWS.*S3.*Endpoint URL.*MinIO.*Cloudflare R2.*Backblaze B2.*Wasabi.*DigitalOcean Spaces/s);
assert.match(ndebele['gcs-credentials-menu-path'], /Google Cloud Console.*JSON/s);
assert.match(ndebele['attachment-move-storage-azure'], /Azure Blob Storage/);
assert.match(ndebele['attachment-move-storage-gcs'], /Google Cloud Storage/);
assert.match(ndebele['gridfs-enabled-description'], /MongoDB GridFS/);
assert.match(ndebele['gridfs-move-collectionfs-note'], /CollectionFS/);
assert.match(ndebele['s3-enabled-description'], /AWS S3.*MinIO/);
assert.match(ndebele['s3-region-description'], /us-east-1/);
assert.match(ndebele['s3-ssl-enabled-description'], /SSL\/TLS.*S3/);
assert.equal(ndebele['board-migration'], 'Ukuthutha ibhodi');
assert.equal(ndebele['card-show-lists-on-minicard'],
  'Bonisa izinhlu ekhadini elincane');
assert.match(ndebele['restore-lost-cards-migration-description'],
  /swimlaneId.*listId/);
assert.match(ndebele['restore-all-archived-migration-description'],
  /swimlaneId.*listId/);
assert.match(ndebele['fix-avatar-urls-migration-description'], /URL/);
assert.match(ndebele['fix-all-file-urls-migration-description'], /URL/);
assert.equal(ndebele['step-validate-migration'], 'Qinisekisa ukuthutha');
assert.match(ndebele['step-fix-attachment-urls'], /URL/);
assert.match(ndebele['step-fix-file-urls'], /URL/);
assert.match(ndebele['step-fix-missing-ids'], /ID/);
assert.match(ndebele['cpu-cores'], /CPU/);
assert.match(ndebele['cpu-usage'], /CPU/);
assert.match(ndebele['gridfs-attachments'], /GridFS/);
assert.match(ndebele['gridfs-size'], /GridFS/);

console.log('Northern Ndebele translation progress checks passed.');
