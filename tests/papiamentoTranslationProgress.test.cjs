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
