import { ReactiveCache } from '/imports/reactiveCache';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'meteor/aldeed:simple-schema';

Announcements = new Mongo.Collection('announcements');

Announcements.attachSchema(
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

Announcements.allow({
  update(userId) {
    const user = ReactiveCache.getUser(userId);
    return user && user.isAdmin;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    Announcements.createIndex({ modifiedAt: -1 });
    const announcements = Announcements.findOne({});
    if (!announcements) {
      Announcements.insert({ enabled: false, sort: 0 });
    }
  });
}

export default Announcements;
