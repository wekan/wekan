import { trayDelivery } from '/server/notifications/trayQueue';
import { Notifications } from '/server/notifications/notifications';
import { ReactiveCache } from '/imports/reactiveCache';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';

export async function prepareTrayNotification(user, params) {
  // Validate user object before processing
  if (!user || !user._id) {
    throw new Error('invalid-profile-notification-user');
  }

  const boardId = params.boardId;
  const memberOverride = user.profile && user.profile.notifyOverrideTray;

  // 3-tier Notification Settings: admin default -> board override ->
  // member override (see models/lib/notificationSettings.js).
  const adminDefault = (await ReactiveCache.getCurrentSetting())?.notifyDefaultTray;
  const board = boardId
    ? await ReactiveCache.getBoard(boardId)
    : null;
  const enabled = resolveNotificationSetting('tray', {
    adminDefault,
    boardOverride: board && board.notifyOverrideTray,
    memberOverride,
  });
  return enabled;
}

Meteor.startup(() => {
  Notifications.subscribe('profile', async (user, title, description, params) => {
    if (await prepareTrayNotification(user, params)) {
      await trayDelivery.deliver(user._id, params.activityId);
    }
  });
});
