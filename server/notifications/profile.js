import { Notifications } from '/server/notifications/notifications';
import Users from '/models/users';
import { ReactiveCache } from '/imports/reactiveCache';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';

Meteor.startup(() => {
  Notifications.subscribe('profile', async (user, title, description, params) => {
    try {
      // Validate user object before processing
      if (!user || !user._id) {
        console.error('Invalid user object in notification:', { user, title, params });
        return;
      }

      // 3-tier Notification Settings: admin default -> board override ->
      // member override (see models/lib/notificationSettings.js).
      const setting = await ReactiveCache.getCurrentSetting();
      const board = params.boardId
        ? await ReactiveCache.getBoard(params.boardId)
        : null;
      const enabled = resolveNotificationSetting('tray', {
        adminDefault: setting && setting.notifyDefaultTray,
        boardOverride: board && board.notifyOverrideTray,
        memberOverride: user.profile && user.profile.notifyOverrideTray,
      });
      if (!enabled) return;

      const modifier = user.addNotification(params.activityId);
      await Users.direct.updateAsync(user._id, modifier);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  });
});
