import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { findWhere, where } from '/imports/lib/collectionHelpers';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Integrations from '/models/integrations';
import { RulesHelper } from '/server/rulesHelper';
import { Notifications } from '/server/notifications/notifications';

function normalizeActivityText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getActivityUserName(user, fallback = '') {
  if (!user) {
    return fallback;
  }
  return normalizeActivityText(
    user.getName?.() || user.username || user.profile?.fullname || user.profile?.name,
    fallback,
  );
}

Activities.after.insert(async (userId, doc) => {
  const activity = Activities._transform(doc);
  try {
    await RulesHelper.executeRules(activity);
  } catch (e) {
    console.error('RulesHelper.executeRules error for activity', doc._id, e);
  }
});

Meteor.startup(async () => {
  await Activities._collection.createIndexAsync({ createdAt: -1 });
  await Activities._collection.createIndexAsync({ modifiedAt: -1 });
  await Activities._collection.createIndexAsync({ cardId: 1, createdAt: -1 });
  await Activities._collection.createIndexAsync({ boardId: 1, createdAt: -1 });
  await Activities._collection.createIndexAsync(
    { commentId: 1 },
    { partialFilterExpression: { commentId: { $exists: true } } },
  );
  await Activities._collection.createIndexAsync(
    { attachmentId: 1 },
    { partialFilterExpression: { attachmentId: { $exists: true } } },
  );
  await Activities._collection.createIndexAsync(
    { customFieldId: 1 },
    { partialFilterExpression: { customFieldId: { $exists: true } } },
  );
});

