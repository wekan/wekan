TableVisibilityModeSettings = new Mongo.Collection('tableVisibilityModeSettings');

TableVisibilityModeSettings.attachSchema(
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

TableVisibilityModeSettings.allow({
  update(userId) {
    const user = Users.findOne(userId);
    return user && user.isAdmin;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    TableVisibilityModeSettings._collection.createIndex({ modifiedAt: -1 });
    TableVisibilityModeSettings.upsert(
      { _id: 'tableVisibilityMode-allowPrivateOnly' },
      {
        $setOnInsert: {
          booleanValue: false,
          sort: 0,
        },
      },
    );
  });
}

TableVisibilityModeSettings.helpers({
  allowPrivateOnly() {
    return TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly').booleanValue;
  },
});

export default TableVisibilityModeSettings;
