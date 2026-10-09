 'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/ak.i18n.json');

test('Akan controls replace unrelated filler and restore literal vote values', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["comment-in-reply-to", "actions", "allboards.starred", "allboards.remaining", "setListWidthPopup-title", "setSwimlaneHeightPopup-title", "admin-announcement", "apply", "template-container", "attached", "board-background-image-url", "desktop-mode", "mobile-mode", "zoom-in", "zoom-out", "zoom-level", "enter-zoom-level", "card-due", "card-due-on", "card-start-on", "cardAttachmentsPopup-title", "cardStartVotingPopup-title", "positiveVoteMembersPopup-title", "negativeVoteMembersPopup-title", "vote-question", "vote-against", "cardStartPlanningPokerPopup-title", "poker-question", "poker-one", "poker-two", "poker-three", "poker-five", "poker-eight", "poker-thirteen", "poker-twenty", "poker-forty", "poker-oneHundred", "poker-unsure", "poker-finish", "poker-result-votes", "poker-result-who", "poker-replay", "cardDependencyIconPopup-title", "cardStickersPopup-title", "invitePeoplePopup-title", "theme-default", "theme-category-flat", "theme-category-clear", "theme-category-dark", "theme-category-special", "font", "font-default", "font-size", "font-size-default", "font-size-smaller", "font-size-small", "font-size-large", "font-size-larger", "font-size-largest", "subtasks"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const name of ['one','two','three','five','eight','thirteen','twenty','forty','oneHundred','unsure']) assert.equal(data['poker-'+name],english['poker-'+name]);
 assert.match(data['enter-zoom-level'],/50-300%/);
 assert.notEqual(data['zoom-in'],data['zoom-out']);
 assert.notEqual(data['positiveVoteMembersPopup-title'],data['negativeVoteMembersPopup-title']);
 assert.notEqual(data['card-due-on'],data['card-start-on']);
 assert.equal(new Set(['smaller','small','large','larger','largest'].map(s=>data['font-size-'+s])).size,5);
 assert.match(data['board-background-image-url'],/URL/);
});

test('Akan colors and field controls replace filler without changing literal labels', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["card-aging-days", "go-back", "modal-title", "color-black", "color-crimson", "color-darkgreen", "color-gold", "color-gray", "color-indigo", "color-lime", "color-magenta", "color-mistyrose", "color-navy", "color-paleturquoise", "color-peachpuff", "color-pink", "color-plum", "color-purple", "color-silver", "color-sky", "color-slateblue", "color-white", "color-yellow", "comment-placeholder", "computer", "current", "custom-field-currency", "custom-field-currency-option", "custom-field-dropdown-none", "custom-field-dropdown-unknown", "custom-field-number", "custom-field-text", "decline", "default-avatar", "soft-wip-limit", "email-invite", "list-label-short-modifiedAt", "list-label-short-title", "list-label-short-sort", "trello-parent-workspace-top", "trello-clear-job", "running", "paused", "info", "check-version", "initials", "joined", "swimlaneActionPopup-title", "gantt", "log-in", "loginPopup-title", "menu", "muted", "participating", "setWipLimitPopup-title", "shortcut-autocomplete-emoji", "subscribe", "spent-time-hours", "overtime-hours", "overtime"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(data['comment-placeholder'],'');
 for(const key of ['list-label-short-modifiedAt','list-label-short-title','list-label-short-sort','gantt']) assert.equal(data[key],english[key]);
 assert.match(data['card-aging-days'],/3/);
 assert.equal(data['log-in'],data['loginPopup-title']);
 assert.notEqual(data['custom-field-dropdown-none'],data['custom-field-dropdown-unknown']);
 assert.notEqual(data['running'],data['paused']);
 for(const key of ['spent-time-hours','overtime-hours']) assert.match(data[key],/nnɔnhwerew/);
 assert.equal(new Set(keys.filter(k=>k.startsWith('color-')).map(k=>data[k])).size,20);
});

test('Akan administration labels preserve units, modes and service names', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["tracking", "type", "custom-login-logo-image-url", "custom-login-logo-link-url", "text-below-custom-login-logo", "automatic-linked-url-schemes", "watching", "welcome-swimlane", "welcome-list1", "welcome-list2", "wipLimitErrorPopup-title", "attachment-transfer-limits-title", "attachment-limits", "attachment-limit-mode-unlimited", "attachment-limit-mode-max-size", "attachment-limit-mode-blocked", "attachment-limit-unit-gb", "attachment-limit-unit-mb", "attachment-limit-unit-bytes", "registration", "self-registration", "invite", "invite-people", "smtp-host", "send-from", "invitation-code", "email-smtp-test-subject", "outgoing-webhooks", "bidirectional-webhooks", "outgoingWebhooksPopup-title", "global-webhook", "no-name", "package", "OS", "Database", "Database_type", "Database_commit", "FerretDB_version", "FerretDB_commit", "Reactivity_mode", "MongoDB_version", "OS_Arch", "OS_Cpus", "OS_Loadavg", "OS_Release", "OS_Type", "OS_Uptime", "hours", "minutes", "seconds", "visibility", "modifiedAt", "verified", "org-shared-templates", "team-shared-templates", "card-received", "card-received-on", "card-end", "card-end-on", "assigned-by"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const suffix of ['gb','mb','bytes']) assert.equal(data['attachment-limit-unit-'+suffix],english['attachment-limit-unit-'+suffix]);
 assert.equal(new Set(['unlimited','max-size','blocked'].map(s=>data['attachment-limit-mode-'+s])).size,3);
 assert.equal(data['outgoing-webhooks'],data['outgoingWebhooksPopup-title']);
 assert.notEqual(data['outgoing-webhooks'],data['bidirectional-webhooks']);
 assert.equal(data['org-shared-templates'],data['team-shared-templates']);
 for(const name of ['changeStreams','oplog','polling']) assert.ok(data.Reactivity_mode.includes(name));
 for(const key of ['FerretDB_version','FerretDB_commit']) assert.match(data[key],/FerretDB/);
 assert.match(data.MongoDB_version,/MongoDB/);
 assert.match(data.OS_Cpus,/CPU/);
 assert.notEqual(data['card-received-on'],data['card-end-on']);
 assert.equal(new Set(['hours','minutes','seconds'].map(k=>data[k])).size,3);
});

test('Akan rule schedules preserve cadence, units and opposite actions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["requested-by", "default", "defaultdefault", "queue", "cover-image", "no-parent", "r-rule", "r-when", "r-drop-trigger", "r-drop-action", "r-format-auto", "r-when-scheduled", "r-schedule-type", "r-schedule-once", "r-schedule-daily", "r-schedule-weekday", "r-schedule-weekly", "r-schedule-monthly", "r-schedule-at-time", "r-schedule-on-weekday", "r-schedule-on-date", "r-due-is-set", "r-due-soon", "r-due-overdue", "r-days-after", "r-button-label", "r-run", "r-sort-by", "r-sort-due", "r-later", "r-unit-minutes", "r-unit-hours", "r-unit-days", "r-unit-weeks", "r-unit-months", "r-trigger", "r-action", "r-is", "r-when-a-label-is", "r-made-incomplete", "r-checked", "r-unchecked", "r-top-of", "r-bottom-of", "r-label", "r-check-all", "r-uncheck-all", "r-check", "r-uncheck", "r-item", "r-to", "r-of", "r-subject", "r-rule-details", "r-d-send-email-to", "r-d-send-email-subject", "r-d-send-email-message", "r-d-check-one", "r-d-uncheck-one", "r-by"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(new Set(['once','daily','weekday','weekly','monthly'].map(s=>data['r-schedule-'+s])).size,5);
 assert.match(data['r-schedule-weekday'],/Dwoda–Fida/);
 assert.equal(new Set(['minutes','hours','days','weeks','months'].map(s=>data['r-unit-'+s])).size,5);
 for(const [a,b] of [['r-check','r-uncheck'],['r-check-all','r-uncheck-all'],['r-checked','r-unchecked'],['r-d-check-one','r-d-uncheck-one'],['r-top-of','r-bottom-of'],['r-trigger','r-action'],['r-due-soon','r-due-overdue']]) assert.notEqual(data[a],data[b]);
 assert.equal(data['r-subject'],data['r-d-send-email-subject']);
 assert.equal(data.default,data.defaultdefault);
 assert.equal(data['r-rule'],data.rules);
});

test('Akan settings and calendar labels preserve identifiers and weekday distinctions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["r-items-list", "r-set", "r-datefield", "r-df-start-at", "r-df-due-at", "r-df-end-at", "r-df-received-at", "r-to-current-datetime", "ldap", "oauth2", "cas", "settings-group-url", "settings-group-logo", "custom-head-meta-tags", "custom-head-link-tags", "custom-head-manifest-content", "custom-assetlinks-content", "previous_as", "mark-all-as-read", "mark-all-as-unread", "roles", "roles-status", "roles-status-role", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "status", "owner", "last-modified-at", "voting", "task", "domains", "domain", "shared-templates", "website", "person", "context-separator", "myCardsViewChange-choice-table", "dueCardsViewChange-choice-me"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const key of ['ldap','oauth2','cas','settings-group-url','context-separator']) assert.equal(data[key],english[key]);
 const days=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
 assert.equal(new Set(days.map(k=>data[k])).size,7);
 assert.ok(data['r-schedule-weekday'].includes(data.monday+'–'+data.friday));
 assert.notEqual(data['mark-all-as-read'],data['mark-all-as-unread']);
 assert.equal(data['shared-templates'],data['org-shared-templates']);
 assert.equal(data['r-items-list'].split(',').length,3);
 for(const key of ['custom-head-meta-tags','custom-head-link-tags']) assert.match(data[key],/HTML/);
 for(const key of ['custom-head-manifest-content','custom-assetlinks-content']) assert.match(data[key],/JSON/);
 assert.match(data['custom-assetlinks-content'],/assetlinks\.json/);
});

test('Akan search translations replace mixed prose and preserve argument tokens', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["operator-board-abbrev", "operator-swimlane-abbrev", "operator-list-abbrev", "operator-label", "operator-label-abbrev", "operator-user-abbrev", "operator-member-abbrev", "operator-assignee", "operator-assignee-abbrev", "operator-creator", "operator-status", "operator-due", "operator-modified", "operator-sort", "operator-has", "operator-limit", "operator-debug", "operator-org", "operator-team", "operator-title", "operator-customfield", "operator-attachment-text", "predicate-archived", "predicate-open", "predicate-ended", "predicate-all", "predicate-overdue", "predicate-week", "predicate-month", "predicate-quarter", "predicate-year", "predicate-due", "predicate-modified", "predicate-attachment", "predicate-start", "predicate-end", "predicate-assignee", "predicate-public", "predicate-private", "predicate-selector", "predicate-projection", "operator-unknown-error", "operator-number-expected", "operator-sort-invalid", "operator-status-invalid", "operator-has-invalid", "operator-limit-invalid", "operator-debug-invalid", "operator-number"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const key of keys.filter(k=>k.endsWith('-abbrev'))) assert.equal(data[key],english[key]);
 for(const suffix of ['due','modified','attachment','assignee']) assert.equal(data['operator-'+(suffix==='attachment'?'attachment-text':suffix)],data['predicate-'+suffix]);
 for(const key of ['operator-title','operator-attachment-text','operator-assignee','operator-customfield']) assert.ok(!/\s/.test(data[key]),key);
 for(const key of ['operator-unknown-error','operator-number-expected','operator-sort-invalid','operator-status-invalid','operator-has-invalid','operator-limit-invalid','operator-debug-invalid']) assert.ok(!/expected|invalid|valid|operatanaa/.test(data[key]),key);
});

test('Akan dependency and report labels preserve direction and first/last distinctions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["next-page", "previous-page", "globalSearch-instructions-notes-4", "excel-font", "number", "archived-at", "due-complete", "card-mark-complete", "card-mark-incomplete", "stickers", "card-dependencies", "dependency-type", "dependency-icon", "dependency-type-related-to", "dependency-type-blocks", "dependency-type-is-blocked-by", "dependency-type-fixes", "dependency-type-is-fixed-by", "location", "location-latitude", "location-longitude", "location-detect", "map-region-usa", "map-region-europe", "map-region-asia", "links-heading", "custom-field-stringtemplate", "speedReportTitle", "testsReportTitle", "cpuReportTitle", "databaseReportTitle", "acknowledge", "officeReportTitle", "office-location", "office-logins", "office-first-seen", "office-last-seen", "office-shared", "apiReportTitle", "api-endpoint", "api-calls", "api-first-called", "api-last-called", "recovery-event", "recovery-severity", "recovery-db", "recovery-detail", "reason", "wait-spinner", "Bounce", "Cube", "Cube-Grid", "Dot", "Double-Bounce", "Rotateplane", "Scaleout", "Wave", "subject", "details", "ticket"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const [a,b] of [['next-page','previous-page'],['card-mark-complete','card-mark-incomplete'],['dependency-type-blocks','dependency-type-is-blocked-by'],['dependency-type-fixes','dependency-type-is-fixed-by'],['location-latitude','location-longitude']]) assert.notEqual(data[a],data[b]);
 for(const [first,last] of [['office-first-seen','office-last-seen'],['api-first-called','api-last-called']]){
  assert.match(data[first],/edi kan/);
  assert.match(data[last],/etwa to/);
 }
 for(const key of ['excel-font','apiReportTitle','api-endpoint']) assert.equal(data[key],english[key]);
 assert.equal(data.location,data['office-location']);
 assert.equal(data['recovery-db'],data.Database);
 assert.equal(new Set(['Bounce','Cube','Cube-Grid','Dot','Double-Bounce','Rotateplane','Scaleout','Wave'].map(k=>data[k])).size,8);
});

