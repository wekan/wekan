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


test('Tok Pisin date and time messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "date-format",
  "start-day-of-week",
  "due-complete",
  "start-time",
  "editCardSpentTimePopup-title",
  "spent-time-hours",
  "has-overtime-cards",
  "has-spenttime-cards",
  "card-received-on",
  "editCardReceivedDatePopup-title",
  "editCardDueDatePopup-title",
  "editCardEndDatePopup-title",
  "r-w-set-received-now",
  "r-when-a-received-date-changed",
  "act-a-receivedAt",
  "a-receivedAt",
  "board-status-time-spent-total",
  "board-status-overtime-cards",
  "activity-receivedDate"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Spent|spent|hours|Modified|Start taim|Det Format|Has overtime|Set kisim/,key);
 }
});

test('Tok Pisin date labels distinguish due, end, received and spent time',()=>{
 assert.match(data['editCardDueDatePopup-title'],/wok i mas pinis/);
 assert.doesNotMatch(data['editCardEndDatePopup-title'],/mas pinis/);
 assert.match(data['editCardEndDatePopup-title'],/wok i pinis/);
 assert.match(data['spent-time-hours'],/\(aua\)/);
 assert.match(data['r-when-a-received-date-changed'],/makim o senisim/);
 assert.match(data['r-w-set-received-now'],/nau$/);
 assert.match(data['act-a-receivedAt'],/i go long __timeValue__ i kam long \(__timeOldValue__\)/);
 assert.match(data['board-status-time-spent-total'],/^Olgeta/);
 assert.match(data['start-day-of-week'],/stat bilong wik/);
 for(const format of ['yyyy-mm-dd','dd-mm-yyyy','mm-dd-yyyy']) assert.equal(data['date-format-'+format],english['date-format-'+format]);
});


test('Tok Pisin movement messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "move-card-up",
  "move-card-down",
  "move-list-left",
  "move-list-right",
  "copy-card-link-to-clipboard",
  "copy-link-to-clipboard",
  "copy-text-to-clipboard",
  "copy-to-clipboard",
  "copyManyCardsPopup-title",
  "copyManyCardsPopup-instructions",
  "copyManyCardsPopup-format",
  "move-selection",
  "copy-selection",
  "moveCardToBottom-title",
  "moveCardToTop-title",
  "moveSelectionPopup-title",
  "copySelectionPopup-title",
  "move-all-attachments-to-fs",
  "move-all-attachments-of-board-to-fs",
  "move-attachments-none-found",
  "convert-to-markdown",
  "converting-board",
  "converting-board-description",
  "move-reason"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Destination|Titles|Descriptions|selection|Bottom|Top|Nothing is|Converting|improved functionality/,key);
 }
});

test('Tok Pisin movement controls retain directions, selection and valid JSON examples',()=>{
 assert.match(data['move-card-up'],/antap$/);
 assert.match(data['move-card-down'],/daun$/);
 assert.match(data['move-list-left'],/han kais$/);
 assert.match(data['move-list-right'],/han sut$/);
 assert.match(data['moveCardToBottom-title'],/daun tru$/);
 assert.match(data['moveCardToTop-title'],/antap tru$/);
 assert.equal(data['move-selection'],data['moveSelectionPopup-title']);
 assert.equal(data['copy-selection'],data['copySelectionPopup-title']);
 assert.match(data['move-reason'],/i no mas putim/);
 assert.match(data['move-attachments-none-found'],/no gat samting.*sos.*no gat samting bilong muvim/);
 const example=JSON.parse(data['copyManyCardsPopup-format']);
 assert.equal(example.length,3);
 for(const card of example) assert.deepEqual(Object.keys(card),['title','description']);
 assert.match(example[0].title,/fes/);
 assert.match(example[1].title,/namba tu/);
 assert.match(example[2].title,/las/);
});


test('Tok Pisin rule-builder messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "r-add-trigger",
  "r-board-rules",
  "r-add-rule",
  "r-delete-rule",
  "r-new-rule-name",
  "r-no-rules",
  "r-edit-rule",
  "r-workflow-help",
  "r-drop-trigger",
  "r-w-card-created",
  "r-w-card-archived",
  "r-w-card-unarchived",
  "r-w-label-added",
  "r-w-label-removed",
  "r-w-member-added",
  "r-w-member-removed",
  "r-w-checklist-added",
  "r-w-attachment-added",
  "r-export-json",
  "r-export-csv",
  "r-import-json",
  "r-import-csv",
  "r-import-trello",
  "r-import-paste",
  "r-import-trello-note",
  "r-import-workflow-note",
  "r-when-due",
  "r-when-card-in-list",
  "r-set-date-relative",
  "r-when-a-card",
  "r-is",
  "r-when-a-label-is"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/Drag|Drop|When|trigger|exported rules|unmapped|best effort| is /,key);
 }
});

test('Tok Pisin automation wording retains trigger directions and import limitations',()=>{
 assert.match(data['r-w-card-archived'],/i go long akaiv/);
 assert.match(data['r-w-card-unarchived'],/i kam bek long akaiv/);
 for(const kind of ['label','member']){
  assert.match(data['r-w-'+kind+'-added'],/i go insait/);
  assert.match(data['r-w-'+kind+'-removed'],/i raus/);
 }
 for(const format of ['json','csv']){
  assert.match(data['r-export-'+format],/i go aut/);
  assert.match(data['r-import-'+format],/i kam insait/);
  assert.ok(data['r-import-'+format].includes(format.toUpperCase()));
 }
 assert.match(data['r-import-trello-note'],/i no gat ol rul bilong Butler.*no gat link.*ripot/);
 assert.match(data['r-import-workflow-note'],/n8n o Node-RED.*no gat link.*ripot/);
 assert.match(data['r-workflow-help'],/rul i stap pinis.*senisim/);
 assert.equal(data['r-is'],'i');
});


test('Tok Pisin rule actions preserve tokens and replace mixed English',()=>{
 const keys=[
  "r-when-the-label",
  "r-when-a-member",
  "r-when-the-member",
  "r-when-a-assignee",
  "r-when-the-assignee",
  "r-when-a-attach",
  "r-when-a-checklist",
  "r-when-the-checklist",
  "r-when-a-item",
  "r-when-the-item",
  "r-set-color",
  "r-to",
  "r-d-send-email-to",
  "r-when-a-card-is-moved",
  "r-drop-action",
  "r-w-every-day-at",
  "r-days-before",
  "r-days-after",
  "r-d-move-to-top-gen",
  "r-d-move-to-top-spec",
  "r-d-move-to-bottom-gen",
  "r-d-move-to-bottom-spec",
  "r-d-check-all",
  "r-d-uncheck-all",
  "r-datefield"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/When|Set kala|Drop|Every day|Days|top|bottom|its|Check|Uncheck|items|Det field/,key);
 }
});

test('Tok Pisin rule action wording retains scope, positions and time direction',()=>{
 for(const scope of ['gen','spec']){
  assert.match(data['r-d-move-to-top-'+scope],/antap tru/);
  assert.match(data['r-d-move-to-bottom-'+scope],/daun tru/);
 }
 for(const pos of ['top','bottom']){
  assert.match(data['r-d-move-to-'+pos+'-gen'],/lis bilong en/);
  assert.doesNotMatch(data['r-d-move-to-'+pos+'-spec'],/bilong en/);
 }
 assert.match(data['r-d-check-all'],/^Putim mak.*olgeta samting/);
 assert.match(data['r-d-uncheck-all'],/^Rausim mak.*olgeta samting/);
 assert.match(data['r-days-before'],/bipo/);
 assert.match(data['r-days-after'],/bihain/);
 assert.match(data['r-w-every-day-at'],/olgeta de.*__time__/);
 assert.match(data['r-when-a-card-is-moved'],/narapela lis/);
 assert.equal(data['r-to'],data['r-d-send-email-to']);
});


test('Tok Pisin error messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "no-comments-desc",
  "error-board-doesNotExist",
  "error-watch-disabled",
  "error-notAllowed",
  "error-json-malformed",
  "error-json-schema",
  "error-csv-schema",
  "error-import-empty-board",
  "error-list-doesNotExist",
  "error-linked-card-not-allowed",
  "error-user-disabled",
  "error-user-doesNotExist",
  "error-user-notAllowSelf",
  "error-user-notCreated",
  "error-orgname-taken",
  "error-teamname-taken",
  "invalid-year",
  "error-notAuthorized",
  "invalid-domain",
  "invalid-file",
  "no-issues-found",
  "no-repositories"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/does no|already taken|Please|authorized|If filename|Use wanpela|issues found|repositories found/,key);
 }
});

