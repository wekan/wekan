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
