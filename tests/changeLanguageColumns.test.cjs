'use strict';

// The Change Language popup should show languages in multiple columns when there is
// browser width (so as many as possible are visible), collapsing to one column when
// narrow. Guards the responsive width + auto-filling grid.
//
// Run: node tests/changeLanguageColumns.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(
  path.join(path.resolve(__dirname, '..'), 'client/components/main/popup.css'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
function block(sel) {
  const i = css.indexOf(sel + ' {');
  assert.ok(i !== -1, `missing rule: ${sel}`);
  return css.slice(i, css.indexOf('}', i));
}

test('language popup is responsively wide (not a fixed 450px)', () => {
  const p = block(".pop-over[data-popup='changeLanguagePopup']");
  assert.ok(/width:\s*100vw/.test(p), 'full viewport width');
  assert.ok(!/max-width:\s*450px/.test(p), 'no longer capped at 450px');
});

test('language list is an auto-filling multi-column grid', () => {
  const list = block(".pop-over[data-popup='changeLanguagePopup'] .pop-over-list");
  assert.ok(/display:\s*grid/.test(list), 'grid layout');
  assert.ok(/grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(100%,\s*280px\),\s*1fr\)\)/.test(list),
    'auto-fill columns (many when wide, one when narrow)');
});

console.log(`\nAll ${passed} change-language-columns tests passed`);

// Evaluate the actual popup helpers against every registry entry, not a copied map.
const vm = require('node:vm');
const { parseLanguageMetadata } = require('./lib/languageRegistrySource.cjs');
const root = path.resolve(__dirname, '..');
const rows = parseLanguageMetadata(fs.readFileSync(path.join(root, 'imports/i18n/languages.js'), 'utf8'));
const header = fs.readFileSync(path.join(root, 'client/components/users/userHeader.js'), 'utf8');
const start = header.indexOf('Template.changeLanguagePopup.helpers({');
const end = header.indexOf('Template.changeLanguagePopup.events(', start);
let helpers;
let rtl = false;
const context = {
  Template: { changeLanguagePopup: { helpers(value) { helpers = value; } } },
  TAPi18n: { getSupportedLanguages: () => rows.map(row => ({tag: row[2], name: row[3], rtl: row[4]})), getLanguage: () => 'en', isRTL: () => rtl },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'imports/i18n/languageFlags.js'), 'utf8').replace(/^export /gm, ''), context);
vm.runInContext(header.slice(start, end), context);
assert.deepEqual(Array.from(helpers.languages(), row => row.tag).sort(), rows.map(row => row[2]).sort(), 'all registered locales appear exactly once');
for (const row of rows) {
  const flags = helpers.languageFlag.call({tag: row[2]});
  assert.ok(flags && !flags.includes('undefined'), row[2]);
  if (/[-_@]/.test(row[2])) assert.ok(helpers.countryFlag.call({tag: row[2]}), `regional flag: ${row[2]}`);
  else if (!['eo', 'tlh', 'vo', 'ia'].includes(row[2])) assert.notEqual(flags, '🌐', row[2]);
}
for (const [tag, expected] of Object.entries({'es-CO':'🇨🇴 🇪🇸', 'es_CO':'🇨🇴 🇪🇸', 'fr-CA':'🇨🇦 🇫🇷', 'be-BE':'🇧🇾 🇧🇾', 've-PP':'🇷🇺 🇷🇺', 've-CC':'🇮🇹 🇮🇹', 'wa-RR':'🇵🇭 🇵🇭', 'uz-AR':'🇺🇿 🇺🇿', 'zh-GB':'🇨🇳 🇨🇳', 'eo':'🌐', 'tlh':'🌐'})) {
  const country = helpers.countryFlag.call({tag});
  const language = helpers.languageFlag.call({tag});
  assert.equal(country ? `${country} ${language}` : language, expected, tag);
}
assert.notEqual(helpers.languageFlag.call({tag:'ve-PP'}), '🇿🇦');
for (const [tag, name, languageName, regionName] of [
  ['en-BR', 'English (Brazil)', 'English', 'Brazil'],
  ['es-CO', 'Español en Colombia', 'Español', 'Colombia'],
  ['pt-BR', 'Português do Brasil', 'Português', 'Brasil'],
  ['ve-PP', 'Vepsän kelʹ', 'Vepsän kelʹ', ''],
]) {
  assert.equal(helpers.languageName.call({tag, name}), languageName);
  assert.equal(helpers.regionName.call({tag, name}), regionName);
}
assert.equal(helpers.languageFlag.call({tag: 'en-BR'}), '🇺🇸');
assert.equal(helpers.countryFlag.call({tag: 'en-BR'}), '🇧🇷');
assert.equal(helpers.countryFlag.call({tag: 'en'}), '');
assert.equal(helpers.languageDirection(), 'ltr');
rtl = true;
assert.equal(helpers.languageDirection(), 'rtl');
assert.ok(fs.readFileSync(path.join(root, 'client/components/users/userHeader.jade'), 'utf8').includes('language-flags(dir="ltr"'));
const jade = fs.readFileSync(path.join(root, 'client/components/users/userHeader.jade'), 'utf8');
assert.match(jade, /span\.emoji-icon\.language-flags[^\n]*\{\{languageFlag\}\}/);
assert.match(jade, /span\.language-region[\s\S]*?language-country-flag[^\n]*\{\{countryFlag\}\}/);
assert.doesNotMatch(jade, /language-flags[^\n]*countryFlag/);
assert.match(jade, /dir="\{\{languageDirection\}\}"/);
console.log(`changeLanguageColumns: all ${rows.length} popup locales and separate language/region flag placement verified`);

assert.match(block(".pop-over[data-popup='changeLanguagePopup'] .language-label"), /flex-direction: column/);
assert.match(block(".pop-over[data-popup='changeLanguagePopup'] .pop-over-list li > a"), /overflow: visible/);
assert.match(block(".pop-over[data-popup='changeLanguagePopup'] .pop-over-list li > a"), /white-space: normal/);
assert.match(jade, /span\.language-main-line\n\s+span\.emoji-icon\.language-flags/);
