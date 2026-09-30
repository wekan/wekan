'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const root = path.resolve(__dirname, '..');
const read = code => JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data', `${code}.i18n.json`)));
const english = read('en');
for (const code of ['vi', 'vi-VN', 'bg', 'el', 'el-GR', 'ca', 'ca_ES', 'ca@valencia',
  'ru', 'ru-RU', 'ru-UA', 'ru_RU', 'uk', 'uk-UA', 'pl', 'pl-PL', 'cs', 'cs-CZ',
  'de', 'de_DE', 'de-AT', 'de-CH', 'fr', 'fr-FR', 'fr-BE', 'fr-CA', 'fr-CH',
  'es', 'es-AR', 'es-LA', 'es-CL', 'es_CO', 'es-CO', 'es-PY', 'es-PE', 'es-MX', 'it',
  'pt', 'pt-PT', 'pt_PT', 'pt-BR', 'nl', 'nl-NL', 'sv', 'fi', 'et-EE', 'da', 'nb', 'tr', 'id', 'ro', 'ro-RO', 'hu', 'sk', 'ja', 'ja-JP', 'ko', 'ko-KR',
  'zh-CN', 'zh-Hans', 'zh', 'cmn', 'zh_SG', 'zh-GB', 'zh-Hant', 'zh-TW', 'zh-HK', 'ar', 'ar-DZ', 'ar-EG', 'gl', 'gl-ES', 'he', 'he-IL', 'fa', 'fa-IR', 'ms', 'ms-MY', 'sl', 'sl_SI', 'hr', 'sr', 'bs', 'mk', 'be', 'lt', 'lv', 'is', 'af', 'af_ZA', 'hi', 'hi-IN', 'bn', 'ta', 'ne', 'ur', 'th', 'gu-IN', 'kn', 'ga', 'co', 'sc', 'scn', 'nap', 'an', 'ast-ES', 'oc', 'br', 'eu', 'cy', 'cy-GB', 'gd', 'csb', 'eo', 'sq', 'hy', 'az', 'az-AZ', 'az-LA', 'ka', 'sw']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of Object.keys(english)) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}`);
  }
  // --list includes pending Transifex keys, unlike the aggregate --missing report.
  const missing = JSON.parse(execFileSync(process.execPath,
    ['releases/translations/fill-translations.mjs', '--list', code],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  assert.deepEqual(missing, {}, `${code}: no untranslated prose, including pending keys`);
  assert.notEqual(locale['blockly-END_KEY'], locale['end-date'], 'keyboard End is not an ending date');
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve todo.txt ${token}`);
  }
}
// Tagalog filtering and imports; other untranslated strings remain.
{
  const locale = read('tl');
  const mathFunctionKeys = ["blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN"];
  for (const key of mathFunctionKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  for (const name of ['COS', 'SIN', 'TAN']) {
    assert.match(locale[`blockly-MATH_TRIG_A${name}_ARIA`], /kabaligtarang/);
    assert.doesNotMatch(locale[`blockly-MATH_TRIG_${name}_ARIA`], /kabaligtarang/);
  }
  assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_NEG'], /kabaligtarang tanda/);
  assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_LOG10'], /base na 10/);
  const statisticsKeys = ["blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA"];
  for (const key of statisticsKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0 \(kasama\).*1\.0 \(hindi kasama\)/);
  assert.match(locale['blockly-MATH_RANDOM_INT_TOOLTIP'], /kasama ang mga hangganan/);
  assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_MODE'], /pinakamadalas/);
  assert.notEqual(locale['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'], locale['blockly-MATH_ROUND_OPERATOR_ROUNDUP']);
  const mathConstantKeys = ["blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_ODD", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN"];
  for (const key of mathConstantKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  assert.match(locale['blockly-MATH_CONSTRAIN_TOOLTIP'], /kasama ang mga hangganan/);
  for (const value of ['(X, Y)', '-180', '180']) {
    assert.ok(locale['blockly-MATH_ATAN2_TOOLTIP'].includes(value));
  }
  assert.notEqual(locale['blockly-MATH_ONLIST_OPERATOR_AVERAGE'], locale['blockly-MATH_ONLIST_OPERATOR_MEDIAN']);
  assert.notEqual(locale['blockly-MATH_IS_EVEN'], locale['blockly-MATH_IS_ODD']);
  const logicArithmeticKeys = ["blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE"];
  for (const key of logicArithmeticKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  for (const comparison of ['GT', 'LT']) {
    assert.doesNotMatch(locale[`blockly-LOGIC_COMPARE_${comparison}_ARIA`], /katumbas/);
    assert.match(locale[`blockly-LOGIC_COMPARE_${comparison}E_ARIA`], /katumbas/);
  }
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /parehong/);
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /kahit isa/);
  for (const suffix of ['CONDITION', 'IF_TRUE', 'IF_FALSE']) {
    assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale[`blockly-LOGIC_TERNARY_${suffix}`]));
  }
  const navigationListKeys = ["blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST"];
  for (const key of navigationListKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  for (const key of ['blockly-LISTS_REVERSE_TOOLTIP', 'blockly-LISTS_SORT_TOOLTIP']) {
    assert.match(locale[key], /kopya/);
  }
  assert.notEqual(locale['blockly-LISTS_SORT_ORDER_ASCENDING'], locale['blockly-LISTS_SORT_ORDER_DESCENDING']);
  assert.match(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /matagal ang %1.*%2/);
  assert.equal(locale['blockly-INPUT_LABEL_VARIABLES_SET'], locale['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET']);
  const numericTextInputKeys = ["blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE"];
  for (const key of numericTextInputKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  assert.notEqual(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], locale['blockly-INPUT_LABEL_MATH_DIVISOR']);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'], / x$/);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'], / y$/);
  assert.match(locale['blockly-INPUT_LABEL_TEXT_APPEND'], /sa dulo/);
  for (const end of ['START', 'END']) {
    assert.equal(locale[`blockly-INPUT_LABEL_TEXT_${end}_POSITION`], locale[`blockly-INPUT_LABEL_LISTS_${end}_POSITION`]);
  }
  const inputLabelKeys = ["blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES"];
  for (const key of inputLabelKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  assert.match(locale['blockly-ICON_LABEL_WARNING_CLOSED'], /Buksan/);
  assert.match(locale['blockly-ICON_LABEL_WARNING_OPEN'], /Isara/);
  assert.notEqual(locale['blockly-INPUT_LABEL_LISTS_START_POSITION'], locale['blockly-INPUT_LABEL_LISTS_END_POSITION']);
  assert.notEqual(locale['blockly-INPUT_LABEL_CONDITION_A'], locale['blockly-INPUT_LABEL_CONDITION_B']);
  assert.equal(locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'], locale['blockly-INPUT_LABEL_LOOP_TIMES']);
  const editorActionKeys = ["blockly-CUT_SHORTCUT", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED"];
  for (const key of editorActionKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  assert.match(locale['blockly-DELETE_VARIABLE_CONFIRMATION'], /%1.*%2/);
  assert.match(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'], /hanay %2, kolum %3/);
  assert.match(locale['blockly-ICON_LABEL_COMMENT_CLOSED'], /Buksan/);
  assert.match(locale['blockly-ICON_LABEL_COMMENT_OPEN'], /Isara/);
  assert.match(locale['blockly-END_KEY'], /Pindutang End/);
  const blockLabelKeys = ["blockly-BLOCK_LABEL_DISABLED", "blockly-BLOCK_LABEL_HAS_BRANCHES", "blockly-BLOCK_LABEL_HAS_INPUT", "blockly-BLOCK_LABEL_HAS_INPUTS", "blockly-BLOCK_LABEL_REPLACEABLE", "blockly-BLOCK_LABEL_STACK_BLOCKS", "blockly-BLOCK_LABEL_STATEMENT", "blockly-BLOCK_LABEL_TOOLBOX_CATEGORY", "blockly-BLOCK_LABEL_VALUE", "blockly-BUBBLE_LABEL_COMMENT", "blockly-BUBBLE_LABEL_DEFAULT", "blockly-BUBBLE_LABEL_WARNING", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CAPS_LOCK_KEY", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROL_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT"];
  for (const key of blockLabelKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  assert.match(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /Hindi mabura.*%1.*%2/);
  assert.match(locale['blockly-COLLAPSED_WARNINGS_WARNING'], /babala.*nakatiklop/);
  assert.notEqual(locale['blockly-BLOCK_LABEL_HAS_INPUT'], locale['blockly-BLOCK_LABEL_HAS_INPUTS']);
  assert.ok(locale['blockly-ARIA_LABEL_ADD_ELSE_IF'].includes(locale['blockly-CONTROLS_IF_MSG_ELSEIF']));
  const editorFieldKeys = ["blockly-ARIA_LABEL_BUTTON", "blockly-ARIA_LABEL_COMMENT_COLLAPSE", "blockly-ARIA_LABEL_COMMENT_EXPAND", "blockly-ARIA_LABEL_FIELD_ANGLE", "blockly-ARIA_LABEL_REMOVE_ELSE_IF", "blockly-ARIA_LABEL_REMOVE_INPUT", "blockly-ARIA_LABEL_REMOVE_LIST_ITEM", "blockly-ARIA_LABEL_REMOVE_TEXT", "blockly-ARIA_LABEL_TRASH_EMPTY", "blockly-ARIA_TYPE_FIELD_ANGLE", "blockly-ARIA_TYPE_FIELD_BITMAP", "blockly-ARIA_TYPE_FIELD_CHECKBOX", "blockly-ARIA_TYPE_FIELD_COLOUR", "blockly-ARIA_TYPE_FIELD_DATE", "blockly-ARIA_TYPE_FIELD_DROPDOWN", "blockly-ARIA_TYPE_FIELD_GRID", "blockly-ARIA_TYPE_FIELD_IMAGE", "blockly-ARIA_TYPE_FIELD_INPUT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE", "blockly-BACKSPACE_KEY", "blockly-BLOCK_LABEL_BEGIN_PREFIX", "blockly-BLOCK_LABEL_BEGIN_STACK", "blockly-BLOCK_LABEL_COLLAPSED", "blockly-BLOCK_LABEL_CONTAINER"];
  for (const key of editorFieldKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  assert.notEqual(locale['blockly-ARIA_LABEL_COMMENT_COLLAPSE'], locale['blockly-ARIA_LABEL_COMMENT_EXPAND']);
  assert.match(locale['blockly-ARIA_LABEL_FIELD_ANGLE'], /%1 digri/);
  assert.match(locale['blockly-ARIA_LABEL_TRASH_EMPTY'], /walang laman/);
  assert.match(locale['blockly-BACKSPACE_KEY'], /Backspace/);
  const mapAccessibilityKeys = ["draggable", "board-view-map", "map-view-empty", "map-view-upload", "map-view-remove-image", "map-view-unplaced", "map-view-place-hint", "map-view-all-placed", "blockly-ANNOUNCE_CANT_SCROLL_FURTHER", "blockly-ANNOUNCE_MOVE_AFTER", "blockly-ANNOUNCE_MOVE_AROUND", "blockly-ANNOUNCE_MOVE_BEFORE", "blockly-ANNOUNCE_MOVE_CANCELED", "blockly-ANNOUNCE_MOVE_INSIDE", "blockly-ANNOUNCE_MOVE_TO", "blockly-ANNOUNCE_MOVE_WORKSPACE", "blockly-ANNOUNCE_SCROLLED_DOWN", "blockly-ANNOUNCE_SCROLLED_LEFT", "blockly-ANNOUNCE_SCROLLED_RIGHT", "blockly-ANNOUNCE_SCROLLED_UP", "blockly-ARIA_LABEL_ADD_ELSE_IF", "blockly-ARIA_LABEL_ADD_INPUT", "blockly-ARIA_LABEL_ADD_LIST_ITEM", "blockly-ARIA_LABEL_ADD_TEXT"];
  for (const key of mapAccessibilityKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  assert.match(locale['map-view-empty'], /tagapangasiwa ng pisara/);
  assert.match(locale['map-view-place-hint'], /I-drag.*o piliin.*i-click/);
  assert.match(locale['blockly-ANNOUNCE_MOVE_BEFORE'], /bago/);
  assert.match(locale['blockly-ANNOUNCE_MOVE_AFTER'], /pagkatapos/);
  assert.notEqual(locale['blockly-ANNOUNCE_SCROLLED_LEFT'], locale['blockly-ANNOUNCE_SCROLLED_RIGHT']);
  const reminderPresetKeys = ["notification-activity-customFields", "notification-activity-archive", "notification-activity-created", "due-reminder-heading", "due-reminder-days-label", "due-reminder-off", "due-reminder-webhook", "due-reminder-invalid", "due-reminder-saved", "dependency-type-duplicates", "dependency-type-is-duplicated-by", "custom-field-stringtemplate-context-hint", "filter-presets", "filter-preset-choose", "filter-preset-name", "filter-preset-save", "filter-preset-replace-hint", "filter-preset-saved", "filter-preset-applied", "filter-preset-deleted", "filter-preset-error", "filter-card-text-label", "import-report-heading", "import-report-description", "import-report-open-board"];
  for (const key of reminderPresetKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  for (const key of ['admin-panel', 'problems', 'recoveryReportTitle']) {
    assert.ok(locale['import-report-description'].includes(locale[key]));
  }
  assert.match(locale['due-reminder-days-label'], /positibong.*bago.*negatibong.*pagkatapos/);
  assert.match(locale['due-reminder-invalid'], /sampung.*-14.*14/);
  assert.match(locale['filter-preset-replace-hint'], /Pribado.*parehong pangalan/);
  assert.ok(locale['custom-field-stringtemplate-context-hint'].includes('%{value|urlencode}'));
  const rulesNotificationKeys = ["instance", "instance-desc", "board-instance-info", "automatic-linked-url-schemes-hint", "other-parent-cards", "add-parent-card", "remove-parent-card", "r-when-card-date", "r-trigger-vars-hint", "r-insert-variable", "r-vars-people-hint", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part", "notification-activity-heading", "notification-activity-description", "notification-activity-labels", "notification-activity-members", "notification-activity-assignees", "notification-activity-comments", "notification-activity-moves", "notification-activity-dates", "notification-activity-checklists", "notification-activity-attachments"];
  for (const key of rulesNotificationKeys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Field name}']) {
    assert.ok(locale['r-vars-people-hint'].includes(token));
  }
  assert.match(locale['instance-desc'], /hindi naka-sign in/);
  assert.match(locale['instance-desc'], /idinagdag lamang.*mag-edit/);
  assert.match(locale['notification-activity-description'], /Palaging.*@mentions/);
  assert.match(locale['r-rule-any-trigger-help'], /alinman.*sunod-sunod/);
  const keys = ["auto-archive-days", "auto-archive-off", "auto-archive-hint", "filter-recency-any", "filter-recency-day", "filter-recency-week", "filter-recency-month", "filter-recency-older", "filter-movement-range", "filter-date-range-field", "filter-date-range-from", "filter-date-range-to", "filter-date-range-missing", "filter-date-range-list-entry", "filter-date-range-invalid", "filter-due-any", "filter-due-previous-week", "filter-due-next-month", "filter-column-age", "filter-column-age-disabled", "filter-column-age-days", "filter-column-age-hint", "advanced-filter-card-dates-hint", "import-board-instruction-leo", "import-board-instruction-todotxt"];
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `tl:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `tl:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token));
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token));
  }
  assert.match(locale['filter-date-range-from'], /kasama ang petsang ito/);
  assert.match(locale['filter-date-range-to'], /kasama ang petsang ito/);
  assert.match(locale['auto-archive-hint'], /hindi kailanman.*template/);
}
// Swahili translation batches and recovery guidance.
{
  const locale = read('sw');
  const legacyRecoveryKeys = ["rule-email-resolution-failed", "rule-email-legacy-heading", "rule-email-legacy-description", "rule-email-legacy-source", "rule-email-legacy-mail", "rule-email-legacy-reason", "rule-email-legacy-reason-unbound", "rule-email-legacy-reason-details-snapshot", "rule-email-legacy-rebind", "rule-email-legacy-discard", "rule-email-legacy-rebind-confirm", "rule-email-legacy-discard-confirm", "rule-email-legacy-empty", "rule-email-legacy-unavailable", "rule-email-legacy-access-denied", "rule-email-legacy-source-changed", "rule-email-legacy-source-unavailable", "rule-email-legacy-plan-unavailable", "rule-email-legacy-attempt-exists", "rule-email-legacy-not-legacy", "rule-email-legacy-failed", "saml-login-not-started", "move-selection-before", "move-selection-after", "history-request-pending-undo", "history-request-pending-redo", "history-request-hint", "history-request-retry", "history-request-forget"];
  for (const key of legacyRecoveryKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['rule-email-legacy-discard-confirm'], /Haitatumwa kamwe/);
  assert.match(locale['rule-email-legacy-rebind-confirm'], /kadi ilivyo sasa/);
  assert.match(locale['saml-login-not-started'], /SAML.*kichupo hiki/);
  assert.match(locale['history-request-hint'], /ombi lilelile.*hakuwezi kutengua badiliko la pili/);
  const emailResolutionKeys = ["rule-email-recovery-recipients", "rule-email-recovery-recipient-accepted", "rule-email-recovery-recipient-unconfirmed", "rule-email-recovery-actions-hint", "rule-email-recovery-wait", "rule-email-recovery-resends", "rule-email-recovery-resend", "rule-email-recovery-mark-sent", "rule-email-recovery-drop", "rule-email-recovery-resend-confirm", "rule-email-recovery-mark-sent-confirm", "rule-email-recovery-drop-confirm", "rule-email-resolution-too-early", "rule-email-resolution-already-resolved", "rule-email-resolution-resend-in-flight", "rule-email-resolution-nothing-to-resend", "rule-email-resolution-resend-uncertain", "rule-email-resolution-busy", "rule-email-resolution-command-changed", "rule-email-resolution-attempt-invalid"];
  for (const key of emailResolutionKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /mara mbili/);
  assert.match(locale['rule-email-recovery-mark-sent-confirm'], /tu ikiwa unajua imefika/);
  assert.match(locale['rule-email-recovery-actions-hint'], /haitumi tena yenyewe/);
  assert.match(locale['rule-email-recovery-drop-confirm'], /Haitatumwa/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /imefika au haijafika/);
  const notificationControlKeys = ["activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-heading", "rule-email-recovery-description", "rule-email-recovery-all", "rule-email-recovery-unconfirmed", "rule-email-recovery-sent", "rule-email-recovery-invalid", "rule-email-recovery-identifiers", "rule-email-recovery-started", "rule-email-recovery-finished", "rule-email-recovery-empty", "rule-email-recovery-unavailable", "rule-email-recovery-dropped", "rule-email-recovery-review"];
  for (const key of notificationControlKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Hauwezi kuendelea tena/);
  assert.match(locale['activity-recovery-cancel-confirm'], /kwenye foleni.*hazirudishwi/);
  assert.match(locale['rule-email-recovery-description'], /haijaribu tena wala kughairi/);
  assert.match(locale['rule-email-recovery-sent'], /seva ya barua pepe/);
  assert.equal(locale['activity-recovery-resume'], locale['email-recovery-resume']);
  const activityRecoveryKeys = ["sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause"];
  for (const key of activityRecoveryKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['sync-time-estimate-hint'], /sehemu moja tu/);
  assert.match(locale['sync-time-estimate-hint'], /hupuuzwa.*null.*hufuta/);
  assert.match(locale['activity-recovery-description'], /hakuundi shughuli upya kamwe/);
  assert.match(locale['activity-recovery-failed'], /inayosubiri imehifadhiwa/);
  assert.notEqual(locale['activity-recovery-status-missing'], locale['activity-recovery-status-changed']);
  const emailFailureKeys = ["email-recovery-empty", "email-recovery-unavailable", "email-recovery-busy", "email-recovery-failed", "email-recovery-superseded", "email-recovery-confirm-cancel", "email-recovery-attention", "email-recovery-stopped", "email-recovery-retry", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time"];
  for (const key of emailFailureKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /hayawezi kurejeshwa/);
  assert.match(locale['email-recovery-confirm-cancel'], /baada ya ombi hili utahifadhiwa/);
  assert.match(locale['email-failure-smtp-temporary'], /kwa muda/);
  assert.match(locale['email-failure-smtp-rejected'], /kwa kudumu/);
  for (const key of ['sync-original-time', 'sync-remaining-time']) {
    assert.match(locale[key], /\(saa\)/);
  }
  const emailQueueKeys = ["sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-recovery-heading", "email-recovery-description", "email-recovery-saving", "email-recovery-queued", "email-recovery-retrying", "email-recovery-attempts", "email-recovery-oldest", "email-recovery-next", "email-recovery-changed", "email-recovery-pause", "email-recovery-resume", "email-recovery-cancel", "email-recovery-paused", "email-recovery-pending"];
  for (const key of emailQueueKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['sync-recovery-description'], /30/);
  assert.match(locale['sync-estimate-field-hint'], /zinazokosekana.*hupuuzwa.*null.*hufuta/);
  assert.match(locale['email-recovery-description'], /hauwezi kurudishwa/);
  assert.match(locale['email-recovery-description'], /usio na uhakika unaweza kurudiwa/);
  assert.match(locale['email-recovery-description'], /kuheshimu usitishaji uliopo/);
  const syncReportKeys = ["sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed"];
  for (const key of syncReportKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['sync-report-retention'], /20.*30/);
  assert.match(locale['sync-source-truncated'], /100/);
  assert.match(locale['sync-report-partial'], /haziendelezi wala kutengua/);
  assert.match(locale['sync-source-scope'], /thamani zake hazionyeshwi/);
  for (const suffix of ['excluded', 'unmapped']) {
    assert.equal(locale[`sync-preview-${suffix}`], locale[`sync-source-${suffix}`]);
  }
  const syncConflictKeys = ["scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update"];
  for (const key of syncConflictKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Hakuna kinachotumwa/);
  assert.match(locale['sync-conflict-review-complete'], /orodha nzima haukuendeshwa/);
  assert.match(locale['sync-conflict-detach-hint'], /Maudhui yake yatabaki/);
  assert.match(locale['sync-conflict-archive-hint'], /Kadi ndogo hazibadilishwi/);
  assert.match(locale['sync-conflict-creation-hint'], /Majaribio ya kurudia hutumia/);
  const sprintReportKeys = ["scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help"];
  for (const key of sprintReportKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
    assert.match(locale[key], /UTC/);
    assert.match(locale[key], /yasiyojulikana si sifuri/);
    assert.match(locale[key], /siku hazionyeshwi|rekodi hazionyeshwi/);
  }
  assert.match(locale['scrum-daily-truncated'], /366/);
  assert.equal(locale['scrum-category-backlog'], locale['scrum-backlog']);
  assert.equal(locale['scrum-category-done'], locale['scrum-completed']);
  const sprintEventKeys = ["scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete"];
  for (const key of sprintEventKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.equal(locale['scrum-product-backlog'], locale['board-view-product-backlog']);
  assert.match(locale['scrum-rollover-sprint'], /hazijakamilika/);
  assert.match(locale['scrum-timebox'], /dakika/);
  assert.notEqual(locale['scrum-event-review'], locale['scrum-event-retrospective']);
  assert.notEqual(locale['scrum-completed'], locale['scrum-incomplete']);
  const rulesPlanningKeys = ["r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint"];
  for (const key of rulesPlanningKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['r-blocks-permission'], /msimamizi wa bodi/);
  assert.match(locale['r-blocks-conflict'], /Pakia upya.*kabla ya kuhifadhi/);
  assert.match(locale['r-blocks-invalid'], /kimoja tu/);
  assert.equal(locale['board-view-sprints'], locale['scrum-sprints']);
  assert.notEqual(locale['scrum-policy-dueComplete'], locale['scrum-policy-doneLists']);
  const workspaceSearchKeys = ["blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-LISTS_CREATE_WITH_ITEM_TITLE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-MATH_CHANGE_TITLE_ITEM", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "blockly-TEXT_APPEND_VARIABLE", "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM", "r-blocks-view", "r-blocks-help", "r-blocks-discard"];
  for (const key of workspaceSearchKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const shortcut of ['Enter', 'Shift+Enter', 'Escape']) {
    assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(shortcut));
  }
  assert.match(locale['r-blocks-discard'], /hayajahifadhiwa/);
  assert.match(locale['r-blocks-help'], /kichocheo kimoja na kitendo kimoja/);
  for (const suffix of ['COMMENT', 'PROCEDURE']) {
    assert.equal(locale[`blockly-PROCEDURES_DEFRETURN_${suffix}`], locale[`blockly-PROCEDURES_DEFNORETURN_${suffix}`]);
  }
  const textVariableKeys = ["blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO"];
  for (const key of textVariableKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-TEXT_REPLACE_TOOLTIP'], /kila tukio/);
  assert.match(locale['blockly-TEXT_LENGTH_TOOLTIP'], /pamoja na nafasi/);
  assert.match(locale['blockly-TEXT_TRIM_OPERATOR_LEFT'], /kushoto/);
  assert.match(locale['blockly-TEXT_TRIM_OPERATOR_RIGHT'], /kulia/);
  assert.match(locale['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'], /^Hakuna/);
  assert.match(locale['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE'], /mmoja/);
  const textPositionKeys = ["blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-SPACE_KEY", "blockly-TAB_KEY", "blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP"];
  for (const key of textPositionKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-TEXT_APPEND_TOOLTIP'], /mwishoni/);
  assert.match(locale['blockly-TEXT_CHARAT_FROM_END'], /kutoka mwisho/);
  assert.doesNotMatch(locale['blockly-TEXT_CHARAT_FROM_START'], /kutoka mwisho/);
  assert.match(locale['blockly-TEXT_INDEXOF_TOOLTIP'], /%1 ikiwa maandishi hayapatikani/);
  assert.notEqual(locale['blockly-TEXT_INDEXOF_OPERATOR_FIRST'], locale['blockly-TEXT_INDEXOF_OPERATOR_LAST']);
  const accessibilityShortcutKeys = ["blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHIFT_KEY", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP"];
  for (const key of accessibilityShortcutKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-SCREENREADER_MODE_DISABLED'], /imezimwa.*kuiwasha/);
  assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'], /imewashwa.*kuizima/);
  for (const direction of ['DOWN', 'LEFT', 'RIGHT', 'UP']) {
    assert.notEqual(locale[`blockly-SHORTCUTS_MOVE_${direction}`], locale[`blockly-SHORTCUTS_SCROLL_${direction}`]);
  }
  assert.notEqual(locale['blockly-SHORTCUTS_JUMP_BLOCK_START'], locale['blockly-SHORTCUTS_JUMP_BLOCK_END']);
  const procedureKeys = ["blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PAUSE_KEY", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_COMMENT"];
  for (const key of procedureKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /lisilo na matokeo/);
  assert.match(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /lenye matokeo/);
  assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /imezimwa/);
  assert.match(locale['blockly-PROCEDURES_IFRETURN_WARNING'], /ndani.*pekee/);
  assert.equal(locale['blockly-PROCEDURES_BEFORE_PARAMS'], locale['blockly-PROCEDURES_CALL_BEFORE_PARAMS']);
  const mathFunctionKeys = ["blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE"];
  for (const key of mathFunctionKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const name of ['COS', 'SIN', 'TAN']) {
    assert.match(locale[`blockly-MATH_TRIG_TOOLTIP_${name}`], /digrii \(si radiani\)/);
    assert.doesNotMatch(locale[`blockly-MATH_TRIG_${name}_ARIA`], /kinyume/);
    assert.match(locale[`blockly-MATH_TRIG_A${name}_ARIA`], /kinyume/);
  }
  assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_NEG'], /alama iliyogeuzwa/);
  const mathStatisticsKeys = ["blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP"];
  for (const key of mathStatisticsKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0 \(ikijumuishwa\)/);
  assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /1\.0 \(bila kujumuishwa\)/);
  assert.match(locale['blockly-MATH_RANDOM_INT_TOOLTIP'], /ikijumuisha mipaka yenyewe/);
  assert.notEqual(locale['blockly-MATH_ONLIST_OPERATOR_AVERAGE'], locale['blockly-MATH_ONLIST_OPERATOR_MEDIAN']);
  assert.notEqual(locale['blockly-MATH_IS_EVEN'], locale['blockly-MATH_IS_ODD']);
  const mathConstantKeys = ["blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA"];
  for (const key of mathConstantKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-MATH_CONSTRAIN_TOOLTIP'], /vikijumuishwa/);
  for (const value of ['-180', '180', '(X, Y)']) {
    assert.ok(locale['blockly-MATH_ATAN2_TOOLTIP'].includes(value));
  }
  assert.notEqual(locale['blockly-MATH_CONSTANT_SQRT1_2_ARIA'], locale['blockly-MATH_CONSTANT_SQRT2_ARIA']);
  const logicGuidanceKeys = ["blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE"];
  for (const key of logicGuidanceKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const comparison of ['GT', 'LT']) {
    assert.doesNotMatch(locale[`blockly-LOGIC_COMPARE_TOOLTIP_${comparison}`], /au sawa na/);
    assert.match(locale[`blockly-LOGIC_COMPARE_TOOLTIP_${comparison}E`], /au sawa na/);
  }
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /yote mawili/);
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /angalau ingizo moja/);
  for (const suffix of ['CONDITION', 'IF_FALSE', 'IF_TRUE']) {
    assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale[`blockly-LOGIC_TERNARY_${suffix}`]));
  }
  const sortingComparisonKeys = ["blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER", "blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA"];
  for (const key of sortingComparisonKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const comparison of ['GT', 'LT']) {
    assert.doesNotMatch(locale[`blockly-LOGIC_COMPARE_${comparison}_ARIA`], /au sawa na/);
    assert.match(locale[`blockly-LOGIC_COMPARE_${comparison}E_ARIA`], /au sawa na/);
  }
  assert.match(locale['blockly-LISTS_SORT_TOOLTIP'], /nakala/);
  assert.match(locale['blockly-LISTS_SPLIT_TOOLTIP_JOIN'], /^Unganisha/);
  assert.match(locale['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'], /^Gawanya/);
  assert.notEqual(locale['blockly-LISTS_SORT_ORDER_DESCENDING'], locale['blockly-LISTS_SORT_ORDER_ASCENDING']);
  const listEditingKeys = ["blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING"];
  for (const key of listEditingKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
    assert.match(locale[`blockly-LISTS_SET_INDEX_TOOLTIP_SET_${position}`], /^Huweka thamani/);
    assert.notEqual(locale[`blockly-LISTS_SET_INDEX_TOOLTIP_SET_${position}`], locale[`blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_${position}`]);
  }
  assert.match(locale['blockly-LISTS_REVERSE_TOOLTIP'], /mpangilio.*nakala ya orodha/);
  assert.match(locale['blockly-LISTS_REPEAT_TITLE'], /%1.*mara %2/);
  const listRetrievalKeys = ["blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP"];
  for (const key of listRetrievalKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
    assert.match(locale[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_${position}`], /^Huondoa na kurejesha/);
    assert.match(locale[`blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_${position}`], /^Huondoa kipengele/);
  }
  assert.match(locale['blockly-LISTS_GET_SUBLIST_TOOLTIP'], /nakala/);
  assert.match(locale['blockly-LISTS_INDEX_OF_TOOLTIP'], /%1 ikiwa kipengele hakipatikani/);
  assert.notEqual(locale['blockly-LISTS_GET_SUBLIST_START_FROM_END'], locale['blockly-LISTS_GET_SUBLIST_START_FROM_START']);
  const navigationListKeys = ["blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST"];
  for (const key of navigationListKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /Shikilia %1.*%2 kukubali nafasi/);
  assert.match(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'], /urefu wa 0.*isiyo na/);
  assert.match(locale['blockly-LISTS_CREATE_WITH_TOOLTIP'], /idadi yoyote/);
  assert.notEqual(locale['blockly-LISTS_GET_INDEX_FIRST'], locale['blockly-LISTS_GET_INDEX_LAST']);
  assert.notEqual(locale['blockly-LISTS_GET_INDEX_GET'], locale['blockly-LISTS_GET_INDEX_GET_REMOVE']);
  const textNavigationKeys = ["blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT"];
  for (const key of textNavigationKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.equal(locale['blockly-INPUT_LABEL_VARIABLES_SET'], locale['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET']);
  assert.notEqual(locale['blockly-KEYBOARD_NAV_COPIED_HINT'], locale['blockly-KEYBOARD_NAV_CUT_HINT']);
  assert.match(locale['blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT'], /vitufe vya mishale.*%1 kukubali nafasi/);
  assert.notEqual(locale['blockly-INPUT_LABEL_TEXT_START_POSITION'], locale['blockly-INPUT_LABEL_TEXT_END_POSITION']);
  assert.notEqual(locale['blockly-INPUT_LABEL_VALUE_A'], locale['blockly-INPUT_LABEL_VALUE_B']);
  const numericInputKeys = ["blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK"];
  for (const key of numericInputKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], /inayogawanywa/);
  assert.notEqual(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], locale['blockly-INPUT_LABEL_MATH_DIVISOR']);
  assert.notEqual(locale['blockly-INPUT_LABEL_LOOP_FROM'], locale['blockly-INPUT_LABEL_LOOP_TO']);
  assert.notEqual(locale['blockly-INPUT_LABEL_NUMBER_MAX'], locale['blockly-INPUT_LABEL_NUMBER_MIN']);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'], /x$/);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'], /y$/);
  const listInputKeys = ["blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE"];
  for (const key of listInputKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-ICON_LABEL_WARNING_CLOSED'], /^Fungua/);
  assert.match(locale['blockly-ICON_LABEL_WARNING_OPEN'], /^Funga /);
  assert.match(locale['blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT'], /maandishi ya kugawanya/);
  assert.match(locale['blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST'], /orodha ya kuunganisha/);
  assert.notEqual(locale['blockly-INPUT_LABEL_LISTS_START_POSITION'], locale['blockly-INPUT_LABEL_LISTS_END_POSITION']);
  assert.notEqual(locale['blockly-INPUT_LABEL_CONDITION_A'], locale['blockly-INPUT_LABEL_CONDITION_B']);
  const editorFieldKeys = ["blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED"];
  for (const key of editorFieldKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'], /safu mlalo %2, safu wima %3/);
  assert.match(locale['blockly-FIELD_BITMAP_ARIA_VALUE'], /pikseli %3 zimewashwa/);
  assert.match(locale['blockly-ICON_LABEL_COMMENT_CLOSED'], /^Fungua/);
  assert.match(locale['blockly-ICON_LABEL_COMMENT_OPEN'], /^Funga /);
  assert.match(locale['blockly-HOME_KEY'], /Home/);
  assert.notEqual(locale['blockly-FIELD_MULTILINEINPUT_FINISH_EDITING'], locale['blockly-FIELD_MULTILINEINPUT_NEW_LINE']);
  const editorActionKeys = ["blockly-CONTROL_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENABLE_BLOCK", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE"];
  for (const key of editorActionKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-DELETE_ALL_BLOCKS'], /zote %1\?/);
  assert.match(locale['blockly-DELETE_VARIABLE_CONFIRMATION'], /matumizi %1/);
  assert.match(locale['blockly-COPY_ALL_TO_BACKPACK'], /bloku zote/);
  assert.notEqual(locale['blockly-COPY_SHORTCUT'], locale['blockly-CUT_SHORTCUT']);
  assert.notEqual(locale['blockly-DISABLE_BLOCK'], locale['blockly-ENABLE_BLOCK']);
  assert.match(locale['blockly-END_KEY'], /End/);
  const conditionLoopKeys = ["blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE"];
  for (const key of conditionLoopKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'], /ndani ya kitanzi pekee/);
  assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /si kweli/);
  assert.doesNotMatch(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /si kweli/);
  assert.match(locale['blockly-CONTROLS_IF_TOOLTIP_4'], /hakuna thamani iliyo kweli.*bloku ya mwisho/);
  assert.doesNotMatch(locale['blockly-CONTROLS_IF_TOOLTIP_3'], /bloku ya mwisho/);
  const colorLoopKeys = ["blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE"];
  for (const key of colorLoopKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.ok(locale['blockly-COLOUR_BLEND_TOOLTIP'].includes('0.0 - 1.0'));
  assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'], /0 na 100/);
  assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'], /^Toka/);
  assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'], /^Ruka.*marudio yanayofuata/);
  assert.notEqual(locale['blockly-COLOUR_BLEND_COLOUR1'], locale['blockly-COLOUR_BLEND_COLOUR2']);
  const blockLabelKeys = ["blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE", "blockly-BACKSPACE_KEY", "blockly-BLOCK_LABEL_BEGIN_PREFIX", "blockly-BLOCK_LABEL_BEGIN_STACK", "blockly-BLOCK_LABEL_COLLAPSED", "blockly-BLOCK_LABEL_CONTAINER", "blockly-BLOCK_LABEL_DISABLED", "blockly-BLOCK_LABEL_HAS_BRANCHES", "blockly-BLOCK_LABEL_HAS_INPUT", "blockly-BLOCK_LABEL_HAS_INPUTS", "blockly-BLOCK_LABEL_REPLACEABLE", "blockly-BLOCK_LABEL_STACK_BLOCKS", "blockly-BLOCK_LABEL_STATEMENT", "blockly-BLOCK_LABEL_TOOLBOX_CATEGORY", "blockly-BLOCK_LABEL_VALUE", "blockly-BUBBLE_LABEL_COMMENT", "blockly-BUBBLE_LABEL_DEFAULT", "blockly-BUBBLE_LABEL_WARNING", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CAPS_LOCK_KEY", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING"];
  for (const key of blockLabelKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /Haiwezekani kufuta.*ufafanuzi/);
  assert.match(locale['blockly-COLLAPSED_WARNINGS_WARNING'], /zilizokunjwa zina maonyo/);
  assert.match(locale['blockly-BACKSPACE_KEY'], /Backspace/);
  assert.match(locale['blockly-CAPS_LOCK_KEY'], /Caps Lock/);
  assert.notEqual(locale['blockly-BLOCK_LABEL_HAS_INPUT'], locale['blockly-BLOCK_LABEL_HAS_INPUTS']);
  assert.notEqual(locale['blockly-BLOCK_LABEL_COLLAPSED'], locale['blockly-BLOCK_LABEL_DISABLED']);
  const editorLabelKeys = ["blockly-ARIA_LABEL_ADD_TEXT", "blockly-ARIA_LABEL_BUTTON", "blockly-ARIA_LABEL_COMMENT_COLLAPSE", "blockly-ARIA_LABEL_COMMENT_EXPAND", "blockly-ARIA_LABEL_FIELD_ANGLE", "blockly-ARIA_LABEL_REMOVE_ELSE_IF", "blockly-ARIA_LABEL_REMOVE_INPUT", "blockly-ARIA_LABEL_REMOVE_LIST_ITEM", "blockly-ARIA_LABEL_REMOVE_TEXT", "blockly-ARIA_LABEL_TRASH_EMPTY", "blockly-ARIA_TYPE_FIELD_ANGLE", "blockly-ARIA_TYPE_FIELD_BITMAP", "blockly-ARIA_TYPE_FIELD_CHECKBOX", "blockly-ARIA_TYPE_FIELD_COLOUR", "blockly-ARIA_TYPE_FIELD_DATE", "blockly-ARIA_TYPE_FIELD_DROPDOWN", "blockly-ARIA_TYPE_FIELD_GRID", "blockly-ARIA_TYPE_FIELD_IMAGE", "blockly-ARIA_TYPE_FIELD_INPUT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT"];
  for (const key of editorLabelKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const suffix of ['TEXT', 'INPUT', 'LIST_ITEM', 'ELSE_IF']) {
    assert.match(locale[`blockly-ARIA_LABEL_ADD_${suffix}`], /^Ongeza/);
    assert.match(locale[`blockly-ARIA_LABEL_REMOVE_${suffix}`], /^Ondoa/);
  }
  assert.match(locale['blockly-ARIA_LABEL_FIELD_ANGLE'], /digrii %1/);
  assert.match(locale['blockly-ARIA_LABEL_TRASH_EMPTY'], /tupu/);
  assert.notEqual(locale['blockly-ARIA_LABEL_COMMENT_COLLAPSE'], locale['blockly-ARIA_LABEL_COMMENT_EXPAND']);
  assert.notEqual(locale['blockly-ARIA_TYPE_FIELD_BITMAP'], locale['blockly-ARIA_TYPE_FIELD_IMAGE']);
  const mapAccessibilityKeys = ["map-view-unplaced", "map-view-place-hint", "map-view-all-placed", "blockly-ADD_COMMENT", "blockly-ANNOUNCE_CANT_SCROLL_FURTHER", "blockly-ANNOUNCE_MOVE_AFTER", "blockly-ANNOUNCE_MOVE_AROUND", "blockly-ANNOUNCE_MOVE_BEFORE", "blockly-ANNOUNCE_MOVE_CANCELED", "blockly-ANNOUNCE_MOVE_INSIDE", "blockly-ANNOUNCE_MOVE_TO", "blockly-ANNOUNCE_MOVE_WORKSPACE", "blockly-ANNOUNCE_SCROLLED_DOWN", "blockly-ANNOUNCE_SCROLLED_LEFT", "blockly-ANNOUNCE_SCROLLED_RIGHT", "blockly-ANNOUNCE_SCROLLED_UP", "blockly-ARIA_LABEL_ADD_ELSE_IF", "blockly-ARIA_LABEL_ADD_INPUT", "blockly-ARIA_LABEL_ADD_LIST_ITEM"];
  for (const key of mapAccessibilityKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['map-view-place-hint'], /Buruta.*au ichague.*ubofye/);
  assert.match(locale['blockly-ANNOUNCE_MOVE_BEFORE'], /kabla ya/);
  assert.match(locale['blockly-ANNOUNCE_MOVE_AFTER'], /baada ya/);
  for (const [direction, word] of [['DOWN', 'chini'], ['UP', 'juu'], ['LEFT', 'kushoto'], ['RIGHT', 'kulia']]) {
    assert.ok(locale[`blockly-ANNOUNCE_SCROLLED_${direction}`].includes(word));
  }
  const presetMapKeys = ["dependency-type-is-duplicated-by", "custom-field-stringtemplate-context-hint", "filter-presets", "filter-preset-choose", "filter-preset-name", "filter-preset-save", "filter-preset-replace-hint", "filter-preset-saved", "filter-preset-applied", "filter-preset-deleted", "filter-preset-error", "filter-card-text-label", "import-report-heading", "import-report-description", "import-report-open-board", "draggable", "board-view-map", "map-view-empty", "map-view-upload", "map-view-remove-image"];
  for (const key of presetMapKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const key of ['admin-panel', 'problems', 'recoveryReportTitle']) {
    assert.ok(locale['import-report-description'].includes(locale[key]));
  }
  assert.match(locale['filter-preset-replace-hint'], /faragha.*jina lilelile/);
  assert.match(locale['custom-field-stringtemplate-context-hint'], /\|urlencode/);
  assert.match(locale['map-view-empty'], /Msimamizi wa bodi/);
  assert.notEqual(locale['filter-preset-applied'], locale['filter-preset-deleted']);
  const notificationKeys = ["notification-activity-heading", "notification-activity-description", "notification-activity-labels", "notification-activity-members", "notification-activity-assignees", "notification-activity-comments", "notification-activity-moves", "notification-activity-dates", "notification-activity-checklists", "notification-activity-attachments", "notification-activity-customFields", "notification-activity-archive", "notification-activity-created", "due-reminder-heading", "due-reminder-days-label", "due-reminder-off", "due-reminder-webhook", "due-reminder-invalid", "due-reminder-saved", "dependency-type-duplicates"];
  for (const key of notificationKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['notification-activity-description'], /kutajwa kwa @ hufika kila wakati/);
  assert.match(locale['due-reminder-days-label'], /0.*chanya.*kabla.*hasi.*baada/);
  assert.match(locale['due-reminder-days-label'], /Acha tupu.*chaguomsingi la seva/);
  assert.match(locale['due-reminder-invalid'], /kumi.*-14 hadi 14/);
  assert.notEqual(locale['notification-activity-members'], locale['notification-activity-assignees']);
  const importRuleKeys = ["filter-column-age-days", "filter-column-age-hint", "advanced-filter-card-dates-hint", "import-board-instruction-leo", "import-board-instruction-todotxt", "instance", "instance-desc", "board-instance-info", "automatic-linked-url-schemes-hint", "other-parent-cards", "add-parent-card", "remove-parent-card", "r-when-card-date", "r-trigger-vars-hint", "r-insert-variable", "r-vars-people-hint", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part"];
  for (const key of importRuleKeys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token));
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token));
  }
  assert.match(locale['instance-desc'], /pekee ndio wanaoweza kuhariri/);
  assert.match(locale['r-rule-any-trigger-help'], /chochote.*kwa mpangilio/);
  const keys = ["auto-archive-days", "auto-archive-off", "auto-archive-hint", "filter-recency-any", "filter-recency-day", "filter-recency-week", "filter-recency-month", "filter-recency-older", "filter-movement-range", "filter-date-range-field", "filter-date-range-from", "filter-date-range-to", "filter-date-range-missing", "filter-date-range-list-entry", "filter-date-range-invalid", "filter-due-any", "filter-due-previous-week", "filter-due-next-month", "filter-column-age", "filter-column-age-disabled"];
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `sw:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sw:${key}: tokens`);
  }
  assert.match(locale['auto-archive-hint'], /kila saa.*violezo haviwekwi kamwe/);
  for (const suffix of ['from', 'to']) {
    assert.match(locale[`filter-date-range-${suffix}`], /ikijumuishwa/);
  }
  assert.match(locale['filter-date-range-invalid'], /sawa na au baada/);
  assert.match(locale['filter-recency-day'], /24/);
  assert.match(locale['filter-recency-week'], /7/);
  assert.match(locale['filter-recency-older'], /Zaidi ya siku 30/);
  assert.match(locale['filter-date-range-missing'], /zisizo na tarehe/);
}
// Georgian translation batches and semantic regression checks.
{
  const locale = read('ka');
  const recoveryFinalKeys = ["rule-email-resolution-failed", "rule-email-legacy-heading", "rule-email-legacy-description", "rule-email-legacy-source", "rule-email-legacy-mail", "rule-email-legacy-reason", "rule-email-legacy-reason-unbound", "rule-email-legacy-reason-details-snapshot", "rule-email-legacy-rebind", "rule-email-legacy-discard", "rule-email-legacy-rebind-confirm", "rule-email-legacy-discard-confirm", "rule-email-legacy-empty", "rule-email-legacy-unavailable", "rule-email-legacy-access-denied", "rule-email-legacy-source-changed", "rule-email-legacy-source-unavailable", "rule-email-legacy-plan-unavailable", "rule-email-legacy-attempt-exists", "rule-email-legacy-not-legacy", "rule-email-legacy-failed", "saml-login-not-started", "move-selection-before", "move-selection-after", "history-request-pending-undo", "history-request-pending-redo", "history-request-hint", "history-request-retry", "history-request-forget"];
  for (const key of recoveryFinalKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['rule-email-legacy-description'], /თავისით არ გააგზავნის/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /არასოდეს გაიგზავნება/);
  assert.match(locale['history-request-hint'], /იმავე მოთხოვნას.*მეორე ცვლილებას არასოდეს/);
  assert.match(locale['saml-login-not-started'], /SAML.*ამ ჩანართში არ დაწყებულა/);
  assert.notEqual(locale['history-request-pending-undo'], locale['history-request-pending-redo']);
  const emailResolutionKeys = ["rule-email-recovery-recipients", "rule-email-recovery-recipient-accepted", "rule-email-recovery-recipient-unconfirmed", "rule-email-recovery-actions-hint", "rule-email-recovery-wait", "rule-email-recovery-resends", "rule-email-recovery-resend", "rule-email-recovery-mark-sent", "rule-email-recovery-drop", "rule-email-recovery-resend-confirm", "rule-email-recovery-mark-sent-confirm", "rule-email-recovery-drop-confirm", "rule-email-resolution-too-early", "rule-email-resolution-already-resolved", "rule-email-resolution-resend-in-flight", "rule-email-resolution-nothing-to-resend", "rule-email-resolution-resend-uncertain", "rule-email-resolution-busy", "rule-email-resolution-command-changed", "rule-email-resolution-attempt-invalid"];
  for (const key of emailResolutionKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['rule-email-recovery-actions-hint'], /თავისით არასოდეს აგზავნის ხელახლა/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /ორჯერ მიუვა/);
  assert.match(locale['rule-email-recovery-drop-confirm'], /არ გაიგზავნება/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /მივიდა ან არ მივიდა/);
  assert.match(locale['rule-email-recovery-mark-sent-confirm'], /მხოლოდ მაშინ, თუ იცით/);
  assert.notEqual(locale['rule-email-recovery-resend'], locale['rule-email-recovery-mark-sent']);
  const notificationControlKeys = ["activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-heading", "rule-email-recovery-description", "rule-email-recovery-all", "rule-email-recovery-unconfirmed", "rule-email-recovery-sent", "rule-email-recovery-invalid", "rule-email-recovery-identifiers", "rule-email-recovery-started", "rule-email-recovery-finished", "rule-email-recovery-empty", "rule-email-recovery-unavailable", "rule-email-recovery-dropped", "rule-email-recovery-review"];
  for (const key of notificationControlKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /გაგრძელება შეუძლებელი იქნება/);
  assert.match(locale['activity-recovery-cancel-confirm'], /უკან არ დაბრუნდება/);
  assert.match(locale['rule-email-recovery-description'], /არც ხელახლა სცდის და არც აუქმებს/);
  assert.match(locale['rule-email-recovery-sent'], /ფოსტის სერვერის მიერ/);
  assert.notEqual(locale['activity-recovery-paused'], locale['activity-recovery-status-cancelled']);
  assert.equal(locale['activity-recovery-resume'], locale['email-recovery-resume']);
  const activityRecoveryKeys = ["sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause"];
  for (const key of activityRecoveryKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['sync-time-estimate-hint'], /ზუსტად ერთი შესაბამისი ველი/);
  assert.match(locale['sync-time-estimate-hint'], /null ასუფთავებს/);
  assert.match(locale['activity-recovery-description'], /არასოდეს ქმნის თავიდან/);
  assert.match(locale['activity-recovery-source-unavailable'], /არაფერი შექმნილა თავიდან/);
  assert.match(locale['activity-recovery-failed'], /სამუშაო შენარჩუნებულია/);
  assert.notEqual(locale['activity-recovery-status-missing'], locale['activity-recovery-status-changed']);
  const emailFailureKeys = ["email-recovery-empty", "email-recovery-unavailable", "email-recovery-busy", "email-recovery-failed", "email-recovery-superseded", "email-recovery-confirm-cancel", "email-recovery-attention", "email-recovery-stopped", "email-recovery-retry", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time"];
  for (const key of emailFailureKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /ვერ აღდგება/);
  assert.match(locale['email-recovery-confirm-cancel'], /ახალი შეტყობინებები შენარჩუნდება/);
  assert.match(locale['email-failure-smtp-temporary'], /SMTP.*დროებითი/);
  assert.match(locale['email-failure-smtp-rejected'], /SMTP.*მუდმივი/);
  assert.match(locale['email-failure-delivery-unconfirmed'], /ხელახალ ცდამდე გადაამოწმეთ/);
  for (const key of ['sync-original-time', 'sync-remaining-time']) {
    assert.match(locale[key], /საათები/);
  }
  const emailQueueKeys = ["sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-recovery-heading", "email-recovery-description", "email-recovery-saving", "email-recovery-queued", "email-recovery-retrying", "email-recovery-attempts", "email-recovery-oldest", "email-recovery-next", "email-recovery-changed", "email-recovery-pause", "email-recovery-resume", "email-recovery-cancel", "email-recovery-paused", "email-recovery-pending"];
  for (const key of emailQueueKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['sync-recovery-description'], /30 დღის/);
  assert.match(locale['sync-estimate-field-hint'], /null ასუფთავებს/);
  assert.match(locale['email-recovery-description'], /უკან დაბრუნება შეუძლებელია/);
  assert.match(locale['email-recovery-description'], /მიწოდება შესაძლოა განმეორდეს/);
  assert.match(locale['email-recovery-description'], /ითვალისწინებს არსებულ შეჩერებას/);
  assert.notEqual(locale['email-recovery-pause'], locale['email-recovery-resume']);
  const syncReportKeys = ["sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty"];
  for (const key of syncReportKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['sync-report-retention'], /20.*30 დღის/);
  assert.match(locale['sync-source-truncated'], /100 ბილიკით/);
  assert.match(locale['sync-source-scope'], /მათი მნიშვნელობები არ ჩანს/);
  assert.match(locale['sync-report-partial'], /არ აგრძელებს.*არ აუქმებს/);
  assert.match(locale['sync-report-unavailable'], /მთელ სიაში ჩაწერის უფლება/);
  for (const suffix of ['unmapped', 'excluded']) {
    assert.equal(locale[`sync-preview-${suffix}`], locale[`sync-source-${suffix}`]);
  }
  const syncPreviewKeys = ["sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope"];
  for (const key of syncPreviewKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-review-complete'], /სრული სიის სინქრონიზაცია არ გაშვებულა/);
  assert.match(locale['sync-conflict-detach-hint'], /შიგთავსი WeKan-ში დარჩება/);
  assert.match(locale['sync-conflict-archive-hint'], /ქვებარათები არ იცვლება/);
  assert.match(locale['sync-conflict-creation-hint'], /იმავე შემცვლელს/);
  assert.match(locale['sync-preview-truncated'], /პირველი 100/);
  assert.notEqual(locale['sync-preview-create'], locale['sync-preview-update']);
  assert.notEqual(locale['sync-conflict-use-source'], locale['sync-conflict-keep-local']);
  const observationSyncKeys = ["scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local"];
  for (const key of observationSyncKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
    assert.match(locale[key], /UTC/);
    assert.match(locale[key], /უცნობი შეფასებები ნულის ტოლი არ არის/);
    assert.match(locale[key], /გამოტოვებული დღეები არ ჩანს/);
  }
  assert.match(locale['scrum-daily-truncated'], /366/);
  assert.match(locale['sync-conflict-hint'], /წყაროს სისტემაში არაფერი იგზავნება/);
  assert.match(locale['scrum-partial-report'], /მხოლოდ ამჟამად თქვენზე/);
  const sprintReportKeys = ["scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel"];
  for (const key of sprintReportKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ნულოვანი შეფასებები არ არის/);
  assert.match(locale['scrum-report-help'], /ერთნაირი ერთეულებისა და წესების/);
  assert.match(locale['scrum-confirm-close'], /დაუსრულებელი ბარათები გადავა/);
  assert.match(locale['scrum-confirm-cancel'], /ინარჩუნებს სპრინტის წევრობას/);
  assert.notEqual(locale['scrum-state-closed'], locale['scrum-state-cancelled']);
  assert.notEqual(locale['scrum-added'], locale['scrum-removed']);
  const scrumPlanningKeys = ["board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release"];
  for (const key of scrumPlanningKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.equal(locale['scrum-product-backlog'], locale['board-view-product-backlog']);
  assert.equal(locale['scrum-sprints'], locale['board-view-sprints']);
  assert.match(locale['scrum-rollover-sprint'], /დაუსრულებელი სამუშაოს/);
  assert.match(locale['scrum-policy-dueComplete'], /მონიშნულია/);
  assert.match(locale['scrum-policy-doneLists'], /კატეგორიის სიაშია/);
  assert.notEqual(locale['scrum-close-sprint'], locale['scrum-cancel-sprint']);
  assert.notEqual(locale['scrum-estimate-source'], locale['scrum-estimate-unit']);
  const searchRuleKeys = ["blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report"];
  for (const key of searchRuleKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['r-blocks-invalid'], /ზუსტად ერთი გამომწვევი ერთ მოქმედებასთან/);
  assert.match(locale['r-blocks-conflict'], /შენახვამდე ხელახლა ჩატვირთეთ/);
  assert.match(locale['r-blocks-permission'], /დაფის ადმინისტრატორის/);
  assert.notEqual(locale['r-blocks-unsaved'], locale['r-blocks-saved']);
  for (const key of ['GET_INDEX', 'GET_SUBLIST', 'INDEX_OF', 'SET_INDEX']) {
    assert.equal(locale[`blockly-LISTS_${key}_INPUT_IN_LIST`], locale['blockly-LISTS_INLIST']);
  }
  assert.equal(locale['blockly-PROCEDURES_DEFRETURN_COMMENT'], locale['blockly-PROCEDURES_DEFNORETURN_COMMENT']);
  const workspaceVariableKeys = ["blockly-UNNAMED_KEY", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL"];
  for (const key of workspaceVariableKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'], /სხვა ტიპისთვის/);
  assert.match(locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'], /პარამეტრად პროცედურაში/);
  for (const token of ['Enter', 'Shift+Enter', 'Escape']) {
    assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(token));
  }
  for (const suffix of ['ONE', 'MANY']) {
    assert.match(locale[`blockly-WORKSPACE_CONTENTS_COMMENTS_${suffix}`], /^ და /);
  }
  assert.notEqual(locale['blockly-WORKSPACE_SEARCH_FIND_NEXT'], locale['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']);
  assert.notEqual(locale['blockly-VARIABLES_GET_CREATE_SET'], locale['blockly-VARIABLES_SET_CREATE_GET']);
  const textProcessingKeys = ["blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP", "blockly-UNDO", "blockly-UNKNOWN"];
  for (const key of textProcessingKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-TEXT_INDEXOF_TOOLTIP'], /ვერ მოიძებნა.*%1/);
  assert.match(locale['blockly-TEXT_LENGTH_TOOLTIP'], /გამოტოვებების ჩათვლით/);
  assert.match(locale['blockly-TEXT_REPLACE_TOOLTIP'], /ყველა გამოჩენას/);
  assert.match(locale['blockly-TEXT_REVERSE_TOOLTIP'], /საპირისპირო მიმდევრობით/);
  assert.match(locale['blockly-TEXT_TRIM_OPERATOR_BOTH'], /ორივე მხრიდან/);
  assert.notEqual(locale['blockly-TEXT_TRIM_OPERATOR_LEFT'], locale['blockly-TEXT_TRIM_OPERATOR_RIGHT']);
  assert.notEqual(locale['blockly-TEXT_PROMPT_TOOLTIP_NUMBER'], locale['blockly-TEXT_PROMPT_TOOLTIP_TEXT']);
  const textPositionKeys = ["blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-SPACE_KEY", "blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST"];
  for (const key of textPositionKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-TEXT_CHARAT_FROM_END'], /ბოლოდან/);
  assert.doesNotMatch(locale['blockly-TEXT_CHARAT_FROM_START'], /ბოლოდან/);
  assert.match(locale['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'], /სიტყვების პირველი ასოები/);
  assert.notEqual(locale['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'], locale['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE']);
  assert.notEqual(locale['blockly-SHORTCUTS_SCROLL_LEFT'], locale['blockly-SHORTCUTS_SCROLL_RIGHT']);
  assert.match(locale['blockly-SHORTCUTS_START_MOVE_STACK'], /სტეკის/);
  assert.match(locale['blockly-TEXT_COUNT_TOOLTIP'], /რამდენჯერ/);
  const screenreaderShortcutKeys = ["blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHIFT_KEY", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN"];
  for (const key of screenreaderShortcutKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-SCREENREADER_MODE_DISABLED'], /გამორთულია, ჩასართავად/);
  assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'], /ჩართულია, გამოსართავად/);
  assert.match(locale['blockly-SHIFT_KEY'], /Shift/);
  for (const [a, b] of [['ABORT_MOVE', 'FINISH_MOVE'], ['MOVE_LEFT', 'MOVE_RIGHT'], ['MOVE_UP', 'MOVE_DOWN'], ['JUMP_FIRST_BLOCK', 'JUMP_LAST_BLOCK'], ['NEXT_STACK', 'PREVIOUS_STACK']]) {
    assert.notEqual(locale[`blockly-SHORTCUTS_${a}`], locale[`blockly-SHORTCUTS_${b}`]);
  }
  assert.match(locale['blockly-SHORTCUTS_EXTENDED_INFORMATION'], /დეტალური.*გახმოვანება/);
  const procedureEditorKeys = ["blockly-OPEN_TRASH", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PAUSE_KEY", "blockly-PROCEDURES_ALLOW_STATEMENTS", "blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_COMMENT", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM"];
  for (const key of procedureEditorKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-OPTION_KEY'], /Option/);
  assert.match(locale['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /შედეგს არ აბრუნებს/);
  assert.doesNotMatch(locale['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /არ აბრუნებს/);
  assert.match(locale['blockly-PROCEDURES_CALLRETURN_TOOLTIP'], /იყენებს მის შედეგს/);
  assert.match(locale['blockly-PROCEDURES_IFRETURN_WARNING'], /მხოლოდ ფუნქციის განსაზღვრის შიგნით/);
  assert.match(locale['blockly-RENAME_VARIABLE_TITLE'], /ყველა/);
  assert.notEqual(locale['blockly-PAGE_DOWN_KEY'], locale['blockly-PAGE_UP_KEY']);
  const mathFunctionKeys = ["blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK"];
  for (const key of mathFunctionKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-MATH_RANDOM_INT_TOOLTIP'], /მთელ რიცხვს.*საზღვრების ჩათვლით/);
  for (const fn of ['COS', 'SIN', 'TAN']) {
    assert.match(locale[`blockly-MATH_TRIG_TOOLTIP_${fn}`], /გრადუსებში.*არა რადიანებში/);
    assert.notEqual(locale[`blockly-MATH_TRIG_${fn}_ARIA`], locale[`blockly-MATH_TRIG_A${fn}_ARIA`]);
  }
  assert.match(locale['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'], /ქვემოთ/);
  assert.match(locale['blockly-MATH_ROUND_OPERATOR_ROUNDUP'], /ზემოთ/);
  assert.match(locale['blockly-MATH_SINGLE_TOOLTIP_NEG'], /საპირისპირო/);
  assert.notEqual(locale['blockly-NEW_VARIABLE_TITLE'], locale['blockly-NEW_VARIABLE_TYPE_TITLE']);
  const mathStatisticsKeys = ["blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP", "blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP"];
  for (const key of mathStatisticsKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-MATH_CONSTRAIN_TOOLTIP'], /საზღვრების ჩათვლით/);
  assert.match(locale['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0-დან \(ჩათვლით\).*1\.0-მდე \(გამოკლებით\)/);
  assert.match(locale['blockly-MATH_MODULO_TOOLTIP'], /ნაშთს/);
  assert.match(locale['blockly-MATH_ONLIST_TOOLTIP_MODE'], /ხშირად განმეორებადი/);
  for (const [a, b] of [['EVEN', 'ODD'], ['POSITIVE', 'NEGATIVE']]) {
    assert.notEqual(locale[`blockly-MATH_IS_${a}`], locale[`blockly-MATH_IS_${b}`]);
  }
  assert.notEqual(locale['blockly-MATH_ONLIST_OPERATOR_AVERAGE'], locale['blockly-MATH_ONLIST_OPERATOR_MEDIAN']);
  const logicArithmeticKeys = ["blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP"];
  for (const key of logicArithmeticKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  for (const comparison of ['GT', 'LT']) {
    assert.doesNotMatch(locale[`blockly-LOGIC_COMPARE_TOOLTIP_${comparison}`], /ან მისი ტოლია/);
    assert.match(locale[`blockly-LOGIC_COMPARE_TOOLTIP_${comparison}E`], /ან მისი ტოლია/);
  }
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /ორივე/);
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /ერთი მაინც/);
  for (const key of ['CONDITION', 'IF_FALSE', 'IF_TRUE']) {
    assert.ok(locale['blockly-LOGIC_TERNARY_TOOLTIP'].includes(locale[`blockly-LOGIC_TERNARY_${key}`]));
  }
  assert.match(locale['blockly-MATH_ATAN2_TOOLTIP'], /-180-დან 180-მდე/);
  assert.notEqual(locale['blockly-MATH_ARITHMETIC_TOOLTIP_ADD'], locale['blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY']);
  const listTransformationKeys = ["blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER"];
  for (const key of listTransformationKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[ა-ჿ]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-LISTS_INDEX_OF_TOOLTIP'], /ვერ მოიძებნა.*%1/);
  assert.match(locale['blockly-LISTS_REVERSE_TOOLTIP'], /ასლში.*საპირისპირო/);
  for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
    assert.match(locale[`blockly-LISTS_SET_INDEX_TOOLTIP_SET_${position}`], /^ანიჭებს მნიშვნელობას/);
    assert.notEqual(locale[`blockly-LISTS_SET_INDEX_TOOLTIP_SET_${position}`], locale[`blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_${position}`]);
  }
  assert.notEqual(locale['blockly-LISTS_SORT_ORDER_ASCENDING'], locale['blockly-LISTS_SORT_ORDER_DESCENDING']);
  assert.match(locale['blockly-LISTS_SPLIT_TOOLTIP_JOIN'], /^აერთიანებს/);
  assert.match(locale['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'], /^ყოფს/);
  const listRetrievalKeys = ["blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM", "blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START"];
  for (const key of listRetrievalKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
    assert.match(locale[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_${position}`], /^აბრუნებს/);
    assert.match(locale[`blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_${position}`], /^შლის და აბრუნებს/);
    assert.match(locale[`blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_${position}`], /^შლის სიის/);
  }
  assert.match(locale['blockly-LISTS_GET_SUBLIST_START_FROM_END'], /ბოლოდან № პოზიციიდან/);
  assert.notEqual(locale['blockly-LISTS_GET_SUBLIST_START_FROM_END'], locale['blockly-LISTS_GET_SUBLIST_START_FROM_START']);
  assert.notEqual(locale['blockly-LISTS_GET_INDEX_FIRST'], locale['blockly-LISTS_GET_INDEX_LAST']);
  const navigationListKeys = ["blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET"];
  for (const key of navigationListKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /გეჭიროთ %1.*პოზიციის დასადასტურებლად.*%2/);
  assert.match(locale['blockly-LISTS_CREATE_EMPTY_TOOLTIP'], /0 სიგრძის.*არ შეიცავს/);
  assert.match(locale['blockly-LISTS_CREATE_WITH_TOOLTIP'], /ნებისმიერი რაოდენობის/);
  assert.notEqual(locale['blockly-KEYBOARD_NAV_COPIED_HINT'], locale['blockly-KEYBOARD_NAV_CUT_HINT']);
  assert.notEqual(locale['blockly-INPUT_LABEL_VALUE_A'], locale['blockly-INPUT_LABEL_VALUE_B']);
  assert.equal(locale['blockly-INPUT_LABEL_VARIABLES_SET'], locale['blockly-INPUT_LABEL_LISTS_VALUE_TO_SET']);
  const numericTextKeys = ["blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE"];
  for (const key of numericTextKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], 'გასაყოფი');
  assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVISOR'], 'გამყოფი');
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'], /^x /);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'], /^y /);
  assert.equal(locale['blockly-INPUT_LABEL_LOOP_TIMES'], locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM']);
  for (const pair of [['blockly-INPUT_LABEL_NUMBER_MAX', 'blockly-INPUT_LABEL_NUMBER_MIN'], ['blockly-INPUT_LABEL_LOOP_FROM', 'blockly-INPUT_LABEL_LOOP_TO'], ['blockly-INPUT_LABEL_TEXT_START_POSITION', 'blockly-INPUT_LABEL_TEXT_END_POSITION'], ['blockly-INPUT_LABEL_TEXT_TO_CHANGE', 'blockly-INPUT_LABEL_TEXT_TO_CHECK']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const helpInputKeys = ["blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE"];
  for (const key of helpInputKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-HELP_PROMPT'], /კლავიატურით.*%1/);
  assert.match(locale['blockly-INLINE_INPUTS'], /ერთ ხაზზე/);
  for (const pair of [['blockly-ICON_LABEL_COMMENT_CLOSED', 'blockly-ICON_LABEL_COMMENT_OPEN'], ['blockly-ICON_LABEL_WARNING_CLOSED', 'blockly-ICON_LABEL_WARNING_OPEN'], ['blockly-INPUT_LABEL_CONDITION_A', 'blockly-INPUT_LABEL_CONDITION_B'], ['blockly-INPUT_LABEL_LISTS_END_POSITION', 'blockly-INPUT_LABEL_LISTS_START_POSITION'], ['blockly-INPUT_LABEL_LISTS_REPEAT_ITEM', 'blockly-INPUT_LABEL_LISTS_REPEAT_NUM'], ['blockly-INLINE_INPUTS', 'blockly-EXTERNAL_INPUTS']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const editorFieldKeys = ["blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING"];
  for (const key of editorFieldKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-FIELD_BITMAP_ARIA_VALUE'], /%1 × %2.*%3 პიქსელი/);
  assert.match(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'], /მწკრივი %2, სვეტი %3/);
  assert.match(locale['blockly-DELETE_VARIABLE_CONFIRMATION'], /'%2'.*%1 შემთხვევა/);
  for (const pair of [['blockly-EXPAND_ALL', 'blockly-COLLAPSE_ALL'], ['blockly-EXPAND_BLOCK', 'blockly-COLLAPSE_BLOCK'], ['blockly-CUT_SHORTCUT', 'blockly-COPY_SHORTCUT'], ['blockly-END_KEY', 'end-date']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const conditionLoopKeys = ["blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-CONTROL_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK"];
  for (const key of conditionLoopKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /მნიშვნელობა მცდარია/);
  assert.match(locale['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /მნიშვნელობა ჭეშმარიტია/);
  assert.match(locale['blockly-CONTROLS_IF_TOOLTIP_4'], /არცერთი მნიშვნელობა არ არის ჭეშმარიტი.*ბოლო ბლოკი/);
  assert.match(locale['blockly-CONTROLS_FOR_TITLE'], /%2-დან %3-მდე.*%4/);
  assert.notEqual(locale['blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL'], locale['blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE']);
  const colorLoopKeys = ["blockly-CAPS_LOCK_KEY", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING", "blockly-CONTROLS_FOREACH_TITLE"];
  for (const key of colorLoopKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-COLOUR_BLEND_TOOLTIP'], /0\.0 - 1\.0/);
  assert.match(locale['blockly-COLOUR_RGB_TOOLTIP'], /0-სა და 100-ს შორის/);
  assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'], /მხოლოდ ციკლის შიგნით/);
  assert.match(locale['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'], /დარჩენილი ნაწილი.*შემდეგ გამეორებაზე/);
  assert.notEqual(locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK'], locale['blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE']);
  assert.equal(new Set(['BLUE', 'GREEN', 'RED'].map(color => locale[`blockly-COLOUR_RGB_${color}`])).size, 3);
  const blockLabelKeys = ["blockly-ARIA_LABEL_REMOVE_ELSE_IF", "blockly-ARIA_LABEL_REMOVE_INPUT", "blockly-ARIA_LABEL_REMOVE_LIST_ITEM", "blockly-ARIA_LABEL_REMOVE_TEXT", "blockly-ARIA_LABEL_TRASH_EMPTY", "blockly-ARIA_TYPE_FIELD_ANGLE", "blockly-ARIA_TYPE_FIELD_BITMAP", "blockly-ARIA_TYPE_FIELD_CHECKBOX", "blockly-ARIA_TYPE_FIELD_COLOUR", "blockly-ARIA_TYPE_FIELD_DATE", "blockly-ARIA_TYPE_FIELD_DROPDOWN", "blockly-ARIA_TYPE_FIELD_GRID", "blockly-ARIA_TYPE_FIELD_IMAGE", "blockly-ARIA_TYPE_FIELD_INPUT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE", "blockly-BACKSPACE_KEY", "blockly-BLOCK_LABEL_BEGIN_PREFIX", "blockly-BLOCK_LABEL_BEGIN_STACK", "blockly-BLOCK_LABEL_COLLAPSED", "blockly-BLOCK_LABEL_CONTAINER", "blockly-BLOCK_LABEL_DISABLED", "blockly-BLOCK_LABEL_HAS_BRANCHES", "blockly-BLOCK_LABEL_HAS_INPUT", "blockly-BLOCK_LABEL_HAS_INPUTS", "blockly-BLOCK_LABEL_REPLACEABLE", "blockly-BLOCK_LABEL_STACK_BLOCKS", "blockly-BLOCK_LABEL_STATEMENT", "blockly-BLOCK_LABEL_TOOLBOX_CATEGORY", "blockly-BLOCK_LABEL_VALUE", "blockly-BUBBLE_LABEL_COMMENT", "blockly-BUBBLE_LABEL_DEFAULT", "blockly-BUBBLE_LABEL_WARNING", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE"];
  for (const key of blockLabelKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['blockly-ARIA_LABEL_TRASH_EMPTY'], /ამჟამად ცარიელია/);
  assert.match(locale['blockly-BLOCK_LABEL_HAS_BRANCHES'], /%1 ტოტი/);
  assert.match(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /'%1'.*წაშლა შეუძლებელია.*'%2'.*განსაზღვრების ნაწილია/);
  for (const pair of [['blockly-BLOCK_LABEL_HAS_INPUT', 'blockly-BLOCK_LABEL_HAS_INPUTS'], ['blockly-BUBBLE_LABEL_COMMENT', 'blockly-BUBBLE_LABEL_WARNING'], ['blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT', 'blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE'], ['blockly-ARIA_LABEL_ADD_INPUT', 'blockly-ARIA_LABEL_REMOVE_INPUT']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const mapAccessibilityKeys = ["draggable", "board-view-map", "map-view-empty", "map-view-upload", "map-view-remove-image", "map-view-unplaced", "map-view-place-hint", "map-view-all-placed", "blockly-ADD_COMMENT", "blockly-ANNOUNCE_CANT_SCROLL_FURTHER", "blockly-ANNOUNCE_MOVE_AFTER", "blockly-ANNOUNCE_MOVE_AROUND", "blockly-ANNOUNCE_MOVE_BEFORE", "blockly-ANNOUNCE_MOVE_CANCELED", "blockly-ANNOUNCE_MOVE_INSIDE", "blockly-ANNOUNCE_MOVE_TO", "blockly-ANNOUNCE_MOVE_WORKSPACE", "blockly-ANNOUNCE_SCROLLED_DOWN", "blockly-ANNOUNCE_SCROLLED_LEFT", "blockly-ANNOUNCE_SCROLLED_RIGHT", "blockly-ANNOUNCE_SCROLLED_UP", "blockly-ARIA_LABEL_ADD_ELSE_IF", "blockly-ARIA_LABEL_ADD_INPUT", "blockly-ARIA_LABEL_ADD_LIST_ITEM", "blockly-ARIA_LABEL_ADD_TEXT", "blockly-ARIA_LABEL_BUTTON", "blockly-ARIA_LABEL_COMMENT_COLLAPSE", "blockly-ARIA_LABEL_COMMENT_EXPAND", "blockly-ARIA_LABEL_FIELD_ANGLE"];
  for (const key of mapAccessibilityKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['map-view-empty'], /დაფის ადმინისტრატორს შეუძლია ატვირთოს/);
  assert.match(locale['map-view-place-hint'], /გადაათრიეთ.*ან აირჩიეთ.*დააწკაპუნეთ/);
  assert.match(locale['blockly-ARIA_LABEL_FIELD_ANGLE'], /%1 გრადუსი/);
  for (const pair of [['blockly-ANNOUNCE_MOVE_AFTER', 'blockly-ANNOUNCE_MOVE_BEFORE'], ['blockly-ANNOUNCE_SCROLLED_LEFT', 'blockly-ANNOUNCE_SCROLLED_RIGHT'], ['blockly-ANNOUNCE_SCROLLED_DOWN', 'blockly-ANNOUNCE_SCROLLED_UP'], ['blockly-ARIA_LABEL_COMMENT_COLLAPSE', 'blockly-ARIA_LABEL_COMMENT_EXPAND'], ['map-view-upload', 'map-view-remove-image']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const reminderPresetKeys = ["notification-activity-customFields", "notification-activity-archive", "notification-activity-created", "due-reminder-heading", "due-reminder-days-label", "due-reminder-off", "due-reminder-webhook", "due-reminder-invalid", "due-reminder-saved", "dependency-type-duplicates", "dependency-type-is-duplicated-by", "custom-field-stringtemplate-context-hint", "filter-presets", "filter-preset-choose", "filter-preset-name", "filter-preset-save", "filter-preset-replace-hint", "filter-preset-saved", "filter-preset-applied", "filter-preset-deleted", "filter-preset-error", "filter-card-text-label", "import-report-heading", "import-report-description", "import-report-open-board"];
  for (const key of reminderPresetKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['due-reminder-days-label'], /0.*დადებითი.*მანამდე.*უარყოფითი.*შემდეგ/);
  assert.match(locale['due-reminder-invalid'], /ათი.*-14.*14/);
  assert.match(locale['filter-preset-replace-hint'], /მხოლოდ თქვენთვის.*იმავე სახელით.*ჩაანაცვლებს/);
  assert.match(locale['import-report-description'], /დაფა შეიქმნა.*ვერ მოხერხდა/);
  for (const key of ['admin-panel', 'problems', 'recoveryReportTitle']) assert.ok(locale['import-report-description'].includes(locale[key]));
  for (const token of ['%{card.title}', '%{board.title}', '%{list.title}', '%{swimlane.title}', '%{value|urlencode}', '|urlencode']) assert.ok(locale['custom-field-stringtemplate-context-hint'].includes(token));
  assert.notEqual(locale['dependency-type-duplicates'], locale['dependency-type-is-duplicated-by']);
  const accessRuleKeys = ["instance", "instance-desc", "board-instance-info", "automatic-linked-url-schemes-hint", "other-parent-cards", "add-parent-card", "remove-parent-card", "r-when-card-date", "r-trigger-vars-hint", "r-insert-variable", "r-vars-people-hint", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part", "notification-activity-heading", "notification-activity-description", "notification-activity-labels", "notification-activity-members", "notification-activity-assignees", "notification-activity-comments", "notification-activity-moves", "notification-activity-dates", "notification-activity-checklists", "notification-activity-attachments"];
  for (const key of accessRuleKeys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['instance-desc'], /არასოდეს ეჩვენება სისტემაში არშესულ.*მხოლოდ დაფაზე დამატებულ/);
  assert.match(locale['board-instance-info'], /<strong>.*<\/strong>/);
  assert.match(locale['r-rule-any-trigger-help'], /რომელიმე.*თანმიმდევრობით/);
  assert.match(locale['notification-activity-description'], /ვადის შეხსენებები და @ ხსენებები ყოველთვის მოდის/);
  for (const token of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) assert.ok(locale['automatic-linked-url-schemes-hint'].includes(token));
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) assert.ok(locale['r-trigger-vars-hint'].includes(token));
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Field name}']) assert.ok(locale['r-vars-people-hint'].includes(token));
  const keys = ["auto-archive-days", "auto-archive-off", "auto-archive-hint", "filter-recency-any", "filter-recency-day", "filter-recency-week", "filter-recency-month", "filter-recency-older", "filter-movement-range", "filter-date-range-field", "filter-date-range-from", "filter-date-range-to", "filter-date-range-missing", "filter-date-range-list-entry", "filter-date-range-invalid", "filter-due-any", "filter-due-previous-week", "filter-due-next-month", "filter-column-age", "filter-column-age-disabled", "filter-column-age-days", "filter-column-age-hint", "advanced-filter-card-dates-hint", "import-board-instruction-leo", "import-board-instruction-todotxt"];
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `ka:${key}: translated`);
    assert.match(locale[key], /[\u10d0-\u10ff]/, `ka:${key}: Georgian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ka:${key}: tokens`);
  }
  assert.match(locale['auto-archive-hint'], /შაბლონები არასოდეს არქივდება/);
  assert.match(locale['filter-column-age-hint'], /ხილული რჩება.*არ ანულებს/);
  assert.match(locale['filter-date-range-invalid'], /ემთხვეოდეს.*ან იყოს მის შემდეგ/);
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ka:${token}`);
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ka:${token}`);
}
// Azerbaijani translation batches and recovery guidance.
for (const code of ['az', 'az-AZ', 'az-LA']) {
  const locale = read(code);
  const recoveryFinalKeys = ["rule-email-legacy-heading", "rule-email-legacy-description", "rule-email-legacy-source", "rule-email-legacy-mail", "rule-email-legacy-reason", "rule-email-legacy-reason-unbound", "rule-email-legacy-reason-details-snapshot", "rule-email-legacy-rebind", "rule-email-legacy-discard", "rule-email-legacy-rebind-confirm", "rule-email-legacy-discard-confirm", "rule-email-legacy-empty", "rule-email-legacy-unavailable", "rule-email-legacy-access-denied", "rule-email-legacy-source-changed", "rule-email-legacy-source-unavailable", "rule-email-legacy-plan-unavailable", "rule-email-legacy-attempt-exists", "rule-email-legacy-not-legacy", "rule-email-legacy-failed", "saml-login-not-started", "move-selection-before", "move-selection-after", "history-request-pending-undo", "history-request-pending-redo", "history-request-hint", "history-request-retry", "history-request-forget"];
  for (const key of recoveryFinalKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['rule-email-legacy-description'], /özbaşına göndərməyəcək.*giriş hüququ olduğunu yoxladıqdan sonra/);
  assert.match(locale['rule-email-legacy-rebind-confirm'], /fərqlənə bilər/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /heç vaxt göndərilməyəcək/);
  assert.match(locale['saml-login-not-started'], /SAML.*bu vərəqində başladılmayıb/);
  assert.match(locale['history-request-hint'], /eyni sorğunu.*heç vaxt ikinci dəyişikliyi geri ala bilməz/);
  assert.notEqual(locale['history-request-pending-undo'], locale['history-request-pending-redo']);
  const emailResolutionKeys = ["rule-email-recovery-sent", "rule-email-recovery-invalid", "rule-email-recovery-identifiers", "rule-email-recovery-started", "rule-email-recovery-finished", "rule-email-recovery-empty", "rule-email-recovery-unavailable", "rule-email-recovery-dropped", "rule-email-recovery-review", "rule-email-recovery-recipients", "rule-email-recovery-recipient-accepted", "rule-email-recovery-recipient-unconfirmed", "rule-email-recovery-actions-hint", "rule-email-recovery-wait", "rule-email-recovery-resends", "rule-email-recovery-resend", "rule-email-recovery-mark-sent", "rule-email-recovery-drop", "rule-email-recovery-resend-confirm", "rule-email-recovery-mark-sent-confirm", "rule-email-recovery-drop-confirm", "rule-email-resolution-too-early", "rule-email-resolution-already-resolved", "rule-email-resolution-resend-in-flight", "rule-email-resolution-nothing-to-resend", "rule-email-resolution-resend-uncertain", "rule-email-resolution-busy", "rule-email-resolution-command-changed", "rule-email-resolution-attempt-invalid", "rule-email-resolution-failed"];
  for (const key of emailResolutionKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['rule-email-recovery-sent'], /Poçt serveri tərəfindən/);
  assert.match(locale['rule-email-recovery-actions-hint'], /heç vaxt özbaşına yenidən göndərmir/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /iki dəfə alacaq/);
  assert.match(locale['rule-email-recovery-drop-confirm'], /göndərilməyəcək/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /çatmış da ola bilər, çatmamış da/);
  assert.notEqual(locale['rule-email-recovery-recipient-accepted'], locale['rule-email-recovery-recipient-unconfirmed']);
  const activityRecoveryKeys = ["activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-heading", "rule-email-recovery-description", "rule-email-recovery-all", "rule-email-recovery-unconfirmed"];
  for (const key of activityRecoveryKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-description'], /heç vaxt fəaliyyəti yenidən yaratmır/);
  assert.match(locale['activity-recovery-source-unavailable'], /Heç nə yenidən yaradılmadı/);
  assert.match(locale['activity-recovery-failed'], /Gözləyən iş saxlanılıb/);
  assert.match(locale['activity-recovery-cancel-confirm'], /davam etdirmək mümkün olmayacaq.*geri çağırılmır/);
  assert.match(locale['rule-email-recovery-description'], /yenidən cəhd etmir və onu ləğv etmir/);
  assert.notEqual(locale['activity-recovery-status-missing'], locale['activity-recovery-status-changed']);
  assert.equal(locale['activity-recovery-pause'], locale['email-recovery-pause']);
  assert.equal(locale['activity-recovery-resume'], locale['email-recovery-resume']);
  const emailQueueKeys = ["email-recovery-heading", "email-recovery-description", "email-recovery-saving", "email-recovery-queued", "email-recovery-retrying", "email-recovery-attempts", "email-recovery-oldest", "email-recovery-next", "email-recovery-changed", "email-recovery-pause", "email-recovery-resume", "email-recovery-cancel", "email-recovery-paused", "email-recovery-pending", "email-recovery-empty", "email-recovery-unavailable", "email-recovery-busy", "email-recovery-failed", "email-recovery-superseded", "email-recovery-confirm-cancel", "email-recovery-attention", "email-recovery-stopped", "email-recovery-retry", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint"];
  for (const key of emailQueueKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['email-recovery-description'], /geri çağırmaq mümkün deyil.*çatdırılma təkrarlana bilər/);
  assert.match(locale['email-recovery-description'], /mövcud fasiləni qoruyur/);
  assert.match(locale['email-recovery-confirm-cancel'], /bərpa edilə bilməyəcək.*yeni mesajlar saxlanılır/);
  assert.match(locale['sync-time-estimate-hint'], /dəqiq bir uyğun sahə.*olmayan qiymətlər nəzərə alınmır.*null.*təmizləyir/);
  for (const pair of [['email-recovery-pause', 'email-recovery-resume'], ['email-failure-smtp-temporary', 'email-failure-smtp-rejected'], ['sync-original-time', 'sync-remaining-time']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const syncReportKeys = ["sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint"];
  for (const key of syncReportKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-source-truncated'], /100/);
  assert.match(locale['sync-report-retention'], /20.*30 gün/);
  assert.match(locale['sync-report-partial'], /dəyişmiş ola bilər.*davam etdirmir və ya geri qaytarmır/);
  assert.match(locale['sync-report-unavailable'], /bütün siyahıya yazma hüququ/);
  assert.match(locale['sync-recovery-description'], /30 gün.*davam edə və ya kəsilmiş.*geri qaytara bilməz/);
  assert.match(locale['sync-estimate-field-hint'], /olmayan qiymətlər nəzərə alınmır.*null.*təmizləyir/);
  const syncPreviewKeys = ["sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item"];
  for (const key of syncPreviewKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-detach-hint'], /Yalnız bu dublikatın.*məzmunu WeKan-da qalır/);
  assert.match(locale['sync-conflict-archive-hint'], /Alt kartlar dəyişdirilmir/);
  assert.match(locale['sync-conflict-creation-hint'], /dəyişmədən.*eyni əvəzedici kartdan/);
  assert.match(locale['sync-preview-truncated'], /100/);
  assert.match(locale['sync-source-scope'], /qiymətləri göstərilmir/);
  assert.equal(locale['sync-preview-unmapped'], locale['sync-source-unmapped']);
  assert.equal(locale['sync-preview-excluded'], locale['sync-source-excluded']);
  const observationSyncKeys = ["scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach"];
  for (const key of observationSyncKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
    assert.match(locale[key], /UTC gününün ilk qeydə alınmış müşahidə/);
    assert.match(locale[key], /[Mm]əlumat olmayan günlər buraxılır/);
    assert.match(locale[key], /Naməlum qiymətləndirmələr sıfır deyil/);
  }
  assert.match(locale['scrum-daily-truncated'], /366/);
  assert.match(locale['sync-conflict-hint'], /Mənbə sisteminə heç nə göndərilmir/);
  assert.match(locale['sync-conflict-review-complete'], /Bütün siyahının sinxronlaşdırılması aparılmadı/);
  assert.notEqual(locale['sync-conflict-keep-local'], locale['sync-conflict-use-source']);
  const sprintReportKeys = ["scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing"];
  for (const key of sprintReportKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ayrıca sayılır.*sıfır qiymətləndirmələr deyil.*yalnız uyğun/);
  assert.match(locale['scrum-confirm-close'], /Tamamlanmamış kartlar.*köçürüləcək/);
  assert.match(locale['scrum-confirm-cancel'], /yenidən təyin edilənədək sprintə aid olaraq qalır/);
  assert.equal(locale['scrum-category-backlog'], locale['scrum-backlog']);
  for (const pair of [['scrum-added', 'scrum-removed'], ['scrum-completed', 'scrum-incomplete'], ['scrum-state-closed', 'scrum-state-cancelled'], ['scrum-state-planned', 'scrum-state-active'], ['scrum-event-review', 'scrum-event-retrospective']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const planningKeys = ["board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type"];
  for (const key of planningKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-backlog-help'], /planlaşdırılmış və ya aktiv sprintə/);
  assert.match(locale['scrum-rollover-sprint'], /Tamamlanmamış işi/);
  assert.equal(locale['scrum-product-backlog'], locale['board-view-product-backlog']);
  assert.equal(locale['scrum-sprints'], locale['board-view-sprints']);
  for (const pair of [['scrum-start-sprint', 'scrum-close-sprint'], ['scrum-close-sprint', 'scrum-cancel-sprint'], ['scrum-estimate-source', 'scrum-estimate-unit'], ['scrum-policy-dueComplete', 'scrum-policy-doneLists']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const workspaceRuleKeys = ["blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report"];
  for (const key of workspaceRuleKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const key of ['blockly-WORKSPACE_CONTENTS_COMMENTS_MANY', 'blockly-WORKSPACE_CONTENTS_COMMENTS_ONE']) assert.ok(locale[key].startsWith(' və '));
  for (const token of ['Enter', 'Shift+Enter', 'Escape']) assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(token));
  assert.match(locale['r-blocks-invalid'], /Dəqiq bir tətikləyicini bir əməliyyata.*əlaqəsiz və ya artıq blokları silin/);
  assert.match(locale['r-blocks-conflict'], /Saxlamazdan əvvəl.*yenidən yükləyin/);
  assert.match(locale['r-blocks-permission'], /lövhə administratoru icazəsi/);
  assert.notEqual(locale['blockly-WORKSPACE_SEARCH_FIND_NEXT'], locale['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']);
  const shortcutKeys = ["blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-SPACE_KEY", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-UNKNOWN", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER"];
  for (const key of shortcutKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'], /'%1'.*'%2'.*parametr kimi mövcuddur/);
  assert.match(locale['blockly-SHORTCUTS_PERFORM_ACTION'], /Redaktə et və ya təsdiqlə/);
  for (const pair of [['JUMP_BLOCK_END', 'JUMP_BLOCK_START'], ['JUMP_BOTTOM_STACK', 'JUMP_TOP_STACK'], ['JUMP_FIRST_BLOCK', 'JUMP_LAST_BLOCK'], ['JUMP_NEXT_PAGE', 'JUMP_PREVIOUS_PAGE'], ['NEXT_HEADING', 'PREVIOUS_HEADING'], ['NEXT_STACK', 'PREVIOUS_STACK'], ['START_MOVE', 'FINISH_MOVE']]) assert.notEqual(locale[`blockly-SHORTCUTS_${pair[0]}`], locale[`blockly-SHORTCUTS_${pair[1]}`]);
  for (const direction of ['UP', 'DOWN', 'LEFT', 'RIGHT']) assert.notEqual(locale[`blockly-SHORTCUTS_MOVE_${direction}`], locale[`blockly-SHORTCUTS_SCROLL_${direction}`]);
  assert.notEqual(locale['blockly-TEXT_FROM_END_ARIA'], locale['blockly-TEXT_FROM_START_ARIA']);
  const mathScreenreaderKeys = ["blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PAUSE_KEY", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHIFT_KEY", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION"];
  for (const key of mathScreenreaderKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-SCREENREADER_MODE_DISABLED'], /söndürülüb, yandırmaq üçün %1/);
  assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'], /yandırılıb, söndürmək üçün %1/);
  assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /icra etmək mümkün deyil.*tərif bloku deaktiv edilib/);
  assert.match(locale['blockly-MATH_SINGLE_OP_LOG10_ARIA'], /10 əsaslı/);
  for (const pair of [['blockly-MATH_TRIG_ACOS_ARIA', 'blockly-MATH_TRIG_COS_ARIA'], ['blockly-MATH_TRIG_ASIN_ARIA', 'blockly-MATH_TRIG_SIN_ARIA'], ['blockly-MATH_TRIG_ATAN_ARIA', 'blockly-MATH_TRIG_TAN_ARIA'], ['blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY'], ['blockly-OPEN_BACKPACK', 'blockly-CLOSE_BACKPACK']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const navigationMathKeys = ["blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_TERNARY_CONDITION", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA"];
  for (const key of navigationMathKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /%1 basılı saxlayıb.*%2 basın/);
  assert.match(locale['blockly-MATH_ATAN2_TITLE'], /X:%1 Y:%2.*atan2/);
  assert.match(locale['blockly-MATH_CONSTANT_SQRT1_2_ARIA'], /ikidə birin kvadrat kökü/);
  for (const pair of [['blockly-LOGIC_COMPARE_EQ_ARIA', 'blockly-LOGIC_COMPARE_NEQ_ARIA'], ['blockly-LOGIC_COMPARE_GTE_ARIA', 'blockly-LOGIC_COMPARE_GT_ARIA'], ['blockly-LOGIC_COMPARE_LTE_ARIA', 'blockly-LOGIC_COMPARE_LT_ARIA'], ['blockly-MATH_ONLIST_OPERATOR_MAX_ARIA', 'blockly-MATH_ONLIST_OPERATOR_MIN_ARIA'], ['blockly-KEYBOARD_NAV_COPIED_HINT', 'blockly-KEYBOARD_NAV_CUT_HINT']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const blockInputKeys = ["blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK"];
  for (const key of blockInputKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], /^bölünən$/);
  assert.match(locale['blockly-INPUT_LABEL_MATH_DIVISOR'], /^bölən$/);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'], /^x /);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'], /^y /);
  for (const pair of [['blockly-INPUT_LABEL_NUMBER_MAX', 'blockly-INPUT_LABEL_NUMBER_MIN'], ['blockly-INPUT_LABEL_LOOP_FROM', 'blockly-INPUT_LABEL_LOOP_TO'], ['blockly-INPUT_LABEL_LISTS_TO_CHANGE', 'blockly-INPUT_LABEL_LISTS_TO_CHECK'], ['blockly-INPUT_LABEL_TEXT_START_POSITION', 'blockly-INPUT_LABEL_TEXT_END_POSITION']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  assert.equal(locale['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'], locale['blockly-INPUT_LABEL_LOOP_TIMES']);
  const editorFieldKeys = ["blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROL_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B"];
  for (const key of editorFieldKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-FIELD_BITMAP_ARIA_VALUE'], /%1 × %2.*%3 piksel aktivdir/);
  assert.match(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'], /sətir %2, sütun %3/);
  assert.match(locale['blockly-COLLAPSED_WARNINGS_WARNING'], /Yığılmış bloklarda xəbərdarlıqlar/);
  for (const pair of [['blockly-ICON_LABEL_COMMENT_CLOSED', 'blockly-ICON_LABEL_COMMENT_OPEN'], ['blockly-ICON_LABEL_WARNING_CLOSED', 'blockly-ICON_LABEL_WARNING_OPEN'], ['blockly-INPUT_LABEL_CONDITION_A', 'blockly-INPUT_LABEL_CONDITION_B'], ['blockly-COPY_SHORTCUT', 'blockly-CUT_SHORTCUT'], ['blockly-END_KEY', 'end-date']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const blockLabelKeys = ["blockly-ARIA_LABEL_BUTTON", "blockly-ARIA_LABEL_COMMENT_COLLAPSE", "blockly-ARIA_LABEL_COMMENT_EXPAND", "blockly-ARIA_LABEL_FIELD_ANGLE", "blockly-ARIA_LABEL_REMOVE_ELSE_IF", "blockly-ARIA_LABEL_REMOVE_INPUT", "blockly-ARIA_LABEL_REMOVE_LIST_ITEM", "blockly-ARIA_LABEL_REMOVE_TEXT", "blockly-ARIA_LABEL_TRASH_EMPTY", "blockly-ARIA_TYPE_FIELD_ANGLE", "blockly-ARIA_TYPE_FIELD_BITMAP", "blockly-ARIA_TYPE_FIELD_CHECKBOX", "blockly-ARIA_TYPE_FIELD_COLOUR", "blockly-ARIA_TYPE_FIELD_DATE", "blockly-ARIA_TYPE_FIELD_DROPDOWN", "blockly-ARIA_TYPE_FIELD_GRID", "blockly-ARIA_TYPE_FIELD_IMAGE", "blockly-ARIA_TYPE_FIELD_INPUT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE", "blockly-BACKSPACE_KEY", "blockly-BLOCK_LABEL_BEGIN_PREFIX", "blockly-BLOCK_LABEL_BEGIN_STACK", "blockly-BLOCK_LABEL_COLLAPSED", "blockly-BLOCK_LABEL_CONTAINER", "blockly-BLOCK_LABEL_DISABLED", "blockly-BLOCK_LABEL_HAS_BRANCHES", "blockly-BLOCK_LABEL_HAS_INPUT", "blockly-BLOCK_LABEL_HAS_INPUTS", "blockly-BLOCK_LABEL_REPLACEABLE", "blockly-BLOCK_LABEL_STACK_BLOCKS", "blockly-BLOCK_LABEL_STATEMENT", "blockly-BLOCK_LABEL_TOOLBOX_CATEGORY", "blockly-BLOCK_LABEL_VALUE", "blockly-BUBBLE_LABEL_COMMENT", "blockly-BUBBLE_LABEL_DEFAULT", "blockly-BUBBLE_LABEL_WARNING", "blockly-CAPS_LOCK_KEY"];
  for (const key of blockLabelKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-ARIA_LABEL_FIELD_ANGLE'], /%1 dərəcə/);
  assert.match(locale['blockly-ARIA_LABEL_TRASH_EMPTY'], /hazırda boşdur/);
  assert.match(locale['blockly-BLOCK_LABEL_HAS_BRANCHES'], /%1 budağı var/);
  for (const pair of [['blockly-ARIA_LABEL_COMMENT_COLLAPSE', 'blockly-ARIA_LABEL_COMMENT_EXPAND'], ['blockly-BLOCK_LABEL_HAS_INPUT', 'blockly-BLOCK_LABEL_HAS_INPUTS'], ['blockly-BUBBLE_LABEL_COMMENT', 'blockly-BUBBLE_LABEL_WARNING'], ['blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT', 'blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const mapAccessibilityKeys = ["filter-preset-save", "filter-preset-replace-hint", "filter-preset-saved", "filter-preset-applied", "filter-preset-deleted", "filter-preset-error", "filter-card-text-label", "import-report-heading", "import-report-description", "import-report-open-board", "draggable", "board-view-map", "map-view-empty", "map-view-upload", "map-view-remove-image", "map-view-unplaced", "map-view-place-hint", "map-view-all-placed", "blockly-ANNOUNCE_CANT_SCROLL_FURTHER", "blockly-ANNOUNCE_MOVE_AFTER", "blockly-ANNOUNCE_MOVE_AROUND", "blockly-ANNOUNCE_MOVE_BEFORE", "blockly-ANNOUNCE_MOVE_CANCELED", "blockly-ANNOUNCE_MOVE_INSIDE", "blockly-ANNOUNCE_MOVE_TO", "blockly-ANNOUNCE_MOVE_WORKSPACE", "blockly-ANNOUNCE_SCROLLED_DOWN", "blockly-ANNOUNCE_SCROLLED_LEFT", "blockly-ANNOUNCE_SCROLLED_RIGHT", "blockly-ANNOUNCE_SCROLLED_UP", "blockly-ARIA_LABEL_ADD_ELSE_IF", "blockly-ARIA_LABEL_ADD_INPUT", "blockly-ARIA_LABEL_ADD_LIST_ITEM", "blockly-ARIA_LABEL_ADD_TEXT"];
  for (const key of mapAccessibilityKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['filter-preset-replace-hint'], /yalnız sizə.*Eyni adla.*əvəz edir/);
  assert.match(locale['import-report-description'], /Lövhə yaradıldı.*mümkün olmadı/);
  assert.match(locale['map-view-empty'], /Lövhə administratoru/);
  assert.match(locale['map-view-place-hint'], /sürükləyin və ya.*klikləyin/);
  for (const pair of [['blockly-ANNOUNCE_MOVE_AFTER', 'blockly-ANNOUNCE_MOVE_BEFORE'], ['blockly-ANNOUNCE_SCROLLED_LEFT', 'blockly-ANNOUNCE_SCROLLED_RIGHT'], ['blockly-ANNOUNCE_SCROLLED_DOWN', 'blockly-ANNOUNCE_SCROLLED_UP'], ['map-view-upload', 'map-view-remove-image']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const ruleReminderKeys = ["add-parent-card", "remove-parent-card", "r-when-card-date", "r-trigger-vars-hint", "r-insert-variable", "r-vars-people-hint", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part", "notification-activity-heading", "notification-activity-description", "notification-activity-labels", "notification-activity-members", "notification-activity-assignees", "notification-activity-comments", "notification-activity-moves", "notification-activity-dates", "notification-activity-checklists", "notification-activity-attachments", "notification-activity-customFields", "notification-activity-archive", "notification-activity-created", "due-reminder-heading", "due-reminder-days-label", "due-reminder-off", "due-reminder-webhook", "due-reminder-invalid", "due-reminder-saved", "dependency-type-duplicates", "dependency-type-is-duplicated-by", "custom-field-stringtemplate-context-hint", "filter-presets", "filter-preset-choose", "filter-preset-name"];
  for (const key of ruleReminderKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['r-rule-any-trigger-help'], /hər hansı biri.*ardıcıllıqla/);
  assert.match(locale['notification-activity-description'], /Son tarix xatırlatmaları və @ ilə qeyd edilmələr həmişə gəlir/);
  assert.match(locale['due-reminder-days-label'], /0.*müsbət.*əvvəlki.*mənfi.*sonrakı/);
  assert.match(locale['due-reminder-invalid'], /-14.*14.*on tam/);
  assert.notEqual(locale['dependency-type-duplicates'], locale['dependency-type-is-duplicated-by']);
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: ${token}`);
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Field name}']) assert.ok(locale['r-vars-people-hint'].includes(token), `${code}: ${token}`);
  const keys = ["auto-archive-days", "auto-archive-off", "auto-archive-hint", "filter-recency-any", "filter-recency-day", "filter-recency-week", "filter-recency-month", "filter-recency-older", "filter-movement-range", "filter-date-range-field", "filter-date-range-from", "filter-date-range-to", "filter-date-range-missing", "filter-date-range-list-entry", "filter-date-range-invalid", "filter-due-any", "filter-due-previous-week", "filter-due-next-month", "filter-column-age", "filter-column-age-disabled", "filter-column-age-days", "filter-column-age-hint", "advanced-filter-card-dates-hint", "import-board-instruction-leo", "import-board-instruction-todotxt", "instance", "instance-desc", "board-instance-info", "automatic-linked-url-schemes-hint", "other-parent-cards"];
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['auto-archive-hint'], /şablonlar heç vaxt arxivləşdirilmir/);
  assert.match(locale['filter-column-age-hint'], /məlum olmayan kartlar görünən qalır.*sıfırlamır/);
  assert.match(locale['instance-desc'], /daxil olmamış şəxslərə heç vaxt göstərilmir.*Yalnız lövhəyə əlavə edilmiş/);
  assert.match(locale['board-instance-info'], /<strong>.*<\/strong>/);
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: ${token}`);
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: ${token}`);
  for (const token of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) assert.ok(locale['automatic-linked-url-schemes-hint'].includes(token), `${code}: ${token}`);
}
// Armenian translation batches and recovery guidance.
{
  const locale = read('hy');
  const recoveryFinalKeys = ["rule-email-legacy-discard-confirm", "rule-email-legacy-empty", "rule-email-legacy-unavailable", "rule-email-legacy-access-denied", "rule-email-legacy-source-changed", "rule-email-legacy-source-unavailable", "rule-email-legacy-plan-unavailable", "rule-email-legacy-attempt-exists", "rule-email-legacy-not-legacy", "rule-email-legacy-failed", "saml-login-not-started", "move-selection-before", "move-selection-after", "history-request-pending-undo", "history-request-pending-redo", "history-request-hint", "history-request-retry", "history-request-forget"];
  for (const key of recoveryFinalKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['rule-email-legacy-discard-confirm'], /երբեք չի ուղարկվի/);
  assert.match(locale['saml-login-not-started'], /SAML.*չի սկսվել.*ներդիրում/);
  assert.match(locale['history-request-hint'], /նույն հարցումը.*երբեք չի կարող հետարկել երկրորդ փոփոխությունը/);
  for (const pair of [['history-request-pending-undo', 'history-request-pending-redo'], ['move-selection-before', 'move-selection-after']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const emailResolutionKeys = ["rule-email-recovery-empty", "rule-email-recovery-unavailable", "rule-email-recovery-dropped", "rule-email-recovery-review", "rule-email-recovery-recipients", "rule-email-recovery-recipient-accepted", "rule-email-recovery-recipient-unconfirmed", "rule-email-recovery-actions-hint", "rule-email-recovery-wait", "rule-email-recovery-resends", "rule-email-recovery-resend", "rule-email-recovery-mark-sent", "rule-email-recovery-drop", "rule-email-recovery-resend-confirm", "rule-email-recovery-mark-sent-confirm", "rule-email-recovery-drop-confirm", "rule-email-resolution-too-early", "rule-email-resolution-already-resolved", "rule-email-resolution-resend-in-flight", "rule-email-resolution-nothing-to-resend", "rule-email-resolution-resend-uncertain", "rule-email-resolution-busy", "rule-email-resolution-command-changed", "rule-email-resolution-attempt-invalid", "rule-email-resolution-failed", "rule-email-legacy-heading", "rule-email-legacy-description", "rule-email-legacy-source", "rule-email-legacy-mail", "rule-email-legacy-reason", "rule-email-legacy-reason-unbound", "rule-email-legacy-reason-details-snapshot", "rule-email-legacy-rebind", "rule-email-legacy-discard", "rule-email-legacy-rebind-confirm"];
  for (const key of emailResolutionKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['rule-email-recovery-actions-hint'], /երբեք ինքնուրույն կրկին չի ուղարկում/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /երկու անգամ/);
  assert.match(locale['rule-email-recovery-drop-confirm'], /չի ուղարկվի/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /հասած լինել կամ չլինել/);
  assert.match(locale['rule-email-legacy-description'], /ինքնուրույն չի ուղարկի.*հեղինակը դեռ հասանելիության իրավունք ունի/);
  assert.match(locale['rule-email-legacy-rebind-confirm'], /կարող է տարբերվել/);
  const activityRecoveryKeys = ["activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-heading", "rule-email-recovery-description", "rule-email-recovery-all", "rule-email-recovery-unconfirmed", "rule-email-recovery-sent", "rule-email-recovery-invalid", "rule-email-recovery-identifiers", "rule-email-recovery-started", "rule-email-recovery-finished"];
  for (const key of activityRecoveryKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-description'], /երբեք չի վերստեղծում/);
  assert.match(locale['activity-recovery-source-unavailable'], /Ոչինչ չի վերստեղծվել/);
  assert.match(locale['activity-recovery-failed'], /Սպասող աշխատանքը պահպանվել է/);
  assert.match(locale['activity-recovery-cancel-confirm'], /հնարավոր չի լինի վերսկսել.*հետ չեն կանչվում/);
  assert.match(locale['rule-email-recovery-description'], /չի կրկնում և չի չեղարկում/);
  assert.match(locale['rule-email-recovery-sent'], /փոստային սերվերի/);
  for (const pair of [['activity-recovery-status-missing', 'activity-recovery-status-changed'], ['activity-recovery-pause', 'activity-recovery-resume'], ['rule-email-recovery-unconfirmed', 'rule-email-recovery-finished']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const emailQueueKeys = ["email-recovery-heading", "email-recovery-description", "email-recovery-saving", "email-recovery-queued", "email-recovery-retrying", "email-recovery-attempts", "email-recovery-oldest", "email-recovery-next", "email-recovery-changed", "email-recovery-pause", "email-recovery-resume", "email-recovery-cancel", "email-recovery-paused", "email-recovery-pending", "email-recovery-empty", "email-recovery-unavailable", "email-recovery-busy", "email-recovery-failed", "email-recovery-superseded", "email-recovery-confirm-cancel", "email-recovery-attention", "email-recovery-stopped", "email-recovery-retry", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint"];
  for (const key of emailQueueKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['email-recovery-description'], /հնարավոր չէ հետ կանչել.*չհաստատված առաքումը կարող է կրկնվել/);
  assert.match(locale['email-recovery-description'], /պահպանում է գործող դադարը/);
  assert.match(locale['email-recovery-confirm-cancel'], /չի կարող վերականգնվել.*նոր նամակները կպահպանվեն/);
  assert.match(locale['sync-time-estimate-hint'], /ճիշտ մեկ.*բացակայող արժեքներն անտեսվում են.*null.*մաքրում/);
  for (const pair of [['email-recovery-pause', 'email-recovery-resume'], ['email-failure-smtp-temporary', 'email-failure-smtp-rejected'], ['sync-original-time', 'sync-remaining-time']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const syncPreviewKeys = ["sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint"];
  for (const key of syncPreviewKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-archive-hint'], /Ենթաքարտերը չեն փոխվում/);
  assert.match(locale['sync-conflict-creation-hint'], /նույն փոխարինող քարտը/);
  assert.match(locale['sync-source-scope'], /արժեքները չեն ցուցադրվում/);
  for (const key of ['sync-preview-truncated', 'sync-source-truncated']) assert.match(locale[key], /100/);
  assert.match(locale['sync-report-retention'], /20.*30/);
  assert.match(locale['sync-report-partial'], /չեն վերսկսում.*չեն հետարկում/);
  assert.match(locale['sync-estimate-field-hint'], /բացակայող արժեքներն անտեսվում են.*null.*մաքրում/);
  const observationSyncKeys = ["scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping"];
  for (const key of observationSyncKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
    assert.match(locale[key], /UTC օրվա առաջին գրանցված դիտարկումը/);
    assert.match(locale[key], /[Բբ]ացակայող օրերը բաց են թողնվում/);
    assert.match(locale[key], /Անհայտ գնահատականները զրո չեն/);
  }
  assert.match(locale['scrum-daily-truncated'], /366/);
  assert.match(locale['scrum-import-pending'], /չի ավարտվել.*հասանելի չեն/);
  assert.match(locale['sync-conflict-hint'], /Աղբյուր համակարգին ոչինչ չի ուղարկվում/);
  assert.match(locale['sync-conflict-review-complete'], /Ամբողջ ցուցակի համաժամացում չի կատարվել/);
  assert.notEqual(locale['sync-conflict-keep-local'], locale['sync-conflict-use-source']);
  const sprintReportKeys = ["scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at"];
  for (const key of sprintReportKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /հաշվվում են առանձին.*զրոյական գնահատականներ չեն.*միայն.*համընկնող/);
  assert.match(locale['scrum-confirm-close'], /Չավարտված քարտերը կտեղափոխվեն/);
  assert.match(locale['scrum-confirm-cancel'], /մնում են սպրինտի կազմում մինչև վերանշանակվելը/);
  assert.match(locale['scrum-partial-report'], /միայն ներկայում ձեզ նշանակված/);
  assert.equal(locale['scrum-category-backlog'], locale['scrum-backlog']);
  for (const pair of [['scrum-added', 'scrum-removed'], ['scrum-completed', 'scrum-incomplete'], ['scrum-state-closed', 'scrum-state-cancelled'], ['scrum-state-planned', 'scrum-state-active'], ['scrum-event-review', 'scrum-event-retrospective']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const planningKeys = ["board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox"];
  for (const key of planningKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.equal(locale['scrum-product-backlog'], locale['board-view-product-backlog']);
  assert.equal(locale['scrum-sprints'], locale['board-view-sprints']);
  assert.match(locale['scrum-backlog-help'], /պլանավորված կամ ակտիվ/);
  assert.match(locale['scrum-rollover-sprint'], /Չավարտված աշխատանքը/);
  assert.match(locale['scrum-timebox'], /րոպեներ/);
  for (const pair of [['scrum-start-sprint', 'scrum-close-sprint'], ['scrum-close-sprint', 'scrum-cancel-sprint'], ['scrum-policy-dueComplete', 'scrum-policy-doneLists'], ['scrum-estimate-source', 'scrum-estimate-unit']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const searchRuleKeys = ["blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report"];
  for (const key of searchRuleKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  for (const token of ['Enter', 'Shift+Enter', 'Escape']) assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(token));
  assert.match(locale['r-blocks-invalid'], /ճիշտ մեկ գործարկիչ մեկ գործողության.*չմիացված կամ ավելորդ/);
  assert.match(locale['r-blocks-permission'], /տախտակի ադմինիստրատորի թույլտվություն/);
  assert.match(locale['r-blocks-conflict'], /Պահպանելուց առաջ վերաբեռնեք/);
  assert.match(locale['blockly-WORKSPACE_SEARCH_NO_MATCHES'], /բլոկներ չկան/);
  assert.notEqual(locale['blockly-WORKSPACE_SEARCH_FIND_NEXT'], locale['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']);
  assert.notEqual(locale['r-blocks-unsaved'], locale['r-blocks-saved']);
  const workspaceNavigationKeys = ["blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-SPACE_KEY", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-UNKNOWN", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK"];
  for (const key of workspaceNavigationKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  for (const suffix of ['MANY', 'ONE']) assert.ok(locale[`blockly-WORKSPACE_CONTENTS_COMMENTS_${suffix}`].startsWith(' և '));
  assert.match(locale['blockly-TEXT_FROM_END_ARIA'], /վերջից/);
  assert.match(locale['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'], /բլոկներ չկան/);
  assert.match(locale['blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE'], /Միացնել կամ անջատել/);
  for (const pair of [['blockly-SHORTCUTS_MOVE_DOWN', 'blockly-SHORTCUTS_MOVE_UP'], ['blockly-SHORTCUTS_MOVE_LEFT', 'blockly-SHORTCUTS_MOVE_RIGHT'], ['blockly-SHORTCUTS_NEXT_HEADING', 'blockly-SHORTCUTS_PREVIOUS_HEADING'], ['blockly-SHORTCUTS_NEXT_STACK', 'blockly-SHORTCUTS_PREVIOUS_STACK'], ['blockly-SHORTCUTS_START_MOVE', 'blockly-SHORTCUTS_FINISH_MOVE']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const keyboardScreenreaderKeys = ["blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PAUSE_KEY", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHIFT_KEY", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE"];
  for (const key of keyboardScreenreaderKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['blockly-SCREENREADER_MODE_DISABLED'], /անջատված է.*միացնելու/);
  assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'], /միացված է.*անջատելու/);
  assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /Հնարավոր չէ.*անջատված է/);
  assert.match(locale['blockly-PASTE_ALL_FROM_BACKPACK'], /բոլոր բլոկները/);
  for (const pair of [['blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY'], ['blockly-SHORTCUTS_ABORT_MOVE', 'blockly-SHORTCUTS_FINISH_MOVE'], ['blockly-SHORTCUTS_JUMP_BLOCK_END', 'blockly-SHORTCUTS_JUMP_BLOCK_START'], ['blockly-SHORTCUTS_JUMP_FIRST_BLOCK', 'blockly-SHORTCUTS_JUMP_LAST_BLOCK'], ['blockly-SHORTCUTS_JUMP_NEXT_PAGE', 'blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const mathLabelKeys = ["blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH"];
  for (const key of mathLabelKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  for (const op of ['GTE', 'LTE']) assert.match(locale[`blockly-LOGIC_COMPARE_${op}_ARIA`], /կամ հավասար է/);
  for (const op of ['GT', 'LT']) assert.doesNotMatch(locale[`blockly-LOGIC_COMPARE_${op}_ARIA`], /հավասար/);
  assert.match(locale['blockly-MATH_CONSTANT_SQRT1_2_ARIA'], /մեկ երկրորդի քառակուսի արմատը/);
  assert.match(locale['blockly-MATH_SINGLE_OP_LOG10_ARIA'], /10 հիմքով/);
  for (const op of ['ACOS', 'ASIN', 'ATAN']) assert.match(locale[`blockly-MATH_TRIG_${op}_ARIA`], /^արկ/);
  for (const pair of [['blockly-LOGIC_COMPARE_EQ_ARIA', 'blockly-LOGIC_COMPARE_NEQ_ARIA'], ['blockly-MATH_ADDITION_SYMBOL_ARIA', 'blockly-MATH_SUBTRACTION_SYMBOL_ARIA'], ['blockly-MATH_DIVISION_SYMBOL_ARIA', 'blockly-MATH_MULTIPLICATION_SYMBOL_ARIA'], ['blockly-OPEN_BACKPACK', 'blockly-CLOSE_BACKPACK']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const inputNavigationKeys = ["blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT"];
  for (const key of inputNavigationKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['blockly-INPUT_LABEL_TEXT_APPEND'], /վերջում/);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_X'], /^x /);
  assert.match(locale['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'], /^y /);
  assert.match(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /Սեղմած պահեք %1.*ապա %2.*հաստատելու/);
  assert.match(locale['blockly-KEYBOARD_NAV_COPIED_HINT'], /^Պատճենված/);
  assert.match(locale['blockly-KEYBOARD_NAV_CUT_HINT'], /^Կտրված/);
  for (const pair of [['blockly-INPUT_LABEL_NUMBER_A', 'blockly-INPUT_LABEL_NUMBER_B'], ['blockly-INPUT_LABEL_NUMBER_MAX', 'blockly-INPUT_LABEL_NUMBER_MIN'], ['blockly-INPUT_LABEL_TEXT_START_POSITION', 'blockly-INPUT_LABEL_TEXT_END_POSITION'], ['blockly-INPUT_LABEL_TEXT_TO_FIND', 'blockly-INPUT_LABEL_TEXT_TO_REPLACE'], ['blockly-INPUT_LABEL_VALUE_A', 'blockly-INPUT_LABEL_VALUE_B']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const blockInputKeys = ["blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER"];
  for (const key of blockInputKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  for (const type of ['COMMENT', 'WARNING']) {
    assert.match(locale[`blockly-ICON_LABEL_${type}_CLOSED`], /^Բացել/);
    assert.match(locale[`blockly-ICON_LABEL_${type}_OPEN`], /^Փակել/);
  }
  assert.match(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], /^բաժանելի$/);
  assert.match(locale['blockly-INPUT_LABEL_MATH_DIVISOR'], /^բաժանարար$/);
  for (const pair of [['blockly-INPUT_LABEL_CONDITION_A', 'blockly-INPUT_LABEL_CONDITION_B'], ['blockly-INPUT_LABEL_LOOP_FROM', 'blockly-INPUT_LABEL_LOOP_TO'], ['blockly-INPUT_LABEL_LISTS_START_POSITION', 'blockly-INPUT_LABEL_LISTS_END_POSITION'], ['blockly-INPUT_LABEL_LISTS_REPEAT_ITEM', 'blockly-INPUT_LABEL_LISTS_REPEAT_NUM'], ['blockly-INPUT_LABEL_LISTS_TO_CHANGE', 'blockly-INPUT_LABEL_LISTS_TO_CHECK']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const blockFieldKeys = ["blockly-BLOCK_LABEL_HAS_INPUT", "blockly-BLOCK_LABEL_HAS_INPUTS", "blockly-BLOCK_LABEL_REPLACEABLE", "blockly-BLOCK_LABEL_STACK_BLOCKS", "blockly-BLOCK_LABEL_STATEMENT", "blockly-BLOCK_LABEL_TOOLBOX_CATEGORY", "blockly-BLOCK_LABEL_VALUE", "blockly-BUBBLE_LABEL_COMMENT", "blockly-BUBBLE_LABEL_DEFAULT", "blockly-BUBBLE_LABEL_WARNING", "blockly-CAPS_LOCK_KEY", "blockly-CLOSE_BACKPACK", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROL_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY"];
  for (const key of blockFieldKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'], /տող %2, սյուն %3/);
  assert.match(locale['blockly-FIELD_BITMAP_ARIA_VALUE'], /%1 × %2, %3 պիքսել միացված/);
  assert.match(locale['blockly-COPY_ALL_TO_BACKPACK'], /բոլոր բլոկները/);
  assert.match(locale['blockly-EMPTY_BACKPACK'], /Դատարկել/);
  assert.match(locale['blockly-CLOSE_BACKPACK'], /Փակել/);
  for (const pair of [['blockly-COPY_SHORTCUT', 'blockly-CUT_SHORTCUT'], ['blockly-HOME_KEY', 'blockly-END_KEY'], ['blockly-END_KEY', 'end-date'], ['blockly-FIELD_MULTILINEINPUT_FINISH_EDITING', 'blockly-FIELD_MULTILINEINPUT_NEW_LINE']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const accessibilityKeys = ["blockly-ANNOUNCE_MOVE_CANCELED", "blockly-ANNOUNCE_MOVE_INSIDE", "blockly-ANNOUNCE_MOVE_TO", "blockly-ANNOUNCE_MOVE_WORKSPACE", "blockly-ANNOUNCE_SCROLLED_DOWN", "blockly-ANNOUNCE_SCROLLED_LEFT", "blockly-ANNOUNCE_SCROLLED_RIGHT", "blockly-ANNOUNCE_SCROLLED_UP", "blockly-ARIA_LABEL_ADD_ELSE_IF", "blockly-ARIA_LABEL_ADD_INPUT", "blockly-ARIA_LABEL_ADD_LIST_ITEM", "blockly-ARIA_LABEL_ADD_TEXT", "blockly-ARIA_LABEL_BUTTON", "blockly-ARIA_LABEL_COMMENT_COLLAPSE", "blockly-ARIA_LABEL_COMMENT_EXPAND", "blockly-ARIA_LABEL_FIELD_ANGLE", "blockly-ARIA_LABEL_REMOVE_ELSE_IF", "blockly-ARIA_LABEL_REMOVE_INPUT", "blockly-ARIA_LABEL_REMOVE_LIST_ITEM", "blockly-ARIA_LABEL_REMOVE_TEXT", "blockly-ARIA_LABEL_TRASH_EMPTY", "blockly-ARIA_TYPE_FIELD_ANGLE", "blockly-ARIA_TYPE_FIELD_BITMAP", "blockly-ARIA_TYPE_FIELD_CHECKBOX", "blockly-ARIA_TYPE_FIELD_COLOUR", "blockly-ARIA_TYPE_FIELD_DATE", "blockly-ARIA_TYPE_FIELD_DROPDOWN", "blockly-ARIA_TYPE_FIELD_GRID", "blockly-ARIA_TYPE_FIELD_IMAGE", "blockly-ARIA_TYPE_FIELD_INPUT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE", "blockly-BACKSPACE_KEY", "blockly-BLOCK_LABEL_BEGIN_PREFIX", "blockly-BLOCK_LABEL_BEGIN_STACK", "blockly-BLOCK_LABEL_COLLAPSED", "blockly-BLOCK_LABEL_CONTAINER", "blockly-BLOCK_LABEL_DISABLED", "blockly-BLOCK_LABEL_HAS_BRANCHES"];
  for (const key of accessibilityKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  assert.match(locale['blockly-ANNOUNCE_MOVE_INSIDE'], /ներսը/);
  assert.match(locale['blockly-ARIA_LABEL_TRASH_EMPTY'], /այժմ դատարկ/);
  assert.match(locale['blockly-ARIA_LABEL_FIELD_ANGLE'], /%1 աստիճան/);
  assert.match(locale['blockly-BLOCK_LABEL_DISABLED'], /անջատված/);
  for (const pair of [['blockly-ANNOUNCE_SCROLLED_DOWN', 'blockly-ANNOUNCE_SCROLLED_UP'], ['blockly-ANNOUNCE_SCROLLED_LEFT', 'blockly-ANNOUNCE_SCROLLED_RIGHT'], ['blockly-ARIA_LABEL_COMMENT_COLLAPSE', 'blockly-ARIA_LABEL_COMMENT_EXPAND'], ['blockly-ARIA_LABEL_ADD_INPUT', 'blockly-ARIA_LABEL_REMOVE_INPUT'], ['blockly-ARIA_LABEL_ADD_LIST_ITEM', 'blockly-ARIA_LABEL_REMOVE_LIST_ITEM'], ['blockly-ARIA_LABEL_ADD_TEXT', 'blockly-ARIA_LABEL_REMOVE_TEXT']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const filterMapKeys = ["dependency-type-is-duplicated-by", "custom-field-stringtemplate-context-hint", "filter-presets", "filter-preset-choose", "filter-preset-name", "filter-preset-save", "filter-preset-replace-hint", "filter-preset-saved", "filter-preset-applied", "filter-preset-deleted", "filter-preset-error", "filter-card-text-label", "import-report-heading", "import-report-description", "import-report-open-board", "draggable", "board-view-map", "map-view-empty", "map-view-upload", "map-view-remove-image", "map-view-unplaced", "map-view-place-hint", "map-view-all-placed", "blockly-ANNOUNCE_CANT_SCROLL_FURTHER", "blockly-ANNOUNCE_MOVE_AFTER", "blockly-ANNOUNCE_MOVE_AROUND", "blockly-ANNOUNCE_MOVE_BEFORE"];
  for (const key of filterMapKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  for (const token of ['%{card.title}', '%{board.title}', '%{list.title}', '%{swimlane.title}', '|urlencode', '%{value|urlencode}']) assert.ok(locale['custom-field-stringtemplate-context-hint'].includes(token));
  for (const key of ['admin-panel', 'problems', 'recoveryReportTitle']) assert.ok(locale['import-report-description'].includes(locale[key]));
  assert.match(locale['filter-preset-replace-hint'], /միայն ձեզ.*Նույն անունով.*փոխարինում/);
  assert.match(locale['map-view-place-hint'], /քաշեք.*կամ ընտրեք.*սեղմեք/);
  assert.match(locale['blockly-ANNOUNCE_MOVE_AFTER'], /հետո/);
  assert.match(locale['blockly-ANNOUNCE_MOVE_BEFORE'], /առաջ/);
  assert.notEqual(locale['dependency-type-is-duplicated-by'], locale['dependency-type-duplicates']);
  const ruleReminderKeys = ["automatic-linked-url-schemes-hint", "other-parent-cards", "add-parent-card", "remove-parent-card", "r-when-card-date", "r-trigger-vars-hint", "r-insert-variable", "r-vars-people-hint", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part", "notification-activity-heading", "notification-activity-description", "notification-activity-labels", "notification-activity-members", "notification-activity-assignees", "notification-activity-comments", "notification-activity-moves", "notification-activity-dates", "notification-activity-checklists", "notification-activity-attachments", "notification-activity-customFields", "notification-activity-archive", "notification-activity-created", "due-reminder-heading", "due-reminder-days-label", "due-reminder-off", "due-reminder-webhook", "due-reminder-invalid", "due-reminder-saved", "dependency-type-duplicates"];
  for (const key of ruleReminderKeys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) assert.deepEqual(locale[key].match(/\{[^{}]+\}/g), english[key].match(/\{[^{}]+\}/g));
  for (const token of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) assert.ok(locale['automatic-linked-url-schemes-hint'].includes(token));
  assert.match(locale['automatic-linked-url-schemes-hint'], /երբեք չեն վերածվում հղումների/);
  assert.match(locale['r-rule-any-trigger-help'], /որևէ մեկը.*հերթականությամբ/);
  assert.match(locale['due-reminder-days-label'], /0.*դրական.*առաջ.*բացասական.*հետո.*դատարկ/);
  assert.match(locale['due-reminder-invalid'], /տասը.*-14.*14/);
  assert.match(locale['notification-activity-description'], /հիշեցումները և @հիշատակումները միշտ հասնում են/);
  assert.notEqual(locale['r-add-trigger-to-rule'], locale['r-add-action-to-rule']);
  assert.notEqual(locale['notification-activity-members'], locale['notification-activity-assignees']);
  const keys = ["auto-archive-days", "auto-archive-off", "auto-archive-hint", "filter-recency-any", "filter-recency-day", "filter-recency-week", "filter-recency-month", "filter-recency-older", "filter-movement-range", "filter-date-range-field", "filter-date-range-from", "filter-date-range-to", "filter-date-range-missing", "filter-date-range-list-entry", "filter-date-range-invalid", "filter-due-any", "filter-due-previous-week", "filter-due-next-month", "filter-column-age", "filter-column-age-disabled", "filter-column-age-days", "filter-column-age-hint", "advanced-filter-card-dates-hint", "import-board-instruction-leo", "import-board-instruction-todotxt", "instance", "instance-desc", "board-instance-info"];
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `hy:${key}: translated`);
    assert.match(locale[key], /[\u0531-\u0587]/, `hy:${key}: Armenian script`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hy:${key}: tokens`);
  }
  for (const key of ['filter-date-range-from', 'filter-date-range-to']) assert.match(locale[key], /ներառյալ/);
  assert.match(locale['auto-archive-hint'], /ամեն ժամ.*երբեք չեն արխիվացվում.*դատարկ/);
  assert.match(locale['filter-column-age-hint'], /անհայտ ամսաթվով քարտերը մնում են տեսանելի.*չի վերսկսում/);
  assert.match(locale['instance-desc'], /երբեք չի ցուցադրվում մուտք չգործած.*միայն տախտակին ավելացված/);
  assert.match(locale['board-instance-info'], /<strong>.*<\/strong>/);
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) assert.ok(locale['advanced-filter-card-dates-hint'].includes(token));
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) assert.ok(locale['import-board-instruction-todotxt'].includes(token));
  assert.ok(locale['import-board-instruction-leo'].includes('.leo'));
}
// Albanian completion and meaning checks for the newly translated messages.
{
  const locale = read('sq');
  const finalRecoveryKeys = ["activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-heading", "rule-email-recovery-description", "rule-email-recovery-all", "rule-email-recovery-unconfirmed", "rule-email-recovery-sent", "rule-email-recovery-invalid", "rule-email-recovery-identifiers", "rule-email-recovery-started", "rule-email-recovery-finished", "rule-email-recovery-empty", "rule-email-recovery-unavailable", "saml-login-not-started", "move-selection-before", "move-selection-after", "history-request-pending-undo", "history-request-pending-redo", "history-request-hint", "history-request-retry", "history-request-forget"];
  for (const key of finalRecoveryKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  for (const key of ['blockly-ALT_KEY', 'blockly-COMMAND_KEY', 'blockly-TAB_KEY', 'blockly-CHROME_OS', 'blockly-LINUX', 'blockly-MAC_OS', 'blockly-WINDOWS', 'blockly-MATH_ADDITION_SYMBOL_ARIA', 'blockly-MATH_SUBTRACTION_SYMBOL_ARIA', 'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN']) assert.equal(locale[key], english[key]);
  assert.match(locale['activity-recovery-cancel-confirm'], /përgjithmonë.*nuk mund të vazhdohet më.*nuk tërhiqen/);
  assert.match(locale['activity-recovery-source-unavailable'], /Asgjë nuk u rikrijua/);
  assert.match(locale['activity-recovery-failed'], /Puna në pritje është ruajtur/);
  assert.match(locale['rule-email-recovery-description'], /nuk riprovon dhe nuk anulon/);
  assert.match(locale['history-request-hint'], /të njëjtën kërkesë.*kurrë një ndryshim të dytë/);
  assert.match(locale['saml-login-not-started'], /SAML.*nuk u nis.*skedë të shfletuesit/);
  assert.notEqual(locale['history-request-pending-undo'], locale['history-request-pending-redo']);
  assert.notEqual(locale['move-selection-before'], locale['move-selection-after']);
  const emailQueueKeys = ["email-recovery-saving", "email-recovery-queued", "email-recovery-retrying", "email-recovery-attempts", "email-recovery-oldest", "email-recovery-next", "email-recovery-changed", "email-recovery-pause", "email-recovery-resume", "email-recovery-cancel", "email-recovery-paused", "email-recovery-pending", "email-recovery-empty", "email-recovery-unavailable", "email-recovery-busy", "email-recovery-failed", "email-recovery-superseded", "email-recovery-confirm-cancel", "email-recovery-attention", "email-recovery-stopped", "email-recovery-retry", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing"];
  for (const key of emailQueueKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /këtë marrës.*nuk mund të rikthehet.*pas kësaj kërkese ruhen/);
  assert.match(locale['email-recovery-failed'], /të njëjtin veprim/);
  assert.match(locale['email-failure-delivery-unconfirmed'], /shqyrtoje para se të provosh sërish/);
  assert.match(locale['sync-time-estimate-hint'], /saktësisht një fushë.*mungojnë shpërfillen.*null.*zbraz/);
  assert.match(locale['activity-recovery-description'], /automatikisht.*nuk rikrijon kurrë/);
  assert.ok(locale['email-recovery-description'].includes(locale['email-recovery-retry']));
  for (const pair of [['email-recovery-pause', 'email-recovery-resume'], ['email-failure-smtp-temporary', 'email-failure-smtp-rejected'], ['sync-original-time', 'sync-remaining-time']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const syncDiagnosticKeys = ["sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-recovery-heading", "email-recovery-description"];
  for (const key of syncDiagnosticKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  assert.match(locale['sync-report-retention'], /20.*30/);
  assert.match(locale['sync-source-truncated'], /100.*shkurtuar/);
  assert.match(locale['sync-source-scope'], /si tërësi.*vlerat e tyre nuk shfaqen/);
  assert.match(locale['sync-report-partial'], /mund të kenë ndryshuar.*nuk vazhdojnë dhe nuk zhbëjnë/);
  assert.match(locale['sync-report-unavailable'], /qasje shkrimi në të gjithë listën/);
  assert.match(locale['sync-estimate-field-hint'], /mungojnë shpërfillen.*null.*zbraz/);
  assert.match(locale['email-recovery-description'], /ekzistuese dhe të ardhshme.*deri në kohën e kërkesës.*nuk mund të tërhiqet.*i pasigurt mund të përsëritet.*respekton një pezullim ekzistues/);
  assert.notEqual(locale['sync-report-completed'], locale['sync-report-completed-with-warnings']);
  assert.notEqual(locale['sync-preview-create'], locale['sync-preview-archive']);
  const reportSyncKeys = ["scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked"];
  for (const key of reportSyncKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  assert.match(locale['scrum-confirm-close'], /papërfunduara do të zhvendosen/);
  assert.match(locale['scrum-confirm-cancel'], /mbeten pjesë e tij derisa të ricaktohen/);
  for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
    assert.match(locale[key], /UTC/);
    assert.match(locale[key], /[Dd]itët që mungojnë nuk përfshihen/);
    assert.match(locale[key], /Vlerësimet e panjohura nuk janë zero/);
  }
  assert.match(locale['scrum-daily-truncated'], /366/);
  assert.match(locale['sync-conflict-hint'], /Asgjë nuk i dërgohet sistemit burimor/);
  assert.match(locale['sync-conflict-review-complete'], /të gjithë listës nuk u ekzekutua/);
  assert.match(locale['sync-conflict-detach-hint'], /Hiq vetëm.*Përmbajtja e saj mbetet/);
  assert.match(locale['sync-conflict-archive-hint'], /Nënkartat nuk ndryshohen/);
  assert.match(locale['sync-conflict-creation-hint'], /të pandryshuar.*ripërdorin/);
  assert.notEqual(locale['sync-conflict-keep-local'], locale['sync-conflict-use-source']);
  const planningKeys = ["r-blocks-saved", "r-blocks-reload", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active"];
  for (const key of planningKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /panjohura numërohen veçmas.*nuk janë vlerësime zero.*vetëm kur.*përputhen/);
  assert.match(locale['scrum-backlog-help'], /të planifikuar ose aktiv/);
  assert.match(locale['scrum-timebox'], /minuta/);
  assert.equal(locale['scrum-product-backlog'], locale['board-view-product-backlog']);
  assert.equal(locale['scrum-sprints'], locale['board-view-sprints']);
  for (const pair of [['scrum-start-sprint', 'scrum-close-sprint'], ['scrum-close-sprint', 'scrum-cancel-sprint'], ['scrum-added', 'scrum-removed'], ['scrum-completed', 'scrum-incomplete'], ['scrum-state-planned', 'scrum-state-active'], ['scrum-policy-dueComplete', 'scrum-policy-doneLists']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const workspaceKeys = ["blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-SPACE_KEY", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved"];
  for (const key of workspaceKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  for (const token of ['Enter', 'Shift+Enter', 'Escape']) assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(token));
  for (const suffix of ['MANY', 'ONE']) assert.ok(locale[`blockly-WORKSPACE_CONTENTS_COMMENTS_${suffix}`].startsWith(' dhe '));
  assert.match(locale['r-blocks-invalid'], /saktësisht një shkaktar me një veprim.*palidhura ose shtesë/);
  assert.match(locale['r-blocks-permission'], /administratorit të tabelës/);
  assert.match(locale['r-blocks-conflict'], /Ringarko.*para se ta ruash/);
  assert.match(locale['blockly-TEXT_FROM_END_ARIA'], /nga fundi/);
  for (const pair of [['blockly-SHORTCUTS_MOVE_DOWN', 'blockly-SHORTCUTS_MOVE_UP'], ['blockly-SHORTCUTS_MOVE_LEFT', 'blockly-SHORTCUTS_MOVE_RIGHT'], ['blockly-SHORTCUTS_JUMP_BLOCK_START', 'blockly-SHORTCUTS_JUMP_BLOCK_END'], ['blockly-SHORTCUTS_JUMP_FIRST_BLOCK', 'blockly-SHORTCUTS_JUMP_LAST_BLOCK'], ['blockly-WORKSPACE_SEARCH_FIND_NEXT', 'blockly-WORKSPACE_SEARCH_FIND_PREVIOUS']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const mathNavigationKeys = ["blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_TERNARY_CONDITION", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PAUSE_KEY", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHIFT_KEY", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX"];
  for (const key of mathNavigationKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  assert.match(locale['blockly-LOGIC_COMPARE_LTE_ARIA'], /ose i barabartë/);
  assert.doesNotMatch(locale['blockly-LOGIC_COMPARE_LT_ARIA'], /barabartë/);
  assert.match(locale['blockly-MATH_ATAN2_TITLE'], /atan2.*X:%1 Y:%2/);
  assert.match(locale['blockly-MATH_CONSTANT_SQRT1_2_ARIA'], /rrënja katrore e një të dytës/);
  assert.match(locale['blockly-MATH_SINGLE_OP_LOG10_ARIA'], /bazë 10/);
  assert.match(locale['blockly-SCREENREADER_MODE_DISABLED'], /është e çaktivizuar.*për ta aktivizuar/);
  assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'], /është e aktivizuar.*për ta çaktivizuar/);
  assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /nuk mund të ekzekutohet.*çaktivizuar/);
  for (const pair of [['blockly-MATH_DIVISION_SYMBOL_ARIA', 'blockly-MATH_MULTIPLICATION_SYMBOL_ARIA'], ['blockly-OPEN_BACKPACK', 'blockly-CLOSE_BACKPACK'], ['blockly-PAGE_DOWN_KEY', 'blockly-PAGE_UP_KEY'], ['blockly-SHORTCUTS_ABORT_MOVE', 'blockly-SHORTCUTS_FINISH_MOVE']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const blockInputKeys = ["blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA"];
  for (const key of blockInputKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  assert.match(locale['blockly-ICON_LABEL_WARNING_CLOSED'], /^Hap /);
  assert.match(locale['blockly-ICON_LABEL_WARNING_OPEN'], /^Mbyll /);
  assert.match(locale['blockly-LOGIC_COMPARE_GTE_ARIA'], /ose i barabartë/);
  assert.doesNotMatch(locale['blockly-LOGIC_COMPARE_GT_ARIA'], /barabartë/);
  assert.match(locale['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /Mbaj shtypur %1.*pastaj %2.*pranuar pozicionin/);
  assert.match(locale['blockly-INPUT_LABEL_TEXT_APPEND'], /në fund/);
  for (const pair of [['blockly-INPUT_LABEL_MATH_DIVIDEND', 'blockly-INPUT_LABEL_MATH_DIVISOR'], ['blockly-INPUT_LABEL_LOOP_FROM', 'blockly-INPUT_LABEL_LOOP_TO'], ['blockly-INPUT_LABEL_CONDITION_A', 'blockly-INPUT_LABEL_CONDITION_B'], ['blockly-INPUT_LABEL_LISTS_START_POSITION', 'blockly-INPUT_LABEL_LISTS_END_POSITION'], ['blockly-INPUT_LABEL_NUMBER_ATAN2_X', 'blockly-INPUT_LABEL_NUMBER_ATAN2_Y']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const blockFieldKeys = ["blockly-ARIA_LABEL_BUTTON", "blockly-ARIA_LABEL_COMMENT_COLLAPSE", "blockly-ARIA_LABEL_COMMENT_EXPAND", "blockly-ARIA_LABEL_FIELD_ANGLE", "blockly-ARIA_LABEL_REMOVE_ELSE_IF", "blockly-ARIA_LABEL_REMOVE_INPUT", "blockly-ARIA_LABEL_REMOVE_LIST_ITEM", "blockly-ARIA_LABEL_REMOVE_TEXT", "blockly-ARIA_LABEL_TRASH_EMPTY", "blockly-ARIA_TYPE_FIELD_ANGLE", "blockly-ARIA_TYPE_FIELD_BITMAP", "blockly-ARIA_TYPE_FIELD_CHECKBOX", "blockly-ARIA_TYPE_FIELD_COLOUR", "blockly-ARIA_TYPE_FIELD_DATE", "blockly-ARIA_TYPE_FIELD_DROPDOWN", "blockly-ARIA_TYPE_FIELD_GRID", "blockly-ARIA_TYPE_FIELD_IMAGE", "blockly-ARIA_TYPE_FIELD_INPUT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE", "blockly-BACKSPACE_KEY", "blockly-BLOCK_LABEL_BEGIN_PREFIX", "blockly-BLOCK_LABEL_BEGIN_STACK", "blockly-BLOCK_LABEL_COLLAPSED", "blockly-BLOCK_LABEL_CONTAINER", "blockly-BLOCK_LABEL_DISABLED", "blockly-BLOCK_LABEL_HAS_BRANCHES", "blockly-BLOCK_LABEL_HAS_INPUT", "blockly-BLOCK_LABEL_HAS_INPUTS", "blockly-BLOCK_LABEL_REPLACEABLE", "blockly-BLOCK_LABEL_STACK_BLOCKS", "blockly-BLOCK_LABEL_STATEMENT", "blockly-BLOCK_LABEL_TOOLBOX_CATEGORY", "blockly-BLOCK_LABEL_VALUE", "blockly-BUBBLE_LABEL_COMMENT", "blockly-BUBBLE_LABEL_DEFAULT", "blockly-BUBBLE_LABEL_WARNING", "blockly-CAPS_LOCK_KEY", "blockly-CLOSE_BACKPACK", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROL_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN"];
  for (const key of blockFieldKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  assert.match(locale['blockly-FIELD_BITMAP_PIXEL_LABEL'], /rreshti %2, kolona %3/);
  assert.match(locale['blockly-FIELD_BITMAP_ARIA_VALUE'], /%1 me %2, %3 pikselë të aktivizuar/);
  assert.match(locale['blockly-COPY_ALL_TO_BACKPACK'], /të gjitha blloqet/);
  assert.match(locale['blockly-ARIA_LABEL_TRASH_EMPTY'], /aktualisht bosh/);
  assert.match(locale['blockly-ICON_LABEL_COMMENT_CLOSED'], /^Hap /);
  assert.match(locale['blockly-ICON_LABEL_COMMENT_OPEN'], /^Mbyll /);
  assert.match(locale['blockly-BLOCK_LABEL_DISABLED'], /çaktivizuar/);
  for (const pair of [['blockly-ARIA_LABEL_COMMENT_COLLAPSE', 'blockly-ARIA_LABEL_COMMENT_EXPAND'], ['blockly-ARIA_LABEL_ADD_INPUT', 'blockly-ARIA_LABEL_REMOVE_INPUT'], ['blockly-ARIA_LABEL_ADD_LIST_ITEM', 'blockly-ARIA_LABEL_REMOVE_LIST_ITEM'], ['blockly-HOME_KEY', 'blockly-END_KEY'], ['blockly-END_KEY', 'end-date']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const reminderMapKeys = ["notification-activity-comments", "notification-activity-moves", "notification-activity-dates", "notification-activity-checklists", "notification-activity-attachments", "notification-activity-customFields", "notification-activity-archive", "notification-activity-created", "due-reminder-heading", "due-reminder-days-label", "due-reminder-off", "due-reminder-webhook", "due-reminder-invalid", "due-reminder-saved", "dependency-type-duplicates", "dependency-type-is-duplicated-by", "custom-field-stringtemplate-context-hint", "filter-presets", "filter-preset-choose", "filter-preset-name", "filter-preset-save", "filter-preset-replace-hint", "filter-preset-saved", "filter-preset-applied", "filter-preset-deleted", "filter-preset-error", "filter-card-text-label", "import-report-heading", "import-report-description", "import-report-open-board", "draggable", "board-view-map", "map-view-empty", "map-view-upload", "map-view-remove-image", "map-view-unplaced", "map-view-place-hint", "map-view-all-placed", "blockly-ANNOUNCE_CANT_SCROLL_FURTHER", "blockly-ANNOUNCE_MOVE_AFTER", "blockly-ANNOUNCE_MOVE_AROUND", "blockly-ANNOUNCE_MOVE_BEFORE", "blockly-ANNOUNCE_MOVE_CANCELED", "blockly-ANNOUNCE_MOVE_INSIDE", "blockly-ANNOUNCE_MOVE_TO", "blockly-ANNOUNCE_MOVE_WORKSPACE", "blockly-ANNOUNCE_SCROLLED_DOWN", "blockly-ANNOUNCE_SCROLLED_LEFT", "blockly-ANNOUNCE_SCROLLED_RIGHT", "blockly-ANNOUNCE_SCROLLED_UP", "blockly-ARIA_LABEL_ADD_ELSE_IF", "blockly-ARIA_LABEL_ADD_INPUT", "blockly-ARIA_LABEL_ADD_LIST_ITEM", "blockly-ARIA_LABEL_ADD_TEXT"];
  for (const key of reminderMapKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  assert.match(locale['due-reminder-days-label'], /0.*pozitivë.*para.*negativë.*pas.*bosh/);
  assert.match(locale['due-reminder-invalid'], /dhjetë.*-14.*14/);
  for (const token of ['%{card.title}', '%{board.title}', '%{list.title}', '%{swimlane.title}', '|urlencode', '%{value|urlencode}']) assert.ok(locale['custom-field-stringtemplate-context-hint'].includes(token));
  for (const key of ['admin-panel', 'problems', 'recoveryReportTitle']) assert.ok(locale['import-report-description'].includes(locale[key]));
  assert.match(locale['filter-preset-replace-hint'], /Privatë për ty.*të njëjtin emër i zëvendëson/);
  assert.match(locale['map-view-place-hint'], /Tërhiq.*ose zgjidhe.*kliko/);
  for (const pair of [['dependency-type-duplicates', 'dependency-type-is-duplicated-by'], ['blockly-ANNOUNCE_MOVE_AFTER', 'blockly-ANNOUNCE_MOVE_BEFORE'], ['blockly-ANNOUNCE_SCROLLED_DOWN', 'blockly-ANNOUNCE_SCROLLED_UP'], ['blockly-ANNOUNCE_SCROLLED_LEFT', 'blockly-ANNOUNCE_SCROLLED_RIGHT']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const emailKeys = ["rule-email-recovery-dropped", "rule-email-recovery-review", "rule-email-recovery-recipients", "rule-email-recovery-recipient-accepted", "rule-email-recovery-recipient-unconfirmed", "rule-email-recovery-actions-hint", "rule-email-recovery-wait", "rule-email-recovery-resends", "rule-email-recovery-resend", "rule-email-recovery-mark-sent", "rule-email-recovery-drop", "rule-email-recovery-resend-confirm", "rule-email-recovery-mark-sent-confirm", "rule-email-recovery-drop-confirm", "rule-email-resolution-too-early", "rule-email-resolution-already-resolved", "rule-email-resolution-resend-in-flight", "rule-email-resolution-nothing-to-resend", "rule-email-resolution-resend-uncertain", "rule-email-resolution-busy", "rule-email-resolution-command-changed", "rule-email-resolution-attempt-invalid", "rule-email-resolution-failed", "rule-email-legacy-heading", "rule-email-legacy-description", "rule-email-legacy-source", "rule-email-legacy-mail", "rule-email-legacy-reason", "rule-email-legacy-reason-unbound", "rule-email-legacy-reason-details-snapshot", "rule-email-legacy-rebind", "rule-email-legacy-discard", "rule-email-legacy-rebind-confirm", "rule-email-legacy-discard-confirm", "rule-email-legacy-empty", "rule-email-legacy-unavailable", "rule-email-legacy-access-denied", "rule-email-legacy-source-changed", "rule-email-legacy-source-unavailable", "rule-email-legacy-plan-unavailable", "rule-email-legacy-attempt-exists", "rule-email-legacy-not-legacy", "rule-email-legacy-failed"];
  for (const key of emailKeys) {
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'sq: source key order');
  assert.match(locale['rule-email-recovery-actions-hint'], /nuk e ridërgon kurrë vetë.*vetëm te marrësit pa konfirmim/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dy herë/);
  assert.match(locale['rule-email-recovery-mark-sent-confirm'], /vetëm nëse e di se ka mbërritur/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /mund të ketë mbërritur ose jo/);
  assert.match(locale['rule-email-legacy-description'], /nuk do t'i dërgojë vetë.*gjendja aktuale.*ka ende qasje/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nuk do të dërgohet kurrë/);
  assert.match(locale['rule-email-legacy-access-denied'], /nuk ka më qasje.*ose rregulli ka ndryshuar/);
  const keys = ["auto-archive-days", "auto-archive-off", "auto-archive-hint", "filter-recency-any", "filter-recency-day", "filter-recency-week", "filter-recency-month", "filter-recency-older", "filter-movement-range", "filter-date-range-field", "filter-date-range-from", "filter-date-range-to", "filter-date-range-missing", "filter-date-range-list-entry", "filter-date-range-invalid", "filter-due-any", "filter-due-previous-week", "filter-due-next-month", "filter-column-age", "filter-column-age-disabled", "filter-column-age-days", "filter-column-age-hint", "advanced-filter-card-dates-hint", "import-board-instruction-leo", "import-board-instruction-todotxt", "instance", "instance-desc", "board-instance-info", "automatic-linked-url-schemes-hint", "other-parent-cards", "add-parent-card", "remove-parent-card", "r-when-card-date", "r-trigger-vars-hint", "r-insert-variable", "r-vars-people-hint", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part", "notification-activity-heading", "notification-activity-description", "notification-activity-labels", "notification-activity-members", "notification-activity-assignees"];
  for (const key of keys) {
    assert.equal(typeof locale[key], 'string', `sq:${key}: present`);
    assert.notEqual(locale[key], english[key], `sq:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sq:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) assert.ok(locale['advanced-filter-card-dates-hint'].includes(token));
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) assert.deepEqual(locale[key].match(/\{[^{}]+\}/g), english[key].match(/\{[^{}]+\}/g));
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) assert.ok(locale['import-board-instruction-todotxt'].includes(token));
  assert.match(locale['auto-archive-hint'], /çdo orë.*nuk arkivohen kurrë.*bosh/);
  assert.match(locale['filter-column-age-hint'], /të panjohur mbeten të dukshme.*nuk e rinis/);
  for (const key of ['filter-date-range-from', 'filter-date-range-to']) assert.match(locale[key], /përfshirë/);
  assert.match(locale['instance-desc'], /nuk u shfaqet kurrë.*nuk janë identifikuar.*Vetëm personat e shtuar/);
  assert.match(locale['board-instance-info'], /<strong>çdo përdorues të identifikuar<\/strong>/);
  assert.match(locale['notification-activity-description'], /Kujtesat e afatit dhe @përmendjet mbërrijnë gjithmonë/);
  for (const token of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) assert.ok(locale['automatic-linked-url-schemes-hint'].includes(token));
  assert.match(locale['automatic-linked-url-schemes-hint'], /nuk kthehen kurrë në lidhje/);
  assert.match(locale['r-rule-any-trigger-help'], /cilido.*sipas radhës/);
}
// Esperanto completion and meaning checks for the newly translated messages.
{
  const locale = read('eo');
  const finalRecoveryKeys = ["email-recovery-empty", "email-recovery-unavailable", "email-recovery-busy", "email-recovery-failed", "email-recovery-superseded", "email-recovery-confirm-cancel", "email-recovery-attention", "email-recovery-stopped", "email-recovery-retry", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "saml-login-not-started", "move-selection-before", "move-selection-after", "history-request-pending-undo", "history-request-pending-redo", "history-request-hint", "history-request-retry", "history-request-forget"];
  for (const key of finalRecoveryKeys) {
    assert.notEqual(locale[key], english[key], `eo:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eo:${key}: tokens`);
  }
  for (const key of ['blockly-ALT_KEY', 'blockly-COMMAND_KEY', 'blockly-TAB_KEY', 'blockly-CHROME_OS', 'blockly-LINUX', 'blockly-MAC_OS', 'blockly-WINDOWS', 'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN', 'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN']) assert.equal(locale[key], english[key]);
  assert.match(locale['email-recovery-confirm-cancel'], /ne povos esti restarigita.*post ĉi tiu peto estas konservataj/);
  assert.match(locale['activity-recovery-cancel-confirm'], /definitive.*ne povos esti daŭrigita.*ne estas revokataj/);
  assert.match(locale['activity-recovery-source-unavailable'], /Nenio estis rekreita/);
  assert.match(locale['activity-recovery-denied'], /ne plu permesas liveradon/);
  assert.match(locale['activity-recovery-failed'], /Atendanta laboro estas konservita/);
  assert.match(locale['sync-time-estimate-hint'], /Ekzakte unu.*mankantaj.*ignorataj.*null malplenigas/);
  assert.match(locale['history-request-hint'], /saman peton.*neniam.*duan ŝanĝon/);
  assert.match(locale['saml-login-not-started'], /SAML.*ne estis komencita.*retumila langeto/);
  for (const pair of [['move-selection-before', 'move-selection-after'], ['history-request-pending-undo', 'history-request-pending-redo'], ['email-failure-smtp-temporary', 'email-failure-smtp-rejected'], ['activity-recovery-pause', 'activity-recovery-resume']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const newPlanningRecoveryKeys = ["board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-recovery-heading", "email-recovery-description", "email-recovery-saving", "email-recovery-queued", "email-recovery-retrying", "email-recovery-attempts", "email-recovery-oldest", "email-recovery-next", "email-recovery-changed", "email-recovery-pause", "email-recovery-resume", "email-recovery-cancel", "email-recovery-paused", "email-recovery-pending"];
  for (const key of newPlanningRecoveryKeys) {
    assert.equal(typeof locale[key], 'string', `eo:${key}: present`);
    assert.notEqual(locale[key], english[key], `eo:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eo:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ne estas nulaj.*nur inter kongruaj/);
  assert.match(locale['scrum-confirm-close'], /Nefinitaj kartoj estos movitaj/);
  assert.match(locale['scrum-confirm-cancel'], /restas en ĝi ĝis.*reasignitaj/);
  assert.match(locale['scrum-partial-report'], /nur kartoj nun asignitaj al vi/);
  for (const key of ['scrum-daily-observations-help', 'scrum-daily-observations-export-help']) {
    assert.match(locale[key], /UTC/);
    assert.match(locale[key], /[Mm]ankantaj tagoj estas preterlasitaj/);
    assert.match(locale[key], /Nekonataj taksoj ne estas nulaj/);
  }
  assert.match(locale['scrum-daily-truncated'], /366/);
  assert.match(locale['sync-conflict-hint'], /Nenio estas sendata al la fonta sistemo/);
  assert.match(locale['sync-conflict-review-complete'], /tuta listo ne estis rulita/);
  assert.match(locale['sync-conflict-archive-hint'], /Subkartoj ne estas ŝanĝitaj/);
  assert.match(locale['sync-conflict-creation-hint'], /antaŭan karton senŝanĝa.*Reprovoj reuzas/);
  assert.match(locale['sync-report-retention'], /20.*30/);
  assert.match(locale['sync-report-partial'], /eble ŝanĝis.*nek daŭrigas nek malfaras/);
  assert.match(locale['sync-estimate-field-hint'], /Mankantaj.*ignorataj.*null malplenigas/);
  assert.match(locale['email-recovery-description'], /ekzistantajn kaj estontajn.*ĝis la tempo de la peto.*ne povas esti revokita.*necerta liverado povas esti ripetita.*respektas ekzistantan paŭzon/);
  for (const pair of [['scrum-start-sprint', 'scrum-close-sprint'], ['scrum-close-sprint', 'scrum-cancel-sprint'], ['scrum-added', 'scrum-removed'], ['sync-conflict-keep-local', 'sync-conflict-use-source'], ['email-recovery-pause', 'email-recovery-resume']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const newBlockEditorKeys = ["blockly-BLOCK_LABEL_STATEMENT", "blockly-BLOCK_LABEL_TOOLBOX_CATEGORY", "blockly-BLOCK_LABEL_VALUE", "blockly-BUBBLE_LABEL_COMMENT", "blockly-BUBBLE_LABEL_DEFAULT", "blockly-BUBBLE_LABEL_WARNING", "blockly-CAPS_LOCK_KEY", "blockly-CLOSE_BACKPACK", "blockly-CONTEXT_MENU_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM", "blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET", "blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA", "blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PAUSE_KEY", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHIFT_KEY", "blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-SPACE_KEY", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-UNKNOWN", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload"];
  for (const key of newBlockEditorKeys) {
    assert.equal(typeof locale[key], 'string', `eo:${key}: present`);
    assert.notEqual(locale[key], english[key], `eo:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eo:${key}: tokens`);
  }
  assert.match(locale['blockly-SCREENREADER_MODE_DISABLED'], /estas malŝaltita.*por ŝalti/);
  assert.match(locale['blockly-SCREENREADER_MODE_ENABLED'], /estas ŝaltita.*por malŝalti/);
  assert.match(locale['blockly-LOGIC_COMPARE_GTE_ARIA'], /^pli granda ol aŭ egala al$/);
  assert.match(locale['blockly-LOGIC_COMPARE_LTE_ARIA'], /^malpli granda ol aŭ egala al$/);
  assert.match(locale['blockly-MATH_CONSTANT_SQRT1_2_ARIA'], /radiko de unu duono/);
  assert.match(locale['blockly-MATH_SINGLE_OP_LOG10_ARIA'], /dekbaza/);
  assert.match(locale['r-blocks-invalid'], /ekzakte unu ekigilon al unu ago.*nekonektitajn aŭ kromajn/);
  assert.match(locale['r-blocks-permission'], /tabula administranto/);
  assert.match(locale['r-blocks-conflict'], /Reŝargu.*antaŭ konservado/);
  assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /Ne eblas.*malŝaltita/);
  for (const token of ['Enter', 'Shift+Enter', 'Escape']) assert.ok(locale['blockly-WORKSPACE_SEARCH_INPUT_LABEL'].includes(token));
  for (const suffix of ['MANY', 'ONE']) assert.ok(locale[`blockly-WORKSPACE_CONTENTS_COMMENTS_${suffix}`].startsWith(' kaj '));
  for (const pair of [['blockly-INPUT_LABEL_MATH_DIVIDEND', 'blockly-INPUT_LABEL_MATH_DIVISOR'], ['blockly-INPUT_LABEL_CONDITION_A', 'blockly-INPUT_LABEL_CONDITION_B'], ['blockly-INPUT_LABEL_LOOP_FROM', 'blockly-INPUT_LABEL_LOOP_TO'], ['blockly-OPEN_BACKPACK', 'blockly-CLOSE_BACKPACK'], ['blockly-SHORTCUTS_ABORT_MOVE', 'blockly-SHORTCUTS_FINISH_MOVE'], ['blockly-SHORTCUTS_JUMP_FIRST_BLOCK', 'blockly-SHORTCUTS_JUMP_LAST_BLOCK']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  const newInterfaceKeys = ["auto-archive-days", "auto-archive-off", "auto-archive-hint", "filter-recency-any", "filter-recency-day", "filter-recency-week", "filter-recency-month", "filter-recency-older", "filter-movement-range", "filter-date-range-field", "filter-date-range-from", "filter-date-range-to", "filter-date-range-missing", "filter-date-range-list-entry", "filter-date-range-invalid", "filter-due-any", "filter-due-previous-week", "filter-due-next-month", "filter-column-age", "filter-column-age-disabled", "filter-column-age-days", "filter-column-age-hint", "advanced-filter-card-dates-hint", "import-board-instruction-leo", "instance", "instance-desc", "board-instance-info", "automatic-linked-url-schemes-hint", "other-parent-cards", "add-parent-card", "remove-parent-card", "r-when-card-date", "r-trigger-vars-hint", "r-insert-variable", "r-vars-people-hint", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part", "notification-activity-heading", "notification-activity-description", "notification-activity-labels", "notification-activity-members", "notification-activity-assignees", "notification-activity-comments", "notification-activity-moves", "notification-activity-dates", "notification-activity-checklists", "notification-activity-attachments", "notification-activity-customFields", "notification-activity-archive", "notification-activity-created", "due-reminder-heading", "due-reminder-days-label", "due-reminder-off", "due-reminder-webhook", "due-reminder-invalid", "due-reminder-saved", "dependency-type-duplicates", "dependency-type-is-duplicated-by", "custom-field-stringtemplate-context-hint", "filter-presets", "filter-preset-choose", "filter-preset-name", "filter-preset-save", "filter-preset-replace-hint", "filter-preset-saved", "filter-preset-applied", "filter-preset-deleted", "filter-preset-error", "filter-card-text-label", "import-report-heading", "import-report-description", "import-report-open-board", "draggable", "board-view-map", "map-view-empty", "map-view-upload", "map-view-remove-image", "map-view-unplaced", "map-view-place-hint", "map-view-all-placed", "blockly-ANNOUNCE_CANT_SCROLL_FURTHER", "blockly-ANNOUNCE_MOVE_AFTER", "blockly-ANNOUNCE_MOVE_AROUND", "blockly-ANNOUNCE_MOVE_BEFORE", "blockly-ANNOUNCE_MOVE_CANCELED", "blockly-ANNOUNCE_MOVE_INSIDE", "blockly-ANNOUNCE_MOVE_TO", "blockly-ANNOUNCE_MOVE_WORKSPACE", "blockly-ANNOUNCE_SCROLLED_DOWN", "blockly-ANNOUNCE_SCROLLED_LEFT", "blockly-ANNOUNCE_SCROLLED_RIGHT", "blockly-ANNOUNCE_SCROLLED_UP", "blockly-ARIA_LABEL_ADD_ELSE_IF", "blockly-ARIA_LABEL_ADD_INPUT", "blockly-ARIA_LABEL_ADD_LIST_ITEM", "blockly-ARIA_LABEL_ADD_TEXT", "blockly-ARIA_LABEL_BUTTON", "blockly-ARIA_LABEL_COMMENT_COLLAPSE", "blockly-ARIA_LABEL_COMMENT_EXPAND", "blockly-ARIA_LABEL_FIELD_ANGLE", "blockly-ARIA_LABEL_REMOVE_ELSE_IF", "blockly-ARIA_LABEL_REMOVE_INPUT", "blockly-ARIA_LABEL_REMOVE_LIST_ITEM", "blockly-ARIA_LABEL_REMOVE_TEXT", "blockly-ARIA_LABEL_TRASH_EMPTY", "blockly-ARIA_TYPE_FIELD_ANGLE", "blockly-ARIA_TYPE_FIELD_BITMAP", "blockly-ARIA_TYPE_FIELD_CHECKBOX", "blockly-ARIA_TYPE_FIELD_COLOUR", "blockly-ARIA_TYPE_FIELD_DATE", "blockly-ARIA_TYPE_FIELD_DROPDOWN", "blockly-ARIA_TYPE_FIELD_GRID", "blockly-ARIA_TYPE_FIELD_IMAGE", "blockly-ARIA_TYPE_FIELD_INPUT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_ARGUMENT", "blockly-ARIA_TYPE_FIELD_TEXT_INPUT_PROCEDURE", "blockly-BACKSPACE_KEY", "blockly-BLOCK_LABEL_BEGIN_PREFIX", "blockly-BLOCK_LABEL_BEGIN_STACK", "blockly-BLOCK_LABEL_COLLAPSED", "blockly-BLOCK_LABEL_CONTAINER", "blockly-BLOCK_LABEL_DISABLED", "blockly-BLOCK_LABEL_HAS_BRANCHES", "blockly-BLOCK_LABEL_HAS_INPUT", "blockly-BLOCK_LABEL_HAS_INPUTS", "blockly-BLOCK_LABEL_REPLACEABLE", "blockly-BLOCK_LABEL_STACK_BLOCKS"];
  for (const key of newInterfaceKeys) {
    assert.equal(typeof locale[key], 'string', `eo:${key}: present`);
    assert.notEqual(locale[key], english[key], `eo:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eo:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) assert.ok(locale['advanced-filter-card-dates-hint'].includes(token));
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.deepEqual(locale[key].match(/\{[^{}]+\}/g), english[key].match(/\{[^{}]+\}/g));
  }
  for (const token of ['%{card.title}', '%{board.title}', '%{list.title}', '%{swimlane.title}', '%{value|urlencode}', '|urlencode']) assert.ok(locale['custom-field-stringtemplate-context-hint'].includes(token));
  assert.match(locale['filter-date-range-from'], /inkluzive/);
  assert.match(locale['filter-date-range-to'], /inkluzive/);
  assert.match(locale['filter-column-age-hint'], /nekonataj enirdatoj restas videblaj.*ne rekomencas/);
  assert.match(locale['instance-desc'], /neniam.*ne ensalutis.*Nur.*aldonitaj.*redakti/);
  assert.match(locale['board-instance-info'], /<strong>ĉiu ensalutinta uzanto<\/strong>/);
  assert.match(locale['due-reminder-days-label'], /0.*pozitivaj.*antaŭ.*negativaj.*post/);
  assert.match(locale['due-reminder-invalid'], /dek.*-14.*14/);
  assert.match(locale['auto-archive-hint'], /ĉiuhore.*ŝablonoj neniam.*Lasu malplena/);
  assert.match(locale['notification-activity-description'], /limdatoj kaj @mencioj ĉiam alvenas/);
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) assert.ok(locale['automatic-linked-url-schemes-hint'].includes(scheme));
  assert.match(locale['automatic-linked-url-schemes-hint'], /javascript, data, vbscript.*neniam/);
  for (const pair of [['dependency-type-duplicates', 'dependency-type-is-duplicated-by'], ['blockly-ANNOUNCE_MOVE_AFTER', 'blockly-ANNOUNCE_MOVE_BEFORE'], ['blockly-ANNOUNCE_SCROLLED_UP', 'blockly-ANNOUNCE_SCROLLED_DOWN'], ['blockly-ANNOUNCE_SCROLLED_LEFT', 'blockly-ANNOUNCE_SCROLLED_RIGHT'], ['blockly-ARIA_LABEL_COMMENT_COLLAPSE', 'blockly-ARIA_LABEL_COMMENT_EXPAND']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  for (const key of ['admin-panel', 'problems', 'recoveryReportTitle']) assert.ok(locale['import-report-description'].includes(locale[key]));
  const keys = Object.keys(english).filter(key =>
    /^rule-email-(recovery|resolution|legacy)-/.test(key) || key === 'import-board-instruction-todotxt');
  for (const key of keys) {
    assert.equal(typeof locale[key], 'string', `eo:${key}: present`);
    assert.notEqual(locale[key], english[key], `eo:${key}: translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eo:${key}: tokens`);
  }
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'eo: source key order');
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `eo: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-actions-hint'], /neniam memstare resendas.*nur la ricevontojn sen konfirmo/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dufoje/);
  assert.match(locale['rule-email-recovery-mark-sent-confirm'], /nur se vi scias, ke ĝi alvenis/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /eble alvenis aŭ ne/);
  assert.match(locale['rule-email-legacy-description'], /ne sendos ilin memstare.*nuna stato.*ankoraŭ havas aliron/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /neniam estos sendita/);
  assert.match(locale['rule-email-legacy-access-denied'], /ne plu havas aliron.*aŭ la regulo ŝanĝiĝis/);
}
for (const code of ['vi', 'vi-VN']) {
  const locale = read(code);
  assert.match(locale['scrum-total'], /thẻ/);
  assert.match(locale['sync-conflict-heading'], /đồng bộ/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Không thể tiếp tục lại/);
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve executable ${token}`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve filter syntax ${token}`);
  }
  for (const key of ['blockly-CHROME_OS', 'blockly-LINUX', 'blockly-MAC_OS', 'blockly-WINDOWS',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN']) {
    assert.equal(locale[key], english[key], `${code}: product names and mathematical symbols stay intact`);
  }
}
assert.match(read('bg')['r-insert-variable'], /променлива/);
for (const code of ['el', 'el-GR']) {
  const locale = read(code);
  assert.match(locale['scrum-total'], /κάρτες/);
  assert.match(locale['sync-conflict-heading'], /συγχρονισμού/);
  assert.match(locale['r-trigger-vars-hint'], /διαδρόμου/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /δύο φορές/);
  assert.ok(locale['r-trigger-vars-hint'].includes('{customField:Name}'));
  assert.ok(locale['advanced-filter-card-dates-hint'].includes('@endAt = none'));
}
for (const code of ['ca', 'ca_ES', 'ca@valencia']) {
  const locale = read(code);
  assert.match(locale['scrum-total'], /fitxes/);
  assert.match(locale['sync-conflict-heading'], /sincronització/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dues vegades/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /No s'enviarà mai/);
  assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVIDEND'], 'dividend');
  assert.equal(locale['blockly-INPUT_LABEL_MATH_DIVISOR'], 'divisor');
  assert.ok(locale['r-trigger-vars-hint'].includes('{customField:Name}'));
  assert.ok(locale['advanced-filter-card-dates-hint'].includes('@endAt = none'));
}
for (const code of ['ru', 'ru-RU', 'ru-UA', 'ru_RU']) {
  const locale = read(code);
  assert.match(locale['r-insert-variable'], /переменную/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /дважды/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /никогда не будет отправлено/);
  assert.equal(locale['blockly-ENTER_KEY'], 'Enter');
}
for (const code of ['uk', 'uk-UA']) {
  const locale = read(code);
  assert.match(locale['r-insert-variable'], /змінну/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /двічі/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ніколи не буде надіслано/);
  assert.doesNotMatch(locale['r-insert-variable'], /переменную/);
  assert.equal(locale['blockly-ENTER_KEY'], 'Enter');
}
for (const code of ['pl', 'pl-PL']) {
  const locale = read(code);
  assert.match(locale['r-insert-variable'], /zmienną/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dwukrotnie/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nigdy nie zostanie wysłana/);
}
for (const code of ['cs', 'cs-CZ']) {
  const locale = read(code);
  assert.match(locale['r-insert-variable'], /proměnnou/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dvakrát/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nikdy nebude odeslán/);
  assert.equal(locale['rule-email-legacy-source'], 'Tablo / karta');
}
for (const [codes, duplicate, never] of [
  [['de', 'de_DE', 'de-AT', 'de-CH'], /doppelt/, /niemals gesendet/],
  [['fr', 'fr-FR', 'fr-BE', 'fr-CA', 'fr-CH'], /deux fois/, /jamais envoyé/],
  [['es', 'es-AR', 'es-LA', 'es-CL', 'es_CO', 'es-CO', 'es-PY', 'es-PE', 'es-MX'], /dos veces/, /Nunca se enviará/],
  [['it'], /due volte/, /Non sarà mai inviata/],
  [['pt', 'pt-PT', 'pt_PT', 'pt-BR'], /duas vezes/, /[Nn]unca será enviado/],
  [['nl', 'nl-NL'], /twee keer/, /nooit verzonden/],
  [['sv'], /två gånger/, /aldrig att skickas/],
  [['fi'], /kahdesti/, /ei lähetetä koskaan/],
  [['da'], /to gange/, /aldrig sendt/],
  [['nb'], /to ganger/, /aldri sendt/],
  [['tr'], /iki kez/, /Asla gönderilmeyecek/],
  [['id'], /dua kali/, /tidak akan pernah dikirim/],
  [['ro', 'ro-RO'], /de două ori/, /Nu va fi trimis niciodată/],
  [['hu'], /kétszer/, /Soha nem lesz elküldve/],
  [['sk'], /dvakrát/, /Nikdy nebude odoslaný/],
  [['ja', 'ja-JP'], /2回届きます/, /今後送信されることはありません/],
  [['ko', 'ko-KR'], /두 번 받게 됩니다/, /앞으로 절대 전송되지 않습니다/],
  [['ar', 'ar-DZ', 'ar-EG'], /الرسالة مرتين/, /لن تُرسل أبدًا/],
  [['gl', 'gl-ES'], /dúas veces/, /Non se enviará nunca/],
  [['zh-CN', 'zh-Hans', 'zh', 'cmn', 'zh_SG', 'zh-GB'], /收到两封相同的邮件/, /永远不会发送/],
  [['zh-Hant', 'zh-TW', 'zh-HK'], /收到兩封相同的郵件/, /永遠不會傳送/],
]) {
  for (const code of codes) {
    const locale = read(code);
    assert.match(locale['rule-email-recovery-resend-confirm'], duplicate);
    assert.match(locale['rule-email-legacy-discard-confirm'], never);
  }
}
assert.equal(read('pt-BR')['rule-email-recovery-recipient-accepted'], 'Aceito');
assert.equal(read('pt-PT')['rule-email-recovery-recipient-accepted'], 'Aceite');
// This batch uses the script declared by ja-Hira; older strings still need review.
const hiragana = read('ja-HI');
const hiraganaBatchKeys = Object.keys(english).filter(key =>
  /^rule-email-(legacy|resolution)-/.test(key) ||
  /^rule-email-recovery-(dropped|review|recipients|recipient-|actions-hint|wait|resends|resend|mark-sent|drop)/.test(key) ||
  key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
assert.equal(hiraganaBatchKeys.length, 45);
for (const key of hiraganaBatchKeys) {
  assert.notEqual(hiragana[key], english[key], `ja-Hira:${key}: untranslated`);
  assert.doesNotMatch(hiragana[key], /[\p{Script=Han}\p{Script=Katakana}]/u, `ja-Hira:${key}: use hiragana`);
  assert.deepEqual(translationTokens(hiragana[key]), translationTokens(english[key]), `ja-Hira:${key}: tokens`);
}
for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
  assert.ok(hiragana['import-board-instruction-todotxt'].includes(token), `ja-Hira: preserve ${token}`);
}
assert.match(hiragana['rule-email-recovery-resend-confirm'], /2かい とどきます/);
assert.match(hiragana['rule-email-legacy-discard-confirm'], /こんご おくられることは ありません/);
for (const code of ['he', 'he-IL']) {
  const locale = read(code);
  assert.equal(locale['blockly-SPACE_KEY'], 'רווח');
  assert.equal(locale['blockly-BACKSPACE_KEY'], 'מחיקה לאחור');
  for (const key of ['blockly-ALT_KEY', 'blockly-COMMAND_KEY', 'blockly-CONTROL_KEY',
    'blockly-OPTION_KEY', 'blockly-SHIFT_KEY', 'blockly-TAB_KEY',
    'blockly-CHROME_OS', 'blockly-MAC_OS', 'blockly-WINDOWS', 'blockly-LOGIC_NULL',
    'blockly-MATH_TRIG_ACOS', 'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN',
    'blockly-MATH_TRIG_COS', 'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN']) {
    assert.equal(locale[key], english[key], `${code}:${key}: preserve technical notation`);
  }
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Hebrew}/u, `${code}:${key}: Hebrew text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /פעמיים/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /לעולם לא תישלח/);
  for (const key of Object.keys(english).filter(key =>
    /^(filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-|auto-archive-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /אינה מאפסת/);
  assert.match(locale['instance-desc'], /לעולם אינו מוצג למי שאינו מחובר/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Hebrew}/u, `${code}:${key}: Hebrew text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /אינן הערכות אפס/);
  assert.match(locale['scrum-partial-report'], /רק כרטיסים שמשויכים אליך כעת/);
  assert.match(locale['scrum-daily-observations-help'], /אינן מתעדות כל שינוי/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Hebrew}/u, `${code}:${key}: Hebrew text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /דבר אינו נשלח למערכת המקור/);
  assert.match(locale['sync-conflict-detach-hint'], /התוכן שלו נשאר/);
  assert.match(locale['sync-report-partial'], /אינם ממשיכים הרצה ואינם מבטלים אותה/);
  assert.match(locale['sync-estimate-field-hint'], /חסרים.*להתעלמות.*null מפורש מנקה/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Hebrew}/u, `${code}:${key}: Hebrew text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /לא ניתן יהיה לחדש אותה/);
  assert.match(locale['email-recovery-confirm-cancel'], /לא ניתן יהיה לשחזרו/);
  assert.match(locale['history-request-hint'], /לעולם אינו יכול לבטל שינוי נוסף/);
}
for (const code of ['fa', 'fa-IR']) {
  const locale = read(code);
  assert.equal(locale['blockly-SPACE_KEY'], 'فاصله');
  assert.equal(locale['blockly-CONTEXT_MENU_KEY'], '≣ منو');
  for (const key of ['blockly-ALT_KEY', 'blockly-COMMAND_KEY', 'blockly-OPTION_KEY',
    'blockly-SHIFT_KEY', 'blockly-TAB_KEY', 'blockly-CHROME_OS', 'blockly-LINUX',
    'blockly-MAC_OS', 'blockly-WINDOWS', 'blockly-MATH_TRIG_ACOS',
    'blockly-MATH_TRIG_ASIN', 'blockly-MATH_TRIG_ATAN', 'blockly-MATH_TRIG_COS',
    'blockly-MATH_TRIG_SIN', 'blockly-MATH_TRIG_TAN']) {
    assert.equal(locale[key], english[key], `${code}:${key}: preserve technical notation`);
  }
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.match(locale[key], /\p{Script=Arabic}/u, `${code}:${key}: Persian text`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /دو بار دریافت خواهد کرد/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /هرگز ارسال نخواهد شد/);
  assert.match(locale['rule-email-legacy-description'], /نویسندهٔ قانون هنوز دسترسی دارد/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age))/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.match(locale['filter-column-age-hint'], /صفر نمی‌کند/);
  assert.match(locale['instance-desc'], /هرگز به کسانی که وارد نشده‌اند نمایش داده نمی‌شود/);
  for (const key of Object.keys(english).filter(key =>
    /^(notification-activity-|due-reminder-|filter-preset|filter-card-text|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['due-reminder-days-label'], /مثبت.*پیش.*منفی.*پس/);
  assert.match(locale['notification-activity-description'], /همیشه می‌رسند/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /برآورد صفر نیستند/);
  assert.match(locale['scrum-partial-report'], /فقط کارت‌هایی که اکنون به شما اختصاص دارند/);
  assert.match(locale['scrum-daily-observations-help'], /همهٔ تغییرات را ثبت نمی‌کنند/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /چیزی به سامانهٔ منبع فرستاده نمی‌شود/);
  assert.match(locale['sync-conflict-detach-hint'], /محتوای آن در WeKan باقی می‌ماند/);
  assert.match(locale['sync-report-partial'], /ادامه نمی‌دهند.*برنمی‌گردانند/);
  assert.match(locale['sync-estimate-field-hint'], /نادیده گرفته می‌شوند.*null.*پاک می‌کند/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /امکان ادامهٔ آن وجود نخواهد داشت/);
  assert.match(locale['email-recovery-confirm-cancel'], /قابل بازیابی نیست/);
  assert.match(locale['history-request-hint'], /هرگز نمی‌تواند تغییر دیگری را برگرداند/);
}
for (const code of ['ms', 'ms-MY']) {
  const locale = read(code);
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /dua kali/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /tidak akan dihantar selama-lamanya/);
  assert.match(locale['r-insert-variable'], /pemboleh ubah/);
  assert.match(locale['rule-email-legacy-access-denied'], /tidak lagi mempunyai akses/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age))/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.match(locale['filter-column-age-hint'], /tidak menetapkan semula/);
  assert.match(locale['instance-desc'], /tidak pernah ditunjukkan kepada orang yang belum log masuk/);
  for (const key of Object.keys(english).filter(key =>
    /^(notification-activity-|due-reminder-|filter-preset|filter-card-text|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['due-reminder-days-label'], /positif.*sebelumnya.*negatif.*selepasnya/);
  assert.match(locale['notification-activity-description'], /sentiasa diterima/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /bukan anggaran sifar/);
  assert.match(locale['scrum-partial-report'], /hanya kad yang kini ditugaskan kepada anda/);
  assert.match(locale['scrum-daily-observations-help'], /tidak merekodkan setiap perubahan/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Tiada apa-apa dihantar ke sistem sumber/);
  assert.match(locale['sync-conflict-detach-hint'], /Kandungannya kekal dalam WeKan/);
  assert.match(locale['sync-report-partial'], /tidak menyambung atau membuat asal/);
  assert.match(locale['sync-estimate-field-hint'], /tiada diabaikan.*null.*mengosongkan/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /tidak boleh disambung semula/);
  assert.match(locale['email-recovery-confirm-cancel'], /tidak boleh dipulihkan/);
  assert.match(locale['history-request-hint'], /tidak sekali-kali boleh membuat asal perubahan kedua/);
  for (const key of Object.keys(english).filter(key =>
    /^blockly-(ANNOUNCE_|ARIA_|BLOCK_LABEL_|BUBBLE_LABEL_|FIELD_BITMAP_|FIELD_LABEL_|FIELD_MULTILINEINPUT_|ICON_LABEL_)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /Tidak boleh memadam pemboleh ubah/);
  assert.match(locale['blockly-COLLAPSED_WARNINGS_WARNING'], /mengandungi amaran/);
  for (const key of Object.keys(english).filter(key =>
    /^blockly-(KEYBOARD_NAV_|LOGIC_COMPARE_.*_ARIA|LISTS_SORT_(?!HELPURL))/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /kedua-dua input benar/);
  assert.match(locale['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /sekurang-kurangnya satu input benar/);
  assert.match(locale['blockly-MATH_CONSTRAIN_TOOLTIP'], /termasuk kedua-dua had/);
  assert.match(locale['blockly-LISTS_SORT_TOOLTIP'], /salinan senarai/);
  for (const key of Object.keys(english).filter(key =>
    /^(r-blocks-|blockly-(SHORTCUTS_|SCREENREADER_|WORKSPACE_SEARCH_))/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['r-blocks-invalid'], /tepat satu pencetus kepada satu tindakan/);
  assert.match(locale['r-blocks-permission'], /pentadbir papan/);
  assert.match(locale['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /Tidak boleh.*dinyahdayakan/);
  assert.notEqual(locale['blockly-END_KEY'], locale['end-date']);
}
for (const code of ['sl', 'sl_SI']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /prejel dvakrat/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nikoli ne bo poslano/);
  assert.match(locale['rule-email-legacy-access-denied'], /nima več dostopa/);
  assert.match(locale['r-insert-variable'], /spremenljivko/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    if (key !== 'scrum-sprint') assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /niso ničelne ocene/);
  assert.match(locale['scrum-partial-report'], /le kartice, ki so vam trenutno dodeljene/);
  assert.match(locale['scrum-daily-observations-help'], /ne beležijo vsake spremembe/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /V izvorni sistem se nič ne pošlje/);
  assert.match(locale['sync-conflict-detach-hint'], /vsebina ostane v WeKan/);
  assert.match(locale['sync-report-partial'], /ne nadaljujejo ali razveljavijo/);
  assert.match(locale['sync-estimate-field-hint'], /Manjkajoče.*prezrejo.*null počisti/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Nadaljevanje ne bo mogoče/);
  assert.match(locale['email-recovery-confirm-cancel'], /ne bo mogoče obnoviti/);
  assert.match(locale['history-request-hint'], /nikoli ne more razveljaviti še druge spremembe/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ne ponastavi/);
  assert.match(locale['instance-desc'], /niso prijavljene, ni nikoli prikazana/);
  assert.match(locale['due-reminder-days-label'], /pozitivna.*pred njim.*negativna.*po njem/);
  assert.match(locale['notification-activity-description'], /vedno prejmete/);
}
{
  const locale = read('hr');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'hr: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `hr: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /primit će je dvaput/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nikada neće biti poslana/);
  assert.match(locale['rule-email-legacy-access-denied'], /više nema pristup/);
  assert.match(locale['r-insert-variable'], /varijablu/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    if (key !== 'scrum-sprint') assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nisu nulte procjene/);
  assert.match(locale['scrum-partial-report'], /samo kartice koje su vam trenutačno dodijeljene/);
  assert.match(locale['scrum-daily-observations-help'], /ne bilježe svaku promjenu/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ništa se ne šalje izvornom sustavu/);
  assert.match(locale['sync-conflict-detach-hint'], /sadržaj ostaje u WeKanu/);
  assert.match(locale['sync-report-partial'], /ne nastavljaju niti poništavaju/);
  assert.match(locale['sync-estimate-field-hint'], /nedostaju zanemaruju se.*null briše/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Nastavak neće biti moguć/);
  assert.match(locale['email-recovery-confirm-cancel'], /ne može se vratiti/);
  assert.match(locale['history-request-hint'], /nikada ne može poništiti još jednu promjenu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `hr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `hr:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `hr: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `hr: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ne poništava/);
  assert.match(locale['instance-desc'], /Nikada se ne prikazuje osobama koje nisu prijavljene/);
  assert.match(locale['due-reminder-days-label'], /pozitivni.*prije njega.*negativni.*nakon njega/);
  assert.match(locale['notification-activity-description'], /uvijek stižu/);
}
{
  const locale = read('sr');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'sr: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
    assert.match(locale[key], /[А-Яа-я]/u, `sr:${key}: Serbian Cyrillic prose`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `sr: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /примиће је двапут/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Никада неће бити послата/);
  assert.match(locale['rule-email-legacy-access-denied'], /више нема приступ/);
  assert.match(locale['r-insert-variable'], /променљиву/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /нису нулте процене/);
  assert.match(locale['scrum-partial-report'], /само картице које су вам тренутно додељене/);
  assert.match(locale['scrum-daily-observations-help'], /не бележе сваку промену/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ништа се не шаље изворном систему/);
  assert.match(locale['sync-conflict-detach-hint'], /садржај остаје у WeKan-у/);
  assert.match(locale['sync-report-partial'], /не настављају нити поништавају/);
  assert.match(locale['sync-estimate-field-hint'], /недостају се занемарују.*null брише/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Наставак неће бити могућ/);
  assert.match(locale['email-recovery-confirm-cancel'], /не може се вратити/);
  assert.match(locale['history-request-hint'], /никада не може поништити још једну промену/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `sr:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sr:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `sr: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `sr: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /не поништава/);
  assert.match(locale['instance-desc'], /Никада се не приказује особама које нису пријављене/);
  assert.match(locale['due-reminder-days-label'], /позитивни.*пре њега.*негативни.*после њега/);
  assert.match(locale['notification-activity-description'], /увек стижу/);
}
{
  const locale = read('bs');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'bs: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `bs: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /primit će je dvaput/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nikada neće biti poslana/);
  assert.match(locale['rule-email-legacy-access-denied'], /više nema pristup/);
  assert.match(locale['r-insert-variable'], /promjenljivu/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Nastavak neće biti moguć/);
  assert.match(locale['email-recovery-confirm-cancel'], /ne može se vratiti/);
  assert.match(locale['history-request-hint'], /nikada ne može poništiti još jednu promjenu/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ništa se ne šalje izvornom sistemu/);
  assert.match(locale['sync-conflict-detach-hint'], /sadržaj ostaje u WeKanu/);
  assert.match(locale['sync-report-partial'], /ne nastavljaju niti poništavaju/);
  assert.match(locale['sync-estimate-field-hint'], /nedostaju se zanemaruju.*null briše/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    if (key !== 'scrum-sprint') assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nisu nulte procjene/);
  assert.match(locale['scrum-partial-report'], /samo kartice koje su vam trenutno dodijeljene/);
  assert.match(locale['scrum-daily-observations-help'], /ne bilježe svaku promjenu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bs:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bs:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `bs: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `bs: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ne poništava/);
  assert.match(locale['instance-desc'], /Nikada se ne prikazuje osobama koje nisu prijavljene/);
  assert.match(locale['due-reminder-days-label'], /pozitivni.*prije njega.*negativni.*nakon njega/);
  assert.match(locale['notification-activity-description'], /uvijek stižu/);
}
{
  const locale = read('mk');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'mk: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
    assert.match(locale[key], /[А-Яа-я]/u, `mk:${key}: Cyrillic prose`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `mk: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /ќе ја добие двапати/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Никогаш нема да биде испратена/);
  assert.match(locale['rule-email-legacy-access-denied'], /повеќе нема пристап/);
  assert.match(locale['r-insert-variable'], /променлива/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-(recovery|failure)-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
  }
  assert.match(locale['activity-recovery-cancel-confirm'], /Продолжувањето нема да биде можно/);
  assert.match(locale['email-recovery-confirm-cancel'], /не може да се врати/);
  assert.match(locale['history-request-hint'], /никогаш не може да поништи уште една промена/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict|preview|source|report|recovery|estimate)-/.test(key))) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ништо не се испраќа до изворниот систем/);
  assert.match(locale['sync-conflict-detach-hint'], /содржина останува во WeKan/);
  assert.match(locale['sync-report-partial'], /не го продолжуваат ниту го поништуваат/);
  assert.match(locale['sync-estimate-field-hint'], /недостигаат се игнорираат.*null ја брише/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /не се нулти процени/);
  assert.match(locale['scrum-partial-report'], /само картичките што моментално ви се доделени/);
  assert.match(locale['scrum-daily-observations-help'], /не ја бележат секоја промена/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `mk:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `mk:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `mk: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `mk: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /не го ресетира/);
  assert.match(locale['instance-desc'], /Никогаш не им се прикажува на лица што не се најавени/);
  assert.match(locale['due-reminder-days-label'], /позитивните.*пред него.*негативните.*по него/);
  assert.match(locale['notification-activity-description'], /секогаш пристигнуваат/);
}
{
  const locale = read('be');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'be: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `be:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `be:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `be: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /атрымае яго двойчы/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ніколі не будзе адпраўлены/);
  assert.match(locale['rule-email-legacy-access-denied'], /больш не мае доступу/);
  assert.match(locale['r-insert-variable'], /зменную/);
  assert.match(locale['email-recovery-confirm-cancel'], /без магчымасці аднаўлення/);
  assert.match(locale['activity-recovery-cancel-confirm'], /нельга будзе аднавіць/);
  assert.match(locale['activity-recovery-description'], /ніколі не стварае дзеянне нанова/);
  assert.match(locale['history-request-hint'], /ніколі не можа адмяніць другую змену/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `be:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `be:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Нічога не адпраўляецца ў зыходную сістэму/);
  assert.match(locale['sync-report-partial'], /не аднаўляюць і не адмяняюць/);
  assert.match(locale['sync-estimate-field-hint'], /null ачышчае/);
  assert.match(locale['sync-time-estimate-hint'], /роўна адно адпаведнае поле/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `be: ${key} must be translated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]));
  }
  assert.match(locale['scrum-report-help'], /не з’яўляюцца нулявымі ацэнкамі/);
  assert.match(locale['scrum-partial-report'], /толькі карткі, якія зараз прызначаны вам/);
  assert.match(locale['scrum-daily-observations-help'], /не фіксуюць кожную змену/);
  assert.match(locale['scrum-daily-observations-export-help'], /не роўныя нулю/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `be:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `be:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `be: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `be: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /не скідае/);
  assert.match(locale['instance-desc'], /ніколі не паказваецца тым, хто не ўвайшоў/);
  assert.match(locale['due-reminder-days-label'], /дадатныя.*да яго.*адмоўныя.*пасля яго/);
  assert.match(locale['notification-activity-description'], /заўсёды прыходзяць/);
}
{
  const locale = read('lt');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'lt: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `lt:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lt:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `lt: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /gaus jį du kartus/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /niekada nebus išsiųstas/);
  assert.match(locale['rule-email-legacy-access-denied'], /nebeturi prieigos/);
  assert.match(locale['r-insert-variable'], /kintamąjį/);
  assert.match(locale['email-recovery-confirm-cancel'], /atkurti nebus galima/);
  assert.match(locale['activity-recovery-cancel-confirm'], /pratęsti nebus galima/);
  assert.match(locale['activity-recovery-description'], /niekada nesukuriamas iš naujo/);
  assert.match(locale['history-request-hint'], /niekada negali atšaukti antro pakeitimo/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `lt:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lt:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Į šaltinio sistemą nieko nesiunčiama/);
  assert.match(locale['sync-report-partial'], /nepratęsia ir neatšaukia/);
  assert.match(locale['sync-estimate-field-hint'], /null reikšmė išvalo/);
  assert.match(locale['sync-time-estimate-hint'], /lygiai vienas atitinkamas laukas/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `lt:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lt:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nėra nuliniai įverčiai/);
  assert.match(locale['scrum-partial-report'], /tik šiuo metu jums priskirtos kortelės/);
  assert.match(locale['scrum-daily-observations-help'], /nefiksuoja kiekvieno pakeitimo/);
  assert.match(locale['scrum-daily-observations-export-help'], /nėra nuliai/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `lt:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lt:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `lt: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `lt: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /nepradeda iš naujo/);
  assert.match(locale['instance-desc'], /niekada nerodoma neprisijungusiems/);
  assert.match(locale['due-reminder-days-label'], /teigiami.*prieš ją.*neigiami.*po jos/);
  assert.match(locale['notification-activity-description'], /visada gaunami/);
}
{
  const locale = read('lv');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'lv: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `lv:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lv:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `lv: preserve ${token}`);
  }
  assert.equal(locale.board, 'Dēlis');
  assert.equal(locale.list, 'Saraksts');
  assert.match(locale['rule-email-recovery-resend-confirm'], /saņems to divreiz/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /nekad netiks nosūtīts/);
  assert.match(locale['rule-email-legacy-access-denied'], /vairs nav piekļuves/);
  assert.match(locale['r-insert-variable'], /mainīgo/);
  assert.match(locale['email-recovery-confirm-cancel'], /nevarēs atjaunot/);
  assert.match(locale['activity-recovery-cancel-confirm'], /nevarēs atsākt/);
  assert.match(locale['activity-recovery-description'], /nekad neizveido darbību no jauna/);
  assert.match(locale['history-request-hint'], /nekad nevar atsaukt otru izmaiņu/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `lv:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lv:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Uz avota sistēmu nekas netiek sūtīts/);
  assert.match(locale['sync-report-partial'], /neturpina un neatsauc/);
  assert.match(locale['sync-estimate-field-hint'], /null vērtība notīra/);
  assert.match(locale['sync-time-estimate-hint'], /tieši vienam atbilstošam laukam/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `lv:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lv:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nav nulles novērtējumi/);
  assert.match(locale['scrum-partial-report'], /tikai jums pašlaik piešķirtās kartiņas/);
  assert.match(locale['scrum-daily-observations-help'], /nereģistrē katru izmaiņu/);
  assert.match(locale['scrum-daily-observations-export-help'], /nav nulle/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `lv:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `lv:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `lv: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `lv: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /neatsāk/);
  assert.match(locale['instance-desc'], /nekad netiek rādīts cilvēkiem, kas nav pierakstījušies/);
  assert.match(locale['due-reminder-days-label'], /pozitīvi.*pirms tās.*negatīvi.*pēc tās/);
  assert.match(locale['notification-activity-description'], /vienmēr tiek saņemti/);
}
{
  const locale = read('is');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'is: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `is:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `is:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `is: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /fá hann tvisvar/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /verður aldrei sendur/);
  assert.match(locale['rule-email-legacy-access-denied'], /ekki lengur aðgang/);
  assert.match(locale['r-insert-variable'], /breytu/);
  assert.match(locale['email-recovery-confirm-cancel'], /ekki verður hægt að endurheimta/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ekki verður hægt að halda henni áfram/);
  assert.match(locale['activity-recovery-description'], /býr aldrei til aðgerðina aftur/);
  assert.match(locale['history-request-hint'], /aldrei afturkallað aðra breytingu/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `is:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `is:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ekkert er sent til upprunakerfisins/);
  assert.match(locale['sync-report-partial'], /halda ekki áfram keyrslu eða afturkalla/);
  assert.match(locale['sync-estimate-field-hint'], /null hreinsar/);
  assert.match(locale['sync-time-estimate-hint'], /Nákvæmlega einn samsvarandi reitur/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `is:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `is:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ekki núllmat/);
  assert.match(locale['scrum-partial-report'], /aðeins spjöld sem þér eru nú úthlutuð/);
  assert.match(locale['scrum-daily-observations-help'], /skrá ekki hverja breytingu/);
  assert.match(locale['scrum-daily-observations-export-help'], /ekki núll/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `is:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `is:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `is: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `is: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /endurstillir ekki/);
  assert.match(locale['instance-desc'], /aldrei sýnd fólki sem er ekki innskráð/);
  assert.match(locale['due-reminder-days-label'], /jákvæðar.*fyrir hann.*neikvæðar.*eftir hann/);
  assert.match(locale['notification-activity-description'], /berast alltaf/);
}
for (const code of ['af', 'af_ZA']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /twee keer ontvang/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /nooit gestuur word nie/);
  assert.match(locale['rule-email-legacy-access-denied'], /nie meer toegang/);
  assert.match(locale['r-insert-variable'], /veranderlike/);
  assert.match(locale['email-recovery-confirm-cancel'], /kan nie herstel word nie/);
  assert.match(locale['activity-recovery-cancel-confirm'], /kan nie hervat word nie/);
  assert.match(locale['activity-recovery-description'], /skep nooit.*opnuut nie/);
  assert.match(locale['history-request-hint'], /nooit.*tweede verandering ongedaan maak nie/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Niks word na die bronstelsel gestuur nie/);
  assert.match(locale['sync-report-partial'], /hervat nie.*ongedaan nie/);
  assert.match(locale['sync-estimate-field-hint'], /null maak die gekoppelde waarde leeg/);
  assert.match(locale['sync-time-estimate-hint'], /Presies een ooreenstemmende veld/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nie nulramings nie/);
  assert.match(locale['scrum-partial-report'], /slegs kaarte wat tans aan jou toegewys is/);
  assert.match(locale['scrum-daily-observations-help'], /teken nie elke verandering aan/);
  assert.match(locale['scrum-daily-observations-export-help'], /nie nul nie/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /stel nie sy tyd in die lys terug nie/);
  assert.match(locale['instance-desc'], /nooit aan mense gewys wat nie aangemeld is nie/);
  assert.match(locale['due-reminder-days-label'], /positiewe.*daarvoor.*negatiewe.*daarna/);
  assert.match(locale['notification-activity-description'], /kom altyd aan/);
}
for (const code of ['hi', 'hi-IN']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /दो बार मिलेगा/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /कभी नहीं भेजा जाएगा/);
  assert.match(locale['rule-email-legacy-access-denied'], /अब इस कार्ड की पहुँच नहीं है/);
  assert.match(locale['r-insert-variable'], /चर/);
  assert.match(locale['email-recovery-confirm-cancel'], /वापस नहीं लाई जा सकेगी/);
  assert.match(locale['activity-recovery-cancel-confirm'], /फिर शुरू नहीं किया जा सकता/);
  assert.match(locale['activity-recovery-description'], /कभी गतिविधि को दोबारा नहीं बनाता/);
  assert.match(locale['history-request-hint'], /कभी दूसरे बदलाव को वापस नहीं ले सकता/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /स्रोत सिस्टम को कुछ भी नहीं भेजा जाता/);
  assert.match(locale['sync-report-partial'], /फिर शुरू नहीं करतीं.*बदलाव वापस/);
  assert.match(locale['sync-estimate-field-hint'], /null.*मान को साफ़/);
  assert.match(locale['sync-time-estimate-hint'], /ठीक एक मेल खाता फ़ील्ड/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /शून्य अनुमान नहीं हैं/);
  assert.match(locale['scrum-partial-report'], /केवल वे कार्ड.*अभी आपको नियुक्त/);
  assert.match(locale['scrum-daily-observations-help'], /हर बदलाव दर्ज नहीं करते/);
  assert.match(locale['scrum-daily-observations-export-help'], /शून्य नहीं हैं/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /फिर से शुरू नहीं होती/);
  assert.match(locale['instance-desc'], /कभी नहीं दिखाया जाता/);
  assert.match(locale['due-reminder-days-label'], /धनात्मक.*पहले.*ऋणात्मक.*बाद/);
  assert.match(locale['notification-activity-description'], /हमेशा मिलते हैं/);
}
{
  const locale = read('bn');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'bn: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `bn: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /দুবার পাবেন/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /কখনো পাঠানো হবে না/);
  assert.match(locale['rule-email-legacy-access-denied'], /আর প্রবেশাধিকার নেই/);
  assert.match(locale['r-insert-variable'], /ভেরিয়েবল/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /পুনরুদ্ধার করা যাবে না.*নতুন বার্তাগুলো রাখা হবে/);
  assert.match(locale['activity-recovery-cancel-confirm'], /আবার চালু করা যাবে না.*ফিরিয়ে আনা হবে না/);
  assert.match(locale['activity-recovery-description'], /কখনো কার্যকলাপ পুনরায় তৈরি হয় না/);
  assert.match(locale['history-request-hint'], /দ্বিতীয় কোনো পরিবর্তন ফিরিয়ে নিতে পারে না/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /উৎস সিস্টেমে কিছুই পাঠানো হয় না/);
  assert.match(locale['sync-report-partial'], /আবার শুরু করে না.*পরিবর্তন ফিরিয়ে নেয় না/);
  assert.match(locale['sync-estimate-field-hint'], /null সংযুক্ত মান মুছে দেয়/);
  assert.match(locale['sync-time-estimate-hint'], /ঠিক একটি মিলে যাওয়া ঘর/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /শূন্য প্রাক্কলন নয়/);
  assert.match(locale['scrum-partial-report'], /কেবল বর্তমানে আপনাকে বরাদ্দ/);
  assert.match(locale['scrum-daily-observations-help'], /প্রতিটি পরিবর্তন নথিভুক্ত করে না/);
  assert.match(locale['scrum-daily-observations-export-help'], /অজানা প্রাক্কলন শূন্য নয়/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `bn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `bn:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `bn: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `bn: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /নতুন করে শুরু হয় না/);
  assert.match(locale['instance-desc'], /কখনো দেখানো হয় না/);
  assert.match(locale['due-reminder-days-label'], /ধনাত্মক.*আগের.*ঋণাত্মক.*পরের/);
  assert.match(locale['notification-activity-description'], /সবসময় আসে/);
}
{
  const locale = read('ta');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ta: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ta: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /இருமுறை கிடைக்கும்/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ஒருபோதும் அனுப்பப்படாது/);
  assert.match(locale['rule-email-legacy-access-denied'], /உரிமை இனி இல்லை/);
  assert.match(locale['r-insert-variable'], /மாறியை/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /மீட்டெடுக்க முடியாது.*புதிய செய்திகள் வைத்திருக்கப்படும்/);
  assert.match(locale['activity-recovery-cancel-confirm'], /மீண்டும் தொடர முடியாது.*திரும்பப் பெறப்படாது/);
  assert.match(locale['activity-recovery-description'], /ஒருபோதும் செயல்பாட்டை மீண்டும் உருவாக்காது/);
  assert.match(locale['history-request-hint'], /இரண்டாவது மாற்றத்தை ஒருபோதும் திரும்பப் பெறாது/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /மூல அமைப்பிற்கு எதுவும் அனுப்பப்படாது/);
  assert.match(locale['sync-report-partial'], /தொடரவோ மாற்றங்களைத் திரும்பப் பெறவோ முடியாது/);
  assert.match(locale['sync-estimate-field-hint'], /null இணைக்கப்பட்ட மதிப்பை அழிக்கும்/);
  assert.match(locale['sync-time-estimate-hint'], /பொருந்தும் புலம் சரியாக ஒன்று/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /பூஜ்ஜிய மதிப்பீடுகள் அல்ல/);
  assert.match(locale['scrum-partial-report'], /உங்களுக்கு ஒதுக்கப்பட்ட அட்டைகள் மட்டுமே/);
  assert.match(locale['scrum-daily-observations-help'], /ஒவ்வொரு மாற்றத்தையும் பதிவு செய்வதில்லை/);
  assert.match(locale['scrum-daily-observations-export-help'], /தெரியாத மதிப்பீடுகள் பூஜ்ஜியம் அல்ல/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ta:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ta:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ta: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ta: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /மீண்டும் தொடங்காது/);
  assert.match(locale['instance-desc'], /ஒருபோதும் காட்டப்படாது/);
  assert.match(locale['due-reminder-days-label'], /நேர்மறை.*முந்தைய.*எதிர்மறை.*பிந்தைய/);
  assert.match(locale['notification-activity-description'], /எப்போதும் வரும்/);
}
{
  const locale = read('ne');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ne: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ne: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /दुई पटक पाउनेछन्/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /कहिल्यै पठाइने छैन/);
  assert.match(locale['rule-email-legacy-access-denied'], /पहुँच छैन/);
  assert.match(locale['r-insert-variable'], /चर राख्नुहोस्/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /पुनर्स्थापित गर्न सकिने छैन.*नयाँ सन्देशहरू राखिन्छन्/);
  assert.match(locale['activity-recovery-cancel-confirm'], /फेरि सुरु गर्न सकिँदैन.*फिर्ता लिइँदैनन्/);
  assert.match(locale['activity-recovery-description'], /गतिविधि कहिल्यै पुनः सिर्जना हुँदैन/);
  assert.match(locale['history-request-hint'], /दोस्रो परिवर्तन कहिल्यै उल्टाउन सक्दैन/);
  assert.equal(locale['blockly-LOGIC_NULL'], 'मान छैन');
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /स्रोत प्रणालीमा केही पनि पठाइँदैन/);
  assert.match(locale['sync-report-partial'], /फेरि सुरु गर्दैनन्.*परिवर्तन उल्टाउँदैनन्/);
  assert.match(locale['sync-estimate-field-hint'], /null ले सम्बन्धित मान खाली गर्छ/);
  assert.match(locale['sync-time-estimate-hint'], /ठ्याक्कै एउटा मिल्दो फिल्ड/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /शून्य अनुमान होइनन्/);
  assert.match(locale['scrum-partial-report'], /तपाईंलाई तोकिएका कार्डहरू मात्र/);
  assert.match(locale['scrum-daily-observations-help'], /हरेक परिवर्तन अभिलेख गर्दैनन्/);
  assert.match(locale['scrum-daily-observations-export-help'], /अज्ञात अनुमानहरू शून्य होइनन्/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ne:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ne:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ne: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ne: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /फेरि सुरु हुँदैन/);
  assert.match(locale['instance-desc'], /कहिल्यै देखाइँदैन/);
  assert.match(locale['due-reminder-days-label'], /धनात्मक.*अघिका.*ऋणात्मक.*पछिका/);
  assert.match(locale['notification-activity-description'], /सधैँ आउँछन्/);
}
{
  const locale = read('ur');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ur: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ur: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /دو بار ملے گی/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /کبھی نہیں بھیجی جائے گی/);
  assert.match(locale['rule-email-legacy-access-denied'], /رسائی نہیں ہے/);
  assert.match(locale['r-insert-variable'], /متغیر داخل کریں/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /بحال نہیں کیا جا سکے گا.*نئے پیغامات برقرار رہیں گے/);
  assert.match(locale['activity-recovery-cancel-confirm'], /دوبارہ جاری نہیں کیا جا سکتا.*واپس نہیں لی جائیں گی/);
  assert.match(locale['activity-recovery-description'], /کبھی سرگرمی کو دوبارہ نہیں بناتی/);
  assert.match(locale['history-request-hint'], /کبھی دوسری تبدیلی واپس نہیں لے سکتی/);
  assert.equal(locale['blockly-LOGIC_NULL'], 'کوئی قدر نہیں');
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /ماخذ نظام کو کچھ بھی نہیں بھیجا جاتا/);
  assert.match(locale['sync-report-partial'], /دوبارہ شروع نہیں کرتیں.*تبدیلیاں واپس/);
  assert.match(locale['sync-estimate-field-hint'], /null منسلک قدر کو صاف/);
  assert.match(locale['sync-time-estimate-hint'], /بالکل ایک مماثل خانہ/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /صفر تخمینے نہیں ہیں/);
  assert.match(locale['scrum-partial-report'], /صرف وہ کارڈز.*آپ کو تفویض/);
  assert.match(locale['scrum-daily-observations-help'], /ہر تبدیلی درج نہیں کرتے/);
  assert.match(locale['scrum-daily-observations-export-help'], /نامعلوم تخمینے صفر نہیں ہیں/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ur:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ur:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ur: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ur: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /دوبارہ شروع نہیں ہوتی/);
  assert.match(locale['instance-desc'], /کبھی نہیں دکھایا جاتا/);
  assert.match(locale['due-reminder-days-label'], /مثبت.*پہلے.*منفی.*بعد/);
  assert.match(locale['notification-activity-description'], /ہمیشہ آتے ہیں/);
}
{
  const locale = read('th');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'th: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `th: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /จะได้รับสองครั้ง/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /จะไม่ถูกส่งอีกเลย/);
  assert.match(locale['rule-email-legacy-access-denied'], /ไม่มีสิทธิ์เข้าถึง/);
  assert.match(locale['r-insert-variable'], /แทรกตัวแปร/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /ไม่สามารถกู้คืนได้.*ข้อความใหม่.*จะยังคงอยู่/);
  assert.match(locale['activity-recovery-cancel-confirm'], /ไม่สามารถดำเนินการต่อได้.*จะไม่ถูกเรียกคืน/);
  assert.match(locale['activity-recovery-description'], /จะไม่สร้างกิจกรรมขึ้นมาอีก/);
  assert.match(locale['history-request-hint'], /ไม่สามารถย้อนกลับการเปลี่ยนแปลงที่สองได้/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /ไม่มีข้อมูลใดส่งไปยังระบบต้นทาง/);
  assert.match(locale['sync-report-partial'], /ไม่ดำเนินงานต่อหรือย้อนกลับ/);
  assert.match(locale['sync-estimate-field-hint'], /null ที่ระบุชัดเจนจะล้างค่า/);
  assert.match(locale['sync-time-estimate-hint'], /ช่องที่ตรงกันเพียงหนึ่งช่อง/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ไม่ใช่ค่าประมาณศูนย์/);
  assert.match(locale['scrum-partial-report'], /เฉพาะการ์ดที่มอบหมายให้คุณ/);
  assert.match(locale['scrum-daily-observations-help'], /ไม่ได้บันทึกทุกการเปลี่ยนแปลง/);
  assert.match(locale['scrum-daily-observations-export-help'], /ค่าประมาณที่ไม่ทราบไม่ใช่ศูนย์/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `th:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `th:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `th: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `th: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /จะไม่เริ่มนับ/);
  assert.match(locale['instance-desc'], /จะไม่แสดงให้ผู้ที่ไม่ได้เข้าสู่ระบบเห็น/);
  assert.match(locale['due-reminder-days-label'], /จำนวนบวก.*ก่อนหน้า.*จำนวนลบ.*หลัง/);
  assert.match(locale['notification-activity-description'], /จะยังส่งเสมอ/);
}
{
  const locale = read('gu-IN');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'gu-IN: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `gu-IN: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /બે વાર મળશે/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ક્યારેય મોકલાશે નહીં/);
  assert.match(locale['rule-email-legacy-access-denied'], /પ્રવેશ નથી/);
  assert.match(locale['r-insert-variable'], /ચલ ઉમેરો/);
  for (const key of Object.keys(english).filter(key =>
    /^(email-recovery-|email-failure-|activity-recovery-|rule-email-recovery-|history-request-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /પુનઃસ્થાપિત કરી શકાશે નહીં.*નવા સંદેશો રાખવામાં આવશે/);
  assert.match(locale['activity-recovery-cancel-confirm'], /ફરી ચાલુ કરી શકાશે નહીં.*પાછાં ખેંચાશે નહીં/);
  assert.match(locale['activity-recovery-description'], /પ્રવૃત્તિ ક્યારેય ફરી બનતી નથી/);
  assert.match(locale['history-request-hint'], /બીજા ફેરફારને ક્યારેય પાછો લઈ શકતું નથી/);
  for (const key of Object.keys(english).filter(key =>
    /^sync-(conflict-|preview-|source-|report-|recovery-|estimate-|original-time|remaining-time|time-estimate)/.test(key))) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /સ્રોત સિસ્ટમને કંઈ મોકલાતું નથી/);
  assert.match(locale['sync-report-partial'], /ફરી શરૂ કરતા નથી.*ફેરફારો પાછા લેતા નથી/);
  assert.match(locale['sync-estimate-field-hint'], /null જોડાયેલું મૂલ્ય સાફ/);
  assert.match(locale['sync-time-estimate-hint'], /બરાબર એક મેળ ખાતું ક્ષેત્ર/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /શૂન્ય અંદાજ નથી/);
  assert.match(locale['scrum-partial-report'], /તમને સોંપેલા કાર્ડ જ/);
  assert.match(locale['scrum-daily-observations-help'], /દરેક ફેરફાર નોંધતાં નથી/);
  assert.match(locale['scrum-daily-observations-export-help'], /અજ્ઞાત અંદાજ શૂન્ય નથી/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `gu-IN:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gu-IN:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `gu-IN: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `gu-IN: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ફરી શરૂ થતી નથી/);
  assert.match(locale['instance-desc'], /ક્યારેય દેખાડવામાં આવતું નથી/);
  assert.match(locale['due-reminder-days-label'], /ધન.*પહેલાંના.*ઋણ.*પછીના/);
  assert.match(locale['notification-activity-description'], /હંમેશાં આવે છે/);
}
{
  const locale = read('kn');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'kn: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `kn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `kn:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `kn: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /ಎರಡು ಬಾರಿ ತಲುಪುತ್ತದೆ/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /ಎಂದಿಗೂ ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ/);
  assert.match(locale['rule-email-legacy-access-denied'], /ಇನ್ನು ಪ್ರವೇಶವಿಲ್ಲ/);
  assert.match(locale['r-insert-variable'], /ಚರವನ್ನು ಸೇರಿಸಿ/);
  assert.match(locale['email-recovery-confirm-cancel'], /ಮರುಸ್ಥಾಪಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ/);
  assert.match(locale['email-recovery-description'], /ಮತ್ತೆ ಆಗಬಹುದು/);
  assert.match(locale['activity-recovery-description'], /ಎಂದಿಗೂ ಮರುಸೃಷ್ಟಿಸುವುದಿಲ್ಲ/);
  assert.match(locale['activity-recovery-cancel-confirm'], /ಮುಂದುವರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ/);
  assert.match(locale['history-request-hint'], /ಎರಡನೇ ಬದಲಾವಣೆಯನ್ನು ಎಂದಿಗೂ/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `kn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `kn:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /ಏನನ್ನೂ ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ/);
  assert.match(locale['sync-report-partial'], /ಮುಂದುವರಿಸುವುದಿಲ್ಲ.*ರದ್ದುಗೊಳಿಸುವುದಿಲ್ಲ/);
  assert.match(locale['sync-estimate-field-hint'], /null.*ತೆರವುಗೊಳಿಸುತ್ತದೆ/);
  assert.match(locale['sync-time-estimate-hint'], /ನಿಖರವಾಗಿ ಒಂದೇ/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `kn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `kn:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ಶೂನ್ಯ ಅಂದಾಜುಗಳಲ್ಲ/);
  assert.match(locale['scrum-partial-report'], /ನಿಮಗೆ ನಿಯೋಜಿಸಿದ ಕಾರ್ಡ್‌ಗಳು ಮಾತ್ರ/);
  assert.match(locale['scrum-daily-observations-help'], /ಪ್ರತಿಯೊಂದು ಬದಲಾವಣೆಯನ್ನು ದಾಖಲಿಸುವುದಿಲ್ಲ/);
  assert.match(locale['scrum-daily-observations-export-help'], /ತಿಳಿಯದ ಅಂದಾಜುಗಳು ಶೂನ್ಯವಲ್ಲ/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `kn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `kn:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `kn: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `kn: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ಮತ್ತೆ ಪ್ರಾರಂಭವಾಗುವುದಿಲ್ಲ/);
  assert.match(locale['instance-desc'], /ಎಂದಿಗೂ ತೋರಿಸುವುದಿಲ್ಲ/);
  assert.match(locale['due-reminder-days-label'], /ಧನಾತ್ಮಕ.*ಹಿಂದಿನ.*ಋಣಾತ್ಮಕ.*ನಂತರದ/);
  assert.match(locale['notification-activity-description'], /ಯಾವಾಗಲೂ ಬರುತ್ತವೆ/);
}
{
  const locale = read('ga');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ga: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ga:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ga:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ga: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /faoi dhó/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ní sheolfar é riamh/);
  assert.match(locale['rule-email-legacy-access-denied'], /Níl rochtain.*a thuilleadh/);
  assert.match(locale['r-insert-variable'], /Cuir athróg isteach/);
  assert.match(locale['email-recovery-confirm-cancel'], /ní féidir é a athchóiriú/);
  assert.match(locale['email-recovery-description'], /seachadadh neamhchinnte a dhéanamh arís/);
  assert.match(locale['activity-recovery-description'], /Ní athchruthaíonn.*riamh/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ní féidir leanúint leis seo/);
  assert.match(locale['history-request-hint'], /ní féidir.*an dara hathrú a chealú riamh/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ga:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ga:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ga: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ga: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /Ní athshocraíonn/);
  assert.match(locale['instance-desc'], /Ní thaispeántar riamh/);
  assert.match(locale['due-reminder-days-label'], /deimhneacha.*roimhe.*diúltacha.*ina dhiaidh/);
  assert.match(locale['notification-activity-description'], /i gcónaí/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ga:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ga:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ní meastacháin nialasacha iad/);
  assert.match(locale['scrum-partial-report'], /ach cártaí atá sannta duit/);
  assert.match(locale['scrum-daily-observations-help'], /Ní thaifeadann.*gach athrú/);
  assert.match(locale['scrum-daily-observations-export-help'], /Ní hionann meastacháin anaithnide agus nialas/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `ga:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ga:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ní sheoltar aon rud/);
  assert.match(locale['sync-report-partial'], /Ní atosaíonn.*ní chealaíonn/);
  assert.match(locale['sync-estimate-field-hint'], /glanann null follasach/);
  assert.match(locale['sync-time-estimate-hint'], /amháin go díreach/);
}
{
  const locale = read('co');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'co: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `co:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `co:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `co: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /duie volte/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ùn serà mai mandatu/);
  assert.match(locale['rule-email-legacy-access-denied'], /ùn hà più accessu/);
  assert.match(locale['r-insert-variable'], /Inserisce una variabile/);
  assert.match(locale['email-recovery-confirm-cancel'], /ùn puderà esse ristabilitu/);
  assert.match(locale['email-recovery-description'], /mandata incerta pò esse ripetuta/);
  assert.match(locale['activity-recovery-description'], /ùn ricrea mai/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ùn si puderà ripiglialla/);
  assert.match(locale['history-request-hint'], /ùn pò mai annullà un secondu cambiamentu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `co:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `co:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `co: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `co: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ùn rimette micca à zeru/);
  assert.match(locale['instance-desc'], /Ùn hè mai mustrata/);
  assert.match(locale['due-reminder-days-label'], /pusitivi.*nanzu.*negativi.*dopu/);
  assert.match(locale['notification-activity-description'], /ghjunghjenu sempre/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `co:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `co:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ùn sò micca stime à zeru/);
  assert.match(locale['scrum-partial-report'], /solu e carte attualmente assignate à voi/);
  assert.match(locale['scrum-daily-observations-help'], /ùn arregistranu micca ogni cambiamentu/);
  assert.match(locale['scrum-daily-observations-export-help'], /E stime scunnisciute ùn sò micca zeru/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `co:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `co:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Nunda hè mandatu/);
  assert.match(locale['sync-report-partial'], /ùn ripiglianu micca.*ùn annullanu micca/);
  assert.match(locale['sync-estimate-field-hint'], /null esplicitu sguassa/);
  assert.match(locale['sync-time-estimate-hint'], /esattamente un campu/);
}
{
  const locale = read('sc');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'sc: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `sc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sc:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `sc: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /duas bortas/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Non at a èssere imbiadu mai/);
  assert.match(locale['rule-email-legacy-access-denied'], /non tenet prus atzessu/);
  assert.match(locale['r-insert-variable'], /Inserta una variàbile/);
  assert.match(locale['email-recovery-confirm-cancel'], /non podet èssere ripristinadu/);
  assert.match(locale['email-recovery-description'], /imbiu incertu podet èssere repetidu/);
  assert.match(locale['activity-recovery-description'], /non torrat mai a creare/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Non si podet sighire a pustis/);
  assert.match(locale['history-request-hint'], /non podet mai annullare unu segundu càmbiu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `sc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sc:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `sc: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `sc: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /non torrat a zero/);
  assert.match(locale['instance-desc'], /Non est ammustrada mai/);
  assert.match(locale['due-reminder-days-label'], /positivos.*in antis.*negativos.*a pustis/);
  assert.match(locale['notification-activity-description'], /arribant semper/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `sc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sc:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /non sunt istimas a zero/);
  assert.match(locale['scrum-partial-report'], /isceti is cartas assignadas a tie/);
  assert.match(locale['scrum-daily-observations-help'], /non registrant cada càmbiu/);
  assert.match(locale['scrum-daily-observations-export-help'], /Is istimas disconnotas non sunt zero/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `sc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `sc:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Nudda est imbiadu/);
  assert.match(locale['sync-report-partial'], /non torrant a aviare.*non annullant/);
  assert.match(locale['sync-estimate-field-hint'], /null esplìtzitu cantzellat/);
  assert.match(locale['sync-time-estimate-hint'], /esatamente unu campu/);
}
{
  const locale = read('scn');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'scn: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `scn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `scn:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `scn: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /du' voti/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nun veni mannatu mai/);
  assert.match(locale['rule-email-legacy-access-denied'], /nun avi cchiù accessu/);
  assert.match(locale['r-insert-variable'], /Nserisci na variàbbili/);
  assert.match(locale['email-recovery-confirm-cancel'], /nun si pò ripristinari/);
  assert.match(locale['email-recovery-description'], /nviu ncertu pò èssiri ripitutu/);
  assert.match(locale['activity-recovery-description'], /nun ricrea mai/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Nun si pò ripigghiari/);
  assert.match(locale['history-request-hint'], /nun pò mai annullari un secunnu canciamentu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `scn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `scn:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `scn: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `scn: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /nun azzera/);
  assert.match(locale['instance-desc'], /Nun veni ammustrata mai/);
  assert.match(locale['due-reminder-days-label'], /pusitivi.*prima.*nigativi.*doppu/);
  assert.match(locale['notification-activity-description'], /arrìvanu sempri/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `scn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `scn:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nun sunnu stimi a zeru/);
  assert.match(locale['scrum-partial-report'], /sulu li carti assignati a tia/);
  assert.match(locale['scrum-daily-observations-help'], /nun riggìstranu ogni canciamentu/);
  assert.match(locale['scrum-daily-observations-export-help'], /Li stimi scunusciuti nun sunnu zeru/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `scn:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `scn:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Nenti veni mannatu/);
  assert.match(locale['sync-report-partial'], /nun ripìgghianu.*nun annùllanu/);
  assert.match(locale['sync-estimate-field-hint'], /null esplìcitu cancella/);
  assert.match(locale['sync-time-estimate-hint'], /esattamenti un campu/);
}
{
  const locale = read('nap');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'nap: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `nap:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `nap:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `nap: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /ddoje vote/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nun vene mannato maje/);
  assert.match(locale['rule-email-legacy-access-denied'], /nun tene cchiù accesso/);
  assert.match(locale['r-insert-variable'], /Miette na variabbile/);
  assert.match(locale['email-recovery-confirm-cancel'], /nun se pò ripristinà/);
  assert.match(locale['email-recovery-description'], /mannata ncerta pò essere ripetuta/);
  assert.match(locale['activity-recovery-description'], /nun ricrea maje/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Nun se pò ripiglià/);
  assert.match(locale['history-request-hint'], /nun pò maje annullà nu secunno cagnamento/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `nap:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `nap:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `nap: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `nap: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /nun azzera/);
  assert.match(locale['instance-desc'], /Nun vene mustrata maje/);
  assert.match(locale['due-reminder-days-label'], /positive.*primma.*negative.*doppo/);
  assert.match(locale['notification-activity-description'], /arrivano sempe/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `nap:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `nap:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nun songo stime a zero/);
  assert.match(locale['scrum-partial-report'], /carte assignate a te mo/);
  assert.match(locale['scrum-daily-observations-help'], /nun registrano ogni cagnamento/);
  assert.match(locale['scrum-daily-observations-export-help'], /stime scanusciute nun songo zero/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `nap:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `nap:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Niente vene mannato/);
  assert.match(locale['sync-report-partial'], /nun ripigliano.*nun annullano/);
  assert.match(locale['sync-estimate-field-hint'], /null esplicito scancella/);
  assert.match(locale['sync-time-estimate-hint'], /esattamente nu campo/);
}
{
  const locale = read('an');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'an: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `an:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `an:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `an: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /dos vegadas/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nunca no se ninviará/);
  assert.match(locale['rule-email-legacy-access-denied'], /ya no tiene acceso/);
  assert.match(locale['r-insert-variable'], /Fica una variable/);
  for (const key of ['r-when', 'r-when-due', 'r-when-card-in-list',
    'r-when-a-card', 'r-when-a-label-is', 'r-when-the-label',
    'r-when-a-member', 'r-when-the-member', 'r-when-a-assignee']) {
    assert.match(locale[key], /^Quan/);
    assert.doesNotMatch(locale[key], /^Cuando/);
  }
  assert.match(locale['last-admin-desc'], /a lo menos un administrador/);
  assert.match(locale['fixed-list-width-note'], /nomás ta tu/);
  assert.match(locale['personal-list-width-description'], /se comparten con totz/);
  for (const token of ['== != <= >= && || ( )', 'Field1 == Value1',
    "'Field 1' == 'Value 1'", 'F1 == V1 || F1 == V2',
    'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) {
    assert.ok(locale['advanced-filter-description'].includes(token), `an: filter example ${token}`);
  }
  const escapedExample = english['advanced-filter-description'].match(/Field1 == I[^.]+/)[0];
  assert.ok(locale['advanced-filter-description'].includes(escapedExample));
  assert.match(locale['enable-permanent-delete-description'], /no borra cosa por sí mesmo/);
  assert.match(locale['remove-member-pop'], /Rezibirá un aviso/);
  assert.doesNotMatch(locale['remove-member-pop'], /En ellas se mostrará/);
  assert.match(locale['swimlane-delete-pop'], /No se puede desfer/);
  assert.match(locale['roles-status-desc'], /Nomás lectura/);
  assert.match(locale['api-no-calls'], /WITH_API=true/);
  for (const key of ['above-selected-card', 'above-selected-swimlane']) {
    assert.match(locale[key], /^Dencima /);
  }
  for (const key of ['below-selected-card', 'below-selected-swimlane']) {
    assert.match(locale[key], /^Debaixo /);
  }
  for (const key of ['activity-delete-attach', 'activity-delete-attach-card']) {
    assert.match(locale[key], /ha borrau un adchunto/);
  }
  for (const key of ['act-addAttachment', 'act-addSubtask', 'act-addLabel',
    'act-addedLabel', 'act-addChecklist', 'act-addChecklistItem', 'act-createList',
    'act-joinMember', 'activity-checklist-item-added']) {
    assert.match(locale[key], /[Hh]a adhibiu/);
    assert.doesNotMatch(locale[key], /añadid[oa]/);
  }
  assert.match(locale['act-editComment'], /ha editau o comentario/);
  assert.match(locale['act-completeChecklist'], /ha rematau/);
  assert.match(locale['act-uncompleteChecklist'], /como sin rematar/);
  assert.match(locale['act-moveCard'], /dende a lista __oldList__.*ta la lista __list__/);
  assert.match(locale['act-moveCardToOtherBoard'], /d'o tablero __oldBoard__.*d'o tablero __board__/);
  assert.match(locale['activity-checklist-item-removed'], /ha sacau.*comprebación/);
  for (const key of ['multi-selection-active', 'click-to-enable-fixed-list-width',
    'click-to-disable-fixed-list-width', 'keyboard-shortcuts-enabled',
    'keyboard-shortcuts-disabled', 'board-open-and-move-between-remaining-and-workspaces',
    'click-to-star', 'click-to-unstar', 'click-to-star-page', 'click-to-unstar-page',
    'click-to-enable-auto-width', 'click-to-disable-auto-width', 'filter-on-desc',
    'star-board-title', 'set-default-board-title', 'unset-default-board-title',
    'accounts-lockout-click-to-unlock']) {
    assert.match(locale[key], /Fe clic/);
    assert.doesNotMatch(locale[key], /Haz clic|deshabilitado|habilitado/);
  }
  assert.match(locale['map-to-existing-user-desc'], /nunca no puede atorgar más permisos/);
  assert.match(locale['sandstorm-delete-raw-mongodb-confirm'], /no se puede desfer/);
  assert.match(locale['cloud-secret-set'], /deixa-lo vuedo ta conservar-lo/);
  assert.match(locale['push-invite-text'], /vinclo de debaixo/);
  assert.match(locale['push-invite-text'], /Grazias/);
  assert.match(locale['user-can-not-export-card-to-pdf'], /no puede exportar a tarcheta a PDF/);
  for (const key of ['email-enrollAccount-text', 'email-invite-text',
    'email-resetPassword-text', 'email-verifyEmail-text', 'email-invite-register-text']) {
    assert.match(locale[key], /vinclo de debaixo/);
    assert.match(locale[key], /Grazias/);
    assert.doesNotMatch(locale[key], /haz clic|siguiente enlace|Gracias|Querido|Estimado/);
  }
  for (const key of ['kanboard', 'deck', 'openproject', 'issues', 'asana', 'zenkit', 'jira']) {
    assert.match(locale[`import-board-instruction-${key}`], /^Apega /);
    assert.doesNotMatch(locale[`import-board-instruction-${key}`], /se convierten|objeto|tareas/);
  }
  for (const token of ['columns', 'column_name', 'tasks', 'title', 'description',
    'swimlane_name', 'date_due', 'owner', 'tags']) {
    assert.ok(locale['import-board-instruction-kanboard'].includes(token));
  }
  assert.ok(locale['import-board-instruction-openproject'].includes('GET /api/v3/work_packages'));
  assert.ok(locale['import-board-instruction-asana'].includes('GET /tasks'));
  assert.ok(locale['import-board-instruction-asana'].includes('memberships'));
  assert.ok(locale['import-board-instruction-jira'].includes('GET /rest/api/2/search'));
  assert.ok(locale['import-board-instruction-jira'].includes('automationRules'));
  for (const token of ['## ', '- [ ]', '- [x]']) {
    assert.ok(locale['import-board-instruction-markdown'].includes(token));
  }
  assert.match(locale['email-smtp-test-text'], /Has ninviau un correu/);
  assert.match(locale['email-recovery-confirm-cancel'], /no se podrán restaurar/);
  assert.match(locale['email-recovery-description'], /ninvío incerto puede repetir-se/);
  assert.match(locale['activity-recovery-description'], /nunca no recrea/);
  assert.match(locale['activity-recovery-cancel-confirm'], /No se puede reprener/);
  assert.match(locale['history-request-hint'], /nunca no puede desfer un segundo cambio/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `an:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `an:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `an: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `an: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /no reinicia/);
  assert.match(locale['instance-desc'], /Nunca no s\'amuestra/);
  assert.match(locale['due-reminder-days-label'], /positivos.*antes.*negativos.*dimpués/);
  assert.match(locale['notification-activity-description'], /siempre plegan/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `an:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `an:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /no son estimacions de zero/);
  assert.match(locale['scrum-partial-report'], /tarchetas que tiens asignadas agora/);
  assert.match(locale['scrum-daily-observations-help'], /no rechistran cada cambio/);
  assert.match(locale['scrum-daily-observations-export-help'], /estimacions desconoixidas no son zero/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `an:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `an:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /No se ninvía cosa/);
  assert.match(locale['sync-report-partial'], /no reprenen ni desfan/);
  assert.match(locale['sync-estimate-field-hint'], /null explicito borra/);
  assert.match(locale['sync-time-estimate-hint'], /exactament un campo/);
}
{
  const locale = read('ast-ES');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'ast-ES: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `ast-ES:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ast-ES:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `ast-ES: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /dos vegaes/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nunca se va unviar/);
  assert.match(locale['rule-email-legacy-access-denied'], /yá nun tien accesu/);
  assert.match(locale['r-insert-variable'], /Inxertar una variable/);
  assert.match(locale['close-board-pop'], /Archivu.*Tolos tableros/);
  assert.doesNotMatch(locale['close-board-pop'], /páxina d'aniciu/);
  assert.match(locale['normal-desc'], /Nun pue camudar los axustes/);
  assert.match(locale['comment-only-desc'], /Namás pue comentar/);
  assert.match(locale['delete-linked-cards-before-this-list'], /ensin desaniciar primero/);
  assert.match(locale['card-archived'], /movióse al archivu/);
  for (const key of ['cards', 'cards-count']) assert.equal(locale[key], 'Tarxetes');
  for (const key of ['cards-count-one', 'cardType-card']) assert.equal(locale[key], 'Tarxeta');
  assert.match(locale['move-card-up'], /p'arriba/);
  assert.match(locale['move-card-down'], /p'abaxo/);
  for (const key of ['add', 'add-attachment', 'add-template',
    'add-card-to-top-of-list', 'add-card-to-bottom-of-list', 'addListPopup-title',
    'add-swimlane', 'add-subtask', 'add-checklist', 'add-checklist-item',
    'add-cover', 'add-label', 'add-list', 'add-after-list', 'add-members',
    'addMemberPopup-title', 'add-template-container', 'add-background-image']) {
    assert.match(locale[key], /^Amestar/);
    assert.doesNotMatch(locale[key], /Añadir/);
  }
  assert.match(locale['card-delete-suggest-archive'], /caltener l'actividá/);
  assert.match(locale['card-archive-suggest-cancel'], /restaurar la tarxeta/);
  assert.match(locale['board-view-timeline-showing'], /na fecha/);
  assert.doesNotMatch(locale['board-view-timeline-showing'], /dende/);
  assert.match(locale['activity-archived'], /movióse al archivu/);
  assert.match(locale['cardDeletePopup-title'], /Desaniciar la tarxeta/);
  assert.match(locale['home-board-empty'], /namás un tableru/);
  assert.match(locale['home-board-remove-confirm'], /nun se desanicia/);
  assert.match(locale['add-card'], /Amestar una tarxeta/);
  assert.match(locale['archive-card'], /Mover la tarxeta al archivu/);
  assert.match(locale['and-n-other-card_plural'], /otres __count__ tarxetes/);
  assert.match(locale['restrict-comment-editing'], /Torgar.*comentarios d'otros usuarios/);
  for (const key of ['act-deleteCard', 'act-removeBoard', 'act-removeList',
    'act-removeSwimlane', 'act-createBoard', 'act-importBoard']) {
    assert.match(locale[key], /tableru/);
    assert.doesNotMatch(locale[key], /tarjeta|tablero/);
  }
  assert.equal(locale.save, 'Guardar');
  assert.equal(locale.card, 'Tarxeta');
  assert.equal(locale.board, 'Tableru');
  assert.match(locale['email-sent'], /Corréu unviáu/);
  for (const key of ['kanboard', 'deck', 'openproject', 'issues', 'asana', 'zenkit', 'jira']) {
    assert.match(locale[`import-board-instruction-${key}`], /^Apega/);
    assert.doesNotMatch(locale[`import-board-instruction-${key}`], /tarjetes|tablero/);
  }
  for (const token of ['columns', 'column_name', 'tasks', 'title', 'description',
    'swimlane_name', 'date_due', 'owner', 'tags']) {
    assert.ok(locale['import-board-instruction-kanboard'].includes(token));
  }
  assert.ok(locale['import-board-instruction-openproject'].includes('GET /api/v3/work_packages'));
  assert.ok(locale['import-board-instruction-asana'].includes('GET /tasks'));
  assert.ok(locale['import-board-instruction-asana'].includes('memberships'));
  assert.ok(locale['import-board-instruction-jira'].includes('GET /rest/api/2/search'));
  assert.ok(locale['import-board-instruction-jira'].includes('automationRules'));
  assert.match(locale['email-recovery-confirm-cancel'], /nun se puen restaurar/);
  assert.match(locale['email-recovery-description'], /unvíu inciertu pue repetise/);
  assert.match(locale['activity-recovery-description'], /nunca recrea/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Nun se pue reanudar/);
  assert.match(locale['history-request-hint'], /nunca pue desfacer un segundu cambéu/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `ast-ES:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ast-ES:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `ast-ES: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `ast-ES: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /nun reinicia/);
  assert.match(locale['instance-desc'], /Nunca s'amuesa/);
  assert.match(locale['due-reminder-days-label'], /positivos.*enantes.*negativos.*dempués/);
  assert.match(locale['notification-activity-description'], /lleguen siempre/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `ast-ES:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ast-ES:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nun son estimaciones de cero/);
  assert.match(locale['scrum-partial-report'], /tarxetes que tienes asignaes agora/);
  assert.match(locale['scrum-daily-observations-help'], /nun rexistren cada cambéu/);
  assert.match(locale['scrum-daily-observations-export-help'], /estimaciones desconocíes nun son cero/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `ast-ES:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `ast-ES:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Nun s'unvía nada/);
  assert.match(locale['sync-report-partial'], /nun reanuden nin desfán/);
  assert.match(locale['sync-estimate-field-hint'], /null esplícitu borra/);
  assert.match(locale['sync-time-estimate-hint'], /esautamente un campu/);
}
{
  const locale = read('oc');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'oc: source key order');
  for (const key of hiraganaBatchKeys) {
    assert.notEqual(locale[key], english[key], `oc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `oc:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `oc: preserve ${token}`);
  }
  assert.match(locale['rule-email-recovery-resend-confirm'], /dos còps/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Serà pas jamai mandat/);
  assert.match(locale['rule-email-legacy-access-denied'], /a pas pus accès/);
  assert.match(locale['r-insert-variable'], /Inserir una variabla/);
  for (const key of ['cancel', 'move-progress-cancel', 'twoFactorCode-cancel']) {
    assert.equal(locale[key], 'Anullar', `oc:${key}: cancel, not return`);
  }
  assert.match(locale['close-board-pop'], /Archius.*Totes los tablèus/);
  assert.doesNotMatch(locale['close-board-pop'], /acuèlh/i);
  assert.doesNotMatch(locale['board-view-timeline-showing'], /a partir de/);
  assert.match(locale['board-view-timeline-showing'], /estat al/);
  assert.match(locale['card-delete-notice'], /totas las accions/);
  assert.match(locale['card-delete-pop'], /se pòt pas anullar/);
  assert.equal(locale['remove-member-from-card'], 'Levar de la carta');
  assert.equal(locale['deleteVotePopup-title'], 'Suprimir lo vòte ?');
  assert.match(locale['import-map-members'], /^Associar/);
  assert.match(locale['import-members-map'], /que volètz importar/);
  assert.equal(locale['anonymize-account'], 'Anonimizar lo compte');
  for (const phrase of ['definitivament', 'adreça de corrièl', 'suprimís l’avatar',
    'desactiva la connexion', 'consèrvan lor istoric', 'se pòt pas anullar']) {
    assert.ok(locale['anonymize-account-confirm-popup'].includes(phrase), `oc: anonymization ${phrase}`);
  }
  assert.doesNotMatch(locale['anonymize-account-confirm-popup'], /exportacion|user1|desactivat/);
  assert.match(locale['email-enrollAccount-subject'], /compte es estat creat/);
  assert.doesNotMatch(locale['email-enrollAccount-subject'], /activat/);
  assert.equal(locale['email-addresses'], 'Adreças de corrièl');
  for (const key of ['email-templates-invite-subject', 'email-templates-activity-subject']) {
    assert.match(locale[key], /^Subjècte del corrièl/);
    assert.doesNotMatch(locale[key], /Sujet/);
  }
  for (const key of ['email-templates-invite-body', 'email-templates-activity-body']) {
    assert.match(locale[key], /^Còrs del corrièl/);
  }
  assert.match(locale['import-board-instruction-openproject'], /paquets de trabalh/);
  assert.ok(locale['import-board-instruction-openproject'].includes('GET /api/v3/work_packages'));
  assert.ok(locale['import-board-instruction-jira'].includes('GET /rest/api/2/search'));
  for (const token of ['"issues"', '"automationRules"']) {
    assert.ok(locale['import-board-instruction-jira'].includes(token));
  }
  assert.match(locale['import-board-instruction-trello'], /Imprimir e exportar/);
  assert.match(locale['email-recovery-confirm-cancel'], /poiràn pas èsser restaurats/);
  assert.match(locale['email-recovery-description'], /mandadís incert pòt èsser repetit/);
  assert.match(locale['activity-recovery-description'], /torna pas jamai crear/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Se poirà pas reprendre/);
  assert.match(locale['history-request-hint'], /pòt pas jamai anullar un segond cambiament/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `oc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `oc:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `oc: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `oc: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /torna pas metre a zèro/);
  assert.match(locale['instance-desc'], /Es pas jamai afichat/);
  assert.match(locale['due-reminder-days-label'], /positius.*abans.*negatius.*aprèp/);
  assert.match(locale['notification-activity-description'], /arriban totjorn/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `oc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `oc:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /son pas d'estimacions a zèro/);
  assert.match(locale['scrum-partial-report'], /cartas que vos son assignadas ara/);
  assert.match(locale['scrum-daily-observations-help'], /enregistran pas cada cambiament/);
  assert.match(locale['scrum-daily-observations-export-help'], /estimacions desconegudas son pas zèro/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `oc:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `oc:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Res es pas mandat/);
  assert.match(locale['sync-report-partial'], /reprenon pas e anullan pas/);
  assert.match(locale['sync-estimate-field-hint'], /null explicit escafa/);
  assert.match(locale['sync-time-estimate-hint'], /exactament un camp/);
}
console.log('Completed translation batches: completeness, tokens, syntax and native vocabulary passed');

{
  const locale = read('br');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'br: source key order');
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `br:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `br:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `br: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /Enlakaat ur varienn/);
  assert.equal(locale['anonymize-account'], 'Dizanviñ ar gont');
  for (const phrase of ['da vat', 'chomlec’h postel', 'skeudennig',
    'diweredekaet e vo ar c’hevreañ', 'o istor', 'N’haller ket dizober']) {
    assert.ok(locale['anonymize-account-confirm-popup'].includes(phrase), `br: anonymization ${phrase}`);
  }
  assert.doesNotMatch(locale['anonymize-account-confirm-popup'], /ezporzhiañ|user1|dre ziouer/);
  assert.match(locale['close-board-pop'], /Dielloù.*An holl daolennoù/);
  assert.doesNotMatch(locale['close-board-pop'], /degemer/);
  assert.match(locale['board-view-timeline-showing'], /d’ar mare-mañ/);
  assert.doesNotMatch(locale['board-view-timeline-showing'], /adalek/);
  for (const kind of ['invite', 'activity']) {
    assert.match(locale[`email-templates-${kind}-subject`], /^Danvez ar postel/);
    assert.match(locale[`email-templates-${kind}-body`], /^Korf ar postel/);
    assert.doesNotMatch(locale[`email-templates-${kind}-subject`], /Sujet|Inviter/);
  }
  assert.equal(locale['email-templates-title'], 'Patromoù postel');
  assert.equal(locale['email-smtp-test-subject'], 'Postel amprouiñ SMTP');
  assert.match(locale['email-recovery-confirm-cancel'], /ne vo ket tu d'e adsevel/);
  assert.match(locale['email-recovery-description'], /c'has diasur bezañ graet div wech/);
  assert.match(locale['activity-recovery-description'], /Ne vez adkrouet obererezh ebet morse/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ne vo ket tu da adkregiñ/);
  assert.match(locale['history-request-hint'], /ne c'hall morse dizober un eil cheñchamant/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `br:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `br:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `br: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `br: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ne adderaou ket/);
  assert.match(locale['instance-desc'], /Ne vez diskouezet morse/);
  assert.match(locale['due-reminder-days-label'], /pozitivel.*a-raok.*negativel.*goude/);
  assert.match(locale['notification-activity-description'], /Degouezhout a ra atav/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `br:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `br:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /n'int ket istimadennoù zero/);
  assert.match(locale['scrum-report-help'], /reolennoù heñvel hepken/);
  assert.match(locale['scrum-partial-report'], /roet deoc'h bremañ hepken/);
  assert.match(locale['scrum-daily-observations-help'], /Ne enroll ket.*pep cheñchamant/);
  assert.match(locale['scrum-daily-observations-help'], /varrenn ostilhoù.*disoc'hoù ar sprint/);
  assert.match(locale['scrum-daily-observations-export-help'], /istimadennoù dianav n'int ket zero/);
  assert.match(locale['scrum-import-pending'], /N'haller ket kemmañ Scrum nag ezporzhiañ/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `br:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `br:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /N'eus netra kaset/);
  assert.match(locale['sync-report-partial'], /ne zizober ket/);
  assert.match(locale['sync-conflict-review-complete'], /N'eo ket bet kenamzeriet ar roll a-bezh/);
  assert.match(locale['sync-conflict-detach-hint'], /Chom a ra e endalc'had/);
  assert.match(locale['sync-estimate-field-hint'], /null splann a ziverk/);
  assert.match(locale['sync-time-estimate-hint'], /ur vaezienn kenglotus hepken/);
  assert.match(locale['sync-recovery-description'], /ne c'hall ket.*adloc'hañ na dizober/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /div wech/);
  assert.match(locale['rule-email-recovery-actions-hint'], /ne adkas morse/);
  assert.match(locale['rule-email-recovery-actions-hint'], /nann-kadarnaet hepken/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ne vo kaset morse/);
  assert.match(locale['rule-email-legacy-access-denied'], /N'en deus ket mui/);
  assert.match(locale['rule-email-legacy-description'], /ne gaso ket WeKan anezho e-unan/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /erruet pe get/);
  assert.doesNotMatch(locale['rule-email-resolution-resend-uncertain'], /kaset gant berzh/);
}

{
  const locale = read('eu');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'eu: source key order');
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `eu:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eu:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `eu: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /Txertatu aldagaia/);
  assert.match(locale['board-view-timeline-showing'], /Une honetako egoera/);
  assert.doesNotMatch(locale['board-view-timeline-showing'], /honetatik/);
  assert.equal(locale['import-map-members'], 'Lotu kideak');
  assert.match(locale['import-members-map'], /Lotu.*zure erabiltzaileekin/);
  for (const kind of ['invite', 'activity']) {
    assert.match(locale[`email-templates-${kind}-subject`], /mezuaren gaia/);
    assert.match(locale[`email-templates-${kind}-body`], /mezuaren gorputza/);
    assert.doesNotMatch(locale[`email-templates-${kind}-subject`], /Asunto|Gonbidatu/);
  }
  assert.match(locale['email-recovery-confirm-cancel'], /ezin izango dira leheneratu/);
  assert.match(locale['email-recovery-description'], /bidalketa zalantzagarria errepika daiteke/);
  assert.match(locale['activity-recovery-description'], /ez du inoiz jarduera bat birsortzen/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ezin zaio berriro ekin/);
  assert.match(locale['history-request-hint'], /ezin du inoiz bigarren aldaketa bat desegin/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `eu:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eu:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `eu: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `eu: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /ez du.*berrabiarazten/);
  assert.match(locale['instance-desc'], /Ez zaie inoiz erakusten/);
  assert.match(locale['due-reminder-days-label'], /positiboak aurreko.*negatiboak ondorengo/);
  assert.match(locale['notification-activity-description'], /beti iristen dira/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `eu:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eu:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /ez dira zero estimazioak/);
  assert.match(locale['scrum-report-help'], /irizpide berdinak/);
  assert.match(locale['scrum-partial-report'], /une honetan esleituta dituzun txartelak soilik/);
  assert.match(locale['scrum-daily-observations-help'], /ez dituzte aldaketa guztiak erregistratzen/);
  assert.match(locale['scrum-daily-observations-help'], /tresna-barrako.*sprintaren emaitzak/);
  assert.match(locale['scrum-daily-observations-export-help'], /ezezagunak ez dira zero/);
  assert.match(locale['scrum-import-pending'], /Ezin da Scrum editatu edo txostenik esportatu/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `eu:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `eu:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ez da ezer bidaltzen/);
  assert.match(locale['sync-report-partial'], /ez dute.*berrekin edo desegiten/);
  assert.match(locale['sync-conflict-review-complete'], /Ez da zerrenda osoaren/);
  assert.match(locale['sync-conflict-detach-hint'], /Edukia WeKanen geratuko da/);
  assert.match(locale['sync-estimate-field-hint'], /null esplizitu batek.*garbitzen/);
  assert.match(locale['sync-time-estimate-hint'], /eremu bakarra/);
  assert.match(locale['sync-recovery-description'], /ezin dituzte.*berrekin edo desegin/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /bi aldiz/);
  assert.match(locale['rule-email-recovery-actions-hint'], /berretsi gabeko hartzaileei soilik/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ez da inoiz bidaliko/);
  assert.match(locale['rule-email-legacy-access-denied'], /ez du jada.*sarbiderik/);
  assert.match(locale['rule-email-legacy-description'], /ez ditu bere kabuz bidaliko/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /iritsi izana edo ez/);
}

for (const code of ['cy', 'cy-GB']) {
  const locale = read(code);
  assert.deepEqual(Object.keys(locale), Object.keys(english), `${code}: source key order`);
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `${code}: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /Mewnosod newidyn/);
  assert.equal(locale['import-map-members'], 'Mapio aelodau');
  assert.equal(locale['email-templates-title'], 'Templedi ebost');
  for (const kind of ['invite', 'activity']) {
    assert.match(locale[`email-templates-${kind}-subject`], /^Pwnc yr ebost/);
    assert.match(locale[`email-templates-${kind}-body`], /^Corff yr ebost/);
    assert.doesNotMatch(locale[`email-templates-${kind}-subject`], /^Gwahodd|Ebost Pwnc/);
  }
  assert.match(locale['email-templates-activity-subject'], /hysbysu gweithgaredd/);
  assert.match(locale['anonymize-account-confirm-popup'], /gwerthoedd amnewid dienw/);
  assert.match(locale['anonymize-account-confirm-popup'], /yn barhaol/);
  assert.doesNotMatch(locale['anonymize-account-confirm-popup'], /dros dro/);
  assert.match(locale['email-recovery-confirm-cancel'], /ni ellir ei adfer/);
  assert.match(locale['email-recovery-description'], /dosbarthiad ansicr gael ei ailadrodd/);
  assert.match(locale['activity-recovery-description'], /Nid yw ailgeisio byth yn ail-greu/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Ni ellir ei ailddechrau/);
  assert.match(locale['history-request-hint'], /ni all byth ddadwneud ail newid/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `${code}: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `${code}: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /Nid yw.*ailosod/);
  assert.match(locale['instance-desc'], /Ni chaiff byth ei ddangos/);
  assert.match(locale['due-reminder-days-label'], /positif.*cyn.*negatif.*ar ôl/);
  assert.match(locale['notification-activity-description'], /bob amser yn cyrraedd/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /nid amcangyfrifon sero ydynt/);
  assert.match(locale['scrum-report-help'], /pholisïau cyfatebol/);
  assert.match(locale['scrum-partial-report'], /neilltuo i chi ar hyn o bryd/);
  assert.match(locale['scrum-daily-observations-help'], /Nid yw.*cofnodi pob newid/);
  assert.match(locale['scrum-daily-observations-help'], /bar offer.*canlyniadau'r sbrint/);
  assert.match(locale['scrum-daily-observations-export-help'], /Nid sero yw amcangyfrifon anhysbys/);
  assert.match(locale['scrum-import-pending'], /Nid yw golygu Scrum nac allforio adroddiadau ar gael/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `${code}:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `${code}:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Ni anfonir dim/);
  assert.match(locale['sync-report-partial'], /Nid yw.*ailddechrau nac yn dadwneud/);
  assert.match(locale['sync-conflict-review-complete'], /Ni redwyd.*rhestr gyfan/);
  assert.match(locale['sync-conflict-detach-hint'], /ei gynnwys yn aros yn WeKan/);
  assert.match(locale['sync-estimate-field-hint'], /null penodol yn clirio/);
  assert.match(locale['sync-time-estimate-hint'], /union un maes/);
  assert.match(locale['sync-recovery-description'], /ni all.*ailddechrau na dadwneud/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /ddwywaith/);
  assert.match(locale['rule-email-recovery-actions-hint'], /Dim ond at y derbynwyr heb eu cadarnhau/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Ni chaiff byth ei anfon/);
  assert.match(locale['rule-email-legacy-access-denied'], /Nid oes.*fynediad.*mwyach/);
  assert.match(locale['rule-email-legacy-description'], /ni fydd WeKan yn eu hanfon ar ei ben ei hun/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /wedi cyrraedd neu beidio/);
}

{
  const locale = read('gd');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'gd: source key order');
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `gd:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gd:${key}: tokens`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `gd: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /Cuir caochladair/);
  assert.equal(locale['email-templates-title'], 'Teamplaidean puist-d');
  for (const kind of ['invite', 'activity']) {
    assert.match(locale[`email-templates-${kind}-subject`], /^Cuspair puist-d/);
    assert.match(locale[`email-templates-${kind}-body`], /^Bodhaig puist-d/);
  }
  assert.match(locale['email-templates-activity-subject'], /fios gnìomhachd/);
  assert.equal(locale['anonymize-account'], 'Dèan an cunntas gun urra');
  assert.match(locale['anonymize-account-confirm-popup'], /gu buan/);
  assert.match(locale['anonymize-account-confirm-popup'], /clàradh a-steach à comas/);
  assert.match(locale['anonymize-account-confirm-popup'], /cumaidh bùird, cairtean agus beachdan an eachdraidh/);
  assert.match(locale['anonymize-account-confirm-popup'], /Cha ghabh an gnìomh seo a neo-dhèanamh/);
  assert.doesNotMatch(locale['anonymize-account-confirm-popup'], /às-phortadh|iom-phortadh/);
  assert.match(locale['email-recovery-confirm-cancel'], /cha ghabh a h-aiseag/);
  assert.match(locale['email-recovery-description'], /lìbhrigeadh neo-chinnteach tachairt a-rithist/);
  assert.match(locale['activity-recovery-description'], /Cha chruthaich ath-fheuchainn.*às ùr gu bràth/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Cha ghabh leantainn air a-rithist/);
  assert.match(locale['history-request-hint'], /chan urrainn dha dàrna atharrachadh.*gu bràth/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `gd:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gd:${key}: tokens`);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `gd: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `gd: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /Cha chuir deasachadh.*air ais gu neoni/);
  assert.match(locale['instance-desc'], /Cha tèid a shealltainn gu bràth/);
  assert.match(locale['due-reminder-days-label'], /dearbhach.*roimhe.*àicheil.*às a dhèidh/);
  assert.match(locale['notification-activity-description'], /Thig.*an-còmhnaidh/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `gd:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gd:${key}: tokens`);
  }
  assert.match(locale['scrum-report-help'], /chan e tuairmsean neoni/);
  assert.match(locale['scrum-report-help'], /poileasaidhean a tha a' freagairt ri chèile/);
  assert.match(locale['scrum-partial-report'], /air an sònrachadh dhut an-dràsta/);
  assert.match(locale['scrum-daily-observations-help'], /Cha chlàraich.*gach atharrachadh/);
  assert.match(locale['scrum-daily-observations-help'], /bhàr-inneal toraidhean an sprint/);
  assert.match(locale['scrum-daily-observations-export-help'], /Chan eil tuairmsean neo-aithnichte co-ionann ri neoni/);
  assert.match(locale['scrum-import-pending'], /Chan eil deasachadh Scrum no às-phortadh aithisgean ri fhaighinn/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `gd:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `gd:${key}: tokens`);
  }
  assert.match(locale['sync-conflict-hint'], /Cha tèid càil a chur/);
  assert.match(locale['sync-report-partial'], /Cha lean.*cha dèan.*neo-dhèanamh/);
  assert.match(locale['sync-conflict-review-complete'], /Cha deach an liosta air fad/);
  assert.match(locale['sync-conflict-detach-hint'], /Fanaidh an susbaint ann an WeKan/);
  assert.match(locale['sync-estimate-field-hint'], /glanaidh null soilleir/);
  assert.match(locale['sync-time-estimate-hint'], /dìreach aon raon/);
  assert.match(locale['sync-recovery-description'], /chan urrainn.*leantainn.*neo-dhèanamh/);
  assert.match(locale['rule-email-recovery-resend-confirm'], /dà thuras/);
  assert.match(locale['rule-email-recovery-actions-hint'], /ach dha na faightearan gun dearbhadh/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Cha tèid a chur gu bràth/);
  assert.match(locale['rule-email-legacy-access-denied'], /Chan eil cothrom inntrigidh.*tuilleadh/);
  assert.match(locale['rule-email-legacy-description'], /cha chuir WeKan iad leis fhèin/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /ràinig.*no nach do ràinig/);
}

{
  const locale = read('csb');
  assert.deepEqual(Object.keys(locale), Object.keys(english), 'csb: source key order');
  const keys = Object.keys(english).filter(key => key.startsWith('rule-email-') ||
    key === 'r-insert-variable' || key === 'import-board-instruction-todotxt');
  assert.equal(keys.length, 56);
  for (const key of keys) {
    assert.notEqual(locale[key], english[key], `csb:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: no language-label substitute`);
  }
  for (const token of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) {
    assert.ok(locale['import-board-instruction-todotxt'].includes(token), `csb: preserve ${token}`);
  }
  assert.match(locale['r-insert-variable'], /slédnégò tekstowégò pòla/);
  const correctedRuleActionSummaryKeys = ["r-schedule-daily", "r-move-all-cards", "r-made-incomplete", "r-add-actinguser-member", "r-send-email", "r-d-send-email", "r-d-move-to-top-gen", "r-d-move-to-top-spec", "r-d-move-to-bottom-gen", "r-d-move-to-bottom-spec", "r-d-archive", "r-d-unarchive", "r-d-add-label", "r-d-remove-label", "r-d-add-member", "r-d-remove-member", "r-d-remove-all-member", "r-d-check-all", "r-d-uncheck-all", "r-d-add-checklist", "r-d-remove-checklist"];
  for (const key of correctedRuleActionSummaryKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Codziennié|wszystkie|nieukończona|reguł|člonka|Wyślij|wiadomość|początek|koniec|Zarchiwizuj|Przywròć|etykietę|czeklistę)/);
  }
  for (const pair of [['r-d-check-all', 'r-d-uncheck-all'], ['r-d-archive', 'r-d-unarchive'], ['r-d-add-label', 'r-d-remove-label'], ['r-d-add-member', 'r-d-remove-member'], ['r-d-add-checklist', 'r-d-remove-checklist']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  for (const position of ['top', 'bottom']) {
    assert.match(locale[`r-d-move-to-${position}-gen`], /ji lëstë/);
    assert.doesNotMatch(locale[`r-d-move-to-${position}-spec`], /ji lëstë/);
  }
  assert.match(locale['r-d-check-all'], /^Òznaczë wszëtczé/);
  assert.match(locale['r-d-uncheck-all'], /^Òdznaczë wszëtczé/);
  assert.match(locale['r-d-remove-all-member'], /wszëtczich nôleżników/);
  assert.match(locale['r-add-actinguser-member'], /brëkòwnika.*wëzwòlił nã reglã.*nôleżnika/);
  const correctedRuleBuilderKeys = ["r-add-rule", "r-delete-rule", "r-new-rule-name", "r-edit-rule-trigger-action", "r-toggle-rule-enabled", "r-workflow-help", "r-w-card-created", "r-w-card-archived", "r-w-card-unarchived", "r-w-label-added", "r-w-label-removed", "r-w-member-added", "r-w-member-removed", "r-w-assignee-added", "r-w-assignee-removed", "r-w-checklist-added", "r-w-attachment-added", "r-w-every-day-at", "r-import-trello-note"];
  for (const key of correctedRuleBuilderKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:reguł|Zostanié|zostanié|Przeciągnij|Codziennié|Wklej )/);
  }
  for (const pair of [['r-w-label-added', 'r-w-label-removed'], ['r-w-member-added', 'r-w-member-removed'], ['r-w-assignee-added', 'r-w-assignee-removed'], ['r-w-card-archived', 'r-w-card-unarchived']]) assert.notEqual(locale[pair[0]], locale[pair[1]]);
  assert.notEqual(locale['r-w-member-added'], locale['r-w-assignee-added']);
  for (const literal of ['Trello', 'Butler']) assert.ok(locale['r-import-trello-note'].includes(literal));
  assert.match(locale['r-import-trello-note'], /nie mają reglów Butler.*nieprzëpisóné rézë są zgłôszóné/);
  const correctedFeatureDescriptionKeys = ["always-show-code-as-text-description", "disable-all-import-description", "disable-all-export-description", "disable-export-avatars-description", "anonymize-import-users-description", "anonymize-export-users-description", "anonymize-account-confirm-popup", "disable-activities-description"];
  for (const key of correctedFeatureDescriptionKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Gdy włączone|zastępuje|użytkownika|Domyślnié)/);
    if (key !== 'anonymize-account-confirm-popup') assert.match(locale[key], /Domëslno wëłączoné/);
    for (const literal of ['<!-- -->', 'JavaScript', 'WeKan JSON', 'NextCloud Deck', 'Forgejo', '@username', 'requested-by', 'assigned-by']) {
      if (english[key].includes(literal)) assert.ok(locale[key].includes(literal), `csb:${key}: ${literal}`);
    }
  }
  assert.match(locale['anonymize-account-confirm-popup'], /na wiedno.*adres e-mail.*rëmnie awatar i wëłączi logòwanié/);
  assert.match(locale['anonymize-account-confirm-popup'], /zachòwają historiã.*nie mòżna cofnąc/);
  assert.doesNotMatch(locale['anonymize-account-confirm-popup'], /ekspòrt|user1|@username/);
  for (const key of ['disable-all-import-description', 'disable-all-export-description']) assert.match(locale[key], /serwer òdrzucô kòżdé żądanié/);
  const correctedEditingHelpKeys = ["no-boards-selected", "personal-list-width-description", "fixed-list-width-note", "board_members", "card_members", "comment-only", "no-comments-desc", "custom-field-delete-pop", "select-none", "label-delete-pop", "r-when-due", "r-when-card-in-list", "r-when-a-card", "r-when-a-member", "r-when-a-attach", "r-when-a-card-is-moved", "submit-on-enter-description", "all-board-members", "invalid-file", "admin-people-filter-locked", "render-links-as-plain-text-description"];
  for (const key of correctedEditingHelpKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Gdy |Jeżeli |Wszyscy|Tylko |Nié ma możliwości|Nié da się)/);
  }
  for (const literal of ['Shift+Enter', 'Ctrl/Cmd+Enter']) assert.ok(locale['submit-on-enter-description'].includes(literal));
  for (const literal of ['[label](url)', 'HTML <a href>']) assert.ok(locale['render-links-as-plain-text-description'].includes(literal));
  assert.match(locale['render-links-as-plain-text-description'], /Domëslno wëłączoné/);
  assert.match(locale['fixed-list-width-note'], /blós dlô Ce/);
  for (const key of ['custom-field-delete-pop', 'label-delete-pop']) assert.match(locale[key], /nie mòżna cofnąc.*ze wszëtczich kôrtów/);
  assert.equal(locale['board_members'], locale['all-board-members']);
  const correctedActivityResultKeys = ["act-deleteCard", "act-deleteAttachment", "act-removeLabel", "act-removedLabel", "act-removeChecklist", "act-removeChecklistItem", "act-checkedItem", "act-uncheckedItem", "act-completeChecklist", "act-uncompleteChecklist", "act-editComment", "act-deleteComment", "act-importCard", "act-restoredCard", "act-unjoinMember", "act-atUserComment", "act-a-dueAt", "act-a-endAt", "act-a-receivedAt", "act-almostdue", "act-pastdue", "act-duenow"];
  for (const key of correctedActivityResultKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.deepEqual(locale[key].match(/__[A-Za-z0-9_]+__/g), english[key].match(/__[A-Za-z0-9_]+__/g), `csb:${key}: argument order`);
    assert.doesNotMatch(locale[key], /(?:na liście|na ścieżce|na karcie|czeklist|przypominał)/);
  }
  assert.equal(locale['act-removeLabel'], locale['act-removedLabel']);
  assert.notEqual(locale['act-checkedItem'], locale['act-uncheckedItem']);
  assert.notEqual(locale['act-completeChecklist'], locale['act-uncompleteChecklist']);
  assert.equal(new Set(['act-almostdue', 'act-pastdue', 'act-duenow'].map(key => locale[key])).size, 3);
  assert.equal(locale['act-a-dueAt'].split('\n').length, english['act-a-dueAt'].split('\n').length);
  const correctedActivityDetailKeys = ["act-addAttachment", "act-addSubtask", "act-addLabel", "act-addedLabel", "act-addChecklist", "act-addChecklistItem", "act-addComment", "act-createBoard", "act-createSwimlane", "act-createCard", "act-createCustomField", "act-setCustomField", "act-createList", "act-addBoardMember", "act-archivedCard", "act-archivedList", "act-archivedSwimlane", "act-joinMember", "act-moveCard", "act-moveCardToOtherBoard"];
  for (const key of correctedActivityDetailKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:dodał|utworzył|zmienił|na liście|na ścieżce|etykietę|czeklist)/);
    assert.deepEqual(locale[key].match(/__[A-Za-z0-9_]+__/g), english[key].match(/__[A-Za-z0-9_]+__/g), `csb:${key}: argument order`);
  }
  assert.equal(locale['act-addLabel'], locale['act-addedLabel']);
  assert.match(locale['act-moveCardToOtherBoard'], /z lëstë __oldList__.*__oldBoard__ do lëstë __list__/);
  assert.match(locale['act-setCustomField'], /__customField__: __customFieldValue__/);
  const correctedNotificationHelpKeys = ["act-activity-notify", "email-invite-subject", "push-invite-title", "just-invited", "muted-info", "not-accepted-yet", "notify-watch", "sandstorm-remove-member-warning", "watching-info", "email-invite-register-subject", "email-invite-register-text", "error-invitation-code-not-exist", "org-domains-description", "delete-all-notifications", "drag-template-here-to-share", "shared-templates-info", "invite-people-success", "invite-people-error", "disable-notifications-description", "disable-watch-description"];
  for (const key of correctedNotificationHelpKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:powiadom|Powiadom|zaproszeni|wyświetlić|zostało wysłane)/);
  }
  for (const literal of ['a.example.com', 'kanban.example.org', 'MULTITENANCY=true']) assert.ok(locale['org-domains-description'].includes(literal));
  assert.match(locale['sandstorm-remove-member-warning'], /Nie òdbiérô przistãpù/);
  assert.match(locale['disable-notifications-description'], /Aktiwnoscë mògą bëc dali zapisëwóné/);
  for (const key of ['disable-notifications-description', 'disable-watch-description']) assert.match(locale[key], /Domëslno wëłączoné/);
  for (const key of ['push-invite-title', 'email-invite-register-subject']) assert.equal(locale[key], locale['email-invite-subject']);
  const correctedAccountStatusKeys = ["home-board-badge", "home-board-empty", "user-can-not-export-excel", "user-can-not-export-card-to-pdf", "user-can-not-export-card-to-excel", "normal", "unset-default-board-title", "tracking-info", "text-below-custom-login-logo", "error-ldap-login", "impersonation-user", "office-no-results", "admin-people-user-active", "admin-people-user-inactive", "account-locked", "account-created"];
  for (const key of correctedAccountStatusKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Użytkownik|zalogowaniu|logowania|Możesz|Konto)/);
  }
  assert.match(locale['home-board-empty'], /blós jedną tôflã/);
  assert.match(locale['tracking-info'], /ùsôdzcą abò nôleżnikã/);
  assert.match(locale['account-locked'], /timczasno.*nieùdałëch prób/);
  assert.match(locale['admin-people-user-active'], /je aktiwny.*dezaktiwowac/);
  assert.match(locale['admin-people-user-inactive'], /je nieaktiwny.*żebë aktiwowac/);
  assert.match(locale['user-can-not-export-card-to-pdf'], /PDF/);
  for (const key of ['user-can-not-export-excel', 'user-can-not-export-card-to-excel']) assert.match(locale[key], /Excel/);
  const correctedBackupScopeKeys = ["backup-scope-description", "backup-now", "backup-done", "backup-schedule", "backup-frequency-daily", "backup-list", "backup-restore-add-missing", "backup-restore-select-first", "export-card", "export-card-pdf", "export-card-excel", "export-card-attachment-filename", "restore-all", "export-monitoring", "restore-list-swimlanes-done"];
  for (const key of correctedBackupScopeKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Kopia zapasow|kopii zapasowych|Codziennié|Eksportuj|Przywrò|Najpierw wybierz)/);
  }
  assert.match(locale['backup-scope-description'], /bez kòntów brëkòwników i bez nastôwów instancëji/);
  assert.match(locale['backup-scope-description'], /blós na tôflach nôleżącëch do ti òrganizacëji/);
  assert.match(locale['backup-restore-add-missing'], /blós felëjącé/);
  assert.match(locale['export-card-pdf'], /PDF/);
  assert.match(locale['export-card-excel'], /Excel/);
  assert.match(locale['export-monitoring'], /^Ekspòrtëjë/);
  const correctedStorageHelpKeys = ["uploading-files", "filter-invisible-filenames", "attachment-move-storage-fs", "move-all-attachments-to-fs", "move-all-attachments-of-board-to-fs", "move-storage-fs", "move-attachments-none-found", "move-storage-all", "calculate-file-counts", "mongodb-compact-description", "allowed-upload-filetypes", "allowed-avatar-filetypes", "sandstorm-delete-raw-mongodb-description", "disable-import-avatars-description", "backup-description", "backup-storage", "backup-restore-confirm", "gridfs-move-collectionfs-note", "s3-bucket-description", "writable-path-description", "attachment-storage-settings", "step-fix-avatar-urls"];
  for (const key of correctedStorageHelpKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:magazynu|plikòw|przechowywania|Przywròcić|Ścieżka|załącznikami)/);
  }
  for (const literal of ['backup/YYYY/MM/DD/HH_MM_SS/backup.zip', 'YYYY_MM_DD-HH_MM_SS/attachments', '/avatars', '/data', 'S3/MinIO', 'Azure', 'GCS']) assert.ok(locale['backup-description'].includes(literal));
  assert.doesNotMatch(locale['backup-description'], /HH_MM_SS\/Przëdôwczi/);
  for (const literal of ['WeKan JSON', 'Trello', 'LDAP', 'OIDC/OAuth2']) assert.ok(locale['disable-import-avatars-description'].includes(literal));
  assert.match(locale['disable-import-avatars-description'], /blós awatarë.*Domëslno wëłączoné/);
  assert.match(locale['mongodb-compact-description'], /blós pò skùńczeniu masowégò przenoszeniô/);
  assert.match(locale['sandstorm-delete-raw-mongodb-description'], /nie mòżna cofnąc/);
  const correctedLoadingKeys = ["click-to-enable-auto-width", "click-to-disable-auto-width", "auto-list-width", "r-format-auto", "autoAddUsersWithDomainName", "recovery-report-desc", "maximize-card", "minimize-card", "list-width-shared-note", "cards-loading", "cards-loading-auto", "cards-loading-all", "cards-loading-lazy", "cards-loading-description", "cards-loading-lazy-note"];
  for (const key of correctedLoadingKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Automatycz|szerokość|przeglądarki|każda|dotychczas)/);
  }
  for (const literal of ['CARDS_LOADING', 'CARDS_LOADING_LAZY_THRESHOLD', 'all/lazy/auto']) assert.ok(locale['cards-loading-description'].includes(literal));
  assert.match(locale['cards-loading-description'], /Nick nie trzeba nastôwiac/);
  assert.match(locale['cards-loading-lazy-note'], /WIP.*dokłôdné.*blós kôrtë dotąd wladóné/);
  assert.doesNotMatch(locale['cards-loading-all'], /domyśl|domësl/);
  assert.match(locale['click-to-enable-auto-width'], /wëłączonô.*włączëc/);
  assert.match(locale['click-to-disable-auto-width'], /włączonô.*wëłączëc/);
  const correctedSearchLogicKeys = ["globalSearch-instructions-operator-due", "globalSearch-instructions-operator-created", "globalSearch-instructions-operator-modified", "globalSearch-instructions-status-archived", "globalSearch-instructions-status-all", "globalSearch-instructions-status-ended", "globalSearch-instructions-status-public", "globalSearch-instructions-status-private", "globalSearch-instructions-operator-has", "globalSearch-instructions-operator-sort", "globalSearch-instructions-operator-limit", "globalSearch-instructions-notes-2", "globalSearch-instructions-notes-3", "globalSearch-instructions-notes-4", "globalSearch-instructions-operator-number"];
  for (const key of correctedSearchLogicKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.deepEqual(locale[key].match(/<[^>]+>/g), english[key].match(/<[^>]+>/g), `csb:${key}: example fields`);
    assert.deepEqual(locale[key].match(/`[^`]+`/g), english[key].match(/`[^`]+`/g), `csb:${key}: literal examples`);
  }
  assert.match(locale['globalSearch-instructions-notes-2'], /\*OR\*.*chòc jednegò/s);
  assert.match(locale['globalSearch-instructions-notes-3'], /\*AND\*.*wszëtczich/s);
  assert.match(locale['globalSearch-instructions-status-all'], /zarchiwizowóné i niezarchiwizowóné/);
  assert.match(locale['globalSearch-instructions-operator-limit'], /dodatną całkòwitą/);
  assert.match(locale['globalSearch-instructions-operator-has'], /has:-due/);
  const correctedSearchSyntaxKeys = ["advanced-filter-description", "globalSearch-instructions-heading", "globalSearch-instructions-description", "globalSearch-instructions-operator-board", "globalSearch-instructions-operator-list", "globalSearch-instructions-operator-swimlane", "globalSearch-instructions-operator-comment", "globalSearch-instructions-operator-label", "globalSearch-instructions-operator-hash", "globalSearch-instructions-operator-user", "globalSearch-instructions-operator-at", "globalSearch-instructions-operator-member", "globalSearch-instructions-operator-assignee", "globalSearch-instructions-operator-creator", "globalSearch-instructions-operator-org", "globalSearch-instructions-operator-team"];
  for (const key of correctedSearchSyntaxKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.deepEqual(locale[key].match(/<[^>]+>/g), english[key].match(/<[^>]+>/g), `csb:${key}: example fields`);
  }
  for (const key of correctedSearchSyntaxKeys.filter(key => key !== 'advanced-filter-description')) {
    assert.deepEqual(locale[key].match(/`[^`]+`/g), english[key].match(/`[^`]+`/g), `csb:${key}: literal examples`);
  }
  const advancedFilterExamples = ["== != <= >= && || ( )", "Field1 == Value1", "'Field 1' == 'Value 1'", "(' \\/)", "Field1 == I\\'m", "F1 == V1 || F1 == V2", "F1 == V1 && ( F2 == V2 || F2 == V3 )", "F1 == /Tes.*/i"];
  for (const example of advancedFilterExamples) assert.ok(locale['advanced-filter-description'].includes(example), `csb:filter example: ${example}`);
  const correctedImportFormatKeys = ["import-board-instruction-todotxt", "import-board-instruction-jira", "import-board-instruction-wekan", "import-members-map", "import-members-map-note", "import-show-user-mapping", "import-board-zip", "import-not-wekan-export"];
  for (const key of correctedImportFormatKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Wklej |wyszukiwania|przypisane|Przejrzyj|Zaimportowana)/);
  }
  for (const literal of ['GET /rest/api/2/search', '"issues"', '"automationRules"']) assert.ok(locale['import-board-instruction-jira'].includes(literal));
  assert.doesNotMatch(locale['import-board-instruction-jira'], /api\/2\/Szëkôj/);
  for (const literal of ['todo.txt', '"x"', '+project', '@context', '(A)', 'due:', 't:']) assert.ok(locale['import-board-instruction-todotxt'].includes(literal));
  assert.ok(locale['import-board-instruction-wekan'].includes(locale.menu));
  assert.ok(locale['import-board-instruction-wekan'].includes(locale['export-board']));
  assert.match(locale['import-board-zip'], /\.zip.*JSON/);
  const correctedTrelloKeys = ["import-trello-zip-file-hint", "import-trello-zip-progress", "import-trello-failed", "import-trello-zip-failed", "import-trello-zip-too-large", "import-trello-zip-too-many-files", "import-trello-zip-file-too-large", "import-trello-workspace", "import-trello-workspace-placeholder", "import-trello-parent-workspace", "trello-api-import-desc", "trello-api-token", "trello-list-workspaces", "trello-import-selected", "trello-importing", "trello-api-credentials-saved", "trello-import-more", "trello-cancel", "trello-cancel-delete", "trello-cancel-delete-confirm", "trello-resume", "trello-delete-imported"];
  for (const key of correctedTrelloKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:zostały|Możesz|Wklej |wyświetlić|Importuj|powiòdł się|przestrzeni)/);
    for (const literal of ['.zip', '.json', 'Trello', 'API']) {
      if (english[key].includes(literal)) assert.ok(locale[key].includes(literal), `csb:${key}: ${literal}`);
    }
  }
  assert.match(locale['import-trello-zip-file-hint'], /Trello Card Attachments Downloader/);
  assert.match(locale['trello-cancel-delete-confirm'], /przez no zadanié.*nie mòżna cofnąc/);
  assert.notEqual(locale['import-trello-zip-too-large'], locale['import-trello-zip-file-too-large']);
  assert.match(locale['import-trello-zip-file-too-large'], /bëne/);
  assert.match(locale['trello-api-credentials-saved'], /bez jich pòwtórnégò wpisëwaniô/);
  const correctedArchiveHelpKeys = ["board-drag-drop-reorder-or-click-open", "allowNonBoardMembers", "soft-wip-limit", "trello-api-credentials-required", "accounts-allowUserDelete", "globalSearch-instructions-notes-5", "gridfs-enabled-description", "s3-enabled-description", "error-user-notSameOrgOrTeam", "act-archivedBoard", "auto-watch", "card-archived", "card-delete-pop", "card-delete-suggest-archive", "card-archive-suggest-cancel", "list-archive-suggest", "swimlane-archive-suggest", "worker-desc", "error-board-notAMember", "error-watch-disabled", "error-linked-card-not-allowed", "error-user-notAllowSelf", "error-user-notCreated", "import-trello-json-file-hint", "import-timeout", "import-trello-zip-unsafe-path"];
  for (const key of correctedArchiveHelpKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Możesz|został|zostan|Użyj |użytkownik|przechowywania)/);
  }
  assert.match(locale['card-delete-pop'], /nie mòżna cofnąc/);
  assert.match(locale['card-delete-suggest-archive'], /zachòwac aktiwnosc/);
  assert.match(locale['worker-desc'], /blós.*przëpisëwac sebie/);
  assert.match(locale['trello-api-credentials-required'], /i klucz, i token API Trello/);
  assert.match(locale['import-trello-json-file-hint'], /\.json/);
  assert.match(locale['import-trello-zip-unsafe-path'], /\.zip/);
  assert.match(locale['soft-wip-limit'], /WIP/);
  const correctedToggleKeys = ["delete-team-confirm-popup", "delete-org-confirm-popup", "remove-domain-from-board", "editCardSortOrderPopup-title", "remove-team-from-table", "remove-organization-from-board", "change-visibility", "delete-translation-confirm-popup", "sandstorm-delete-raw-mongodb-confirm", "admin-announcement-active", "enable-permanent-delete", "enable-permanent-delete-description", "enable-vertical-scrollbars", "enable-wip-limit", "multi-selection-off", "accounts-allowEmailChange", "accounts-allowUserNameChange", "r-rule-enabled", "custom-head-tags-enabled", "custom-manifest-enabled", "custom-assetlinks-enabled", "allow-rename", "allowRenamePopup-title", "allow-invite-to-board", "disable-all-import", "disable-import-avatars", "disable-export-avatars", "disable-watch"];
  for (const key of correctedToggleKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Czy na pewno|Usunąć|Zmień|Wyłącz|Zezwòl)/);
  }
  assert.match(locale['enable-permanent-delete-description'], /Samò włączenié ti nastôwë nic nie rëmô/);
  for (const key of ['delete-team-confirm-popup', 'delete-org-confirm-popup', 'delete-translation-confirm-popup', 'sandstorm-delete-raw-mongodb-confirm']) assert.match(locale[key], /nie mòżna cofnąc/);
  assert.match(locale['custom-assetlinks-enabled'], /assetlinks\.json/);
  assert.match(locale['custom-head-tags-enabled'], /head/);
  assert.match(locale['sandstorm-delete-raw-mongodb-confirm'], /MongoDB 3.*ju przeniesioné do FerretDB/);
  const correctedConfirmationKeys = [
    "home-board-remove-confirm",
    "archive-board-confirm",
    "archive-swimlane",
    "archive-selection",
    "board-change-color",
    "boardChangeColorPopup-title",
    "changeColorPopup-title",
    "allBoardsChangeColorPopup-title",
    "boardChangeTitlePopup-title",
    "boardChangeVisibilityPopup-title",
    "boardChangeWatchPopup-title",
    "card-labels-title",
    "change-color",
    "change-settings",
    "change-font",
    "changeLanguagePopup-title",
    "changeSettingsPopup-title",
    "close-board",
    "close-dialog",
    "comment-delete",
    "deleteCommentPopup-title",
    "confirm-subtask-delete-popup",
    "deleteCustomFieldPopup-title",
    "edit-wip-limit",
    "leave-board-pop",
    "listDeletePopup-title",
    "deleted-user",
    "remove-member-pop",
    "removeMemberPopup-title",
    "rename-board",
    "board-delete-notice",
    "boardDeletePopup-title",
    "delete-all-notifications-confirm",
    "delete-duplicate-lists-confirm",
    "change-card-parent",
    "duplicate-board-confirm",
    "delete-user-confirm-popup"
  ];
  for (const key of correctedConfirmationKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Czy |Usunąć|Usunię|Zmień|Zamknij|zostanié usunię|Użytkownik)/, `csb:${key}: Polish remnants`);
  }
  assert.match(locale['home-board-remove-confirm'], /Sama tôfla nie òstanié rëmniãtô/);
  assert.match(locale['remove-member-pop'], /Dostónie ùwiadomienié/);
  assert.match(locale['board-delete-notice'], /na wiedno.*lëstë, kôrtë i dzejbë/);
  for (const key of ['delete-all-notifications-confirm', 'delete-user-confirm-popup']) assert.match(locale[key], /nie mòżna cofnąc/);
  assert.match(locale['delete-duplicate-lists-confirm'], /z tim samim mionã i bez kôrtów/);
  assert.match(locale['edit-wip-limit'], /WIP/);
  assert.equal(locale['rename-board'], locale['boardChangeTitlePopup-title']);
  const correctedJobResultKeys = [
    "location-detect-none",
    "default-save-storage-save-failed",
    "board-archive-failed",
    "board-backup-failed",
    "board-cleanup-failed",
    "cron-job-delete-failed",
    "cron-job-pause-failed",
    "cron-job-resume-failed",
    "cron-job-start-failed",
    "cron-no-errors",
    "cloud-settings-save-failed",
    "s3-settings-save-failed",
    "no-issues-found",
    "restore-lost-cards-nothing-to-restore",
    "monitoring-export-failed",
    "monitoring-refresh-failed",
    "no-repositories",
    "invalid-credentials",
    "account-creation-failed",
    "no-new-problems",
    "board-archived",
    "board-archive-scheduled",
    "board-backup-scheduled",
    "board-cleanup-scheduled",
    "cron-job-delete-confirm",
    "cron-job-deleted",
    "cron-job-paused",
    "cron-job-resumed",
    "cron-job-started",
    "cloud-settings-saved",
    "s3-settings-saved"
  ];
  for (const key of correctedJobResultKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Nié znaleziono|Nié udało się|Nieprawidł|Brak |pomyślnié|została|Czy na pewno)/, `csb:${key}: Polish remnants`);
  }
  for (const key of ['board-archive-failed', 'board-backup-failed', 'board-cleanup-failed']) assert.match(locale[key], /Nie dało sã zaplanowac/);
  assert.equal(new Set(['cron-job-deleted', 'cron-job-paused', 'cron-job-resumed', 'cron-job-started'].map(key => locale[key])).size, 4);
  assert.match(locale['restore-lost-cards-nothing-to-restore'], /stegnów, lëstów ani kôrtów/);
  assert.match(locale['invalid-credentials'], /miono brëkòwnika abò parola/);
  for (const key of ['s3-settings-save-failed', 's3-settings-saved']) assert.match(locale[key], /S3/);
  const correctedErrorKeys = [
    "add-existing-card-as-subtask-empty",
    "no-archived-boards",
    "board-not-found",
    "map-to-existing-user-no-results",
    "email-invalid",
    "filter-no-member",
    "filter-no-custom-fields",
    "import-trello-zip-no-boards",
    "import-trello-zip-read-failed",
    "version-check-failed",
    "invalid-year",
    "no-archived-cards",
    "no-archived-lists",
    "wipLimitErrorPopup-title",
    "r-import-unmapped",
    "roles-status-empty",
    "invalid-domain",
    "no-items-message",
    "no-shared-templates",
    "dueCards-noResults-title",
    "board-title-not-found",
    "swimlane-title-not-found",
    "list-title-not-found",
    "label-not-found",
    "user-username-not-found",
    "comment-not-found",
    "org-name-not-found",
    "team-name-not-found",
    "no-cards-found",
    "import-dependencies-parse-error"
  ];
  for (const key of correctedErrorKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Nié znaleziono|Nié udało się|Nieprawidł|Brak )/, `csb:${key}: Polish remnants`);
  }
  assert.match(locale['invalid-year'], /sztërë cëfrë.*2026/);
  for (const literal of ['example.com', '@']) assert.ok(locale['invalid-domain'].includes(literal));
  for (const literal of ['.json', '.zip', 'Trello']) assert.ok(locale['import-trello-zip-no-boards'].includes(literal));
  assert.match(locale['wipLimitErrorPopup-title'], /WIP/);
  assert.match(locale['user-username-not-found'], /Miono brëkòwnika/);
  assert.match(locale['comment-not-found'], /dopòwiescą.*tekst/);
  assert.match(locale['add-existing-card-as-subtask-empty'], /pasowné/);
  const correctedDisplayKeys = [
    "setSelectionColorPopup-title",
    "setCardActionsColorPopup-title",
    "setSwimlaneColorPopup-title",
    "setListColorPopup-title",
    "r-set-color",
    "hide-minicard-label-text",
    "roles-info",
    "hide-finished-checklist",
    "shared-templates-select-scope",
    "import-dependencies-empty",
    "set-as-active",
    "delete-org-warning-message",
    "delete-team-warning-message",
    "card-show-lists",
    "default-save-storage-description",
    "theme-override-all-tenants",
    "card-show-lists-on-minicard",
    "hide-list-on-minicard",
    "show-list-on-minicard",
    "wip-limit-group-select-swimlane"
  ];
  for (const key of correctedDisplayKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Wybierz|Pokaż|Ukryj|Ustaw|Nié można|Użytkownicy|wykonywać)/, `csb:${key}: Polish remnants`);
  }
  for (const key of ['setCardActionsColorPopup-title', 'setSwimlaneColorPopup-title', 'setListColorPopup-title']) assert.equal(locale[key], locale['select-color']);
  assert.notEqual(locale['hide-list-on-minicard'], locale['show-list-on-minicard']);
  assert.equal(locale['wip-limit-group-select-swimlane'], 'Wëbierzë stegnã');
  assert.match(locale['roles-info'], /wiedno mają wszëtczé prawa i nie mòżna jich tu ògrańczëc/);
  for (const key of ['delete-org-warning-message', 'delete-team-warning-message']) assert.match(locale[key], /przënômni jeden brëkòwnik/);
  const correctedSelectionKeys = [
    "multi-selection-active",
    "select-only-one-board",
    "set-selected-home",
    "show-at-all-boards-page",
    "show-card-counter-per-list",
    "board-open-and-move-between-remaining-and-workspaces",
    "vote-public",
    "map-to-existing-user-desc",
    "click-to-star",
    "click-to-unstar",
    "export-card-excel-no-disk-space",
    "sort-desc",
    "filter-show-archive",
    "filter-hide-empty",
    "import-board-instruction-excel",
    "trello-select-boards",
    "import-user-select",
    "importMapMembersAddPopup-title",
    "set-color-list",
    "rescue-card-description",
    "select-color",
    "select-board",
    "set-wip-limit-value",
    "setWipLimitPopup-title",
    "show-cards-minimum-count",
    "star-board-title",
    "set-default-board-title",
    "subscribe",
    "showSum-field-on-list",
    "setCardColorPopup-title"
  ];
  for (const key of correctedSelectionKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Kliknij|Wybierz|Pokaż|Ukryj|Ustaw|Nié można|Zapiszë się)/, `csb:${key}: Polish remnants`);
  }
  for (const literal of ['.xlsx', 'Title', 'Description', 'Status/List', 'Members', 'Labels']) {
    assert.ok(locale['import-board-instruction-excel'].includes(literal), `csb:Excel import: ${literal}`);
  }
  assert.match(locale['click-to-star'], /òznaczëc.*gwiôzdką/);
  assert.match(locale['click-to-unstar'], /rëmnąc gwiôzdkã/);
  assert.match(locale['map-to-existing-user-desc'], /nigdë nie mòże dac wiãcy prawów jak impòrt/);
  assert.match(locale['setWipLimitPopup-title'], /WIP/);
  assert.equal(locale['set-color-list'], locale['setCardColorPopup-title']);
  const correctedProgressKeys = [
    "idle-migration",
    "migration-batch-size-description",
    "migration-delay-ms",
    "migration-delay-ms-description",
    "migration-info-text",
    "migration-log",
    "migration-markers",
    "migration-resume-failed",
    "migration-resumed",
    "migration-steps",
    "migration-warning-text",
    "problems-summary-help",
    "problems-in-progress-help",
    "problems-none-in-progress",
    "board-migration",
    "board-migrations",
    "comprehensive-board-migration",
    "delete-duplicate-empty-lists-migration",
    "app-is-offline"
  ];
  for (const key of correctedProgressKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:przeglądark|Dziennik|Znaczniki|Nié udało się|proszę|Odświeżenié|wznowić)/, `csb:${key}: Polish remnants`);
  }
  assert.match(locale['migration-batch-size-description'], /1-100/);
  assert.match(locale['migration-delay-ms-description'], /100-10000/);
  assert.match(locale['migration-delay-ms'], /\(ms\)/);
  assert.ok(locale['problems-summary-help'].includes(locale.acknowledge));
  assert.ok(locale['problems-in-progress-help'].includes(locale.loading.replace(/\.$/, '')));
  assert.ok(locale['app-is-offline'].startsWith(locale.loading));
  assert.match(locale['app-is-offline'], /sprawi ùtratã pòdôwków/);
  assert.match(locale['migration-info-text'], /nawet jeżlë zamkniesz przezérnik/);
  assert.match(locale['migration-warning-text'], /Nie zamikôj przezérnika/);
  const correctedRecoveryDialogKeys = [
    "comprehensive-board-migration-description",
    "delete-duplicate-empty-lists-migration-description",
    "restore-lost-cards-migration",
    "restore-lost-cards-migration-description",
    "restore-all-archived-migration",
    "restore-all-archived-migration-description",
    "fix-missing-lists-migration",
    "fix-missing-lists-migration-description",
    "fix-avatar-urls-migration",
    "fix-avatar-urls-migration-description",
    "fix-all-file-urls-migration",
    "fix-all-file-urls-migration-description",
    "migrations-admin-only",
    "migrations-description",
    "run-comprehensive-migration-confirm",
    "run-delete-duplicate-empty-lists-migration-confirm",
    "run-restore-lost-cards-migration-confirm",
    "run-restore-all-archived-migration-confirm",
    "run-fix-missing-lists-migration-confirm",
    "run-fix-avatar-urls-migration-confirm",
    "run-fix-all-file-urls-migration-confirm"
  ];
  for (const key of correctedRecoveryDialogKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Spowoduje|Wykonuje|Wykrywa|Aktualizuje|Przywr|Napraw|Usuwa|Znajduje|Tylko|Uruchom|Każdą)/, `csb:${key}: Polish remnants`);
    for (const token of ['swimlaneId', 'listId', 'URL']) {
      if (english[key].includes(token)) assert.ok(locale[key].includes(token), `csb:${key}: ${token}`);
    }
  }
  assert.match(locale['delete-duplicate-empty-lists-migration-description'], /nie mają kôrtów I mają jinszą lëstã/);
  assert.match(locale['run-restore-lost-cards-migration-confirm'], /blós niezarchiwizowónëch elementów/);
  assert.match(locale['run-restore-all-archived-migration-confirm'], /WSZËTCZÉ zarchiwizowóné/);
  assert.match(locale['run-restore-all-archived-migration-confirm'], /nie mòżna letkò cofnąc/);
  assert.match(locale['migrations-admin-only'], /Blós administratorzë/);
  const correctedMigrationKeys = [
    "cron-migrations",
    "cron-migration-errors",
    "cron-migration-warnings",
    "cron-no-failed-migrations",
    "cron-no-paused-migrations",
    "cron-migrations-resumed",
    "cron-migrations-retried",
    "database-migration",
    "database-migration-description",
    "database-migration-confirm",
    "database-migration-done",
    "sandstorm-migration-description",
    "sandstorm-migration-status",
    "sandstorm-migration-failed",
    "sandstorm-migration-pending",
    "migration-starting",
    "migration-pausing",
    "migration-stopping",
    "migration-pause-failed",
    "migration-paused",
    "migration-progress",
    "migration-start-failed",
    "migration-started",
    "migration-not-needed",
    "migration-status",
    "migration-stop-confirm",
    "migration-stop-failed",
    "migration-stopped",
    "pause-all-migrations",
    "start-all-migrations",
    "stop-all-migrations",
    "attachment-migration",
    "automatic-migration",
    "migration-needed",
    "migration-successful",
    "migration-failed",
    "migration-progress-title",
    "migration-progress-overall",
    "migration-progress-status",
    "migration-progress-details",
    "migration-progress-note",
    "database-migrations",
    "overall-progress",
    "remaining-attachments",
    "resume-migration"
  ];
  for (const key of correctedMigrationKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:Uruchom|Wstrzymaj|Zatrzymaj|pomyślnié|bazy danych|Nié udało się|zakończona|Szczegòły)/, `csb:${key}: Polish remnants`);
  }
  for (const literal of ['mongodb://127.0.0.1:27018', 'mongodb://127.0.0.1:27019', 'WEKAN_FERRETDB_URL', 'WEKAN_MONGODB_URL', 'MONGO_URL', 'snap set wekan database=ferretdb', '=mongodb']) {
    assert.ok(locale['database-migration-description'].includes(literal), `csb:database migration: ${literal}`);
  }
  for (const literal of ['files/attachments', 'files/avatars', 'MongoDB 3', 'FerretDB v1', 'SQLite']) {
    assert.ok(locale['sandstorm-migration-description'].includes(literal), `csb:Sandstorm migration: ${literal}`);
  }
  assert.doesNotMatch(locale['sandstorm-migration-description'], /files\/Przëdôwczi/);
  assert.equal(new Set(['migration-starting', 'migration-pausing', 'migration-stopping'].map(key => locale[key])).size, 3);
  assert.equal(new Set(['migration-started', 'migration-paused', 'migration-stopped'].map(key => locale[key])).size, 3);
  const correctedMixedAdminKeys = [
    "attachment-transfer-limits-title",
    "attachment-transfer-limits-description",
    "attachment-transfer-limits-saved",
    "attachment-transfer-limits-save-failed",
    "avatars-upload-blocked-description",
    "attachment-repair-locations",
    "attachment-repair-locations-description",
    "attachment-repair-running",
    "attachment-repair-broken",
    "support-info-not-added-yet",
    "support-info-only-for-logged-in-users",
    "accessibility-info-not-added-yet",
    "accounts-lockout-settings",
    "accounts-lockout-info",
    "accounts-lockout-known-users",
    "accounts-lockout-unknown-users",
    "accounts-lockout-settings-updated",
    "accounts-lockout-locked-users",
    "accounts-lockout-locked-users-info",
    "accounts-lockout-no-locked-users",
    "accounts-lockout-failed-attempts",
    "accounts-lockout-user-unlocked",
    "accounts-lockout-confirm-unlock",
    "accounts-lockout-confirm-unlock-all",
    "accounts-lockout-show-locked-users",
    "accounts-lockout-click-to-unlock",
    "accounts-lockout-all-users-unlocked",
    "accounts-lockout-unlock-all",
    "attachment-soft-delete-pop",
    "avatar-too-big",
    "attachmentDeletePopup-title",
    "subtaskDeletePopup-title",
    "copy-card-link-to-clipboard",
    "copyListPopup-title",
    "copyManyCardsPopup-title",
    "copyManyCardsPopup-instructions",
    "copySelectionPopup-title",
    "subtask-settings",
    "attachment-count",
    "filesReportTitle",
    "filename-invisible-legend",
    "copy-swimlane",
    "copySwimlanePopup-title",
    "attachment-last-move",
    "attachment-storage-configuration",
    "attachments-path",
    "attachments-path-description",
    "avatars-path",
    "avatars-path-description",
    "filesystem-path-description",
    "filesystem-enabled",
    "filesystem-disabled",
    "filesystem-enabled-description"
  ];
  for (const key of correctedMixedAdminKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /(?:użytkownik|Użytkownik|Ścieżka|Kopiuj|Usunąć|załącznik|załączni|zostały|nieudane|Nié udało się)/, `csb:${key}: Polish remnants`);
  }
  assert.match(locale['attachment-soft-delete-pop'], /lopk òstôwô zachòwóny/);
  assert.match(locale['attachment-soft-delete-pop'], /przëwrócëc z historie kôrtë/);
  assert.match(locale['attachment-repair-locations-description'], /GridFS/);
  assert.match(locale['copyManyCardsPopup-instructions'], /JSON/);
  assert.match(locale['accounts-lockout-known-users'], /pòprawné miono.*niepòprawnô parola/);
  assert.match(locale['accounts-lockout-unknown-users'], /nieistniejącé miono/);
  assert.notEqual(locale['filesystem-enabled'], locale['filesystem-disabled']);
  assert.notEqual(locale['accounts-lockout-confirm-unlock'], locale['accounts-lockout-confirm-unlock-all']);
  const correctedFlowKeys = [
    "every-1-hour",
    "every-1-minute",
    "every-10-minutes",
    "every-30-minutes",
    "every-5-minutes",
    "every-6-hours",
    "gridfs-attachments",
    "gridfs-size",
    "gridfs-storage",
    "job-queue",
    "memory-usage",
    "migrate-all-to-gridfs",
    "migrate-all-to-s3",
    "migration-batch-size",
    "migration-cpu-threshold-description",
    "next",
    "of",
    "page",
    "pause-migration",
    "previous",
    "refresh",
    "run-once",
    "s3-attachments",
    "s3-size",
    "s3-storage",
    "scanning-status",
    "schedule",
    "showChecklistAtMinicard",
    "start-test-operation",
    "start-time",
    "step-progress",
    "stop-migration",
    "storage-distribution",
    "total-size",
    "weight",
    "cron",
    "current-step",
    "otp",
    "already-account",
    "available-repositories",
    "repositories",
    "repository",
    "size-bytes",
    "upload-repository",
    "sign-in-to-upload",
    "otp-required",
    "user-exists",
    "confirm",
    "file",
    "log",
    "logout",
    "server",
    "problems-status-title",
    "cpu-usage-current",
    "cpu-cores-suffix",
    "event-datetime",
    "event-category",
    "event-severity",
    "event-ip",
    "event-ipv4",
    "event-ipv6",
    "export-select-what-to-include",
    "import-here-instruction",
    "operator-number",
    "import-source-heading",
    "import-wekan-file",
    "wip-limit-group-apply-swimlane",
    "board-view-blocker-analysis",
    "board-view-size-cycle-time",
    "flow-unknown",
    "flow-cycle-days",
    "flow-age-days",
    "flow-p85",
    "flow-samples",
    "flow-signal",
    "flow-unusual",
    "flow-blocker",
    "flow-episodes",
    "flow-active",
    "flow-blocked-days",
    "flow-unknown-start",
    "flow-confidence",
    "flow-target-count",
    "flow-finish-days",
    "flow-finish-date",
    "flow-target-date",
    "flow-history-days",
    "flow-beyond-horizon",
    "flow-size-source",
    "flow-size",
    "flow-error",
    "flow-details",
    "flow-note-agingWip",
    "flow-note-blockerAnalysis",
    "flow-note-monteCarlo",
    "flow-note-processBehavior",
    "flow-note-sizeCycleTime",
    "time-adjustments",
    "time-adjustment-note"
  ];
  for (const key of correctedFlowKeys) {
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const [key, value] of Object.entries(locale)) {
    assert.doesNotMatch(value, /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
  }
  for (const key of ['gridfs-storage', 's3-storage', 'cron']) assert.equal(locale[key], english[key]);
  for (const key of ['import-here-instruction', 'import-wekan-file']) {
    assert.ok(locale[key].includes('.json'));
    assert.ok(locale[key].includes('.zip'));
  }
  for (const literal of ['2,000', 'UTC', '3,650']) assert.ok(locale['flow-note-monteCarlo'].includes(literal));
  assert.match(locale['flow-note-processBehavior'], /XmR/);
  assert.match(locale['flow-note-sizeCycleTime'], /Planning Poker/);
  assert.match(locale['migration-cpu-threshold-description'], /10-90/);
  assert.notEqual(locale.next, locale.previous);
  assert.notEqual(locale['pause-migration'], locale['stop-migration']);
  assert.match(locale['time-adjustment-note'], /Ùjemné wôrtnotë są pòprawkama/);
  const correctedCloudKeys = [
    "backup-datetime",
    "backup-path",
    "backup-restore-mode",
    "backup-restore-replace-all",
    "gcs-project-id",
    "gcs-bucket",
    "gcs-key-filename",
    "gcs-credentials",
    "gcs-project-id-description",
    "s3-endpoint-menu-path",
    "s3-secret-key-menu-path",
    "azure-account-key-menu-path",
    "azure-connection-string-menu-path",
    "gcs-key-filename-menu-path",
    "move-storage-azure",
    "move-storage-gcs",
    "gridfs-enabled",
    "gridfs-disabled",
    "s3-disabled",
    "select-migration",
    "pause",
    "stop",
    "mongodb-gridfs-storage",
    "s3-access-key",
    "s3-access-key-description",
    "s3-access-key-placeholder",
    "s3-bucket",
    "s3-enabled",
    "s3-endpoint-description",
    "s3-minio-storage",
    "s3-port",
    "s3-port-description",
    "s3-region",
    "s3-region-description",
    "s3-secret-key",
    "s3-secret-key-description",
    "s3-secret-key-placeholder",
    "s3-secret-key-required",
    "s3-ssl-enabled",
    "s3-ssl-enabled-description",
    "writable-path",
    "migration-complete",
    "migration-running",
    "run-migration",
    "migration-progress-current-step",
    "steps",
    "view",
    "has-swimlanes",
    "step-validate-migration",
    "step-finalize",
    "step-fix-missing-ids",
    "cleanup-old-jobs",
    "completed",
    "cpu-usage",
    "current-action",
    "days-old",
    "duration",
    "errors",
    "estimated-time-remaining",
    "every-1-day"
  ];
  for (const key of correctedCloudKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['move-storage-azure', 'move-storage-gcs']) assert.equal(locale[key], english[key]);
  for (const literal of ['s3.amazonaws.com', 'minio.example.com']) assert.ok(locale['s3-endpoint-description'].includes(literal));
  assert.match(locale['s3-region-description'], /us-east-1/);
  assert.match(locale['s3-ssl-enabled-description'], /SSL\/TLS/);
  assert.match(locale['gcs-credentials'], /JSON/);
  assert.notEqual(locale['gridfs-enabled'], locale['gridfs-disabled']);
  assert.notEqual(locale['s3-access-key'], locale['s3-secret-key']);
  for (const literal of ['Access key ID', 'Secret access key', 'Download .csv']) assert.ok(locale['s3-secret-key-menu-path'].includes(literal));
  const correctedBackupKeys = [
    "active-cron-jobs",
    "cron-jobs",
    "cron-error-severity",
    "cron-error-message",
    "cron-clear-errors",
    "complete",
    "idle",
    "storage-read",
    "storage-enabled",
    "s3-force-path-style",
    "azure-blob-storage",
    "azure-blob-storage-description",
    "azure-account-key",
    "azure-connection-string",
    "azure-container",
    "gcs-storage",
    "gcs-storage-description",
    "database-migration-phase",
    "sandstorm-migration-success",
    "sandstorm-storage-item",
    "sandstorm-disk-usage",
    "collections",
    "features",
    "features-performance",
    "features-security",
    "render-links-as-plain-text",
    "always-show-code-as-text",
    "disable-all-export",
    "disable-activities",
    "disable-notifications",
    "backup-data",
    "backup-scope",
    "backup-scope-instance",
    "backup-frequency",
    "backup-frequency-off",
    "backup-frequency-weekly",
    "backup-frequency-monthly",
    "backup-time",
    "backup-day-of-week",
    "backup-day-of-month"
  ];
  for (const key of correctedBackupKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['azure-blob-storage', 'azure-blob-storage-description', 'gcs-storage', 'gcs-storage-description']) {
    assert.equal(locale[key], english[key], `csb:${key}: storage product name`);
  }
  assert.match(locale['backup-time'], /HH:MM/);
  assert.match(locale['backup-day-of-month'], /1-28/);
  assert.match(locale['s3-force-path-style'], /URL/);
  assert.notEqual(locale['backup-frequency-weekly'], locale['backup-frequency-monthly']);
  const correctedStatusKeys = [
    "board-status-time-spent-total",
    "board-status-cards-with-time",
    "board-status-overtime-cards",
    "remaining_time",
    "speed",
    "progress",
    "if-you-already-have-an-account",
    "Mongo_sessions_count",
    "max-upload-filesize",
    "max-avatar-filesize",
    "translation-number",
    "translation-text",
    "show-subtasks-field",
    "show-week-of-year",
    "convert-to-markdown",
    "collapse",
    "collapse-checklist",
    "expand-checklist",
    "uncollapse",
    "hideCheckedChecklistItems",
    "hideAllChecklistItems",
    "support",
    "supportPopup-title",
    "support-page-enabled",
    "support-title",
    "support-content",
    "accessibility",
    "accessibility-page-enabled",
    "accessibility-title",
    "accessibility-content",
    "accounts-lockout-failures-before",
    "accounts-lockout-period",
    "accounts-lockout-failure-window",
    "accounts-lockout-remaining-time",
    "accounts-lockout-user-locked",
    "accounts-lockout-status",
    "admin-people-filter-show",
    "admin-people-filter-active",
    "admin-people-filter-inactive",
    "admin-people-active-status"
  ];
  for (const key of correctedStatusKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  assert.match(locale['show-week-of-year'], /ISO 8601/);
  assert.match(locale['convert-to-markdown'], /Markdown/);
  assert.notEqual(locale['collapse-checklist'], locale['expand-checklist']);
  assert.notEqual(locale['hideCheckedChecklistItems'], locale['hideAllChecklistItems']);
  assert.notEqual(locale['accounts-lockout-period'], locale['accounts-lockout-failure-window']);
  assert.notEqual(locale['admin-people-filter-active'], locale['admin-people-filter-inactive']);
  assert.equal(locale.support, 'Pòmòc');
  assert.equal(locale['supportPopup-title'], locale.support);
  const correctedStorageKeys = [
    "Node_memory_usage_heap_total",
    "Node_memory_usage_external",
    "acceptance_of_our_legalNotice",
    "legalNotice",
    "copied",
    "checklistActionsPopup-title",
    "newLineNewItem",
    "newlineBecomesNewChecklistItemOriginOrder",
    "originOrder",
    "copyChecklist",
    "copyChecklistPopup-title",
    "copyChecklistFromTemplate",
    "copyChecklistFromTemplatePopup-title",
    "subtaskActionsPopup-title",
    "attachmentActionsPopup-title",
    "move-destination",
    "move-storage-collectionfs",
    "move-storage-gridfs",
    "move-storage-s3",
    "attachment-repair-done",
    "attachment-repair-scanned",
    "attachment-repair-repaired",
    "move-scope-avatars",
    "move-scope-both",
    "default-save-storage",
    "default-save-storage-saved",
    "move-progress-file",
    "move-progress-pause",
    "stats-scope",
    "stats-collectionfs",
    "stats-mongo-files",
    "stats-count",
    "avatars",
    "attachment-id",
    "gridfs-file-id",
    "s3-file-id",
    "path",
    "size",
    "storage",
    "action"
  ];
  for (const key of correctedStorageKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['move-storage-collectionfs', 'move-storage-gridfs', 'move-storage-s3', 'stats-collectionfs', 'stats-mongo-files']) {
    assert.equal(locale[key], english[key], `csb:${key}: storage product name`);
  }
  assert.notEqual(locale['attachment-repair-scanned'], locale['attachment-repair-repaired']);
  assert.match(locale['copyChecklistFromTemplate'], /ze szablónu/);
  assert.match(locale['move-scope-both'], /Przëłączniczi i awatarë/);
  const correctedReportKeys = [
    "office-logins",
    "office-first-seen",
    "office-last-seen",
    "apiReportTitle",
    "api-endpoint",
    "api-calls",
    "recovery-severity",
    "recovery-db",
    "wait-spinner",
    "Cube",
    "Cube-Grid",
    "Dot",
    "Wave",
    "subject",
    "carbon-copy",
    "tickets",
    "ticket-number",
    "open",
    "pending",
    "closed",
    "resolved",
    "cancelled",
    "history",
    "history-change-removed",
    "history-change-edited",
    "history-change-moved",
    "request",
    "requests",
    "help-request",
    "add-teams-label",
    "confirm-btn",
    "to-create-teams-contact-admin",
    "Node_heap_total_heap_size",
    "Node_heap_total_heap_size_executable",
    "Node_heap_total_physical_size",
    "Node_heap_total_available_size",
    "Node_heap_used_heap_size",
    "Node_heap_heap_size_limit",
    "Node_heap_malloced_memory",
    "Node_memory_usage_rss"
  ];
  for (const key of correctedReportKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['apiReportTitle', 'api-endpoint']) assert.equal(locale[key], 'API');
  assert.ok(locale['carbon-copy'].includes('(Cc:)'));
  assert.equal(new Set(['open', 'pending', 'closed', 'resolved', 'cancelled'].map(key => locale[key])).size, 5);
  assert.match(locale.Node_heap_total_available_size, /przistãpnô/);
  assert.match(locale.Node_heap_used_heap_size, /ùżëtô/);
  assert.match(locale.Node_heap_malloced_memory, /malloc/);
  assert.match(locale.Node_memory_usage_rss, /RSS/);
  const correctedDependencyKeys = [
    "dependency-icon",
    "dependency-type-related-to",
    "dependency-type-blocks",
    "dependency-type-is-blocked-by",
    "dependency-type-fixes",
    "dependency-type-is-fixed-by",
    "filter-dependencies-label",
    "import-dependencies-file",
    "import-dependencies-placeholder",
    "import-dependencies-done",
    "upload-background",
    "board-background-delete-pop",
    "location-address",
    "location-latitude",
    "location-longitude",
    "location-detect-from-map",
    "location-detect",
    "location-open-map-at",
    "map-region-usa",
    "map-region-europe",
    "map-region-asia",
    "map-provider-saved",
    "created-at-newest-first",
    "created-at-oldest-first",
    "links-heading",
    "custom-field-stringtemplate-format",
    "custom-field-stringtemplate-separator",
    "reports",
    "problems",
    "securityReportTitle",
    "speedReportTitle",
    "testsReportTitle",
    "cpuReportTitle",
    "databaseReportTitle",
    "acknowledge",
    "rulesReportTitle",
    "impersonationReportTitle",
    "impersonation-admin",
    "officeReportTitle",
    "office-address"
  ];
  for (const key of correctedDependencyKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  assert.equal(locale['map-region-usa'], 'USA');
  for (const token of ['&#32;', '&nbsp;']) assert.ok(locale['custom-field-stringtemplate-separator'].includes(token));
  assert.match(locale['dependency-type-is-blocked-by'], /przez$/);
  assert.match(locale['dependency-type-is-fixed-by'], /przez$/);
  assert.notEqual(locale['dependency-type-blocks'], locale['dependency-type-is-blocked-by']);
  assert.notEqual(locale['location-latitude'], locale['location-longitude']);
  assert.match(locale['created-at-newest-first'], /nônowszé nôprzód/);
  assert.match(locale['created-at-oldest-first'], /nôstarszé nôprzód/);
  const correctedSearchHelpKeys = [
    "predicate-month",
    "predicate-quarter",
    "predicate-year",
    "predicate-due",
    "predicate-modified",
    "predicate-created",
    "predicate-checklist",
    "predicate-start",
    "predicate-end",
    "predicate-assignee",
    "predicate-public",
    "predicate-private",
    "predicate-selector",
    "predicate-projection",
    "operator-number-expected",
    "operator-sort-invalid",
    "operator-status-invalid",
    "next-page",
    "previous-page",
    "heading-notes",
    "globalSearch-instructions-heading",
    "globalSearch-instructions-operators",
    "globalSearch-instructions-operator-status",
    "globalSearch-instructions-notes-1",
    "globalSearch-instructions-notes-3-2",
    "link-to-search",
    "excel-font",
    "label-colors",
    "label-names",
    "archived-at",
    "sort-boards-title-asc",
    "sort-boards-title-desc",
    "due-complete",
    "card-mark-complete",
    "card-mark-incomplete",
    "stickers",
    "card-dependencies",
    "show-dependencies",
    "hide-dependencies",
    "drag-to-connect"
  ];
  for (const key of correctedSearchHelpKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    if (key.startsWith('predicate-')) assert.match(locale[key], /^[\p{Letter}\p{Mark}]+$/u);
  }
  assert.equal(locale['excel-font'], 'Arial');
  assert.ok(locale['globalSearch-instructions-operator-status'].includes('`__operator_status__:<status>`'));
  assert.match(locale['globalSearch-instructions-notes-3-2'], /dodatną abò ùjemną całkòwitą lëczbã/);
  assert.match(locale['sort-boards-title-asc'], /A → Z/);
  assert.match(locale['sort-boards-title-desc'], /Z → A/);
  assert.notEqual(locale['card-mark-complete'], locale['card-mark-incomplete']);
  const correctedSearchKeys = [
    "status",
    "owner",
    "last-modified-at",
    "last-activity",
    "hide-checked-items",
    "domains",
    "domain",
    "share-template-with",
    "domain-user-count",
    "shared-templates",
    "person",
    "day",
    "month",
    "context-separator",
    "myCardsViewChange-choice-table",
    "dueCards-title",
    "dueCardsViewChange-choice-me",
    "globalSearchViewChange-title",
    "globalSearchViewChangePopup-title",
    "operator-board-abbrev",
    "operator-swimlane",
    "operator-swimlane-abbrev",
    "operator-list-abbrev",
    "operator-label",
    "operator-label-abbrev",
    "operator-user-abbrev",
    "operator-member-abbrev",
    "operator-assignee",
    "operator-assignee-abbrev",
    "operator-status",
    "operator-due",
    "operator-created",
    "operator-modified",
    "operator-sort",
    "operator-has",
    "operator-team",
    "operator-title",
    "operator-customfield",
    "operator-checklist-text",
    "predicate-archived",
    "predicate-open",
    "predicate-ended",
    "predicate-all",
    "predicate-overdue",
    "predicate-week"
  ];
  for (const key of correctedSearchKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    if (key.endsWith('-abbrev') || key === 'context-separator') assert.equal(locale[key], english[key]);
    if (key.startsWith('operator-') && !key.endsWith('-abbrev')) assert.match(locale[key], /^[\p{Letter}\p{Mark}]+$/u);
  }
  const shortSearchAliases = Object.keys(english).filter(key => /^operator-.*-abbrev$/.test(key)).map(key => locale[key]);
  assert.equal(new Set(shortSearchAliases).size, shortSearchAliases.length, 'csb: unique short search aliases');
  const searchParser = fs.readFileSync(path.join(root, 'config/query-classes.js'), 'utf8');
  for (const key of correctedSearchKeys.filter(key => /^(operator-|predicate-)/.test(key))) {
    assert.ok(searchParser.includes(`'${key}':`), `csb:${key}: registered search syntax`);
  }
  assert.equal(locale['operator-swimlane'], 'stegna');
  assert.equal(locale['predicate-overdue'], 'pòterminie');
  const correctedDateKeys = [
    "layout",
    "hide-logo",
    "display-authentication-method",
    "oidc-button-text",
    "default-authentication-method",
    "swimlaneDeletePopup-title",
    "previous_as",
    "act-a-dueAt",
    "act-a-endAt",
    "act-a-startAt",
    "act-a-receivedAt",
    "a-dueAt",
    "a-endAt",
    "a-startAt",
    "a-receivedAt",
    "above-selected-card",
    "above-selected-swimlane",
    "below-selected-card",
    "below-selected-swimlane",
    "almostdue",
    "pastdue",
    "duenow",
    "act-newDue",
    "act-withDue",
    "show-desktop-drag-handles",
    "drag-to-resize-sidebar",
    "drag-to-resize-left-menu",
    "submit-on-enter",
    "show-on-card",
    "editOrgPopup-title",
    "view-all",
    "filter-by-unread",
    "mark-all-as-read",
    "mark-all-as-unread",
    "roles",
    "roles-status-role",
    "roles-status-sees-assigned",
    "start-day-of-week",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
  ];
  for (const key of correctedDateKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  assert.ok(locale['act-a-dueAt'].includes('\nCzedë: __timeValue__\nGdze: __card__\n'));
  assert.match(locale.almostdue, /sã zblëżô/);
  assert.match(locale.pastdue, /ju minął/);
  assert.match(locale.duenow, /je dzysô/);
  assert.match(locale['above-selected-card'], /^Nad/);
  assert.match(locale['below-selected-card'], /^Pòd/);
  assert.notEqual(locale['mark-all-as-read'], locale['mark-all-as-unread']);
  assert.equal(new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(key => locale[key])).size, 7);
  const correctedRuleActionKeys = [
    "r-when-a-end-date-changed",
    "r-when-a-received-date-changed",
    "r-when-a-checklist",
    "r-when-the-checklist",
    "r-completed",
    "r-when-a-item",
    "r-when-the-item",
    "r-top-of",
    "r-bottom-of",
    "r-label",
    "r-checklist",
    "r-check-all",
    "r-uncheck-all",
    "r-items-check",
    "r-check",
    "r-uncheck",
    "r-item",
    "r-of-checklist",
    "r-to",
    "r-of",
    "r-subject",
    "r-d-send-email-to",
    "r-d-send-email-subject",
    "r-d-send-email-message",
    "r-in-list",
    "r-in-swimlane",
    "r-d-check-one",
    "r-d-uncheck-one",
    "r-d-check-of-list",
    "r-by",
    "r-with-items",
    "r-items-list",
    "r-board-note",
    "r-checklist-note",
    "r-set",
    "r-update",
    "r-datefield",
    "r-df-start-at",
    "r-df-due-at",
    "r-df-end-at",
    "r-df-received-at",
    "r-to-current-datetime",
    "r-remove-value-from",
    "ldap",
    "oauth2",
    "cas",
    "settings-group-url",
    "settings-group-logo",
    "custom-head-manifest-content",
    "custom-assetlinks-content"
  ];
  for (const key of correctedRuleActionKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['ldap', 'oauth2', 'cas', 'settings-group-url']) assert.equal(locale[key], english[key]);
  for (const key of ['r-when-a-end-date-changed', 'r-when-a-received-date-changed']) {
    assert.match(locale[key], /nastawionô abò zmienionô/);
  }
  assert.match(locale['r-board-note'], /pòle pùsté.*kòżdi mòżlëwi wôrtnotë/);
  assert.match(locale['r-checklist-note'], /òddzeloné przecënkama/);
  assert.equal(locale['r-items-list'].split(',').length, 3);
  assert.notEqual(locale['r-check'], locale['r-uncheck']);
  assert.ok(locale['custom-assetlinks-content'].includes('assetlinks.json (JSON)'));
  const correctedScheduleKeys = [
    "r-workflow-format",
    "r-import-workflow-note",
    "r-set-scheduled-triggers",
    "r-set-button-triggers",
    "r-when-scheduled",
    "r-schedule-type",
    "r-schedule-once",
    "r-schedule-weekday",
    "r-schedule-weekly",
    "r-schedule-monthly",
    "r-schedule-on-weekday",
    "r-schedule-on-day",
    "r-schedule-on-date",
    "r-due-soon",
    "r-due-overdue",
    "r-days-before",
    "r-days-after",
    "r-for-n-days",
    "r-button-label",
    "r-run",
    "r-sort-by",
    "r-sort-due",
    "r-set-date-relative",
    "r-unit-minutes",
    "r-unit-hours",
    "r-unit-days",
    "r-unit-weeks",
    "r-unit-months",
    "r-trigger",
    "r-action",
    "r-is",
    "r-is-moved",
    "r-added-to",
    "r-attachment-added-to",
    "r-removed-from",
    "r-attachment-removed-from",
    "set-filter",
    "r-moved-to",
    "r-moved-from",
    "r-archived",
    "r-when-a-label-is",
    "r-when-the-label",
    "r-when-the-member",
    "r-when-the-assignee",
    "r-when-a-due-date-changed"
  ];
  for (const key of correctedScheduleKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  assert.match(locale['r-import-workflow-note'], /n8n abò Node-RED/);
  assert.match(locale['r-import-workflow-note'], /wãzłë bez przëpisaniô są zgłôszóné/);
  assert.match(locale['r-schedule-weekday'], /pòniedzôłk–piątk/);
  assert.equal(locale['r-days-before'], 'dni przed');
  assert.equal(locale['r-days-after'], 'dni pò');
  assert.equal(locale['r-moved-to'], 'Przeniesóné do');
  assert.equal(locale['r-moved-from'], 'Przeniesóné z');
  assert.match(locale['r-when-a-due-date-changed'], /nastawiony abò zmieniony/);
  const correctedRuleKeys = [
    "modifiedAt",
    "verified",
    "active",
    "org-shared-templates",
    "team-shared-templates",
    "active-person",
    "card-received",
    "card-received-on",
    "card-end",
    "card-end-on",
    "editCardReceivedDatePopup-title",
    "editCardEndDatePopup-title",
    "assigned-by",
    "requested-by",
    "default",
    "defaultdefault",
    "queue",
    "show-parent-in-minicard",
    "checklist-count-on-minicard",
    "checklist-count",
    "cover-image",
    "prefix-with-full-path",
    "prefix-with-parent",
    "subtext-with-full-path",
    "subtext-with-parent",
    "activity-added-label",
    "activity-added-label-card",
    "r-rule",
    "r-view-rule",
    "r-no-rules",
    "r-import-export",
    "r-select-all",
    "r-unselect-all",
    "r-export-selected",
    "r-edit-rule",
    "r-edit-rule-trigger-action",
    "r-workflow-view",
    "r-when",
    "r-drop-trigger",
    "r-drop-action",
    "r-w-set-received-now",
    "r-export-json",
    "r-export-csv",
    "r-import-json",
    "r-import-csv",
    "r-import-trello",
    "r-import-paste",
    "r-import-done",
    "r-import-target",
    "r-import-workflow"
  ];
  for (const key of correctedRuleKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['checklist-count', 'checklist-count-on-minicard']) assert.ok(locale[key].includes('(0/0)'));
  assert.match(locale['r-import-trello'], /Trello Butler.*w miarã mòżlëwòsców/);
  assert.match(locale['r-w-set-received-now'], /datã dostaniô na terô/);
  assert.notEqual(locale['prefix-with-full-path'], locale['prefix-with-parent']);
  assert.notEqual(locale['assigned-by'], locale['requested-by']);
  const correctedSystemKeys = [
    "smtp-host",
    "smtp-port",
    "smtp-tls",
    "send-from",
    "send-smtp-test",
    "email-templates-invite-subject",
    "email-templates-invite-body",
    "email-templates-activity-subject",
    "email-templates-activity-body",
    "invitation-code",
    "outgoing-webhooks",
    "bidirectional-webhooks",
    "outgoingWebhooksPopup-title",
    "disable-webhook",
    "global-webhook",
    "no-name",
    "Platform",
    "package",
    "OS",
    "Meteor",
    "Database",
    "Node",
    "Node_version",
    "Meteor_version",
    "Database_type",
    "Database_commit",
    "FerretDB_version",
    "FerretDB_commit",
    "Reactivity_mode",
    "Reactivity_order",
    "DDP_transport",
    "MongoDB_version",
    "MongoDB_storage_engine",
    "MongoDB_Oplog_enabled",
    "OS_Arch",
    "OS_Cpus",
    "OS_Freemem",
    "OS_Platform",
    "OS_Release",
    "OS_Totalmem",
    "OS_Type",
    "OS_Uptime",
    "days",
    "hours",
    "minutes",
    "seconds",
    "show-field-on-card",
    "showLabel-field-on-card",
    "visibility",
    "createdAt"
  ];
  for (const key of correctedSystemKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['Meteor', 'Node']) assert.equal(locale[key], english[key]);
  for (const token of ['changeStreams', 'oplog', 'polling']) assert.ok(locale.Reactivity_mode.includes(token));
  assert.ok(locale.Reactivity_order.includes('METEOR_REACTIVITY_ORDER'));
  assert.ok(locale.DDP_transport.includes('DDP_TRANSPORT'));
  for (const kind of ['invite', 'activity']) {
    assert.match(locale[`email-templates-${kind}-subject`], /^Téma lëstu/);
    assert.match(locale[`email-templates-${kind}-body`], /^Zamkłosc lëstu/);
  }
  assert.match(locale['email-templates-activity-subject'], /pòwiadomieniô ò aktiwnoscë/);
  assert.notEqual(locale.OS_Freemem, locale.OS_Totalmem);
  const correctedNavigationKeys = [
    "swimlaneActionPopup-title",
    "listImportCardsTsvPopup-title",
    "gantt",
    "log-in",
    "loginPopup-title",
    "menu",
    "copy-selection",
    "muted",
    "no-archived-swimlanes",
    "normal-assigned-only",
    "page-maybe-private",
    "paste-or-dragdrop",
    "participating",
    "preview",
    "previewAttachedImagePopup-title",
    "previewClipboardImagePopup-title",
    "rules",
    "search-example",
    "shortcut-close-dialog",
    "shortcut-toggle-filterbar",
    "shortcut-toggle-searchbar",
    "sidebar-close",
    "spent-time-hours",
    "overtime-hours",
    "overtime",
    "tracking",
    "type",
    "upload",
    "upload-avatar",
    "uploaded-avatar",
    "custom-login-logo-image-url",
    "custom-login-logo-link-url",
    "view-it",
    "watching",
    "welcome-list1",
    "welcome-list2",
    "list-templates-swimlane",
    "what-to-do",
    "attachment-limits",
    "attachment-transfer-limits-invalid-value",
    "attachment-upload-limit-label",
    "avatars-upload-blocked-label",
    "attachment-download-limit-label",
    "api-upload-limit-label",
    "api-download-limit-label",
    "attachment-limit-mode-unlimited",
    "attachment-limit-mode-max-size",
    "attachment-limit-mode-blocked",
    "attachment-limit-unit-gb",
    "attachment-limit-unit-mb",
    "attachment-limit-unit-bytes",
    "invite",
    "invite-people",
    "email-addresses",
    "smtp-tls-description"
  ];
  for (const key of correctedNavigationKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['attachment-limit-unit-gb', 'attachment-limit-unit-mb']) {
    assert.equal(locale[key], english[key], `csb:${key}: preserve unit`);
  }
  assert.ok(locale['page-maybe-private'].includes("<a href='%s'>zalogòwanim</a>"));
  assert.match(locale['normal-assigned-only'], /blós do przëpisónëch kôrtów/);
  assert.match(locale['attachment-transfer-limits-invalid-value'], /dodatną wôrtnotã/);
  assert.match(locale['attachment-upload-limit-label'], /wgrywónégò/);
  assert.match(locale['attachment-download-limit-label'], /pòbiérónégò/);
  const correctedImportKeys = [
    "export-ical-feed",
    "export-card-excel-fields",
    "export-card-subtasks",
    "export-card-field-dates",
    "export-card-attachment-size",
    "export-card-attachment-type",
    "export-card-attachment-uploaded-by",
    "export-card-attachment-uploaded-at",
    "export-card-excel-free",
    "export-card-excel-needed",
    "sorted",
    "list-label-modifiedAt",
    "list-label-short-modifiedAt",
    "list-label-short-title",
    "list-label-short-sort",
    "filter",
    "filter-dates-label",
    "filter-no-due-date",
    "filter-overdue",
    "filter-labels-label",
    "filter-no-label",
    "filter-assignee-label",
    "filter-no-assignee",
    "filter-on",
    "other-filters-label",
    "advanced-filter-label",
    "show-activities",
    "hide-activities",
    "import-board-instruction-asana",
    "import-board-instruction-csv",
    "import-excel-file",
    "import-json-placeholder",
    "import-csv-placeholder",
    "import-json-file",
    "import-trello-json-file",
    "import-trello-zip-file",
    "trello-api-import",
    "trello-api-key",
    "trello-parent-workspace-top",
    "trello-import-results",
    "select-all",
    "unselect-all",
    "trello-import-progress",
    "trello-clear-job",
    "trello-import-errors",
    "copy-to-clipboard",
    "running",
    "paused",
    "info",
    "check-version",
    "initials",
    "invalid-date",
    "invalid-time",
    "joined",
    "label-default"
  ];
  for (const key of correctedImportKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['list-label-short-modifiedAt', 'list-label-short-title', 'list-label-short-sort']) {
    assert.equal(locale[key], english[key], `csb:${key}: preserve compact label`);
  }
  for (const token of ['{ "data": [...] }', 'GET /tasks', 'memberships']) {
    assert.ok(locale['import-board-instruction-asana'].includes(token), `csb: preserve Asana ${token}`);
  }
  assert.ok(locale['trello-api-key'].includes('https://trello.com/app-key'));
  assert.match(locale['filter-no-assignee'], /Bez przëpisóny òsobë/);
  assert.match(locale['export-card-field-dates'], /ùsôdzeniô, dostaniô, zaczãcô, terminu, skùńczeniô/);
  const correctedFieldKeys = [
    "font-size-largest",
    "changeAvatarPopup-title",
    "delete-avatar-confirm",
    "deleteAvatarPopup-title",
    "changePermissionsPopup-title",
    "subtasks",
    "click-to-star-page",
    "click-to-unstar-page",
    "clipboard",
    "close-popup",
    "close-card",
    "color-black",
    "color-blue",
    "color-darkgreen",
    "color-gold",
    "color-gray",
    "color-green",
    "color-indigo",
    "color-red",
    "color-silver",
    "color-sky",
    "color-slateblue",
    "color-white",
    "unset-color",
    "comment-placeholder",
    "comment-assigned-only",
    "no-comments",
    "read-only",
    "read-assigned-only",
    "worker",
    "computer",
    "confirm-checklist-delete-popup",
    "confirm-checklist-item-delete-popup",
    "checklistDeletePopup-title",
    "checklistItemDeletePopup-title",
    "copy-link-to-clipboard",
    "copy-text-to-clipboard",
    "custom-field-checkbox",
    "custom-field-currency",
    "custom-field-currency-option",
    "custom-field-dropdown-none",
    "custom-field-dropdown-options-placeholder",
    "custom-field-dropdown-unknown",
    "custom-field-number",
    "custom-field-text",
    "date-format",
    "date-format-yyyy-mm-dd",
    "date-format-dd-mm-yyyy",
    "date-format-mm-dd-yyyy",
    "decline",
    "default-avatar",
    "deleteLabelPopup-title",
    "discard",
    "download",
    "edit-profile",
    "editCardStartDatePopup-title",
    "editCardDueDatePopup-title",
    "editCustomFieldPopup-title",
    "editCardSpentTimePopup-title",
    "editLabelPopup-title",
    "editNotificationPopup-title",
    "editProfilePopup-title",
    "email-enrollAccount-subject",
    "email-enrollAccount-text",
    "email-sent"
  ];
  for (const key of correctedFieldKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['comment-placeholder', 'date-format-yyyy-mm-dd', 'date-format-dd-mm-yyyy', 'date-format-mm-dd-yyyy']) {
    assert.equal(locale[key], english[key], `csb:${key}: preserve empty placeholder or format code`);
  }
  assert.equal(locale['color-blue'], 'mòdri');
  assert.equal(locale['color-black'], 'czôrny');
  assert.match(locale['comment-assigned-only'], /Kòmentowanié blós przëpisónëch kôrtów/);
  assert.match(locale['read-assigned-only'], /Òdczët blós przëpisónëch kôrtów/);
  assert.ok(locale['email-enrollAccount-text'].includes('\n\n__url__\n\n'));
  const correctedCardControlKeys = [
    "board-view-table",
    "board-view-stats",
    "calendar-previous-month-label",
    "calendar-next-month-label",
    "card-delete-notice",
    "card-due",
    "card-due-on",
    "card-spent",
    "card-edit-labels",
    "card-start-on",
    "cardCustomField-datePopup-title",
    "positiveVoteMembersPopup-title",
    "negativeVoteMembersPopup-title",
    "editVoteEndDatePopup-title",
    "vote-for-it",
    "vote-against",
    "deleteVotePopup-title",
    "vote-delete-pop",
    "cardStartPlanningPokerPopup-title",
    "card-edit-planning-poker",
    "editPokerEndDatePopup-title",
    "poker-question",
    "poker-one",
    "poker-two",
    "poker-three",
    "poker-five",
    "poker-eight",
    "poker-thirteen",
    "poker-twenty",
    "poker-forty",
    "poker-oneHundred",
    "poker-unsure",
    "poker-finish",
    "poker-result-votes",
    "poker-result-who",
    "set-estimation",
    "deletePokerPopup-title",
    "poker-delete-pop",
    "cardDetailsActionsPopup-title",
    "cardDependencyIconPopup-title",
    "dependencyLinePopup-title",
    "importDependenciesPopup-title",
    "adminChangeAvatarPopup-title",
    "importSwimlanePopup-title",
    "cardStickersPopup-title",
    "invitePeoplePopup-title",
    "rulesImportExportPopup-title",
    "casSignIn",
    "samlSignIn",
    "change",
    "change-avatar",
    "change-permissions",
    "theme-default",
    "theme-category",
    "theme-category-flat",
    "theme-category-clear",
    "theme-category-dark",
    "theme-category-special",
    "font-default",
    "font-size",
    "font-size-default",
    "font-size-smaller",
    "font-size-small",
    "font-size-large",
    "font-size-larger"
  ];
  for (const key of correctedCardControlKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  for (const key of ['poker-one', 'poker-two', 'poker-three', 'poker-five', 'poker-eight',
    'poker-thirteen', 'poker-twenty', 'poker-forty', 'poker-oneHundred', 'poker-unsure']) {
    assert.equal(locale[key], english[key], `csb:${key}: preserve vote value`);
  }
  for (const key of ['card-delete-notice', 'vote-delete-pop', 'poker-delete-pop']) {
    assert.match(locale[key], /na wiedno.*Stracysz wszëtczé dzejbë/);
  }
  assert.equal(locale['vote-against'], 'procëm');
  assert.match(locale['samlSignIn'], /przez SAML/);
  const correctedActionKeys = [
    "activity-changedTitle",
    "comment-in-reply-to",
    "comment-reply",
    "due-date-changes",
    "due-date-changed-times",
    "actions",
    "activity-added",
    "activity-archived",
    "activity-created",
    "activity-excluded",
    "activity-imported",
    "activity-imported-board",
    "activity-joined",
    "activity-on",
    "activity-sent",
    "activity-unjoined",
    "activity-checked-item",
    "activity-unchecked-item",
    "activity-checklist-added",
    "activity-checklist-completed",
    "activity-checklist-item-added",
    "activity-checked-item-card",
    "activity-unchecked-item-card",
    "activity-receivedDate",
    "activity-startDate",
    "allboards.starred",
    "allboards.remaining",
    "allboards.edit-workspace",
    "allboards.edit-workspace-icon",
    "allboards.workspace-menu",
    "allboards.delete-workspace-confirm",
    "allboards.delete-workspace-confirm-check",
    "selected-label",
    "activity-dueDate",
    "activity-endDate",
    "setListWidthPopup-title",
    "set-list-width",
    "list-width-personal-note",
    "setSwimlaneHeightPopup-title",
    "set-swimlane-height",
    "set-swimlane-height-value",
    "swimlane-height-error-message",
    "close-add-checklist-item",
    "close-edit-checklist-item",
    "added",
    "admin",
    "public-boards",
    "apply",
    "archived-items",
    "archived-boards",
    "archives",
    "attachment-delete-pop",
    "board-change-background-image",
    "board-background-image-url",
    "board-nb-stars",
    "boardChangeBackgroundImagePopup-title",
    "allBoardsChangeBackgroundImagePopup-title",
    "mobile-mode",
    "mobile-desktop-toggle",
    "zoom-level",
    "enter-zoom-level",
    "board-view-cal",
    "board-view-multiboard-cal",
    "board-view-collapse",
    "board-view-gantt"
  ];
  for (const key of correctedActionKeys) {
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/, `csb:${key}: language label is not a translation`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
  }
  assert.equal(locale.actions, 'Dzejbë');
  assert.equal(locale['activity-sent'], 'wësłôł %s do %s');
  assert.match(locale['board-view-multiboard-cal'], /wielu tôflów/);
  assert.match(locale['swimlane-height-error-message'], /dodatną całkòwitą lëczbą/);
  assert.match(locale['attachment-delete-pop'], /na wiedno.*Nie mòżna tegò cofnąc/);
  assert.match(locale['email-recovery-confirm-cancel'], /nie mòże bëc przëwróconô/);
  assert.match(locale['email-recovery-description'], /niepewnô wësëłka mòże bëc pòwtórzonô/);
  assert.match(locale['activity-recovery-description'], /nigdë nie ùsôdzô aktiwnoscë znowa/);
  assert.match(locale['activity-recovery-cancel-confirm'], /Nie mòżna ji wznowic/);
  assert.match(locale['history-request-hint'], /nigdë nie mòże cofnąc drëdżi zmianë/);
  for (const key of Object.keys(english).filter(key =>
    /^(auto-archive-|filter-(recency|movement-range|date-range|due-|column-age|preset|card-text)|notification-activity-|due-reminder-|map-view-)/.test(key))) {
    assert.notEqual(locale[key], english[key], `csb:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/);
  }
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', 'none']) {
    assert.ok(locale['advanced-filter-card-dates-hint'].includes(token), `csb: preserve ${token}`);
  }
  for (const token of ['{creator}', '{assignees}', '{members}', '{customField:Name}']) {
    assert.ok(locale['r-trigger-vars-hint'].includes(token), `csb: preserve ${token}`);
  }
  assert.ok(locale['r-vars-people-hint'].includes('{customField:Field name}'));
  assert.deepEqual(translationTokens(locale['custom-field-stringtemplate-context-hint']),
    translationTokens(english['custom-field-stringtemplate-context-hint']));
  assert.match(locale['filter-column-age-hint'], /Edycjô kôrtë nie zerëje/);
  assert.match(locale['instance-desc'], /Nigdë nie je pòkôzëwónô/);
  assert.match(locale['due-reminder-days-label'], /dodatné.*przed.*ùjemné.*pò nim/);
  assert.match(locale['notification-activity-description'], /dochòdzą wiedno/);
  for (const key of Object.keys(english).filter(key => key.startsWith('scrum-'))) {
    assert.notEqual(locale[key], english[key], `csb:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/);
  }
  assert.match(locale['scrum-report-help'], /nie są òszacowaniama zerowima/);
  assert.match(locale['scrum-report-help'], /zgódnëch jednoskach òszacowaniô i zasadach/);
  assert.match(locale['scrum-partial-report'], /terô przëpisóné Tobie/);
  assert.match(locale['scrum-daily-observations-help'], /nie zapisëją kòżdi zmianë/);
  assert.match(locale['scrum-daily-observations-help'], /listwie nôrzãdzów ekspòrtëje rezultatë sprintu/);
  assert.match(locale['scrum-daily-observations-export-help'], /Nieznóné òszacowania nie są zerã/);
  assert.match(locale['scrum-import-pending'], /Edycjô Scrum i ekspòrt rapòrtów nie są przistãpné/);
  for (const key of Object.keys(english).filter(key => key.startsWith('sync-'))) {
    assert.notEqual(locale[key], english[key], `csb:${key}: untranslated`);
    assert.deepEqual(translationTokens(locale[key]), translationTokens(english[key]), `csb:${key}: tokens`);
    assert.doesNotMatch(locale[key], /— pò kaszëbskù/);
  }
  assert.match(locale['sync-conflict-hint'], /Nic nie je wësëłóné/);
  assert.match(locale['sync-report-partial'], /nie wznôwiają ani nie cofają/);
  assert.match(locale['sync-conflict-review-complete'], /całi lëstë nie bëła ùruchòmionô/);
  assert.match(locale['sync-conflict-detach-hint'], /zamkłosc òstaje w WeKan/);
  assert.match(locale['sync-estimate-field-hint'], /jawnô wôrtnota null czëszczi/);
  assert.match(locale['sync-time-estimate-hint'], /dokładno jedno/);
  assert.match(locale['sync-recovery-description'], /nie mògą wznowic ani cofnąc/);
  assert.equal(locale['rule-email-recovery-recipients'], 'Òdbiérôcze');
  assert.match(locale['rule-email-recovery-resend-confirm'], /dwa razë/);
  assert.match(locale['rule-email-recovery-actions-hint'], /blós do òdbiérôczów bez pòcwierdzeniô/);
  assert.match(locale['rule-email-legacy-discard-confirm'], /Nigdë nie bãdze wësłóny/);
  assert.match(locale['rule-email-legacy-access-denied'], /ni mô ju przistãpù/);
  assert.match(locale['rule-email-legacy-description'], /WeKan nie wëslë jich sóm/);
  assert.match(locale['rule-email-resolution-resend-uncertain'], /mògła dojsc abò nie dojsc/);
}
