'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/or_IN.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-TODAY", "blockly-UNDO", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-LISTS_CREATE_WITH_ITEM_TITLE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-MATH_CHANGE_TITLE_ITEM", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "blockly-TEXT_APPEND_VARIABLE", "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "attachment-limit-unit-bytes", "Platform", "blockly-ANNOUNCE_MOVE_OF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-DIALOG_OK", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_SET_INDEX_INPUT_TO", "blockly-LOGIC_OPERATION_OR", "blockly-MATH_CONSTANT_E_ARIA", "blockly-MATH_CONSTANT_PI_ARIA", "blockly-PROCEDURES_DEFNORETURN_TITLE", "blockly-CONTROLS_FOREACH_INPUT_DO", "blockly-CONTROLS_FOR_INPUT_DO", "blockly-CONTROLS_IF_IF_TITLE_IF", "blockly-CONTROLS_IF_MSG_THEN", "blockly-CONTROLS_WHILEUNTIL_INPUT_DO", "blockly-PROCEDURES_DEFRETURN_TITLE", "blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CAPS_LOCK_KEY", "blockly-COMMAND_KEY", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROL_KEY", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-HOME_KEY", "blockly-INSERT_KEY", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PAUSE_KEY", "blockly-SHIFT_KEY", "blockly-SPACE_KEY", "blockly-TAB_KEY"];
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

