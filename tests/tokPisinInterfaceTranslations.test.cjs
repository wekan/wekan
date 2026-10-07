'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/tpi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');

test('Tok Pisin common interface labels replace prefixed English and retain source tokens',()=>{
 const keys=[
  "change-font",
  "font",
  "subtasks",
  "go-back",
  "modal-title",
  "worker",
  "computer",
  "custom-field-currency",
  "custom-field-currency-option",
  "custom-field-dropdown-unknown",
  "custom-field-number",
  "decline",
  "discard",
  "export-card-subtasks",
  "export-card-attachment-filename",
  "export-card-attachment-size",
  "export-card-attachment-type",
  "export-card-attachment-uploaded-by",
  "export-card-excel-free",
  "export-card-excel-needed",
  "sorted",
  "filter-overdue",
  "filter-creator-label",
  "other-filters-label",
  "trello-parent-workspace-top",
  "trello-clear-job",
  "running",
  "paused",
  "info",
  "check-version",
  "initials",
  "joined",
  "keyboard-shortcuts",
  "menu",
  "multi-selection",
  "multi-selection-on",
  "multi-selection-off",
  "muted",
  "normal",
  "participating",
  "preview",
  "previewAttachedImagePopup-title",
  "previewClipboardImagePopup-title",
  "shortcut-autocomplete-emoji",
  "subscribe",
  "overtime-hours",
  "overtime",
  "tracking",
  "type",
  "view-it",
  "watching",
  "welcome-swimlane",
  "welcome-list1",
  "welcome-list2",
  "attachment-limits",
  "avatars-upload-blocked-label",
  "attachment-limit-mode-unlimited",
  "attachment-limit-mode-blocked",
  "registration",
  "self-registration",
  "invite",
  "invite-people",
  "email-templates-invite-subject",
  "email-templates-invite-body",
  "email-templates-activity-subject",
  "invitation-code",
  "error-invitation-code-not-exist",
  "no-name",
  "days",
  "hours",
  "minutes",
  "seconds",
  "visibility",
  "verified",
  "card-end",
  "card-end-on",
  "assigned-by",
  "requested-by",
  "queue",
  "error-undefined",
  "help",
  "allow-rename",
  "allowRenamePopup-title"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Toksave:|Uploaded By|Multi-Selection|Invitation Code|Go back/,key);
  assert.notEqual(data[key],english[key],key);
 }
});

test('Tok Pisin interface labels distinguish states, invitations and time units',()=>{
 assert.match(data['multi-selection-on'],/i wok$/);
 assert.match(data['multi-selection-off'],/i no wok$/);
 assert.equal(data['days'],'de');
 assert.equal(data['hours'],'aua');
 assert.equal(data['minutes'],'minit');
 assert.equal(data['seconds'],'seken');
 assert.match(data['error-invitation-code-not-exist'],/Kod.*i no stap/);
 assert.match(data['email-templates-invite-subject'],/Het tok.*imel.*singautim/);
 assert.match(data['email-templates-invite-body'],/Rait.*imel.*singautim/);
 assert.match(data['email-templates-activity-subject'],/toksave long wok/);
 assert.match(data['self-registration'],/bilong yu yet/);
 assert.match(data['filter-creator-label'],/man i bin mekim/);
 assert.match(data['attachment-limit-mode-unlimited'],/no gat mak/);
 assert.equal(data['attachment-limit-mode-blocked'],'Tambu');
 assert.equal(data['subtasks'],data['export-card-subtasks']);
 assert.equal(data['preview'],data['previewAttachedImagePopup-title']);
 assert.equal(data['preview'],data['previewClipboardImagePopup-title']);
});


test('Tok Pisin rules and schedules replace prefixed English with intact placeholders',()=>{
 const keys=[
  "r-rule",
  "r-view-rule",
  "r-edit-rule-trigger-action",
  "r-workflow-view",
  "r-when",
  "r-import-done",
  "r-workflow-format",
  "r-format-auto",
  "r-set-scheduled-triggers",
  "r-set-button-triggers",
  "r-schedule-type",
  "r-schedule-once",
  "r-schedule-daily",
  "r-schedule-weekday",
  "r-schedule-on-weekday",
  "r-due-is-set",
  "r-due-soon",
  "r-due-overdue",
  "r-run",
  "r-later",
  "r-unit-minutes",
  "r-unit-hours",
  "r-unit-days",
  "r-when-a-due-date-changed",
  "r-when-a-end-date-changed",
  "r-made-incomplete",
  "r-checked",
  "r-unchecked",
  "r-check",
  "r-uncheck",
  "r-item",
  "r-subject",
  "r-rule-details",
  "r-d-send-email-subject",
  "r-d-check-one",
  "r-d-uncheck-one",
  "r-items-list",
  "r-set",
  "r-df-start-at",
  "r-df-due-at",
  "r-df-end-at",
  "act-newDue",
  "act-withDue",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "day",
  "cron-jobs",
  "cron-migrations",
  "cron-job-paused",
  "cron-job-resumed",
  "cron-job-started",
  "cron-migration-errors",
  "cron-migration-warnings",
  "cron-error-severity",
  "cron-error-details",
  "cron-resume-paused",
  "cron-migrations-resumed",
  "backup-frequency",
  "backup-frequency-off",
  "backup-frequency-daily",
  "backup-frequency-weekly",
  "backup-frequency-monthly",
  "every-1-day",
  "every-1-hour",
  "every-1-minute",
  "every-10-minutes",
  "every-30-minutes",
  "every-5-minutes",
  "every-6-hours"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Toksave:/,key);
  assert.notEqual(data[key],english[key],key);
 }
});

