'use strict';

// Drag-to-scroll must work on the two top header bars too, not only below them.
//
// Everywhere else a drag scrolls: `.board-canvas.dragscroll` on a board, `<body>` /
// `#content` on the whole-page layouts. The header bars were the one dead area -
// grabbing them and dragging did nothing, and on a phone those two bars are a large
// share of what is on screen.
//
// They cannot just be tagged `.dragscroll`: that class scrolls the element carrying
// it, and neither bar is a scroll container - `#header` sits outside `#content` and
// outside the board canvas. So client/lib/headerDragscroll.js forwards the drag to
// whatever actually scrolls, and both bars are marked `.nodragscroll` so the
// page-level dragscroll does not scroll a second time from the same gesture.
//
// Run: node tests/headerDragscroll.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const mod = read('client/lib/headerDragscroll.js');
const headerJade = read('client/components/main/header.jade');
const headerJs = read('client/components/main/header.js');

console.log('headerDragscroll:');

test('both header bars are covered', () => {
  assert.ok(/#header-quick-access, #header/.test(mod),
    'the quick-access bar AND the board bar, not just one of them');
});

test('the module is actually loaded', () => {
  // A module nothing imports is dead code in the bundle.
  assert.ok(/import '\/client\/lib\/headerDragscroll'/.test(headerJs),
    'header.js must import it, so it loads wherever a header is rendered');
});

test('the bars opt out of the page-level dragscroll', () => {
  // Otherwise the same gesture scrolls twice: the dragscroll library binds mousedown
  // on <body>, and a mousedown on the header bubbles there.
  assert.ok(/#header-quick-access\.nodragscroll/.test(headerJade),
    'the quick-access bar must be .nodragscroll');
  assert.ok(/#header\.nodragscroll/.test(headerJade),
    'the board bar must be .nodragscroll');
});

test('the drag is forwarded to whatever really scrolls', () => {
  const fn = /export function resolveScrollTarget\([\s\S]*?\n}/.exec(mod);
  assert.ok(fn, 'the resolution must be one named, testable function');
  const body = fn[0];
  // In priority order: a scroller inside the header (the starred-boards list is
  // overflow-x:auto), then the board canvas, then the page scroller.
  const inside = body.indexOf('scrollableInsideHeader');
  const canvas = body.indexOf('.board-canvas');
  const content = body.indexOf("getElementById('content')");
  assert.ok(inside > -1 && canvas > inside, 'a header scroller wins over the canvas');
  assert.ok(content > canvas, 'and the canvas wins over the page scroller');
  assert.ok(/document\.scrollingElement \|\| document\.body/.test(body),
    'with the page itself as the last resort');
});

test('mouse and touch are both handled', () => {
  for (const ev of ['mousedown', 'mousemove', 'mouseup',
    'touchstart', 'touchmove', 'touchend', 'touchcancel']) {
    assert.ok(new RegExp(`addEventListener\\('${ev}'`).test(mod),
      `${ev} must be handled - a phone sends no mouse events here`);
  }
  // touchmove and mousemove must be cancelable, or preventDefault is ignored and the
  // page rubber-bands while we scroll.
  assert.ok(/addEventListener\('touchmove', onTouchMove, \{ passive: false \}\)/.test(mod));
  assert.ok(/addEventListener\('mousemove', onMouseMove, \{ passive: false \}\)/.test(mod));
});

test('a tap is still a tap, and a drag does not click', () => {
  // Scrolling starts only past a threshold, so a press with a shaky finger still
  // activates the button under it.
  assert.ok(/DRAG_THRESHOLD = \d+/.test(mod), 'there must be a movement threshold');
  const move = /function move\([\s\S]*?\n}/.exec(mod)[0];
  assert.ok(/DRAG_THRESHOLD/.test(move) && /return false/.test(move),
    'below the threshold nothing scrolls');
  // ...and once it IS a drag, the click that ends it is swallowed, in the capture
  // phase so it never reaches the button's own handler.
  assert.ok(/addEventListener\('click', onClick, true\)/.test(mod),
    'the click suppressor must run in the capture phase');
  const click = /function onClick\([\s\S]*?\n}/.exec(mod)[0];
  assert.ok(/if \(!dragged\) return;/.test(click), 'a plain click is left alone');
  assert.ok(/stopPropagation/.test(click), 'a click ending a drag is swallowed');
});

test('form fields keep their own behaviour', () => {
  // The zoom-level input lives in the quick-access bar; dragging to select text in it
  // must not scroll the page instead.
  const excluded = /function isExcluded\([\s\S]*?\n}/.exec(mod)[0];
  for (const sel of ['input', 'select', 'textarea', '.note-editable', '.nodragscroll']) {
    assert.ok(excluded.includes(sel), `${sel} must be excluded`);
  }
});

test('only a left-button drag scrolls', () => {
  const down = /function onMouseDown\([\s\S]*?\n}/.exec(mod)[0];
  assert.ok(/e\.button !== 0/.test(down),
    'a right-click opens the context menu and a middle-click pastes');
});

test('the listeners are attached once', () => {
  // header.js can be imported from more than one place; double listeners would
  // scroll twice as fast.
  assert.ok(/__wekanHeaderDragscroll/.test(mod), 'there must be a once-only guard');
});

console.log(`\nheaderDragscroll: ${passed} tests passed`);
