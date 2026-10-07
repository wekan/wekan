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

test('Somali Blockly text messages preserve arguments, indexing and empty results',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-TEXT_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(english[key] && !key.endsWith('_HELPURL') && !key.endsWith('_HUE')) assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-TEXT_INDEXOF_TOOLTIP'],/koowaad.*labaad.*%1 haddii qoraalka la waayo/);
 assert.match(data['blockly-TEXT_ISEMPTY_TOOLTIP'],/run haddii.*madhan yahay/);
 assert.match(data['blockly-TEXT_LENGTH_TOOLTIP'],/ku jiraan meelaha bannaan/);
 assert.match(data['blockly-TEXT_CHARAT_FROM_END'],/laga soo tiriyey dhammaadka/);
 assert.notEqual(data['blockly-TEXT_CHARAT_FIRST'],data['blockly-TEXT_CHARAT_LAST']);
 assert.match(data['blockly-TEXT_REPLACE_MESSAGE0'],/%1.*%2.*%3/);
 assert.match(data['blockly-TEXT_REPLACE_TOOLTIP'],/dhammaan/);
});

test('Somali Blockly text formatting preserves direction and input types',()=>{
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'],/far yaryar/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'],/FAR WAAWEYN/);
 assert.match(data['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'],/hore ee eray kasta/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_LEFT'],/bidix/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_RIGHT'],/midig/);
 assert.match(data['blockly-TEXT_TRIM_OPERATOR_BOTH'],/labada dhinac/);
 assert.match(data['blockly-TEXT_TRIM_TOOLTIP'],/nuqul.*hal daraf ama labada daraf/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_NUMBER'],/tiro/);
 assert.match(data['blockly-TEXT_PROMPT_TOOLTIP_TEXT'],/qoraal/);
 assert.equal(data['blockly-TEXT_APPEND_VARIABLE'],data['blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM']);
 assert.equal(data['blockly-TEXT_LENGTH_TITLE'],data['blockly-LISTS_LENGTH_TITLE']);
});


test('Somali Blockly variables and workspace controls preserve arguments and names',()=>{
 const keys=["blockly-FIELD_LABEL_VARIABLE", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-REDO", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-UNDO", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL"];
 assert.equal(keys.length,45);
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.match(data['blockly-RENAME_VARIABLE_TITLE'],/Dhammaan.*'%1'/);
 assert.match(data['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'],/'%1'.*nooc kale: '%2'/);
 assert.match(data['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'],/'%1'.*cabbir gelin.*'%2'/);
 assert.equal(data['blockly-VARIABLES_DEFAULT_NAME'],data['blockly-TEXT_APPEND_VARIABLE']);
 assert.notEqual(data['blockly-UNDO'],data['blockly-REDO']);
 assert.notEqual(data['blockly-VARIABLES_GET_CREATE_SET'],data['blockly-VARIABLES_SET_CREATE_GET']);
});

test('Somali Blockly workspace announcements preserve counts and keyboard navigation',()=>{
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_MANY'],/%1.*%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE'],/^Hal.*%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'],/ma jiraan%2/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_COMMENTS_MANY'],/^ iyo %1/);
 assert.match(data['blockly-WORKSPACE_CONTENTS_COMMENTS_ONE'],/^ iyo hal/);
 const help=data['blockly-WORKSPACE_SEARCH_INPUT_LABEL'];
 assert.match(help,/Enter.*xigta.*Shift\+Enter.*hore.*Escape.*xirto.*diiradda/);
 assert.notEqual(data['blockly-WORKSPACE_SEARCH_FIND_NEXT'],data['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']);
 assert.match(data['blockly-WORKSPACE_SEARCH_NO_MATCHES'],/^Ma jiraan/);
 assert.match(data['blockly-WORKSPACE_SEARCH_MATCH'],/%1.*%2.*%3/);
 assert.match(data['blockly-PASTE_ALL_FROM_BACKPACK'],/dhammaan/);
});

