'use strict';

// #2194 "Card title/description contains {value}" rule trigger.
//
// WeKan's rules are single-trigger/single-condition today (see the #4294
// investigation noted in CHANGELOG.md's TODO Later - combining several
// conditions in one rule with AND is explicitly out of scope here and
// deferred). This module is the pure, testable decision for a SINGLE new
// trigger type: does a card's title or description contain a
// case-insensitive substring the user typed when creating the rule?
//
// Pure (no Meteor imports) so both server/rulesHelper.js and the unit tests
// share one implementation, the same discipline models/lib/ruleCardTitleFilter.js
// and server/lib/advancedFilterMatch.js already follow.

// Case-insensitive substring test. Returns false when either side is not a
// non-empty string - an unset trigger value never matches anything, and a
// card with no title/description (undefined/null) never matches either.
function textContainsMatch(text, needle) {
  if (typeof needle !== 'string' || needle.trim() === '') return false;
  if (typeof text !== 'string' || text === '') return false;
  return text.toLowerCase().includes(needle.toLowerCase());
}

// Does the card (title and/or description) contain the trigger's substring?
function cardTextContainsMatch(card, needle) {
  if (!card) return false;
  return (
    textContainsMatch(card.title, needle) ||
    textContainsMatch(card.description, needle)
  );
}

module.exports = {
  textContainsMatch,
  cardTextContainsMatch,
};
