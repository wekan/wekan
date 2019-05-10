Meteor.publish('customFields', function() {
  return CustomFields.find();
});
