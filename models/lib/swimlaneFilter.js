'use strict';

// Pure, Meteor-free helpers for building the per-list / per-swimlane card
// selector that the board renders. Extracted so the selector it produces is
// unit-testable in plain Node (mirrors models/lib/cardSearch.js).
//
// #6441 ("Label filter works in one swimlane but not another on the same
// board"): each list shows its cards scoped to the current swimlane, but also
// surfaces "shared" / pre-migration / orphaned cards that have no swimlane
// (swimlaneId null / '' / missing) so they stay visible in every swimlane
// without a database migration. That membership fallback used to be written as
// a bare top-level `$or` on the SAME selector object that is then combined with
// the board Filter — and the board Filter ALSO owns a top-level `$or` (the
// label / member criteria plus the "exceptions" clause). A MongoDB / Minimongo
// document selector can only carry ONE `$or` key per object, so whenever the
// two selectors are folded into one object the swimlane `$or` and the filter
// `$or` compete and one is dropped. Because only NON-default swimlanes carry
// the fallback `$or` (the default/first swimlane's cards match via the
// `swimlaneId: null / ''` branch), the label criterion survived in one swimlane
// but was silently lost in the others — exactly the reported "filters in Focus
// but not in Background" behaviour.
//
// The fix expresses the swimlane-membership fallback as a SINGLE field clause
// using `$in` (`{ swimlaneId: { $in: [swimlaneId, null, ''] } }`), which is
// semantically identical (in Mongo/Minimongo an `$in` list containing `null`
// matches null AND a missing field) but introduces no second `$or`, and always
// combines the board Filter with `$and`, so the label criterion is preserved
// and the filter applies board-wide across every swimlane.

// The swimlane-membership clause for one swimlane. Returns an empty object when
// no swimlane context is given (whole-list scope, unchanged behaviour).
//
// #6443 ("no swimlane"): on old boards a swimlane can be deleted while its cards
// keep the now-dangling swimlaneId (an "orphaned" card), or a board can end up
// with cards whose swimlaneId was never set. Cards with no swimlane (null / '' /
// missing) already surface in every swimlane via the `$in` branch below, but an
// orphaned card matches NO existing swimlane and so is invisible in swimlane view
// (while still visible in list view, which applies no swimlane scope) — exactly
// the reported symptom. This mirrors the orphaned-LIST fallback
// (Swimlanes.orphanedSwimlaneLists): orphaned cards are surfaced in the FIRST
// swimlane on the board, without a database migration.
//
// When `otherSwimlaneIds` is passed (an array of the _ids of the board's OTHER
// existing swimlanes — i.e. this call is rendering the FIRST swimlane), the
// clause becomes `{ swimlaneId: { $nin: otherSwimlaneIds } }`: it matches this
// swimlane's own cards, shared cards (null / '' / missing) AND orphaned cards
// (a swimlaneId pointing at a deleted swimlane), while still excluding cards that
// belong to another existing swimlane. Crucially this is a SINGLE field clause
// (no second `$or`), so it preserves the #6441 fix when combined with the board
// Filter. Passing `otherSwimlaneIds` for non-first swimlanes is not done, so
// orphaned cards appear once (in the first swimlane) rather than in every one.
function swimlaneMembershipSelector(swimlaneId, otherSwimlaneIds) {
  if (!swimlaneId) return {};
  if (Array.isArray(otherSwimlaneIds)) {
    // First swimlane: everything in the list that is NOT owned by another
    // existing swimlane (own id, null/'', missing, or orphaned).
    return { swimlaneId: { $nin: otherSwimlaneIds } };
  }
  // `$in` with null matches swimlaneId === null AND a missing swimlaneId field;
  // '' covers the empty-string value from the shared-lists era.
  return { swimlaneId: { $in: [swimlaneId, null, ''] } };
}

// Base (unfiltered) selector for the active cards of one list, optionally
// scoped to one swimlane (plus orphaned/shared cards). Pass `otherSwimlaneIds`
// (the _ids of the board's other swimlanes) when building the FIRST swimlane's
// selector so orphaned cards surface there — see swimlaneMembershipSelector.
function listCardsSelector(listId, swimlaneId, otherSwimlaneIds) {
  return Object.assign(
    { listId, archived: false },
    swimlaneMembershipSelector(swimlaneId, otherSwimlaneIds),
  );
}

// Combine a base list/swimlane selector with the board Filter's selector so the
// filter criteria are ALWAYS ANDed in and can never be overwritten by the
// swimlane clause. Returns the base selector unchanged when there is no active
// filter (empty/absent filterSelector).
function combineWithFilter(baseSelector, filterSelector) {
  if (!filterSelector || Object.keys(filterSelector).length === 0) {
    return baseSelector;
  }
  return { $and: [filterSelector, baseSelector] };
}

// Full selector for the cards of one list, scoped to one swimlane, with the
// board Filter applied. `filterSelector` is the object produced by
// Filter._getMongoSelector() (or Filter.mongoSelector() with no argument); pass
// a falsy/empty value when no filter is active.
function filteredListCardsSelector(listId, swimlaneId, filterSelector, otherSwimlaneIds) {
  return combineWithFilter(
    listCardsSelector(listId, swimlaneId, otherSwimlaneIds),
    filterSelector,
  );
}

module.exports = {
  swimlaneMembershipSelector,
  listCardsSelector,
  combineWithFilter,
  filteredListCardsSelector,
};
