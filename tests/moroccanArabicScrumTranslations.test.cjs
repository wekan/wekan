'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ary.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted"];
test('Moroccan Arabic Scrum labels preserve source order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0600-\u06ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Moroccan Arabic Scrum actions preserve completion policies and unfinished work scope',()=>{
 assert.match(locale['scrum-policy-dueComplete'],/معلّمة مكمّلة/);
 assert.match(locale['scrum-policy-doneLists'],/فقائمة من فئة/);
 assert.notEqual(locale['scrum-policy-dueComplete'],locale['scrum-policy-doneLists']);
 assert.match(locale['scrum-start-sprint'],/بدا/);
 assert.match(locale['scrum-close-sprint'],/سدّ/);
 assert.match(locale['scrum-cancel-sprint'],/لغي/);
 assert.match(locale['scrum-rollover-sprint'],/الخدمة اللي ما كملاتش/);
 assert.match(locale['scrum-backlog-help'],/مخطّط ليه ولا جاري/);
 assert.match(locale['scrum-source-customField'],/حقل مخصّص عددي/);
 assert.equal(locale['scrum-product-backlog'],locale['board-view-product-backlog']);
 assert.equal(locale['scrum-sprints'],locale['board-view-sprints']);
});

test('Moroccan Arabic sprint reports preserve unknown estimates and cancellation semantics',()=>{
 assert.match(locale['scrum-report-help'],/كتتحسب بوحدها.*ماشي تقديرات بصفر/);
 assert.match(locale['scrum-report-help'],/غير إلا كانت وحدات التقدير وقواعد الإكمال متطابقة/);
 assert.match(locale['scrum-confirm-close'],/اللي ما كملاتش.*للوجهة المختارة/);
 assert.match(locale['scrum-confirm-cancel'],/كتبقى تابعة ليه حتى يتعاود تعيينها/);
 assert.doesNotMatch(locale['scrum-confirm-cancel'],/غادي تنتقل/);
 assert.match(locale['scrum-partial-report'],/غير البطاقات المعيّنة ليك دابا/);
 assert.match(locale['scrum-import-reference-omitted'],/ما قدرناش.*__reference__/);
 assert.match(locale['scrum-timebox'],/بالدقائق/);
 assert.equal(new Set(['planned','active','closed','cancelled','released'].map(k=>locale['scrum-state-'+k])).size,5);
 assert.notEqual(locale['scrum-event-review'],locale['scrum-event-retrospective']);
});
