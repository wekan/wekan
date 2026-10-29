'use strict';

// Card Settings' two panes side by side - the Minicard pane first, the Card
// pane after it - with a splitter between them that is dragged like the edge
// between two spreadsheet columns, or the Admin Panel left menu's inner edge
// (client/components/settings/leftMenu.js), and the same way a swimlane's
// height is dragged. What is kept is the Minicard pane's share of the width,
// a FRACTION and not pixels, so the split survives a different popup width;
// the Card pane takes the rest. docs/Features/Cards/Card-Settings.md
//
// Pure: no Meteor, no DOM. tests/cardSettingsSplit.test.cjs.

// The panes start half and half; a double-click on the splitter goes back.
const DEFAULT_SPLIT = 0.5;
// Neither pane narrower than this many em (at the popup's font size).
const MIN_PANE_EM = 16;
// One press of an arrow key moves the splitter this share of the width.
const KEY_STEP = 0.05;

const finite = n => typeof n === 'number' && Number.isFinite(n);

// `fraction` kept so that each pane is at least `minPx` of `totalPx`. When
// the two minimums do not fit, half and half. Anything that is not a number
// is the default.
function clampSplit(fraction, totalPx, minPx) {
  const f = finite(fraction) ? fraction : DEFAULT_SPLIT;
  if (!finite(totalPx) || totalPx <= 0) return Math.min(1, Math.max(0, f));
  const min = finite(minPx) && minPx > 0 ? minPx : 0;
  if (2 * min >= totalPx) return DEFAULT_SPLIT;
  const lo = min / totalPx;
  return Math.min(1 - lo, Math.max(lo, f));
}

// The split after the pointer moved `deltaPx` (its x now minus its x when the
// drag started) from `startFraction`. In a right-to-left page the Minicard
// pane is on the right, so moving toward it - to the right - narrows it.
function splitAfterDrag(startFraction, deltaPx, totalPx, minPx, rtl) {
  if (!finite(totalPx) || totalPx <= 0) return clampSplit(startFraction, totalPx, minPx);
  const delta = (finite(deltaPx) ? deltaPx : 0) * (rtl ? -1 : 1);
  return clampSplit(clampSplit(startFraction, totalPx, minPx) + delta / totalPx, totalPx, minPx);
}

// The split after a key on the focused splitter: ArrowLeft / ArrowRight move
// it one step the way the arrow points (so in a right-to-left page ArrowRight
// narrows the Minicard pane, which is on the right), Home makes the Minicard
// pane as narrow and End as wide as allowed. Any other key: null.
function splitAfterKey(fraction, key, totalPx, minPx, rtl) {
  const now = clampSplit(fraction, totalPx, minPx);
  const towardRight = rtl ? -1 : 1;
  switch (key) {
    case 'ArrowLeft': return clampSplit(now - KEY_STEP * towardRight, totalPx, minPx);
    case 'ArrowRight': return clampSplit(now + KEY_STEP * towardRight, totalPx, minPx);
    case 'Home': return clampSplit(0, totalPx, minPx);
    case 'End': return clampSplit(1, totalPx, minPx);
    default: return null;
  }
}

// What is stored: a share between 0 and 1, rounded so a drag does not store
// fifteen digits. Not a number: nothing (the default).
function normaliseSplit(fraction) {
  if (!finite(fraction)) return undefined;
  return Math.round(Math.min(1, Math.max(0, fraction)) * 1000) / 1000;
}

// The splitter's aria-valuenow: the Minicard pane's share in percent.
function splitPercent(fraction) {
  return Math.round((finite(fraction) ? Math.min(1, Math.max(0, fraction)) : DEFAULT_SPLIT) * 100);
}

module.exports = {
  DEFAULT_SPLIT, MIN_PANE_EM, KEY_STEP,
  clampSplit, splitAfterDrag, splitAfterKey, normaliseSplit, splitPercent,
};
