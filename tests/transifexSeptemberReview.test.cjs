'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const records = require('../releases/translations/transifex-review-2026-09-27.json');
const en = require('../imports/i18n/data/en.i18n.json');
const read = locale => JSON.parse(fs.readFileSync(
  path.join(root, 'imports/i18n/data', `${locale}.i18n.json`), 'utf8'));
const tokens = value => (value.match(/__[^\s]+?__|%\{[^}]+\}|%(?:\d+\$)?[A-Za-z%]|%\d+/g) || []).sort();

test('reviewed pull errors have target-language corrections with intact source tokens', () => {
  for (const r of records) {
    assert.equal(read(r.locale)[r.key], r.after, `${r.locale}: ${r.key}`);
    assert.notEqual(r.before, r.after);
    // Percent-encoded URL octets are not interpolation placeholders.
    if (!r.key.endsWith('_HELPURL')) {
      assert.deepEqual(tokens(r.after), tokens(en[r.key]), `${r.locale}: ${r.key}`);
    }
  }
  assert.equal(read('fi')['r-blocks-view'], 'Lohkot');
  assert.equal(read('fi')['blockly-FIELD_BITMAP_BUTTON_LABEL_CLEAR'], 'Tyhjennä');
  assert.equal(read('sv')['blockly-CONTROL_KEY'], 'Ctrl');
  for (const locale of ['sl', 'sl_SI']) {
    for (const key of ['help', 'zoom-in', 'zoom-out', 'scrum-state-closed', 'scrum-state-cancelled']) {
      assert.doesNotMatch(read(locale)[key], /\p{Script=Cyrillic}/u);
    }
  }
  for (const key of ['blockly-CONTROLS_FOREACH_TITLE', 'blockly-CONTROLS_FOR_TOOLTIP']) {
    assert.match(read('ur')[key], /\p{Script=Arabic}/u);
    assert.doesNotMatch(read('ur')[key], /\p{Script=Devanagari}/u);
  }
});

test('exact-value repair handles another pull without overwriting newer translations', async () => {
  const { repairLocale } = await import('../releases/translations/repair-audited-translations.mjs');
  for (const r of records) {
    assert.equal(repairLocale(r.locale, { [r.key]: r.before }).data[r.key], r.after,
      `${r.locale}: ${r.key}: replay`);
    const newer = `Reviewed newer value for ${r.locale}: ${r.key}`;
    assert.equal(repairLocale(r.locale, { [r.key]: newer }).data[r.key], newer);
    assert.equal(repairLocale('not-this-locale', { [r.key]: r.before }).data[r.key], r.before);
  }
});

test('valid new translations and mathematical notation survive the review', () => {
  assert.equal(read('fi')['scrum-completed'], 'Valmistunut');
  assert.equal(read('fi')['scrum-state-active'], 'Aktiivinen');
  assert.equal(read('vi-VN')['blockly-LISTS_INLIST'], 'trong danh sách');
  assert.equal(read('sv')['blockly-SHORTCUTS_MOVE_DOWN'], 'Flytta ner');
  assert.equal(read('ru')['blockly-MATH_TRIG_ACOS'], 'arccos');
  assert.match(read('hi')['blockly-MATH_CONSTANT_TOOLTIP'], /π.*φ.*∞/);
  for (const file of fs.readdirSync(path.join(root, 'imports/i18n/data'))) {
    if (!file.endsWith('.i18n.json')) continue;
    // Development adds English source labels before target translations. Keep
    // validating known keys and source order without requiring blanket filling.
    const locale = read(file.slice(0, -10));
    assert.ok(Object.keys(locale).length > 0, file);
    assert.deepEqual(Object.keys(locale), Object.keys(en).filter(key => Object.hasOwn(locale, key)), file);
  }
});
