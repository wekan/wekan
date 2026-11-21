import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
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
      autoValue: createdAtAutoValue,
    },
    modifiedAt: {
      type: Date,
      autoValue: modifiedAtAutoValue,
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
