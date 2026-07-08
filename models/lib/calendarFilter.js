'use strict';

// Pure, Meteor-free helpers for building the card selectors the Calendar view
// (client/components/boards/boardBody.js) queries. Extracted so the selectors
// are unit-testable in plain Node (mirrors models/lib/swimlaneFilter.js).
//
// #5656 ("Filter not working for Calendar"): the board Filter sidebar (member /
// assignee / due-date / label / custom-field) scopes the Board / Lists /
// Swimlanes views, but the Calendar view used to query cards with only a
// board+date selector and ignore the active Filter entirely, so it showed every
// card in the interval regardless of the filter. These builders combine the
// date-interval base selector with the Filter's selector via combineWithFilter,
// so the Filter is ALWAYS ANDed in (never overwritten by — nor colliding with —
// the top-level `$or` that cardsInIntervalSelector uses) and the Calendar honors
// the same filter as the other views. `filterSelector` is the object produced by
// Filter._getMongoSelector() on the client; pass a falsy/empty value when no
// filter is active (or on the server) and the base selector is returned
// unchanged.

const { combineWithFilter } = require('./swimlaneFilter');

// Cards whose due date falls within [start, end].
function cardsDueInBetweenSelector(boardId, start, end, filterSelector) {
  return combineWithFilter(
    {
      boardId,
      dueAt: { $gte: start, $lte: end },
    },
    filterSelector,
  );
}

// Cards whose [startAt, endAt] interval overlaps [start, end] in any way:
// starts before and still runs at `start`, starts before and still runs at
// `end`, or is fully contained within [start, end].
function cardsInIntervalSelector(boardId, start, end, filterSelector) {
  return combineWithFilter(
    {
      boardId,
      $or: [
        { startAt: { $lte: start }, endAt: { $gte: start } },
        { startAt: { $lte: end }, endAt: { $gte: end } },
        { startAt: { $gte: start }, endAt: { $lte: end } },
      ],
    },
    filterSelector,
  );
}

module.exports = {
  cardsDueInBetweenSelector,
  cardsInIntervalSelector,
};
