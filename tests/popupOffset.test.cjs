'use strict';
(async () => {

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
const { computePopupOffset } = await import('../client/lib/popupOffset.js');

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

test('an ordinary opener in the upper half opens below and stays visible', () => {
  const result = computePopupOffset({
    viewportWidth: VW,
    viewportHeight: VH,
    scrollTop: 0,
    opener: { top: 100, left: 300, height: 24 },
    popupName: 'ordinaryPopup',
  });
  assert.strictEqual(result.top, 124, 'opens just below the opener (100+24)');
  assertFullyVisible(result, 0, 'upper-half');
});

test('#6636: every desktop date editor is centred in the viewport', () => {
  for (const popupName of [
    'editCardReceivedDatePopup', 'editCardStartDatePopup',
    'editCardDueDatePopup', 'editCardEndDatePopup',
    'editVoteEndDatePopup', 'editPokerEndDatePopup',
    'cardCustomField-datePopup',
  ]) {
    const result = computePopupOffset({
      viewportWidth: VW, viewportHeight: VH, scrollLeft: 300, scrollTop: 500,
      opener: { top: 900, left: 1400, height: 24 }, popupName,
    });
    assert.strictEqual(result.left - 300, (VW - 400) / 2,
      `${popupName} uses the date editor's real CSS width`);
    assert.strictEqual(result.top - 500, PAD, popupName);
    assert.strictEqual(result.maxHeight, VH - PAD * 2, popupName);
  }
});

test('all four card people pickers open immediately below their + button', () => {
  for (const popupName of [
    'cardMembersPopup', 'cardAssigneesPopup',
    'cardRequestedByPopup', 'cardAssignedByPopup',
  ]) {
    const result = computePopupOffset({
      viewportWidth: VW, viewportHeight: VH,
      opener: { top: 500, left: 300, height: 24 }, popupName,
    });
    assert.strictEqual(result.top, 524, `${popupName} stays below its opener`);
    assert.strictEqual(result.maxHeight, VH - 524 - PAD,
      `${popupName} uses the remaining space below`);
  }
});

test('scrollLeft keeps the popup within the viewport horizontally', () => {
  const result = computePopupOffset({
    viewportWidth: VW,
    viewportHeight: VH,
    scrollTop: 0,
    scrollLeft: 500,
    opener: { top: 100, left: 500 + 1195, height: 24 }, // far right in viewport
    popupName: 'ordinaryPopup',
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

  // A narrow WINDOW is a sheet as well, whatever the mode: popup.css lays every
  // popup out full-screen below 800px, and the geometry has to agree or the sheet
  // starts wherever its button was and hangs off the right edge (which is what a
  // phone in desktop mode did).
  const narrow = computePopupOffset({
    viewportWidth: 375, viewportHeight: 700, isMiniScreen: false,
    opener: { top: 600, left: 300, height: 24 }, popupName: 'createBoardPopup',
  });
  assert.deepStrictEqual(narrow, { left: 0, top: 0 });

  const justWide = computePopupOffset({
    viewportWidth: 801, viewportHeight: 700, isMiniScreen: false,
    opener: { top: 100, left: 20, height: 24 }, popupName: 'x',
  });
  assert.notDeepStrictEqual(justWide, { left: 0, top: 0 },
    'above the media query a popup still opens at its button');
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

// ── wide popups: Select Color lays its swatches out in columns ──────────────
//
// The Change Color popups are given more width in popup.css so more colours are
// visible at once. The clamp has to know that width: computed for the default
// 380px, a 720px popup opened from a button near the right edge is placed with a
// third of itself off the screen — which is exactly the class of bug #5667 was.

test('a wide popup opened near the right edge still fits on screen', () => {
  for (const popupName of ['changeColorPopup', 'boardChangeColorPopup']) {
    const result = computePopupOffset({
      viewportWidth: VW, viewportHeight: VH,
      opener: { top: 100, left: VW - 120, height: 24 }, // a button by the right edge
      popupName,
    });
    const width = Math.min(720, VW * 0.9);
    assert.ok(result.left + width <= VW - 10 + 1,
      `${popupName}: right edge ${result.left + width} must stay inside ${VW}`);
    assert.ok(result.left >= 10, `${popupName}: and its left edge on screen`);
  }
});

test('a narrow viewport shrinks the wide popup rather than pushing it off', () => {
  const narrow = 900; // still desktop: above the 800px full-screen-sheet cutoff
  const result = computePopupOffset({
    viewportWidth: narrow, viewportHeight: VH,
    opener: { top: 100, left: 800, height: 24 },
    popupName: 'changeColorPopup',
  });
  const width = Math.min(720, narrow * 0.9); // 720
  assert.ok(result.left >= 10);
  assert.ok(result.left + width <= narrow - 10 + 1,
    `right edge ${result.left + width} must stay inside ${narrow}`);
});

test('an ordinary popup is unaffected by the wide-popup widths', () => {
  // The clamp for everything else must still be the 380px one, or every popup in
  // WeKan moves.
  const opener = { top: 100, left: VW - 120, height: 24 };
  const plain = computePopupOffset({
    viewportWidth: VW, viewportHeight: VH, opener, popupName: 'ordinaryPopup',
  });
  assert.strictEqual(plain.left, VW - Math.min(380, VW * 0.55) - 10,
    'an ordinary popup still clamps against 380px');
});

test('the JS widths and the CSS widths are the same numbers', () => {
  // They are two halves of one decision, in two files. If they drift, the popup
  // is either clamped as if it were narrower than it is (off-screen) or wider
  // than it is (needlessly pulled inward).
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..');
  const js = fs.readFileSync(path.join(root, 'client/lib/popupOffset.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'client/components/main/popup.css'), 'utf8');

  const declared = [...js.matchAll(/(\w+Popup):\s*(\d+),/g)].map(m => ({
    name: m[1], width: Number(m[2]),
  }));
  assert.ok(declared.length >= 2, 'the wide popups must be declared in the JS');

  for (const { name, width } of declared) {
    assert.ok(css.includes(`data-popup='${name}'`),
      `${name} must have a width rule in popup.css`);
    assert.ok(css.includes(`width: min(90vw, ${width}px) !important`),
      `${name}: popup.css must use the same ${width}px the JS clamps with`);
  }
  // And desktop only: below 800px popup.css lays every popup out full screen.
  assert.ok(/@media screen and \(min-width: 801px\) \{[\s\S]*?changeColorPopup/.test(css),
    'the wide width must be desktop-only, or it fights the full-screen sheet rule');
});

console.log(`\n${passed} tests passed`);

})().catch(e => { console.error(e); process.exit(1); });
