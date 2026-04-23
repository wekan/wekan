import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
const { SimpleSchema } = require('/imports/simpleSchema');

const LockoutSettings = new Mongo.Collection('lockoutSettings');

LockoutSettings.attachSchema(
  new SimpleSchema({
    _id: {
      type: String,
    },
    value: {
      type: Number,
    },
    category: {
      type: String,
    },
    sort: {
      type: Number,
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

LockoutSettings.helpers({
  getKnownConfig() {
    // Fetch all settings in one query instead of 3 separate queries
    const settings = LockoutSettings.find({
      _id: { $in: ['known-failuresBeforeLockout', 'known-lockoutPeriod', 'known-failureWindow'] }
    }, { fields: { _id: 1, value: 1 } }).fetch();

    const settingsMap = {};
    settings.forEach(s => { settingsMap[s._id] = s.value; });

    return {
      failuresBeforeLockout: settingsMap['known-failuresBeforeLockout'] || 3,
      lockoutPeriod: settingsMap['known-lockoutPeriod'] || 60,
      failureWindow: settingsMap['known-failureWindow'] || 15
    };
  },
  getUnknownConfig() {
    // Fetch all settings in one query instead of 3 separate queries
    const settings = LockoutSettings.find({
      _id: { $in: ['unknown-failuresBeforeLockout', 'unknown-lockoutPeriod', 'unknown-failureWindow'] }
    }, { fields: { _id: 1, value: 1 } }).fetch();

    const settingsMap = {};
    settings.forEach(s => { settingsMap[s._id] = s.value; });

    return {
      failuresBeforeLockout: settingsMap['unknown-failuresBeforeLockout'] || 3,
      lockoutPeriod: settingsMap['unknown-lockoutPeriod'] || 60,
      failureWindow: settingsMap['unknown-failureWindow'] || 15
    };
  }
});

export default LockoutSettings;
