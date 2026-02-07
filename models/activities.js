import { ReactiveCache } from '/imports/reactiveCache';

// Activities don't need a schema because they are always set from the a trusted
// environment - the server - and there is no risk that a user change the logic
// we use with this collection. Moreover using a schema for this collection
// would be difficult (different activities have different fields) and wouldn't
// bring any direct advantage.
//
// XXX The activities API is not so nice and need some functionalities. For
// instance if a user archive a card, and un-archive it a few seconds later we
// should remove both activities assuming it was an error the user decided to
// revert.
Activities = new Mongo.Collection('activities');

Activities.helpers({
  board() {
    return ReactiveCache.getBoard(this.boardId);
  },
  oldBoard() {
    return ReactiveCache.getBoard(this.oldBoardId);
  },
  user() {
    return ReactiveCache.getUser(this.userId);
  },
  member() {
    return ReactiveCache.getUser(this.memberId);
  },
  list() {
    return ReactiveCache.getList(this.listId);
  },
  swimlane() {
    return ReactiveCache.getSwimlane(this.swimlaneId);
  },
  oldSwimlane() {
    return ReactiveCache.getSwimlane(this.oldSwimlaneId);
  },
  oldList() {
    return ReactiveCache.getList(this.oldListId);
  },
  card() {
    return ReactiveCache.getCard(this.cardId);
  },
  comment() {
    return ReactiveCache.getCardComment(this.commentId);
  },
  attachment() {
    return ReactiveCache.getAttachment(this.attachmentId);
  },
  checklist() {
    return ReactiveCache.getChecklist(this.checklistId);
  },
  checklistItem() {
    return ReactiveCache.getChecklistItem(this.checklistItemId);
  },
  subtasks() {
    return ReactiveCache.getCard(this.subtaskId);
  },
  customField() {
    return ReactiveCache.getCustomField(this.customFieldId);
  },
  label() {
    // Label activity did not work yet, unable to edit labels when tried this.
    return ReactiveCache.getCard(this.labelId);
  },
});

Activities.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

Activities.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.modifiedAt = doc.createdAt;
});

