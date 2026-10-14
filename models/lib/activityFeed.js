'use strict';

// #2026 / #1377: an activity feed across all the member's boards - every
// board they see in All Boards, newest first. It carries what happened, who,
// on which card, list and board, and when - never a field's value, so an
// admin-only custom field (#3141) cannot leak through it. On a board where
// the member sees only cards assigned to them, only those cards' activity is
// in it. Pure: tests/activityFeed.test.cjs.

const MAX_LIMIT = 100;

// The sentence of an activity: act-<activityType>, the same key the
// notifications and the outgoing webhooks use.
function activitySentenceKey(activityType) {
  return `act-${activityType}`;
}

// Names an activity carries itself: a rename or a restore stores the new
// title, and a swimlane's activity keeps the swimlane's id in listId.
function activityTitleParams(activity) {
  const title = activity && typeof activity.title === 'string' ? activity.title : '';
  if (!title) return {};
  switch (activity.activityType) {
    case 'changedBoardTitle': return { board: title };
    case 'changedListTitle': case 'restoredList': return { list: title };
    case 'changedSwimlaneTitle': case 'restoredSwimlane': return { swimlane: title };
    default: return {};
  }
}

// A sentence's placeholders that nothing filled - a deleted checklist, an
// activity older than the field - are left out rather than shown as __name__.
function withoutUnfilledPlaceholders(text) {
  return String(text || '').replace(/__[A-Za-z]+__/g, '').replace(/\s+([:,.])/g, '$1').replace(/\s+/g, ' ').trim();
}

// "removedChecklistItem" -> "removed checklist item": the last resort for a
// kind of activity that has no sentence.
function humanActivityType(activityType) {
  return String(activityType || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

const named = (map, id, field = 'title') => {
  const doc = id && map ? map.get(id) : null;
  return doc && typeof doc[field] === 'string' ? doc[field] : '';
};

// What the sentence names, for the member reading the feed. Never a field's
// value (an admin-only custom field, #3141), and a comment's text only for a
// member who may read the board's comments.
function feedParams(activity, maps, board, viewerId) {
  const { cards, lists, swimlanes, checklists, checklistItems, comments, users, boards } = maps;
  const label = activity.labelId && Array.isArray(board.labels) ? board.labels.find(l => l && l._id === activity.labelId) : null;
  const viewer = (Array.isArray(board.members) ? board.members : []).find(m => m && m.userId === viewerId);
  const checklist = named(checklists, activity.checklistId);
  const params = {
    board: board.title || '',
    // Another board only when it is one this member sees too.
    oldBoard: named(boards, activity.oldBoardId),
    card: named(cards, activity.cardId),
    list: named(lists, activity.listId),
    oldList: named(lists, activity.oldListId),
    swimlane: named(swimlanes, activity.swimlaneId),
    oldSwimlane: named(swimlanes, activity.oldSwimlaneId),
    checklist,
    // act-removeChecklistItem spells it __checkList__.
    checkList: checklist,
    checklistItem: named(checklistItems, activity.checklistItemId),
    attachment: typeof activity.attachmentName === 'string' ? activity.attachmentName : '',
    label: label ? label.name || label.color || '' : '',
    member: named(users, activity.memberId, 'username'),
    assignee: named(users, activity.assigneeId, 'username'),
    user: named(users, activity.userId, 'username'),
    comment: viewer && viewer.isNoComments ? '' : named(comments, activity.commentId, 'text'),
    ...activityTitleParams(activity),
  };
  return params;
}

function feedEntry(activity, { boards, cards, lists, users, swimlanes, checklists, checklistItems, comments, viewerId }) {
  const board = boards.get(activity.boardId);
  if (!board) return null;
  const card = activity.cardId ? cards.get(activity.cardId) : null;
  const list = activity.listId ? lists.get(activity.listId) : null;
  const user = users.get(activity.userId);
  return {
    sentenceKey: activitySentenceKey(activity.activityType),
    params: feedParams(activity, { cards, lists, swimlanes, checklists, checklistItems, comments, users, boards }, board, viewerId),
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

module.exports = { feedEntry, feedParams, visibleActivities, cleanLimit, MAX_LIMIT, activitySentenceKey,
  activityTitleParams, withoutUnfilledPlaceholders, humanActivityType };
