import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Activities from '/models/activities';
import Cards from '/models/cards';
import Users from '/models/users';
import { ReactiveCache } from '/imports/reactiveCache';
import { canReadBoard } from '/models/lib/boardVisibility';
import { featureOnFor } from '/server/lib/assistGate';

// Board menu -> Since your last visit
// (docs/Features/General/Since-Last-Visit/Since-Last-Visit.md). markVisited
// is called when a board opens and answers with the visit BEFORE this one,
// which is what the view lists from; it is kept while the feature is hidden,
// so turning it on again shows the right changes. The list reads a board the
// caller may read, and for an assigned-only member only their cards.
const { sinceOf, sinceLastVisit, boardVisitsModifier, TYPES } = require('/models/lib/sinceLastVisit');
const { assignedOnlyCardScope, mergeCardScope } = require('/models/lib/boardCardScope');

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_ROWS = 5000;

async function readableBoard(userId, boardId) {
  if (!userId || !ID.test(boardId)) return null;
  const board = await ReactiveCache.getBoard(boardId);
  return board && canReadBoard(userId, board) ? board : null;
}

Meteor.methods({
  async 'boards.markVisited'(boardId) {
    check(boardId, String);
    const board = await readableBoard(this.userId, boardId);
    if (!board) return null;
    const user = await ReactiveCache.getUser(this.userId);
    const visits = (user && user.profile && user.profile.boardVisits) || {};
    const previous = visits[boardId] || null;
    await Users.updateAsync(this.userId, boardVisitsModifier(visits, boardId, new Date()));
    return previous;
  },

  async 'boards.sinceLastVisit'(boardId, previousVisit) {
    check(boardId, String);
    check(previousVisit, Match.Maybe(Date));
    if (!(await featureOnFor(this.userId, 'since-last-visit'))) return [];
    const board = await readableBoard(this.userId, boardId);
    if (!board) return [];
    const since = sinceOf(previousVisit);
    const activities = await Activities.find(
      { boardId, activityType: { $in: TYPES }, createdAt: { $gte: since }, userId: { $ne: this.userId } },
      { fields: { activityType: 1, userId: 1, cardId: 1, listName: 1, createdAt: 1 }, sort: { createdAt: -1 }, limit: MAX_ROWS },
    ).fetchAsync();
    const cardIds = [...new Set(activities.map(a => a.cardId).filter(Boolean))];
    const visible = await Cards.find(
      mergeCardScope({ _id: { $in: cardIds }, boardId }, assignedOnlyCardScope(board, this.userId)),
      { fields: { title: 1 } },
    ).fetchAsync();
    const cards = {};
    for (const card of visible) cards[card._id] = card;
    const userIds = [...new Set(activities.map(a => a.userId))];
    const usernames = {};
    for (const user of await Users.find({ _id: { $in: userIds } }, { fields: { username: 1 } }).fetchAsync()) {
      usernames[user._id] = user.username;
    }
    return sinceLastVisit({ activities, cards, usernames, userId: this.userId, since });
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'boards.markVisited', connectionId: () => true }, 20, 10000);
DDPRateLimiter.addRule({ type: 'method', name: 'boards.sinceLastVisit', connectionId: () => true }, 20, 10000);
