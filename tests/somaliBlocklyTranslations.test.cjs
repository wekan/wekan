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
  if(english[key].trim()) assert.ok(data[key].trim(),key);
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

test('Somali Blockly list operations retain arguments, endpoints and empty results',()=>{
 const keys=Object.keys(english).filter(k=>k.startsWith('blockly-LISTS_'));
 assert.ok(keys.length>=73);
 for(const key of keys){
  if(english[key].trim()) assert.ok(data[key].trim(),key);
  // Help URLs and index symbols are deliberately identical in every language.
  if(!key.endsWith('_HELPURL') && /[A-Za-z]{2}/.test(english[key])) assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['blockly-LISTS_CREATE_EMPTY_TOOLTIP'],/0.*aan lahayn/);
 assert.match(data['blockly-LISTS_ISEMPTY_TOOLTIP'],/run haddii liisku madhan/);
 assert.match(data['blockly-LISTS_INDEX_OF_TOOLTIP'],/%1 haddii shayga la waayo/);
 assert.match(data['blockly-LISTS_INDEX_FROM_START_TOOLTIP'],/%1.*koowaad/);
 assert.match(data['blockly-LISTS_INDEX_FROM_END_TOOLTIP'],/%1.*ugu dambeeya/);
 for(const suffix of ['FIRST','FROM','LAST','RANDOM']){
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_'+suffix],/^Soo celi/);
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_'+suffix],/^Ka saar oo soo celi/);
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+suffix],/^Ka saar/);
  assert.doesNotMatch(data['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+suffix],/soo celi/);
  assert.notEqual(data['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_'+suffix],data['blockly-LISTS_SET_INDEX_TOOLTIP_SET_'+suffix]);
 }
});

test('Somali Blockly list sorting and conversion preserve copies and direction',()=>{
 for(const key of ['blockly-LISTS_GET_SUBLIST_TOOLTIP','blockly-LISTS_REVERSE_TOOLTIP','blockly-LISTS_SORT_TOOLTIP']) assert.match(data[key],/nuqul/);
 assert.match(data['blockly-LISTS_SORT_ORDER_ASCENDING'],/^kor/);
 assert.match(data['blockly-LISTS_SORT_ORDER_DESCENDING'],/^hoos/);
 assert.match(data['blockly-LISTS_SORT_TYPE_IGNORECASE'],/iska dhaaf far waaweyn iyo far yaryar/);
 assert.match(data['blockly-LISTS_SPLIT_LIST_FROM_TEXT'],/^qoraalka u beddel liis$/);
 assert.match(data['blockly-LISTS_SPLIT_TEXT_FROM_LIST'],/^liiska u beddel qoraal$/);
 assert.match(data['blockly-LISTS_SPLIT_TOOLTIP_JOIN'],/hal qoraal.*calaamad kala soocda/);
 assert.match(data['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'],/meel kasta.*calaamadda kala soocdu/);
 for(const key of ['GET_INDEX','GET_SUBLIST','INDEX_OF','SET_INDEX']) assert.equal(data['blockly-LISTS_'+key+'_INPUT_IN_LIST'],data['blockly-LISTS_INLIST']);
});

test('Somali Blockly logic and functions retain placeholders and technical literals',()=>{
 const keys=Object.keys(english).filter(k=>k.startsWith('blockly-LOGIC_')||k.startsWith('blockly-PROCEDURES_'));
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key] && !key.endsWith('_HELPURL') && !key.endsWith('_HUE') && key!=='blockly-LOGIC_NULL') assert.notEqual(data[key],english[key],key);
 }
 assert.equal(data['blockly-LOGIC_NULL'],'null');
 assert.match(data['blockly-LOGIC_NULL_TOOLTIP'],/null/);
 for(const suffix of ['COMMENT','PROCEDURE','TITLE']) assert.equal(data['blockly-PROCEDURES_DEFNORETURN_'+suffix],data['blockly-PROCEDURES_DEFRETURN_'+suffix]);
 assert.equal(data['blockly-PROCEDURES_BEFORE_PARAMS'],data['blockly-PROCEDURES_CALL_BEFORE_PARAMS']);
});

test('Somali Blockly boolean operators preserve their truth conditions',()=>{
 assert.equal(data['blockly-LOGIC_BOOLEAN_TRUE'],'run');
 assert.equal(data['blockly-LOGIC_BOOLEAN_FALSE'],'been');
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_AND'],/labada gelinba run/);
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_OR'],/ugu yaraan mid/);
 assert.match(data['blockly-LOGIC_NEGATE_TOOLTIP'],/run haddii gelintu been.*been haddii gelintu run/);
 assert.equal(new Set(['EQ','NEQ','GT','GTE','LT','LTE'].map(s=>data['blockly-LOGIC_COMPARE_'+s+'_ARIA'])).size,6);
 for(const s of ['GTE','LTE']) assert.match(data['blockly-LOGIC_COMPARE_TOOLTIP_'+s],/ama la mid/);
 for(const s of ['GT','LT']) assert.doesNotMatch(data['blockly-LOGIC_COMPARE_TOOLTIP_'+s],/ama la mid/);
 for(const s of ['CONDITION','IF_TRUE','IF_FALSE']) assert.ok(data['blockly-LOGIC_TERNARY_TOOLTIP'].includes("'"+data['blockly-LOGIC_TERNARY_'+s]+"'"));
});

test('Somali Blockly functions distinguish output, disabled definitions and duplicate inputs',()=>{
 assert.match(data['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'],/aan lahayn wax-soo-saar/);
 assert.match(data['blockly-PROCEDURES_DEFRETURN_TOOLTIP'],/leh wax-soo-saar/);
 assert.match(data['blockly-PROCEDURES_CALLRETURN_TOOLTIP'],/adeegso wax-soo-saarkeeda/);
 assert.doesNotMatch(data['blockly-PROCEDURES_CALLNORETURN_TOOLTIP'],/wax-soo-saar/);
 assert.match(data['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'],/Lama fulin karo.*'%1'.*la damiyey/);
 assert.match(data['blockly-PROCEDURES_DEF_DUPLICATE_WARNING'],/soo noqnoqda/);
 assert.match(data['blockly-PROCEDURES_IFRETURN_WARNING'],/oo keliya gudaha qeexidda hawl/);
});