test('Akan storage and account controls preserve identities, units and opposite states', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["tickets", "ticket-number", "pending", "resolved", "request", "requests", "custom-legal-notice-link-url", "legalNotice", "copied", "subtaskActionsPopup-title", "attachmentActionsPopup-title", "move-source", "move-destination", "move-storage-collectionfs", "move-storage-fs", "move-storage-s3", "attachment-last-move", "attachment-repair-locations", "attachment-repair-done", "attachment-repair-repaired", "move-scope-avatars", "move-progress-file", "move-progress-pause", "move-progress-resume", "calculate-file-counts", "calculating-counts", "stats-scope", "stats-collectionfs", "stats-count", "avatars", "attachment-id", "gridfs-file-id", "s3-file-id", "mongodb-compact", "mongodb-compact-run", "mongodb-compact-success", "path", "size", "action", "board-status-time-spent-total", "remaining_time", "speed", "progress", "Mongo_sessions_count", "translation", "translation-text", "collapse", "uncollapse", "accessibility", "accessibility-content", "accounts-lockout-period", "accounts-lockout-failure-window", "accounts-lockout-status", "attachments-path", "avatars-path", "cron-jobs", "cron-migrations", "cron-resume-paused", "complete", "idle"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const key of ['move-storage-collectionfs','move-storage-s3','stats-collectionfs']) assert.equal(data[key],english[key]);
 for(const [key,name] of [['attachment-id','ID'],['gridfs-file-id','GridFS'],['s3-file-id','S3']]) assert.ok(data[key].includes(name));
 for(const key of ['accounts-lockout-period','accounts-lockout-failure-window']) assert.match(data[key],/sɛkɛnd/);
 for(const [a,b] of [['move-source','move-destination'],['move-progress-pause','move-progress-resume'],['collapse','uncollapse'],['pending','resolved'],['complete','idle']]) assert.notEqual(data[a],data[b]);
 assert.equal(data['move-scope-avatars'],data.avatars);
 assert.equal(data.action,data['r-action']);
 assert.equal(data['accounts-lockout-status'],data.status);
 assert.equal(data.speed,data.speedReportTitle);
});

test('Akan backup and migration controls preserve technical values and lifecycle states', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["storage-read", "azure-account-key", "azure-connection-string", "azure-container", "database-migration", "database-migration-phase", "database-migration-done", "sandstorm-migration-status", "sandstorm-migration-success", "sandstorm-disk-usage", "sandstorm-raw-mongodb", "collections", "features", "render-links-as-plain-text", "backup-data", "backup-scope", "backup-scope-instance", "backup-now", "backup-done", "backup-schedule", "backup-frequency", "backup-frequency-off", "backup-frequency-daily", "backup-path", "backup-restore-replace-all", "gcs-project-id", "gcs-bucket", "gcs-key-filename", "gcs-credentials", "cloud-secret-none", "test-cloud-connection", "cloud-connection-success", "move-storage-azure", "stop", "migration-starting", "migration-pausing", "migration-stopping", "migration-progress", "migration-status", "s3-access-key", "s3-access-key-placeholder", "s3-bucket", "s3-connection-success", "s3-endpoint", "s3-region", "s3-region-description", "s3-secret-key", "s3-secret-key-placeholder", "test-s3-connection", "writable-path", "attachment-migration", "automatic-migration", "fix-avatar-urls-migration", "migration-needed", "migration-complete", "migration-running", "migrations", "run-migration", "migration-progress-overall", "migration-progress-current-step"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(data['move-storage-azure'],english['move-storage-azure']);
 assert.match(data['s3-region-description'],/AWS S3.*us-east-1/);
 assert.match(data['sandstorm-raw-mongodb'],/MongoDB 3/);
 assert.match(data['gcs-credentials'],/JSON/);
 assert.equal(new Set(['starting','pausing','stopping'].map(s=>data['migration-'+s])).size,3);
 assert.notEqual(data['s3-access-key'],data['s3-secret-key']);
 assert.notEqual(data['backup-frequency-off'],data['backup-frequency-daily']);
 assert.match(data['backup-restore-replace-all'],/nyinaa ananmu/);
 assert.equal(data['migration-complete'],data.complete);
 assert.equal(data['sandstorm-migration-status'],data['migration-status']);
});

test('Akan remaining status labels remove generic filler and preserve schedules', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["migration-progress-status", "migration-progress-details", "steps", "has-swimlanes", "step-validate-migration", "step-fix-avatar-urls", "step-fix-attachment-urls", "step-finalize", "step-fix-missing-ids", "step-fix-file-urls", "cleanup", "cpu-usage", "current-action", "database-migrations", "duration", "estimated-time-remaining", "every-1-day", "every-1-hour", "every-1-minute", "every-10-minutes", "every-30-minutes", "every-5-minutes", "every-6-hours", "filesystem-attachments", "filesystem-size", "gridfs-attachments", "gridfs-size", "gridfs-storage", "idle-migration", "job-details", "job-queue", "last-run", "max-concurrent", "migrated-attachments", "migration-batch-size", "migration-cpu-threshold", "migration-delay-ms", "migration-log", "migration-markers", "migration-resumed", "migration-steps", "next", "next-run", "of", "operation-type", "overall-progress", "page", "pause-migration", "previous", "refresh", "remaining-attachments", "resume-migration", "run-once", "s3-attachments", "s3-size", "s3-storage", "scanning-status", "schedule", "start-test-operation", "step-progress", "stop-migration", "system-resources", "total-attachments", "total-operations", "total-size", "weight", "cron", "current-step", "otp", "already-account", "size-bytes", "last-modified", "api-endpoints", "otp-required", "login", "file", "log", "logout", "server", "protocol", "summary", "problems-status-title", "repairing", "cpu-usage-current", "cpu-load-average", "event-severity", "event-action", "event-source", "event-detail", "event-ip", "event-ipv4", "event-ipv6", "event-attempts", "integrityReportTitle", "flow-unknown", "flow-signal", "flow-blocker", "flow-target-date", "flow-size"];
 for(const key of keys){
  assert.notEqual(data[key],'Nsɛm a ɛfa dwumadi yi ho',key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const [key,value] of Object.entries(data)) assert.notEqual(value,'Nsɛm a ɛfa dwumadi yi ho',key);
 for(const key of ['every-1-day','every-1-hour','every-1-minute','every-5-minutes','every-10-minutes','every-30-minutes','every-6-hours']) assert.equal(data[key].match(/\d+/)[0],english[key].match(/\d+/)[0]);
 assert.match(data['migration-cpu-threshold'],/CPU.*%/);
 assert.match(data['migration-delay-ms'],/ms/);
 for(const key of ['gridfs-storage','s3-storage','cron']) assert.equal(data[key],english[key]);
 for(const [key,id] of [['event-ip','IP'],['event-ipv4','IPv4'],['event-ipv6','IPv6'],['otp-required','OTP']]) assert.ok(data[key].includes(id));
 assert.equal(new Set(['pause-migration','resume-migration','stop-migration'].map(k=>data[k])).size,3);
 assert.notEqual(data.login,data.logout);
 assert.notEqual(data.next,data.previous);
 for(const key of ['migration-progress-status','problems-status-title']) assert.equal(data[key],data.status);
 assert.equal(data['event-action'],data.action);
 assert.equal(data['event-severity'],data['recovery-severity']);
 assert.equal(data['flow-size'],data['scrum-estimate']);
});

test('Akan board warnings preserve deletion consequences, privacy and recipient tokens', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["archive-permanent-delete-disabled-hint", "personal-list-width-description", "fixed-list-width-note", "app-is-offline", "auto-watch", "board-private-info", "board-public-info", "card-delete-notice", "card-delete-pop", "card-archive-pop", "list-archive-pop", "swimlane-archive-pop", "vote-delete-pop", "poker-delete-pop", "close-board-pop", "custom-field-delete-pop", "export-card-excel-no-disk-space", "import-board-instruction-about-errors", "import-trello-zip-progress", "trello-cancel-delete-confirm", "import-members-map-note", "label-delete-pop", "last-admin-desc", "leave-board-pop", "list-archive-cards-pop", "list-delete-pop", "muted-info", "public-desc", "remove-member-pop", "star-board-title", "tracking-info", "watching-info"];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.ok(!/\b(will|cannot|please|histanaay|wanaaks|restanaae|nore)\b/i.test(data[key]),key);
 }
 for(const key of ['board-private-info','board-public-info']) assert.deepEqual(data[key].match(/<[^>]+>/g),english[key].match(/<[^>]+>/g));
 assert.notEqual(data['board-private-info'],data['board-public-info']);
 for(const key of ['card-delete-pop','custom-field-delete-pop','label-delete-pop','list-delete-pop']) assert.match(data[key],/Wuntumi nsan nyi/);
 assert.match(data['public-desc'],/Google.*nkutoo/);
 assert.match(data['remove-member-pop'],/nyinaa.*amanneɛ/);
 assert.match(data['last-admin-desc'],/sohwɛfo biako/);
 assert.match(data['muted-info'],/remmɔ.*da/);
 assert.match(data['watching-info'],/bɛbɔ/);
 assert.match(data['import-trello-zip-progress'],/\.zip/);
 assert.match(data['close-board-pop'],/Bɔɔd Nyinaa/);
});

test('Akan configuration and rule messages preserve identifiers and deletion conditions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["avatars-upload-blocked-description", "org-sync-members-from-auth", "org-domains-description", "team-sync-members-from-auth", "board-delete-notice", "delete-board-confirm-popup", "delete-all-notifications-confirm", "delete-duplicate-lists-confirm", "r-when-due", "r-when-card-in-list", "r-when-a-card", "r-when-the-label", "r-when-a-member", "r-when-the-member", "r-when-a-assignee", "r-when-the-assignee", "r-when-a-attach", "r-when-a-checklist", "r-when-the-checklist", "r-when-a-item", "r-when-the-item", "r-when-a-card-is-moved", "swimlane-delete-pop", "act-a-dueAt"];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.ok(!/\b(will|cannot|When|anonor|Nore|brneing)\b/.test(data[key]),key);
 }
 for(const literal of ['a.example.com','kanban.example.org','MULTITENANCY=true']) assert.ok(data['org-domains-description'].includes(literal));
 assert.equal(data['org-sync-members-from-auth'],data['team-sync-members-from-auth']);
 assert.match(data['delete-duplicate-lists-confirm'],/din yɛ pɛ.*kaad biara nni mu/);
 for(const key of ['delete-board-confirm-popup','delete-all-notifications-confirm','swimlane-delete-pop']) assert.match(data[key],/Wuntumi nsan nyi/);
 for(const key of keys.filter(k=>k.startsWith('r-when-'))) assert.match(data[key],/^Bere a/);
 assert.equal(data['act-a-dueAt'].split('\n').length,english['act-a-dueAt'].split('\n').length);
});

test('Akan search and migration guidance preserves syntax and configuration examples', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["open-many-cards-at-once-description", "submit-on-enter-description", "roles-info", "globalSearch-instructions-description", "recovery-maintenance-note", "history", "email-domain-allowed-to-invite", "to-create-teams-contact-admin", "to-create-organizations-contact-admin", "database-migration-description", "database-migration-confirm", "sandstorm-migration-description", "sandstorm-delete-raw-mongodb-description", "sandstorm-delete-raw-mongodb-confirm", "globalSearch-instructions-notes-2"];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.ok(!/\b(will|cannot|When|Histanaay|Snestanaam|directanaaies)\b/.test(data[key]),key);
 }
 for(const literal of ['Enter','Shift+Enter','Ctrl/Cmd+Enter']) assert.ok(data['submit-on-enter-description'].includes(literal));
 for(const key of ['globalSearch-instructions-description','globalSearch-instructions-notes-2']) assert.deepEqual(data[key].match(/`[^`]+`/g),english[key].match(/`[^`]+`/g));
 for(const literal of ['mongodb://127.0.0.1:27018','mongodb://127.0.0.1:27019','WEKAN_FERRETDB_URL','WEKAN_MONGODB_URL','MONGO_URL','snap set wekan database=ferretdb','=mongodb']) assert.ok(data['database-migration-description'].includes(literal),literal);
 for(const literal of ['Sandstorm','MongoDB 3','FerretDB v1','SQLite','files/attachments','files/avatars']) assert.ok(data['sandstorm-migration-description'].includes(literal),literal);
 for(const key of ['sandstorm-delete-raw-mongodb-description','sandstorm-delete-raw-mongodb-confirm']) assert.match(data[key],/Wuntumi nsan nyi/);
 assert.match(data['database-migration-confirm'],/mfonini.*nsesa/);
});

test('Akan display and data controls preserve defaults, examples and feature scope', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["render-links-as-plain-text-description", "always-show-code-as-text-description", "disable-all-import-description", "disable-all-export-description", "disable-import-avatars-description", "disable-export-avatars-description", "anonymize-import-users-description", "anonymize-export-users-description", "anonymize-account-confirm-popup", "disable-activities-description", "disable-notifications-description", "disable-watch-description"];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.ok(!/\b(When|will|cannot|impanaat|expanaat|BueProject|Fanaagejo)\b/.test(data[key]),key);
  if(key!=='anonymize-account-confirm-popup') assert.ok(data[key].endsWith('Wɔadum fi mfiase.')||data[key].includes('Wɔadum fi mfiase,'),key);
 }
 for(const key of ['disable-all-import-description','disable-all-export-description']) for(const name of ['WeKan JSON','Kanboard','NextCloud Deck','OpenProject','GitHub','GitLab','Gitea','Forgejo']) assert.ok(data[key].includes(name),key+':'+name);
 for(const key of ['anonymize-import-users-description','anonymize-export-users-description']) for(const token of ['user1, user2, ...','@username','requested-by / assigned-by','"user"']) assert.ok(data[key].includes(token),key+':'+token);
 assert.ok(data['render-links-as-plain-text-description'].includes('[label](url)'));
 assert.ok(data['render-links-as-plain-text-description'].includes('<a href>'));
 assert.ok(data['always-show-code-as-text-description'].includes('<!-- -->'));
 assert.match(data['always-show-code-as-text-description'],/wuntumi mmia so, na ɛnyɛ adwuma/);
 assert.match(data['anonymize-account-confirm-popup'],/Wuntumi nsan nyi/);
 assert.match(data['disable-notifications-description'],/amanneɛbɔ nkutoo/);
 for(const key of ['disable-import-avatars-description','disable-export-avatars-description']) assert.match(data[key],/mfonini nkutoo/);
});

test('Akan migration confirmations preserve scope, limits and diagnostic quotes', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["s3-secret-key-menu-path", "run-comprehensive-migration-confirm", "run-delete-duplicate-empty-lists-migration-confirm", "run-restore-lost-cards-migration-confirm", "run-restore-all-archived-migration-confirm", "run-fix-missing-lists-migration-confirm", "run-fix-avatar-urls-migration-confirm", "run-fix-all-file-urls-migration-confirm", "migration-cpu-threshold-description", "migration-warning-text", "username-too-short", "problems-in-progress-help"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const key of keys.filter(k=>k.startsWith('run-'))) assert.ok(data[key].endsWith('Toa so?'),key);
 for(const literal of ['Lost Cards','swimlaneId','listId']) assert.ok(data['run-restore-lost-cards-migration-confirm'].includes(literal));
 assert.match(data['run-restore-lost-cards-migration-confirm'],/wɔmfa nkɔɔ adekorabea.*nkutoo/);
 assert.match(data['run-restore-all-archived-migration-confirm'],/NYINAA.*ID.*Ɛnyɛ mmerɛw/);
 assert.match(data['run-delete-duplicate-empty-lists-migration-confirm'],/asɛmti koro.*kura kaad.*nkutoo/);
 assert.match(data['migration-cpu-threshold-description'],/CPU.*10-90/);
 assert.match(data['username-too-short'],/3/);
 for(const literal of ['Access key ID','Secret access key','Download .csv']) assert.ok(data['s3-secret-key-menu-path'].includes(literal));
 for(const literal of ['Must be logged in','Loading, please wait']) assert.ok(data['problems-in-progress-help'].includes(literal));
 assert.match(data['migration-warning-text'],/bɛtoa so wɔ akyi/);
});

