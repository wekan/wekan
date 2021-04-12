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
    return Actions.findOne({ _id: this.actionId });
  },
  getTrigger() {
    return Triggers.findOne({ _id: this.triggerId });
  },
  board() {
    return Boards.findOne({ _id: this.boardId });
  },
  trigger() {
    return Triggers.findOne({ _id: this.triggerId });
  },
  action() {
    return Actions.findOne({ _id: this.actionId });
  },
});

Rules.allow({
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

if (Meteor.isServer) {
  Meteor.startup(() => {
    Rules._collection._ensureIndex({ modifiedAt: -1 });
  });
}

export default Rules;
