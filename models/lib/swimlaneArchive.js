'use strict';

// Pure, Meteor-free helpers for the swimlane archive/restore card cascade.
// Extracted so the cascade decisions are unit-testable in plain Node
// (mirrors models/lib/defaultSwimlane.js / models/lib/swimlaneFilter.js).
//
// #2292 ("Archive a swimlane drives to deletion of all cards included"):
// archiving a swimlane used to flag ONLY the swimlane document. Its cards
// stayed `archived: false` but became invisible everywhere — the board views
// only render unarchived swimlanes, and the Archive sidebar only lists
// documents with `archived: true`, so the cards showed up in neither. Worse,
// the startup schema upgrade (server/lib/schemaUpgradeSteps.js,
// `swimlane-structure`, #1959/#1971) treats "unarchived card under an
// ARCHIVED swimlane" as broken state and reassigns such cards to a visible
// swimlane — so after a server restart the archived swimlane was emptied for
// good and restoring it produced an empty swimlane, exactly as reported.
//
// The fix mirrors the existing list cascade (models/lists.js archive()/
// restore(), which archive/restore the list's cards with card.archive() /
// card.restore()): archiving a swimlane archives its still-unarchived cards
// so they are visible in Archive and restorable, and restoring the swimlane
// restores the cards that were archived WITH it — not cards the user had
// individually archived beforehand.

// Cards that must be archived together with the swimlane: every card of the
// swimlane that is not archived yet. Already-archived cards are left alone so
// their own archivedAt (and their place in the user's Archive history) is not
// overwritten by the swimlane cascade.
function cardsToArchiveWithSwimlane(cards) {
  return (cards || []).filter(card => card && card.archived !== true);
}

// Cards that must be restored together with the swimlane: archived cards of
// the swimlane whose archivedAt is at/after the swimlane's own archivedAt —
// i.e. the ones the archive cascade above archived (the swimlane's archivedAt
// is stamped before the per-card archivedAt). Cards the user archived
// individually BEFORE archiving the swimlane keep their archived state.
// A swimlane archived before this fix has cascade-untouched cards (and may
// even lack archivedAt), so nothing is restored for it — its unarchived cards
// were never hidden by an `archived` flag in the first place.
function cardsToRestoreWithSwimlane(cards, swimlaneArchivedAt) {
  if (!swimlaneArchivedAt) return [];
  const archivedAtMs = new Date(swimlaneArchivedAt).getTime();
  if (Number.isNaN(archivedAtMs)) return [];
  return (cards || []).filter(card => {
    if (!card || card.archived !== true || !card.archivedAt) return false;
    const cardArchivedAtMs = new Date(card.archivedAt).getTime();
    return !Number.isNaN(cardArchivedAtMs) && cardArchivedAtMs >= archivedAtMs;
  });
}

module.exports = { cardsToArchiveWithSwimlane, cardsToRestoreWithSwimlane };
