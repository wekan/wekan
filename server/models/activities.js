import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { findWhere, where } from '/imports/lib/collectionHelpers';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Integrations from '/models/integrations';
import { RulesHelper } from '/server/rulesHelper';
import { Notifications } from '/server/notifications/notifications';
import { ensureIndex } from '/server/lib/mongoStartup';
import { safeDeliver } from '/server/lib/webhookGuard';
import { labelDisplayName } from '/models/lib/labelDisplayName';
import { getFeatureFlags } from '/models/lib/featureFlags';

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
  await ensureIndex(Activities, { createdAt: -1 });
  await ensureIndex(Activities, { modifiedAt: -1 });
  await ensureIndex(Activities, { updatedAt: 1, deleted: 1 });
  await ensureIndex(Activities, { cardId: 1, createdAt: -1 });
  await ensureIndex(Activities, { boardId: 1, createdAt: -1 });
  await ensureIndex(Activities, 
    { commentId: 1 },
    { partialFilterExpression: { commentId: { $exists: true } } },
  );
  await ensureIndex(Activities, 
    { attachmentId: 1 },
    { partialFilterExpression: { attachmentId: { $exists: true } } },
  );
  await ensureIndex(Activities, 
    { customFieldId: 1 },
    { partialFilterExpression: { customFieldId: { $exists: true } } },
  );
});

Activities.after.insert(async (userId, doc) => {
  // Admin Panel / Features / Notifications (#5820): never send watch
  // notifications when disabled. Activity recording (if enabled) is unaffected.
  if (getFeatureFlags().disableNotifications) {
    return;
  }
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
        // Pass the already-awaited board: on the server card.board() returns an
        // unawaited Promise, which produced '/b/undefined/board/<cardId>' in
        // notification emails (issue #6427).
        const cardBoard =
          board && board._id === card.boardId
            ? board
            : (await ReactiveCache.getBoard(card.boardId)) ||
              (await Boards.findOneAsync(card.boardId));
        params.url = card.absoluteUrl(cardBoard);
      }
      params.cardId = activity.cardId;
      // #5143: include the card description in the outgoing webhook / notification
      // payload. Only add it when non-empty so an empty description doesn't add a
      // noisy blank field.
      const cardDescription = normalizeActivityText(card.description);
      if (cardDescription) {
        params.description = cardDescription;
      }
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

  if (activity.labelId && board) {
    // #5442: labels are embedded in the board document (not a separate
    // collection), so resolve the label from the already-loaded board by id.
    // The old activity.label() helper looked the id up in Cards and always
    // returned undefined, so params.label was never set and the outgoing
    // webhook / notification text showed a bare, generic "label" with no name.
    // Fall back to the color (how the UI shows a nameless label), then the id,
    // so the label token is never empty.
    const label = board.getLabelById(activity.labelId);
    if (label) {
      params.label = normalizeActivityText(labelDisplayName(label), label._id);
      params.labelId = label._id;
    }
  }

  if ((!activity.timeKey || activity.timeKey === 'dueAt') && activity.timeValue) {
    title = activity.timeOldValue ? 'act-withDue' : 'act-newDue';
  }

  ['timeValue', 'timeOldValue'].forEach((key) => {
    const value = activity[key];
    if (value) params[key] = value;
  });

  // #5143: forward the before/after text of a description change (activityType
  // 'a-changedDescription' stores them on the activity as oldValue/value) so the
  // outgoing webhook / notification carries the actual new (and previous) text.
  ['value', 'oldValue'].forEach((key) => {
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

    // #5833: notify the user who was just added as a card member or assignee
    // directly, so an assignment reaches the assignee themselves — not only
    // board watchers, and not (via BIGEVENTS_PATTERN) every board member. The
    // performer of the action is still skipped below, so self-assignment is not
    // self-notified. Opt out with NOTIFY_ON_ASSIGN=false; on by default.
    if (
      process.env.NOTIFY_ON_ASSIGN !== 'false' &&
      process.env.NOTIFY_ON_ASSIGN !== false
    ) {
      const assignedUserId = activity.assigneeId || activity.memberId;
      if (
        assignedUserId &&
        ['joinMember', 'joinAssignee'].includes(activity.activityType)
      ) {
        watchers = [...new Set([...watchers, assignedUserId])];
      }
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
      // Fire-and-forget, error-isolated: a failing/slow/unreachable outgoing
      // webhook must never abort this activity insert or the originating
      // operation (e.g. adding/removing a card member). See bug #1402.
      // safeDeliver() never rejects, so we intentionally do not await it.
      safeDeliver(
        () =>
          new Promise((resolve, reject) => {
            Meteor.call('outgoingWebhooks', integration, description, params, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }),
      );
    });
  }
});
