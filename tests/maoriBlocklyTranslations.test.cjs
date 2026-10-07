'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/mi.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');

test('Māori Blockly text operations preserve source tokens and result semantics',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-TEXT_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-TEXT_INDEXOF_TOOLTIP'],/kuputuhi tuatahi.*kuputuhi tuarua.*%1 mēnā kāore te kuputuhi i kitea/);
 assert.match(data['blockly-TEXT_ISEMPTY_TOOLTIP'],/pono.*he putua/);
 assert.match(data['blockly-TEXT_LENGTH_TOOLTIP'],/tae atu ki ngā āputa/);
 assert.match(data['blockly-TEXT_REPLACE_MESSAGE0'],/%1 ki te %2.*%3/);
 assert.match(data['blockly-TEXT_REPLACE_TOOLTIP'],/putanga katoa/);
 assert.match(data['blockly-TEXT_CHARAT_FROM_END'],/mai i te mutunga/);
 assert.notEqual(data['blockly-TEXT_CHARAT_FIRST'],data['blockly-TEXT_CHARAT_LAST']);
});

test('Māori text controls distinguish case, trim directions and prompt types',()=>{
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'],/pūriki/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'],/PŪMATUA/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'],/pūmatua.*tīmatanga o ia kupu/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_LEFT'],/mauī/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_RIGHT'],/matau/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_BOTH'],/taha e rua/);
 assert.match(data['blockly-TEXT_TRIM_TOOLTIP'],/tārua.*tētahi pito.*pito e rua/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_NUMBER'],/he tau/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_TEXT'],/he kuputuhi/);
 assert.equal(data['blockly-TEXT_APPEND_VARIABLE'],data['blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM']);
});

test('Māori logic preserves truth conditions and comparison boundaries',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-LOGIC_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')&&key!=='blockly-LOGIC_NULL') assert.notEqual(data[key],english[key],key);
 }
 assert.equal(data['blockly-LOGIC_NULL'],'null');
 assert.equal(data['blockly-LOGIC_BOOLEAN_TRUE'],'pono');
 assert.equal(data['blockly-LOGIC_BOOLEAN_FALSE'],'hē');
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_AND'],/pono ngā tāuru e rua/);
 assert.match(data['blockly-LOGIC_OPERATION_TOOLTIP_OR'],/pono tētahi tāuru, neke atu rānei/);
 assert.match(data['blockly-LOGIC_NEGATE_TOOLTIP'],/pono mēnā he hē.*hē mēnā he pono/);
 for(const op of ['GT','LT']){
  assert.doesNotMatch(data['blockly-LOGIC_COMPARE_TOOLTIP_'+op],/ōrite/);
  assert.match(data['blockly-LOGIC_COMPARE_TOOLTIP_'+op+'E'],/he ōrite rānei/);
 }
 for(const suffix of ['CONDITION','IF_TRUE','IF_FALSE']) assert.ok(data['blockly-LOGIC_TERNARY_TOOLTIP'].includes("'"+data['blockly-LOGIC_TERNARY_'+suffix]+"'"));
});

test('Māori function messages preserve arguments and return behavior',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-PROCEDURES_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'],/kāore he putanga/);
 assert.match(data['blockly-PROCEDURES_DEFRETURN_TOOLTIP'],/whai putanga/);
 assert.match(data['blockly-PROCEDURES_CALLRETURN_TOOLTIP'],/%1.*kaiwhakamahi.*whakamahi i tōna putanga/);
 assert.match(data['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'],/Kāore e taea.*%1.*kua monokia/);
 assert.match(data['blockly-PROCEDURES_IFRETURN_WARNING'],/i roto anake/);
 assert.match(data['blockly-PROCEDURES_IFRETURN_TOOLTIP'],/pono.*uara tuarua/);
 assert.match(data['blockly-PROCEDURES_DEF_DUPLICATE_WARNING'],/tawhā tārite/);
 for(const suffix of ['TITLE','COMMENT','PROCEDURE']) assert.equal(data['blockly-PROCEDURES_DEFRETURN_'+suffix],data['blockly-PROCEDURES_DEFNORETURN_'+suffix]);
});

