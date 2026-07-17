'use strict';

// #2345 "basic card title filter rules issue".
//
// The board-rule triggers ("when a card is created / moved / archived ...")
// offer a magnifier popup that lets the user restrict the trigger to cards
// whose title matches a filter. Three things were broken:
//
//   1. The generic "when a card is moved" and the archive/unarchive triggers
//      never stored the filter at all — worse, they stored NO `cardTitle`
//      field, and because the server matches triggers with
//      `cardTitle: { $in: [...] }`, a trigger document that lacks the field
//      can never match an activity that carries a card title, so those rules
//      never fired for anything.
//   2. A stored filter never appeared in the trigger's human-readable
//      description ("When a card is moved to list X" — no trace of "Part A"),
//      which is exactly what the issue reporter complained about.
//   3. Old trigger documents created before the fix (without a `cardTitle`
//      field) must keep behaving as "match every card".
//
// These helpers are pure (no Meteor imports) so both the client wizard and
// server/rulesHelper.js share one tested implementation.

// Normalize the raw popup input into the value stored on the trigger document.
// An empty / whitespace-only / missing filter means "match every card", which
// the rules engine expresses with the '*' wildcard (this matches the UI note:
// "leave a field empty to match every possible value").
function cardTitleFilterOrWildcard(raw) {
  if (typeof raw !== 'string') return '*';
  const trimmed = raw.trim();
  return trimmed === '' ? '*' : trimmed;
}

// Build the list of trigger `cardTitle` values that match an activity whose
// card title is `activityCardTitle`, used as `cardTitle: { $in: [...] }` when
// looking up triggers. A trigger matches when its stored filter is:
//   - the exact card title,
//   - any single word of the card title (historic behaviour: the title is
//     split on non-word characters),
//   - the '*' wildcard (no filter set), or
//   - null / a missing field (legacy triggers saved without a cardTitle —
//     in MongoDB `$in: [null, ...]` also matches documents lacking the field,
//     which keeps pre-fix rules firing as "every card").
function cardTitleMatchList(activityCardTitle) {
  const matches = ['*', null];
  if (activityCardTitle !== undefined && activityCardTitle !== null) {
    const title = String(activityCardTitle);
    return title
      .split(/\W/)
      .filter(word => word !== '')
      .concat([title])
      .concat(matches);
  }
  return matches;
}

// Pure predicate mirroring the $in semantics above: does a trigger stored with
// `filter` fire for a card titled `cardTitle`? (A missing/null filter — legacy
// trigger — matches everything, like the wildcard.)
function cardTitleFilterMatches(filter, cardTitle) {
  if (filter === undefined || filter === null) return true;
  return cardTitleMatchList(cardTitle).includes(filter);
}

// Append the filter to the trigger's human-readable description so the rule
// list / rule details show it ("when a card is moved to list x (card title
// filter: "Part A")"). A wildcard/empty filter leaves the description alone.
function appendCardTitleFilterToDesc(desc, cardTitle, label) {
  const base = typeof desc === 'string' ? desc : '';
  if (!cardTitle || cardTitle === '*') return base;
  const tag = label && typeof label === 'string' ? label : 'card title filter';
  return `${base} (${tag}: "${cardTitle}")`;
}

module.exports = {
  cardTitleFilterOrWildcard,
  cardTitleMatchList,
  cardTitleFilterMatches,
  appendCardTitleFilterToDesc,
};