test('Tok Pisin error wording retains restrictions and recovery instructions',()=>{
 for(const object of ['board','list','user']) assert.match(data['error-'+object+'-doesNotExist'],/i no stap$/);
 assert.match(data['error-notAuthorized'],/no gat rait/);
 assert.match(data['error-user-notAllowSelf'],/no ken.*yu yet/);
 assert.match(data['invalid-year'],/fopela namba.*2026/);
 assert.match(data['invalid-domain'],/example\.com.*no gat @ o spes/);
 assert.match(data['invalid-file'],/salim i go antap o senisim nem bai kansel/);
 assert.match(data['error-import-empty-board'],/olpela vesen.*salim bot i go aut gen.*vesen bilong nau.*nupela fail/);
 assert.match(data['error-linked-card-not-allowed'],/kat bilong oltaim tasol.*Yu no ken.*link i kam bek.*pasim rot/);
 assert.match(data['error-csv-schema'],/CSV.*koma.*TSV.*tab/);
});


test('Tok Pisin sharing messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "page-maybe-private",
  "private",
  "private-desc",
  "public-desc",
  "custom-private-desc",
  "custom-private-desc-placeholder",
  "custom-public-desc",
  "custom-public-desc-placeholder",
  "org-shared-templates",
  "team-shared-templates",
  "share-template-with",
  "drag-template-here-to-share",
  "shared-templates",
  "shared-templates-info",
  "shared-templates-select-scope",
  "no-shared-templates",
  "change-visibility",
  "step-convert-shared-lists"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(data[key],/It's visible|Only people|Shared|shareable|Browse|Select|Visibility|Convert|may be/,key);
 }
});

test('Tok Pisin sharing wording retains public visibility and member-only editing',()=>{
 assert.match(data['private-desc'],/putim long bot tasol inap lukim na senisim/);
 assert.match(data['public-desc'],/Olgeta manmeri i gat link inap lukim.*Google.*putim long bot tasol inap senisim/);
 assert.equal(data.private,'Praivet');
 assert.match(data['page-maybe-private'],/<a href='%s'>go insait<\/a>/);
 for(const kind of ['public','private']) assert.match(data['custom-'+kind+'-desc-placeholder'],/Larim i stap nating.*i stap pinis/);
 assert.match(data['shared-templates-info'],/oganaisesen, tim o domen.*wanpela hap o moa.*gat samting.*tasol/);
 assert.match(data['shared-templates-select-scope'],/Makim wanpela hap antap/);
 assert.equal(data['org-shared-templates'],data['team-shared-templates']);
});


test('Tok Pisin filter and sorting labels retain tokens without mixed English',()=>{
 const keys=[
  "remove-sort",
  "sort-desc",
  "list-sort-by",
  "list-label-modifiedAt",
  "list-label-sort",
  "filter",
  "filter-dates-label",
  "filter-due-today",
  "filter-due-this-week",
  "filter-due-next-week",
  "filter-due-tomorrow",
  "list-filter-label",
  "filter-clear",
  "filter-labels-label",
  "filter-member-label",
  "filter-assignee-label",
  "filter-no-assignee",
  "filter-show-archive",
  "filter-hide-empty",
  "filter-on",
  "filter-on-desc",
  "filter-to-selection",
  "shortcut-clear-filters",
  "shortcut-filter-my-cards",
  "shortcut-filter-my-assigned-cards",
  "shortcut-toggle-filterbar",
  "set-filter",
  "filter-by-unread",
  "sort-boards-title-asc",
  "sort-boards-title-desc",
  "sort-is-on",
  "filter-dependencies-label",
  "filter-invisible-filenames",
  "filter-card-title-label"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:by|Due|Clear|assignee|archived|selection|Toggle|Unread|dependencies|filenames|invisible|Access|Manual|Order)\b/,key);
 }
});

test('Tok Pisin filters distinguish assignments, visibility and alphabetical endpoints',()=>{
 for(const when of ['today','tomorrow','this-week','next-week']) assert.match(data['filter-due-'+when],/^Wok i mas pinis/);
 assert.match(data['filter-no-assignee'],/^I no gat manmeri i kisim wok$/);
 assert.match(data['shortcut-filter-my-assigned-cards'],/mi kisim wok/);
 assert.match(data['filter-show-archive'],/^Soim.*akaiv$/);
 assert.match(data['filter-hide-empty'],/^Haitim.*i no gat samting$/);
 assert.match(data['filter-to-selection'],/yu makim tasol$/);
 assert.match(data['shortcut-toggle-filterbar'],/^Soim o haitim/);
 assert.match(data['filter-invisible-filenames'],/nem bilong fail.*no inap lukim tasol$/);
 assert.match(data['sort-boards-title-asc'],/\(A → Z\)$/);
 assert.match(data['sort-boards-title-desc'],/\(Z → A\)$/);
 assert.doesNotMatch(data['sort-boards-title-asc']+data['sort-boards-title-desc'],/wanpela/);
});


test('Tok Pisin labels and compact card controls replace mixed English and preserve tokens',()=>{
 const keys=[
  "label-delete-pop",
  "multi-selection-label",
  "multi-selection-member",
  "toggle-labels",
  "remove-labels-multiselect",
  "api-upload-limit-label",
  "api-download-limit-label",
  "show-parent-in-minicard",
  "description-on-minicard",
  "cover-attachment-on-minicard",
  "badge-attachment-on-minicard",
  "card-sorting-by-number-on-minicard",
  "r-button-label",
  "hide-minicard-label-text",
  "label-colors",
  "label-names",
  "add-teams-label",
  "add-organizations-label"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/There|undo|destroy|selection|Toggle|Multi-Selection|adds|removes|\bmax\b|\bsize\b|parent|\bin\b|\bon\b|Count|sorting|Button|Colors|Names|are displayed/,key);
 }
});

test('Tok Pisin label instructions distinguish toggle, bulk addition and bulk removal',()=>{
 assert.match(data['label-delete-pop'],/no inap kisim bek.*olgeta kat.*histori bilong en olgeta/);
 assert.match(data['toggle-labels'],/^Putim o rausim ol mak 1-9.*planti kat wantaim.*putim ol mak 1-9/);
 assert.match(data['remove-labels-multiselect'],/planti kat wantaim.*rausim ol mak 1-9/);
 assert.match(data['api-upload-limit-label'],/Bikpela tru sais.*salim i go antap.*API/);
 assert.match(data['api-download-limit-label'],/Bikpela tru sais.*kisim i kam daun.*API/);
 assert.match(data['badge-attachment-on-minicard'],/^Hamas fail i pas/);
 assert.match(data['hide-minicard-label-text'],/^Haitim rait bilong mak/);
 for(const type of ['teams','organizations']) assert.match(data['add-'+type+'-label'],/yu putim pinis i stap aninit:$/);
});


test('Tok Pisin remaining help and migration instructions preserve source tokens',()=>{
 const keys=[
  "advanced-filter-description",
  "import-timeout",
  "trello-api-credentials-required",
  "list-archive-cards-pop",
  "muted-info",
  "remove-member-pop",
  "show-cards-minimum-count",
  "star-board-title",
  "wipLimitErrorPopup-dialog-pt2",
  "open-many-cards-at-once-description",
  "server-error-troubleshooting",
  "recovery-maintenance-note",
  "backup-scope-description",
  "run-comprehensive-migration-confirm",
  "run-delete-duplicate-empty-lists-migration-confirm",
  "run-restore-lost-cards-migration-confirm",
  "run-restore-all-archived-migration-confirm",
  "run-fix-missing-lists-migration-confirm",
  "run-fix-avatar-urls-migration-confirm",
  "run-fix-all-file-urls-migration-confirm",
  "migration-progress-note",
  "conversion-info-text",
  "migration-warning-text",
  "account-locked",
  "problems-summary-help"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Please|allows|following|contains|will|should|using|without|normally|Continue|automatically)\b/,key);
 }
});

