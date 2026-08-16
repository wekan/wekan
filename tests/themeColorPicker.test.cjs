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
  assert.ok(/'change \.js-theme-wheel'[\s\S]{0,700}applySelection\(tpl\)/.test(js), 'wheel change applies');
  // apply helper writes per scope: board.setColor vs the global method.
  assert.ok(/b\.setColor\(color, custom\)/.test(js), 'board apply');
  assert.ok(/Meteor\.call\('setGlobalThemeColor', color, custom/.test(js), 'global apply');
  assert.ok(/allowsCustomColor\(customCategory\(/.test(js), 'custom gate asks one helper');
  assert.ok(/return cur \? categoryOf\(cur\) : THEME_CATEGORY_ORDER\[0\];/.test(js),
    'which is the selected theme\'s category, or the flat one when nothing is selected');
  assert.ok(/isHexColor\(val\)/.test(js), 'wheel input validated as hex');
});

test('category titles sit at the start edge and clear the floated swatches', () => {
  const css = read('client/components/main/customTheme.css');
  const i = css.indexOf('.theme-color-picker .theme-category-label');
  assert.ok(i !== -1, 'label rule exists');
  const blk = css.slice(i, css.indexOf('}', i));
  // `start`, not `left`: the titles belong at the edge the language starts from,
  // which is the right one in Arabic or Hebrew. Every physical left/right in the
  // component stylesheets is a bug tests/rtl.test.js fails on.
  assert.ok(/text-align:\s*start/.test(blk), 'titles at the start edge');
  assert.ok(!/text-align:\s*(left|right)/.test(blk), 'and not pinned to a physical side');
  assert.ok(/clear:\s*both/.test(blk), 'clear floats so Clear/Dark/Special drop to their own line');
});

test('Member Settings Change Color popup has a title', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(en['changeColorPopup-title'], 'changeColorPopup-title exists (popup shows a header)');
});

test('every place that chooses a theme renders the shared picker with a scope', () => {
  // One template, three places (docs/Features/Page/Theme.md) - the way one table page
  // serves every table. `scope` is the only difference between them.
  assert.ok(/\+themeColorPicker\(scope="global"\)/.test(read('client/components/users/userHeader.jade')),
    'member popup -> global scope');
  assert.ok(/\+themeColorPicker\(scope="board"\)/.test(read('client/components/sidebar/sidebar.jade')),
    'board popup -> board scope');
  assert.ok(/\+themeColorPicker\(scope="admin"\)/.test(read('client/components/settings/settingBody.jade')),
    'Admin Panel / Settings / Visibility / Change color -> admin scope, the SITE theme');
  const js = read('client/components/main/themeColorPicker.js');
  assert.ok(/const SCOPES = \['board', 'global', 'admin'\]/.test(js),
    'and the picker knows exactly those three');
  assert.ok(/Meteor\.call\('setAdminThemeColor', color, custom/.test(js), 'admin apply');
  // The "Default theme" row belongs to every scope that has a weaker layer under it,
  // which is every scope except a board (a board always has a colour).
  assert.ok(/scope !== 'board'/.test(js), 'so the admin scope can clear its override too');
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

test('the swatches take as many columns as the width allows', () => {
  // The swatch list is shared with the board-BACKGROUND picker, where it is a
  // float-based two-column grid (boardsList.css). Two columns is right for
  // background thumbnails; for Select Color it meant Flat, Clear, Dark and
  // Special each ran down the popup in a narrow pair, most of them below the fold
  // however wide the browser was. Auto-filling columns instead - the same answer
  // as the Change Language popup, and it collapses to one column on a narrow
  // window by itself, so a phone needs no media query.
  const css = read('client/components/main/customTheme.css');
  const at = css.indexOf('.theme-color-picker .board-backgrounds-list {');
  assert.ok(at > -1, 'the picker must lay its swatch list out itself');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.ok(/display: grid/.test(rule), 'as a grid');
  assert.ok(/grid-template-columns: repeat\(auto-fill, minmax\(\d+px, 1fr\)\)/.test(rule),
    'auto-filling, so more width means more columns');

  // Scoped: the board-background picker must keep its pairs.
  assert.ok(!/^\.board-backgrounds-list \{/m.test(css),
    'the grid must not be applied to every board-backgrounds-list');

  // The float rules have to be undone, or a floated grid item stays floated and
  // `width: 50%` leaves every other column half empty.
  const undo = css.slice(css.indexOf('.theme-color-picker .board-backgrounds-list .board-background-select'));
  const undoRule = undo.slice(0, undo.indexOf('}'));
  assert.ok(/float: none/.test(undoRule) && /width: auto/.test(undoRule),
    'the shared float/50% rules must be undone inside the grid');
});

test('a custom colour is offered in all three places, not only on a board', () => {
  // The wheel was gated on a theme being SELECTED. A board always has a colour,
  // and the first one is flat, so Board Settings always showed it - while Member
  // Settings and Admin Panel / Visibility open on "Default (no override)" with
  // nothing selected, so both looked as though they had no custom colour at all.
  const js = read('client/components/main/themeColorPicker.js');
  assert.ok(/function customCategory\(tpl\)/.test(js), 'one helper answers it');
  assert.ok(/const cur = tpl\.color\.get\(\);\s*\n\s*return cur \? categoryOf\(cur\) : THEME_CATEGORY_ORDER\[0\];/.test(js),
    'the selected theme\'s category, or the flat one when nothing is selected');
  assert.ok(/showCustom\(\) \{\s*\n\s*return allowsCustomColor\(customCategory\(Template\.instance\(\)\)\);/.test(js),
    'and the wheel is shown from it');

  // Every scope renders the SAME picker, so this reaches all three at once.
  const scopes = ['board', 'global', 'admin'];
  const jades = {
    board: read('client/components/sidebar/sidebar.jade'),
    global: read('client/components/users/userHeader.jade'),
    admin: read('client/components/settings/settingBody.jade'),
  };
  for (const scope of scopes) {
    assert.ok(jades[scope].includes(`+themeColorPicker(scope="${scope}")`),
      `${scope} renders the shared picker`);
  }
});

test('committing the wheel from "Default" names the theme it lands on (negative)', () => {
  // applySelection() already falls back to the first flat theme. If the picker's
  // own state did not, the wheel would save a theme the page does not show as
  // chosen, and the next click would read the selection back as "none".
  const js = read('client/components/main/themeColorPicker.js');
  const at = js.indexOf("'change .js-theme-wheel'");
  const handler = js.slice(at, js.indexOf('},', at));
  assert.ok(/if \(!tpl\.color\.get\(\)\) tpl\.color\.set\(colorsInCategory\(THEME_CATEGORY_ORDER\[0\]\)\[0\]\);/
    .test(handler), 'the base theme is selected first');
  assert.ok(/const color = tpl\.color\.get\(\) \|\| colorsInCategory\(THEME_CATEGORY_ORDER\[0\]\)\[0\];/.test(js),
    'which is the same fallback the apply already used');
});

console.log(`\nAll ${passed} theme-color-picker tests passed`);
