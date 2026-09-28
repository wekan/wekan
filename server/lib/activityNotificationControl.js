'use strict';
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const { withSyncLease } = require('./syncLease');
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const request = value => typeof value === 'string' && /^[A-Za-z0-9_-]{20,64}$/.test(value);
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
function validateControl(row, intentId) {
  if (!row) return { revision: 0, paused: false };
  const fields = row.cancelled === true ? '_id,actorId,cancelled,changedAt,paused,requestId,revision' : '_id,actorId,changedAt,paused,requestId,revision';
  if ((Object.hasOwn(row, 'cancelled') && (row.cancelled !== true || row.paused !== true)) || row._id !== intentId || !Number.isSafeInteger(row.revision) || row.revision < 1 ||
      typeof row.paused !== 'boolean' || !request(row.requestId) || !text(row.actorId) ||
      !(row.changedAt instanceof Date) || !Number.isFinite(+row.changedAt) ||
      Object.keys(row).sort().join(',') !== fields) {
    throw new Error('activity-notification-control-invalid');
  }
  return row;
}
async function readActivityNotificationControl({ controls, intentId }) {
  if (!hash(intentId)) throw new Error('activity-notification-control-invalid');
  return validateControl(await controls.findOne({ _id: intentId }), intentId);
}
async function assertActivityNotificationUnpaused(options) {
  const state = await readActivityNotificationControl(options);
  if (state.cancelled) throw new Error('activity-notification-cancelled');
  if (state.paused) throw new Error('activity-notification-paused');
}
// A client must submit the revision it actually saw, not a server-rebased one.
// Each successful mutation advances it exactly once. Thus a delayed old request
// cannot undo a newer operator decision, without an unbounded command journal.
// Keep this row permanently, including resumed rows: deleting it would reset
// the revision and let a former revision-zero pause become valid again.
async function mutateActivityNotificationControl({ controls, intents, leases, intentId, paused, cancelled, expectedRevision,
  requestId, actorId, assertAdmin, now = () => new Date(), leaseOptions = {} }) {
  if (!hash(intentId) || typeof paused !== 'boolean' || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 ||
      expectedRevision >= Number.MAX_SAFE_INTEGER || !request(requestId) || !text(actorId) || typeof assertAdmin !== 'function') {
    throw new Error('activity-notification-control-invalid');
  }
  await assertAdmin();
  return withSyncLease(leases, intentId, async ({ assertCurrent }) => {
    const guard = async () => { await assertCurrent(); await assertAdmin(); };
    await guard();
    const current = await readActivityNotificationControl({ controls, intentId });
    if (current.revision === expectedRevision + 1 && current.requestId === requestId &&
        current.actorId === actorId && current.paused === paused && !!current.cancelled === cancelled) {
      await guard();
      return { revision: current.revision, paused: current.paused, ...(cancelled ? { cancelled: true } : {}) };
    }
    if (current.cancelled) throw new Error('activity-notification-cancelled');
    if (current.revision !== expectedRevision || current.requestId === requestId) {
      throw new Error('activity-notification-control-conflict');
    }
    const intent = await intents.findOne({ _id: intentId }, { projection: { _id: 1, state: 1 } });
    if (!intent || intent.state !== 'pending') throw new Error('activity-notification-control-not-pending');
    const next = { _id: intentId, revision: expectedRevision + 1, paused, requestId, actorId, changedAt: now(), ...(cancelled ? { cancelled: true } : {}) };
    validateControl(next, intentId);
    await guard();
    let failure;
    try {
      if (expectedRevision === 0) await controls.insertOne(next);
      else await controls.replaceOne({ _id: intentId, revision: expectedRevision }, next);
    } catch (error) { failure = error; }
    const saved = await controls.findOne({ _id: intentId });
    if (!saved || canonical(saved) !== canonical(next)) {
      throw failure || new Error('activity-notification-control-unconfirmed');
    }
    await guard();
    return { revision: next.revision, paused: next.paused, ...(cancelled ? { cancelled: true } : {}) };
  }, { ...leaseOptions, now });
}
function controlActivityNotification(options) {
  return mutateActivityNotificationControl({ ...options, cancelled: false });
}
function cancelActivityNotification(options) {
  return mutateActivityNotificationControl({ ...options, paused: true, cancelled: true });
}
module.exports = { cancelActivityNotification, controlActivityNotification, readActivityNotificationControl, assertActivityNotificationUnpaused };
