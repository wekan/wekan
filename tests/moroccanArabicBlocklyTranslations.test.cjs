'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ary.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["card-field-visibility", "card-field-visibility-desc", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-LOGIC_OPERATION_OR", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-TODAY", "blockly-UNDO", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-LISTS_CREATE_WITH_ITEM_TITLE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-MATH_CHANGE_TITLE_ITEM", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "blockly-TEXT_APPEND_VARIABLE", "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers"];
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

test('Moroccan Arabic logic preserves comparison, negation and branch meanings',()=>{
 for(const type of ['ARIA','TOOLTIP']){
  const key=op=>'blockly-LOGIC_COMPARE_'+(type==='ARIA'?op+'_ARIA':'TOOLTIP_'+op);
  assert.match(locale[key('GT')],/كبر من/);
  assert.match(locale[key('LT')],/صغر من/);
  assert.doesNotMatch(locale[key('GT')],/كيساوي/);
  assert.doesNotMatch(locale[key('LT')],/كيساوي/);
  assert.match(locale[key('GTE')],/كبر من ولا كيساوي/);
  assert.match(locale[key('LTE')],/صغر من ولا كيساوي/);
 }
 assert.match(locale['blockly-LOGIC_COMPARE_TOOLTIP_NEQ'],/ما كانوش/);
 assert.match(locale['blockly-LOGIC_NEGATE_TOOLTIP'],/صحيح إلا كان المدخل خاطئ.*خاطئ إلا كان المدخل صحيح/);
 assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'],/جوج المداخل صحيحين/);
 assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'],/على الأقل مدخل واحد صحيح/);
 assert.notEqual(locale['blockly-LOGIC_OPERATION_AND'],locale['blockly-LOGIC_OPERATION_OR']);
 for(const branch of ['TRUE','FALSE']) assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale['blockly-LOGIC_TERNARY_IF_'+branch]));
 assert.match(locale['blockly-LISTS_SORT_TOOLTIP'],/نسخة/);
 assert.match(locale['blockly-LISTS_SORT_TYPE_IGNORECASE'],/بلا فرق بين الحروف الكبيرة والصغيرة/);
 assert.match(locale['blockly-LISTS_SPLIT_TOOLTIP_JOIN'],/جمع/);
 assert.match(locale['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'],/قسّم/);
});

test('Moroccan Arabic math preserves bounds, powers and statistics',()=>{
 assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'],/0\.0 \(داخل فالمجال\).*1\.0 \(ما داخلش فالمجال\)/);
 assert.match(locale['blockly-MATH_RANDOM_INT_TOOLTIP'],/الحدّين داخلين فالمجال/);
 assert.match(locale['blockly-MATH_CONSTRAIN_TITLE'],/%1.*الأدنى %2.*الأقصى %3/);
 assert.match(locale['blockly-MATH_ATAN2_TOOLTIP'],/بالدرجات من -180 حتى 180/);
 assert.match(locale['blockly-MATH_ARITHMETIC_TOOLTIP_POWER'],/الأول.*للقوة.*الثاني/);
 assert.match(locale['blockly-MATH_MODULO_TOOLTIP'],/الباقي/);
 assert.doesNotMatch(locale['blockly-MATH_MODULO_TOOLTIP'],/حاصل قسمة/);
 assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_AVERAGE'],/المتوسط الحسابي/);
 assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_MEDIAN'],/الوسيط/);
 assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_MODE'],/الأكثر تكرار/);
 assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_STD_DEV'],/الانحراف المعياري/);
 for(const formula of ['π (3.141…)','e (2.718…)','φ (1.618…)','sqrt(2) (1.414…)','sqrt(½) (0.707…)','∞']) assert.ok(locale['blockly-MATH_CONSTANT_TOOLTIP'].includes(formula));
 assert.equal(new Set(['EVEN','ODD','PRIME','WHOLE','POSITIVE','NEGATIVE'].map(k=>locale['blockly-MATH_IS_'+k])).size,6);
});

