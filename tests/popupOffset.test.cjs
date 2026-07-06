'use strict';

// Plain-Node unit test (no DOM/Meteor) for the popup positioning geometry.
// Run: node tests/popupOffset.test.cjs
//
// Regression guard for #5667 ("Problem when scrolling in a map with date
// fields"): a date-picker opened low on a SCROLLED page used to be positioned
// from the opener's DOCUMENT offset mixed with the VIEWPORT height, so it landed
// partly outside the visible viewport (and, being position:absolute, scrolled
// away when the user tried to reach it). computePopupOffset must lay the popup
// out so it is fully within the visible viewport for any scroll position, while
// staying byte-identical to the old behaviour when the page is not scrolled.

const assert = require('assert');
const { computePopupOffset } = require('../client/lib/popupOffset');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const VW = 1200;
const VH = 800;
const PAD = 10;

// The popup box in VIEWPORT coordinates (result.top is a DOCUMENT coordinate).
function viewportBox(result, scrollTop) {
  const topVp = result.top - scrollTop;
  return { topVp, bottomVp: topVp + (result.maxHeight || 0) };
}
function assertFullyVisible(result, scrollTop, label) {
  const { topVp, bottomVp } = viewportBox(result, scrollTop);
  assert.ok(topVp >= 0, `${label}: top ${topVp} must be >= 0 (in viewport)`);
  assert.ok(
    bottomVp <= VH + 0.001,
    `${label}: bottom ${bottomVp} must be <= viewportHeight ${VH}`,
  );
}

// --- POSITIVE: fully visible regardless of scroll / opener position ---------
test('#5667: low opener on a scrolled page stays fully within the viewport', () => {
  const scrollTop = 1000;
  // Opener is near the BOTTOM of the viewport (viewport y ~= 720), so its
  // document top is 1000 + 720.
  const result = computePopupOffset({
    viewportWidth: VW,
    viewportHeight: VH,
    scrollTop,
    opener: { top: scrollTop + 720, left: 300, height: 24 },
    popupName: 'editCardDueDatePopup',
  });
  assertFullyVisible(result, scrollTop, 'low+scrolled');
  // A low opener has more room above, so it opens upward (bottom is at/above the opener).
  assert.ok(result.top - scrollTop < 720, 'should open above the low opener');
});

test('#5667: opener near the top of a scrolled page does not overflow the top', () => {
  const scrollTop = 1000;
  const result = computePopupOffset({
    viewportWidth: VW,
    viewportHeight: VH,
    scrollTop,
    opener: { top: scrollTop + 40, left: 300, height: 24 },
    popupName: 'editCardDueDatePopup',
  });
  assertFullyVisible(result, scrollTop, 'top+scrolled');
});

test('opener in the upper half opens below and stays visible', () => {
  const result = computePopupOffset({
    viewportWidth: VW,
    viewportHeight: VH,
    scrollTop: 0,
    opener: { top: 100, left: 300, height: 24 },
    popupName: 'editCardDueDatePopup',
  });
  assert.strictEqual(result.top, 124, 'opens just below the opener (100+24)');
  assertFullyVisible(result, 0, 'upper-half');
});

test('scrollLeft keeps the popup within the viewport horizontally', () => {
  const result = computePopupOffset({
    viewportWidth: VW,
    viewportHeight: VH,
    scrollTop: 0,
    scrollLeft: 500,
    opener: { top: 100, left: 500 + 1195, height: 24 }, // far right in viewport
    popupName: 'editCardDueDatePopup',
  });
  const leftVp = result.left - 500;
  const popupWidth = Math.min(380, VW * 0.55);
  assert.ok(leftVp >= PAD, 'left within viewport');
  assert.ok(leftVp + popupWidth <= VW - PAD + 0.001, 'right edge within viewport');
});

// --- Behaviour parity when NOT scrolled (no regression) ---------------------
test('unscrolled output equals the pre-fix behaviour (below case)', () => {
  const r = computePopupOffset({
    viewportWidth: VW, viewportHeight: VH, scrollTop: 0,
    opener: { top: 200, left: 300, height: 24 }, popupName: 'x',
  });
  // Old code: top = openerBottom = 224; maxHeight = min(spaceBelow, 0.8*VH).
  const spaceBelow = VH - 224 - PAD;
  assert.strictEqual(r.top, 224);
  assert.strictEqual(r.maxHeight, Math.min(spaceBelow, VH * 0.8));
});

test('special popups: cardDetails / no-opener / admin edit', () => {
  const cd = computePopupOffset({ viewportWidth: VW, viewportHeight: VH, scrollTop: 0, popupName: 'cardDetailsPopup' });
  assert.strictEqual(cd.top, 0);
  assert.strictEqual(cd.maxHeight, VH);

  const none = computePopupOffset({ viewportWidth: VW, viewportHeight: VH, scrollTop: 0, opener: null, popupName: 'x' });
  assert.deepStrictEqual(none, { left: PAD, top: PAD, maxHeight: VH - PAD * 2 });

  const mini = computePopupOffset({ viewportWidth: VW, viewportHeight: VH, isMiniScreen: true, popupName: 'x' });
  assert.deepStrictEqual(mini, { left: 0, top: 0 });
});

// --- NEGATIVE / the actual bug: the OLD formula overflowed when scrolled -----
test('#5667 regression: the OLD document-coord formula placed it OFF-SCREEN', () => {
  const scrollTop = 1000;
  const opener = { top: scrollTop + 40, left: 300, height: 24 }; // near viewport top

  // Reproduce the pre-fix math (document offset mixed with viewport height).
  const openerTop = opener.top;
  const openerBottom = opener.top + opener.height;
  const spaceBelow = VH - openerBottom - PAD;
  const spaceAbove = openerTop - PAD;
  const preferBelow = spaceBelow >= spaceAbove;
  let oldTop, oldMax;
  if (preferBelow) {
    oldMax = Math.max(0, Math.min(spaceBelow, VH * 0.8));
    oldTop = openerBottom;
  } else {
    oldMax = Math.max(0, Math.min(spaceAbove, VH * 0.8));
    oldTop = Math.max(PAD, openerTop - oldMax);
  }
  const oldTopVp = oldTop - scrollTop;
  // The old popup's TOP edge is far above the visible viewport (negative) — the bug.
  assert.ok(oldTopVp < 0, `old top ${oldTopVp} should be off-screen (the bug)`);

  // The fixed function keeps it on-screen for the exact same inputs.
  const fixed = computePopupOffset({
    viewportWidth: VW, viewportHeight: VH, scrollTop, opener, popupName: 'editCardDueDatePopup',
  });
  assertFullyVisible(fixed, scrollTop, 'fixed');
});

test('maxHeight is never negative for an opener above the viewport', () => {
  const scrollTop = 1000;
  const result = computePopupOffset({
    viewportWidth: VW, viewportHeight: VH, scrollTop,
    opener: { top: scrollTop - 500, left: 300, height: 24 }, // scrolled past, above viewport
    popupName: 'editCardDueDatePopup',
  });
  assert.ok(result.maxHeight >= 0, 'maxHeight must never be negative');
});

console.log(`\n${passed} tests passed`);
