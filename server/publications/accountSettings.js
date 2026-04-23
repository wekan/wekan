import AccountSettings from '/models/accountSettings';

Meteor.publish('accountSettings', function() {
  const ret = AccountSettings.find();
  return ret;
});
