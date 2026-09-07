import Settings from '/models/settings';
import { GUARDED_VISIBILITY_SETTINGS_FIELDS } from '/server/lib/adminVisibilitySettings';
import securityLog from '/server/lib/securityLog';

Settings.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});

const GUARDED_PWA_FIELDS = new Set([
  'customHeadEnabled', 'customHeadMetaTags', 'customHeadLinkTags',
  'customManifestEnabled', 'customManifestContent',
  'customAssetLinksEnabled', 'customAssetLinksContent',
]);
const GUARDED_SETTINGS_FIELDS = new Set([
  ...GUARDED_PWA_FIELDS, ...GUARDED_VISIBILITY_SETTINGS_FIELDS,
  'disableForgotPassword', 'disableRegistration', 'displayAuthenticationMethod',
  'defaultAuthenticationMethod', 'oidcBtnText',
  'mailServer', 'mailDomainName',
]);

Settings.deny({
  async update(userId, doc, fields) {
    const refused = fields.filter(field => GUARDED_SETTINGS_FIELDS.has(field));
    if (!refused.length) return false;
    const user = userId && await Meteor.users.findOneAsync(userId, { fields: { username: 1 } });
    securityLog.record({ severity: 'high', category: 'authz', bleed: 'SettingsBleed',
      action: 'blocked', source: 'Settings DDP update', userId,
      username: user?.username,
      detail: `refused direct update of guarded settings fields: ${refused.join(', ')}` });
    return true;
  },
});
