'use strict';
const { withSyncLease } = require('./syncLease');
const { withSmtpCancellation } = require('./smtpCancellation');
const CAPACITY = 4;
const lost = () => Object.assign(new Error('Email delivery reservation expired'), { code: 'sync-lease-lost' });

// All queue workers sharing this collection compete for the same four slots.
// Claim before recording an attempt. No payload or recipient is stored here.
function createEmailSendSlots(collection, { limit = CAPACITY, leaseMs = 60000,
  heartbeatMs = 15000, now = () => new Date() } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > CAPACITY ||
      !Number.isInteger(leaseMs) || leaseMs < 20 ||
      !Number.isInteger(heartbeatMs) || heartbeatMs < 1 || heartbeatMs >= leaseMs / 2) {
    throw new Error('Invalid email slot policy');
  }
  return async function withDeliverySlot(work, { assertOwner = async () => {} } = {}) {
    for (let slot = 0; slot < limit; slot++) {
      let entered = false;
      try {
        return await withSyncLease(collection, `slot-${slot}`, async ({ assertCurrent }) => {
          entered = true;
          const controller = new AbortController();
          let heartbeat, expiry, stopped = false;
          const abort = error => controller.abort(error || lost());
          const guard = async () => {
            if (controller.signal.aborted) throw controller.signal.reason;
            const before = now().getTime(), monotonic = process.hrtime.bigint();
            try {
              await assertCurrent();
              if (controller.signal.aborted) throw controller.signal.reason;
              // Start the expiry budget before the database round trip, never
              // after it. A hanging renewal cannot extend local send authority.
              const elapsed = Math.max(now().getTime() - before, Number(process.hrtime.bigint() - monotonic) / 1e6);
              const remaining = leaseMs - elapsed;
              if (remaining <= 0) throw lost();
              clearTimeout(expiry);
              expiry = setTimeout(() => abort(lost()), remaining);
              expiry.unref?.();
              await assertOwner();
              if (controller.signal.aborted) throw controller.signal.reason;
            } catch (error) { abort(error); throw error; }
          };
          const schedule = () => {
            if (stopped || controller.signal.aborted) return;
            heartbeat = setTimeout(() => { guard().then(schedule, () => {}); }, heartbeatMs);
            heartbeat.unref?.();
          };
          try {
            await guard();
            schedule();
            const result = await withSmtpCancellation(controller.signal, () => work({ assertCurrent: guard }));
            await guard();
            return result;
          } finally {
            stopped = true;
            clearTimeout(heartbeat); clearTimeout(expiry);
            // Late queued preparation must not start SMTP after releasing a slot.
            abort(lost());
          }
        }, { leaseMs, heartbeatMs: 0, now });
      } catch (error) {
        if (entered || error.code !== 'sync-busy') throw error;
      }
    }
    throw Object.assign(new Error('All email delivery slots are occupied'), { code: 'email-capacity-busy' });
  };
}
module.exports = { createEmailSendSlots, EMAIL_SEND_CAPACITY: CAPACITY };
