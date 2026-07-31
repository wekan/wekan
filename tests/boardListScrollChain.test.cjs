'use strict';

// #6488 "in mobile board menu you cant scroll boards" - reported against 10.10,
// 10.37 and again against 10.38, after two attempts that made the numbers more
// accurate instead of removing them.
//
// The board list is an inner scroller, and an inner scroller only works when
// every ancestor between it and the viewport has a DEFINITE height. On a phone
// the chain was built out of viewport arithmetic instead:
//
//   .wrapper       height: 100dvh   <- but it starts BELOW the two header bars,
//                                      so its bottom was ~two bars off screen,
//                                      and it is `overflow: hidden`
//   .boards-layout (no height)      <- so `height: 100%` below it resolved to auto
//   .board-list    height: calc(100dvh - 120px)
//                                   <- a guess at everything above it; on a phone
//                                      that is ~226px (two bars + a search header
//                                      that wraps to two rows), so the list box
//                                      reached ~100px below the screen and its
//                                      last rows sat where no gesture could reach
//
// It is a flex chain now, with no viewport arithmetic below `body`: each part
// takes what its parent has left, and the list ends where the screen does.
//
// Run: node tests/boardListScrollChain.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const css = read('client/components/boards/boardsList.css');

// The phone block: "Fix multiple scrollbars issue on mobile" through the rules
// that follow it in the same media query.
const phoneBlock = (() => {
  const at = css.indexOf('/* Fix multiple scrollbars issue on mobile */');
  assert.ok(at !== -1, 'the phone block must exist');
  return css.slice(at, at + 9000);
})();

function ruleFor(selector, block = phoneBlock) {
  for (const m of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sels = m[1].split(',').map(s => s.trim().split('\n').pop().trim());
    if (sels.includes(selector)) return m[2].replace(/\/\*[\s\S]*?\*\//g, '');
  }
  return null;
}

const has = (body, decl) => !!body && new RegExp(decl).test(body);

console.log('boardListScrollChain:');

test('the page itself is exactly the visible viewport', () => {
  const body = ruleFor('body');
  assert.ok(body, 'the phone block must size the body');
  assert.ok(has(body, 'height: 100vh;'), 'the fallback');
  assert.ok(has(body, 'height: 100dvh;'), 'and the viewport as it is right now');
  assert.ok(body.indexOf('100vh') < body.indexOf('100dvh'),
    'the dvh value must come second, or it is overridden');
});

test('every step from the wrapper to the list has a definite height', () => {
  const wrapper = ruleFor('#content .wrapper');
  assert.ok(wrapper, 'the page wrapper must be sized here');
  // NOT a bare `.wrapper`: #header-main-bar carries that class on every page that
  // is not a board, so a bare rule turns the header bar into a flex column and
  // centres "My Boards" in it.
  assert.ok(!ruleFor('.wrapper'), 'the rule must not also land on the header bar');
  assert.ok(has(wrapper, 'height: 100%;'),
    'the wrapper is the space #content has left - NOT the whole viewport: it '
    + 'starts below the header bars, so 100dvh put its bottom off the screen');
  assert.ok(!/100dvh|100vh/.test(wrapper), 'no viewport arithmetic in the wrapper');
  assert.ok(has(wrapper, 'display: flex;') && has(wrapper, 'flex-direction: column;'));
  assert.ok(has(wrapper, 'min-height: 0;'));

  const layout = ruleFor('#content .wrapper > .boards-layout');
  assert.ok(layout && has(layout, 'flex: 1 1 auto;') && has(layout, 'min-height: 0;'),
    'the layout takes the rest of the wrapper and may shrink below its content');

  const column = ruleFor('.boards-layout > .boards-right-grid');
  assert.ok(column && has(column, 'height: 100%;') && has(column, 'min-height: 0;'),
    'the board column fills the layout row and may shrink below its content');

  const grid = ruleFor('.boards-right-grid');
  assert.ok(grid && has(grid, 'display: flex;') && has(grid, 'flex-direction: column;'),
    'so its header and its list can be laid out as fixed + flexible');
});

test('the list is the flexible part, and the pager above it is not', () => {
  // This used to name `.boards-path-header` first - the white bar that carried
  // the section icon and, before that, the page's controls. There is no bar:
  // the controls are in the second top header bar and the icon repeated what
  // the left menu already highlights, so the pager is the only fixed-height
  // thing left above the list.
  assert.ok(!ruleFor('.boards-right-grid > .boards-path-header'), 'no section-title bar');
  const pager = ruleFor('.boards-right-grid > .boards-pagination');
  assert.ok(pager && has(pager, 'flex: 0 0 auto;'),
    'the pager keeps its own height, whatever it wraps to');

  const list = ruleFor('.board-list');
  assert.ok(list, '.board-list must be sized in the phone block');
  assert.ok(has(list, 'flex: 1 1 auto;'), 'the list takes the rest of the column');
  assert.ok(has(list, 'min-height: 0;'), 'and may be shorter than its content');
  assert.ok(has(list, 'overflow-y: auto'), 'which is what makes it the scroller');
  assert.ok(!/calc\(100[dv]+h/.test(list),
    'no "viewport minus a guess at the bars" - that guess was 120px against ~226px');
});

test('no magic viewport arithmetic is left in the phone scrollers', () => {
  for (const selector of ['.board-list', '.boards-left-menu', '.board-list.mobile-view']) {
    const rule = ruleFor(selector) || ruleFor(selector, css);
    assert.ok(rule, `${selector} must exist`);
    assert.ok(!/- 120px/.test(rule),
      `${selector}: the 120px guess is what put the bottom of the box off screen`);
  }
  const menu = ruleFor('.boards-left-menu');
  assert.ok(has(menu, 'height: 100%;') && has(menu, 'max-height: none;'),
    'the menu is bounded by the layout, not by a guess');
});

test('both modes use the same mechanism', () => {
  // `.mobile-view` is added by isMiniScreen, i.e. only in mobile mode. It used to
  // carry its own `calc(100dvh - 120px)`, so the two modes scrolled differently.
  const mv = ruleFor('.board-list.mobile-view', css);
  assert.ok(mv, 'the mobile-view list rule must exist');
  assert.ok(has(mv, 'flex: 1 1 auto;') && has(mv, 'min-height: 0;'),
    'mobile mode sizes the list from the column too');
  assert.ok(!/calc\(100[dv]+h/.test(mv), 'and not from the viewport');
});

test('a swipe on either scroller stays in it', () => {
  for (const selector of ['.board-list', '.boards-left-menu']) {
    const rule = ruleFor(selector);
    assert.ok(has(rule, 'overscroll-behavior: contain;'), `${selector}: no page behind`);
    assert.ok(has(rule, 'touch-action: pan-y;'), `${selector}: a vertical swipe scrolls it`);
  }
});

console.log(`\n${passed} tests passed`);
