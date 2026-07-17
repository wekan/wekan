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

test('picker shows visible swatches grouped by category, with a group-name header', () => {
  const jade = read('client/components/main/themeColorPicker.jade');
  assert.ok(/each themeGroups/.test(jade), 'iterates category groups');
  assert.ok(/theme-category-label \{\{label\}\}/.test(jade), 'category name shown above each group');
  assert.ok(/js-select-theme\(data-color="\{\{name\}\}"\)/.test(jade), 'clickable color swatches');
  assert.ok(/board-color-\{\{name\}\}/.test(jade), 'swatch shows the actual color');
  assert.ok(/span \{\{name\}\}/.test(jade), 'swatch shows the color name');
  assert.ok(/if showCustom/.test(jade), 'wheels gated on custom-capable category');
  assert.ok(/js-theme-wheel\(type="color"/.test(jade), 'native color wheel input');
});

test('picker applies IMMEDIATELY on click (no Save button), per scope', () => {
  const js = read('client/components/main/themeColorPicker.js');
  const jade = read('client/components/main/themeColorPicker.jade');
  assert.ok(/themeGroups\(\)/.test(js), 'builds category groups with labels');
  // NEGATIVE guard: there is no Save button and no save handler.
  assert.ok(!/js-theme-save/.test(jade) && !/js-theme-save/.test(js), 'no Save button/handler');
  // clicking a swatch selects and applies immediately.
  assert.ok(/'click \.js-select-theme'/.test(js) && /tpl\.color\.set\(color\)/.test(js), 'swatch click sets color');
  assert.ok(/'click \.js-select-theme'[\s\S]{0,200}applySelection\(tpl\)/.test(js), 'swatch click applies immediately');
  // custom colors apply when the wheel is committed (change), not on every input.
  assert.ok(/'change \.js-theme-wheel'[\s\S]{0,120}applySelection\(tpl\)/.test(js), 'wheel change applies');
  // apply helper writes per scope: board.setColor vs the global method.
  assert.ok(/b\.setColor\(color, custom\)/.test(js), 'board apply');
  assert.ok(/Meteor\.call\('setGlobalThemeColor', color, custom/.test(js), 'global apply');
  assert.ok(/allowsCustomColor\(categoryOf\(cur\)\)/.test(js), 'custom gate uses the selected color');
  assert.ok(/isHexColor\(val\)/.test(js), 'wheel input validated as hex');
});

test('category titles are left-aligned and clear the floated swatches', () => {
  const css = read('client/components/main/customTheme.css');
  const i = css.indexOf('.theme-color-picker .theme-category-label');
  assert.ok(i !== -1, 'label rule exists');
  const blk = css.slice(i, css.indexOf('}', i));
  assert.ok(/text-align:\s*left/.test(blk), 'titles at the left');
  assert.ok(/clear:\s*both/.test(blk), 'clear floats so Clear/Dark/Special drop to their own line');
});

test('Member Settings Change Color popup has a title', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['changeColorPopup-title'], 'changeColorPopup-title exists (popup shows a header)');
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
