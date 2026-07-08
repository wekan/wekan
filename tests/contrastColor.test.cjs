'use strict';

// Plain-Node unit test (no Meteor) for the pure color helpers behind #5514
// (custom color-wheel / RGB hex picker with automatically readable text).
// Run: node tests/contrastColor.test.cjs

const assert = require('assert');
const {
  isHexColor,
  normalizeHex,
  toHex,
  contrastText,
} = require('../models/lib/contrastColor');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- contrastText: white text on dark backgrounds ---------------------------
test('white text on pure black #000000', () => {
  assert.strictEqual(contrastText('#000000'), '#ffffff');
});

test('white text on pure blue #0000ff', () => {
  assert.strictEqual(contrastText('#0000ff'), '#ffffff');
});

test('white text on a dark named color (navy)', () => {
  assert.strictEqual(contrastText('navy'), '#ffffff');
});

test('white text on the dark named color darkgreen', () => {
  assert.strictEqual(contrastText('darkgreen'), '#ffffff');
});

// --- contrastText: black text on light backgrounds --------------------------
test('black text on pure white #ffffff', () => {
  assert.strictEqual(contrastText('#ffffff'), '#000000');
});

test('black text on pure yellow #ffff00', () => {
  assert.strictEqual(contrastText('#ffff00'), '#000000');
});

test('black text on a light named color (gold)', () => {
  assert.strictEqual(contrastText('gold'), '#000000');
});

test('black text on the light named color white', () => {
  assert.strictEqual(contrastText('white'), '#000000');
});

// --- contrastText: boundary mid-grey ----------------------------------------
test('mid-grey #808080 resolves to black text (luminance above flip point)', () => {
  assert.strictEqual(contrastText('#808080'), '#000000');
});

test('a darker grey #666666 flips to white text', () => {
  assert.strictEqual(contrastText('#666666'), '#ffffff');
});

// --- contrastText: #rgb shorthand -------------------------------------------
test('#rgb shorthand is accepted (#000 -> white text)', () => {
  assert.strictEqual(contrastText('#000'), '#ffffff');
});

test('#rgb shorthand is accepted (#fff -> black text)', () => {
  assert.strictEqual(contrastText('#fff'), '#000000');
});

// --- contrastText: safe fallback on garbage ---------------------------------
test('garbage input falls back to black text', () => {
  assert.strictEqual(contrastText('not-a-color'), '#000000');
  assert.strictEqual(contrastText(''), '#000000');
  assert.strictEqual(contrastText(null), '#000000');
  assert.strictEqual(contrastText(undefined), '#000000');
  assert.strictEqual(contrastText(12345), '#000000');
  assert.strictEqual(contrastText('#12'), '#000000');
});

// --- isHexColor -------------------------------------------------------------
test('isHexColor accepts full #rrggbb hex (any case)', () => {
  assert.strictEqual(isHexColor('#aabbcc'), true);
  assert.strictEqual(isHexColor('#AABBCC'), true);
  assert.strictEqual(isHexColor('#000000'), true);
});

test('isHexColor rejects shorthand, named, and garbage', () => {
  assert.strictEqual(isHexColor('#abc'), false);
  assert.strictEqual(isHexColor('green'), false);
  assert.strictEqual(isHexColor('#gggggg'), false);
  assert.strictEqual(isHexColor('aabbcc'), false);
  assert.strictEqual(isHexColor(null), false);
  assert.strictEqual(isHexColor(undefined), false);
});

// --- normalizeHex -----------------------------------------------------------
test('normalizeHex lower-cases #rrggbb', () => {
  assert.strictEqual(normalizeHex('#AABBCC'), '#aabbcc');
});

test('normalizeHex expands #rgb shorthand to #rrggbb', () => {
  assert.strictEqual(normalizeHex('#0af'), '#00aaff');
  assert.strictEqual(normalizeHex('#FFF'), '#ffffff');
});

test('normalizeHex returns null for non-hex input', () => {
  assert.strictEqual(normalizeHex('green'), null);
  assert.strictEqual(normalizeHex('#12'), null);
  assert.strictEqual(normalizeHex(null), null);
});

// --- toHex: named-color mapping + hex passthrough ---------------------------
test('toHex maps known named colors to their hex', () => {
  assert.strictEqual(toHex('green'), '#3cb500');
  assert.strictEqual(toHex('navy'), '#000080');
  assert.strictEqual(toHex('white'), '#ffffff');
});

test('toHex passes hex through (normalized) and rejects unknown names', () => {
  assert.strictEqual(toHex('#AABBCC'), '#aabbcc');
  assert.strictEqual(toHex('#0af'), '#00aaff');
  assert.strictEqual(toHex('chartreuse'), null);
  assert.strictEqual(toHex('garbage'), null);
});

console.log(`\n${passed} tests passed`);
