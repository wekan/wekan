import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { allowFeature } from '/client/lib/instanceFeatures';

// The visit BEFORE the current one, per board, for Board menu -> Since your
// last visit (docs/Features/General/Since-Last-Visit/Since-Last-Visit.md).
// markVisited records this visit and answers with the one before, so the list
// stays the same while the board is open and starts afresh on the next visit.
const previous = new ReactiveDict();
const marked = new Set();

export function markBoardVisited(boardId) {
  if (!boardId || !Meteor.userId() || marked.has(boardId)) return;
  marked.add(boardId);
  Meteor.call('boards.markVisited', boardId, (err, at) => {
    previous.set(boardId, err ? null : at || null);
  });
}

export function previousVisit(boardId) {
  return previous.get(boardId);
}

// [{ _id, title, at, changes }] for the board, or [] while hidden.
export function loadSinceLastVisit(boardId, callback) {
  if (!boardId || !allowFeature('since-last-visit')) {
    callback([]);
    return;
  }
  const at = previous.get(boardId);
  Meteor.call('boards.sinceLastVisit', boardId, at ? new Date(at) : null,
    (err, groups) => callback(err || !Array.isArray(groups) ? [] : groups));
}
