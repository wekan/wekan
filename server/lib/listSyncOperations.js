import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Lists from '/models/lists';
import Boards from '/models/boards';
import { ensureIndex } from '/server/lib/mongoStartup';
import { withListSyncLease } from '/server/lib/listSyncLease';
const { runSyncOperation } = require('/server/lib/syncOperationJournal');
const { intentIdentity, ensureSyncOperationIntent, readSyncOperationIntent, loadSyncOperationIntent } = require('/server/lib/syncOperationIntent');
const { createSyncOperationScopeGuard } = require('/server/lib/syncOperationScope');
const { reuseWithinEvaluation } = require('/server/lib/syncGuardWindow');

// Private durable storage. No publications, client writes or TTL: incomplete
// plans and immutable completion receipts must survive restarts and deletion
// of their list. Scope guards prevent those records being reused by a new list.
const intents = new Mongo.Collection('listSyncOperationIntents');
const operations = new Mongo.Collection('listSyncOperations');
const steps = new Mongo.Collection('listSyncOperationSteps');
const completions = new Mongo.Collection('listSyncOperationCompletions');
for (const collection of [intents, operations, steps, completions]) {
  collection.deny({ insert: () => true, update: () => true, remove: () => true });
}
Meteor.startup(async () => {
  await ensureIndex(intents, { 'scope.boardId': 1, 'scope.listId': 1, actorId: 1 });
  await ensureIndex(operations, { intentId: 1 });
  await ensureIndex(operations, { 'scope.boardId': 1, 'scope.listId': 1, 'scope.incarnation': 1 });
  await ensureIndex(operations, { state: 1, touchedAt: 1 });
  await ensureIndex(steps, { operationId: 1, index: 1 }, { unique: true });
  await ensureIndex(completions, { 'scope.boardId': 1, 'scope.listId': 1, 'scope.incarnation': 1 });
});

// Manual and scheduled Sync call this through server/lib/listSyncApplication.js
// when the durable path applies. The caller retains intentId and provides
// fresh authorization/mapping checks, validated application/effect adapters
// and a stable versioned list scope. `lease`, when given, is the list lease the
// caller already holds (with its own checks folded into assertCurrent); the
// lease is not taken twice.
export async function runStoredListSyncOperation({ scope, actorId, assertAccess, trigger, lease: held, ...operation }) {
  const identity = intentIdentity({ intentId: operation.intentId, actorId, scope, trigger });
  const frozenScope = identity.scope;
  let assertLease;
  if (typeof assertAccess !== 'function') throw new Error('sync-operation-access-required');
  const assertScope = createSyncOperationScopeGuard({ lists: Lists, boards: Boards,
    scope: frozenScope, assertCurrent: () => assertLease(),
    assertAccess: current => assertAccess({ ...current, userId: identity.actorId }) });
  const withLease = held
    ? work => { if (typeof held.assertCurrent !== 'function') throw new Error('sync-operation-lease-required'); return work(held); }
    : work => withListSyncLease(frozenScope.listId, work);
  return withLease(async lease => {
    assertLease = lease.assertCurrent;
    const input = { intents: intents.rawCollection(), intentId: identity._id, actorId: identity.actorId, scope: frozenScope,
      ...(trigger === undefined ? {} : { trigger }) };
    await ensureSyncOperationIntent({ ...input, operations: operations.rawCollection(),
      completions: completions.rawCollection(), assertCurrent: assertScope });
    // The base of every stored-stage guard; see syncGuardWindow.js.
    const assertCurrent = reuseWithinEvaluation(async () => {
      await assertScope();
      await readSyncOperationIntent(input);
      await assertLease();
    });
    const actorContext = context => ({ ...context, userId: identity.actorId });
    return runSyncOperation({ ...operation, scope: frozenScope, assertCurrent,
      build: context => operation.build(actorContext(context)),
      apply: (step, context) => operation.apply(step, actorContext(context)),
      ...(operation.prepareEffects ? { prepareEffects: (step, context) => operation.prepareEffects(step, actorContext(context)) } : {}),
      ...(operation.validateEffects ? { validateEffects: (effects, step, context) => operation.validateEffects(effects, step, actorContext(context)) } : {}),
      operations: operations.rawCollection(), steps: steps.rawCollection(), completions: completions.rawCollection() });
  });
}

// The unfinished operation of a list, if any: what a new run must finish first,
// and what replay after a restart looks for.
export async function readPendingListSyncOperation(listId) {
  const row = await operations.rawCollection().findOne({ _id: listId });
  if (!row) return null;
  const intent = await loadSyncOperationIntent({ intents: intents.rawCollection(), intentId: row.intentId });
  return { operationId: row.operationId, intentId: row.intentId, state: row.state, scope: row.scope,
    actorId: intent.actorId, trigger: intent.trigger ?? null };
}

// An operation still PREPARING has written nothing (syncOperationJournal.js):
// its plan was never completed, and a replay has no source data to rebuild it
// from. Discard exactly that operation; its intent stays as evidence. The
// caller holds the list lease.
export async function discardPreparingListSyncOperation({ listId, operationId, assertCurrent }) {
  if (typeof assertCurrent !== 'function') throw new Error('sync-operation-lease-required');
  await assertCurrent();
  const raw = operations.rawCollection();
  try { await raw.deleteOne({ _id: listId, operationId, state: 'preparing' }); } catch (_) { /* read back below */ }
  if (await raw.findOne({ _id: listId, operationId }, { projection: { _id: 1 } })) {
    throw new Error('sync-operation-discard-unconfirmed');
  }
  await steps.rawCollection().deleteMany({ operationId });
  await assertCurrent();
  return true;
}

// Unfinished operations, oldest first (index { state: 1, touchedAt: 1 }).
export async function listPendingListSyncOperations(limit = 100) {
  return operations.rawCollection().find({ state: { $in: ['preparing', 'applying', 'completed', 'cleaning'] } },
    { projection: { _id: 1 } }).sort({ touchedAt: 1 }).limit(limit).toArray();
}
