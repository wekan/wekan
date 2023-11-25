Meteor.publish('unsaved-edits', function() {
  const ret = UnsavedEditCollection.find({
    userId: this.userId,
  });
  return ret;
});
