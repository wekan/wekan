'use strict';
// Retention for stored Sync plans (maintainer decision of 2026-09-30): after
// SYNC_RECEIPT_METADATA_DAYS (90) a completed plan is compacted in place to a
// permanent minimal id and outcome. Shared by the notification plans
// (syncNotificationRetention.js) and the webhook plans (syncWebhookRetention.js).
//
// A completion receipt { _id: planId, version: 1, activityHash, checksum,
// completedAt } is written once the plan's work is confirmed; the first one
// stored wins, with its timestamp. A plan whose receipt is older than the
// policy is replaced IN PLACE by { _id, activityHash, checksum,
// compactReceiptVersion: 1 } - the same _id, so a late replay can never rebuild
// and redo it. A replay that finds the compact form returns as completed.
// `beforeCompact(row)`, when given, removes rows that only the uncompleted
// plan could need; it runs before the plan is compacted and must be idempotent.
function createPlanRetentionKit(prefix) {
  const DAY = 86400000;
  const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  const fail = code => { throw new Error(`${prefix}-${code}`); };

  function isCompactPlan(row) {
    return !!row && row.compactReceiptVersion === 1 && hash(row._id) && hash(row.checksum) && hash(row.activityHash) &&
      Object.keys(row).sort().join(',') === '_id,activityHash,checksum,compactReceiptVersion';
  }
  function validReceipt(row) {
    return !!row && row.version === 1 && hash(row._id) && hash(row.checksum) && hash(row.activityHash) &&
      row.completedAt instanceof Date && Number.isFinite(row.completedAt.getTime()) &&
      Object.keys(row).sort().join(',') === '_id,activityHash,checksum,completedAt,version';
  }

  // After confirmed delivery. Idempotent: a retry keeps the first receipt.
  async function recordPlanCompletion({ receipts, id, activityHash, checksum, now = () => new Date() }) {
    if (!hash(id) || !hash(activityHash) || !hash(checksum)) fail('receipt-invalid');
    const receipt = { _id: id, version: 1, activityHash, checksum, completedAt: now() };
    let error;
    try { await receipts.insertOne(receipt); } catch (failure) { error = failure; }
    const saved = await receipts.findOne({ _id: id });
    if (!validReceipt(saved)) throw error || new Error(`${prefix}-receipt-unconfirmed`);
    if (saved.activityHash !== activityHash || saved.checksum !== checksum) fail('receipt-conflict');
    return saved;
  }

  // A compacted plan stands for a delivered one only with its matching receipt.
  async function readCompactedPlan({ receipts, row, activityHash }) {
    if (!isCompactPlan(row) || row.activityHash !== activityHash) fail('plan-invalid');
    const receipt = await receipts.findOne({ _id: row._id });
    if (!validReceipt(receipt) || receipt.checksum !== row.checksum || receipt.activityHash !== activityHash) fail('plan-invalid');
    return row._id;
  }

  // One batch along the receipts' keyset (completedAt, _id).
  async function compactPlanBatch({ plans, receipts, cutoff, after, limit, beforeCompact }) {
    const query = { completedAt: { $type: 'date', $lte: cutoff },
      ...(after ? { $or: [{ completedAt: { $gt: after.completedAt } }, { completedAt: after.completedAt, _id: { $gt: after._id } }] } : {}) };
    const cursor = receipts.find(query).sort({ completedAt: 1, _id: 1 }).limit(limit).batchSize(1);
    let visited = 0, compacted = 0, skipped = 0, last = null;
    try {
      for await (const receipt of cursor) {
        visited++;
        last = { _id: receipt._id, completedAt: receipt.completedAt };
        const row = validReceipt(receipt) && await plans.findOne({ _id: receipt._id });
        if (!row || isCompactPlan(row)) continue;
        // Only the exact plan the receipt was written for; anything else stays.
        if (Object.keys(row).sort().join(',') !== '_id,checksum,plan' || row.checksum !== receipt.checksum ||
            row.plan?.activityHash !== receipt.activityHash) { skipped++; continue; }
        if (beforeCompact) await beforeCompact(row);
        const compact = { _id: row._id, activityHash: receipt.activityHash, checksum: row.checksum, compactReceiptVersion: 1 };
        let error;
        try { await plans.replaceOne({ _id: row._id, checksum: row.checksum, compactReceiptVersion: { $exists: false } }, compact); }
        catch (failure) { error = failure; }
        const saved = await plans.findOne({ _id: row._id });
        if (!isCompactPlan(saved) || saved.checksum !== compact.checksum) {
          if (error) throw error;
          skipped++; continue;
        }
        compacted++;
      }
    } finally { await cursor.close(); }
    return { visited, compacted, skipped, next: visited === limit ? last : null };
  }

  function createPlanRetention({ plans, receipts, days = 90, limit = 100, now = () => new Date(), beforeCompact }) {
    if (!Number.isSafeInteger(days) || days < 1 || days > 3650 || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
      throw new Error(`Invalid ${prefix} retention policy`);
    }
    let after = null, running = null;
    async function sweep() {
      const result = await compactPlanBatch({ plans, receipts, beforeCompact,
        cutoff: new Date(now().getTime() - days * DAY), after, limit });
      after = result.next;
      return result;
    }
    return { sweep() { if (!running) running = sweep().finally(() => { running = null; }); return running; } };
  }

  return { isCompactPlan, recordPlanCompletion, readCompactedPlan, compactPlanBatch, createPlanRetention };
}
module.exports = { createPlanRetentionKit };
