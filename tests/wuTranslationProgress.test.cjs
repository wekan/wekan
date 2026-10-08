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
