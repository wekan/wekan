const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('Valencian native peach color label describes the unchanged pale-peach swatch', () => {
  const locale = JSON.parse(fs.readFileSync('imports/i18n/data/ca@valencia.i18n.json'));
  assert.equal(locale['color-peachpuff'], 'préssec');
  assert.notEqual(locale['color-peachpuff'], locale['color-plum']);
  assert.notEqual(locale['color-peachpuff'], locale['color-lime']);
  assert.deepEqual(Object.keys(locale).filter(k => k.startsWith('color-') && /peach/.test(k)), ['color-peachpuff']);
  const css = fs.readFileSync('client/components/cards/cardDetails.css', 'utf8');
  assert.match(css, /\.card-details-peachpuff\s*\{\s*background:\s*#ffdab9\s*!important;/);
  assert.doesNotMatch(locale['color-peachpuff'], /melocotón|peachpuff/);
});
