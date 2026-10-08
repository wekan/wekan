'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/kok.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK"];
test('Konkani Blockly translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Konkani colour controls retain bounds and variable roles',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'],/0.*100/);
 assert.equal(new Set(['RED','GREEN','BLUE'].map(k=>locale['blockly-COLOUR_RGB_'+k])).size,3);
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u091a\u0932 '%1'"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u092b\u0932\u0928 '%2'"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes('\u0936\u0915\u0928\u093e'));
});

test('Konkani loops retain conditions and indexed roles',()=>{
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'].includes('\u092e\u094b\u0932 \u0905\u0938\u0924\u094d\u092f'));
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'].includes('\u092e\u094b\u0932 \u0938\u0924\u094d\u092f'));
 assert.ok(locale['blockly-CONTROLS_IF_TOOLTIP_4'].includes('\u0916\u0902\u092f\u091a\u0947\u0902\u091a \u092e\u094b\u0932 \u0938\u0924\u094d\u092f \u0928\u093e\u0938\u0932\u094d\u092f\u093e\u0930'));
 assert.ok(locale['blockly-CONTROLS_FOREACH_TITLE'].includes('\u0935\u0933\u0947\u0930\u0940 %2'));
 assert.ok(locale['blockly-CONTROLS_FOREACH_TITLE'].includes('\u0918\u091f\u0915 %1'));
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'].includes('\u092b\u0915\u0924 \u0932\u0942\u092a\u093e\u091a\u094d\u092f\u093e \u092d\u093f\u0924\u0930'));
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
});
