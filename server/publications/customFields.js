Meteor.publish('customFields', function() {
  const ret = ReactiveCache.getCustomFields(null, null, true);
  return ret;
});
