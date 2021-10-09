import { Meteor } from 'meteor/meteor';

Actions = new Mongo.Collection('actions');

Actions.allow({
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

Actions.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  doc.modifiedAt = doc.createdAt;
});

Actions.before.update((userId, doc, fieldNames, modifier) => {
  modifier.$set = modifier.$set || {};
  modifier.$set.modifiedAt = new Date();
});

Actions.helpers({
  description() {
    return this.desc;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Actions._collection.createIndex({ modifiedAt: -1 });
  });
}

export default Actions;
