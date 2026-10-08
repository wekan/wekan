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
const bislama = readLocale('bi');
const { translationTokens: tokens } = require('../releases/translations/placeholder-tokens.mjs');
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'bi',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Bislama value stays translated');

assert.deepEqual(Object.keys(bislama), Object.keys(english),
  'Bislama key order follows the English source');
for (const [key, value] of Object.entries(bislama)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(bislama.accept, 'Akseptem');
assert.equal(bislama.add, 'Adem');
assert.equal(bislama.board, 'Bod');
assert.equal(bislama.card, 'Kad');
assert.equal(bislama.password, 'Paswod');
assert.equal(bislama['select-none'], 'No jusum wan samting');
assert.deepEqual(tokens(bislama['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(bislama['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(bislama['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);


const batch = ["card-field-visibility","card-field-visibility-desc","blockly-ALT_KEY","blockly-BACKSPACE_KEY","blockly-CANNOT_DELETE_VARIABLE_PROCEDURE","blockly-CAPS_LOCK_KEY","blockly-CHANGE_VALUE_TITLE","blockly-CLEAN_UP","blockly-CLOSE_BACKPACK","blockly-COLLAPSED_WARNINGS_WARNING","blockly-COLLAPSE_ALL","blockly-COLLAPSE_BLOCK","blockly-COLOUR_BLEND_COLOUR1","blockly-COLOUR_BLEND_COLOUR2","blockly-COLOUR_BLEND_RATIO","blockly-COLOUR_BLEND_TITLE","blockly-COLOUR_BLEND_TOOLTIP","blockly-COLOUR_PICKER_TOOLTIP","blockly-COLOUR_RANDOM_TITLE","blockly-COLOUR_RANDOM_TOOLTIP","blockly-COLOUR_RGB_BLUE","blockly-COLOUR_RGB_GREEN","blockly-COLOUR_RGB_TITLE","blockly-COLOUR_RGB_TOOLTIP","blockly-COMMAND_KEY","blockly-CONTEXT_MENU_KEY","blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK","blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE","blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK","blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE","blockly-CONTROLS_FLOW_STATEMENTS_WARNING","blockly-CONTROLS_FOREACH_TITLE","blockly-CONTROLS_FOREACH_TOOLTIP","blockly-CONTROLS_FOR_TITLE","blockly-CONTROLS_FOR_TOOLTIP","blockly-CONTROLS_IF_ELSEIF_TOOLTIP","blockly-CONTROLS_IF_ELSE_TOOLTIP","blockly-CONTROLS_IF_IF_TOOLTIP","blockly-CONTROLS_IF_MSG_ELSE","blockly-CONTROLS_IF_MSG_ELSEIF","blockly-CONTROLS_IF_TOOLTIP_1","blockly-CONTROLS_IF_TOOLTIP_2","blockly-CONTROLS_IF_TOOLTIP_3","blockly-CONTROLS_IF_TOOLTIP_4","blockly-CONTROLS_REPEAT_TITLE","blockly-CONTROLS_REPEAT_TOOLTIP","blockly-CONTROLS_WHILEUNTIL_OPERATOR_UNTIL","blockly-CONTROLS_WHILEUNTIL_OPERATOR_WHILE","blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL","blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE","blockly-CONTROL_KEY","blockly-COPY_ALL_TO_BACKPACK","blockly-COPY_SHORTCUT","blockly-COPY_TO_BACKPACK","blockly-CURRENT_BLOCK_ANNOUNCEMENT","blockly-CUT_SHORTCUT","blockly-DELETE_ALL_BLOCKS","blockly-DELETE_BLOCK","blockly-DELETE_VARIABLE","blockly-DELETE_VARIABLE_CONFIRMATION","blockly-DELETE_X_BLOCKS","blockly-DISABLE_BLOCK","blockly-DUPLICATE_BLOCK","blockly-DUPLICATE_COMMENT","blockly-EDIT_BLOCK_CONTENTS","blockly-EMPTY_BACKPACK","blockly-ENABLE_BLOCK","blockly-END_KEY","blockly-ENTER_KEY","blockly-ESCAPE","blockly-EXPAND_ALL","blockly-EXPAND_BLOCK","blockly-EXTERNAL_INPUTS","blockly-FIELD_BITMAP_ARIA_VALUE","blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR","blockly-FIELD_BITMAP_BUTTON_LABEL_RANDOMIZE","blockly-FIELD_BITMAP_PIXEL_LABEL","blockly-FIELD_BITMAP_PIXEL_OFF","blockly-FIELD_BITMAP_PIXEL_ON","blockly-FIELD_LABEL_EDIT_PREFIX","blockly-FIELD_LABEL_EMPTY","blockly-FIELD_LABEL_OPTION_INDEX","blockly-FIELD_LABEL_VARIABLE","blockly-FIELD_MULTILINEINPUT_FINISH_EDITING","blockly-FIELD_MULTILINEINPUT_NEW_LINE","blockly-HELP_PROMPT","blockly-HOME_KEY","blockly-ICON_LABEL_COMMENT_CLOSED","blockly-ICON_LABEL_COMMENT_OPEN","blockly-ICON_LABEL_DEFAULT","blockly-ICON_LABEL_MUTATOR_CLOSED","blockly-ICON_LABEL_MUTATOR_OPEN","blockly-ICON_LABEL_WARNING_CLOSED","blockly-ICON_LABEL_WARNING_OPEN","blockly-INLINE_INPUTS","blockly-INPUT_LABEL_CONDITION","blockly-INPUT_LABEL_CONDITION_A","blockly-INPUT_LABEL_CONDITION_B","blockly-INPUT_LABEL_EMPTY","blockly-INPUT_LABEL_END_STATEMENT","blockly-INPUT_LABEL_INDEX","blockly-INPUT_LABEL_LISTS_CREATE_WITH_ITEM","blockly-INPUT_LABEL_LISTS_DELIMITER","blockly-INPUT_LABEL_LISTS_END_POSITION","blockly-INPUT_LABEL_LISTS_LIST_FROM_TEXT","blockly-INPUT_LABEL_LISTS_POSITION","blockly-INPUT_LABEL_LISTS_REPEAT_ITEM","blockly-INPUT_LABEL_LISTS_REPEAT_NUM","blockly-INPUT_LABEL_LISTS_START_POSITION","blockly-INPUT_LABEL_LISTS_TEXT_FROM_LIST","blockly-INPUT_LABEL_LISTS_TO_CHANGE","blockly-INPUT_LABEL_LISTS_TO_CHECK","blockly-INPUT_LABEL_LISTS_VALUE_TO_SET","blockly-INPUT_LABEL_LOOP_BY","blockly-INPUT_LABEL_LOOP_FROM","blockly-INPUT_LABEL_LOOP_LIST","blockly-INPUT_LABEL_LOOP_TIMES","blockly-INPUT_LABEL_LOOP_TO","blockly-INPUT_LABEL_MATH_CHANGE_BY","blockly-INPUT_LABEL_MATH_CONSTRAIN_VALUE","blockly-INPUT_LABEL_MATH_DIVIDEND","blockly-INPUT_LABEL_MATH_DIVISOR","blockly-INPUT_LABEL_NUMBER","blockly-INPUT_LABEL_NUMBER_A","blockly-INPUT_LABEL_NUMBER_ATAN2_X","blockly-INPUT_LABEL_NUMBER_ATAN2_Y","blockly-INPUT_LABEL_NUMBER_B","blockly-INPUT_LABEL_NUMBER_LIST","blockly-INPUT_LABEL_NUMBER_MAX","blockly-INPUT_LABEL_NUMBER_MIN","blockly-INPUT_LABEL_NUMBER_TO_CHECK","blockly-INPUT_LABEL_STATEMENT","blockly-INPUT_LABEL_TEXT_APPEND","blockly-INPUT_LABEL_TEXT_END_POSITION","blockly-INPUT_LABEL_TEXT_JOIN_ITEM","blockly-INPUT_LABEL_TEXT_POSITION","blockly-INPUT_LABEL_TEXT_PROMPT_MESSAGE","blockly-INPUT_LABEL_TEXT_START_POSITION","blockly-INPUT_LABEL_TEXT_TO_CHANGE","blockly-INPUT_LABEL_TEXT_TO_CHECK","blockly-INPUT_LABEL_TEXT_TO_FIND","blockly-INPUT_LABEL_TEXT_TO_REPLACE","blockly-INPUT_LABEL_VALUE","blockly-INPUT_LABEL_VALUE_A","blockly-INPUT_LABEL_VALUE_B","blockly-INPUT_LABEL_VARIABLES_SET","blockly-INSERT_KEY","blockly-KEYBOARD_NAV_BLOCK_NAVIGATION_HINT","blockly-KEYBOARD_NAV_CONSTRAINED_MOVE_HINT","blockly-KEYBOARD_NAV_COPIED_HINT","blockly-KEYBOARD_NAV_CUT_HINT","blockly-KEYBOARD_NAV_FLYOUT_LABEL_HINT","blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT","blockly-KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT","blockly-LISTS_CREATE_EMPTY_TITLE","blockly-LISTS_CREATE_EMPTY_TOOLTIP","blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD","blockly-LISTS_CREATE_WITH_CONTAINER_TOOLTIP","blockly-LISTS_CREATE_WITH_INPUT_WITH","blockly-LISTS_CREATE_WITH_ITEM_TOOLTIP"];
for (const key of batch) {
  assert.ok(bislama[key]?.trim(), key);
  assert.notEqual(bislama[key], english[key], key);
}
assert.deepEqual(tokens(bislama['blockly-CONTROLS_FOR_TITLE']), ['%1', '%2', '%3', '%4']);
assert.deepEqual(tokens(bislama['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE']), ['%1', '%2']);
assert.match(bislama['blockly-CANNOT_DELETE_VARIABLE_PROCEDURE'], /no save tekemaot/);
assert.match(bislama['blockly-COLOUR_BLEND_TOOLTIP'], /0\.0 - 1\.0/);
assert.match(bislama['blockly-COLOUR_RGB_TOOLTIP'], /0 mo 100/);
assert.match(bislama['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK'], /Aot/);
assert.match(bislama['blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE'], /nekis raon/);
assert.match(bislama['blockly-CONTROLS_IF_TOOLTIP_4'], /no gat wan valiu.*las blok/);
for (const [color, word] of [['blue', 'blu'], ['green', 'grin'], ['red', 'red']]) {
  assert.equal(bislama['color-' + color], word);
  assert.doesNotMatch(bislama['color-' + color], /Tok blong sistem/);
}
console.log('bislamaTranslationProgress: historical catalog and new Blockly batch pass; broader language review remains');

// Screen-reader labels must retain states, operand roles and argument order.
assert.equal(bislama['blockly-FIELD_BITMAP_PIXEL_ON'], 'i laet');
assert.equal(bislama['blockly-FIELD_BITMAP_PIXEL_OFF'], 'i no laet');
assert.deepEqual(tokens(bislama['blockly-FIELD_BITMAP_ARIA_VALUE']), ['%1', '%2', '%3']);
assert.match(bislama['blockly-FIELD_BITMAP_PIXEL_LABEL'], /%1, laen %2, kolom %3/);
assert.match(bislama['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL'], /giaman/);
assert.match(bislama['blockly-CONTROLS_WHILEUNTIL_TOOLTIP_WHILE'], /tru/);
assert.notEqual(bislama['blockly-INPUT_LABEL_MATH_DIVIDEND'], bislama['blockly-INPUT_LABEL_MATH_DIVISOR']);
assert.match(bislama['blockly-INPUT_LABEL_MATH_DIVISOR'], /wetem/);
assert.match(bislama['blockly-KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT'], /Holem %1.*%2.*akseptem/);
assert.match(bislama['blockly-LISTS_CREATE_EMPTY_TOOLTIP'], /0.*no gat wan rekod/);
assert.notEqual(bislama['blockly-ICON_LABEL_WARNING_CLOSED'], bislama['blockly-ICON_LABEL_WARNING_OPEN']);
assert.notEqual(bislama['blockly-ENABLE_BLOCK'], bislama['blockly-DISABLE_BLOCK']);
