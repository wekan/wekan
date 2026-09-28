'use strict';
function activityNotificationRecoveryInterval(env = process.env) {
  const value = Number(env.ACTIVITY_NOTIFICATION_RECOVERY_INTERVAL_MS || 1000);
  if (!Number.isSafeInteger(value) || value < 1000 || value > 60000) {
    throw new Error('ACTIVITY_NOTIFICATION_RECOVERY_INTERVAL_MS must be from 1000 to 60000');
  }
  return value;
}
// Read only bounded IDs. The runner loads one private payload under its shared
// reservation. Advance past malformed/orphaned rows so they cannot hide others.
function createActivityNotificationRecovery({ intents, run, limit = 100 }) {
  if (typeof run !== 'function' || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
    throw new Error('invalid-activity-notification-recovery');
  }
  let after = null, running;
  async function scan() {
    const rows = await intents.find({ state: 'pending', _id: { $type: 'string', ...(after ? { $gt: after } : {}) } },
      { projection: { _id: 1 } }).sort({ _id: 1 }).limit(limit).toArray();
    const result = { visited: rows.length, completed: 0, skipped: 0, failed: 0, busy: 0 };
    for (const row of rows) {
      try {
        const status = await run(row._id);
        if (status === 'completed') result.completed++;
        else if (status === 'skipped') result.skipped++;
        else throw new Error('activity-notification-recovery-unconfirmed');
      } catch (error) {
        if (error.code === 'sync-busy') result.busy++;
        else if (['activity-notification-paused', 'activity-notification-cancelled'].includes(error.message)) result.skipped++;
        else result.failed++;
      }
    }
    after = rows.length === limit ? rows[rows.length - 1]._id : null;
    return result;
  }
  return () => {
    if (!running) running = scan().finally(() => { running = null; });
    return running;
  };
}
module.exports = { createActivityNotificationRecovery, activityNotificationRecoveryInterval };
