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

// JSON with the keys of every object in a stable order, so two selectors that
// mean the same thing produce the same text whatever order they were built in.
function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

// A short key identifying a card selector. djb2 over the stable text: this only
// has to separate one selector from another within one list, not resist anything.
function selectorKey(selector) {
  const text = stableStringify(selector);
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

// Stable id for one (list, swimlane, selector) window's reactive count doc.
//
// A falsy swimlaneId (undefined, null, '') MUST collapse to the same id, because
// the list body subscribes with `undefined` (list view) while the list header
// reads with '' — both must reference the same count.
//
// The SELECTOR belongs in the id too. Without it the id was listId::swimlaneId,
// so changing the board Filter re-subscribed to `boardListCardCount` with a
// different selector under the SAME document id: two publications then wrote one
// document, and Meteor's merge box serves whichever subscription it prefers —
// which during the changeover is the older, pre-filter one. The list rendered its
// filtered (possibly empty) window while its count still described the unfiltered
// list, which is what kept the "load more" spinner turning over nothing. Each
// filter now counts into its own document, so a count can never describe another
// filter's cards. `selector` is optional: omitting it keeps the old id, which is
// what a caller that has no selector to hand should get.
function windowCountId(listId, swimlaneId, selector) {
  const base = `${listId}::${swimlaneId || ''}`;
  if (selector === undefined || selector === null) return base;
  return `${base}::${selectorKey(selector)}`;
}

export {
  DEFAULT_LAZY_THRESHOLD,
  resolveCardsLoadingMode,
  parseCardsLoadingEnv,
  cardsLoadingLazyThreshold,
  effectiveBoardCardsMode,
  windowCountId,
  selectorKey,
  stableStringify,
};
