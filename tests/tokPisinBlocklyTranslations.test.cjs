'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/tpi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');

test('Tok Pisin Blockly text operations preserve source tokens and result semantics',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-TEXT_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-TEXT_INDEXOF_TOOLTIP'],/fes teks.*namba tu teks.*%1 sapos teks i no stap/);
 assert.match(data['blockly-TEXT_ISEMPTY_TOOLTIP'],/tru.*i no gat samting/);
 assert.match(data['blockly-TEXT_LENGTH_TOOLTIP'],/wantaim ol spes/);
 assert.match(data['blockly-TEXT_REPLACE_MESSAGE0'],/%1 wantaim %2.*%3/);
 assert.match(data['blockly-TEXT_REPLACE_TOOLTIP'],/olgeta ples/);
 assert.match(data['blockly-TEXT_CHARAT_FROM_END'],/stat long pinis/);
 assert.notEqual(data['blockly-TEXT_CHARAT_FIRST'],data['blockly-TEXT_CHARAT_LAST']);
});

test('Tok Pisin text controls distinguish case, trim directions and prompt types',()=>{
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'],/liklik leta/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'],/BIKPELA LETA/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'],/bikpela leta.*stat bilong wan wan tok/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_LEFT'],/han kais/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_RIGHT'],/han sut/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_BOTH'],/tupela sait/);
 assert.match(data['blockly-TEXT_TRIM_TOOLTIP'],/kopi.*wanpela o tupela pinis/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_NUMBER'],/wanpela namba/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_TEXT'],/sampela teks/);
 assert.equal(data['blockly-TEXT_APPEND_VARIABLE'],data['blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM']);
});

test('Tok Pisin logic preserves truth conditions and comparison boundaries',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-LOGIC_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')&&key!=='blockly-LOGIC_NULL') assert.notEqual(data[key],english[key],key);
 }
 assert.equal(data['blockly-LOGIC_NULL'],'null');
 assert.equal(data['blockly-LOGIC_BOOLEAN_TRUE'],'tru');
 assert.equal(data['blockly-LOGIC_BOOLEAN_FALSE'],'giaman');
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_AND'],/tupela input i tru/);
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_OR'],/wanpela o tupela input i tru/);
 assert.match(data['blockly-LOGIC_NEGATE_TOOLTIP'],/tru sapos input i giaman.*giaman sapos input i tru/);
 for(const op of ['GT','LT']){
  assert.doesNotMatch(data['blockly-LOGIC_COMPARE_TOOLTIP_'+op],/wankain/);
  assert.match(data['blockly-LOGIC_COMPARE_TOOLTIP_'+op+'E'],/o tupela i wankain/);
 }
 for(const suffix of ['CONDITION','IF_TRUE','IF_FALSE']) assert.ok(data['blockly-LOGIC_TERNARY_TOOLTIP'].includes("'"+data['blockly-LOGIC_TERNARY_'+suffix]+"'"));
});

test('Tok Pisin function messages preserve arguments and return behavior',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-PROCEDURES_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'],/i no givim bek risal/);
 assert.match(data['blockly-PROCEDURES_DEFRETURN_TOOLTIP'],/i givim bek risal/);
 assert.match(data['blockly-PROCEDURES_CALLRETURN_TOOLTIP'],/%1.*yusa.*yusim risal/);
 assert.match(data['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'],/No inap.*%1.*blok.*i no wok/);
 assert.match(data['blockly-PROCEDURES_IFRETURN_WARNING'],/insait.*tasol/);
 assert.match(data['blockly-PROCEDURES_IFRETURN_TOOLTIP'],/tru.*namba tu veliu/);
 assert.match(data['blockly-PROCEDURES_DEF_DUPLICATE_WARNING'],/paramita i wankain/);
 for(const suffix of ['TITLE','COMMENT','PROCEDURE']) assert.equal(data['blockly-PROCEDURES_DEFRETURN_'+suffix],data['blockly-PROCEDURES_DEFNORETURN_'+suffix]);
});

test('Tok Pisin loop controls preserve branch conditions, loop exits and source tokens',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-CONTROLS_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/veliu i giaman/);
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/veliu i tru/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'],/Lusim.*insait/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'],/Kalapim.*neks raun/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'],/insait.*tasol/);
 assert.match(data['blockly-CONTROLS_IF_TOOLTIP_4'],/fes veliu.*namba tu veliu.*no gat wanpela veliu i tru.*las blok/);
 assert.match(data['blockly-CONTROLS_FOREACH_TOOLTIP'],/wan wan samting.*%1/);
 assert.match(data['blockly-CONTROLS_FOR_TITLE'],/%1.*%2.*%3.*%4/);
 assert.notEqual(data['blockly-CONTROLS_IF_MSG_IF'],data['blockly-CONTROLS_IF_MSG_ELSE']);
});