test('Akan import activities and archive guidance preserve targets and permission limits', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["act-importBoard", "act-importCard", "act-importList", "act-restoredCard", "activity-imported", "activity-imported-board", "no-boards-selected", "list-width-shared-note", "list-width-personal-note", "admin-desc", "attachment-delete-pop", "avatar-too-big", "card-archived", "board-archived", "card-comments-title", "card-delete-suggest-archive", "card-archive-suggest-cancel", "list-archive-suggest", "swimlane-archive-suggest", "userAnonymizePopup-title", "listWidthErrorPopup-title", "swimlaneHeightErrorPopup-title", "map-to-existing-user-desc", "map-to-existing-user-not-member"];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.ok(!/impanaat|restanaa|erranaa|\b(has|can|is|yet)\b/.test(data[key]),key);
 }
 for(const key of ['act-importCard','act-importList','act-restoredCard']) assert.match(data[key],/adwuma kwan __swimlane__.*bɔɔd __board__/);
 assert.match(data['attachment-delete-pop'],/korakora.*Wuntumi nsan nyi/);
 assert.match(data['card-delete-suggest-archive'],/woakora dwumadi kyerɛwtohɔ/);
 for(const key of ['card-archive-suggest-cancel','list-archive-suggest','swimlane-archive-suggest']) assert.match(data[key],/asan.*Adekorabea.*akyiri yi/);
 assert.match(data['avatar-too-big'],/ɛnsɛ sɛ ɛboro __size__/);
 assert.match(data['map-to-existing-user-desc'],/rentumi mma hokwan a ɛboro/);
 assert.match(data['userAnonymizePopup-title'],/akontaabu/);
 assert.notEqual(data['list-width-shared-note'],data['list-width-personal-note']);
});

test('Akan permission and error messages preserve access restrictions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["and-n-other-card", "and-n-other-card_plural", "comment-only-desc", "comment-assigned-only-desc", "no-comments-desc", "read-only-desc", "read-assigned-only-desc", "worker-desc", "enable-permanent-delete-description", "error-board-doesNotExist", "error-watch-disabled", "error-json-schema", "error-csv-schema", "error-import-empty-board", "error-list-doesNotExist", "error-user-disabled", "error-user-doesNotExist", "error-user-notAllowSelf", "error-username-taken", "error-orgname-taken", "error-teamname-taken", "user-can-not-export-excel", "export-card-excel-fields", "export-card-field-people"];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.ok(!/\b(Can|can|does|already|People)\b|expanaat|Creatanaa/.test(data[key]),key);
 }
 for(const key of ['comment-assigned-only-desc','read-assigned-only-desc']) assert.match(data[key],/ahyɛ ne nsa nkutoo/);
 for(const key of ['read-only-desc','read-assigned-only-desc']) assert.match(data[key],/Ontumi nsesa/);
 assert.match(data['no-comments-desc'],/Ontumi nhu/);
 assert.match(data['enable-permanent-delete-description'],/nko ara mmpopa biribiara/);
 assert.match(data['worker-desc'],/ankasa.*nkutoo/);
 assert.match(data['error-json-schema'],/JSON/);
 assert.match(data['error-csv-schema'],/CSV.*TSV/);
 assert.match(data['error-import-empty-board'],/fael foforo/);
 assert.notEqual(data['error-user-disabled'],data['error-user-doesNotExist']);
});

test('Akan import and filter instructions preserve machine-readable examples', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["user-can-not-export-card-to-pdf", "user-can-not-export-card-to-excel", "filter-creator-label", "filter-on", "filter-on-desc", "import-board", "import-board-instruction-kanboard", "import-board-instruction-asana", "import-board-instruction-zenkit", "import-board-instruction-jira", "import-board-instruction-excel", "import-trello-json-file-hint", "import-trello-zip-file-hint", "import-trello-zip-read-failed", "import-trello-zip-too-large", "import-trello-zip-too-many-files", "import-trello-zip-file-too-large", "import-trello-workspace-placeholder", "import-trello-parent-workspace", "trello-api-import-desc", "trello-api-credentials-saved", "trello-select-boards", "trello-cancel", "advanced-filter-description"];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.ok(!/impanaat|expanaat|operatanaa|\b(Could|too|Choose|Paste)\b/.test(data[key]),key);
 }
 const examples={
  'import-board-instruction-kanboard':['Kanboard','"columns"','"tasks"','title, description, column_name, swimlane_name, date_due, owner, tags'],
  'import-board-instruction-asana':['{ "data": [...] }','GET /tasks','memberships','Done'],
  'import-board-instruction-zenkit':['{ "title", "stages":[...], "items":[...] }'],
  'import-board-instruction-jira':['GET /rest/api/3/search/jql','{ "issues": [...] }','"automationRules"'],
  'import-board-instruction-excel':['.xlsx','Title, Description, Status/List, Members, Labels'],
  'import-trello-zip-file-hint':['.zip','.json','Trello Card Attachments Downloader'],
  'advanced-filter-description':['== != <= >= && || ( )','Field1 == Value1',"'Field 1' == 'Value 1'",'F1 == V1 || F1 == V2','F1 == V1 && ( F2 == V2 || F2 == V3 )','F1 == /Tes.*/i'],
 };
 for(const [key,values] of Object.entries(examples)) for(const value of values) assert.ok(data[key].includes(value),key+':'+value);
 assert.equal(data['advanced-filter-description'].split(String.fromCharCode(92)).length,english['advanced-filter-description'].split(String.fromCharCode(92)).length);
 assert.notEqual(data['import-trello-zip-too-large'],data['import-trello-zip-too-many-files']);
 assert.match(data['trello-select-boards'],/biako/);
});

test('Akan invitations and membership notices preserve scope and message formatting', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["trello-cancel-delete", "trello-resume", "trello-delete-imported", "trello-import-errors", "import-members-map", "version-check-failed", "just-invited", "list-delete-suggest-archive", "multi-selection-on", "normal-desc", "notify-participate", "private-desc", "sandstorm-remove-member-warning", "has-overtime-cards", "has-spenttime-cards", "unsaved-description", "warn-list-archived", "wipLimitErrorPopup-dialog-pt1", "attachment-transfer-limits-description", "email-smtp-test-text", "error-notAuthorized", "org-admins-description", "r-w-card-created", "email-invite-register-text"];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.ok(!/impanaat|expanaat|\b(You|are|has|Can)\b/.test(data[key]),key);
 }
 assert.equal(data['email-invite-register-text'].split('\n').length,english['email-invite-register-text'].split('\n').length);
 assert.match(data['normal-desc'],/Otumi hwɛ na sesa.*Ontumi nsesa nhyehyɛe/);
 assert.match(data['private-desc'],/nkutoo/);
 assert.match(data['sandstorm-remove-member-warning'],/Ennyi.*Sandstorm grain/);
 assert.match(data['sandstorm-remove-member-warning'],/Share access/);
 assert.match(data['org-admins-description'],/biribi foforo biara nka ho.*rentumi mma.*rentumi nhwɛ/);
 assert.match(data['attachment-transfer-limits-description'],/API.*ano soronko/);
 assert.notEqual(data['trello-cancel-delete'],data['trello-resume']);
 assert.match(data['list-delete-suggest-archive'],/woakora dwumadi kyerɛwtohɔ/);
});

test('Akan rule imports and due reminders preserve state and permission scope', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["r-w-card-archived", "r-w-card-unarchived", "r-w-label-added", "r-w-label-removed", "r-w-member-added", "r-w-member-removed", "r-w-checklist-added", "r-w-attachment-added", "r-import-paste", "r-import-trello-note", "r-import-workflow-note", "r-is-moved", "r-checklist-note", "error-ldap-login", "org-number", "team-number", "people-number", "act-almostdue", "act-pastdue", "act-duenow", "delete-user-confirm-popup", "delete-team-confirm-popup", "delete-org-confirm-popup", "roles-status-desc", "delete-linked-card-before-this-card", "delete-linked-cards-before-this-list", "shared-templates-info", "dueCardsViewChange-choice-all-description", "globalSearchViewChange-choice-all-description", "dueCards-noResults-description"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const [a,b] of [['r-w-card-archived','r-w-card-unarchived'],['r-w-label-added','r-w-label-removed'],['r-w-member-added','r-w-member-removed']]) assert.notEqual(data[a],data[b]);
 assert.equal(new Set(['act-almostdue','act-pastdue','act-duenow'].map(k=>data[k])).size,3);
 for(const key of ['org-number','team-number','people-number']) assert.ok(data[key].endsWith(': '),key);
 for(const key of ['delete-user-confirm-popup','delete-team-confirm-popup','delete-org-confirm-popup']) assert.match(data[key],/Wuntumi nsan nyi/);
 for(const name of ['n8n','Node-RED','WeKan']) assert.ok(data['r-import-workflow-note'].includes(name));
 assert.match(data['r-import-trello-note'],/Trello.*Butler.*ammataa ho/);
 assert.match(data['globalSearchViewChange-choice-all-description'],/wowɔ ho kwan.*ahyɛ wo nsa.*nkutoo/);
 assert.match(data['roles-status-desc'],/ansa na woasie/);
});

test('Akan search help preserves operator syntax and filtering semantics', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["globalSearch-instructions-operators", "globalSearch-instructions-operator-label", "globalSearch-instructions-operator-user", "globalSearch-instructions-operator-member", "globalSearch-instructions-operator-assignee", "globalSearch-instructions-operator-creator", "globalSearch-instructions-operator-due", "globalSearch-instructions-operator-status", "globalSearch-instructions-operator-has", "globalSearch-instructions-operator-sort", "globalSearch-instructions-operator-limit", "globalSearch-instructions-notes-1", "globalSearch-instructions-notes-3", "globalSearch-instructions-notes-3-2", "globalSearch-instructions-notes-5", "sort-is-on"];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.deepEqual(data[key].match(/`[^`]+`/g),english[key].match(/`[^`]+`/g),key);
  assert.deepEqual(data[key].match(/<[^>]+>/g),english[key].match(/<[^>]+>/g),key);
 }
 assert.match(data['globalSearch-instructions-operator-has'],/botae biara nni/);
 assert.match(data['globalSearch-instructions-operator-sort'],/soro ba fam/);
 assert.match(data['globalSearch-instructions-operator-limit'],/nɔma mũ a ɛboro 0/);
 assert.match(data['globalSearch-instructions-notes-3'],/AND.*nyinaa hyia nkutoo/);
 assert.match(data['globalSearch-instructions-notes-5'],/wɔnhwehwɛ.*adekorabea/);
 assert.notEqual(data['globalSearch-instructions-operator-member'],data['globalSearch-instructions-operator-assignee']);
});

test('Akan diagnostics preserve commands, report granularity and deletion guards', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["import-dependencies-parse-error", "location-detect-none", "now-activities-of-all-boards-are-hidden", "creator", "creator-on-minicard", "filename-invisible-legend", "office-no-results", "api-report-desc", "api-no-calls", "recovery-report-desc", "recovery-no-events", "display-card-creator", "delete-org-warning-message", "delete-team-warning-message", "add-teams-label", "add-organizations-label", "move-attachments-none-found", "server-error-troubleshooting"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.deepEqual(data['server-error-troubleshooting'].match(/`[^`]+`/g),english['server-error-troubleshooting'].match(/`[^`]+`/g));
 assert.equal(data['server-error-troubleshooting'].split('\n').length,english['server-error-troubleshooting'].split('\n').length);
 assert.match(data['api-no-calls'],/WITH_API=true/);
 assert.match(data['api-report-desc'],/akontaabu.*nkitahodi beae.*ɛnyɛ nkyerɛw biako ma adesrɛ biara/);
 for(const key of ['delete-org-warning-message','delete-team-warning-message']) assert.match(data[key],/rentumi mpopa.*biako ka ho/);
 assert.match(data['move-attachments-none-found'],/biribiara nni hɔ/);
 assert.match(data['recovery-report-desc'],/MongoDB/);
 assert.match(data['filename-invisible-legend'],/Kɔkɔɔ/);
});

test('Akan storage maintenance and support messages preserve operational limits', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["attachment-repair-locations-description", "default-save-storage-description", "mongodb-compact-description", "mongodb-compact-warning", "if-you-already-have-an-account", "invalid-file", "preview-pdf-not-supported", "translation-number", "delete-translation-confirm-popup", "import-board-zip", "support-info-not-added-yet", "support-info-only-for-logged-in-users", "accessibility-info-not-added-yet", "accounts-lockout-info"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['mongodb-compact-description'],/MongoDB GridFS.*so ntew ankasa.*wɔawie.*nkutoo/);
 assert.match(data['mongodb-compact-warning'],/secondaries.*afei primary/);
 assert.match(data['mongodb-compact-warning'],/afiri biako.*oplog.*Meteor.*primary no nkutoo/);
 assert.match(data['attachment-repair-locations-description'],/GridFS.*cloud.*beae ankasa/);
 assert.match(data['import-board-zip'],/\.zip.*JSON/);
 assert.match(data['preview-pdf-not-supported'],/PDF/);
 assert.match(data['support-info-only-for-logged-in-users'],/wɔakɔ mu nkutoo/);
 assert.match(data['delete-translation-confirm-popup'],/Wuntumi nsan nyi/);
 assert.match(data['invalid-file'],/wɔgyae/);
});

