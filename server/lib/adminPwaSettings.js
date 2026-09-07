import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Settings from '/models/settings';
import securityLog from '/server/lib/securityLog';
import {
  normalizePwaJson,
  sanitizeCustomHeadTags,
} from '/server/lib/customHeadValidation';

export const PWA_TOGGLE_FIELDS = Object.freeze([
  'customHeadEnabled', 'customManifestEnabled', 'customAssetLinksEnabled',
]);

const PWA_FIELDS = Object.freeze([
  ...PWA_TOGGLE_FIELDS, 'customHeadMetaTags', 'customHeadLinkTags',
  'customManifestContent', 'customAssetLinksContent',
]);

async function requireGlobalAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  if (context.reportAttempt) securityLog.record({
    severity: 'high', category: 'authz', bleed: 'SettingsBleed', action: 'blocked',
    source: 'adminPwaSettings', userId, username: user?.username, req: context.req,
    detail: 'refused an attempt to change PWA settings',
  });
  throw new Meteor.Error('not-authorized', 'Admin only');
}

async function settingDocument() {
  const fields = Object.fromEntries(PWA_FIELDS.map(field => [field, 1]));
  const setting = await Settings.findOneAsync({}, { fields });
  if (!setting) throw new Meteor.Error('settings-not-found');
  return setting;
}

export async function pwaSettingsForAdmin(userId) {
  await requireGlobalAdmin(userId);
  const setting = await settingDocument();
  return Object.fromEntries(PWA_FIELDS.map(field => [
    field, PWA_TOGGLE_FIELDS.includes(field)
      ? setting[field] === true : String(setting[field] || ''),
  ]));
}

export async function setPwaToggleForAdmin(userId, field, enabled, context = {}) {
  check(field, String);
  check(enabled, Boolean);
  const user = await requireGlobalAdmin(userId, { ...context, reportAttempt: true });
  if (!PWA_TOGGLE_FIELDS.includes(field)) {
    securityLog.record({
      severity: 'high', category: 'authz', bleed: 'SettingsBleed', action: 'blocked',
      source: 'adminPwaSettings', userId: user._id, username: user.username,
      req: context.req, detail: 'refused a non-allowlisted PWA toggle field',
    });
    throw new Meteor.Error('invalid-setting');
  }
  const setting = await settingDocument();
  if ((setting[field] === true) !== enabled) {
    await Settings.updateAsync(setting._id, { $set: { [field]: enabled } });
  }
  return enabled;
}

export async function setPwaHeadContentForAdmin(
  userId,
  metaTags,
  linkTags,
  manifest,
  context = {},
) {
  check(metaTags, String); check(linkTags, String); check(manifest, String);
  await requireGlobalAdmin(userId, { ...context, reportAttempt: true });
  const values = {
    customHeadMetaTags: sanitizeCustomHeadTags(metaTags, 'meta'),
    customHeadLinkTags: sanitizeCustomHeadTags(linkTags, 'link'),
    customManifestContent: normalizePwaJson(manifest, 'object'),
  };
  const setting = await settingDocument();
  await Settings.updateAsync(setting._id, { $set: values });
  return values;
}

export async function setPwaAssetLinksForAdmin(userId, content, context = {}) {
  check(content, String);
  await requireGlobalAdmin(userId, { ...context, reportAttempt: true });
  const value = normalizePwaJson(content, 'array');
  const setting = await settingDocument();
  await Settings.updateAsync(setting._id, { $set: { customAssetLinksContent: value } });
  return value;
}
