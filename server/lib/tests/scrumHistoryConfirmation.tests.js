import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import ChangeHistory from '/models/changeHistory';
import ScrumHistoryPending from '/server/lib/scrumHistoryPending';
import { HistoryWriterGates } from '/server/lib/storedHistoryChain';
import { applyScrumHistory } from '/server/lib/scrumHistory';
const { historyDocument } = require('/models/lib/scrumHistory');

describe('Scrum History write confirmation', function () {
  this.timeout(15000);
  it('preflights the complete batch and retains recovery after false replies or raced moves', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId = Random.id(), boardId = Random.id(), cardId = Random.id(), secondId = Random.id(), listId = Random.id(), swimlaneId = Random.id();
    const originalUpdate = Cards.updateAsync;
    const actor = fn => DDP._CurrentMethodInvocation.withValue({ userId, isSimulation: false }, fn);
    try {
      await Meteor.users.rawCollection().insertOne({ _id: userId, username: `confirm-${userId}`, profile: {} });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Confirmation', permission: 'private', archived: false,
        members: [{ userId, isAdmin: true, isActive: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, swimlaneId, title: 'List', archived: false, sort: 0 });
      await Swimlanes.rawCollection().insertOne({ _id: swimlaneId, boardId, title: 'Lane', type: 'swimlane', archived: false, sort: 0 });
      const card = { _id: cardId, boardId, listId, swimlaneId, title: 'Card', archived: false,
        sort: 0, scrum: { issueType: 'Story' }, scrumRevision: 1 };
      const cards = [card, { ...card, _id: secondId, title: 'Second card' }];
      await Cards.rawCollection().insertMany(cards);
      const previousContent = { records: cards.map(item => ({ type: 'card', id: item._id,
        document: historyDocument('card', { ...item, scrum: {} }) })) };
      const newContent = { records: cards.map(item => ({ type: 'card', id: item._id, document: historyDocument('card', item) })) };
      const id = await ChangeHistory.record({ boardId, cardId, listId, swimlaneId, userId,
        entityType: 'scrum', entityId: cardId, group: 'scrum', changeType: 'edited', previousContent, newContent });
      const row = await ChangeHistory.findOneAsync(id);
      // Simulate an adapter/hook reporting success without the intended write.
      Cards.updateAsync = async function (query, modifier, ...args) {
        if (query?._id === cardId && modifier?.$set?.scrum) return 1;
        return originalUpdate.call(this, query, modifier, ...args);
      };
      await assert.rejects(actor(() => applyScrumHistory(row, previousContent, 'undo')), /scrum-conflict/);
      const journal = await ScrumHistoryPending.findOneAsync(boardId);
      assert.ok(journal?.operationId);
      assert.equal((await Cards.findOneAsync(cardId)).scrum.issueType, 'Story');
      assert.equal((await ChangeHistory.findOneAsync(id)).undone, false);
      assert.equal(await ChangeHistory.find({ boardId, restoredFromId: id }).countAsync(), 0);
      // Move without changing scrumRevision after the read/permission checks,
      // immediately before the actual conditional write reaches storage.
      const movedBoard = Random.id();
      Cards.updateAsync = async function (query, modifier, ...args) {
        if (query?._id === cardId && modifier?.$set?.scrum) {
          await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { boardId: movedBoard } });
        }
        return originalUpdate.call(this, query, modifier, ...args);
      };
      await assert.rejects(actor(() => applyScrumHistory(row, previousContent, 'undo')), /scrum-conflict/);
      const moved = await Cards.findOneAsync(cardId);
      assert.equal(moved.boardId, movedBoard); assert.equal(moved.scrum.issueType, 'Story');
      assert.equal(moved.scrumRevision, 1);
      assert.equal((await ScrumHistoryPending.findOneAsync(boardId)).operationId, journal.operationId);
      assert.equal(await ChangeHistory.find({ boardId, restoredFromId: id }).countAsync(), 0);
      // Restore only the isolated test fixture to permit the original retry.
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { boardId } });
      Cards.updateAsync = originalUpdate;
      // The second target already conflicts on retry. Do not apply the first
      // target before discovering it, even though that first write is valid.
      await Cards.rawCollection().updateOne({ _id: secondId }, { $inc: { scrumRevision: 1 } });
      await assert.rejects(actor(() => applyScrumHistory(row, previousContent, 'undo')), /scrum-conflict/);
      const untouched = await Cards.findOneAsync(cardId);
      assert.equal(untouched.scrum.issueType, 'Story'); assert.equal(untouched.scrumRevision, 1);
      assert.equal((await ScrumHistoryPending.findOneAsync(boardId)).operationId, journal.operationId);
      assert.equal(await ChangeHistory.find({ boardId, restoredFromId: id }).countAsync(), 0);
      // Reset only the isolated fixture, then prove valid recovery still works.
      await Cards.rawCollection().updateOne({ _id: secondId }, { $set: { scrumRevision: 1 } });
      await actor(() => applyScrumHistory(row, previousContent, 'undo'));
      assert.deepEqual((await Cards.findOneAsync(secondId)).scrum, {});
      assert.equal((await Cards.findOneAsync(secondId)).scrumRevision, 2);
      assert.deepEqual((await Cards.findOneAsync(cardId)).scrum, {});
      assert.equal((await Cards.findOneAsync(cardId)).scrumRevision, 2);
      assert.equal((await ChangeHistory.findOneAsync(id)).undone, true);
      assert.equal(await ScrumHistoryPending.findOneAsync(boardId), undefined);
      const restored = await ChangeHistory.find({ boardId, restoredFromId: id }).fetchAsync();
      assert.equal(restored.length, 1); assert.equal(restored[0].batchId, journal.operationId);
    } finally {
      Cards.updateAsync = originalUpdate;
      await ScrumHistoryPending.rawCollection().deleteMany({ _id: boardId });
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await HistoryWriterGates.rawCollection().deleteMany({ boardId });
      await Cards.rawCollection().deleteMany({ _id: { $in: [cardId, secondId] } });
      await Lists.rawCollection().deleteMany({ boardId });
      await Swimlanes.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteMany({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: userId });
    }
  });
});
