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
