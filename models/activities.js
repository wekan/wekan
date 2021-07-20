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
    return Boards.findOne(this.boardId);
  },
  oldBoard() {
    return Boards.findOne(this.oldBoardId);
  },
  user() {
    return Users.findOne(this.userId);
  },
  member() {
    return Users.findOne(this.memberId);
  },
  list() {
    return Lists.findOne(this.listId);
  },
  swimlane() {
    return Swimlanes.findOne(this.swimlaneId);
  },
  oldSwimlane() {
    return Swimlanes.findOne(this.oldSwimlaneId);
  },
  oldList() {
    return Lists.findOne(this.oldListId);
  },
  card() {
    return Cards.findOne(this.cardId);
  },
  comment() {
    return CardComments.findOne(this.commentId);
  },
  attachment() {
    return Attachments.findOne(this.attachmentId);
  },
  checklist() {
    return Checklists.findOne(this.checklistId);
  },
  checklistItem() {
    return ChecklistItems.findOne(this.checklistItemId);
  },
  subtasks() {
    return Cards.findOne(this.subtaskId);
  },
  customField() {
    return CustomFields.findOne(this.customFieldId);
  },
  // Label activity did not work yet, unable to edit labels when tried this.
  //label() {
  //  return Cards.findOne(this.labelId);
  //},
});

Activities.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

Activities.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.modifiedAt = doc.createdAt;
});

Activities.after.insert((userId, doc) => {
  const activity = Activities._transform(doc);
  RulesHelper.executeRules(activity);
});

if (Meteor.isServer) {
  // For efficiency create indexes on the date of creation, and on the date of
  // creation in conjunction with the card or board id, as corresponding views
  // are largely used in the App. See #524.
  Meteor.startup(() => {
    Activities._collection._ensureIndex({ createdAt: -1 });
    Activities._collection._ensureIndex({ modifiedAt: -1 });
    Activities._collection._ensureIndex({ cardId: 1, createdAt: -1 });
    Activities._collection._ensureIndex({ boardId: 1, createdAt: -1 });
    Activities._collection._ensureIndex(
      { commentId: 1 },
      { partialFilterExpression: { commentId: { $exists: true } } },
    );
    Activities._collection._ensureIndex(
      { attachmentId: 1 },
      { partialFilterExpression: { attachmentId: { $exists: true } } },
    );
    Activities._collection._ensureIndex(
      { customFieldId: 1 },
      { partialFilterExpression: { customFieldId: { $exists: true } } },
    );
    // Label activity did not work yet, unable to edit labels when tried this.
    //Activities._collection._dropIndex({ labelId: 1 }, { "indexKey": -1 });
    //Activities._collection._dropIndex({ labelId: 1 }, { partialFilterExpression: { labelId: { $exists: true } } });
  });

  Activities.after.insert((userId, doc) => {
    const activity = Activities._transform(doc);
    let participants = [];
    let watchers = [];
    let title = 'act-activity-notify';
    const board = Boards.findOne(activity.boardId);
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
      if (board.title.length > 0) {
        params.board = board.title;
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
      watchers = _.union(watchers, list.watchers || []);
      params.list = list.title;
      params.listId = activity.listId;
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
      if (board) {
        const comment = params.comment;
        const knownUsers = board.members.map(member => {
          const u = Users.findOne(member.userId);
          if (u) {
            member.username = u.username;
            member.emails = u.emails;
          }
          return member;
        });
        const mentionRegex = /\B@(?:(?:"([\w.\s]*)")|([\w.]+))/gi; // including space in username
        let currentMention;
        while ((currentMention = mentionRegex.exec(comment)) !== null) {
          /*eslint no-unused-vars: ["error", { "varsIgnorePattern": "[iI]gnored" }]*/
          const [ignored, quoteduser, simple] = currentMention;
          const username = quoteduser || simple;
          if (username === params.user) {
            // ignore commenter mention himself?
            continue;
          }
          const atUser = _.findWhere(knownUsers, { username });
          if (!atUser) {
            continue;
          }
          const uid = atUser.userId;
          params.atUsername = username;
          params.atEmails = atUser.emails;
          title = 'act-atUserComment';
          watchers = _.union(watchers, [uid]);
        }
      }
      params.commentId = comment._id;
    }
    if (activity.attachmentId) {
      const attachment = activity.attachment();
      params.attachment = attachment.original.name;
      params.attachmentId = attachment._id;
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
    //if (activity.labelId) {
    //  const label = activity.label();
    //  params.label = label.name;
    //  params.labelId = activity.labelId;
    //}
    if (
      (!activity.timeKey || activity.timeKey === 'dueAt') &&
      activity.timeValue
    ) {
      // due time reminder, if it doesn't have old value, it's a brand new set, need some differentiation
      title = activity.timeOldValue ? 'act-withDue' : 'act-newDue';
    }
    ['timeValue', 'timeOldValue'].forEach(key => {
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
              board.activeMembers().map(member => member.userId),
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
      watchers = _.union(
        watchers,
        watchingUsers,
        _.intersection(participants, trackingUsers),
      );
    }
    Notifications.getUsers(watchers).forEach(user => {
      // don't notify a user of their own behavior
      if (user._id !== userId) {
        Notifications.notify(user, title, description, params);
      }
    });

    const integrations = Integrations.find({
      boardId: { $in: [board._id, Integrations.Const.GLOBAL_WEBHOOK_ID] },
      // type: 'outgoing-webhooks', // all types
      enabled: true,
      activities: { $in: [description, 'all'] },
    }).fetch();
    if (integrations.length > 0) {
      params.watchers = watchers;
      integrations.forEach(integration => {
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
