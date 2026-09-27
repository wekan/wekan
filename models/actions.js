import { ReactiveCache } from '/imports/reactiveCache';
import { Mongo } from 'meteor/mongo';

const Actions = new Mongo.Collection('actions');

Actions.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.modifiedAt = doc.createdAt;
});

Actions.before.update((userId, doc, fieldNames, modifier) => {
  // Rule editing replaces documents; never mix replacement fields with $set.
  if (Object.keys(modifier).some(key => key.startsWith('$'))) {
    modifier.$set = modifier.$set || {};
    modifier.$set.modifiedAt = new Date();
  } else {
    modifier.createdAt = doc.createdAt || new Date();
    modifier.modifiedAt = new Date();
  }
});

Actions.helpers({
  description() {
    return this.desc;
  },
});

export default Actions;
