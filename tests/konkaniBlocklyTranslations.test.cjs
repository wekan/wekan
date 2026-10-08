'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/kok.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DIALOG_OK", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_OR", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_E_ARIA", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_PI_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP"];
test('Konkani Blockly translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Konkani colour controls retain bounds and variable roles',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'],/0.*100/);
 assert.equal(new Set(['RED','GREEN','BLUE'].map(k=>locale['blockly-COLOUR_RGB_'+k])).size,3);
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u091a\u0932 '%1'"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("\u092b\u0932\u0928 '%2'"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes('\u0936\u0915\u0928\u093e'));
});

test('Konkani loops retain conditions and indexed roles',()=>{
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'].includes('\u092e\u094b\u0932 \u0905\u0938\u0924\u094d\u092f'));
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'].includes('\u092e\u094b\u0932 \u0938\u0924\u094d\u092f'));
 assert.ok(locale['blockly-CONTROLS_IF_TOOLTIP_4'].includes('\u0916\u0902\u092f\u091a\u0947\u0902\u091a \u092e\u094b\u0932 \u0938\u0924\u094d\u092f \u0928\u093e\u0938\u0932\u094d\u092f\u093e\u0930'));
 assert.ok(locale['blockly-CONTROLS_FOREACH_TITLE'].includes('\u0935\u0933\u0947\u0930\u0940 %2'));
 assert.ok(locale['blockly-CONTROLS_FOREACH_TITLE'].includes('\u0918\u091f\u0915 %1'));
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'].includes('\u092b\u0915\u0924 \u0932\u0942\u092a\u093e\u091a\u094d\u092f\u093e \u092d\u093f\u0924\u0930'));
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
});

test('Konkani editing retains deletion roles and bitmap coordinates',()=>{
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes("\u091a\u0932 '%2'"));
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes('%1 \u0935\u093e\u092a\u0930'));
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('\u0913\u0933 %2'));
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('\u0938\u094d\u0924\u0902\u092d %3'));
 assert.ok(locale['blockly-FIELD_BITMAP_ARIA_VALUE'].includes('%3 \u092a\u093f\u0915\u094d\u0938\u0947\u0932'));
 for(const pair of [['ENABLE_BLOCK','DISABLE_BLOCK'],['COPY_SHORTCUT','CUT_SHORTCUT'],['FIELD_BITMAP_PIXEL_ON','FIELD_BITMAP_PIXEL_OFF'],['EXPAND_BLOCK','COLLAPSE_BLOCK']]) assert.notEqual(locale['blockly-'+pair[0]],locale['blockly-'+pair[1]]);
});

test('Konkani input labels distinguish actions and list positions',()=>{
 for(const type of ['COMMENT','WARNING']) assert.notEqual(locale['blockly-ICON_LABEL_'+type+'_CLOSED'],locale['blockly-ICON_LABEL_'+type+'_OPEN']);
 for(const pair of [['CONDITION_A','CONDITION_B'],['LISTS_REPEAT_ITEM','LISTS_REPEAT_NUM'],['LISTS_START_POSITION','LISTS_END_POSITION']]) assert.notEqual(locale['blockly-INPUT_LABEL_'+pair[0]],locale['blockly-INPUT_LABEL_'+pair[1]]);
 assert.equal(locale['blockly-FIELD_LABEL_EMPTY'],locale['blockly-INPUT_LABEL_EMPTY']);
 assert.ok(locale['blockly-FIELD_LABEL_VARIABLE'].includes("'%1'"));
});

