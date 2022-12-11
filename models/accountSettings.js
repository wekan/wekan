AccountSettings = new Mongo.Collection('accountSettings');

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

AccountSettings.allow({
  update(userId) {
    const user = Users.findOne(userId);
    return user && user.isAdmin;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    AccountSettings._collection._ensureIndex({ modifiedAt: -1 });
    AccountSettings.upsert(
      { _id: 'accounts-allowEmailChange' },
      {
        $setOnInsert: {
          booleanValue: false,
          sort: 0,
        },
      },
    );
    AccountSettings.upsert(
      { _id: 'accounts-allowUserNameChange' },
      {
        $setOnInsert: {
          booleanValue: false,
          sort: 1,
        },
      },
    );
    AccountSettings.upsert(
      { _id: 'accounts-allowUserDelete' },
      {
        $setOnInsert: {
          booleanValue: false,
          sort: 0,
        },
      },
    );
  });
}

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