test('Māori control messages preserve loop bounds, branch order and stop conditions',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-CONTROLS_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-CONTROLS_FOR_TITLE'],/%1 mai i %2 ki %3.*%4/);
 assert.match(data['blockly-CONTROLS_FOR_TOOLTIP'],/%1.*tau tīmatanga.*tau whakamutunga.*hipanga/);
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/e hē ana/);
 assert.match(data['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/e pono ana/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'],/^Puta/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'],/^Tīpokatia.*tukurua whai muri/);
 assert.match(data['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'],/i roto anake.*koromeke/);
 assert.match(data['blockly-CONTROLS_IF_TOOLTIP_4'],/uara tuatahi.*uara tuarua.*kāore he uara pono.*whakamutunga/);
 for(const key of ['FOREACH_INPUT_DO','FOR_INPUT_DO','IF_MSG_THEN','WHILEUNTIL_INPUT_DO']) assert.equal(data['blockly-CONTROLS_'+key],data['blockly-CONTROLS_REPEAT_INPUT_DO']);
});

test('Māori variables preserve names, types, deletion counts and get/set distinctions',()=>{
 const keys=Object.keys(english).filter(k=>k.startsWith('blockly-')&&(/VARIABLE/.test(k))&&!k.startsWith('blockly-TEXT_'));
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-DELETE_VARIABLE_CONFIRMATION'],/whakamahinga %1.*%2/);
 assert.match(data['blockly-RENAME_VARIABLE_TITLE'],/%1.*katoa/);
 assert.match(data['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'],/%1.*momo kē.*%2/);
 assert.match(data['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'],/%1.*tawhā.*taumahi.*%2/);
 assert.match(data['blockly-VARIABLES_SET'],/%1 ki %2/);
 assert.notEqual(data['blockly-VARIABLES_SET_CREATE_GET'],data['blockly-VARIABLES_GET_CREATE_SET']);
 assert.equal(new Set(['COLOUR','NUMBER','STRING'].map(k=>data['blockly-NEW_'+k+'_VARIABLE'])).size,3);
 assert.equal(data['blockly-VARIABLES_DEFAULT_NAME'],data['blockly-TEXT_APPEND_VARIABLE']);
});

test('Māori list messages preserve tokens, index boundaries and destructive actions',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-LISTS_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]&&!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')&&english[key]!=='#') assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-LISTS_CREATE_EMPTY_TOOLTIP'],/roanga he 0.*kāore he/);
 assert.match(data['blockly-LISTS_INDEX_OF_TOOLTIP'],/%1 mēnā kāore te tūemi i kitea/);
 assert.match(data['blockly-LISTS_INDEX_FROM_START_TOOLTIP'],/%1.*tuatahi/);
 assert.match(data['blockly-LISTS_INDEX_FROM_END_TOOLTIP'],/%1.*whakamutunga/);
 for(const suffix of ['FIRST','LAST','FROM','RANDOM']){
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_'+suffix],/^Ka whakahoki/);
  assert.doesNotMatch(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_'+suffix],/tango/);
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+suffix],/^Ka tango/);
  assert.doesNotMatch(data['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+suffix],/whakahoki/);
  assert.match(data['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_'+suffix],/^Ka tango, ka whakahoki hoki/);
 }
 assert.match(data['blockly-LISTS_REPEAT_TITLE'],/%1.*%2 ngā wā/);
 assert.match(data['blockly-LISTS_GET_SUBLIST_TOOLTIP'],/tārua/);
});