test('Tok Pisin advanced filter examples and troubleshooting commands remain executable text',()=>{
 const examples=["== != <= >= && || ( )", "Field1 == Value1", "'Field 1' == 'Value 1'", "Field1 == I\\'m", "F1 == V1 || F1 == V2", "F1 == V1 && ( F2 == V2 || F2 == V3 )", "F1 == /Tes.*/i"];
 for(const example of examples){assert.ok(english['advanced-filter-description'].includes(example),example);assert.ok(data['advanced-filter-description'].includes(example),example);}
 assert.deepEqual(data['server-error-troubleshooting'].match(/`[^`]+`/g),english['server-error-troubleshooting'].match(/`[^`]+`/g));
 assert.equal(data['server-error-troubleshooting'].split('\n').length,3);
 assert.match(data['run-restore-lost-cards-migration-confirm'],/swimlaneId o listId.*no stap long akaiv tasol/);
 assert.match(data['run-restore-all-archived-migration-confirm'],/OLGETA.*akaiv.*hatwok/);
 assert.match(data['backup-scope-description'],/no gat ol akaun.*seting.*bot bilong dispela oganaisesen tasol/);
 assert.match(data['run-delete-duplicate-empty-lists-migration-confirm'],/pastaim.*Bihain.*wankain nem na i gat ol kat/);
 assert.match(data['migration-warning-text'],/No ken pasim brausa.*go het long baksait.*longpela taim moa/);
});


test('Tok Pisin help references the translated menu and acknowledgment controls',()=>{
 assert.ok(data['list-archive-cards-pop'].includes('“'+data.menu+'” > “'+data.archive+'”'));
 assert.ok(data['problems-summary-help'].includes('“'+data.acknowledge+'”'));
});


test('Tok Pisin administration descriptions retain tokens and replace mixed English',()=>{
 const keys=[
  "trello-cancel-delete-confirm",
  "set-default-board-title",
  "unset-default-board-title",
  "r-board-note",
  "mongodb-compact-description",
  "mongodb-compact-warning",
  "sandstorm-delete-raw-mongodb-description",
  "sandstorm-delete-raw-mongodb-confirm",
  "cards-loading-description",
  "render-links-as-plain-text-description",
  "always-show-code-as-text-description",
  "anonymize-import-users-description",
  "anonymize-export-users-description",
  "anonymize-account-confirm-popup",
  "disable-watch-description",
  "repair-broken-cards-done-unfixable"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:When|This|cannot|Only|every|automatically|replaces|contains|Default|Running)\b/,key);
 }
});

test('Tok Pisin privacy and storage instructions retain critical distinctions',()=>{
 const account=data['anonymize-account-confirm-popup'];
 assert.match(account,/inap oltaim.*rausim piksa.*pasim rot bilong go insait/);
 assert.match(account,/no rausim akaun.*holim histori.*akaun yet.*no inap senisim/);
 assert.notEqual(account,data['anonymize-export-users-description']);
 for(const direction of ['import','export']){
  const value=data['anonymize-'+direction+'-users-description'];
  for(const token of ['user1, user2, ...','@username','requested-by / assigned-by']) assert.ok(value.includes(token),token);
  assert.match(value,/i no wok long stat/);
 }
 assert.match(data['cards-loading-description'],/CARDS_LOADING \(all\/lazy\/auto\).*CARDS_LOADING_LAZY_THRESHOLD/);
 assert.match(data['mongodb-compact-warning'],/secondary pastaim.*bihain long primary.*wanpela nod.*primary tasol/);
 assert.match(data['mongodb-compact-description'],/bihain tasol.*movim planti fail i pinis/);
 for(const type of ['description','confirm']) assert.match(data['sandstorm-delete-raw-mongodb-'+type],/FerretDB.*sistem bilong ol fail.*no inap senisim/);
 assert.ok(data['render-links-as-plain-text-description'].includes('[label](url)'));
 assert.ok(data['render-links-as-plain-text-description'].includes('<a href>'));
 assert.match(data['always-show-code-as-text-description'],/<!-- -->.*no inap klikim.*no ran/);
});


test('Tok Pisin access and import messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "close-board-pop",
  "enable-permanent-delete-description",
  "user-can-not-export-excel",
  "user-can-not-export-card-to-pdf",
  "user-can-not-export-card-to-excel",
  "import-board-instruction-excel",
  "import-board-instruction-about-errors",
  "trello-api-credentials-saved",
  "tracking-info",
  "unsaved-description",
  "warn-list-archived",
  "wipLimitErrorPopup-dialog-pt1",
  "avatars-upload-blocked-description",
  "MongoDB_Oplog_enabled",
  "org-domains-description",
  "org-admins-description",
  "card-sorting-by-number",
  "r-sort-by",
  "r-by",
  "r-checklist-note",
  "org-number",
  "team-number",
  "people-number",
  "almostdue",
  "pastdue",
  "duenow",
  "dueCardsViewChange-choice-all-description",
  "globalSearchViewChange-choice-all-description"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Allow|Choose|Shows|Number|enabled|approaching|who|which|have|higher|uploading|served|replaces)\b/,key);
 }
});

test('Tok Pisin access help retains permission limits and literal import identifiers',()=>{
 assert.match(data['org-admins-description'],/tasol.*no inap givim rait Admin.*no inap bosim/);
 assert.match(data['enable-permanent-delete-description'],/em yet i no rausim wanpela samting/);
 for(const token of ['a.example.com','kanban.example.org','MULTITENANCY=true']) assert.ok(data['org-domains-description'].includes(token),token);
 for(const column of ['Title','Description','Status/List','Members','Labels']) assert.ok(data['import-board-instruction-excel'].includes(column),column);
 assert.match(data['import-board-instruction-excel'],/Fes lain.*nem bilong kolum/);
 assert.match(data['dueCardsViewChange-choice-all-description'],/no pinis yet.*gat rait long lukim/);
 assert.match(data['globalSearchViewChange-choice-all-description'],/gat rait long lukim.*memba.*kisim wok.*tasol/);
 assert.ok(data['globalSearchViewChange-choice-all-description'].includes('*'+data['globalSearchViewChange-choice-me']+'*'));
 assert.match(data['almostdue'],/kam klostu$/);
 assert.match(data['pastdue'],/lus pinis$/);
 assert.match(data['duenow'],/em tude$/);
});


test('Tok Pisin status and reporting messages preserve tokens and replace mixed English',()=>{
 const keys=[
  "set-color-list",
  "set-wip-limit-value",
  "setCardColorPopup-title",
  "setSelectionColorPopup-title",
  "dueCards-noResults-description",
  "set-as-active",
  "background-too-big",
  "now-activities-of-all-boards-are-hidden",
  "office-report-desc",
  "office-no-results",
  "api-report-desc",
  "api-no-calls",
  "recovery-no-events",
  "default-save-storage-description",
  "if-you-already-have-an-account",
  "translation-number",
  "support-info-not-added-yet",
  "support-info-only-for-logged-in-users",
  "accessibility-info-not-added-yet",
  "accounts-lockout-info",
  "accounts-lockout-no-locked-users",
  "accounts-lockout-user-locked"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Set|Show|Choose|Background|Maximum|Now|Where|Each|Nobody|Which|There|Number|Support|Accessibility|logged|recorded|locked)\b/,key);
 }
});

test('Tok Pisin report descriptions retain scope, limits and configuration syntax',()=>{
 assert.deepEqual(data['background-too-big'].match(/{{[^}]+}}/g),english['background-too-big'].match(/{{[^}]+}}/g));
 assert.match(data['office-report-desc'],/wanwan manmeri.*IPv4 o IPv6.*sapos dispela save i stap.*hamas taim/);
 assert.match(data['api-report-desc'],/Wanpela lain bilong wanwan akaun na endpoint.*hap taim.*i no wanpela lain bilong wanwan rikwes/);
 assert.match(data['api-no-calls'],/no gat rekot.*no wok sapos yu no setim WITH_API=true/);
 assert.match(data['support-info-only-for-logged-in-users'],/go insait pinis tasol/);
 assert.match(data['accounts-lockout-no-locked-users'],/no gat yusa i lok/);
 assert.match(data['accounts-lockout-user-locked'],/^Yusa i lok$/);
 assert.match(data['dueCards-noResults-description'],/no gat kat.*de bilong pinisim wok/);
});