test('Tok Pisin scheduling wording preserves recurrence, due dates and checklist states',()=>{
 assert.match(data['r-schedule-once'],/Wanpela taim/);
 assert.match(data['r-schedule-weekday'],/Mande–Fraide/);
 assert.match(data['r-when-a-due-date-changed'],/makim o senisim.*i mas pinis/);
 assert.doesNotMatch(data['r-when-a-end-date-changed'],/i mas pinis/);
 assert.match(data['r-due-soon'],/klostu/);
 assert.match(data['r-due-overdue'],/lus pinis/);
 assert.match(data['r-check'],/^Putim/);
 assert.match(data['r-uncheck'],/^Rausim/);
 assert.match(data['r-made-incomplete'],/i no pinis/);
 assert.match(data['act-newDue'],/fes tok.*__board__/);
 assert.equal(data['r-items-list'].split(',').length,3);
 for(const [key,n,unit] of [['every-1-day',1,'de'],['every-1-hour',1,'aua'],['every-1-minute',1,'minit'],['every-5-minutes',5,'minit'],['every-10-minutes',10,'minit'],['every-30-minutes',30,'minit'],['every-6-hours',6,'aua']]) assert.equal(data[key],`Long olgeta ${n} ${unit}`);
 assert.match(data['cron-job-paused'],/malolo liklik/);
 assert.match(data['cron-job-resumed'],/go het gen/);
 assert.match(data['cron-job-started'],/stat pinis/);
 assert.equal(data['backup-frequency-off'],'I no wok');
 assert.match(data['backup-frequency-weekly'],/wik/);
 assert.match(data['backup-frequency-monthly'],/mun/);
});


test('Tok Pisin storage and migration labels replace prefixed English with intact tokens',()=>{
 const keys=[
  "move-source",
  "move-destination",
  "move-storage-fs",
  "attachment-repair-done",
  "attachment-repair-scanned",
  "attachment-repair-repaired",
  "move-scope-avatars",
  "move-progress-pause",
  "move-progress-resume",
  "avatars",
  "storage",
  "progress",
  "max-avatar-filesize",
  "allowed-avatar-filetypes",
  "avatars-path",
  "storage-read",
  "database-migration-phase",
  "sandstorm-migration-success",
  "sandstorm-storage-item",
  "backup-scope",
  "backup-scope-instance",
  "backup-now",
  "backup-schedule",
  "migration-starting",
  "migration-pausing",
  "migration-stopping",
  "migration-paused",
  "migration-progress",
  "migration-started",
  "migration-stopped",
  "automatic-migration",
  "fix-avatar-urls-migration",
  "migration-needed",
  "migration-running",
  "migrations",
  "run-migration",
  "migration-progress-overall",
  "migration-progress-details",
  "step-validate-migration",
  "step-fix-avatar-urls",
  "filesystem-storage",
  "idle-migration",
  "migration-batch-size",
  "migration-cpu-threshold",
  "migration-delay-ms",
  "migration-detector",
  "migration-log",
  "migration-markers",
  "migration-resumed",
  "migration-steps",
  "overall-progress",
  "pause-migration",
  "resume-migration",
  "step-progress",
  "stop-migration",
  "storage-distribution"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Toksave:/,key);
  assert.notEqual(data[key],english[key],key);
 }
});

test('Tok Pisin migration controls preserve state changes, scope and units',()=>{
 assert.match(data['move-source'],/i kam/);
 assert.match(data['move-destination'],/i go/);
 assert.match(data['migration-pausing'],/^I mekim.*malolo liklik/);
 assert.match(data['migration-stopping'],/^I stopim/);
 assert.match(data['migration-paused'],/malolo liklik pinis/);
 assert.match(data['migration-stopped'],/stop pinis/);
 assert.match(data['resume-migration'],/^Go het gen/);
 assert.match(data['pause-migration'],/malolo liklik/);
 assert.match(data['stop-migration'],/^Stopim/);
 assert.match(data['migration-delay-ms'],/\(ms\)/);
 assert.match(data['migration-cpu-threshold'],/CPU \(%\)/);
 assert.match(data['max-avatar-filesize'],/Bikpela tru.*bait/);
 assert.match(data['backup-scope-instance'],/sistem olgeta/);
 assert.match(data['backup-now'],/nau$/);
 assert.equal(data['migration-progress-overall'],data['overall-progress']);
 assert.equal(data['fix-avatar-urls-migration'],data['step-fix-avatar-urls']);
 assert.equal(data['storage'],data['sandstorm-storage-item']);
});


test('Tok Pisin reports replace prefixed English with intact source tokens',()=>{
 const keys=[
  "reports",
  "securityReportTitle",
  "speedReportTitle",
  "testsReportTitle",
  "cpuReportTitle",
  "rulesReportTitle",
  "impersonationReportTitle",
  "officeReportTitle",
  "office-location",
  "office-logins",
  "office-first-seen",
  "office-last-seen",
  "office-shared",
  "api-calls",
  "api-first-called",
  "api-last-called",
  "recovery-event",
  "recovery-severity",
  "recovery-detail",
  "cpu-cores",
  "cpu-usage",
  "duration",
  "errors",
  "job-details",
  "job-queue",
  "last-run",
  "max-concurrent",
  "memory-usage",
  "operation-type",
  "refresh-monitoring",
  "start-test-operation",
  "total-operations",
  "api-endpoints",
  "cpu-cores-suffix",
  "cpu-load-average",
  "event-category",
  "event-severity",
  "event-source",
  "event-detail",
  "event-attempts",
  "integrityReportTitle"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Toksave:/,key);
  assert.notEqual(data[key],english[key],key);
 }
});