test('Māori list sorting and conversion preserve copies, directions and separators',()=>{
 for(const op of ['SORT','REVERSE']) assert.match(data['blockly-LISTS_'+op+'_TOOLTIP'],/tārua/);
 assert.match(data['blockly-LISTS_SORT_ORDER_ASCENDING'],/piki/);
 assert.match(data['blockly-LISTS_SORT_ORDER_DESCENDING'],/heke/);
 assert.match(data['blockly-LISTS_SORT_TYPE_IGNORECASE'],/kaua e aro.*pūmatua.*pūriki/);
 assert.notEqual(data['blockly-LISTS_SORT_TYPE_NUMERIC'],data['blockly-LISTS_SORT_TYPE_TEXT']);
 assert.match(data['blockly-LISTS_SPLIT_LIST_FROM_TEXT'],/rārangi mai i te kuputuhi/);
 assert.match(data['blockly-LISTS_SPLIT_TEXT_FROM_LIST'],/kuputuhi mai i te rārangi/);
 assert.match(data['blockly-LISTS_SPLIT_TOOLTIP_JOIN'],/kuputuhi kotahi.*whakawehe/);
 assert.match(data['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'],/i ia whakawehe/);
 for(const kind of ['GET_INDEX','GET_SUBLIST','INDEX_OF','SET_INDEX']) assert.equal(data['blockly-LISTS_'+kind+'_INPUT_IN_LIST'],data['blockly-LISTS_INLIST']);
 assert.equal(data['blockly-LISTS_LENGTH_TITLE'],data['blockly-TEXT_LENGTH_TITLE']);
 assert.equal(data['blockly-LISTS_CREATE_WITH_ITEM_TITLE'],data['blockly-VARIABLES_DEFAULT_NAME']);
});

test('Māori workspace announcements preserve counts, search keys and editing actions',()=>{
 const keys=Object.keys(english).filter(k=>k.startsWith('blockly-WORKSPACE_')||['blockly-UNDO','blockly-REDO','blockly-PASTE_SHORTCUT','blockly-COPY_SHORTCUT','blockly-CUT_SHORTCUT'].includes(k));
 for(const key of keys){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key]) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_MANY'],/%1.*%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE'],/Kotahi.*%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'],/Kāore he poraka%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_COMMENTS_MANY'],/^ me .*%1/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_COMMENTS_ONE'],/^ me tētahi/);
 assert.match(data['blockly-WORKSPACE_SEARCH_INPUT_LABEL'],/Enter.*whai muri.*Shift\+Enter.*o mua.*Escape.*kati.*arotahi/);
 assert.match(data['blockly-WORKSPACE_SEARCH_MATCH'],/%1.*%2.*%3/);
 assert.match(data['blockly-WORKSPACE_SEARCH_NO_MATCHES'],/^Kāore he/);
 assert.notEqual(data['blockly-WORKSPACE_SEARCH_FIND_NEXT'],data['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']);
 assert.notEqual(data['blockly-UNDO'],data['blockly-REDO']);
 assert.equal(new Set(['COPY','CUT','PASTE'].map(k=>data['blockly-'+k+'_SHORTCUT'])).size,3);
});

test('Māori colours and navigation preserve tokens, ranges and directions',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-COLOUR_')||k.startsWith('blockly-KEYBOARD_NAV_')||k.startsWith('blockly-SHORTCUTS_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(!key.endsWith('_HELPURL')&&!key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.equal(new Set(['RED','GREEN','BLUE'].map(s=>data['blockly-COLOUR_RGB_'+s])).size,3);
 assert.match(data['blockly-COLOUR_RGB_TOOLTIP'],/0 me te 100/);
 assert.match(data['blockly-COLOUR_BLEND_TOOLTIP'],/0\.0 - 1\.0/);
 const directions={UP:'whakarunga',DOWN:'whakararo',LEFT:'whakatemauī',RIGHT:'whakatematau'};
 for(const [key,word] of Object.entries(directions)){
  for(const action of ['MOVE','SCROLL']) assert.ok(data['blockly-SHORTCUTS_'+action+'_'+key].endsWith(word));
  assert.notEqual(data['blockly-SHORTCUTS_MOVE_'+key],data['blockly-SHORTCUTS_SCROLL_'+key]);
 }
 assert.match(data['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'],/Puritia %1.*neke noa.*%2.*whakaae ki te tūranga/);
 assert.match(data['blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT'],/pātuhi pere.*%1.*whakaae ki te tūranga/);
 assert.notEqual(data['blockly-KEYBOARD_NAV_COPIED_HINT'],data['blockly-KEYBOARD_NAV_CUT_HINT']);
 assert.equal(new Set(['ABORT','FINISH','START'].map(s=>data['blockly-SHORTCUTS_'+s+'_MOVE'])).size,3);
 assert.match(data['blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE'],/Whakakā, whakaweto rānei/);
 for(const suffix of ['HEADING','STACK']) assert.notEqual(data['blockly-SHORTCUTS_NEXT_'+suffix],data['blockly-SHORTCUTS_PREVIOUS_'+suffix]);
});