test('Tok Pisin S3 and Sandstorm messages preserve source tokens and replace English prose',()=>{
 const keys=[
  "sandstorm-remove-member-warning",
  "s3-file-id",
  "s3-minio-storage-description",
  "s3-force-path-style-description",
  "sandstorm-migration-description",
  "sandstorm-migration-status",
  "sandstorm-migration-pending",
  "sandstorm-raw-mongodb",
  "sandstorm-delete-raw-mongodb",
  "sandstorm-raw-mongodb-deleted",
  "s3-endpoint-menu-path",
  "s3-region-menu-path",
  "s3-bucket-menu-path",
  "s3-access-key-menu-path",
  "s3-secret-key-menu-path",
  "s3-disabled",
  "s3-access-key",
  "s3-access-key-description",
  "s3-bucket",
  "s3-bucket-description",
  "s3-connection-failed",
  "s3-connection-success",
  "s3-enabled",
  "s3-enabled-description",
  "s3-endpoint",
  "s3-endpoint-description",
  "s3-minio-storage",
  "s3-port",
  "s3-port-description",
  "s3-region",
  "s3-secret-key",
  "s3-secret-key-description",
  "s3-secret-key-required",
  "s3-settings-saved",
  "s3-ssl-enabled",
  "s3-ssl-enabled-description",
  "s3-attachments",
  "s3-size"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Required|When|Disabled|Enabled|successful|successfully|authentication|migrated|freed|Shown)\b/,key);
 }
});

test('Tok Pisin storage help preserves paths, external menu labels and access warnings',()=>{
 const migration=data['sandstorm-migration-description'];
 for(const literal of ['MongoDB 3','FerretDB v1 (SQLite)','files/attachments','files/avatars']) assert.ok(migration.includes(literal),literal);
 assert.match(migration,/fes taim em i stat/);
 assert.match(data['sandstorm-remove-member-warning'],/WeKan tasol.*no rausim rait.*Share access/);
 for(const literal of ['Users','Security credentials','Access keys','Create access key','Application running outside AWS','Access key ID']) assert.ok(data['s3-access-key-menu-path'].includes(literal),literal);
 for(const literal of ['Secret access key','Download .csv']) assert.ok(data['s3-secret-key-menu-path'].includes(literal),literal);
 assert.match(data['s3-secret-key-menu-path'],/wanpela taim tasol/);
 for(const literal of ['s3.amazonaws.com','minio.example.com']) assert.ok(data['s3-endpoint-description'].includes(literal),literal);
 assert.match(data['s3-secret-key-required'],/^Yu mas putim/);
 assert.match(data['s3-disabled'],/i no wok$/);
 assert.match(data['s3-enabled'],/i wok$/);
});


test('Tok Pisin cloud storage settings preserve tokens and replace mixed English prose',()=>{
 const keys=[
  "azure-account-key",
  "azure-connection-string-description",
  "gcs-key-filename",
  "gcs-key-filename-description",
  "gcs-credentials",
  "gcs-credentials-description",
  "gcs-permissions-note",
  "cloud-secret-keep-blank",
  "azure-account-name-description",
  "azure-container-description",
  "gcs-project-id-description",
  "gcs-bucket-description",
  "azure-account-name-menu-path",
  "azure-account-key-menu-path",
  "azure-connection-string-menu-path",
  "azure-container-menu-path",
  "gcs-project-id-menu-path",
  "gcs-bucket-menu-path",
  "gcs-key-filename-menu-path",
  "gcs-credentials-menu-path",
  "cloud-secret-set",
  "cloud-secret-none",
  "cloud-connection-success",
  "cloud-connection-failed",
  "cloud-settings-saved",
  "cloud-settings-save-failed"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:instead|blank|keep|shown|downloads|downloaded|contents|failed|successful)\b/,key);
 }
});

test('Tok Pisin cloud setup keeps external controls and optional secret behavior',()=>{
 const menus={
  'azure-account-name-menu-path':['Storage accounts','Security + networking','Access keys','Storage account name'],
  'azure-account-key-menu-path':['Storage accounts','key1','Show','Key'],
  'azure-connection-string-menu-path':['Storage accounts','Connection string','Show'],
  'azure-container-menu-path':['Data storage','Containers','+ Container'],
  'gcs-permissions-note':['Permissions','Grant access','New principals','client_email','Storage Object Admin','Save'],
  'gcs-credentials-menu-path':['Service accounts','Keys','Add key','Create new key','JSON','Create']
 };
 for(const [key,literals] of Object.entries(menus)) for(const literal of literals) assert.ok(data[key].includes(literal),key+': '+literal);
 for(const key of ['azure-connection-string-description','gcs-key-filename-description','gcs-credentials-description']) assert.match(data[key],/^Sapos yu laik:/);
 assert.match(data['cloud-secret-keep-blank'],/Larim i stap nating.*holim veliu bilong nau/);
 assert.match(data['gcs-key-filename-menu-path'],/Yusim dispela O putim kopi bilong JSON/);
 assert.match(data['gcs-permissions-note'],/rait long ritim na raitim/);
 assert.match(data['cloud-connection-failed'],/i no wok$/);
 assert.match(data['cloud-connection-success'],/i wok gut$/);
});


test('Tok Pisin layout and maintenance wording retains tokens without mixed English',()=>{
 const keys=[
  "text-background-color",
  "click-to-enable-auto-width",
  "click-to-disable-auto-width",
  "auto-list-width",
  "board-background-delete-pop",
  "Node_heap_total_available_size",
  "Node_memory_usage_heap_total",
  "default-save-storage",
  "board-status-loading-mode",
  "filesystem-enabled",
  "filesystem-disabled",
  "cards-loading",
  "cards-loading-lazy-note",
  "backup-done",
  "backup-restore-mode",
  "total-attachments",
  "mongodb-gridfs-storage",
  "gridfs-move-collectionfs-note",
  "schedule-board-backup",
  "migration-info-text",
  "problems-in-progress-help"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:background|width|loading|allocated|Storage|Backup|Total|Schedule|performed|continues|Reload|experimental)\b/,key);
 }
});

test('Tok Pisin loading and maintenance help retains operational limits',()=>{
 assert.match(data['click-to-enable-auto-width'],/i pas.*Klik bilong kirapim/);
 assert.match(data['click-to-disable-auto-width'],/i wok.*Klik bilong pasim/);
 assert.match(data['filesystem-disabled'],/i no wok$/);
 assert.match(data['filesystem-enabled'],/i wok$/);
 assert.equal(data['cards-loading'],data['board-status-loading-mode']);
 assert.match(data['cards-loading-lazy-note'],/traim yet.*namba bilong ol kat na mak bilong WIP i stret.*Kalenda\/Tebol\/Gantt.*kat i lod pinis tasol.*Lodim gen/);
 assert.match(data['gridfs-move-collectionfs-note'],/fail i pas.*piksa bilong yusa.*CollectionFS.*arapela ples bilong seivim/);
 assert.match(data['migration-info-text'],/wanpela taim.*go het long baksait maski yu pasim brausa/);
 assert.match(data['problems-in-progress-help'],/wok i pinis na yus bilong CPU i go daun/);
});


test('Tok Pisin policy and scheduling messages preserve tokens without mixed English',()=>{
 const keys=[
  "error-board-notAdmin",
  "error-board-notAMember",
  "trello-api-import-desc",
  "smtp-host-description",
  "error-ldap-login",
  "act-a-dueAt",
  "submit-on-enter-description",
  "accounts-lockout-locked-users-info",
  "accounts-lockout-user-unlocked",
  "board-archive-scheduled",
  "board-backup-scheduled",
  "board-cleanup-scheduled",
  "cron-job-deleted",
  "cron-errors-cleared",
  "cron-migrations-retried",
  "disable-all-import-description",
  "disable-all-export-description",
  "disable-import-avatars-description"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:need|handles|occurred|When|Where|Modified|pressing|currently|unlocked|scheduled|successfully|features|rejects|Names)\b/,key);
 }
});

test('Tok Pisin editing shortcuts and import restrictions retain their conditions',()=>{
 const enter=data['submit-on-enter-description'];
 for(const literal of ['Enter','Shift+Enter','Ctrl/Cmd+Enter']) assert.ok(enter.includes(literal),literal);
 assert.match(enter,/Sapos dispela i wok.*Shift\+Enter.*nupela lain.*Sapos dispela i no wok.*Ctrl\/Cmd\+Enter i seivim/);
 assert.match(data['error-board-notAdmin'],/mas stap admin/);
 assert.match(data['error-board-notAMember'],/mas stap memba/);
 for(const direction of ['import','export']){
  const value=data['disable-all-'+direction+'-description'];
  for(const literal of ['WeKan JSON','Kanboard','NextCloud Deck','OpenProject','GitHub','GitLab','Gitea','Forgejo']) assert.ok(value.includes(literal),literal);
  assert.match(value,/menyu i hait na server i no orait.*i no wok long stat/);
 }
 assert.match(data['disable-all-import-description'],/mekim kopi bilong bot tu/);
 assert.match(data['disable-all-export-description'],/wanpela fail i pas/);
 assert.match(data['disable-import-avatars-description'],/LDAP, OIDC\/OAuth2.*nem na arapela data i kam insait yet.*tasol/);
 assert.match(data['act-a-dueAt'],/__timeValue__\nPles: __card__\n.*bipo.*__timeOldValue__/);
});


