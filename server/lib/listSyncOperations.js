import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Lists from '/models/lists';
import Boards from '/models/boards';
import { ensureIndex } from '/server/lib/mongoStartup';
import { withListSyncLease } from '/server/lib/listSyncLease';
const { runSyncOperation } = require('/server/lib/syncOperationJournal');
const { intentIdentity, ensureSyncOperationIntent, readSyncOperationIntent } = require('/server/lib/syncOperationIntent');
const { createSyncOperationScopeGuard } = require('/server/lib/syncOperationScope');

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

// Internal entry point only. Manual/cron Sync does not call this yet. The
// caller must retain intentId and provide fresh authorization/mapping checks,
// validated application/effect adapters and a stable versioned list scope.
export async function runStoredListSyncOperation({ scope, actorId, assertAccess, ...operation }) {
  const identity = intentIdentity({ intentId: operation.intentId, actorId, scope });
  const frozenScope = identity.scope;
  let assertLease;
  if (typeof assertAccess !== 'function') throw new Error('sync-operation-access-required');
  const assertScope = createSyncOperationScopeGuard({ lists: Lists, boards: Boards,
    scope: frozenScope, assertCurrent: () => assertLease(),
    assertAccess: current => assertAccess({ ...current, userId: identity.actorId }) });
  return withListSyncLease(frozenScope.listId, async lease => {
    assertLease = lease.assertCurrent;
    const input = { intents: intents.rawCollection(), intentId: identity._id, actorId: identity.actorId, scope: frozenScope };
    await ensureSyncOperationIntent({ ...input, operations: operations.rawCollection(),
      completions: completions.rawCollection(), assertCurrent: assertScope });
    const assertCurrent = async () => {
      await assertScope();
      await readSyncOperationIntent(input);
      await assertLease();
    };
    const actorContext = context => ({ ...context, userId: identity.actorId });
    return runSyncOperation({ ...operation, scope: frozenScope, assertCurrent,
      build: context => operation.build(actorContext(context)),
      apply: (step, context) => operation.apply(step, actorContext(context)),
      ...(operation.prepareEffects ? { prepareEffects: (step, context) => operation.prepareEffects(step, actorContext(context)) } : {}),
      ...(operation.validateEffects ? { validateEffects: (effects, step, context) => operation.validateEffects(effects, step, actorContext(context)) } : {}),
      operations: operations.rawCollection(), steps: steps.rawCollection(), completions: completions.rawCollection() });
  });
}
