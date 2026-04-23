import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
const { SimpleSchema } = require('/imports/simpleSchema');

const InvitationCodes = new Mongo.Collection('invitation_codes');

InvitationCodes.attachSchema(
  new SimpleSchema({
    code: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      regEx: SimpleSchema.RegEx.Email,
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
    // always be the admin if only one admin
    authorId: {
      type: String,
    },
    boardsToBeInvited: {
      type: Array,
      optional: true,
    },
    'boardsToBeInvited.$': {
      type: String,
    },
    valid: {
      type: Boolean,
      defaultValue: true,
    },
  }),
);

InvitationCodes.helpers({
  author() {
    return ReactiveCache.getUser(this.authorId);
  },
});

// InvitationCodes.before.insert((userId, doc) => {
// doc.createdAt = new Date();
// doc.authorId = userId;
// });

export default InvitationCodes;
