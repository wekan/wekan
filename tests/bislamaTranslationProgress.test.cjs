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


const batch = ["card-field-visibility","card-field-visibility-desc","blockly-ALT_KEY","blockly-BACKSPACE_KEY","blockly-CANNOT_DELETE_VARIABLE_PROCEDURE","blockly-CAPS_LOCK_KEY","blockly-CHANGE_VALUE_TITLE","blockly-CLEAN_UP","blockly-CLOSE_BACKPACK","blockly-COLLAPSED_WARNINGS_WARNING","blockly-COLLAPSE_ALL","blockly-COLLAPSE_BLOCK","blockly-COLOUR_BLEND_COLOUR1","blockly-COLOUR_BLEND_COLOUR2","blockly-COLOUR_BLEND_RATIO","blockly-COLOUR_BLEND_TITLE","blockly-COLOUR_BLEND_TOOLTIP","blockly-COLOUR_PICKER_TOOLTIP","blockly-COLOUR_RANDOM_TITLE","blockly-COLOUR_RANDOM_TOOLTIP","blockly-COLOUR_RGB_BLUE","blockly-COLOUR_RGB_GREEN","blockly-COLOUR_RGB_TITLE","blockly-COLOUR_RGB_TOOLTIP","blockly-COMMAND_KEY","blockly-CONTEXT_MENU_KEY","blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK","blockly-CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE","blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK","blockly-CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE","blockly-CONTROLS_FLOW_STATEMENTS_WARNING","blockly-CONTROLS_FOREACH_TITLE","blockly-CONTROLS_FOREACH_TOOLTIP","blockly-CONTROLS_FOR_TITLE","blockly-CONTROLS_FOR_TOOLTIP","blockly-CONTROLS_IF_ELSEIF_TOOLTIP","blockly-CONTROLS_IF_ELSE_TOOLTIP","blockly-CONTROLS_IF_IF_TOOLTIP","blockly-CONTROLS_IF_MSG_ELSE","blockly-CONTROLS_IF_MSG_ELSEIF","blockly-CONTROLS_IF_TOOLTIP_1","blockly-CONTROLS_IF_TOOLTIP_2","blockly-CONTROLS_IF_TOOLTIP_3","blockly-CONTROLS_IF_TOOLTIP_4"];
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
