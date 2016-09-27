CardDependencies = new Mongo.Collection('card_dependencies');

CardDependencies.attachSchema(new SimpleSchema({
  cardId: {
    type: String,
  },
  cardDependencyId: {
    type: String,
  },
  boardId: {
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

CardDependencies.allow({
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

CardDependencies.helpers({
  user() {
    return Users.findOne(this.userId);
  },
});

CardDependencies.hookOptions.after.update = { fetchPrevious: false };

CardDependencies.mutations({
  setText(text) {
    return { $set: { text }};
  },
});

CardDependencies.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.userId = userId;
});

if (Meteor.isServer) {
  CardDependencies.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      activityType: 'addDependency',
      boardId: doc.boardId,
      cardId: doc.cardId,
      dependencyId: doc._id,
    });
  });

  CardDependencies.after.remove((userId, doc) => {
    const activity = Activities.findOne({ dependencyId: doc._id });
    if (activity) {
      Activities.remove(activity._id);
    }
  });
}