test('Māori input and bitmap labels preserve tokens, states and operand roles',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-FIELD_')||k.startsWith('blockly-INPUT_LABEL_'))){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(data['blockly-FIELD_BITMAP_PIXEL_ON'],'kua kā');
 assert.equal(data['blockly-FIELD_BITMAP_PIXEL_OFF'],'kua weto');
 assert.match(data['blockly-FIELD_BITMAP_ARIA_VALUE'],/%1.*%2.*%3 pika kua kā/);
 assert.match(data['blockly-FIELD_BITMAP_PIXEL_LABEL'],/%1.*rārangi %2.*tīwae %3/);
 for(const suffix of ['START_POSITION','END_POSITION']) assert.equal(data['blockly-INPUT_LABEL_LISTS_'+suffix],data['blockly-INPUT_LABEL_TEXT_'+suffix]);
 assert.equal(data['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'],data['blockly-INPUT_LABEL_LOOP_TIMES']);
 assert.equal(data['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET'],data['blockly-INPUT_LABEL_VARIABLES_SET']);
 for(const kind of ['CONDITION','NUMBER','VALUE']){
  assert.match(data['blockly-INPUT_LABEL_'+kind+'_A'],/tuatahi/);
  assert.match(data['blockly-INPUT_LABEL_'+kind+'_B'],/tuarua/);
 }
 assert.equal(data['blockly-INPUT_LABEL_MATH_DIVIDEND'],'tau e whakawehea ana');
 assert.equal(data['blockly-INPUT_LABEL_MATH_DIVISOR'],'tau whakawehe');
 assert.match(data['blockly-INPUT_LABEL_NUMBER_ATAN2_X'],/ x$/);
 assert.match(data['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'],/ y$/);
 assert.notEqual(data['blockly-INPUT_LABEL_NUMBER_MIN'],data['blockly-INPUT_LABEL_NUMBER_MAX']);
 assert.notEqual(data['blockly-INPUT_LABEL_TEXT_TO_FIND'],data['blockly-INPUT_LABEL_TEXT_TO_REPLACE']);
});

test('Māori editing controls distinguish actions and announce accessibility states',()=>{
 const suffixes=['CHANGE_VALUE_TITLE','CLEAN_UP','CLOSE_BACKPACK','COLLAPSED_WARNINGS_WARNING','COLLAPSE_ALL','COLLAPSE_BLOCK','COPY_ALL_TO_BACKPACK','COPY_TO_BACKPACK','CURRENT_BLOCK_ANNOUNCEMENT','DELETE_ALL_BLOCKS','DELETE_BLOCK','DELETE_X_BLOCKS','DISABLE_BLOCK','DUPLICATE_BLOCK','DUPLICATE_COMMENT','EDIT_BLOCK_CONTENTS','EMPTY_BACKPACK','ENABLE_BLOCK','EXPAND_ALL','EXPAND_BLOCK','EXTERNAL_INPUTS','HELP_PROMPT','ICON_LABEL_COMMENT_CLOSED','ICON_LABEL_COMMENT_OPEN','ICON_LABEL_DEFAULT','ICON_LABEL_MUTATOR_CLOSED','ICON_LABEL_MUTATOR_OPEN','ICON_LABEL_WARNING_CLOSED','ICON_LABEL_WARNING_OPEN','INLINE_INPUTS','MINIMAP_ARIA_LABEL','MOVE_BLOCK','NO_PARENT_ANNOUNCEMENT','OPEN_BACKPACK','OPEN_TRASH','PARENT_BLOCKS_ANNOUNCEMENT','PASTE_ALL_FROM_BACKPACK','REMOVE_FROM_BACKPACK','RESET_ZOOM','SCREENREADER_HINT','SCREENREADER_MODE_DISABLED','SCREENREADER_MODE_ENABLED','TODAY','UNKNOWN','UNNAMED_KEY','ZOOM_TO_FIT_ARIA_LABEL'];
 for(const suffix of suffixes){
  const key='blockly-'+suffix;
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['blockly-DELETE_ALL_BLOCKS'],/%1 katoa/);
 assert.match(data['blockly-EMPTY_BACKPACK'],/Tangohia ngā mea katoa/);
 assert.match(data['blockly-NO_PARENT_ANNOUNCEMENT'],/^Kāore he poraka matua/);
 assert.match(data['blockly-SCREENREADER_MODE_DISABLED'],/Kua weto.*%1.*whakakā/);
 assert.match(data['blockly-SCREENREADER_MODE_ENABLED'],/Kua kā.*%1.*whakaweto/);
 for(const [a,b] of [['COLLAPSE_BLOCK','EXPAND_BLOCK'],['ENABLE_BLOCK','DISABLE_BLOCK'],['EXTERNAL_INPUTS','INLINE_INPUTS'],['OPEN_BACKPACK','CLOSE_BACKPACK'],['REMOVE_FROM_BACKPACK','EMPTY_BACKPACK']]) assert.notEqual(data['blockly-'+a],data['blockly-'+b]);
 for(const kind of ['COMMENT','WARNING']){
  assert.match(data['blockly-ICON_LABEL_'+kind+'_CLOSED'],/^Whakatuwheratia /);
  assert.match(data['blockly-ICON_LABEL_'+kind+'_OPEN'],/^Katia /);
 }
});

