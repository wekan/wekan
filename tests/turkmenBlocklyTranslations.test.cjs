'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tk_TM.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-TODAY", "blockly-UNDO", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-LISTS_CREATE_WITH_ITEM_TITLE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-MATH_CHANGE_TITLE_ITEM", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "blockly-TEXT_APPEND_VARIABLE", "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "board-view-bigboard", "attachment-limit-unit-bytes", "Platform", "OS", "mongodb-compact", "blockly-ANNOUNCE_MOVE_OF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-DIALOG_OK", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_SET_INDEX_INPUT_TO", "blockly-LOGIC_OPERATION_OR", "blockly-PROCEDURES_DEFNORETURN_TITLE", "blockly-PROCEDURES_DEFRETURN_TITLE", "blockly-CONTROLS_FOREACH_INPUT_DO", "blockly-CONTROLS_FOR_INPUT_DO", "blockly-CONTROLS_IF_IF_TITLE_IF", "blockly-CONTROLS_IF_MSG_THEN", "blockly-CONTROLS_WHILEUNTIL_INPUT_DO", "blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CAPS_LOCK_KEY", "blockly-COMMAND_KEY", "blockly-CONTROL_KEY", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-HOME_KEY", "blockly-INSERT_KEY", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PAUSE_KEY", "blockly-SHIFT_KEY", "blockly-SPACE_KEY", "blockly-TAB_KEY", "blockly-CONTEXT_MENU_KEY"];
test('Turkmen Blockly translations preserve order and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[A-Za-z\u00c4\u00e4\u00c7\u00e7\u0147\u0148\u00d6\u00f6\u015e\u015f\u00dc\u00fc\u00dd\u00fd\u017d\u017e]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Turkmen colours and loop controls preserve bounds and action distinctions',()=>{
 assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
 assert.ok(locale['blockly-COLOUR_RGB_TOOLTIP'].includes('0 bilen 100'));
 assert.equal(new Set(['BLUE','GREEN','RED'].map(k=>locale['blockly-COLOUR_RGB_'+k])).size,3);
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes('\u00f6\u00e7\u00fcrip bolma\u00fdar'));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("'%1' \u00fc\u00fdtge\u00fdjisini"));
 assert.ok(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'].includes("'%2' funksi\u00fdasyny\u0148"));
 assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'],locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'].includes('galan b\u00f6legini ge\u00e7ir'));
 assert.ok(locale['blockly-COLLAPSED_WARNINGS_WARNING'].includes('du\u00fddury\u015flar bar'));
});
test('Turkmen loop and editing messages preserve conditions and operand roles',()=>{
 assert.ok(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'].includes('di\u0148e'));
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'].includes('\u00fdalan'));
 assert.ok(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'].includes('dogry'));
 assert.ok(locale['blockly-CONTROLS_IF_TOOLTIP_4'].includes('hi\u00e7 biri dogry bolmasa'));
 assert.ok(locale['blockly-CONTROLS_FOR_TITLE'].includes('%2-den %3-e \u00e7enli %4'));
 assert.ok(locale['blockly-CONTROLS_FOREACH_TITLE'].includes('%2 sanawdaky her %1'));
 assert.ok(locale['blockly-DELETE_VARIABLE_CONFIRMATION'].includes("'%2' \u00fc\u00fdtge\u00fdjisini\u0148 %1"));
 assert.notEqual(locale['blockly-DELETE_BLOCK'],locale['blockly-DISABLE_BLOCK']);
 assert.notEqual(locale['blockly-COPY_SHORTCUT'],locale['blockly-CUT_SHORTCUT']);
});
test('Turkmen input labels retain pixel coordinates and opposite actions',()=>{
 assert.ok(locale['blockly-FIELD_BITMAP_ARIA_VALUE'].includes('%1 \u00d7 %2'));
 assert.ok(locale['blockly-FIELD_BITMAP_ARIA_VALUE'].includes('%3 piksel'));
 assert.ok(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].includes('hatar %2, s\u00fct\u00fcn %3'));
 for(const kind of ['COMMENT','WARNING']){
  assert.ok(locale['blockly-ICON_LABEL_'+kind+'_CLOSED'].endsWith('a\u00e7'));
  assert.ok(locale['blockly-ICON_LABEL_'+kind+'_OPEN'].endsWith('\u00fdap'));
 }
 assert.notEqual(locale['blockly-INPUT_LABEL_CONDITION_A'],locale['blockly-INPUT_LABEL_CONDITION_B']);
 assert.notEqual(locale['blockly-INPUT_LABEL_LISTS_START_POSITION'],locale['blockly-INPUT_LABEL_LISTS_END_POSITION']);
 assert.ok(locale['blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT'].includes('tekst'));
 assert.ok(locale['blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST'].includes('sanaw'));
 assert.notEqual(locale['blockly-INPUT_LABEL_LISTS_REPEAT_ITEM'],locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM']);
 assert.ok(locale['blockly-HELP_PROMPT'].includes('%1 bas'));
});
test('Turkmen math inputs and navigation retain operand and shortcut roles',()=>{
 for(const pair of [['MATH_DIVIDEND','MATH_DIVISOR'],['NUMBER_A','NUMBER_B'],['NUMBER_MIN','NUMBER_MAX'],['TEXT_START_POSITION','TEXT_END_POSITION'],['TEXT_TO_FIND','TEXT_TO_REPLACE']]){
  assert.notEqual(locale['blockly-INPUT_LABEL_'+pair[0]],locale['blockly-INPUT_LABEL_'+pair[1]]);
 }
 for(const axis of ['X','Y']) assert.ok(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_'+axis].startsWith(axis.toLowerCase()));
 assert.ok(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'].includes('%1 basyp sakla'));
 assert.ok(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'].includes('tassyklamak \u00fc\u00e7in %2 bas'));
 assert.notEqual(locale['blockly-KEYBOARD_NAV_COPIED_HINT'],locale['blockly-KEYBOARD_NAV_CUT_HINT']);
 assert.equal(locale['blockly-INPUT_LABEL_VARIABLES_SET'],locale['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET']);
});
test('Turkmen list items distinguish retrieval, removal and copied sublists',()=>{
 for(const pos of ['FIRST','FROM','LAST','RANDOM']){
  const get=locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_'+pos];
  const remove=locale['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_'+pos];
  const both=locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_'+pos];
  assert.ok(get.includes('ga\u00fdtar\u00fdar') && !get.includes('a\u00fdyr\u00fdar'));
  assert.ok(remove.includes('a\u00fdyr\u00fdar') && !remove.includes('ga\u00fdtar\u00fdar'));
  assert.ok(both.includes('a\u00fdyr\u00fdar we ga\u00fdtar\u00fdar'));
 }
 assert.ok(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'].includes('0'));
 assert.ok(locale['blockly-LISTS_GET_SUBLIST_TOOLTIP'].includes('nusgasyny'));
 assert.ok(locale['blockly-LISTS_GET_SUBLIST_START_FROM_END'].includes('so\u0148undan'));
 assert.ok(!locale['blockly-LISTS_GET_SUBLIST_START_FROM_START'].includes('so\u0148undan'));
 assert.ok(locale['blockly-LISTS_INDEX_FROM_END_TOOLTIP'].includes('%1 so\u0148ky'));
});
test('Turkmen list search and updates retain missing results and insertion distinctions',()=>{
 assert.ok(locale['blockly-LISTS_INDEX_OF_TOOLTIP'].includes('tapylmasa, %1'));
 assert.ok(locale['blockly-LISTS_REPEAT_TITLE'].includes('%1 elementi %2 gezek'));
 for(const pos of ['FIRST','FROM','LAST','RANDOM']){
  assert.ok(locale['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_'+pos].includes('go\u015f'));
  assert.ok(locale['blockly-LISTS_SET_INDEX_TOOLTIP_SET_'+pos].includes('bahasyny belle\u00fd\u00e4r'));
 }
 for(const action of ['REVERSE','SORT']) assert.ok(locale['blockly-LISTS_'+action+'_TOOLTIP'].includes('nusga'));
 assert.notEqual(locale['blockly-LISTS_SORT_ORDER_ASCENDING'],locale['blockly-LISTS_SORT_ORDER_DESCENDING']);
 assert.ok(locale['blockly-LISTS_SORT_TYPE_IGNORECASE'].includes('tapawudyny hasaba alma'));
 assert.notEqual(locale['blockly-LISTS_INDEX_OF_FIRST'],locale['blockly-LISTS_INDEX_OF_LAST']);
});
test('Turkmen comparisons and Boolean logic retain boundaries and negation',()=>{
 assert.equal(new Set(['EQ','NEQ','GT','GTE','LT','LTE'].map(k=>locale['blockly-LOGIC_COMPARE_'+k+'_ARIA'])).size,6);
 for(const k of ['GTE','LTE']) assert.ok(locale['blockly-LOGIC_COMPARE_TOOLTIP_'+k].includes('\u00fda-da o\u0148a de\u0148'));
 assert.ok(locale['blockly-LOGIC_COMPARE_TOOLTIP_NEQ'].includes('de\u0148 bolmasa'));
 assert.ok(locale['blockly-LOGIC_NEGATE_TOOLTIP'].includes('\u00fdalan bolsa, dogry'));
 assert.ok(locale['blockly-LOGIC_NEGATE_TOOLTIP'].includes('dogry bolsa, \u00fdalan'));
 assert.ok(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'].includes('Iki giri\u015f hem'));
 assert.ok(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'].includes('azyndan biri'));
 for(const key of ['CONDITION','IF_FALSE','IF_TRUE']) assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale['blockly-LOGIC_TERNARY_'+key]));
 assert.ok(locale['blockly-LOGIC_NULL_TOOLTIP'].includes('null'));
 assert.notEqual(locale['blockly-LISTS_SPLIT_TEXT_FROM_LIST'],locale['blockly-LISTS_SPLIT_LIST_FROM_TEXT']);
 for(const key of ['JOIN','SPLIT']) assert.ok(locale['blockly-LISTS_SPLIT_TOOLTIP_'+key].includes('b\u00f6l\u00fcji'));
});
test('Turkmen number properties preserve formulas, bounds and angle units',()=>{
 for(const term of ['\u03c0','3.141','e','2.718','\u03c6','1.618','sqrt(2)','1.414','sqrt(\u00bd)','0.707','\u221e']) assert.ok(locale['blockly-MATH_CONSTANT_TOOLTIP'].includes(term),term);
 for(const term of ['X:%1','Y:%2','atan2']) assert.ok(locale['blockly-MATH_ATAN2_TITLE'].includes(term),term);
 assert.ok(locale['blockly-MATH_ATAN2_TOOLTIP'].includes('-180-den 180-e \u00e7enli gradusda'));
 assert.ok(locale['blockly-MATH_CONSTRAIN_TITLE'].includes('a\u015faky %2'));
 assert.ok(locale['blockly-MATH_CONSTRAIN_TITLE'].includes('\u00fdokarky %3'));
 assert.ok(locale['blockly-MATH_CONSTRAIN_TOOLTIP'].includes('\u00e7\u00e4kleri\u0148 \u00f6zleri hem gir\u00fd\u00e4r'));
 assert.ok(locale['blockly-MATH_MODULO_TITLE'].includes('%1 \u00f7 %2'));
 assert.equal(new Set(['EVEN','ODD','NEGATIVE','POSITIVE','PRIME','WHOLE'].map(k=>locale['blockly-MATH_IS_'+k])).size,6);
 assert.equal(locale['blockly-MATH_ONLIST_OPERATOR_MAX_ARIA'],locale['blockly-INPUT_LABEL_NUMBER_MAX']);
});
test('Turkmen statistics preserve distinct aggregates and random bounds',()=>{
 assert.equal(new Set(['AVERAGE','MEDIAN','MODE','STD_DEV','SUM'].map(k=>locale['blockly-MATH_ONLIST_OPERATOR_'+k])).size,5);
 assert.ok(locale['blockly-MATH_ONLIST_TOOLTIP_MODE'].includes('elementleri\u0148 sanawyny'));
 assert.ok(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'].includes('0.0 (gir\u00fd\u00e4r)'));
 assert.ok(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'].includes('1.0 (girme\u00fd\u00e4r)'));
 assert.ok(locale['blockly-MATH_RANDOM_INT_TOOLTIP'].includes('iki \u00e7\u00e4k hem gir\u00fd\u00e4r'));
 assert.equal(new Set(['ROUND','ROUNDDOWN','ROUNDUP'].map(k=>locale['blockly-MATH_ROUND_OPERATOR_'+k])).size,3);
 assert.equal(locale['blockly-MATH_ONLIST_OPERATOR_MIN_ARIA'],locale['blockly-INPUT_LABEL_NUMBER_MIN']);
 assert.ok(locale['blockly-MATH_SINGLE_OP_LOG10_ARIA'].includes('10'));
 assert.ok(locale['blockly-MATH_SINGLE_OP_EXP_ARIA'].startsWith('e-'));
});
test('Turkmen mathematical functions retain bases, signs and angle units',()=>{
 assert.ok(locale['blockly-MATH_SINGLE_TOOLTIP_EXP'].startsWith('e-'));
 for(const key of ['OP_POW10_ARIA','TOOLTIP_POW10','TOOLTIP_LOG10']) assert.ok(locale['blockly-MATH_SINGLE_'+key].includes('10'));
 assert.ok(locale['blockly-MATH_SINGLE_TOOLTIP_NEG'].includes('alamatyny tersine'));
 assert.notEqual(locale['blockly-MATH_SINGLE_TOOLTIP_ABS'],locale['blockly-MATH_SINGLE_TOOLTIP_NEG']);
 for(const fn of ['COS','SIN','TAN']){
  assert.ok(locale['blockly-MATH_TRIG_TOOLTIP_'+fn].includes('Gradusda'));
  assert.ok(locale['blockly-MATH_TRIG_TOOLTIP_'+fn].includes('radian d\u00e4l'));
  assert.notEqual(locale['blockly-MATH_TRIG_'+fn+'_ARIA'],locale['blockly-MATH_TRIG_A'+fn+'_ARIA']);
 }
 assert.ok(locale['blockly-MINIMAP_ARIA_LABEL'].includes('ok d\u00fcwmelerini'));
 assert.notEqual(locale['blockly-NEW_COLOUR_VARIABLE'],locale['blockly-NEW_NUMBER_VARIABLE']);
});
test('Turkmen function controls preserve return behavior and disabled definitions',()=>{
 assert.ok(locale['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'].includes('ga\u00fdtarma\u00fdan'));
 assert.ok(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'].includes('ga\u00fdtar\u00fdan'));
 assert.ok(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'].includes('i\u015fledip bolma\u00fdar'));
 assert.ok(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'].includes('blogy \u00f6\u00e7\u00fcrilen'));
 assert.ok(locale['blockly-PROCEDURES_IFRETURN_WARNING'].includes('di\u0148e'));
 assert.ok(locale['blockly-PROCEDURES_IFRETURN_TOOLTIP'].includes('dogry bolsa, ikinji'));
 assert.ok(locale['blockly-NO_PARENT_ANNOUNCEMENT'].endsWith('\u00fdok'));
 assert.equal(locale['blockly-PROCEDURES_BEFORE_PARAMS'],locale['blockly-PROCEDURES_CALL_BEFORE_PARAMS']);
 assert.equal(new Set(['COLOUR','NUMBER','STRING'].map(k=>locale['blockly-NEW_'+k+'_VARIABLE'])).size,3);
 assert.ok(locale['blockly-SCREENREADER_HINT'].includes('a\u00e7mak \u00fda-da \u00f6\u00e7\u00fcrmek \u00fc\u00e7in %1'));
});
test('Turkmen accessibility shortcuts preserve mode states and navigation distinctions',()=>{
 assert.ok(locale['blockly-SCREENREADER_MODE_DISABLED'].includes('\u00f6\u00e7\u00fck, a\u00e7mak \u00fc\u00e7in %1'));
 assert.ok(locale['blockly-SCREENREADER_MODE_ENABLED'].includes('a\u00e7yk, \u00f6\u00e7\u00fcrmek \u00fc\u00e7in %1'));
 for(const direction of ['DOWN','LEFT','RIGHT','UP']){
  assert.ok(locale['blockly-SHORTCUTS_SCROLL_'+direction].startsWith('G\u00f6rn\u00fc\u015fi'));
  assert.notEqual(locale['blockly-SHORTCUTS_MOVE_'+direction],locale['blockly-SHORTCUTS_SCROLL_'+direction]);
 }
 assert.equal(new Set(['ABORT_MOVE','START_MOVE','FINISH_MOVE'].map(k=>locale['blockly-SHORTCUTS_'+k])).size,3);
 for(const pair of [['NEXT_PAGE','PREVIOUS_PAGE'],['FIRST_BLOCK','LAST_BLOCK'],['TOP_STACK','BOTTOM_STACK']]){
  assert.notEqual(locale['blockly-SHORTCUTS_JUMP_'+pair[0]],locale['blockly-SHORTCUTS_JUMP_'+pair[1]]);
 }
 assert.ok(locale['blockly-SHORTCUTS_EXTENDED_INFORMATION'].includes('sesli oka'));
});
test('Turkmen text operations preserve letter case, operand roles and missing results',()=>{
 assert.equal(new Set(['LOWERCASE','TITLECASE','UPPERCASE'].map(k=>locale['blockly-TEXT_CHANGECASE_OPERATOR_'+k])).size,3);
 assert.ok(locale['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'].includes('her s\u00f6z\u00fc\u0148 ilkinji'));
 assert.ok(locale['blockly-TEXT_CHANGECASE_TOOLTIP'].includes('nusgasyny'));
 assert.ok(locale['blockly-TEXT_COUNT_MESSAGE0'].includes('%2 tekstinde %1'));
 assert.ok(locale['blockly-TEXT_APPEND_TITLE'].includes('%1 bahasyna %2 tekstini'));
 assert.ok(locale['blockly-TEXT_INDEXOF_TOOLTIP'].includes('tapylmasa, %1'));
 for(const prefix of ['TEXT_CHARAT','TEXT_GET_SUBSTRING_START']){
  assert.ok(locale['blockly-'+prefix+'_FROM_END'].includes('so\u0148undan'));
  assert.ok(!locale['blockly-'+prefix+'_FROM_START'].includes('so\u0148undan'));
 }
 assert.notEqual(locale['blockly-TEXT_INDEXOF_OPERATOR_FIRST'],locale['blockly-TEXT_INDEXOF_OPERATOR_LAST']);
});
test('Turkmen text values preserve replacement roles and whitespace boundaries',()=>{
 assert.ok(locale['blockly-TEXT_REPLACE_MESSAGE0'].includes('%3 tekstinde %1 \u00fderine %2'));
 assert.ok(locale['blockly-TEXT_LENGTH_TOOLTIP'].includes('bo\u015fluklary hem go\u015fup'));
 assert.ok(locale['blockly-TEXT_TRIM_TOOLTIP'].includes('Bir \u00fda-da iki ujundaky'));
 assert.equal(new Set(['BOTH','LEFT','RIGHT'].map(k=>locale['blockly-TEXT_TRIM_OPERATOR_'+k])).size,3);
 assert.ok(locale['blockly-VARIABLES_SET'].includes('%1 bahasyny %2'));
 assert.ok(locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'].includes("ba\u015fga g\u00f6rn\u00fc\u015f \u00fc\u00e7in e\u00fd\u00fd\u00e4m bar: '%2'"));
 assert.ok(locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'].includes("'%2' prosedurasynda parametr"));
 assert.notEqual(locale['blockly-TEXT_PROMPT_TYPE_NUMBER'],locale['blockly-TEXT_PROMPT_TYPE_TEXT']);
});
test('Turkmen workspace and rule messages retain counts and save restrictions',()=>{
 for(const kind of ['MANY','ONE','ZERO']){
  const base=locale['blockly-WORKSPACE_CONTENTS_BLOCKS_'+kind];
  for(const comments of ['MANY','ONE']){
   const fragment=locale['blockly-WORKSPACE_CONTENTS_COMMENTS_'+comments];
   assert.ok(fragment.startsWith(' we '));
   assert.ok(!/%[12]/.test(base.replace('%2',fragment.replace('%1','2')).replace('%1','3')));
  }
 }
 for(const key of ['Enter','Shift+Enter','Escape']) assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(key));
 assert.ok(locale['r-blocks-invalid'].includes('Di\u0148e bir'));
 assert.ok(locale['r-blocks-invalid'].includes('birikdirilmedik \u00fda-da artykma\u00e7'));
 assert.ok(locale['r-blocks-conflict'].includes('\u00ddatda saklamazdan \u00f6\u0148'));
 assert.ok(locale['r-blocks-permission'].includes('dolandyryjysyny\u0148 rugsady'));
 assert.ok(locale['r-blocks-unsaved'].includes('saklanmadyk'));
 for(const key of ['COMMENT','PROCEDURE']) assert.equal(locale['blockly-PROCEDURES_DEFRETURN_'+key],locale['blockly-PROCEDURES_DEFNORETURN_'+key]);
});
test('Turkmen short controls and keyboard labels retain roles and markings',()=>{
 for(const name of ['ALT_KEY','BACKSPACE_KEY','CAPS_LOCK_KEY','COMMAND_KEY','CONTROL_KEY','END_KEY','ENTER_KEY','ESCAPE','HOME_KEY','INSERT_KEY','OPTION_KEY','PAGE_DOWN_KEY','PAGE_UP_KEY','PAUSE_KEY','SHIFT_KEY','SPACE_KEY','TAB_KEY']){
  const key='blockly-'+name;
  assert.ok(locale[key].includes(english[key]),key);
  assert.ok(locale[key].endsWith('d\u00fcwmesi'),key);
 }
 assert.ok(locale['blockly-ANNOUNCE_MOVE_OF'].includes('%2-den %1'));
 assert.notEqual(locale['blockly-FIELD_BITMAP_PIXEL_ON'],locale['blockly-FIELD_BITMAP_PIXEL_OFF']);
 assert.equal(locale['blockly-CONTROLS_IF_MSG_IF'],locale['blockly-CONTROLS_IF_IF_TITLE_IF']);
 assert.equal(locale['blockly-PROCEDURES_DEFRETURN_TITLE'],locale['blockly-PROCEDURES_DEFNORETURN_TITLE']);
 for(const key of ['CONTROLS_FOREACH_INPUT_DO','CONTROLS_FOR_INPUT_DO','CONTROLS_IF_MSG_THEN','CONTROLS_WHILEUNTIL_INPUT_DO']) assert.equal(locale['blockly-'+key],locale['blockly-CONTROLS_REPEAT_INPUT_DO']);
 assert.notEqual(locale['blockly-LOGIC_OPERATION_OR'],locale['blockly-LOGIC_OPERATION_AND']);
});
