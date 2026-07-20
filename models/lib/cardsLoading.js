'use strict';

// Pure, Meteor-free helpers for the CARDS_LOADING / lazy card-loading feature.
// Unit-tested in tests/cardsLoading.test.cjs. Used by server/cards-loading.js,
// server/models/settings.js (env seeding), server/publications/boards.js and
// client/lib/lazyCards.js.
//
// Modes:
//   all   — the board publication ships every card into minimongo (simple, fully
//           featured; heavy for very large boards).
//   lazy  — each list loads only its visible window; the board ships no cards.
//   auto  — (DEFAULT) decide PER BOARD by size: a board with more than the
//           threshold of cards loads lazily, smaller boards load eagerly ('all').
//           This keeps small boards on the simple, full-featured path and only
//           pays the windowed-loading overhead where it actually helps (#6480).

const DEFAULT_LAZY_THRESHOLD = 500;

// Effective GLOBAL card-loading mode from any input (env var, setting): one of
// 'all' | 'lazy' | 'auto'. Anything unrecognised / unset defaults to 'auto'.
// Never throws.
function resolveCardsLoadingMode(value) {
  const v = String(value == null ? '' : value).trim().toLowerCase();
  if (v === 'all') return 'all';
  if (v === 'lazy') return 'lazy';
  return 'auto';
}

// Parse the CARDS_LOADING env var for the "env is authoritative only when
// explicitly set" case: returns 'all' | 'lazy' | 'auto' when set to one of those,
// otherwise undefined (leave the stored setting alone).
function parseCardsLoadingEnv(value) {
  const v = String(value == null ? '' : value).trim().toLowerCase();
  return v === 'all' || v === 'lazy' || v === 'auto' ? v : undefined;
}

// The card-count threshold above which an 'auto' board loads lazily. Parses the
// CARDS_LOADING_LAZY_THRESHOLD env var; falls back to the default for unset /
// invalid / negative values. A threshold of 0 makes every 'auto' board lazy.
function cardsLoadingLazyThreshold(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_LAZY_THRESHOLD;
}

// Resolve the EFFECTIVE per-board mode ('all' | 'lazy') from the global mode and a
// board's card count. 'all'/'lazy' are honoured as-is; 'auto' becomes 'lazy' when
// the board has MORE than `threshold` cards, otherwise 'all'. Pure + unit-tested.
function effectiveBoardCardsMode(mode, cardCount, threshold) {
  const m = resolveCardsLoadingMode(mode);
  if (m === 'all') return 'all';
  if (m === 'lazy') return 'lazy';
  const count = Number.isFinite(cardCount) ? cardCount : 0;
  const limit = Number.isFinite(threshold) ? threshold : DEFAULT_LAZY_THRESHOLD;
  return count > limit ? 'lazy' : 'all';
}

// Stable id for one (list, swimlane) window's reactive count doc. A falsy
// swimlaneId (undefined, null, '') MUST collapse to the same id, because the
// list body subscribes with `undefined` (list view) while the list header reads
// with '' — both must reference the same count.
function windowCountId(listId, swimlaneId) {
  return `${listId}::${swimlaneId || ''}`;
}

module.exports = {
  DEFAULT_LAZY_THRESHOLD,
  resolveCardsLoadingMode,
  parseCardsLoadingEnv,
  cardsLoadingLazyThreshold,
  effectiveBoardCardsMode,
  windowCountId,
};
