'use strict';

// #6511: the board's card list is rendered by a Blaze `{{#each}}` over a LIMITED,
// ORDERED reactive cursor. If the sort has TIES — e.g. the default `{ sort: 1 }` when
// several cards share the same `sort` value, or a "sort by due date" where many cards
// share a date — the order of the tied cards is non-deterministic across poll/observe
// cycles. Meteor's `diffQueryOrderedChanges` then computes an out-of-range index and
// Blaze throws `Bad index in range.removeMember: 0`, which aborts the `#each` so the
// board shows NO cards (and cascades into the `undefined.remove()` teardown error).
//
// Appending a UNIQUE key (`_id`) as the final sort key makes the total order
// deterministic, so the ordered diff is always well-defined. Accepts both the object
// form (`{ field: 1 }`) and Meteor's array form (`[['field','asc']]` / `['field']`).
function sortWithIdTiebreaker(sort) {
  if (Array.isArray(sort)) {
    const hasId = sort.some(s => (Array.isArray(s) ? s[0] : s) === '_id');
    return hasId ? sort : [...sort, ['_id', 'asc']];
  }

  if (sort && typeof sort === 'object') {
    if (Object.prototype.hasOwnProperty.call(sort, '_id')) {
      return sort;
    }
    return { ...sort, _id: 1 };
  }

  // No / invalid sort: order deterministically by _id.
  return { _id: 1 };
}

module.exports = { sortWithIdTiebreaker };
