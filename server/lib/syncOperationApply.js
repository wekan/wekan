'use strict';
const { createHash } = require('node:crypto');
const { prepareSyncOperationMutation } = require('./syncOperationMutation');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const fail = code => { throw Object.assign(new Error(code), { code }); };

function syncOperationEffectId(operationId, index) {
  if (typeof operationId !== 'string' || !UUID.test(operationId) ||
      !Number.isSafeInteger(index) || index < 0 || index >= 10000) fail('invalid-sync-operation-adapter');
  return createHash('sha256').update(JSON.stringify([operationId, index])).digest('hex');
}

// Internal journal adapter. The injected card interface must preserve normal
// application validation/hooks; raw Mongo is used only by persistence tests.
// completeEffects must durably finish/reuse the operation's History, activity
// and downstream effects, then return this exact effectId. A matching card is
// never evidence of their completion. No production caller is enabled yet.
async function applySyncOperationStep({ cards, step, operationId, index, assertCurrent, completeEffects }) {
  if (typeof operationId !== 'string' || !UUID.test(operationId) ||
      !Number.isSafeInteger(index) || index < 0 || index >= 10000 ||
      typeof assertCurrent !== 'function' || typeof completeEffects !== 'function' ||
      !['findOne', 'insertOne', 'updateOne'].every(method => typeof cards?.[method] === 'function')) {
    fail('invalid-sync-operation-adapter');
  }
  const mutation = prepareSyncOperationMutation(step);
  const effectId = syncOperationEffectId(operationId, index);
  await assertCurrent();
  let matched = await cards.findOne(mutation.afterSelector);
  const alreadyApplied = !!matched;
  if (!matched) {
    await assertCurrent();
    let writeError;
    try {
      if (mutation.kind === 'create') {
        if (await cards.findOne({ _id: step.cardId })) fail('sync-operation-local-state-changed');
        await assertCurrent();
        await cards.insertOne(mutation.document);
      } else {
        // An empty modifier needs no write, but still needs a confirmed state.
        if (Object.keys(mutation.modifier).length) {
          await cards.updateOne(mutation.beforeSelector, mutation.modifier);
        }
      }
    } catch (error) { writeError = error; }
    await assertCurrent();
    try { matched = await cards.findOne(mutation.afterSelector); }
    catch (error) { throw writeError || error; }
    if (!matched) throw writeError || Object.assign(new Error('sync-operation-write-unconfirmed'), {
      code: 'sync-operation-write-unconfirmed',
    });
  }
  await assertCurrent();
  const acknowledged = await completeEffects({ effectId, operationId, index, step, assertCurrent });
  if (acknowledged !== effectId) fail('sync-operation-effects-unconfirmed');
  await assertCurrent();
  return alreadyApplied ? 'already-applied' : 'applied';
}
module.exports = { applySyncOperationStep, syncOperationEffectId };
