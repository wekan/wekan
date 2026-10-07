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

test('Northern Sotho colours and navigation preserve tokens, ranges and directions',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-COLOUR_')||k.startsWith('blockly-KEYBOARD_NAV_')||k.startsWith('blockly-SHORTCUTS_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.equal(new Set(['RED','GREEN','BLUE'].map(s=>data['blockly-COLOUR_RGB_'+s])).size,3);
 assert.match(data['blockly-COLOUR_RGB_TOOLTIP'],/0 le 100/);
 assert.match(data['blockly-COLOUR_BLEND_TOOLTIP'],/0\.0 - 1\.0/);
 const directions={UP:'godimo',DOWN:'fase',LEFT:'nngele',RIGHT:'go ja'};
 for(const [key,word] of Object.entries(directions)){
  for(const action of ['MOVE','SCROLL']) assert.ok(data['blockly-SHORTCUTS_'+action+'_'+key].endsWith(word));
  assert.notEqual(data['blockly-SHORTCUTS_MOVE_'+key],data['blockly-SHORTCUTS_SCROLL_'+key]);
 }
 assert.match(data['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'],/Swara %1.*ka tokologo.*%2.*amogela boemo/);
 assert.match(data['blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT'],/mesebe.*%1.*amogela boemo/);
 assert.notEqual(data['blockly-KEYBOARD_NAV_COPIED_HINT'],data['blockly-KEYBOARD_NAV_CUT_HINT']);
 assert.equal(new Set(['ABORT','FINISH','START'].map(s=>data['blockly-SHORTCUTS_'+s+'_MOVE'])).size,3);
 assert.match(data['blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE'],/Bulela goba tima/);
 for(const suffix of ['HEADING','STACK']) assert.notEqual(data['blockly-SHORTCUTS_NEXT_'+suffix],data['blockly-SHORTCUTS_PREVIOUS_'+suffix]);
});

test('Northern Sotho input and bitmap labels preserve tokens, states and operand roles',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-FIELD_')||k.startsWith('blockly-INPUT_LABEL_'))){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(data['blockly-FIELD_BITMAP_PIXEL_ON'],'e butšwe');
 assert.equal(data['blockly-FIELD_BITMAP_PIXEL_OFF'],'e timilwe');
 assert.match(data['blockly-FIELD_BITMAP_ARIA_VALUE'],/%1.*%2.*%3.*di butšwe/);
 assert.match(data['blockly-FIELD_BITMAP_PIXEL_LABEL'],/%1.*mothaladi wa %2.*kholomo ya %3/);
 for(const suffix of ['START_POSITION','END_POSITION']) assert.equal(data['blockly-INPUT_LABEL_LISTS_'+suffix],data['blockly-INPUT_LABEL_TEXT_'+suffix]);
 assert.equal(data['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'],data['blockly-INPUT_LABEL_LOOP_TIMES']);
 assert.equal(data['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET'],data['blockly-INPUT_LABEL_VARIABLES_SET']);
 for(const kind of ['CONDITION','NUMBER','VALUE']){
  assert.match(data['blockly-INPUT_LABEL_'+kind+'_A'],/mathomo/);
  assert.match(data['blockly-INPUT_LABEL_'+kind+'_B'],/bobedi/);
 }
 assert.match(data['blockly-INPUT_LABEL_MATH_DIVIDEND'],/^nomoro ye e arolwago$/);
 assert.match(data['blockly-INPUT_LABEL_MATH_DIVISOR'],/^nomoro ye go arolwago ka yona$/);
 assert.match(data['blockly-INPUT_LABEL_NUMBER_ATAN2_X'],/ x$/);
 assert.match(data['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'],/ y$/);
 assert.notEqual(data['blockly-INPUT_LABEL_NUMBER_MIN'],data['blockly-INPUT_LABEL_NUMBER_MAX']);
 assert.notEqual(data['blockly-INPUT_LABEL_TEXT_TO_FIND'],data['blockly-INPUT_LABEL_TEXT_TO_REPLACE']);
});

