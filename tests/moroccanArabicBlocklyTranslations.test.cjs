'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ary.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["card-field-visibility", "card-field-visibility-desc", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE"];
test('Moroccan Arabic Blockly translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0600-\u06ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Moroccan Arabic colours and controls retain bounds and deletion restrictions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.ok(locale['blockly-COLOUR_RGB_TOOLTIP'].includes('\u0628\u064a\u0646 0 \u0648100'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes('\u0645\u0627 \u064a\u0645\u0643\u0646\u0634'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u0627\u0644\u0645\u062a\u063a\u064a\u0651\u0631 '%1'"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u0627\u0644\u062f\u0627\u0644\u0629 '%2'"));
 assert.ok(locale['blockly-COLLAPSED_WARNINGS_WARNING'].includes('\u0641\u064a\u0647\u0627 \u062a\u062d\u0630\u064a\u0631\u0627\u062a'));
 assert.equal(new Set(['RED','GREEN','BLUE'].map(k=>locale['blockly-COLOUR_RGB_'+k])).size,3);
});

test('Moroccan Arabic loops distinguish stopping, continuing and truth conditions',()=>{
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'],/خرج/);
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'],/الدورة الجاية/);
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'],/غير داخل حلقة/);
 assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/خاطئة/);
 assert.doesNotMatch(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/صحيحة/);
 assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/صحيحة/);
 assert.doesNotMatch(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/خاطئة/);
 assert.match(locale['blockly-CONTROLS_IF_TOOLTIP_4'],/ما كانت حتى قيمة صحيحة/);
 assert.match(locale['blockly-CONTROLS_FOR_TITLE'],/%1.*%2.*%3.*%4/);
});
