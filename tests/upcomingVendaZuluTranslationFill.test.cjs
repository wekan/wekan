// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const node = process.execPath;
const fill = path.join(ROOT, 'releases/translations/fill-translations.mjs');
const read = language => JSON.parse(fs.readFileSync(path.join(ROOT,
  'imports/i18n/data', `${language}.i18n.json`), 'utf8'));
for (const language of ['ve-CC', 've-PP', 've', 'zu-ZA', 'zu']) {
  assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node,
    [fill, '--completed-catalog', '--list', language], { cwd: ROOT, encoding: 'utf8' })), {});
  const translated = read(language);
  assert.doesNotMatch(translated['office-report-desc'], /Where people log in/);
  assert.match(translated['api-no-calls'], /WITH_API=true/);
}
const venda = read('ve')['no-boards-selected'];
const zulu = read('zu')['no-boards-selected'];
assert.match(venda, /A no ngo|bodo/);
assert.match(zulu, /Awukhethanga|ibhodi/);
assert.notStrictEqual(venda, zulu);
console.log('upcomingVendaZuluTranslationFill: 18 tests passed');

// Newer controls: test the changed keys separately from the historical gate.
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const source = read('en');
  const keys = [
  "board-announcement",
  "board-announcement-enabled",
  "cards-use-list-color",
  "read-only-field",
  "r-moved-forward",
  "r-moved-back",
  "r-assignee",
  "r-add-actinguser-assignee",
  "r-remove-all-assignees",
  "ldap-sync-now",
  "ldap-sync-now-done",
  "ldap-sync-now-error",
  "ldap-sync-now-nothing",
  "oauth-providers-allowed-email-domains",
  "card-field-visibility",
  "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE",
  "blockly-CHANGE_VALUE_TITLE",
  "blockly-CLEAN_UP",
  "blockly-CLOSE_BACKPACK",
  "blockly-COLLAPSED_WARNINGS_WARNING",
  "blockly-COLLAPSE_ALL",
  "blockly-COLLAPSE_BLOCK",
  "blockly-COLOUR_BLEND_COLOUR1",
  "blockly-COLOUR_BLEND_COLOUR2",
  "blockly-COLOUR_BLEND_RATIO",
  "blockly-COLOUR_BLEND_TITLE",
  "blockly-COLOUR_BLEND_TOOLTIP",
  "blockly-COLOUR_PICKER_TOOLTIP",
  "blockly-COLOUR_RANDOM_TITLE",
  "blockly-COLOUR_RANDOM_TOOLTIP",
  "blockly-COLOUR_RGB_BLUE",
  "blockly-COLOUR_RGB_GREEN",
  "blockly-COLOUR_RGB_RED",
  "blockly-COLOUR_RGB_TITLE",
  "blockly-COLOUR_RGB_TOOLTIP",
  "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK",
  "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE",
  "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK",
  "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE",
  "blockly-CONTROLS_FLOW_STATEMENTS_WARNING",
  "blockly-CONTROLS_FOREACH_TITLE",
  "blockly-CONTROLS_FOREACH_TOOLTIP",
  "blockly-CONTROLS_FOR_TITLE",
  "blockly-CONTROLS_FOR_TOOLTIP",
  "blockly-CONTROLS_IF_ELSEIF_TOOLTIP",
  "blockly-CONTROLS_IF_ELSE_TOOLTIP",
  "blockly-CONTROLS_IF_IF_TOOLTIP",
  "blockly-CONTROLS_IF_MSG_ELSE",
  "blockly-CONTROLS_IF_MSG_ELSEIF",
  "blockly-CONTROLS_IF_TOOLTIP_1",
  "blockly-CONTROLS_IF_TOOLTIP_2",
  "blockly-CONTROLS_IF_TOOLTIP_3"
];
  keys.push(...[
  "blockly-CONTROLS_IF_MSG_IF",
  "blockly-CONTROLS_IF_TOOLTIP_4",
  "blockly-CONTROLS_REPEAT_INPUT_DO",
  "blockly-CONTROLS_REPEAT_TITLE",
  "blockly-CONTROLS_REPEAT_TOOLTIP",
  "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL",
  "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE",
  "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL",
  "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE",
  "blockly-COPY_ALL_TO_BACKPACK",
  "blockly-COPY_SHORTCUT",
  "blockly-COPY_TO_BACKPACK",
  "blockly-CURRENT_BLOCK_ANNOUNCEMENT",
  "blockly-CUT_SHORTCUT",
  "blockly-DELETE_ALL_BLOCKS",
  "blockly-DELETE_BLOCK",
  "blockly-DELETE_VARIABLE",
  "blockly-DELETE_VARIABLE_CONFIRMATION",
  "blockly-DELETE_X_BLOCKS",
  "blockly-DIALOG_OK",
  "blockly-DISABLE_BLOCK",
  "blockly-DUPLICATE_BLOCK",
  "blockly-DUPLICATE_COMMENT",
  "blockly-EDIT_BLOCK_CONTENTS",
  "blockly-EMPTY_BACKPACK",
  "blockly-ENABLE_BLOCK",
  "blockly-EXPAND_ALL",
  "blockly-EXPAND_BLOCK",
  "blockly-EXTERNAL_INPUTS",
  "blockly-FIELD_BITMAP_ARIA_VALUE",
  "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR",
  "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE",
  "blockly-FIELD_BITMAP_PIXEL_LABEL",
  "blockly-FIELD_BITMAP_PIXEL_OFF",
  "blockly-FIELD_BITMAP_PIXEL_ON",
  "blockly-FIELD_LABEL_EDIT_PREFIX",
  "blockly-FIELD_LABEL_EMPTY",
  "blockly-FIELD_LABEL_OPTION_INDEX",
  "blockly-FIELD_LABEL_VARIABLE",
  "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING",
  "blockly-FIELD_MULTILINEINPUT_NEW_LINE",
  "blockly-HELP_PROMPT",
  "blockly-ICON_LABEL_COMMENT_CLOSED",
  "blockly-ICON_LABEL_COMMENT_OPEN",
  "blockly-ICON_LABEL_DEFAULT",
  "blockly-ICON_LABEL_MUTATOR_CLOSED",
  "blockly-ICON_LABEL_MUTATOR_OPEN",
  "blockly-ICON_LABEL_WARNING_CLOSED",
  "blockly-ICON_LABEL_WARNING_OPEN",
  "blockly-INLINE_INPUTS"
]);
  keys.push(...[
  "blockly-LISTS_CREATE_EMPTY_TITLE",
  "blockly-LISTS_CREATE_EMPTY_TOOLTIP",
  "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD",
  "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP",
  "blockly-LISTS_CREATE_WITH_INPUT_WITH",
  "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP",
  "blockly-LISTS_CREATE_WITH_TOOLTIP",
  "blockly-LISTS_GET_INDEX_FIRST",
  "blockly-LISTS_GET_INDEX_FROM_END",
  "blockly-LISTS_GET_INDEX_GET",
  "blockly-LISTS_GET_INDEX_GET_REMOVE",
  "blockly-LISTS_GET_INDEX_LAST",
  "blockly-LISTS_GET_INDEX_RANDOM",
  "blockly-LISTS_GET_INDEX_REMOVE",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM",
  "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST",
  "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM",
  "blockly-LISTS_GET_SUBLIST_END_FROM_END",
  "blockly-LISTS_GET_SUBLIST_END_FROM_START",
  "blockly-LISTS_GET_SUBLIST_END_LAST",
  "blockly-LISTS_GET_SUBLIST_START_FIRST",
  "blockly-LISTS_GET_SUBLIST_START_FROM_END",
  "blockly-LISTS_GET_SUBLIST_START_FROM_START",
  "blockly-LISTS_GET_SUBLIST_TOOLTIP",
  "blockly-LISTS_INDEX_FROM_END_TOOLTIP",
  "blockly-LISTS_INDEX_FROM_START_TOOLTIP",
  "blockly-LISTS_INDEX_OF_FIRST",
  "blockly-LISTS_INDEX_OF_LAST",
  "blockly-LISTS_INDEX_OF_TOOLTIP",
  "blockly-LISTS_INLIST",
  "blockly-LISTS_ISEMPTY_TITLE",
  "blockly-LISTS_ISEMPTY_TOOLTIP",
  "blockly-LISTS_LENGTH_TITLE",
  "blockly-LISTS_LENGTH_TOOLTIP",
  "blockly-LISTS_REPEAT_TITLE",
  "blockly-LISTS_REPEAT_TOOLTIP",
  "blockly-LISTS_REVERSE_MESSAGE0",
  "blockly-LISTS_REVERSE_TOOLTIP",
  "blockly-LISTS_SET_INDEX_INPUT_TO",
  "blockly-LISTS_SET_INDEX_INSERT",
  "blockly-LISTS_SET_INDEX_SET",
  "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST",
  "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM",
  "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST",
  "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM",
  "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST",
  "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM",
  "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST",
  "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM",
  "blockly-LISTS_SORT_ORDER_ASCENDING",
  "blockly-LISTS_SORT_ORDER_DESCENDING",
  "blockly-LISTS_SORT_TITLE",
  "blockly-LISTS_SORT_TOOLTIP",
  "blockly-LISTS_SORT_TYPE_IGNORECASE",
  "blockly-LISTS_SORT_TYPE_NUMERIC",
  "blockly-LISTS_SORT_TYPE_TEXT",
  "blockly-LISTS_SPLIT_LIST_FROM_TEXT",
  "blockly-LISTS_SPLIT_TEXT_FROM_LIST",
  "blockly-LISTS_SPLIT_TOOLTIP_JOIN",
  "blockly-LISTS_SPLIT_TOOLTIP_SPLIT",
  "blockly-LISTS_SPLIT_WITH_DELIMITER",
  "blockly-LISTS_CREATE_WITH_ITEM_TITLE",
  "blockly-LISTS_GET_INDEX_INPUT_IN_LIST",
  "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST",
  "blockly-LISTS_INDEX_OF_INPUT_IN_LIST",
  "blockly-LISTS_SET_INDEX_INPUT_IN_LIST"
]);
  keys.push(...[
  "blockly-LOGIC_BOOLEAN_FALSE",
  "blockly-LOGIC_BOOLEAN_TOOLTIP",
  "blockly-LOGIC_BOOLEAN_TRUE",
  "blockly-LOGIC_COMPARE_EQ_ARIA",
  "blockly-LOGIC_COMPARE_GTE_ARIA",
  "blockly-LOGIC_COMPARE_GT_ARIA",
  "blockly-LOGIC_COMPARE_LTE_ARIA",
  "blockly-LOGIC_COMPARE_LT_ARIA",
  "blockly-LOGIC_COMPARE_NEQ_ARIA",
  "blockly-LOGIC_COMPARE_TOOLTIP_EQ",
  "blockly-LOGIC_COMPARE_TOOLTIP_GT",
  "blockly-LOGIC_COMPARE_TOOLTIP_GTE",
  "blockly-LOGIC_COMPARE_TOOLTIP_LT",
  "blockly-LOGIC_COMPARE_TOOLTIP_LTE",
  "blockly-LOGIC_COMPARE_TOOLTIP_NEQ",
  "blockly-LOGIC_NEGATE_TITLE",
  "blockly-LOGIC_NEGATE_TOOLTIP",
  "blockly-LOGIC_NULL_TOOLTIP",
  "blockly-LOGIC_OPERATION_AND",
  "blockly-LOGIC_OPERATION_OR",
  "blockly-LOGIC_OPERATION_TOOLTIP_AND",
  "blockly-LOGIC_OPERATION_TOOLTIP_OR",
  "blockly-LOGIC_TERNARY_CONDITION",
  "blockly-LOGIC_TERNARY_IF_FALSE",
  "blockly-LOGIC_TERNARY_IF_TRUE",
  "blockly-LOGIC_TERNARY_TOOLTIP",
  "blockly-MATH_ADDITION_SYMBOL_ARIA",
  "blockly-MATH_ARITHMETIC_TOOLTIP_ADD",
  "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE",
  "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS",
  "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY",
  "blockly-MATH_CHANGE_TITLE",
  "blockly-MATH_CHANGE_TOOLTIP",
  "blockly-MATH_CONSTRAIN_TITLE",
  "blockly-MATH_CONSTRAIN_TOOLTIP",
  "blockly-MATH_DIVISION_SYMBOL_ARIA",
  "blockly-MATH_IS_DIVISIBLE_BY",
  "blockly-MATH_IS_NEGATIVE",
  "blockly-MATH_IS_POSITIVE",
  "blockly-MATH_MODULO_TITLE",
  "blockly-MATH_MODULO_TOOLTIP",
  "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA",
  "blockly-MATH_NUMBER_TOOLTIP",
  "blockly-MATH_ONLIST_OPERATOR_MAX",
  "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA",
  "blockly-MATH_ONLIST_OPERATOR_MIN",
  "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA",
  "blockly-MATH_ONLIST_OPERATOR_RANDOM",
  "blockly-MATH_ONLIST_OPERATOR_SUM",
  "blockly-MATH_ONLIST_TOOLTIP_MAX",
  "blockly-MATH_ONLIST_TOOLTIP_MIN",
  "blockly-MATH_ONLIST_TOOLTIP_RANDOM",
  "blockly-MATH_ONLIST_TOOLTIP_SUM",
  "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM",
  "blockly-MATH_RANDOM_FLOAT_TOOLTIP",
  "blockly-MATH_RANDOM_INT_TITLE",
  "blockly-MATH_RANDOM_INT_TOOLTIP",
  "blockly-MATH_SUBTRACTION_SYMBOL_ARIA",
  "blockly-MATH_CHANGE_TITLE_ITEM"
]);
  keys.push(...[
  "blockly-PROCEDURES_ALLOW_STATEMENTS",
  "blockly-PROCEDURES_BEFORE_PARAMS",
  "blockly-PROCEDURES_CALLNORETURN_TOOLTIP",
  "blockly-PROCEDURES_CALLRETURN_TOOLTIP",
  "blockly-PROCEDURES_CALL_BEFORE_PARAMS",
  "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING",
  "blockly-PROCEDURES_CREATE_DO",
  "blockly-PROCEDURES_DEFNORETURN_COMMENT",
  "blockly-PROCEDURES_DEFNORETURN_PROCEDURE",
  "blockly-PROCEDURES_DEFNORETURN_TITLE",
  "blockly-PROCEDURES_DEFNORETURN_TOOLTIP",
  "blockly-PROCEDURES_DEFRETURN_RETURN",
  "blockly-PROCEDURES_DEFRETURN_TOOLTIP",
  "blockly-PROCEDURES_DEF_DUPLICATE_WARNING",
  "blockly-PROCEDURES_HIGHLIGHT_DEF",
  "blockly-PROCEDURES_IFRETURN_TOOLTIP",
  "blockly-PROCEDURES_IFRETURN_WARNING",
  "blockly-PROCEDURES_MUTATORARG_TITLE",
  "blockly-PROCEDURES_MUTATORARG_TOOLTIP",
  "blockly-PROCEDURES_MUTATORCONTAINER_TITLE",
  "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP",
  "blockly-PROCEDURES_DEFRETURN_COMMENT",
  "blockly-PROCEDURES_DEFRETURN_PROCEDURE",
  "blockly-PROCEDURES_DEFRETURN_TITLE"
]);
  keys.push(...[
  "blockly-TEXT_APPEND_TITLE",
  "blockly-TEXT_APPEND_TOOLTIP",
  "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE",
  "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE",
  "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE",
  "blockly-TEXT_CHANGECASE_TOOLTIP",
  "blockly-TEXT_CHARAT_FIRST",
  "blockly-TEXT_CHARAT_FROM_END",
  "blockly-TEXT_CHARAT_FROM_START",
  "blockly-TEXT_CHARAT_LAST",
  "blockly-TEXT_CHARAT_RANDOM",
  "blockly-TEXT_CHARAT_TITLE",
  "blockly-TEXT_CHARAT_TOOLTIP",
  "blockly-TEXT_COUNT_MESSAGE0",
  "blockly-TEXT_COUNT_TOOLTIP",
  "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP",
  "blockly-TEXT_CREATE_JOIN_TITLE_JOIN",
  "blockly-TEXT_CREATE_JOIN_TOOLTIP",
  "blockly-TEXT_FROM_END_ARIA",
  "blockly-TEXT_FROM_START_ARIA",
  "blockly-TEXT_GET_SUBSTRING_END_FROM_END",
  "blockly-TEXT_GET_SUBSTRING_END_FROM_START",
  "blockly-TEXT_GET_SUBSTRING_END_LAST",
  "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT",
  "blockly-TEXT_GET_SUBSTRING_START_FIRST",
  "blockly-TEXT_GET_SUBSTRING_START_FROM_END",
  "blockly-TEXT_GET_SUBSTRING_START_FROM_START",
  "blockly-TEXT_GET_SUBSTRING_TOOLTIP",
  "blockly-TEXT_INDEXOF_OPERATOR_FIRST",
  "blockly-TEXT_INDEXOF_OPERATOR_LAST",
  "blockly-TEXT_INDEXOF_TITLE",
  "blockly-TEXT_INDEXOF_TOOLTIP",
  "blockly-TEXT_ISEMPTY_TITLE",
  "blockly-TEXT_ISEMPTY_TOOLTIP",
  "blockly-TEXT_JOIN_TITLE_CREATEWITH",
  "blockly-TEXT_JOIN_TOOLTIP",
  "blockly-TEXT_LENGTH_TITLE",
  "blockly-TEXT_LENGTH_TOOLTIP",
  "blockly-TEXT_PRINT_TITLE",
  "blockly-TEXT_PRINT_TOOLTIP",
  "blockly-TEXT_PROMPT_TOOLTIP_NUMBER",
  "blockly-TEXT_PROMPT_TOOLTIP_TEXT",
  "blockly-TEXT_PROMPT_TYPE_NUMBER",
  "blockly-TEXT_PROMPT_TYPE_TEXT",
  "blockly-TEXT_REPLACE_MESSAGE0",
  "blockly-TEXT_REPLACE_TOOLTIP",
  "blockly-TEXT_REVERSE_MESSAGE0",
  "blockly-TEXT_REVERSE_TOOLTIP",
  "blockly-TEXT_TEXT_TOOLTIP",
  "blockly-TEXT_TRIM_OPERATOR_BOTH",
  "blockly-TEXT_TRIM_OPERATOR_LEFT",
  "blockly-TEXT_TRIM_OPERATOR_RIGHT",
  "blockly-TEXT_TRIM_TOOLTIP",
  "blockly-TEXT_APPEND_VARIABLE",
  "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM"
]);
  keys.push(...[
  "blockly-ANNOUNCE_MOVE_OF",
  "blockly-MOVE_BLOCK",
  "blockly-NEW_COLOUR_VARIABLE",
  "blockly-NEW_NUMBER_VARIABLE",
  "blockly-NEW_STRING_VARIABLE",
  "blockly-NEW_VARIABLE",
  "blockly-NEW_VARIABLE_TITLE",
  "blockly-NEW_VARIABLE_TYPE_TITLE",
  "blockly-NO_PARENT_ANNOUNCEMENT",
  "blockly-OPEN_BACKPACK",
  "blockly-OPEN_TRASH",
  "blockly-PARENT_BLOCKS_ANNOUNCEMENT",
  "blockly-PASTE_ALL_FROM_BACKPACK",
  "blockly-PASTE_SHORTCUT",
  "blockly-REDO",
  "blockly-REMOVE_FROM_BACKPACK",
  "blockly-RENAME_VARIABLE",
  "blockly-RENAME_VARIABLE_TITLE",
  "blockly-RESET_ZOOM",
  "blockly-TODAY",
  "blockly-UNDO",
  "blockly-UNKNOWN",
  "blockly-UNNAMED_KEY",
  "blockly-VARIABLES_DEFAULT_NAME",
  "blockly-VARIABLES_GET_CREATE_SET",
  "blockly-VARIABLES_GET_TOOLTIP",
  "blockly-VARIABLES_SET",
  "blockly-VARIABLES_SET_CREATE_GET",
  "blockly-VARIABLES_SET_TOOLTIP",
  "blockly-VARIABLE_ALREADY_EXISTS",
  "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE",
  "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER",
  "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT",
  "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY",
  "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE",
  "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO",
  "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY",
  "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE",
  "blockly-WORKSPACE_LABEL_1_STACK",
  "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE",
  "blockly-WORKSPACE_LABEL_MANY_STACKS",
  "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE",
  "blockly-WORKSPACE_LABEL_PLAIN",
  "blockly-WORKSPACE_SEARCH_CLOSE",
  "blockly-WORKSPACE_SEARCH_FIND_NEXT",
  "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS",
  "blockly-WORKSPACE_SEARCH_INPUT_LABEL",
  "blockly-WORKSPACE_SEARCH_MATCH",
  "blockly-WORKSPACE_SEARCH_NO_MATCHES",
  "blockly-WORKSPACE_SEARCH_PLACEHOLDER",
  "blockly-ZOOM_TO_FIT_ARIA_LABEL",
  "blockly-CONTROLS_FOREACH_INPUT_DO",
  "blockly-CONTROLS_FOR_INPUT_DO",
  "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF",
  "blockly-CONTROLS_IF_ELSE_TITLE_ELSE",
  "blockly-CONTROLS_IF_IF_TITLE_IF",
  "blockly-CONTROLS_IF_MSG_THEN",
  "blockly-CONTROLS_WHILEUNTIL_INPUT_DO"
]);
  keys.push(...[
  "blockly-INPUT_LABEL_CONDITION",
  "blockly-INPUT_LABEL_CONDITION_A",
  "blockly-INPUT_LABEL_CONDITION_B",
  "blockly-INPUT_LABEL_EMPTY",
  "blockly-INPUT_LABEL_END_STATEMENT",
  "blockly-INPUT_LABEL_INDEX",
  "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM",
  "blockly-INPUT_LABEL_LISTS_DELIMITER",
  "blockly-INPUT_LABEL_LISTS_END_POSITION",
  "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT",
  "blockly-INPUT_LABEL_LISTS_POSITION",
  "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM",
  "blockly-INPUT_LABEL_LISTS_REPEAT_NUM",
  "blockly-INPUT_LABEL_LISTS_START_POSITION",
  "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST",
  "blockly-INPUT_LABEL_LISTS_TO_CHANGE",
  "blockly-INPUT_LABEL_LISTS_TO_CHECK",
  "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET",
  "blockly-INPUT_LABEL_LOOP_BY",
  "blockly-INPUT_LABEL_LOOP_FROM",
  "blockly-INPUT_LABEL_LOOP_LIST",
  "blockly-INPUT_LABEL_LOOP_TIMES",
  "blockly-INPUT_LABEL_LOOP_TO",
  "blockly-INPUT_LABEL_MATH_CHANGE_BY",
  "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE",
  "blockly-INPUT_LABEL_MATH_DIVIDEND",
  "blockly-INPUT_LABEL_MATH_DIVISOR",
  "blockly-INPUT_LABEL_NUMBER",
  "blockly-INPUT_LABEL_NUMBER_A",
  "blockly-INPUT_LABEL_NUMBER_ATAN2_X",
  "blockly-INPUT_LABEL_NUMBER_ATAN2_Y",
  "blockly-INPUT_LABEL_NUMBER_B",
  "blockly-INPUT_LABEL_NUMBER_LIST",
  "blockly-INPUT_LABEL_NUMBER_MAX",
  "blockly-INPUT_LABEL_NUMBER_MIN",
  "blockly-INPUT_LABEL_NUMBER_TO_CHECK",
  "blockly-INPUT_LABEL_STATEMENT",
  "blockly-INPUT_LABEL_TEXT_APPEND",
  "blockly-INPUT_LABEL_TEXT_END_POSITION",
  "blockly-INPUT_LABEL_TEXT_JOIN_ITEM",
  "blockly-INPUT_LABEL_TEXT_POSITION",
  "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE",
  "blockly-INPUT_LABEL_TEXT_START_POSITION",
  "blockly-INPUT_LABEL_TEXT_TO_CHANGE",
  "blockly-INPUT_LABEL_TEXT_TO_CHECK",
  "blockly-INPUT_LABEL_TEXT_TO_FIND",
  "blockly-INPUT_LABEL_TEXT_TO_REPLACE",
  "blockly-INPUT_LABEL_VALUE",
  "blockly-INPUT_LABEL_VALUE_A",
  "blockly-INPUT_LABEL_VALUE_B",
  "blockly-INPUT_LABEL_VARIABLES_SET"
]);
  keys.push(...[
  "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT",
  "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT",
  "blockly-KEYBOARD_NAV_COPIED_HINT",
  "blockly-KEYBOARD_NAV_CUT_HINT",
  "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT",
  "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT",
  "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT",
  "blockly-MINIMAP_ARIA_LABEL",
  "blockly-SCREENREADER_HINT",
  "blockly-SCREENREADER_MODE_DISABLED",
  "blockly-SCREENREADER_MODE_ENABLED",
  "blockly-SHORTCUTS_ABORT_MOVE",
  "blockly-SHORTCUTS_CLEANUP",
  "blockly-SHORTCUTS_CODE_NAVIGATION",
  "blockly-SHORTCUTS_DISCONNECT",
  "blockly-SHORTCUTS_DUPLICATE",
  "blockly-SHORTCUTS_EDITING",
  "blockly-SHORTCUTS_ESCAPE",
  "blockly-SHORTCUTS_EXTENDED_INFORMATION",
  "blockly-SHORTCUTS_FINISH_MOVE",
  "blockly-SHORTCUTS_FOCUS_TOOLBOX",
  "blockly-SHORTCUTS_FOCUS_WORKSPACE",
  "blockly-SHORTCUTS_GENERAL",
  "blockly-SHORTCUTS_INFORMATION",
  "blockly-SHORTCUTS_JUMP_BLOCK_END",
  "blockly-SHORTCUTS_JUMP_BLOCK_START",
  "blockly-SHORTCUTS_JUMP_BOTTOM_STACK",
  "blockly-SHORTCUTS_JUMP_FIRST_BLOCK",
  "blockly-SHORTCUTS_JUMP_LAST_BLOCK",
  "blockly-SHORTCUTS_JUMP_NEXT_PAGE",
  "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE",
  "blockly-SHORTCUTS_JUMP_TOP_STACK",
  "blockly-SHORTCUTS_MOVE_DOWN",
  "blockly-SHORTCUTS_MOVE_LEFT",
  "blockly-SHORTCUTS_MOVE_RIGHT",
  "blockly-SHORTCUTS_MOVE_UP",
  "blockly-SHORTCUTS_NEXT_HEADING",
  "blockly-SHORTCUTS_NEXT_STACK",
  "blockly-SHORTCUTS_PERFORM_ACTION",
  "blockly-SHORTCUTS_PREVIOUS_HEADING",
  "blockly-SHORTCUTS_PREVIOUS_STACK",
  "blockly-SHORTCUTS_SCROLL_DOWN",
  "blockly-SHORTCUTS_SCROLL_LEFT",
  "blockly-SHORTCUTS_SCROLL_RIGHT",
  "blockly-SHORTCUTS_SCROLL_UP",
  "blockly-SHORTCUTS_SHOW_CONTEXT_MENU",
  "blockly-SHORTCUTS_SHOW_TOOLTIP",
  "blockly-SHORTCUTS_START_MOVE",
  "blockly-SHORTCUTS_START_MOVE_STACK",
  "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE"
]);
  keys.push(...[
  "blockly-MATH_ARITHMETIC_TOOLTIP_POWER",
  "blockly-MATH_CONSTANT_INFINITY_ARIA",
  "blockly-MATH_CONSTANT_SQRT1_2_ARIA",
  "blockly-MATH_CONSTANT_SQRT2_ARIA",
  "blockly-MATH_CONSTANT_TOOLTIP",
  "blockly-MATH_IS_EVEN",
  "blockly-MATH_IS_ODD",
  "blockly-MATH_IS_PRIME",
  "blockly-MATH_IS_WHOLE",
  "blockly-MATH_IS_TOOLTIP",
  "blockly-MATH_POWER_SYMBOL_ARIA",
  "blockly-MATH_ROUND_OPERATOR_ROUND",
  "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN",
  "blockly-MATH_ROUND_OPERATOR_ROUNDUP",
  "blockly-MATH_ROUND_TOOLTIP",
  "blockly-MATH_SINGLE_OP_ABSOLUTE",
  "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA",
  "blockly-MATH_SINGLE_OP_EXP_ARIA",
  "blockly-MATH_SINGLE_OP_NEG_ARIA",
  "blockly-MATH_SINGLE_OP_POW10_ARIA",
  "blockly-MATH_SINGLE_OP_ROOT",
  "blockly-MATH_SINGLE_TOOLTIP_ABS",
  "blockly-MATH_SINGLE_TOOLTIP_EXP",
  "blockly-MATH_SINGLE_TOOLTIP_NEG",
  "blockly-MATH_SINGLE_TOOLTIP_POW10",
  "blockly-MATH_SINGLE_TOOLTIP_ROOT"
]);
  keys.push(...[
  "blockly-MATH_ATAN2_TITLE",
  "blockly-MATH_ATAN2_TOOLTIP",
  "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA",
  "blockly-MATH_ONLIST_OPERATOR_AVERAGE",
  "blockly-MATH_ONLIST_OPERATOR_MEDIAN",
  "blockly-MATH_ONLIST_OPERATOR_MODE",
  "blockly-MATH_ONLIST_OPERATOR_STD_DEV",
  "blockly-MATH_ONLIST_TOOLTIP_AVERAGE",
  "blockly-MATH_ONLIST_TOOLTIP_MEDIAN",
  "blockly-MATH_ONLIST_TOOLTIP_MODE",
  "blockly-MATH_ONLIST_TOOLTIP_STD_DEV",
  "blockly-MATH_SINGLE_OP_LN_ARIA",
  "blockly-MATH_SINGLE_OP_LOG10_ARIA",
  "blockly-MATH_SINGLE_TOOLTIP_LN",
  "blockly-MATH_SINGLE_TOOLTIP_LOG10",
  "blockly-MATH_TRIG_ACOS_ARIA",
  "blockly-MATH_TRIG_ASIN_ARIA",
  "blockly-MATH_TRIG_ATAN_ARIA",
  "blockly-MATH_TRIG_COS_ARIA",
  "blockly-MATH_TRIG_SIN_ARIA",
  "blockly-MATH_TRIG_TAN_ARIA",
  "blockly-MATH_TRIG_TOOLTIP_ACOS",
  "blockly-MATH_TRIG_TOOLTIP_ASIN",
  "blockly-MATH_TRIG_TOOLTIP_ATAN",
  "blockly-MATH_TRIG_TOOLTIP_COS",
  "blockly-MATH_TRIG_TOOLTIP_SIN",
  "blockly-MATH_TRIG_TOOLTIP_TAN"
]);
  keys.push(...[
  "external-link-rules",
  "external-link-rules-description",
  "external-link-identifier-aliases",
  "card-field-visibility-desc",
  "r-blocks-view",
  "r-blocks-help",
  "r-blocks-discard",
  "r-blocks-unavailable",
  "r-blocks-invalid",
  "r-blocks-conflict",
  "r-blocks-permission",
  "r-blocks-unsaved",
  "r-blocks-saved",
  "r-blocks-reload",
  "board-view-product-backlog",
  "board-view-sprints",
  "board-view-sprint-report",
  "board-view-velocity",
  "scrum-settings",
  "scrum-product-owner",
  "scrum-master",
  "scrum-developers",
  "scrum-working-days",
  "scrum-enabled",
  "scrum-product-goal",
  "scrum-definition-of-done",
  "scrum-estimate-source",
  "scrum-estimate-unit",
  "scrum-completion-policy",
  "scrum-source-poker",
  "scrum-source-customField",
  "scrum-policy-dueComplete",
  "scrum-policy-doneLists",
  "scrum-sprints",
  "scrum-sprint",
  "scrum-start-sprint",
  "scrum-close-sprint",
  "scrum-cancel-sprint"
]);
  keys.push(...[
  "scrum-rollover-sprint",
  "scrum-cancel-reason",
  "scrum-product-backlog",
  "scrum-edit-sprint",
  "scrum-sprint-goal",
  "scrum-capacity",
  "scrum-new-sprint",
  "scrum-releases",
  "scrum-release",
  "scrum-release-scope",
  "scrum-releases-select-help",
  "scrum-select-sprint",
  "scrum-backlog",
  "scrum-backlog-help",
  "scrum-estimate",
  "scrum-backlog-rank",
  "scrum-issue-type",
  "scrum-acceptance-criteria",
  "scrum-events",
  "scrum-event-kind",
  "scrum-timebox",
  "scrum-notes",
  "scrum-event-planning",
  "scrum-event-daily",
  "scrum-event-review",
  "scrum-event-retrospective",
  "scrum-committed",
  "scrum-completed",
  "scrum-added",
  "scrum-removed",
  "scrum-incomplete",
  "scrum-no-closed-sprints",
  "scrum-report-help",
  "scrum-total",
  "scrum-state-planned",
  "scrum-state-active",
  "scrum-state-closed",
  "scrum-state-cancelled",
  "scrum-unknown-estimate",
  "scrum-confirm-close",
  "scrum-confirm-cancel",
  "scrum-past-sprints",
  "scrum-list-category",
  "scrum-swimlane-purpose",
  "scrum-category-backlog",
  "scrum-category-todo",
  "scrum-category-doing",
  "scrum-category-done",
  "scrum-partial-report",
  "scrum-state-released"
]);
  keys.push(...[
  "scrum-released-at",
  "scrum-follow-up-cards",
  "scrum-import-reference-omitted",
  "scrum-partial-snapshot",
  "scrum-resume-close",
  "scrum-daily-observations",
  "scrum-daily-observations-help",
  "scrum-daily-truncated",
  "scrum-daily-empty",
  "scrum-observed-scope",
  "scrum-daily-observations-export-help",
  "scrum-import-pending",
  "scrum-import-into-board",
  "scrum-import-into-board-hint",
  "scrum-import-preview",
  "scrum-import-choose-file",
  "scrum-import-invalid-file",
  "scrum-import-preview-sprints",
  "scrum-import-preview-releases",
  "scrum-import-preview-cards",
  "scrum-import-preview-nothing",
  "scrum-import-into-board-done",
  "scrum-import-card-not-matched",
  "scrum-import-card-ambiguous",
  "scrum-import-card-on-another-board",
  "scrum-import-record-ambiguous",
  "scrum-import-record-not-imported",
  "scrum-import-sprint-finished",
  "sync-conflict-heading",
  "sync-conflict-hint",
  "sync-conflict-local",
  "sync-conflict-keep-local",
  "sync-conflict-use-source",
  "sync-conflict-refresh",
  "sync-conflict-review-complete"
]);
  keys.push(...[
  "sync-conflict-duplicate",
  "sync-conflict-keep-mapping",
  "sync-conflict-detach",
  "sync-conflict-detach-hint",
  "sync-conflict-archive",
  "sync-conflict-archive-hint",
  "sync-conflict-keep-card-local",
  "sync-conflict-creation",
  "sync-conflict-creation-hint",
  "sync-conflict-create-replacement",
  "sync-preview-button",
  "sync-preview-heading",
  "sync-preview-saved",
  "sync-preview-unavailable",
  "sync-preview-blocked",
  "sync-preview-create",
  "sync-preview-update",
  "sync-preview-archive",
  "sync-preview-baseline",
  "sync-preview-truncated",
  "sync-preview-omissions",
  "sync-preview-scope",
  "sync-preview-excluded",
  "sync-preview-unmapped",
  "sync-preview-parser-warnings"
]);
  keys.push(...[
  "sync-preview-parser-unsupported",
  "sync-source-heading",
  "sync-source-scope",
  "sync-source-unmapped",
  "sync-source-excluded",
  "sync-source-converted",
  "sync-source-fallback",
  "sync-source-excluded-item",
  "sync-source-occurrences",
  "sync-source-truncated",
  "sync-source-omitted",
  "sync-report-button",
  "sync-report-retention",
  "sync-report-partial",
  "sync-report-unfinished",
  "sync-report-failed",
  "sync-report-completed",
  "sync-report-completed-with-warnings",
  "sync-report-skipped",
  "sync-report-review-only",
  "sync-report-unavailable",
  "sync-report-empty",
  "sync-recovery-heading",
  "sync-recovery-description",
  "sync-recovery-unavailable",
  "sync-recovery-all",
  "sync-estimate-field",
  "sync-estimate-field-hint",
  "email-failure-smtp-temporary",
  "email-failure-smtp-rejected"
]);
  keys.push(...[
  "email-failure-smtp-authentication",
  "email-failure-smtp-configuration",
  "email-failure-recipient-unavailable",
  "email-failure-delivery-unconfirmed",
  "email-failure-acknowledgement-failed",
  "email-failure-delivery-failed",
  "email-failure-retry-limit",
  "sync-original-time",
  "sync-remaining-time",
  "sync-time-estimate-hint",
  "sync-planning-sprint",
  "sync-planning-releases",
  "sync-planning-fields",
  "sync-planning-hint",
  "activity-recovery-heading",
  "activity-recovery-description",
  "activity-recovery-empty",
  "activity-recovery-unavailable",
  "activity-recovery-retry",
  "activity-recovery-retrying",
  "activity-recovery-status-pending",
  "activity-recovery-status-preparing",
  "activity-recovery-status-processing",
  "activity-recovery-status-missing",
  "activity-recovery-status-changed"
]);
  keys.push(...[
  "activity-recovery-status-invalid",
  "activity-recovery-status-inconsistent",
  "activity-recovery-busy",
  "activity-recovery-denied",
  "activity-recovery-source-unavailable",
  "activity-recovery-disabled",
  "activity-recovery-failed",
  "activity-recovery-pause",
  "activity-recovery-resume",
  "activity-recovery-paused",
  "activity-recovery-control-conflict",
  "activity-recovery-control-failed",
  "activity-recovery-status-cancelled",
  "activity-recovery-cancel",
  "activity-recovery-cancel-confirm",
  "rule-email-recovery-unavailable",
  "stuck-sync-operation-heading",
  "stuck-sync-operation-description",
  "stuck-sync-operation-list",
  "stuck-sync-operation-progress",
  "stuck-sync-operation-reason",
  "stuck-sync-operation-applied",
  "stuck-sync-operation-reason-scope-changed",
  "stuck-sync-operation-reason-access-denied",
  "stuck-sync-operation-reason-trigger-unknown"
]);
  keys.push(...[
  "stuck-sync-operation-reason-intent-missing",
  "stuck-sync-operation-reason-unknown",
  "stuck-sync-operation-replayable-now",
  "stuck-sync-operation-discard",
  "stuck-sync-operation-discard-confirm",
  "stuck-sync-operation-refresh",
  "stuck-sync-operation-empty",
  "stuck-sync-operation-truncated",
  "stuck-sync-operation-unavailable",
  "stuck-sync-operation-missing",
  "stuck-sync-operation-not-stuck",
  "stuck-sync-operation-replayable",
  "stuck-sync-operation-busy",
  "stuck-sync-operation-failed",
  "interrupted-import-heading",
  "interrupted-import-description",
  "interrupted-import-board",
  "interrupted-import-progress",
  "interrupted-import-created",
  "interrupted-import-source",
  "interrupted-import-state-stopped",
  "interrupted-import-state-failed",
  "interrupted-import-state-discarding",
  "interrupted-import-scrum",
  "interrupted-import-counts"
]);
  keys.push(...[
  "interrupted-import-no-board",
  "interrupted-import-keep",
  "interrupted-import-discard",
  "interrupted-import-keep-confirm",
  "interrupted-import-discard-confirm",
  "interrupted-import-refresh",
  "interrupted-import-empty",
  "interrupted-import-truncated",
  "interrupted-import-unavailable",
  "interrupted-import-missing",
  "interrupted-import-not-interrupted",
  "interrupted-import-foreign-board",
  "interrupted-import-scrum-busy",
  "interrupted-import-failed",
  "scrum-history-checkpoint-stuck",
  "scrum-history-checkpoint-counts",
  "scrum-history-checkpoint-hint",
  "scrum-history-checkpoint-rollback",
  "scrum-history-checkpoint-discard",
  "scrum-history-checkpoint-discard-confirm",
  "scrum-history-checkpoint-ask-admin",
  "login-setting-env-only"
]);
  keys.push(...[
  "import-board-instruction-opml",
  "import-board-instruction-orgmode",
  "import-board-instruction-todoist",
  "import-board-instruction-planner",
  "import-board-instruction-meistertask",
  "import-board-instruction-obsidian",
  "import-board-instruction-linear",
  "import-board-instruction-ticktick"
]);
  keys.push(...[
  "import-board-instruction-clickup",
  "import-board-instruction-nullboard",
  "import-board-instruction-kanri",
  "import-board-instruction-pivotal",
  "import-board-instruction-tasksorg",
  "import-board-instruction-monday",
  "import-board-instruction-superproductivity",
  "import-board-instruction-taiga",
  "import-board-instruction-vikunja"
]);
  keys.push(...[
  "import-board-instruction-quire",
  "import-board-instruction-wrike",
  "import-board-instruction-teamwork",
  "import-board-instruction-businessmap",
  "import-board-instruction-redmine",
  "import-board-instruction-notion",
  "import-board-instruction-plane"
]);
  keys.push(...[
  "blockly-ALT_KEY",
  "blockly-BACKSPACE_KEY",
  "blockly-CAPS_LOCK_KEY",
  "blockly-COMMAND_KEY",
  "blockly-CONTEXT_MENU_KEY",
  "blockly-CONTROL_KEY",
  "blockly-END_KEY",
  "blockly-ENTER_KEY",
  "blockly-ESCAPE",
  "blockly-HOME_KEY",
  "blockly-INSERT_KEY",
  "blockly-OPTION_KEY",
  "blockly-PAGE_DOWN_KEY",
  "blockly-PAGE_UP_KEY",
  "blockly-PAUSE_KEY",
  "blockly-SHIFT_KEY",
  "blockly-SPACE_KEY",
  "blockly-TAB_KEY"
]);
  for (const language of ['zu', 'zu-ZA']) {
    const locale = read(language);
    for (const key of keys) {
      assert.notStrictEqual(locale[key], source[key], `${language}:${key}`);
      assert.deepStrictEqual(translationTokens(locale[key]), translationTokens(source[key]), `${language}:${key}`);
    }
    assert.match(locale['read-only-field'], /abaphathi bebhodi kuphela abangalishintsha/);
    assert.match(locale['r-remove-all-assignees'], /Susa bonke.*ekhadini/);
    assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'], /kuphela ngaphakathi kweluphu/);
    assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'], /phakathi kuka-0 no-100/);
    assert.match(locale['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
    assert.match(locale['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
    assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /inani lingamanga/);
    assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /inani liyiqiniso/);
    assert.notStrictEqual(locale['blockly-FIELD_BITMAP_PIXEL_OFF'], locale['blockly-FIELD_BITMAP_PIXEL_ON']);
    const deletion = locale['blockly-DELETE_VARIABLE_CONFIRMATION'].replace('%1', '3').replace('%2', 'counter');
    assert.match(deletion, /3.*'counter'/);
    assert.doesNotMatch(deletion, /%[12]/);
    const pixel = locale['blockly-FIELD_BITMAP_PIXEL_LABEL'].replace('%1', 'kuvuliwe').replace('%2', '4').replace('%3', '7');
    assert.match(pixel, /kuvuliwe.*umugqa 4.*ikholomu 7/);
    for (const suffix of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
      assert.match(locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_' + suffix], /^Ibuyisa/);
      assert.match(locale['blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_' + suffix], /^Isusa/);
      assert.match(locale['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_' + suffix], /^Isusa futhi ibuyise/);
    }
    assert.match(locale['blockly-LISTS_INDEX_OF_TOOLTIP'], /%1 uma into ingatholakali/);
    assert.match(locale['blockly-LISTS_SORT_ORDER_ASCENDING'], /ngokwenyuka/);
    assert.match(locale['blockly-LISTS_SORT_ORDER_DESCENDING'], /ngokwehla/);
    const repeat = locale['blockly-LISTS_REPEAT_TITLE'].replace('%1', 'sample').replace('%2', '5');
    assert.match(repeat, /sample.*izikhathi ezingu-5/);
    assert.doesNotMatch(repeat, /%[12]/);
    for (const key of ['blockly-LISTS_GET_INDEX_FROM_START', 'blockly-LISTS_GET_INDEX_TAIL', 'blockly-LISTS_GET_SUBLIST_TAIL', 'blockly-LISTS_HUE']) {
      assert.strictEqual(locale[key], source[key], key + ': retain non-prose configuration');
    }
    assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /kokubili/);
    assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /okungenani okukodwa/);
    for (const suffix of ['CONDITION', 'IF_FALSE', 'IF_TRUE']) {
      assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes("'" + locale['blockly-LOGIC_TERNARY_' + suffix] + "'"));
    }
    assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0 \(efakiwe\).*1\.0 \(ongafakiwe\)/);
    assert.match(locale['blockly-MATH_RANDOM_INT_TOOLTIP'], /kufaka nemikhawulo uqobo/);
    assert.match(locale['blockly-MATH_IS_NEGATIVE'], /ingaphansi/);
    assert.match(locale['blockly-MATH_IS_POSITIVE'], /ingaphezu/);
    const constrain = locale['blockly-MATH_CONSTRAIN_TITLE'].replace('%1', 'value').replace('%2', '2').replace('%3', '8');
    assert.match(constrain, /value.*2.*8/);
    assert.doesNotMatch(constrain, /%[123]/);
    for (const key of ['LOGIC_NULL', 'MATH_ADDITION_SYMBOL', 'MATH_DIVISION_SYMBOL', 'MATH_MULTIPLICATION_SYMBOL', 'MATH_SUBTRACTION_SYMBOL']) {
      assert.strictEqual(locale['blockly-' + key], source['blockly-' + key]);
    }
    assert.match(locale['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /ongabuyisi mphumela/);
    assert.match(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /obuyisa umphumela/);
    assert.match(locale['blockly-PROCEDURES_IFRETURN_WARNING'], /kuphela ngaphakathi kwencazelo yomsebenzi/);
    assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /likhutshaziwe/);
    const call = locale['blockly-PROCEDURES_CALLRETURN_TOOLTIP'].replace('%1', 'calculate');
    assert.match(call, /'calculate'.*umphumela wawo/);
    assert.doesNotMatch(call, /%1/);
    for (const key of ['blockly-PROCEDURES_DEFNORETURN_DO', 'blockly-PROCEDURES_DEFRETURN_DO']) assert.strictEqual(locale[key], '');
    assert.match(locale['blockly-TEXT_LENGTH_TOOLTIP'], /kufaka nezikhala/);
    assert.match(locale['blockly-TEXT_INDEXOF_TOOLTIP'], /%1 uma umbhalo ungatholakali/);
    assert.match(locale['blockly-TEXT_TRIM_OPERATOR_LEFT'], /lwesobunxele/);
    assert.match(locale['blockly-TEXT_TRIM_OPERATOR_RIGHT'], /lwesokudla/);
    assert.match(locale['blockly-TEXT_REPLACE_TOOLTIP'], /konke ukuvela/);
    const replacement = locale['blockly-TEXT_REPLACE_MESSAGE0'].replace('%1', 'old').replace('%2', 'new').replace('%3', 'text');
    assert.match(replacement, /old.*new.*text/);
    assert.doesNotMatch(replacement, /%[123]/);
    for (const key of ['blockly-TEXT_CHARAT_TAIL', 'blockly-TEXT_GET_SUBSTRING_TAIL']) assert.strictEqual(locale[key], '');
    const conflict = locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'].replace('%1', 'counter').replace('%2', 'Number');
    assert.match(conflict, /'counter'.*'Number'/);
    assert.doesNotMatch(conflict, /%[12]/);
    const comments = locale['blockly-WORKSPACE_CONTENTS_COMMENTS_MANY'].replace('%1', '3');
    assert.match(comments, /^ /);
    const workspace = locale['blockly-WORKSPACE_CONTENTS_BLOCKS_MANY'].replace('%1', '2').replace('%2', comments);
    assert.match(workspace, /2 namazwana angu-3/);
    assert.doesNotMatch(workspace, /%[12]/);
    for (const literal of ['Enter', 'Shift+Enter', 'Escape']) assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(literal));
    assert.match(locale['blockly-WORKSPACE_SEARCH_NO_MATCHES'], /^Awekho/);
    assert.strictEqual(locale['blockly-CONTROLS_IF_IF_TITLE_IF'], locale['blockly-CONTROLS_IF_MSG_IF']);
    assert.strictEqual(locale['blockly-CONTROLS_IF_ELSE_TITLE_ELSE'], locale['blockly-CONTROLS_IF_MSG_ELSE']);
    for (const [first, second] of [['CONDITION_A', 'CONDITION_B'], ['LISTS_START_POSITION', 'LISTS_END_POSITION'], ['NUMBER_MIN', 'NUMBER_MAX'], ['MATH_DIVIDEND', 'MATH_DIVISOR'], ['TEXT_TO_FIND', 'TEXT_TO_REPLACE']]) {
      assert.notStrictEqual(locale['blockly-INPUT_LABEL_' + first], locale['blockly-INPUT_LABEL_' + second]);
    }
    assert.match(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], /ehlukaniswayo/);
    assert.match(locale['blockly-INPUT_LABEL_MATH_DIVISOR'], /okuhlukaniswa ngayo/);
    assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'], /ka-x$/);
    assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'], /ka-y$/);
    const input = locale['blockly-INPUT_LABEL_INDEX'].replace('%1', '7');
    assert.match(input, /7$/);
    assert.doesNotMatch(input, /%1/);
    assert.match(locale['blockly-SCREENREADER_MODE_DISABLED'], /ivaliwe.*%1 ukuyivula/);
    assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'], /ivuliwe.*%1 ukuyivala/);
    assert.match(locale['blockly-SHORTCUTS_MOVE_LEFT'], /kwesobunxele/);
    assert.match(locale['blockly-SHORTCUTS_MOVE_RIGHT'], /kwesokudla/);
    assert.match(locale['blockly-SHORTCUTS_ABORT_MOVE'], /^Khansela/);
    assert.match(locale['blockly-SHORTCUTS_FINISH_MOVE'], /^Qedela/);
    const movement = locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'].replace('%1', 'Shift').replace('%2', 'Enter');
    assert.match(movement, /Bamba u-Shift.*u-Enter ukwamukela/);
    assert.doesNotMatch(movement, /%[12]/);
    for (const literal of ['π (3.141…)', 'e (2.718…)', 'φ (1.618…)', 'sqrt(2) (1.414…)', 'sqrt(½) (0.707…)', '∞']) assert.ok(locale['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
    assert.match(locale['blockly-MATH_IS_EVEN'], /^ihlukaniseka ngo-2 ngaphandle kwensalela$/);
    assert.match(locale['blockly-MATH_IS_ODD'], /^ayihlukaniseki ngo-2 ngaphandle kwensalela$/);
    assert.match(locale['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'], /phansi$/);
    assert.match(locale['blockly-MATH_ROUND_OPERATOR_ROUNDUP'], /phezulu$/);
    assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_NEG'], /enophawu oluphambene/);
    assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_ABS'], /ngaphandle kophawu/);
    for (const fn of ['COS', 'SIN', 'TAN']) assert.match(locale['blockly-MATH_TRIG_TOOLTIP_' + fn], /ngamadigri \(hhayi ngamaradiyani\)/);
    for (const fn of ['ACOS', 'ASIN', 'ATAN', 'COS', 'SIN', 'TAN']) assert.strictEqual(locale['blockly-MATH_TRIG_' + fn], source['blockly-MATH_TRIG_' + fn]);
    assert.match(locale['blockly-MATH_ONLIST_OPERATOR_AVERAGE'], /^inanimaphakathi/);
    assert.match(locale['blockly-MATH_ONLIST_OPERATOR_MEDIAN'], /^imaphakathi/);
    assert.match(locale['blockly-MATH_ONLIST_OPERATOR_MODE'], /^imvelakaningi/);
    assert.match(locale['blockly-MATH_SINGLE_OP_LOG10_ARIA'], /esisekelo esingu-10/);
    const point = locale['blockly-MATH_ATAN2_TITLE'].replace('%1', '3').replace('%2', '4');
    assert.match(point, /atan2.*X:3 Y:4/);
    assert.doesNotMatch(point, /%[12]/);
    const linkKey = 'external-link-rules-description';
    assert.deepStrictEqual(locale[linkKey].match(/\{(?:identifier|number)\}/g), source[linkKey].match(/\{(?:identifier|number)\}/g));
    assert.ok(locale[linkKey].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
    for (const literal of ['{identifier}', 'TK=Task', 'IN=Incident']) assert.ok(locale['external-link-identifier-aliases'].includes(literal));
    assert.match(locale['card-field-visibility-desc'], /Ayikho idatha yekhadi.*esishintshayo/);
    assert.match(locale['r-blocks-invalid'], /esisodwa kuphela.*esisodwa/);
    assert.match(locale['r-blocks-permission'], /imvume yomphathi webhodi/);
    assert.match(locale['r-blocks-conflict'], /Layisha kabusha.*ngaphambi kokulondoloza/);
    assert.match(locale['scrum-close-sprint'], /^Vala/);
    assert.match(locale['scrum-cancel-sprint'], /^Khansela/);
    for (const key of ['Ctrl', 'Cmd', 'Mac']) assert.ok(locale['scrum-releases-select-help'].includes(key));
    assert.match(locale['scrum-report-help'], /akuzona izilinganiso zikaziro/);
    assert.match(locale['scrum-partial-report'], /kuphela amakhadi owabelwe wona/);
    assert.match(locale['scrum-confirm-close'], /azothuthelwa endaweni ekhethiwe/);
    assert.match(locale['scrum-confirm-cancel'], /ahlala eyingxenye yayo aze abelwe/);
    const totals = locale['scrum-total'].replace('__count__', '4').replace('__estimate__', '12').replace('__unknown__', '1');
    assert.match(totals, /4.*12.*1/);
    assert.doesNotMatch(totals, /__\w+__/);
    assert.notStrictEqual(locale['scrum-state-closed'], locale['scrum-state-cancelled']);
    for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
      assert.ok(locale[key].includes('UTC'));
      assert.match(locale[key], /azizona uziro/);
      assert.match(locale[key], /izinsuku ezingekho azifakwa/i);
    }
    assert.match(locale['scrum-daily-truncated'], /366/);
    assert.match(locale['scrum-import-into-board-hint'], /akuphindwa/);
    assert.match(locale['scrum-import-card-on-another-board'], /lishiywe lingashintshiwe/);
    assert.match(locale['sync-conflict-hint'], /Akukho okuthunyelwa kusistimu yomthombo/);
    assert.match(locale['sync-conflict-review-complete'], /uhlu lonke akuzange kuqaliswe/);
    const preview = locale['scrum-import-preview-cards'].replace('__updated__', '2').replace('__unchanged__', '3').replace('__unmatched__', '4');
    assert.match(preview, /2.*3.*4/);
    assert.doesNotMatch(preview, /__\w+__/);
    assert.match(locale['sync-conflict-detach-hint'], /Susa kuphela.*kuhlala ku-WeKan/);
    assert.match(locale['sync-conflict-archive-hint'], /Amakhadi angaphansi awashintshwa/);
    assert.match(locale['sync-conflict-creation-hint'], /langaphambili lingashintshiwe.*Ukuzama futhi kusebenzisa/);
    assert.match(locale['sync-preview-unavailable'], /Londoloza.*ngaphambi/);
    assert.match(locale['sync-preview-blocked'], /Xazulula ukungqubuzana.*ngaphambi/);
    assert.match(locale['sync-preview-truncated'], /kokuqala okungu-100/);
    assert.match(locale['sync-preview-scope'], /ingase ingafakwa/);
    assert.match(locale['sync-source-scope'], /amanani azo awaboniswa/);
    assert.match(locale['sync-source-truncated'], /100/);
    assert.match(locale['sync-report-retention'], /20.*30/);
    assert.match(locale['sync-report-partial'], /ayiqhubeki.*ayihlehlisi/);
    assert.match(locale['sync-recovery-description'], /ungase usaqhubeka noma uphazamisekile/);
    assert.match(locale['sync-report-unavailable'], /imvume yokubhala kulo lonke uhlu/);
    for (const literal of ['Jira', 'ID', 'null']) assert.ok(locale['sync-estimate-field-hint'].includes(literal));
    assert.match(locale['sync-estimate-field-hint'], /angekho awanakwa.*null.*lisula/);
    assert.match(locale['email-failure-smtp-temporary'], /kwesikhashana.*SMTP/);
    assert.match(locale['email-failure-smtp-rejected'], /unomphela.*SMTP/);
    assert.match(locale['email-failure-delivery-unconfirmed'], /buyekeza ngaphambi kokuzama futhi/);
    assert.match(locale['sync-time-estimate-hint'], /eyodwa kuphela.*angekho awanakwa.*null.*lisula/);
    assert.match(locale['sync-planning-hint'], /kuphela uma i-Scrum ivuliwe/);
    assert.match(locale['sync-planning-hint'], /kuqala nge-ID yomthombo, bese kuba ngegama/);
    assert.match(locale['sync-planning-hint'], /kokuqala akukaze kususe ukuhlela/);
    assert.match(locale['activity-recovery-description'], /akukaze kudale kabusha umsebenzi/);
    assert.notStrictEqual(locale['activity-recovery-status-missing'], locale['activity-recovery-status-changed']);
    assert.match(locale['activity-recovery-cancel-confirm'], /unomphela.*ngeke kuqhutshwe futhi.*azibuyiswa/);
    assert.match(locale['activity-recovery-failed'], /osalindile ugciniwe/);
    assert.match(locale['activity-recovery-source-unavailable'], /Akukho okudalwe kabusha/);
    assert.match(locale['stuck-sync-operation-description'], /esezisetshenzisiwe ziyahlala.*azibhalwa nhlobo/);
    assert.match(locale['stuck-sync-operation-reason-access-denied'], /akasenayo/);
    const applied = locale['stuck-sync-operation-applied'].replace('__applied__', '2').replace('__total__', '5');
    assert.match(applied, /2.*5/);
    assert.doesNotMatch(applied, /__\w+__/);
    assert.match(locale['stuck-sync-operation-discard-confirm'], /esezisetshenzisiwe ziyahlala.*azibhalwa nhlobo/);
    assert.match(locale['stuck-sync-operation-truncated'], /emidala kakhulu engu-50/);
    assert.match(locale['stuck-sync-operation-replayable'], /awulahlwanga/);
    assert.match(locale['interrupted-import-description'], /akukwazi ukuqhutshwa.*ifayela lomthombo aligcinwa/);
    assert.match(locale['interrupted-import-description'], /kufaka noma yini eyengezwe kulo/);
    let counts = locale['interrupted-import-counts'];
    ['swimlanes', 'lists', 'cards', 'checklists', 'comments', 'attachments'].forEach((name, index) => { counts = counts.replace('__' + name + '__', String(index + 1)); });
    assert.match(counts, /1.*2.*3.*4.*5.*6/);
    assert.doesNotMatch(counts, /__\w+__/);
    assert.match(locale['interrupted-import-keep-confirm'], /Akukho okususwayo/);
    assert.match(locale['interrupted-import-discard-confirm'], /kususwa unomphela/);
    assert.match(locale['interrupted-import-foreign-board'], /alidalwanga.*alithintwanga/);
    assert.match(locale['scrum-history-checkpoint-hint'], /kuphela uma kungekho omunye umuntu/);
    assert.match(locale['scrum-history-checkpoint-hint'], /akushintshi amarekhodi/);
    assert.match(locale['login-setting-env-only'], /yeseva kuphela.*kufundwe kuphela/);
    let checkpoint = locale['scrum-history-checkpoint-counts'];
    ['applied', 'total', 'pending', 'conflicted'].forEach((name, index) => { checkpoint = checkpoint.replace('__' + name + '__', String(index + 1)); });
    assert.match(checkpoint, /1.*2.*3.*4/);
    assert.doesNotMatch(checkpoint, /__\w+__/);
    const importCommands = {
      opml: ['OPML', 'Workflowy', 'Dynalist', 'OmniOutliner', 'Logseq'],
      orgmode: ['Org mode', 'Emacs', 'Orgzly', 'Beorg', 'TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED'],
      todoist: ['Export as a template', 'CSV', '@labels', 'p1', 'p3'],
      planner: ['Export plan to Excel', '.xlsx', 'Progress', 'Priority', 'Completed By'],
      meistertask: ['Export project', 'CSV'],
      obsidian: ['Markdown', '.md'],
      linear: ['Settings', 'Import / Export', 'Export data', 'CSV'],
      ticktick: ['Settings', 'Account', 'Backup & Import', 'CSV'],
    };
    for (const [format, values] of Object.entries(importCommands)) for (const literal of values) assert.ok(locale['import-board-instruction-' + format].includes(literal));
    assert.match(locale['import-board-instruction-opml'], /eziqediwe zingeniswa njengeziqediwe/);
    assert.match(locale['import-board-instruction-meistertask'], /eqediwe igcina usuku lwayo lokuqedwa/);
    assert.match(locale['import-board-instruction-obsidian'], /amakhadi afakwe kungobo yomlando/);
    assert.match(locale['import-board-instruction-ticktick'], /ngalunye lwe-TickTick luba umzila/);
    const middleImportCommands = {
      clickup: ['Settings', 'Imports / Exports', 'Export Items', 'CSV'],
      nullboard: ['Export this board...', '.nbx', 'raw'],
      kanri: ['Import & Export', 'Export individual board', 'Export all data', '.json'],
      pivotal: ['MORE', 'Export CSV', 'Bulk Actions', 'Estimate', 'Story points'],
      tasksorg: ['Settings', 'Backups', 'Export tasks', '.json'],
      monday: ['More actions', 'Export board to Excel', '.xlsx', 'Status'],
      superproductivity: ['Settings', 'Sync & Backup', 'Export Data', 'sp-backup', '.json', 'To Do', 'In Progress', 'Backlog', 'Done'],
      taiga: ['Admin > Project > Export', '.json.gz', 'JSON'],
      vikunja: ['Settings', 'Data Export', '.zip', 'data.json'],
    };
    for (const [format, values] of Object.entries(middleImportCommands)) for (const literal of values) assert.ok(locale['import-board-instruction-' + format].includes(literal));
    assert.match(locale['import-board-instruction-nullboard'], /ibhodi lalo lokuqala/);
    assert.match(locale['import-board-instruction-kanri'], /kungeniswa ibhodi lokuqala/);
    for (const format of ['taiga', 'vikunja']) assert.match(locale['import-board-instruction-' + format], /Okunamathiselwe akungeniswa/);
    assert.match(locale['import-board-instruction-superproductivity'], /efakwe kungobo yomlando iba amakhadi afakwe kungobo yomlando/);
    const finalImportCommands = {
      quire: ['Export CSV', 'CSV'], wrike: ['Excel', '.xlsx', 'Status', 'Key', 'Priority', 'Duration'],
      teamwork: ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status', 'Complete', '.xlsx', '-', '#', '>', '--', '##', '>>'],
      businessmap: ['Advanced Search', 'Configure results', 'Title', 'Column', 'Lane', 'Owner', 'Deadline', 'Priority', 'Size', 'Type', '.xlsx'],
      redmine: ['Issues', 'Also available in: CSV', 'All columns', 'Description', 'My account', 'English', '% Done'],
      notion: ['•••', 'Export', 'Markdown & CSV', '.zip', 'Status'],
      plane: ['Workspace Settings', 'Exports', 'JSON', 'CSV', 'Excel', '.zip'],
    };
    for (const [format, values] of Object.entries(finalImportCommands)) for (const literal of values) assert.ok(locale['import-board-instruction-' + format].includes(literal));
    assert.match(locale['import-board-instruction-quire'], /Amazwana nokunamathiselwe akukho/);
    assert.match(locale['import-board-instruction-notion'], /Ubudlelwano, izithombe nokunamathiselwe akungeniswa/);
    assert.match(locale['import-board-instruction-plane'], /akunazo izincazelo noma okunamathiselwe/);
    assert.match(locale['import-board-instruction-businessmap'], /qala ngokuqamba kabusha.*ngesiNgisi/);
    assert.match(locale['import-board-instruction-redmine'], /English ku-My account ngaphambi kokukhipha/);
    assert.match(locale['import-board-instruction-teamwork'], /izinga elilodwa elijulile/);
    for (const key of ["blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CAPS_LOCK_KEY", "blockly-COMMAND_KEY", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROL_KEY", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-HOME_KEY", "blockly-INSERT_KEY", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PAUSE_KEY", "blockly-SHIFT_KEY", "blockly-SPACE_KEY", "blockly-TAB_KEY"]) {
      if (key === 'blockly-CONTEXT_MENU_KEY') assert.match(locale[key], /^≣ Imenyu$/);
      else assert.ok(locale[key].includes(source[key]), key + ': printed key legend');
    }
    assert.match(locale['blockly-PAGE_DOWN_KEY'], /phansi/);
    assert.match(locale['blockly-PAGE_UP_KEY'], /phezulu/);
    assert.match(locale['import-board-instruction-monday'], /izindawo zazo/);
    assert.doesNotMatch(locale['import-board-instruction-monday'], /izindawo zakho/);
    assert.deepStrictEqual(JSON.parse(childProcess.execFileSync(node, [fill, '--list', language], { cwd: ROOT, encoding: 'utf8' })), {}, language + ': current fill list');
    const failure = locale['ldap-sync-now-error'].replace('%s', 'E_LDAP');
    assert.ok(failure.includes('E_LDAP'));
    assert.ok(!failure.includes('%s'));
    const variables = locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE']
      .replace('%1', 'counter').replace('%2', 'calculate');
    assert.ok(variables.includes("'counter'"));
    assert.ok(variables.includes("'calculate'"));
    assert.doesNotMatch(variables, /%[12]/);
  }
  console.log('Zulu controls: translated keys, exact variables, rendering and restrictions passed');
})().catch(error => { console.error(error); process.exitCode = 1; });

