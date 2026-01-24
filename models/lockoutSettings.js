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
    LockoutSettings.upsert(
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

    LockoutSettings.upsert(
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

    LockoutSettings.upsert(
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

    LockoutSettings.upsert(
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

    LockoutSettings.upsert(
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

    LockoutSettings.upsert(
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
    return {
      failuresBeforeLockout: LockoutSettings.findOne('known-failuresBeforeLockout')?.value || 3,
      lockoutPeriod: LockoutSettings.findOne('known-lockoutPeriod')?.value || 60,
      failureWindow: LockoutSettings.findOne('known-failureWindow')?.value || 15
    };
  },
  getUnknownConfig() {
    return {
      failuresBeforeLockout: LockoutSettings.findOne('unknown-failuresBeforeLockout')?.value || 3,
      lockoutPeriod: LockoutSettings.findOne('unknown-lockoutPeriod')?.value || 60,
      failureWindow: LockoutSettings.findOne('unknown-failureWindow')?.value || 15
    };
  }
});

export default LockoutSettings;
