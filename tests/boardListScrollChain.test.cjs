'use strict';

// #6488 "in mobile board menu you cant scroll boards" - reported against 10.10,
// 10.37 and again against 10.38, after two attempts that made the numbers more
// accurate instead of removing them.
//
// The board list used to be an inner scroller built out of viewport arithmetic:
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
// It now grows naturally inside #content, the page's one native vertical
// scroller. A swipe has one owner even when invitation controls make a tile
// taller than the ordinary grid row.
//
// Run: node tests/boardListScrollChain.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const css = read('client/components/boards/boardsList.css');
const layouts = read('client/components/main/layouts.css');

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
  const globalPhone = layouts.slice(layouts.indexOf('/* Mobile devices (up to 800px)'));
  const bodyAt = globalPhone.indexOf('\n  body {');
  assert.notStrictEqual(bodyAt, -1, 'the shared phone layout must size the body');
  const body = globalPhone.slice(globalPhone.indexOf('{', bodyAt) + 1,
    globalPhone.indexOf('}', bodyAt));
  assert.ok(has(body, 'height: 100vh;'), 'the fallback');
  assert.ok(has(body, 'height: 100dvh;'), 'and the viewport as it is right now');
  assert.ok(body.indexOf('100vh') < body.indexOf('100dvh'),
    'the dvh value must come second, or it is overridden');
});

test('every step from the wrapper to the list grows inside #content', () => {
  const wrapper = ruleFor('#content .wrapper');
  assert.ok(wrapper, 'the page wrapper must be sized here');
  // NOT a bare `.wrapper`: #header-main-bar carries that class on every page that
  // is not a board, so a bare rule turns the header bar into a flex column and
  // centres "My Boards" in it.
  assert.ok(!ruleFor('.wrapper'), 'the rule must not also land on the header bar');
  assert.ok(has(wrapper, 'height: auto;') && has(wrapper, 'overflow: visible;'),
    'the wrapper contributes its natural height to the page scroller');
  assert.ok(!/100dvh|100vh/.test(wrapper), 'no viewport arithmetic in the wrapper');
  assert.ok(has(wrapper, 'display: flex;') && has(wrapper, 'flex-direction: column;'));
  assert.ok(has(wrapper, 'min-height: 0;'));

  const layout = ruleFor('#content .wrapper > .boards-layout');
  assert.ok(layout && has(layout, 'flex: 0 0 auto;') && has(layout, 'min-height: 0;'),
    'the layout contributes its rows instead of becoming another bounded pane');

  const column = ruleFor('.boards-layout > .boards-right-grid');
  assert.ok(column && has(column, 'height: auto;') && has(column, 'min-height: 0;'),
    'the board column grows with its content');

  const grid = ruleFor('.boards-right-grid');
  assert.ok(grid && has(grid, 'display: flex;') && has(grid, 'flex-direction: column;'),
    'so its header and its list can be laid out as fixed + flexible');
});

test('the list grows naturally, and the pager above it keeps its own height', () => {
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
  assert.ok(has(list, 'flex: 0 0 auto;'), 'the list contributes its natural height');
  assert.ok(has(list, 'height: auto;') && has(list, 'max-height: none;'));
  assert.ok(has(list, 'overflow-y: visible'), '#content, not the list, is the scroller');
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
  assert.ok(has(menu, 'height: auto;') && has(menu, 'max-height: none;')
    && has(menu, 'overflow-y: visible'),
  'the menu grows within the same page scroller');
});

test('both modes use the same mechanism', () => {
  // `.mobile-view` is added by isMiniScreen, i.e. only in mobile mode. It used to
  // carry its own `calc(100dvh - 120px)`, so the two modes scrolled differently.
  const mv = ruleFor('.board-list.mobile-view');
  assert.ok(mv, 'the phone block must override the more-specific mobile-view rule');
  assert.ok(has(mv, 'height: auto;') && has(mv, 'overflow-y: visible'),
    'mobile mode also leaves vertical scrolling to #content');
  assert.ok(has(mv, 'flex: 0 0 auto;'), 'it grows with the same natural-height contract');
  assert.ok(!/calc\(100[dv]+h/.test(mv), 'and not from the viewport');

  const globalPhone = layouts.slice(layouts.indexOf('/* Mobile devices (up to 800px)'));
  const contentAt = globalPhone.indexOf('\n  #content {');
  const content = globalPhone.slice(globalPhone.indexOf('{', contentAt) + 1,
    globalPhone.indexOf('}', contentAt));
  assert.ok(contentAt !== -1 && has(content, 'overflow-y: auto;'),
    'the shared device-width rule must make every page scroll in desktop mode too');
  assert.ok(!/overflow:\s*hidden;/.test(content),
    'desktop mode must not clip the shared Starred/Remaining/etc. page');
});

test('neither child traps a vertical swipe (negative)', () => {
  for (const selector of ['.board-list', '.boards-left-menu']) {
    const rule = ruleFor(selector);
    assert.ok(!/overflow-y:\s*(auto|scroll)/.test(rule), `${selector}: no nested scroller`);
  }
});

console.log(`\n${passed} tests passed`);
