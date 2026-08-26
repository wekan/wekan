const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const data = path.join(root, 'imports/i18n/data');
const english = JSON.parse(fs.readFileSync(path.join(data, 'en.i18n.json'), 'utf8'));
const key = 'sandstorm-remove-member-warning';
const translated = [
  'ace',
  'af',
  'af_ZA',
  'am',
  'ar-DZ',
  'ar-EG',
  'ar',
  'ary',
  'as',
  'ast-ES',
  'az-AZ',
  'az-LA',
  'az',
  'ba',
  'be',
  'bg',
  'bho',
  'bm',
  'bn',
  'bo',
  'br',
  'bua',
  'ca',
  'ca@valencia',
  'ca_ES',
  'chr',
  'ckb',
  'cmn',
  'cs-CZ',
  'cs',
  'cv',
  'cy-GB',
  'cy',
  'da',
  'de-AT',
  'de-CH',
  'de',
  'de_DE',
  'dz',
  'ee',
  'gl',
  'gl-ES',
  'xh',
];

for (const language of translated) {
  const locale = JSON.parse(
    fs.readFileSync(path.join(data, `${language}.i18n.json`), 'utf8'),
  );
  assert.notEqual(locale[key], english[key], language);
  assert.match(locale[key], /WeKan/);
  assert.match(locale[key], /Sandstorm/);
}