test('Odia statistics retain distinct averages and half-open random bounds',()=>{
 assert.equal(new Set(['AVERAGE','MEDIAN','MODE'].map(op=>locale['blockly-MATH_ONLIST_OPERATOR_'+op])).size,3);
 assert.ok(locale['blockly-MATH_ONLIST_TOOLTIP_MODE'].includes('\u0b0f\u0b15 \u0b24\u0b3e\u0b32\u0b3f\u0b15\u0b3e'));
 assert.ok(locale['blockly-MATH_ONLIST_TOOLTIP_AVERAGE'].includes('\u0b38\u0b3e\u0b02\u0b16\u0b4d\u0b5f\u0b3f\u0b15'));
 assert.ok(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'].includes('0.0 (\u0b05\u0b28\u0b4d\u0b24\u0b30\u0b4d\u0b2d\u0b41\u0b15\u0b4d\u0b24)'));
 assert.ok(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'].includes('1.0 (\u0b2c\u0b39\u0b3f\u0b30\u0b4d\u0b2d\u0b41\u0b15\u0b4d\u0b24)'));
 for(const kind of ['MAX','MIN']) assert.equal(locale['blockly-MATH_ONLIST_OPERATOR_'+kind+'_ARIA'],locale['blockly-INPUT_LABEL_NUMBER_'+kind]);
});

test('Odia rounding and functions preserve inclusive limits and distinct bases',()=>{
 assert.ok(locale['blockly-MATH_RANDOM_INT_TOOLTIP'].includes('\u0b09\u0b2d\u0b5f \u0b38\u0b40\u0b2e\u0b3e \u0b38\u0b2e\u0b47\u0b24'));
 assert.equal(new Set(['ROUND','ROUNDDOWN','ROUNDUP'].map(op=>locale['blockly-MATH_ROUND_OPERATOR_'+op])).size,3);
 for(const key of ['MATH_SINGLE_OP_EXP_ARIA','MATH_SINGLE_TOOLTIP_EXP']) assert.ok(locale['blockly-'+key].startsWith('e '));
 for(const key of ['MATH_SINGLE_OP_LOG10_ARIA','MATH_SINGLE_OP_POW10_ARIA','MATH_SINGLE_TOOLTIP_LOG10','MATH_SINGLE_TOOLTIP_POW10']) assert.ok(locale['blockly-'+key].includes('10'));
 assert.notEqual(locale['blockly-MATH_SINGLE_TOOLTIP_ABS'],locale['blockly-MATH_SINGLE_TOOLTIP_NEG']);
 assert.ok(locale['blockly-MATH_SINGLE_TOOLTIP_NEG'].includes('\u0b1a\u0b3f\u0b39\u0b4d\u0b28 \u0b2c\u0b26\u0b33\u0b3e\u0b07'));
});

test('Odia trigonometry preserves degree units and technical abbreviations',()=>{
 for(const op of ['COS','SIN','TAN']){
  assert.ok(locale['blockly-MATH_TRIG_TOOLTIP_'+op].includes('\u0b21\u0b3f\u0b17\u0b4d\u0b30\u0b40\u0b30\u0b47'));
  assert.ok(locale['blockly-MATH_TRIG_TOOLTIP_'+op].includes('\u0b30\u0b47\u0b21\u0b3f\u0b06\u0b28\u0b4d\u200c\u0b30\u0b47 \u0b28\u0b41\u0b39\u0b47\u0b01'));
 }
 for(const op of ['ACOS','ASIN','ATAN','COS','SIN','TAN']) assert.equal(locale['blockly-MATH_TRIG_'+op],english['blockly-MATH_TRIG_'+op]);
 assert.equal(new Set(['COLOUR','NUMBER','STRING'].map(type=>locale['blockly-NEW_'+type+'_VARIABLE'])).size,3);
 assert.notEqual(locale['blockly-NEW_VARIABLE_TITLE'],locale['blockly-NEW_VARIABLE_TYPE_TITLE']);
 assert.notEqual(locale['blockly-OPEN_BACKPACK'],locale['blockly-CLOSE_BACKPACK']);
});

test('Odia procedures retain output distinctions and function restrictions',()=>{
 assert.equal(locale['blockly-PROCEDURES_BEFORE_PARAMS'],locale['blockly-PROCEDURES_CALL_BEFORE_PARAMS']);
 assert.ok(locale['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'].includes('\u0b06\u0b09\u0b1f\u0b2a\u0b41\u0b1f\u0b4d \u0b28\u0b25\u0b3f\u0b2c\u0b3e'));
 assert.ok(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'].includes('\u0b06\u0b09\u0b1f\u0b2a\u0b41\u0b1f\u0b4d \u0b25\u0b3f\u0b2c\u0b3e'));
 assert.ok(locale['blockly-PROCEDURES_CALLRETURN_TOOLTIP'].includes('\u0b06\u0b09\u0b1f\u0b2a\u0b41\u0b1f\u0b4d \u0b2c\u0b4d\u0b5f\u0b2c\u0b39\u0b3e\u0b30'));
 assert.ok(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'].includes('\u0b28\u0b3f\u0b37\u0b4d\u0b15\u0b4d\u0b30\u0b3f\u0b5f'));
 assert.ok(locale['blockly-PROCEDURES_IFRETURN_WARNING'].includes('\u0b15\u0b47\u0b2c\u0b33'));
 assert.ok(locale['blockly-PROCEDURES_IFRETURN_TOOLTIP'].includes('\u0b26\u0b4d\u0b71\u0b3f\u0b24\u0b40\u0b5f \u0b2e\u0b42\u0b32\u0b4d\u0b5f'));
});

test('Odia screen-reader states preserve opposite toggle actions',()=>{
 const disabled=locale['blockly-SCREENREADER_MODE_DISABLED'], enabled=locale['blockly-SCREENREADER_MODE_ENABLED'];
 assert.ok(disabled.includes('\u0b2c\u0b28\u0b4d\u0b26 \u0b05\u0b1b\u0b3f'));assert.ok(disabled.includes('\u0b1a\u0b3e\u0b32\u0b41 \u0b15\u0b30\u0b3f\u0b2c\u0b3e\u0b15\u0b41 %1'));
 assert.ok(enabled.includes('\u0b1a\u0b3e\u0b32\u0b41 \u0b05\u0b1b\u0b3f'));assert.ok(enabled.includes('\u0b2c\u0b28\u0b4d\u0b26 \u0b15\u0b30\u0b3f\u0b2c\u0b3e\u0b15\u0b41 %1'));
 assert.notEqual(locale['blockly-SHORTCUTS_ABORT_MOVE'],locale['blockly-SHORTCUTS_FINISH_MOVE']);
 assert.notEqual(locale['blockly-SHORTCUTS_FOCUS_TOOLBOX'],locale['blockly-SHORTCUTS_FOCUS_WORKSPACE']);
 assert.equal(locale['blockly-SHORTCUTS_DUPLICATE'],locale['blockly-DUPLICATE_BLOCK']);
 assert.ok(locale['blockly-RENAME_VARIABLE_TITLE'].includes('\u0b38\u0b2e\u0b38\u0b4d\u0b24'));
});

test('Odia directional shortcuts preserve consistent directions and distinct actions',()=>{
 const directions={DOWN:'\u0b24\u0b33\u0b15\u0b41',UP:'\u0b09\u0b2a\u0b30\u0b15\u0b41',LEFT:'\u0b2c\u0b3e\u0b2e\u0b15\u0b41',RIGHT:'\u0b21\u0b3e\u0b39\u0b3e\u0b23\u0b15\u0b41'};
 for(const [direction,word] of Object.entries(directions)){
  for(const action of ['MOVE','SCROLL']) assert.ok(locale['blockly-SHORTCUTS_'+action+'_'+direction].startsWith(word));
  assert.notEqual(locale['blockly-SHORTCUTS_MOVE_'+direction],locale['blockly-SHORTCUTS_SCROLL_'+direction]);
 }
 for(const pair of [['JUMP_BLOCK_START','JUMP_BLOCK_END'],['JUMP_FIRST_BLOCK','JUMP_LAST_BLOCK'],['JUMP_TOP_STACK','JUMP_BOTTOM_STACK'],['JUMP_NEXT_PAGE','JUMP_PREVIOUS_PAGE'],['NEXT_HEADING','PREVIOUS_HEADING'],['NEXT_STACK','PREVIOUS_STACK']]) assert.notEqual(locale['blockly-SHORTCUTS_'+pair[0]],locale['blockly-SHORTCUTS_'+pair[1]]);
});

test('Odia text operations preserve letter case and indexed roles',()=>{
 assert.ok(locale['blockly-TEXT_CHANGECASE_TOOLTIP'].includes('\u0b15\u0b47\u0b38\u0b4d'));
 assert.ok(locale['blockly-TEXT_CHANGECASE_TOOLTIP'].includes('\u0b28\u0b15\u0b32'));
 assert.equal(new Set(['LOWERCASE','TITLECASE','UPPERCASE'].map(op=>locale['blockly-TEXT_CHANGECASE_OPERATOR_'+op])).size,3);
 for(const op of ['FROM_END','FROM_START']) assert.ok(locale['blockly-TEXT_CHARAT_'+op].includes('#'));
 assert.ok(locale['blockly-TEXT_APPEND_TITLE'].includes('%1 \u0b30\u0b47 \u0b2a\u0b3e\u0b20\u0b4d\u0b5f %2'));
 assert.ok(locale['blockly-TEXT_COUNT_MESSAGE0'].includes('%2 \u0b30\u0b47 %1'));
 assert.notEqual(locale['blockly-TEXT_CHARAT_FIRST'],locale['blockly-TEXT_CHARAT_LAST']);
 assert.notEqual(locale['blockly-SHORTCUTS_START_MOVE'],locale['blockly-SHORTCUTS_START_MOVE_STACK']);
});

test('Odia substring and search labels preserve positions and missing results',()=>{
 for(const suffix of ['END_FROM_END','END_FROM_START','START_FROM_END','START_FROM_START']) assert.ok(locale['blockly-TEXT_GET_SUBSTRING_'+suffix].includes('#'));
 assert.ok(locale['blockly-TEXT_INDEXOF_TOOLTIP'].includes('\u0b26\u0b4d\u0b71\u0b3f\u0b24\u0b40\u0b5f \u0b2a\u0b3e\u0b20\u0b4d\u0b5f\u0b30\u0b47 \u0b2a\u0b4d\u0b30\u0b25\u0b2e \u0b2a\u0b3e\u0b20\u0b4d\u0b5f\u0b30'));
 assert.ok(locale['blockly-TEXT_INDEXOF_TOOLTIP'].includes('\u0b28\u0b2e\u0b3f\u0b33\u0b3f\u0b32\u0b47 %1'));
 assert.notEqual(locale['blockly-TEXT_INDEXOF_OPERATOR_FIRST'],locale['blockly-TEXT_INDEXOF_OPERATOR_LAST']);
 assert.notEqual(locale['blockly-TEXT_FROM_END_ARIA'],locale['blockly-TEXT_FROM_START_ARIA']);
 assert.equal(locale['blockly-TEXT_LENGTH_TITLE'],locale['blockly-LISTS_LENGTH_TITLE']);
 assert.ok(locale['blockly-TEXT_ISEMPTY_TOOLTIP'].includes(locale['blockly-LOGIC_BOOLEAN_TRUE']));
});

test('Odia text processing retains replacement roles and whitespace semantics',()=>{
 assert.ok(locale['blockly-TEXT_REPLACE_MESSAGE0'].includes('%3 \u0b30\u0b47 %1 \u0b15\u0b41 %2'));
 assert.ok(locale['blockly-TEXT_REPLACE_TOOLTIP'].includes('\u0b38\u0b2e\u0b38\u0b4d\u0b24 \u0b09\u0b2a\u0b38\u0b4d\u0b25\u0b3f\u0b24\u0b3f'));
 assert.ok(locale['blockly-TEXT_LENGTH_TOOLTIP'].includes('\u0b16\u0b3e\u0b32\u0b3f \u0b38\u0b4d\u0b25\u0b3e\u0b28 \u0b38\u0b2e\u0b47\u0b24'));
 assert.ok(locale['blockly-TEXT_TRIM_TOOLTIP'].includes('\u0b28\u0b15\u0b32'));
 assert.equal(new Set(['BOTH','LEFT','RIGHT'].map(side=>locale['blockly-TEXT_TRIM_OPERATOR_'+side])).size,3);
 assert.notEqual(locale['blockly-TEXT_PROMPT_TYPE_NUMBER'],locale['blockly-TEXT_PROMPT_TYPE_TEXT']);
 assert.notEqual(locale['blockly-UNDO'],locale['blockly-REDO']);
});

test('Odia variable and workspace labels preserve roles and count composition',()=>{
 assert.ok(locale['blockly-VARIABLES_SET'].includes('%1 \u0b15\u0b41 %2'));
 assert.ok(locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'].includes("\u0b2a\u0b4d\u0b30\u0b15\u0b3e\u0b30 '%2'"));
 assert.ok(locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'].includes("\u0b2a\u0b4d\u0b30\u0b15\u0b4d\u0b30\u0b3f\u0b5f\u0b3e '%2'"));
 for(const count of ['ONE','MANY']) assert.ok(locale['blockly-WORKSPACE_CONTENTS_COMMENTS_'+count].startsWith(' '));
 assert.equal(new Set(['ZERO','ONE','MANY'].map(count=>locale['blockly-WORKSPACE_CONTENTS_BLOCKS_'+count])).size,3);
 for(const count of ['ZERO','ONE','MANY']) assert.ok(locale['blockly-WORKSPACE_CONTENTS_BLOCKS_'+count].includes('%2'));
 assert.notEqual(locale['blockly-VARIABLES_GET_CREATE_SET'],locale['blockly-VARIABLES_SET_CREATE_GET']);
});

test('Odia workspace search retains shortcut names and shared label consistency',()=>{
 for(const key of ['Enter','Shift+Enter','Escape']) assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(key));
 assert.ok(locale['blockly-WORKSPACE_SEARCH_MATCH'].includes('%2\u0b1f\u0b3f \u0b2e\u0b27\u0b4d\u0b5f\u0b30\u0b41 \u0b2e\u0b47\u0b33 %1: %3'));
 assert.notEqual(locale['blockly-WORKSPACE_SEARCH_FIND_NEXT'],locale['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']);
 for(const key of ['LISTS_CREATE_WITH_ITEM_TITLE','MATH_CHANGE_TITLE_ITEM','TEXT_APPEND_VARIABLE','TEXT_CREATE_JOIN_ITEM_TITLE_ITEM']) assert.equal(locale['blockly-'+key],locale['blockly-VARIABLES_DEFAULT_NAME']);
 for(const key of ['LISTS_GET_INDEX_INPUT_IN_LIST','LISTS_GET_SUBLIST_INPUT_IN_LIST','LISTS_INDEX_OF_INPUT_IN_LIST','LISTS_SET_INDEX_INPUT_IN_LIST']) assert.equal(locale['blockly-'+key],locale['blockly-LISTS_INLIST']);
 assert.equal(locale['blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF'],locale['blockly-CONTROLS_IF_MSG_ELSEIF']);
});

test('Odia rule editor retains validation, permission and conflict guidance',()=>{
 assert.ok(locale['r-blocks-invalid'].includes('\u0b20\u0b3f\u0b15\u0b4d \u0b17\u0b4b\u0b1f\u0b3f\u0b0f'));
 assert.ok(locale['r-blocks-invalid'].includes('\u0b2c\u0b3f\u0b1a\u0b4d\u0b1b\u0b3f\u0b28\u0b4d\u0b28 \u0b15\u0b3f\u0b2e\u0b4d\u0b2c\u0b3e \u0b05\u0b24\u0b3f\u0b30\u0b3f\u0b15\u0b4d\u0b24'));
 assert.ok(locale['r-blocks-permission'].includes('\u0b2c\u0b4b\u0b30\u0b4d\u0b21 \u0b2a\u0b4d\u0b30\u0b36\u0b3e\u0b38\u0b15\u0b19\u0b4d\u0b15 \u0b05\u0b28\u0b41\u0b2e\u0b24\u0b3f'));
 assert.ok(locale['r-blocks-conflict'].includes('\u0b38\u0b1e\u0b4d\u0b1a\u0b5f \u0b15\u0b30\u0b3f\u0b2c\u0b3e \u0b2a\u0b42\u0b30\u0b4d\u0b2c\u0b30\u0b41'));
 assert.ok(locale['r-blocks-conflict'].includes(locale['r-blocks-reload']));
 assert.notEqual(locale['r-blocks-unsaved'],locale['r-blocks-saved']);
 for(const key of ['r-blocks-help','r-blocks-unavailable']) assert.ok(locale[key].includes('\u0b2b\u0b30\u0b4d\u0b2e \u0b38\u0b2e\u0b4d\u0b2a\u0b3e\u0b26\u0b15'));
});

test('Odia short labels retain repeated controls and announcement markers',()=>{
 for(const suffix of ['CONTROLS_REPEAT_INPUT_DO','CONTROLS_FOREACH_INPUT_DO','CONTROLS_FOR_INPUT_DO','CONTROLS_IF_MSG_THEN','CONTROLS_WHILEUNTIL_INPUT_DO']) assert.equal(locale['blockly-'+suffix],'\u0b15\u0b30\u0b28\u0b4d\u0b24\u0b41');
 assert.equal(locale['blockly-CONTROLS_IF_MSG_IF'],locale['blockly-CONTROLS_IF_IF_TITLE_IF']);
 assert.equal(locale['blockly-PROCEDURES_DEFNORETURN_TITLE'],locale['blockly-PROCEDURES_DEFRETURN_TITLE']);
 assert.ok(locale['blockly-ANNOUNCE_MOVE_OF'].indexOf('%2')<locale['blockly-ANNOUNCE_MOVE_OF'].indexOf('%1'));
 assert.ok(locale['blockly-LISTS_GET_SUBLIST_END_FROM_START'].includes('#'));
 assert.ok(locale['blockly-CONTEXT_MENU_KEY'].includes('\u2263'));
 assert.notEqual(locale['blockly-PAGE_DOWN_KEY'],locale['blockly-PAGE_UP_KEY']);
});
