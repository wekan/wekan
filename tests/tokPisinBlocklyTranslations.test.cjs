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

test('Tok Pisin input labels preserve tokens and distinguish input roles',()=>{
 for(const key of Object.keys(english).filter(k=>/^blockly-(INPUT_LABEL_|FIELD_)/.test(k))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
 }
 assert.equal(data['blockly-FIELD_BITMAP_PIXEL_ON'],'i lait');
 assert.equal(data['blockly-FIELD_BITMAP_PIXEL_OFF'],'i no lait');
 assert.match(data['blockly-FIELD_BITMAP_ARIA_VALUE'],/%1.*%2.*%3 piksel i lait/);
 assert.match(data['blockly-FIELD_BITMAP_PIXEL_LABEL'],/arere %2.*daun %3/);
 for(const group of ['LISTS','TEXT']){
  assert.match(data['blockly-INPUT_LABEL_'+group+'_START_POSITION'],/stat/);
  assert.match(data['blockly-INPUT_LABEL_'+group+'_END_POSITION'],/pinis/);
 }
 for(const group of ['NUMBER','VALUE','CONDITION']){
  assert.match(data['blockly-INPUT_LABEL_'+group+'_A'],/^fes/);
  assert.match(data['blockly-INPUT_LABEL_'+group+'_B'],/^namba tu/);
 }
 assert.match(data['blockly-INPUT_LABEL_NUMBER_MAX'],/bikpela/);
 assert.match(data['blockly-INPUT_LABEL_NUMBER_MIN'],/liklik/);
 assert.doesNotMatch(data['blockly-INPUT_LABEL_MATH_DIVIDEND'],/wantaim/);
 assert.match(data['blockly-INPUT_LABEL_MATH_DIVISOR'],/wantaim/);
 assert.match(data['blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT'],/teks bilong brukim/);
 assert.match(data['blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST'],/lis bilong joinim/);
 assert.match(data['blockly-INPUT_LABEL_TEXT_APPEND'],/putim long pinis/);
 assert.match(data['blockly-INPUT_LABEL_TEXT_TO_REPLACE'],/rausim na putim nupela/);
});


