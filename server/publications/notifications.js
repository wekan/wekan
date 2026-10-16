import { ReactiveCache } from '/imports/reactiveCache';
import { canReadBoard } from '/models/lib/boardVisibility';
const { assignedOnlyAllowsCard } = require('/models/lib/boardCardScope');

// We use these when displaying notifications in the notificationsDrawer

// gets all activities associated with the current user
Meteor.publish('notificationActivities', async () => {
  return await activityCursor();
});

// gets all attachments associated with activities associated with the current user
Meteor.publish('notificationAttachments', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getAttachments(
    {
      _id: {
        $in: activityEntries
          .map(v => v.attachmentId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all cards associated with activities associated with the current user
Meteor.publish('notificationCards', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getCards(
    {
      _id: {
        $in: activityEntries
          .map(v => v.cardId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all checklistItems associated with activities associated with the current user
Meteor.publish('notificationChecklistItems', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getChecklistItems(
    {
      _id: {
        $in: activityEntries
          .map(v => v.checklistItemId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all checklists associated with activities associated with the current user
Meteor.publish('notificationChecklists', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getChecklists(
    {
      _id: {
        $in: activityEntries
          .map(v => v.checklistId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all comments associated with activities associated with the current user
Meteor.publish('notificationComments', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getCardComments(
    {
      _id: {
        $in: activityEntries
          .map(v => v.commentId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all lists associated with activities associated with the current user
Meteor.publish('notificationLists', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getLists(
    {
      _id: {
        $in: activityEntries
          .map(v => v.listId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all swimlanes associated with activities associated with the current user
Meteor.publish('notificationSwimlanes', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getSwimlanes(
    {
      _id: {
        $in: activityEntries
          .map(v => v.swimlaneId)
          .filter(v => !!v),
      },
    },
    {},
    true,
  );
  return ret;
});

// gets all users associated with activities associated with the current user
Meteor.publish('notificationUsers', async function() {
  const activityEntries = await activityDocs();
  const ret = await ReactiveCache.getUsers(
    {
      _id: {
        $in: activityEntries
          .map(v => v.userId)
          .filter(v => !!v),
      },
    },
    {
      fields: {
        username: 1,
        'profile.fullname': 1,
        'profile.avatarUrl': 1,
        'profile.initials': 1,
      },
    },
    true,
  );
  return ret;
});

async function activityIds() {
  const activityIds = (await ReactiveCache.getCurrentUser())?.profile?.notifications?.map(v => v.activity) || [];
  return activityIds;
}

// A notification shows what its activity names - the card, its comments and
// checklists - only while the user may still read it: the board, and on it
// the card, by the user's board role now (GHSA-r4gm-mjj9-g3x8). A member
// removed from a board, or made assigned-only, kept every notification and
// so the full documents of the cards they named.
async function readableActivities(activities) {
  // The same user activityIds() reads the notifications of.
  const userId = (await ReactiveCache.getCurrentUser())?._id;
  if (!userId || !activities.length) return [];
  const cardIds = [...new Set(activities.map(a => a.cardId).filter(Boolean))];
  const cards = new Map((cardIds.length ? await ReactiveCache.getCards({ _id: { $in: cardIds } },
    { fields: { boardId: 1, assignees: 1 } }) : []).map(card => [card._id, card]));
  const boardIds = [...new Set([...activities.map(a => a.boardId), ...[...cards.values()].map(c => c.boardId)].filter(Boolean))];
  const boards = new Map((boardIds.length ? await ReactiveCache.getBoards({ _id: { $in: boardIds } }) : [])
    .map(board => [board._id, board]));
  return activities.filter(activity => {
    if (activity.boardId && !canReadBoard(userId, boards.get(activity.boardId))) return false;
    if (!activity.cardId) return true;
    const card = cards.get(activity.cardId);
    if (!card) return false;
    const board = boards.get(card.boardId);
    return canReadBoard(userId, board) && assignedOnlyAllowsCard(board, userId, card);
  });
}

async function activityDocs() {
  const ids = await activityIds();
  if (ids.length === 0) {
    return [];
  }
  return await readableActivities(await ReactiveCache.getActivities({
    _id: { $in: ids },
  }));
}

async function activityCursor() {
  const readable = await activityDocs();
  if (readable.length === 0) {
    return [];
  }
  return await ReactiveCache.getActivities(
    {
      _id: { $in: readable.map(activity => activity._id) },
    },
    {},
    true,
  );
}
