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
  board: function() {
    return Boards.findOne(this.boardId);
  },
  user: function() {
    return Users.findOne(this.userId);
  },
  member: function() {
    return Users.findOne(this.memberId);
  },
  list: function() {
    return Lists.findOne(this.listId);
  },
  oldList: function() {
    return Lists.findOne(this.oldListId);
  },
  card: function() {
    return Cards.findOne(this.cardId);
  },
  comment: function() {
    return CardComments.findOne(this.commentId);
  },
  attachment: function() {
    return Attachments.findOne(this.attachmentId);
  }
});

Activities.before.insert(function(userId, doc) {
  doc.createdAt = new Date();
});

// For efficiency create an index on the date of creation.
if (Meteor.isServer) {
  Meteor.startup(function() {
    Activities._collection._ensureIndex({
      createdAt: -1
    });
  });
}
