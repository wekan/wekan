'use strict';
// List Sync operations that can no longer be replayed.
//
// A durable list Sync operation (server/lib/syncOperationJournal.js) is keyed
// by its list, so while it is pending no other Sync of that list can start
// (server/lib/listSyncApplication.js resumes it first). Its saved plan is
// bound to the list's scope - board, lifetime, settings revision and source -
// and to its actor's full-list write access. When either went stale (the list
// was removed, recreated or reconfigured, or the actor lost access) the replay
// is refused every minute, for ever, and the list's Sync is blocked.
//
// This module records that state ONCE on the operation, lists such operations
// for Admin Panel -> Problems -> Recovery, and carries out an administrator's
// discard: an immutable decision record first, then removal of the saved plan
// and the operation marker. Nothing is applied: steps already applied before
// the operation went stale stay as they are, the rest are never written. The
// caller holds the list lease (server/lib/listSyncLease.js), the same lease a
// replay and a new run take, so a discard cannot interleave with either.
//
// Meteor-free; collections are raw MongoDB collections, injected.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const LIST_LIMIT = 50;
const fail = reason => { throw Object.assign(new Error(`list-sync-stuck-${reason}`), { reason }); };

// Replay refusals that cannot heal by themselves, by their error code.
// scope-changed is permanent (a new revision or lifetime never matches the
// saved one again); access-denied lasts until somebody restores access,
// which is why the live check below decides, not this mark alone.
const STUCK_CODES = {
  'sync-operation-scope-changed': 'scope-changed',
  'invalid-sync-operation-scope': 'scope-changed',
  'sync-completion-scope-changed': 'scope-changed',
  'sync-operation-access-denied': 'access-denied',
  'sync-operation-trigger-unknown': 'trigger-unknown',
  'sync-operation-intent-missing': 'intent-missing',
};
const STUCK_REASONS = [...new Set(Object.values(STUCK_CODES))];
function stuckReason(error) {
  const code = error?.code || error?.error || error?.message;
  return typeof code === 'string' && Object.hasOwn(STUCK_CODES, code) ? STUCK_CODES[code] : null;
}

// Record that the pending operation of a list cannot be replayed. Returns the
// operation when THIS call recorded it for the first time (the caller then
// writes one Recovery event), and null when it was already recorded, so a
// replay that fails every minute does not write a row every minute. A later
// different reason replaces the stored one without another event.
async function markStuckOperation({ operations, listId, operationId, reason, now = () => new Date() }) {
  if (!STUCK_REASONS.includes(reason) || typeof listId !== 'string' || !listId) return null;
  const selector = { _id: listId, state: { $ne: 'preparing' }, ...(operationId ? { operationId } : {}) };
  const first = await operations.updateOne({ ...selector, stuck: { $exists: false } },
    { $set: { stuck: { reason, at: now() } } });
  if (first.modifiedCount === 1) return operations.findOne({ _id: listId });
  await operations.updateOne({ ...selector, 'stuck.reason': { $ne: reason } }, { $set: { 'stuck.reason': reason } });
  return null;
}

// What Problems -> Recovery shows: every operation marked stuck, with its
// CURRENT replayability (`inspect` returns a stuck reason, or null when the
// operation could be replayed now). No card values, sources or credentials.
async function listStuckOperations({ operations, discards, inspect, limit = LIST_LIMIT }) {
  if (typeof inspect !== 'function') fail('invalid');
  const marked = await operations.find({ stuck: { $exists: true } },
    { projection: { _id: 1, operationId: 1, intentId: 1, scope: 1, state: 1, checkpoint: 1, total: 1, stuck: 1,
      startedAt: 1, touchedAt: 1 } }).sort({ 'stuck.at': 1, _id: 1 }).limit(limit + 1).toArray();
  const rows = [];
  for (const row of marked.slice(0, limit)) {
    // A read that failed says nothing about replayability: shown as unknown,
    // and the discard (which checks again) stays refused until it is known.
    let current = null, unknown = false;
    try { current = await inspect(row); } catch (_) { unknown = true; }
    const decided = discards ? !!await discards.findOne({ _id: row.operationId }, { projection: { _id: 1 } }) : false;
    rows.push({ listId: row._id, operationId: row.operationId, boardId: row.scope?.boardId || '',
      state: row.state, applied: Number.isSafeInteger(row.checkpoint) ? row.checkpoint : 0,
      total: Number.isSafeInteger(row.total) ? row.total : 0,
      reason: current || row.stuck?.reason || null, stuckAt: row.stuck?.at || null,
      replayable: unknown ? null : !current, discarding: decided });
  }
  return { rows, truncated: marked.length > limit };
}