test('Tok Pisin monitoring labels distinguish chronology, queues and resource usage',()=>{
 assert.match(data['office-first-seen'],/^Fes/);
 assert.match(data['office-last-seen'],/^Las/);
 assert.match(data['api-first-called'],/^Fes/);
 assert.match(data['api-last-called'],/^Las/);
 assert.match(data['max-concurrent'],/Bikpela tru namba.*wankain taim/);
 assert.match(data['job-queue'],/ol wok i wet/);
 assert.match(data['memory-usage'],/memori/);
 assert.match(data['cpu-usage'],/CPU/);
 assert.match(data['cpu-cores'],/koa.*CPU/);
 assert.match(data['impersonationReportTitle'],/akaun olsem narapela man/);
 assert.equal(data['recovery-severity'],data['event-severity']);
 assert.equal(data['recovery-detail'],data['event-detail']);
 assert.equal(data['cpuReportTitle'],data['cpu-usage']);
});


test('Tok Pisin system labels replace prefixed English with intact source tokens',()=>{
 const keys=[
  "Node_version",
  "Meteor_version",
  "FerretDB_version",
  "FerretDB_commit",
  "Reactivity_mode",
  "Reactivity_order",
  "DDP_transport",
  "OS_Arch",
  "OS_Cpus",
  "OS_Freemem",
  "OS_Loadavg",
  "OS_Platform",
  "OS_Release",
  "OS_Totalmem",
  "OS_Type",
  "OS_Uptime",
  "Node_heap_total_heap_size",
  "Node_heap_total_heap_size_executable",
  "Node_heap_total_physical_size",
  "Node_heap_used_heap_size",
  "Node_heap_heap_size_limit",
  "Node_heap_malloced_memory",
  "Node_heap_peak_malloced_memory",
  "Node_heap_does_zap_garbage",
  "Node_memory_usage_rss",
  "Node_memory_usage_heap_used",
  "Node_memory_usage_external",
  "Mongo_sessions_count",
  "smtp-host",
  "smtp-port",
  "smtp-tls",
  "outgoing-webhooks",
  "bidirectional-webhooks",
  "outgoingWebhooksPopup-title",
  "custom-head-meta-tags",
  "custom-head-link-tags",
  "custom-head-manifest-content",
  "custom-assetlinks-content",
  "s3-force-path-style",
  "azure-connection-string",
  "azure-container",
  "gcs-project-id",
  "gcs-bucket",
  "test-cloud-connection",
  "s3-access-key-placeholder",
  "s3-region-description",
  "s3-secret-key-placeholder",
  "test-s3-connection"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Toksave:/,key);
  assert.notEqual(data[key],english[key],key);
 }
});

test('Tok Pisin system labels retain identifiers and distinguish metrics and connection types',()=>{
 for(const [key,tokens] of Object.entries({Reactivity_mode:['changeStreams','oplog','polling'],Reactivity_order:['METEOR_REACTIVITY_ORDER'],DDP_transport:['DDP_TRANSPORT'],'custom-assetlinks-content':['assetlinks.json','JSON'],'s3-region-description':['AWS S3','us-east-1']})) for(const token of tokens) assert.ok(data[key].includes(token),key);
 assert.match(data['OS_Freemem'],/fri/);
 assert.match(data['OS_Totalmem'],/Olgeta/);
 assert.match(data['Node_heap_heap_size_limit'],/mak bilong sais/);
 assert.match(data['Node_heap_peak_malloced_memory'],/bikpela tru.*malloc/);
 assert.match(data['Node_heap_used_heap_size'],/yusim pinis/);
 assert.match(data['Node_memory_usage_rss'],/RAM/);
 assert.match(data['s3-secret-key-placeholder'],/hait ki/);
 assert.doesNotMatch(data['s3-access-key-placeholder'],/hait ki/);
 assert.match(data['outgoing-webhooks'],/i go aut/);
 assert.match(data['bidirectional-webhooks'],/i go na i kam/);
 assert.equal(data['outgoing-webhooks'],data['outgoingWebhooksPopup-title']);
});


test('Tok Pisin card and account labels replace prefixed English with intact tokens',()=>{
 const keys=[
  "authentication-method",
  "authentication-type",
  "display-authentication-method",
  "roles",
  "roles-status-role",
  "voting",
  "task",
  "domains",
  "domain",
  "website",
  "person",
  "myCardsViewChange-choice-table",
  "heading-notes",
  "number",
  "sort-boards-custom",
  "card-mark-incomplete",
  "stickers",
  "card-dependencies",
  "dependency-type",
  "dependency-icon",
  "dependency-type-blocks",
  "dependency-type-is-blocked-by",
  "dependency-type-fixes",
  "dependency-type-is-fixed-by",
  "import-dependencies-done",
  "location",
  "location-latitude",
  "location-longitude",
  "location-detect",
  "links-heading",
  "custom-field-stringtemplate-format",
  "creator",
  "creator-on-minicard",
  "filename-invisible-legend",
  "acknowledge",
  "impersonation-admin",
  "reason",
  "subject",
  "details",
  "ticket",
  "tickets",
  "ticket-number",
  "closed",
  "resolved",
  "cancelled",
  "history",
  "request",
  "requests",
  "help-request",
  "confirm-btn",
  "otp",
  "login",
  "login-allow",
  "confirm",
  "logout",
  "accounts-lockout-period",
  "accounts-lockout-failure-window"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Toksave:/,key);
  assert.notEqual(data[key],english[key],key);
 }
});

test('Tok Pisin card and account labels distinguish actions, coordinates and ticket states',()=>{
 assert.equal(data.login,'Go insait');
 assert.equal(data.logout,'Go ausait');
 assert.match(data['card-mark-incomplete'],/i no pinis/);
 assert.match(data['location-latitude'],/not o saut/);
 assert.match(data['location-longitude'],/is o wes/);
 assert.equal(data.closed,'Pasim pinis');
 assert.equal(data.resolved,'Stretim pinis');
 assert.equal(data.cancelled,'Kanselim pinis');
 assert.match(data['accounts-lockout-period'],/tambuim go insait.*seken/);
 assert.match(data['accounts-lockout-failure-window'],/kaunim ol traim i no wok.*seken/);
 assert.match(data['import-dependencies-done'],/__imported__.*__unmatched__/);
 assert.ok(data['custom-field-stringtemplate-format'].includes('%{value}'));
 assert.match(data['filename-invisible-legend'],/^Ret:.*no inap lukim/);
 assert.equal(data['confirm-btn'],data.confirm);
 assert.notEqual(data['dependency-type-blocks'],data['dependency-type-is-blocked-by']);
 assert.notEqual(data['dependency-type-fixes'],data['dependency-type-is-fixed-by']);
});


