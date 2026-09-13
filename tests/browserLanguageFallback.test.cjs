'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseLanguageMetadata } = require('./lib/languageRegistrySource.cjs');
const { matchBrowserLanguage, preferredLanguage } = require('../imports/i18n/browserLanguage');
const rows = parseLanguageMetadata(fs.readFileSync(path.join(__dirname, '../imports/i18n/languages.js'), 'utf8'));
const normalize = tag => tag.toLowerCase().replace(/_/g, '-');
const resolve = value => rows.find(row => row[2] === value)?.[2] || rows.find(row => normalize(row[2]) === normalize(value))?.[2];
for (const row of rows) {
  assert.equal(matchBrowserLanguage(row[2], resolve), row[2]);
  const browserTag = row[2].replace(/_/g, '-');
  assert.equal(normalize(matchBrowserLanguage(browserTag.toLowerCase(), resolve)), normalize(row[2]));
}
for (const [browser, expected] of Object.entries({vep:'ve-PP', vec:'ve-CC', vls:'vl-SS', war:'wa-RR', 'es-419':'es-LA', 'be-BY':'be-BE', 'uz-Arab-UZ':'uz-AR', 'uz-Latn-UZ':'uz-LA', 'zh-Hant-TW':'zh-Hant', 'fr-CA-u-ca-gregory':'fr-CA', 'en-AU':'en_AU', iw:'he', in:'id', no:'nb'})) {
  assert.equal(matchBrowserLanguage(browser, resolve), expected, browser);
}
assert.equal(preferredLanguage(undefined, {languages:['zz-ZZ','fr-CA','de']}, resolve), 'fr-CA');
assert.equal(preferredLanguage('', {language:'es-CO'}, resolve), 'es-CO');
assert.equal(preferredLanguage('de', {languages:['fr-CA']}, resolve), 'de');
assert.equal(preferredLanguage('unsupported', {languages:['fr-CA']}, resolve), 'fr-CA');
assert.equal(preferredLanguage(undefined, {languages:['unsupported']}, resolve), 'en');
assert.equal(preferredLanguage(undefined, {userLanguage:'fi-FI'}, resolve), 'fi');
assert.equal(matchBrowserLanguage(null, resolve), undefined);
assert.notEqual(matchBrowserLanguage('vep', resolve), 've');
console.log(`browserLanguageFallback: ${rows.length} registry locales, standard aliases, ordered preferences and saved-profile precedence passed`);
