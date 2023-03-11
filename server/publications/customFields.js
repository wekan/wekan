Meteor.publish('customFields', function() {
  const ret = CustomFields.find();
  return ret;
});
