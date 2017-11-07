Meteor.publish('people', function () {
  return Meteor.users.find({}, {fields:{}});
});
