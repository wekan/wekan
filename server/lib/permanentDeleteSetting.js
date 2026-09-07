import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Settings from '/models/settings';
import RecoveryEvents from '/models/recoveryEvents';
import { recordRecoveryAudit } from '/server/lib/recoveryAudit';

export async function permanentDeleteSettingForAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (user?.isAdmin !== true) throw new Meteor.Error('not-authorized', 'Admin only');
  const setting = await Settings.findOneAsync({}, {
    fields: { enablePermanentDelete: 1 },
  });
  return setting?.enablePermanentDelete === true;
}

export async function setPermanentDeleteEnabledForAdmin(
  userId,
  enabled,
  connection,
) {
  let user;
  let username = 'unknown';
  try {
    check(enabled, Boolean);
    user = userId && await Meteor.users.findOneAsync(userId, {
      fields: { isAdmin: 1, username: 1 },
    });
    username = user?.username || user?._id || 'unknown';
    if (user?.isAdmin !== true) throw new Meteor.Error('not-authorized');

    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    if ((setting.enablePermanentDelete === true) === enabled) return enabled;

    await Settings.updateAsync(setting._id, {
      $set: { enablePermanentDelete: enabled },
    });
    await recordRecoveryAudit({
      type: RecoveryEvents.types.PERMANENT_DELETE_SETTING_CHANGED,
      user,
      connection,
      done: true,
      detail: `Global Admin ${username} (${user._id}) ${enabled ? 'enabled' : 'disabled'} permanent delete.`,
    });
    return enabled;
  } catch (error) {
    await recordRecoveryAudit({
      type: RecoveryEvents.types.PERMANENT_DELETE_SETTING_CHANGED,
      user,
      connection,
      done: false,
      detail: `User ${username} (${user?._id || userId || 'not logged in'}) failed to ${enabled ? 'enable' : 'disable'} permanent delete: ${error.reason || error.message || 'unknown error'}.`,
    });
    throw error;
  }
}

export default { permanentDeleteSettingForAdmin, setPermanentDeleteEnabledForAdmin };