test('Tok Pisin general controls replace prefixed English with intact tokens',()=>{
 const keys=[
  "unset-color",
  "soft-wip-limit",
  "setWipLimitPopup-title",
  "automatic-linked-url-schemes",
  "package",
  "layout",
  "globalSearch-instructions-notes-1",
  "map-region-europe",
  "wait-spinner",
  "Bounce",
  "Cube",
  "Cube-Grid",
  "Dot",
  "Double-Bounce",
  "Rotateplane",
  "Scaleout",
  "Wave",
  "custom-legal-notice-link-url",
  "legalNotice",
  "originOrder",
  "calculating-counts",
  "stats-scope",
  "stats-count",
  "mongodb-compact-run",
  "path",
  "size",
  "uploading",
  "speed",
  "translation",
  "collapse",
  "uncollapse",
  "support",
  "supportPopup-title",
  "support-content",
  "accessibility",
  "accessibility-content",
  "idle",
  "sandstorm-disk-usage",
  "collections",
  "features-performance",
  "features-security",
  "pause",
  "stop",
  "writable-path",
  "steps",
  "view",
  "has-swimlanes",
  "step-finalize",
  "step-fix-missing-ids",
  "cleanup",
  "filesystem-size",
  "gridfs-size",
  "page",
  "refresh",
  "run-once",
  "schedule",
  "showing",
  "total-size",
  "weight",
  "repositories",
  "repository",
  "size-bytes",
  "last-modified",
  "log",
  "protocol",
  "summary",
  "repairing",
  "wip-limit-group-apply-swimlane"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Toksave:/,key);
  assert.notEqual(data[key],english[key],key);
 }
});

test('Tok Pisin general controls distinguish scope, movement and support content',()=>{
 assert.match(data['soft-wip-limit'],/WIP.*tok lukaut tasol/);
 assert.match(data['automatic-linked-url-schemes'],/URL.*Wanpela.*wan wan lain/);
 assert.equal(data.pause,'Malolo liklik');
 assert.equal(data.stop,'Stopim');
 assert.equal(data.collapse,'Pasim liklik');
 assert.equal(data.uncollapse,'Opim olgeta');
 assert.match(data['run-once'],/wanpela taim/);
 assert.match(data['size-bytes'],/\(bait\)/);
 assert.match(data['total-size'],/^Olgeta/);
 assert.match(data['mongodb-compact-run'],/Compact.*MongoDB/);
 assert.match(data['gridfs-size'],/GridFS/);
 assert.match(data['step-fix-missing-ids'],/ID i no stap/);
 assert.equal(data.support,data['supportPopup-title']);
 assert.match(data['support-content'],/toksave/);
 assert.match(data['wip-limit-group-apply-swimlane'],/rot bilong kat/);
});


test('Tok Pisin search keywords replace prefixed English with intact tokens',()=>{
 const keys=[
  "operator-assignee",
  "operator-creator",
  "operator-due",
  "operator-modified",
  "operator-has",
  "operator-limit",
  "operator-debug",
  "operator-org",
  "operator-customfield",
  "predicate-archived",
  "predicate-ended",
  "predicate-overdue",
  "predicate-quarter",
  "predicate-due",
  "predicate-modified",
  "predicate-start",
  "predicate-end",
  "predicate-assignee",
  "predicate-selector",
  "predicate-projection",
  "operator-number"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Toksave:/,key);
  assert.notEqual(data[key],english[key],key);
  assert.match(data[key],/^[\p{Letter}\p{Mark}]+$/u,key);
 }
});

test('Tok Pisin repaired search operators are registered and do not collide',()=>{
 const fs=require('node:fs');
 const path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../config/query-classes.js'),'utf8');
 const keys=[...source.matchAll(/'(operator-[^']+)': OPERATOR_/g)].map(m=>m[1]);
 const values=keys.map(k=>data[k].toLowerCase());
 assert.equal(new Set(values).size,values.length);
 for(const suffix of ['assignee','creator','due','modified','has','limit','debug','org','customfield','number']){
  const key='operator-'+suffix;
  assert.ok(keys.includes(key));
  const query=data[key]+':test';
  assert.match(query,/^[\p{Letter}\p{Mark}\x27\u2019]+:test$/u);
 }
 assert.notEqual(data['predicate-due'],data['predicate-end']);
 assert.notEqual(data['predicate-start'],data['predicate-end']);
 assert.notEqual(data['predicate-selector'],data['predicate-projection']);
 assert.equal(data['predicate-quarter'],'tripelamun');
 assert.equal(data['operator-assignee'],data['predicate-assignee']);
});

test('Tok Pisin colour labels replace English prefixes without merging shades',()=>{
 const keys=Object.keys(english).filter(k=>k.startsWith('color-'));
 assert.equal(keys.length,25);
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Toksave:/,key);
  assert.notEqual(data[key],english[key],key);
 }
 assert.equal(new Set(keys.map(k=>data[k])).size,keys.length);
 for(const [name,value] of Object.entries({black:'blak',blue:'blu',green:'grin',red:'ret',white:'wait',yellow:'yelo'})) assert.equal(data['color-'+name],value);
 assert.match(data['color-darkgreen'],/grin i tudak/);
 assert.match(data['color-lime'],/grin i lait/);
 assert.match(data['color-navy'],/blu i tudak/);
 assert.match(data['color-sky'],/skai/);
 assert.match(data['color-gray'],/blak.*wait/);
});


