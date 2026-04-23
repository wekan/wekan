import UnsavedEditCollection from '/models/unsavedEdits';

Meteor.publish('unsaved-edits', function() {
  const ret = UnsavedEditCollection.find({
    userId: this.userId,
  });
  return ret;
});
