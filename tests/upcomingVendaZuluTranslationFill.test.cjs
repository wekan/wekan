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
