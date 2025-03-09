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

Activities.after.insert((userId, doc) => {
  const activity = Activities._transform(doc);
  RulesHelper.executeRules(activity);
});

if (Meteor.isServer) {
  // For efficiency create indexes on the date of creation, and on the date of
  // creation in conjunction with the card or board id, as corresponding views
  // are largely used in the App. See #524.
  Meteor.startup(() => {
    Activities._collection.createIndex({ createdAt: -1 });
    Activities._collection.createIndex({ modifiedAt: -1 });
    Activities._collection.createIndex({ cardId: 1, createdAt: -1 });
    Activities._collection.createIndex({ boardId: 1, createdAt: -1 });
    Activities._collection.createIndex(
      { commentId: 1 },
      { partialFilterExpression: { commentId: { $exists: true } } },
    );
    Activities._collection.createIndex(
      { attachmentId: 1 },
      { partialFilterExpression: { attachmentId: { $exists: true } } },
    );
    Activities._collection.createIndex(
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
      const member = activity.member();
      if (member) {
        params.member = member.getName();
      }
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
      if (board) {
        const comment = params.comment;
        const knownUsers = board.members.map(member => {
          const u = ReactiveCache.getUser(member.userId);
          if (u) {
            member.username = u.username;
            member.emails = u.emails;
          }
          return member;
        });
        const mentionRegex = /\B@(?:(?:"([\w.\s-]*)")|([\w.-]+))/gi; // including space in username
        let currentMention;
        while ((currentMention = mentionRegex.exec(comment)) !== null) {
          /*eslint no-unused-vars: ["error", { "varsIgnorePattern": "[iI]gnored" }]*/
          const [ignored, quoteduser, simple] = currentMention;
          const username = quoteduser || simple;
          if (username === params.user) {
            // ignore commenter mention himself?
            continue;
          }

          if (activity.boardId && username === 'board_members') {
            // mentions all board members
            const knownUids = knownUsers.map(u => u.userId);
            watchers = _.union(watchers, [...knownUids]);
            title = 'act-atUserComment';
          } else if (activity.cardId && username === 'card_members') {
            // mentions all card members if assigned
            const card = activity.card();
            watchers = _.union(watchers, [...card.members]);
            title = 'act-atUserComment';
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
          }

        }
      }
      params.commentId = comment._id;
    }
    if (activity.attachmentId) {
      params.attachment = activity.attachmentName;
      params.attachmentId = activity.attachmentId;
    }
    if (activity.checklistId) {
      const checklist = activity.checklist();
      if (checklist) {
        params.checklist = checklist.title;
        params.checklistId = activity.checklistId;
      }
    }
    if (activity.checklistItemId) {
      const checklistItem = activity.checklistItem();
      if (checklistItem) {
        params.checklistItem = checklistItem.text;
        params.checklistItemId = activity.checklistItemId;
      }
    }
    if (activity.subtaskId) {
      const subtask = activity.subtasks();
      params.subtask = subtask.title;
      params.subtaskId = activity.subtaskId;
    }

    // Label activity did not work yet, unable to edit labels when tried this.
    if (activity.labelId) {
      const label = activity.label();
      if (label) {  // Check if label exists
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

    Notifications.insert({
      userId,
      participants,
      watchers,
      title,
      description,
      params,
    });
  });
}
