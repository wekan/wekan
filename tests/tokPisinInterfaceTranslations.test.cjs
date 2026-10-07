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
