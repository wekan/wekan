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
