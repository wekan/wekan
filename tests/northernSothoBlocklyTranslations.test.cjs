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

test('Northern Sotho Blockly variable controls preserve names, counts and definition restrictions',()=>{
 const keys=Object.keys(english).filter(k=>k.startsWith('blockly-')&&k.includes('VARIABLE'));
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'],/Ga go kgonege.*'%1'.*tlhaloso ya mošomo.*'%2'/);
 assert.match(data['blockly-DELETE_VARIABLE_CONFIRMATION'],/ditšhomišo tše %1.*'%2'/);
 assert.match(data['blockly-RENAME_VARIABLE_TITLE'],/ka moka.*'%1'/);
 assert.match(data['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'],/'%1'.*mohuta wo mongwe: '%2'/);
 assert.match(data['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'],/'%1'.*pharamitha.*'%2'/);
 assert.match(data['blockly-VARIABLES_SET'],/%1.*%2/);
 assert.notEqual(data['blockly-VARIABLES_GET_CREATE_SET'],data['blockly-VARIABLES_SET_CREATE_GET']);
 assert.equal(data['blockly-VARIABLES_DEFAULT_NAME'],data['blockly-TEXT_APPEND_VARIABLE']);
 assert.equal(new Set(['COLOUR','NUMBER','STRING'].map(s=>data['blockly-NEW_'+s+'_VARIABLE'])).size,3);
});

test('Northern Sotho Blockly lists preserve tokens, empty results and removal semantics',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-LISTS_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(!key.endsWith('_HELPURL')&&/[A-Za-z]{2}/.test(english[key])) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-LISTS_CREATE_EMPTY_TOOLTIP'],/0.*le le se nago/);
 assert.match(data['blockly-LISTS_INDEX_OF_TOOLTIP'],/%1 ge selo se sa hwetšwe/);
 assert.match(data['blockly-LISTS_ISEMPTY_TOOLTIP'],/nnete ge lenaneo le se na selo/);
 for(const suffix of ['FIRST','FROM','LAST','RANDOM']){
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_'+suffix],/^Bušetša/);
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_'+suffix],/^Tloša gomme o bušetše/);
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+suffix],/^Tloša/);
  assert.doesNotMatch(data['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+suffix],/bušetše/);
  assert.notEqual(data['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_'+suffix],data['blockly-LISTS_SET_INDEX_TOOLTIP_SET_'+suffix]);
 }
});

test('Northern Sotho Blockly list conversion and ordering preserve direction and copies',()=>{
 for(const key of ['blockly-LISTS_GET_SUBLIST_TOOLTIP','blockly-LISTS_REVERSE_TOOLTIP','blockly-LISTS_SORT_TOOLTIP']) assert.match(data[key],/khophi/);
 assert.match(data['blockly-LISTS_SORT_ORDER_ASCENDING'],/godimo/);
 assert.match(data['blockly-LISTS_SORT_ORDER_DESCENDING'],/fase/);
 assert.match(data['blockly-LISTS_SORT_TYPE_IGNORECASE'],/hlokomologa bogolo bja ditlhaka/);
 assert.match(data['blockly-LISTS_SPLIT_LIST_FROM_TEXT'],/lenaneo go tšwa sengwalweng/);
 assert.match(data['blockly-LISTS_SPLIT_TEXT_FROM_LIST'],/sengwalwa go tšwa lenaneong/);
 assert.match(data['blockly-LISTS_SPLIT_TOOLTIP_JOIN'],/sengwalwa se tee.*leswao/);
 assert.match(data['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'],/leswaong le lengwe le le lengwe/);
 for(const key of ['GET_INDEX','GET_SUBLIST','INDEX_OF','SET_INDEX']) assert.equal(data['blockly-LISTS_'+key+'_INPUT_IN_LIST'],data['blockly-LISTS_INLIST']);
 assert.equal(data['blockly-LISTS_LENGTH_TITLE'],data['blockly-TEXT_LENGTH_TITLE']);
});

test('Northern Sotho workspace announcements preserve counts, search keys and editing actions',()=>{
 const keys=Object.keys(english).filter(k=>k.startsWith('blockly-WORKSPACE_')||['blockly-UNDO','blockly-REDO','blockly-PASTE_SHORTCUT','blockly-COPY_SHORTCUT','blockly-CUT_SHORTCUT'].includes(k));
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_MANY'],/%1.*%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE'],/se tee.*%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'],/Ga go na diboloko%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_COMMENTS_MANY'],/^ le .*%1/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_COMMENTS_ONE'],/^ le .*e tee/);
 assert.match(data['blockly-WORKSPACE_SEARCH_INPUT_LABEL'],/Enter.*latelago.*Shift\+Enter.*pele.*Escape.*tswalela.*šedi/);
 assert.match(data['blockly-WORKSPACE_SEARCH_MATCH'],/%1.*%2.*%3/);
 assert.match(data['blockly-WORKSPACE_SEARCH_NO_MATCHES'],/^Ga go na/);
 assert.notEqual(data['blockly-WORKSPACE_SEARCH_FIND_NEXT'],data['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']);
 assert.notEqual(data['blockly-UNDO'],data['blockly-REDO']);
 assert.equal(new Set(['COPY','CUT','PASTE'].map(k=>data['blockly-'+k+'_SHORTCUT'])).size,3);
});
