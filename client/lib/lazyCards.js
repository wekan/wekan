import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { Filter } from '/client/lib/filter';
import { listCardsSelector } from '/models/lib/swimlaneFilter';

// Client-only mirror of the server `boardListCardCounts` docs published by the
// 'boardListCardCount' publication (one doc per list/swimlane window, holding
// the total card count so the board knows whether more cards remain to scroll
// in). Only used in lazy card-loading mode.
export const BoardListCardCounts = new Mongo.Collection('boardListCardCounts');

// Effective card-loading mode. Prefers the admin Setting doc (reactive, so an
// Admin Panel change is picked up), falls back to the public env value, then to
// 'all'. See server/cards-loading.js and Admin Panel / Features.
export function cardsLoadingMode() {
  const setting = ReactiveCache.getCurrentSetting();
  const fromDoc = setting && setting.cardsLoading;
  const fromEnv =
    Meteor.settings && Meteor.settings.public && Meteor.settings.public.cardsLoading;
  return fromDoc || fromEnv || 'all';
}

export function isLazyCards() {
  return cardsLoadingMode() === 'lazy';
}

// Stable id for one (list, swimlane) window's count doc.
export function windowCountId(listId, swimlaneId) {
  return `${listId}::${swimlaneId || ''}`;
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
  if (!isLazyCards() || !list || !list.boardId) return null;
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
