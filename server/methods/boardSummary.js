import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Users from '/models/users';
import { ReactiveCache } from '/imports/reactiveCache';
import { canReadBoard } from '/models/lib/boardVisibility';
import { featureOnFor } from '/server/lib/assistGate';

// Board menu -> Summary (docs/Features/General/Summary/Summary.md). The
// grouping is models/lib/boardSummary.js; this reads a board the caller may
// read, and for an assigned-only member only the cards assigned to them, so
// the summary shows nothing the activity feed would not.
const { boardSummary, sinceFor } = require('/models/lib/boardSummary');
const { assignedOnlyCardScope, mergeCardScope } = require('/models/lib/boardCardScope');

const MAX_ROWS = 20000;

// The last list of the board, or of each swimlane where lists belong to one.
function lastListIds(lists) {
  const bySwimlane = new Map();
  for (const list of lists) {
    const key = list.swimlaneId || '';
    const best = bySwimlane.get(key);
    if (!best || (list.sort || 0) > (best.sort || 0)) bySwimlane.set(key, list);
  }
  return [...bySwimlane.values()].map(list => list._id);
}

Meteor.methods({
  async 'boards.summary'(boardId, period) {
    check(boardId, String);
    check(period, Match.OneOf('day', 'week'));
    if (!this.userId || !(await featureOnFor(this.userId, 'board-summary'))) return [];
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !canReadBoard(this.userId, board)) return [];
    const now = new Date();
    const since = sinceFor(period, now);

    const cardDocs = await Cards.find(
      mergeCardScope({ boardId }, assignedOnlyCardScope(board, this.userId)),
      { fields: { title: 1, dueAt: 1, dueComplete: 1, endAt: 1, archived: 1, members: 1, assignees: 1 }, limit: MAX_ROWS },
    ).fetchAsync();
    const cards = {};
    for (const card of cardDocs) cards[card._id] = card;

    const activities = await Activities.find(
      { boardId, createdAt: { $gte: since }, activityType: { $in: ['archivedCard', 'moveCard', 'createCard', 'addComment'] } },
      { fields: { activityType: 1, userId: 1, cardId: 1, listId: 1, createdAt: 1 }, limit: MAX_ROWS },
    ).fetchAsync();
    const history = await ChangeHistory.find(
      { boardId, createdAt: { $gte: since }, 'newContent.field': { $in: ['dueComplete', 'endAt'] } },
      { fields: { userId: 1, cardId: 1, newContent: 1, createdAt: 1 }, limit: MAX_ROWS },
    ).fetchAsync();
    const lists = await Lists.find({ boardId, archived: false }, { fields: { sort: 1, swimlaneId: 1 } }).fetchAsync();

    const memberIds = (board.members || []).filter(m => m.isActive !== false).map(m => m.userId);
    const usernames = {};
    for (const user of await Users.find({ _id: { $in: memberIds } }, { fields: { username: 1 } }).fetchAsync()) {
      usernames[user._id] = user.username;
    }
    return boardSummary({ activities, history, cards, lastListIds: lastListIds(lists), usernames, since, now });
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'boards.summary', connectionId: () => true }, 10, 10000);
