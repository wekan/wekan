import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import AccessibilitySettings from '/models/accessibilitySettings';
import securityLog from '/server/lib/securityLog';

async function requireGlobalAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  if (context.reportAttempt) securityLog.record({
    severity: 'high', category: 'authz', bleed: 'SettingsBleed', action: 'blocked',
    source: 'adminAccessibility', userId, username: user?.username, req: context.req,
    detail: 'refused an attempt to change the Accessibility page settings',
  });
  throw new Meteor.Error('not-authorized', 'Admin only');
}

export async function accessibilityForAdmin(userId) {
  await requireGlobalAdmin(userId);
  const setting = await AccessibilitySettings.findOneAsync({}, {
    fields: { enabled: 1, title: 1, body: 1 },
  });
  return {
    enabled: setting?.enabled === true,
    title: String(setting?.title || ''),
    body: String(setting?.body || ''),
  };
}

async function settingDocument() {
  const setting = await AccessibilitySettings.findOneAsync({}, {
    fields: { enabled: 1, title: 1, body: 1 },
  });
  if (!setting) throw new Meteor.Error('accessibility-settings-not-found');
  return setting;
}

export async function setAccessibilityEnabledForAdmin(userId, enabled, context = {}) {
  check(enabled, Boolean);
  await requireGlobalAdmin(userId, { ...context, reportAttempt: true });
  const setting = await settingDocument();
  if ((setting.enabled === true) !== enabled) {
    await AccessibilitySettings.updateAsync(setting._id, { $set: { enabled } });
  }
  return enabled;
}

export async function setAccessibilityContentForAdmin(
  userId,
  title,
  body,
  context = {},
) {
  check(title, String);
  check(body, String);
  await requireGlobalAdmin(userId, { ...context, reportAttempt: true });
  title = title.trim();
  body = body.trim();
  if (title.length > 500 || body.length > 10000) {
    throw new Meteor.Error('accessibility-content-too-long');
  }
  const setting = await settingDocument();
  if (setting.title !== title || setting.body !== body) {
    await AccessibilitySettings.updateAsync(setting._id, { $set: { title, body } });
  }
  return { title, body };
}
