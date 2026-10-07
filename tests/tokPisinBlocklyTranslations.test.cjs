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

test('Tok Pisin list messages preserve source tokens, indexing and empty results',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-LISTS_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')&&english[key]!=='#') assert.notEqual(data[key],english[key],key);
 }
 assert.equal(data['blockly-LISTS_GET_INDEX_FROM_START'],'#');
 assert.match(data['blockly-LISTS_CREATE_EMPTY_TOOLTIP'],/longpela 0.*no gat/);
 assert.match(data['blockly-LISTS_ISEMPTY_TOOLTIP'],/tru sapos lis i no gat samting/);
 assert.match(data['blockly-LISTS_INDEX_OF_TOOLTIP'],/fes\/las.*%1 sapos i no painim/);
 assert.match(data['blockly-LISTS_INDEX_FROM_END_TOOLTIP'],/%1.*las/);
 assert.match(data['blockly-LISTS_INDEX_FROM_START_TOOLTIP'],/%1.*fes/);
 for(const pos of ['FIRST','FROM','LAST','RANDOM']){
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_'+pos],/^Givim bek/);
  assert.doesNotMatch(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_'+pos],/Rausim/);
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_'+pos],/^Rausim na givim bek/);
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+pos],/^Rausim/);
  assert.doesNotMatch(data['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+pos],/givim bek/);
  assert.match(data['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_'+pos],/^Putim/);
  assert.match(data['blockly-LISTS_SET_INDEX_TOOLTIP_SET_'+pos],/^Senisim/);
 }
});

test('Tok Pisin list transformations distinguish copies, sorting and split versus join',()=>{
 for(const suffix of ['REVERSE_TOOLTIP','SORT_TOOLTIP','GET_SUBLIST_TOOLTIP']) assert.match(data['blockly-LISTS_'+suffix],/kopi/);
 assert.match(data['blockly-LISTS_SORT_ORDER_ASCENDING'],/liklik.*bikpela/);
 assert.match(data['blockly-LISTS_SORT_ORDER_DESCENDING'],/bikpela.*liklik/);
 assert.match(data['blockly-LISTS_SORT_TYPE_IGNORECASE'],/no ken skelim bikpela na liklik leta/);
 assert.match(data['blockly-LISTS_SPLIT_TOOLTIP_JOIN'],/^Joinim.*wanpela teks/);
 assert.match(data['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'],/^Brukim teks.*lis.*wan wan mak/);
 assert.match(data['blockly-LISTS_REPEAT_TITLE'],/%1.*%2 taim/);
});

test('Tok Pisin variable messages retain names, types and definition safeguards',()=>{
 const keys=Object.keys(english).filter(k=>k.startsWith('blockly-')&&k.includes('VARIABLE')&&!k.endsWith('_HELPURL')&&!k.endsWith('_HUE'));
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'],/No inap.*%1.*wok '%2'/);
 assert.match(data['blockly-DELETE_VARIABLE_CONFIRMATION'],/%1 ples.*%2/);
 assert.match(data['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'],/%1.*narapela kain.*%2/);
 assert.match(data['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'],/%1.*paramita.*%2/);
 assert.match(data['blockly-VARIABLES_SET_TOOLTIP'],/wankain olsem input/);
 assert.match(data['blockly-RENAME_VARIABLE_TITLE'],/olgeta.*%1/);
});

test('Tok Pisin workspace and colour messages preserve navigation and announcements',()=>{
 const keys=Object.keys(english).filter(k=>/^blockly-(COLOUR_|WORKSPACE_|KEYBOARD_NAV_)/.test(k)||/^blockly-(CURRENT_BLOCK_ANNOUNCEMENT|NO_PARENT_ANNOUNCEMENT|PARENT_BLOCKS_ANNOUNCEMENT|MINIMAP_ARIA_LABEL|OPEN_TRASH|RESET_ZOOM|SHORTCUTS_FOCUS_WORKSPACE|ZOOM_TO_FIT_ARIA_LABEL)$/.test(k));
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-COLOUR_BLEND_TOOLTIP'],/tupela kala.*0\.0 - 1\.0/);
 assert.match(data['blockly-COLOUR_RGB_TOOLTIP'],/ret, grin na blu.*0 na 100/);
 assert.match(data['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'],/Holim %1.*bihain %2/);
 assert.match(data['blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT'],/bihain %1/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'],/no gat blok%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE'],/^Wanpela.*%2/);
 for(const suffix of ['ONE','MANY']) assert.match(data['blockly-WORKSPACE_CONTENTS_COMMENTS_'+suffix],/^ na /);
 assert.match(data['blockly-WORKSPACE_SEARCH_INPUT_LABEL'],/Enter.*neks.*Shift\+Enter.*bipo.*Escape.*pasim.*fokas/);
 assert.notEqual(data['blockly-WORKSPACE_SEARCH_FIND_NEXT'],data['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']);
});
