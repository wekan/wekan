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
    let board = null;
    const description = `act-${activity.activityType}`;
    const params = {
      activityId: activity._id,
    };
    if (activity.userId) {
      // No need send notification to user of activity
      // participants = _.union(participants, [activity.userId]);
      const user = activity.user();
      params.user = user.getName();
      params.userEmails = user.emails;
      params.userId = activity.userId;
    }
    if (activity.boardId) {
      board = activity.board();
      params.board = board.title;
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
        const atUser = /(?:^|>|\b|\s)@(\S+?)(?:\s|$|<|\b)/g;
        const comment = params.comment;
        if (comment.match(atUser)) {
          const commenter = params.user;
          while (atUser.exec(comment)) {
            const username = RegExp.$1;
            if (commenter === username) {
              // it's person at himself, ignore it?
              continue;
            }
            const atUser =
              Users.findOne(username) || Users.findOne({ username });
            if (atUser && atUser._id) {
              const uid = atUser._id;
              params.atUsername = username;
              params.atEmails = atUser.emails;
              if (board.hasMember(uid)) {
                title = 'act-atUserComment';
                watchers = _.union(watchers, [uid]);
              }
            }
          }
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
      params.checklist = checklist.title;
    }
    if (activity.checklistItemId) {
      const checklistItem = activity.checklistItem();
      params.checklistItem = checklistItem.title;
    }
    if (activity.customFieldId) {
      const customField = activity.customField();
      params.customField = customField.name;
      params.customFieldValue = Activities.findOne({
        customFieldId: customField._id,
      }).value;
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
      // due time reminder
      title = 'act-withDue';
    }
    ['timeValue', 'timeOldValue'].forEach(key => {
      // copy time related keys & values to params
      const value = activity[key];
      if (value) params[key] = value;
    });
    if (board) {
      const BIGEVENTS = process.env.BIGEVENTS_PATTERN || 'due'; // if environment BIGEVENTS_PATTERN is set or default, any activityType matching it is important
      try {
        const atype = activity.activityType;
        if (new RegExp(BIGEVENTS).exec(atype)) {
          watchers = _.union(
            watchers,
            board.activeMembers().map(member => member.userId),
          ); // notify all active members for important events system defined or default to all activity related to due date
        }
      } catch (e) {
        // passed env var BIGEVENTS_PATTERN is not a valid regex
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
      Notifications.notify(user, title, description, params);
    });

    const integrations = Integrations.find({
      boardId: { $in: [board._id, Integrations.Const.GLOBAL_WEBHOOK_ID] },
      // type: 'outgoing-webhooks', // all types
      enabled: true,
      activities: { $in: [description, 'all'] },
    }).fetch();
    if (integrations.length > 0) {
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
