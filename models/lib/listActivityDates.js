'use strict';

// #5251: "get last change date of a list using API".
//
// The asker is building an offline Android client and wants to know whether
// anything in a list changed - a card added, edited or archived - without
// fetching every card and diffing it. A list's own `modifiedAt` does not answer
// that: it moves when the LIST document changes (title, sort, archived), and a
// card being edited does not touch it.
//
// So the answer is two dates per list: the list's own modifiedAt, and the newest
// modifiedAt among its cards. This is the second one, as a pure reduction over
// the cards of a board, so the REST handler needs one query for the whole board
// instead of one per list - and so it is unit-testable without Meteor.
//
// Archived cards are the caller's choice: archiving IS a change the asker names,
// so the handler passes them in. What matters here is that a card with no usable
// date cannot poison the result, and that a list with no cards gets no date
// rather than a wrong one.

function toTime(value) {
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

/**
 * The newest card modification per list.
 *
 * @param {Array<{listId: string, modifiedAt: *, dateLastActivity: *}>} cards
 * @returns {Map<string, Date>} listId -> newest date. A list whose cards all
 *   lack a usable date is absent from the map, so the caller can report null
 *   rather than an invented time.
 */
function newestCardChangeByList(cards) {
  const newest = new Map();
  for (const card of Array.isArray(cards) ? cards : []) {
    if (!card || typeof card.listId !== 'string' || card.listId === '') continue;
    // dateLastActivity is what older WeKan wrote; modifiedAt is current. Take
    // whichever is newer, so a board written by an older version still answers.
    const times = [toTime(card.modifiedAt), toTime(card.dateLastActivity)]
      .filter(t => t !== null);
    if (!times.length) continue;
    const t = Math.max(...times);
    const previous = newest.get(card.listId);
    if (previous === undefined || t > previous) newest.set(card.listId, t);
  }
  const out = new Map();
  for (const [listId, t] of newest) out.set(listId, new Date(t));
  return out;
}

module.exports = { newestCardChangeByList, toTime };
