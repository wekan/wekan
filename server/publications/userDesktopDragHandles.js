Meteor.publish('userDesktopDragHandles', function() {
  if (!this.userId) return this.ready();
  return Meteor.users.find({ _id: this.userId }, {
    fields: {
      'profile.showDesktopDragHandles': 1
    }
  });
});