import { Meteor } from 'meteor/meteor';
import LockoutSettings from '/models/lockoutSettings';
import securityLog from '/server/lib/securityLog';
import { applyAccountsLockoutConfiguration } from '/server/accounts-lockout-config';
const { lockSummary } = require('/models/lib/accountLockout');

export const LOCKOUT_FIELDS = Object.freeze({
  knownFailuresBeforeLockout: ['known-failuresBeforeLockout', 1, 10, 3],
  knownLockoutPeriod: ['known-lockoutPeriod', 10, 600, 60],
  knownFailureWindow: ['known-failureWindow', 1, 60, 15],
  unknownFailuresBeforeLockout: ['unknown-failuresBeforeLockout', 1, 10, 3],
  unknownLockoutPeriod: ['unknown-lockoutPeriod', 10, 600, 60],
  unknownFailureWindow: ['unknown-failureWindow', 1, 60, 15],
});

function report(actor, context, detail, category = 'authz') {
  securityLog.record({ severity: 'high', category, bleed: 'JamBleed', action: 'blocked',
    source: 'adminLockout', userId: actor?._id || context.userId,
    username: actor?.username, req: context.req, detail });
}

async function requireSiteAdmin(userId, context = {}) {
  const actor = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (actor?.isAdmin === true) return actor;
  report(actor, { ...context, userId }, 'refused Locked Users administration');
  throw new Meteor.Error('not-authorized', 'Site admin required');
}

function cleanSettings(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || Object.keys(input).some(field => !LOCKOUT_FIELDS[field])) {
    throw new Meteor.Error('invalid-lockout-settings');
  }
  return Object.fromEntries(Object.entries(LOCKOUT_FIELDS).map(([field, [, min, max]]) => {
    const value = Number(input[field]);
    if (!Number.isSafeInteger(value) || value < min || value > max) {
      throw new Meteor.Error('invalid-lockout-setting', field);
    }
    return [field, value];
  }));
}

export async function lockoutPageForAdmin(userId, context = {}) {
  await requireSiteAdmin(userId, context);
  const docs = await LockoutSettings.find({ _id: { $in:
    Object.values(LOCKOUT_FIELDS).map(([id]) => id) } }, {
    fields: { _id: 1, value: 1 },
  }).fetchAsync();
  const byId = Object.fromEntries(docs.map(doc => [doc._id, doc.value]));
  const settings = Object.fromEntries(Object.entries(LOCKOUT_FIELDS)
    .map(([field, [id, , , fallback]]) => [field, byId[id] ?? fallback]));
  const now = Date.now();
  const users = await Meteor.users.find({
    'services.accounts-lockout.lockedUntil': { $gt: now },
  }, { fields: { username: 1, emails: 1, 'services.accounts-lockout': 1 },
    sort: { username: 1 } }).fetchAsync();
  const lockedUsers = users.map(user => {
    const summary = lockSummary(user, now);
    return { _id: user._id, username: user.username || '',
      email: user.emails?.[0]?.address || '', failedAttempts: summary.failedAttempts || 0,
      lockedAddresses: summary.addresses || 0, unlockTime: summary.unlockTime,
      remainingLockTime: summary.secondsRemaining || 0 };
  });
  return { settings, lockedUsers };
}

export async function saveLockoutSettingsForAdmin(userId, input, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  let clean;
  try { clean = cleanSettings(input); } catch (error) {
    report(actor, context, `refused invalid lockout settings: ${error.error || error.message}`,
      'validation');
    throw error;
  }
  for (const [field, value] of Object.entries(clean)) {
    const [id] = LOCKOUT_FIELDS[field];
    await LockoutSettings.direct.updateAsync(id, { $set: { value } });
  }
  await applyAccountsLockoutConfiguration();
  return lockoutPageForAdmin(userId, context);
}

export async function reloadLockoutForAdmin(userId, context = {}) {
  await requireSiteAdmin(userId, context);
  return applyAccountsLockoutConfiguration();
}

export async function unlockUserForAdmin(userId, targetUserId, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  if (typeof targetUserId !== 'string' || !targetUserId) {
    report(actor, context, 'refused invalid unlock target', 'validation');
    throw new Meteor.Error('invalid-user');
  }
  if (!await Meteor.users.findOneAsync(targetUserId, { fields: { _id: 1 } })) {
    throw new Meteor.Error('error-user-not-found', 'User not found');
  }
  await Meteor.users.updateAsync(targetUserId, {
    $unset: { 'services.accounts-lockout': 1 },
  });
  return true;
}

export async function unlockAllUsersForAdmin(userId, context = {}) {
  await requireSiteAdmin(userId, context);
  await Meteor.users.updateAsync(
    { 'services.accounts-lockout.lockedUntil': { $exists: true } },
    { $unset: { 'services.accounts-lockout': 1 } }, { multi: true });
  return true;
}

export default { lockoutPageForAdmin, saveLockoutSettingsForAdmin,
  reloadLockoutForAdmin, unlockUserForAdmin, unlockAllUsersForAdmin };