// Current card linking/import/delivery prose in both Zulu catalog paths.
for (const code of ['zu', 'zu-ZA']) {
  const locale = read(code);
  assert.match(locale['custom-field-links-hint'], /ezinegama nohlobo olufanayo/);
  assert.match(locale['custom-field-links-hint'], /ekhadini elilodwa kuphela zishiywa zingashintshiwe/);
  assert.match(locale['custom-field-link-sends'], /kuleli khadi.*kulelo khadi/);
  assert.match(locale['custom-field-link-receives'], /kulelo khadi.*kuleli khadi/);
  assert.match(locale['field-link-not-allowed'], /nemvume yokuhlela womabili amakhadi/);
  assert.match(locale['custom-field-link-inactive'], /akasakwazi ukuhlela womabili amakhadi, noma elinye ikhadi ligcinwe/);
  assert.match(locale['attached-card-unavailable'], /elingabonakali kuwe/);
  assert.match(locale['custom-field-link-unavailable'], /elingabonakali kuwe/);
  assert.match(locale['attach-card-self'], /alikwazi.*kulo uqobo/);
  assert.match(locale['import-many-boards-hint'], /ngaphandle kokufanisa amalungu/);
  assert.match(locale['import-many-boards-hint'], /uqobo.*iba yibhodi elilodwa/);
  assert.match(locale['import-many-boards-hint'], /esikhundleni senkambu engenhla/);
  assert.match(locale['csv-mapping-skipped-sheets'], /angeke angeniswe/);
  assert.match(locale['webhook-hide-identity'], /^Ungafaki igama lami/);
  assert.match(locale['subtask-mark-not-done'], /njengongaqediwe/);
  assert.match(locale['subtask-done-no-permission'], /^Awukwazi ukushintsha/);
  for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'JSON', 'GET /workflows']) {
    assert.ok(locale['r-wrike-workflow-note'].includes(literal), `${code}: ${literal}`);
  }
  assert.match(locale['r-wrike-workflow-note'], /ayikwazi ukuthunyelwa ngaphandle/);
  assert.equal(locale['notification-delivery-daily-time'], 'Ngesikhathi');
  assert.equal(locale['notification-delivery-quiet-to'], 'Kuze kube');
  assert.match(locale['notification-delivery-quiet'], /linda aze aphele/);
}

for (const code of ['zu', 'zu-ZA']) {
  assert.equal(read(code)['import-members-mode-me'], 'Sebenzisa mina esikhundleni sabo bonke');
}