test('Somali Blockly navigation preserves shortcuts, movement directions and acceptance',()=>{
 const keys=Object.keys(english).filter(k=>k.startsWith('blockly-KEYBOARD_NAV_')||k.startsWith('blockly-SHORTCUTS_')||k==='blockly-MOVE_BLOCK');
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 const directions={UP:'Kor',DOWN:'Hoos',LEFT:'Bidix',RIGHT:'Midig'};
 for(const [direction,word] of Object.entries(directions)){
  for(const action of ['MOVE','SCROLL']) assert.ok(data['blockly-SHORTCUTS_'+action+'_'+direction].startsWith(word));
  assert.notEqual(data['blockly-SHORTCUTS_MOVE_'+direction],data['blockly-SHORTCUTS_SCROLL_'+direction]);
 }
 assert.match(data['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'],/Hay %1.*xor ah.*%2.*aqbasho/);
 assert.match(data['blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT'],/fallaadhaha.*%1.*aqbasho/);
 assert.notEqual(data['blockly-KEYBOARD_NAV_COPIED_HINT'],data['blockly-KEYBOARD_NAV_CUT_HINT']);
 assert.equal(new Set(['ABORT','FINISH','START'].map(s=>data['blockly-SHORTCUTS_'+s+'_MOVE'])).size,3);
 assert.equal(data['blockly-SHORTCUTS_DUPLICATE'],data['blockly-DUPLICATE_BLOCK']);
 assert.match(data['blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE'],/Daar ama dami/);
 for(const suffix of ['HEADING','STACK']) assert.notEqual(data['blockly-SHORTCUTS_NEXT_'+suffix],data['blockly-SHORTCUTS_PREVIOUS_'+suffix]);
 assert.notEqual(data['blockly-SHORTCUTS_JUMP_TOP_STACK'],data['blockly-SHORTCUTS_JUMP_BOTTOM_STACK']);
});

test('Somali Blockly input and bitmap labels preserve tokens and active states',()=>{
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-FIELD_')||k.startsWith('blockly-INPUT_LABEL_'))){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(data['blockly-FIELD_BITMAP_PIXEL_ON'],'shidan');
 assert.equal(data['blockly-FIELD_BITMAP_PIXEL_OFF'],'dansan');
 assert.match(data['blockly-FIELD_BITMAP_ARIA_VALUE'],/%1.*%2.*%3.*shidan/);
 assert.match(data['blockly-FIELD_BITMAP_PIXEL_LABEL'],/%1.*safka %2.*tiirka %3/);
 assert.equal(data['blockly-FIELD_LABEL_EMPTY'],data['blockly-INPUT_LABEL_EMPTY'].toLowerCase());
});

test('Somali Blockly input labels retain operand roles and shared endpoints',()=>{
 for(const suffix of ['START_POSITION','END_POSITION']) assert.equal(data['blockly-INPUT_LABEL_LISTS_'+suffix],data['blockly-INPUT_LABEL_TEXT_'+suffix]);
 assert.equal(data['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'],data['blockly-INPUT_LABEL_LOOP_TIMES']);
 assert.equal(data['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET'],data['blockly-INPUT_LABEL_VARIABLES_SET']);
 for(const kind of ['CONDITION','NUMBER','VALUE']){
  assert.match(data['blockly-INPUT_LABEL_'+kind+'_A'],/koowaad/);
  assert.match(data['blockly-INPUT_LABEL_'+kind+'_B'],/labaad/);
 }
 assert.match(data['blockly-INPUT_LABEL_MATH_DIVIDEND'],/^tirada la qaybinayo$/);
 assert.match(data['blockly-INPUT_LABEL_MATH_DIVISOR'],/^tirada wax lagu qaybinayo$/);
 assert.match(data['blockly-INPUT_LABEL_NUMBER_ATAN2_X'],/ x$/);
 assert.match(data['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'],/ y$/);
 assert.notEqual(data['blockly-INPUT_LABEL_NUMBER_MIN'],data['blockly-INPUT_LABEL_NUMBER_MAX']);
 assert.notEqual(data['blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT'],data['blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST']);
 assert.notEqual(data['blockly-INPUT_LABEL_TEXT_TO_FIND'],data['blockly-INPUT_LABEL_TEXT_TO_REPLACE']);
});


