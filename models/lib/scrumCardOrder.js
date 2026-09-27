'use strict';

// List positions can repeat across a board, and explicit backlog ranks need
// not be unique. A stable ID tie-breaker keeps refreshes and clients aligned.
function compareScrumCards(a, b) {
  const rank = card => card.scrum?.backlogRank ?? card.sort ?? 0;
  const difference = rank(a) - rank(b);
  if (difference) return difference;
  return a._id < b._id ? -1 : a._id > b._id ? 1 : 0;
}

module.exports = { compareScrumCards };
