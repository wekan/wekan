import { ReactiveCache } from '/imports/reactiveCache';
import { Mongo } from 'meteor/mongo';

const Triggers = new Mongo.Collection('triggers');

Triggers.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.updatedAt = doc.createdAt;
});

Triggers.before.update((userId, doc, fieldNames, modifier) => {
  // Rule editing replaces documents; never mix replacement fields with $set.
  if (Object.keys(modifier).some(key => key.startsWith('$'))) {
    modifier.$set = modifier.$set || {};
    modifier.$set.updatedAt = new Date();
  } else {
    modifier.createdAt = doc.createdAt || new Date();
    modifier.updatedAt = new Date();
  }
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
    const cardLabels = boardLabels.filter(label => {
      return (this.labelIds || []).includes(label._id);
    });
    return cardLabels;
  },
});

export default Triggers;