test('Somali Blockly remaining controls preserve arguments and paired states',()=>{
 const keys=["blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-MINIMAP_ARIA_LABEL", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-REMOVE_FROM_BACKPACK", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-TODAY", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE"];
 assert.equal(keys.length,26);
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 for(const kind of ['COMMENT','WARNING']){
  assert.match(data['blockly-ICON_LABEL_'+kind+'_CLOSED'],/^Fur /);
  assert.match(data['blockly-ICON_LABEL_'+kind+'_OPEN'],/^Xir /);
 }
 assert.match(data['blockly-SCREENREADER_MODE_DISABLED'],/dansan.*%1.*daarto/);
 assert.match(data['blockly-SCREENREADER_MODE_ENABLED'],/shidan.*%1.*damiso/);
 assert.match(data['blockly-SCREENREADER_HINT'],/%1.*daarto ama u damiso/);
 assert.match(data['blockly-NO_PARENT_ANNOUNCEMENT'],/ma laha baloog waalid/);
 assert.match(data['blockly-MINIMAP_ARIA_LABEL'],/fallaadhaha.*muuqaalka/);
 assert.equal(data['blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF'],data['blockly-CONTROLS_IF_MSG_ELSEIF']);
 assert.equal(data['blockly-CONTROLS_IF_ELSE_TITLE_ELSE'],data['blockly-CONTROLS_IF_MSG_ELSE']);
 assert.notEqual(data['blockly-EXTERNAL_INPUTS'],data['blockly-INLINE_INPUTS']);
 assert.notEqual(data['blockly-OPEN_BACKPACK'],data['blockly-CLOSE_BACKPACK']);
});

test('Somali Blockly mathematics retains formula names, tokens and numerical boundaries',()=>{
 const literals=new Set(['e','pi','+','÷','×','^','-','acos','asin','atan','cos','sin','tan']);
 for(const key of Object.keys(english).filter(k=>k.startsWith('blockly-MATH_'))){
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
  if(key.endsWith('_HELPURL')||key.endsWith('_HUE')||literals.has(english[key])) assert.equal(data[key],english[key],key);
  else assert.notEqual(data[key],english[key],key);
 }
 assert.match(data['blockly-MATH_RANDOM_FLOAT_TOOLTIP'],/0\.0 \(ku jira\).*1\.0 \(aan ku jirin\)/);
 for(const key of ['blockly-MATH_RANDOM_INT_TOOLTIP','blockly-MATH_CONSTRAIN_TOOLTIP']) assert.match(data[key],/labada xadba ku jiraan/);
 assert.match(data['blockly-MATH_ATAN2_TOOLTIP'],/\(X, Y\).*darajooyin.*-180.*180/);
 for(const op of ['SIN','COS','TAN']) assert.match(data['blockly-MATH_TRIG_TOOLTIP_'+op],/darajooyin \(ma aha raadiyaan\)/);
 for(const literal of ['π (3.141…)','e (2.718…)','φ (1.618…)','sqrt(2) (1.414…)','sqrt(½) (0.707…)','∞']) assert.ok(data['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
});

test('Somali Blockly mathematics keeps statistical and arithmetic operations distinct',()=>{
 assert.equal(new Set(['AVERAGE','MEDIAN','MODE','SUM','STD_DEV'].map(s=>data['blockly-MATH_ONLIST_OPERATOR_'+s])).size,5);
 assert.match(data['blockly-MATH_ONLIST_TOOLTIP_MODE'],/liis.*ugu soo noqnoqda/);
 assert.match(data['blockly-MATH_MODULO_TOOLTIP'],/haraaga/);
 assert.doesNotMatch(data['blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE'],/haraaga/);
 assert.match(data['blockly-MATH_ARITHMETIC_TOOLTIP_POWER'],/koowaad.*jibbaaray.*labaad/);
 assert.notEqual(data['blockly-MATH_IS_EVEN'],data['blockly-MATH_IS_ODD']);
 assert.notEqual(data['blockly-MATH_IS_POSITIVE'],data['blockly-MATH_IS_NEGATIVE']);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'],/^hoos/);
 assert.match(data['blockly-MATH_ROUND_OPERATOR_ROUNDUP'],/^kor/);
 assert.match(data['blockly-MATH_SINGLE_TOOLTIP_NEG'],/calaamaddeeda la rogay/);
 assert.equal(data['blockly-MATH_CHANGE_TITLE_ITEM'],data['blockly-VARIABLES_DEFAULT_NAME']);
 for(const s of ['MAX','MIN']) assert.equal(data['blockly-MATH_ONLIST_OPERATOR_'+s+'_ARIA'],data['blockly-INPUT_LABEL_NUMBER_'+s]);
});
