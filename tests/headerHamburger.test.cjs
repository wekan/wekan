'use strict';

// The board header (Swimlanes + Lists views) must keep the right button group — which
// ends with the sidebar hamburger (js-toggle-sidebar) — pinned to the right edge at
// every window width. The old float layout let it drift to the middle as floats
// wrapped. This guards the flex layout + right-edge pin.
//
// Run: node tests/headerHamburger.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const css = read('client/components/main/header.css');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function block(selector) {
  const i = css.indexOf(selector + ' {');
  assert.ok(i !== -1, `missing rule: ${selector}`);
  return css.slice(i, css.indexOf('}', i));
}

test('header bar is a flex row (not floats)', () => {
  const bar = block('#header #header-main-bar');
  assert.ok(/display:\s*flex/.test(bar), 'header-main-bar is flex');
  assert.ok(/flex-wrap:\s*wrap/.test(bar), 'wraps so nothing is cut off');
});

test('the right group (with the hamburger) is pinned to the right edge', () => {
  const right = block('#header #header-main-bar .board-header-btns.right');
  assert.ok(/margin-inline-start:\s*auto/.test(right), 'margin-inline-start:auto pins it right');
  // NEGATIVE guard: it no longer relies on float to reach the right.
  assert.ok(!/float:\s*inline-end/.test(right), 'no float-based right positioning');
});

test('the hamburger right gap matches the user-name gap (~8px), left is tight', () => {
  const ham = block('#header #header-main-bar .board-header-btn.js-toggle-sidebar');
  assert.ok(/margin-inline-start:\s*2px/.test(ham), 'tight left margin');
  // 8px right edge gap = same as the top-bar user name.
  assert.ok(/margin-inline-end:\s*8px/.test(ham), 'right gap matches the user name (8px)');
  // The bar contributes no right padding, so the hamburger margin owns the gap.
  const bar = block('#header #header-main-bar');
  assert.ok(/padding:\s*7px 0 0 10px/.test(bar), 'no right padding on the bar');
  // the user-name gap we are matching (sanity) — grouped selector, so match on the
  // raw stylesheet rather than a single-rule block.
  assert.ok(/header-user-bar-name[\s\S]{0,160}margin:\s*4px 8px 0 0/.test(css),
    'user name has an 8px right margin');
});

test('the board-settings cog is removed from the header (it is in the sidebar)', () => {
  const jade = read('client/components/boards/boardHeader.jade');
  assert.ok(!/js-open-board-menu/.test(jade), 'no cog in the board header');
  const js = read('client/components/boards/boardHeader.js');
  assert.ok(!/js-open-board-menu/.test(js), 'no dead cog handler in the board header');
});

test('the hamburger lives in the right group in the board header', () => {
  const jade = read('client/components/boards/boardHeader.jade');
  const rightAt = jade.indexOf('.board-header-btns.right');
  const hamburgerAt = jade.indexOf('js-toggle-sidebar');
  assert.ok(rightAt !== -1 && hamburgerAt > rightAt, 'js-toggle-sidebar is inside the .right group');
});

test('board header button text labels are NOT hidden (icons-only reverted)', () => {
  assert.ok(!/board-header-btn i\.fa \+ span:not\(\.board-star-counter\)\s*{\s*display:\s*none/.test(css),
    'no rule hiding the board-header button text labels');
});

console.log(`\nAll ${passed} header-hamburger tests passed`);
