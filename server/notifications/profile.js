Meteor.startup(() => {
  Notifications.subscribe('profile', (user, title, description, params) => {
    try {
      // Validate user object before processing
      if (!user || !user._id) {
        console.error('Invalid user object in notification:', { user, title, params });
        return;
      }
      const modifier = user.addNotification(params.activityId);
      Users.direct.update(user._id, modifier);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  });
});