test('Tok Pisin editing commands preserve every source placeholder',()=>{
 const keys=[
  "blockly-CHANGE_VALUE_TITLE",
  "blockly-CLEAN_UP",
  "blockly-CLOSE_BACKPACK",
  "blockly-COLLAPSED_WARNINGS_WARNING",
  "blockly-COLLAPSE_ALL",
  "blockly-COLLAPSE_BLOCK",
  "blockly-COPY_ALL_TO_BACKPACK",
  "blockly-COPY_SHORTCUT",
  "blockly-COPY_TO_BACKPACK",
  "blockly-CUT_SHORTCUT",
  "blockly-DELETE_ALL_BLOCKS",
  "blockly-DELETE_BLOCK",
  "blockly-DELETE_X_BLOCKS",
  "blockly-DISABLE_BLOCK",
  "blockly-DUPLICATE_BLOCK",
  "blockly-DUPLICATE_COMMENT",
  "blockly-EDIT_BLOCK_CONTENTS",
  "blockly-EMPTY_BACKPACK",
  "blockly-ENABLE_BLOCK",
  "blockly-EXPAND_ALL",
  "blockly-EXPAND_BLOCK",
  "blockly-EXTERNAL_INPUTS",
  "blockly-HELP_PROMPT",
  "blockly-ICON_LABEL_COMMENT_CLOSED",
  "blockly-ICON_LABEL_COMMENT_OPEN",
  "blockly-ICON_LABEL_DEFAULT",
  "blockly-ICON_LABEL_MUTATOR_CLOSED",
  "blockly-ICON_LABEL_MUTATOR_OPEN",
  "blockly-ICON_LABEL_WARNING_CLOSED",
  "blockly-ICON_LABEL_WARNING_OPEN",
  "blockly-INLINE_INPUTS",
  "blockly-MOVE_BLOCK",
  "blockly-OPEN_BACKPACK",
  "blockly-PASTE_ALL_FROM_BACKPACK",
  "blockly-PASTE_SHORTCUT",
  "blockly-REDO",
  "blockly-REMOVE_FROM_BACKPACK",
  "blockly-SCREENREADER_HINT",
  "blockly-SCREENREADER_MODE_DISABLED",
  "blockly-SCREENREADER_MODE_ENABLED",
  "blockly-SHORTCUTS_ABORT_MOVE",
  "blockly-SHORTCUTS_CLEANUP",
  "blockly-SHORTCUTS_CODE_NAVIGATION",
  "blockly-SHORTCUTS_DISCONNECT",
  "blockly-SHORTCUTS_DUPLICATE",
  "blockly-SHORTCUTS_EDITING",
  "blockly-SHORTCUTS_ESCAPE",
  "blockly-SHORTCUTS_EXTENDED_INFORMATION",
  "blockly-SHORTCUTS_FINISH_MOVE",
  "blockly-SHORTCUTS_FOCUS_TOOLBOX",
  "blockly-SHORTCUTS_GENERAL",
  "blockly-SHORTCUTS_INFORMATION",
  "blockly-SHORTCUTS_JUMP_BLOCK_END",
  "blockly-SHORTCUTS_JUMP_BLOCK_START",
  "blockly-SHORTCUTS_JUMP_BOTTOM_STACK",
  "blockly-SHORTCUTS_JUMP_FIRST_BLOCK",
  "blockly-SHORTCUTS_JUMP_LAST_BLOCK",
  "blockly-SHORTCUTS_JUMP_NEXT_PAGE",
  "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE",
  "blockly-SHORTCUTS_JUMP_TOP_STACK",
  "blockly-SHORTCUTS_MOVE_DOWN",
  "blockly-SHORTCUTS_MOVE_LEFT",
  "blockly-SHORTCUTS_MOVE_RIGHT",
  "blockly-SHORTCUTS_MOVE_UP",
  "blockly-SHORTCUTS_NEXT_HEADING",
  "blockly-SHORTCUTS_NEXT_STACK",
  "blockly-SHORTCUTS_PERFORM_ACTION",
  "blockly-SHORTCUTS_PREVIOUS_HEADING",
  "blockly-SHORTCUTS_PREVIOUS_STACK",
  "blockly-SHORTCUTS_SCROLL_DOWN",
  "blockly-SHORTCUTS_SCROLL_LEFT",
  "blockly-SHORTCUTS_SCROLL_RIGHT",
  "blockly-SHORTCUTS_SCROLL_UP",
  "blockly-SHORTCUTS_SHOW_CONTEXT_MENU",
  "blockly-SHORTCUTS_SHOW_TOOLTIP",
  "blockly-SHORTCUTS_START_MOVE",
  "blockly-SHORTCUTS_START_MOVE_STACK",
  "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE",
  "blockly-TODAY",
  "blockly-UNDO",
  "blockly-UNKNOWN",
  "blockly-UNNAMED_KEY"
];
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  assert.notEqual(data[key],english[key],key);
 }
});

test('Tok Pisin editing commands distinguish destructive actions and navigation directions',()=>{
 assert.match(data['blockly-DELETE_ALL_BLOCKS'],/olgeta %1/);
 assert.match(data['blockly-EMPTY_BACKPACK'],/Rausim olgeta samting/);
 assert.match(data['blockly-COPY_ALL_TO_BACKPACK'],/Kopim olgeta.*i go long bekpek/);
 assert.match(data['blockly-PASTE_ALL_FROM_BACKPACK'],/Putim kopi.*i kam long bekpek/);
 assert.match(data['blockly-DISABLE_BLOCK'],/i no wok/);
 assert.doesNotMatch(data['blockly-ENABLE_BLOCK'],/no wok/);
 for(const kind of ['COMMENT','WARNING']){
  assert.match(data['blockly-ICON_LABEL_'+kind+'_CLOSED'],/^Opim/);
  assert.match(data['blockly-ICON_LABEL_'+kind+'_OPEN'],/^Pasim/);
 }
 assert.match(data['blockly-SCREENREADER_MODE_DISABLED'],/i no wok.*%1.*mekim i wok/);
 assert.match(data['blockly-SCREENREADER_MODE_ENABLED'],/i wok.*%1.*mekim i no wok/);
 for(const action of ['MOVE','SCROLL']){
  assert.match(data['blockly-SHORTCUTS_'+action+'_LEFT'],/han kais/);
  assert.match(data['blockly-SHORTCUTS_'+action+'_RIGHT'],/han sut/);
  assert.match(data['blockly-SHORTCUTS_'+action+'_UP'],/antap/);
  assert.match(data['blockly-SHORTCUTS_'+action+'_DOWN'],/daun/);
 }
 assert.match(data['blockly-SHORTCUTS_ABORT_MOVE'],/Kanselim/);
 assert.match(data['blockly-SHORTCUTS_FINISH_MOVE'],/Pinisim/);
 assert.notEqual(data['blockly-REDO'],data['blockly-UNDO']);
});