Activities.after.insert(async (userId, doc) => {
  const activity = Activities._transform(doc);
  let participants = [];
  let watchers = [];
  let title = 'act-activity-notify';
  const board = activity.boardId
    ? (await ReactiveCache.getBoard(activity.boardId)) || (await Boards.findOneAsync(activity.boardId))
    : null;
  const description = `act-${activity.activityType}`;
  const params = {
    activityId: activity._id,
  };

  if (activity.userId) {
    const user = await activity.user();
    if (user) {
      params.user = getActivityUserName(user, activity.userId);
      if (user.emails) {
        params.userEmails = user.emails;
      }
      params.userId = activity.userId;
    }
  }

  if (activity.boardId) {
    params.board = normalizeActivityText(board?.title);
    title = 'act-withBoardTitle';
    if (board && typeof board.absoluteUrl === 'function') {
      params.url = board.absoluteUrl();
    }
    params.boardId = activity.boardId;
  }

  if (activity.oldBoardId) {
      const oldBoard = await activity.oldBoard();
    if (oldBoard) {
      watchers = [...new Set([...watchers, ...(oldBoard.watchers || [])])];
      params.oldBoard = normalizeActivityText(oldBoard.title);
      params.oldBoardId = activity.oldBoardId;
    }
  }

  if (activity.memberId) {
    participants = [...new Set([...participants, activity.memberId])];
    params.member = getActivityUserName(await activity.member(), activity.memberId);
  }

  if (activity.listId) {
    const list = await activity.list();
    if (list) {
      if (list.watchers !== undefined) {
        watchers = [...new Set([...watchers, ...(list.watchers || [])])];
      }
      params.list = normalizeActivityText(list.title);
      params.listId = activity.listId;
    }
  }

  if (activity.oldListId) {
    const oldList = await activity.oldList();
    if (oldList) {
      watchers = [...new Set([...watchers, ...(oldList.watchers || [])])];
      params.oldList = normalizeActivityText(oldList.title);
      params.oldListId = activity.oldListId;
    }
  }

  if (activity.oldSwimlaneId) {
    const oldSwimlane = await activity.oldSwimlane();
    if (oldSwimlane) {
      watchers = [...new Set([...watchers, ...(oldSwimlane.watchers || [])])];
      params.oldSwimlane = normalizeActivityText(oldSwimlane.title);
      params.oldSwimlaneId = activity.oldSwimlaneId;
    }
  }

  if (activity.cardId) {
    const card = (await activity.card()) || (await Cards.findOneAsync(activity.cardId));
    if (card) {
      participants = [...new Set([...participants, card.userId, ...(card.members || [])])];
      watchers = [...new Set([...watchers, ...(card.watchers || [])])];
      params.card = normalizeActivityText(card.title);
      title = 'act-withCardTitle';
      if (typeof card.absoluteUrl === 'function') {
        params.url = card.absoluteUrl();
      }
      params.cardId = activity.cardId;
    }
  }

  if (activity.swimlaneId) {
    const swimlane = await activity.swimlane();
    params.swimlane = normalizeActivityText(swimlane?.title);
    params.swimlaneId = activity.swimlaneId;
  }

  if (activity.commentId) {
    const comment = await activity.comment();
    if (!comment) {
      console.warn('[Activities.after.insert] Comment not found for commentId:', activity.commentId, '— skipping comment params.');
    }
    params.comment = normalizeActivityText(comment?.text);
    let hasMentions = false;
    if (board) {
      const knownUsers = [];
      for (const member of board.members) {
        const u = await ReactiveCache.getUser(member.userId);
        if (u) {
          member.username = u.username;
          member.emails = u.emails;
        }
        knownUsers.push(member);
      }

      const mentionRegex = /\B@(?:(?:"([\w.\s-]*)")|([\w.@-]+))/gi;
      let currentMention;

      while ((currentMention = mentionRegex.exec(params.comment)) !== null) {
        const [, quoteduser, simple] = currentMention;
        const username = quoteduser || simple;

        if (activity.boardId && username === 'board_members') {
          const validUserIds = [];
          for (const u of knownUsers) {
            const user = await ReactiveCache.getUser(u.userId);
            if (user && user._id) {
              validUserIds.push(u.userId);
            }
          }
          watchers = [...new Set([...watchers, ...validUserIds])];
          title = 'act-atUserComment';
          hasMentions = true;
        } else if (activity.boardId && username === 'board_assignees') {
          const allCards = await ReactiveCache.getCards({ boardId: activity.boardId });
          const assigneeIds = [];
          for (const card of allCards) {
            if (card.assignees && card.assignees.length > 0) {
              for (const assigneeId of card.assignees) {
                const user = await ReactiveCache.getUser(assigneeId);
                if (user && findWhere(knownUsers, { userId: assigneeId })) {
                  assigneeIds.push(assigneeId);
                }
              }
            }
          }
          watchers = [...new Set([...watchers, ...assigneeIds])];
          title = 'act-atUserComment';
          hasMentions = true;
        } else if (activity.cardId && username === 'card_members') {
          const card = await activity.card();
          if (card && card.members && card.members.length > 0) {
            const validMembers = [];
            for (const memberId of card.members) {
              const user = await ReactiveCache.getUser(memberId);
              if (user && user._id && findWhere(knownUsers, { userId: memberId })) {
                validMembers.push(memberId);
              }
            }
            watchers = [...new Set([...watchers, ...validMembers])];
          }
          title = 'act-atUserComment';
          hasMentions = true;
        } else if (activity.cardId && username === 'card_assignees') {
          const card = await activity.card();
          if (card && card.assignees && card.assignees.length > 0) {
            const validAssignees = [];
            for (const assigneeId of card.assignees) {
              const user = await ReactiveCache.getUser(assigneeId);
              if (user && user._id && findWhere(knownUsers, { userId: assigneeId })) {
                validAssignees.push(assigneeId);
              }
            }
            watchers = [...new Set([...watchers, ...validAssignees])];
          }
          title = 'act-atUserComment';
          hasMentions = true;
        } else {
          const atUser = findWhere(knownUsers, { username });
          if (!atUser) {
            continue;
          }

          params.atUsername = username;
          params.atEmails = atUser.emails;
          title = 'act-atUserComment';
          watchers = [...new Set([...watchers, atUser.userId])];
          hasMentions = true;
        }
      }
    }
    if (comment) {
      params.commentId = comment._id;
    }
    params.hasMentions = hasMentions;
  }

  if (activity.attachmentId) {
    params.attachment = activity.attachmentName;
    params.attachmentId = activity.attachmentId;
  }

  if (activity.checklistId) {
    const checklist = await activity.checklist();
    if (checklist?.title) {
      params.checklist = normalizeActivityText(checklist.title);
    }
  }

  if (activity.checklistItemId) {
    const checklistItem = await activity.checklistItem();
    if (checklistItem?.title) {
      params.checklistItem = normalizeActivityText(checklistItem.title);
    }
  }

  if (activity.customFieldId) {
    const customField = await activity.customField();
    if (customField) {
      if (customField.name) {
        params.customField = normalizeActivityText(customField.name);
      }
      if (activity.value) {
        params.customFieldValue = activity.value;
      }
    }
  }

  if (activity.labelId) {
    const label = await activity.label();
    if (label) {
      if (label.name) {
        params.label = normalizeActivityText(label.name);
      } else if (label.color) {
        params.label = normalizeActivityText(label.color);
      }
      if (label._id) {
        params.labelId = label._id;
      }
    }
  }

  if ((!activity.timeKey || activity.timeKey === 'dueAt') && activity.timeValue) {
    title = activity.timeOldValue ? 'act-withDue' : 'act-newDue';
  }

  ['timeValue', 'timeOldValue'].forEach((key) => {
    const value = activity[key];
    if (value) params[key] = value;
  });

  if (board) {
    const activeMemberIds = (board.members || []).filter(m => m.isActive === true).map(m => m.userId);
    const BIGEVENTS = process.env.BIGEVENTS_PATTERN;
    if (BIGEVENTS) {
      try {
        const atype = activity.activityType;
        if (new RegExp(BIGEVENTS).exec(atype)) {
          watchers = [...new Set([...watchers, ...activeMemberIds])];
        }
      } catch (e) {}
    }

    const watchingUsers = where(board.watchers, { level: 'watching' }).map(x => x.userId);
    const trackingUsers = where(board.watchers, { level: 'tracking' }).map(x => x.userId);
    if (!params.hasMentions) {
      watchers = [...new Set([
        ...watchers,
        ...watchingUsers,
        ...participants.filter(x => trackingUsers.includes(x)),
      ])];
    }

    watchers = watchers.filter(x => activeMemberIds.includes(x));
  }

  (await Notifications.getUsers(watchers)).forEach((user) => {
    if (!user || !user._id) return;
    const isSelfMention = user._id === userId && title === 'act-atUserComment';
    if (user._id !== userId || isSelfMention) {
      Notifications.notify(user, title, description, params);
    }
  });

  const integrationBoardIds = board
    ? [board._id, Integrations.Const.GLOBAL_WEBHOOK_ID]
    : [Integrations.Const.GLOBAL_WEBHOOK_ID];
  const integrations = await ReactiveCache.getIntegrations({
    boardId: { $in: integrationBoardIds },
    enabled: true,
    activities: { $in: [description, 'all'] },
  });
  if (integrations.length > 0) {
    params.watchers = watchers;
    integrations.forEach((integration) => {
      Meteor.call('outgoingWebhooks', integration, description, params, () => {
        return;
      });
    });
  }
});