test('Tok Pisin analytics removes remaining English-seeding prefixes and retains tokens',()=>{
 const keys=[
  "board-view-blocker-analysis",
  "board-view-size-cycle-time",
  "flow-unknown",
  "flow-cycle-days",
  "flow-age-days",
  "flow-p85",
  "flow-samples",
  "flow-signal",
  "flow-unusual",
  "flow-blocker",
  "flow-episodes",
  "flow-active",
  "flow-blocked-days",
  "flow-unknown-start",
  "flow-target-count",
  "flow-finish-days",
  "flow-history-days",
  "flow-beyond-horizon",
  "flow-size-source",
  "flow-size",
  "flow-details",
  "flow-note-agingWip",
  "flow-note-blockerAnalysis",
  "flow-note-monteCarlo",
  "flow-note-sizeCycleTime",
  "time-adjustments",
  "time-adjustment-note"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
 }
 for(const [key,value] of Object.entries(data)){
  if(key==='import-members-map-note') continue; // Genuine Tok Pisin notice, not an English seed.
  assert.doesNotMatch(value,/Toksave:/,key);
 }
});

test('Tok Pisin analytics preserves forecast caveats, history gaps and fallback meanings',()=>{
 const forecast=data['flow-note-monteCarlo'];
 assert.match(forecast,/2,000.*UTC.*no gat wok i pinis/);
 assert.match(forecast,/bikpela veliu.*liklik veliu/);
 assert.match(forecast,/i no promis/);
 assert.match(forecast,/3,650 de/);
 assert.match(forecast,/no gat wok i pinis, i no gat skelim/);
 assert.match(data['flow-note-agingWip'],/85 pesen.*faivpela taim o moa.*no stap, i no save/);
 assert.match(data['flow-note-blockerAnalysis'],/dilit pinis.*kopi.*stap yet.*wankain taim.*wan wan/);
 assert.match(data['flow-note-sizeCycleTime'],/Planning Poker.*no gat skelim.*de i no stret/);
 assert.match(data['flow-note-sizeCycleTime'],/Stat.*taim bilong mekim.*Pinis.*akaiv/);
 assert.match(data['time-adjustment-note'],/i no ol wan wan taim.*minus.*stretim.*no inap makim husat/);
 assert.match(data['flow-active'],/i no pinis yet/);
 assert.match(data['flow-unusual'],/Ausait/);
});


test('Tok Pisin search help preserves source tokens and removes mixed English prose',()=>{
 const keys=[
  "operator-unknown-error",
  "operator-number-expected",
  "operator-sort-invalid",
  "operator-status-invalid",
  "operator-has-invalid",
  "operator-limit-invalid",
  "operator-debug-invalid",
  "globalSearch-instructions-heading",
  "globalSearch-instructions-description",
  "globalSearch-instructions-operators",
  "globalSearch-instructions-operator-board",
  "globalSearch-instructions-operator-list",
  "globalSearch-instructions-operator-swimlane",
  "globalSearch-instructions-operator-comment",
  "globalSearch-instructions-operator-label",
  "globalSearch-instructions-operator-hash",
  "globalSearch-instructions-operator-user",
  "globalSearch-instructions-operator-at",
  "globalSearch-instructions-operator-member",
  "globalSearch-instructions-operator-assignee",
  "globalSearch-instructions-operator-creator",
  "globalSearch-instructions-operator-org",
  "globalSearch-instructions-operator-team",
  "globalSearch-instructions-operator-due",
  "globalSearch-instructions-operator-created",
  "globalSearch-instructions-operator-modified",
  "globalSearch-instructions-operator-status",
  "globalSearch-instructions-status-archived",
  "globalSearch-instructions-status-all",
  "globalSearch-instructions-status-public",
  "globalSearch-instructions-status-private",
  "globalSearch-instructions-operator-has",
  "globalSearch-instructions-operator-sort",
  "globalSearch-instructions-operator-limit",
  "globalSearch-instructions-notes-2",
  "globalSearch-instructions-notes-3",
  "globalSearch-instructions-notes-3-2",
  "globalSearch-instructions-notes-4",
  "globalSearch-instructions-notes-5",
  "globalSearch-instructions-operator-number"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/where|matching|specified|would return|are returned|should be|expected|is no wanpela/,key);
 }
});

test('Tok Pisin search help distinguishes union, intersection, negation and limits',()=>{
 assert.match(data['globalSearch-instructions-notes-2'],/\*O\*.*wanpela/);
 assert.match(data['globalSearch-instructions-notes-3'],/\*NA\*.*olgeta.*tasol/);
 assert.match(data['globalSearch-instructions-operator-has'],/Putim `-`.*i no gat veliu/);
 assert.ok(data['globalSearch-instructions-operator-has'].includes('`'+data['operator-has']+':-'+data['predicate-due']+'`'));
 for(const key of ['operator-limit-invalid','globalSearch-instructions-operator-limit']) assert.match(data[key],/no gat hap.*bikpela moa long 0/);
 assert.match(data['globalSearch-instructions-operator-sort'],/oda i go daun.*`-`/);
 assert.match(data['globalSearch-instructions-notes-4'],/no skelim bikpela na liklik leta/);
 assert.match(data['globalSearch-instructions-notes-5'],/no painim ol kat long akaiv/);
 assert.match(data['globalSearch-instructions-status-all'],/akaiv.*no stap long akaiv/);
 assert.match(data['globalSearch-instructions-description'],/kolon.*spes.*tupela mak/);
});