test('Tok Pisin maths preserves placeholders, constants and literal operation symbols',()=>{
 const literals=new Set(['+','÷','×','^','-','e','pi','acos','asin','atan','cos','sin','tan','230']);
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-MATH_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(key.endsWith('_HELPURL')||literals.has(english[key])) assert.equal(data[key],english[key],key);
  else assert.notEqual(data[key],english[key],key);
 }
 for(const constant of ['π (3.141…)','e (2.718…)','φ (1.618…)','sqrt(2) (1.414…)','sqrt(½) (0.707…)','∞']) assert.ok(data['blockly-MATH_CONSTANT_TOOLTIP'].includes(constant));
 assert.match(data['blockly-MATH_RANDOM_FLOAT_TOOLTIP'],/0\.0 \(i insait\).*1\.0 \(i no insait\)/);
 assert.match(data['blockly-MATH_RANDOM_INT_TOOLTIP'],/tupela mak tu i insait/);
 assert.match(data['blockly-MATH_CONSTRAIN_TOOLTIP'],/tupela mak tu i insait/);
 assert.match(data['blockly-MATH_ATAN2_TOOLTIP'],/\(X, Y\).*digri.*-180.*180/);
 for(const op of ['COS','SIN','TAN']) assert.match(data['blockly-MATH_TRIG_TOOLTIP_'+op],/digri \(i no long radian\)/);
});

test('Tok Pisin maths distinguishes operands, aggregations and numeric signs',()=>{
 assert.match(data['blockly-MATH_ARITHMETIC_TOOLTIP_MINUS'],/rausim namba tu namba long fes namba/);
 assert.match(data['blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE'],/brukim fes namba long namba tu namba/);
 assert.match(data['blockly-MATH_ARITHMETIC_TOOLTIP_POWER'],/fes namba.*pawa.*namba tu/);
 assert.match(data['blockly-MATH_ONLIST_TOOLTIP_AVERAGE'],/bungim olgeta.*brukim long hamas/);
 assert.match(data['blockly-MATH_ONLIST_TOOLTIP_MODE'],/lis.*kamap planti moa taim/);
 assert.match(data['blockly-MATH_ONLIST_TOOLTIP_MAX'],/bikpela tru/);
 assert.match(data['blockly-MATH_ONLIST_TOOLTIP_MIN'],/liklik tru/);
 assert.match(data['blockly-MATH_IS_EVEN'],/no gat hap i stap yet/);
 assert.match(data['blockly-MATH_IS_ODD'],/1 i stap yet/);
 assert.match(data['blockly-MATH_IS_NEGATIVE'],/liklik moa long 0/);
 assert.match(data['blockly-MATH_IS_POSITIVE'],/bikpela moa long 0/);
 assert.match(data['blockly-MATH_SINGLE_TOOLTIP_NEG'],/plus i go long minus.*minus i go long plus/);
 assert.match(data['blockly-MATH_SINGLE_TOOLTIP_LN'],/beis e/);
 assert.match(data['blockly-MATH_SINGLE_TOOLTIP_LOG10'],/beis 10/);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'],/daun/);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDUP'],/antap/);
});
