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
  const page = viewportRules(layouts).filter(r => r.selector === 'body');
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

test('a vertical swipe has one owner: the content page, not nested board panes', () => {
  const mobile = boards.slice(boards.indexOf('/* Fix multiple scrollbars issue on mobile */'));
  for (const selector of ['.boards-left-menu', '.board-list']) {
    const at = selector === '.board-list'
      ? mobile.indexOf('  .board-list,\n  .board-list.mobile-view {')
      : mobile.indexOf(`  ${selector} {`);
    assert.ok(at !== -1, `${selector} must have a mobile rule`);
    const body = mobile.slice(at, mobile.indexOf('}', at));
    assert.ok(/overflow-y: visible(?: !important)?;/.test(body),
      `${selector}: it must grow inside #content, not capture the swipe`);
    assert.ok(!/overscroll-behavior: contain;/.test(body),
      `${selector}: it must not contain scrolling away from #content`);
    assert.ok(!/touch-action: pan-y;/.test(body),
      `${selector}: it must not claim the page's vertical gesture`);
  }
});

test('#content scrolls on a phone in both mobile and desktop UI modes', () => {
  const mobile = layouts.slice(layouts.indexOf('/* Mobile devices (up to 800px)'));
  const at = mobile.indexOf('\n  #content {');
  assert.notStrictEqual(at, -1, 'the shared device-width block must define the page scroller');
  const body = mobile.slice(mobile.indexOf('{', at) + 1, mobile.indexOf('}', at))
    .replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(/overflow-y:\s*auto;/.test(body),
    'the shared device-width rule must make #content scroll without depending ' +
    'on body.mobile-mode; desktop mode on a smartphone must reach every page');
  assert.ok(!/overflow:\s*hidden;/.test(body),
    'a hidden #content clips the bottom of pages when desktop mode is selected');
});

test('the mobile body is exactly one viewport, stated in dvh as well as vh', () => {
  // `position: fixed; height: 100vh` on the body has the same problem, and it is
  // what the whole mobile layout hangs from.
  const body = layouts.slice(layouts.indexOf('body.mobile-mode {'));
  assert.ok(/height: 100vh;[\s\S]{0,400}height: 100dvh;/.test(body));
});

test('#content is sized by the flex column, not by a guess at the header height', () => {
  // CHANGED DELIBERATELY, and the change is the fix for #6488 rather than a
  // relaxation of this guard. This used to REQUIRE
  //   height: calc(100vh - 48px); height: calc(100dvh - 48px);
  // and getting the dvh fallback right there was the whole point - but the rule
  // was wrong in a way no dvh can repair: `- 48px` is a guess at how tall the
  // header is, and the header is not 48px and is not any one number. Utils
  // publishes --wekan-header-height from a ResizeObserver precisely because the
  // quick-access bar wraps to a second and third row depending on language and
  // width, and its comment says every fixed number for it has been wrong.
  //
  // On a phone with a wrapped header, #content was therefore TALLER than the room
  // under it, so its bottom sat below the screen - and body.mobile-mode is
  // `position: fixed` and `overflow: hidden`, so that strip is unreachable. The
  // `height: 100%` chain below it inherited the error and the last boards ended
  // up where no gesture could reach: "at smartphone, at All Boards page, it is
  // not possible to scroll down to see remaining of boards."
  //
  // body is a flex column of exactly one viewport and #content is its `flex: 1`
  // item, so the space under the header ALREADY is this box, at whatever height
  // the header really is. So what is pinned now is the absence of the arithmetic.
  const contentAt = layouts.indexOf('body.mobile-mode #content {');
  assert.notStrictEqual(contentAt, -1, 'layouts.css has no body.mobile-mode #content rule');
  // Comments stripped first: the rule explains at length what it used to say,
  // and quoting the old declaration must not read as still declaring it.
  const content = layouts.slice(contentAt, layouts.indexOf('}', contentAt))
    .replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/height:\s*calc\(/.test(content),
    'body.mobile-mode #content must not compute a height from the viewport: a ' +
    'fixed number for the header is what put the bottom of the page off screen');
  assert.ok(/min-height:\s*0;/.test(content),
    'it must be allowed to be shorter than its content, or the inner scroller ' +
    'below it can never scroll');
  // ...and the flex item it depends on is really there.
  const base = layouts.slice(layouts.indexOf('\n#content {'));
  assert.ok(/flex:\s*1;/.test(base.slice(0, base.indexOf('}'))),
    '#content must stay the flex: 1 item of the body column - that is what now ' +
    'gives it the height the calc() was guessing at');
  const bodyRule = layouts.slice(layouts.indexOf('\nbody {'));
  assert.ok(/flex-direction:\s*column;/.test(bodyRule.slice(0, bodyRule.indexOf('}'))),
    'and body must stay a flex column, or #content has no share to take');
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
