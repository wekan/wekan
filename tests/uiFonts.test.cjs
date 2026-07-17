'use strict';

// Tests for the UI font whitelist (models/lib/uiFonts.js, #4759): the safe-name
// pattern (the security boundary — no CSS/markup injection), the whitelist gate, and
// the font-family value builder. Includes negative cases with hostile input.
//
// Run: node tests/uiFonts.test.cjs

const assert = require('assert');
const {
  UI_FONTS,
  isSafeFontName,
  isKnownFont,
  fontFamilyValue,
  UI_FONT_SIZE_KEYS,
  isKnownFontSize,
  fontSizeValue,
} = require('../models/lib/uiFonts.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('every curated font passes the safe-name pattern', () => {
  UI_FONTS.forEach(f => assert.ok(isSafeFontName(f), `unsafe curated font: ${f}`));
  assert.ok(UI_FONTS.length > 10);
});

test('isSafeFontName rejects anything that could break out of font-family / inject', () => {
  // negatives — the whole point of the feature
  assert.strictEqual(isSafeFontName('Arial; }'), false);      // css break-out
  assert.strictEqual(isSafeFontName('Arial", url(x)'), false); // quote + url
  assert.strictEqual(isSafeFontName('<b>Arial</b>'), false);   // html
  assert.strictEqual(isSafeFontName('**Arial**'), false);      // markdown
  assert.strictEqual(isSafeFontName('Arial{color:red}'), false);
  assert.strictEqual(isSafeFontName(' Arial'), false);         // leading space
  assert.strictEqual(isSafeFontName(''), false);
  assert.strictEqual(isSafeFontName(null), false);
  assert.strictEqual(isSafeFontName(42), false);
  assert.strictEqual(isSafeFontName('a'.repeat(60)), false);   // too long
  // positives
  assert.strictEqual(isSafeFontName('Arial'), true);
  assert.strictEqual(isSafeFontName('Times New Roman'), true);
  assert.strictEqual(isSafeFontName('DejaVu Sans'), true);
});

test('isKnownFont only accepts whitelist members', () => {
  assert.strictEqual(isKnownFont('Arial'), true);
  assert.strictEqual(isKnownFont('Comic Sans MS'), true);
  assert.strictEqual(isKnownFont('Arial; }'), false);   // negative
  assert.strictEqual(isKnownFont('MyEvilFont'), false); // negative (safe-looking but not curated)
  assert.strictEqual(isKnownFont(''), false);
  assert.strictEqual(isKnownFont(undefined), false);
});

test('fontFamilyValue quotes known fonts and rejects unknown', () => {
  assert.strictEqual(fontFamilyValue('Arial'), '"Arial", sans-serif');
  assert.strictEqual(fontFamilyValue('Times New Roman'), '"Times New Roman", sans-serif');
  assert.strictEqual(fontFamilyValue('Arial; }'), ''); // negative -> nothing applied
  assert.strictEqual(fontFamilyValue('Unknown'), '');
  assert.strictEqual(fontFamilyValue(''), '');
  assert.strictEqual(fontFamilyValue(null), '');
});

test('font sizes: named presets only, default/unknown apply nothing', () => {
  assert.ok(UI_FONT_SIZE_KEYS.includes('default') && UI_FONT_SIZE_KEYS.includes('large'));
  assert.strictEqual(isKnownFontSize('large'), true);
  assert.strictEqual(isKnownFontSize('default'), true);
  assert.strictEqual(isKnownFontSize('99px'), false); // negative: no free numbers
  assert.strictEqual(isKnownFontSize('huge'), false); // negative
  assert.strictEqual(isKnownFontSize(''), false);
  // fontSizeValue: default/unknown -> '' (nothing applied); presets -> a percentage
  assert.strictEqual(fontSizeValue('default'), '');
  assert.strictEqual(fontSizeValue('nope'), '');
  assert.ok(/^\d+%$/.test(fontSizeValue('large')), 'preset -> percentage');
  assert.ok(/^\d+%$/.test(fontSizeValue('smaller')));
});

