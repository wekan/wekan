const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', `${code}.i18n.json`), 'utf8'));
const english = read('en');
const wu = read('wuu-Hans');
assert.deepEqual(Object.keys(wu), Object.keys(english));
for (const key of Object.keys(english)) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
const settings = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains"];
for (const key of settings) assert.notEqual(wu[key], english[key], key);
for (const key of ['external-link-rules-description', 'external-link-identifier-aliases']) {
  const braces = value => [...value.matchAll(/\{(?:number|identifier)\}/g)].map(match => match[0]).sort();
  assert.deepEqual(braces(wu[key]), braces(english[key]), key);
}
assert.ok(wu['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
for (const literal of ['TK=Task', 'IN=Incident']) assert.ok(wu['external-link-identifier-aliases'].includes(literal));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(wu['ldap-sync-now-nothing'].includes(literal));
assert.match(wu['board-announcement-enabled'], /畀搿块看板浪/);
assert.match(wu['cards-use-list-color'], /呒没.*个辰光/);
assert.match(wu['r-moved-forward'], /后头个列表/);
assert.match(wu['r-moved-back'], /前头个列表/);
assert.match(wu['read-only-field'], /只有看板管理员好改/);
assert.match(wu['ldap-sync-now-done'], /完成仔/);
assert.match(wu['ldap-sync-now-error'], /失败仔/);
console.log('Wu settings: source order, locale-wide tokens and translated batch verified; remaining work is unfinished');

const controls = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-todoist", "login-origin-mismatch", "blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CAPS_LOCK_KEY", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-COMMAND_KEY", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE"];
for (const key of controls) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
for (const [format, literals] of Object.entries({ opml: ['OPML', 'Workflowy', 'Dynalist', 'OmniOutliner', 'Logseq'], orgmode: ['Org mode', 'Emacs', 'Orgzly', 'Beorg', 'TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED'], todoist: ['Todoist', 'CSV', '@labels', 'p1', 'p3'] })) for (const literal of literals) assert.ok(wu[`import-board-instruction-${format}`].includes(literal), literal);
assert.match(wu['login-origin-mismatch'], /ROOT_URL/);
for (const [key, name] of Object.entries({ ALT: 'Alt', BACKSPACE: 'Backspace', CAPS_LOCK: 'Caps Lock', COMMAND: 'Command' })) assert.ok(wu[`blockly-${key}_KEY`].includes(name));
assert.match(wu['blockly-CONTEXT_MENU_KEY'], /≣/);
assert.match(wu['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /删勿脱/);
assert.match(wu['blockly-COLOUR_BLEND_TOOLTIP'], /0\.0 - 1\.0/);
assert.match(wu['blockly-COLOUR_RGB_TOOLTIP'], /0.*100/);
assert.match(wu['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'], /跳出去/);
assert.match(wu['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'], /跳过.*下一趟/);
assert.match(wu['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'], /只好勒循环里向用/);

const loops = ["blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-CONTROL_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK"];
for (const key of loops) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /是假个辰光/);
assert.match(wu['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /是真个辰光/);
assert.match(wu['blockly-CONTROLS_IF_TOOLTIP_4'], /所有值侪勿是真.*最后一组/);
assert.doesNotMatch(wu['blockly-CONTROLS_IF_TOOLTIP_3'], /最后一组/);
assert.match(wu['blockly-CONTROLS_IF_ELSE_TOOLTIP'], /剩下来所有情况/);
assert.match(wu['blockly-CONTROLS_FOR_TITLE'], /%2.*%3.*%4/);
assert.match(wu['blockly-DELETE_ALL_BLOCKS'], /全部 %1.*伐/);
assert.match(wu['blockly-DELETE_VARIABLE_CONFIRMATION'], /'%2'.*%1 处/);
assert.match(wu['blockly-DISABLE_BLOCK'], /停用/);
assert.match(wu['blockly-ENABLE_BLOCK'], /启用/);
assert.match(wu['blockly-CONTROL_KEY'], /Control/);
assert.notEqual(wu['blockly-COPY_SHORTCUT'], wu['blockly-CUT_SHORTCUT']);

const fields = ["blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B"];
for (const key of fields) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
for (const [key, name] of Object.entries({ END_KEY: 'End', ENTER_KEY: 'Enter', ESCAPE: 'Escape', HOME_KEY: 'Home' })) assert.ok(wu[`blockly-${key}`].includes(name));
assert.match(wu['blockly-FIELD_BITMAP_PIXEL_LABEL'], /%2 行.*%3 列/);
assert.match(wu['blockly-FIELD_BITMAP_ARIA_VALUE'], /%3 个像素亮牢/);
assert.match(wu['blockly-FIELD_BITMAP_PIXEL_OFF'], /熄脱/);
for (const icon of ['COMMENT', 'WARNING']) {
  assert.match(wu[`blockly-ICON_LABEL_${icon}_CLOSED`], /打开/);
  assert.match(wu[`blockly-ICON_LABEL_${icon}_OPEN`], /关脱/);
}
assert.match(wu['blockly-ICON_LABEL_MUTATOR_CLOSED'], /编辑搿块/);
assert.match(wu['blockly-ICON_LABEL_MUTATOR_OPEN'], /关脱/);
assert.match(wu['blockly-INPUT_LABEL_CONDITION_A'], /第一/);
assert.match(wu['blockly-INPUT_LABEL_CONDITION_B'], /第二/);
assert.notEqual(wu['blockly-EXTERNAL_INPUTS'], wu['blockly-INLINE_INPUTS']);

const inputRoles = ["blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION"];
for (const key of inputRoles) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
for (const kind of ['LISTS', 'TEXT']) {
  assert.match(wu[`blockly-INPUT_LABEL_${kind}_START_POSITION`], /起头/);
  assert.match(wu[`blockly-INPUT_LABEL_${kind}_END_POSITION`], /结束/);
}
assert.match(wu['blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT'], /拆开个文字/);
assert.match(wu['blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST'], /合并个列表/);
assert.match(wu['blockly-INPUT_LABEL_LISTS_REPEAT_ITEM'], /值/);
assert.match(wu['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'], /几趟/);
assert.equal(wu['blockly-INPUT_LABEL_MATH_DIVIDEND'], '被除数');
assert.equal(wu['blockly-INPUT_LABEL_MATH_DIVISOR'], '除数');
assert.match(wu['blockly-INPUT_LABEL_NUMBER_MAX'], /最大/);
assert.match(wu['blockly-INPUT_LABEL_NUMBER_MIN'], /最小/);
for (const axis of ['X', 'Y']) assert.ok(wu[`blockly-INPUT_LABEL_NUMBER_ATAN2_${axis}`].startsWith(axis.toLowerCase()));
assert.match(wu['blockly-INPUT_LABEL_NUMBER_A'], /第一/);
assert.match(wu['blockly-INPUT_LABEL_NUMBER_B'], /第二/);
assert.equal(wu['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'], wu['blockly-INPUT_LABEL_LOOP_TIMES']);

const listRetrieval = ["blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST"];
for (const key of listRetrieval) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['blockly-INSERT_KEY'], /Insert/);
assert.match(wu['blockly-KEYBOARD_NAV_COPIED_HINT'], /复制好仔/);
assert.match(wu['blockly-KEYBOARD_NAV_CUT_HINT'], /剪切好仔/);
assert.match(wu['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /按牢 %1.*按 %2 确认/);
assert.match(wu['blockly-LISTS_CREATE_EMPTY_TOOLTIP'], /0.*呒没数据/);
assert.match(wu['blockly-LISTS_GET_INDEX_FIRST'], /第一个/);
assert.match(wu['blockly-LISTS_GET_INDEX_LAST'], /最后一个/);
assert.match(wu['blockly-LISTS_GET_INDEX_FROM_END'], /末尾倒数/);
assert.match(wu['blockly-LISTS_GET_INDEX_GET_REMOVE'], /取出再移脱/);
assert.doesNotMatch(wu['blockly-LISTS_GET_INDEX_GET'], /移脱/);
assert.match(wu['blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST'], /移脱.*返回/);
assert.doesNotMatch(wu['blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST'], /移脱/);

const listPositions = ["blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST"];
for (const key of listPositions) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
for (const position of ['FROM', 'LAST', 'RANDOM']) {
  assert.match(wu[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_${position}`], /移脱.*返回/);
  assert.match(wu[`blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_${position}`], /移脱/);
  assert.doesNotMatch(wu[`blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_${position}`], /返回/);
}
assert.match(wu['blockly-LISTS_GET_SUBLIST_START_FROM_END'], /末尾倒数/);
assert.doesNotMatch(wu['blockly-LISTS_GET_SUBLIST_START_FROM_START'], /末尾倒数/);
assert.match(wu['blockly-LISTS_INDEX_FROM_START_TOOLTIP'], /第一个/);
assert.match(wu['blockly-LISTS_INDEX_FROM_END_TOOLTIP'], /最后一个/);
assert.match(wu['blockly-LISTS_INDEX_OF_TOOLTIP'], /寻勿着就返回 %1/);
assert.match(wu['blockly-LISTS_REPEAT_TITLE'], /项目 %1.*%2 趟/);
assert.match(wu['blockly-LISTS_REVERSE_TOOLTIP'], /副本/);
assert.match(wu['blockly-LISTS_GET_SUBLIST_TOOLTIP'], /复制/);
assert.match(wu['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST'], /插到.*起头/);

const sortingAndLogic = ["blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT"];
for (const key of sortingAndLogic) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM'], /插到/);
assert.match(wu['blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM'], /设置/);
assert.match(wu['blockly-LISTS_SORT_ORDER_ASCENDING'], /从小到大/);
assert.match(wu['blockly-LISTS_SORT_ORDER_DESCENDING'], /从大到小/);
assert.match(wu['blockly-LISTS_SORT_TOOLTIP'], /副本/);
assert.match(wu['blockly-LISTS_SORT_TYPE_IGNORECASE'], /勿分大小写/);
assert.doesNotMatch(wu['blockly-LISTS_SORT_TYPE_TEXT'], /勿分大小写/);
assert.match(wu['blockly-LISTS_SPLIT_TOOLTIP_JOIN'], /合成一段/);
assert.match(wu['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'], /每个分隔符.*拆开/);
assert.equal(wu['blockly-LOGIC_BOOLEAN_TRUE'], '真');
assert.equal(wu['blockly-LOGIC_BOOLEAN_FALSE'], '假');
for (const op of ['GT', 'LT']) {
  assert.match(wu[`blockly-LOGIC_COMPARE_${op}E_ARIA`], /或者等于/);
  assert.doesNotMatch(wu[`blockly-LOGIC_COMPARE_${op}_ARIA`], /等于/);
}
assert.match(wu['blockly-LOGIC_COMPARE_NEQ_ARIA'], /勿等于/);

const logicAndMath = ["blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE"];
for (const key of logicAndMath) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
for (const op of ['GTE', 'LTE']) assert.match(wu[`blockly-LOGIC_COMPARE_TOOLTIP_${op}`], /或者等于/);
assert.doesNotMatch(wu['blockly-LOGIC_COMPARE_TOOLTIP_LT'], /等于/);
assert.match(wu['blockly-LOGIC_NEGATE_TOOLTIP'], /假个辰光返回真.*真个辰光返回假/);
assert.match(wu['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /两只输入值侪是真/);
assert.match(wu['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /至少一只是真/);
assert.match(wu['blockly-LOGIC_NULL_TOOLTIP'], /null/);
for (const role of ['CONDITION', 'IF_FALSE', 'IF_TRUE']) assert.ok(wu['blockly-LOGIC_TERNARY_TOOLTIP'].includes(wu[`blockly-LOGIC_TERNARY_${role}`]));
for (const [op, word] of Object.entries({ ADD: '和', DIVIDE: '商', MINUS: '差', MULTIPLY: '积' })) assert.ok(wu[`blockly-MATH_ARITHMETIC_TOOLTIP_${op}`].includes(word));
assert.match(wu['blockly-MATH_ATAN2_TITLE'], /X:%1 Y:%2.*atan2/);
assert.match(wu['blockly-MATH_ATAN2_TOOLTIP'], /-180 到 180 度/);
for (const literal of ['π', '3.141…', 'e', '2.718…', 'φ', '1.618…', 'sqrt(2)', '1.414…', 'sqrt(½)', '0.707…', '∞']) assert.ok(wu['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
assert.match(wu['blockly-MATH_CONSTRAIN_TITLE'], /下限 %2.*上限 %3/);

const statistics = ["blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM"];
for (const key of statistics) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['blockly-MATH_CONSTRAIN_TOOLTIP'], /包括上下限/);
for (const [kind, word] of Object.entries({ EVEN: '偶数', ODD: '奇数', POSITIVE: '正数', NEGATIVE: '负数', PRIME: '质数', WHOLE: '整数' })) assert.ok(wu[`blockly-MATH_IS_${kind}`].includes(word));
assert.match(wu['blockly-MATH_MODULO_TITLE'], /%1 ÷ %2.*余数/);
for (const [kind, word] of Object.entries({ AVERAGE: '平均数', MEDIAN: '中位数', MODE: '众数', STD_DEV: '标准差', SUM: '总和' })) assert.ok(wu[`blockly-MATH_ONLIST_OPERATOR_${kind}`].includes(word));
assert.match(wu['blockly-MATH_ONLIST_TOOLTIP_MODE'], /列表.*出现最多/);
assert.match(wu['blockly-MATH_ONLIST_TOOLTIP_MAX'], /最大/);
assert.match(wu['blockly-MATH_ONLIST_TOOLTIP_MIN'], /最小/);
assert.match(wu['blockly-MATH_ONLIST_TOOLTIP_AVERAGE'], /算术平均数/);
assert.notEqual(wu['blockly-MATH_DIVISION_SYMBOL_ARIA'], wu['blockly-MATH_MULTIPLICATION_SYMBOL_ARIA']);

const rounding = ["blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA"];
for (const key of rounding) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0（包括）.*1\.0（勿包括）/);
assert.match(wu['blockly-MATH_RANDOM_INT_TOOLTIP'], /上下限侪包括/);
assert.match(wu['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'], /朝下/);
assert.match(wu['blockly-MATH_ROUND_OPERATOR_ROUNDUP'], /朝上/);
assert.match(wu['blockly-MATH_ROUND_OPERATOR_ROUND'], /四舍五入/);
assert.match(wu['blockly-MATH_SINGLE_TOOLTIP_EXP'], /e 个/);
assert.match(wu['blockly-MATH_SINGLE_TOOLTIP_POW10'], /10 个/);
assert.match(wu['blockly-MATH_SINGLE_TOOLTIP_LOG10'], /10 为底/);
assert.match(wu['blockly-MATH_SINGLE_TOOLTIP_LN'], /自然对数/);
assert.match(wu['blockly-MATH_SINGLE_TOOLTIP_NEG'], /相反数/);
for (const [op, word] of Object.entries({ ACOS: '反余弦', ASIN: '反正弦', ATAN: '反正切' })) assert.equal(wu[`blockly-MATH_TRIG_${op}_ARIA`], word);

const trigonometry = ["blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PAUSE_KEY", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP"];
for (const key of trigonometry) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
for (const [op, name] of Object.entries({ COS: '余弦', SIN: '正弦', TAN: '正切' })) {
  assert.equal(wu[`blockly-MATH_TRIG_${op}_ARIA`], name);
  assert.ok(wu[`blockly-MATH_TRIG_TOOLTIP_A${op}`].includes(`反${name}`));
  assert.match(wu[`blockly-MATH_TRIG_TOOLTIP_${op}`], /单位用度（勿是弧度）/);
}
for (const [key, name] of Object.entries({ OPTION: 'Option', PAGE_DOWN: 'Page Down', PAGE_UP: 'Page Up', PAUSE: 'Pause' })) assert.ok(wu[`blockly-${key}_KEY`].includes(name));
assert.match(wu['blockly-PAGE_DOWN_KEY'], /下翻页/);
assert.match(wu['blockly-PAGE_UP_KEY'], /上翻页/);
assert.match(wu['blockly-NO_PARENT_ANNOUNCEMENT'], /呒没父块/);
assert.match(wu['blockly-PASTE_ALL_FROM_BACKPACK'], /所有积木块侪/);
for (const [kind, word] of Object.entries({ COLOUR: '颜色', NUMBER: '数字', STRING: '字符串' })) assert.ok(wu[`blockly-NEW_${kind}_VARIABLE`].includes(word));
assert.notEqual(wu['blockly-NEW_VARIABLE_TITLE'], wu['blockly-NEW_VARIABLE_TYPE_TITLE']);

const procedures = ["blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHIFT_KEY", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT"];
for (const key of procedures) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['blockly-PROCEDURES_CALLRETURN_TOOLTIP'], /再用伊个输出/);
assert.doesNotMatch(wu['blockly-PROCEDURES_CALLNORETURN_TOOLTIP'], /输出/);
assert.match(wu['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /呒没输出/);
assert.match(wu['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /有输出/);
assert.match(wu['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /运行勿了.*停用仔/);
assert.match(wu['blockly-PROCEDURES_IFRETURN_WARNING'], /只好勒函数定义里向用/);
assert.match(wu['blockly-PROCEDURES_IFRETURN_TOOLTIP'], /是真.*第二只值/);
assert.match(wu['blockly-RENAME_VARIABLE_TITLE'], /所有 '%1' 变量侪/);
assert.match(wu['blockly-SCREENREADER_MODE_DISABLED'], /关脱仔.*%1 打开/);
assert.match(wu['blockly-SCREENREADER_MODE_ENABLED'], /打开仔.*%1 关脱/);
assert.match(wu['blockly-SHIFT_KEY'], /Shift/);
assert.equal(wu['blockly-PROCEDURES_CALL_BEFORE_PARAMS'], wu['blockly-PROCEDURES_BEFORE_PARAMS']);

const shortcuts = ["blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-SPACE_KEY", "blockly-TAB_KEY"];
for (const key of shortcuts) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
for (const action of ['MOVE', 'SCROLL']) for (const [direction, word] of Object.entries({ DOWN: '朝下', UP: '朝上', LEFT: '朝左', RIGHT: '朝右' })) assert.ok(wu[`blockly-SHORTCUTS_${action}_${direction}`].includes(word));
for (const [key, word] of Object.entries({ JUMP_BLOCK_END: '末尾', JUMP_BLOCK_START: '起头', JUMP_BOTTOM_STACK: '底部', JUMP_TOP_STACK: '顶部', JUMP_FIRST_BLOCK: '第一块', JUMP_LAST_BLOCK: '最后一块', JUMP_NEXT_PAGE: '下一页', JUMP_PREVIOUS_PAGE: '上一页', START_MOVE: '开始', FINISH_MOVE: '完成' })) assert.ok(wu[`blockly-SHORTCUTS_${key}`].includes(word));
assert.match(wu['blockly-SHORTCUTS_FOCUS_TOOLBOX'], /工具箱/);
assert.match(wu['blockly-SHORTCUTS_FOCUS_WORKSPACE'], /工作区/);
assert.match(wu['blockly-SHORTCUTS_START_MOVE_STACK'], /积木堆/);
assert.match(wu['blockly-SPACE_KEY'], /Space/);
assert.match(wu['blockly-TAB_KEY'], /Tab/);

const textPositions = ["blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST"];
for (const key of textPositions) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'], /小写/);
assert.match(wu['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'], /大写/);
assert.match(wu['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'], /每个词首字母大写/);
assert.match(wu['blockly-TEXT_CHANGECASE_TOOLTIP'], /副本/);
assert.match(wu['blockly-TEXT_CHARAT_FIRST'], /第一个/);
assert.match(wu['blockly-TEXT_CHARAT_LAST'], /最后一个/);
for (const prefix of ['TEXT_CHARAT', 'TEXT_GET_SUBSTRING_START', 'TEXT_GET_SUBSTRING_END']) {
  assert.match(wu[`blockly-${prefix}_FROM_END`], /末尾倒数/);
  assert.doesNotMatch(wu[`blockly-${prefix}_FROM_START`], /末尾倒数/);
}
assert.match(wu['blockly-TEXT_INDEXOF_OPERATOR_FIRST'], /头一趟/);
assert.match(wu['blockly-TEXT_INDEXOF_OPERATOR_LAST'], /最后一趟/);
assert.match(wu['blockly-TEXT_COUNT_MESSAGE0'], /%1.*%2.*几趟/);

const textValues = ["blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-TODAY", "blockly-UNDO", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE"];
for (const key of textValues) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['blockly-TEXT_INDEXOF_TOOLTIP'], /寻勿着就返回 %1/);
assert.match(wu['blockly-TEXT_LENGTH_TOOLTIP'], /包括空格/);
assert.match(wu['blockly-TEXT_REPLACE_MESSAGE0'], /%3.*%1 换成 %2/);
assert.match(wu['blockly-TEXT_REPLACE_TOOLTIP'], /侪替换脱/);
for (const [side, word] of Object.entries({ BOTH: '两爿', LEFT: '左爿', RIGHT: '右爿' })) assert.ok(wu[`blockly-TEXT_TRIM_OPERATOR_${side}`].includes(word));
assert.match(wu['blockly-TEXT_TRIM_TOOLTIP'], /副本/);
assert.match(wu['blockly-TEXT_PROMPT_TYPE_NUMBER'], /数字/);
assert.match(wu['blockly-TEXT_PROMPT_TYPE_TEXT'], /文字/);
assert.match(wu['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'], /别个类型：'%2'/);
assert.match(wu['blockly-VARIABLES_SET'], /%1 设成 %2/);
assert.notEqual(wu['blockly-UNDO'], wu['blockly-REDO']);

const finalBlockly = ["blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-LISTS_CREATE_WITH_ITEM_TITLE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-MATH_CHANGE_TITLE_ITEM", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "blockly-TEXT_APPEND_VARIABLE", "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM"];
for (const key of finalBlockly) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'], /呒没积木/);
assert.match(wu['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE'], /一堆积木/);
for (const count of ['MANY', 'ONE']) assert.match(wu[`blockly-WORKSPACE_CONTENTS_COMMENTS_${count}`], /^ 搭仔/);
assert.match(wu['blockly-WORKSPACE_SEARCH_FIND_NEXT'], /下一个/);
assert.match(wu['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS'], /上一个/);
assert.match(wu['blockly-WORKSPACE_SEARCH_INPUT_LABEL'], /Enter.*下一个.*Shift\+Enter.*上一个.*Escape.*关脱/);
for (const role of ['COMMENT', 'PROCEDURE']) assert.equal(wu[`blockly-PROCEDURES_DEFRETURN_${role}`], wu[`blockly-PROCEDURES_DEFNORETURN_${role}`]);
for (const key of ['GET_INDEX', 'GET_SUBLIST', 'INDEX_OF', 'SET_INDEX']) assert.equal(wu[`blockly-LISTS_${key}_INPUT_IN_LIST`], wu['blockly-LISTS_INLIST']);
const remainingWu = require('node:child_process').spawnSync(process.execPath, [path.join(__dirname, '../releases/translations/fill-translations.mjs'), '--list', 'wuu-Hans'], { encoding: 'utf8' });
assert.equal(remainingWu.status, 0, remainingWu.stderr);
assert.deepEqual(Object.keys(JSON.parse(remainingWu.stdout)).filter(key => key.startsWith('blockly-')), [], 'all current Wu Blockly fill entries are translated');

const rulesAndImports = ["r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases"];
for (const key of rulesAndImports) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['r-blocks-invalid'], /一个触发器连到一个动作/);
assert.match(wu['r-blocks-permission'], /看板管理员权限/);
assert.match(wu['r-blocks-unsaved'], /还朆保存/);
assert.doesNotMatch(wu['r-blocks-saved'], /还朆/);
for (const literal of ['Ctrl', 'Cmd', 'Mac']) assert.ok(wu['scrum-releases-select-help'].includes(literal));
assert.match(wu['scrum-releases-select-help'], /选择侪清脱.*所有发布版本/);
assert.match(wu['scrum-import-into-board-hint'], /绝勿重复建立/);
assert.match(wu['scrum-import-into-board-hint'], /ID/);
assert.match(wu['scrum-import-invalid-file'], /勿是.*JSON/);
assert.match(wu['scrum-import-card-ambiguous'], /多张卡片侪匹配/);
assert.match(wu['scrum-import-card-on-another-board'], /别块看板.*保持原样/);
assert.match(wu['scrum-import-sprint-finished'], /呒没移到.*结束/);

const stuckSync = ["sync-planning-fields", "sync-planning-hint", "stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-progress", "stuck-sync-operation-reason", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-refresh", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy", "stuck-sync-operation-failed"];
for (const key of stuckSync) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['sync-planning-hint'], /先照来源 ID.*再照名字/);
assert.match(wu['sync-planning-hint'], /头一趟同步绝勿移脱计划/);
assert.match(wu['stuck-sync-operation-description'], /已经应用个改动保留.*剩下来.*绝勿再写入/);
assert.match(wu['stuck-sync-operation-discard-confirm'], /已经应用个改动保留.*剩下来.*绝勿再写入/);
assert.match(wu['stuck-sync-operation-reason-access-denied'], /呒没整只列表个写入权限/);
assert.match(wu['stuck-sync-operation-replayable-now'], /勿好丢弃/);
assert.match(wu['stuck-sync-operation-replayable'], /呒没丢弃/);
assert.match(wu['stuck-sync-operation-not-stuck'], /还朆确定.*勿好丢弃/);
assert.match(wu['stuck-sync-operation-truncated'], /最早个 50/);

const finalRecovery = ["interrupted-import-heading", "interrupted-import-description", "interrupted-import-board", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-scrum", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-discard", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-refresh", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "interrupted-import-scrum-busy", "interrupted-import-failed", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const key of finalRecovery) {
  assert.notEqual(wu[key], english[key], key);
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
}
assert.match(wu['interrupted-import-description'], /来源文件呒没保存.*继续勿了/);
assert.match(wu['interrupted-import-description'], /包括后来加进去个内容/);
assert.match(wu['interrupted-import-keep-confirm'], /啥内容侪勿删/);
assert.match(wu['interrupted-import-discard-confirm'], /永久删脱/);
assert.match(wu['interrupted-import-foreign-board'], /呒没碰伊/);
assert.match(wu['interrupted-import-truncated'], /最早个 50/);
assert.match(wu['scrum-history-checkpoint-hint'], /呒没别个人改过.*才好回滚/);
assert.match(wu['scrum-history-checkpoint-hint'], /勿改任何记录/);
assert.match(wu['login-setting-env-only'], /只好由服务器环境.*勿好改/);
assert.deepEqual(JSON.parse(remainingWu.stdout), {}, 'the full current Wu fill list is empty');

const correctedActivities = ["activity-changedTitle", "activity-changedDescription", "act-deleteCard", "act-removeBoard", "act-removeList", "act-removeSwimlane", "board-members-same-org-only", "board-members-same-team-only", "restrict-comment-editing", "due-date-changed-times", "error-user-notSameOrgOrTeam", "act-addAttachment", "act-deleteAttachment", "act-addSubtask", "act-addLabel", "act-addedLabel", "act-removeLabel", "act-removedLabel", "act-addChecklist", "act-addChecklistItem", "act-removeChecklist", "act-removeChecklistItem", "act-checkedItem", "act-uncheckedItem", "act-completeChecklist", "act-uncompleteChecklist"];
for (const key of correctedActivities) {
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
  assert.match(wu[key], /仔|里向|勿准|趟/, `${key}: Wu vocabulary beyond script`);
}
assert.match(wu['activity-changedTitle'], /标题改成 %s.*所属项目是 %s/);
assert.match(wu['act-checkedItem'], /^勾选/);
assert.match(wu['act-uncheckedItem'], /^取消.*勾选/);
assert.match(wu['act-uncompleteChecklist'], /还朆完成/);
assert.equal(wu['act-addLabel'], wu['act-addedLabel']);
assert.equal(wu['act-removeLabel'], wu['act-removedLabel']);
assert.match(wu['act-removeChecklistItem'], /__checkList__/);
assert.match(wu['restrict-comment-editing'], /勿准.*别个用户个评论/);

const boardActivities = ["act-addComment", "act-editComment", "act-deleteComment", "act-createBoard", "act-createSwimlane", "act-createCard", "act-createCustomField", "act-deleteCustomField", "act-setCustomField", "act-createList", "act-addBoardMember", "act-archivedBoard", "act-archivedCard", "act-archivedList", "act-archivedSwimlane", "act-importBoard", "act-importCard", "act-importList", "act-joinMember", "act-moveCard", "act-moveCardToOtherBoard", "act-removeBoardMember", "act-restoredCard", "act-unjoinMember"];
for (const key of boardActivities) {
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
  assert.match(wu[key], /仔/, `${key}: Wu completed-action wording`);
}
assert.match(wu['act-addComment'], /写评论/);
assert.match(wu['act-editComment'], /改过.*评论/);
assert.match(wu['act-deleteComment'], /删脱.*评论/);
for (const kind of ['Board', 'Card', 'List', 'Swimlane']) assert.match(wu[`act-archived${kind}`], /移到归档/);
assert.match(wu['act-importBoard'], /导入看板/);
assert.doesNotMatch(wu['act-importBoard'], /进口/);
assert.match(wu['act-moveCardToOtherBoard'], /从看板 __oldBoard__.*移到看板 __board__/);
assert.match(wu['act-joinMember'], /加到卡片/);
assert.match(wu['act-unjoinMember'], /移脱成员/);
assert.match(wu['act-restoredCard'], /恢复到列表/);

const activitySummaries = ["activity-added", "activity-archived", "activity-attached", "activity-created", "activity-changedListTitle", "activity-customfield-created", "activity-excluded", "activity-imported", "activity-imported-board", "activity-joined", "activity-moved", "activity-on", "activity-removed", "activity-sent", "activity-unjoined", "activity-subtask-added", "activity-checked-item", "activity-unchecked-item", "activity-checklist-added", "activity-checklist-removed", "activity-checklist-completed", "activity-checklist-uncompleted", "activity-checklist-item-added", "activity-checklist-item-removed", "activity-checked-item-card"];
for (const key of activitySummaries) {
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
  assert.match(wu[key], /仔|勒/, `${key}: Wu activity wording`);
}
assert.match(wu['activity-imported'], /导入 %s.*目标是 %s.*来源是 %s/);
assert.match(wu['activity-imported-board'], /导入 %s.*来源是 %s/);
assert.match(wu['activity-excluded'], /排除 %s.*原来勒 %s/);
assert.match(wu['activity-removed'], /移脱 %s.*原来勒 %s/);
assert.match(wu['activity-checked-item'], /勾选 %s.*检查清单 %s.*所属卡片是 %s/);
assert.match(wu['activity-unchecked-item'], /取消 %s.*检查清单 %s.*所属卡片是 %s/);
assert.match(wu['activity-checklist-completed'], /检查清单 %s.*所属卡片是 %s/);
assert.match(wu['activity-checklist-uncompleted'], /还朆完成/);
assert.match(wu['activity-unjoined'], /退出/);

const checklistDates = ["activity-unchecked-item-card", "activity-checklist-completed-card", "activity-checklist-uncompleted-card", "activity-editComment", "activity-deleteComment", "activity-receivedDate", "activity-startDate", "allboards.edit-workspace-icon"];
for (const key of checklistDates) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['activity-unchecked-item-card'], /取消 %s.*检查清单 %s/);
assert.match(wu['activity-checklist-uncompleted-card'], /还朆完成/);
for (const key of ['activity-receivedDate', 'activity-startDate']) assert.match(wu[key], /日期改成 %s.*所属项目是 %s/);
assert.match(wu['activity-editComment'], /改过评论/);
assert.match(wu['activity-deleteComment'], /删脱评论/);
assert.match(wu['allboards.edit-workspace-icon'], /Markdown/);
assert.doesNotMatch(wu['allboards.edit-workspace-icon'], /降价/);

const workspaceCorrections = ["allboards.delete-workspace-confirm", "multi-selection-active", "archive-permanent-delete-disabled-hint", "no-boards-selected", "select-only-one-board", "set-selected-starred", "set-selected-unstarred", "set-selected-home", "unset-selected-home", "home-board-badge", "home-board-empty", "home-board-remove", "home-board-remove-confirm", "activity-dueDate", "activity-endDate"];
for (const key of workspaceCorrections) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['home-board-empty'], /只拖一块看板.*登录以后/);
assert.match(wu['select-only-one-board'], /只选一块/);
assert.match(wu['home-board-remove-confirm'], /看板自家勿会删脱/);
assert.match(wu['archive-permanent-delete-disabled-hint'], /假使.*全局管理员启用永久删除.*就会显示/);
assert.match(wu['no-boards-selected'], /还朆选/);
assert.match(wu['set-selected-starred'], /加星标/);
assert.match(wu['set-selected-unstarred'], /星标取消/);
assert.equal(wu['home-board-badge'], wu['set-selected-home'].replace('设成', ''));
for (const key of ['activity-dueDate', 'activity-endDate']) assert.match(wu[key], /日期改成 %s.*所属项目是 %s/);

const widthSettings = ["add-card-to-top-of-list", "add-card-to-bottom-of-list", "list-width-shared-note", "list-width-personal-note", "personal-list-width-description", "fixed-list-width", "click-to-enable-fixed-list-width", "click-to-disable-fixed-list-width", "fixed-list-width-note", "keyboard-shortcuts-enabled", "keyboard-shortcuts-disabled"];
for (const key of widthSettings) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['list-width-shared-note'], /所有人共用/);
assert.match(wu['list-width-personal-note'], /只对侬生效/);
assert.match(wu['personal-list-width-description'], /打开.*自家.*关脱.*所有人共用/);
assert.match(wu['fixed-list-width-note'], /改一只.*所有列表侪改掉.*只对侬生效/);
assert.match(wu['click-to-enable-fixed-list-width'], /关脱仔.*打开/);
assert.match(wu['click-to-disable-fixed-list-width'], /打开仔.*关脱/);
assert.match(wu['keyboard-shortcuts-enabled'], /打开仔.*关脱/);
assert.match(wu['keyboard-shortcuts-disabled'], /关脱仔.*打开/);
assert.match(wu['add-card-to-top-of-list'], /顶浪/);
assert.match(wu['add-card-to-bottom-of-list'], /底下/);

const checklistMembers = ["swimlane-height-error-message", "add-existing-card-as-subtask-empty", "add-checklist-item", "close-add-checklist-item", "close-edit-checklist-item", "convertChecklistItemToCardPopup-title", "convertChecklistItemToSubtask-title", "checklistItem-linked-subtask", "add-cover", "add-after-list", "add-members", "added", "addMemberPopup-title", "memberPopup-title", "admin", "admin-desc", "admin-announcement-active", "all-boards"];
for (const key of checklistMembers) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['add-existing-card-as-subtask-empty'], /呒没.*匹配.*卡片/);
assert.match(wu['close-add-checklist-item'], /关脱.*加项目.*表单/);
assert.match(wu['close-edit-checklist-item'], /关脱.*修改清单项目.*表单/);
assert.match(wu['add-after-list'], /列表后头/);
assert.match(wu.added, /加好仔/);
assert.doesNotMatch(wu.added, /额外/);
assert.equal(wu.admin, '管理员');
assert.match(wu['admin-desc'], /查看搭修改卡片.*移脱成员.*修改看板设置.*查看活动/);
assert.equal(wu['add-members'], wu['addMemberPopup-title']);

const archiveAttachments = ["and-n-other-card", "and-n-other-card_plural", "apply", "app-is-offline", "app-try-reconnect", "archive", "archive-all", "archive-board", "archive-board-confirm", "archive-card", "archive-list", "archive-swimlane", "archive-selection", "archiveBoardPopup-title", "archived-items", "archived-boards", "restore-board", "no-archived-boards", "archives", "attached", "attachment", "attachment-delete-pop", "attachment-soft-delete-pop", "attachmentDeletePopup-title", "auto-watch", "avatar-too-big", "show-at-all-boards-page", "board-info-on-my-boards", "boardInfoOnMyBoardsPopup-title", "boardInfoOnMyBoards-title"];
for (const key of archiveAttachments) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['app-is-offline'], /刷新页面.*数据弄丢.*加载勿成功.*服务器.*停脱/);
assert.match(wu['attachment-delete-pop'], /永久删脱.*勿能撤销/);
assert.match(wu['attachment-soft-delete-pop'], /卡片浪移脱.*文件还保留.*修改.*卡片历史.*恢复/);
assert.doesNotMatch(wu['attachment-soft-delete-pop'], /永久删脱/);
assert.equal(wu.attachment, wu.attachments);
assert.notEqual(wu.apply, '申请');
assert.match(wu['avatar-too-big'], /最大 __size__/);
assert.equal(wu['and-n-other-card'], wu['and-n-other-card_plural']);
assert.match(wu['no-archived-boards'], /归档里向呒没看板/);
for (const key of ['archive-board', 'archive-card', 'archive-list', 'archive-swimlane', 'archive-selection']) assert.match(wu[key], /移到归档里向/);

const boardVisibility = ["show-card-counter-per-list", "card_members", "board_assignees", "card_assignees", "board-nb-stars", "board-not-found", "board-private-info", "board-public-info", "board-drag-drop-reorder-or-click-open", "board-open-and-move-between-remaining-and-workspaces", "boardChangeColorPopup-title", "boardChangeTitlePopup-title", "boardChangeWatchPopup-title", "boardMenuPopup-title", "boardChangeViewPopup-title", "boards", "board-view", "mobile-desktop-toggle", "board-view-multiboard-cal", "board-view-collapse"];
for (const key of boardVisibility) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const key of ['card_members', 'board_assignees', 'card_assignees']) {
  assert.match(wu[key], /搿块看板浪/);
  assert.doesNotMatch(wu[key], /委员会|受让人/);
}
assert.match(wu.board_assignees, /所有卡片个所有负责人/);
assert.match(wu.card_assignees, /当前卡片个所有负责人/);
assert.match(wu.card_members, /当前卡片个所有成员/);
assert.match(wu['board-private-info'], /<strong>私有<\/strong>/);
assert.match(wu['board-public-info'], /<strong>公开<\/strong>/);
for (const key of ['board-private-info', 'board-public-info']) assert.deepEqual(wu[key].match(/<[^>]+>/g), english[key].match(/<[^>]+>/g));
assert.match(wu['board-open-and-move-between-remaining-and-workspaces'], /拖动手柄.*__workspaces__.*侧栏.*工作区/);
assert.match(wu['boardChangeWatchPopup-title'], /关注/);
assert.doesNotMatch(wu['boardChangeWatchPopup-title'], /手表/);
assert.equal(wu['board-view-collapse'], '收拢');
assert.equal(wu['board-view'], wu['boardChangeViewPopup-title']);

const timelineCards = ["board-view-table", "board-view-timeline-hint", "board-view-timeline-showing", "board-view-timeline-restore", "board-view-timeline-restore-confirm", "board-view-group-by-assignee", "board-view-not-yet-implemented", "calendar-system", "calendar-system-iso8601", "card-archived", "board-archived", "card-comments-title", "card-comments-more", "card-has-unread-comments", "card-settings-linked-card", "card-delete-notice", "card-delete-pop", "card-delete-suggest-archive", "card-archive-pop", "card-archive-suggest-cancel", "list-archive-pop", "list-archive-suggest"];
for (const key of timelineCards) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['board-view-table'], '表格');
assert.match(wu['board-view-timeline-restore-confirm'], /标题、描述、列表、标签、成员搭截止日期.*恢复.*啥内容侪勿会删脱/);
assert.match(wu['calendar-system'], /日期显示/);
assert.match(wu['calendar-system-iso8601'], /公历.*ISO 8601.*周/);
assert.match(wu['card-delete-notice'], /永久删脱.*所有操作记录/);
assert.match(wu['card-delete-pop'], /活动记录.*删脱.*勿能重新打开.*勿能撤销/);
assert.match(wu['card-delete-suggest-archive'], /归档.*保留活动记录/);
assert.match(wu['card-archive-suggest-cancel'], /以后.*恢复卡片/);
assert.match(wu['list-archive-suggest'], /看板设置.*归档.*恢复.*列表/);
assert.match(wu['card-has-unread-comments'], /还朆看过/);

const votingArchive = ["listArchivePopup-title", "swimlane-archive-pop", "swimlane-archive-suggest", "swimlaneArchivePopup-title", "card-due", "due-days-overdue", "card-spent", "card-labels-title", "card-members-title", "cardAttachmentsPopup-title", "negativeVoteMembersPopup-title", "vote-public", "vote-for-it", "deleteVotePopup-title", "vote-delete-pop", "cardStartPlanningPokerPopup-title", "editPokerEndDatePopup-title"];
for (const key of votingArchive) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['swimlane-archive-suggest'], /以后.*看板设置.*归档.*恢复泳道/);
assert.match(wu['swimlane-archive-pop'], /看勿见/);
assert.doesNotMatch(wu['swimlane-archive-pop'], /永久删脱/);
assert.match(wu['card-members-title'], /看板成员加到卡片浪.*从卡片浪移脱/);
assert.equal(wu['negativeVoteMembersPopup-title'], '反对者');
assert.equal(wu['vote-for-it'], '赞成');
assert.notEqual(wu['vote-for-it'], wu['vote-against']);
assert.match(wu['vote-public'], /啥人.*啥选项/);
assert.match(wu['vote-delete-pop'], /永久删脱.*投票.*所有操作记录/);
for (const key of ['cardStartPlanningPokerPopup-title', 'editPokerEndDatePopup-title', 'card-edit-planning-poker', 'poker-question']) assert.match(wu[key], /规划扑克/);

const cardDialogs = ["poker-result-who", "poker-replay", "deletePokerPopup-title", "poker-delete-pop", "cardDeletePopup-title", "cardArchivePopup-title", "cardDetailsActionsPopup-title", "userAnonymizePopup-title", "cardAssigneePopup-title", "restoreArchivedCardToListPopup-title", "restoreArchivedListToSwimlanePopup-title", "bookmarksPopup-title", "cardMembersPopup-title", "cardMorePopup-title", "cards", "cards-count", "cardType-linkedCard", "cardType-linkedBoard", "map-to-existing-user-desc"];
for (const key of cardDialogs) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['poker-result-who'], '啥人');
assert.match(wu['poker-replay'], /重新/);
assert.match(wu['poker-delete-pop'], /永久删脱.*规划扑克.*所有操作记录/);
assert.match(wu['cardArchivePopup-title'], /归档/);
assert.doesNotMatch(wu['cardArchivePopup-title'], /删脱/);
assert.match(wu['userAnonymizePopup-title'], /账户匿名化/);
assert.doesNotMatch(wu['userAnonymizePopup-title'], /导入/);
assert.equal(wu.cards, wu['cards-count-one']);
assert.equal(wu['cards-count'], wu.cards);
assert.equal(wu['cardAssigneePopup-title'], '负责人');
assert.match(wu['map-to-existing-user-desc'], /卡片、评论搭活动.*还朆加入.*原来个角色.*绝勿会授予.*更多个权限/);
for (const key of Object.keys(english).filter(key => key.startsWith('poker-') && /^\d+$/.test(english[key]))) assert.equal(wu[key], english[key]);

const mappingToggles = ["map-to-existing-user-search", "map-to-existing-user-not-member", "map-to-existing-user-none", "map-to-existing-user-no-results", "theme-default", "font-default", "font-preview-text", "delete-avatar-confirm", "deleteAvatarPopup-title", "click-to-star", "click-to-unstar", "click-to-star-page", "click-to-unstar-page", "click-to-enable-auto-width", "click-to-disable-auto-width", "card-aging-days", "card-aging-tier1", "card-aging-tier2", "card-aging-tier3", "close-board"];
for (const key of mappingToggles) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['map-to-existing-user-no-results'], /呒没.*匹配.*用户/);
assert.match(wu['map-to-existing-user-not-member'], /还朆/);
assert.match(wu['font-preview-text'], /0123456789$/);
assert.match(wu['click-to-enable-auto-width'], /关脱仔.*打开/);
assert.match(wu['click-to-disable-auto-width'], /打开仔.*关脱/);
for (const suffix of ['', '-page']) {
  assert.match(wu['click-to-star' + suffix], /加星标/);
  assert.match(wu['click-to-unstar' + suffix], /取消.*星标/);
}
for (const tier of [1, 2, 3]) {
  assert.match(wu['card-aging-tier' + tier], /呒没活动.*天以后/);
  assert.ok(wu['card-aging-tier' + tier].includes('第 ' + tier + ' 级'));
}
assert.match(wu['card-aging-tier1'], /轻度/);
assert.match(wu['card-aging-tier2'], /中度/);
assert.match(wu['card-aging-tier3'], /重度/);

const colorsComments = ["close-board-pop", "close-card", "color-gold", "color-lime", "color-mistyrose", "color-navy", "color-orange", "color-paleturquoise", "color-peachpuff", "color-plum", "color-silver", "color-sky", "comment-only", "comment-only-desc", "comment-assigned-only", "comment-assigned-only-desc", "comment-delete", "deleteCommentPopup-title", "no-comments", "no-comments-desc"];
for (const key of colorsComments) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['close-board-pop'], /所有看板页面.*归档.*恢复看板/);
assert.doesNotMatch(wu['close-board-pop'], /主页标题/);
for (const key of ['gold', 'lime', 'navy', 'orange', 'peachpuff', 'plum', 'silver', 'sky']) assert.match(wu['color-' + key], /色$/);
assert.doesNotMatch(wu['color-navy'], /海军/);
assert.doesNotMatch(wu['color-peachpuff'], /泡芙/);
assert.match(wu['comment-assigned-only-desc'], /只看得见分配畀自家个卡片.*只可以评论/);
assert.match(wu['comment-only-desc'], /只可以.*发表评论/);
assert.match(wu['no-comments'], /勿许看评论/);
assert.doesNotMatch(wu['no-comments'], /暂无/);
assert.match(wu['no-comments-desc'], /看勿见/);

const permissionsCopy = ["read-only-desc", "read-assigned-only", "read-assigned-only-desc", "worker-desc", "confirm-subtask-delete-popup", "confirm-checklist-delete-popup", "confirm-checklist-item-delete-popup", "confirm-move-list-to-swimlane", "subtaskDeletePopup-title", "checklistDeletePopup-title", "checklistItemDeletePopup-title", "copy-card-link-to-clipboard", "copy-link-to-clipboard", "copy-text-to-clipboard", "linkCardPopup-title", "copyCardPopup-title", "copyManyCardsPopup-title", "copyManyCardsPopup-instructions", "copyManyCardsPopup-format", "create", "createBoardPopup-title", "chooseBoardSourcePopup-title", "custom-field-delete-pop"];
for (const key of permissionsCopy) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['read-assigned-only-desc'], /只看得见分配畀自家个卡片.*勿能修改/);
assert.match(wu['read-only-desc'], /只可以查看.*勿能修改/);
assert.match(wu['worker-desc'], /只可以移动卡片.*自家分配.*发表评论/);
assert.match(wu['confirm-move-list-to-swimlane'], /列表.*所有卡片.*另外一条泳道/);
assert.match(wu['custom-field-delete-pop'], /勿能撤销.*所有卡片.*自定义字段.*历史记录.*删脱/);
assert.equal(wu['chooseBoardSourcePopup-title'], '导入看板');
assert.equal(wu['copyCardPopup-title'], '复制卡片');
const wuCopyExample = JSON.parse(wu['copyManyCardsPopup-format']);
const sourceCopyExample = JSON.parse(english['copyManyCardsPopup-format']);
assert.equal(wuCopyExample.length, sourceCopyExample.length);
wuCopyExample.forEach((entry, index) => {
  assert.deepEqual(Object.keys(entry), Object.keys(sourceCopyExample[index]));
  for (const value of Object.values(entry)) assert.match(value, /卡片个/);
});

const emailFields = ["custom-field-dropdown-none", "custom-field-dropdown-options-placeholder", "date-format-for-everyone", "decline", "enable-permanent-delete-description", "deleteCustomFieldPopup-title", "deleteLabelPopup-title", "editCardSpentTimePopup-title", "email-address", "email-enrollAccount-subject", "email-enrollAccount-text", "email-invite-subject", "email-invite-text", "push-invite-title", "push-invite-text", "email-resetPassword-subject", "email-resetPassword-text", "email-verifyEmail-subject", "email-verifyEmail-text", "error-board-doesNotExist", "error-board-notAdmin", "error-board-notAMember", "error-watch-disabled", "error-notAllowed", "error-json-malformed"];
for (const key of emailFields) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu.decline, '拒绝');
assert.match(wu['enable-permanent-delete-description'], /全局管理员.*永久删脱.*软删除.*本身勿会删脱任何内容/);
assert.match(wu['custom-field-dropdown-options-placeholder'], /Enter/);
assert.match(wu['error-json-malformed'], /勿是有效个 JSON/);
assert.match(wu['error-board-notAdmin'], /管理员.*才可以/);
assert.match(wu['error-board-notAMember'], /成员.*才可以/);
assert.equal(wu['email-invite-text'], wu['push-invite-text']);
assert.equal(wu['email-invite-subject'], wu['push-invite-title']);
for (const key of ['email-enrollAccount-text', 'email-invite-text', 'email-resetPassword-text', 'email-verifyEmail-text']) assert.match(wu[key], /\n\n__url__\n\n/);
assert.match(wu['email-verifyEmail-subject'], /__siteName__.*电子邮件地址/);

const errorsExport = ["error-json-schema", "error-csv-schema", "error-import-empty-board", "error-list-doesNotExist", "error-linked-card-not-allowed", "error-user-disabled", "error-user-doesNotExist", "error-user-notAllowSelf", "error-user-notCreated", "error-username-taken", "error-orgname-taken", "error-teamname-taken", "error-email-taken", "export-board", "export-board-without-attachments", "export-ical-feed", "user-can-not-export-excel", "export-card", "export-card-pdf", "export-card-excel", "export-card-excel-fields", "export-card-field-people", "export-card-attachment-size", "export-card-excel-no-disk-space", "export-card-excel-free", "export-card-excel-needed", "user-can-not-export-card-to-pdf", "user-can-not-export-card-to-excel", "exportBoardPopup-title", "exportCardPopup-title"];
for (const key of errorsExport) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['error-import-empty-board'], /呒没泳道、列表或者卡片.*老版本 WeKan.*当前版本重新导出.*导入新文件/);
assert.match(wu['error-linked-card-not-allowed'], /只可以关联普通卡片.*勿能关联另外个关联卡片.*也勿能关联.*反过来.*无法访问/);
assert.match(wu['error-user-notAllowSelf'], /勿能邀请自家/);
assert.match(wu['error-csv-schema'], /CSV.*TSV/);
assert.equal(wu['export-board'], wu['exportBoardPopup-title']);
assert.equal(wu['export-card'], wu['exportCardPopup-title']);
assert.equal(wu['export-card-excel-free'], '可用');
assert.equal(wu['export-card-attachment-size'], '大小');
assert.match(wu['export-card-excel-no-disk-space'], /Excel.*磁盘空间勿够/);
assert.match(wu['user-can-not-export-excel'], /Excel/);
assert.doesNotMatch(wu['user-can-not-export-excel'], /[\u200b-\u200f]/);
assert.match(wu['export-card-field-people'], /创建者、所有者、成员、负责人/);

const sortFilters = ["sort", "remove-sort", "sort-desc", "list-label-title", "list-label-sort", "list-label-short-modifiedAt", "list-label-short-sort", "filter-cards", "filter-no-due-date", "filter-due-this-week", "filter-due-next-week", "filter-clear", "filter-no-label", "filter-no-member", "filter-assignee-label", "filter-creator-label", "filter-no-assignee", "filter-show-archive", "filter-on-desc", "advanced-filter-description", "text-contains-trigger-description", "header-logo-title", "show-activities", "headerBarCreateBoardPopup-title", "home", "import", "imported-member-no-account"];
for (const key of sortFilters) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu.sort, '排序');
for (const key of ['list-label-short-modifiedAt', 'list-label-short-sort']) assert.equal(wu[key], english[key]);
assert.match(wu['filter-creator-label'], /创建者/);
assert.doesNotMatch(wu['filter-creator-label'], /负责人|受让人/);
assert.match(wu['filter-assignee-label'], /负责人/);
assert.match(wu['text-contains-trigger-description'], /创建卡片.*修改.*标题、描述.*新文本包含.*勿区分大小写/);
assert.ok(wu['advanced-filter-description'].includes("== != <= >= && || ( )"));
assert.ok(wu['advanced-filter-description'].includes("Field1 == Value1"));
assert.ok(wu['advanced-filter-description'].includes("'Field 1' == 'Value 1'"));
assert.ok(wu['advanced-filter-description'].includes("(' \\/)"));
assert.ok(wu['advanced-filter-description'].includes("Field1 == I\\'m"));
assert.ok(wu['advanced-filter-description'].includes("F1 == V1 || F1 == V2"));
assert.ok(wu['advanced-filter-description'].includes("F1 == V1 && ( F2 == V2 || F2 == V3 )"));
assert.ok(wu['advanced-filter-description'].includes("F1 == /Tes.*/i"));

const importInstructions = ["import-board", "import-board-c", "import-board-instruction-kanboard", "import-board-instruction-deck", "import-board-instruction-openproject", "import-board-instruction-issues", "import-board-instruction-asana", "import-board-instruction-zenkit", "import-board-instruction-markdown", "import-board-instruction-trello", "import-board-instruction-csv", "import-board-instruction-jira", "import-board-instruction-excel", "import-board-instruction-wekan", "import-board-instruction-about-errors", "import-without-mapping-members", "import-json-placeholder", "import-csv-placeholder", "import-json-file"];
for (const key of importInstructions) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['import-board'], '导入看板');
assert.equal(wu['import-board-c'], wu['import-board']);
assert.match(wu['import-board-instruction-kanboard'], /列变成列表，任务变成卡片/);
assert.match(wu['import-board-instruction-markdown'], /呒没复选框.*还朆完成个卡片/);
assert.match(wu['import-board-instruction-jira'], /automationRules.*导入规则/);
assert.match(wu['import-board-instruction-excel'], /第一行是表头/);
assert.match(wu['import-board-instruction-about-errors'], /报错.*还是成功.*所有看板页面/);
assert.match(wu['import-without-mapping-members'], /先勿映射.*以后再映射/);
assert.ok(wu["import-board-instruction-kanboard"].includes("columns"));
assert.ok(wu["import-board-instruction-kanboard"].includes("tasks"));
assert.ok(wu["import-board-instruction-kanboard"].includes("column_name"));
assert.ok(wu["import-board-instruction-kanboard"].includes("swimlane_name"));
assert.ok(wu["import-board-instruction-kanboard"].includes("date_due"));
assert.ok(wu["import-board-instruction-kanboard"].includes("owner"));
assert.ok(wu["import-board-instruction-kanboard"].includes("tags"));
assert.ok(wu["import-board-instruction-jira"].includes("GET /rest/api/3/search/jql"));
assert.ok(wu["import-board-instruction-jira"].includes("{ \"issues\": [...] }"));
assert.ok(wu["import-board-instruction-openproject"].includes("GET /api/v3/work_packages"));
assert.ok(wu["import-board-instruction-markdown"].includes("## List name"));
assert.ok(wu["import-board-instruction-markdown"].includes("- [ ]"));
assert.ok(wu["import-board-instruction-markdown"].includes("- [x]"));
assert.ok(wu["import-board-instruction-excel"].includes(".xlsx"));
assert.ok(wu["import-board-instruction-excel"].includes("Title"));
assert.ok(wu["import-board-instruction-excel"].includes("Description"));
assert.ok(wu["import-board-instruction-excel"].includes("Status/List"));
assert.ok(wu["import-board-instruction-excel"].includes("Members"));
assert.ok(wu["import-board-instruction-excel"].includes("Labels"));

const trelloImports = ["import-trello-json-file-hint", "import-trello-zip-file-hint", "import-trello-zip-no-boards", "import-trello-zip-progress", "import-trello-failed", "import-timeout", "import-trello-zip-failed", "import-trello-zip-read-failed", "import-trello-zip-too-large", "import-trello-zip-too-many-files", "import-trello-zip-file-too-large", "import-trello-zip-unsafe-path", "import-trello-workspace-placeholder", "import-trello-parent-workspace", "trello-api-import", "trello-api-import-desc", "trello-api-token", "trello-import-selected", "trello-importing", "trello-api-credentials-required", "trello-api-credentials-saved", "trello-select-boards", "trello-cancel-delete", "trello-cancel-delete-confirm", "trello-delete-imported"];
for (const key of trelloImports) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['import-trello-json-file-hint'], /API key.*token.*附件、看板背景搭成员头像.*下载/);
assert.match(wu['import-trello-zip-file-hint'], /Trello Card Attachments Downloader.*所有看板侪会导入/);
assert.match(wu['import-timeout'], /停脱仔.*再试一趟.*看板忒大或者数据库忙/);
assert.match(wu['import-trello-zip-too-many-files'], /文件忒多/);
assert.match(wu['import-trello-zip-file-too-large'], /有只文件忒大/);
assert.match(wu['import-trello-zip-unsafe-path'], /勿安全个文件路径.*拒绝/);
assert.match(wu['import-trello-workspace-placeholder'], /假使勿存在.*创建/);
assert.match(wu['trello-api-credentials-required'], /API key.*token 两样侪/);
assert.match(wu['trello-api-credentials-saved'], /保存好仔.*勿用重新输入/);
assert.match(wu['trello-select-boards'], /至少选一块/);
assert.match(wu['trello-cancel-delete-confirm'], /搿趟任务已经导入个看板.*勿能撤销/);

const memberLists = ["import-map-members", "import-members-map", "import-members-map-note", "import-user-select", "importMapMembersAddPopup-title", "version-check-failed", "invalid-year", "just-invited", "label-delete-pop", "last-admin-desc", "leave-board-pop", "leaveBoardPopup-title", "link-card", "linkCardToBoardPopup-title", "linkCardToNewBoard", "list-archive-cards", "list-archive-cards-pop", "list-move-cards", "list-select-cards", "listActionPopup-title", "swimlaneActionPopup-title", "swimlaneAddPopup-title", "listImportCardPopup-title", "listMorePopup-title", "list-delete-pop", "list-delete-suggest-archive"];
for (const key of memberLists) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['import-members-map-note'], /还朆映射.*当前用户/);
assert.match(wu['invalid-year'], /四位数字.*2026/);
assert.match(wu['last-admin-desc'], /勿能修改角色.*至少.*管理员/);
assert.match(wu['leave-board-pop'], /__boardTitle__.*所有卡片个成员.*移脱/);
assert.doesNotMatch(wu['leave-board-pop'], /删脱/);
assert.match(wu['label-delete-pop'], /勿能撤销.*所有卡片.*标签.*历史记录/);
assert.match(wu['list-delete-pop'], /所有操作记录.*勿能恢复.*勿能撤销/);
assert.match(wu['list-delete-suggest-archive'], /归档.*保留活动记录/);
assert.match(wu['list-archive-cards-pop'], /所有卡片.*恢复到看板.*菜单.*归档/);
for (const key of ['list-move-cards', 'list-select-cards']) assert.match(wu[key], /列表里向所有卡片/);

const selectionNotify = ["memberMenuPopup-title", "members", "move-selection", "copy-selection", "moveCardPopup-title", "moveCardToBottom-title", "moveCardToTop-title", "moveSelectionPopup-title", "copySelectionPopup-title", "selection-color", "multi-selection-label", "multi-selection-member", "multi-selection-on", "multi-selection-off", "muted-info", "my-boards", "no-archived-cards", "no-archived-lists", "no-archived-swimlanes", "no-results", "normal-desc", "normal-assigned-only", "normal-assigned-only-desc", "not-accepted-yet", "notify-participate", "notify-watch", "optional"];
for (const key of selectionNotify) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['move-selection'], wu['moveSelectionPopup-title']);
assert.equal(wu['copy-selection'], wu['copySelectionPopup-title']);
for (const key of ['multi-selection-label', 'multi-selection-member']) assert.match(wu[key], /畀选中个项目设置/);
assert.match(wu['moveCardToBottom-title'], /底下/);
assert.match(wu['moveCardToTop-title'], /顶浪/);
assert.match(wu['muted-info'], /任何改动侪勿会通知/);
assert.match(wu['normal-desc'], /查看搭修改卡片.*勿能修改设置/);
assert.match(wu['normal-assigned-only-desc'], /只看得见分配畀自家个卡片.*普通用户权限/);
assert.match(wu['notify-participate'], /创建者或者成员.*任何卡片.*接收通知/);
assert.match(wu['notify-watch'], /关注.*看板、列表或者卡片.*接收通知/);
assert.equal(wu.optional, '可选');

const visibilityRemoval = ["page-maybe-private", "page-not-found", "paste-or-dragdrop", "private", "private-desc", "profile", "public", "public-desc", "custom-private-desc", "custom-private-desc-placeholder", "custom-public-desc", "custom-public-desc-placeholder", "quick-access-description", "remove-cover", "remove-from-board", "listDeletePopup-title", "remove-member", "remove-member-from-card", "remove-member-pop", "removeMemberPopup-title", "rename-board", "rescue-card-description", "rescue-card-description-dialogue", "search-cards"];
for (const key of visibilityRemoval) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.ok(wu['page-maybe-private'].includes("<a href='%s'>登录</a>"));
assert.match(wu['private-desc'], /只有加入看板个人.*查看搭修改/);
assert.match(wu['public-desc'], /任何有链接个人.*Google.*只有加入看板个人.*修改/);
assert.equal(wu.public, '公开');
assert.equal(wu.profile, '个人资料');
assert.match(wu['remove-member-pop'], /__name__.*__username__.*__boardTitle__.*所有卡片个成员.*移脱.*收到通知/);
assert.doesNotMatch(wu['remove-member-pop'], /删脱/);
for (const key of ['custom-private-desc-placeholder', 'custom-public-desc-placeholder']) assert.match(wu[key], /留空就用默认/);
assert.match(wu['rescue-card-description'], /还朆保存.*关闭以前/);
assert.match(wu['rescue-card-description-dialogue'], /侬个修改覆盖当前卡片描述/);

const shortcutsStars = ["search-example", "select-board", "set-wip-limit-value", "shortcut-add-self", "shortcut-assign-self", "shortcut-clear-filters", "shortcut-filter-my-cards", "shortcut-filter-my-assigned-cards", "shortcut-show-shortcuts", "shortcut-toggle-filterbar", "shortcut-toggle-searchbar", "shortcut-toggle-sidebar", "show-cards-minimum-count", "star-board-title", "set-default-board-title", "unset-default-board-title", "starred-boards", "starred-pages", "starred-boards-description", "starred-swimlanes", "starred-lists", "starred-cards", "this-board", "this-card", "spent-time-hours"];
for (const key of shortcutsStars) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['search-example'], /Enter/);
assert.match(wu['shortcut-add-self'], /卡片个成员/);
assert.match(wu['shortcut-assign-self'], /卡片分配畀自家/);
assert.match(wu['shortcut-filter-my-assigned-cards'], /分配畀我/);
assert.match(wu['show-cards-minimum-count'], /超过.*才显示数量/);
assert.match(wu['set-default-board-title'], /登录以后.*自动打开/);
assert.match(wu['unset-default-board-title'], /点一下.*勿再自动打开/);
assert.match(wu['star-board-title'], /看板列表顶浪/);
assert.match(wu['starred-lists'], /列表/);
assert.match(wu['spent-time-hours'], /小时/);

const trackingLinks = ["overtime", "has-overtime-cards", "has-spenttime-cards", "toggle-assignees", "toggle-labels", "remove-labels-multiselect", "tracking-info", "unsaved-description", "unwatch", "automatic-linked-url-schemes", "external-link-pattern-description", "view-it", "warn-list-archived", "watch", "watching", "watching-info", "welcome-board", "welcome-list2"];
for (const key of trackingLinks) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu.overtime, wu['overtime-hours'].replace('（小时）', ''));
assert.equal(wu.watch, '关注');
assert.match(wu.unwatch, /取消关注/);
assert.match(wu['toggle-assignees'], /1-9.*负责人.*加入看板个次序/);
assert.match(wu['toggle-labels'], /多选.*添加第 1-9/);
assert.match(wu['remove-labels-multiselect'], /多选.*移脱第 1-9/);
assert.match(wu['tracking-info'], /创建者或者成员.*卡片.*任何改动/);
assert.match(wu['watching-info'], /看板.*任何改动/);
assert.match(wu['external-link-pattern-description'], /#1234.*随便留空一只.*关脱/);
assert.match(wu['automatic-linked-url-schemes'], /每行一只 URL 协议/);

const limitsMail = ["what-to-do", "wipLimitErrorPopup-dialog-pt1", "wipLimitErrorPopup-dialog-pt2", "attachment-transfer-limits-description", "attachment-transfer-limits-saved", "attachment-transfer-limits-save-failed", "attachment-transfer-limits-invalid-value", "avatars-upload-blocked-description", "people", "registration", "invite-people", "to-boards", "smtp-host-description", "smtp-port-description", "send-from", "send-smtp-test", "email-templates-title", "email-templates-invite-subject", "email-templates-invite-body", "email-templates-activity-subject", "email-templates-activity-body", "email-invite-register-subject", "email-invite-register-text", "email-smtp-test-text"];
for (const key of limitsMail) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['wipLimitErrorPopup-dialog-pt2'], /任务.*移出去.*或者.*更高个 WIP 上限/);
assert.match(wu['attachment-transfer-limits-description'], /上传搭下载.*API.*另外.*服务器端/);
assert.match(wu['avatars-upload-blocked-description'], /勿许.*新头像.*默认.*启用/);
assert.equal(wu['to-boards'], '到看板');
assert.equal(wu['send-from'], '发件人');
assert.match(wu['email-invite-register-text'], /__inviter__.*邀请侬.*__icode__/s);
assert.equal(wu['email-invite-register-subject'], wu['email-invite-subject']);
for (const key of ['email-templates-invite-vars-hint', 'email-templates-activity-vars-hint']) assert.deepEqual(wu[key].match(/\{[^}]+\}/g), english[key].match(/\{[^}]+\}/g));

const adminFields = ["error-invitation-code-not-exist", "error-notAuthorized", "disable-webhook", "Node_version", "Meteor_version", "show-field-on-card", "automatically-field-on-card", "always-field-on-card", "showLabel-field-on-card", "showSum-field-on-list", "admin-only-field", "tableVisibilityMode-allowPrivateOnly", "active", "active-team", "active-org", "org-propagate-members-to-boards", "org-tenant", "org-domains", "org-domains-description"];
for (const key of adminFields) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu.Node_version, 'Node 版本');
assert.equal(wu.Meteor_version, 'Meteor 版本');
assert.match(wu['automatically-field-on-card'], /新卡片/);
assert.match(wu['always-field-on-card'], /所有卡片/);
assert.match(wu['admin-only-field'], /只有看板管理员看得见/);
assert.match(wu['tableVisibilityMode-allowPrivateOnly'], /只允许私有看板/);
for (const literal of ['a.example.com', 'kanban.example.org', 'MULTITENANCY=true']) assert.ok(wu['org-domains-description'].includes(literal));
assert.match(wu['org-domains-description'], /只有服务器.*才生效.*勿是租户.*留空/);

const orgDeletion = ["error-org-domain-taken", "org-admins-description", "team-propagate-members-to-boards", "active-person", "card-end", "setSelectionColorPopup-title", "card-sorting-by-number", "board-delete-notice", "delete-board-confirm-popup", "boardDeletePopup-title", "delete-board", "delete-all-notifications-confirm", "delete-duplicate-lists-confirm", "default-subtasks-board", "card-settings", "minicard-settings", "boardCardSettingsPopup-title", "boardMinicardSettingsPopup-title", "deposit-subtasks-board", "deposit-subtasks-list", "show-parent-in-minicard", "description-on-minicard"];
for (const key of orgDeletion) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['org-admins-description'], /只可以管理.*人员搭备份.*绝勿能授予全站管理员权限.*勿能管理网站管理员/);
assert.match(wu['board-delete-notice'], /永久删脱.*所有列表、卡片搭操作记录/);
assert.match(wu['delete-board-confirm-popup'], /列表、卡片、标签搭活动记录.*勿能恢复.*勿能撤销/);
assert.match(wu['delete-duplicate-lists-confirm'], /名字相同而且呒没卡片/);
assert.match(wu['delete-all-notifications-confirm'], /所有通知.*勿能撤销/);
assert.equal(wu['card-settings'], wu['boardCardSettingsPopup-title']);
assert.equal(wu['minicard-settings'], wu['boardMinicardSettingsPopup-title']);
assert.match(wu['deposit-subtasks-board'], /子任务.*看板/);
assert.match(wu['deposit-subtasks-list'], /子任务.*列表/);

const parentActivities = ["cover-attachment-on-minicard", "badge-attachment-on-minicard", "card-sorting-by-number-on-minicard", "checklist-count-on-minicard", "prefix-with-full-path", "prefix-with-parent", "subtext-with-full-path", "subtext-with-parent", "change-card-parent", "parent-card", "source-board", "no-parent", "activity-added-label", "activity-removed-label", "activity-delete-attach", "activity-added-label-card", "activity-removed-label-card", "activity-delete-attach-card", "activity-set-customfield", "activity-unset-customfield", "r-no-rules", "r-delete-selected"];
for (const key of parentActivities) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['parent-card'], '父卡片');
assert.doesNotMatch(wu['subtext-with-parent'], /父母|潜台词/);
assert.match(wu['checklist-count-on-minicard'], /0\/0/);
const fillWuActivity = (key, values) => { let index = 0; return wu[key].replace(/%s/g, () => values[index++]); };
assert.match(fillWuActivity('activity-removed-label', ['LABEL', 'CARD']), /标签“LABEL”.*从 CARD/);
assert.match(fillWuActivity('activity-set-customfield', ['FIELD', 'VALUE', 'CARD']), /字段“FIELD”设成“VALUE”.*所属项目是 CARD/);
assert.match(fillWuActivity('activity-unset-customfield', ['FIELD', 'CARD']), /字段“FIELD”个设置.*所属项目是 CARD/);
assert.match(fillWuActivity('activity-added-label', ['LABEL', 'CARD']), /标签“LABEL”.*加到 CARD/);

const ruleTriggers = ["r-export-selected", "r-edit-rule-trigger-action", "r-toggle-rule-enabled", "r-workflow-help", "r-drop-trigger", "r-drop-action", "r-w-card-created", "r-w-card-archived", "r-w-card-unarchived", "r-w-label-added", "r-w-label-removed", "r-w-member-added", "r-w-member-removed", "r-w-assignee-added", "r-w-assignee-removed", "r-w-checklist-added", "r-w-attachment-added", "r-w-every-day-at", "r-w-set-received-now", "r-export-json", "r-export-csv"];
for (const key of ruleTriggers) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['r-edit-rule-trigger-action'], /触发器/);
assert.doesNotMatch(wu['r-edit-rule-trigger-action'], /扳机/);
assert.match(wu['r-workflow-help'], /触发器.*操作.*添加规则.*现有规则.*修改/);
for (const entity of ['label', 'member', 'assignee']) {
  assert.match(wu['r-w-' + entity + '-added'], /添加仔/);
  assert.match(wu['r-w-' + entity + '-removed'], /移脱仔/);
}
assert.match(wu['r-w-assignee-added'], /负责人/);
assert.match(wu['r-w-card-unarchived'], /归档里向恢复/);
assert.match(wu['r-w-every-day-at'], /每天.*__time__/);
assert.match(wu['r-export-json'], /JSON/);
assert.match(wu['r-export-csv'], /CSV/);

const ruleImportSchedule = ["r-import-paste", "r-import", "r-import-done", "r-import-trello-note", "r-board", "r-import-workflow-note", "r-import-unmapped", "r-set-scheduled-triggers", "r-when-scheduled", "r-schedule-once", "r-schedule-weekday", "r-schedule-weekly", "r-schedule-at-time", "r-schedule-on-weekday", "r-schedule-on-day", "r-schedule-on-date", "r-of-cards-in-list", "r-when-due"];
for (const key of ruleImportSchedule) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['r-import'], '导入');
assert.equal(wu['r-board'], '看板');
assert.match(wu['r-import-done'], /导入好 __count__/);
assert.match(wu['r-import-unmapped'], /__count__.*映射勿到/);
assert.match(wu['r-import-trello-note'], /呒没 Butler 规则.*支持个部分.*映射勿到.*报告/);
assert.match(wu['r-import-workflow-note'], /n8n.*Node-RED.*WeKan.*映射勿到个节点.*报告/);
assert.match(wu['r-schedule-weekday'], /礼拜一到礼拜五/);
assert.notEqual(wu['r-schedule-once'], wu['r-schedule-weekly']);

const ruleMovement = ["r-due-is-set", "r-due-soon", "r-when-card-in-list", "r-for-n-days", "r-sort-by", "r-sort-name", "r-mark-complete", "r-mark-incomplete", "r-move-all-cards", "r-set-date-relative", "r-unit-weeks", "r-trigger", "r-action", "r-when-a-card", "r-is-moved", "r-removed-from", "r-attachment-removed-from", "r-moved-from"];
for (const key of ruleMovement) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['r-trigger'], '触发器');
assert.equal(wu['r-is-moved'], '移动仔');
assert.doesNotMatch(wu['r-is-moved'], /感动/);
assert.equal(wu['r-sort-by'], '按');
assert.match(wu['r-mark-complete'], /标记成完成/);
assert.match(wu['r-mark-incomplete'], /还朆完成/);
assert.match(wu['r-move-all-cards'], /所有卡片/);
assert.match(wu['r-for-n-days'], /N 天/);
assert.match(wu['r-set-date-relative'], /现在为基准/);
assert.equal(wu['r-removed-from'], wu['r-attachment-removed-from']);

const ruleConditions = ["r-archived", "r-unarchived", "r-a-card", "r-when-a-member", "r-when-the-member", "r-when-a-assignee", "r-when-the-assignee", "r-name", "r-when-a-card-title-or-description-contains", "r-when-a-due-date-changed", "r-when-a-start-date-changed", "r-when-a-end-date-changed", "r-when-a-received-date-changed", "r-completed", "r-made-incomplete", "r-checked", "r-unchecked", "r-move-card-to", "r-its-list", "r-archive", "r-unarchive", "r-remove", "r-add-actinguser-member", "r-remove-all"];
for (const key of ruleConditions) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const kind of ['due', 'start', 'end', 'received']) assert.match(wu['r-when-a-' + kind + '-date-changed'], /设定或者修改/);
assert.match(wu['r-completed'], /完成仔/);
assert.match(wu['r-made-incomplete'], /还朆完成/);
assert.equal(wu['r-checked'], '勾选仔');
assert.equal(wu['r-unchecked'], '取消勾选仔');
assert.match(wu['r-add-actinguser-member'], /触发搿条规则个用户.*成员/);
assert.match(wu['r-remove-all'], /卡片.*所有成员/);
assert.doesNotMatch(wu['r-remove-all'], /删脱卡片/);
assert.match(wu['r-unarchive'], /从归档.*恢复/);

const ruleCheckActions = ["r-remove-all-labels", "r-set-color", "r-check-all", "r-check", "r-uncheck", "r-item", "r-of-checklist", "r-of", "r-rule-any-trigger-help", "r-d-move-to-top-gen", "r-d-move-to-top-spec", "r-d-move-to-bottom-gen", "r-d-move-to-bottom-spec", "r-d-archive", "r-d-unarchive", "r-d-remove-label", "r-create-card", "r-in-list"];
for (const key of ruleCheckActions) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['r-check'], '勾选');
assert.equal(wu['r-uncheck'], '取消勾选');
assert.match(wu['r-check-all'], /全部勾选/);
assert.match(wu['r-remove-all-labels'], /所有标签/);
assert.match(wu['r-rule-any-trigger-help'], /任意一只触发条件.*按次序执行/);
for (const position of ['top', 'bottom']) {
  assert.match(wu['r-d-move-to-' + position + '-gen'], /伊所属列表/);
  assert.match(wu['r-d-move-to-' + position + '-spec'], /搿只列表/);
}
assert.match(wu['r-d-move-to-top-gen'], /顶浪/);
assert.match(wu['r-d-move-to-bottom-gen'], /底下/);
for (const key of ['r-email-vars-hint', 'r-trigger-vars-hint', 'r-vars-people-hint']) assert.deepEqual(wu[key].match(/\{[^}]+\}/g), english[key].match(/\{[^}]+\}/g));

const ruleFieldActions = ["r-in-swimlane", "r-d-add-member", "r-d-remove-member", "r-d-remove-all-member", "r-d-check-all", "r-d-uncheck-all", "r-d-check-one", "r-d-uncheck-one", "r-d-check-of-list", "r-by", "r-with-items", "r-board-note", "r-checklist-note", "r-when-a-card-is-moved", "r-set", "r-df-due-at", "r-df-end-at", "r-to-current-datetime", "r-link-card", "oauth-providers-hint"];
for (const key of ruleFieldActions) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['r-set'], '设置');
assert.match(wu['r-d-check-all'], /^勾选.*所有项目/);
assert.match(wu['r-d-uncheck-all'], /^取消勾选.*所有项目/);
assert.equal(wu['r-d-check-one'], '勾选项目');
assert.equal(wu['r-d-uncheck-one'], '取消勾选项目');
assert.match(wu['r-board-note'], /留空.*所有可能个值/);
assert.match(wu['r-checklist-note'], /逗号分隔/);
assert.equal(wu['r-items-list'].split(',').length, 3);
assert.ok(wu['oauth-providers-hint'].includes('OAUTH_*_ENABLED'));
assert.match(wu['oauth-providers-hint'], /搿搭设置个值会覆盖环境变量.*服务器.*绝勿会显示/);

const loginLiterals = ["oauth-provider-secret-set", "oauth-providers-merge-existing-users", "oauth-account-conflict", "sign-in-with", "passwordless-enabled", "passwordless-hint", "passwordless-login", "passwordless-code-sent", "passwordless-enter-code", "passwordless-sign-in", "cas", "add-custom-html-after-body-start", "add-custom-html-before-body-end", "error-undefined", "error-ldap-login", "duplicate-board"];
for (const key of loginLiterals) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu.cas, 'CAS');
assert.match(wu['oauth-account-conflict'], /已经存在.*勿是.*登录方法创建/);
assert.match(wu['passwordless-enabled'], /电子邮件.*一趟有效.*登录码.*代替密码/);
for (const literal of ['MAIL_URL', 'PASSWORDLESS_ENABLED']) assert.ok(wu['passwordless-hint'].includes(literal));
assert.match(wu['add-custom-html-after-body-start'], /<body>.*后头.*HTML/);
assert.match(wu['add-custom-html-before-body-end'], /<\/body>.*前头.*HTML/);
assert.equal(wu['duplicate-board'], '复制看板');

const datesPlacement = ["duplicate-board-confirm", "clone-board-without-cards", "swimlaneDeletePopup-title", "swimlane-delete-pop", "loading", "act-a-dueAt", "act-a-endAt", "act-a-startAt", "act-a-receivedAt", "a-dueAt", "a-endAt", "a-startAt", "a-receivedAt", "above-selected-card", "above-selected-swimlane", "below-selected-card", "below-selected-swimlane", "left-of-list", "right-of-list", "almostdue", "pastdue", "duenow"];
for (const key of datesPlacement) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const kind of ['endAt', 'startAt', 'receivedAt']) assert.match(wu['act-a-' + kind], /从（__timeOldValue__）改成 __timeValue__/);
assert.match(wu['act-a-dueAt'], /时间：__timeValue__.*卡片：__card__.*原来.*__timeOldValue__/s);
assert.match(wu.almostdue, /截止时间 %s 快到仔/);
assert.doesNotMatch(wu.almostdue, /预产期/);
assert.match(wu.pastdue, /%s 已经过脱仔/);
assert.match(wu.duenow, /%s 是今朝/);
for (const object of ['card', 'swimlane']) {
  assert.match(wu['above-selected-' + object], /上头/);
  assert.match(wu['below-selected-' + object], /下头/);
}
assert.match(wu['left-of-list'], /左爿/);
assert.match(wu['right-of-list'], /右爿/);
assert.match(wu['swimlane-delete-pop'], /所有操作记录.*勿能恢复.*勿能撤销/);

const remindersControls = ["act-newDue", "act-withDue", "act-almostdue", "act-pastdue", "act-duenow", "act-atUserComment", "delete-user-confirm-popup", "delete-team-confirm-popup", "delete-org-confirm-popup", "accounts-allowUserDelete", "hide-minicard-label-text", "same-width-for-all-lists", "open-many-cards-at-once-description", "assignee", "assignees", "no-assignee", "no-label", "cardAssigneesPopup-title", "addmore-detail"];
for (const key of remindersControls) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['act-almostdue'], /__card__.*__timeValue__.*快到仔/);
assert.match(wu['act-pastdue'], /__timeValue__.*已经过脱仔/);
assert.match(wu['act-duenow'], /__timeValue__.*就是现在/);
assert.match(wu['act-atUserComment'], /卡片 __card__.*提到侬.*__comment__.*列表是 __list__.*泳道是 __swimlane__.*看板是 __board__/);
for (const entity of ['user', 'team', 'org']) assert.match(wu['delete-' + entity + '-confirm-popup'], /勿能撤销/);
assert.match(wu['open-many-cards-at-once-description'], /每张卡片.*自家个窗口.*关脱搿项.*关脱原来打开/);
for (const key of ['assignee', 'assignees', 'cardAssigneesPopup-title']) assert.equal(wu[key], '负责人');

const notificationsRoles = ["show-on-card", "show-on-minicard", "show-on-public-board", "show-on-private-board", "filter-by-unread", "mark-all-as-read", "mark-all-as-unread", "remove-all-read", "roles-info", "roles-status-desc", "roles-status-sees-assigned", "roles-status-empty", "start-day-of-week"];
for (const key of notificationsRoles) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['mark-all-as-read'], /全部标记成看过仔/);
assert.match(wu['mark-all-as-unread'], /全部标记成还朆看过/);
assert.match(wu['remove-all-read'], /所有看过个通知/);
assert.match(wu['roles-info'], /全局管理员.*所有权限.*勿能限制/);
assert.match(wu['roles-status-desc'], /只读.*复选框.*还朆保存.*看得见/);
assert.match(wu['roles-status-sees-assigned'], /只看分配畀自家个卡片/);
assert.match(wu['show-on-public-board'], /公开看板/);
assert.match(wu['show-on-private-board'], /私有看板/);

const calendarDomains = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "status", "delete-linked-cards-before-this-list", "hide-checked-items", "hide-finished-checklist", "share-template-with", "drag-template-here-to-share", "remove-domain-from-board", "invalid-domain"];
for (const key of calendarDomains) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.deepEqual(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(key => wu[key]), ['礼拜一', '礼拜二', '礼拜三', '礼拜四', '礼拜五', '礼拜六', '礼拜日']);
assert.equal(wu.status, '状态');
assert.match(wu['delete-linked-cards-before-this-list'], /先删脱指向.*关联卡片.*才可以删脱.*列表/);
assert.match(wu['hide-checked-items'], /勾选好/);
assert.match(wu['hide-finished-checklist'], /完成好/);
assert.match(wu['invalid-domain'], /example\.com.*勿要有 @ 或者空格/);
assert.match(wu['remove-domain-from-board'], /从搿块看板.*移脱.*域名/);

const sharedCardViews = ["no-items-message", "shared-templates-info", "shared-templates-select-scope", "no-shared-templates", "my-cards", "my-attachments", "today", "week", "board", "myCardsViewChange-title", "myCardsViewChangePopup-title", "myCardsViewChange-choice-boards", "myCardsViewChange-choice-table", "myCardsSortChange-title", "myCardsSortChangePopup-title", "dueCards-title", "dueCardsViewChange-title", "dueCardsViewChangePopup-title", "dueCardsViewChange-choice-all-description", "globalSearchViewChange-choice-me", "globalSearchViewChange-choice-all-description", "dueCards-noResults-title"];
for (const key of sharedCardViews) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['shared-templates-info'], /组织、团队或者电子邮件域名.*一只或者多只范围.*只列出.*有内容个用户/);
assert.equal(wu.board, '看板');
assert.equal(wu['myCardsViewChange-choice-table'], '表格');
assert.match(wu['my-attachments'], /我个附件/);
assert.match(wu['dueCardsViewChange-choice-all-description'], /有权限查看.*到期.*还朆完成/);
assert.match(wu['globalSearchViewChange-choice-all-description'], /有权限.*我个卡片.*成员或者负责人/);
assert.equal(wu['globalSearchViewChange-choice-me'], wu['my-cards']);
assert.equal(wu['dueCardsViewChange-title'], wu['dueCardsViewChangePopup-title']);

const searchResultsWu = ["dueCards-noResults-description", "board-title-not-found", "swimlane-title-not-found", "list-title-not-found", "label-not-found", "label-color-not-found", "user-username-not-found", "comment-not-found", "org-name-not-found", "team-name-not-found", "globalSearch-title", "no-cards-found", "one-card-found", "n-cards-found", "n-n-of-n-cards-found", "operator-board", "operator-board-abbrev", "operator-swimlane-abbrev", "operator-list-abbrev", "operator-member-abbrev", "operator-assignee", "operator-assignee-abbrev", "operator-creator", "operator-status", "operator-due", "operator-sort", "operator-attachment-text"];
for (const key of searchResultsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const entity of ['board', 'swimlane', 'list', 'member', 'assignee']) assert.equal(wu['operator-' + entity + '-abbrev'], english['operator-' + entity + '-abbrev']);
assert.match(wu['n-n-of-n-cards-found'], /__total__ 张卡片.*第 __start__-__end__ 张/);
assert.match(wu['comment-not-found'], /评论里向包含文本“%s”个卡片/);
assert.equal(wu['operator-board'], '看板');
assert.equal(wu['operator-sort'], '排序');
assert.equal(wu['operator-attachment-text'], '附件');
assert.match(wu['n-cards-found'], /寻着 %s 张卡片/);

const searchPredicatesWu = ["predicate-overdue", "predicate-week", "predicate-quarter", "predicate-due", "predicate-modified", "predicate-attachment", "predicate-end", "predicate-assignee", "predicate-public", "predicate-private", "operator-unknown-error", "operator-number-expected", "operator-sort-invalid", "operator-status-invalid", "operator-has-invalid", "operator-limit-invalid", "operator-debug-invalid"];
for (const key of searchPredicatesWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu['predicate-quarter'], '季度');
assert.equal(wu['predicate-attachment'], '附件');
assert.equal(wu['predicate-assignee'], '负责人');
assert.equal(wu['predicate-public'], '公开');
assert.equal(wu['predicate-private'], '私有');
assert.match(wu['operator-number-expected'], /运算符 __operator__.*数字.*收到.*__value__/);
assert.match(wu['operator-limit-invalid'], /%s.*勿是有效.*正整数/);
assert.doesNotMatch(wu['operator-number-expected'], /操作员/);

const searchHelpWu = ["globalSearch-instructions-description", "globalSearch-instructions-operator-board", "globalSearch-instructions-operator-list", "globalSearch-instructions-operator-swimlane", "globalSearch-instructions-operator-comment", "globalSearch-instructions-operator-label", "globalSearch-instructions-operator-hash", "globalSearch-instructions-operator-user", "globalSearch-instructions-operator-at", "globalSearch-instructions-operator-member", "globalSearch-instructions-operator-assignee", "globalSearch-instructions-operator-creator", "globalSearch-instructions-operator-org", "globalSearch-instructions-operator-team", "globalSearch-instructions-operator-created", "globalSearch-instructions-operator-modified"];
for (const key of searchHelpWu) {
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
  assert.deepEqual(wu[key].match(/`[^`]+`/g), english[key].match(/`[^`]+`/g), key + ' examples');
  assert.deepEqual((wu[key].match(/<[^>]+>/g) || []).sort(), (english[key].match(/<[^>]+>/g) || []).sort(), key + ' arguments');
}
assert.match(wu['globalSearch-instructions-description'], /空格或者特殊字符.*引号/);
assert.match(wu['globalSearch-instructions-operator-user'], /成员.*或者.*负责人/);
for (const kind of ['created', 'modified']) assert.match(wu['globalSearch-instructions-operator-' + kind], /最近.*<n>.*天里向/);
assert.match(wu['globalSearch-instructions-operator-org'], /看板分配畀组织/);
assert.match(wu['globalSearch-instructions-operator-team'], /看板分配畀团队/);

const searchLogicHelpWu = ["globalSearch-instructions-status-archived", "globalSearch-instructions-status-all", "globalSearch-instructions-status-ended", "globalSearch-instructions-status-public", "globalSearch-instructions-status-private", "globalSearch-instructions-operator-has", "globalSearch-instructions-operator-sort", "globalSearch-instructions-operator-limit", "globalSearch-instructions-notes-1", "globalSearch-instructions-notes-2", "globalSearch-instructions-notes-3", "globalSearch-instructions-notes-3-2", "globalSearch-instructions-notes-4", "globalSearch-instructions-notes-5", "link-to-search"];
for (const key of searchLogicHelpWu) {
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
  assert.deepEqual(wu[key].match(/`[^`]+`/g), english[key].match(/`[^`]+`/g), key + ' examples');
}
assert.match(wu['globalSearch-instructions-notes-2'], /OR.*任意一只条件/s);
assert.match(wu['globalSearch-instructions-notes-3'], /AND.*满足所有.*\*Available\*.*\*red\*/s);
assert.match(wu['globalSearch-instructions-operator-has'], /加 `-`.*呒没值/);
assert.match(wu['globalSearch-instructions-operator-sort'], /降序.*加 `-`/);
assert.match(wu['globalSearch-instructions-operator-limit'], /正整数.*每页/);
assert.match(wu['globalSearch-instructions-notes-4'], /勿区分大小写/);
assert.match(wu['globalSearch-instructions-notes-5'], /默认勿搜索归档/);

const dependencyMapsWu = ["drag-to-connect", "import-dependencies-placeholder", "import-dependencies-parse-error", "import-dependencies-empty", "import-dependencies-done", "background-too-big", "board-background-delete-pop", "location-open-map", "location-detect-from-map", "location-detect-none", "location-detect-done", "location-open-map-at", "map-provider-saved", "server-error-troubleshooting", "created-at-newest-first", "created-at-oldest-first", "now-activities-of-all-boards-are-hidden"];
for (const key of dependencyMapsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.deepEqual(wu['background-too-big'].match(/\{\{[^}]+\}\}/g), english['background-too-big'].match(/\{\{[^}]+\}\}/g));
assert.deepEqual(wu['server-error-troubleshooting'].match(/`[^`]+`/g), english['server-error-troubleshooting'].match(/`[^`]+`/g));
assert.match(wu['server-error-troubleshooting'], /Snap 安装/);
assert.doesNotMatch(wu['server-error-troubleshooting'], /快照/);
assert.match(wu['import-dependencies-done'], /__imported__ 条线.*__unmatched__ 条配勿上/);
assert.match(wu['import-dependencies-empty'], /一只看板.*至少一条/);
assert.match(wu['now-activities-of-all-boards-are-hidden'], /所有看板.*全部动态/);

const reportsTemplatesWu = ["custom-field-stringtemplate-format", "custom-field-stringtemplate-separator", "custom-field-stringtemplate-item-placeholder", "creator", "creator-on-minicard", "securityReportTitle", "impersonation-admin", "impersonation-user", "office-report-desc", "office-people", "office-no-results", "api-report-desc", "api-no-calls", "recovery-report-desc", "recovery-no-events", "recovery-maintenance-title", "recovery-maintenance-note", "display-card-creator", "minimize-card", "delete-org-warning-message", "delete-team-warning-message"];
for (const key of reportsTemplatesWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.deepEqual(wu['custom-field-stringtemplate-separator'].match(/&(?:#32|nbsp);/g), english['custom-field-stringtemplate-separator'].match(/&(?:#32|nbsp);/g));
assert.match(wu['api-no-calls'], /只有.*WITH_API=true.*才开启/);
assert.match(wu['api-report-desc'], /账户搭端点配对列一行.*时间范围.*勿会每趟请求/);
assert.equal(wu['impersonation-admin'], '管理员');
assert.equal(wu['display-card-creator'], '显示卡片' + wu.creator);
assert.doesNotMatch(wu['display-card-creator'], /创建器/);
for (const entity of ['org', 'team']) assert.match(wu['delete-' + entity + '-warning-message'], /删勿脱.*至少还有一只用户属于/);
assert.match(wu['recovery-report-desc'], /MongoDB/);

const spinnersInvitationsWu = ["wait-spinner", "Bounce", "Cube", "Cube-Grid", "Dot", "Double-Bounce", "Rotateplane", "Scaleout", "Wave", "carbon-copy", "cardDetailsPopup-title", "add-teams-label", "remove-team-from-table", "remove-btn", "invite-people-success", "invite-people-error", "email-domain-allowed-to-invite", "to-create-teams-contact-admin"];
for (const key of spinnersInvitationsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const key of ['wait-spinner', 'Bounce', 'Cube', 'Cube-Grid', 'Dot', 'Double-Bounce', 'Rotateplane', 'Scaleout', 'Wave']) assert.match(wu[key], /等待动画/);
assert.match(wu.Rotateplane, /方块翻转/);
assert.doesNotMatch(wu.Rotateplane, /飞机/);
assert.match(wu.Scaleout, /放大淡出/);
assert.match(wu['carbon-copy'], /Cc:/);
assert.match(wu['remove-team-from-table'], /团队从看板里向移脱/);
assert.match(wu['email-domain-allowed-to-invite'], /自助注册关脱.*允许邀请.*电子邮件域名/);

const diagnosticsStorageWu = ["Node_heap_total_heap_size", "Node_heap_total_heap_size_executable", "Node_heap_total_physical_size", "Node_heap_total_available_size", "Node_heap_used_heap_size", "Node_heap_heap_size_limit", "Node_heap_malloced_memory", "Node_heap_peak_malloced_memory", "Node_heap_does_zap_garbage", "Node_heap_number_of_native_contexts", "Node_heap_number_of_detached_contexts", "Node_memory_usage_rss", "Node_memory_usage_heap_total", "Node_memory_usage_heap_used", "Node_memory_usage_external", "add-organizations-label", "remove-organization-from-board", "acceptance_of_our_legalNotice", "copied", "checklistActionsPopup-title", "moveChecklist", "moveChecklistPopup-title", "newlineBecomesNewChecklistItem", "newlineBecomesNewChecklistItemOriginOrder", "originOrder", "copyChecklistFromTemplate", "copyChecklistFromTemplatePopup-title", "edit-checklist-items-as-text", "editChecklistItemsAsTextPopup-title", "attachment-move-storage-fs", "attachment-move-storage-gridfs", "attachment-move-storage-s3", "move-all-attachments-to-fs", "move-all-attachments-to-gridfs", "move-all-attachments-to-s3", "move-all-attachments-of-board-to-fs", "move-all-attachments-of-board-to-gridfs", "move-all-attachments-of-board-to-s3", "move-attachments-none-found", "attachment-repair-locations-description", "attachment-repair-running", "attachment-repair-done", "attachment-repair-broken", "move-scope-both", "move-storage-all"];
for (const key of diagnosticsStorageWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const key of diagnosticsStorageWu.filter(key => key.startsWith('Node_'))) {
  assert.match(wu[key], /^Node /);
  assert.doesNotMatch(wu[key], /节点/);
}
assert.match(wu['remove-organization-from-board'], /组织从搿只看板里向移脱/);
assert.equal(wu.moveChecklist, wu['moveChecklistPopup-title']);
assert.doesNotMatch(wu.moveChecklist, /搬家/);
assert.match(wu.originOrder, /顺序/);
assert.doesNotMatch(wu.originOrder, /订单/);
for (const storage of ['fs', 'gridfs', 's3']) assert.match(wu['move-all-attachments-of-board-to-' + storage], /看板个全部附件/);
for (const [suffix, product] of [['gridfs', 'GridFS'], ['s3', 'S3']]) {
  for (const prefix of ['attachment-move-storage-', 'move-all-attachments-to-', 'move-all-attachments-of-board-to-']) assert.ok(wu[prefix + suffix].endsWith(product));
}
assert.match(wu['attachment-repair-locations-description'], /附件搭头像.*修复数据库.*实际位置/);

const storageProgressWu = ["default-save-storage-description", "default-save-storage-saved", "board-id", "mongodb-compact-description", "mongodb-compact-warning", "mongodb-compact-running", "mongodb-compact-success", "path", "size", "storage", "action", "board-status-cards-with-time", "remaining_time", "progress", "password-again", "if-you-already-have-an-account", "register", "minicardDetailsActionsPopup-title", "allowed-upload-filetypes", "allowed-avatar-filetypes", "invalid-file", "preview-pdf-not-supported", "drag-board", "drag-board-to-workspace", "translation-number"];
for (const key of storageProgressWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu.path, '路径');
assert.equal(wu.progress, '进度');
assert.equal(wu['board-id'], '看板 ID');
assert.match(wu['drag-board-to-workspace'], /分配畀 __workspaces__.*侧栏.*工作区/);
assert.match(wu['mongodb-compact-description'], /MongoDB GridFS.*勿会自动缩小.*批量文件移动完成/s);
assert.match(wu['mongodb-compact-warning'], /先自动整理全部从节点，再整理主节点/);
assert.match(wu['mongodb-compact-warning'], /oplog.*单节点副本集.*只整理主节点/);
assert.match(wu['invalid-file'], /文件名无效.*上传或者重命名.*取消/);
assert.match(wu['preview-pdf-not-supported'], /勿支持预览 PDF.*下载/);

const recurrenceLockoutWu = ["delete-translation-confirm-popup", "newTranslationPopup-title", "settingsTranslationPopup-title", "show-week-of-year", "convert-to-markdown", "import-board-zip", "collapse", "hideCheckedChecklistItems", "card-recurrence-interval", "cardRecurrenceIntervalPopup-title", "card-recurrence-interval-none", "support-info-not-added-yet", "support-info-only-for-logged-in-users", "accessibility-page-enabled", "accessibility-info-not-added-yet", "accounts-lockout-info", "accounts-lockout-known-users", "accounts-lockout-unknown-users", "accounts-lockout-failures-before", "accounts-lockout-settings-updated", "accounts-lockout-locked-users", "accounts-lockout-locked-users-info", "accounts-lockout-no-locked-users", "accounts-lockout-failed-attempts", "accounts-lockout-remaining-time", "accounts-lockout-user-unlocked", "accounts-lockout-confirm-unlock", "accounts-lockout-confirm-unlock-all"];
for (const key of recurrenceLockoutWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['convert-to-markdown'], /Markdown/);
assert.doesNotMatch(wu['convert-to-markdown'], /降价/);
assert.equal(wu['card-recurrence-interval'], wu['cardRecurrenceIntervalPopup-title']);
assert.match(wu['card-recurrence-interval'], /卡片.*重复/);
assert.doesNotMatch(wu['card-recurrence-interval-none'], /重置/);
assert.match(wu['import-board-zip'], /\.zip.*JSON.*看板名字.*附件.*子目录/);
assert.match(wu['show-week-of-year'], /ISO 8601/);
assert.match(wu['delete-translation-confirm-popup'], /撤销勿了/);
assert.match(wu['accounts-lockout-known-users'], /用户名正确，密码错误/);
assert.match(wu['accounts-lockout-unknown-users'], /用户名勿存在/);
assert.match(wu['accounts-lockout-failures-before'], /失败次数/);
assert.match(wu['accounts-lockout-confirm-unlock-all'], /全部锁定个用户/);

const accountsJobsWu = ["accounts-lockout-show-locked-users", "accounts-lockout-user-locked", "accounts-lockout-click-to-unlock", "accounts-lockout-status", "admin-people-filter-show", "admin-people-filter-locked", "admin-people-filter-active", "admin-people-filter-inactive", "admin-people-active-status", "admin-people-user-active", "admin-people-user-inactive", "accounts-lockout-all-users-unlocked", "active-cron-jobs", "add-cron-job", "add-cron-job-placeholder", "board-archive-failed", "board-archive-scheduled", "board-backup-failed", "board-backup-scheduled", "board-cleanup-failed", "board-cleanup-scheduled", "board-operations", "cron-jobs", "cron-migrations", "cron-job-delete-confirm", "cron-job-delete-failed", "cron-job-deleted", "cron-job-pause-failed", "cron-job-paused", "cron-job-resume-failed", "cron-job-resumed", "cron-job-start-failed", "cron-job-started", "cron-no-errors", "cron-error-details", "cron-retry-failed", "cron-resume-paused", "cron-errors-cleared", "cron-no-failed-migrations", "cron-no-paused-migrations", "cron-migrations-resumed", "cron-migrations-retried", "complete"];
for (const key of accountsJobsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['admin-people-user-active'], /启用.*点一下来停用/);
assert.match(wu['admin-people-user-inactive'], /停用.*点一下来启用/);
assert.equal(wu['accounts-lockout-status'], '状态');
for (const operation of ['archive', 'backup', 'cleanup']) {
  assert.match(wu['board-' + operation + '-scheduled'], /看板.*安排好/);
  assert.doesNotMatch(wu['board-' + operation + '-scheduled'], /电路板/);
  assert.match(wu['board-' + operation + '-failed'], /安排看板.*失败/);
}
assert.match(wu['cron-no-paused-migrations'], /呒没暂停个迁移好恢复/);
assert.doesNotMatch(wu['cron-no-paused-migrations'], /无法恢复/);
assert.match(wu['cron-no-failed-migrations'], /呒没失败个迁移好重试/);

const migrationHelpWu = ["idle", "filesystem-path-description", "filesystem-enabled-description", "s3-minio-storage-description", "s3-force-path-style-description", "azure-connection-string-description", "database-migration-description", "database-migrate-to-ferretdb", "database-migrate-to-mongodb", "database-migration-confirm", "database-migration-done", "sandstorm-migration-description", "sandstorm-migration-pending", "sandstorm-storage-item", "sandstorm-delete-raw-mongodb-description", "sandstorm-delete-raw-mongodb-confirm", "sandstorm-raw-mongodb-deleted"];
for (const key of migrationHelpWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const literal of ['mongodb://127.0.0.1:27018', 'mongodb://127.0.0.1:27019', 'WEKAN_FERRETDB_URL', 'WEKAN_MONGODB_URL', 'MONGO_URL', 'snap set wekan database=ferretdb', '=mongodb']) {
  assert.ok(wu['database-migration-description'].includes(literal), literal);
}
for (const literal of ['files/attachments', 'files/avatars', 'MongoDB 3', 'FerretDB v1', 'SQLite']) assert.ok(wu['sandstorm-migration-description'].includes(literal), literal);
assert.match(wu['database-migration-confirm'], /__db__.*附件搭头像勿受影响.*目标数据库必须正在运行/);
for (const suffix of ['description', 'confirm']) assert.match(wu['sandstorm-delete-raw-mongodb-' + suffix], /撤销勿了/);
assert.match(wu['sandstorm-delete-raw-mongodb-description'], /迁移成功以后/);
assert.match(wu['database-migration-description'], /MONGO_URL.*再重启 WeKan/);

const settingsHelpWu = ["cards-loading-auto", "cards-loading-all", "cards-loading-lazy", "cards-loading-description", "cards-loading-lazy-note", "render-links-as-plain-text", "render-links-as-plain-text-description", "always-show-code-as-text", "always-show-code-as-text-description", "disable-all-import-description", "disable-all-export-description", "disable-import-avatars-description", "disable-export-avatars-description", "anonymize-account", "anonymize-account-confirm-popup", "disable-activities-description", "disable-notifications-description", "disable-watch-description", "backup-scope-description", "theme-override-all-tenants"];
for (const key of settingsHelpWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const literal of ['CARDS_LOADING', 'all/lazy/auto', 'CARDS_LOADING_LAZY_THRESHOLD']) assert.ok(wu['cards-loading-description'].includes(literal), literal);
assert.doesNotMatch(wu['cards-loading-all'], /默认/);
for (const literal of ['[label](url)', '<a href>']) assert.ok(wu['render-links-as-plain-text-description'].includes(literal), literal);
assert.ok(wu['always-show-code-as-text-description'].includes('<!-- -->'));
assert.match(wu['anonymize-account-confirm-popup'], /永久.*用户名、全名搭电子邮件地址.*移脱头像.*停用登录.*保留历史记录.*撤销勿了/);
assert.doesNotMatch(wu['anonymize-account-confirm-popup'], /导出看板/);
assert.match(wu['backup-scope-description'], /勿包含用户账户搭实例设置.*只会写入搿只组织拥有个看板/);
for (const kind of ['import', 'export']) assert.match(wu['disable-all-' + kind + '-description'], /服务器会拒绝任何.*请求/);
assert.match(wu['disable-notifications-description'], /活动仍旧好记录.*只停脱通知/);

const cloudHelpWu = ["anonymize-import-users-description", "anonymize-export-users-description", "backup-restore-add-missing", "backup-restore-select-first", "gcs-key-filename-description", "gcs-credentials-description", "gcs-permissions-note", "cloud-secret-keep-blank", "azure-account-name-description", "azure-container-description", "gcs-project-id-description", "gcs-bucket-description", "s3-endpoint-menu-path", "s3-region-menu-path", "s3-bucket-menu-path", "s3-access-key-menu-path", "s3-secret-key-menu-path", "azure-account-name-menu-path", "azure-account-key-menu-path"];
for (const key of cloudHelpWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const kind of ['import', 'export']) {
  for (const literal of ['user1', 'user2', '@username', 'requested-by', 'assigned-by']) assert.ok(wu['anonymize-' + kind + '-users-description'].includes(literal), literal);
  assert.match(wu['anonymize-' + kind + '-users-description'], /移脱伊个头像/);
}
for (const literal of ['New principals', 'client_email', 'Storage Object Admin', 'Grant access']) assert.ok(wu['gcs-permissions-note'].includes(literal), literal);
for (const key of ['s3-access-key-menu-path', 's3-secret-key-menu-path']) assert.deepEqual(wu[key].match(/'[^']+'/g), english[key].match(/'[^']+'/g));
assert.match(wu['s3-secret-key-menu-path'], /创建密钥个辰光显示一趟.*当场复制/);
assert.match(wu['gcs-credentials-description'], /留空就用密钥文件或者默认凭据/);
assert.match(wu['cloud-secret-keep-blank'], /留空就保留现在个值/);
assert.match(wu['azure-account-key-menu-path'], /key1 → Show → Key/);

const cloudMigrationsWu = ["azure-connection-string-menu-path", "azure-container-menu-path", "gcs-project-id-menu-path", "gcs-bucket-menu-path", "gcs-key-filename-menu-path", "gcs-credentials-menu-path", "cloud-secret-set", "cloud-secret-none", "cloud-settings-saved", "attachment-move-storage-azure", "attachment-move-storage-gcs", "gridfs-enabled", "gridfs-enabled-description", "migration-starting", "migration-pausing", "migration-stopping", "migration-pause-failed", "migration-paused", "migration-start-failed", "migration-started", "migration-not-needed", "migration-stop-confirm", "migration-stop-failed", "migration-stopped"];
for (const key of cloudMigrationsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.match(wu['azure-connection-string-menu-path'], /key1 → Connection string → Show/);
assert.match(wu['gcs-credentials-menu-path'], /Keys → Add key → Create new key → JSON → Create/);
assert.match(wu['gcs-key-filename-menu-path'], /或者拿 JSON 粘贴/);
assert.match(wu['cloud-secret-set'], /留空就保留/);
assert.match(wu['attachment-move-storage-azure'], /Azure Blob Storage$/);
assert.match(wu['attachment-move-storage-gcs'], /Google Cloud Storage$/);
for (const action of ['starting', 'pausing', 'stopping']) assert.match(wu['migration-' + action], /^正在/);
for (const action of ['start', 'pause', 'stop']) assert.match(wu['migration-' + action + '-failed'], /失败/);
assert.match(wu['migration-stop-confirm'], /停止全部迁移/);

const storageJobsWu = ["gridfs-move-collectionfs-note", "s3-access-key-description", "s3-bucket", "s3-bucket-description", "s3-connection-failed", "s3-connection-success", "s3-enabled-description", "s3-endpoint", "s3-endpoint-description", "s3-port", "s3-port-description", "s3-region", "s3-region-description", "s3-secret-key", "s3-secret-key-description", "s3-secret-key-placeholder", "s3-secret-key-required", "s3-settings-save-failed", "s3-settings-saved", "s3-ssl-enabled", "s3-ssl-enabled-description", "schedule-board-archive", "schedule-board-backup", "schedule-board-cleanup", "scheduled-board-operations", "writable-path-description", "add-job", "board-migration", "card-show-lists-on-minicard", "comprehensive-board-migration", "comprehensive-board-migration-description", "delete-duplicate-empty-lists-migration-description"];
for (const key of storageJobsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const literal of ['s3.amazonaws.com', 'minio.example.com']) assert.ok(wu['s3-endpoint-description'].includes(literal), literal);
assert.ok(wu['s3-region-description'].includes('us-east-1'));
assert.ok(wu['s3-ssl-enabled-description'].includes('SSL/TLS'));
assert.match(wu['gridfs-move-collectionfs-note'], /附件搭头像.*CollectionFS.*别个存储/);
assert.equal(wu['add-job'], '添加任务');
for (const action of ['archive', 'backup', 'cleanup']) assert.match(wu['schedule-board-' + action], /^安排看板/);
assert.match(wu['delete-duplicate-empty-lists-migration-description'], /呒没卡片，而且.*同名列表包含卡片，才删脱/);
assert.match(wu['comprehensive-board-migration-description'], /列表顺序、卡片位置搭泳道结构/);

const repairPromptsWu = ["lost-cards", "lost-cards-list", "restore-lost-cards-migration", "restore-lost-cards-migration-description", "restore-all-archived-migration-description", "fix-missing-lists-migration-description", "fix-avatar-urls-migration-description", "fix-all-file-urls-migration-description", "migration-complete", "migration-running", "migration-successful", "migrations-admin-only", "migrations-description", "no-issues-found", "run-comprehensive-migration-confirm", "run-delete-duplicate-empty-lists-migration-confirm", "run-restore-lost-cards-migration-confirm", "run-restore-all-archived-migration-confirm", "run-fix-missing-lists-migration-confirm", "run-fix-avatar-urls-migration-confirm", "run-fix-all-file-urls-migration-confirm", "restore-lost-cards-nothing-to-restore", "migration-progress-title", "migration-progress-overall", "migration-progress-status", "migration-progress-details", "migration-progress-note", "view"];
for (const key of repairPromptsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const key of ['restore-lost-cards-migration-description', 'restore-all-archived-migration-description', 'run-restore-lost-cards-migration-confirm']) {
  for (const field of ['swimlaneId', 'listId']) assert.ok(wu[key].includes(field), key + ': ' + field);
  assert.doesNotMatch(wu[key], /SwimlaneId/);
}
assert.match(wu['run-restore-lost-cards-migration-confirm'], /只影响朆归档个项目/);
assert.match(wu['run-restore-all-archived-migration-confirm'], /全部归档.*勿容易撤销/);
assert.match(wu['run-delete-duplicate-empty-lists-migration-confirm'], /先拿共享列表转换.*再删脱.*同名列表包含卡片/);
assert.match(wu['migration-running'], /运行/);
assert.doesNotMatch(wu['migration-running'], /跑步/);
assert.match(wu['migrations-admin-only'], /只有看板管理员才好/);
assert.equal(wu['migration-progress-status'], '状态');

const monitoringLabelsWu = ["step-fix-orphaned-cards", "step-ensure-per-swimlane-lists", "step-update-cards", "step-finalize", "step-delete-duplicate-empty-lists", "step-ensure-lost-cards-swimlane", "step-restore-cards", "step-fix-missing-ids", "step-scan-files", "cleanup-old-jobs", "completed", "conversion-info-text", "converting-board", "converting-board-description", "cpu-cores", "cpu-usage", "current-action", "days-old", "duration", "estimated-time-remaining", "every-1-hour", "every-1-minute", "every-10-minutes", "every-30-minutes", "every-5-minutes", "every-6-hours", "export-monitoring", "force-board-scan", "gridfs-storage", "hide-list-on-minicard"];
for (const key of monitoringLabelsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const key of monitoringLabelsWu.filter(key => key.startsWith('every-'))) {
  assert.deepEqual(wu[key].match(/\d+/g), english[key].match(/\d+/g), key);
  assert.doesNotMatch(wu[key], /班/);
}
assert.equal(wu['gridfs-storage'], english['gridfs-storage']);
assert.equal(wu['days-old'], '经过天数');
assert.equal(wu.completed, '已完成');
assert.match(wu['export-monitoring'], /^导出/);
assert.match(wu['force-board-scan'], /强制扫描看板/);
assert.match(wu['conversion-info-text'], /每只看板只做一趟.*继续正常使用看板/);
assert.match(wu['step-ensure-per-swimlane-lists'], /每条泳道.*自家个列表/);

const jobControlsWu = ["job-description", "job-details", "job-name", "job-queue", "last-run", "migrate-all-to-s3", "migrated-attachments", "migration-batch-size-description", "migration-cpu-threshold-description", "migration-delay-ms-description", "migration-info-text", "migration-resume-failed", "migration-resumed", "migration-warning-text", "next-run", "overall-progress", "previous", "run-once", "s3-size", "search-boards-or-operations", "show-list-on-minicard", "showChecklistAtMinicard", "step-progress", "total-operations", "total-size", "unmigrated-boards"];
for (const key of jobControlsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const key of ['migration-batch-size-description', 'migration-cpu-threshold-description', 'migration-delay-ms-description']) assert.deepEqual(wu[key].match(/\d+-\d+/g), english[key].match(/\d+-\d+/g), key);
assert.match(wu['migration-cpu-threshold-description'], /CPU 使用率超过.*暂停迁移/);
assert.match(wu['migration-delay-ms-description'], /毫秒/);
assert.match(wu['migration-info-text'], /只做一趟.*关脱浏览器.*后台继续/);
assert.match(wu['migration-warning-text'], /勿要关脱浏览器.*后台继续.*更长辰光/);
for (const key of ['job-description', 'job-details', 'job-name', 'job-queue']) assert.match(wu[key], /^任务/);
assert.match(wu['unmigrated-boards'], /还朆迁移个看板/);
assert.equal(wu['total-operations'], '操作总数');

const repairResultsWu = ["cron", "already-account", "available-repositories", "no-repositories", "api-endpoints", "sign-in-to-upload", "account-locked", "otp-required", "invalid-credentials", "username-password-required", "password-mismatch", "username-too-short", "user-exists", "account-created", "account-creation-failed", "problems-status-title", "problems-in-progress-help", "problems-none-in-progress", "repair-broken-cards", "repair-broken-cards-done", "repair-broken-cards-done-unfixable", "restore-list-swimlanes-done"];
for (const key of repairResultsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.equal(wu.cron, english.cron);
assert.equal(wu['problems-status-title'], '状态');
assert.match(wu['username-too-short'], /至少.*3.*字符/);
assert.match(wu['account-locked'], /失败次数忒多.*暂时锁定.*再试/);
assert.match(wu['repair-broken-cards-done-unfixable'], /修复好 __fixed__ 张.*__unfixable__ 张卡片呒没所属看板，自动修复勿了/);
assert.match(wu['restore-list-swimlanes-done'], /恢复好 __restored__ 只.*__remaining__ 只恢复勿了/);
assert.match(wu['problems-none-in-progress'], /呒没正在运行个迁移或者修复/);

const importSyncWu = ["export-select-what-to-include", "export-card-details", "import-here-instruction", "import-not-wekan-export", "globalSearch-instructions-operator-number", "import-parts-instruction", "import-wekan-file", "sum-of-number-fields", "date-range-of-fields", "wip-limit-groups", "wip-limit-group-name-placeholder", "wip-limit-group-add", "wip-limit-group-select-swimlane", "wip-limit-group-apply-swimlane", "subtask-inherit-parent-labels", "list-sync-description", "list-sync-project-key-placeholder", "list-sync-credential-status-set", "list-sync-credential-status-unset", "list-sync-last-synced", "list-sync-last-error", "list-sync-now-success", "add-many-lines-as", "many-items"];
for (const key of importSyncWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
assert.deepEqual(wu['globalSearch-instructions-operator-number'].match(/`[^`]+`/g), english['globalSearch-instructions-operator-number'].match(/`[^`]+`/g));
assert.match(wu['globalSearch-instructions-operator-number'], /\*<number>\*/);
for (const key of ['import-here-instruction', 'import-wekan-file']) for (const extension of ['.json', '.zip']) assert.ok(wu[key].includes(extension), key + ': ' + extension);
assert.match(wu['list-sync-project-key-placeholder'], /PROJECT.*owner\/repo/);
assert.match(wu['list-sync-description'], /每 15 分钟.*立即同步.*马上检查/);
assert.match(wu['import-parts-instruction'], /只导入打钩个部分.*导出也用同样个选择/);
assert.equal(wu['wip-limit-group-add'], '添加 ' + wu['wip-limit-groups']);
assert.equal(wu['wip-limit-group-apply-swimlane'], '应用到泳道');

const flowReportsWu = ["board-view-aging-wip", "board-view-blocker-analysis", "board-view-monte-carlo", "board-view-process-behavior", "board-view-size-cycle-time", "flow-age-days", "flow-p85", "flow-samples", "flow-signal", "flow-unusual", "flow-blocker", "flow-episodes", "flow-active", "flow-blocked-days", "flow-unknown-start", "flow-confidence", "flow-target-count", "flow-finish-days", "flow-finish-date", "flow-target-date", "flow-capacity", "flow-history-days", "flow-beyond-horizon", "flow-mean", "flow-moving-range", "flow-mr-mean", "flow-size-source", "flow-size", "flow-error", "flow-details", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "flow-note-processBehavior", "flow-note-sizeCycleTime", "move-reason", "ask-move-reason", "time-adjustments", "time-adjustment-note"];
for (const key of flowReportsWu) assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
for (const literal of ['2,000', 'UTC', '3,650']) assert.ok(wu['flow-note-monteCarlo'].includes(literal), literal);
assert.match(wu['flow-note-monteCarlo'], /吞吐量为零.*日期是上尾预测，数量是下尾承诺.*勿是保证.*呒没完成记录就呒没预测/);
assert.match(wu['flow-note-agingWip'], /85.*至少要有五趟.*呒没进入记录.*未知/);
assert.match(wu['flow-note-blockerAnalysis'], /历史快照.*重叠个原因分别计数/);
assert.match(wu['flow-note-processBehavior'], /呒没就用创建时间.*呒没就用归档时间.*至少需要两条/);
assert.match(wu['flow-note-sizeCycleTime'], /缺少估算值搭日期无效个记录跳过/);
assert.match(wu['time-adjustment-note'], /勿是单独个工作时段.*负数是修正.*归勿到具体个人/);
assert.match(wu['flow-error'], /检查数值，再试/);

const blocklyLabelsWu = ["blockly-ANNOUNCE_MOVE_OF", "blockly-CONTROLS_IF_MSG_IF", "blockly-CONTROLS_REPEAT_INPUT_DO", "blockly-DIALOG_OK", "blockly-FIELD_BITMAP_PIXEL_ON", "blockly-LISTS_GET_SUBLIST_END_FROM_START", "blockly-LISTS_SET_INDEX_INPUT_TO", "blockly-LOGIC_OPERATION_OR", "blockly-PROCEDURES_DEFNORETURN_TITLE", "blockly-CONTROLS_FOREACH_INPUT_DO", "blockly-CONTROLS_FOR_INPUT_DO", "blockly-CONTROLS_IF_IF_TITLE_IF", "blockly-CONTROLS_IF_MSG_THEN", "blockly-CONTROLS_WHILEUNTIL_INPUT_DO", "blockly-PROCEDURES_DEFRETURN_TITLE"];
for (const key of blocklyLabelsWu) {
  assert.deepEqual(translationTokens(wu[key]), translationTokens(english[key]), key);
  assert.notEqual(wu[key], english[key], key);
}
assert.equal(wu['blockly-ANNOUNCE_MOVE_OF'].replace('%1', '输入').replace('%2', '积木'), '积木 个 输入');
assert.equal(wu['blockly-CONTROLS_IF_MSG_IF'], wu['blockly-CONTROLS_IF_IF_TITLE_IF']);
assert.equal(wu['blockly-PROCEDURES_DEFNORETURN_TITLE'], wu['blockly-PROCEDURES_DEFRETURN_TITLE']);
for (const key of ['CONTROLS_REPEAT_INPUT_DO', 'CONTROLS_FOREACH_INPUT_DO', 'CONTROLS_FOR_INPUT_DO', 'CONTROLS_IF_MSG_THEN', 'CONTROLS_WHILEUNTIL_INPUT_DO']) assert.equal(wu['blockly-' + key], '执行');
assert.match(wu['blockly-LISTS_GET_SUBLIST_END_FROM_START'], /#/);

// Current linked-field, import and delivery messages retain Wu syntax and the
// safety distinctions in their source, including short labels hidden by --list.
for (const key of ['attach-card-hint', 'custom-field-links-hint', 'custom-field-link-inactive', 'import-many-boards-hint', 'r-wrike-workflow-note']) {
  assert.match(wu[key], /搿|侬|个辰光|里向|卡片浪/, `${key}: Wu vocabulary, not a Mandarin seed`);
}
assert.match(wu['custom-field-links-hint'], /名字搭类型一样/);
assert.match(wu['custom-field-links-hint'], /只有一张卡片有个字段保留原样勿动/);
assert.match(wu['custom-field-link-sends'], /搿张卡片.*伊张卡片/);
assert.match(wu['custom-field-link-receives'], /伊张卡片.*搿张卡片/);
assert.match(wu['custom-field-link-inactive'], /勿好编辑两张卡片，或者有一张卡片归档仔/);
assert.match(wu['field-link-not-allowed'], /编辑两张卡片个权限/);
assert.match(wu['attach-card-self'], /勿好附加到自家/);
assert.match(wu['attached-card-unavailable'], /看勿到/);
assert.match(wu['import-many-boards-hint'], /勿匹配成员/);
assert.match(wu['import-many-boards-hint'], /本身是一份导出.*就算一块看板/);
assert.match(wu['import-many-boards-hint'], /勿再用上头个字段/);
assert.match(wu['webhook-hide-identity'], /勿带我个名字/);
assert.match(wu['subtask-mark-not-done'], /呒没做完/);
assert.match(wu['subtask-done-no-permission'], /侬勿好改/);
for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows', 'JSON']) {
  assert.ok(wu['r-wrike-workflow-note'].includes(literal), literal);
}
assert.match(wu['r-wrike-workflow-note'], /自家个自动化规则呒办法.*导出/);
assert.equal(wu['notification-delivery-daily-time'], '发送辰光');
assert.equal(wu['notification-delivery-quiet-to'], '到');
assert.match(wu['notification-delivery-quiet'], /等结束再发/);
assert.notEqual(wu['notification-delivery-grouping-all'], wu['notification-delivery-grouping-none']);
console.log('Wu current card links, imports, delivery decisions and short labels pass.');
