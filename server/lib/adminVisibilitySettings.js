import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Settings from '/models/settings';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { ALLOWED_WAIT_SPINNERS } from '/config/const';
import securityLog from '/server/lib/securityLog';

export const VISIBILITY_GROUP_FIELDS = Object.freeze({
  allBoards: Object.freeze(['hideBoardActivitiesOnAllBoards', 'hideCardCounterList',
    'hideBoardMemberList', 'spinnerName', 'allowPrivateOnly']),
  urls: Object.freeze(['supportPageEnabled', 'supportPagePublic', 'supportTitle',
    'supportPageText', 'customHelpLinkUrl', 'legalNotice', 'automaticLinkedUrlSchemes']),
  product: Object.freeze(['productName']),
  logos: Object.freeze(['hideLogo', 'customLoginLogoLinkUrl',
    'textBelowCustomLoginLogo', 'customTopLeftCornerLogoLinkUrl',
    'customTopLeftCornerLogoHeight']),
});

const BRANDING_IMAGE_FIELDS = Object.freeze([
  'customLoginLogoImageUrl', 'customTopLeftCornerLogoImageUrl',
]);

export const GUARDED_VISIBILITY_SETTINGS_FIELDS = Object.freeze([
  ...Object.values(VISIBILITY_GROUP_FIELDS).flat()
    .filter(field => field !== 'allowPrivateOnly'),
  ...BRANDING_IMAGE_FIELDS,
]);

async function requireSiteAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  if (context.reportAttempt) securityLog.record({
    severity: 'high', category: 'authz', bleed: 'SettingsBleed', action: 'blocked',
    source: 'adminVisibilitySettings', userId, username: user?.username, req: context.req,
    detail: 'refused an attempt to change instance visibility settings',
  });
  throw new Meteor.Error('not-authorized', 'Site admin only');
}

const bounded = (value, maximum, code) => {
  check(value, String);
  const clean = value.trim();
  if (clean.length > maximum) throw new Meteor.Error(code);
  return clean;
};

function safeLink(value, code) {
  const clean = bounded(value, 4096, `${code}-too-long`);
  if (!clean) return '';
  if (clean.startsWith('/') && !clean.startsWith('//')) return clean;
  try {
    const url = new URL(clean);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch (_) { /* fixed error below */ }
  throw new Meteor.Error(code);
}

function normalize(group, values) {
  check(group, String); check(values, Object);
  if (!Object.prototype.hasOwnProperty.call(VISIBILITY_GROUP_FIELDS, group)) {
    throw new Meteor.Error('invalid-setting-group');
  }
  const requested = Object.keys(values);
  if (requested.some(field => !VISIBILITY_GROUP_FIELDS[group].includes(field))) {
    throw new Meteor.Error('invalid-setting-field');
  }
  const result = {};
  for (const field of requested) {
    const value = values[field];
    if (['hideBoardActivitiesOnAllBoards', 'hideCardCounterList', 'hideBoardMemberList',
      'allowPrivateOnly', 'supportPageEnabled', 'supportPagePublic', 'hideLogo'].includes(field)) {
      check(value, Boolean); result[field] = value;
    } else if (field === 'spinnerName') {
      check(value, String);
      if (!ALLOWED_WAIT_SPINNERS.includes(value)) throw new Meteor.Error('invalid-spinner');
      result[field] = value;
    } else if (['customHelpLinkUrl', 'legalNotice', 'customLoginLogoLinkUrl',
      'customTopLeftCornerLogoLinkUrl'].includes(field)) result[field] = safeLink(value, 'invalid-url');
    else if (field === 'customTopLeftCornerLogoHeight') {
      const height = bounded(value, 10, 'logo-height-too-long');
      if (height && !/^[1-9]\d{0,3}$/.test(height)) throw new Meteor.Error('invalid-logo-height');
      result[field] = height;
    } else result[field] = bounded(value,
      field === 'supportPageText' || field === 'textBelowCustomLoginLogo' ? 20000 : 1000,
      'setting-value-too-long');
  }
  return result;
}

export async function visibilitySettingsForAdmin(userId) {
  await requireSiteAdmin(userId);
  const fields = Object.fromEntries(GUARDED_VISIBILITY_SETTINGS_FIELDS.map(field => [field, 1]));
  const setting = await Settings.findOneAsync({}, { fields });
  if (!setting) throw new Meteor.Error('settings-not-found');
  const privateSetting = await TableVisibilityModeSettings.findOneAsync(
    'tableVisibilityMode-allowPrivateOnly', { fields: { booleanValue: 1 } });
  return { ...setting, allowPrivateOnly: privateSetting?.booleanValue === true };
}

export async function saveVisibilitySettingsForAdmin(userId, group, values, context = {}) {
  const user = await requireSiteAdmin(userId, { ...context, reportAttempt: true });
  let normalized;
  try { normalized = normalize(group, values); } catch (error) {
    securityLog.record({ severity: 'high', category: 'validation', bleed: 'SettingsBleed',
      action: 'blocked', source: 'adminVisibilitySettings', userId: user._id,
      username: user.username, req: context.req,
      detail: `refused invalid Visibility group or field: ${error.error || error.message}` });
    throw error;
  }
  if (Object.prototype.hasOwnProperty.call(normalized, 'allowPrivateOnly')) {
    await TableVisibilityModeSettings.direct.updateAsync(
      'tableVisibilityMode-allowPrivateOnly',
      { $set: { booleanValue: normalized.allowPrivateOnly } });
    delete normalized.allowPrivateOnly;
  }
  if (Object.keys(normalized).length) {
    const setting = await Settings.findOneAsync({}, { fields: { _id: 1 } });
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.direct.updateAsync(setting._id, { $set: normalized });
  }
  return true;
}
