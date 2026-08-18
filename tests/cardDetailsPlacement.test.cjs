'use strict';
(async () => {

// Plain-Node unit test (no DOM, no Meteor) for where the desktop card-details
// window is placed horizontally. Run: node tests/cardDetailsPlacement.test.cjs
//
// #6465 asked for the 6.09 behaviour back — "notice how the card info docks
// neatly right next to the card". The window had been moved off the middle of
// the board and docked to the end edge, which stopped it covering the board but
// left it nowhere near the card it belongs to: open a card in the first list of
// a wide board and its details are a screen away.
//
// It now opens on whichever side of the minicard has more room, and always
// entirely inside the viewport — the two things the request asks for.
//
// This is X ONLY. The Y geometry (the staggered `top`, and the `bottom: 8px`
// that makes the window full height) is already right and must not move, which
// is checked against the source at the bottom.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const { placeCardDetailsX, GAP, MARGIN } =
  await import('../client/lib/cardDetailsPlacement.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// A 1920px-wide screen, a 520px window (what the stylesheet gives it), and a
// minicard 250px wide somewhere along the board.
const VIEWPORT = 1920;
const PANEL = 520;
const minicard = left => ({ left, right: left + 250 });
const place = (anchor, opts = {}) => placeCardDetailsX({
  anchor,
  panelWidth: PANEL,
  viewportWidth: VIEWPORT,
  ...opts,
});

console.log('cardDetailsPlacement:');

// ── the side with more room wins ────────────────────────────────────────────

test('a card in the first list opens to its RIGHT, next to the card', () => {
  // The whole point of #6465: this used to be docked at x≈1392 (the end edge),
  // a screen away from a minicard at x=40.
  const out = place(minicard(40));
  assert.strictEqual(out.side, 'right');
  assert.strictEqual(out.left, 40 + 250 + GAP, 'immediately right of the minicard');
  assert.strictEqual(out.width, PANEL, 'and at its full width — there is room');
});

test('a card in the last list opens to its LEFT', () => {
  const anchor = minicard(1600);
  const out = place(anchor);
  assert.strictEqual(out.side, 'left', 'there is no room to the right of it');
  assert.strictEqual(out.left, anchor.left - GAP - PANEL);
  assert.strictEqual(out.left + out.width, anchor.left - GAP, 'butting up to the card');
});

test('the side is chosen by which has MORE room, not by a fixed edge', () => {
  // Just left of centre: more room on the right.
  assert.strictEqual(place(minicard(800)).side, 'right');
  // Just right of centre: more room on the left.
  assert.strictEqual(place(minicard(1000)).side, 'left');
});

test('an exact tie is broken towards the reading direction', () => {
  // Minicard centred: 835 + 250 = 1085, and 1920 - 1085 = 835. Same both sides.
  const anchor = minicard(835);
  assert.strictEqual(anchor.left, VIEWPORT - anchor.right, 'this really is a tie');
  assert.strictEqual(place(anchor).side, 'right');
  assert.strictEqual(place(anchor, { rtl: true }).side, 'left');
});

// ── always inside the visible area ──────────────────────────────────────────

test('the window never hangs off the right edge', () => {
  for (let left = 0; left < VIEWPORT; left += 37) {
    const out = place(minicard(left));
    assert.ok(out.left >= MARGIN, `left ${out.left} at anchor ${left}`);
    assert.ok(out.left + out.width <= VIEWPORT - MARGIN,
      `right edge ${out.left + out.width} at anchor ${left} (viewport ${VIEWPORT})`);
  }
});

test('nor off the left edge, whatever the anchor', () => {
  // A minicard scrolled partly out of view reports a negative left.
  const out = place({ left: -300, right: -50 });
  assert.ok(out.left >= MARGIN, `left ${out.left}`);
  assert.ok(out.left + out.width <= VIEWPORT - MARGIN);
});

test('a viewport narrower than the window is the one case the width gives way', () => {
  // A 700px window on a 600px screen cannot be 700px AND be visible, and visible
  // is the requirement.
  const out = placeCardDetailsX({
    anchor: minicard(100),
    panelWidth: 700,
    viewportWidth: 600,
  });
  assert.strictEqual(out.width, 600 - 2 * MARGIN, 'exactly the usable width');
  assert.strictEqual(out.left, MARGIN);
});

test('the width is not touched to make the window fit beside the minicard', () => {
  // Shrinking it to the gap was tried and dropped: this is about WHERE the window
  // is, not how big it is, and a 240px card-details window is not usable.
  // Only 454px to the right of this minicard, less than the 520px window — so the
  // roomier left is chosen, at full width.
  const out = place({ left: 1200, right: 1450 });
  assert.strictEqual(out.side, 'left');
  assert.strictEqual(out.width, PANEL);
});

test('when NEITHER side has room, it overlaps the card rather than leaving the screen', () => {
  // A minicard that fills almost the whole screen: 20px each side, so 520px fits
  // nowhere beside it. Being reachable beats being beside it.
  const out = place({ left: 20, right: VIEWPORT - 20 });
  assert.strictEqual(out.width, PANEL, 'and at its normal width');
  assert.ok(out.left >= MARGIN);
  assert.ok(out.left + out.width <= VIEWPORT - MARGIN, 'still entirely on screen');
});

test('the overlap is pushed as far as it can go towards the roomier side', () => {
  // Wide minicard, 200px spare on the right and 60px on the left: the window
  // cannot fit either, so it goes as far right as the viewport allows.
  const out = place({ left: 60, right: VIEWPORT - 200 });
  assert.strictEqual(out.side, 'right');
  assert.strictEqual(out.left, VIEWPORT - MARGIN - PANEL, 'flush with the right margin');
});

test('the window is never GROWN to fill the space', () => {
  // A tiny minicard on a huge screen has room for far more than 520px.
  const out = placeCardDetailsX({
    anchor: { left: 10, right: 60 },
    panelWidth: PANEL,
    viewportWidth: 3440,
  });
  assert.strictEqual(out.width, PANEL, 'the stylesheet decides the width, not this');
});

// ── negative / missing input ────────────────────────────────────────────────

test('no anchor means no placement: leave the stylesheet alone', () => {
  // The card was opened from a URL or from search, or its list is scrolled out
  // of view, so there is no minicard on screen to sit beside.
  assert.strictEqual(placeCardDetailsX({ anchor: null, panelWidth: PANEL, viewportWidth: VIEWPORT }), null);
  assert.strictEqual(placeCardDetailsX({ panelWidth: PANEL, viewportWidth: VIEWPORT }), null);
  assert.strictEqual(placeCardDetailsX(), null);
  assert.strictEqual(place({ left: NaN, right: 10 }), null, 'an unmeasurable anchor');
});

test('the result is always whole pixels', () => {
  const out = place({ left: 100.4, right: 350.7 });
  assert.strictEqual(out.left, Math.round(out.left));
  assert.strictEqual(out.width, Math.round(out.width));
});

// ── the Y geometry is not touched (the explicit ask) ────────────────────────

test('neither the module nor its caller writes a vertical position', () => {
  const lib = read('client/lib/cardDetailsPlacement.js');
  assert.ok(!/\btop\b\s*:/.test(lib.replace(/\/\/.*$/gm, '')),
    'the placement module returns no top');
  const out = place(minicard(40));
  assert.deepStrictEqual(Object.keys(out).sort(), ['left', 'side', 'width'],
    'and nothing else — height and top stay with the stylesheet');

  // The DOM half writes left/right/width and must never write top/bottom/height.
  const js = read('client/components/cards/cardDetails.js');
  const at = js.indexOf('function anchorCardDetailsX(');
  assert.notStrictEqual(at, -1, 'the DOM half must exist');
  const body = js.slice(at, js.indexOf('\n}', at));
  for (const prop of ['top', 'bottom', 'height']) {
    assert.ok(!new RegExp(`el\\.style\\.${prop}\\s*=`).test(body),
      `it must not write style.${prop} — Y is already correct (#6465)`);
  }
  for (const prop of ['left', 'right', 'width']) {
    assert.ok(new RegExp(`el\\.style\\.${prop}\\s*=`).test(body), `it writes style.${prop}`);
  }
});

// ── wiring ──────────────────────────────────────────────────────────────────

test('it runs when a card is opened, and again when the viewport changes', () => {
  const js = read('client/components/cards/cardDetails.js');
  assert.ok(/Tracker\.afterFlush\(\(\) => anchorCardDetailsX\(/.test(js),
    'placed after the flush that renders it, so the measured width is the real one');
  assert.ok(/addEventListener\('resize'/.test(js) && /anchorAllCardDetailsX\(\)/.test(js),
    'and re-placed on resize — a viewport that shrank is the other way to lose it');
  assert.ok(/requestAnimationFrame/.test(js),
    'coalesced into a frame: a window drag-resize fires resize continuously');
});

test('the bottom-right handle can make the opened card wider or narrower', () => {
  const css = read('client/components/cards/cardDetails.css');
  const desktopAt = css.indexOf(
    'body.desktop-mode .card-details:not(.card-details-popup) {',
  );
  const desktopRule = css.slice(desktopAt, css.indexOf('\n}', desktopAt));
  assert.match(desktopRule, /max-width: calc\(100vw - 16px\)/,
    'the desktop card can grow to the viewport edge');
  assert.doesNotMatch(desktopRule, /max-width: 520px/,
    'the initial width must not also be the resize ceiling');

  const defaultAt = css.indexOf(
    'body.desktop-mode .card-details:not(.card-details-popup):not([style*="left"])',
  );
  const defaultRule = css.slice(defaultAt, css.indexOf('\n}', defaultAt));
  assert.match(defaultRule, /width: min\(520px, 90vw\)/,
    'the card still opens at its established compact width');
  assert.match(css, /@media screen and \(min-width: 801px\)[\s\S]*?\.card-details \{[\s\S]*?resize: both;/,
    'desktop users retain the two-way native resize handle');
  assert.match(css, /body\.mobile-mode \.card-details \{[\s\S]*?resize: none !important;/,
    'mobile remains full-screen rather than resizable');
});

test('a window the user dragged keeps its place, and is only kept on screen', () => {
  const js = read('client/components/cards/cardDetails.js');
  // Both drag handles — the header handle and the title — must mark it.
  const handles = [...js.matchAll(/'mousedown \.js-card-(?:title-)?drag-handle'\(event\) \{/g)];
  assert.strictEqual(handles.length, 2, 'both drag handles exist');
  for (const handle of handles) {
    // The whole handler, not a byte window: each of them starts with guards -
    // the title one steps aside for links and for the half of the title that
    // edits - and a fixed slice silently stops covering the thing being checked
    // the first time one of those grows.
    const end = js.indexOf('\n  },', handle.index);
    const body = js.slice(handle.index, end === -1 ? js.length : end);
    assert.ok(/markCardDetailsUserMoved\(\$card\)/.test(body),
      'dragging must mark the window as user-placed');
  }
  const at = js.indexOf('function anchorCardDetailsX(');
  const body = js.slice(at, js.indexOf('\n}', at));
  assert.ok(/USER_MOVED_ATTR\) === '1'/.test(body), 'and the placement must honour it');
  // The early return for a moved window has to come BEFORE the minicard lookup,
  // or the anchoring would fight the user for the position.
  assert.ok(body.indexOf('USER_MOVED_ATTR') < body.indexOf('js-minicard'),
    'the user wins before a minicard is even looked for');
});

test('re-placing measures what the stylesheet wants, not what it wrote last time', () => {
  // It runs again on every resize. If it measured its own previous output, a run
  // on a narrow viewport would clamp the width and every later run would re-clamp
  // that clamp — widening the browser again would never give the window its full
  // width back.
  const js = read('client/components/cards/cardDetails.js');
  const at = js.indexOf('function anchorCardDetailsX(');
  const body = js.slice(at, js.indexOf('\n}', at));
  const reset = body.indexOf("el.style.width = ''");
  assert.notStrictEqual(reset, -1, 'the inline geometry is cleared before measuring');
  const measure = body.indexOf('panelWidth: el.getBoundingClientRect().width');
  assert.notStrictEqual(measure, -1, 'and the width is measured after that');
  assert.ok(reset < measure, 'in that order, or the reset does nothing');
});

test('only the desktop floating window is placed', () => {
  const js = read('client/components/cards/cardDetails.js');
  const at = js.indexOf('function anchorCardDetailsX(');
  const body = js.slice(at, js.indexOf('\n}', at));
  // The popup form and the mini-screen card have their own geometry, and the
  // maximized window's insets are !important, so writing inline styles for it
  // would be a no-op that only looks like it did something.
  assert.ok(/desktop-mode/.test(body), 'desktop mode only');
  assert.ok(/card-details-popup/.test(body), 'not the popup form');
  assert.ok(/card-details-maximized/.test(body), 'not the maximized window');
});

test('the stylesheet keeps a top for a window past the five staggered rules', () => {
  // Writing an inline `left` switches off the default-position rule, which also
  // carried `top`. Without a replacement a sixth open window would get
  // `top: auto`. The replacement must come BEFORE the stagger rules, or it would
  // win the specificity tie against them and flatten cards 2-5 onto card 1.
  const css = read('client/components/cards/cardDetails.css');
  const fallback = css.indexOf(
    'body.desktop-mode .card-details:not(.card-details-popup):not([style*="top"])');
  assert.notStrictEqual(fallback, -1, 'the fallback top rule must exist');
  const firstStagger = css.indexOf(
    'body.desktop-mode .card-details:not(.card-details-popup):nth-of-type(1)');
  assert.notStrictEqual(firstStagger, -1);
  assert.ok(fallback < firstStagger,
    'the fallback must be written before the stagger rules, which have to win');

  // And it is a Y-only rule: giving it a left/right/width here would re-dock
  // every window to the edge and undo the whole change.
  const rule = css.slice(fallback, css.indexOf('}', fallback));
  for (const prop of ['left', 'right', 'inset-inline', 'width']) {
    assert.ok(!new RegExp(`\\b${prop}[^:]*:`).test(rule),
      `the fallback rule must set no ${prop}`);
  }
});

console.log(`\ncardDetailsPlacement: ${passed} tests passed`);

})();