test('Akan account states and card loading preserve opposite actions and configuration', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["accounts-lockout-settings-updated", "accounts-lockout-no-locked-users", "accounts-lockout-user-unlocked", "accounts-lockout-user-locked", "admin-people-user-active", "admin-people-user-inactive", "accounts-lockout-all-users-unlocked", "attachments-path-description", "avatars-path-description", "cron-no-errors", "cron-errors-cleared", "cards-loading-description", "cards-loading-lazy-note", "disable-all-import"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['admin-people-user-active'],/reyɛ adwuma.*dum no/);
 assert.match(data['admin-people-user-inactive'],/adum.*sɔ no/);
 assert.notEqual(data['accounts-lockout-user-locked'],data['accounts-lockout-user-unlocked']);
 assert.match(data['accounts-lockout-all-users-unlocked'],/nyinaa/);
 for(const literal of ['CARDS_LOADING','all/lazy/auto','CARDS_LOADING_LAZY_THRESHOLD']) assert.ok(data['cards-loading-description'].includes(literal));
 assert.match(data['cards-loading-lazy-note'],/sɔhwɛ mu.*yɛ pɛpɛɛpɛ.*Gantt.*nkutoo.*san bue/);
 assert.match(data['cron-no-errors'],/Mfomso biara nni hɔ/);
 assert.match(data['disable-all-import'],/nyinaa/);
});

test('Akan backup and migration descriptions preserve ownership and deletion scope', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["disable-all-export", "disable-import-avatars", "disable-export-avatars", "anonymize-import-users", "anonymize-export-users", "anonymize-account", "backup-scope-description", "gridfs-move-collectionfs-note", "writable-path-description", "delete-duplicate-empty-lists-migration-description", "restore-lost-cards-migration-description", "migrations-admin-only", "migrations-description", "restore-lost-cards-nothing-to-restore", "conversion-info-text", "migration-info-text"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['backup-scope-description'],/akontaabu.*nka ho.*wɔ nkutoo so/);
 assert.match(data['delete-duplicate-empty-lists-migration-description'],/kaad biara nni mu NA.*asɛmti yɛ pɛ.*ɛwɔ kaad.*nkutoo/);
 for(const literal of ['swimlaneId','listId','Lost Cards']) assert.ok(data['restore-lost-cards-migration-description'].includes(literal));
 assert.match(data['gridfs-move-collectionfs-note'],/CollectionFS.*akorabea foforo/);
 assert.match(data['migrations-admin-only'],/sohwɛfo nkutoo/);
 assert.match(data['conversion-info-text'],/pɛnkoro.*bɔɔd biara/);
 assert.match(data['migration-info-text'],/toa so wɔ akyi.*brawsa no mu mpo/);
 assert.equal(data['anonymize-account'],data['userAnonymizePopup-title']);
 assert.notEqual(data['disable-import-avatars'],data['disable-export-avatars']);
 assert.notEqual(data['anonymize-import-users'],data['anonymize-export-users']);
});

test('Akan account and repair results preserve counts and incomplete outcomes', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["monitoring-export-failed", "account-locked", "username-password-required", "password-mismatch", "account-created", "problems-summary-help", "problems-none-in-progress", "repair-broken-cards-done-unfixable", "restore-list-swimlanes-done", "export-card-details", "import-here-instruction", "import-not-wekan-export", "globalSearch-instructions-operator-number", "import-board-source", "import-parts-instruction", "import-wekan-file", "flow-samples", "flow-episodes", "flow-history-days", "flow-details"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['account-locked'],/bere tiaa bi.*akyiri yi/);
 assert.match(data['password-mismatch'],/nhyia/);
 assert.match(data['repair-broken-cards-done-unfixable'],/__unfixable__ nni bɔɔd.*ntumi nsiesie/);
 assert.match(data['restore-list-swimlanes-done'],/Wɔantumi.*__remaining__/);
 for(const key of ['import-here-instruction','import-wekan-file']) assert.match(data[key],/\.json.*\.zip/);
 assert.match(data['import-parts-instruction'],/nkutoo.*ara di dwuma/);
 const key='globalSearch-instructions-operator-number';
 assert.deepEqual(data[key].match(/`[^`]+`/g),english[key].match(/`[^`]+`/g));
 assert.deepEqual(data[key].match(/<[^>]+>/g),english[key].match(/<[^>]+>/g));
 assert.notEqual(data['flow-samples'],data['flow-episodes']);
});

test('Akan embedded filler corrections preserve report limits and activity tokens', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["activity-joined", "activity-on", "activity-unjoined", "board-nb-stars", "label-default", "email-templates-title", "email-templates-invite-subject", "email-templates-invite-body", "email-templates-activity-subject", "email-templates-activity-body", "r-edit-rule-trigger-action", "r-when-a-due-date-changed", "r-when-a-end-date-changed", "r-when-a-received-date-changed", "r-remove-all-labels", "almostdue", "pastdue", "duenow", "act-withDue", "background-too-big", "wip-limit-group-apply-swimlane", "board-view-blocker-analysis", "board-view-size-cycle-time", "flow-cycle-days", "flow-age-days", "flow-p85", "flow-unusual", "flow-active", "flow-blocked-days", "flow-unknown-start", "flow-target-count", "flow-finish-days", "flow-beyond-horizon", "flow-size-source", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "flow-note-sizeCycleTime", "time-adjustments", "time-adjustment-note"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const [key,value] of Object.entries(data)) assert.ok(!value.includes('Nsɛm a ɛfa dwumadi yi ho'),key);
 assert.ok(data['background-too-big'].includes('{{size}}'));
 assert.equal(new Set(['almostdue','pastdue','duenow'].map(k=>data[k])).size,3);
 assert.match(data['flow-note-agingWip'],/85.*anum.*wonnim/);
 assert.match(data['flow-note-monteCarlo'],/2,000.*UTC.*3,650/);
 assert.match(data['flow-note-monteCarlo'],/ɛn[y]?yɛ bɔhyɛ/);
 assert.match(data['flow-note-monteCarlo'],/nkɔmhyɛ biara nni hɔ/);
 assert.match(data['flow-note-blockerAnalysis'],/bere koro mu.*mmiako mmiako/);
 assert.match(data['flow-note-sizeCycleTime'],/Mfiase nni hɔ.*bere a wɔyɛe.*Awiei nni hɔ.*adekorabea/);
 assert.match(data['time-adjustment-note'],/nyɛ bere biara.*0 yɛ nsiesie.*Wɔrentumi/);
 assert.notEqual(data['email-templates-invite-subject'],data['email-templates-invite-body']);
});

test('Akan display toggles preserve enabled states and opposite next actions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["multi-selection-active", "select-only-one-board", "set-selected-home", "home-board-badge", "home-board-empty", "click-to-enable-fixed-list-width", "click-to-disable-fixed-list-width", "keyboard-shortcuts-enabled", "keyboard-shortcuts-disabled", "add-after-list", "mobile-desktop-toggle", "click-to-enable-auto-width", "click-to-disable-auto-width", "card-aging-tier1", "card-aging-tier2", "card-aging-tier3", "custom-field-dropdown-options-placeholder", "import-trello-failed", "import-trello-zip-failed", "trello-api-credentials-required", "invalid-year", "invalid-user"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const suffix of ['fixed-list-width','auto-width']){
  assert.match(data['click-to-enable-'+suffix],/^Wɔadum.*sɔ no/);
  assert.match(data['click-to-disable-'+suffix],/^Wɔasɔ.*dum no/);
 }
 assert.match(data['keyboard-shortcuts-enabled'],/^Wɔasɔ.*dum no/);
 assert.match(data['keyboard-shortcuts-disabled'],/^Wɔadum.*sɔ no/);
 for(const key of ['select-only-one-board','home-board-empty']) assert.match(data[key],/biako pɛ/);
 for(const n of [1,2,3]) assert.ok(data['card-aging-tier'+n].includes(String(n)));
 assert.equal(new Set([1,2,3].map(n=>data['card-aging-tier'+n])).size,3);
 assert.match(data['custom-field-dropdown-options-placeholder'],/Enter/);
 assert.match(data['invalid-year'],/anan.*2026/);
 assert.match(data['trello-api-credentials-required'],/Trello API.*token.*nyinaa/);
});


test('Akan input and scheduled-job errors preserve limits and distinct operations', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["search-example", "set-default-board-title", "unset-default-board-title", "upload-failed", "attachment-transfer-limits-save-failed", "attachment-transfer-limits-invalid-value", "add-custom-html-after-body-start", "submit-on-enter", "roles-status-manage", "invalid-domain", "custom-field-stringtemplate-item-placeholder", "move-storage-all", "default-save-storage-save-failed", "support-page-enabled", "accounts-lockout-locked-users-info", "board-archive-failed", "board-backup-failed", "board-cleanup-failed", "cron-job-delete-failed", "cron-job-pause-failed", "cron-job-resume-failed", "cron-job-start-failed"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const key of ['search-example','submit-on-enter','custom-field-stringtemplate-item-placeholder']) assert.match(data[key],/Enter/);
 assert.match(data['attachment-transfer-limits-invalid-value'],/ɛboro 0/);
 assert.match(data['invalid-domain'],/example\.com.*@.*ntam kwan nni mu/);
 assert.match(data['add-custom-html-after-body-start'],/<body>.*akyi/);
 assert.match(data['set-default-board-title'],/mbue ankasa/);
 assert.match(data['unset-default-board-title'],/gyae.*ebue ankasa/);
 for(const kind of ['archive','backup','cleanup']) assert.match(data['board-'+kind+'-failed'],/Wɔantumi anhyɛ bere/);
 const jobs=['delete','pause','resume','start'].map(action=>data['cron-job-'+action+'-failed']);
 assert.equal(new Set(jobs).size,4);
 for(const value of jobs) assert.match(value,/^Wɔantumi/);
 assert.match(data['cron-job-pause-failed'],/kakra/);
 assert.match(data['cron-job-resume-failed'],/ansan antoa.*so/);
 assert.match(data['accounts-lockout-locked-users-info'],/seesei.*mpɛn pii.*wɔantumi/);
});


test('Akan migration and deletion messages preserve failure states and confirmation targets', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["cron-no-failed-migrations", "cron-migrations-retried", "cloud-settings-saved", "cloud-settings-save-failed", "migration-pause-failed", "migration-start-failed", "migration-stop-failed", "s3-settings-save-failed", "s3-settings-saved", "migration-delay-ms-description", "migration-resume-failed", "monitoring-refresh-failed", "invalid-credentials", "account-creation-failed", "import-scoped-failed", "activity-startDate", "allboards.delete-workspace-confirm", "card_members", "card_assignees", "delete-avatar-confirm", "comment-delete", "confirm-subtask-delete-popup", "confirm-checklist-delete-popup", "confirm-checklist-item-delete-popup", "enable-permanent-delete", "editCardStartDatePopup-title", "email-enrollAccount-text", "export-card-field-dates", "custom-private-desc-placeholder", "custom-public-desc-placeholder"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const kind of ['pause','start','stop','resume']) assert.match(data['migration-'+kind+'-failed'],/^Wɔantumi/);
 assert.equal(new Set(['pause','start','stop','resume'].map(k=>data['migration-'+k+'-failed'])).size,4);
 assert.match(data['migration-delay-ms-description'],/sekan nkyem apem.*100-10000/);
 for(const key of ['s3-settings-saved','s3-settings-save-failed']) assert.match(data[key],/S3/);
 assert.match(data['cloud-settings-saved'],/^Wɔasie/);
 assert.match(data['cloud-settings-save-failed'],/^Wɔantumi ansie/);
 for(const key of ['allboards.delete-workspace-confirm','delete-avatar-confirm','comment-delete','confirm-subtask-delete-popup','confirm-checklist-delete-popup','confirm-checklist-item-delete-popup']) assert.match(data[key],/^Wugye di.*wopopa.*\?$/);
 assert.notEqual(data['confirm-checklist-delete-popup'],data['confirm-checklist-item-delete-popup']);
 assert.match(data['enable-permanent-delete'],/sohwɛfo panyin.*korakora/);
 assert.equal(data['email-enrollAccount-text'].split('\n\n').length,english['email-enrollAccount-text'].split('\n\n').length);
 assert.notEqual(data['card_members'],data['card_assignees']);
 assert.match(data['custom-private-desc-placeholder'],/hɔ kwa.*kokoam/);
 assert.match(data['custom-public-desc-placeholder'],/hɔ kwa.*baguam/);
});


test('Akan storage controls preserve credential retention and provider navigation', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["rescue-card-description-dialogue", "shortcut-add-self", "shortcut-assign-self", "custom-top-left-corner-logo-height", "default-authentication-method", "accounts-allowUserDelete", "start-day-of-week", "board-background-delete-pop", "default-save-storage", "default-save-storage-saved", "board-status-loading-mode", "max-upload-filesize", "allowed-upload-filetypes", "cron-job-delete-confirm", "cron-no-paused-migrations", "cards-loading", "gcs-credentials-description", "cloud-secret-keep-blank", "azure-container-menu-path", "gcs-credentials-menu-path", "cloud-secret-set", "migration-stop-confirm", "pause-all-migrations", "start-all-migrations", "stop-all-migrations", "step-update-cards", "start-time", "upload-repository", "sign-in-to-upload"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(data['cards-loading'],data['board-status-loading-mode']);
 assert.match(data['max-upload-filesize'],/bytes.*: $/);
 assert.match(data['allowed-upload-filetypes'],/: $/);
 assert.match(data['custom-top-left-corner-logo-height'],/soro benkum.*27/);
 assert.notEqual(data['shortcut-add-self'],data['shortcut-assign-self']);
 for(const key of ['cloud-secret-keep-blank','cloud-secret-set']) assert.match(data[key],/hɔ kwa/);
 assert.match(data['gcs-credentials-description'],/Ɛnyɛ ahyɛde.*JSON.*hɔ kwa.*anaa/);
 for(const text of ['Azure Portal','Storage accounts','Data storage','Containers','+ Container']) assert.ok(data['azure-container-menu-path'].includes(text),text);
 for(const text of ['Google Cloud Console','IAM & Admin','Service accounts','Keys','Add key','Create new key','JSON','Create']) assert.ok(data['gcs-credentials-menu-path'].includes(text),text);
 assert.match(data['pause-all-migrations'],/nyinaa kakra$/);
 assert.match(data['stop-all-migrations'],/nyinaa$/);
 assert.match(data['start-all-migrations'],/nyinaa ase$/);
 assert.match(data['migration-stop-confirm'],/nyinaa\?$/);
 assert.match(data['rescue-card-description-dialogue'],/ananmu\?$/);
});


