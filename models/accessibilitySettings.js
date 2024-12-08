import { ReactiveCache } from '/imports/reactiveCache';

AccessibilitySettings = new Mongo.Collection('accessibilitySettings');

AccessibilitySettings.attachSchema(
  new SimpleSchema({
    enabled: {
      type: Boolean,
      defaultValue: false,
    },
    title: {
      type: String,
      optional: true,
    },
    body: {
      type: String,
      optional: true,
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

AccessibilitySettings.allow({
  update(userId) {
    const user = ReactiveCache.getUser(userId);
    return user && user.isAdmin;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    AccessibilitySettings._collection.createIndex({ modifiedAt: -1 });
    const accessibilitySetting = AccessibilitySettings.findOne({});
    if (!accessibilitySetting) {
      AccessibilitySettings.insert({ enabled: false, sort: 0 });
    }
  });
}

export default AccessibilitySettings;
