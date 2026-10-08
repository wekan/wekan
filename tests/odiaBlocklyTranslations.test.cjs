'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/or_IN.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE"];
test('Odia Blockly translations preserve key order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0b00-\u0b7f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Odia Blockly colours preserve bounds and distinct control actions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'],/0.*100/);
 assert.equal(new Set(['BLUE','GREEN','RED'].map(c=>locale['blockly-COLOUR_RGB_'+c])).size,3);
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
});

test('Odia loop tooltips preserve condition polarity and separate else-if branches',()=>{
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'].includes('\u0b2e\u0b3f\u0b25\u0b4d\u0b5f\u0b3e'));
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'].includes('\u0b38\u0b24\u0b4d\u0b5f'));
 assert.notEqual(locale['blockly-CONTROLS_IF_MSG_ELSE'],locale['blockly-CONTROLS_IF_MSG_ELSEIF']);
 assert.ok(locale['blockly-CONTROLS_IF_TOOLTIP_4'].includes('\u0b15\u0b4c\u0b23\u0b38\u0b3f \u0b2e\u0b42\u0b32\u0b4d\u0b5f \u0b38\u0b24\u0b4d\u0b5f \u0b28\u0b39\u0b47\u0b32\u0b47'));
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'].includes('\u0b15\u0b47\u0b2c\u0b33'));
});

test('Odia editing actions and bitmap labels preserve roles and opposing actions',()=>{
 for(const pair of [['ENABLE_BLOCK','DISABLE_BLOCK'],['EXPAND_BLOCK','COLLAPSE_BLOCK'],['COPY_SHORTCUT','CUT_SHORTCUT']]) assert.notEqual(locale['blockly-'+pair[0]],locale['blockly-'+pair[1]]);
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('\u0b27\u0b3e\u0b21\u0b3c\u0b3f %2'));
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('\u0b38\u0b4d\u0b24\u0b2e\u0b4d\u0b2d %3'));
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes("\u0b1a\u0b33\u0b30\u0b3e\u0b36\u0b3f '%2'"));
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes('%1\u0b1f\u0b3f \u0b2c\u0b4d\u0b5f\u0b2c\u0b39\u0b3e\u0b30'));
});
