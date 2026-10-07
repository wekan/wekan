'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ku.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["sync-remaining-time", "sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-unavailable", "blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CAPS_LOCK_KEY", "blockly-COMMAND_KEY", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROL_KEY", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-HOME_KEY", "blockly-INSERT_KEY", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PAUSE_KEY", "blockly-SHIFT_KEY", "blockly-SPACE_KEY", "blockly-TAB_KEY"];
test('Kurdish recovery translations preserve key order and source tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.ok(locale[key].trim(),key);
  assert.notEqual(locale[key],english[key],key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Kurdish recovery messages retain no-recreation and pending-work guarantees',()=>{
 assert.match(locale['activity-recovery-description'],/qet.*naafirîne/);
 assert.match(locale['activity-recovery-source-unavailable'],/Tu tişt.*nehat afirandin/);
 assert.match(locale['activity-recovery-failed'],/Karê li bendê hatiye parastin/);
 assert.match(locale['sync-time-estimate-hint'],/bi temamî yek/);
 assert.match(locale['sync-time-estimate-hint'],/tune tên paşguhkirin.*null.*paqij dike/);
 assert.notEqual(locale['activity-recovery-paused'],locale['activity-recovery-status-cancelled']);
});

test('Kurdish cancellation text retains irreversibility and queued-delivery caveats',()=>{
 assert.match(locale['activity-recovery-cancel-confirm'],/mayînde/);
 assert.match(locale['activity-recovery-cancel-confirm'],/nayê domandin/);
 assert.match(locale['activity-recovery-cancel-confirm'],/ketine rêzê.*radestkirî nayên vegerandin/);
 for(const key of ['ALT_KEY','BACKSPACE_KEY','CAPS_LOCK_KEY','COMMAND_KEY','CONTROL_KEY','END_KEY','ENTER_KEY','ESCAPE','HOME_KEY','INSERT_KEY','OPTION_KEY','PAGE_DOWN_KEY','PAGE_UP_KEY','PAUSE_KEY','SHIFT_KEY','SPACE_KEY','TAB_KEY']){
  assert.ok(locale['blockly-'+key].includes(english['blockly-'+key]),key);
 }
});
