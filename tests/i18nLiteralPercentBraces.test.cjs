'use strict';
// A translation that contains a literal "%{...}" - the String Template help,
// "Use %{card.title}, ... for example %{value|urlencode}." - made the sprintf
// post-processor throw. __() retried with `postProcess: false`, which i18next
// treats as unset, and the `sprintf` option the Blaze `_` helper always passes
// re-triggered it, so the retry threw too and the page showed the raw key
// "custom-field-stringtemplate-context-hint" in every language (67 browser
// failures per browser). Runs the real __() from imports/i18n/tap.js.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

function makeTap(source) {
  const method = source.slice(source.indexOf('  __(key, options, language) {'), source.lastIndexOf('\n};'));
  const tap = vm.runInNewContext('({' + method + '})', { DEFAULT_LANGUAGE: 'en' });
  tap.current = { dep: { depend() {} } }; tap.revision = { get() {} };
  tap.toI18nCode = code => code;
  tap.i18n = i18next.createInstance().use(sprintf);
  tap.i18n.init({ initImmediate: false, lng: 'en', postProcess: ['sprintf'], resources: {
    en: { translation: { ...require('../imports/i18n/data/en.i18n.json'), formatted: 'Value %s' } },
  }, interpolation: { prefix: '__', suffix: '__' } });
  return tap;
}
const KEY = 'custom-field-stringtemplate-context-hint';
const tap = makeTap(fs.readFileSync('imports/i18n/tap.js', 'utf8'));
const english = require('../imports/i18n/data/en.i18n.json')[KEY];
assert.ok(english.includes('%{card.title}'), 'the fixture really holds a literal %{...}');

// Positive: called the way the Blaze `_` helper calls it, the text renders literally.
assert.equal(tap.__(KEY, { sprintf: [] }), english);
assert.equal(tap.__(KEY), english);
assert.equal(tap.__('custom-field-stringtemplate-format', { sprintf: [] }),
  require('../imports/i18n/data/en.i18n.json')['custom-field-stringtemplate-format']);
// Negative: real sprintf formatting still applies where it parses.
assert.equal(tap.__('formatted', { sprintf: ['ok'] }), 'Value ok');
assert.equal(tap.__('formatted', 'ok'), 'Value ok');

// Every locale: never the raw key for a %{...} text.
let locales = 0;
for (const filename of fs.readdirSync('imports/i18n/data').filter(name => name.endsWith('.i18n.json'))) {
  const code = filename.slice(0, -'.i18n.json'.length);
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join('imports/i18n/data', filename), 'utf8')); } catch { continue; }
  if (typeof data[KEY] !== 'string') continue;
  tap.i18n.addResourceBundle(code, 'translation', data, true, true);
  assert.notEqual(tap.__(KEY, { sprintf: [] }, code), KEY, code);
  locales += 1;
}

// Negative: the previous retry (`postProcess: false`, sprintf kept) did return the key.
const before = fs.readFileSync('imports/i18n/tap.js', 'utf8').replace(
  /const \{ sprintf: _positional, \.\.\.literal \} = opts;\s*try \{\s*return this\.i18n\.t\(key, \{ \.\.\.literal, postProcess: \[\] \}\);/,
  'try { return this.i18n.t(key, { ...opts, postProcess: false });');
assert.notEqual(before, fs.readFileSync('imports/i18n/tap.js', 'utf8'), 'the old retry was reconstructed');
assert.equal(makeTap(before).__(KEY, { sprintf: [] }), KEY, 'the old retry showed the raw key');

console.log(`i18nLiteralPercentBraces: literal %{...} help renders in en and ${locales} locales; the old retry fails`);