test('Akan card and import controls preserve sample JSON and selection scope', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["error-user-notSameOrgOrTeam", "fixed-list-width", "close-add-checklist-item", "board_assignees", "card-members-title", "allowNonBoardMembers", "map-to-existing-user-search", "text-color", "text-background-color", "confirm-move-list-to-swimlane", "copy-text-to-clipboard", "copyManyCardsPopup-format", "error-json-malformed", "import-board-instruction-trello", "import-board-instruction-wekan", "import-trello-zip-no-boards", "import-trello-zip-unsafe-path", "select-all", "select-none", "list-archive-cards", "list-move-cards", "list-select-cards", "paste-or-dragdrop", "quick-access-description", "starred-boards-description", "uploading-files", "automatically-field-on-card", "always-field-on-card"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 const sample=JSON.parse(data['copyManyCardsPopup-format']);
 assert.equal(sample.length,3);
 for(const card of sample) assert.deepEqual(Object.keys(card),['title','description']);
 assert.equal(new Set(sample.map(c=>c.title)).size,3);
 for(const label of ['Menu','More','Print and Export','Export JSON']) assert.ok(data['import-board-instruction-trello'].includes("'"+label+"'"));
 for(const key of ['menu','export-board']) assert.ok(data['import-board-instruction-wekan'].includes("'"+data[key]+"'"));
 assert.match(data['import-trello-zip-no-boards'],/Wɔanhu.*\.json.*\.zip/);
 assert.match(data['import-trello-zip-unsafe-path'],/Wɔapo.*\.zip.*nni ahobammɔ/);
 assert.match(data['error-user-notSameOrgOrTeam'],/koro no ara.*nkutoo/);
 assert.match(data['allowNonBoardMembers'],/wɔakɔ mu.*nyinaa/);
 assert.match(data['automatically-field-on-card'],/foforo/);
 assert.match(data['always-field-on-card'],/nyinaa/);
 assert.notEqual(data['select-all'],data['select-none']);
 for(const action of ['archive','move','select']) assert.match(data['list-'+action+'-cards'],/nyinaa/);
 assert.match(data['paste-or-dragdrop'],/mfonini nkutoo/);
});


test('Akan rule and search controls preserve opposite actions and query syntax', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["r-select-all", "r-workflow-help", "r-move-all-cards", "r-remove-all", "r-create-card", "r-d-remove-all-member", "r-d-check-all", "r-d-uncheck-all", "authentication-type", "oidc-button-text", "restore-all", "delete-all", "hide-minicard-label-text", "remove-all-read", "remove-domain-from-board", "shared-templates-select-scope", "autoAddUsersWithDomainName", "comment-not-found", "globalSearch-instructions-operator-comment", "globalSearch-instructions-operator-hash", "globalSearch-instructions-operator-org", "globalSearch-instructions-operator-team", "globalSearch-instructions-status-all"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const key of keys.filter(k=>k.startsWith('globalSearch-'))){
  assert.deepEqual(data[key].match(/`[^`]+`/g),english[key].match(/`[^`]+`/g),key);
  assert.deepEqual(data[key].match(/<[^>]+>/g),english[key].match(/<[^>]+>/g),key);
 }
 assert.equal(data['r-select-all'],data['select-all']);
 assert.match(data['r-d-check-all'],/^Hyɛ.*nyinaa.*wɔawie/);
 assert.match(data['r-d-uncheck-all'],/^Yi.*nyinaa ho$/);
 assert.notEqual(data['restore-all'],data['delete-all']);
 assert.match(data['remove-all-read'],/wɔakenkan/);
 assert.match(data['oidc-button-text'],/OIDC/);
 assert.match(data['globalSearch-instructions-status-all'],/nea ɛwɔ adekorabea.*nea enni adekorabea/);
 assert.match(data['globalSearch-instructions-operator-org'],/ahyehyɛde/);
 assert.match(data['globalSearch-instructions-operator-team'],/kuw/);
 assert.match(data['r-workflow-help'],/wɔhyehyɛ mmara.*wɔhɔ|wɔhyehyɛ mmara.*ɛwɔ hɔ dedaw/);
});


test('Akan file and memory labels preserve products and migration scope', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["import-dependencies-file", "filesReportTitle", "remove-team-from-table", "Node_heap_total_heap_size", "Node_heap_total_heap_size_executable", "Node_heap_total_physical_size", "Node_heap_total_available_size", "Node_heap_used_heap_size", "Node_heap_heap_size_limit", "Node_memory_usage_rss", "Node_memory_usage_heap_total", "remove-organization-from-board", "newlineBecomesNewChecklistItem", "newLineNewItem", "newlineBecomesNewChecklistItemOriginOrder", "move-all-attachments-to-fs", "move-all-attachments-to-gridfs", "move-all-attachments-to-s3", "move-all-attachments-of-board-to-fs", "move-all-attachments-of-board-to-gridfs", "move-all-attachments-of-board-to-s3", "move-storage-gridfs", "move-all-attachments", "stats-mongo-files"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const key of ['move-storage-gridfs','stats-mongo-files']) assert.equal(data[key],english[key]);
 for(const key of keys.filter(k=>k.startsWith('Node_'))) assert.match(data[key],/^Node /);
 assert.match(data['Node_memory_usage_rss'],/RAM.*RSS/);
 assert.match(data['Node_heap_heap_size_limit'],/anohyeto/);
 assert.equal(new Set(keys.filter(k=>k.startsWith('Node_')).map(k=>data[k])).size,8);
 for(const suffix of ['fs','gridfs','s3']){
  const all=data['move-all-attachments-to-'+suffix];
  const board=data['move-all-attachments-of-board-to-'+suffix];
  assert.match(all,/nyinaa/); assert.match(board,/bɔɔd.*nyinaa/);
  assert.notEqual(all,board);
 }
 for(const suffix of ['gridfs','s3']) for(const prefix of ['move-all-attachments-to-','move-all-attachments-of-board-to-']) assert.ok(data[prefix+suffix].includes(suffix==='s3'?'S3':'GridFS'));
 assert.match(data['import-dependencies-file'],/JSON.*SVG/);
 assert.match(data['newLineNewItem'],/biako =.*biako/);
 assert.match(data['newlineBecomesNewChecklistItemOriginOrder'],/mfiase/);
 assert.notEqual(data['remove-team-from-table'],data['remove-organization-from-board']);
});


test('Akan storage guidance preserves provider names and repair identifiers', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["hideAllChecklistItems", "accounts-lockout-confirm-unlock-all", "filesystem-path-description", "filesystem-enabled-description", "database-migrate-to-ferretdb", "database-migrate-to-mongodb", "sandstorm-delete-raw-mongodb", "sandstorm-raw-mongodb-deleted", "disable-activities", "disable-notifications", "theme-override-all-tenants", "gcs-key-filename-description", "azure-container-description", "gcs-bucket-description", "gcs-key-filename-menu-path", "gridfs-enabled-description", "s3-bucket-description", "s3-enabled-description", "restore-all-archived-migration-description", "fix-all-file-urls-migration"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['database-migrate-to-ferretdb'],/FerretDB v1 \(SQLite\)/);
 assert.match(data['database-migrate-to-mongodb'],/MongoDB/);
 assert.match(data['gridfs-enabled-description'],/MongoDB GridFS/);
 assert.match(data['s3-enabled-description'],/AWS S3.*anaa MinIO/);
 assert.match(data['gcs-key-filename-description'],/^Ɛnyɛ ahyɛde.*JSON/);
 assert.match(data['gcs-key-filename-menu-path'],/WeKan.*ANAA.*JSON/);
 assert.match(data['gcs-bucket-description'],/Cloud Storage/);
 assert.match(data['restore-all-archived-migration-description'],/adwuma akwan.*din a wɔahyehyɛ.*kaad.*nyinaa/);
 for(const identifier of ['swimlaneId','listId']) assert.ok(data['restore-all-archived-migration-description'].includes(identifier));
 assert.match(data['accounts-lockout-confirm-unlock-all'],/yi akwansiw.*nyinaa/);
 assert.match(data['hideAllChecklistItems'],/^Suma.*nyinaa/);
 assert.match(data['disable-activities'],/^Dum.*nyinaa/);
 assert.match(data['disable-notifications'],/^Dum.*nyinaa/);
 assert.match(data['sandstorm-raw-mongodb-deleted'],/^Wɔapopa.*beae a ada hɔ$/);
 assert.match(data['fix-all-file-urls-migration'],/URL nyinaa/);
});


test('Akan board controls and account emails preserve actions and placeholders', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["fix-all-file-urls-migration-description", "step-scan-files", "no-new-problems", "card-labels-title", "casSignIn", "samlSignIn", "close-dialog", "close-popup", "email-verifyEmail-text", "email-resetPassword-text", "trello-api-token", "label-text-follows-board", "label-text-use-board-default", "not-accepted-yet", "board-drag-drop-reorder-or-click-open", "board-open-and-move-between-remaining-and-workspaces", "click-to-star", "click-to-unstar", "click-to-star-page", "click-to-unstar-page", "sort-desc", "filter-hide-empty", "set-color-list"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const suffix of ['','-page']){
  assert.match(data['click-to-star'+suffix],/hyɛ.*nsoromma/);
  assert.match(data['click-to-unstar'+suffix],/yi nsoromma.*fi/);
 }
 for(const key of ['email-resetPassword-text','email-verifyEmail-text']) assert.equal(data[key].split('\n\n').length,english[key].split('\n\n').length);
 assert.notEqual(data['email-resetPassword-text'],data['email-verifyEmail-text']);
 assert.match(data['not-accepted-yet'],/Wɔnnya.*ntom/);
 assert.match(data['no-new-problems'],/biara nni hɔ/);
 assert.match(data['filter-hide-empty'],/biribiara nni mu/);
 assert.match(data['trello-api-token'],/Trello API token.*API/);
 assert.match(data['casSignIn'],/CAS/); assert.match(data['samlSignIn'],/SAML/);
 assert.match(data['fix-all-file-urls-migration-description'],/URL nyinaa.*akorabea.*asɛe/);
 assert.match(data['board-open-and-move-between-remaining-and-workspaces'],/__workspaces__/);
});


test('Akan setting actions preserve WIP alternatives and empty-field matching', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["multi-selection-label", "multi-selection-member", "set-wip-limit-value", "wipLimitErrorPopup-dialog-pt2", "OS_Totalmem", "setCardColorPopup-title", "setSelectionColorPopup-title", "activity-set-customfield", "r-w-set-received-now", "r-card-button", "r-board-button", "r-set-date-relative", "set-filter", "r-set-color", "r-board-note", "set-as-active", "Node_memory_usage_heap_used", "accounts-lockout-click-to-unlock", "cron-clear-errors", "delete-duplicate-empty-lists-migration", "step-delete-duplicate-empty-lists"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['wipLimitErrorPopup-dialog-pt2'],/baabi foforo.*anaa.*WIP.*nkɔ soro/);
 assert.match(data['set-wip-limit-value'],/dodow a ɛsen biara/);
 assert.match(data['r-board-note'],/hɔ kwa.*botae biara bɛfata/);
 assert.match(data['OS_Totalmem'],/^OS /);
 assert.match(data['Node_memory_usage_heap_used'],/^Node .*ankasa$/);
 assert.equal(data['setCardColorPopup-title'],data['set-color-list']);
 assert.match(data['setSelectionColorPopup-title'],/nea woapaw/);
 assert.notEqual(data['r-card-button'],data['r-board-button']);
 assert.match(data['r-w-set-received-now'],/seesei.*wɔgyee/);
 assert.match(data['r-set-date-relative'],/egyina seesei/);
 assert.match(data['accounts-lockout-click-to-unlock'],/yi akwansiw/);
 assert.match(data['cron-clear-errors'],/nyinaa/);
 assert.equal(data['delete-duplicate-empty-lists-migration'],data['step-delete-duplicate-empty-lists']);
 assert.match(data['delete-duplicate-empty-lists-migration'],/ɛyɛ pɛ.*biribiara nni mu/);
});


test('Akan archive and color labels preserve targets and activity tokens', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["act-archivedBoard", "act-archivedCard", "act-archivedList", "act-archivedSwimlane", "activity-archived", "allboards.workspace-color", "close-edit-checklist-item", "archive-list", "archive-swimlane", "archive-selection", "archiveBoardPopup-title", "archived-items", "archived-boards", "no-archived-boards", "archives", "board-change-color", "changeColorPopup-title", "allBoardsChangeColorPopup-title", "bucket-example", "listArchivePopup-title", "swimlaneArchivePopup-title", "vote-for-it", "cardArchivePopup-title", "listsortPopup-title", "change-color"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const key of keys.filter(k=>k.startsWith('act-archived')||k==='activity-archived')) assert.match(data[key],/^Wɔde.*kɔɔ adekorabea$/);
 for(const key of ['archiveBoardPopup-title','listArchivePopup-title','swimlaneArchivePopup-title','cardArchivePopup-title']) assert.match(data[key],/^Fa.*ade korabea|^Fa.*adekorabea\?$/);
 assert.equal(new Set(['archiveBoardPopup-title','listArchivePopup-title','swimlaneArchivePopup-title','cardArchivePopup-title'].map(k=>data[k])).size,4);
 assert.equal(data['archives'],data['archived-items']);
 assert.match(data['no-archived-boards'],/biara nni adekorabea/);
 assert.equal(new Set(['board-change-color','changeColorPopup-title','allBoardsChangeColorPopup-title','change-color'].map(k=>data[k])).size,1);
 assert.match(data['archive-selection'],/nea woapaw/);
 assert.match(data['vote-for-it'],/gye tom/);
 for(const key of keys) assert.doesNotMatch(data[key],/Kanaaabea|Colanaa|colanaa|fanaa/);
});


test('Akan import and invitation corrections preserve endpoints and message structure', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["theme-category", "color-orange", "worker", "copyManyCardsPopup-instructions", "custom-color", "date-format", "email-enrollAccount-subject", "email-invite-text", "push-invite-text", "error-linked-card-not-allowed", "export-card-attachment-uploaded-by", "export-card-attachment-uploaded-at", "sorted", "remove-sort", "list-sort-by", "filter-due-tomorrow", "import-board-instruction-openproject", "trello-import-more", "keyboard-shortcuts", "selection-color", "no-archived-cards", "no-archived-lists", "no-archived-swimlanes", "rescue-card-description", "select-color", "shortcut-show-shortcuts", "show-cards-minimum-count", "toggle-assignees"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['import-board-instruction-openproject'],/OpenProject.*GET \/api\/v3\/work_packages/);
 assert.equal(data['email-invite-text'],data['push-invite-text']);
 for(const key of ['email-invite-text','push-invite-text']) assert.equal(data[key].split('\n\n').length,english[key].split('\n\n').length);
 for(const suffix of ['cards','lists','swimlanes']) assert.match(data['no-archived-'+suffix],/biara nni adekorabea/);
 assert.equal(new Set(['cards','lists','swimlanes'].map(s=>data['no-archived-'+s])).size,3);
 assert.equal(data['select-color'],data['setCardColorPopup-title']);
 assert.notEqual(data['export-card-attachment-uploaded-by'],data['export-card-attachment-uploaded-at']);
 assert.match(data['toggle-assignees'],/1-9.*nnidiso nnidiso/);
 assert.match(data['error-linked-card-not-allowed'],/nkutoo.*Wɔmma kwan.*san ba bɔɔd/);
 assert.match(data['rescue-card-description'],/wɔnsiee.*ansa/);
 assert.match(data['filter-due-tomorrow'],/ɔkyena/);
 assert.match(data['show-cards-minimum-count'],/boro$/);
});


