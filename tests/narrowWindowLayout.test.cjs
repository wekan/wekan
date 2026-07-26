'use strict';

// A narrow WINDOW gets the narrow-window layout - not only an explicit mobile mode.
//
// The phone/desktop toggle writes an explicit choice, and `Utils.isMiniScreen()`
// returns it as-is: a phone whose user picked DESKTOP mode is not a mini screen and
// its body has no `.mobile-mode`. Every fix written for `.mobile-mode` or gated on
// `isMiniScreen` therefore did nothing there, while the viewport was still 375px.
// Three of them were visible at once on such a phone:
//
//   * "Create board" opened 160px in with its right half off the screen, because
//     the popup geometry laid it out for a 380px box while the CSS made it the
//     full width of the window - and left the inline `left` in place;
//   * the board bar's hamburger was pushed to a third row of its own;
//   * the quick-access bar was wider than the screen, so the avatar was cut off.
//
// Run: node tests/narrowWindowLayout.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const offsetSrc = read('client/lib/popupOffset.js');
const popupCss = read('client/components/main/popup.css');
const boardCss = read('client/components/boards/boardHeader.css');
const headerCss = read('client/components/main/header.css');

// A replay of the popup geometry's first decision.
const MOBILE_POPUP_MAX_WIDTH = 800;
function isSheet({ viewportWidth, isMiniScreen }) {
  return isMiniScreen || viewportWidth <= MOBILE_POPUP_MAX_WIDTH;
}

console.log('narrowWindowLayout:');

test('a popup on a narrow window is a sheet at 0,0 - mobile mode or not', () => {
  // The case from the screenshot: an iPhone whose user chose desktop mode.
  assert.ok(isSheet({ viewportWidth: 375, isMiniScreen: false }),
    'a 375px window is a sheet even when the user is in desktop mode');
  assert.ok(isSheet({ viewportWidth: 375, isMiniScreen: true }));
  assert.ok(isSheet({ viewportWidth: 800, isMiniScreen: false }), 'the boundary is inclusive');
  assert.ok(!isSheet({ viewportWidth: 801, isMiniScreen: false }),
    'a real window still opens the popup at its button');
});

test('the geometry says so before it computes anything else', () => {
  const at = offsetSrc.indexOf('if (isMiniScreen || viewportWidth <= MOBILE_POPUP_MAX_WIDTH)');
  assert.ok(at !== -1, 'the width check must be there');
  assert.ok(at < offsetSrc.indexOf('const popupWidth'),
    'and before the popup-width math, which assumes a floating box');
  assert.ok(/const MOBILE_POPUP_MAX_WIDTH = 800;/.test(offsetSrc),
    'the width is named, so it can be kept in step with the media query');
  assert.ok(/export \{ computePopupOffset, MOBILE_POPUP_MAX_WIDTH \}/.test(offsetSrc));
});

test('and the CSS pins the sheet, so the inline left cannot move it', () => {
  const at = popupCss.indexOf('@media screen and (max-width: 800px) {');
  assert.ok(at !== -1);
  const block = popupCss.slice(at, popupCss.indexOf('.pop-over .header', at));
  for (const decl of ['position: fixed !important;', 'top: 0 !important;',
    'inset-inline-start: 0 !important;', 'max-width: 100vw !important;']) {
    assert.ok(block.includes(decl), `the sheet must declare ${decl}`);
  }
  // `!important` matters: Popup._getOffset writes left/top as inline styles.
  assert.ok(/style="left:\{\{offset\.left\}\}px; top:\{\{offset\.top\}\}px;/
    .test(read('client/components/main/popup.tpl.jade')),
    'the inline style this overrides');
});

test('the board bar puts its hamburger in the corner by width too', () => {
  const at = boardCss.indexOf('/* The same three rules by WIDTH, not by mobile mode.');
  assert.ok(at !== -1, 'the width-based copy of the mobile-mode rules must be there');
  const block = boardCss.slice(at, boardCss.indexOf('\n}\n', boardCss.indexOf('sidebar-toggle', at)));
  assert.ok(/@media screen and \(max-width: 800px\)/.test(block));
  assert.ok(/body\.board-view #header #header-main-bar \{[\s\S]*?padding-inline-end: 44px;/.test(block),
    'the bar reserves the hamburger width');
  assert.ok(/\.board-header-sidebar-toggle \{[\s\S]*?position: absolute;/.test(block),
    'and the hamburger leaves the flow, instead of wrapping to a row of its own');
  // The mobile-mode originals stay - both paths have to agree.
  assert.ok(/body\.board-view\.mobile-mode #header #header-main-bar \.board-header-sidebar-toggle \{/
    .test(boardCss));
});

test('the drag-handle toggle is one button on one line', () => {
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  const rule = /\.js-toggle-desktop-drag-handles \{([\s\S]*?)\}/.exec(block);
  assert.ok(rule, 'the toggle must be sized in the phone block');
  assert.ok(/white-space: nowrap !important;/.test(rule[1]),
    'its arrows and its check/ban are one button, not two lines');
  assert.ok(/display: inline-flex !important;/.test(rule[1]));
});

test('the bar gives back the width the avatar needs', () => {
  const block = headerCss.slice(headerCss.indexOf('The quick-access bar must FIT the phone'));
  const toggle = /\.mobile-mode-toggle \.board-header-btn \{([\s\S]*?)\}/.exec(block);
  assert.ok(toggle, 'the mode toggle must be trimmed');
  const pad = /padding:\s*(\d+)px (\d+)px/.exec(toggle[1]);
  assert.ok(pad && Number(pad[2]) <= 10,
    `21px each side of two icons was the widest item after the zoom pill, found ${pad && pad[2]}px`);
  const logo = /#header-quick-access img,([\s\S]*?)\}/.exec(block);
  assert.ok(logo && /max-width: 64px !important;/.test(logo[1]), 'and the logo is capped');
  // The `.iphone-device` fallback sets 84px with one class more, so it must be
  // named explicitly or it wins outright.
  assert.ok(/\.iphone-device #header-quick-access img,/.test(block),
    'the iphone-device variant must be named, or the cap never applies there');
});

console.log(`\n${passed} tests passed`);
