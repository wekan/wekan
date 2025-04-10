import { ReactiveCache } from '/imports/reactiveCache';

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
  subtask() {
    return ReactiveCache.getCard(this.subtaskId);
  },
  customField() {
    return ReactiveCache.getCustomField(this.customFieldId);
  },
  label() {
    return ReactiveCache.getLabel(this.labelId); // Fixed: should get a label, not a card
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
      const user = activity.user();
      if (user) {
        if (user.getName()) params.user = user.getName();
        if (user.emails) params.userEmails = user.emails;
        params.userId = activity.userId;
      }
    }

    if (activity.boardId) {
      params.board = board?.title || '';
      title = 'act-withBoardTitle';
      params.url = board?.absoluteUrl();
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
      if (member) params.member = member.getName();
    }

    if (activity.listId) {
      const list = activity.list();
      if (list) {
        watchers = _.union(watchers, list.watchers || []);
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
      params.swimlane = swimlane?.title;
      params.swimlaneId = activity.swimlaneId;
    }

    if (activity.commentId) {
      const comment = activity.comment();
      if (comment) {
        params.comment = comment.text;
        params.commentId = comment._id;

        if (board) {
          const knownUsers = board.members.map(member => {
            const u = ReactiveCache.getUser(member.userId);
            if (u) {
              member.username = u.username;
              member.emails = u.emails;
            }
            return member;
          });

          const mentionRegex = /\B@(?:(?:"([\w.\s-]*)")|([\w.-]+))/gi;
          let currentMention;
          while ((currentMention = mentionRegex.exec(comment.text)) !== null) {
            const [ignored, quoteduser, simple] = currentMention;
            const username = quoteduser || simple;
            if (username === params.user) continue;

            if (username === 'board_members') {
              const knownUids = knownUsers.map(u => u.userId);
              watchers = _.union(watchers, knownUids);
              title = 'act-atUserComment';
            } else if (username === 'card_members' && activity.cardId) {
              const card = activity.card();
              watchers = _.union(watchers, card.members);
              title = 'act-atUserComment';
            } else {
              const atUser = _.findWhere(knownUsers, { username });
              if (atUser) {
                params.atUsername = username;
                params.atEmails = atUser.emails;
                watchers = _.union(watchers, [atUser.userId]);
                title = 'act-atUserComment';
              }
            }
          }
        }
      }
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
      const subtask = activity.subtask();
      if (subtask) {
        params.subtask = subtask.title;
        params.subtaskId = activity.subtaskId;
      }
    }

    if (activity.labelId) {
      const label = activity.label();
      if (label) {
        params.label = label.name || label.color;
        params.labelId = label._id;
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
