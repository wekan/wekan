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