if (Meteor.isServer) {
  Activities.after.insert((userId, doc) => {
    const activity = Activities._transform(doc);
    RulesHelper.executeRules(activity);
  });

  // For efficiency create indexes on the date of creation, and on the date of
  // creation in conjunction with the card or board id, as corresponding views
  // are largely used in the App. See #524.
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
    // Label activity did not work yet, unable to edit labels when tried this.
    //Activities._collection.dropIndex({ labelId: 1 }, { "indexKey": -1 });
    //Activities._collection.dropIndex({ labelId: 1 }, { partialFilterExpression: { labelId: { $exists: true } } });
  });

  Activities.after.insert((userId, doc) => {
    const activity = Activities._transform(doc);
    let participants = [];
    let watchers = [];
    let title = 'act-activity-notify';
    const board = ReactiveCache.getBoard(activity.boardId);
    const description = `act-${activity.activityType}`;
    const params = {
      activityId: activity._id,
    };
    if (activity.userId) {
      // No need send notification to user of activity
      // participants = _.union(participants, [activity.userId]);
      const user = activity.user();
      if (user) {
        if (user.getName()) {
          params.user = user.getName();
        }
        if (user.emails) {
          params.userEmails = user.emails;
        }
        if (activity.userId) {
          params.userId = activity.userId;
        }
      }
    }
    if (activity.boardId) {
      if (board.title) {
        if (board.title.length > 0) {
          params.board = board.title;
        } else {
          params.board = '';
        }
      } else {
        params.board = '';
      }
      title = 'act-withBoardTitle';
      params.url = board.absoluteUrl();
      params.boardId = activity.boardId;
    }
    if (activity.oldBoardId) {
      const oldBoard = activity.oldBoard();
      if (oldBoard) {
        watchers = _.union(watchers, oldBoard.watchers || []);
        params.oldBoard = oldBoard.title;
        params.oldBoardId = activity.oldBoardId;
      }
    }
    if (activity.memberId) {
      participants = _.union(participants, [activity.memberId]);
      params.member = activity.member().getName();
    }
    if (activity.listId) {
      const list = activity.list();
      if (list) {
        if (list.watchers !== undefined) {
          watchers = _.union(watchers, list.watchers || []);
        }
        params.list = list.title;
        params.listId = activity.listId;
      }
    }
    if (activity.oldListId) {
      const oldList = activity.oldList();
      if (oldList) {
        watchers = _.union(watchers, oldList.watchers || []);
        params.oldList = oldList.title;
        params.oldListId = activity.oldListId;
      }
    }
    if (activity.oldSwimlaneId) {
      const oldSwimlane = activity.oldSwimlane();
      if (oldSwimlane) {
        watchers = _.union(watchers, oldSwimlane.watchers || []);
        params.oldSwimlane = oldSwimlane.title;
        params.oldSwimlaneId = activity.oldSwimlaneId;
      }
    }
    if (activity.cardId) {
      const card = activity.card();
      participants = _.union(participants, [card.userId], card.members || []);
      watchers = _.union(watchers, card.watchers || []);
      params.card = card.title;
      title = 'act-withCardTitle';
      params.url = card.absoluteUrl();
      params.cardId = activity.cardId;
    }
    if (activity.swimlaneId) {
      const swimlane = activity.swimlane();
      params.swimlane = swimlane.title;
      params.swimlaneId = activity.swimlaneId;
    }
    if (activity.commentId) {
      const comment = activity.comment();
      params.comment = comment.text;
      let hasMentions = false; // Track if comment has @mentions
      if (board) {
        const comment = params.comment;
        const knownUsers = board.members
          .filter((member) => member.isActive)
          .map((member) => {
            const u = ReactiveCache.getUser(member.userId);
            if (u) {
              member.username = u.username;
              member.emails = u.emails;
            }
            return member;
          });
        // Match @mentions including usernames with @ symbols (like email addresses)
        // Pattern matches: @username, @user@example.com, @"quoted username"
        const mentionRegex = /\B@(?:(?:"([\w.\s-]*)")|([\w.@-]+))/gi;
        let currentMention;

        while ((currentMention = mentionRegex.exec(comment)) !== null) {
          /*eslint no-unused-vars: ["error", { "varsIgnorePattern": "[iI]gnored" }]*/
          const [ignored, quoteduser, simple] = currentMention;
          const username = quoteduser || simple;
          // Removed the check that prevented self-mentions from creating notifications
          // Users can now mention themselves in comments to create notifications

          if (activity.boardId && username === 'board_members') {
            // mentions all board members
            const validUserIds = knownUsers
              .map((u) => u.userId)
              .filter((userId) => {
                const user = ReactiveCache.getUser(userId);
                return user && user._id;
              });
            watchers = _.union(watchers, validUserIds);
            title = 'act-atUserComment';
            hasMentions = true;
          } else if (activity.boardId && username === 'board_assignees') {
            // mentions all assignees of all cards on the board
            const allCards = ReactiveCache.getCards({ boardId: activity.boardId });
            const assigneeIds = [];
            allCards.forEach((card) => {
              if (card.assignees && card.assignees.length > 0) {
                card.assignees.forEach((assigneeId) => {
                  // Only add if the user exists and is a board member
                  const user = ReactiveCache.getUser(assigneeId);
                  if (user && _.findWhere(knownUsers, { userId: assigneeId })) {
                    assigneeIds.push(assigneeId);
                  }
                });
              }
            });
            watchers = _.union(watchers, assigneeIds);
            title = 'act-atUserComment';
            hasMentions = true;
          } else if (activity.cardId && username === 'card_members') {
            // mentions all card members if assigned
            const card = activity.card();
            if (card && card.members && card.members.length > 0) {
              // Filter to only valid users who are board members
              const validMembers = card.members.filter((memberId) => {
                const user = ReactiveCache.getUser(memberId);
                return user && user._id && _.findWhere(knownUsers, { userId: memberId });
              });
              watchers = _.union(watchers, validMembers);
            }
            title = 'act-atUserComment';
            hasMentions = true;
          } else if (activity.cardId && username === 'card_assignees') {
            // mentions all assignees of the current card
            const card = activity.card();
            if (card && card.assignees && card.assignees.length > 0) {
              // Filter to only valid users who are board members
              const validAssignees = card.assignees.filter((assigneeId) => {
                const user = ReactiveCache.getUser(assigneeId);
                return user && user._id && _.findWhere(knownUsers, { userId: assigneeId });
              });
              watchers = _.union(watchers, validAssignees);
            }
            title = 'act-atUserComment';
            hasMentions = true;
          } else {
            const atUser = _.findWhere(knownUsers, { username });
            if (!atUser) {
              continue;
            }

            const uid = atUser.userId;
            params.atUsername = username;
            params.atEmails = atUser.emails;
            title = 'act-atUserComment';
            watchers = _.union(watchers, [uid]);
            hasMentions = true;
          }
        }
      }
      params.commentId = comment._id;
      params.hasMentions = hasMentions; // Store for later use
    }
    if (activity.attachmentId) {
      params.attachment = activity.attachmentName;
      params.attachmentId = activity.attachmentId;
    }
    if (activity.checklistId) {
      const checklist = activity.checklist();
      if (checklist) {
        if (checklist.title) {
          params.checklist = checklist.title;
        }
      }
    }
    if (activity.checklistItemId) {
      const checklistItem = activity.checklistItem();
      if (checklistItem) {
        if (checklistItem.title) {
          params.checklistItem = checklistItem.title;
        }
      }
    }
    if (activity.customFieldId) {
      const customField = activity.customField();
      if (customField) {
        if (customField.name) {
          params.customField = customField.name;
        }
        if (activity.value) {
          params.customFieldValue = activity.value;
        }
      }
    }
    // Label activity did not work yet, unable to edit labels when tried this.
    if (activity.labelId) {
      const label = activity.label();
      if (label) {
        if (label.name) {
          params.label = label.name;
        } else if (label.color) {
          params.label = label.color;
        }
        if (label._id) {
          params.labelId = label._id;
        }
      }
    }
    if (
      (!activity.timeKey || activity.timeKey === 'dueAt') &&
      activity.timeValue
    ) {
      // due time reminder, if it doesn't have old value, it's a brand new set, need some differentiation
      title = activity.timeOldValue ? 'act-withDue' : 'act-newDue';
    }
    ['timeValue', 'timeOldValue'].forEach((key) => {
      // copy time related keys & values to params
      const value = activity[key];
      if (value) params[key] = value;
    });
    if (board) {
      const BIGEVENTS = process.env.BIGEVENTS_PATTERN; // if environment BIGEVENTS_PATTERN is set, any activityType matching it is important
      if (BIGEVENTS) {
        try {
          const atype = activity.activityType;
          if (new RegExp(BIGEVENTS).exec(atype)) {
            watchers = _.union(
              watchers,
              board.activeMembers().map((member) => member.userId),
            ); // notify all active members for important events
          }
        } catch (e) {
          // passed env var BIGEVENTS_PATTERN is not a valid regex
        }
      }

      const watchingUsers = _.pluck(
        _.where(board.watchers, { level: 'watching' }),
        'userId',
      );
      const trackingUsers = _.pluck(
        _.where(board.watchers, { level: 'tracking' }),
        'userId',
      );
      // Only add board watchers if there were no @mentions in the comment
      // When users are explicitly @mentioned, only notify those users
      if (!params.hasMentions) {
        watchers = _.union(
          watchers,
          watchingUsers,
          _.intersection(participants, trackingUsers),
        );
      }
    }
    Notifications.getUsers(watchers).forEach((user) => {
      // Skip if user is undefined or doesn't have an _id (e.g., deleted user or invalid ID)
      if (!user || !user._id) return;
      
      // Don't notify a user of their own behavior, EXCEPT for self-mentions
      const isSelfMention = (user._id === userId && title === 'act-atUserComment');
      if (user._id !== userId || isSelfMention) {
        Notifications.notify(user, title, description, params);
      }
    });

    const integrations = ReactiveCache.getIntegrations({
      boardId: { $in: [board._id, Integrations.Const.GLOBAL_WEBHOOK_ID] },
      // type: 'outgoing-webhooks', // all types
      enabled: true,
      activities: { $in: [description, 'all'] },
    });
    if (integrations.length > 0) {
      params.watchers = watchers;
      integrations.forEach((integration) => {
        Meteor.call(
          'outgoingWebhooks',
          integration,
          description,
          params,
          () => {
            return;
          },
        );
      });
    }
  });
}

export default Activities;
