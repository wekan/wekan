'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CAPS_LOCK_KEY", "blockly-COMMAND_KEY", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROL_KEY", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-HOME_KEY", "blockly-INSERT_KEY", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PAUSE_KEY", "blockly-SHIFT_KEY", "blockly-SPACE_KEY", "blockly-TAB_KEY", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-unavailable"];
test('Tatar observations and synchronization translations preserve keys and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.ok(locale[key].trim(),key);
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0400-\u04ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Tatar observations preserve limits and synchronization choices remain distinct',()=>{
 for(const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']) {
  assert.ok(locale[key].includes('UTC'));
  assert.match(locale[key],/\u043d\u0443\u043b\u044c \u0442\u04af\u0433\u0435\u043b/);
 }
 assert.ok(locale['scrum-daily-truncated'].includes('366'));
 assert.ok(locale['sync-preview-truncated'].includes('100'));
 assert.notEqual(locale['sync-conflict-keep-local'],locale['sync-conflict-use-source']);
 assert.notEqual(locale['sync-conflict-detach'],locale['sync-conflict-create-replacement']);
 assert.equal(new Set(['create','update','archive'].map(action=>locale['sync-preview-'+action])).size,3);
 assert.match(locale['sync-conflict-hint'],/\u0497\u0438\u0431\u04d9\u0440\u0435\u043b\u043c\u0438/);
 assert.match(locale['sync-conflict-archive-hint'],/\u04af\u0437\u0433\u04d9\u0440\u043c\u0438/);
});


test('Tatar diagnostics preserve retention, explicit null and recovery distinctions',()=>{
 assert.match(locale['sync-report-retention'],/20.*30/);
 assert.ok(locale['sync-source-truncated'].includes('100'));
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']) {
  assert.ok(locale[key].includes('Jira'));
  assert.ok(locale[key].includes('null'));
  assert.match(locale[key],/\u0438\u0441\u04d9\u043f\u043a\u04d9 \u0430\u043b\u044b\u043d\u043c\u044b\u0439/);
 }
 assert.notEqual(locale['email-failure-smtp-temporary'],locale['email-failure-smtp-rejected']);
 assert.notEqual(locale['sync-original-time'],locale['sync-remaining-time']);
 assert.equal(new Set(['pending','preparing','processing','missing','changed','invalid','inconsistent'].map(state=>locale['activity-recovery-status-'+state])).size,7);
 assert.match(locale['activity-recovery-description'],/\u044f\u04a3\u0430\u0434\u0430\u043d \u0442\u04e9\u0437\u0435\u043c\u0438/);
 assert.match(locale['activity-recovery-source-unavailable'],/\u0442\u04e9\u0437\u0435\u043b\u043c\u04d9\u0434\u0435/);
});


test('Tatar delivery controls distinguish pausing, resuming and permanent cancellation',()=>{
 assert.equal(new Set(['pause','resume','cancel'].map(action=>locale['activity-recovery-'+action])).size,3);
 assert.notEqual(locale['activity-recovery-paused'],locale['activity-recovery-status-cancelled']);
 assert.match(locale['activity-recovery-cancel-confirm'],/\u0431\u04e9\u0442\u0435\u043d\u043b\u04d9\u0439/);
 assert.match(locale['activity-recovery-cancel-confirm'],/\u0431\u0443\u043b\u043c\u0430\u044f\u0447\u0430\u043a/);
 assert.match(locale['activity-recovery-cancel-confirm'],/\u043a\u0438\u0440\u0435 \u0430\u043b\u044b\u043d\u043c\u044b\u0439/);
 for(const key of ['ALT','COMMAND','CONTROL','OPTION','SHIFT']) assert.ok(locale['blockly-'+key+'_KEY'].includes(english['blockly-'+key+'_KEY']));
 assert.notEqual(locale['blockly-PAGE_DOWN_KEY'],locale['blockly-PAGE_UP_KEY']);
 for(const key of ['CHROME_OS','LINUX','MAC_OS','WINDOWS','LOGIC_NULL','MATH_TRIG_ACOS','MATH_TRIG_ASIN','MATH_TRIG_ATAN','MATH_TRIG_COS','MATH_TRIG_SIN','MATH_TRIG_TAN']) assert.equal(locale['blockly-'+key],english['blockly-'+key]);
});
