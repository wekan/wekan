import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import ChangeHistory from '/models/changeHistory';
import ScrumSprints from '/models/scrumSprints';
import RecoveryEvents from '/models/recoveryEvents';
import ScrumHistoryPending, { ScrumHistoryCompletions } from '/server/lib/scrumHistoryPending';
import { applyScrumHistory } from '/server/lib/scrumHistory';

// A Scrum History undo whose retries keep meeting the same conflict used to
// block the board's Scrum edits for good (server/lib/scrumHistoryRecovery.js).
// The retry now marks its checkpoint, and a board administrator - not an
// ordinary member - resolves it through the server methods.
describe('Scrum History checkpoint recovery', function () {
  this.timeout(30000);
  it('records the lasting failure and lets only a board administrator discard it, once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const adminId = Random.id(), memberId = Random.id(), boardId = Random.id();
    const as = userId => {
      const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      return {
        actor: fn => DDP._CurrentMethodInvocation.withValue(context, fn),
        invoke: (method, ...args) => DDP._CurrentMethodInvocation.withValue(context,
          () => Meteor.server.method_handlers[method].apply(context, args)),
      };
    };
    const admin = as(adminId), member = as(memberId);
    try {
      for (const id of [adminId, memberId]) await Meteor.users.rawCollection().insertOne({ _id: id, username: `recovery-${id}`, profile: {} });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Stopped undo', permission: 'private', archived: false,
        members: [{ userId: adminId, isAdmin: true, isActive: true }, { userId: memberId, isAdmin: false, isActive: true }] });
      const created = await admin.invoke('scrum.saveSprint', boardId, null, { name: 'Sprint 1' });
      const row = await ChangeHistory.findOneAsync({ boardId, entityType: 'scrum' }, { sort: { createdAt: -1 } });
      // The undo deletes the sprint - but somebody replaces it with another
      // lifetime of the same record first, so every retry meets a conflict.
      const originalRemove = ScrumSprints.removeAsync;
      ScrumSprints.removeAsync = async function (selector, ...args) {
        await ScrumSprints.rawCollection().updateOne({ _id: created._id }, { $set: { incarnation: 'someone-else' } });
        return originalRemove.call(this, selector, ...args);
      };
      try { await assert.rejects(admin.actor(() => applyScrumHistory(row, row.previousContent, 'undo')), /scrum-conflict/); }
      finally { ScrumSprints.removeAsync = originalRemove; }
      await assert.rejects(admin.actor(() => applyScrumHistory(row, row.previousContent, 'undo')), /scrum-conflict/);
      const checkpoint = await ScrumHistoryPending.findOneAsync(boardId);
      assert.equal(checkpoint.lastFailure.error, 'scrum-conflict', 'the retry marked its checkpoint');
      await assert.rejects(admin.invoke('scrum.saveSprint', boardId, null, { name: 'Blocked' }), /scrum-history-pending/);

      // An ordinary member sees it is stuck, not what it holds, and cannot resolve it.
      const seen = await member.invoke('scrum.inspectHistoryCheckpoint', boardId);
      assert.equal(seen.stuck, true); assert.equal(seen.canResolve, false); assert.equal(seen.targets, undefined);
      for (const action of ['rollback', 'discard']) {
        await assert.rejects(member.invoke('scrum.resolveHistoryCheckpoint', boardId, seen.key, action), /not-authorized/);
      }
      assert.ok(await ScrumHistoryPending.findOneAsync(boardId));

      const report = await admin.invoke('scrum.inspectHistoryCheckpoint', boardId);
      assert.equal(report.canResolve, true); assert.equal(report.canRollback, false, 'the other lifetime is never overwritten');
      await assert.rejects(admin.invoke('scrum.resolveHistoryCheckpoint', boardId, report.key, 'rollback'), /scrum-history-recovery/);
      const result = await admin.invoke('scrum.resolveHistoryCheckpoint', boardId, report.key, 'discard');
      assert.equal(result.state, 'discarded');
      assert.equal(await ScrumHistoryPending.findOneAsync(boardId), undefined);
      assert.equal((await ScrumSprints.findOneAsync(created._id)).incarnation, 'someone-else');
      const events = await RecoveryEvents.find({ type: 'scrum-history-checkpoint-resolved', boardIds: boardId }).fetchAsync();
      assert.deepEqual(events.map(event => event.done), [false, true], 'the refused rollback and the discard');
      // Scrum edits work again; a repeated discard is a no-op.
      await admin.invoke('scrum.saveSprint', boardId, null, { name: 'Unblocked' });
      assert.equal((await admin.invoke('scrum.resolveHistoryCheckpoint', boardId, report.key, 'discard')).changed, false);
    } finally {
      await ScrumSprints.rawCollection().deleteMany({ boardId });
      await ScrumHistoryPending.rawCollection().deleteMany({ _id: boardId });
      await ScrumHistoryCompletions.rawCollection().deleteMany({ boardId });
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await RecoveryEvents.rawCollection().deleteMany({ boardIds: boardId });
      await Boards.rawCollection().deleteOne({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [adminId, memberId] } });
    }
  });
});
