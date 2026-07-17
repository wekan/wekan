'use strict';

// #3453 "Full path display of subtasks cards disappears after a refresh of the
// subtask board".
//
// When a board's "Subtasks settings" present subtasks with
// 'prefix-with-full-path', the minicard renders `parentString(' > ')`, which
// walks the subtask's WHOLE ancestor chain client-side via
// ReactiveCache.getCard (models/cards.js parentList()/parentString()). After a
// hard refresh (F5) of the subtask board, minimongo only contains what the
// `board` publication ships. The publication's "Parent cards (for subtasks)"
// child used to publish only the DIRECT parents of the board's cards, so any
// grandparent living on another board was missing and the displayed path was
// truncated (or, before the parent-cards child existed at all, vanished
// entirely — the original #3453 report).
//
// collectAncestorIds() computes the FULL ancestor id set, level by level, so
// the publication can ship every card document the full-path prefix needs. It
// is pure and dependency-injected (no Meteor/Mongo imports): the caller
// supplies an async batch lookup, which keeps the traversal unit-testable with
// plain Node and keeps the server code to one query per ancestor level.
//
// Cycle safety: a card must never become its own ancestor (#3328), but corrupt
// or legacy data may still contain loops — the `seen` set guarantees the walk
// terminates and returns each ancestor id exactly once.

/**
 * Collect the ids of ALL ancestors reachable from the given direct-parent ids.
 *
 * @param {Array<string>} seedParentIds  Direct parent ids of the cards on the
 *        board (falsy entries and duplicates are ignored).
 * @param {function(Array<string>): Promise<Array<{_id: string, parentId?: string}>>} fetchParents
 *        Async batch lookup: given card ids, resolves the matching card docs
 *        (at least `_id` and `parentId`). Missing/deleted ids may simply be
 *        absent from the result.
 * @returns {Promise<Array<string>>} every ancestor id, each exactly once.
 *          Ids whose documents no longer exist are still included (they match
 *          nothing when published, which is harmless).
 */
async function collectAncestorIds(seedParentIds, fetchParents) {
  const seen = new Set();
  let frontier = [];
  for (const id of Array.isArray(seedParentIds) ? seedParentIds : []) {
    if (id && !seen.has(id)) {
      seen.add(id);
      frontier.push(id);
    }
  }
  while (frontier.length > 0) {
    const docs = (await fetchParents(frontier)) || [];
    const next = [];
    for (const doc of docs) {
      const parentId = doc && doc.parentId;
      if (parentId && !seen.has(parentId)) {
        seen.add(parentId);
        next.push(parentId);
      }
    }
    frontier = next;
  }
  return Array.from(seen);
}

module.exports = { collectAncestorIds };
