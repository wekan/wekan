import { trayDelivery } from '/server/notifications/trayQueue';
import { Notifications } from '/server/notifications/notifications';
import { ReactiveCache } from '/imports/reactiveCache';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';

Meteor.startup(() => {
  Notifications.subscribe('profile', async (user, title, description, params) => {
    // The ordinary dispatcher isolates failures; awaited delivery must receive
    // them so it cannot acknowledge an unsuccessful subscriber.
    // Validate user object before processing
    if (!user || !user._id) {
      throw new Error('invalid-profile-notification-user');
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

    await trayDelivery.deliver(user._id, params.activityId);
  });
});
