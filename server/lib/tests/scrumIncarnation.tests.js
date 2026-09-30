import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import ChangeHistory from '/models/changeHistory';
import ScrumSprints from '/models/scrumSprints';
import ScrumHistoryPending, { ScrumHistoryCompletions } from '/server/lib/scrumHistoryPending';
import { applyScrumHistory } from '/server/lib/scrumHistory';

// Incarnations (maintainer decision of 2026-09-30): a Scrum record deleted and
// recreated under the same _id, with the same values and revision, is not the
// record a Scrum History operation planned against, and a retry must not
// delete it. Before incarnations, the retry below deleted the other record.
describe('Scrum record incarnations', function () {
  this.timeout(20000);
  it('gives each lifetime its own incarnation and refuses a retry against another lifetime', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId = Random.id(), boardId = Random.id();
    const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const actor = fn => DDP._CurrentMethodInvocation.withValue(context, fn);
    const invoke = (method, ...args) => actor(() => Meteor.server.method_handlers[method].apply(context, args));
    const originalRemove = ScrumSprints.removeAsync;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: userId, username: `incarnation-${userId}`, profile: {} });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Incarnations', permission: 'private', archived: false,
        members: [{ userId, isAdmin: true, isActive: true }] });
      const created = await invoke('scrum.saveSprint', boardId, null, { name: 'Sprint 1' });
      const first = await ScrumSprints.findOneAsync(created._id);
      assert.ok(typeof first.incarnation === 'string' && first.incarnation, 'a created record has an incarnation');
      const row = await ChangeHistory.findOneAsync({ boardId, entityType: 'scrum' }, { sort: { createdAt: -1 } });
      assert.equal(JSON.stringify(row.newContent).includes('incarnation'), false, 'History content never carries it');

      // Undo deletes it; redo re-creates it in a NEW lifetime.
      await actor(() => applyScrumHistory(row, row.previousContent, 'undo'));
      assert.equal(await ScrumSprints.findOneAsync(created._id), undefined);
      const undone = await ChangeHistory.findOneAsync(row._id);
      await actor(() => applyScrumHistory(undone, undone.newContent, 'redo'));
      const second = await ScrumSprints.findOneAsync(created._id);
      assert.ok(second.incarnation && second.incarnation !== first.incarnation, 'a recreated record is a new lifetime');

      // Undo again, but somebody replaces the sprint with an identical record of
      // another lifetime just before the delete. The conditional delete misses...
      ScrumSprints.removeAsync = async function (selector, ...args) {
        await ScrumSprints.rawCollection().updateOne({ _id: created._id }, { $set: { incarnation: 'someone-else' } });
        return originalRemove.call(this, selector, ...args);
      };
      const redone = await ChangeHistory.findOneAsync(row._id);
      await assert.rejects(actor(() => applyScrumHistory(redone, redone.previousContent, 'undo')), /scrum-conflict/);
      ScrumSprints.removeAsync = originalRemove;
      assert.ok(await ScrumHistoryPending.findOneAsync(boardId), 'the checkpoint is retained');
      // ...and the RETRY, which sees the same values and revision, must refuse too
      // (negative): the checkpoint planned against the second lifetime.
      await assert.rejects(actor(() => applyScrumHistory(redone, redone.previousContent, 'undo')), /scrum-conflict/);
      const survivor = await ScrumSprints.findOneAsync(created._id);
      assert.equal(survivor?.incarnation, 'someone-else', 'the other lifetime is not deleted');
    } finally {
      ScrumSprints.removeAsync = originalRemove;
      await ScrumSprints.rawCollection().deleteMany({ boardId });
      await ScrumHistoryPending.rawCollection().deleteMany({ _id: boardId });
      await ScrumHistoryCompletions.rawCollection().deleteMany({ boardId });
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteOne({ _id: boardId });
      await Meteor.users.rawCollection().deleteOne({ _id: userId });
    }
  });
});
