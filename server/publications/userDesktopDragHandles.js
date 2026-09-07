Meteor.publish('userDesktopDragHandles', function() {
  if (!this.userId) return this.ready();
  return Meteor.users.find({ _id: this.userId }, {
    fields: {
      // Keep card preferences alive while route-scoped user publications stop
      // and start. Meteor merge-box tracks these dotted fields at the profile
      // object boundary, so removing another publication can otherwise leave
      // the current user's profile temporarily empty on a card route.
      'profile.showDesktopDragHandles': 1,
      'profile.dateFormat': 1,
    }
  });
});
