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
