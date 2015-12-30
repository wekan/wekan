Meteor.startup(() => {
  // XXX: add activity id to profile.notifications, 
  // it can be displayed and rendered on web or mobile UI
  // will uncomment the following code once UI implemented
  //
  // Notifications.subscribe('profile', (user, title, description, params) => {
  // user.addNotification(params.activityId);
  // });
});
