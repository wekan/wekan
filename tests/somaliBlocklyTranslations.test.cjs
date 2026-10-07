'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/so.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const editingKeys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK"];

test('Somali Blockly editing and control flow preserve source argument inventories',()=>{
 assert.equal(editingKeys.length,61);
 for(const key of editingKeys){
  assert.ok(data[key].trim(),key);
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'],/Lama tirtiri karo.*'%1'.*qeexidda hawsha '%2'/);
 assert.match(data['blockly-DELETE_VARIABLE_CONFIRMATION'],/%1.*'%2'/);
 assert.match(data['blockly-DELETE_ALL_BLOCKS'],/dhammaan %1/);
 assert.notEqual(data['blockly-ENABLE_BLOCK'],data['blockly-DISABLE_BLOCK']);
 assert.notEqual(data['blockly-COLLAPSE_BLOCK'],data['blockly-DELETE_BLOCK']);
});

test('Somali Blockly loops preserve continuation, termination and boolean conditions',()=>{
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'],/^Ka bax/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'],/Ka bood inta ka hadhay.*wareegga xiga/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'],/oo keliya gudaha ku-celcelin/);
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/been yahay/);
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/run yahay/);
 assert.notEqual(data['blockly-CONTROLS_IF_MSG_ELSE'],data['blockly-CONTROLS_IF_MSG_ELSEIF']);
 assert.match(data['blockly-CONTROLS_IF_TOOLTIP_4'],/midkoodna run ahayn.*ugu dambeeya/);
 assert.match(data['blockly-CONTROLS_FOR_TITLE'],/%1.*%2.*%3.*%4/);
});

test('Somali Blockly colour controls retain separate channels and numeric limits',()=>{
 assert.equal(new Set(['RED','GREEN','BLUE'].map(c=>data['blockly-COLOUR_RGB_'+c])).size,3);
 assert.match(data['blockly-COLOUR_RGB_TOOLTIP'],/0 iyo 100/);
 assert.match(data['blockly-COLOUR_BLEND_TOOLTIP'],/0\.0 - 1\.0/);
 assert.match(data['blockly-COLOUR_BLEND_COLOUR1'],/1$/);
 assert.match(data['blockly-COLOUR_BLEND_COLOUR2'],/2$/);
});
