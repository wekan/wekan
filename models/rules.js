import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';

Rules = new Mongo.Collection('rules');

Rules.attachSchema(
  new SimpleSchema({
    title: {
      type: String,
      optional: false,
    },
    triggerId: {
      type: String,
      optional: false,
    },
    actionId: {
      type: String,
      optional: false,
    },
    boardId: {
      type: String,
      optional: false,
    },
    createdAt: {
      type: Date,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      denyUpdate: false,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
  }),
);

Rules.mutations({
  rename(description) {
    return { $set: { description } };
  },
});

Rules.helpers({
  getAction() {
    return ReactiveCache.getAction(this.actionId);
  },
  getTrigger() {
    return ReactiveCache.getTrigger(this.triggerId);
  },
  board() {
    return ReactiveCache.getBoard(this.boardId);
  },
  trigger() {
    return ReactiveCache.getTrigger(this.triggerId);
  },
  action() {
    return ReactiveCache.getAction(this.actionId);
  },
});

Rules.allow({
  insert(userId, doc) {
    return allowIsBoardAdmin(userId, ReactiveCache.getBoard(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardAdmin(userId, ReactiveCache.getBoard(doc.boardId));
  },
  remove(userId, doc) {
    return allowIsBoardAdmin(userId, ReactiveCache.getBoard(doc.boardId));
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Rules._collection.createIndex({ modifiedAt: -1 });
  });
}

export default Rules;
