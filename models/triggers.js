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
  async insert(userId, doc) {
    return allowIsBoardAdmin(userId, await ReactiveCache.getBoard(doc.boardId));
  },
  async update(userId, doc) {
    return allowIsBoardAdmin(userId, await ReactiveCache.getBoard(doc.boardId));
  },
  async remove(userId, doc) {
    return allowIsBoardAdmin(userId, await ReactiveCache.getBoard(doc.boardId));
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

  async getRule() {
    return await ReactiveCache.getRule({ triggerId: this._id });
  },

  async fromList() {
    return await ReactiveCache.getList(this.fromId);
  },

  async toList() {
    return await ReactiveCache.getList(this.toId);
  },

  async findList(title) {
    return await ReactiveCache.getList({
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