// --- source guards: the feature is wired end-to-end ---
const fs = require('fs');
const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

test('user model + server method: schema, getter, validated setter, unset', () => {
  const m = read('models/users.js');
  assert.ok(/'profile\.uiFont'/.test(m) && /getUiFont\(\)/.test(m), 'schema + getter');
  const s = read('server/models/users.js');
  const i = s.indexOf('setUiFont(font)');
  assert.ok(i !== -1, 'server method');
  const body = s.slice(i, i + 600);
  assert.ok(/not-logged-in/.test(body), 'requires login');
  // NEGATIVE guard: only whitelisted fonts are stored.
  assert.ok(/isKnownFont\(font\)/.test(body) && /invalid-font/.test(body), 'validates the font');
  assert.ok(/\$unset:\s*{\s*'profile\.uiFont'/.test(body), 'null/empty unsets the custom font');
});

test('member menu Font entry + popup dropdown with an unset option', () => {
  const jade = read('client/components/users/userHeader.jade');
  assert.ok(/js-change-font/.test(jade), 'menu entry');
  assert.ok(/template\(name="changeFontPopup"\)/.test(jade), 'popup');
  assert.ok(/js-ui-font\b/.test(jade), 'font dropdown');
  assert.ok(/js-ui-font-size/.test(jade), 'font-size dropdown');
  // the unset option (value="") must exist
  assert.ok(/option\(value=""/.test(jade) && /font-default/.test(jade), 'unset custom font option');
  const js = read('client/components/users/userHeader.js');
  assert.ok(/Popup\.open\('changeFont'\)/.test(js), 'opens the popup');
  assert.ok(/detectAvailableFonts\(\)/.test(js), 'lists only detected fonts');
  assert.ok(/Meteor\.call\('setUiFont', font/.test(js), 'saves the font');
  assert.ok(/Meteor\.call\('setUiFontSize', size/.test(js), 'saves the size');
});

test('server setUiFontSize validates presets + supports unset', () => {
  const s = read('server/models/users.js');
  const i = s.indexOf('setUiFontSize(size)');
  assert.ok(i !== -1, 'server method');
  const body = s.slice(i, i + 900);
  assert.ok(/isKnownFontSize\(size\)/.test(body) && /invalid-font-size/.test(body), 'validates preset');
  assert.ok(/\$unset:\s*{\s*'profile\.uiFontSize'/.test(body), "default/null unsets size");
});

test('font detector uses the whitelist + canvas width comparison', () => {
  const d = read('client/lib/fontDetector.js');
  assert.ok(/from '\/models\/lib\/uiFonts'/.test(d), 'uses the curated whitelist');
  assert.ok(/measureText/.test(d), 'canvas width comparison');
});

test('font + size applied via CSS variables, gated by body classes, wired into build', () => {
  const j = read('client/components/main/uiFont.js');
  assert.ok(/setProperty\(varName/.test(j), 'sets a CSS variable');
  assert.ok(/toggle\('--wekan-ui-font'/.test(j) && /fontFamilyValue/.test(j), 'font variable + validated value');
  assert.ok(/toggle\('--wekan-ui-font-size'/.test(j) && /fontSizeValue/.test(j), 'size variable + validated value');
  assert.ok(/has-ui-font\b/.test(j) && /has-ui-font-size/.test(j), 'marker classes');
  const css = read('client/components/main/uiFont.css');
  assert.ok(/var\(--wekan-ui-font\)/.test(css) && /var\(--wekan-ui-font-size\)/.test(css), 'css consumes both variables');
  assert.ok(/uiFont\.js/.test(read('client/features/main.js')), 'js wired into build');
  assert.ok(/uiFont\.css/.test(read('client/styles.js')), 'css wired into build');
});

console.log(`\nAll ${passed} ui-font tests passed`);
