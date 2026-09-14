'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const source = fs.readFileSync('imports/i18n/tap.js', 'utf8');
// Execute the actual translation method with the installed formatter.
const method = source.slice(source.indexOf('  __(key, options, language) {'), source.lastIndexOf('\n};'));
const tap = vm.runInNewContext('({' + method + '})', { DEFAULT_LANGUAGE: 'en' });
tap.current = { dep: { depend() {} } }; tap.revision = { get() {} };
tap.toI18nCode = code => code;
tap.i18n = i18next.createInstance().use(sprintf);
tap.i18n.init({ initImmediate: false, lng: 'zgh', postProcess: ['sprintf'], resources: {
  zgh: { translation: { ...require('../imports/i18n/data/zgh.i18n.json'), named: '__name__', number: '%d' } },
  en: { translation: { fallback: 'Fallback %s' } },
}, interpolation: { prefix: '__', suffix: '__' } });
for (const value of ['abc', '-2', '50%']) {
  const rendered = tap.__('operator-limit-invalid', value);
  assert.ok(rendered.startsWith(value + ': '));
  assert.ok(!rendered.includes('%s'));
}
assert.equal(tap.__('number', 0), '0');
assert.equal(tap.__('named', { name: 'Ada' }), 'Ada');
assert.ok(tap.__('operator-limit-invalid', { sprintf: ['abc'] }).startsWith('abc: '));
assert.equal(tap.__('fallback', 'value'), 'Fallback value');
assert.doesNotThrow(() => tap.__('operator-limit-invalid', null));
assert.equal(tap.__('missing', undefined), 'missing');

// Cover the repaired scalar argument path across every existing locale.
const path = require('node:path');
let localeCount = 0;
for (const filename of fs.readdirSync('imports/i18n/data').filter(name => name.endsWith('.i18n.json'))) {
  const code = filename.slice(0, -'.i18n.json'.length);
  const data = JSON.parse(fs.readFileSync(path.join('imports/i18n/data', filename), 'utf8'));
  const label = data['operator-limit-invalid'];
  assert.equal((label.match(/%s/g) || []).length, 1, code);
  tap.i18n.addResourceBundle(code, 'translation', data, true, true);
  const actual = tap.__('operator-limit-invalid', 'invalid-limit-50%', code);
  assert.equal(actual, label.replace('%s', 'invalid-limit-50%'), code);
  localeCount += 1;
}
console.log(`i18nPositionalArguments: actual scalar limit-error formatting verified in ${localeCount} locale files`);
