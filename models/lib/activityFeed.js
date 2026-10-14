'use strict';

// #2026 / #1377: an activity feed across all the member's boards - every
// board they see in All Boards, newest first. It carries what happened, who,
// on which card, list and board, and when - never a field's value, so an
// admin-only custom field (#3141) cannot leak through it. On a board where
// the member sees only cards assigned to them, only those cards' activity is
// in it. Pure: tests/activityFeed.test.cjs.

const MAX_LIMIT = 100;

function feedEntry(activity, { boards, cards, lists, users }) {
  const board = boards.get(activity.boardId);
  if (!board) return null;
  const card = activity.cardId ? cards.get(activity.cardId) : null;
  const list = activity.listId ? lists.get(activity.listId) : null;
  const user = users.get(activity.userId);
  return {
    _id: activity._id,
    activityType: activity.activityType,
    createdAt: activity.createdAt,
    boardId: board._id,
    boardTitle: board.title || '',
    boardSlug: board.slug || 'board',
    cardId: card ? card._id : null,
    cardTitle: card ? card.title || '' : '',
    listTitle: list ? list.title || '' : '',
    username: user ? user.username || '' : '',
  };
}

// Of the activities, those this member may see in the feed.
function visibleActivities(activities, { assignedOnlyBoardIds = [], assignedCardIds = [] } = {}) {
  const limited = new Set(assignedOnlyBoardIds);
  const mine = new Set(assignedCardIds);
  return (Array.isArray(activities) ? activities : [])
    .filter(a => a && (!limited.has(a.boardId) || (a.cardId && mine.has(a.cardId))));
}

function cleanLimit(limit) {
  const n = Number(limit);
  return Number.isFinite(n) ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(n))) : 50;
}

module.exports = { feedEntry, visibleActivities, cleanLimit, MAX_LIMIT };
