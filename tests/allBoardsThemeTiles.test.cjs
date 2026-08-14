'use strict';

// Member Settings / Change color: "All Boards" beside "Default (no override)",
// and the popup rows highlighted the way the left menu highlights "Starred".
// Run: node tests/allBoardsThemeTiles.test.cjs
//
// #6593 proposed making every All Boards tile white, for everybody, in CSS. The
// observation behind it is right - a wall of boards in eleven different colours
// reads as a palette rather than a list - but the conclusion is not, because
// "the tile colours are noise" and "the tile colours are how I find my board"
// are both true, of different people. So it is a per-user switch, in the popup
// where the rest of that user's theme is chosen, and what it paints is the
// THEME's lighter colour rather than a hard-coded white.
//
// And the popup's own highlight: Member Settings drew the row under the pointer
// in a fixed dark navy that appears nowhere else in WeKan, while the All Boards
// left menu fills its selected row with the theme accent and turns the label and
// icon white. One selected-thing look, so the popup follows the menu.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const jade = read('client/components/main/themeColorPicker.jade');
const picker = read('client/components/main/themeColorPicker.js');
const users = read('models/users.js');
const serverUsers = read('server/models/users.js');
const themeApply = read('client/components/main/globalThemeColor.js');
const boardsCss = read('client/components/boards/boardsList.css');
const themeCss = read('client/components/main/customTheme.css');
const popupCss = read('client/components/main/popup.css');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('allBoardsThemeTiles:');

// ── the switch ──────────────────────────────────────────────────────────────

test('it sits beside "Default (no override)", in the same row', () => {
  const row = jade.slice(jade.indexOf('ul.pop-over-list.theme-scope-row'),
    jade.indexOf('each themeGroups'));
  assert.ok(/js-theme-none/.test(row) && /js-theme-all-boards/.test(row),
    'both switches are in the one list');
  assert.ok(row.indexOf('js-theme-none') < row.indexOf('js-theme-all-boards'),
    'the theme itself first, then where it also applies');
  assert.ok(/display: flex/.test(themeCss.slice(themeCss.indexOf('.theme-scope-row'))),
    'and the row is laid out side by side, not stacked');
});

test('the label is the page it is about', () => {
  const row = jade.slice(jade.indexOf('js-theme-all-boards'));
  assert.ok(/\{\{_ 'all-boards'\}\}/.test(row.slice(0, 200)),
    'the existing All Boards string - a new key would need 135 translations to '
    + 'say what this one already says');
  assert.strictEqual(en['all-boards'], 'All Boards');
});

