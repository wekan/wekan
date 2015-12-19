import { UnsavedEditCollection } from 'models';

Meteor.publish('unsaved-edits', function() {
  return UnsavedEditCollection.find({
    userId: this.userId,
  });
});
