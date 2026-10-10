// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const papiamento = readLocale('pap');
const { translationTokens: tokens } = require('../releases/translations/placeholder-tokens.mjs');
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'pap',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Papiamento value stays translated');

assert.deepEqual(Object.keys(papiamento), Object.keys(english),
  'Papiamento key order follows the English source');
for (const [key, value] of Object.entries(papiamento)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(papiamento.board, 'Tabla');
assert.equal(papiamento.card, 'Karchi');
assert.equal(papiamento.settings, 'Konfigurashon');
assert.equal(papiamento.download, 'Deskargá');
assert.equal(papiamento['select-none'], 'No selektá niun');
assert.deepEqual(tokens(papiamento['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(papiamento['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(papiamento['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('papiamentoTranslationProgress: historical baseline passed; newer entries checked separately');

const blocklyControls = ["blockly-ALT_KEY", "blockly-BACKSPACE_KEY", "blockly-CANNOT_DELETE_VARIABLE_PROCEDURE", "blockly-CAPS_LOCK_KEY", "blockly-CHANGE_VALUE_TITLE", "blockly-CLEAN_UP", "blockly-CLOSE_BACKPACK", "blockly-COLLAPSED_WARNINGS_WARNING", "blockly-COLLAPSE_ALL", "blockly-COLLAPSE_BLOCK", "blockly-COLOUR_BLEND_COLOUR1", "blockly-COLOUR_BLEND_COLOUR2", "blockly-COLOUR_BLEND_RATIO", "blockly-COLOUR_BLEND_TITLE", "blockly-COLOUR_BLEND_TOOLTIP", "blockly-COLOUR_PICKER_TOOLTIP", "blockly-COLOUR_RANDOM_TITLE", "blockly-COLOUR_RANDOM_TOOLTIP", "blockly-COLOUR_RGB_BLUE", "blockly-COLOUR_RGB_GREEN", "blockly-COLOUR_RGB_RED", "blockly-COLOUR_RGB_TITLE", "blockly-COLOUR_RGB_TOOLTIP", "blockly-COMMAND_KEY", "blockly-CONTEXT_MENU_KEY", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK", "blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE", "blockly-CONTROLS_FLOW_STATEMENTS_WARNING"];
for (const key of blocklyControls) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.equal(papiamento['blockly-COLOUR_RGB_BLUE'], 'blou');
assert.equal(papiamento['blockly-COLOUR_RGB_GREEN'], 'bèrde');
assert.equal(papiamento['blockly-COLOUR_RGB_RED'], 'kòrá');
assert.match(papiamento['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /^No por borra/);
assert.match(papiamento['blockly-COLOUR_BLEND_TOOLTIP'], /0\.0 - 1\.0/);
assert.match(papiamento['blockly-COLOUR_RGB_TOOLTIP'], /entre 0 i 100/);
assert.match(papiamento['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'], /Salta e resto.*siguiente repetishon/);
assert.match(papiamento['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'], /Sali for di e siklo/);
assert.match(papiamento['blockly-CONTROLS_FLOW_STATEMENTS_WARNING'], /solamente den un siklo/);

const blocklyLoops = ["blockly-CONTROLS_FOREACH_TITLE", "blockly-CONTROLS_FOREACH_TOOLTIP", "blockly-CONTROLS_FOR_TITLE", "blockly-CONTROLS_FOR_TOOLTIP", "blockly-CONTROLS_IF_ELSEIF_TOOLTIP", "blockly-CONTROLS_IF_ELSE_TOOLTIP", "blockly-CONTROLS_IF_IF_TOOLTIP", "blockly-CONTROLS_IF_MSG_ELSE", "blockly-CONTROLS_IF_MSG_ELSEIF", "blockly-CONTROLS_IF_TOOLTIP_1", "blockly-CONTROLS_IF_TOOLTIP_2", "blockly-CONTROLS_IF_TOOLTIP_3", "blockly-CONTROLS_IF_TOOLTIP_4", "blockly-CONTROLS_REPEAT_TITLE", "blockly-CONTROLS_REPEAT_TOOLTIP", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL", "blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL", "blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE", "blockly-CONTROL_KEY", "blockly-COPY_ALL_TO_BACKPACK", "blockly-COPY_SHORTCUT", "blockly-COPY_TO_BACKPACK", "blockly-CURRENT_BLOCK_ANNOUNCEMENT", "blockly-CUT_SHORTCUT", "blockly-DELETE_ALL_BLOCKS", "blockly-DELETE_BLOCK", "blockly-DELETE_VARIABLE", "blockly-DELETE_VARIABLE_CONFIRMATION", "blockly-DELETE_X_BLOCKS", "blockly-DISABLE_BLOCK", "blockly-DUPLICATE_BLOCK", "blockly-DUPLICATE_COMMENT", "blockly-EDIT_BLOCK_CONTENTS", "blockly-EMPTY_BACKPACK"];
for (const key of blocklyLoops) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.match(papiamento['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /ta falsu/);
assert.doesNotMatch(papiamento['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /ta berdat/);
assert.match(papiamento['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /ta berdat/);
assert.match(papiamento['blockly-CONTROLS_IF_TOOLTIP_4'], /Si niun.*último blòk/);
assert.match(papiamento['blockly-CONTROLS_FOR_TITLE'], /%1 for di %2 te %3 ku paso di %4/);
assert.match(papiamento['blockly-DELETE_ALL_BLOCKS'], /tur %1/);
assert.match(papiamento['blockly-DELETE_VARIABLE_CONFIRMATION'], /%1 uso.*'%2'/);
assert.notEqual(papiamento['blockly-COPY_SHORTCUT'], papiamento['blockly-CUT_SHORTCUT']);
assert.match(papiamento['blockly-CONTROL_KEY'], /Control/);

const blocklyFields = ["blockly-ENABLE_BLOCK", "blockly-END_KEY", "blockly-ENTER_KEY", "blockly-ESCAPE", "blockly-EXPAND_ALL", "blockly-EXPAND_BLOCK", "blockly-EXTERNAL_INPUTS", "blockly-FIELD_BITMAP_ARIA_VALUE", "blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR", "blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE", "blockly-FIELD_BITMAP_PIXEL_LABEL", "blockly-FIELD_BITMAP_PIXEL_OFF", "blockly-FIELD_LABEL_EDIT_PREFIX", "blockly-FIELD_LABEL_EMPTY", "blockly-FIELD_LABEL_OPTION_INDEX", "blockly-FIELD_LABEL_VARIABLE", "blockly-FIELD_MULTILINEINPUT_FINISH_EDITING", "blockly-FIELD_MULTILINEINPUT_NEW_LINE", "blockly-HELP_PROMPT", "blockly-HOME_KEY", "blockly-ICON_LABEL_COMMENT_CLOSED", "blockly-ICON_LABEL_COMMENT_OPEN", "blockly-ICON_LABEL_DEFAULT", "blockly-ICON_LABEL_MUTATOR_CLOSED", "blockly-ICON_LABEL_MUTATOR_OPEN", "blockly-ICON_LABEL_WARNING_CLOSED", "blockly-ICON_LABEL_WARNING_OPEN", "blockly-INLINE_INPUTS", "blockly-INPUT_LABEL_CONDITION", "blockly-INPUT_LABEL_CONDITION_A", "blockly-INPUT_LABEL_CONDITION_B", "blockly-INPUT_LABEL_EMPTY", "blockly-INPUT_LABEL_END_STATEMENT", "blockly-INPUT_LABEL_INDEX", "blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM"];
for (const key of blocklyFields) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const kind of ['COMMENT', 'WARNING']) {
  assert.match(papiamento[`blockly-ICON_LABEL_${kind}_CLOSED`], /^Habri/);
  assert.match(papiamento[`blockly-ICON_LABEL_${kind}_OPEN`], /^Sera/);
}
assert.match(papiamento['blockly-FIELD_BITMAP_PIXEL_LABEL'], /fila %2, kolòm %3/);
assert.match(papiamento['blockly-FIELD_BITMAP_ARIA_VALUE'], /%3 píksel sendí/);
assert.equal(papiamento['blockly-FIELD_BITMAP_PIXEL_OFF'], 'pagá');
assert.match(papiamento['blockly-HOME_KEY'], /Kuminsamentu.*Home/);
assert.match(papiamento['blockly-END_KEY'], /Fin.*End/);
assert.match(papiamento['blockly-INPUT_LABEL_CONDITION_A'], /promé/);
assert.match(papiamento['blockly-INPUT_LABEL_CONDITION_B'], /di dos/);
assert.notEqual(papiamento['blockly-ENABLE_BLOCK'], papiamento['blockly-DISABLE_BLOCK']);

const blocklyInputs = ["blockly-INPUT_LABEL_LISTS_DELIMITER", "blockly-INPUT_LABEL_LISTS_END_POSITION", "blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT", "blockly-INPUT_LABEL_LISTS_POSITION", "blockly-INPUT_LABEL_LISTS_REPEAT_ITEM", "blockly-INPUT_LABEL_LISTS_REPEAT_NUM", "blockly-INPUT_LABEL_LISTS_START_POSITION", "blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST", "blockly-INPUT_LABEL_LISTS_TO_CHANGE", "blockly-INPUT_LABEL_LISTS_TO_CHECK", "blockly-INPUT_LABEL_LISTS_VALUE_TO_SET", "blockly-INPUT_LABEL_LOOP_BY", "blockly-INPUT_LABEL_LOOP_FROM", "blockly-INPUT_LABEL_LOOP_LIST", "blockly-INPUT_LABEL_LOOP_TIMES", "blockly-INPUT_LABEL_LOOP_TO", "blockly-INPUT_LABEL_MATH_CHANGE_BY", "blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE", "blockly-INPUT_LABEL_MATH_DIVIDEND", "blockly-INPUT_LABEL_MATH_DIVISOR", "blockly-INPUT_LABEL_NUMBER", "blockly-INPUT_LABEL_NUMBER_A", "blockly-INPUT_LABEL_NUMBER_ATAN2_X", "blockly-INPUT_LABEL_NUMBER_ATAN2_Y", "blockly-INPUT_LABEL_NUMBER_B", "blockly-INPUT_LABEL_NUMBER_LIST", "blockly-INPUT_LABEL_NUMBER_MAX", "blockly-INPUT_LABEL_NUMBER_MIN", "blockly-INPUT_LABEL_NUMBER_TO_CHECK", "blockly-INPUT_LABEL_STATEMENT", "blockly-INPUT_LABEL_TEXT_APPEND", "blockly-INPUT_LABEL_TEXT_END_POSITION", "blockly-INPUT_LABEL_TEXT_JOIN_ITEM", "blockly-INPUT_LABEL_TEXT_POSITION", "blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE", "blockly-INPUT_LABEL_TEXT_START_POSITION", "blockly-INPUT_LABEL_TEXT_TO_CHANGE", "blockly-INPUT_LABEL_TEXT_TO_CHECK", "blockly-INPUT_LABEL_TEXT_TO_FIND", "blockly-INPUT_LABEL_TEXT_TO_REPLACE", "blockly-INPUT_LABEL_VALUE", "blockly-INPUT_LABEL_VALUE_A", "blockly-INPUT_LABEL_VALUE_B", "blockly-INPUT_LABEL_VARIABLES_SET"];
for (const key of blocklyInputs) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const type of ['LISTS', 'TEXT']) {
  assert.match(papiamento[`blockly-INPUT_LABEL_${type}_START_POSITION`], /inisial/);
  assert.match(papiamento[`blockly-INPUT_LABEL_${type}_END_POSITION`], /final/);
}
assert.match(papiamento['blockly-INPUT_LABEL_LOOP_FROM'], /inisial/);
assert.match(papiamento['blockly-INPUT_LABEL_LOOP_TO'], /final/);
assert.match(papiamento['blockly-INPUT_LABEL_NUMBER_ATAN2_X'], / x$/);
assert.match(papiamento['blockly-INPUT_LABEL_NUMBER_ATAN2_Y'], / y$/);
assert.match(papiamento['blockly-INPUT_LABEL_MATH_DIVIDEND'], /ta wordu dividí/);
assert.match(papiamento['blockly-INPUT_LABEL_MATH_DIVISOR'], /dor di dje/);
assert.equal(papiamento['blockly-INPUT_LABEL_LISTS_REPEAT_NUM'], papiamento['blockly-INPUT_LABEL_LOOP_TIMES']);

const blocklyRetrieval = ["blockly-INSERT_KEY", "blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT", "blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_COPIED_HINT", "blockly-KEYBOARD_NAV_CUT_HINT", "blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT", "blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT", "blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT", "blockly-LISTS_CREATE_EMPTY_TITLE", "blockly-LISTS_CREATE_EMPTY_TOOLTIP", "blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD", "blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP", "blockly-LISTS_CREATE_WITH_INPUT_WITH", "blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP", "blockly-LISTS_CREATE_WITH_TOOLTIP", "blockly-LISTS_GET_INDEX_FIRST", "blockly-LISTS_GET_INDEX_FROM_END", "blockly-LISTS_GET_INDEX_GET", "blockly-LISTS_GET_INDEX_GET_REMOVE", "blockly-LISTS_GET_INDEX_LAST", "blockly-LISTS_GET_INDEX_RANDOM", "blockly-LISTS_GET_INDEX_REMOVE", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_GET_REMOVE_RANDOM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST", "blockly-LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM"];
for (const key of blocklyRetrieval) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
  const prefix = 'blockly-LISTS_GET_INDEX_TOOLTIP_';
  assert.match(papiamento[`${prefix}GET_${position}`], /^Duna bèk/);
  assert.doesNotMatch(papiamento[`${prefix}GET_${position}`], /[Kk]ita/);
  assert.match(papiamento[`${prefix}GET_REMOVE_${position}`], /^Kita i duna bèk/);
  assert.match(papiamento[`${prefix}REMOVE_${position}`], /^Kita/);
  assert.doesNotMatch(papiamento[`${prefix}REMOVE_${position}`], /duna bèk/);
}
assert.match(papiamento['blockly-LISTS_CREATE_EMPTY_TOOLTIP'], /largura 0.*sin niun/);
assert.match(papiamento['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /Tene %1 primí.*%2 pa aseptá/);
assert.match(papiamento['blockly-KEYBOARD_NAV_COPIED_HINT'], /^Kopiá/);
assert.match(papiamento['blockly-KEYBOARD_NAV_CUT_HINT'], /^Kortá/);

const blocklyListMutation = ["blockly-LISTS_GET_SUBLIST_END_FROM_END", "blockly-LISTS_GET_SUBLIST_END_LAST", "blockly-LISTS_GET_SUBLIST_START_FIRST", "blockly-LISTS_GET_SUBLIST_START_FROM_END", "blockly-LISTS_GET_SUBLIST_START_FROM_START", "blockly-LISTS_GET_SUBLIST_TOOLTIP", "blockly-LISTS_INDEX_FROM_END_TOOLTIP", "blockly-LISTS_INDEX_FROM_START_TOOLTIP", "blockly-LISTS_INDEX_OF_FIRST", "blockly-LISTS_INDEX_OF_LAST", "blockly-LISTS_INDEX_OF_TOOLTIP", "blockly-LISTS_INLIST", "blockly-LISTS_ISEMPTY_TITLE", "blockly-LISTS_ISEMPTY_TOOLTIP", "blockly-LISTS_LENGTH_TITLE", "blockly-LISTS_LENGTH_TOOLTIP", "blockly-LISTS_REPEAT_TITLE", "blockly-LISTS_REPEAT_TOOLTIP", "blockly-LISTS_REVERSE_MESSAGE0", "blockly-LISTS_REVERSE_TOOLTIP", "blockly-LISTS_SET_INDEX_INSERT", "blockly-LISTS_SET_INDEX_SET", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FIRST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_FROM", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_LAST", "blockly-LISTS_SET_INDEX_TOOLTIP_SET_RANDOM", "blockly-LISTS_SORT_ORDER_ASCENDING", "blockly-LISTS_SORT_ORDER_DESCENDING", "blockly-LISTS_SORT_TITLE", "blockly-LISTS_SORT_TOOLTIP", "blockly-LISTS_SORT_TYPE_IGNORECASE", "blockly-LISTS_SORT_TYPE_NUMERIC", "blockly-LISTS_SORT_TYPE_TEXT", "blockly-LISTS_SPLIT_LIST_FROM_TEXT", "blockly-LISTS_SPLIT_TEXT_FROM_LIST", "blockly-LISTS_SPLIT_TOOLTIP_JOIN", "blockly-LISTS_SPLIT_TOOLTIP_SPLIT", "blockly-LISTS_SPLIT_WITH_DELIMITER"];
for (const key of blocklyListMutation) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const position of ['FIRST', 'FROM', 'LAST', 'RANDOM']) {
  assert.match(papiamento[`blockly-LISTS_SET_INDEX_TOOLTIP_INSERT_${position}`], /^(Insertá|Agregá)/);
  assert.match(papiamento[`blockly-LISTS_SET_INDEX_TOOLTIP_SET_${position}`], /^Asigná e balor/);
}
for (const key of ['LISTS_GET_SUBLIST_TOOLTIP', 'LISTS_REVERSE_TOOLTIP', 'LISTS_SORT_TOOLTIP']) assert.match(papiamento[`blockly-${key}`], /kopia/);
assert.match(papiamento['blockly-LISTS_INDEX_OF_TOOLTIP'], /%1 si no a haña/);
assert.match(papiamento['blockly-LISTS_INDEX_FROM_START_TOOLTIP'], /promé/);
assert.match(papiamento['blockly-LISTS_INDEX_FROM_END_TOOLTIP'], /último/);
assert.match(papiamento['blockly-LISTS_SORT_TYPE_IGNORECASE'], /ignorá mayúskula i minúskula/);
assert.match(papiamento['blockly-LISTS_SPLIT_TOOLTIP_JOIN'], /^Uni/);
assert.match(papiamento['blockly-LISTS_SPLIT_TOOLTIP_SPLIT'], /^Separá.*kada separadó/);

const blocklyLogic = ["blockly-LOGIC_BOOLEAN_FALSE", "blockly-LOGIC_BOOLEAN_TOOLTIP", "blockly-LOGIC_BOOLEAN_TRUE", "blockly-LOGIC_COMPARE_EQ_ARIA", "blockly-LOGIC_COMPARE_GTE_ARIA", "blockly-LOGIC_COMPARE_GT_ARIA", "blockly-LOGIC_COMPARE_LTE_ARIA", "blockly-LOGIC_COMPARE_LT_ARIA", "blockly-LOGIC_COMPARE_NEQ_ARIA", "blockly-LOGIC_COMPARE_TOOLTIP_EQ", "blockly-LOGIC_COMPARE_TOOLTIP_GT", "blockly-LOGIC_COMPARE_TOOLTIP_GTE", "blockly-LOGIC_COMPARE_TOOLTIP_LT", "blockly-LOGIC_COMPARE_TOOLTIP_LTE", "blockly-LOGIC_COMPARE_TOOLTIP_NEQ", "blockly-LOGIC_NEGATE_TITLE", "blockly-LOGIC_NEGATE_TOOLTIP", "blockly-LOGIC_NULL_TOOLTIP", "blockly-LOGIC_OPERATION_AND", "blockly-LOGIC_OPERATION_TOOLTIP_AND", "blockly-LOGIC_OPERATION_TOOLTIP_OR", "blockly-LOGIC_TERNARY_CONDITION", "blockly-LOGIC_TERNARY_IF_FALSE", "blockly-LOGIC_TERNARY_IF_TRUE", "blockly-LOGIC_TERNARY_TOOLTIP"];
for (const key of blocklyLogic) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const comparison of ['GT', 'LT']) {
  assert.doesNotMatch(papiamento[`blockly-LOGIC_COMPARE_TOOLTIP_${comparison}`], /òf igual/);
  assert.match(papiamento[`blockly-LOGIC_COMPARE_TOOLTIP_${comparison}E`], /òf igual/);
}
assert.match(papiamento['blockly-LOGIC_COMPARE_TOOLTIP_NEQ'], /no ta igual/);
assert.match(papiamento['blockly-LOGIC_OPERATION_TOOLTIP_AND'], /tur dos/);
assert.match(papiamento['blockly-LOGIC_OPERATION_TOOLTIP_OR'], /por lo ménos un/);
assert.match(papiamento['blockly-LOGIC_NEGATE_TOOLTIP'], /berdat si e entrada ta falsu.*falsu si e entrada ta berdat/);
assert.match(papiamento['blockly-LOGIC_NULL_TOOLTIP'], /null/);
for (const label of ['CONDITION', 'IF_FALSE', 'IF_TRUE']) assert.ok(papiamento['blockly-LOGIC_TERNARY_TOOLTIP'].includes(papiamento[`blockly-LOGIC_TERNARY_${label}`]));

const blocklyArithmetic = ["blockly-MATH_ADDITION_SYMBOL_ARIA", "blockly-MATH_ARITHMETIC_TOOLTIP_ADD", "blockly-MATH_ARITHMETIC_TOOLTIP_DIVIDE", "blockly-MATH_ARITHMETIC_TOOLTIP_MINUS", "blockly-MATH_ARITHMETIC_TOOLTIP_MULTIPLY", "blockly-MATH_ARITHMETIC_TOOLTIP_POWER", "blockly-MATH_ATAN2_TITLE", "blockly-MATH_ATAN2_TOOLTIP", "blockly-MATH_CHANGE_TITLE", "blockly-MATH_CHANGE_TOOLTIP", "blockly-MATH_CONSTANT_GOLDEN_RATIO_ARIA", "blockly-MATH_CONSTANT_INFINITY_ARIA", "blockly-MATH_CONSTANT_SQRT1_2_ARIA", "blockly-MATH_CONSTANT_SQRT2_ARIA", "blockly-MATH_CONSTANT_TOOLTIP", "blockly-MATH_CONSTRAIN_TITLE", "blockly-MATH_CONSTRAIN_TOOLTIP", "blockly-MATH_DIVISION_SYMBOL_ARIA", "blockly-MATH_IS_DIVISIBLE_BY", "blockly-MATH_IS_EVEN", "blockly-MATH_IS_NEGATIVE", "blockly-MATH_IS_ODD", "blockly-MATH_IS_POSITIVE", "blockly-MATH_IS_PRIME", "blockly-MATH_IS_TOOLTIP", "blockly-MATH_IS_WHOLE", "blockly-MATH_MODULO_TITLE", "blockly-MATH_MODULO_TOOLTIP", "blockly-MATH_MULTIPLICATION_SYMBOL_ARIA", "blockly-MATH_NUMBER_TOOLTIP"];
for (const key of blocklyArithmetic) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const literal of ['π (3.141…)', 'e (2.718…)', 'φ (1.618…)', 'sqrt(2) (1.414…)', 'sqrt(½) (0.707…)', '∞']) assert.ok(papiamento['blockly-MATH_CONSTANT_TOOLTIP'].includes(literal));
assert.match(papiamento['blockly-MATH_ATAN2_TITLE'], /atan2.*X:%1 Y:%2/);
assert.match(papiamento['blockly-MATH_ATAN2_TOOLTIP'], /\(X, Y\).*grado.*-180 te 180/);
assert.match(papiamento['blockly-MATH_CONSTRAIN_TOOLTIP'], /inkluyendo e límitenan mes/);
assert.match(papiamento['blockly-MATH_MODULO_TITLE'], /%1 ÷ %2/);
assert.equal(papiamento['blockly-MATH_IS_EVEN'], 'ta par');
assert.equal(papiamento['blockly-MATH_IS_ODD'], 'ta impar');
assert.match(papiamento['blockly-MATH_IS_NEGATIVE'], /negativo/);
assert.match(papiamento['blockly-MATH_IS_POSITIVE'], /positivo/);

const blocklyStatistics = ["blockly-MATH_ONLIST_OPERATOR_AVERAGE", "blockly-MATH_ONLIST_OPERATOR_MAX", "blockly-MATH_ONLIST_OPERATOR_MAX_ARIA", "blockly-MATH_ONLIST_OPERATOR_MEDIAN", "blockly-MATH_ONLIST_OPERATOR_MIN", "blockly-MATH_ONLIST_OPERATOR_MIN_ARIA", "blockly-MATH_ONLIST_OPERATOR_MODE", "blockly-MATH_ONLIST_OPERATOR_RANDOM", "blockly-MATH_ONLIST_OPERATOR_STD_DEV", "blockly-MATH_ONLIST_OPERATOR_SUM", "blockly-MATH_ONLIST_TOOLTIP_AVERAGE", "blockly-MATH_ONLIST_TOOLTIP_MAX", "blockly-MATH_ONLIST_TOOLTIP_MEDIAN", "blockly-MATH_ONLIST_TOOLTIP_MIN", "blockly-MATH_ONLIST_TOOLTIP_MODE", "blockly-MATH_ONLIST_TOOLTIP_RANDOM", "blockly-MATH_ONLIST_TOOLTIP_STD_DEV", "blockly-MATH_ONLIST_TOOLTIP_SUM", "blockly-MATH_POWER_SYMBOL_ARIA", "blockly-MATH_RANDOM_FLOAT_TITLE_RANDOM", "blockly-MATH_RANDOM_FLOAT_TOOLTIP", "blockly-MATH_RANDOM_INT_TITLE", "blockly-MATH_RANDOM_INT_TOOLTIP", "blockly-MATH_ROUND_OPERATOR_ROUND", "blockly-MATH_ROUND_OPERATOR_ROUNDDOWN", "blockly-MATH_ROUND_OPERATOR_ROUNDUP", "blockly-MATH_ROUND_TOOLTIP", "blockly-MATH_SINGLE_OP_ABSOLUTE", "blockly-MATH_SINGLE_OP_ABSOLUTE_ARIA", "blockly-MATH_SINGLE_OP_EXP_ARIA", "blockly-MATH_SINGLE_OP_LN_ARIA", "blockly-MATH_SINGLE_OP_LOG10_ARIA"];
for (const key of blocklyStatistics) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.match(papiamento['blockly-MATH_RANDOM_FLOAT_TOOLTIP'], /0\.0 \(inkluí\).*1\.0 \(ekskluí\)/);
assert.match(papiamento['blockly-MATH_RANDOM_INT_TOOLTIP'], /inkluyendo tur dos límite/);
assert.match(papiamento['blockly-MATH_ROUND_OPERATOR_ROUNDDOWN'], /pa abou/);
assert.match(papiamento['blockly-MATH_ROUND_OPERATOR_ROUNDUP'], /pa ariba/);
assert.match(papiamento['blockly-MATH_ONLIST_TOOLTIP_MAX'], /mas grandi/);
assert.match(papiamento['blockly-MATH_ONLIST_TOOLTIP_MIN'], /mas chikí/);
assert.match(papiamento['blockly-MATH_ONLIST_TOOLTIP_MODE'], /un lista.*mas frekuentemente/);
assert.match(papiamento['blockly-MATH_ONLIST_TOOLTIP_AVERAGE'], /media aritmétiko/);
assert.match(papiamento['blockly-MATH_ONLIST_TOOLTIP_MEDIAN'], /mediana/);
assert.match(papiamento['blockly-MATH_SINGLE_OP_LOG10_ARIA'], /base 10/);
assert.match(papiamento['blockly-MATH_SINGLE_OP_EXP_ARIA'], /^e /);

const blocklyTrig = ["blockly-MATH_SINGLE_OP_NEG_ARIA", "blockly-MATH_SINGLE_OP_POW10_ARIA", "blockly-MATH_SINGLE_OP_ROOT", "blockly-MATH_SINGLE_TOOLTIP_ABS", "blockly-MATH_SINGLE_TOOLTIP_EXP", "blockly-MATH_SINGLE_TOOLTIP_LN", "blockly-MATH_SINGLE_TOOLTIP_LOG10", "blockly-MATH_SINGLE_TOOLTIP_NEG", "blockly-MATH_SINGLE_TOOLTIP_POW10", "blockly-MATH_SINGLE_TOOLTIP_ROOT", "blockly-MATH_SUBTRACTION_SYMBOL_ARIA", "blockly-MATH_TRIG_ACOS_ARIA", "blockly-MATH_TRIG_ASIN_ARIA", "blockly-MATH_TRIG_ATAN_ARIA", "blockly-MATH_TRIG_COS_ARIA", "blockly-MATH_TRIG_SIN_ARIA", "blockly-MATH_TRIG_TAN_ARIA", "blockly-MATH_TRIG_TOOLTIP_ACOS", "blockly-MATH_TRIG_TOOLTIP_ASIN", "blockly-MATH_TRIG_TOOLTIP_ATAN", "blockly-MATH_TRIG_TOOLTIP_COS", "blockly-MATH_TRIG_TOOLTIP_SIN", "blockly-MATH_TRIG_TOOLTIP_TAN", "blockly-MINIMAP_ARIA_LABEL", "blockly-MOVE_BLOCK", "blockly-NEW_COLOUR_VARIABLE", "blockly-NEW_NUMBER_VARIABLE", "blockly-NEW_STRING_VARIABLE", "blockly-NEW_VARIABLE", "blockly-NEW_VARIABLE_TITLE", "blockly-NEW_VARIABLE_TYPE_TITLE", "blockly-NO_PARENT_ANNOUNCEMENT", "blockly-OPEN_BACKPACK", "blockly-OPEN_TRASH", "blockly-OPTION_KEY", "blockly-PAGE_DOWN_KEY", "blockly-PAGE_UP_KEY", "blockly-PARENT_BLOCKS_ANNOUNCEMENT", "blockly-PASTE_ALL_FROM_BACKPACK", "blockly-PASTE_SHORTCUT", "blockly-PAUSE_KEY", "blockly-PROCEDURES_ALLOW_STATEMENTS"];
for (const key of blocklyTrig) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const operation of ['COS', 'SIN', 'TAN']) {
  assert.match(papiamento[`blockly-MATH_TRIG_TOOLTIP_${operation}`], /grado \(no radián\)/);
  assert.notEqual(papiamento[`blockly-MATH_TRIG_${operation}_ARIA`], papiamento[`blockly-MATH_TRIG_A${operation}_ARIA`]);
}
assert.match(papiamento['blockly-MATH_SINGLE_TOOLTIP_LOG10'], /base 10/);
assert.match(papiamento['blockly-MATH_SINGLE_TOOLTIP_EXP'], /e elevá/);
assert.match(papiamento['blockly-MATH_SINGLE_TOOLTIP_POW10'], /10 elevá/);
assert.match(papiamento['blockly-MATH_SINGLE_TOOLTIP_NEG'], /signo invertí/);
assert.match(papiamento['blockly-NO_PARENT_ANNOUNCEMENT'], /no tin/);
assert.match(papiamento['blockly-PAGE_DOWN_KEY'], /abou.*Page Down/);
assert.match(papiamento['blockly-PAGE_UP_KEY'], /ariba.*Page Up/);

const blocklyProcedures = ["blockly-PROCEDURES_BEFORE_PARAMS", "blockly-PROCEDURES_CALLNORETURN_TOOLTIP", "blockly-PROCEDURES_CALLRETURN_TOOLTIP", "blockly-PROCEDURES_CALL_BEFORE_PARAMS", "blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING", "blockly-PROCEDURES_CREATE_DO", "blockly-PROCEDURES_DEFNORETURN_COMMENT", "blockly-PROCEDURES_DEFNORETURN_PROCEDURE", "blockly-PROCEDURES_DEFNORETURN_TOOLTIP", "blockly-PROCEDURES_DEFRETURN_RETURN", "blockly-PROCEDURES_DEFRETURN_TOOLTIP", "blockly-PROCEDURES_DEF_DUPLICATE_WARNING", "blockly-PROCEDURES_HIGHLIGHT_DEF", "blockly-PROCEDURES_IFRETURN_TOOLTIP", "blockly-PROCEDURES_IFRETURN_WARNING", "blockly-PROCEDURES_MUTATORARG_TITLE", "blockly-PROCEDURES_MUTATORARG_TOOLTIP", "blockly-PROCEDURES_MUTATORCONTAINER_TITLE", "blockly-PROCEDURES_MUTATORCONTAINER_TOOLTIP", "blockly-REDO", "blockly-REMOVE_FROM_BACKPACK", "blockly-RENAME_VARIABLE", "blockly-RENAME_VARIABLE_TITLE", "blockly-RESET_ZOOM", "blockly-SCREENREADER_HINT", "blockly-SCREENREADER_MODE_DISABLED", "blockly-SCREENREADER_MODE_ENABLED", "blockly-SHIFT_KEY"];
for (const key of blocklyProcedures) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.match(papiamento['blockly-PROCEDURES_DEFNORETURN_TOOLTIP'], /sin resultado/);
assert.match(papiamento['blockly-PROCEDURES_DEFRETURN_TOOLTIP'], /ku resultado/);
assert.match(papiamento['blockly-PROCEDURES_CALLRETURN_TOOLTIP'], /usa su resultado/);
assert.doesNotMatch(papiamento['blockly-PROCEDURES_CALLNORETURN_TOOLTIP'], /usa su resultado/);
assert.match(papiamento['blockly-PROCEDURES_CALL_DISABLED_DEF_WARNING'], /No por ehekutá.*desaktivá/);
assert.match(papiamento['blockly-PROCEDURES_IFRETURN_WARNING'], /solamente den un definishon di funshon/);
assert.match(papiamento['blockly-RENAME_VARIABLE_TITLE'], /tur variabel '%1'/);
assert.match(papiamento['blockly-SCREENREADER_MODE_DISABLED'], /ta desaktivá.*%1 pa aktiv'é/);
assert.match(papiamento['blockly-SCREENREADER_MODE_ENABLED'], /ta aktivá.*%1 pa desaktiv'é/);

const blocklyShortcuts = ["blockly-SHORTCUTS_ABORT_MOVE", "blockly-SHORTCUTS_CLEANUP", "blockly-SHORTCUTS_CODE_NAVIGATION", "blockly-SHORTCUTS_DISCONNECT", "blockly-SHORTCUTS_DUPLICATE", "blockly-SHORTCUTS_EDITING", "blockly-SHORTCUTS_ESCAPE", "blockly-SHORTCUTS_EXTENDED_INFORMATION", "blockly-SHORTCUTS_FINISH_MOVE", "blockly-SHORTCUTS_FOCUS_TOOLBOX", "blockly-SHORTCUTS_FOCUS_WORKSPACE", "blockly-SHORTCUTS_GENERAL", "blockly-SHORTCUTS_INFORMATION", "blockly-SHORTCUTS_JUMP_BLOCK_END", "blockly-SHORTCUTS_JUMP_BLOCK_START", "blockly-SHORTCUTS_JUMP_BOTTOM_STACK", "blockly-SHORTCUTS_JUMP_FIRST_BLOCK", "blockly-SHORTCUTS_JUMP_LAST_BLOCK", "blockly-SHORTCUTS_JUMP_NEXT_PAGE", "blockly-SHORTCUTS_JUMP_PREVIOUS_PAGE", "blockly-SHORTCUTS_JUMP_TOP_STACK", "blockly-SHORTCUTS_MOVE_DOWN", "blockly-SHORTCUTS_MOVE_LEFT", "blockly-SHORTCUTS_MOVE_RIGHT", "blockly-SHORTCUTS_MOVE_UP", "blockly-SHORTCUTS_NEXT_HEADING", "blockly-SHORTCUTS_NEXT_STACK", "blockly-SHORTCUTS_PERFORM_ACTION", "blockly-SHORTCUTS_PREVIOUS_HEADING", "blockly-SHORTCUTS_PREVIOUS_STACK", "blockly-SHORTCUTS_SCROLL_DOWN", "blockly-SHORTCUTS_SCROLL_LEFT", "blockly-SHORTCUTS_SCROLL_RIGHT", "blockly-SHORTCUTS_SCROLL_UP", "blockly-SHORTCUTS_SHOW_CONTEXT_MENU", "blockly-SHORTCUTS_SHOW_TOOLTIP", "blockly-SHORTCUTS_START_MOVE", "blockly-SHORTCUTS_START_MOVE_STACK", "blockly-SHORTCUTS_TOGGLE_SCREENREADER_MODE", "blockly-SPACE_KEY", "blockly-TAB_KEY"];
for (const key of blocklyShortcuts) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const action of ['MOVE', 'SCROLL']) {
  for (const [direction, word] of Object.entries({ DOWN: 'abou', UP: 'ariba', LEFT: 'robes', RIGHT: 'drechi' })) assert.ok(papiamento[`blockly-SHORTCUTS_${action}_${direction}`].includes(word));
}
for (const [key, word] of Object.entries({ JUMP_BLOCK_START: 'kuminsamentu', JUMP_BLOCK_END: 'fin', JUMP_FIRST_BLOCK: 'promé', JUMP_LAST_BLOCK: 'último', JUMP_NEXT_PAGE: 'siguiente', JUMP_PREVIOUS_PAGE: 'anterior', ABORT_MOVE: 'Kanselá', FINISH_MOVE: 'Terminá' })) assert.ok(papiamento[`blockly-SHORTCUTS_${key}`].includes(word));
assert.match(papiamento['blockly-SPACE_KEY'], /Space/);
assert.match(papiamento['blockly-TAB_KEY'], /Tab/);
assert.notEqual(papiamento['blockly-SHORTCUTS_FOCUS_TOOLBOX'], papiamento['blockly-SHORTCUTS_FOCUS_WORKSPACE']);

const blocklyText = ["blockly-TEXT_APPEND_TITLE", "blockly-TEXT_APPEND_TOOLTIP", "blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE", "blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE", "blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE", "blockly-TEXT_CHANGECASE_TOOLTIP", "blockly-TEXT_CHARAT_FIRST", "blockly-TEXT_CHARAT_FROM_END", "blockly-TEXT_CHARAT_FROM_START", "blockly-TEXT_CHARAT_LAST", "blockly-TEXT_CHARAT_RANDOM", "blockly-TEXT_CHARAT_TITLE", "blockly-TEXT_CHARAT_TOOLTIP", "blockly-TEXT_COUNT_MESSAGE0", "blockly-TEXT_COUNT_TOOLTIP", "blockly-TEXT_CREATE_JOIN_ITEM_TOOLTIP", "blockly-TEXT_CREATE_JOIN_TITLE_JOIN", "blockly-TEXT_CREATE_JOIN_TOOLTIP", "blockly-TEXT_FROM_END_ARIA", "blockly-TEXT_FROM_START_ARIA", "blockly-TEXT_GET_SUBSTRING_END_FROM_END", "blockly-TEXT_GET_SUBSTRING_END_FROM_START", "blockly-TEXT_GET_SUBSTRING_END_LAST", "blockly-TEXT_GET_SUBSTRING_INPUT_IN_TEXT", "blockly-TEXT_GET_SUBSTRING_START_FIRST", "blockly-TEXT_GET_SUBSTRING_START_FROM_END", "blockly-TEXT_GET_SUBSTRING_START_FROM_START", "blockly-TEXT_GET_SUBSTRING_TOOLTIP", "blockly-TEXT_INDEXOF_OPERATOR_FIRST", "blockly-TEXT_INDEXOF_OPERATOR_LAST", "blockly-TEXT_INDEXOF_TITLE", "blockly-TEXT_INDEXOF_TOOLTIP", "blockly-TEXT_ISEMPTY_TITLE", "blockly-TEXT_ISEMPTY_TOOLTIP", "blockly-TEXT_JOIN_TITLE_CREATEWITH", "blockly-TEXT_JOIN_TOOLTIP", "blockly-TEXT_LENGTH_TITLE", "blockly-TEXT_LENGTH_TOOLTIP", "blockly-TEXT_PRINT_TITLE", "blockly-TEXT_PRINT_TOOLTIP", "blockly-TEXT_PROMPT_TOOLTIP_NUMBER", "blockly-TEXT_PROMPT_TOOLTIP_TEXT", "blockly-TEXT_PROMPT_TYPE_NUMBER", "blockly-TEXT_PROMPT_TYPE_TEXT", "blockly-TEXT_REPLACE_MESSAGE0", "blockly-TEXT_REPLACE_TOOLTIP", "blockly-TEXT_REVERSE_MESSAGE0", "blockly-TEXT_REVERSE_TOOLTIP", "blockly-TEXT_TEXT_TOOLTIP", "blockly-TEXT_TRIM_OPERATOR_BOTH", "blockly-TEXT_TRIM_OPERATOR_LEFT", "blockly-TEXT_TRIM_OPERATOR_RIGHT", "blockly-TEXT_TRIM_TOOLTIP"];
for (const key of blocklyText) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const prefix of ['TEXT_CHARAT', 'TEXT_INDEXOF_OPERATOR']) {
  assert.match(papiamento[`blockly-${prefix}_FIRST`], /promé/);
  assert.match(papiamento[`blockly-${prefix}_LAST`], /último/);
}
assert.match(papiamento['blockly-TEXT_CHARAT_FROM_END'], /for di e fin/);
assert.doesNotMatch(papiamento['blockly-TEXT_CHARAT_FROM_START'], /for di e fin/);
assert.match(papiamento['blockly-TEXT_CHANGECASE_OPERATOR_LOWERCASE'], /chikí/);
assert.match(papiamento['blockly-TEXT_CHANGECASE_OPERATOR_UPPERCASE'], /GRANDI/);
assert.match(papiamento['blockly-TEXT_CHANGECASE_OPERATOR_TITLECASE'], /inisial/);
for (const [side, word] of Object.entries({ BOTH: 'tur dos', LEFT: 'robes', RIGHT: 'drechi' })) assert.ok(papiamento[`blockly-TEXT_TRIM_OPERATOR_${side}`].includes(word));
assert.match(papiamento['blockly-TEXT_LENGTH_TOOLTIP'], /inklusivo espasio/);
assert.match(papiamento['blockly-TEXT_INDEXOF_TOOLTIP'], /%1 si no haña/);
assert.match(papiamento['blockly-TEXT_REPLACE_TOOLTIP'], /tur aparishon/);

const blocklyFinal = ["blockly-TODAY", "blockly-UNDO", "blockly-UNKNOWN", "blockly-UNNAMED_KEY", "blockly-VARIABLES_DEFAULT_NAME", "blockly-VARIABLES_GET_CREATE_SET", "blockly-VARIABLES_GET_TOOLTIP", "blockly-VARIABLES_SET", "blockly-VARIABLES_SET_CREATE_GET", "blockly-VARIABLES_SET_TOOLTIP", "blockly-VARIABLE_ALREADY_EXISTS", "blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE", "blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER", "blockly-WORKSPACE_COMMENT_DEFAULT_TEXT", "blockly-WORKSPACE_CONTENTS_BLOCKS_MANY", "blockly-WORKSPACE_CONTENTS_BLOCKS_ONE", "blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO", "blockly-WORKSPACE_CONTENTS_COMMENTS_MANY", "blockly-WORKSPACE_CONTENTS_COMMENTS_ONE", "blockly-WORKSPACE_LABEL_1_STACK", "blockly-WORKSPACE_LABEL_FLYOUT_WORKSPACE", "blockly-WORKSPACE_LABEL_MANY_STACKS", "blockly-WORKSPACE_LABEL_MUTATOR_WORKSPACE", "blockly-WORKSPACE_LABEL_PLAIN", "blockly-WORKSPACE_SEARCH_CLOSE", "blockly-WORKSPACE_SEARCH_FIND_NEXT", "blockly-WORKSPACE_SEARCH_FIND_PREVIOUS", "blockly-WORKSPACE_SEARCH_INPUT_LABEL", "blockly-WORKSPACE_SEARCH_MATCH", "blockly-WORKSPACE_SEARCH_NO_MATCHES", "blockly-WORKSPACE_SEARCH_PLACEHOLDER", "blockly-ZOOM_TO_FIT_ARIA_LABEL", "blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF", "blockly-CONTROLS_IF_ELSE_TITLE_ELSE", "blockly-LISTS_CREATE_WITH_ITEM_TITLE", "blockly-LISTS_GET_INDEX_INPUT_IN_LIST", "blockly-LISTS_GET_SUBLIST_INPUT_IN_LIST", "blockly-LISTS_INDEX_OF_INPUT_IN_LIST", "blockly-LISTS_SET_INDEX_INPUT_IN_LIST", "blockly-MATH_CHANGE_TITLE_ITEM", "blockly-PROCEDURES_DEFRETURN_COMMENT", "blockly-PROCEDURES_DEFRETURN_PROCEDURE", "blockly-TEXT_APPEND_VARIABLE", "blockly-TEXT_CREATE_JOIN_ITEM_TITLE_ITEM"];
for (const key of blocklyFinal) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.match(papiamento['blockly-WORKSPACE_SEARCH_FIND_NEXT'], /siguiente/);
assert.match(papiamento['blockly-WORKSPACE_SEARCH_FIND_PREVIOUS'], /anterior/);
assert.match(papiamento['blockly-WORKSPACE_SEARCH_INPUT_LABEL'], /Enter.*siguiente.*Shift\+Enter.*anterior.*Escape.*sera/);
assert.match(papiamento['blockly-WORKSPACE_CONTENTS_BLOCKS_ZERO'], /^Ningun/);
assert.match(papiamento['blockly-WORKSPACE_CONTENTS_BLOCKS_ONE'], /^Un /);
for (const key of ['MANY', 'ONE']) assert.match(papiamento[`blockly-WORKSPACE_CONTENTS_COMMENTS_${key}`], /^ i /);
assert.match(papiamento['blockly-VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'], /otro tipo: '%2'/);
assert.match(papiamento['blockly-VARIABLE_ALREADY_EXISTS_FOR_A_PARAMETER'], /parámetro.*'%2'/);
for (const key of ['COMMENT', 'PROCEDURE']) assert.equal(papiamento[`blockly-PROCEDURES_DEFRETURN_${key}`], papiamento[`blockly-PROCEDURES_DEFNORETURN_${key}`]);
assert.notEqual(papiamento['blockly-CONTROLS_IF_ELSEIF_TITLE_ELSEIF'], papiamento['blockly-CONTROLS_IF_ELSE_TITLE_ELSE']);
const remainingPapiamento = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'), '--list', 'pap',
], { cwd: root, encoding: 'utf8' });
assert.equal(remainingPapiamento.status, 0, remainingPapiamento.stderr);
assert.deepEqual(Object.keys(JSON.parse(remainingPapiamento.stdout)).filter(key => key.startsWith('blockly-')), [], 'all current Blockly messages are translated');

const settingsAndRules = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "login-origin-mismatch", "card-field-visibility", "card-field-visibility-desc", "r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload"];
for (const key of settingsAndRules) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const key of ['external-link-rules-description', 'external-link-identifier-aliases']) {
  const braceTokens = value => [...value.matchAll(/\{(?:number|identifier)\}/g)].map(match => match[0]).sort();
  assert.deepEqual(braceTokens(papiamento[key]), braceTokens(english[key]));
}
assert.ok(papiamento['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(papiamento['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(papiamento['ldap-sync-now-nothing'].includes(name));
assert.match(papiamento['login-origin-mismatch'], /ROOT_URL/);
assert.equal(papiamento['r-assignee'], papiamento.assignee.toLowerCase());
assert.match(papiamento['r-moved-forward'], /dilanti.*despues/);
assert.match(papiamento['r-moved-back'], /bèk.*promé/);
assert.match(papiamento['read-only-field'], /solamente administradónan/);
assert.match(papiamento['r-remove-all-assignees'], /tur enkargá/);
assert.match(papiamento['r-blocks-invalid'], /eksaktamente un disparador ku un akshon/);
assert.match(papiamento['r-blocks-unsaved'], /no ta wardá/);
assert.doesNotMatch(papiamento['r-blocks-saved'], /no ta/);
assert.match(papiamento['ldap-sync-now-done'], /terminá/);
assert.match(papiamento['ldap-sync-now-error'], /faya: %s/);
assert.match(papiamento['oauth-providers-allowed-email-domains'], /bashí ta permití tur/);

const importsAndScrum = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-todoist", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-release-scope", "scrum-releases-select-help", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria"];
for (const key of importsAndScrum) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
for (const [format, literals] of Object.entries({
  opml: ['OPML', 'Workflowy', 'Dynalist', 'OmniOutliner', 'Logseq'],
  orgmode: ['Org mode', 'Emacs', 'Orgzly', 'Beorg', 'TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED'],
  todoist: ['Todoist', 'CSV', '@labels', 'p1', 'p3'],
})) for (const literal of literals) assert.ok(papiamento[`import-board-instruction-${format}`].includes(literal), literal);
assert.match(papiamento['import-board-instruction-opml'], /nota komo deskripshon/);
assert.match(papiamento['import-board-instruction-todoist'], /notanan ta bira komentario/);
assert.equal(papiamento['board-view-product-backlog'], papiamento['scrum-product-backlog']);
assert.equal(papiamento['board-view-sprints'], papiamento['scrum-sprints']);
assert.match(papiamento['scrum-start-sprint'], /Kuminsá/);
assert.match(papiamento['scrum-close-sprint'], /Sera/);
assert.match(papiamento['scrum-cancel-sprint'], /Kanselá/);
assert.match(papiamento['scrum-rollover-sprint'], /sin terminá/);
assert.match(papiamento['scrum-policy-dueComplete'], /marká komo kompletá/);
assert.match(papiamento['scrum-policy-doneLists'], /lista.*kategoria/);
for (const literal of ['Ctrl', 'Cmd', 'Mac']) assert.ok(papiamento['scrum-releases-select-help'].includes(literal));
assert.match(papiamento['scrum-releases-select-help'], /kita tur selekshon.*tur vershon/);

const scrumReports = ["scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "scrum-import-into-board"];
for (const key of scrumReports) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.equal(new Set(['planned', 'active', 'closed', 'cancelled'].map(state => papiamento[`scrum-state-${state}`])).size, 4);
assert.match(papiamento['scrum-added'], /Agregá/);
assert.match(papiamento['scrum-removed'], /Kitá/);
assert.match(papiamento['scrum-confirm-close'], /sin terminá.*destino selektá/);
assert.match(papiamento['scrum-confirm-cancel'], /keda den e sprint.*asigná atrobe/);
assert.match(papiamento['scrum-partial-report'], /solamente.*asigná na bo/);
assert.match(papiamento['scrum-report-help'], /no ta estimashon di zero/);
for (const suffix of ['help', 'export-help']) {
  const text = papiamento[`scrum-daily-observations-${suffix}`];
  assert.match(text, /UTC/);
  assert.match(text, /no ta registrá tur kambio/);
  assert.match(text, /no ta zero/);
}
assert.match(papiamento['scrum-daily-truncated'], /366/);
assert.match(papiamento['scrum-import-pending'], /inkompleto.*No por editá Scrum ni eksportá rapòrt/);
assert.equal(papiamento['scrum-category-backlog'], papiamento['scrum-backlog']);

const importConflicts = ["scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local", "sync-conflict-creation"];
for (const key of importConflicts) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.match(papiamento['scrum-import-into-board-hint'], /nunka dupliká/);
assert.match(papiamento['scrum-import-into-board-hint'], /ID/);
assert.match(papiamento['scrum-import-invalid-file'], /no ta JSON válido/);
assert.match(papiamento['scrum-import-card-ambiguous'], /mas ku un karchi/);
assert.match(papiamento['scrum-import-card-on-another-board'], /otro tabla.*sin kambio/);
assert.match(papiamento['scrum-import-sprint-finished'], /No a move.*sprint terminá/);
assert.match(papiamento['sync-conflict-hint'], /No ta manda nada na e sistema di fuente/);
assert.match(papiamento['sync-conflict-review-complete'], /No a ehekutá.*lista kompleto/);
assert.match(papiamento['sync-conflict-detach-hint'], /Kita solamente.*kontenido ta keda den WeKan/);
assert.match(papiamento['sync-conflict-archive-hint'], /Subkarchinan no ta kambia/);
assert.match(papiamento['sync-conflict-keep-local'], /WeKan/);
assert.match(papiamento['sync-conflict-use-source'], /fuente/);
assert.notEqual(papiamento['sync-conflict-keep-local'], papiamento['sync-conflict-use-source']);

const syncPreview = ["sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention"];
for (const key of syncPreview) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.match(papiamento['sync-conflict-creation-hint'], /anterior sin kambio.*mes karchi di remplaso/);
assert.match(papiamento['sync-preview-saved'], /konfigurashon wardá.*fuente atrobe/);
assert.match(papiamento['sync-preview-blocked'], /Resolvé.*promé ku revisá/);
assert.equal(new Set(['create', 'update', 'archive'].map(action => papiamento[`sync-preview-${action}`])).size, 3);
for (const suffix of ['unmapped', 'excluded']) assert.equal(papiamento[`sync-preview-${suffix}`], papiamento[`sync-source-${suffix}`]);
assert.match(papiamento['sync-source-scope'], /balornan no ta mustrá/);
assert.match(papiamento['sync-source-fallback'], /no a usa/);
assert.match(papiamento['sync-preview-truncated'], /promé 100/);
assert.match(papiamento['sync-source-truncated'], /100 ruta/);
assert.match(papiamento['sync-report-retention'], /20 ehekushon.*30 dia/);

const syncMail = ["sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field", "sync-estimate-field-hint", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time", "sync-time-estimate-hint", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable"];
for (const key of syncMail) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.match(papiamento['sync-report-partial'], /no ta kontinuá ni deshasé/);
assert.match(papiamento['sync-report-failed'], /kambionan parsial/);
assert.match(papiamento['sync-recovery-description'], /30 dia.*ID/);
for (const key of ['sync-estimate-field-hint', 'sync-time-estimate-hint']) {
  assert.match(papiamento[key], /Jira/);
  assert.match(papiamento[key], /falta.*ignorá.*null eksplísito ta kita/);
}
assert.match(papiamento['sync-time-estimate-hint'], /eksaktamente un kampo/);
assert.match(papiamento['email-failure-smtp-temporary'], /temporal.*SMTP/);
assert.match(papiamento['email-failure-smtp-rejected'], /permanente.*SMTP/);
assert.match(papiamento['email-failure-delivery-unconfirmed'], /revisá promé ku purba/);
assert.match(papiamento['sync-original-time'], /original/);
assert.match(papiamento['sync-remaining-time'], /restante/);
assert.match(papiamento['sync-planning-hint'], /promé pa su ID.*despues pa nòmber/);
assert.match(papiamento['sync-planning-hint'], /promé sinkronisashon nunka ta kita/);
assert.match(papiamento['activity-recovery-description'], /nunka ta krea un aktividat di nobo/);

const notificationRecovery = ["activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-unavailable", "stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-progress", "stuck-sync-operation-reason", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed"];
for (const key of notificationRecovery) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.match(papiamento['activity-recovery-status-missing'], /ta falta/);
assert.match(papiamento['activity-recovery-status-changed'], /a kambia/);
assert.match(papiamento['activity-recovery-source-unavailable'], /No a krea nada di nobo/);
assert.match(papiamento['activity-recovery-failed'], /Trabou pendiente a keda wardá/);
assert.equal(new Set(['pause', 'resume', 'cancel'].map(action => papiamento[`activity-recovery-${action}`])).size, 3);
assert.match(papiamento['activity-recovery-cancel-confirm'], /permanentemente.*No por kontinuá/);
assert.match(papiamento['activity-recovery-cancel-confirm'], /entregá no ta wordu retirá/);
assert.match(papiamento['activity-recovery-control-conflict'], /Revisá.*promé ku purba atrobe/);
assert.match(papiamento['stuck-sync-operation-description'], /kambionan apliká kaba ta keda/);
assert.match(papiamento['stuck-sync-operation-description'], /restante nunka ta wordu skirbí/);
assert.match(papiamento['stuck-sync-operation-description'], /kompará e lista ku su fuente atrobe/);

const finalRecovery = ["stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-refresh", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy", "stuck-sync-operation-failed", "interrupted-import-heading", "interrupted-import-description", "interrupted-import-board", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-scrum", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-discard", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-refresh", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "interrupted-import-scrum-busy", "interrupted-import-failed", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const key of finalRecovery) {
  assert.notEqual(papiamento[key], english[key], key);
  assert.deepEqual(tokens(papiamento[key]), tokens(english[key]), key);
}
assert.match(papiamento['stuck-sync-operation-discard-confirm'], /apliká kaba ta keda.*restu nunka ta wordu skirbí/);
assert.match(papiamento['stuck-sync-operation-replayable-now'], /no por deskart/);
assert.match(papiamento['stuck-sync-operation-replayable'], /no a wordu deskartá/);
assert.match(papiamento['interrupted-import-description'], /fail di fuente no ta wordu wardá/);
assert.match(papiamento['interrupted-import-description'], /inklusivo loke a wordu agregá despues/);
assert.match(papiamento['interrupted-import-keep-confirm'], /No ta kita nada/);
assert.match(papiamento['interrupted-import-discard-confirm'], /kitá permanentemente/);
assert.match(papiamento['interrupted-import-foreign-board'], /no a wordu toká/);
for (const prefix of ['stuck-sync-operation', 'interrupted-import']) assert.match(papiamento[`${prefix}-truncated`], /50 mas bieu/);
assert.match(papiamento['scrum-history-checkpoint-hint'], /ningun otro hende a kambia/);
assert.match(papiamento['login-setting-env-only'], /Solamente e ambiente di servidor.*solamente pa lesa/);
assert.deepEqual(JSON.parse(remainingPapiamento.stdout), {}, 'the full current Papiamento fill list is empty');

// Current import/link/delivery controls, including short At/To prose.
assert.match(papiamento['custom-field-links-hint'], /mesun nòmber i tipo/);
assert.match(papiamento['custom-field-links-hint'], /solamente un karchi tin ta keda sin kambio/);
assert.match(papiamento['custom-field-link-sends'], /e karchi aki.*e karchi ei/);
assert.match(papiamento['custom-field-link-receives'], /e karchi ei.*e karchi aki/);
assert.match(papiamento['custom-field-link-inactive'], /no por editá tur dos karchi mas, òf un karchi ta arkivá/);
assert.match(papiamento['field-link-not-allowed'], /permiso pa editá tur dos karchi/);
assert.match(papiamento['attached-card-unavailable'], /bo no por mira/);
assert.match(papiamento['attach-card-self'], /no por.*na su mes/);
assert.equal(papiamento['import-members-mode-me'], 'Usa mi na lugá di tur e personanan');
assert.match(papiamento['import-many-boards-hint'], /sin asigná miembronan/);
assert.match(papiamento['import-many-boards-hint'], /mes ta un solo eksportashon.*ta un solo tabla/);
assert.match(papiamento['import-many-boards-hint'], /en bes di e kampo ariba/);
assert.match(papiamento['csv-mapping-skipped-sheets'], /no ta wordu importá/);
assert.match(papiamento['webhook-hide-identity'], /^No inkluí mi nòmber/);
assert.match(papiamento['subtask-mark-not-done'], /komo no kompletá/);
assert.match(papiamento['subtask-done-no-permission'], /^Bo no por kambia/);
for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows', 'JSON']) {
  assert.ok(papiamento['r-wrike-workflow-note'].includes(literal), literal);
}
assert.match(papiamento['r-wrike-workflow-note'], /reglanan di automatisashon propio di Wrike no por wordu eksportá/);
assert.equal(papiamento['notification-delivery-daily-time'], 'Na ora');
assert.equal(papiamento['notification-delivery-quiet-to'], 'Te');
assert.match(papiamento['notification-delivery-quiet'], /warda te ora nan kaba/);
console.log('Papiamento current import identities, link directions, permissions and delivery controls pass.');

// Reject the mixed Spanish seed and keep the original permission boundaries.
for (const key of ['map-to-existing-user-desc', 'org-admins-description', 'roles-info', 'dueCardsViewChange-choice-all-description', 'globalSearchViewChange-choice-all-description']) {
  assert.doesNotMatch(papiamento[key], /Elige|pueden|tienes|Muestra|donde|realizar|restringidos|resultados|conseder/);
}
assert.match(papiamento['map-to-existing-user-desc'], /mesun ròl di e miembro importá/);
assert.match(papiamento['map-to-existing-user-desc'], /nunka por duna mas permiso ku e importashon a duna/);
assert.match(papiamento['org-admins-description'], /kopianan di seguridat, i nada mas/);
assert.match(papiamento['org-admins-description'], /nunka por duna.*henter e sitio, ni administrá un atministradó di e sitio/);
assert.match(papiamento['roles-info'], /semper tin tur e derechonan i no por wordu limitá aki/);
assert.match(papiamento['dueCardsViewChange-choice-all-description'], /no ta kompletá.*usuario tin permiso/);
assert.match(papiamento['globalSearchViewChange-choice-all-description'], /bo tin permiso.*miembro òf persona asigná/);
