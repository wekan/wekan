'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "activity-changedTitle", "activity-changedDescription", "act-deleteCard", "act-removeBoard", "act-removeList", "act-removeSwimlane", "board-members-same-team-only", "comment-in-reply-to", "comment-reply", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-TODAY", "blockly-UNDO", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-LISTS_CREATE_WITH_ITEM_TITLE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-MATH_CHANGE_TITLE_ITEM", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "blockly-TEXT_APPEND_VARIABLE", "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload"];

test('Tatar block and activity translations preserve source keys and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.ok(locale[key].trim(),key);
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0400-\u04ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Tatar activity vocabulary and colour limits retain their meanings',()=>{
 assert.match(locale['activity-changedTitle'],/\u04af\u0437\u0433\u04d9\u0440\u0442\u0442\u0435/);
 assert.match(locale['comment-reply'],/\u0496\u0430\u0432\u0430\u043f/);
 assert.doesNotMatch(locale['activity-changedTitle'],/\u0434\u0435\u0433\u0438\u0448/);
 assert.match(locale['blockly-COLOUR_BLEND_TOOLTIP'],/0\.0 - 1\.0/);
 assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'],/0.*100/);
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
});

test('Tatar loop conditions and deletion prompts retain polarity and references',()=>{
 assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'],/\u044f\u043b\u0433\u0430\u043d/);
 assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'],/\u0434\u04e9\u0440\u0435\u0441/);
 assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'],/\u0433\u0435\u043d\u04d9/);
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes("'%2'"));
 assert.deepEqual(translationTokens(locale['blockly-CONTROLS_FOR_TITLE']),['%1','%2','%3','%4']);
 assert.notEqual(locale['blockly-COPY_SHORTCUT'],locale['blockly-CUT_SHORTCUT']);
});

