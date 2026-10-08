// Admin Panel -> Problems -> Recovery: list Sync operations that can no longer
// be replayed, and an administrator's discard (server/lib/listSyncStuck.js).
// Instance administrators only, checked before and after every read and write.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Boards from '/models/boards';
import { withListSyncLease } from '/server/lib/listSyncLease';
import { listStuckListSyncOperations, discardStuckListSyncOperation } from '/server/lib/listSyncOperations';
import { inspectListSyncOperation } from '/server/lib/listSyncApplication';
import { recordRecoveryAudit } from '/server/lib/recoveryAudit';
import RecoveryEvents from '/models/recoveryEvents';

const ListId = Match.Where(value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value));
const OperationId = Match.Where(value => typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value));
const REFUSALS = ['missing', 'not-stuck', 'replayable', 'invalid'];

async function assertAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1, username: 1 } });
  if (!user?.isAdmin || user.loginDisabled) throw new Meteor.Error('not-authorized');
  return user;
}
// Known refusals keep their reason so the page can say why; anything else is
// reported without its text.
function translate(error) {
  if (error?.error === 'not-authorized') return error;
  if (REFUSALS.includes(error?.reason) && error.message === `list-sync-stuck-${error.reason}`) {
    return new Meteor.Error(`list-sync-stuck-${error.reason}`);
  }
  if (error?.error === 'sync-busy' || error?.error === 'sync-lease-lost') return new Meteor.Error('list-sync-stuck-busy');
  return new Meteor.Error('list-sync-stuck-failed');
}

Meteor.methods({
  async listSyncStuckOperations() {
    await assertAdmin(this.userId);
    let result;
    try { result = await listStuckListSyncOperations({ inspect: inspectListSyncOperation }); }
    catch (error) { throw translate(error); }
    await assertAdmin(this.userId);
    return result;
  },
  async listSyncStuckDiscard({ listId, operationId }) {
    check(listId, ListId);
    check(operationId, OperationId);
    const admin = await assertAdmin(this.userId);
    let result;
    try {
      // The list lease: the same one a replay and a new run take, so the
      // discard never interleaves with them, on this server or another.
      result = await withListSyncLease(listId, async ({ assertCurrent }) =>
        discardStuckListSyncOperation({ listId, operationId, operator: admin.username || admin._id,
          inspect: inspectListSyncOperation,
          assertCurrent: async () => { await assertCurrent(); await assertAdmin(this.userId); } }));
    } catch (error) { throw translate(error); }
    // One audit row per decision; a retry that only finished the removal adds none.
    if (result.decidedNow) {
      const board = result.boardId ? await Boards.findOneAsync(result.boardId, { fields: { title: 1 } }) : null;
      await recordRecoveryAudit({ type: RecoveryEvents.types.LIST_SYNC_OPERATION_DISCARDED, user: admin,
        connection: this.connection, done: true, deletedData: true, boards: board ? [board] : [],
        detail: `Discarded the saved List Sync operation ${operationId} of list ${listId}; ` +
          `${result.applied} of ${result.total} steps had been applied, the rest were not.` });
    }
    return result;
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'listSyncStuckOperations', connectionId: () => true }, 10, 10000);
DDPRateLimiter.addRule({ type: 'method', name: 'listSyncStuckDiscard', connectionId: () => true }, 10, 10000);
