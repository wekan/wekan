import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

const AccountSettings = new Mongo.Collection('accountSettings');

AccountSettings.attachSchema(
  new SimpleSchema({
    _id: {
      type: String,
    },
    booleanValue: {
      type: Boolean,
      optional: true,
    },
    sort: {
      type: Number,
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
  }),
);

AccountSettings.helpers({
  allowEmailChange() {
    return AccountSettings.findOne('accounts-allowEmailChange').booleanValue;
  },
  allowUserNameChange() {
    return AccountSettings.findOne('accounts-allowUserNameChange').booleanValue;
  },
  allowUserDelete() {
    return AccountSettings.findOne('accounts-allowUserDelete').booleanValue;
  },
});

export default AccountSettings;
