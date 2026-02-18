import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';

Triggers = new Mongo.Collection('triggers');

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
  async rename(description) {
    return await Triggers.updateAsync(this._id, {
      $set: { description },
    });
  },

  description() {
    return this.desc;
  },

  getRule() {
    return ReactiveCache.getRule({ triggerId: this._id });
  },

  fromList() {
    return ReactiveCache.getList(this.fromId);
  },

  toList() {
    return ReactiveCache.getList(this.toId);
  },

  findList(title) {
    return ReactiveCache.getList({
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
  Meteor.startup(async () => {
    await Triggers._collection.createIndexAsync({ modifiedAt: -1 });
  });
}

export default Triggers;
