'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const i18next = require('i18next');
const labels = require('./fixtures/shared-translation-labels.json');
const directory = path.join(__dirname, '../imports/i18n/data');
const read = code => JSON.parse(fs.readFileSync(path.join(directory, `${code}.i18n.json`)));
const source = read('en');
const locales = fs.readdirSync(directory).filter(f => f.endsWith('.i18n.json'))
  .map(f => f.replace('.i18n.json', '')).filter(c => !/^en(?:[-_]|$)/.test(c));

// These are native shared spellings, not blanket exemptions for a language.
function sharedSpelling(code, key) {
  return key === 'blockly-COLOUR_RGB_RED' && code === 'bi'
    || key === 'blockly-LISTS_CREATE_WITH_CONTAINER_TITLE_ADD' && ['fy', 'fy-NL'].includes(code)
    || labels[key] === 'r-item' && ['af', 'af_ZA', 'pt-PT'].includes(code);
}

test('completed shared labels render in every non-English locale without fallback', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const i18n = i18next.createInstance();
  await i18n.init({ lng: 'en', fallbackLng: 'en', initImmediate: false,
    interpolation: { prefix: '__', suffix: '__' }, resources: { en: { translation: source } } });
  for (const code of locales) {
    const data = read(code);
    i18n.addResourceBundle(code, 'translation', data);
    for (const key of Object.keys(labels)) {
      const identity = `${code}:${key}`;
      assert.ok(data[key]?.trim(), identity);
      if (!sharedSpelling(code, key)) assert.notEqual(data[key], source[key], identity);
      assert.doesNotMatch(data[key], /Wolayttatto:|Faka-Tonga:|Aymar aruna:|Tshedimosetso:|Kay willaymi:|Hi Xitsonga:|\(mu Luganda\)/, identity);
      assert.deepEqual(translationTokens(data[key]), translationTokens(source[key]), identity);
      assert.equal(i18n.t(key, { lng: code }), data[key], identity);
    }
  }
});

test('same-source context review excludes misleading homonyms', () => {
  for (const [target, donor] of Object.entries(labels)) assert.equal(source[target], source[donor], target);
  for (const key of ['blockly-CONTROL_KEY', 'blockly-HOME_KEY', 'blockly-END_KEY']) {
    assert.ok(!(key in labels), key);
  }
  const pending = require('../releases/translations/pending-transifex.json').keys.map(row => row.key);
  for (const key of Object.keys(labels)) assert.ok(!pending.includes(key), key);
});

test('repairs retain language-specific vocabulary and cancellation meaning', () => {
  assert.equal(read('ve')['notification-delivery-layout'], 'Nzudzanyo');
  assert.equal(read('ace')['blockly-COLOUR_RGB_RED'], 'mirah');
  assert.equal(read('vo').link, 'Yüm');
  assert.equal(read('to').calendar, 'Tohi māhina');
  assert.notEqual(read('wal')['scrum-state-cancelled'], 'Atto giis', 'cancelled is not an apology');
  assert.equal(read('wal')['scrum-state-cancelled'], 'Aggida');
  assert.notEqual(read('ts')['scrum-state-active'], read('ts')['scrum-state-closed']);
});
