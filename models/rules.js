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

Rules.helpers({
  async rename(description) {
    return await Rules.updateAsync(this._id, { $set: { description } });
  },
  async getAction() {
    return await ReactiveCache.getAction(this.actionId);
  },
  async getTrigger() {
    return await ReactiveCache.getTrigger(this.triggerId);
  },
  async board() {
    return await ReactiveCache.getBoard(this.boardId);
  },
  async trigger() {
    return await ReactiveCache.getTrigger(this.triggerId);
  },
  async action() {
    return await ReactiveCache.getAction(this.actionId);
  },
});

Rules.allow({
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

if (Meteor.isServer) {
  Meteor.startup(async () => {
    await Rules._collection.createIndexAsync({ modifiedAt: -1 });
  });
}

export default Rules;