test('Tok Pisin customization messages replace mixed English and retain tokens',()=>{
 const keys=[
  "custom-color",
  "trello-import-more",
  "custom-top-left-corner-logo-image-url",
  "custom-top-left-corner-logo-height",
  "custom-login-logo-image-url",
  "text-below-custom-login-logo",
  "custom-product-name",
  "custom-head-tags-enabled",
  "custom-manifest-enabled",
  "custom-assetlinks-enabled",
  "add-custom-html-after-body-start",
  "add-custom-html-before-body-end",
  "addmore-detail",
  "newTranslationPopup-title",
  "editTranslationPopup-title",
  "settingsTranslationPopup-title"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Custom|custom|Top|Left|Corner|Height|Login|Product|start|end|more|detailed|translation|string)\b/,key);
 }
});

test('Tok Pisin customization keeps HTML boundaries, asset name and logo location',()=>{
 assert.match(data['add-custom-html-after-body-start'],/bihain long stat bilong <body>$/);
 assert.match(data['add-custom-html-before-body-end'],/paslain long pinis bilong <\/body>$/);
 assert.ok(data['custom-assetlinks-enabled'].includes('assetlinks.json'));
 for(const key of ['custom-top-left-corner-logo-image-url','custom-top-left-corner-logo-height']) assert.match(data[key],/kona antap long han kais/);
 assert.match(data['custom-top-left-corner-logo-height'],/Mak bilong stat: 27$/);
 assert.match(data['custom-login-logo-image-url'],/^URL.*pes bilong go insait/);
 assert.match(data['text-below-custom-login-logo'],/^Rait aninit long logo/);
 assert.match(data['newTranslationPopup-title'],/^Nupela/);
 assert.match(data['editTranslationPopup-title'],/^Senisim/);
 assert.match(data['settingsTranslationPopup-title'],/^Rausim.*\?$/);
});


test('Tok Pisin diagnostic and storage messages retain tokens without mixed English',()=>{
 const keys=[
  "MongoDB_version",
  "MongoDB_storage_engine",
  "Node_heap_number_of_native_contexts",
  "Node_heap_number_of_detached_contexts",
  "version-check-failed",
  "ldap-test-connection",
  "ldap-test-connection-success",
  "ldap-test-connection-error",
  "map-provider-saved",
  "default-save-storage-saved",
  "default-save-storage-save-failed",
  "filesystem-path-description",
  "filesystem-enabled-description",
  "backup-storage",
  "gridfs-enabled-description",
  "writable-path-description",
  "fix-avatar-urls-migration-description",
  "fix-all-file-urls-migration-description",
  "migration-batch-size-description",
  "migration-cpu-threshold-description",
  "cpu-usage-current"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:compatible|storage|engine|number|native|detached|contexts|Connection|connection|Base|Use|Updates|backend|fixes|broken|Number|process|batch|Pause|exceeds|usage)\b/,key);
 }
});

test('Tok Pisin diagnostics retain thresholds, outcomes and repair scope',()=>{
 assert.match(data['migration-batch-size-description'],/wanwan bung \(1-100\)$/);
 assert.match(data['migration-cpu-threshold-description'],/sapos yus bilong CPU i winim.*\(10-90\)$/);
 assert.match(data['ldap-test-connection-success'],/i wok gut$/);
 assert.match(data['ldap-test-connection-error'],/i no wok: %s$/);
 assert.match(data['default-save-storage-save-failed'],/^I no inap seivim/);
 assert.match(data['default-save-storage-saved'],/i seiv pinis$/);
 assert.match(data['fix-avatar-urls-migration-description'],/URL bilong piksa.*memba bilong bot.*referens bilong piksa i bagarap/);
 assert.match(data['fix-all-file-urls-migration-description'],/URL bilong olgeta fail.*dispela bot.*referens bilong fail i bagarap/);
 assert.match(data['Node_heap_number_of_detached_contexts'],/lus long koneksen/);
});


test('Tok Pisin migration messages replace mixed English and retain tokens',()=>{
 const keys=[
  "database-migration-description",
  "comprehensive-board-migration-description",
  "fix-missing-lists-migration-description",
  "repair-broken-cards",
  "repair-broken-cards-done",
  "database-migration",
  "database-migrate-to-ferretdb",
  "database-migrate-to-mongodb",
  "database-migration-done",
  "migration-pause-failed",
  "migration-start-failed",
  "migration-not-needed",
  "migration-status",
  "migration-stop-confirm",
  "migration-stop-failed",
  "migration-successful",
  "migration-failed",
  "migration-progress-title",
  "migration-progress-current-step",
  "step-analyze-board-structure",
  "step-fix-orphaned-cards",
  "step-ensure-per-swimlane-lists",
  "step-fix-attachment-urls",
  "step-analyze-lists",
  "step-create-missing-lists",
  "step-delete-duplicate-empty-lists",
  "step-ensure-lost-cards-swimlane",
  "step-restore-swimlanes",
  "step-scan-users",
  "step-scan-files",
  "step-fix-file-urls",
  "database-migrations",
  "migration-delay-ms-description",
  "migration-resume-failed",
  "migration-steps",
  "step-progress"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Migrate|Performs|Detects|Repair|Repaired|Analyze|Ensure|Checking|Fixing|Missing|Duplicate|Swimlanes|successfully|resume|batches|milliseconds)\b/,key);
 }
});

test('Tok Pisin migration instructions preserve command syntax and data exclusions',()=>{
 const value=data['database-migration-description'];
 for(const literal of ['mongodb://127.0.0.1:27018','mongodb://127.0.0.1:27019','WEKAN_FERRETDB_URL / WEKAN_MONGODB_URL','MONGO_URL','snap set wekan database=ferretdb','=mongodb']) assert.ok(value.includes(literal),literal);
 assert.doesNotMatch(value,/snap set wekan detabes=/);
 assert.match(value,/fail i pas.*piksa bilong yusa i stap yet long sistem bilong ol fail/);
 assert.match(value,/detabes i mas wok.*inap konek.*Bihain long em i pinis.*statim WeKan gen/);
 assert.match(data['migration-delay-ms-description'],/milisekon \(100-10000\)$/);
 assert.match(data['step-delete-duplicate-empty-lists'],/tupela taim na i no gat samting/);
 assert.match(data['migration-stop-confirm'],/stopim olgeta/);
 assert.match(data['migration-resume-failed'],/no inap statim gen/);
});


test('Tok Pisin backup and scheduled-job labels preserve tokens and replace mixed English',()=>{
 const keys=[
  "backup-day-of-week",
  "backup-day-of-month",
  "backup-list",
  "backup-path",
  "backup-restore-add-missing",
  "backup-restore-replace-all",
  "backup-restore-select-first",
  "cron-job-delete-confirm",
  "cron-job-delete-failed",
  "cron-job-pause-failed",
  "cron-job-resume-failed",
  "cron-job-start-failed",
  "cron-no-errors",
  "cron-clear-errors",
  "cron-retry-failed",
  "cron-no-failed-migrations",
  "cron-no-paused-migrations",
  "schedule-board-archive",
  "schedule-board-cleanup"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Day|weekly|monthly|backups|path|missing|Replace|first|scheduled|job|pause|resume|start|errors|display|Clear|Retry|Migrations|paused|Schedule|Cleanup)\b/,key);
 }
});

test('Tok Pisin restore choices distinguish missing-only from full replacement',()=>{
 assert.match(data['backup-restore-add-missing'],/^Putim data i no stap tasol$/);
 assert.match(data['backup-restore-replace-all'],/^Kisim ples bilong olgeta data$/);
 assert.match(data['backup-restore-select-first'],/Makim wanpela.*long lis pastaim/);
 assert.match(data['backup-day-of-month'],/olgeta mun, 1-28/);
 assert.match(data['backup-day-of-week'],/olgeta wik/);
 assert.match(data['cron-no-failed-migrations'],/I no gat.*i no wok.*traim gen/);
 assert.match(data['cron-no-paused-migrations'],/I no gat.*malolo liklik.*kirapim gen/);
 assert.match(data['cron-job-delete-confirm'],/^Yu laik tru.*\?$/);
 assert.match(data['cron-job-pause-failed'],/^I no inap.*malolo liklik/);
 assert.match(data['cron-job-resume-failed'],/^I no inap kirapim gen/);
});


