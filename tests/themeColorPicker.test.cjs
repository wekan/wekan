'use strict';

// Source guards for the shared "Select Color" picker (docs/Theme/Theme.md): the
// two-level dropdown template, the custom-color wheels for flat/clear, the storage
// (board.customThemeColors / profile.globalThemeCustomColors), validated setters,
// and the CSS-variable application. The picker is Blaze/CSS-coupled so this asserts
// the wiring; the pure category logic is covered by tests/themeCategories.test.cjs.
//
// Run: node tests/themeColorPicker.test.cjs

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

test('shared picker template has category + theme dropdowns and custom wheels', () => {
  const jade = read('client/components/main/themeColorPicker.jade');
  assert.ok(/js-theme-category/.test(jade), 'category dropdown');
  assert.ok(/js-theme-color/.test(jade), 'theme dropdown');
  assert.ok(/if showCustom/.test(jade), 'wheels gated on custom-capable category');
  assert.ok(/js-theme-wheel\(type="color"/.test(jade), 'native color wheel input');
});

test('picker logic: repopulates themes by category, gates wheels, saves per scope', () => {
  const js = read('client/components/main/themeColorPicker.js');
  assert.ok(/colorsInCategory\(cat\)\[0\]/.test(js), 'category change picks first theme');
  assert.ok(/allowsCustomColor/.test(js) && /customColorCount/.test(js), 'uses category rules');
  // board scope writes board.setColor; global scope calls the method.
  assert.ok(/b\.setColor\(color, custom\)/.test(js), 'board save');
  assert.ok(/Meteor\.call\('setGlobalThemeColor', color, custom/.test(js), 'global save');
  // NEGATIVE guard: only #rrggbb from the wheel is accepted.
  assert.ok(/isHexColor\(val\)/.test(js), 'wheel input validated as hex');
});

test('both popups render the shared picker with the right scope', () => {
  assert.ok(/\+themeColorPicker\(scope="global"\)/.test(read('client/components/users/userHeader.jade')),
    'member popup -> global scope');
  assert.ok(/\+themeColorPicker\(scope="board"\)/.test(read('client/components/sidebar/sidebar.jade')),
    'board popup -> board scope');
});

test('storage: board.customThemeColors + profile.globalThemeCustomColors with hex validation', () => {
  const boards = read('models/boards.js');
  assert.ok(/customThemeColors:/.test(boards) && /'customThemeColors\.\$'/.test(boards), 'board schema');
  assert.ok(/\[0-9a-fA-F\]\{6\}/.test(boards), 'board hex validator');
  const users = read('models/users.js');
  assert.ok(/'profile\.globalThemeCustomColors'/.test(users), 'user schema');
  assert.ok(/getGlobalThemeCustomColors\(\)/.test(users), 'user getter');
});

test('setters validate custom colors via isValidCustomColors', () => {
  const boards = read('models/boards.js');
  const i = boards.indexOf('async setColor(color, customThemeColors)');
  assert.ok(i !== -1, 'board setColor accepts custom colors');
  assert.ok(/isValidCustomColors\(color, customThemeColors\)/.test(boards.slice(i, i + 500)), 'board validates');
});

test('custom colors applied as CSS variables + consumed by customTheme.css', () => {
  const j = read('client/components/main/globalThemeColor.js');
  assert.ok(/setProperty\('--theme-accent'/.test(j), 'sets --theme-accent');
  assert.ok(/setProperty\('--theme-accent-2'/.test(j), 'sets --theme-accent-2 (clear slide)');
  assert.ok(/has-custom-theme-color/.test(j) && /has-custom-theme-slide/.test(j), 'marker classes');
  // on a board the board own custom colors are exposed; else the global ones.
  assert.ok(/customThemeColors/.test(j) && /globalThemeCustomColors/.test(j), 'board vs global source');
  const css = read('client/components/main/customTheme.css');
  assert.ok(/var\(--theme-accent\)/.test(css), 'flat accent consumed');
  assert.ok(/linear-gradient\(135deg, var\(--theme-accent\), var\(--theme-accent-2\)\)/.test(css),
    'clear gradient consumed');
});

console.log(`\nAll ${passed} theme-color-picker tests passed`);
