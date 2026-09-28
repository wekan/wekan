'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const storage = new AsyncLocalStorage();
async function withSyncActivityDeferred(activity, work) {
  const scope = { expected: canonical(activity), slots: new Set(['timestamps', 'notificationIntent', 'rules', 'notifications']), active: true };
  return storage.run(scope, async () => {
    try { return await work(); } finally { scope.active = false; }
  });
}
function deferSyncActivity(kind, activity) {
  const scope = storage.getStore();
  if (!scope?.active || !scope.slots.has(kind) || canonical(activity) !== scope.expected) return false;
  scope.slots.delete(kind);
  return true;
}
module.exports = { withSyncActivityDeferred, deferSyncActivity };
