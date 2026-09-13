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
for (const [browser, expected] of Object.entries({vep:'ve-PP', vec:'ve-CC', vls:'vl-SS', war:'wa-RR', 'es-419':'es-LA', 'be-BY':'be-BE', 'uz-Arab-UZ':'uz-AR', 'uz-Latn-UZ':'uz-LA', 'zh-Hant-TW':'zh-Hant', 'fr-CA-u-ca-gregory':'fr-CA', 'en-AU':'en_AU', iw:'he', in:'id', no:'nb', yue:'yue_CN', 'yue-HK':'yue_CN', wuu:'wuu-Hans', 'zh-MO':'zh-Hant'})) {
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

// Exercise the actual startup autorun with controlled profile/browser inputs.
const vm = require('node:vm');
let profile;
let browser = {languages:['zz-ZZ','fr-CA']};
const callbacks = [];
const startup = [];
const selections = [];
let languageChange;
const client = fs.readFileSync(path.join(__dirname, '../client/lib/i18n.js'), 'utf8').replace(/^import .*;$/gm, '');
vm.runInNewContext(client, {
  require: () => ({preferredLanguage}),
  Meteor: {startup(callback) {startup.push(callback);}},
  Tracker: {autorun(callback) {callbacks.push(callback); callback();}},
  ReactiveCache: {getCurrentUser: () => profile},
  TAPi18n: {resolveTag:resolve, setLanguage: language => selections.push(language), getLanguage:()=>'en', getLanguageDirection:()=>'ltr'},
  navigator:browser, window:{addEventListener(name, callback) {assert.equal(name,'languagechange'); languageChange=callback;}},
  console,
});
startup.forEach(callback => callback());
assert.equal(selections.at(-1), 'fr-CA');
profile = {profile:{language:'de'}};
callbacks.at(-1)();
assert.equal(selections.at(-1), 'de');
browser.languages = ['vep'];
languageChange();
assert.equal(selections.at(-1), 'de');
profile = {profile:{}};
callbacks.at(-1)();
assert.equal(selections.at(-1), 've-PP');
assert.equal(profile.profile.language, undefined, 'browser detection never saves a preference');
console.log('browserLanguageFallback: actual startup, resumed profile and languagechange checks passed');