test('Konkani mathematical inputs retain axes and distinct operand roles',()=>{
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'],/^x /);
 assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'],/^y /);
 for(const pair of [['MATH_DIVIDEND','MATH_DIVISOR'],['NUMBER_MIN','NUMBER_MAX'],['NUMBER_A','NUMBER_B'],['LOOP_FROM','LOOP_TO'],['TEXT_START_POSITION','TEXT_END_POSITION']]) assert.notEqual(locale['blockly-INPUT_LABEL_'+pair[0]],locale['blockly-INPUT_LABEL_'+pair[1]]);
 assert.equal(locale['blockly-INPUT_LABEL_TEXT_JOIN_ITEM'],locale['blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM']);
 assert.equal(locale['blockly-INPUT_LABEL_LOOP_TIMES'],locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM']);
});

test('Konkani navigation retains key roles and empty-list length',()=>{
 assert.ok(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'].includes('%1 \u0926\u093e\u092e\u0942\u0928 \u0926\u0935\u0930\u093e\u0924'));
 assert.ok(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'].includes('%2 \u0926\u093e\u092e\u093e\u0924'));
 assert.ok(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'].includes('0'));
 assert.ok(locale['blockly-LISTS_GET_INDEX_FROM_END'].includes('#'));
 assert.notEqual(locale['blockly-LISTS_GET_INDEX_GET'],locale['blockly-LISTS_GET_INDEX_GET_REMOVE']);
 assert.notEqual(locale['blockly-KEYBOARD_NAV_COPIED_HINT'],locale['blockly-KEYBOARD_NAV_CUT_HINT']);
 assert.equal(locale['blockly-INPUT_LABEL_VARIABLES_SET'],locale['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET']);
});

test('Konkani list removal distinguishes returned values and preserves indices',()=>{
 for(const pos of ['FIRST','FROM','LAST','RANDOM']){
  const removed=locale['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+pos];
  const returned=locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_'+pos];
  assert.ok(removed.includes('\u0915\u093e\u0921\u091f\u093e'));
  assert.ok(!removed.includes('\u092a\u0930\u0924 \u0926\u093f\u0924\u093e'));
  assert.ok(returned.includes('\u0915\u093e\u0921\u091f\u093e \u0906\u0928\u0940 \u0924\u094b \u092a\u0930\u0924 \u0926\u093f\u0924\u093e'));
 }
 for(const key of ['END_FROM_END','END_FROM_START','START_FROM_END','START_FROM_START']) assert.ok(locale['blockly-LISTS_GET_SUBLIST_'+key].includes('#'));
 assert.ok(locale['blockly-LISTS_GET_SUBLIST_TOOLTIP'].includes('\u092a\u094d\u0930\u0924'));
 assert.notEqual(locale['blockly-LISTS_INDEX_FROM_START_TOOLTIP'],locale['blockly-LISTS_INDEX_FROM_END_TOOLTIP']);
});

test('Konkani list search and sorting retain counts and copy semantics',()=>{
 assert.ok(locale['blockly-LISTS_INDEX_OF_TOOLTIP'].includes('\u0928\u093e \u091c\u093e\u0932\u094d\u092f\u093e\u0930 %1'));
 assert.ok(locale['blockly-LISTS_REPEAT_TITLE'].includes('\u0918\u091f\u0915 %1'));
 assert.ok(locale['blockly-LISTS_REPEAT_TITLE'].includes('%2 \u092b\u093e\u0935\u091f\u0940\u0902'));
 for(const key of ['LISTS_REVERSE_TOOLTIP','LISTS_SORT_TOOLTIP']) assert.ok(locale['blockly-'+key].includes('\u092a\u094d\u0930\u0924'));
 assert.ok(locale['blockly-LISTS_SORT_TYPE_IGNORECASE'].includes('\u092d\u0947\u0926 \u0938\u094b\u0921\u0942\u0928'));
 assert.notEqual(locale['blockly-LISTS_SORT_ORDER_ASCENDING'],locale['blockly-LISTS_SORT_ORDER_DESCENDING']);
 for(const pos of ['FIRST','FROM','LAST','RANDOM']) assert.notEqual(locale['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_'+pos],locale['blockly-LISTS_SET_INDEX_TOOLTIP_SET_'+pos]);
});

test('Konkani comparisons retain equality boundaries and Boolean negation',()=>{
 assert.equal(new Set(['EQ','NEQ','GT','GTE','LT','LTE'].map(k=>locale['blockly-LOGIC_COMPARE_'+k+'_ARIA'])).size,6);
 for(const k of ['GTE','LTE']) assert.ok(locale['blockly-LOGIC_COMPARE_TOOLTIP_'+k].includes('\u0935\u093e \u092c\u0930\u094b\u092c\u0930'));
 assert.ok(locale['blockly-LOGIC_NEGATE_TOOLTIP'].includes('\u0905\u0938\u0924\u094d\u092f \u0906\u0938\u0932\u094d\u092f\u093e\u0930 \u0938\u0924\u094d\u092f'));
 assert.ok(locale['blockly-LOGIC_NEGATE_TOOLTIP'].includes('\u0938\u0924\u094d\u092f \u0906\u0938\u0932\u094d\u092f\u093e\u0930 \u0905\u0938\u0924\u094d\u092f'));
 assert.notEqual(locale['blockly-LISTS_SPLIT_LIST_FROM_TEXT'],locale['blockly-LISTS_SPLIT_TEXT_FROM_LIST']);
 for(const k of ['JOIN','SPLIT']) assert.ok(locale['blockly-LISTS_SPLIT_TOOLTIP_'+k].includes('\u0935\u093f\u092d\u093e\u091c\u0915'));
});

test('Konkani logic and arithmetic preserve conditions and coordinate roles',()=>{
 assert.ok(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'].includes('\u0926\u094b\u0928\u0942\u092f'));
 assert.ok(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'].includes('\u0909\u0923\u094d\u092f\u093e\u0902\u0924 \u0909\u0923\u094b \u090f\u0915'));
 assert.ok(locale['blockly-LOGIC_NULL_TOOLTIP'].includes('null'));
 for(const k of ['CONDITION','IF_TRUE','IF_FALSE']) assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale['blockly-LOGIC_TERNARY_'+k]));
 for(const term of ['X:%1','Y:%2','atan2']) assert.ok(locale['blockly-MATH_ATAN2_TITLE'].includes(term));
 assert.ok(locale['blockly-MATH_ATAN2_TOOLTIP'].includes('-180 \u0924\u0947 180'));
 assert.equal(new Set(['ADD','DIVIDE','MINUS','MULTIPLY','POWER'].map(k=>locale['blockly-MATH_ARITHMETIC_TOOLTIP_'+k])).size,5);
});

test('Konkani constants and number properties preserve numeric meaning',()=>{
 for(const term of ['\u03c0','3.141','e','2.718','\u03c6','1.618','sqrt(2)','1.414','sqrt(\u00bd)','0.707','\u221e']) assert.ok(locale['blockly-MATH_CONSTANT_TOOLTIP'].includes(term),term);
 assert.ok(locale['blockly-MATH_CONSTRAIN_TOOLTIP'].includes('\u092e\u0930\u094d\u092f\u093e\u0926\u093e\u0902 \u0938\u092f\u0924'));
 assert.ok(locale['blockly-MATH_CONSTRAIN_TITLE'].includes('\u0915\u093f\u092e\u093e\u0928 %2'));
 assert.ok(locale['blockly-MATH_CONSTRAIN_TITLE'].includes('\u0915\u092e\u093e\u0932 %3'));
 assert.ok(locale['blockly-MATH_MODULO_TITLE'].includes('%1 \u00f7 %2'));
 assert.equal(new Set(['EVEN','ODD','NEGATIVE','POSITIVE','PRIME','WHOLE'].map(k=>locale['blockly-MATH_IS_'+k])).size,6);
});

test('Konkani statistics preserve aggregates and random-number bounds',()=>{
 assert.equal(new Set(['AVERAGE','MEDIAN','MODE','STD_DEV','SUM'].map(k=>locale['blockly-MATH_ONLIST_OPERATOR_'+k])).size,5);
 assert.ok(locale['blockly-MATH_ONLIST_TOOLTIP_MODE'].includes('\u0918\u091f\u0915\u093e\u0902\u091a\u0940 \u0935\u0933\u0947\u0930\u0940'));
 assert.ok(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'].includes('0.0 (\u0927\u0930\u0942\u0928)'));
 assert.ok(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'].includes('1.0 (\u0938\u094b\u0921\u0942\u0928)'));
 assert.ok(locale['blockly-MATH_RANDOM_INT_TOOLTIP'].includes('\u0926\u094b\u0928\u0942\u092f \u092e\u0930\u094d\u092f\u093e\u0926\u093e \u0927\u0930\u0942\u0928'));
 assert.equal(new Set(['ROUND','ROUNDDOWN','ROUNDUP'].map(k=>locale['blockly-MATH_ROUND_OPERATOR_'+k])).size,3);
 for(const k of ['MIN','MAX']) assert.equal(locale['blockly-MATH_ONLIST_OPERATOR_'+k+'_ARIA'],locale['blockly-INPUT_LABEL_NUMBER_'+k]);
});

test('Konkani mathematical functions retain bases and angle units',()=>{
 for(const suffix of ['OP_EXP_ARIA','TOOLTIP_EXP']) assert.ok(locale['blockly-MATH_SINGLE_'+suffix].includes('e'));
 for(const suffix of ['OP_LOG10_ARIA','OP_POW10_ARIA','TOOLTIP_LOG10','TOOLTIP_POW10']) assert.ok(locale['blockly-MATH_SINGLE_'+suffix].includes('10'));
 for(const fn of ['COS','SIN','TAN']){
  assert.ok(locale['blockly-MATH_TRIG_TOOLTIP_'+fn].includes('\u0905\u0902\u0936\u093e\u0902\u0924'));
  assert.ok(locale['blockly-MATH_TRIG_TOOLTIP_'+fn].includes('\u0930\u0947\u0921\u093f\u092f\u0928\u093e\u0902\u0924 \u0928\u094d\u0939\u092f'));
 }
 assert.ok(locale['blockly-MATH_SINGLE_TOOLTIP_NEG'].includes('\u091a\u093f\u0928\u094d\u0928 \u0909\u0932\u091f\u0942\u0928'));
 assert.notEqual(locale['blockly-MATH_SINGLE_TOOLTIP_ABS'],locale['blockly-MATH_SINGLE_TOOLTIP_NEG']);
});
test('Konkani function messages preserve return behavior and disabled-definition warnings',()=>{
 assert.ok(locale['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'].includes('\u0928\u093e\u0936\u093f\u0932\u094d\u0932\u0947\u0902'));
 assert.ok(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'].includes('\u0906\u0936\u093f\u0932\u094d\u0932\u0947\u0902'));
 assert.ok(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'].includes('\u091a\u0932\u094b\u0935\u0902\u0915 \u0936\u0915\u0928\u093e'));
 assert.ok(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'].includes('\u0905\u0915\u094d\u0937\u092e'));
 assert.ok(locale['blockly-PROCEDURES_IFRETURN_WARNING'].includes('\u092b\u0915\u0924'));
 assert.ok(locale['blockly-PROCEDURES_IFRETURN_TOOLTIP'].includes('\u0938\u0924\u094d\u092f \u0906\u0938\u0932\u094d\u092f\u093e\u0930 \u0926\u0941\u0938\u0930\u0947\u0902 \u092e\u094b\u0932'));
 assert.ok(locale['blockly-NO_PARENT_ANNOUNCEMENT'].endsWith('\u0928\u093e'));
 assert.equal(new Set(['COLOUR','NUMBER','STRING'].map(k=>locale['blockly-NEW_'+k+'_VARIABLE'])).size,3);
 assert.equal(locale['blockly-PROCEDURES_BEFORE_PARAMS'],locale['blockly-PROCEDURES_CALL_BEFORE_PARAMS']);
});
