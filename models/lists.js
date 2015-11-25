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
  status: {
    type: String,
    optional: true,
    allowedValues: [
      null,
      'todo',
      'doing',
      'done',
    ],
  },
  members: {
    type: [String],
    optional: true,
  },
  tags: {
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

  cardCount() {
    return this.cards().count();
  },

  allCards() {
    return Cards.find({ listId: this._id });
  },

  board() {
    return Boards.findOne(this.boardId);
  },

  hasTag(tag) {
    return this.tags && _.contains(this.tags, tag);
  },
});

Lists.mutations({
  rename(title) {
    return { $set: { title }};
  },

  change(title, sort) {
    return { $set: {title, sort}};
  },

  setStatus(status) {
    return { $set: {status}};
  },

  assignMember(memberId) {
    return { $addToSet: { members: memberId }};
  },

  unassignMember(memberId) {
    return { $pull: { members: memberId }};
  },

  addTag(tag) {
    return { $addToSet: { tags: tag }};
  },

  removeTag(tag) {
    return { $pull: { tags: tag }};
  },

  toggleMember(memberId) {
    if (this.members && this.members.indexOf(memberId) > -1) {
      return this.unassignMember(memberId);
    } else {
      return this.assignMember(memberId);
    }
  },

  archive() {
    return { $set: { archived: true }};
  },

  restore() {
    return { $set: { archived: false }};
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
