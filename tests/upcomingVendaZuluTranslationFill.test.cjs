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