test('Tok Pisin navigation and view labels replace mixed English and preserve tokens',()=>{
 const keys=[
  "comment-assigned-only-desc",
  "read-assigned-only-desc",
  "shortcut-toggle-searchbar",
  "shortcut-toggle-sidebar",
  "toggle-assignees",
  "r-list-view",
  "r-card-button",
  "r-board-button",
  "oidc-button-text",
  "view-all",
  "displayName",
  "myCardsViewChange-title",
  "myCardsViewChangePopup-title",
  "dueCardsViewChange-title",
  "dueCardsViewChangePopup-title",
  "globalSearchViewChange-title",
  "globalSearchViewChangePopup-title",
  "display-card-creator",
  "cards-loading-lazy"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:assigned|visible|Can|Toggle|Sidebar|assignees|order|addition|view|View|button|Customize|Display|My|Due|Creator|Lazy)\b/,key);
 }
});

test('Tok Pisin view labels keep assigned-only restrictions and matching popup titles',()=>{
 for(const role of ['comment','read']) assert.match(data[role+'-assigned-only-desc'],/kisim wok bilong ol tasol i kamap ples klia/);
 assert.match(data['comment-assigned-only-desc'],/putim tok tasol/);
 assert.match(data['read-assigned-only-desc'],/no inap senisim/);
 for(const view of ['myCards','dueCards','globalSearch']) assert.equal(data[view+'ViewChange-title'],data[view+'ViewChangePopup-title']);
 for(const bar of ['searchbar','sidebar']) assert.match(data['shortcut-toggle-'+bar],/^Soim o haitim/);
 assert.match(data['toggle-assignees'],/^Putim o rausim.*1-9.*oda ol i kam insait long bot/);
 assert.match(data['cards-loading-lazy'],/kat i kamap ples klia tasol$/);
 assert.match(data['oidc-button-text'],/OIDC/);
});


test('Tok Pisin location and selection labels replace mixed English and retain tokens',()=>{
 const keys=[
  "comment-assigned-only",
  "read-assigned-only",
  "search-example",
  "setCardActionsColorPopup-title",
  "setSwimlaneColorPopup-title",
  "setListColorPopup-title",
  "submit-on-enter",
  "location-open-map",
  "location-name",
  "location-detect-from-map",
  "location-detect-none",
  "location-detect-done",
  "location-open-map-at"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Assigned|Read|Write|press|Choose|Submit|editors|Location|location|Detect|Could|Filled|detected|details|map)\b/,key);
 }
});

test('Tok Pisin location results and assigned-only roles remain distinct',()=>{
 assert.match(data['location-detect-none'],/^I no inap painim/);
 assert.match(data['location-detect-done'],/Putim.*painim pinis aninit/);
 assert.match(data['comment-assigned-only'],/^Putim tok.*kisim wok bilong ol tasol$/);
 assert.match(data['read-assigned-only'],/^Ritim.*kisim wok bilong ol tasol$/);
 assert.match(data['search-example'],/presim Enter$/);
 assert.match(data['submit-on-enter'],/^Seivim.*Enter$/);
 for(const type of ['CardActions','Swimlane','List']) assert.equal(data['set'+type+'ColorPopup-title'],'Makim wanpela kala');
});


test('Tok Pisin confirmation and connection help retains tokens without mixed English',()=>{
 const keys=[
  "smtp-port-description",
  "smtp-tls-description",
  "webhook-token",
  "default-authentication-method",
  "preview-pdf-not-supported",
  "delete-avatar-confirm",
  "comment-delete",
  "confirm-subtask-delete-popup",
  "confirm-checklist-delete-popup",
  "confirm-checklist-item-delete-popup",
  "leave-board-pop",
  "duplicate-board-confirm",
  "remove-domain-from-board",
  "remove-team-from-table",
  "remove-organization-from-board",
  "accounts-lockout-confirm-unlock",
  "accounts-lockout-confirm-unlock-all",
  "migrations-description"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:uses|outgoing|emails|support|Authentication|Method|device|does|Try|want|duplicate|domain|unlock|locked|Run|Each|executed)\b/,key);
 }
});

test('Tok Pisin confirmations preserve affected objects and single versus all-user scope',()=>{
 assert.match(data['leave-board-pop'],/__boardTitle__.*olgeta kat long dispela bot/);
 assert.match(data['accounts-lockout-confirm-unlock'],/dispela yusa\?$/);
 assert.match(data['accounts-lockout-confirm-unlock-all'],/olgeta yusa i lok\?$/);
 assert.match(data['confirm-checklist-delete-popup'],/dispela lis bilong sekim\?$/);
 assert.match(data['confirm-checklist-item-delete-popup'],/dispela samting long lis bilong sekim\?$/);
 assert.match(data['duplicate-board-confirm'],/mekim kopi bilong dispela bot/);
 assert.match(data['preview-pdf-not-supported'],/no inap soim PDF.*kisim fail i kam daun/);
 assert.match(data['smtp-port-description'],/SMTP.*imel i go aut/);
 assert.match(data['smtp-tls-description'],/SMTP.*TLS/);
 assert.match(data['webhook-token'],/sapos yu laik/);
});


test('Tok Pisin remaining file and card controls retain tokens without mixed English',()=>{
 const keys=[
  "prefix-with-full-path",
  "subtext-with-full-path",
  "attachments-path",
  "attachments-path-description",
  "avatars-path-description",
  "import-board-instruction-csv",
  "trello-resume",
  "list-archive-cards",
  "list-move-cards",
  "list-select-cards",
  "no-archived-cards",
  "no-archived-lists",
  "no-archived-swimlanes",
  "instance",
  "board-instance-info",
  "quick-access-description",
  "search-cards",
  "custom-login-logo-link-url",
  "show-field-on-card",
  "showLabel-field-on-card",
  "org-tenant",
  "r-of-cards-in-list",
  "r-move-all-cards",
  "r-in-list",
  "r-in-swimlane",
  "previous_as",
  "show-on-card",
  "show-on-minicard",
  "card-mark-complete",
  "drag-board-to-workspace",
  "database-migration-confirm",
  "render-links-as-plain-text",
  "always-show-code-as-text",
  "pause-all-migrations",
  "start-all-migrations",
  "stop-all-migrations",
  "card-show-lists-on-minicard",
  "hide-list-on-minicard",
  "show-list-on-minicard",
  "problems-none-in-progress"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Prefix|Subtext|Path|path|where|stored|Paste|Resume|titles|descriptions|field|Mark|Drag|assign|drop|affected|running|Render|Always|Pause|Start|Stop|Migrations|Minicard|progress)\b/,key);
 }
});

test('Tok Pisin card and database wording keeps scope, markup and placeholders',()=>{
 assert.match(data['board-instance-info'],/^<strong>Olgeta yusa i go insait pinis<\/strong>/);
 assert.match(data['database-migration-confirm'],/__db__.*fail i pas.*piksa bilong yusa.*stap olsem bipo.*i mas wok/);
 assert.match(data['drag-board-to-workspace'],/__workspaces__.*ba bilong sait/);
 assert.match(data['import-board-instruction-csv'],/koma.*CSV.*tab.*TSV/);
 for(const action of ['archive','move','select']) assert.match(data['list-'+action+'-cards'],/olgeta kat long dispela lis/);
 for(const type of ['cards','lists','swimlanes']) assert.match(data['no-archived-'+type],/^I no gat.*akaiv/);
 assert.match(data['pause-all-migrations'],/malolo liklik$/);
 assert.match(data['start-all-migrations'],/^Statim olgeta/);
 assert.match(data['stop-all-migrations'],/^Stopim olgeta/);
 assert.match(data['hide-list-on-minicard'],/^Haitim/);
 assert.match(data['show-list-on-minicard'],/^Soim/);
});


