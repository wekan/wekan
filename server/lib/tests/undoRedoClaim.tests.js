import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import ChangeHistory from '/models/changeHistory';

// Two undos (or redos) that pick the same History row - two tabs, a repeating
// key - used to both apply it, both flip its flag and both record a reversal.
// The row is now claimed before it is applied, so the race applies it once.
describe('Undo and redo claim the row before applying it', function () {
  this.timeout(15000);
  it('applies a raced undo and redo once, and gives back a claim that applied nothing', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId = Random.id(), boardId = Random.id(), cardId = Random.id(), listId = Random.id(), swimlaneId = Random.id();
    const context = { userId, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const invoke = (method, ...args) => DDP._CurrentMethodInvocation.withValue(context,
      () => Meteor.server.method_handlers[method].apply(context, args));
    try {
      await Meteor.users.rawCollection().insertOne({ _id: userId, username: `claim-${userId}`, profile: {} });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Claim', permission: 'private', archived: false,
        members: [{ userId, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: swimlaneId, boardId, title: 'Lane', type: 'swimlane', archived: false, sort: 0 });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, swimlaneId, title: 'List', archived: false, sort: 0 });
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, swimlaneId, title: 'after', archived: false, sort: 0 });
      const rowId = await ChangeHistory.record({ boardId, cardId, listId, swimlaneId, userId, entityType: 'card',
        entityId: cardId, group: 'title', changeType: 'edited',
        previousContent: { field: 'title', value: 'before' }, newContent: { field: 'title', value: 'after' } });
      const reversals = () => ChangeHistory.find({ restoredFromId: rowId, changeType: 'restored' }).countAsync();

      const undos = await Promise.all(Array.from({ length: 4 }, () => invoke('changeHistory.undoLast', boardId)));
      assert.equal(undos.filter(result => result.undone).length, 1, 'exactly one undo wins');
      assert.ok(undos.filter(result => !result.undone).every(result => !result.reason || result.reason === 'conflict'));
      assert.equal((await Cards.findOneAsync(cardId)).title, 'before');
      assert.equal(await reversals(), 1, 'one reversal is recorded, not one per caller');

      const redos = await Promise.all(Array.from({ length: 4 }, () => invoke('changeHistory.redoLast', boardId)));
      assert.equal(redos.filter(result => result.redone).length, 1, 'exactly one redo wins');
      assert.equal((await Cards.findOneAsync(cardId)).title, 'after');
      assert.equal(await reversals(), 2);
      assert.equal((await ChangeHistory.findOneAsync(rowId)).undone, false);

      // Negative: a newest row whose content cannot be applied is claimed,
      // applies nothing, and is given back - not left marked undone.
      const brokenId = await ChangeHistory.record({ boardId, cardId, listId, swimlaneId, userId, entityType: 'card',
        entityId: cardId, group: 'title', changeType: 'edited',
        previousContent: { field: 'title' }, newContent: { field: 'title', value: 'after' } });
      assert.deepEqual(await invoke('changeHistory.undoLast', boardId), { undone: false, reason: 'not-applicable' });
      let row = await ChangeHistory.findOneAsync(brokenId);
      assert.equal(row.undone, false);
      assert.equal(row.undoneAt, null);
      await ChangeHistory.rawCollection().deleteOne({ _id: brokenId });
      // Negative: an apply that THROWS (the card is gone, so History may no
      // longer edit it) also gives the claim back before the error surfaces.
      await Cards.rawCollection().deleteOne({ _id: cardId });
      await assert.rejects(invoke('changeHistory.undoLast', boardId), /not-authorized/);
      row = await ChangeHistory.findOneAsync(rowId);
      assert.equal(row.undone, false);
      assert.equal(row.undoneAt, null);
      assert.equal(await reversals(), 2);
    } finally {
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await Cards.rawCollection().deleteMany({ boardId });
      await Lists.rawCollection().deleteMany({ boardId });
      await Swimlanes.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteOne({ _id: boardId });
      await Meteor.users.rawCollection().deleteOne({ _id: userId });
    }
  });
});
