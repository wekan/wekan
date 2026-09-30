'use strict';
// Retention for rule email commands (maintainer decision of 2026-09-30):
// receipts are compacted after 90 days to a permanent minimal id and outcome,
// the notification outbox's policy (server/lib/emailReceiptRetention.js), so a
// late retry still finds its receipt.
//
// A rule email command carries the whole mail (body and attachments up to
// 12 MB) and its outcome row carries recipient addresses. Once the attempt is
// terminal (sent or dropped) AND the rule invocation's receipt exists, no
// replay reads the mail again: the rule executor skips an invocation with a
// receipt. The command is then replaced IN PLACE by
//   { _id, checksum, invocationId, planId, effectId, compactReceiptVersion: 1 }
// - the same _id, so its identity can never be taken by a new command - and
// the outcome row, which only served the unconfirmed-recipient review, is
// removed. The attempt row, already minimal metadata, is kept as it is.
const DAY = 86400000;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function syncReceiptPolicy(env = process.env) {
  const days = Number(env.SYNC_RECEIPT_METADATA_DAYS || 90);
  const intervalMs = Number(env.SYNC_RECEIPT_SWEEP_INTERVAL_MS || 3600000);
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650) throw new Error('SYNC_RECEIPT_METADATA_DAYS must be from 1 to 3650');
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1000 || intervalMs > DAY) throw new Error('SYNC_RECEIPT_SWEEP_INTERVAL_MS must be from 1000 to 86400000');
  return { days, intervalMs };
}

function compactRuleEmailCommand(command, attempt) {
  if (!command || Object.hasOwn(command, 'compactReceiptVersion') || !hash(command._id) || !hash(command.checksum) ||
      !hash(command.invocationId) || typeof command.planId !== 'string' || typeof command.effectId !== 'string' ||
      command.checksum !== attempt.commandHash || command.invocationId !== attempt.invocationId) return null;
  return { _id: command._id, checksum: command.checksum, invocationId: command.invocationId,
    planId: command.planId, effectId: command.effectId, compactReceiptVersion: 1 };
}

function isCompactRuleEmailCommand(row) {
  return !!row && row.compactReceiptVersion === 1 &&
    Object.keys(row).sort().join(',') === '_id,checksum,compactReceiptVersion,effectId,invocationId,planId';
}

// One batch along a keyset of terminal attempts (finishedAt, _id). A command
// that is not yet safe to compact - no invocation receipt - is skipped and
// looked at again on a later pass; malformed metadata is never deleted.
async function compactRuleEmailBatch({ attempts, commands, outcomes, receipts, cutoff, after, limit }) {
  const query = { state: { $in: ['sent', 'dropped'] }, finishedAt: { $type: 'date', $lte: cutoff },
    ...(after ? { $or: [{ finishedAt: { $gt: after.finishedAt } }, { finishedAt: after.finishedAt, _id: { $gt: after._id } }] } : {}) };
  const cursor = attempts.find(query, { projection: { _id: 1, state: 1, finishedAt: 1, commandHash: 1, invocationId: 1 } })
    .sort({ finishedAt: 1, _id: 1 }).limit(limit).batchSize(1);
  let visited = 0, compacted = 0, skipped = 0, last = null;
  try {
    for await (const attempt of cursor) {
      visited++;
      last = { _id: attempt._id, finishedAt: attempt.finishedAt };
      const command = await commands.findOne({ _id: attempt._id });
      if (isCompactRuleEmailCommand(command)) {
        await outcomes.deleteOne({ _id: attempt._id });
        continue;
      }
      const receipt = command && await receipts.findOne({ _id: command.invocationId, planId: command.planId, kind: 'action' });
      const compact = receipt && compactRuleEmailCommand(command, attempt);
      if (!compact) { skipped++; continue; }
      // Replace only the exact row read; a concurrent change is left alone.
      const selector = { _id: command._id, checksum: command.checksum, invocationId: command.invocationId,
        compactReceiptVersion: { $exists: false } };
      let error;
      try { await commands.replaceOne(selector, compact); } catch (failure) { error = failure; }
      const saved = await commands.findOne({ _id: command._id });
      if (!isCompactRuleEmailCommand(saved) || saved.checksum !== compact.checksum) {
        if (error) throw error;
        skipped++; continue;
      }
      await outcomes.deleteOne({ _id: attempt._id });
      compacted++;
    }
  } finally { await cursor.close(); }
  return { visited, compacted, skipped, next: visited === limit ? last : null };
}

function createSyncRuleEmailRetention({ attempts, commands, outcomes, receipts, days = 90, limit = 100, now = () => new Date() }) {
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650 || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
    throw new Error('Invalid sync receipt retention policy');
  }
  let after = null, running = null;
  async function sweep() {
    const cutoff = new Date(now().getTime() - days * DAY);
    const result = await compactRuleEmailBatch({ attempts, commands, outcomes, receipts, cutoff, after, limit });
    after = result.next;
    return result;
  }
  return {
    sweep() {
      if (!running) running = sweep().finally(() => { running = null; });
      return running;
    },
  };
}

module.exports = { syncReceiptPolicy, compactRuleEmailCommand, isCompactRuleEmailCommand,
  compactRuleEmailBatch, createSyncRuleEmailRetention };
