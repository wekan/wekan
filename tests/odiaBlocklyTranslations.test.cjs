'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/or_IN.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP"];
test('Odia Blockly translations preserve key order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0b00-\u0b7f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Odia Blockly colours preserve bounds and distinct control actions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'],/0.*100/);
 assert.equal(new Set(['BLUE','GREEN','RED'].map(c=>locale['blockly-COLOUR_RGB_'+c])).size,3);
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
});

test('Odia loop tooltips preserve condition polarity and separate else-if branches',()=>{
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'].includes('\u0b2e\u0b3f\u0b25\u0b4d\u0b5f\u0b3e'));
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'].includes('\u0b38\u0b24\u0b4d\u0b5f'));
 assert.notEqual(locale['blockly-CONTROLS_IF_MSG_ELSE'],locale['blockly-CONTROLS_IF_MSG_ELSEIF']);
 assert.ok(locale['blockly-CONTROLS_IF_TOOLTIP_4'].includes('\u0b15\u0b4c\u0b23\u0b38\u0b3f \u0b2e\u0b42\u0b32\u0b4d\u0b5f \u0b38\u0b24\u0b4d\u0b5f \u0b28\u0b39\u0b47\u0b32\u0b47'));
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'].includes('\u0b15\u0b47\u0b2c\u0b33'));
});

test('Odia editing actions and bitmap labels preserve roles and opposing actions',()=>{
 for(const pair of [['ENABLE_BLOCK','DISABLE_BLOCK'],['EXPAND_BLOCK','COLLAPSE_BLOCK'],['COPY_SHORTCUT','CUT_SHORTCUT']]) assert.notEqual(locale['blockly-'+pair[0]],locale['blockly-'+pair[1]]);
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('\u0b27\u0b3e\u0b21\u0b3c\u0b3f %2'));
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('\u0b38\u0b4d\u0b24\u0b2e\u0b4d\u0b2d %3'));
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes("\u0b1a\u0b33\u0b30\u0b3e\u0b36\u0b3f '%2'"));
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes('%1\u0b1f\u0b3f \u0b2c\u0b4d\u0b5f\u0b2c\u0b39\u0b3e\u0b30'));
});

test('Odia icon actions and list inputs preserve open-close and position distinctions',()=>{
 for(const kind of ['COMMENT','WARNING']){
  assert.ok(locale['blockly-ICON_LABEL_'+kind+'_CLOSED'].includes('\u0b16\u0b4b\u0b32\u0b28\u0b4d\u0b24\u0b41'));
  assert.ok(locale['blockly-ICON_LABEL_'+kind+'_OPEN'].includes('\u0b2c\u0b28\u0b4d\u0b26 \u0b15\u0b30\u0b28\u0b4d\u0b24\u0b41'));
 }
 for(const pair of [['CONDITION_A','CONDITION_B'],['LISTS_START_POSITION','LISTS_END_POSITION'],['LISTS_LIST_FROM_TEXT','LISTS_TEXT_FROM_LIST'],['LISTS_REPEAT_ITEM','LISTS_REPEAT_NUM']]) assert.notEqual(locale['blockly-INPUT_LABEL_'+pair[0]],locale['blockly-INPUT_LABEL_'+pair[1]]);
 assert.ok(locale['blockly-HELP_PROMPT'].includes('%1'));
});