test('Akan upload and diagnostics labels preserve protocols and configuration names', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["toggle-labels", "upload", "upload-avatar", "uploaded-avatar", "upload-completed", "custom-top-left-corner-logo-image-url", "custom-top-left-corner-logo-link-url", "email-addresses", "smtp-port-description", "smtp-tls-description", "smtp-port", "smtp-tls", "webhook-token", "new-outgoing-webhook", "Platform", "Node", "Node_version", "Reactivity_order", "DDP_transport", "MongoDB_storage_engine", "OS_Freemem", "OS_Platform", "setCardActionsColorPopup-title", "setSwimlaneColorPopup-title"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(data.Node,english.Node);
 assert.match(data.Node_version,/^Node /);
 assert.match(data.Reactivity_order,/\(METEOR_REACTIVITY_ORDER\)/);
 assert.match(data.DDP_transport,/DDP.*\(DDP_TRANSPORT\)/);
 assert.match(data.MongoDB_storage_engine,/MongoDB/);
 assert.match(data.OS_Freemem,/^OS .*ɛda hɔ/);
 assert.match(data['smtp-tls-description'],/SMTP.*kwan.*TLS/);
 assert.match(data['smtp-port-description'],/Port.*SMTP.*email.*abɔnten/);
 assert.match(data['webhook-token'],/ɛnyɛ ahyɛde/);
 assert.match(data['toggle-labels'],/1-9.*anaa yi fi ho.*1-9 ka ho$/);
 for(const kind of ['image','link']) assert.match(data['custom-top-left-corner-logo-'+kind+'-url'],/soro benkum.*URL/);
 assert.notEqual(data['custom-top-left-corner-logo-image-url'],data['custom-top-left-corner-logo-link-url']);
 for(const key of ['setCardActionsColorPopup-title','setSwimlaneColorPopup-title']) assert.equal(data[key],data['select-color']);
 assert.match(data['upload-completed'],/awie$/);
});


test('Akan workflow labels preserve toggles, archive direction and literal markup', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["setListColorPopup-title", "card-sorting-by-number", "default-subtasks-board", "deposit-subtasks-list", "card-sorting-by-number-on-minicard", "r-new-rule-name", "r-toggle-rule-enabled", "r-workflow-view", "r-import-trello", "r-import-workflow", "r-workflow-format", "r-of-cards-in-list", "r-days-before", "r-for-n-days", "r-sort-list", "r-archived", "r-unarchived", "r-unarchive", "r-d-archive", "r-d-unarchive", "add-custom-html-before-body-end", "addmore-detail", "new", "newOrgPopup-title"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(data['setListColorPopup-title'],data['select-color']);
 assert.equal(data['r-sort-list'],data['listsortPopup-title']);
 assert.match(data['r-toggle-rule-enabled'],/^Sɔ.*anaa dum/);
 assert.match(data['r-import-trello'],/Trello Butler.*wobetumi/);
 assert.match(data['r-for-n-days'],/N/);
 assert.match(data['r-days-before'],/ansa/);
 assert.match(data['r-archived'],/akɔ adekorabea/);
 assert.match(data['r-unarchived'],/afi adekorabea aba/);
 assert.match(data['r-d-archive'],/kaad kɔ adekorabea/);
 assert.match(data['r-d-unarchive'],/kaad fi adekorabea ba/);
 assert.match(data['add-custom-html-before-body-end'],/HTML.*ansa.*<\/body>/);
 assert.match(data['card-sorting-by-number-on-minicard'],/nɔma.*kaad ketewa/);
 assert.match(data['deposit-subtasks-list'],/: $/);
 assert.match(data['default-subtasks-board'],/__board__/);
});


test('Akan sorting and report labels preserve search syntax and format entities', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["newTeamPopup-title", "newUserPopup-title", "shortName", "myCardsSortChange-title", "myCardsSortChangePopup-title", "label-color-not-found", "globalSearch-instructions-operator-at", "label-colors", "sort-cards", "sort-boards", "sort-boards-custom", "cardsSortPopup-title", "dependency-color", "upload-background", "location-address", "created-at-newest-first", "custom-field-stringtemplate-format", "custom-field-stringtemplate-separator", "reports", "securityReportTitle", "rulesReportTitle", "boardsReportTitle", "cardsReportTitle", "impersonationReportTitle"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 const key='globalSearch-instructions-operator-at';
 assert.deepEqual(data[key].match(/`[^`]+`/g),english[key].match(/`[^`]+`/g));
 assert.ok(data['custom-field-stringtemplate-format'].includes('%{value}'));
 for(const literal of ['&#32;','&nbsp;']) assert.ok(data['custom-field-stringtemplate-separator'].includes(literal));
 assert.equal(data['myCardsSortChange-title'],data['myCardsSortChangePopup-title']);
 assert.equal(data['sort-cards'],data['cardsSortPopup-title']);
 assert.match(data['created-at-newest-first'],/foforo sen biara di kan/);
 assert.match(data['sort-boards-custom'],/wotwe/);
 const reports=['securityReportTitle','rulesReportTitle','boardsReportTitle','cardsReportTitle','impersonationReportTitle'];
 assert.equal(new Set(reports.map(k=>data[k])).size,reports.length);
 for(const key of reports) assert.match(data[key],/amanneɛbɔ$/);
 assert.match(data['label-color-not-found'],/^Wɔanhu/);
 assert.equal(data['dependency-color'],data['allboards.workspace-color']);
});


test('Akan support and lockout labels preserve state and credential distinctions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["office-address", "editCardSortOrderPopup-title", "Node_heap_malloced_memory", "Node_heap_peak_malloced_memory", "Node_heap_does_zap_garbage", "Node_heap_number_of_native_contexts", "Node_heap_number_of_detached_contexts", "Node_memory_usage_external", "add-organizations", "originOrder", "storage", "uploading", "newTranslationPopup-title", "support", "supportPopup-title", "support-title", "support-content", "accounts-lockout-settings", "accounts-lockout-known-users", "accounts-lockout-unknown-users", "accounts-lockout-failures-before", "attachment-storage-configuration", "filesystem-enabled", "filesystem-disabled"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const key of keys.filter(k=>k.startsWith('Node_'))) assert.match(data[key],/^Node /);
 assert.match(data['Node_heap_malloced_memory'],/malloc/);
 assert.match(data['Node_heap_peak_malloced_memory'],/malloc.*ɛsen biara/);
 assert.match(data['Node_heap_does_zap_garbage'],/does_zap_garbage/);
 assert.match(data['Node_heap_number_of_detached_contexts'],/detached contexts/);
 assert.equal(data.support,data['supportPopup-title']);
 assert.notEqual(data['support-title'],data['support-content']);
 assert.match(data['accounts-lockout-known-users'],/edin.*teɛ.*asɛmfua.*nteɛ/);
 assert.match(data['accounts-lockout-unknown-users'],/edin.*nni hɔ/);
 assert.match(data['accounts-lockout-failures-before'],/dodow.*ansa/);
 assert.match(data['filesystem-enabled'],/^Wɔasɔ/);
 assert.match(data['filesystem-disabled'],/^Wɔadum/);
 assert.equal(data['office-address'],data['location-address']);
 assert.match(data.originOrder,/mfiase/);
});


test('Akan cloud storage guidance preserves provider navigation and role names', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["s3-minio-storage-description", "s3-force-path-style", "azure-blob-storage", "azure-blob-storage-description", "gcs-storage", "gcs-storage-description", "sandstorm-storage-item", "features-performance", "cards-loading-auto", "backup-storage", "gcs-permissions-note", "azure-account-name-description", "azure-account-name-menu-path", "azure-account-key-menu-path", "azure-connection-string-menu-path", "gcs-bucket-menu-path", "move-storage-gcs", "attachment-move-storage-azure", "attachment-move-storage-gcs", "s3-disabled", "mongodb-gridfs-storage", "s3-access-key-description", "s3-minio-storage", "s3-port", "s3-port-description"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const key of ['azure-blob-storage','azure-blob-storage-description','gcs-storage','gcs-storage-description','move-storage-gcs']) assert.equal(data[key],english[key]);
 for(const literal of ['AWS S3','MinIO','Cloudflare R2','Backblaze B2','Wasabi','DigitalOcean Spaces']) assert.ok(data['s3-minio-storage-description'].includes(literal));
 for(const key of ['azure-account-name-menu-path','azure-account-key-menu-path','azure-connection-string-menu-path']) for(const label of ['Azure Portal','Storage accounts','Security + networking','Access keys']) assert.ok(data[key].includes(label));
 for(const label of ['Google Cloud Console','Cloud Storage','Buckets','Permissions','Grant access','New principals','client_email','Storage Object Admin','Save']) assert.ok(data['gcs-permissions-note'].includes(label),label);
 assert.match(data['gcs-permissions-note'],/ɛkenkan.*ɛkyerɛw/);
 assert.match(data['s3-disabled'],/^Wɔadum/);
 assert.match(data['s3-force-path-style'],/path-style URL/);
 assert.match(data['cards-loading-auto'],/nkutoo.*bɔɔd akɛse/);
 assert.equal(data['sandstorm-storage-item'],data.storage);
});


test('Akan repair and monitoring labels preserve repair scope and technical names', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["s3-secret-key-description", "s3-ssl-enabled-description", "schedule-board-archive", "attachment-monitoring", "attachment-storage-settings", "comprehensive-board-migration-description", "restore-all-archived-migration", "fix-missing-lists-migration-description", "fix-avatar-urls-migration-description", "converting-board-description", "cpu-cores", "export-monitoring", "filesystem-storage", "force-board-scan", "memory-usage", "refresh-monitoring", "storage-distribution", "available-repositories", "repositories", "repository", "repository-name", "no-repositories", "create-repository", "cpu-cores-suffix"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['s3-secret-key-description'],/AWS S3 kokoam safoa/);
 assert.match(data['s3-ssl-enabled-description'],/SSL\/TLS.*S3/);
 assert.match(data['comprehensive-board-migration-description'],/nnidiso nnidiso.*kaad gyinabea.*adwuma akwan/);
 assert.match(data['fix-missing-lists-migration-description'],/ayera anaa asɛe/);
 assert.match(data['fix-avatar-urls-migration-description'],/mufo mfonini URL.*akorabea.*asɛe/);
 assert.match(data['converting-board-description'],/betumi agye bere kakra/);
 assert.match(data['restore-all-archived-migration'],/nyinaa ba$/);
 assert.match(data['schedule-board-archive'],/Hyɛ bere/);
 assert.equal(data['cpu-cores'],'CPU '+data['cpu-cores-suffix']);
 assert.match(data['no-repositories'],/^Wɔanhu.*biara$/);
 for(const key of ['available-repositories','repository-name','create-repository']) assert.ok(data[key].toLowerCase().includes(data.repository.toLowerCase()));
 assert.notEqual(data['export-monitoring'],data['refresh-monitoring']);
 assert.equal(data['attachment-storage-settings'],data.storage+' nhyehyɛe');
});


test('Akan drag and account guidance preserve optional inputs and provider labels', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["event-category", "userDeletePopup-title", "email-address", "accounts-allowEmailChange", "r-send-email", "azure-account-name", "clipboard", "email-resetPassword-subject", "import-attachments-zip", "import-trello-workspace", "shortcut-toggle-filterbar", "shortcut-toggle-searchbar", "shortcut-toggle-sidebar", "show-desktop-drag-handles", "drag-to-resize-sidebar", "drag-to-resize-left-menu", "drag-template-here-to-share", "drag-to-connect", "drag-board", "drag-board-to-workspace", "azure-connection-string-description", "s3-access-key-menu-path"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const key of ['import-attachments-zip','import-trello-workspace','azure-connection-string-description']) assert.match(data[key],/ɛnyɛ ahyɛde/i);
 assert.match(data['import-attachments-zip'],/Trello Card Attachments Downloader/);
 assert.match(data['azure-connection-string-description'],/edi mu.*din ne safoa ananmu/);
 for(const key of ['shortcut-toggle-filterbar','shortcut-toggle-searchbar','shortcut-toggle-sidebar']) assert.match(data[key],/^Bue anaa to/);
 assert.equal(new Set(['shortcut-toggle-filterbar','shortcut-toggle-searchbar','shortcut-toggle-sidebar'].map(k=>data[k])).size,3);
 for(const label of ['AWS Console','IAM','Users','Security credentials','Access keys','Create access key','Application running outside AWS','Access key ID']) assert.ok(data['s3-access-key-menu-path'].includes(label),label);
 assert.match(data['drag-board-to-workspace'],/__workspaces__/);
 assert.match(data['drag-to-resize-left-menu'],/benkum/);
 assert.equal(data['r-send-email'],data['r-d-send-email']);
 assert.equal(data['event-category'],data['theme-category']);
 assert.match(data['accounts-allowEmailChange'],/Ma kwan.*sesa/);
});


test('Akan field and rule labels preserve restore scope and administrator visibility', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["board-view-timeline-hint", "board-view-timeline-restore-confirm", "roadmap-empty-no-custom-fields", "rulesImportExportPopup-title", "createCustomField", "createCustomFieldPopup-title", "deleteCustomFieldPopup-title", "editCustomFieldPopup-title", "list-label-modifiedAt", "createBoardFromCardPopup-title", "show-field-on-card", "showLabel-field-on-card", "admin-only-field", "card-field-order", "r-board-rules", "r-add-rule", "r-delete-rule", "r-no-rules", "r-edit-rule", "r-export-json"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(data.createCustomField,data['createCustomFieldPopup-title']);
 assert.match(data['deleteCustomFieldPopup-title'],/^Popa.*\?$/);
 assert.match(data['admin-only-field'],/Bɔɔd sohwɛfo nkutoo/);
 assert.match(data['showLabel-field-on-card'],/agyiraehyɛde.*kaad ketewa/);
 assert.match(data['board-view-timeline-restore-confirm'],/asɛmti.*nkyerɛkyerɛmu.*din a wɔahyehyɛ.*agyiraehyɛde.*mufo.*da/);
 assert.match(data['board-view-timeline-restore-confirm'],/botae a wɔakyerɛ.*Wɔmpopa biribiara/);
 for(const literal of ['Version','Release']) assert.ok(data['roadmap-empty-no-custom-fields'].includes('"'+literal+'"'));
 assert.match(data['r-export-json'],/JSON/);
 assert.match(data['r-no-rules'],/biara nni hɔ/);
 assert.equal(new Set(['r-add-rule','r-delete-rule','r-edit-rule'].map(k=>data[k])).size,3);
 assert.match(data['list-label-modifiedAt'],/nea etwa to/);
 assert.match(data['card-field-order'],/nnidiso nnidiso/);
});


