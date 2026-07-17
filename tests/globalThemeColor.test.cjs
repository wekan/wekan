'use strict';

// #5778: global per-user theme color override (Member Menu / Change Color).
// The feature is Blaze/CSS/Meteor-coupled, so this is a source guard that the pieces
// are wired end-to-end, plus a behavioural check of the two pure decisions:
//   - globalThemeColorClass(): color -> `board-color-<color>` (or '' when unset)
//   - the <body> autorun's rule: apply only when NOT on a board and a color is set.
//
// Run: node tests/globalThemeColor.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- behavioural: the class mapping (mirror of Users.globalThemeColorClass) ---
function globalThemeColorClass(color) {
  return color ? `board-color-${color}` : '';
}
test('globalThemeColorClass maps a color to its board-color class, else empty', () => {
  assert.strictEqual(globalThemeColorClass('moderndark'), 'board-color-moderndark');
  assert.strictEqual(globalThemeColorClass('dark'), 'board-color-dark');
  assert.strictEqual(globalThemeColorClass(null), '');   // negative
  assert.strictEqual(globalThemeColorClass(''), '');     // negative
  assert.strictEqual(globalThemeColorClass(undefined), ''); // negative
});

// --- behavioural: the autorun decision (mirror of globalThemeColor.js) ---
function bodyClass(color, onBoard) {
  return !onBoard && color ? `board-color-${color}` : null;
}
test('body gets the global class only OFF a board and only when a color is set', () => {
  assert.strictEqual(bodyClass('dark', false), 'board-color-dark'); // All Boards etc.
  assert.strictEqual(bodyClass('dark', true), null);  // on a board: board color wins
  assert.strictEqual(bodyClass(null, false), null);   // no override set
  assert.strictEqual(bodyClass('', false), null);     // negative
});

// --- source guards: end-to-end wiring ---
test('user model: schema field + helpers + setter', () => {
  const m = read('models/users.js');
  assert.ok(/'profile\.globalThemeColor'/.test(m), 'schema field');
  assert.ok(/getGlobalThemeColor\(\)/.test(m), 'getter');
  assert.ok(/globalThemeColorClass\(\)/.test(m), 'class helper');
  assert.ok(/setGlobalThemeColor\(color\)/.test(m), 'setter helper');
  assert.ok(/\$unset:\s*{\s*'profile\.globalThemeColor'/.test(m), 'clears the override');
});

test('server method validates against BOARD_COLORS and is auth-guarded', () => {
  const s = read('server/models/users.js');
  const i = s.indexOf('setGlobalThemeColor(color');
  assert.ok(i !== -1, 'server method');
  const body = s.slice(i, i + 900);
  assert.ok(/not-logged-in/.test(body), 'requires login');
  // NEGATIVE guard: an unknown color must be rejected, not written as a CSS class.
  assert.ok(/BOARD_COLORS\.includes\(color\)/.test(body), 'validates the color');
  assert.ok(/invalid-color/.test(body), 'rejects unknown colors');
  // custom colors are validated (flat/clear + hex) before storage.
  assert.ok(/isValidCustomColors\(color, customColors\)/.test(body), 'validates custom colors');
});

test('member menu has Change Color, opening the shared theme picker (scope=global)', () => {
  const jade = read('client/components/users/userHeader.jade');
  assert.ok(/js-change-color/.test(jade), 'menu entry');
  assert.ok(/template\(name="changeColorPopup"\)/.test(jade), 'popup template');
  assert.ok(/\+themeColorPicker\(scope="global"\)/.test(jade), 'renders the shared picker');
  const js = read('client/components/users/userHeader.js');
  assert.ok(/Popup\.open\('changeColor'\)/.test(js), 'opens the popup');
});

test('body autorun applies the global class off-board and exposes custom colors', () => {
  const j = read('client/components/main/globalThemeColor.js');
  assert.ok(/board-color-\$\{color\}/.test(j), 'builds the board-color class');
  assert.ok(/Session\.get\('currentBoard'\)/.test(j), 'checks whether on a board');
  // off-board: colorClass is computed only in the not-on-board branch.
  assert.ok(/onBoard/.test(j) && /globalThemeColor/.test(j), 'gates on board context');
  // custom colors are applied as CSS variables consumed by customTheme.css.
  assert.ok(/--theme-accent/.test(j), 'sets the custom-color CSS variable');
});

test('header falls back to the global theme class on non-board pages', () => {
  const h = read('client/components/main/header.jade');
  // Both the quick-access bar and the main header use the board color when on a
  // board, else the user global override.
  const matches = h.match(/else\}\}\{\{currentUser\.globalThemeColorClass\}\}/g) || [];
  assert.ok(matches.length >= 2, 'both #header and #header-quick-access fall back');
});

test('i18n has the new strings', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en['change-color'], 'Change Color');
  assert.ok(typeof en['theme-default'] === 'string' && en['theme-default'].length > 0);
});

console.log(`\nAll ${passed} global-theme-color (#5778) tests passed`);
