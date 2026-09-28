'use strict';
const { idFor, commandIdentity, matchesEmailJob, matchesEmailCommand,
  terminalJob, terminalCommand } = require('./emailReceiptIdentity');
const DAY = 86400000;
function emailReceiptPolicy(env = process.env) {
  const days = Number(env.EMAIL_RECEIPT_METADATA_DAYS || 30);
  const intervalMs = Number(env.EMAIL_RECEIPT_SWEEP_INTERVAL_MS || 60000);
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650) throw new Error('EMAIL_RECEIPT_METADATA_DAYS must be from 1 to 3650');
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1000 || intervalMs > DAY) throw new Error('EMAIL_RECEIPT_SWEEP_INTERVAL_MS must be from 1000 to 86400000');
  return { days, intervalMs };
}
function compactJob(row) {
  if (Object.hasOwn(row, 'compactReceiptVersion') || !terminalJob(row.state) ||
      ![row.userId, row.eventId].every(value => typeof value === 'string' && value) ||
      row._id !== idFor(row.userId, row.eventId)) return null;
  return { _id: row._id, state: row.state, compactReceiptVersion: 1 };
}
function compactCommand(row) {
  if (Object.hasOwn(row, 'compactReceiptVersion') || !terminalCommand(row.status) ||
      typeof row._id !== 'string' || !/^[A-Za-z0-9_-]{20,64}$/.test(row._id) ||
      ![row.userId, row.actorId].every(value => typeof value === 'string' && value) ||
      !['pause', 'resume', 'retry', 'cancel'].includes(row.action)) return null;
  return { _id: row._id, status: row.status, compactReceiptVersion: 1,
    identityHash: commandIdentity(row.userId, row.action, row.actorId) };
}

// Atomic replacement retains the unique replay key in the SAME collection.
// Deleting rows or moving them to another collection would open a replay race.
// A keyset cursor advances past malformed metadata without deleting it.
async function compactBatch(collection, kind, cutoff, after, limit) {
  const job = kind === 'jobs', field = job ? 'state' : 'status';
  const query = { [field]: { $in: job ? ['sent', 'cancelled'] : ['completed', 'superseded'] },
    compactReceiptVersion: { $exists: false }, _id: { $type: 'string' },
    finishedAt: { $type: 'date', $lte: cutoff },
    ...(after ? { $or: [{ finishedAt: { $gt: after.finishedAt } },
      { finishedAt: after.finishedAt, _id: { $gt: after._id } }] } : {}),
  };
  const identityFields = job ? ['userId', 'eventId'] : ['userId', 'action', 'actorId'];
  const projection = Object.fromEntries(['_id', field, 'finishedAt', ...identityFields].map(key => [key, 1]));
  const cursor = collection.find(query, { projection }).sort({ finishedAt: 1, _id: 1 }).limit(limit).batchSize(1);
  let visited = 0, confirmed = 0, skipped = 0, last = null;
  try {
    for await (const row of cursor) {
      visited++;
      last = { _id: row._id, finishedAt: row.finishedAt };
      const receipt = job ? compactJob(row) : compactCommand(row);
      if (!receipt) { skipped++; continue; }
      const selector = { _id: row._id, [field]: row[field], finishedAt: row.finishedAt,
        compactReceiptVersion: { $exists: false } };
      identityFields.forEach(key => { selector[key] = row[key]; });
      const matches = saved => job ? matchesEmailJob(saved, row.userId, row.eventId) :
        matchesEmailCommand(saved, { requestId: row._id, ...row });
      const readBack = async () => {
        const saved = await collection.findOne({ _id: row._id });
        return saved?.compactReceiptVersion === 1 && saved[field] === receipt[field] && matches(saved);
      };
      let result;
      try { result = await collection.replaceOne(selector, receipt); }
      catch (error) { if (!await readBack()) throw error; confirmed++; continue; }
      if (result.matchedCount === 1) {
        if (!await readBack()) throw new Error('email-receipt-compaction-not-confirmed');
        confirmed++;
      }
    }
  } finally { await cursor.close(); }
  return { visited, confirmed, skipped, next: visited === limit ? last : null };
}
function createEmailReceiptMaintenance({ jobs, commands, days = 30, limit = 100, now = () => new Date() }) {
  if (!Number.isSafeInteger(days) || days < 1 || days > 3650 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new Error('Invalid email receipt retention policy');
  const after = { jobs: null, commands: null };
  let running;
  async function sweep() {
    const cutoff = new Date(now().getTime() - days * DAY);
    const result = {}, errors = [];
    for (const [kind, collection] of Object.entries({ jobs, commands })) {
      try {
        result[kind] = await compactBatch(collection, kind, cutoff, after[kind], limit);
        after[kind] = result[kind].next;
      } catch (error) { errors.push(error); }
    }
    if (errors.length) throw new AggregateError(errors, 'email-receipt-maintenance-failed');
    return result;
  }
  return () => {
    if (!running) running = sweep().finally(() => { running = null; });
    return running;
  };
}
module.exports = { emailReceiptPolicy, compactJob, compactCommand, createEmailReceiptMaintenance };