test('Tok Pisin account messages preserve tokens and replace mixed English prose',()=>{
 const keys=[
  "email-enrollAccount-subject",
  "email-enrollAccount-text",
  "email-fail",
  "email-fail-text",
  "email-invite",
  "email-invite-subject",
  "email-invite-text",
  "push-invite-title",
  "push-invite-text",
  "email-resetPassword-subject",
  "email-resetPassword-text",
  "email-verifyEmail-subject",
  "email-verifyEmail-text",
  "error-username-taken",
  "error-email-taken",
  "just-invited",
  "import-usernames",
  "email-addresses",
  "email-templates-title",
  "email-templates-activity-body",
  "email-invite-register-subject",
  "email-invite-register-text",
  "email-smtp-test-subject",
  "email-smtp-test-text",
  "allow-invite-to-board",
  "roles-status-invite",
  "invite-people-success",
  "invite-people-error",
  "email-domain-allowed-to-invite",
  "password-again",
  "username-password-required",
  "password-mismatch",
  "username-too-short",
  "list-sync-username-placeholder"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/simply|Please follow|invitation|collaborations|already taken|at least|are i mas|Passwords|while sending/,key);
 }
});

test('Tok Pisin account messages distinguish reset, verification and validation outcomes',()=>{
 assert.match(data['email-resetPassword-text'],/nupela paswot.*klikim/s);
 assert.match(data['email-verifyEmail-text'],/sekim imel bilong akaun/);
 for(const key of ['email-enrollAccount-text','email-resetPassword-text','email-verifyEmail-text','email-invite-text','email-invite-register-text']) assert.ok(data[key].includes('\n\n'));
 assert.equal(data['email-invite-text'],data['push-invite-text']);
 assert.equal(data['email-invite-subject'],data['push-invite-title']);
 assert.match(data['email-invite-register-text'],/__url__.*__icode__/s);
 assert.match(data['password-mismatch'],/Tupela.*no wankain/);
 assert.match(data['username-too-short'],/3 mak o moa/);
 assert.match(data['username-password-required'],/i mas stap/);
 assert.match(data['list-sync-username-placeholder'],/i no mas putim/);
 assert.match(data['invite-people-success'],/i go gut pinis/);
 assert.match(data['invite-people-error'],/^Rong/);
 assert.match(data['email-domain-allowed-to-invite'],/rait.*no ken raitim nem bilong ol yet/);
});


test('Tok Pisin file settings preserve tokens and replace mixed English prose',()=>{
 const keys=[
  "attachment-transfer-limits-title",
  "attachment-transfer-limits-description",
  "attachment-transfer-limits-saved",
  "attachment-transfer-limits-save-failed",
  "attachment-transfer-limits-invalid-value",
  "attachment-upload-limit-label",
  "attachment-download-limit-label",
  "attachment-limit-mode-max-size",
  "attachment-limit-unit-bytes",
  "attachment-count",
  "upload-background",
  "attachment-move-storage-fs",
  "attachment-last-move",
  "attachment-repair-locations",
  "attachment-repair-locations-description",
  "attachment-repair-running",
  "attachment-id",
  "max-upload-filesize",
  "allowed-upload-filetypes",
  "attachment-storage-configuration",
  "attachment-migration",
  "attachment-monitoring",
  "attachment-settings",
  "attachment-storage-settings",
  "upload-repository"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Configure|maximum|Please enter|whose recorded|no longer|filetypes|filesize/,key);
 }
});

test('Tok Pisin file settings distinguish transfer directions, limits and repair behavior',()=>{
 assert.match(data['attachment-upload-limit-label'],/salim i go antap/);
 assert.match(data['attachment-download-limit-label'],/kisim i kam daun/);
 assert.match(data['attachment-transfer-limits-invalid-value'],/bikpela moa long 0/);
 assert.match(data['attachment-transfer-limits-save-failed'],/I no inap seivim/);
 assert.match(data['attachment-transfer-limits-saved'],/pinis/);
 assert.match(data['attachment-transfer-limits-description'],/API.*narapela mak.*seva/);
 assert.match(data['attachment-repair-locations-description'],/GridFS.*no wankain moa.*Stretim detabes.*ples tru/);
 assert.equal(data['attachment-limit-unit-gb'],'GB');
 assert.equal(data['attachment-limit-unit-mb'],'MB');
 assert.equal(data['attachment-limit-unit-bytes'],'Bait');
 assert.match(data['max-upload-filesize'],/bait/);
});


test('Tok Pisin import help preserves tokens and replaces mixed English prose',()=>{
 const keys=[
  "import-board-instruction-kanboard",
  "import-board-instruction-deck",
  "import-board-instruction-openproject",
  "import-board-instruction-issues",
  "import-board-instruction-asana",
  "import-board-instruction-zenkit",
  "import-board-instruction-markdown",
  "import-trello-zip-failed",
  "import-trello-zip-read-failed",
  "import-trello-zip-too-large",
  "import-trello-zip-too-many-files",
  "import-trello-zip-file-too-large",
  "import-trello-zip-unsafe-path",
  "import-trello-workspace-placeholder",
  "import-trello-parent-workspace",
  "import-map-members",
  "import-members-map",
  "import-members-map-note",
  "import-show-user-mapping",
  "import-user-select",
  "import-dependencies-file",
  "import-dependencies-placeholder",
  "import-dependencies-parse-error",
  "import-dependencies-empty",
  "import-board-zip",
  "import-here-instruction",
  "import-not-wekan-export",
  "import-parts-instruction",
  "import-wekan-file"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Could no|too large|Please map|are imported|become|would|contains unsafe/,key);
 }
});

