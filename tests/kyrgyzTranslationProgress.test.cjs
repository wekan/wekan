const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const fillScript = path.join(root, 'releases/translations/fill-translations.mjs');
const result = spawnSync(process.execPath, [fillScript, '--list', 'ky'], {
  cwd: root,
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
const remaining = JSON.parse(result.stdout);
assert.equal(Object.keys(remaining).length, 167);

const english = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const kyrgyz = JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data/ky.i18n.json'), 'utf8'));
const tokens = (value) => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g)]
  .map(([token]) => token).sort();
const tags = (value) => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

for (const [key, value] of Object.entries(kyrgyz)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]), key);
  }
  assert.deepEqual(tags(value), tags(english[key]), key);
}

assert.equal(kyrgyz.accept, 'Кабыл алуу');
assert.deepEqual(tokens(kyrgyz['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(kyrgyz['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(kyrgyz['act-removeChecklistItem']),
  ['__board__', '__card__', '__checkList__', '__checklistItem__', '__list__',
    '__swimlane__']);
assert.match(kyrgyz['act-createBoard'], /тактасын/);
assert.match(kyrgyz['act-createCard'], /карточкасын/);
assert.match(kyrgyz['act-addAttachment'], /тиркемесин/);
assert.match(kyrgyz['act-addChecklist'], /текшерүү тизмесин/);
assert.match(kyrgyz['act-addComment'], /комментарий/);
assert.match(kyrgyz['act-archivedBoard'], /Архивге/);
assert.deepEqual(tokens(kyrgyz['act-moveCardToOtherBoard']),
  ['__board__', '__card__', '__list__', '__oldBoard__', '__oldList__',
    '__oldSwimlane__', '__swimlane__']);
assert.deepEqual(tokens(kyrgyz['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(kyrgyz['activity-imported']), ['%s', '%s', '%s']);
assert.equal(kyrgyz['allboards.workspaces'], 'Иш мейкиндиктери');
assert.match(kyrgyz['allboards.edit-workspace-icon'], /markdown/);
assert.equal(kyrgyz['workspaceActionsPopup-title'],
  'Иш мейкиндигинин жөндөөлөрү');
assert.deepEqual(tokens(kyrgyz['activity-dueDate']), ['%s', '%s']);
assert.match(kyrgyz['list-width-error-message'], /270/);
assert.match(kyrgyz['set-swimlane-height-value'], /пиксел/);
assert.equal(kyrgyz['add-checklist'], 'Текшерүү тизмесин кошуу');
assert.deepEqual(tokens(kyrgyz['and-n-other-card']), ['__count__']);
assert.deepEqual(tokens(kyrgyz['and-n-other-card_plural']), ['__count__']);
assert.deepEqual(tokens(kyrgyz['avatar-too-big']), ['__size__']);
assert.deepEqual(tokens(kyrgyz['board-nb-stars']), ['%s']);
assert.deepEqual(tags(kyrgyz['board-private-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tags(kyrgyz['board-public-info']),
  ['</strong>', '<strong>']);
assert.deepEqual(tokens(
  kyrgyz['board-open-and-move-between-remaining-and-workspaces']),
['__workspaces__']);
assert.match(kyrgyz['enter-zoom-level'], /50-300%/);
assert.deepEqual(tokens(kyrgyz['card-comments-title']), ['%s']);
assert.equal(kyrgyz['card-edit-custom-fields'],
  'Ыңгайлаштырылган талааларды өзгөртүү');
assert.match(kyrgyz['cardStartPlanningPokerPopup-title'], /Planning Poker/);
assert.match(kyrgyz['editPokerEndDatePopup-title'], /Planning Poker/);
assert.equal(kyrgyz['importDependenciesPopup-title'],
  'Көз карандылыктарды импорттоо');
assert.equal(kyrgyz['exportChecklistPopup-title'],
  'Текшерүү тизмесин экспорттоо');
assert.equal(kyrgyz['importSwimlanePopup-title'], 'Жолду импорттоо');
assert.match(kyrgyz.casSignIn, /CAS/);
assert.equal(kyrgyz['cardType-linkedBoard'], 'Байланышкан такта');
assert.match(kyrgyz['map-to-existing-user-desc'],
  /карточкалары.*комментарийлери.*аракеттери/);
assert.equal(kyrgyz['map-to-existing-user-no-results'],
  'Дал келген колдонуучулар табылган жок.');
assert.match(kyrgyz['font-preview-text'], /0123456789/);
assert.equal(kyrgyz['auto-list-width'], 'Тизменин автоматтык туурасы');
assert.match(kyrgyz['card-aging-days'], /3/);
assert.equal(kyrgyz['move-card-up'], 'Карточканы өйдө жылдыруу');
assert.equal(kyrgyz['color-red'], 'кызыл');
assert.equal(kyrgyz['color-silver'], 'күмүш');
assert.equal(kyrgyz['read-only'], 'Окуу үчүн гана');
assert.equal(kyrgyz.worker, 'Жумушчу');
const bulkCardExample = JSON.parse(kyrgyz['copyManyCardsPopup-format']);
assert.deepEqual(Object.keys(bulkCardExample[0]), ['title', 'description']);
assert.equal(kyrgyz['custom-field-number'], 'Сан');
assert.match(kyrgyz['edit-wip-limit'], /WIP/);
assert.deepEqual(tokens(kyrgyz['email-enrollAccount-text']),
  ['__url__', '__user__']);
assert.deepEqual(tokens(kyrgyz['email-invite-text']),
  ['__board__', '__inviter__', '__url__', '__user__']);
assert.deepEqual(tokens(kyrgyz['email-verifyEmail-text']),
  ['__url__', '__user__']);
assert.match(kyrgyz['error-import-empty-board'], /WeKan/);
assert.equal(kyrgyz['export-card-pdf'],
  'Карточканы PDF форматына экспорттоо');
assert.match(kyrgyz['export-card-excel-fields'], /Excel/);
assert.equal(kyrgyz['filter-due-tomorrow'], 'Мөөнөтү эртең');
assert.equal(kyrgyz['filter-no-member'], 'Мүчө жок');
assert.match(kyrgyz['advanced-filter-description'],
  /== != <= >= && \|\| \( \).*Field1 == Value1.*'Field 1' == 'Value 1'.*Field1 == I\\'m.*F1 == V1 \|\| F1 == V2.*F1 == \/Tes\.\*\/i/);
assert.deepEqual(tokens(kyrgyz['import-board-instruction-issues']),
  ['__endpoint__', '__sourceName__']);
assert.match(kyrgyz['import-board-instruction-openproject'],
  /GET \/api\/v3\/work_packages/);
assert.match(kyrgyz['import-board-instruction-jira'],
  /GET \/rest\/api\/2\/search.*automationRules/);
assert.match(kyrgyz['import-excel-file'], /\.xlsx/);
assert.match(kyrgyz['trello-api-key'],
  /https:\/\/trello\.com\/app-key/);
assert.match(kyrgyz['trello-api-import-desc'], /Trello API/);
assert.match(kyrgyz['invalid-year'], /2026/);
assert.deepEqual(tokens(kyrgyz['label-default']), ['%s']);
assert.deepEqual(tokens(kyrgyz['leave-board-pop']), ['__boardTitle__']);
assert.match(kyrgyz['listImportCardPopup-title'], /Trello/);
assert.match(kyrgyz['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
assert.equal(kyrgyz.normal, 'Кадимки');
assert.equal(kyrgyz['multi-selection'], 'Көп тандоо');
assert.deepEqual(tokens(kyrgyz['page-maybe-private']), ['%s']);
assert.deepEqual(tags(kyrgyz['page-maybe-private']), ["</a>", "<a href='%s'>"]);
assert.deepEqual(tokens(kyrgyz['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.match(kyrgyz['sandstorm-remove-member-warning'], /WeKan.*Sandstorm/);
assert.match(kyrgyz['setWipLimitPopup-title'], /WIP/);
assert.match(kyrgyz['toggle-assignees'], /1-9/);
assert.match(kyrgyz['custom-top-left-corner-logo-height'], /27/);
assert.match(kyrgyz['automatic-linked-url-schemes'], /URL.*URL/);
assert.match(kyrgyz['wipLimitErrorPopup-dialog-pt1'], /WIP/);
assert.equal(kyrgyz['board-templates-swimlane'], 'Такта үлгүлөрү');
assert.match(kyrgyz['attachment-transfer-limits-title'], /API/);
assert.match(kyrgyz['smtp-tls-description'], /SMTP.*TLS/);
assert.deepEqual(tokens(kyrgyz['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(kyrgyz['email-smtp-test-subject'], /SMTP/);
assert.match(kyrgyz.Node_version, /Node/);
assert.match(kyrgyz.Meteor_version, /Meteor/);
assert.match(kyrgyz.FerretDB_version, /FerretDB/);
assert.match(kyrgyz.Reactivity_mode, /changeStreams.*oplog.*polling/);
assert.match(kyrgyz.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(kyrgyz.DDP_transport, /DDP.*DDP_TRANSPORT/);
assert.match(kyrgyz['org-domains-description'],
  /a\.example\.com.*kanban\.example\.org.*MULTITENANCY=true/);
assert.deepEqual(tokens(kyrgyz['default-subtasks-board']), ['__board__']);
assert.match(kyrgyz['checklist-count-on-minicard'], /0\/0/);
assert.equal(kyrgyz['parent-card'], 'Ата-эне карточка');
assert.deepEqual(tokens(kyrgyz['activity-added-label']), ['%s', '%s']);
assert.deepEqual(tokens(kyrgyz['activity-set-customfield']),
  ['%s', '%s', '%s']);
assert.deepEqual(tokens(kyrgyz['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(kyrgyz['r-import-done']), ['__count__']);
assert.match(kyrgyz['r-import-trello-note'], /Trello.*Butler.*Butler/);
assert.equal(kyrgyz['r-workspace'], 'Иш мейкиндиги');
assert.match(kyrgyz['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.deepEqual(tokens(kyrgyz['r-import-unmapped']), ['__count__']);
assert.match(kyrgyz['r-schedule-weekday'], /Дүй–Жума/);
assert.match(kyrgyz['r-for-n-days'], /N/);
assert.equal(kyrgyz['r-card-button'], 'Карточка баскычы');
assert.equal(kyrgyz['r-card'], 'карточка');
assert.equal(kyrgyz['r-list'], 'тизме');
assert.equal(kyrgyz['r-checklist'], 'текшерүү тизмеси');
assert.equal(kyrgyz['r-d-move-to-top-gen'],
  'Карточканы өз тизмесинин башына жылдыруу');
assert.equal(kyrgyz['r-d-send-email'], 'Электрондук кат жөнөтүү');
assert.equal(kyrgyz['r-items-list'], 'пункт1,пункт2,пункт3');
assert.equal(kyrgyz['r-add-swimlane'], 'Жол кошуу');
assert.match(kyrgyz['custom-head-meta-tags'], /HTML/);
assert.match(kyrgyz['custom-head-manifest-content'], /JSON/);
assert.match(kyrgyz['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.deepEqual(tags(kyrgyz['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tags(kyrgyz['add-custom-html-before-body-end']), ['</body>']);
assert.match(kyrgyz['oidc-button-text'], /OIDC/);
assert.deepEqual(tokens(kyrgyz['act-a-dueAt']),
  ['__card__', '__timeOldValue__', '__timeValue__']);
assert.deepEqual(tokens(kyrgyz['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.match(kyrgyz['submit-on-enter-description'],
  /Enter.*Shift\+Enter.*Ctrl\/Cmd\+Enter.*Enter/);
assert.match(kyrgyz['roles-info'], /Администратор панелинин/);
assert.equal(kyrgyz.monday, 'Дүйшөмбү');
assert.equal(kyrgyz.sunday, 'Жекшемби');
assert.equal(kyrgyz.voting, 'Добуш берүү');
assert.match(kyrgyz['invalid-domain'], /example\.com.*@/);
assert.equal(kyrgyz.person, 'Адам');
assert.match(kyrgyz['dueCardsViewChange-choice-all-description'],
  /\*Бүтүрүү\*/);
assert.deepEqual(tokens(kyrgyz['board-title-not-found']), ['%s']);
assert.deepEqual(tokens(kyrgyz['label-color-not-found']), ['%s']);
assert.deepEqual(tokens(kyrgyz['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(kyrgyz['operator-board'], 'такта');
assert.equal(kyrgyz['operator-swimlane'], 'жол');
assert.equal(kyrgyz['operator-checklist-text'], 'текшерүүтизмеси');
assert.equal(kyrgyz['predicate-overdue'], 'мөөнөтүөткөн');
assert.deepEqual(tokens(kyrgyz['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(kyrgyz['globalSearch-instructions-description']),
  ['__operator_list__']);
assert.deepEqual(tokens(kyrgyz['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.match(kyrgyz['globalSearch-instructions-notes-2'], /\*OR\*/);
assert.match(kyrgyz['globalSearch-instructions-notes-3'], /\*AND\*/);
assert.match(kyrgyz['sort-boards-title-asc'], /A → Z/);
assert.match(kyrgyz['import-dependencies-file'], /JSON.*SVG/);
assert.deepEqual(tokens(kyrgyz['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(kyrgyz['background-too-big']), ['{{size}}']);
assert.equal(kyrgyz['location-open-map'], 'Картадан ачуу');
assert.match(kyrgyz['server-error-troubleshooting'],
  /sudo snap logs wekan\.wekan.*sudo docker logs wekan-app/s);
assert.deepEqual(tokens(kyrgyz['custom-field-stringtemplate-format']),
  ['%{value}']);
assert.match(kyrgyz['custom-field-stringtemplate-separator'], /&#32;.*&nbsp;/);
assert.match(kyrgyz['office-report-desc'], /IPv4.*IPv6/);
assert.match(kyrgyz.cpuReportTitle, /CPU/);
assert.match(kyrgyz['api-report-desc'], /REST API/);
assert.match(kyrgyz['api-no-calls'], /REST API.*WITH_API=true.*API/);
assert.match(kyrgyz['recovery-report-desc'], /MongoDB/);
assert.equal(kyrgyz['copy-swimlane'], 'Жолду көчүрүү');
assert.match(kyrgyz['carbon-copy'], /Cc:/);
assert.match(kyrgyz.Node_heap_malloced_memory, /Node heap.*malloc/);
assert.match(kyrgyz.Node_memory_usage_rss, /Node/);
assert.match(kyrgyz['custom-legal-notice-link-url'], /URL/);
assert.match(kyrgyz['attachment-move-storage-gridfs'], /GridFS/);
assert.match(kyrgyz['attachment-move-storage-s3'], /S3/);
assert.match(kyrgyz['attachment-repair-locations-description'], /GridFS/);
assert.match(kyrgyz['gridfs-file-id'], /GridFS.*ID/);
assert.match(kyrgyz['mongodb-compact-description'], /MongoDB GridFS.*Compact/);
assert.match(kyrgyz['mongodb-compact-warning'], /Compact.*oplog.*Meteor/);
assert.match(kyrgyz['mongodb-compact-run'], /MongoDB Compact/);
assert.match(kyrgyz.Mongo_sessions_count, /Mongo/);
assert.match(kyrgyz['preview-pdf-not-supported'], /PDF/);
assert.deepEqual(tokens(kyrgyz['drag-board-to-workspace']),
  ['__workspaces__']);
assert.match(kyrgyz['show-week-of-year'], /ISO 8601/);
assert.match(kyrgyz['import-board-zip'], /\.zip/);
assert.match(kyrgyz['import-board-zip'], /JSON/);
assert.equal(kyrgyz.accessibility, 'Жеткиликтүүлүк');
assert.match(kyrgyz['accounts-lockout-info'], /brute force/);
assert.match(kyrgyz['accounts-lockout-period'], /секунд/);
assert.equal(kyrgyz['admin-people-filter-active'], 'Активдүү');
assert.match(kyrgyz['active-cron-jobs'], /пландаштырылган/);
assert.equal(kyrgyz['attachments-path'], 'Тиркемелердин жолу');
assert.match(kyrgyz['board-backup-scheduled'], /ийгиликтүү/);
assert.equal(kyrgyz['cron-job-deleted'],
  'Пландаштырылган иш ийгиликтүү өчүрүлдү');
assert.match(kyrgyz['s3-force-path-style-description'], /MinIO.*AWS.*S3/);
assert.equal(kyrgyz['comprehensive-board-migration'],
  'Тактанын комплекстүү көчүрүлүшү');
assert.match(kyrgyz['comprehensive-board-migration-description'],
  /тизмелердин иретин.*карточкалардын орундарын.*жолдордун түзүмүн/);
assert.match(kyrgyz['restore-lost-cards-migration-description'],
  /swimlaneId.*listId.*Жоголгон карточкалар/);
assert.match(kyrgyz['restore-all-archived-migration-description'],
  /жолдорду.*тизмелерди.*карточкаларды.*swimlaneId.*listId/);
assert.match(kyrgyz['fix-avatar-urls-migration-description'], /URL/);
assert.match(kyrgyz['fix-all-file-urls-migration-description'], /URL/);
assert.equal(kyrgyz['migration-successful'],
  'Көчүрүү ийгиликтүү аяктады');
assert.match(kyrgyz['run-restore-all-archived-migration-confirm'],
  /БАРДЫК.*ID.*Улантасызбы/);
assert.equal(kyrgyz['step-validate-migration'], 'Көчүрүүнү текшерүү');
assert.match(kyrgyz['database-migration-description'],
  /MongoDB.*FerretDB v1.*SQLite.*mongodb:\/\/127\.0\.0\.1:27018.*mongodb:\/\/127\.0\.0\.1:27019.*WEKAN_FERRETDB_URL.*WEKAN_MONGODB_URL.*MONGO_URL.*WeKan.*Snap.*snap set wekan database=ferretdb.*=mongodb/);
assert.deepEqual(tokens(kyrgyz['database-migration-confirm']), ['__db__']);
assert.match(kyrgyz['sandstorm-migration-description'],
  /WeKan.*Sandstorm.*MongoDB 3.*FerretDB v1.*SQLite.*files\/attachments.*files\/avatars/);
assert.match(kyrgyz['cards-loading-description'],
  /WeKan.*CARDS_LOADING \(all\/lazy\/auto\).*CARDS_LOADING_LAZY_THRESHOLD/);
assert.match(kyrgyz['render-links-as-plain-text-description'],
  /\[label\]\(url\).*<a href>/);
assert.match(kyrgyz['always-show-code-as-text-description'],
  /HTML.*<!-- -->.*JavaScript/);
assert.match(kyrgyz['disable-all-import-description'],
  /WeKan JSON.*Trello.*CSV\/Excel.*Jira.*Kanboard.*NextCloud Deck.*OpenProject.*GitHub.*GitLab.*Gitea.*Forgejo/);
assert.match(kyrgyz['backup-description'],
  /\.zip.*backup\/YYYY\/MM\/DD\/HH_MM_SS\/backup\.zip.*YYYY_MM_DD-HH_MM_SS\/attachments.*\/avatars.*\/data.*S3\/MinIO.*Azure.*GCS/);
assert.match(kyrgyz['backup-time'], /HH:MM/);
assert.match(kyrgyz['gcs-permissions-note'],
  /WeKan.*Google Cloud Console.*Cloud Storage.*Buckets.*Permissions.*Grant access.*New principals.*client_email.*Storage Object Admin.*Save/);
assert.match(kyrgyz['s3-endpoint-menu-path'],
  /AWS.*S3.*MinIO.*Cloudflare R2.*Backblaze B2.*Wasabi.*DigitalOcean Spaces.*Endpoint URL/);
assert.match(kyrgyz['s3-secret-key-menu-path'],
  /Access key ID.*Secret access key.*Download \.csv/);
assert.match(kyrgyz['gcs-credentials-menu-path'],
  /Google Cloud Console.*IAM & Admin.*Service accounts.*Keys.*Add key.*Create new key.*JSON.*Create/);
assert.match(kyrgyz['gridfs-enabled-description'], /MongoDB GridFS/);
assert.match(kyrgyz['gridfs-move-collectionfs-note'], /CollectionFS/);
assert.match(kyrgyz['s3-region-description'], /AWS S3.*us-east-1/);
assert.match(kyrgyz['s3-ssl-enabled-description'], /S3.*SSL\/TLS/);
assert.equal(kyrgyz['board-migrations'], 'Такталарды көчүрүү');
