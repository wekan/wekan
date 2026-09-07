import AccountSettings from '/models/accountSettings';
import securityLog from '/server/lib/securityLog';

AccountSettings.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});

AccountSettings.deny({
  async update(userId, doc) {
    if (!['accounts-allowUserNameChange', 'accounts-allowUserDelete'].includes(doc?._id)) {
      return false;
    }
    const user = userId && await Meteor.users.findOneAsync(userId, {
      fields: { username: 1 },
    });
    securityLog.record({ severity: 'high', category: 'authz',
      bleed: 'LoginSettingsBleed', action: 'blocked',
      source: 'AccountSettings DDP update', userId, username: user?.username,
      detail: 'refused direct update of guarded account login settings' });
    return true;
  },
});
