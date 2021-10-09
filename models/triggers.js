import { Meteor } from 'meteor/meteor';

Triggers = new Mongo.Collection('triggers');

Triggers.mutations({
  rename(description) {
    return {
      $set: {
        description,
      },
    };
  },
});

Triggers.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.updatedAt = doc.createdAt;
});

Triggers.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.updatedAt = new Date();
});

Triggers.allow({
  insert(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
});

Triggers.helpers({
  description() {
    return this.desc;
  },

  getRule() {
    return Rules.findOne({
      triggerId: this._id,
    });
  },

  fromList() {
    return Lists.findOne(this.fromId);
  },

  toList() {
    return Lists.findOne(this.toId);
  },

  findList(title) {
    return Lists.findOne({
      title,
    });
  },

  labels() {
    const boardLabels = this.board().labels;
    const cardLabels = _.filter(boardLabels, label => {
      return _.contains(this.labelIds, label._id);
    });
    return cardLabels;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Triggers._collection.createIndex({ modifiedAt: -1 });
  });
}

export default Triggers;
