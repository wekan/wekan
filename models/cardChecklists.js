CardChecklists = new Mongo.Collection('card_checklists');

CardChecklists.attachSchema(new SimpleSchema({
  boardId: {
    type: String,
  },
  cardId: {
    type: String,
  },
  // XXX Rename in `content`? `text` is a bit vague...
  text: {
    type: String,
  },
  isFinished: {
    type: Boolean,
    optional: true,
  },
  finishedAt: {
    type: Date,
    optional: true,
  },
  // XXX We probably don't need this information here, since we already have it
  // in the associated comment creation activity
  createdAt: {
    type: Date,
    denyUpdate: false,
  },
  // XXX Should probably be called `authorId`
  userId: {
    type: String,
  },
}));

CardChecklists.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return userId === doc.userId;
  },
  remove(userId, doc) {
    return userId === doc.userId;
  },
  fetch: ['userId', 'boardId'],
});

CardChecklists.helpers({
  user() {
    return Users.findOne(this.userId);
  },
});

CardChecklists.hookOptions.after.update = { fetchPrevious: false };

CardChecklists.mutations({
  setText(text) {
    return { $set: { text }};
  },
});

CardChecklists.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.userId = userId;
});

if (Meteor.isServer) {
  CardChecklists.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      activityType: 'addChecklist',
      boardId: doc.boardId,
      cardId: doc.cardId,
      checklistId: doc._id,
    });
  });

  CardChecklists.after.remove((userId, doc) => {
    const activity = Activities.findOne({ checklistId: doc._id });
    if (activity) {
      Activities.remove(activity._id);
    }
  });
}
