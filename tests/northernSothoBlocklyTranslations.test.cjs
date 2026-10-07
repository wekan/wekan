'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/nso.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');

test('Northern Sotho Blockly text operations preserve source tokens and result semantics',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-TEXT_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key] && !key.endsWith('_HELPURL') && !key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-TEXT_INDEXOF_TOOLTIP'],/sa mathomo.*sa bobedi.*%1 ge sengwalwa se sa hwetšwe/);
 assert.match(data['blockly-TEXT_ISEMPTY_TOOLTIP'],/nnete.*se se na selo/);
 assert.match(data['blockly-TEXT_LENGTH_TOOLTIP'],/go akaretša dikgoba/);
 assert.match(data['blockly-TEXT_REPLACE_MESSAGE0'],/%2 legatong la %1.*%3/);
 assert.match(data['blockly-TEXT_REPLACE_TOOLTIP'],/mafelong ka moka/);
 assert.match(data['blockly-TEXT_CHARAT_FROM_END'],/go tšwa mafelelong/);
 assert.notEqual(data['blockly-TEXT_CHARAT_FIRST'],data['blockly-TEXT_CHARAT_LAST']);
});

test('Northern Sotho text controls distinguish case, trim directions and prompt types',()=>{
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'],/tše nnyane/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'],/TŠE KGOLO/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'],/mathomo.*lentšung le lengwe le le lengwe/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_LEFT'],/nngele/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_RIGHT'],/go ja/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_BOTH'],/ka bobedi/);
 assert.match(data['blockly-TEXT_TRIM_TOOLTIP'],/khophi.*e tee goba.*ka bobedi/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_NUMBER'],/nomoro/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_TEXT'],/sengwalwa/);
 assert.equal(data['blockly-TEXT_APPEND_VARIABLE'],data['blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM']);
});

test('Northern Sotho Blockly logic preserves truth conditions and comparison boundaries',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-LOGIC_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')&&key!=='blockly-LOGIC_NULL') assert.notEqual(data[key],english[key],key);
 }
 assert.equal(data['blockly-LOGIC_NULL'],'null');
 assert.equal(data['blockly-LOGIC_BOOLEAN_TRUE'],'nnete');
 assert.equal(data['blockly-LOGIC_BOOLEAN_FALSE'],'maaka');
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_AND'],/ka bobedi/);
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_OR'],/bonyane tsenyo e tee/);
 assert.match(data['blockly-LOGIC_NEGATE_TOOLTIP'],/nnete ge tsenyo e le maaka.*maaka ge tsenyo e le nnete/);
 assert.equal(new Set(['EQ','NEQ','GT','GTE','LT','LTE'].map(s=>data['blockly-LOGIC_COMPARE_'+s+'_ARIA'])).size,6);
 for(const s of ['GTE','LTE']) assert.match(data['blockly-LOGIC_COMPARE_TOOLTIP_'+s],/goba e lekana/);
 for(const s of ['GT','LT']) assert.doesNotMatch(data['blockly-LOGIC_COMPARE_TOOLTIP_'+s],/goba e lekana/);
 for(const s of ['CONDITION','IF_TRUE','IF_FALSE']) assert.ok(data['blockly-LOGIC_TERNARY_TOOLTIP'].includes("'"+data['blockly-LOGIC_TERNARY_'+s]+"'"));
});

test('Northern Sotho Blockly functions preserve arguments and output distinctions',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-PROCEDURES_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 for(const suffix of ['COMMENT','PROCEDURE','TITLE']) assert.equal(data['blockly-PROCEDURES_DEFNORETURN_'+suffix],data['blockly-PROCEDURES_DEFRETURN_'+suffix]);
 assert.equal(data['blockly-PROCEDURES_BEFORE_PARAMS'],data['blockly-PROCEDURES_CALL_BEFORE_PARAMS']);
 assert.match(data['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'],/wo o se nago poelo/);
 assert.match(data['blockly-PROCEDURES_DEFRETURN_TOOLTIP'],/wo o nago le poelo/);
 assert.match(data['blockly-PROCEDURES_CALLRETURN_TOOLTIP'],/šomiše poelo ya wona/);
 assert.doesNotMatch(data['blockly-PROCEDURES_CALLNORETURN_TOOLTIP'],/poelo/);
 assert.match(data['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'],/Ga go kgonege.*'%1'.*boloko ya tlhaloso e thibetšwe/);
 assert.match(data['blockly-PROCEDURES_DEF_DUPLICATE_WARNING'],/dipharamitha tše di ipoeletšago/);
 assert.match(data['blockly-PROCEDURES_IFRETURN_WARNING'],/fela ka gare ga tlhaloso ya mošomo/);
 assert.match(data['blockly-PROCEDURES_IFRETURN_TOOLTIP'],/nnete.*boleng bja bobedi/);
});

test('Northern Sotho Blockly loops retain continuation and boolean conditions',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-CONTROLS_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'],/^Tšwa poeletšong/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'],/Tshela karolo ye e šetšego.*potologo ye e latelago/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'],/fela ka gare ga poeletšo/);
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/maaka/);
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/nnete/);
 assert.match(data['blockly-CONTROLS_IF_TOOLTIP_4'],/Ge go se na boleng bjo e lego nnete.*boloko ya mafelelo/);
 assert.match(data['blockly-CONTROLS_FOR_TITLE'],/%1.*%2.*%3.*%4/);
 assert.equal(data['blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF'],data['blockly-CONTROLS_IF_MSG_ELSEIF']);
 assert.equal(data['blockly-CONTROLS_IF_ELSE_TITLE_ELSE'],data['blockly-CONTROLS_IF_MSG_ELSE']);
 assert.equal(data['blockly-CONTROLS_IF_IF_TITLE_IF'],data['blockly-CONTROLS_IF_MSG_IF']);
 for(const kind of ['FOREACH','FOR','WHILEUNTIL']) assert.equal(data['blockly-CONTROLS_'+kind+'_INPUT_DO'],data['blockly-CONTROLS_REPEAT_INPUT_DO']);
});