test('Akan grouping and field summaries preserve aggregates and synchronization interval', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["r-export-csv", "r-import-json", "r-import-csv", "r-import-done", "cloneBoardPopup-title", "same-width-for-all-lists", "default-on-public-board", "show-on-public-board", "default-on-private-board", "show-on-private-board", "notification-settings-popup-description", "board-table-group-by-swimlane-on", "board-table-group-by-swimlane-off", "show-subtasks-field", "sum-of-number-fields", "date-range-of-fields", "listSyncPopup-title", "list-sync-description"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['r-export-csv'],/CSV/);
 assert.match(data['r-import-json'],/JSON/);
 assert.match(data['r-import-csv'],/CSV/);
 assert.match(data['r-import-done'],/__count__/);
 assert.match(data['board-table-group-by-swimlane-on'],/^Wɔakyekyɛ.*Klik.*wɔnkyekyɛɛ/);
 assert.match(data['board-table-group-by-swimlane-off'],/^Wɔakyerɛ.*wɔnkyekyɛɛ.*Klik na kyekyɛ/);
 assert.match(data['sum-of-number-fields'],/nɔma.*atifi.*nyinaa a wɔaka abom/);
 assert.match(data['date-range-of-fields'],/nna.*atifi.*nna ntam/);
 assert.match(data['list-sync-description'],/simma 15 biara/);
 assert.ok(data['list-sync-description'].includes('"'+data['list-sync-now']+'"'));
 assert.match(data['notification-settings-popup-description'],/sohwɛfo.*afei bɔɔd.*afei wo ankasa/);
 for(const prefix of ['default-on-','show-on-']){
  assert.match(data[prefix+'public-board'],/baguam/);
  assert.match(data[prefix+'private-board'],/kokoam/);
 }
});


test('Akan timing and completion messages preserve old/new values and timeout uncertainty', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["act-completeChecklist", "activity-checklist-completed", "activity-checklist-completed-card", "activity-receivedDate", "activity-dueDate", "activity-endDate", "cardCustomField-datePopup-title", "editVoteEndDatePopup-title", "editPokerEndDatePopup-title", "editCardDueDatePopup-title", "editCardSpentTimePopup-title", "filter-dates-label", "filter-no-due-date", "inactive-member", "import-timeout", "editCardReceivedDatePopup-title", "editCardEndDatePopup-title", "act-a-endAt", "act-a-startAt", "act-a-receivedAt", "a-dueAt", "a-endAt", "a-startAt", "a-receivedAt"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(data['act-completeChecklist'],data['activity-checklist-completed-card']);
 assert.match(data['activity-checklist-completed'],/^awie/);
 for(const suffix of ['endAt','startAt','receivedAt']) assert.match(data['act-a-'+suffix],/__timeValue__ fi \(__timeOldValue__\)/);
 assert.equal(new Set(['endAt','startAt','receivedAt','dueAt'].map(s=>data['a-'+s])).size,4);
 assert.match(data['editPokerEndDatePopup-title'],/Planning Poker.*awiei da/);
 assert.match(data['filter-no-due-date'],/nni hɔ/);
 assert.match(data['import-timeout'],/kyɛe dodo.*wɔgyaee.*san sɔ hwɛ.*ebia.*anaa/);
 assert.match(data['editCardSpentTimePopup-title'],/bere a wɔde yɛɛ/);
 assert.notEqual(data['editCardDueDatePopup-title'],data['editCardEndDatePopup-title']);
 assert.match(data['inactive-member'],/ɔnyɛ adwuma seesei/);
});


test('Akan status and count labels preserve units, limits and permission scope', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["invite-people-success", "mongodb-compact-running", "board-status", "board-status-cards-with-time", "admin-people-active-status", "backup-datetime", "migration-stopped", "migration-successful", "event-datetime", "show-card-counter-per-list", "read-only", "read-assigned-only", "edit-wip-limit", "enable-wip-limit", "badge-attachment-on-minicard", "checklist-count-on-minicard", "checklist-count", "attachment-count", "r-remove-value-from", "office-report-desc", "s3-force-path-style-description", "migration-batch-size-description", "wip-limit-groups"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['mongodb-compact-running'],/compact.*betumi.*simma/);
 assert.equal(data['backup-datetime'],data['event-datetime']);
 assert.match(data['migration-stopped'],/Wɔagyae/);
 assert.match(data['migration-successful'],/awie yiye/);
 assert.match(data['read-assigned-only'],/ahyɛ wo nsa nkutoo/);
 assert.notEqual(data['read-only'],data['read-assigned-only']);
 assert.match(data['enable-wip-limit'],/^Sɔ WIP/);
 assert.match(data['wip-limit-groups'],/akuw$/);
 for(const key of ['checklist-count','checklist-count-on-minicard']) assert.ok(data[key].includes('(0/0)'));
 assert.match(data['migration-batch-size-description'],/kuw biara.*1-100/);
 assert.match(data['office-report-desc'],/IPv4.*IPv6.*ɔman.*kurow.*mpɛn dodow/);
 assert.match(data['s3-force-path-style-description'],/MinIO.*dodow no ara.*S3.*ɛnyɛ AWS/);
 assert.match(data['show-card-counter-per-list'],/biara mu/);
});


test('Akan movement labels preserve direction, selected scope and ordering', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["wip-limit-group-add", "add-card-to-top-of-list", "add-card-to-bottom-of-list", "calendar-previous-month-label", "calendar-next-month-label", "map-to-existing-user-none", "move-card-up", "move-card-down", "move-list-left", "move-list-right", "moveCardToBottom-title", "moveCardToTop-title", "notify-watch", "showSum-field-on-list", "r-w-every-day-at", "r-d-move-to-top-gen", "r-d-move-to-top-spec", "r-d-move-to-bottom-gen", "r-d-move-to-bottom-spec", "left-of-list", "right-of-list", "location-detect-from-map", "created-at-oldest-first", "backup-restore-select-first", "gcs-project-id-menu-path"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['move-card-up'],/soro$/); assert.match(data['move-card-down'],/fam$/);
 assert.match(data['move-list-left'],/benkum$/); assert.match(data['move-list-right'],/nifa$/);
 for(const suffix of ['gen','spec']){
  assert.match(data['r-d-move-to-top-'+suffix],/atifi$/);
  assert.match(data['r-d-move-to-bottom-'+suffix],/ase$/);
 }
 for(const direction of ['top','bottom']) assert.match(data['r-d-move-to-'+direction+'-gen'],/a ɛwom/);
 assert.match(data['calendar-previous-month-label'],/atwam/);
 assert.match(data['calendar-next-month-label'],/edi hɔ/);
 assert.match(data['created-at-oldest-first'],/akyɛ sen biara di kan/);
 assert.match(data['backup-restore-select-first'],/^Di kan paw/);
 assert.match(data['showSum-field-on-list'],/wɔaka abom.*atifi/);
 for(const label of ['Google Cloud Console','Cloud overview','Dashboard','Project info','Project ID']) assert.ok(data['gcs-project-id-menu-path'].includes(label),label);
 assert.match(data['wip-limit-group-add'],/WIP anohyeto kuw/);
});


test('Akan account guidance preserves OAuth precedence and secret visibility', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["allboards.delete-workspace-confirm-check", "boardChangeWatchPopup-title", "roles-status-write", "disable-watch", "login-allow", "cardType-linkedBoard", "map-to-existing-user-no-results", "imported-member-no-account", "trello-api-import", "smtp-host-description", "send-smtp-test", "prefix-with-full-path", "subtext-with-full-path", "oauth-providers-hint", "server-error"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['oauth-providers-hint'],/OAUTH_\*_ENABLED/);
 assert.match(data['oauth-providers-hint'],/botae a wohyɛ wɔ ha no si.*ananmu/);
 assert.match(data['oauth-providers-hint'],/Wɔsie kokoam safoa.*sɛɛva.*wɔnkyerɛ da/);
 assert.match(data['send-smtp-test'],/sɔhwɛ email.*wo ankasa/);
 assert.match(data['smtp-host-description'],/SMTP/);
 assert.match(data['trello-api-import'],/Trello.*API safoa ne token/);
 assert.match(data['imported-member-no-account'],/akontaabu.*nni hɔ/);
 assert.match(data['map-to-existing-user-no-results'],/^Wɔanhu/);
 assert.match(data['login-allow'],/ma ho kwan/);
 assert.match(data['roles-status-write'],/Yɛ na sesa/);
 assert.notEqual(data['prefix-with-full-path'],data['subtext-with-full-path']);
});


test('Akan display and attachment controls preserve units, links and visibility scope', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["set-list-width-value", "add-cover", "attachmentDeletePopup-title", "board-change-background-image", "add-background-image", "remove-background-image", "boardChangeColorPopup-title", "boardChangeBackgroundImagePopup-title", "allBoardsChangeBackgroundImagePopup-title", "boardChangeViewPopup-title", "board-view", "deleteBoardBackgroundPopup-title", "auto-list-width", "normal-assigned-only-desc", "page-maybe-private", "remove-cover", "cover-attachment-on-minicard", "r-list-view", "display-authentication-method", "view-all", "displayName", "myCardsViewChange-title"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['set-list-width-value'],/\(pixels\)/);
 assert.match(data['auto-list-width'],/ɛsesa ankasa/);
 assert.equal(data['boardChangeViewPopup-title'],data['board-view']);
 assert.equal(new Set(['board-change-background-image','boardChangeBackgroundImagePopup-title','allBoardsChangeBackgroundImagePopup-title'].map(k=>data[k])).size,1);
 assert.match(data['add-cover'],/^Fa.*ka kaad ketewa/);
 assert.match(data['remove-cover'],/^Yi.*fi kaad ketewa/);
 assert.deepEqual(data['page-maybe-private'].match(/<[^>]+>/g),english['page-maybe-private'].match(/<[^>]+>/g));
 assert.match(data['page-maybe-private'],/Ebia.*Ebia/);
 assert.match(data['normal-assigned-only-desc'],/ahyɛ wo nsa nkutoo/);
 assert.ok(data['normal-assigned-only-desc'].includes(data.normal));
 assert.notEqual(data.normal,'Daabirmal');
 assert.match(data['attachmentDeletePopup-title'],/^Popa.*\?$/);
 assert.match(data['view-all'],/nyinaa/);
});


test('Akan view and customization labels preserve matching titles and private-only scope', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["myCardsViewChangePopup-title", "dueCardsViewChange-title", "dueCardsViewChangePopup-title", "globalSearchViewChange-title", "globalSearchViewChangePopup-title", "attachment-move", "move-scope-both", "cards-loading-lazy", "backup-restore-mode", "attachment-settings", "personal-list-width", "list-label-sort", "filter-custom-fields-label", "filter-no-custom-fields", "custom-help-link-url", "tableVisibilityMode-allowPrivateOnly", "custom-product-name", "custom-head-tags-enabled", "custom-manifest-enabled", "custom-assetlinks-enabled", "no-shared-templates", "link-to-search", "editTranslationPopup-title", "settingsTranslationPopup-title", "step-convert-shared-lists"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const base of ['myCardsViewChange','dueCardsViewChange','globalSearchViewChange']) assert.equal(data[base+'-title'],data[base+'Popup-title']);
 assert.match(data['tableVisibilityMode-allowPrivateOnly'],/kokoam bɔɔd nkutoo/);
 assert.match(data['cards-loading-lazy'],/nea wohu nkutoo/);
 assert.match(data['move-scope-both'],/Fael.*ne.*mfonini/);
 assert.match(data['filter-no-custom-fields'],/biara nni hɔ/);
 assert.match(data['no-shared-templates'],/biara nni hɔ/);
 for(const key of ['custom-head-tags-enabled','custom-manifest-enabled','custom-assetlinks-enabled']) assert.match(data[key],/^Sɔ/);
 assert.match(data['custom-assetlinks-enabled'],/assetlinks\.json/);
 assert.match(data['custom-help-link-url'],/URL/);
 assert.match(data['settingsTranslationPopup-title'],/^Popa.*\?$/);
 assert.match(data['editTranslationPopup-title'],/^Sesa/);
});


test('Akan search results and scheduling outcomes preserve counts and execution states', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["add-existing-card-as-subtask-empty", "authentication-method", "dueCards-noResults-title", "no-cards-found", "one-card-found", "n-cards-found", "n-n-of-n-cards-found", "attachment-repair-broken", "backup-restore-add-missing", "fix-missing-lists-migration", "no-issues-found", "step-create-missing-lists", "app-try-reconnect", "active-cron-jobs", "add-cron-job", "add-cron-job-placeholder", "board-archive-scheduled", "board-backup-scheduled", "board-cleanup-scheduled", "cron-job-deleted", "cron-job-paused", "cron-job-resumed", "cron-job-started", "schedule-board-backup", "schedule-board-cleanup", "scheduled-board-operations"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['n-n-of-n-cards-found'],/__start__-__end__.*__total__/);
 assert.match(data['one-card-found'],/biako/);
 for(const key of ['no-cards-found','no-issues-found','dueCards-noResults-title']) assert.match(data[key],/^Wɔanhu.*biara$/);
 assert.match(data['backup-restore-add-missing'],/enni hɔ nkutoo/);
 assert.equal(data['authentication-method'],data['authentication-type']);
 for(const kind of ['archive','backup','cleanup']) assert.match(data['board-'+kind+'-scheduled'],/^Wɔahyɛ bere/);
 assert.equal(new Set(['deleted','paused','resumed','started'].map(s=>data['cron-job-'+s])).size,4);
 assert.match(data['cron-job-paused'],/kakra/);
 assert.match(data['cron-job-resumed'],/^Wɔasan atoa.*so/);
 assert.match(data['cron-job-started'],/^Wɔafi.*ase/);
 assert.match(data['add-cron-job-placeholder'],/reba nnansa yi/);
 assert.notEqual(data['fix-missing-lists-migration'],data['step-create-missing-lists']);
});


