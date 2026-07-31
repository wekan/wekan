'use strict';

// Mobile mode must look the same on a phone and in mobile mode on a desktop window.
//
// Reported with two screenshots of the same app: on an iPhone 12 mini the second
// header bar held a handful of icons and no board title, while a desktop Firefox
// window in mobile mode showed the title and the full set of buttons. Same mode, two
// different bars.
//
// Mobile layout is driven from three switches that did not agree:
//   1. `body.mobile-mode`   - the explicit toggle
//   2. `Utils.isMiniScreen()` - which branch of the templates renders (fixed in
//      tests/mobileModeFullWidth.test.cjs, where an explicit choice now wins)
//   3. `@media (max-width: 800px)` - the viewport, true on a phone and false on a
//      wide desktop window even when mobile mode is on
//
// A rule keyed off one of them that assumes another cannot hold on both devices.
//
// Run: node tests/mobileModeConsistency.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const boardCss = read('client/components/boards/boardHeader.css');
const headerCss = read('client/components/main/header.css');
const boardJade = read('client/components/boards/boardHeader.jade');
const listJade = read('client/components/lists/listHeader.jade');

console.log('mobileModeConsistency:');

test('the header buttons are written ONCE, for both screens', () => {
  // edit title / visibility / watch / star / sort used to be rendered in exactly
  // one of two groups - left `unless isMiniScreen`, right `if isMiniScreen` -
  // because a row of LABELLED buttons does not fit on a phone. Whether the two
  // switches agreed was the thing this test guarded: hiding the left group in
  // mobile mode was a no-op while they did, and deleted five buttons when they
  // did not.
  //
  // There is one copy now. The buttons are icons in the first header bar, named
  // by tooltips, and icons fit at both sizes - so the duplication that made the
  // two switches able to disagree is gone rather than kept in step.
  assert.ok(!/unless isMiniScreen/.test(boardJade), 'no wide-screen-only copy');
  assert.ok(!/if isMiniScreen/.test(boardJade), 'and no phone-only copy');
  assert.ok(!/\.mobile-mode \.board-header-btns\.left \{[^}]*display:\s*none/.test(boardCss),
    'and nothing hides a group that no longer exists');
  // Each control appears exactly once IN THE HEADER BUTTONS. The popups below
  // mention some of the same classes - `js-change-visibility` is also the link
  // inside the visibility popup - so this reads the one template, not the file.
  const buttons = boardJade.slice(boardJade.indexOf('template(name="boardHeaderButtons")'),
    boardJade.indexOf('template(name="boardVisibilityList")'));
  // js-star-board is NOT here any more: the star moved to its own template so
  // the first header bar can place it beside the starred-boards dropdown - the
  // count of starred boards and whether this is one of them are a pair.
  // tests/headerBars.test.cjs checks it there.
  for (const control of ['js-change-visibility', 'js-watch-board',
    'js-sort-cards', 'js-open-filter-view', 'js-open-search-view',
    'js-toggle-dependencies', 'js-multiselection-activate']) {
    assert.strictEqual((buttons.match(new RegExp(control, 'g')) || []).length, 1,
      `${control} must be written exactly once`);
  }
});

test('the second header bar can grow to a second row on a phone', () => {
  // The phone block gives the bar a bigger touch target (#6419). As a fixed `height`
  // that CLIPPED the second row the bar wraps to when title + buttons do not fit, so
  // part of the bar was simply not there.
  const phone = headerCss.slice(headerCss.indexOf('@media screen and (max-width: 800px),'));
  const bar = /#header #header-main-bar \{([^}]*)\}/.exec(phone);
  assert.ok(bar, 'the phone block must still size the bar');
  assert.ok(/min-height:\s*48px/.test(bar[1]), 'a floor, so the touch targets stay');
  assert.ok(!/[^-]height:\s*48px/.test(bar[1]), 'but not a fixed height, which clips');
});

test('the list title shows whichever markup rendered it', () => {
  // listHeader.jade has two shapes: on a mini screen the h2 is a direct child of
  // .list-header, otherwise it is wrapped in a div. Mobile mode places the title by
  // grid row/column, which only applies to a direct grid ITEM - inside the wrapper
  // the placement was ignored and the title was squeezed into the 30px first column.
  const mini = listJade.indexOf('if isMiniScreen');
  assert.ok(mini > -1, 'the mini-screen branch exists');
  assert.ok(/div\(class="\{\{#if collapsed\}\}list-rotated/.test(listJade),
    'and the other branch wraps the title in a div');
  const rule = /\.mobile-mode \.list-header > div:not\(\.list-rotated\)[^{]*\{([^}]*)\}/
    .exec(boardCss);
  assert.ok(rule, 'the wrapper must be dropped from the layout in mobile mode');
  assert.ok(/display:\s*contents/.test(rule[1]),
    'display:contents makes its children grid items in both shapes');
  // The title is still placed by grid, which is what needed the wrapper gone.
  const name = /\.mobile-mode \.list-header \.list-header-name \{([^}]*)\}/.exec(boardCss);
  assert.ok(name && /grid-column:\s*2/.test(name[1]), 'the title is grid-placed');
});

test('a collapsed list keeps its rotation wrapper (negative)', () => {
  // display:contents on .list-rotated would remove the box that does the rotating.
  const rule = /\.mobile-mode \.list-header > div:not\(\.list-rotated\)([^{]*)\{/.exec(boardCss);
  assert.ok(rule, 'the rule must exist');
  assert.ok(/:not\(\.list-move-buttons\)/.test(rule[1]),
    'the screen-reader move buttons keep their box too');
});

test('the board reflows instead of overflowing by a scrollbar width', () => {
  // 100vw includes the vertical scrollbar. The board canvas scrolls vertically, so
  // every child forced to 100vw was a scrollbar wider than the box it sat in - at
  // each nesting level - and min-width pinned it there, so it could not reflow.
  // Comments blanked first: the note explaining this fix names the unit it replaced.
  const code = boardCss.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/100vw/.test(code),
    'mobile board sizing must use 100%, which excludes the scrollbar');
  // The elements that were 100vw must still be full width, just measured correctly.
  const canvas = /\.mobile-mode \.board-canvas \{([^}]*overflow-x[^}]*)\}/.exec(boardCss);
  assert.ok(canvas && /width:\s*100% !important/.test(canvas[1]),
    'the canvas is still full width');
});

console.log(`\nmobileModeConsistency: ${passed} tests passed`);
