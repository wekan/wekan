Lists = new Mongo.Collection('lists');

Lists.attachSchema(new SimpleSchema({
  title: {
    type: String,
  },
  archived: {
    type: Boolean,
  },
  boardId: {
    type: String,
  },
  createdAt: {
    type: Date,
    denyUpdate: true,
  },
  sort: {
    type: Number,
    decimal: true,
    // XXX We should probably provide a default
    optional: true,
  },
  updatedAt: {
    type: Date,
    denyInsert: true,
    optional: true,
  },
  watchers: {
    type: [String],
    optional: true,
  },
}));

Lists.allow({
  insert(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});

Lists.helpers({
  cards() {
    return Cards.find(Filter.mongoSelector({
      listId: this._id,
      archived: false,
    }), { sort: ['sort'] });
  },

  allCards() {
    return Cards.find({ listId: this._id });
  },

  board() {
    return Boards.findOne(this.boardId);
  },

  findWatcher(userId) {
    return _.contains(this.watchers, userId);
  },
});

Lists.mutations({
  rename(title) {
    return { $set: { title }};
  },

  archive() {
    return { $set: { archived: true }};
  },

  restore() {
    return { $set: { archived: false }};
  },

  setWatcher(userId, level) {
    // if level undefined or null or false, then remove
    if (!level) return { $pull: { watchers: userId }};
    return { $addToSet: { watchers: userId }};
  },
});

Lists.hookOptions.after.update = { fetchPrevious: false };

Lists.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.archived = false;
  if (!doc.userId)
    doc.userId = userId;
});

Lists.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

if (Meteor.isServer) {
  Lists.after.insert((userId, doc) => {
    Activities.insert({
      userId,
      type: 'list',
      activityType: 'createList',
      boardId: doc.boardId,
      listId: doc._id,
    });
  });

  Lists.after.update((userId, doc) => {
    if (doc.archived) {
      Activities.insert({
        userId,
        type: 'list',
        activityType: 'archivedList',
        listId: doc._id,
        boardId: doc.boardId,
      });
    }
  });
}
