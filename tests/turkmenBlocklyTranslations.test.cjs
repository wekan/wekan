'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tk_TM.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE","blockly-CHANGE_VALUE_TITLE","blockly-CLEAN_UP","blockly-CLOSE_BACKPACK","blockly-COLLAPSED_WARNINGS_WARNING","blockly-COLLAPSE_ALL","blockly-COLLAPSE_BLOCK","blockly-COLOUR_BLEND_COLOUR1","blockly-COLOUR_BLEND_COLOUR2","blockly-COLOUR_BLEND_RATIO","blockly-COLOUR_BLEND_TITLE","blockly-COLOUR_BLEND_TOOLTIP","blockly-COLOUR_PICKER_TOOLTIP","blockly-COLOUR_RANDOM_TITLE","blockly-COLOUR_RANDOM_TOOLTIP","blockly-COLOUR_RGB_BLUE","blockly-COLOUR_RGB_GREEN","blockly-COLOUR_RGB_RED","blockly-COLOUR_RGB_TITLE","blockly-COLOUR_RGB_TOOLTIP","blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK","blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE","blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK","blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE"];
test('Turkmen Blockly translations preserve order and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[A-Za-z\u00c4\u00e4\u00c7\u00e7\u0147\u0148\u00d6\u00f6\u015e\u015f\u00dc\u00fc\u00dd\u00fd\u017d\u017e]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Turkmen colours and loop controls preserve bounds and action distinctions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.ok(locale['blockly-COLOUR_RGB_TOOLTIP'].includes('0 bilen 100'));
 assert.equal(new Set(['BLUE','GREEN','RED'].map(k=>locale['blockly-COLOUR_RGB_'+k])).size,3);
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes('\u00f6\u00e7\u00fcrip bolma\u00fdar'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("'%1' \u00fc\u00fdtge\u00fdjisini"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("'%2' funksi\u00fdasyny\u0148"));
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'].includes('galan b\u00f6legini ge\u00e7ir'));
 assert.ok(locale['blockly-COLLAPSED_WARNINGS_WARNING'].includes('du\u00fddury\u015flar bar'));
});
