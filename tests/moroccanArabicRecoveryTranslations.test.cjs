'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ary.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-estimate-field", "sync-estimate-field-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-unavailable", "board-view-bigboard", "attachment-limit-unit-bytes", "blockly-ANNOUNCE_MOVE_OF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-DIALOG_OK", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_SET_INDEX_INPUT_TO", "blockly-MATH_CONSTANT_PI_ARIA", "blockly-PROCEDURES_DEFNORETURN_TITLE", "blockly-CONTROLS_FOREACH_INPUT_DO", "blockly-CONTROLS_FOR_INPUT_DO", "blockly-CONTROLS_IF_IF_TITLE_IF", "blockly-CONTROLS_IF_MSG_THEN", "blockly-CONTROLS_WHILEUNTIL_INPUT_DO", "blockly-PROCEDURES_DEFRETURN_TITLE", "blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CAPS_LOCK_KEY", "blockly-COMMAND_KEY", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROL_KEY", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-HOME_KEY", "blockly-INSERT_KEY", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PAUSE_KEY", "blockly-SHIFT_KEY", "blockly-SPACE_KEY", "blockly-TAB_KEY"];
test('Moroccan Arabic recovery translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0600-\u06ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Moroccan Arabic recovery warnings preserve missing versus null and delivery uncertainty',()=>{
 for(const key of ['sync-estimate-field-hint','sync-time-estimate-hint']){
  assert.match(locale[key],/القيم الناقصة فالمصدر كتتجاهل/);
  assert.match(locale[key],/null صريحة كتمسح/);
 }
 assert.match(locale['sync-time-estimate-hint'],/بالضبط حقل واحد/);
 assert.match(locale['sync-original-time'],/بالساعات/);
 assert.match(locale['sync-remaining-time'],/بالساعات/);
 assert.match(locale['email-failure-smtp-temporary'],/مؤقّت/);
 assert.match(locale['email-failure-smtp-rejected'],/دائم/);
 assert.match(locale['email-failure-delivery-unconfirmed'],/ما قدرناش نأكّدو.*راجع قبل/);
 assert.match(locale['activity-recovery-description'],/ما كتعوّدش تصايب النشاط/);
 assert.match(locale['activity-recovery-source-unavailable'],/ما تعاود تصايب والو/);
 assert.match(locale['activity-recovery-denied'],/ما بقاوش كيسمحو/);
 assert.notEqual(locale['activity-recovery-status-missing'],locale['activity-recovery-status-changed']);
});

test('Moroccan Arabic cancellation and short controls preserve irreversible scope',()=>{
 assert.match(locale['activity-recovery-cancel-confirm'],/نهائياً.*ما يمكنش تعاود تكمّلو/);
 assert.match(locale['activity-recovery-cancel-confirm'],/البريد اللي دخل لطابور الإرسال.*الإشعارات اللي توصلات ما كيرجعوش/);
 assert.match(locale['activity-recovery-failed'],/الخدمة المعلّقة بقات محفوظة/);
 assert.match(locale['activity-recovery-pause'],/مؤقّتاً/);
 assert.doesNotMatch(locale['activity-recovery-resume'],/لغي/);
 for(const key of keys.filter(k=>k.startsWith('blockly-') && /^مفتاح /.test(locale[k]))) assert.equal(locale[key],'مفتاح '+english[key]);
 assert.equal(locale['blockly-CONTROLS_IF_IF_TITLE_IF'],locale['blockly-CONTROLS_IF_MSG_IF']);
 assert.equal(locale['blockly-PROCEDURES_DEFRETURN_TITLE'],locale['blockly-PROCEDURES_DEFNORETURN_TITLE']);
 assert.match(locale['blockly-ANNOUNCE_MOVE_OF'],/%1 ديال %2/);
});
