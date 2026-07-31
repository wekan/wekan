'use strict';

// Two decisions a board's card list makes on every render, pulled out of the
// Blaze helpers so they can be unit-tested in plain Node (mirrors
// client/lib/cardDragGeometry.js).

// ── the "load more" spinner ──────────────────────────────────────────────────
//
// A member filter left the spinner turning forever at the bottom of a list that
// had NO cards under that filter, and `_updateList` kept raising the window limit
// underneath it for as long as it stayed on screen.
//
// The spinner asked one question — "does the list hold more cards than the window
// I asked for?" — and answered it from a total that could disagree with what is
// actually on screen. In lazy card-loading mode that total comes from a count
// document published per list/swimlane, and the document's id did not include the
// filter, so a filter change re-subscribed with a new selector under the SAME id
// and the pre-filter count could stay (see models/lib/cardsLoading.js). The
// filtered list then rendered nothing while the count still said "25 cards".
//
// The count is fixed there; here is the answer that does not depend on it. There
// is nothing more to fetch unless the window we asked for came back FULL: if we
// asked for 20 cards and got 3, those 3 are all there are, whatever any count
// says. That holds in both card-loading modes and for a stale count in either
// direction, which is what makes it worth asking as well as the total.
function shouldShowLoadMoreSpinner({ total, loaded, limit } = {}) {
  const lim = Number.isFinite(limit) ? limit : 0;
  const got = Number.isFinite(loaded) ? loaded : 0;
  const all = Number.isFinite(total) ? total : 0;

  // No window asked for yet: nothing to say about a next one.
  if (lim <= 0) return false;
  // The window came back short, so it is the whole list. This is the one that
  // stops a stale total turning the spinner forever.
  if (got < lim) return false;

  return all > lim;
}

// ── which card documents may be drawn ────────────────────────────────────────
//
// Blank white minicards — the handle icon and nothing else, no title, no members,
// no labels — appeared among the real ones for some users.
//
// A minicard renders blank when its document is in minimongo without its fields:
// `Cards.getTitle()` returns null for `title === undefined`, and every badge is
// conditional on a field that is not there either. That is not a card with an
// empty title — the schema declares `title` as `optional: true, defaultValue: ''`,
// so a card that went through it HAS the key, `''` at worst. A document without
// the key at all is a partial replication: several publications ship cards with a
// projection (`openCardData` publishes `{ _id: 1 }` as the parent of its children
// cursors, the search publications ship their own field lists), and minimongo
// merges what every live publication says about an id.
//
// Which of them produced these particular stubs is not settled — it needs the
// running board to catch — so this is a guard at the point of drawing rather than
// a fix at the source: a document that does not carry the field the minicard is
// built around is not drawn. It cannot hide a real card, and when the full
// document arrives the card appears, which is what the blank box was standing in
// for anyway.
function renderableCardsSelector(selector) {
  const sel = selector || {};
  const requireTitle = { title: { $exists: true } };

  // Merging at the top level keeps the selector flat (the shape the rest of the
  // card path expects); only fall back to `$and` if something already speaks for
  // `title`, so its meaning is never silently replaced.
  if (Object.prototype.hasOwnProperty.call(sel, 'title')) {
    return { $and: [sel, requireTitle] };
  }
  return { ...sel, ...requireTitle };
}

export { shouldShowLoadMoreSpinner, renderableCardsSelector };
