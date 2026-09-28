'use strict';
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const { validateSyncOperationScope } = require('./syncOperationScope');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const fail = code => { throw Object.assign(new Error(code), { code }); };
function intentIdentity({ intentId, actorId, scope }) {
  if (typeof intentId !== 'string' || !UUID.test(intentId) || typeof actorId !== 'string' || !actorId) fail('invalid-sync-operation-intent');
  return { _id: intentId, actorId, scope: validateSyncOperationScope(scope), version: 1 };
}
function verifyIntent(row, identity) {
  if (!row || Object.keys(row).sort().join(',') !== '_id,actorId,createdAt,scope,version' ||
      !(row.createdAt instanceof Date) || !Number.isFinite(row.createdAt.getTime())) fail('sync-operation-intent-unconfirmed');
  const { createdAt, ...saved } = row;
  if (canonical(saved) !== canonical(identity)) fail('sync-operation-intent-conflict');
  return row;
}
async function readSyncOperationIntent({ intents, ...input }) {
  const identity = intentIdentity(input);
  return verifyIntent(await intents.findOne({ _id: identity._id }), identity);
}
async function ensureSyncOperationIntent({ intents, operations, completions, assertCurrent, now = () => new Date(), ...input }) {
  const identity = intentIdentity(input);
  if (typeof assertCurrent !== 'function') fail('sync-operation-access-required');
  await assertCurrent();
  let saved = await intents.findOne({ _id: identity._id }), error;
  if (!saved) {
    // An actor cannot be reconstructed from an old journal or completion.
    // Missing intent evidence must not authorize a new actor on replay.
    if (await operations.findOne({ intentId: identity._id }) || await completions.findOne({ _id: identity._id })) fail('sync-operation-intent-missing');
    const row = { ...identity, createdAt: now() };
    verifyIntent(row, identity);
    await assertCurrent();
    try { await intents.insertOne(row); } catch (failure) { error = failure; }
    await assertCurrent();
    try { saved = await intents.findOne({ _id: identity._id }); } catch (failure) { throw error || failure; }
  }
  if (!saved) throw error || new Error('sync-operation-intent-unconfirmed');
  verifyIntent(saved, identity);
  await assertCurrent();
  return saved;
}
module.exports = { intentIdentity, ensureSyncOperationIntent, readSyncOperationIntent };