test('only the USER has it (negative)', () => {
  // The picker is shared by Board Settings, Member Settings and the Admin Panel.
  // A board has no overview of its own, and a site admin does not choose this
  // for everybody - that is the mistake this fix is not repeating.
  assert.ok(/isUserScope\(\) \{\s*\n\s*return Template\.instance\(\)\.scope === 'global';/.test(picker),
    'the helper asks for the global (per-user) scope specifically');
  const row = jade.slice(jade.indexOf('if isUserScope'), jade.indexOf('each themeGroups'));
  assert.ok(/js-theme-all-boards/.test(row), 'and the row is inside that condition');
});

test('the preference is a per-user profile field with a method to flip it', () => {
  assert.ok(/'profile\.allBoardsThemeTiles': \{/.test(users), 'declared in the schema');
  assert.ok(/type: Boolean,\s*\n\s*optional: true,/.test(
    users.slice(users.indexOf("'profile.allBoardsThemeTiles'"), users.indexOf("'profile.globalThemeColor'"))),
    'optional boolean - absent means off, which is the old behaviour');
  assert.ok(/hasAllBoardsThemeTiles\(\)/.test(users), 'with a reader');
  assert.ok(/async toggleAllBoardsThemeTiles\(\)/.test(serverUsers), 'and a server method');
  const method = serverUsers.slice(serverUsers.indexOf('async toggleAllBoardsThemeTiles'));
  assert.ok(/if \(!this\.userId\) throw new Meteor\.Error\('not-logged-in'/.test(method.slice(0, 400)),
    'which refuses an anonymous caller');
  assert.ok(/Users\.updateAsync\(this\.userId/.test(method.slice(0, 700)),
    'and writes the CALLER, never an id from the client');
});

test('clicking it applies at once, like every other row in this popup', () => {
  const handler = picker.slice(picker.indexOf("'click .js-theme-all-boards'"));
  const body = handler.slice(0, handler.indexOf('\n  },'));
  assert.ok(/Meteor\.call\('toggleAllBoardsThemeTiles'/.test(body));
  assert.ok(!/Popup\.close|Popup\.back/.test(body),
    'the popup stays open so the change can be seen and undone in one place (negative)');
});

// ── what it paints ──────────────────────────────────────────────────────────

test('the preference reaches the page as a body class', () => {
  assert.ok(/classList\.toggle\('has-theme-board-tiles', on\)/.test(themeApply),
    'on <body>, so it follows the user to every page that shows board tiles');
  assert.ok(/profile\.allBoardsThemeTiles/.test(themeApply), 'read from the profile');
});

test('tiles take the THEME accent itself - not a hard-coded colour', () => {
  const rule = boardsCss.slice(boardsCss.indexOf('body.has-theme-board-tiles .board-list > li.js-board {'));
  const block = rule.slice(0, rule.indexOf('}'));
  assert.ok(/var\(--theme-accent-fill, var\(--theme-accent, #2980b9\)\)/.test(block),
    'the theme\'s own FILL - its slide where it has one, its accent where it does '
    + 'not - falling back to the WeKan header blue');
  // It used to be that accent under a flat white veil, one shade up. That made
  // the tiles a LIGHTER version of the highlight they sit beside in the left
  // menu, and two shades of one accent on one page read as two colours.
  assert.ok(!/rgba\(255, 255, 255, 0\.22\)/.test(block), 'with no veil over it');
  const menu = boardsCss.slice(boardsCss.indexOf('.boards-left-menu .menu-item.active a,'));
  assert.ok(/background: var\(--theme-accent, #2980b9\)/.test(menu.slice(0, menu.indexOf('}'))),
    'so a tile is the same colour as the selected row in the left menu');
  assert.ok(/^\s*background: var/m.test(block),
    'set with the shorthand, so a slide theme\'s own gradient on the tile is '
    + 'replaced rather than left on top of it');
  assert.ok(/color: #fff/.test(boardsCss.slice(boardsCss.indexOf('body.has-theme-board-tiles'))),
    'with white text on it, the same as that row');
});

test("the popup's own \"All Boards\" button is filled the same way", () => {
  // The button that turns this on and the tiles it turns on are the same
  // decision, so they are the same fill. It read `--theme-accent` alone, so on
  // clearorange the button was flat orange while the left-menu row behind the
  // popup slid - two looks for one selected thing.
  const custom = read('client/components/main/customTheme.css');
  const at = custom.indexOf('.theme-color-picker ul.pop-over-list.theme-scope-row > li.active > a,');
  assert.ok(at > 0, 'the active scope button is styled');
  assert.ok(/background: var\(--theme-accent-fill, var\(--theme-accent, #2980b9\)\)/
    .test(custom.slice(at, custom.indexOf('}', at))), 'from the theme fill');
});

test('a board background IMAGE is left alone (negative)', () => {
  const section = boardsCss.slice(boardsCss.indexOf('body.has-theme-board-tiles'));
  assert.ok(/\.board-list-item:not\(\.has-background-image\)/.test(section),
    'a picture somebody chose is not noise to be painted over');
});

test('boards keep their own colours when it is off (negative)', () => {
  // Every rule is under the body class. Without it the overview is exactly what
  // it was, which is what makes this safe to default to off.
  const selectors = boardsCss.split('\n')
    .filter(l => /has-theme-board-tiles/.test(l));
  assert.ok(selectors.length >= 4, 'the rules exist');
  for (const selector of selectors) {
    assert.ok(/^body\.has-theme-board-tiles/.test(selector.trim()),
      `every one of them is under the body class: ${selector.trim()}`);
  }
  assert.ok(!/^\.board-list > li\.js-board \{/m.test(boardsCss),
    'and nothing paints every tile unconditionally, which is what #6593 did');
});

// ── the popup highlight ─────────────────────────────────────────────────────

test('a highlighted popup row looks like the selected left-menu row', () => {
  const hover = popupCss.slice(popupCss.indexOf('.pop-over-list li > a:not(.disabled):hover {'));
  const block = hover.slice(0, hover.indexOf('}'));
  assert.ok(/var\(--theme-accent, #2980b9\)/.test(block),
    'the theme accent, not the fixed #005377 that appeared nowhere else');
  assert.ok(!/#005377/.test(block), 'and the navy is gone (negative)');
  assert.ok(/color: #fff !important/.test(block),
    'white text - the base rule pins every row to #000 !important, so this has to '
    + 'be important too');
  const icon = popupCss.slice(popupCss.indexOf(':hover i,'));
  assert.ok(/color: #fff !important/.test(icon.slice(0, 200)), 'and a white icon beside it');
});

test('the left menu it matches still uses the same fill', () => {
  // If the menu ever changes, this test is where the two are supposed to be
  // brought back together.
  const menu = boardsCss.slice(boardsCss.indexOf('.boards-left-menu .menu-item.active a,'));
  assert.ok(/background: var\(--theme-accent, #2980b9\)/.test(menu.slice(0, 400)));
});

console.log(`\nallBoardsThemeTiles: ${passed} tests passed`);