test('Tok Pisin form and card-aging labels preserve tokens and replace mixed English',()=>{
 const keys=[
  "Database_type",
  "automatically-field-on-card",
  "always-field-on-card",
  "r-check-all",
  "r-remove-value-from",
  "card-aging",
  "card-aging-days",
  "card-aging-tier1",
  "card-aging-tier2",
  "card-aging-tier3",
  "skip-to-content",
  "worker-desc",
  "confirm-move-list-to-swimlane",
  "createTemplateContainerPopup-title",
  "disambiguateMultiLabelPopup-title",
  "disambiguateMultiMemberPopup-title",
  "clipboard",
  "enable-vertical-scrollbars",
  "anonymize-account"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:type|field|Check|value|aging|fade|days|tiers|Tier|idle|Skip|content|Can|itself|other|Container|Disambiguate|Clipboard|drag|drop|vertical|scrollbars|Anonymize)\b/,key);
 }
});

test('Tok Pisin aging levels and role labels retain distinctions',()=>{
 for(let tier=1;tier<=3;tier++){
  assert.ok(data['card-aging-tier'+tier].startsWith('Mak '+tier));
  assert.match(data['card-aging-tier'+tier],/de i no gat wok long kat/);
 }
 assert.match(data['card-aging-tier1'],/liklik/);
 assert.match(data['card-aging-tier2'],/namel/);
 assert.match(data['card-aging-tier3'],/tru/);
 assert.match(data['worker-desc'],/movim kat.*em yet.*putim tok tasol/);
 assert.match(data['confirm-move-list-to-swimlane'],/dispela lis na olgeta kat bilong en.*narapela rot/);
 assert.match(data['automatically-field-on-card'],/nupela kat/);
 assert.match(data['always-field-on-card'],/olgeta kat/);
 assert.match(data['anonymize-account'],/akaun$/);
 assert.doesNotMatch(data['anonymize-account'],/kisim i kam/);
});


test('Tok Pisin import controls preserve tokens and replace mixed English prose',()=>{
 const keys=[
  "imported-member-no-account",
  "import-without-mapping-members",
  "import-json-placeholder",
  "import-csv-placeholder",
  "import-attachments-zip",
  "import-trello-json-file",
  "import-trello-zip-file",
  "import-trello-zip-progress",
  "import-trello-workspace",
  "trello-api-import",
  "trello-api-key",
  "trello-api-token",
  "trello-list-workspaces",
  "trello-import-selected",
  "trello-importing",
  "trello-import-results",
  "trello-select-boards",
  "trello-import-progress",
  "trello-cancel-delete",
  "trello-delete-imported",
  "trello-import-errors"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Imported|matching|mapping|later|Paste|valid|here|Importing|please|wait|directly|manually|generated|results|least|progress|imported|errors)\b/,key);
 }
});

test('Tok Pisin import help retains file types, external tool name and selection minimum',()=>{
 assert.ok(data['import-attachments-zip'].includes('Trello Card Attachments Downloader'));
 assert.match(data['import-attachments-zip'],/sapos yu laik/);
 // CodeQL js/incomplete-url-substring-sanitization (#553): parse the link.
  assert.ok((String(data['trello-api-key']).match(/https?:\/\/[^\s"'<>)\]]+/g) || [])
    .some(link => { const url = new URL(link.replace(/[.,;:]+$/, '')); return url.hostname === 'trello.com' && url.pathname === '/app-key'; }));
 assert.match(data['trello-api-token'],/yu wokim yet aninit long ki bilong API/);
 assert.match(data['import-trello-json-file'],/\.json/);
 assert.match(data['import-trello-zip-file'],/\.zip/);
 assert.match(data['trello-select-boards'],/wanpela bot o moa/);
 assert.match(data['import-without-mapping-members'],/no linkim.*linkim bihain/);
 assert.match(data['trello-delete-imported'],/bot i kam insait pinis/);
 assert.match(data['imported-member-no-account'],/no gat akaun i wankain yet/);
});


test('Tok Pisin account lockout labels preserve tokens and replace mixed English',()=>{
 const keys=[
  "accounts-lockout-settings",
  "accounts-lockout-known-users",
  "accounts-lockout-unknown-users",
  "accounts-lockout-failures-before",
  "accounts-lockout-settings-updated",
  "accounts-lockout-locked-users",
  "accounts-lockout-failed-attempts",
  "accounts-lockout-remaining-time",
  "accounts-lockout-show-locked-users",
  "accounts-lockout-click-to-unlock",
  "accounts-lockout-all-users-unlocked",
  "accounts-lockout-unlock-all",
  "already-account",
  "user-exists",
  "otp-required"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Brute|Force|Protection|known|unknown|correct|wrong|non-existent|Failures|lockout|Locked|Attempts|Remaining|locked|unlock|unlocked|Unlock|Already|exists|code)\b/,key);
 }
});

test('Tok Pisin lockout labels distinguish known accounts and absent usernames',()=>{
 assert.match(data['accounts-lockout-known-users'],/yusa i stap pinis.*nem bilong yusa i stret, paswod i no stret/);
 assert.match(data['accounts-lockout-unknown-users'],/nem bilong yusa i no stap/);
 assert.match(data['accounts-lockout-failures-before'],/Hamas traim i no wok paslain long lok/);
 assert.match(data['accounts-lockout-show-locked-users'],/yusa i lok tasol/);
 assert.match(data['accounts-lockout-click-to-unlock'],/dispela yusa$/);
 assert.match(data['accounts-lockout-all-users-unlocked'],/olgeta yusa.*raus pinis/);
 assert.match(data['accounts-lockout-unlock-all'],/olgeta lok$/);
 assert.match(data['otp-required'],/^Yu mas putim kod OTP$/);
});


test('Tok Pisin monitoring controls replace mixed English and retain tokens',()=>{
 const keys=[
  "all-migrations",
  "select-migration",
  "scheduled-board-operations",
  "back-to-settings",
  "board-migration",
  "board-migrations",
  "comprehensive-board-migration",
  "lost-cards",
  "lost-cards-list",
  "fix-missing-lists-migration",
  "fix-all-file-urls-migration",
  "migrations-admin-only",
  "cleanup-old-jobs",
  "days-old",
  "estimated-time-remaining",
  "filesystem-attachments",
  "force-board-scan",
  "migrate-all-to-filesystem",
  "migrate-all-to-gridfs",
  "migrate-all-to-s3",
  "migrated-attachments",
  "monitoring-export-failed",
  "monitoring-refresh-failed",
  "remaining-attachments",
  "scanning-status",
  "search-boards-or-operations",
  "system-resources",
  "unmigrated-boards",
  "current-step"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Migrations|Migration|Scheduled|Operations|Back|Comprehensive|Lost|Items|Fix|Missing|can|run|Cleanup|Jobs|Days|Estimated|remaining|Filesystem|Force|Scan|Migrate|Migrated|monitoring|refresh|Remaining|Scanning|operations|Resources|Unmigrated|Step)\b/,key);
 }
});

test('Tok Pisin monitoring labels preserve target storage, permission limits and progress states',()=>{
 assert.match(data['migrations-admin-only'],/admin bilong bot tasol inap/);
 for(const target of ['gridfs','s3']) assert.equal(data['migrate-all-to-'+target],'Movim olgeta i go long '+(target==='s3'?'S3':'GridFS'));
 assert.match(data['migrate-all-to-filesystem'],/olgeta.*sistem bilong ol fail/);
 assert.match(data['migrated-attachments'],/muv pinis$/);
 assert.match(data['remaining-attachments'],/stap yet$/);
 assert.match(data['unmigrated-boards'],/no muv yet$/);
 assert.match(data['monitoring-export-failed'],/no inap salim.*i go aut/);
 assert.match(data['monitoring-refresh-failed'],/no inap kisim nupela/);
 assert.match(data['force-board-scan'],/i mas sekim bot/);
});


test('Tok Pisin schedule and time labels retain tokens without mixed English',()=>{
 const keys=[
  "active-cron-jobs",
  "add-cron-job",
  "add-cron-job-placeholder",
  "board-archive-failed",
  "board-backup-failed",
  "board-cleanup-failed",
  "board-operations",
  "board-status-time-summary",
  "board-status-cards-with-time",
  "remaining_time",
  "version-name",
  "minicardDetailsActionsPopup-title",
  "drag-board",
  "translation-text",
  "hideAllChecklistItems",
  "showChecklistAtMinicard"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Scheduled|Jobs|Job|functionality|coming|soon|schedule|backup|cleanup|Operations|spent|summary|Remaining|Version|Details|Drag|Translation|items|Minicard)\b/,key);
 }
});