test('Northern Sotho editing controls distinguish actions and announce accessibility states',()=>{
 const suffixes=['CHANGE_VALUE_TITLE','CLEAN_UP','CLOSE_BACKPACK','COLLAPSED_WARNINGS_WARNING','COLLAPSE_ALL','COLLAPSE_BLOCK','COPY_ALL_TO_BACKPACK','COPY_TO_BACKPACK','CURRENT_BLOCK_ANNOUNCEMENT','DELETE_ALL_BLOCKS','DELETE_BLOCK','DELETE_X_BLOCKS','DISABLE_BLOCK','DUPLICATE_BLOCK','DUPLICATE_COMMENT','EDIT_BLOCK_CONTENTS','EMPTY_BACKPACK','ENABLE_BLOCK','EXPAND_ALL','EXPAND_BLOCK','EXTERNAL_INPUTS','HELP_PROMPT','ICON_LABEL_COMMENT_CLOSED','ICON_LABEL_COMMENT_OPEN','ICON_LABEL_DEFAULT','ICON_LABEL_MUTATOR_CLOSED','ICON_LABEL_MUTATOR_OPEN','ICON_LABEL_WARNING_CLOSED','ICON_LABEL_WARNING_OPEN','INLINE_INPUTS','MINIMAP_ARIA_LABEL','MOVE_BLOCK','NO_PARENT_ANNOUNCEMENT','OPEN_BACKPACK','OPEN_TRASH','PARENT_BLOCKS_ANNOUNCEMENT','PASTE_ALL_FROM_BACKPACK','REMOVE_FROM_BACKPACK','RESET_ZOOM','SCREENREADER_HINT','SCREENREADER_MODE_DISABLED','SCREENREADER_MODE_ENABLED','TODAY','UNKNOWN','UNNAMED_KEY','ZOOM_TO_FIT_ARIA_LABEL'];
 for(const suffix of suffixes){
  const key='blockly-'+suffix;
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['blockly-DELETE_ALL_BLOCKS'],/ka moka.*%1/);
 assert.match(data['blockly-NO_PARENT_ANNOUNCEMENT'],/ga bo na/);
 assert.match(data['blockly-SCREENREADER_MODE_DISABLED'],/o timilwe.*%1.*bulela/);
 assert.match(data['blockly-SCREENREADER_MODE_ENABLED'],/o butšwe.*%1.*tima/);
 for(const [a,b] of [['COLLAPSE_BLOCK','EXPAND_BLOCK'],['ENABLE_BLOCK','DISABLE_BLOCK'],['EXTERNAL_INPUTS','INLINE_INPUTS'],['OPEN_BACKPACK','CLOSE_BACKPACK'],['REMOVE_FROM_BACKPACK','EMPTY_BACKPACK']]) assert.notEqual(data['blockly-'+a],data['blockly-'+b]);
 for(const kind of ['COMMENT','WARNING']){
  assert.match(data['blockly-ICON_LABEL_'+kind+'_CLOSED'],/^Bula /);
  assert.match(data['blockly-ICON_LABEL_'+kind+'_OPEN'],/^Tswalela /);
 }
});

test('Northern Sotho mathematics preserves formulas, tokens and inclusive boundaries',()=>{
 const literals=new Set(['e','pi','+','÷','×','^','-','acos','asin','atan','cos','sin','tan']);
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-MATH_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(key.endsWith('_HELPURL')||key.endsWith('_HUE')||literals.has(english[key])) assert.equal(data[key],english[key],key);
  else assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-MATH_RANDOM_FLOAT_TOOLTIP'],/0\.0 \(e akareditšwe\).*1\.0 \(ga e akaretšwe\)/);
 for(const key of ['blockly-MATH_RANDOM_INT_TOOLTIP','blockly-MATH_CONSTRAIN_TOOLTIP']) assert.match(data[key],/go akaretša mellwane/);
 assert.match(data['blockly-MATH_ATAN2_TOOLTIP'],/\(X, Y\).*dikgato.*-180.*180/);
 for(const op of ['SIN','COS','TAN']) assert.match(data['blockly-MATH_TRIG_TOOLTIP_'+op],/dikgato \(e sego ka diradiene\)/);
 for(const literal of ['π (3.141…)','e (2.718…)','φ (1.618…)','sqrt(2) (1.414…)','sqrt(½) (0.707…)','∞']) assert.ok(data['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
});

test('Northern Sotho mathematics distinguishes statistical operations, signs and rounding',()=>{
 assert.equal(new Set(['AVERAGE','MEDIAN','MODE','SUM','STD_DEV'].map(s=>data['blockly-MATH_ONLIST_OPERATOR_'+s])).size,5);
 assert.match(data['blockly-MATH_ONLIST_TOOLTIP_MODE'],/lenaneo.*tšwelelago gantši kudu/);
 assert.match(data['blockly-MATH_MODULO_TOOLTIP'],/mašalela/);
 assert.doesNotMatch(data['blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE'],/mašalela/);
 assert.match(data['blockly-MATH_ARITHMETIC_TOOLTIP_POWER'],/mathomo.*matlapalo.*bobedi/);
 assert.notEqual(data['blockly-MATH_IS_EVEN'],data['blockly-MATH_IS_ODD']);
 assert.match(data['blockly-MATH_IS_POSITIVE'],/godimo ga lefela/);
 assert.match(data['blockly-MATH_IS_NEGATIVE'],/fase ga lefela/);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'],/fase$/);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDUP'],/godimo$/);
 assert.match(data['blockly-MATH_SINGLE_TOOLTIP_NEG'],/fetotšwe leswao/);
 assert.equal(data['blockly-MATH_CHANGE_TITLE_ITEM'],data['blockly-VARIABLES_DEFAULT_NAME']);
});