test('Moroccan Arabic functions retain bases, angle units and variable types',()=>{
 assert.match(locale['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'],/لتحت/);
 assert.match(locale['blockly-MATH_ROUND_OPERATOR_ROUNDUP'],/لفوق/);
 assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_EXP'],/e مرفوع/);
 assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_POW10'],/10 مرفوع/);
 assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_LOG10'],/بالأساس 10/);
 assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_LN'],/الطبيعي/);
 assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_NEG'],/إشارة معكوسة/);
 for(const op of ['COS','SIN','TAN']){
  assert.match(locale['blockly-MATH_TRIG_TOOLTIP_'+op],/بالدرجات، ماشي بالراديان/);
  assert.match(locale['blockly-MATH_TRIG_A'+op+'_ARIA'],/الدالة العكسية/);
  assert.doesNotMatch(locale['blockly-MATH_TRIG_'+op+'_ARIA'],/العكسية/);
 }
 assert.match(locale['blockly-MINIMAP_ARIA_LABEL'],/مفاتيح الأسهم.*العرض/);
 assert.match(locale['blockly-NO_PARENT_ANNOUNCEMENT'],/ما عندوش بلوك أب/);
 assert.match(locale['blockly-NEW_COLOUR_VARIABLE'],/اللون/);
 assert.match(locale['blockly-NEW_NUMBER_VARIABLE'],/عددي/);
 assert.match(locale['blockly-NEW_STRING_VARIABLE'],/نصّي/);
});

