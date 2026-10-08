'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ary.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["card-field-visibility", "card-field-visibility-desc", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST"];
test('Moroccan Arabic Blockly translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0600-\u06ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Moroccan Arabic colours and controls retain bounds and deletion restrictions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.ok(locale['blockly-COLOUR_RGB_TOOLTIP'].includes('\u0628\u064a\u0646 0 \u0648100'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes('\u0645\u0627 \u064a\u0645\u0643\u0646\u0634'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u0627\u0644\u0645\u062a\u063a\u064a\u0651\u0631 '%1'"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u0627\u0644\u062f\u0627\u0644\u0629 '%2'"));
 assert.ok(locale['blockly-COLLAPSED_WARNINGS_WARNING'].includes('\u0641\u064a\u0647\u0627 \u062a\u062d\u0630\u064a\u0631\u0627\u062a'));
 assert.equal(new Set(['RED','GREEN','BLUE'].map(k=>locale['blockly-COLOUR_RGB_'+k])).size,3);
});

test('Moroccan Arabic loops distinguish stopping, continuing and truth conditions',()=>{
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'],/خرج/);
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'],/الدورة الجاية/);
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'],/غير داخل حلقة/);
 assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/خاطئة/);
 assert.doesNotMatch(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/صحيحة/);
 assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/صحيحة/);
 assert.doesNotMatch(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/خاطئة/);
 assert.match(locale['blockly-CONTROLS_IF_TOOLTIP_4'],/ما كانت حتى قيمة صحيحة/);
 assert.match(locale['blockly-CONTROLS_FOR_TITLE'],/%1.*%2.*%3.*%4/);
});

test('Moroccan Arabic workspace actions and bitmap announcements retain their meaning',()=>{
 for(const type of ['COMMENT','WARNING']){
  assert.match(locale['blockly-ICON_LABEL_'+type+'_CLOSED'],/حلّ/);
  assert.match(locale['blockly-ICON_LABEL_'+type+'_OPEN'],/سدّ/);
  assert.doesNotMatch(locale['blockly-ICON_LABEL_'+type+'_OPEN'],/حلّ/);
 }
 assert.match(locale['blockly-DISABLE_BLOCK'],/تعطيل/);
 assert.match(locale['blockly-ENABLE_BLOCK'],/تفعيل/);
 assert.equal(locale['blockly-FIELD_BITMAP_PIXEL_ON'],'شاعل');
 assert.equal(locale['blockly-FIELD_BITMAP_PIXEL_OFF'],'طافي');
 assert.match(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'],/%1.*السطر %2.*العمود %3/);
 assert.match(locale['blockly-FIELD_BITMAP_ARIA_VALUE'],/%1.*%2.*%3 بيكسلات شاعلين/);
 assert.match(locale['blockly-DELETE_VARIABLE_CONFIRMATION'],/%1 استعمالات.*المتغيّر '%2'/);
 assert.match(locale['blockly-INPUT_LABEL_LISTS_START_POSITION'],/البداية/);
 assert.match(locale['blockly-INPUT_LABEL_LISTS_END_POSITION'],/النهاية/);
 assert.notEqual(locale['blockly-EXTERNAL_INPUTS'],locale['blockly-INLINE_INPUTS']);
});

test('Moroccan Arabic numeric inputs and keyboard hints preserve operand roles',()=>{
 assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'],'المقسوم');
 assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVISOR'],'المقسوم عليه');
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_MAX'],/الأقصى/);
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_MIN'],/الأدنى/);
 assert.doesNotMatch(locale['blockly-INPUT_LABEL_NUMBER_MIN'],/الأقصى/);
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'],/ x$/);
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'],/ y$/);
 assert.match(locale['blockly-INPUT_LABEL_LOOP_FROM'],/البداية/);
 assert.match(locale['blockly-INPUT_LABEL_LOOP_TO'],/النهاية/);
 assert.match(locale['blockly-INPUT_LABEL_TEXT_APPEND'],/فالآخر/);
 assert.match(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'],/ضاغط على %1.*%2 باش تقبل الموضع/);
 assert.match(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'],/طولها 0.*ما فيها حتى سجل/);
 assert.match(locale['blockly-LISTS_GET_INDEX_FROM_END'],/^# من الآخر$/);
});

test('Moroccan Arabic list operations preserve retrieval and removal semantics',()=>{
 for(const position of ['FIRST','FROM','LAST','RANDOM']){
  const prefix='blockly-LISTS_GET_INDEX_TOOLTIP_';
  assert.match(locale[prefix+'GET_'+position],/كيرجّع/);
  assert.doesNotMatch(locale[prefix+'GET_'+position],/كيحيّد/);
  assert.match(locale[prefix+'REMOVE_'+position],/كيحيّد/);
  assert.doesNotMatch(locale[prefix+'REMOVE_'+position],/كيرجّع/);
  assert.match(locale[prefix+'GET_REMOVE_'+position],/كيحيّد وكيرجّع/);
 }
 assert.match(locale['blockly-LISTS_GET_SUBLIST_TOOLTIP'],/نسخة/);
 assert.match(locale['blockly-LISTS_REVERSE_TOOLTIP'],/نسخة/);
 assert.match(locale['blockly-LISTS_INDEX_OF_TOOLTIP'],/%1 إلا ما تلقاش العنصر/);
 assert.match(locale['blockly-LISTS_INDEX_FROM_END_TOOLTIP'],/الأخير/);
 assert.match(locale['blockly-LISTS_INDEX_FROM_START_TOOLTIP'],/الأول/);
 assert.match(locale['blockly-LISTS_REPEAT_TITLE'],/العنصر %1.*%2 مرات/);
 assert.match(locale['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST'],/فبداية/);
 assert.match(locale['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST'],/فنهاية/);
});