test('Tok Pisin import help preserves schema names and distinguishes failure cases',()=>{
 for(const [suffix,tokens] of Object.entries({kanboard:['columns','tasks','title','description','column_name','swimlane_name','date_due','owner','tags'],deck:['stacks','cards'],openproject:['GET /api/v3/work_packages'],asana:['"data"','GET /tasks','memberships','Done'],zenkit:['"title"','"stages"','"items"'],markdown:['- [ ]','- [x]']})) for(const token of tokens) assert.ok(data['import-board-instruction-'+suffix].includes(token),suffix+': '+token);
 assert.match(data['import-board-instruction-markdown'],/no gat bokis bilong tikim.*no pinis yet/);
 assert.match(data['import-trello-zip-too-many-files'],/planti fail tumas/);
 assert.match(data['import-trello-zip-file-too-large'],/Wanpela fail insait/);
 assert.match(data['import-trello-zip-unsafe-path'],/rot bilong fail i no seif.*no kisim/);
 assert.match(data['import-members-map-note'],/no gat link.*yusa bilong nau/);
 assert.match(data['import-parts-instruction'],/mak tik tasol.*wankain mak.*salim i go aut/);
 assert.match(data['import-dependencies-empty'],/wanpela lain o moa/);
});

test('Tok Pisin export options preserve tokens, roles, dates and failure meaning',()=>{
 const keys=['export-card-excel-fields','export-card-field-people','export-card-field-board-info','export-card-field-dates','export-card-attachment-uploaded-at','export-card-attachment-image-previews','export-card-excel-no-disk-space','export-monitoring','export-select-what-to-include','export-card-details'];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/fields|include|People|Info|Dates|Uploaded|Previews|Cannot|Monitoring|details/,key);
 }
 assert.match(data['export-card-field-people'],/man i bin mekim.*papa bilong en.*memba.*kisim wok/);
 assert.match(data['export-card-field-dates'],/mekim, kisim, stat, taim wok i mas pinis, pinis/);
 assert.match(data['export-card-excel-no-disk-space'],/I no inap.*Excel.*no gat inap.*disk/);
 assert.match(data['export-card-attachment-uploaded-at'],/^Taim/);
 assert.match(data['export-card-excel-fields'],/Excel/);
 assert.match(data['export-card-details'],/wan wan kat/);
});

test('Tok Pisin external export instructions retain actual menu names and API paths',()=>{
 const keys=['import-board-instruction-trello','import-board-instruction-jira','import-board-instruction-wekan','import-trello-json-file-hint','import-trello-zip-file-hint','import-trello-zip-no-boards','import-trello-failed'];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const literal of ['Menu','More','Print and Export','Export JSON']) assert.ok(data['import-board-instruction-trello'].includes(literal));
 for(const literal of ['GET /rest/api/2/search','"issues"','"automationRules"']) assert.ok(data['import-board-instruction-jira'].includes(literal));
 assert.doesNotMatch(data['import-board-instruction-jira'],/\/api\/2\/painim/);
 assert.ok(data['import-board-instruction-wekan'].includes(data['export-board']));
 assert.match(data['import-trello-json-file-hint'],/Sapos.*ki na token.*tu bai kam daun/);
 assert.match(data['import-trello-zip-file-hint'],/Trello Card Attachments Downloader.*Olgeta bot/);
 assert.match(data['import-trello-zip-no-boards'],/no painim.*\.json.*\.zip/);
});


test('Tok Pisin deletion and restoration messages preserve tokens and replace English prose',()=>{
 const keys=[
  "list-delete-pop",
  "list-delete-suggest-archive",
  "board-delete-notice",
  "delete-board-confirm-popup",
  "delete-all-notifications-confirm",
  "delete-duplicate-lists",
  "delete-duplicate-lists-confirm",
  "swimlane-delete-pop",
  "delete-user-confirm-popup",
  "delete-team-confirm-popup",
  "delete-org-confirm-popup",
  "delete-linked-card-before-this-card",
  "delete-linked-cards-before-this-list",
  "delete-org-warning-message",
  "delete-team-warning-message",
  "delete-translation-confirm-popup",
  "delete-duplicate-empty-lists-migration",
  "delete-duplicate-empty-lists-migration-description",
  "restore-lost-cards-migration",
  "restore-lost-cards-migration-description",
  "restore-all-archived-migration",
  "restore-all-archived-migration-description",
  "restore-lost-cards-nothing-to-restore",
  "restore-list-swimlanes-done"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/There is|won't|cannot|contains|missing|Automatically|Deleting/,key);
 }
});

test('Tok Pisin destructive-action warnings retain restrictions and restoration failures',()=>{
 for(const key of ['delete-user-confirm-popup','delete-team-confirm-popup','delete-org-confirm-popup','delete-translation-confirm-popup','list-delete-pop','swimlane-delete-pop','delete-board-confirm-popup']) assert.match(data[key],/no inap kisim bek/);
 assert.match(data['delete-duplicate-empty-lists-migration-description'],/no gat kat NA narapela lis.*wankain nem.*gat kat/);
 for(const kind of ['org','team']) assert.match(data['delete-'+kind+'-warning-message'],/no inap rausim.*wanpela yusa o moa/);
 assert.match(data['delete-linked-cards-before-this-list'],/no inap rausim.*bipo.*link i go long ol kat/);
 for(const key of ['restore-lost-cards-migration-description','restore-all-archived-migration-description']){
  assert.ok(data[key].includes('swimlaneId'));
  assert.ok(data[key].includes('listId'));
 }
 assert.match(data['restore-list-swimlanes-done'],/__restored__.*no inap kisim __remaining__/);
 assert.match(data['list-delete-suggest-archive'],/akaiv.*holim ol wok/);
});


test('Tok Pisin custom-field messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "createCustomField",
  "createCustomFieldPopup-title",
  "custom-field-delete-pop",
  "custom-field-dropdown-options",
  "custom-field-dropdown-options-placeholder",
  "custom-field-dropdownMultiSelect",
  "editCustomFieldPopup-title",
  "filter-custom-fields-label",
  "activity-set-customfield",
  "activity-unset-customfield",
  "custom-field-stringtemplate",
  "custom-field-stringtemplate-separator",
  "custom-field-stringtemplate-item-placeholder"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/There is|destroy|Press enter|more items|Dropdown|String templet|Separator|Sivim by/,key);
 }
});

