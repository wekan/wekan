const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'mai'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 167);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const maithili = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/mai.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(maithili)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(maithili.accept, 'स्वीकार करू');
assert.deepEqual(tokens(maithili['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(maithili['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(maithili['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(maithili['board-members-same-org-only'], /संगठन/);
assert.match(maithili['board-members-same-team-only'], /टीम/);
assert.deepEqual(tokens(maithili['due-date-changed-times']), ['%s']);
assert.match(maithili['act-addAttachment'], /संलग्नक/);
assert.match(maithili['act-addChecklist'], /जाँचसूची/);
assert.match(maithili['act-addComment'], /टिप्पणी/);
assert.match(maithili['act-createCustomField'], /अनुकूलित क्षेत्र/);
assert.match(maithili['act-archivedBoard'], /संग्रह/);
assert.deepEqual(tokens(maithili['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(maithili['activity-imported']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(maithili['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.match(maithili['activity-subtask-added'], /उपकार्य/);
assert.match(maithili['activity-editComment'], /टिप्पणी/);
assert.equal(maithili['allboards.workspaces'], 'कार्यस्थान');
assert.match(maithili['allboards.edit-workspace-icon'], /markdown/);
assert.equal(maithili['workspaceActionsPopup-title'], 'कार्यस्थान सेटिंग');
assert.deepEqual(tokens(maithili['activity-dueDate']), ['%s', '%s']);
assert.match(maithili['list-width-error-message'], /270/);
assert.match(maithili['set-list-width-value'], /पिक्सेल/);
assert.match(maithili['set-swimlane-height-value'], /पिक्सेल/);
assert.equal(maithili['add-checklist'], 'जाँचसूची जोड़ू');
assert.deepEqual(tokens(maithili['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(maithili['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(maithili['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(maithili['board-nb-stars']), ['%s']);
assert.match(maithili['board-background-image-url'], /URL/);
assert.deepEqual(tags(maithili['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(maithili['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  maithili['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(maithili['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(maithili['card-comments-title']), ['%s']);
assert.equal(maithili['card-edit-custom-fields'],
  'अनुकूलित क्षेत्र संपादित करू');
assert.match(maithili['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(maithili['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(maithili['importDependenciesPopup-title'],
  'निर्भरता आयात करू');
assert.equal(maithili['exportChecklistPopup-title'],
  'जाँचसूची निर्यात करू');
assert.equal(maithili['importSwimlanePopup-title'], 'स्विमलेन आयात करू');
assert.match(maithili.casSignIn, /CAS/);
assert.equal(maithili['cardType-linkedBoard'], 'जुड़ल बोर्ड');
assert.match(maithili['map-to-existing-user-desc'],
  /कार्ड.*टिप्पणी.*गतिविधि/);
assert.equal(maithili['map-to-existing-user-no-results'],
  'मिलैत उपयोगकर्ता नहि भेटल।');
assert.match(maithili['font-preview-text'], /0123456789/);
assert.equal(maithili['auto-list-width'], 'स्वचालित सूची चौड़ाइ');
assert.match(maithili['card-aging-days'], /3/);
assert.equal(maithili['move-card-up'], 'कार्ड ऊपर लऽ जाउ');
assert.equal(maithili['color-red'], 'लाल');
assert.equal(maithili['color-silver'], 'चानी');
assert.equal(maithili['color-white'], 'उज्जर');
assert.equal(maithili['read-only'], 'केवल पढ़ू');
assert.equal(maithili.worker, 'कार्यकर्ता');
const bulkCardExample = JSON.parse(maithili['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(maithili['custom-field-number'], 'संख्या');
assert.match(maithili['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(maithili['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(maithili['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(maithili['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(maithili['error-import-empty-board'], /WeKan/);
assert.equal(maithili['export-card-pdf'], 'कार्ड PDF मे निर्यात करू');
assert.match(maithili['export-card-excel-fields'], /Excel/);
assert.equal(maithili['filter-due-tomorrow'], 'काल्हि नियत');
assert.equal(maithili['filter-no-member'], 'कोनो सदस्य नहि');
assert.match(maithili['advanced-filter-description'],
  /== != <= >= && \|\| \( \).*Field1 == Value1.*'Field 1' == 'Value 1'.*Field1 == I\\'m.*F1 == V1 \|\| F1 == V2.*F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(maithili['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(maithili['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(maithili['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search.*automationRules/);
assert.match(maithili['import-excel-file'], /\.xlsx/);
assert.match(maithili['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(maithili['trello-api-import-desc'], /Trello API/);
assert.match(maithili['invalid-year'], /2026/);
assert.deepEqual(tokens(maithili['label-default']), ['%s']);
assert.deepEqual(tokens(maithili['leave-board-pop']), ['__boardTitle__']);
assert.match(maithili['listImportCardPopup-title'], /Trello/);
assert.match(maithili['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(maithili.normal, 'सामान्य');
assert.equal(maithili['multi-selection'], 'बहु-चयन');
assert.deepEqual(tokens(maithili['page-maybe-private']), ['%s']);
assert.deepEqual(tags(maithili['page-maybe-private']),
  ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(maithili['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(maithili['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.match(maithili['setWipLimitPopup-title'], /WIP/);
assert.match(maithili['toggle-assignees'], /1-9/);
assert.match(maithili['custom-top-left-corner-logo-height'], /27/);
assert.match(maithili['automatic-linked-url-schemes'], /URL.*URL/);
assert.match(maithili['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.equal(maithili['board-templates-swimlane'], 'बोर्ड नमूना');
assert.match(maithili['attachment-transfer-limits-title'], /API/);
assert.match(maithili['smtp-tls-description'], /SMTP.*TLS/);
assert.deepEqual(tokens(maithili['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(maithili['email-smtp-test-subject'], /SMTP/);
assert.match(maithili.Node_version, /Node/);
assert.match(maithili.Meteor_version, /Meteor/);
assert.match(maithili.FerretDB_version, /FerretDB/);
assert.match(maithili.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(maithili.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(maithili.DDP_transport, /DDP.*DDP_TRANSPORT/);
assert.match(maithili['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/);
assert.deepEqual(tokens(maithili['default-subtasks-board']), ['__board__']);
assert.match(maithili['checklist-count-on-minicard'], /0\/0/);
assert.equal(maithili['parent-card'], 'मूल कार्ड');
assert.deepEqual(tokens(maithili['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(maithili['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(maithili['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(maithili['r-import-done']), ['__count__']);
assert.match(maithili['r-import-trello-note'], /Trello.*Butler.*Butler/);
assert.equal(maithili['r-workspace'], 'कार्यस्थान');
assert.match(maithili['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(maithili['r-import-unmapped']), ['__count__']);
assert.match(maithili['r-schedule-weekday'], /सोम–शुक्र/);
assert.match(maithili['r-for-n-days'], /N/);
assert.equal(maithili['r-card-button'], 'कार्ड बटन');
assert.equal(maithili['r-card'], 'कार्ड');
assert.equal(maithili['r-list'], 'सूची');
assert.equal(maithili['r-checklist'], 'जाँचसूची');
assert.equal(maithili['r-d-move-to-top-gen'],
  'कार्ड केँ अपन सूचीक ऊपर लऽ जाउ');
assert.equal(maithili['r-d-send-email'], 'ईमेल पठाउ');
assert.equal(maithili['r-items-list'], 'मद1,मद2,मद3');
assert.equal(maithili['r-add-swimlane'], 'स्विमलेन जोड़ू');
assert.match(maithili['custom-head-meta-tags'], /HTML/);
assert.match(maithili['custom-head-manifest-content'], /JSON/);
assert.match(maithili['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(maithili['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(maithili['add-custom-html-before-body-end']), ['</body>']);
assert.match(maithili['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(maithili['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(maithili['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(maithili['submit-on-enter-description'],
  /Enter.*Shift\+Enter.*Ctrl\/Cmd\+Enter.*Enter/);
assert.match(maithili['roles-info'], /व्यवस्थापक पैनल/);
assert.equal(maithili.monday, 'सोमवार');
assert.equal(maithili.sunday, 'रविवार');
assert.equal(maithili.voting, 'मतदान');
assert.match(maithili['invalid-domain'], /example\.com.*@/);
assert.equal(maithili.person, 'व्यक्ति');
assert.match(maithili['dueCardsViewChange-choice-all-description'],
  /\*नियत\*/);
assert.deepEqual(tokens(maithili['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(maithili['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(maithili['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(maithili['operator-board'], 'बोर्ड');
assert.equal(maithili['operator-swimlane'], 'स्विमलेन');
assert.equal(maithili['operator-checklist-text'], 'जाँचसूची');
assert.equal(maithili['predicate-overdue'], 'समयबीतल');
assert.deepEqual(tokens(maithili['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(maithili['globalSearch-instructions-description']),
  ['__operator_list__']);
assert.deepEqual(tokens(maithili['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.match(maithili['globalSearch-instructions-notes-2'], /\*OR\*/);
assert.match(maithili['globalSearch-instructions-notes-3'], /\*AND\*/);
assert.match(maithili['sort-boards-title-asc'], /A → Z/);
assert.match(maithili['import-dependencies-file'], /JSON.*SVG/);
assert.deepEqual(tokens(maithili['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(maithili['background-too-big']), ['{{size}}']);
assert.equal(maithili['location-open-map'], 'मानचित्रमे खोलू');
assert.match(maithili['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan.*sudo docker logs wekan-app/s);
assert.deepEqual(tokens(maithili['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(maithili['custom-field-stringtemplate-separator'],
  /&#32;.*&nbsp;/);
assert.match(maithili['office-report-desc'], /IPv4.*IPv6/);
assert.match(maithili.cpuReportTitle, /CPU/);
assert.match(maithili['api-report-desc'], /REST API/);
assert.match(maithili['api-no-calls'], /REST API.*WITH_API=true.*API/);
assert.match(maithili['recovery-report-desc'], /MongoDB/);
assert.equal(maithili['copy-swimlane'], 'स्विमलेन कॉपी करू');
assert.match(maithili['carbon-copy'], /Cc:/);
assert.match(maithili.Node_heap_malloced_memory, /Node heap.*malloc/);
assert.match(maithili.Node_memory_usage_rss, /Node/);
assert.match(maithili['custom-legal-notice-link-url'], /URL/);
assert.match(maithili['attachment-move-storage-gridfs'], /GridFS/);
assert.match(maithili['attachment-move-storage-s3'], /S3/);
assert.match(maithili['attachment-repair-locations-description'], /GridFS/);
assert.match(maithili['gridfs-file-id'], /GridFS.*ID/);
assert.match(maithili['mongodb-compact-description'],
  /MongoDB GridFS.*Compact/);
assert.match(maithili['mongodb-compact-warning'],
  /Compact.*oplog.*Meteor/);
assert.match(maithili['mongodb-compact-run'], /MongoDB Compact/);
assert.deepEqual(tokens(maithili['drag-board-to-workspace']),
  ['__workspaces__']);
assert.match(maithili['preview-pdf-not-supported'], /PDF/);
assert.match(maithili['show-week-of-year'], /ISO 8601/);
assert.match(maithili['import-board-zip'], /.zip.*JSON/);
assert.equal(maithili.accessibility, 'अभिगम्यता');
assert.match(maithili['accounts-lockout-info'], /प्रवेश.*आक्रमण/);
assert.match(maithili['accounts-lockout-known-users'], /उपयोगकर्ता नाम.*कूटशब्द/);
assert.match(maithili['accounts-lockout-period'], /सेकंड/);
assert.equal(maithili['active-cron-jobs'], 'सक्रिय निर्धारित कार्य');
assert.equal(maithili['board-operations'], 'बोर्ड कार्रवाई');
assert.match(maithili['s3-force-path-style-description'],
  /MinIO.*AWS.*S3/);
assert.match(maithili['database-migration-description'],
  /MongoDB.*FerretDB v1 \(SQLite\).*mongodb:\/\/127\.0\.0\.1:27018.*mongodb:\/\/127\.0\.0\.1:27019.*WEKAN_FERRETDB_URL.*WEKAN_MONGODB_URL.*MONGO_URL.*Snap.*snap set wekan database=ferretdb.*=mongodb/s);
assert.deepEqual(tokens(maithili['database-migration-confirm']), ['__db__']);
assert.match(maithili['sandstorm-migration-description'],
  /WeKan.*Sandstorm grain.*MongoDB 3.*FerretDB v1 \(SQLite\).*files\/attachments.*files\/avatars/s);
assert.match(maithili['cards-loading-description'],
  /WeKan.*CARDS_LOADING \(all\/lazy\/auto\).*CARDS_LOADING_LAZY_THRESHOLD/s);
assert.deepEqual(tags(maithili['render-links-as-plain-text-description']),
  ['<a href>']);
assert.match(maithili['always-show-code-as-text-description'],
  /HTML.*<!-- -->.*JavaScript/);
assert.match(maithili['disable-all-import-description'],
  /WeKan JSON.*Trello.*CSV\/Excel.*Jira.*Kanboard.*NextCloud Deck.*OpenProject.*GitHub.*GitLab.*Gitea.*Forgejo/s);
assert.match(maithili['disable-import-avatars-description'],
  /WeKan JSON.*Trello.*LDAP.*OIDC\/OAuth2/s);
assert.match(maithili['backup-description'],
  /.zip.*backup\/YYYY\/MM\/DD\/HH_MM_SS\/backup.zip.*YYYY_MM_DD-HH_MM_SS\/attachments.*\/avatars.*\/data.*S3\/MinIO.*Azure.*GCS/s);
assert.match(maithili['backup-time'], /HH:MM/);
assert.match(maithili['gcs-permissions-note'],
  /WeKan.*Google Cloud Console.*Cloud Storage.*Buckets.*Permissions.*Grant access.*New principals.*JSON.*client_email.*Storage Object Admin.*Save/s);
assert.match(maithili['s3-endpoint-menu-path'],
  /AWS.*S3.*MinIO.*Cloudflare R2.*Backblaze B2.*Wasabi.*DigitalOcean Spaces.*Endpoint URL/s);
assert.match(maithili['s3-secret-key-menu-path'],
  /Access key ID.*Secret access key.*.csv/s);
assert.match(maithili['gcs-credentials-menu-path'],
  /Google Cloud Console.*IAM & Admin.*Service accounts.*Keys.*JSON/s);
assert.match(maithili['attachment-move-storage-azure'],
  /Azure Blob Storage/);
assert.match(maithili['attachment-move-storage-gcs'],
  /Google Cloud Storage/);
assert.match(maithili['gridfs-enabled-description'], /MongoDB GridFS/);
assert.match(maithili['gridfs-move-collectionfs-note'], /CollectionFS/);
assert.match(maithili['s3-enabled-description'], /AWS S3.*MinIO/);
assert.match(maithili['s3-region-description'], /AWS S3.*us-east-1/);
assert.match(maithili['s3-ssl-enabled-description'], /S3.*SSL\/TLS/);
assert.match(maithili['restore-lost-cards-migration-description'],
  /swimlaneId.*listId/);
assert.match(maithili['restore-all-archived-migration-description'],
  /swimlaneId.*listId/);
assert.match(maithili['fix-avatar-urls-migration-description'], /URL/);
assert.match(maithili['fix-all-file-urls-migration-description'], /URL/);
assert.match(maithili['run-restore-lost-cards-migration-confirm'],
  /swimlaneId.*listId/);
assert.match(maithili['run-restore-all-archived-migration-confirm'], /ID/);
