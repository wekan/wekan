import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import securityLog from '/server/lib/securityLog';

TableVisibilityModeSettings.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});

TableVisibilityModeSettings.deny({
  async update(userId, doc) {
    if (doc?._id !== 'tableVisibilityMode-allowPrivateOnly') return false;
    const user = userId && await Meteor.users.findOneAsync(userId, { fields: { username: 1 } });
    securityLog.record({ severity: 'high', category: 'authz', bleed: 'SettingsBleed',
      action: 'blocked', source: 'TableVisibilityModeSettings DDP update', userId,
      username: user?.username,
      detail: 'refused direct update of the guarded private-only setting' });
    return true;
  },
});
