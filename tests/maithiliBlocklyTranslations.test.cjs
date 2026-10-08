'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/mai.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE","blockly-CHANGE_VALUE_TITLE","blockly-CLEAN_UP","blockly-CLOSE_BACKPACK","blockly-COLLAPSED_WARNINGS_WARNING","blockly-COLLAPSE_ALL","blockly-COLLAPSE_BLOCK","blockly-COLOUR_BLEND_COLOUR1","blockly-COLOUR_BLEND_COLOUR2","blockly-COLOUR_BLEND_RATIO","blockly-COLOUR_BLEND_TITLE","blockly-COLOUR_BLEND_TOOLTIP","blockly-COLOUR_PICKER_TOOLTIP","blockly-COLOUR_RANDOM_TITLE","blockly-COLOUR_RANDOM_TOOLTIP","blockly-COLOUR_RGB_BLUE","blockly-COLOUR_RGB_GREEN","blockly-COLOUR_RGB_RED","blockly-COLOUR_RGB_TITLE","blockly-COLOUR_RGB_TOOLTIP","blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK","blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE","blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK","blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE","blockly-CONTROLS_FLOW_STATEMENTS_WARNING","blockly-CONTROLS_FOREACH_TITLE","blockly-CONTROLS_FOREACH_TOOLTIP","blockly-CONTROLS_FOR_TITLE","blockly-CONTROLS_FOR_TOOLTIP","blockly-CONTROLS_IF_ELSEIF_TOOLTIP","blockly-CONTROLS_IF_ELSE_TOOLTIP"];
test('Maithili Blockly translations preserve order, script and placeholders',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Maithili colours and loops retain bounds and control distinctions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'],/0.*100/);
 assert.equal(new Set(['RED','GREEN','BLUE'].map(c=>locale['blockly-COLOUR_RGB_'+c])).size,3);
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'].includes('\u0915\u0947\u0935\u0932 \u0932\u0942\u092a\u0915 \u092d\u0940\u0924\u0930'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u091a\u0930 '%1'"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u092b\u0932\u0928 '%2'"));
 assert.ok(locale['blockly-CONTROLS_FOREACH_TITLE'].includes('\u0938\u0942\u091a\u0940 %2'));
});