test('Tok Pisin custom-field controls retain deletion scope and formatting instructions',()=>{
 assert.match(data['custom-field-delete-pop'],/no inap kisim bek.*olgeta kat.*olgeta rekot/);
 assert.match(data['custom-field-dropdownMultiSelect'],/makim planti/);
 assert.doesNotMatch(data['custom-field-dropdownMultiSelect'],/planim/);
 assert.match(data['custom-field-dropdown-options-placeholder'],/Presim Enter/);
 assert.match(data['custom-field-stringtemplate-item-placeholder'],/Presim Enter/);
 for(const literal of ['&#32;','&nbsp;']) assert.ok(data['custom-field-stringtemplate-separator'].includes(literal));
 assert.match(data['activity-set-customfield'],/'%s'.*'%s'.*%s/);
 assert.match(data['activity-unset-customfield'],/rausim veliu/);
 assert.equal(data.createCustomField,data['createCustomFieldPopup-title']);
});


test('Tok Pisin notifications preserve tokens and distinguish delivery and read states',()=>{
 const keys=[
  "notify-participate",
  "notify-watch",
  "watching-info",
  "mark-all-as-read",
  "mark-all-as-unread",
  "remove-all-read",
  "act-almostdue",
  "act-pastdue",
  "act-duenow",
  "act-atUserComment"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/updates|participate|notified|Mark|unread|Was reminding|Mentioned/,key);
 }
 assert.match(data['mark-all-as-read'],/olgeta olsem ritim pinis/);
 assert.match(data['mark-all-as-unread'],/olgeta olsem i no ritim yet/);
 assert.match(data['remove-all-read'],/Rausim olgeta yu ritim pinis/);
 assert.match(data['notify-participate'],/man i bin mekim o memba/);
 assert.match(data['notify-watch'],/bot, lis o kat/);
 assert.match(data['act-almostdue'],/i klostu$/);
 assert.match(data['act-pastdue'],/i lus pinis$/);
 assert.match(data['act-duenow'],/em nau$/);
});


test('Tok Pisin checklist and subtask messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "default-subtasks-board",
  "subtask-settings",
  "boardSubtaskSettingsPopup-title",
  "deposit-subtasks-board",
  "deposit-subtasks-list",
  "checklist-count-on-minicard",
  "checklist-count",
  "hide-finished-checklist",
  "checklistActionsPopup-title",
  "newlineBecomesNewChecklistItem",
  "newlineBecomesNewChecklistItemOriginOrder",
  "subtaskActionsPopup-title",
  "show-subtasks-field",
  "collapse-checklist",
  "expand-checklist",
  "hideCheckedChecklistItems",
  "checklist-reset-interval-none",
  "checklist-ding-sound-description"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Subtasks|Deposit|Landing|Each line|becomes|finished|Collapse|Expand|checked/,key);
 }
});

test('Tok Pisin checklist controls retain completion filters, order and disabled defaults',()=>{
 assert.match(data['hide-finished-checklist'],/lis bilong sekim i pinis/);
 assert.match(data.hideCheckedChecklistItems,/samting i gat mak tik/);
 assert.match(data['checklist-reset-interval-none'],/I no wok.*no ken risetim/);
 assert.match(data['checklist-ding-sound-description'],/olsem pinis.*Long stat dispela i no wok/);
 assert.match(data['collapse-checklist'],/^Pasim.*liklik/);
 assert.match(data['expand-checklist'],/^Opim.*olgeta/);
 for(const key of ['checklist-count','checklist-count-on-minicard']) assert.ok(data[key].includes('(0/0)'));
 assert.match(data.newlineBecomesNewChecklistItemOriginOrder,/oda bilong pastaim/);
 assert.match(data.newlineBecomesNewChecklistItem,/Wan wan lain.*wanpela samting/);
 assert.equal(data['subtask-settings'],data['boardSubtaskSettingsPopup-title']);
 assert.match(data['deposit-subtasks-board'],/bot:/);
 assert.match(data['deposit-subtasks-list'],/^Lis/);
});


test('Tok Pisin role messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "board-members-same-org-only",
  "board-members-same-team-only",
  "comment-only-desc",
  "read-only-desc",
  "normal-desc",
  "normal-assigned-only",
  "normal-assigned-only-desc",
  "board-member-list",
  "roles-info",
  "roles-status",
  "roles-status-desc",
  "roles-status-sees",
  "roles-status-manage",
  "roles-status-sees-assigned",
  "roles-status-empty",
  "admin-people-filter-locked",
  "admin-people-active-status",
  "admin-people-user-active",
  "admin-people-user-inactive"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Can |Can't|Assigned|Choose which|allowed|cannot|What each|checkboxes|Locked|deactivate|activate/,key);
 }
});

test('Tok Pisin role descriptions retain permission boundaries and account actions',()=>{
 assert.match(data['read-only-desc'],/lukim.*tasol.*no inap senisim/);
 assert.match(data['comment-only-desc'],/koment.*tasol/);
 assert.match(data['normal-desc'],/lukim na senisim ol kat.*no inap senisim ol seting/);
 assert.match(data['normal-assigned-only-desc'],/givim wok long yu tasol/);
 assert.match(data['roles-info'],/olgeta rait oltaim.*no inap pasim/);
 assert.match(data['roles-status-desc'],/ritim tasol.*bipo long yu seivim/);
 assert.match(data['admin-people-user-active'],/i wok.*mekim i no wok/);
 assert.match(data['admin-people-user-inactive'],/i no wok.*mekim i wok/);
 for(const suffix of ['org','team']) assert.match(data['board-members-same-'+suffix+'-only'],/wankain.*tasol/);
});