test('Odia numerical and text inputs retain coordinate and operand distinctions',()=>{
 for(const axis of ['X','Y']) assert.ok(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_'+axis].startsWith(axis.toLowerCase()+' '));
 for(const pair of [['MATH_DIVIDEND','MATH_DIVISOR'],['NUMBER_MAX','NUMBER_MIN'],['NUMBER_A','NUMBER_B'],['TEXT_START_POSITION','TEXT_END_POSITION'],['TEXT_TO_FIND','TEXT_TO_REPLACE']]) assert.notEqual(locale['blockly-INPUT_LABEL_'+pair[0]],locale['blockly-INPUT_LABEL_'+pair[1]]);
 assert.equal(locale['blockly-INPUT_LABEL_TEXT_START_POSITION'],locale['blockly-INPUT_LABEL_LISTS_START_POSITION']);
 assert.equal(locale['blockly-INPUT_LABEL_LOOP_TIMES'],locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM']);
});

test('Odia list navigation preserves index markers and distinct selection actions',()=>{
 assert.ok(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'].includes('0'));
 assert.ok(locale['blockly-LISTS_GET_INDEX_FROM_END'].includes('#'));
 for(const pair of [['LISTS_GET_INDEX_GET','LISTS_GET_INDEX_GET_REMOVE'],['LISTS_GET_INDEX_FIRST','LISTS_GET_INDEX_LAST'],['KEYBOARD_NAV_COPIED_HINT','KEYBOARD_NAV_CUT_HINT']]) assert.notEqual(locale['blockly-'+pair[0]],locale['blockly-'+pair[1]]);
 assert.equal(locale['blockly-INPUT_LABEL_VARIABLES_SET'],locale['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET']);
 const hint=locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'];
 assert.ok(hint.indexOf('%1')<hint.indexOf('%2'));
});

test('Odia list tooltips distinguish return and removal effects',()=>{
 for(const position of ['FIRST','FROM','LAST','RANDOM']){
  const prefix='blockly-LISTS_GET_INDEX_TOOLTIP_';
  assert.ok(locale[prefix+'GET_'+position].includes('\u0b2b\u0b47\u0b30\u0b3e\u0b0f'));
  assert.ok(locale[prefix+'GET_REMOVE_'+position].includes('\u0b15\u0b3e\u0b22\u0b3c\u0b3f \u0b2b\u0b47\u0b30\u0b3e\u0b0f'));
  assert.ok(locale[prefix+'REMOVE_'+position].includes('\u0b15\u0b3e\u0b22\u0b3c\u0b47'));
  assert.ok(!locale[prefix+'REMOVE_'+position].includes('\u0b2b\u0b47\u0b30\u0b3e\u0b0f'));
 }
 for(const key of ['END_FROM_END','START_FROM_END','START_FROM_START']) assert.ok(locale['blockly-LISTS_GET_SUBLIST_'+key].includes('#'));
 assert.ok(locale['blockly-LISTS_GET_SUBLIST_TOOLTIP'].includes('\u0b28\u0b15\u0b32'));
});

test('Odia list search preserves missing results and copy semantics',()=>{
 assert.ok(locale['blockly-LISTS_INDEX_OF_TOOLTIP'].includes('\u0b28\u0b2e\u0b3f\u0b33\u0b3f\u0b32\u0b47 %1'));
 assert.ok(locale['blockly-LISTS_REVERSE_TOOLTIP'].includes('\u0b28\u0b15\u0b32'));
 assert.ok(locale['blockly-LISTS_ISEMPTY_TOOLTIP'].includes('\u0b38\u0b24\u0b4d\u0b5f'));
 for(const position of ['FIRST','FROM','LAST']) assert.notEqual(locale['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_'+position],locale['blockly-LISTS_SET_INDEX_TOOLTIP_SET_'+position]);
 assert.notEqual(locale['blockly-LISTS_INDEX_OF_FIRST'],locale['blockly-LISTS_INDEX_OF_LAST']);
 assert.ok(locale['blockly-LISTS_REPEAT_TITLE'].includes('\u0b09\u0b2a\u0b3e\u0b26\u0b3e\u0b28 %1'));
 assert.ok(locale['blockly-LISTS_REPEAT_TITLE'].includes('%2 \u0b25\u0b30'));
});

test('Odia sorting and logic preserve direction, copying and inclusive comparisons',()=>{
 assert.ok(locale['blockly-LISTS_SORT_TOOLTIP'].includes('\u0b28\u0b15\u0b32'));
 assert.ok(locale['blockly-LISTS_SORT_TYPE_IGNORECASE'].includes('\u0b05\u0b23\u0b26\u0b47\u0b16\u0b3e'));
 for(const pair of [['LISTS_SORT_ORDER_ASCENDING','LISTS_SORT_ORDER_DESCENDING'],['LISTS_SPLIT_LIST_FROM_TEXT','LISTS_SPLIT_TEXT_FROM_LIST'],['LOGIC_BOOLEAN_TRUE','LOGIC_BOOLEAN_FALSE'],['LOGIC_COMPARE_EQ_ARIA','LOGIC_COMPARE_NEQ_ARIA']]) assert.notEqual(locale['blockly-'+pair[0]],locale['blockly-'+pair[1]]);
 for(const key of ['GTE','LTE']) assert.ok(locale['blockly-LOGIC_COMPARE_'+key+'_ARIA'].includes('\u0b15\u0b3f\u0b2e\u0b4d\u0b2c\u0b3e \u0b38\u0b2e\u0b3e\u0b28'));
 for(const key of ['GT','LT']) assert.ok(!locale['blockly-LOGIC_COMPARE_'+key+'_ARIA'].includes('\u0b38\u0b2e\u0b3e\u0b28'));
});

test('Odia Boolean and arithmetic messages preserve branches and numeric domains',()=>{
 const help=locale['blockly-LOGIC_TERNARY_TOOLTIP'];
 for(const suffix of ['CONDITION','IF_TRUE','IF_FALSE']) assert.ok(help.includes(locale['blockly-LOGIC_TERNARY_'+suffix]));
 assert.ok(locale['blockly-LOGIC_NULL_TOOLTIP'].includes('null'));
 for(const literal of ['atan2','X:%1','Y:%2']) assert.ok(locale['blockly-MATH_ATAN2_TITLE'].includes(literal));
 for(const literal of ['(X, Y)','-180','180']) assert.ok(locale['blockly-MATH_ATAN2_TOOLTIP'].includes(literal));
 assert.ok(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'].includes('\u0b09\u0b2d\u0b5f'));
 assert.ok(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'].includes('\u0b05\u0b24\u0b3f \u0b15\u0b2e\u0b30\u0b47 \u0b17\u0b4b\u0b1f\u0b3f\u0b0f'));
 assert.equal(new Set(['ADD','DIVIDE','MINUS','MULTIPLY','POWER'].map(op=>locale['blockly-MATH_ARITHMETIC_TOOLTIP_'+op])).size,5);
});

test('Odia constants and properties preserve examples, bounds and number distinctions',()=>{
 for(const literal of ['\u03c0 (3.141\u2026)','e (2.718\u2026)','\u03c6 (1.618\u2026)','sqrt(2) (1.414\u2026)','sqrt(\u00bd) (0.707\u2026)','\u221e']) assert.ok(locale['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
 assert.ok(locale['blockly-MATH_MODULO_TITLE'].includes('%1 \u00f7 %2'));
 assert.ok(locale['blockly-MATH_CONSTRAIN_TOOLTIP'].includes('\u0b38\u0b40\u0b2e\u0b3e\u0b17\u0b41\u0b21\u0b3c\u0b3f\u0b15 \u0b38\u0b2e\u0b47\u0b24'));
 for(const pair of [['EVEN','ODD'],['POSITIVE','NEGATIVE'],['PRIME','WHOLE']]) assert.notEqual(locale['blockly-MATH_IS_'+pair[0]],locale['blockly-MATH_IS_'+pair[1]]);
 assert.ok(locale['blockly-MATH_IS_TOOLTIP'].includes(locale['blockly-LOGIC_BOOLEAN_TRUE']));
 assert.ok(locale['blockly-MATH_IS_TOOLTIP'].includes(locale['blockly-LOGIC_BOOLEAN_FALSE']));
});
