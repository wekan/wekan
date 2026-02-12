import { ReactiveCache } from '/imports/reactiveCache';

LockoutSettings = new Mongo.Collection('lockoutSettings');

LockoutSettings.attachSchema(
  new SimpleSchema({
    _id: {
      type: String,
    },
    value: {
      type: Number,
      decimal: false,
    },
    category: {
      type: String,
    },
    sort: {
      type: Number,
      decimal: true,
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

LockoutSettings.allow({
  update(userId) {
    const user = ReactiveCache.getUser(userId);
    return user && user.isAdmin;
  },
});

if (Meteor.isServer) {
  Meteor.startup(async () => {
    await LockoutSettings._collection.createIndexAsync({ modifiedAt: -1 });

    // Known users settings
    await LockoutSettings.upsertAsync(
      { _id: 'known-failuresBeforeLockout' },
      {
        $setOnInsert: {
          value: process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE
            ? parseInt(process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE, 10) : 3,
          category: 'known',
          sort: 0,
        },
      },
    );

    await LockoutSettings.upsertAsync(
      { _id: 'known-lockoutPeriod' },
      {
        $setOnInsert: {
          value: process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD
            ? parseInt(process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD, 10) : 60,
          category: 'known',
          sort: 1,
        },
      },
    );

    await LockoutSettings.upsertAsync(
      { _id: 'known-failureWindow' },
      {
        $setOnInsert: {
          value: process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW
            ? parseInt(process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW, 10) : 15,
          category: 'known',
          sort: 2,
        },
      },
    );

    // Unknown users settings
    const typoVar = process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE;
    const correctVar = process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BEFORE;

    await LockoutSettings.upsertAsync(
      { _id: 'unknown-failuresBeforeLockout' },
      {
        $setOnInsert: {
          value: (correctVar || typoVar)
            ? parseInt(correctVar || typoVar, 10) : 3,
          category: 'unknown',
          sort: 0,
        },
      },
    );

    await LockoutSettings.upsertAsync(
      { _id: 'unknown-lockoutPeriod' },
      {
        $setOnInsert: {
          value: process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD
            ? parseInt(process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD, 10) : 60,
          category: 'unknown',
          sort: 1,
        },
      },
    );

    await LockoutSettings.upsertAsync(
      { _id: 'unknown-failureWindow' },
      {
        $setOnInsert: {
          value: process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW
            ? parseInt(process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW, 10) : 15,
          category: 'unknown',
          sort: 2,
        },
      },
    );
  });
}

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
