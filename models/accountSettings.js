AccountSettings = new Mongo.Collection('accountSettings');

AccountSettings.attachSchema(new SimpleSchema({
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
}));

AccountSettings.allow({
  update(userId) {
    const user = Users.findOne(userId);
    return user && user.isAdmin;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    AccountSettings.upsert({ _id: 'accounts-allowEmailChange' }, {
      $setOnInsert: {
        booleanValue: false,
        sort: 0,
      },
    });
  });
}
