import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';

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
