Announcements = new Mongo.Collection('announcements');

Announcements.attachSchema(new SimpleSchema({
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
    decimal: true,
  },
}));

Announcements.allow({
  update(userId) {
    const user = Users.findOne(userId);
    return user && user.isAdmin;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    const announcements = Announcements.findOne({});
    if(!announcements){
      Announcements.insert({enabled: false, sort: 0});
    }
  });
}
