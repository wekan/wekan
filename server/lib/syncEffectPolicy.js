'use strict';
function validateSyncEffectPolicy(policy) {
  if (!policy || Object.keys(policy).sort().join(',') !== 'activities,notifications' ||
      typeof policy.activities !== 'boolean' || typeof policy.notifications !== 'boolean') {
    throw new Error('sync-effect-policy-invalid');
  }
  return { activities: policy.activities, notifications: policy.notifications };
}
function syncEffectPolicy(flags) {
  if (!flags || typeof flags.disableActivities !== 'boolean' || typeof flags.disableNotifications !== 'boolean') {
    throw new Error('sync-effect-policy-invalid');
  }
  return { activities: !flags.disableActivities, notifications: !flags.disableNotifications };
}
async function assertSyncEffectPolicy(expected, readPolicy) {
  expected = validateSyncEffectPolicy(expected);
  if (typeof readPolicy !== 'function') throw new Error('sync-effect-policy-required');
  const current = validateSyncEffectPolicy(await readPolicy());
  if (current.activities !== expected.activities || current.notifications !== expected.notifications) {
    throw new Error('sync-effect-policy-changed');
  }
}
module.exports = { validateSyncEffectPolicy, syncEffectPolicy, assertSyncEffectPolicy };