// A delete acknowledgement alone does not establish removal: read it back,
// including after an error which may have lost a committed reply.
async function removeAndVerify(remove, remaining) {
  let error;
  try { await remove(); } catch (failure) { error = failure; }
  if (await remaining() !== null) throw error || Object.assign(new Error('list-sync-stuck-cleanup-unconfirmed'),
    { reason: 'cleanup-unconfirmed' });
}

async function removeOperation({ operations, steps, listId, operationId, assertCurrent }) {
  await assertCurrent();
  await removeAndVerify(() => steps.deleteMany({ operationId }),
    () => steps.findOne({ operationId }, { projection: { _id: 1 } }));
  await assertCurrent();
  await removeAndVerify(() => operations.deleteOne({ _id: listId, operationId }),
    () => operations.findOne({ _id: listId, operationId }, { projection: { _id: 1 } }));
  await assertCurrent();
}

// Finish a discard an administrator already decided, if any. A replay and a
// new run call this first, so a discard interrupted after its decision was
// recorded is completed rather than undone by a resumed replay.
async function completeDecidedDiscard({ operations, steps, discards, listId, assertCurrent }) {
  if (typeof assertCurrent !== 'function') fail('lease-required');
  const row = await operations.findOne({ _id: listId }, { projection: { _id: 1, operationId: 1 } });
  if (!row) return null;
  const decided = await discards.findOne({ _id: row.operationId });
  if (!decided || decided.listId !== listId) return null;
  await removeOperation({ operations, steps, listId, operationId: row.operationId, assertCurrent });
  return row.operationId;
}

// The administrator's discard. Refused unless the operation is marked stuck
// AND is still not replayable now. Idempotent: the decision is one record per
// operation (_id = operationId); a retry, or a second administrator, finds it
// and only finishes the removal, or reports already-discarded.
async function discardStuckOperation({ operations, steps, discards, listId, operationId, operator, inspect,
  assertCurrent, now = () => new Date() }) {
  if (typeof listId !== 'string' || !ID.test(listId) || typeof operationId !== 'string' || !UUID.test(operationId) ||
      typeof operator !== 'string' || !operator || operator.length > 200 || typeof inspect !== 'function') fail('invalid');
  if (typeof assertCurrent !== 'function') fail('lease-required');
  await assertCurrent();
  let decided = await discards.findOne({ _id: operationId });
  if (decided && decided.listId !== listId) fail('invalid');
  const row = await operations.findOne({ _id: listId });
  if (!row || row.operationId !== operationId) {
    if (!decided) fail('missing');
    // Removed already; make sure nothing of its plan is left behind.
    await assertCurrent();
    await removeAndVerify(() => steps.deleteMany({ operationId }),
      () => steps.findOne({ operationId }, { projection: { _id: 1 } }));
    return { listId, operationId, boardId: decided.boardId, status: 'already-discarded', decidedNow: false,
      applied: decided.applied, total: decided.total };
  }
  let decidedNow = !decided;
  if (!decided) {
    if (!row.stuck || row.state === 'preparing') fail('not-stuck');
    const reason = await inspect(row);
    if (!reason) fail('replayable');
    await assertCurrent();
    const record = { _id: operationId, version: 1, decision: 'discard', listId, boardId: row.scope?.boardId || null,
      intentId: row.intentId || null, state: row.state,
      applied: Number.isSafeInteger(row.checkpoint) ? row.checkpoint : 0,
      total: Number.isSafeInteger(row.total) ? row.total : 0, reason, operator, decidedAt: now() };
    let error;
    try { await discards.insertOne(record); } catch (failure) { error = failure; }
    decided = await discards.findOne({ _id: operationId });
    if (!decided || decided.listId !== listId) throw error || fail('decision-unconfirmed');
    // Another administrator's decision won the insert: finish it, record none.
    decidedNow = decided.operator === operator && decided.decidedAt?.getTime?.() === record.decidedAt.getTime();
  }
  await removeOperation({ operations, steps, listId, operationId, assertCurrent });
  return { listId, operationId, boardId: decided.boardId, status: 'discarded', decidedNow,
    applied: decided.applied, total: decided.total };
}

module.exports = { stuckReason, markStuckOperation, listStuckOperations, completeDecidedDiscard,
  discardStuckOperation, STUCK_REASONS, STUCK_CODES };
