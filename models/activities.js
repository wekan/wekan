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
  user() {
    return Users.findOne(this.userId);
  },
  member() {
    return Users.findOne(this.memberId);
  },
  list() {
    return Lists.findOne(this.listId);
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
  checklist() {
    return CardChecklists.findOne(this.checklistId);
  },
  attachment() {
    return Attachments.findOne(this.attachmentId);
  },
});

Activities.before.insert((userId, doc) => {
  doc.createdAt = new Date();
});

if (Meteor.isServer) {
  // For efficiency create indexes on the date of creation, and on the date of
  // creation in conjunction with the card or board id, as corresponding views
  // are largely used in the App. See #524.
  Meteor.startup(() => {
    Activities._collection._ensureIndex({ createdAt: -1 });
    Activities._collection._ensureIndex({ cardId: 1, createdAt: -1 });
    Activities._collection._ensureIndex({ boardId: 1, createdAt: -1 });
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
      params.user = activity.user().getName();
    }
    if (activity.boardId) {
      board = activity.board();
      params.board = board.title;
      title = 'act-withBoardTitle';
      params.url = board.absoluteUrl();
    }
    if (activity.memberId) {
      participants = _.union(participants, [activity.memberId]);
      params.member = activity.member().getName();
    }
    if (activity.listId) {
      const list = activity.list();
      watchers = _.union(watchers, list.watchers || []);
      params.list = list.title;
    }
    if (activity.oldListId) {
      const oldList = activity.oldList();
      watchers = _.union(watchers, oldList.watchers || []);
      params.oldList = oldList.title;
    }
    if (activity.cardId) {
      const card = activity.card();
      participants = _.union(participants, [card.userId], card.members || []);
      watchers = _.union(watchers, card.watchers || []);
      params.card = card.title;
      title = 'act-withCardTitle';
      params.url = card.absoluteUrl();
    }
    if (activity.commentId) {
      const comment = activity.comment();
      params.comment = comment.text;
    }
    if (activity.checklistId) {
      const checklist = activity.checklist();
      params.checklist = checklist.text;
    }
    if (activity.attachmentId) {
      const attachment = activity.attachment();
      params.attachment = attachment._id;
    }
    if (board) {
      const watchingUsers = _.pluck(_.where(board.watchers, {level: 'watching'}), 'userId');
      const trackingUsers = _.pluck(_.where(board.watchers, {level: 'tracking'}), 'userId');
      const mutedUsers = _.pluck(_.where(board.watchers, {level: 'muted'}), 'userId');
      switch(board.getWatchDefault()) {
      case 'muted':
        participants = _.intersection(participants, trackingUsers);
        watchers = _.intersection(watchers, trackingUsers);
        break;
      case 'tracking':
        participants = _.difference(participants, mutedUsers);
        watchers = _.difference(watchers, mutedUsers);
        break;
      }
      watchers = _.union(watchers, watchingUsers || []);
    }

    Notifications.getUsers(participants, watchers).forEach((user) => {
      Notifications.notify(user, title, description, params);
    });
  });
}
