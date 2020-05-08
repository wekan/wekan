Meteor.startup(() => {
  Notifications.subscribe('profile', (user, title, description, params) => {
    user.addNotification(params.activityId);
  });
});
