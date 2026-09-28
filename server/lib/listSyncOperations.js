import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Lists from '/models/lists';
import Boards from '/models/boards';
import { ensureIndex } from '/server/lib/mongoStartup';
import { withListSyncLease } from '/server/lib/listSyncLease';
const { runSyncOperation } = require('/server/lib/syncOperationJournal');
const { createSyncOperationScopeGuard } = require('/server/lib/syncOperationScope');

// Private durable storage. No publications, client writes or TTL: incomplete
// plans and immutable completion receipts must survive restarts and deletion
// of their list. Scope guards prevent those records being reused by a new list.
const operations = new Mongo.Collection('listSyncOperations');
const steps = new Mongo.Collection('listSyncOperationSteps');
const completions = new Mongo.Collection('listSyncOperationCompletions');
for (const collection of [operations, steps, completions]) {
  collection.deny({ insert: () => true, update: () => true, remove: () => true });
}
Meteor.startup(async () => {
  await ensureIndex(operations, { 'scope.boardId': 1, 'scope.listId': 1, 'scope.incarnation': 1 });
  await ensureIndex(operations, { state: 1, touchedAt: 1 });
  await ensureIndex(steps, { operationId: 1, index: 1 }, { unique: true });
  await ensureIndex(completions, { 'scope.boardId': 1, 'scope.listId': 1, 'scope.incarnation': 1 });
});

// Internal entry point only. Manual/cron Sync does not call this yet. The
// caller must retain intentId and provide fresh authorization/mapping checks,
// validated application/effect adapters and a stable versioned list scope.
export async function runStoredListSyncOperation({ scope, assertAccess, ...operation }) {
  const frozenScope = { ...scope };
  let assertLease;
  // Validate selectors and the access callback before acquiring any lease.
  const assertCurrent = createSyncOperationScopeGuard({ lists: Lists, boards: Boards,
    scope: frozenScope, assertCurrent: () => assertLease(), assertAccess });
  return withListSyncLease(frozenScope.listId, async lease => {
    assertLease = lease.assertCurrent;
    return runSyncOperation({ ...operation, scope: frozenScope, assertCurrent,
      operations: operations.rawCollection(), steps: steps.rawCollection(), completions: completions.rawCollection() });
  });
}
