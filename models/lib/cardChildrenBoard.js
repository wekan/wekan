'use strict';

// #6793: the documents that BELONG to a card and carry a copy of its board id.
//
// The board publication (server/publications/boards.js) publishes a board's
// comments, comment reactions, text notes, checklists, checklist items and
// attachments as ONE cursor per collection filtered by that denormalized board
// id, instead of one cursor per card (#6480). That is only correct while the
// copy agrees with the card. Checklists and checklist items were re-homed when a
// card moved to another board; comments, their reactions and text notes were
// not, and attachments only when the move happened to run on the server. So a
// card moved to another board arrived WITHOUT its comments - they were still
// published to the board it left, where the card no longer was - and they came
// back when the card was moved back.
//
// This is the single list of those collections, shared by the move hook
// (server/lib/cardChildrenBoardSync.js), the durable rule move
// (server/notifications/storedRulePlans.js) and the startup repair of rows a
// move already left behind (server/lib/schemaUpgradeSteps.js,
// card-children-boardid). A new collection that is published by board id and
// belongs to a card goes HERE, and every one of those paths follows it.
//
// Pure (no Meteor), so it is unit-testable with plain Node.

const CARD_CHILD_COLLECTIONS = Object.freeze([
  Object.freeze({ model: 'CardComments', name: 'card_comments', cardKey: 'cardId', boardKey: 'boardId' }),
  Object.freeze({ model: 'CardCommentReactions', name: 'card_comment_reactions', cardKey: 'cardId', boardKey: 'boardId' }),
  Object.freeze({ model: 'CardTextNotes', name: 'card_text_notes', cardKey: 'cardId', boardKey: 'boardId' }),
  Object.freeze({ model: 'Checklists', name: 'checklists', cardKey: 'cardId', boardKey: 'boardId' }),
  Object.freeze({ model: 'ChecklistItems', name: 'checklistItems', cardKey: 'cardId', boardKey: 'boardId' }),
  // Attachments keep the card's place in `meta`, list and swimlane included.
  Object.freeze({
    model: 'Attachments', name: 'attachments', cardKey: 'meta.cardId', boardKey: 'meta.boardId',
    listKey: 'meta.listId', swimlaneKey: 'meta.swimlaneId',
  }),
]);

function present(value) {
  return typeof value === 'string' && value !== '';
}

// The writes that make a card's children follow the card to `place`
// ({ boardId, listId, swimlaneId } - the card AFTER the update), given the card
// BEFORE it (`previous`, may be empty when unknown). Each write is
// { model, selector, modifier } for a multi-document update.
//
// - Nothing is written when the card stayed where it was: a drag inside a list
//   must not turn into six multi-updates (#6430).
// - The board-id selectors exclude rows that already agree, so the write is
//   idempotent and re-running it (the durable rule move does) changes nothing.
function cardChildBoardWrites(cardId, place = {}, previous = {}) {
  if (!present(cardId) || !place) return [];
  const prev = previous || {};
  const boardChanged = present(place.boardId) && place.boardId !== prev.boardId;
  const listChanged = present(place.listId) && place.listId !== prev.listId;
  const swimlaneChanged = present(place.swimlaneId) && place.swimlaneId !== prev.swimlaneId;
  const writes = [];
  for (const child of CARD_CHILD_COLLECTIONS) {
    const set = {};
    if (boardChanged) set[child.boardKey] = place.boardId;
    if (child.listKey && listChanged) set[child.listKey] = place.listId;
    if (child.swimlaneKey && swimlaneChanged) set[child.swimlaneKey] = place.swimlaneId;
    if (Object.keys(set).length === 0) continue;
    const selector = { [child.cardKey]: cardId };
    // Only the board id is published on; list/swimlane meta ride along. With
    // nothing but the board id to set, skip the rows that already have it.
    if (Object.keys(set).length === 1 && boardChanged) selector[child.boardKey] = { $ne: place.boardId };
    writes.push({ model: child.model, selector, modifier: { $set: set } });
  }
  return writes;
}

// For the startup repair: the board id a child row SHOULD carry, or null when it
// already agrees or its card cannot tell (card gone, or without a board id).
function staleChildBoardId(row, cardBoardId, child) {
  if (!row || !present(cardBoardId)) return null;
  const current = child.boardKey.split('.').reduce((v, k) => (v == null ? v : v[k]), row);
  return current === cardBoardId ? null : cardBoardId;
}

module.exports = { CARD_CHILD_COLLECTIONS, cardChildBoardWrites, staleChildBoardId };