test('Akan activity and assignment labels preserve direction and permission scope', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["trello-import-progress", "r-mark-complete", "add-job", "migration-progress-title", "step-scan-users", "cleanup-old-jobs", "job-description", "job-name", "comment-assigned-only", "filter-show-archive", "normal-assigned-only", "shortcut-filter-my-assigned-cards", "roles-status-sees-assigned", "act-addLabel", "act-addedLabel", "act-removeLabel", "act-removedLabel", "show-board_members-avatar", "card-edit-labels", "adminChangeAvatarPopup-title", "change-avatar", "changeAvatarPopup-title", "deleteAvatarPopup-title", "checklistItemDeletePopup-title", "filter-labels-label"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(data['act-addLabel'],data['act-addedLabel']);
 assert.equal(data['act-removeLabel'],data['act-removedLabel']);
 assert.match(data['act-addLabel'],/^Wɔde.*kaa kaad/);
 assert.match(data['act-removeLabel'],/^Wɔyii.*fii kaad/);
 for(const key of ['comment-assigned-only','normal-assigned-only','roles-status-sees-assigned']) assert.match(data[key],/ahyɛ wo nsa nkutoo/);
 assert.ok(data['normal-assigned-only'].includes(data.normal));
 assert.match(data['shortcut-filter-my-assigned-cards'],/ahyɛ me nsa/);
 assert.equal(new Set(['adminChangeAvatarPopup-title','change-avatar','changeAvatarPopup-title'].map(k=>data[k])).size,1);
 assert.match(data['deleteAvatarPopup-title'],/^Popa.*\?$/);
 assert.match(data['checklistItemDeletePopup-title'],/mu ade\?$/);
 assert.match(data['r-mark-complete'],/agyirae sɛ wɔawie/);
 assert.match(data['migration-progress-title'],/rekɔ so$/);
 assert.notEqual(data['job-name'],data['job-description']);
});


test('Akan checklist and activity labels preserve completion triggers and sound defaults', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["filter-no-label", "show-activities", "hide-activities", "remove-labels-multiselect", "activity-added-label", "activity-removed-label", "activity-added-label-card", "activity-removed-label-card", "r-items-check", "r-d-add-label", "r-d-remove-label", "r-with-items", "checklist-ding-sound", "checklist-ding-sound-description", "hide-checked-items", "no-items-message", "board-activities", "editChecklistItemsAsTextPopup-title", "max-avatar-filesize", "allowed-avatar-filetypes", "lost-cards-list"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['activity-added-label'],/kaa.*ho$/);
 assert.match(data['activity-removed-label'],/fii.*ho$/);
 assert.match(data['remove-labels-multiselect'],/yi.*1-9 fi ho/);
 assert.match(data['checklist-ding-sound-description'],/tiaa.*agyirae sɛ wɔawie.*Wɔadum fi mfiase/);
 assert.match(data['hide-checked-items'],/agyirae sɛ wɔawie/);
 assert.match(data['max-avatar-filesize'],/bytes.*: $/);
 assert.match(data['allowed-avatar-filetypes'],/: $/);
 assert.match(data['show-activities'],/^Kyerɛ/); assert.match(data['hide-activities'],/^Suma/);
 assert.match(data['filter-no-label'],/nni hɔ/);
 assert.match(data['no-items-message'],/biara nni hɔ/);
 assert.match(data['lost-cards-list'],/wɔasan de aba/);
 assert.match(data['editChecklistItemsAsTextPopup-title'],/nsɛm a wɔakyerɛw/);
});


test('Akan conversion and authorization messages preserve requirements and formats', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["convertChecklistItemToCardPopup-title", "deleteDuplicateListsPopup-title", "import-json-placeholder", "import-csv-placeholder", "delete-duplicate-lists", "duplicate-board", "duplicate-board-confirm", "convert-to-markdown", "step-fix-orphaned-cards", "repair-broken-cards", "error-board-notAdmin", "error-board-notAMember", "error-notAllowed", "error-org-domain-taken"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(data['deleteDuplicateListsPopup-title'],data['delete-duplicate-lists']);
 assert.match(data['import-json-placeholder'],/JSON.*ɛfata/);
 assert.match(data['import-csv-placeholder'],/CSV\/TSV.*ɛfata/);
 assert.match(data['convert-to-markdown'],/markdown/);
 assert.match(data['duplicate-board-confirm'],/nsɛso\?$/);
 assert.match(data['error-board-notAdmin'],/bɔɔd yi sohwɛfo ansa/);
 assert.match(data['error-board-notAMember'],/bɔɔd yi muni ansa/);
 assert.match(data['error-notAllowed'],/mma wo kwan/);
 assert.match(data['error-org-domain-taken'],/ahyehyɛde foforo dedaw: $/);
 assert.notEqual(data['step-fix-orphaned-cards'],data['repair-broken-cards']);
});


test('Akan rule fragments and history states preserve direction and restrictions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["restrict-comment-editing", "added", "other-filters-label", "r-added-to", "r-attachment-added-to", "r-removed-from", "r-attachment-removed-from", "r-moved-to", "r-moved-from", "allow-rename", "allowRenamePopup-title", "allow-invite-to-board", "history-change-removed", "history-change-moved", "history-change-restored", "admin-people-filter-inactive", "sandstorm-migration-pending", "gcs-project-id-description"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['restrict-comment-editing'],/^Siw bɔɔd sohwɛfo.*sesa anaa.*popa afoforo/);
 assert.equal(data['r-added-to'],data['r-attachment-added-to']);
 assert.equal(data['r-removed-from'],data['r-attachment-removed-from']);
 assert.match(data['r-moved-to'],/kɔɔ$/); assert.match(data['r-moved-from'],/fii$/);
 assert.equal(data['allow-rename'],data['allowRenamePopup-title']);
 assert.match(data['allow-invite-to-board'],/^Ma kwan.*bɔɔd mu/);
 assert.equal(new Set(['removed','moved','restored'].map(s=>data['history-change-'+s])).size,3);
 assert.match(data['history-change-restored'],/asan de aba/);
 assert.match(data['admin-people-filter-inactive'],/^Ɔnyɛ/);
 assert.match(data['sandstorm-migration-pending'],/^Wɔnnya/);
 assert.match(data['gcs-project-id-description'],/Google Cloud.*ID/);
 for(const key of keys) assert.doesNotMatch(data[key],/Daabit|Nyinaaow|hoed|Yid|Tud|brad|Wor/);
});


test('Akan voting and invitation labels preserve subjects and endpoint alternatives', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["card-edit-voting", "vote-public", "deleteVotePopup-title", "deletePokerPopup-title", "email-invite-subject", "push-invite-title", "leave-board", "leaveBoardPopup-title", "email-invite-register-subject", "roles-status-invite", "invite-people-error", "s3-endpoint-menu-path"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(new Set(['email-invite-subject','email-invite-register-subject','push-invite-title'].map(k=>data[k])).size,1);
 assert.match(data['vote-public'],/obiara too aba maa/);
 for(const key of ['deleteVotePopup-title','deletePokerPopup-title']) assert.match(data[key],/^Popa.*\?$/);
 assert.equal(data['leaveBoardPopup-title'],data['leave-board']+'?');
 assert.match(data['invite-people-error'],/^Mfomso.*ɔfrɛ.*kyerɛw wɔn din/);
 assert.match(data['s3-endpoint-menu-path'],/^AWS:.*hɔ kwa.*ɔmantam/);
 for(const literal of ['S3','Endpoint URL','MinIO','Cloudflare R2','Backblaze B2','Wasabi','DigitalOcean Spaces']) assert.ok(data['s3-endpoint-menu-path'].includes(literal),literal);
});


test('Akan prompts preserve membership boundaries and font sample digits', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["what-to-do", "password-again", "migration-progress-note", "user-exists", "export-select-what-to-include", "board-members-same-org-only", "board-members-same-team-only", "font-preview-text", "card-aging", "fullname"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['board-members-same-org-only'],/ahyehyɛde koro no ara mufo nkutoo/);
 assert.match(data['board-members-same-team-only'],/kuw koro no ara mufo nkutoo/);
 assert.match(data['font-preview-text'],/0123456789$/);
 assert.match(data['font-preview-text'],/Sakraman.*ɔkraman/);
 assert.match(data['password-again'],/san hyɛ bio/);
 assert.match(data['user-exists'],/wɔ hɔ dedaw/);
 assert.match(data['card-aging'],/dedaw.*kɔla ano brɛ ase/);
 assert.match(data['migration-progress-note'],/twɛn.*foforo/);
 assert.match(data['export-select-what-to-include'],/: $/);
});


test('Akan template and swimlane labels preserve targets and resize permissions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["add-template", "add-subtask", "add-template-container", "cardTemplatePopup-title", "subtaskDeletePopup-title", "copyManyCardsPopup-title", "createTemplateContainerPopup-title", "custom-field-dropdown-options", "export-card-field-board-info", "swimlaneAddPopup-title", "starred-swimlanes", "card-templates-swimlane", "list-templates-swimlane", "board-templates-swimlane", "swimlaneDeletePopup-title", "lock-swimlane-height-resize", "create-task", "share-template-with"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(data['add-template-container'],data['createTemplateContainerPopup-title']);
 assert.match(data['copyManyCardsPopup-title'],/kaad pii/);
 assert.match(data['swimlaneAddPopup-title'],/wɔ ase$/);
 assert.match(data['lock-swimlane-height-resize'],/Siw anaa ma kwan.*sorokɔ/);
 assert.match(data['export-card-field-board-info'],/Bɔɔd, Din a wɔahyehyɛ, Adwuma kwan/);
 assert.equal(new Set(['card','list','board'].map(k=>data[k+'-templates-swimlane'])).size,3);
 for(const key of ['subtaskDeletePopup-title','swimlaneDeletePopup-title']) assert.match(data[key],/^Popa.*\?$/);
 assert.match(data['starred-swimlanes'],/nsoromma/);
 assert.match(data['custom-field-dropdown-options'],/wubetumi apaw/);
});


test('Akan navigation and swimlane labels preserve home removal without deletion', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["swimlane-title-not-found", "location-detect-done", "move-swimlane", "moveSwimlanePopup-title", "copy-swimlane", "copySwimlanePopup-title", "cardDetailsPopup-title", "minicardDetailsActionsPopup-title", "step-ensure-per-swimlane-lists", "step-ensure-lost-cards-swimlane", "allboards.workspace-menu", "unset-selected-home", "home-board-remove", "home-board-remove-confirm", "show-at-all-boards-page", "page-not-found", "shortcut-close-dialog", "back-to-settings"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 for(const action of ['move','copy']) assert.equal(data[action+'-swimlane'],data[action+'SwimlanePopup-title']);
 assert.notEqual(data['move-swimlane'],data['copy-swimlane']);
 assert.equal(data['cardDetailsPopup-title'],data['minicardDetailsActionsPopup-title']);
 assert.equal(data['shortcut-close-dialog'],data['close-dialog']);
 for(const key of ['unset-selected-home','home-board-remove','home-board-remove-confirm']) assert.ok(data[key].includes(data.home));
 assert.match(data['home-board-remove-confirm'],/Wɔmpopa bɔɔd no ankasa/);
 assert.ok(data['show-at-all-boards-page'].includes(data['all-boards']));
 assert.match(data['step-ensure-per-swimlane-lists'],/kwan biara/);
 assert.match(data['step-ensure-lost-cards-swimlane'],/kaad a ayera/);
 assert.match(data['location-detect-done'],/Wɔahyɛ.*ase ha/);
 assert.match(data['page-not-found'],/^Wɔanhu/);
});


test('Akan migration labels preserve warning/error and execution distinctions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["source-board", "board-status-time-summary", "cron-migration-errors", "cron-migration-warnings", "cron-migrations-resumed", "all-migrations", "select-migration", "migration-paused", "migration-started", "migration-not-needed", "board-migration", "board-migrations", "comprehensive-board-migration", "migration-detector"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.match(data['cron-migration-errors'],/mfomso$/);
 assert.match(data['cron-migration-warnings'],/kɔkɔbɔ$/);
 assert.match(data['cron-migrations-resumed'],/^Wɔasan atoa.*so yiye/);
 assert.match(data['migration-paused'],/kakra/);
 assert.match(data['migration-started'],/^Wɔafi.*ase/);
 assert.match(data['migration-not-needed'],/^Ɛho nhia/);
 assert.match(data['all-migrations'],/nyinaa$/);
 assert.match(data['comprehensive-board-migration'],/nsɛm nyinaa/);
 assert.match(data['migration-detector'],/ɛhwehwɛ sɛ ehia/);
 assert.notEqual(data['board-migration'],data['board-migrations']);
 assert.match(data['source-board'],/nsɛm no fi mu/);
 assert.match(data['board-status-time-summary'],/Bere a wɔde yɛɛ adwuma/);
});


test('Akan action and account labels preserve product names and timing distinctions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["trello-import-results", "signupPopup-title", "Meteor_version", "version-name", "cron-error-message", "create-account", "card-spent", "cardDetailsActionsPopup-title", "disambiguateMultiLabelPopup-title", "disambiguateMultiMemberPopup-title", "filter-due-this-week", "r-add-trigger", "r-add-action", "myCardsSortChange-choice-dueat", "dueCards-title", "checklistActionsPopup-title", "accounts-lockout-remaining-time"];
 for(const key of keys) assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 assert.equal(data['signupPopup-title'],data['create-account']);
 assert.match(data.Meteor_version,/^Meteor /);
 assert.match(data['filter-due-this-week'],/dapɛn yi/);
 assert.match(data['myCardsSortChange-choice-dueat'],/da a ɛsɛ sɛ ewie/);
 assert.match(data['accounts-lockout-remaining-time'],/Bere a aka/);
 assert.notEqual(data['card-spent'],data['accounts-lockout-remaining-time']);
 assert.notEqual(data['r-add-trigger'],data['r-add-action']);
 assert.match(data['r-add-trigger'],/hyɛ adwuma ase/);
 assert.match(data['disambiguateMultiLabelPopup-title'],/agyiraehyɛde.*pefee/);
 assert.match(data['disambiguateMultiMemberPopup-title'],/ɔmannifo.*pefee/);
 assert.notEqual(data['checklistActionsPopup-title'],data['cardDetailsActionsPopup-title']);
});
