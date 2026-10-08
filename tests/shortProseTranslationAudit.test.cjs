'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');

test('short prose audit exposes words and preserves indexed source arguments', async () => {
  const { shortProseCandidates } = await import('../releases/translations/audit-short-prose.mjs');
  const source = { condition: 'if', loop: 'do', move: '%1 of %2', end: 'to #', accept: 'OK', negative: 'No', person: 'Me' };
  const before = JSON.stringify(source);
  assert.deepEqual(shortProseCandidates(source, { ...source }), source);
  assert.equal(JSON.stringify(source), before);
  assert.deepEqual(shortProseCandidates(source, { ...source, condition: '假使' }), Object.fromEntries(Object.entries(source).filter(([key]) => key !== 'condition')));
});

test('short prose audit excludes technical notation and changed or missing values', async () => {
  const { shortProseCandidates } = await import('../releases/translations/audit-short-prose.mjs');
  const source = { os: 'OS', size: 'MB', pi: 'pi', constant: 'e', search: 'a', storage: 'S3', url: 'https://example.com', empty: '', token: '%1', longer: 'do something', word: 'or' };
  assert.deepEqual(shortProseCandidates(source, { ...source, word: '或者' }), {});
  assert.deepEqual(shortProseCandidates(source, {}), {});
  // Same spelling can be native: report it for review, never assert it is wrong.
  assert.deepEqual(shortProseCandidates({ word: 'No' }, { word: 'No' }), { word: 'No' });
});

test('Finnish, German and French short labels preserve input/context roles and pixel state', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data', code + '.i18n.json'), 'utf8'));
  const source = read('en');
  for (const code of ['fi', 'de', 'de-CH', 'de-AT', 'de_DE', 'fr', 'fr-CH', 'fr-FR', 'fr-BE', 'fr-CA']) {
    const locale = read(code);
    for (const key of ['blockly-ANNOUNCE_MOVE_OF', 'blockly-FIELD_BITMAP_PIXEL_ON']) {
      assert.notEqual(locale[key], source[key], code + ': ' + key);
      assert.deepEqual(translationTokens(locale[key]), translationTokens(source[key]), code + ': ' + key);
    }
    const rendered = locale['blockly-ANNOUNCE_MOVE_OF'].replace('%1', 'INPUT').replace('%2', 'BLOCK');
    assert.equal(rendered, code === 'fi' ? 'BLOCK: INPUT' : code.startsWith('de') ? 'INPUT von BLOCK' : 'INPUT de BLOCK', code);
    assert.notEqual(locale['blockly-FIELD_BITMAP_PIXEL_ON'], locale['blockly-FIELD_BITMAP_PIXEL_OFF'], code);
  }
});
