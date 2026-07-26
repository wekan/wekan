'use strict';

// #6488: "in mobile board menu you cant scroll boards".
//
// The All Boards page on a phone sizes its scroll containers from the viewport:
// the wrapper, the left menu and the board list are each `100vh` minus a bit. On a
// phone `100vh` is the viewport with the browser's toolbars HIDDEN - it is
// deliberately the LARGEST the viewport can get - so with the toolbar showing,
// those boxes reach under it. The wrapper is `overflow: hidden`, so the part
// underneath cannot be scrolled to at all: the bottom of the board list, and the
// bottom of the menu, are simply unreachable.
//
// `100dvh` is the viewport as it is at that moment. Every one of those rules now
// states the `vh` value first (the fallback for a browser without `dvh`) and the
// `dvh` value immediately after, so a browser that understands it uses the real
// height and one that does not behaves exactly as before.
//
// A CSS source guard: there is no phone here, and Playwright's fixed viewport has
// no browser toolbar, so spec 43 cannot see this at all.
//
// Run: node tests/mobileViewportHeight.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const boards = read('client/components/boards/boardsList.css');
const layouts = read('client/components/main/layouts.css');

// Every `height`/`max-height` declaration that measures the viewport, with the
// rule it belongs to.
function viewportRules(css) {
  const out = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, selector, body] = m;
    if (!/(?:max-)?height:[^;]*\d(?<!d)vh/.test(body)) continue;
    out.push({ selector: selector.trim().split('\n').pop().trim(), body });
  }
  return out;
}

console.log('mobileViewportHeight:');

test('every viewport-sized box on the phone board list also states dvh', () => {
  const missing = [];
  for (const { selector, body } of viewportRules(boards)) {
    // A `vh` height must be followed by the same property in `dvh`.
    for (const prop of ['height', 'max-height']) {
      const vh = new RegExp(`(?<![-\\w])${prop}:[^;]*\\d(?<!d)vh`).test(body);
      const dvh = new RegExp(`(?<![-\\w])${prop}:[^;]*dvh`).test(body);
      if (vh && !dvh) missing.push(`${selector} { ${prop} }`);
    }
  }
  assert.deepStrictEqual(missing, [],
    'a box sized in vh reaches under the browser toolbar, and the wrapper clips it');
});

test('the containers the issue is about no longer do viewport arithmetic', () => {
  // They used to be sized `100dvh` / `calc(100dvh - 120px)` each. That was the
  // second attempt at #6488 and it was still wrong: the wrapper starts BELOW the
  // header bars, and 120px was a guess at a ~226px header. They take the space
  // their parent has left now - see tests/boardListScrollChain.test.cjs - and
  // only the PAGE is measured against the viewport.
  for (const selector of ['.wrapper', '.boards-left-menu', '.board-list']) {
    const sized = viewportRules(boards).filter(r => r.selector.includes(selector));
    assert.deepStrictEqual(sized.map(r => r.selector), [],
      `${selector} must be sized by its parent, not by the viewport`);
  }
  const page = viewportRules(boards).filter(r => r.selector === 'body');
  assert.ok(page.length, 'the page itself is still measured against the viewport');
  assert.ok(page.some(r => /(?<![-\w])height:[^;]*dvh/.test(r.body)),
    'in dvh, so it is what is on screen right now');
});

test('the fallback comes FIRST, so an old browser keeps today’s behaviour', () => {
  // Reversed, `dvh` would be overridden by `vh` everywhere and the fix would do
  // nothing; the browser that does not understand `dvh` simply ignores that line.
  for (const css of [boards, layouts]) {
    for (const { selector, body } of viewportRules(css)) {
      for (const prop of ['height', 'max-height']) {
        const vh = new RegExp(`(?<![-\\w])${prop}:[^;]*\\d(?<!d)vh`).exec(body);
        const dvh = new RegExp(`(?<![-\\w])${prop}:[^;]*dvh`).exec(body);
        if (vh && dvh) {
          assert.ok(vh.index < dvh.index,
            `${selector}: the vh fallback must be declared before the dvh value`);
        }
      }
    }
  }
});

test('a vertical swipe in those scrollers is a scroll, and stays in them', () => {
  const mobile = boards.slice(boards.indexOf('/* Fix multiple scrollbars issue on mobile */'));
  for (const selector of ['.boards-left-menu', '.board-list']) {
    const at = mobile.indexOf(`  ${selector} {`);
    assert.ok(at !== -1, `${selector} must have a mobile rule`);
    const body = mobile.slice(at, mobile.indexOf('}', at));
    assert.ok(/overscroll-behavior: contain;/.test(body),
      `${selector}: a swipe must not turn into a page scroll behind it`);
    assert.ok(/touch-action: pan-y;/.test(body),
      `${selector}: a vertical swipe must be given to this scroller`);
  }
});

test('mobile mode sizes the body and the content area the same way', () => {
  // `position: fixed; height: 100vh` on the body has the same problem, and it is
  // what the whole mobile layout hangs from.
  const body = layouts.slice(layouts.indexOf('body.mobile-mode {'));
  assert.ok(/height: 100vh;[\s\S]{0,400}height: 100dvh;/.test(body));
  const content = layouts.slice(layouts.indexOf('body.mobile-mode #content {'));
  assert.ok(/height: calc\(100vh - 48px\);\s*\n\s*height: calc\(100dvh - 48px\);/.test(content));
});

test('the board tiles still drag from their handle only, on a touch screen', () => {
  // The reason the list can be scrolled by finger at all: with drag handles on -
  // which a touch screen turns on - a drag may only start from the handle, so a
  // swipe across a tile scrolls instead of picking the board up. If that gate goes,
  // the list stops scrolling again however the heights are written.
  const js = read('client/components/boards/boardsList.js');
  assert.ok(/if \(Utils\.showDragHandles\(\) && !boardPressStartedOnHandle\) \{[\s\S]{0,120}preventDefault/.test(js),
    'a drag that did not begin on the handle is cancelled');
  const jade = read('client/components/boards/boardsList.jade');
  assert.ok(/if isTouchScreenOrShowDesktopDragHandles\s*\n\s*span\.board-handle/.test(jade),
    'and the handle is rendered on a touch screen');
  const touch = read('client/lib/dragDropTouch.js');
  assert.ok(/if \(!startEv \|\| startEv\.defaultPrevented\) \{[\s\S]{0,300}return false;/.test(touch),
    'the touch bridge honours that cancellation, so the swipe stays a scroll');
});

console.log(`\n${passed} tests passed`);
