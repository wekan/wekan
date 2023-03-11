Meteor.publish('accountSettings', function() {
  const ret = AccountSettings.find();
  return ret;
});
