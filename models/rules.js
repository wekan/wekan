import { ReactiveCache } from '/imports/reactiveCache';
import { Mongo } from 'meteor/mongo';
const { SimpleSchema } = require('/imports/simpleSchema');

const Rules = new Mongo.Collection('rules');

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

export default Rules;
