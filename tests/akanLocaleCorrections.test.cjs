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
  'import-board-instruction-jira':['GET /rest/api/2/search','{ "issues": [...] }','"automationRules"'],
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