test('Tok Pisin schedule failures describe scheduling rather than completed operations',()=>{
 for(const operation of ['archive','backup','cleanup']) assert.match(data['board-'+operation+'-failed'],/^I no inap makim taim/);
 assert.match(data['board-archive-failed'],/putim bot long akaiv/);
 assert.match(data['board-backup-failed'],/kopi bilong kisim bek bot/);
 assert.match(data['board-cleanup-failed'],/klinim bot/);
 assert.match(data['add-cron-job-placeholder'],/bai kamap klostu$/);
 assert.match(data['board-status-cards-with-time'],/taim ol i yusim$/);
 assert.match(data['remaining_time'],/taim i stap yet/i);
 assert.match(data['hideAllChecklistItems'],/^Haitim olgeta samting long lis bilong sekim$/);
 assert.match(data['showChecklistAtMinicard'],/^Soim.*liklik kat$/);
});


test('Tok Pisin privacy and support labels retain tokens without mixed English',()=>{
 const keys=[
  "disable-import-avatars",
  "disable-export-avatars",
  "anonymize-import-users",
  "anonymize-export-users",
  "disable-watch",
  "theme-override-all-tenants",
  "support-page-enabled",
  "support-title",
  "accessibility-page-enabled",
  "accessibility-title",
  "cards-loading-auto",
  "click-to-star",
  "click-to-unstar",
  "click-to-star-page",
  "click-to-unstar-page"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:avatars|Anonymize|watch|Override|that|applies|Support|Accessibility|page|Automatic|lazy|big|star|unstar)\b/,key);
 }
});

test('Tok Pisin privacy labels preserve import/export directions and favorite actions',()=>{
 for(const prefix of ['disable','anonymize']){
  const noun=prefix==='disable'?'avatars':'users';
  assert.match(data[prefix+'-import-'+noun],/kam insait$/);
  assert.match(data[prefix+'-export-'+noun],/go aut$/);
 }
 for(const suffix of ['','-page']){
  assert.match(data['click-to-star'+suffix],/putim sta/);
  assert.match(data['click-to-unstar'+suffix],/rausim sta/);
 }
 assert.match(data['click-to-star-page'],/pes\.$/);
 assert.match(data['click-to-star'],/bot\.$/);
 assert.match(data['theme-override-all-tenants'],/olgeta tenant$/);
 assert.match(data['cards-loading-auto'],/bikpela bot tasol/);
});


test('Tok Pisin remaining rule labels retain tokens without mixed English',()=>{
 const keys=[
  "r-unselect-all",
  "r-import-workflow",
  "r-import-unmapped",
  "r-when-scheduled",
  "r-schedule-weekly",
  "r-schedule-monthly",
  "r-schedule-on-day",
  "r-schedule-on-date",
  "r-for-n-days",
  "r-mark-complete",
  "r-mark-incomplete",
  "r-bottom-of",
  "r-uncheck-all",
  "r-items-check",
  "r-with-items",
  "r-of"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Unselect|visual|workflow|Could|map|line|On|schedule|Every|day|days|Mark|incomplete|Bottom|Uncheck|Items|items|of)\b/,key);
 }
});

test('Tok Pisin rule labels distinguish completion and schedule periods',()=>{
 assert.match(data['r-mark-complete'],/olsem i pinis$/);
 assert.match(data['r-mark-incomplete'],/olsem i no pinis$/);
 assert.match(data['r-schedule-weekly'],/olgeta wik$/);
 assert.match(data['r-schedule-monthly'],/olgeta mun$/);
 assert.match(data['r-schedule-on-day'],/de bilong mun$/);
 assert.match(data['r-for-n-days'],/N de$/);
 assert.match(data['r-import-unmapped'],/no inap linkim __count__ lain/);
 assert.match(data['r-uncheck-all'],/Rausim mak tik/);
 assert.match(data['r-unselect-all'],/olgeta samting yu makim/);
});


test('Tok Pisin avatar and repository labels retain tokens without mixed English',()=>{
 const keys=[
  "adminChangeAvatarPopup-title",
  "change-avatar",
  "changeAvatarPopup-title",
  "deleteAvatarPopup-title",
  "default-avatar",
  "available-repositories",
  "repository-name",
  "create-repository",
  "sign-in-to-upload",
  "advanced-filter-label",
  "impersonate-user",
  "edit-wip-limit",
  "enable-wip-limit",
  "wip-limit-groups",
  "addReactionPopup-title"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Avatar|avatar|Repositories|Repository|repositories|Advanced|Impersonate|Limit|reaction)\b/,key);
 }
});

test('Tok Pisin avatar controls agree and WIP groups remain groups',()=>{
 assert.equal(data['adminChangeAvatarPopup-title'],data['change-avatar']);
 assert.equal(data['changeAvatarPopup-title'],data['change-avatar']);
 assert.match(data['deleteAvatarPopup-title'],/^Rausim piksa bilong yusa\?$/);
 assert.match(data['default-avatar'],/long stat$/);
 assert.match(data['wip-limit-groups'],/^Ol grup.*WIP$/);
 assert.doesNotMatch(data['wip-limit-groups'],/Larim|Lis/);
 assert.match(data['edit-wip-limit'],/^Senisim/);
 assert.match(data['enable-wip-limit'],/^Larim/);
 assert.match(data['sign-in-to-upload'],/^Go insait.*i go antap$/);
});


test('Tok Pisin organization and board labels preserve tokens and consistent actions',()=>{
 const keys=[
  "org-propagate-members-to-boards",
  "org-sync-members-from-auth",
  "org-domains",
  "org-admins",
  "team-propagate-members-to-boards",
  "team-sync-members-from-auth",
  "board-backgrounds",
  "boardBackgrounds-title"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:Propagate|Sync|Auth|Provider|Domains|admins|backgrounds)\b/,key);
 }
 for(const scope of ['org','team']){
  assert.match(data[scope+'-propagate-members-to-boards'],/memba i go long ol bot/);
  assert.match(data[scope+'-sync-members-from-auth'],/wankain wantaim sevis.*go insait/);
 }
 assert.equal(data['org-propagate-members-to-boards'],data['team-propagate-members-to-boards']);
 assert.equal(data['org-sync-members-from-auth'],data['team-sync-members-from-auth']);
 assert.equal(data['board-backgrounds'],data['boardBackgrounds-title']);
});


test('Tok Pisin history and notification settings preserve tokens and exclusions',()=>{
 const keys=[
  "last-admin-desc",
  "mongodb-compact-running",
  "mongodb-compact-success",
  "disable-export-avatars-description",
  "disable-activities-description",
  "disable-notifications-description"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:roles|because|least|Running|may|several|minutes|Collections|compacted|When|avatars|pictures|included|exporting|Usernames|other|still|exported|omitted|entries|recorded|shown|anywhere|history|sends|unless|suppressed)\b/,key);
 }
 assert.match(data['last-admin-desc'],/no inap senisim.*wanpela admin o moa/);
 assert.match(data['disable-export-avatars-description'],/WeKan JSON na CSV.*nem bilong yusa na arapela data i go aut yet/);
 assert.match(data['disable-activities-description'],/rekot bilong ol wok i no seiv.*no kamap.*no gat histori/);
 assert.match(data['disable-notifications-description'],/wok inap gat rekot yet.*sapos yu no pasim dispela tu.*toksave tasol/);
 for(const setting of ['export-avatars','activities','notifications']) assert.match(data['disable-'+setting+'-description'],/i no wok long stat\.$/);
 assert.match(data['mongodb-compact-running'],/inap kisim sampela minit/);
});


test('Tok Pisin shortcut labels preserve tokens and distinguish membership from assignment',()=>{
 const keys=[
  "shortcut-add-self",
  "shortcut-assign-self",
  "shortcut-autocomplete-members",
  "shortcut-close-dialog",
  "shortcut-show-shortcuts",
  "shortcut-edit-due-date"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
  assert.doesNotMatch(data[key],/\b(?:yourself|Assign|Autocomplete|Dialog|Bring|up|shortcuts)\b/,key);
 }
 assert.match(data['shortcut-add-self'],/yu yet olsem memba/);
 assert.match(data['shortcut-assign-self'],/yu yet bilong kisim wok/);
 assert.match(data['shortcut-edit-due-date'],/de wok i mas pinis.*kat i stap op/);
 assert.match(data['shortcut-autocomplete-members'],/nem bilong ol memba/);
 assert.deepEqual(Object.keys(data),Object.keys(english));
});
