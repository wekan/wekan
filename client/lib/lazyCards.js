import { Mongo } from 'meteor/mongo';
import { Filter } from '/client/lib/filter';
import { Utils } from '/client/lib/utils';
import { listCardsSelector } from '/models/lib/swimlaneFilter';
const { windowCountId: windowCountIdImpl, resolveCardsLoadingMode } = require('/models/lib/cardsLoading');

// Client-only mirror of the server `boardListCardCounts` docs published by the
// 'boardListCardCount' publication (one doc per list/swimlane window, holding
// the total card count so the board knows whether more cards remain to scroll
// in). Only used in lazy card-loading mode.
export const BoardListCardCounts = new Mongo.Collection('boardListCardCounts');

// Client-only mirror of the per-board `boardCardLoadingModes` docs published by
// the 'boardCardsLoadingMode' publication: { _id: boardId, lazy: bool }. In 'auto'
// mode this is how the client learns whether a given board loads lazily (by size),
// so client rendering agrees with the server board publication per board. #6480.
export const BoardCardLoadingModes = new Mongo.Collection('boardCardLoadingModes');

// Effective card-loading mode. Prefers the admin Setting doc (reactive, so an
// Admin Panel change is picked up), falls back to the public env value, then to
// 'all'. See server/cards-loading.js and Admin Panel / Features.
export function cardsLoadingMode() {
  // Card loading is not an admin toggle: the mode comes from the CARDS_LOADING env
  // var (default 'auto'), mirrored to Meteor.settings.public by the server. 'auto'
  // then decides per board by size (see isLazyCards / the boardCardLoadingModes flag).
  const fromEnv =
    Meteor.settings && Meteor.settings.public && Meteor.settings.public.cardsLoading;
  return resolveCardsLoadingMode(fromEnv);
}

// Whether the given board (default: the current board) loads lazily. In 'auto'
// mode this is decided PER BOARD by size on the server and delivered via the
// `boardCardLoadingModes` flag; explicit 'all'/'lazy' apply globally. When the flag
// has not arrived yet in 'auto' mode we default to EAGER, so small boards keep the
// unchanged full-featured path and only a confirmed-big board switches to windows.
export function isLazyCards(boardId) {
  const bid = boardId || (Utils && Utils.getCurrentBoardId && Utils.getCurrentBoardId());
  if (bid) {
    const doc = BoardCardLoadingModes.findOne(bid);
    if (doc) return !!doc.lazy;
  }
  const mode = cardsLoadingMode();
  if (mode === 'lazy') return true;
  if (mode === 'all') return false;
  return false; // 'auto', flag not yet known -> eager until the board is confirmed big
}

// Stable id for one (list, swimlane) window's count doc (shared, unit-tested).
export function windowCountId(listId, swimlaneId) {
  return windowCountIdImpl(listId, swimlaneId);
}

// Accurate total card count for `list.cards(swimlaneId)` in lazy mode, where
// minimongo holds only the loaded window. Builds the SAME selector
// list.cards(swimlaneId) uses (listCardsSelector + the board Filter), subscribes
// (deduped) to the server-side count for it, and returns that count. Returns null
// when not in lazy mode or the count has not arrived yet, so callers can fall
// back to the loaded-window length. Because the selector is identical to the one
// list.cards() runs against minimongo, the server count is exactly the accurate
// version of whatever list.cards(swimlaneId).length would report.
export function lazyListCardCount(list, swimlaneId) {
  if (!list || !list.boardId || !isLazyCards(list.boardId)) return null;
  const selector = listCardsSelector(
    list._id,
    swimlaneId,
    list.orphanedCardsSwimlaneIds ? list.orphanedCardsSwimlaneIds(swimlaneId) : undefined,
  );
  const mongoSelector = Filter.mongoSelector(selector);
  const id = windowCountId(list._id, swimlaneId);
  const inst = typeof Template !== 'undefined' && Template.instance ? Template.instance() : null;
  if (inst && inst.subscribe) {
    inst.subscribe('boardListCardCount', id, list.boardId, mongoSelector);
  }
  const doc = BoardListCardCounts.findOne(id);
  return doc ? doc.count : null;
}
