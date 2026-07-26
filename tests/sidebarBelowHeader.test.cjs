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
  assert.ok(/getElementById\('header'\)/.test(block), 'it measures the real element');
  assert.ok(/getBoundingClientRect\(\)\.height/.test(block),
    'its rendered height, not a guess from font sizes');
  assert.ok(/setProperty\('--wekan-header-height'/.test(block));
  assert.ok(/new ResizeObserver\(publishHeaderHeight\)\.observe\(header\)/.test(block),
    'a window resize does not fire when the buttons re-wrap - only a resize '
    + 'observer on the header catches that');
  assert.ok(/\$\(window\)\.on\('resize orientationchange', publishHeaderHeight\)/.test(block),
    'and an orientation change moves the bars too');
  assert.ok(/__wekanHeightObserved/.test(block), 'observed once, not once per call');
});

test('it survives the header not existing yet', () => {
  const block = utils.slice(utils.indexOf('--wekan-header-height: how tall'));
  assert.ok(/const header = document\.getElementById\('header'\);\s*\n\s*const height = header \?/
    .test(block), 'no header yet means height 0, not a thrown TypeError');
  assert.ok(/document\.readyState === 'loading'/.test(block),
    'the header is rendered by Blaze, so this runs again after the first render');
  assert.ok(/typeof window !== 'undefined' && typeof document !== 'undefined'/.test(block),
    'and never on the server, where this file is also imported');
});

console.log(`\n${passed} tests passed`);
