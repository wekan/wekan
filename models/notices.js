Notices = new Mongo.Collection('notices');

Notices.attachSchema(new SimpleSchema({
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

Notices.allow({
  update(userId) {
    const user = Users.findOne(userId);
    return user && user.isAdmin;
  },
});

if (Meteor.isServer) {
  Meteor.startup(() => {
    const notices = Notices.findOne({});
    if(!notices){
      Notices.insert({enabled: false, sort: 0});
    }
  });
}
