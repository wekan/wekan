import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Announcements from '/models/announcements';
import securityLog from '/server/lib/securityLog';

async function requireGlobalAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  if (context.reportAttempt) securityLog.record({
    severity: 'high',
    category: 'authz',
    bleed: 'SettingsBleed',
    action: 'blocked',
    source: 'adminAnnouncement',
    userId,
    username: user?.username,
    req: context.req,
    detail: 'refused an attempt to change the system-wide announcement',
  });
  throw new Meteor.Error('not-authorized', 'Admin only');
}

export async function announcementForAdmin(userId) {
  await requireGlobalAdmin(userId);
  const announcement = await Announcements.findOneAsync({}, {
    fields: { enabled: 1, body: 1 },
  });
  return {
    enabled: announcement?.enabled === true,
    body: String(announcement?.body || ''),
  };
}

export async function setAnnouncementFieldForAdmin(
  userId,
  field,
  value,
  context = {},
) {
  check(field, String);
  const user = await requireGlobalAdmin(userId, { ...context, reportAttempt: true });
  if (field !== 'enabled' && field !== 'body') {
    securityLog.record({
      severity: 'high',
      category: 'authz',
      bleed: 'SettingsBleed',
      action: 'blocked',
      source: 'adminAnnouncement',
      userId: user._id,
      username: user.username,
      req: context.req,
      detail: 'refused a non-allowlisted announcement field',
    });
    throw new Meteor.Error('invalid-setting', 'Setting is not editable here');
  }
  if (field === 'enabled') check(value, Boolean);
  else {
    check(value, String);
    value = value.trim();
    if (value.length > 10000) throw new Meteor.Error('announcement-too-long');
  }
  const announcement = await Announcements.findOneAsync({}, {
    fields: { [field]: 1 },
  });
  if (!announcement) throw new Meteor.Error('announcement-not-found');
  if (announcement[field] !== value) {
    await Announcements.updateAsync(announcement._id, { $set: { [field]: value } });
  }
  return value;
}
