const { randomUUID } = require('node:crypto');

const BUSY = 'Sync is already running or its settings are being saved. Retry shortly.';
const LOST = 'Sync reservation expired or could not be renewed. Retry Sync.';
function leaseError(code, message) { return Object.assign(new Error(message), { code }); }

// One raw-driver document per list coordinates separate server processes.
// This is a renewable reservation, not a transaction across application data.
async function withSyncLease(collection, listId, work, {
  leaseMs = 60000, heartbeatMs = 15000, now = () => new Date(),
} = {}) {
  const owner = randomUUID();
  const started = now();
  try {
    await collection.updateOne({ _id: listId, expiresAt: { $lte: started } }, {
      $set: { owner, expiresAt: new Date(started.getTime() + leaseMs) },
    }, { upsert: true });
  } catch (error) {
    if (error.code === 11000) throw leaseError('sync-busy', BUSY);
    throw error;
  }
  let failure, timer, renewal = Promise.resolve();
  const assertCurrent = () => {
    // Serialize explicit checks and timer renewals, including their failures.
    renewal = renewal.then(async () => {
      if (failure) throw failure;
      const time = now();
      try {
        const result = await collection.updateOne({ _id: listId, owner, expiresAt: { $gt: time } },
          { $set: { expiresAt: new Date(time.getTime() + leaseMs) } });
        if (result.matchedCount !== 1) throw leaseError('sync-lease-lost', LOST);
      } catch (error) {
        failure = leaseError('sync-lease-lost', LOST);
        throw failure;
      }
    });
    return renewal;
  };
  const schedule = () => {
    if (!heartbeatMs) return;
    timer = setTimeout(() => {
      assertCurrent().then(schedule, () => {});
    }, heartbeatMs);
    timer.unref?.();
  };
  schedule();
  try {
    const result = await work({ assertCurrent });
    await assertCurrent();
    return result;
  } finally {
    clearTimeout(timer);
    await renewal.catch(() => {});
    clearTimeout(timer);
    // A delayed former owner must never remove a replacement worker's lease.
    await collection.deleteOne({ _id: listId, owner });
  }
}

module.exports = { withSyncLease };
