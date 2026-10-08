'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported"];
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
