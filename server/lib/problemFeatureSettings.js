import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Settings from '/models/settings';
import securityLog from '/server/lib/securityLog';

export const SECURITY_FEATURE_FIELDS = Object.freeze([
  'renderLinksAsPlainText',
  'alwaysShowCodeAsText',
  'disableAllImport',
  'disableAllExport',
  'disableImportAvatars',
  'disableExportAvatars',
  'anonymizeImportUsers',
  'anonymizeExportUsers',
]);

export const NOTIFICATION_FEATURE_FIELDS = Object.freeze([
  'disableActivities',
  'disableNotifications',
  'disableWatch',
]);

const FEATURE_FIELDS = Object.freeze({
  security: SECURITY_FEATURE_FIELDS,
  notifications: NOTIFICATION_FEATURE_FIELDS,
});

async function requireAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  if (context.reportAttempt) securityLog.record({
    severity: 'high',
    category: 'authz',
    bleed: 'SettingsBleed',
    action: 'blocked',
    source: 'problemFeatureSettings',
    userId,
    username: user?.username,
    req: context.req,
    detail: 'refused an attempt to change a Global Admin security feature setting',
  });
  throw new Meteor.Error('not-authorized', 'Admin only');
}

export async function problemFeatureSettingsForAdmin(userId, pane) {
  check(pane, String);
  await requireAdmin(userId);
  const allowed = FEATURE_FIELDS[pane];
  if (!allowed) throw new Meteor.Error('invalid-settings-pane');
  const fields = Object.fromEntries(allowed.map(field => [field, 1]));
  const setting = await Settings.findOneAsync({}, { fields });
  return Object.fromEntries(allowed.map(field => [
    field, setting?.[field] === true,
  ]));
}

export async function setProblemFeatureSettingForAdmin(
  userId,
  pane,
  field,
  enabled,
  context = {},
) {
  check(pane, String);
  check(field, String);
  check(enabled, Boolean);
  const user = await requireAdmin(userId, { ...context, reportAttempt: true });
  const allowed = FEATURE_FIELDS[pane];
  if (!allowed || !allowed.includes(field)) {
    securityLog.record({
      severity: 'high',
      category: 'authz',
      bleed: 'SettingsBleed',
      action: 'blocked',
      source: 'problemFeatureSettings',
      userId: user._id,
      username: user.username,
      req: context.req,
      detail: 'refused an attempt to change a non-allowlisted feature setting',
    });
    throw new Meteor.Error('invalid-setting', 'Setting is not editable here');
  }
  const setting = await Settings.findOneAsync({}, { fields: { [field]: 1 } });
  if (!setting) throw new Meteor.Error('settings-not-found');
  if ((setting[field] === true) !== enabled) {
    await Settings.updateAsync(setting._id, { $set: { [field]: enabled } });
  }
  return enabled;
}

export const securityFeatureSettingsForAdmin = userId =>
  problemFeatureSettingsForAdmin(userId, 'security');

export const notificationFeatureSettingsForAdmin = userId =>
  problemFeatureSettingsForAdmin(userId, 'notifications');
