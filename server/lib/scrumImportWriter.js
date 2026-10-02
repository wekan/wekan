// Dependency-injected so interrupted writes can be exercised without Meteor.
// The checkpoint names its writer (`owner`) and holds a lease it renews as it
// goes (2026-10-02): an interrupted import can then be finished online
// (server/lib/scrumImportRecovery.js) once its lease has run out, and a writer
// that was only paused finds itself fenced out at its next checkpoint update -
// every update names the owner. Steps are idempotent, so the one write such a
// writer may still land is the same write the recovery makes.
const { randomUUID } = require('node:crypto');
const IMPORT_LEASE_MS = 2 * 60 * 1000;
const leaseFrom = now => new Date(now().getTime() + IMPORT_LEASE_MS);
async function applyImportStep(step, collections, equals) {
  const collection = collections[step.collection];
  if (!collection) throw new Error('Invalid Scrum import collection');
  if (step.kind === 'insert') {
    try { await collection.insertAsync(step.after); }
    catch (error) {
      // An acknowledged insert may have happened before the caller stopped.
      // Never accept a same-ID document containing different data.
      if (error.code !== 11000 || !equals(await collection.findOneAsync(step.after._id), step.after)) throw error;
    }
    return;
  }
  if (step.kind !== 'update') throw new Error('Invalid Scrum import step');
  const selector = { _id: step.id, ...(step.collection === 'boards' ? {} : { boardId: step.boardId }) };
  for (const key of Object.keys(step.after)) {
    selector[key] = Object.hasOwn(step.before, key)
      ? { $eq: step.before[key], $exists: true } : { $exists: false };
  }
  if (await collection.direct.updateAsync(selector, { $set: step.after })) return;
  const current = await collection.findOneAsync(step.id);
  if (!current || (step.collection !== 'boards' && current.boardId !== step.boardId) ||
      !Object.entries(step.after).every(([key, value]) => Object.hasOwn(current, key) && equals(current[key], value))) {
    throw new Error('An imported item changed or no longer belongs to the destination board');
  }
}

async function writeImportPlan({ boardId, operationId, userId, steps, pending, journal, collections, equals,
  owner = randomUUID(), now = () => new Date() }) {
  // No destination writes precede the checkpoint. A preparation failure leaves
  // a clearly incomplete plan, never a falsely ready recovery operation.
  await pending.insertAsync({ _id: boardId, operationId, userId, owner, leaseUntil: leaseFrom(now), state: 'preparing',
    total: steps.length, next: 0, createdAt: now() });
  const identity = { _id: boardId, operationId, owner };
  for (let index = 0; index < steps.length; index++) {
    await journal.insertAsync({ _id: `${operationId}:${index}`, boardId, operationId, index, step: steps[index] });
    if (index % 200 === 199 && !await pending.updateAsync({ ...identity, state: 'preparing' },
      { $set: { leaseUntil: leaseFrom(now) } })) throw new Error('Scrum import checkpoint changed');
  }
  if (!await pending.updateAsync({ ...identity, state: 'preparing' }, { $set: { state: 'applying', leaseUntil: leaseFrom(now) } })) {
    throw new Error('Scrum import checkpoint changed');
  }
  for (let index = 0; index < steps.length; index++) {
    await applyImportStep(steps[index], collections, equals);
    if (!await pending.updateAsync({ ...identity, state: 'applying', next: index },
      { $set: { next: index + 1, leaseUntil: leaseFrom(now) } })) {
      throw new Error('Scrum import checkpoint changed');
    }
  }
  if (!await pending.updateAsync({ ...identity, state: 'applying', next: steps.length }, { $set: { state: 'applied' } })) {
    throw new Error('Scrum import checkpoint changed');
  }
  return identity;
}

// Keep the board guarded until private plan removal is acknowledged. The
// offline recovery command understands this same cleaning state, even when
// only part of the journal remains after an interrupted deletion.
async function finishImportPlan({ identity, total, pending, journal, clearMarkers }) {
  await clearMarkers();
  if (!await pending.updateAsync({ ...identity, state: 'applied', next: total },
    { $set: { state: 'cleaning' } })) throw new Error('Scrum import checkpoint changed before cleanup');
  await journal.removeAsync({ boardId: identity._id, operationId: identity.operationId });
  if (!await pending.removeAsync({ ...identity, state: 'cleaning', next: total })) {
    throw new Error('Scrum import checkpoint changed before completion');
  }
}

module.exports = { applyImportStep, writeImportPlan, finishImportPlan, IMPORT_LEASE_MS };
