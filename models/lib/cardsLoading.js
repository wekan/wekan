'use strict';

// Pure, Meteor-free helpers for the CARDS_LOADING / lazy card-loading feature.
// Unit-tested in tests/cardsLoading.test.cjs. Used by server/cards-loading.js,
// server/models/settings.js (env seeding) and client/lib/lazyCards.js.

// Effective card-loading mode from any input (env var, setting): 'lazy' only for
// exactly "lazy" (case-insensitive), otherwise 'all'. Never throws.
function resolveCardsLoadingMode(value) {
  return String(value == null ? '' : value).trim().toLowerCase() === 'lazy'
    ? 'lazy'
    : 'all';
}

// Parse the CARDS_LOADING env var for the "env is authoritative only when
// explicitly set" case: returns 'all' or 'lazy' when set to one of those,
// otherwise undefined (leave the stored setting alone).
function parseCardsLoadingEnv(value) {
  const v = String(value == null ? '' : value).trim().toLowerCase();
  return v === 'all' || v === 'lazy' ? v : undefined;
}

// Stable id for one (list, swimlane) window's reactive count doc. A falsy
// swimlaneId (undefined, null, '') MUST collapse to the same id, because the
// list body subscribes with `undefined` (list view) while the list header reads
// with '' — both must reference the same count.
function windowCountId(listId, swimlaneId) {
  return `${listId}::${swimlaneId || ''}`;
}

module.exports = { resolveCardsLoadingMode, parseCardsLoadingEnv, windowCountId };
