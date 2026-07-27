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
// Comments out: a `/* ... padding: ... */` note above a rule would otherwise be read
// as one of its declarations, and a `}` inside one would end the block early.
const css = read('client/components/main/header.css').replace(/\/\*[\s\S]*?\*\//g, '');

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

test('the hamburger is centred between its divider and the end of the bar', () => {
  // It used to have 2px on the left and 8px on the right, which is not a centre: the
  // button sat left of the middle of that space, with an empty strip beside it at the
  // edge of the bar. Equal side margins put it in the middle of the space it owns.
  const ham = block('#header #header-main-bar .board-header-btn.js-toggle-sidebar');
  const start = /margin-inline-start:\s*(\d+)px/.exec(ham);
  const end = /margin-inline-end:\s*(\d+)px/.exec(ham);
  assert.ok(start && end, 'both side margins are declared');
  assert.strictEqual(start[1], end[1], 'equal side margins = centred in that space');
  // The bar contributes no right padding, so those margins own the gap to the edge.
  const bar = block('#header #header-main-bar');
  const padding = /padding:\s*([^;]+);/.exec(bar);
  assert.ok(padding, 'the bar declares its padding');
  const [top, right, bottom] = padding[1].trim().split(/\s+/);
  assert.strictEqual(right, '0', 'no right padding on the bar');
  assert.strictEqual(top, bottom,
    'symmetric block padding, so align-items: center centres on the bar middle');
});

test('nothing in the bar is nudged off that centre line', () => {
  // A margin on one flex item is a shift, not centring: `margin-top: 3px` on the
  // button groups put every button below the middle while the board title stayed on
  // it, which is what made the title read as sitting too high.
  const groups = block('#header #header-main-bar .board-header-btns');
  assert.ok(/margin-top:\s*0/.test(groups), 'the button groups carry no top margin');
  const bar = block('#header #header-main-bar');
  assert.ok(/row-gap:/.test(bar), 'wrapped rows are separated by row-gap instead');
  // And the title centres on its own text, not on a line box far taller than it.
  const h1 = block('#header #header-main-bar h1');
  assert.ok(/display:\s*flex/.test(h1) && /align-items:\s*center/.test(h1),
    'the title is centred in its own box');
  assert.ok(!/line-height:\s*1\.7em/.test(h1), 'no towering line box around the title');
  // The always-true `body:not(.board-view)` rule must not zero that padding again:
  // nothing sets `board-view` on <body>, so that selector matches on every page.
  const legacy = block('body:not(.board-view) #header #header-main-bar');
  assert.ok(!/padding-top:\s*0/.test(legacy) && !/padding-bottom:\s*0/.test(legacy),
    'it no longer overrides the symmetric padding');
});

test('the board-settings cog is removed from the header (it is in the sidebar)', () => {
  const jade = read('client/components/boards/boardHeader.jade');
  assert.ok(!/js-open-board-menu/.test(jade), 'no cog in the board header');
  const js = read('client/components/boards/boardHeader.js');
  assert.ok(!/js-open-board-menu/.test(js), 'no dead cog handler in the board header');
});

test('the hamburger is its own flex item, still last on a wide screen', () => {
  // It used to sit at the end of the `.right` group. It was lifted out so that in
  // mobile mode it can stay in the top right corner while the other buttons wrap to
  // the second row - inside that group it could only wrap down along with them.
  const jade = read('client/components/boards/boardHeader.jade');
  const wrapperAt = jade.indexOf('.board-header-btns.board-header-sidebar-toggle');
  const hamburgerAt = jade.indexOf('js-toggle-sidebar');
  assert.ok(wrapperAt !== -1, 'the hamburger has its own wrapper');
  assert.ok(hamburgerAt > wrapperAt, 'and sits inside it');
  // Its divider goes with it, on its left.
  assert.ok(jade.indexOf('.separator', wrapperAt) < hamburgerAt,
    'the divider is to the left of the hamburger');
  // The visible result on a wide screen is unchanged: last item, hugging the right
  // edge. The wrapper comes BEFORE the other buttons in the markup (so it can share
  // the first row with the title on a phone), so `order` puts it back at the end.
  const wrapper = block('#header #header-main-bar .board-header-sidebar-toggle');
  assert.ok(/order:\s*1/.test(wrapper), 'ordered last on a wide screen');
  assert.ok(/margin-inline-start:\s*auto/.test(wrapper), 'hugging the right edge');
});

test('board header button text labels are NOT hidden (icons-only reverted)', () => {
  assert.ok(!/board-header-btn i\.fa \+ span:not\(\.board-star-counter\)\s*{\s*display:\s*none/.test(css),
    'no rule hiding the board-header button text labels');
});

console.log(`\nAll ${passed} header-hamburger tests passed`);