test('Tatar editing labels distinguish opposite actions and bitmap coordinates',()=>{
 for(const pair of [['ENABLE_BLOCK','DISABLE_BLOCK'],['ICON_LABEL_COMMENT_CLOSED','ICON_LABEL_COMMENT_OPEN'],['ICON_LABEL_WARNING_CLOSED','ICON_LABEL_WARNING_OPEN'],['INPUT_LABEL_CONDITION_A','INPUT_LABEL_CONDITION_B']]) assert.notEqual(locale['blockly-'+pair[0]],locale['blockly-'+pair[1]]);
 assert.match(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'],/%2.*\u044e\u043b.*%3.*\u0431\u0430\u0433\u0430\u043d\u0430/);
 assert.ok(locale['blockly-FIELD_LABEL_VARIABLE'].includes("'%1'"));
 assert.deepEqual(translationTokens(locale['blockly-FIELD_BITMAP_ARIA_VALUE']),['%1','%2','%3']);
});

test('Tatar input labels preserve operand, coordinate and position distinctions',()=>{
 for(const pair of [['INPUT_LABEL_MATH_DIVIDEND','INPUT_LABEL_MATH_DIVISOR'],['INPUT_LABEL_NUMBER_MAX','INPUT_LABEL_NUMBER_MIN'],['INPUT_LABEL_TEXT_START_POSITION','INPUT_LABEL_TEXT_END_POSITION'],['INPUT_LABEL_VALUE_A','INPUT_LABEL_VALUE_B']]) assert.notEqual(locale['blockly-'+pair[0]],locale['blockly-'+pair[1]]);
 for(const axis of ['X','Y']) assert.ok(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_'+axis].startsWith(axis.toLowerCase()+' '));
 assert.equal(locale['blockly-INPUT_LABEL_LISTS_START_POSITION'],locale['blockly-INPUT_LABEL_TEXT_START_POSITION']);
 assert.equal(locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'],locale['blockly-INPUT_LABEL_LOOP_TIMES']);
});

test('Tatar navigation and lists retain move keys and removal distinctions',()=>{
 assert.deepEqual(translationTokens(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT']),['%1','%2']);
 assert.notEqual(locale['blockly-KEYBOARD_NAV_COPIED_HINT'],locale['blockly-KEYBOARD_NAV_CUT_HINT']);
 for(const position of ['FIRST','FROM','LAST']) {
  assert.doesNotMatch(locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_'+position],/\u0431\u0435\u0442\u0435\u0440\u04d9/);
  assert.match(locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_'+position],/\u0431\u0435\u0442\u0435\u0440\u04d9/);
 }
 assert.match(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'],/0/);
});

test('Tatar list editing preserves removal and copy semantics',()=>{
 for(const position of ['FIRST','FROM','LAST','RANDOM']) {
  const remove=locale['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+position];
  assert.match(remove,/\u0431\u0435\u0442\u0435\u0440\u04d9/);
  assert.doesNotMatch(remove,/\u043a\u0430\u0439\u0442\u0430\u0440\u0430/);
 }
 for(const key of ['LISTS_GET_SUBLIST_TOOLTIP','LISTS_REVERSE_TOOLTIP']) assert.match(locale['blockly-'+key],/\u043a\u04af\u0447\u0435\u0440\u043c/);
 assert.notEqual(locale['blockly-LISTS_INDEX_OF_FIRST'],locale['blockly-LISTS_INDEX_OF_LAST']);
 assert.notEqual(locale['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST'],locale['blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST']);
});

test('Tatar sorting and comparisons preserve direction and inclusive bounds',()=>{
 for(const pair of [['LISTS_SORT_ORDER_ASCENDING','LISTS_SORT_ORDER_DESCENDING'],['LISTS_SPLIT_LIST_FROM_TEXT','LISTS_SPLIT_TEXT_FROM_LIST'],['LOGIC_BOOLEAN_TRUE','LOGIC_BOOLEAN_FALSE']]) assert.notEqual(locale['blockly-'+pair[0]],locale['blockly-'+pair[1]]);
 for(const [strict,inclusive] of [['GT','GTE'],['LT','LTE']]){
  assert.doesNotMatch(locale['blockly-LOGIC_COMPARE_TOOLTIP_'+strict],/\u044f\u043a\u0438/);
  assert.match(locale['blockly-LOGIC_COMPARE_TOOLTIP_'+inclusive],/\u044f\u043a\u0438.*\u0442\u0438\u0433\u0435\u0437/);
 }
 assert.match(locale['blockly-LISTS_SORT_TOOLTIP'],/\u043a\u04af\u0447\u0435\u0440\u043c/);
});

test('Tatar arithmetic preserves constants, coordinates and conditional labels',()=>{
 for(const literal of ['3.141','2.718','1.618','sqrt(2)','sqrt(','0.707']) assert.ok(locale['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
 for(const literal of ['(X, Y)','-180','180']) assert.ok(locale['blockly-MATH_ATAN2_TOOLTIP'].includes(literal));
 for(const suffix of ['CONDITION','IF_TRUE','IF_FALSE']) assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale['blockly-LOGIC_TERNARY_'+suffix]));
 assert.notEqual(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'],locale['blockly-LOGIC_OPERATION_TOOLTIP_OR']);
 assert.ok(locale['blockly-LOGIC_NULL_TOOLTIP'].includes('null'));
});

test('Tatar statistics and number tests preserve distinct mathematical operations',()=>{
 const labels=['AVERAGE','MEDIAN','MODE','MAX','MIN'].map(op=>locale['blockly-MATH_ONLIST_OPERATOR_'+op]);
 assert.equal(new Set(labels).size,labels.length);
 assert.notEqual(locale['blockly-MATH_IS_EVEN'],locale['blockly-MATH_IS_ODD']);
 assert.notEqual(locale['blockly-MATH_IS_POSITIVE'],locale['blockly-MATH_IS_NEGATIVE']);
 assert.match(locale['blockly-MATH_MODULO_TOOLTIP'],/\u043a\u0430\u043b\u0434\u044b\u043a/);
 assert.ok(locale['blockly-MATH_MODULO_TITLE'].includes('÷'));
 assert.equal(locale['blockly-MATH_ONLIST_OPERATOR_MAX_ARIA'],locale['blockly-INPUT_LABEL_NUMBER_MAX']);
 assert.equal(locale['blockly-MATH_ONLIST_OPERATOR_MIN_ARIA'],locale['blockly-INPUT_LABEL_NUMBER_MIN']);
});

test('Tatar random and mathematical functions preserve bounds and bases',()=>{
 assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'],/0\.0.*1\.0/);
 assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'],/\u043a\u0435\u0440\u043c\u0438/);
 assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_EXP'],/^e /);
 assert.ok(locale['blockly-MATH_SINGLE_TOOLTIP_LOG10'].includes('10'));
 assert.notEqual(locale['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'],locale['blockly-MATH_ROUND_OPERATOR_ROUNDUP']);
 assert.notEqual(locale['blockly-MATH_SINGLE_TOOLTIP_ABS'],locale['blockly-MATH_SINGLE_TOOLTIP_NEG']);
});

test('Tatar trigonometry retains degree units and distinguishes inverse functions',()=>{
 for(const [direct,inverse] of [['COS','ACOS'],['SIN','ASIN'],['TAN','ATAN']]){
  assert.notEqual(locale['blockly-MATH_TRIG_'+direct+'_ARIA'],locale['blockly-MATH_TRIG_'+inverse+'_ARIA']);
  assert.equal(locale['blockly-MATH_TRIG_'+direct],english['blockly-MATH_TRIG_'+direct]);
  assert.match(locale['blockly-MATH_TRIG_TOOLTIP_'+direct],/\u0440\u0430\u0434\u0438\u0430\u043d\u043d\u0430\u0440\u0434\u0430 \u0442\u04af\u0433\u0435\u043b/);
 }
 const types=['COLOUR','NUMBER','STRING'].map(type=>locale['blockly-NEW_'+type+'_VARIABLE']);
 assert.equal(new Set(types).size,3);
 assert.notEqual(locale['blockly-OPEN_BACKPACK'],locale['blockly-CLOSE_BACKPACK']);
});

test('Tatar functions preserve return distinctions and invocation references',()=>{
 assert.match(locale['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'],/\u043a\u0430\u0439\u0442\u0430\u0440\u043c\u044b\u0439/);
 assert.doesNotMatch(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'],/\u043a\u0430\u0439\u0442\u0430\u0440\u043c\u044b\u0439/);
 for(const key of ['PROCEDURES_CALLNORETURN_TOOLTIP','PROCEDURES_CALLRETURN_TOOLTIP','PROCEDURES_CALL_DISABLED_DEF_WARNING']) assert.ok(locale['blockly-'+key].includes("'%1'"));
 assert.match(locale['blockly-PROCEDURES_IFRETURN_WARNING'],/\u0433\u0435\u043d\u04d9/);
 assert.equal(locale['blockly-PROCEDURES_BEFORE_PARAMS'],locale['blockly-PROCEDURES_CALL_BEFORE_PARAMS']);
});

test('Tatar shortcuts distinguish directions, targets and screen-reader states',()=>{
 for(const action of ['MOVE','SCROLL']) {
  const labels=['DOWN','LEFT','RIGHT','UP'].map(direction=>locale['blockly-SHORTCUTS_'+action+'_'+direction]);
  assert.equal(new Set(labels).size,4);
 }
 for(const target of ['HEADING','STACK']) assert.notEqual(locale['blockly-SHORTCUTS_NEXT_'+target],locale['blockly-SHORTCUTS_PREVIOUS_'+target]);
 assert.notEqual(locale['blockly-SHORTCUTS_START_MOVE'],locale['blockly-SHORTCUTS_FINISH_MOVE']);
 assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'],/\u0441\u04af\u043d\u0434\u0435\u0440\u04af/);
 assert.notEqual(locale['blockly-SCREENREADER_MODE_ENABLED'],locale['blockly-SCREENREADER_MODE_DISABLED']);
});

test('Tatar text operations preserve first/last positions and case distinctions',()=>{
 for(const prefix of ['TEXT_CHARAT_','TEXT_INDEXOF_OPERATOR_']) assert.notEqual(locale['blockly-'+prefix+'FIRST'],locale['blockly-'+prefix+'LAST']);
 const cases=['LOWERCASE','TITLECASE','UPPERCASE'].map(value=>locale['blockly-TEXT_CHANGECASE_OPERATOR_'+value]);
 assert.equal(new Set(cases).size,3);
 assert.match(locale['blockly-TEXT_COUNT_MESSAGE0'],/%2.*%1/);
 assert.ok(locale['blockly-TEXT_APPEND_TOOLTIP'].includes("'%1'"));
 assert.match(locale['blockly-TEXT_INDEXOF_TOOLTIP'],/\u0442\u0430\u0431\u044b\u043b\u043c\u0430\u0441\u0430.*%1/);
});


test('Tatar text replacement, trimming and variable operations preserve distinctions',()=>{
 assert.match(locale['blockly-TEXT_REPLACE_MESSAGE0'],/%3.*%1.*%2/);
 const sides=['BOTH','LEFT','RIGHT'].map(side=>locale['blockly-TEXT_TRIM_OPERATOR_'+side]);
 assert.equal(new Set(sides).size,3);
 assert.notEqual(locale['blockly-VARIABLES_GET_CREATE_SET'],locale['blockly-VARIABLES_SET_CREATE_GET']);
 assert.notEqual(locale['blockly-TEXT_PROMPT_TYPE_NUMBER'],locale['blockly-TEXT_PROMPT_TYPE_TEXT']);
 for(const key of ['VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE','VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER']) {
  assert.ok(locale['blockly-'+key].includes("'%1'"));
  assert.ok(locale['blockly-'+key].includes("'%2'"));
 }
});


test('Tatar workspace search preserves shortcuts, fragments and rule states',()=>{
 for(const shortcut of ['Enter','Shift+Enter','Escape']) assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(shortcut));
 for(const amount of ['MANY','ONE']) assert.ok(locale['blockly-WORKSPACE_CONTENTS_COMMENTS_'+amount].startsWith(' '));
 assert.notEqual(locale['blockly-WORKSPACE_SEARCH_FIND_NEXT'],locale['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']);
 assert.notEqual(locale['r-blocks-saved'],locale['r-blocks-unsaved']);
 for(const suffix of ['COMMENT','PROCEDURE']) assert.equal(locale['blockly-PROCEDURES_DEFRETURN_'+suffix],locale['blockly-PROCEDURES_DEFNORETURN_'+suffix]);
 assert.match(locale['blockly-WORKSPACE_SEARCH_MATCH'],/%2.*%1.*%3/);
 assert.match(locale['blockly-WORKSPACE_SEARCH_NO_MATCHES'],/\u044e\u043a/);
 assert.match(locale['r-blocks-invalid'],/\u041d\u04d9\u043a\u044a \u0431\u0435\u0440/);
});
