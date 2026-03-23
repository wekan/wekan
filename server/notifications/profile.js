import { Notifications } from '/server/notifications/notifications';
import Users from '/models/users';

Meteor.startup(() => {
  Notifications.subscribe('profile', async (user, title, description, params) => {
    try {
      // Validate user object before processing
      if (!user || !user._id) {
        console.error('Invalid user object in notification:', { user, title, params });
        return;
      }
      const modifier = user.addNotification(params.activityId);
      await Users.direct.updateAsync(user._id, modifier);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  });
});
