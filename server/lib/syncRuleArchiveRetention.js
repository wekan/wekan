'use strict';
// Retention for stored rule archive commands and effects (maintainer decision
// of 2026-09-30). A command keeps up to 1000 cards' titles and placement, and
// its effects row the History and activity content written for them - forever.
// Once the archive runner has finished (its final 'rule-archive' receipt
// exists) a completion receipt { _id: commandId, version: 1, invocationId,
// checksum, completedAt } is written. SYNC_RECEIPT_METADATA_DAYS (90) later the
// effects row is removed - it is read only while the command is unfinished -
// and the command is replaced IN PLACE by { _id, checksum, invocationId, planId,
// compactReceiptVersion: 1 }, so its id stays taken and a late replay returns
// the invocation as done. Card and final receipts, already minimal, stay.
const DAY = 86400000;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const fail = code => { throw new Error(`sync-rule-archive-${code}`); };

function isCompactArchiveCommand(row) {
  return !!row && row.compactReceiptVersion === 1 && hash(row._id) && hash(row.checksum) && hash(row.invocationId) &&
    typeof row.planId === 'string' &&
    Object.keys(row).sort().join(',') === '_id,checksum,compactReceiptVersion,invocationId,planId';
}
function validCompletion(row) {
  return !!row && row.version === 1 && hash(row._id) && hash(row.checksum) && hash(row.invocationId) &&
    row.completedAt instanceof Date && Number.isFinite(row.completedAt.getTime()) &&
    Object.keys(row).sort().join(',') === '_id,checksum,completedAt,invocationId,version';
}

async function recordArchiveCompletion({ completions, command, now = () => new Date() }) {
  if (!command || !hash(command._id) || !hash(command.checksum) || !hash(command.invocationId)) fail('completion-invalid');
  const expected = { _id: command._id, version: 1, invocationId: command.invocationId, checksum: command.checksum, completedAt: now() };
  let error;
  try { await completions.insertOne(expected); } catch (failure) { error = failure; }
  const saved = await completions.findOne({ _id: command._id });
  if (!validCompletion(saved)) throw error || new Error('sync-rule-archive-completion-unconfirmed');
  if (saved.checksum !== command.checksum || saved.invocationId !== command.invocationId) fail('completion-conflict');
  return saved;
}

// A compacted command stands for finished work only with its completion and
// the runner's own final receipt.
async function readCompactedArchive({ row, completions, receipts }) {
  if (!isCompactArchiveCommand(row)) fail('command-invalid');
  const [completion, final] = await Promise.all([completions.findOne({ _id: row._id }), receipts.findOne({ _id: row._id })]);
  if (!validCompletion(completion) || completion.checksum !== row.checksum || completion.invocationId !== row.invocationId ||
      !final || final.kind !== 'rule-archive' || final.checksum !== row.checksum) fail('command-invalid');
  return row.invocationId;
}

async function compactArchiveBatch({ commands, effects, completions, cutoff, after, limit }) {
  const query = { completedAt: { $type: 'date', $lte: cutoff },
    ...(after ? { $or: [{ completedAt: { $gt: after.completedAt } }, { completedAt: after.completedAt, _id: { $gt: after._id } }] } : {}) };
  const cursor = completions.find(query).sort({ completedAt: 1, _id: 1 }).limit(limit).batchSize(1);
  let visited = 0, compacted = 0, skipped = 0, last = null;
  try {
    for await (const completion of cursor) {
      visited++;
      last = { _id: completion._id, completedAt: completion.completedAt };
      const row = validCompletion(completion) && await commands.findOne({ _id: completion._id });
      if (!row) continue;
      if (isCompactArchiveCommand(row)) { await effects.deleteOne({ _id: row._id }); continue; }
      if (row.checksum !== completion.checksum || row.invocationId !== completion.invocationId ||
          !hash(row.checksum) || typeof row.planId !== 'string') { skipped++; continue; }
      await effects.deleteOne({ _id: row._id });
      const compact = { _id: row._id, checksum: row.checksum, invocationId: row.invocationId, planId: row.planId,
        compactReceiptVersion: 1 };
      let error;
      try { await commands.replaceOne({ _id: row._id, checksum: row.checksum, compactReceiptVersion: { $exists: false } }, compact); }
      catch (failure) { error = failure; }
      const saved = await commands.findOne({ _id: row._id });
      if (!isCompactArchiveCommand(saved) || saved.checksum !== row.checksum) {
        if (error) throw error;
        skipped++; continue;
      }
      compacted++;
    }
  } finally { await cursor.close(); }
  return { visited, compacted, skipped, next: visited === limit ? last : null };
}

function createSyncRuleArchiveRetention({ commands, effects, completions, days = 90, limit = 100, now = () => new Date() }) {
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650 || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
    throw new Error('Invalid sync rule archive retention policy');
  }
  let after = null, running = null;
  async function sweep() {
    const result = await compactArchiveBatch({ commands, effects, completions,
      cutoff: new Date(now().getTime() - days * DAY), after, limit });
    after = result.next;
    return result;
  }
  return { sweep() { if (!running) running = sweep().finally(() => { running = null; }); return running; } };
}

module.exports = { isCompactArchiveCommand, recordArchiveCompletion, readCompactedArchive, compactArchiveBatch,
  createSyncRuleArchiveRetention };
