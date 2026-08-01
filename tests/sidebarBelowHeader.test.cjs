'use strict';

// The right sidebar's upper part was hidden behind the header bars.
//
// On a phone the sidebar is `position: fixed` - it has to be, or it pins to the
// far right of a board that is wider than the screen and shows as a narrow strip.
// But fixed means "against the viewport", and it was pinned at `top: 0`: the
// panel's own top - its title, its tabs, the members row - sat underneath the two
// header bars, so it appeared to start in the middle of itself.
//
// There is no fixed number for the header: the quick-access bar plus a board bar
// whose buttons wrap to one, two or three rows depending on the language and the
// window width. So the header MEASURES itself into --wekan-header-height and the
// sidebar starts there.
//
// Run: node tests/sidebarBelowHeader.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const sidebarCss = read('client/components/sidebar/sidebar.css');
const utils = read('client/lib/utils.js');

console.log('sidebarBelowHeader:');

test('the phone sidebar starts below the header, not at the viewport top', () => {
  const at = sidebarCss.indexOf('.board-sidebar.sidebar {');
  assert.ok(at !== -1, 'the phone sidebar rule must be there');
  const rule = sidebarCss.slice(at, sidebarCss.indexOf('}', at));
  assert.ok(/position: fixed;/.test(rule), 'fixed, so it spans the screen not the board');
  assert.ok(/top: var\(--wekan-header-height, 0px\);/.test(rule),
    'and it starts at the measured header height');
  assert.ok(!/(?<![-\w])top: 0;/.test(rule),
    '`top: 0` is what put the panel behind the header bars');
  assert.ok(/bottom: 0;/.test(rule), 'and it still reaches the bottom of the screen');
});

test('the header publishes its own height, and keeps it current', () => {
  const at = utils.indexOf('--wekan-header-height: how tall the two header bars actually are');
  assert.ok(at !== -1, 'the note explaining why a number will not do must be there');
  const block = utils.slice(at);
  // BOTH bars. This measured `#header` alone - the second bar - back when
  // every page had one. Most pages have none now, so on those the variable was
  // 0 and everything laid out against it started at the top of the WINDOW,
  // under the first bar: the All Boards sidebar covered it.
  assert.ok(/HEADER_IDS = \['header-quick-access', 'header'\]/.test(block),
    'it measures the first bar as well as the second');
  assert.ok(/getElementById\(id\)/.test(block), 'and measures the real elements');
  assert.ok(/getBoundingClientRect\(\)\.bottom/.test(block),
    'the BOTTOM of the lowest bar: any margin between them counts, and a bar '
    + 'that is absent contributes nothing without a special case');
  assert.ok(/setProperty\(\s*'--wekan-header-height'/.test(block));
  assert.ok(/new ResizeObserver\(publishHeaderHeight\)\.observe\(el\)/.test(block),
    'a window resize does not fire when the buttons re-wrap - only a resize '
    + 'observer on each bar catches that');
  assert.ok(/\$\(window\)\.on\('resize orientationchange', publishHeaderHeight\)/.test(block),
    'and an orientation change moves the bars too');
  assert.ok(/__wekanHeightObserved/.test(block), 'observed once, not once per call');
});

test('it survives the header not existing yet', () => {
  const block = utils.slice(utils.indexOf('--wekan-header-height: how tall'));
  assert.ok(/const el = document\.getElementById\(id\);\s*\n\s*if \(el\)/.test(block),
    'no bar yet means it contributes 0, not a thrown TypeError');
  assert.ok(/document\.readyState === 'loading'/.test(block),
    'the header is rendered by Blaze, so this runs again after the first render');
  assert.ok(/typeof window !== 'undefined' && typeof document !== 'undefined'/.test(block),
    'and never on the server, where this file is also imported');
});

test('the notifications drawer starts below the header too', () => {
  // xet7: "1st top header bar, when Notifications popup is open at full width,
  // avatar icon should not be above Notifications popup X close popup window."
  //
  // The drawer is fixed at `top: 48px` - a guess at the height of ONE header
  // bar. The first bar wraps to a second and a third row, and the user avatar
  // is the item that wraps last: on a window where it did, the drawer covered
  // the row the avatar was on, and the avatar - in a `z-index: 1000` bar -
  // painted straight over the drawer's own header, right beside the ✕ that
  // closes it.
  const drawer = read('client/components/notifications/notificationsDrawer.css');
  for (const selector of [
    'section#notifications-drawer {',
    'section#notifications-drawer .header {',
  ]) {
    const at = drawer.indexOf(selector);
    assert.notStrictEqual(at, -1, `${selector} must be there`);
    const rule = drawer.slice(at, drawer.indexOf('}', at));
    assert.ok(/position: fixed;/.test(rule), `${selector} is fixed to the viewport`);
    assert.ok(/top: var\(--wekan-header-height, 48px\);/.test(rule),
      `${selector} must start at the measured header height`);
    assert.ok(!/top:\s*48px;/.test(rule),
      `${selector}: a hard-coded 48px is the guess that put the avatar over it`);
  }
  // ...and the height it may take is the rest of the window under that header,
  // not the same guess written as a subtraction.
  const at = drawer.indexOf('section#notifications-drawer {');
  const rule = drawer.slice(at, drawer.indexOf('}', at));
  assert.ok(/max-height: calc\(100vh - var\(--wekan-header-height, 48px\)\);/.test(rule),
    'its height is measured from the same number');
  // The declarations, not the comments: the comment above that rule quotes the
  // old value on purpose, so the next reader knows what changed and why.
  const code = drawer.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/100vh - 28px - 36px/.test(code), 'not from that guess in two pieces');
});

console.log(`\n${passed} tests passed`);