test('Moroccan Arabic procedures and accessibility preserve restrictions and opposing states',()=>{
 assert.match(locale['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'],/ما كترجّع حتى نتيجة/);
 assert.match(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'],/كترجّع نتيجة/);
 assert.doesNotMatch(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'],/ما كترجّع/);
 assert.match(locale['blockly-PROCEDURES_CALLRETURN_TOOLTIP'],/استعمل النتيجة/);
 assert.doesNotMatch(locale['blockly-PROCEDURES_CALLNORETURN_TOOLTIP'],/استعمل النتيجة/);
 assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'],/ما يمكنش.*'%1'.*بلوك التعريف معطّل/);
 assert.match(locale['blockly-PROCEDURES_DEF_DUPLICATE_WARNING'],/معاملات مكرّرين/);
 assert.match(locale['blockly-PROCEDURES_IFRETURN_WARNING'],/غير داخل تعريف دالة/);
 assert.match(locale['blockly-PROCEDURES_IFRETURN_TOOLTIP'],/صحيحة.*قيمة ثانية/);
 assert.match(locale['blockly-SCREENREADER_MODE_DISABLED'],/معطّل.*%1 باش تفعّلو/);
 assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'],/مفعّل.*%1 باش تعطّلو/);
 assert.match(locale['blockly-RENAME_VARIABLE_TITLE'],/كاع المتغيّرات '%1'/);
 assert.match(locale['blockly-SHORTCUTS_ABORT_MOVE'],/لغي/);
});

test('Moroccan Arabic navigation and case changes preserve direction and roles',()=>{
 for(const action of ['MOVE','SCROLL']){
  for(const [direction,word] of Object.entries({UP:'لفوق',DOWN:'لتحت',LEFT:'لليسار',RIGHT:'لليمين'})){
   assert.ok(locale['blockly-SHORTCUTS_'+action+'_'+direction].endsWith(word));
  }
 }
 assert.match(locale['blockly-SHORTCUTS_JUMP_TOP_STACK'],/لبداية سلسلة/);
 assert.match(locale['blockly-SHORTCUTS_JUMP_BOTTOM_STACK'],/لنهاية سلسلة/);
 assert.match(locale['blockly-SHORTCUTS_JUMP_NEXT_PAGE'],/الجاية/);
 assert.match(locale['blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE'],/اللي فاتت/);
 assert.match(locale['blockly-TEXT_APPEND_TITLE'],/النص %2 لآخر %1/);
 assert.match(locale['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'],/صغيرة/);
 assert.doesNotMatch(locale['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'],/كبيرة/);
 assert.match(locale['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'],/كبيرة/);
 assert.match(locale['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'],/أول حرف فكل كلمة كبير/);
 assert.match(locale['blockly-TEXT_CHANGECASE_TOOLTIP'],/نسخة.*حالة حروف/);
});

test('Moroccan Arabic text operations preserve positions, search roles and replacement scope',()=>{
 assert.match(locale['blockly-TEXT_CHARAT_FIRST'],/الأول/);
 assert.match(locale['blockly-TEXT_CHARAT_LAST'],/الأخير/);
 assert.match(locale['blockly-TEXT_CHARAT_FROM_END'],/# محسوب من الآخر/);
 assert.doesNotMatch(locale['blockly-TEXT_CHARAT_FROM_START'],/من الآخر/);
 assert.match(locale['blockly-TEXT_INDEXOF_TOOLTIP'],/النص الأول فالنص الثاني/);
 assert.match(locale['blockly-TEXT_INDEXOF_TOOLTIP'],/%1 إلا ما تلقاش النص/);
 assert.match(locale['blockly-TEXT_LENGTH_TOOLTIP'],/بما فيها المسافات/);
 assert.match(locale['blockly-TEXT_REPLACE_MESSAGE0'],/عوّض %1 بـ %2 فـ %3/);
 assert.match(locale['blockly-TEXT_REPLACE_TOOLTIP'],/كاع المرات/);
 assert.match(locale['blockly-TEXT_REVERSE_TOOLTIP'],/ترتيب الحروف/);
 assert.match(locale['blockly-TEXT_PROMPT_TOOLTIP_NUMBER'],/يدخل عدد/);
 assert.match(locale['blockly-TEXT_PROMPT_TOOLTIP_TEXT'],/يدخل شي نص/);
});

test('Moroccan Arabic workspace and variable messages retain scope and navigation',()=>{
 assert.match(locale['blockly-TEXT_TRIM_OPERATOR_LEFT'],/اليسرى/);
 assert.match(locale['blockly-TEXT_TRIM_OPERATOR_RIGHT'],/اليمنى/);
 assert.match(locale['blockly-TEXT_TRIM_OPERATOR_BOTH'],/الجهتين/);
 assert.match(locale['blockly-TEXT_TRIM_TOOLTIP'],/نسخة/);
 assert.match(locale['blockly-VARIABLES_SET'],/%1 بالقيمة %2/);
 assert.match(locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'],/'%1'.*نوع آخر: '%2'/);
 assert.match(locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'],/'%1'.*كمعامل.*'%2'/);
 assert.match(locale['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'],/ما كاينينش بلوكات%2/);
 for(const n of ['ONE','MANY']) assert.ok(locale['blockly-WORKSPACE_CONTENTS_COMMENTS_'+n].startsWith(' و'));
 assert.match(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'],/Enter للنتيجة الجاية.*Shift\+Enter للنتيجة اللي فاتت/);
 assert.match(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'],/Escape.*تسدّ البحث.*النتيجة الحالية/);
 assert.match(locale['blockly-WORKSPACE_SEARCH_MATCH'],/%1 من %2: %3/);
 assert.match(locale['blockly-WORKSPACE_SEARCH_NO_MATCHES'],/ما كاين حتى/);
});

test('Moroccan Arabic rule editor preserves authorization and validation requirements',()=>{
 assert.match(locale['r-blocks-invalid'],/بالضبط محفّز واحد بإجراء واحد/);
 assert.match(locale['r-blocks-invalid'],/المفصولة ولا الزايدة قبل الحفظ/);
 assert.match(locale['r-blocks-conflict'],/تبدّلات وانت كتعدّلها.*عاود حمّل.*قبل ما تحفظ/);
 assert.match(locale['r-blocks-permission'],/صلاحية مسؤول اللوحة/);
 assert.match(locale['r-blocks-discard'],/تلغي.*ما تحفظوش/);
 assert.match(locale['r-blocks-unavailable'],/ما متوفّراش.*محرّر الاستمارة/);
 assert.notEqual(locale['r-blocks-saved'],locale['r-blocks-unsaved']);
 assert.equal(locale['blockly-PROCEDURES_DEFRETURN_COMMENT'],locale['blockly-PROCEDURES_DEFNORETURN_COMMENT']);
 assert.equal(locale['blockly-PROCEDURES_DEFRETURN_PROCEDURE'],locale['blockly-PROCEDURES_DEFNORETURN_PROCEDURE']);
 assert.equal(locale['blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF'],locale['blockly-CONTROLS_IF_MSG_ELSEIF']);
 assert.equal(new Set(['scrum-product-owner','scrum-master','scrum-developers'].map(k=>locale[k])).size,3);
});