test('Māori mathematics preserves formulas, tokens and interval boundaries',()=>{
 const literals=new Set(['e','pi','+','÷','×','^','-','acos','asin','atan','cos','sin','tan']);
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-MATH_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(key.endsWith('_HELPURL')||key.endsWith('_HUE')||literals.has(english[key])) assert.equal(data[key],english[key],key);
  else assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-MATH_RANDOM_FLOAT_TOOLTIP'],/0\.0 \(kei roto\).*1\.0 \(kāore i roto\)/);
 for(const key of ['blockly-MATH_RANDOM_INT_TOOLTIP','blockly-MATH_CONSTRAIN_TOOLTIP']) assert.match(data[key],/tae atu ki ngā tepe/);
 assert.match(data['blockly-MATH_ATAN2_TOOLTIP'],/\(X, Y\).*putu.*-180.*180/);
 for(const op of ['SIN','COS','TAN']) assert.match(data['blockly-MATH_TRIG_TOOLTIP_'+op],/putu \(kaua mā te rad\)/);
 for(const literal of ['π (3.141…)','e (2.718…)','φ (1.618…)','sqrt(2) (1.414…)','sqrt(½) (0.707…)','∞']) assert.ok(data['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
});

test('Māori mathematics distinguishes statistics, signs and rounding',()=>{
 assert.equal(new Set(['AVERAGE','MEDIAN','MODE','SUM','STD_DEV'].map(s=>data['blockly-MATH_ONLIST_OPERATOR_'+s])).size,5);
 assert.match(data['blockly-MATH_ONLIST_TOOLTIP_MODE'],/rārangi.*tino auau/);
 assert.match(data['blockly-MATH_MODULO_TOOLTIP'],/toenga/);
 assert.doesNotMatch(data['blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE'],/toenga/);
 assert.match(data['blockly-MATH_ARITHMETIC_TOOLTIP_POWER'],/tuatahi.*ā-taupū.*tuarua/);
 assert.notEqual(data['blockly-MATH_IS_EVEN'],data['blockly-MATH_IS_ODD']);
 assert.match(data['blockly-MATH_IS_POSITIVE'],/tōrunga/);
 assert.match(data['blockly-MATH_IS_NEGATIVE'],/tōraro/);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'],/whakararo$/);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDUP'],/whakarunga$/);
 assert.match(data['blockly-MATH_SINGLE_TOOLTIP_NEG'],/hurihia tōna tohu/);
 assert.match(data['blockly-MATH_SINGLE_TOOLTIP_LN'],/pūtake e/);
 assert.equal(data['blockly-MATH_CHANGE_TITLE_ITEM'],data['blockly-VARIABLES_DEFAULT_NAME']);
 for(const s of ['MAX','MIN']) assert.equal(data['blockly-MATH_ONLIST_OPERATOR_'+s+'_ARIA'],data['blockly-INPUT_LABEL_NUMBER_'+s]);
});
