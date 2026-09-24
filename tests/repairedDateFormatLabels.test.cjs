const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = locale => JSON.parse(fs.readFileSync(path.join(root, `imports/i18n/data/${locale}.i18n.json`)));
const en = read('en');
const keys = ['date-format-yyyy-mm-dd', 'date-format-dd-mm-yyyy', 'date-format-mm-dd-yyyy'];
const { DATE_FORMATS } = require('../models/lib/dateFormatPolicy');
for (const locale of ['ak', 'bs', 'sl', 'sl_SI', 'br', 'zgh']) {
  const values = read(locale);
  for (const key of keys) {
    assert.equal(values[key], en[key]);
    assert.ok(DATE_FORMATS.includes(values[key]), 'label matches a selectable format');
    assert.doesNotMatch(values[key], /Nsɛm|година|месец|дан|AAAA|JJ/);
  }
  assert.equal(new Set(keys.map(key => values[key])).size, 3);
}
// Correct language-specific notation remains valid and must not be normalized.
assert.equal(read('da')[keys[0]], 'ÅÅÅÅ-MM-DD');
assert.equal(read('eu')[keys[0]], 'UUUU-HH-EE');
