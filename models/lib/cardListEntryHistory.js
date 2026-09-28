'use strict';

const ENTRY_EVENTS = ['createCard', 'moveCard', 'moveCardBoard'];
const validDate = value => value instanceof Date && Number.isFinite(value.getTime());

// Replay recorded placement events, without using edit dates as substitutes.
// This state is also fed by a sorted database cursor: long histories do not
// need an unbounded in-memory array or an arbitrary completeness cutoff.
function createListEntryHistory(card, at = new Date()) {
  return { card, at, boardId: null, listId: null, enteredAt: null, previousAt: null,
    invalid: !card || !card.boardId || !card.listId || !validDate(at) };
}

function acceptListEntryEvent(state, row) {
  if (state.invalid || !ENTRY_EVENTS.includes(row.activityType)) return;
  if (row.cardId !== state.card._id || !validDate(row.createdAt) || row.createdAt > state.at ||
      (state.previousAt && row.createdAt <= state.previousAt)) { state.invalid = true; return; }
  state.previousAt = row.createdAt;
  if (row.activityType === 'createCard') {
    if (state.boardId || !row.boardId || !row.listId) { state.invalid = true; return; }
    state.boardId = row.boardId; state.listId = row.listId; state.enteredAt = row.createdAt;
  } else if (row.activityType === 'moveCardBoard') {
    if (!row.boardId || !row.oldBoardId || row.boardId === row.oldBoardId ||
        (state.boardId && row.oldBoardId !== state.boardId)) { state.invalid = true; return; }
    state.boardId = row.boardId;
    // Old cross-board activities omit the destination list. Only a later
    // recorded list entry can then establish the beginning of the stay.
    state.listId = row.listId || null;
    state.enteredAt = state.listId ? row.createdAt : null;
  } else {
    if (!row.boardId || !row.listId || !row.oldListId ||
        (state.boardId && row.boardId !== state.boardId) ||
        (state.listId && row.oldListId !== state.listId)) { state.invalid = true; return; }
    state.boardId = row.boardId;
    if (row.oldListId !== row.listId) state.enteredAt = row.createdAt;
    state.listId = row.listId;
  }
}

function finishListEntryHistory(state) {
  return !state.invalid && state.boardId === state.card.boardId && state.listId === state.card.listId
    ? state.enteredAt : null;
}

function inferListEntry(card, events, at = new Date()) {
  if (!Array.isArray(events)) return null;
  const state = createListEntryHistory(card, at);
  for (const row of [...events].sort((a, b) => a.createdAt - b.createdAt)) acceptListEntryEvent(state, row);
  return finishListEntryHistory(state);
}

function listEntryBackfillSelector(card) {
  const selector = { _id: card._id, boardId: card.boardId, listId: card.listId,
    listEnteredAt: Object.hasOwn(card, 'listEnteredAt')
      ? { $eq: null, $exists: true } : { $exists: false } };
  for (const field of ['modifiedAt', 'dateLastActivity']) {
    selector[field] = Object.hasOwn(card, field)
      ? { $eq: card[field], $exists: true } : { $exists: false };
  }
  return selector;
}

module.exports = { ENTRY_EVENTS, inferListEntry, listEntryBackfillSelector,
  createListEntryHistory, acceptListEntryEvent, finishListEntryHistory };
