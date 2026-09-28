import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Cards from '/models/cards';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Activities from '/models/activities';

describe('Card column entry timestamps', function () {
  this.timeout(20000);
  it('persists creation and actual moves but not edits, reordering or rejected writes', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId = Random.id(), boardId = Random.id(), otherBoardId = Random.id();
    const lane = Random.id(), secondLane = Random.id(), otherLane = Random.id();
    const list = Random.id(), secondList = Random.id(), otherList = Random.id();
    const actor = fn => DDP._CurrentMethodInvocation.withValue({ userId, isSimulation: false }, fn);
    let cardId;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: userId, username: `entry-${userId}`, profile: {} });
      for (const _id of [boardId, otherBoardId]) await Boards.rawCollection().insertOne({ _id, title: 'Entry test',
        permission: 'private', archived: false, members: [{ userId, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertMany([
        { _id: lane, boardId }, { _id: secondLane, boardId }, { _id: otherLane, boardId: otherBoardId },
      ].map(row => ({ ...row, title: 'Lane', type: 'swimlane', sort: 0, archived: false })));
      await Lists.rawCollection().insertMany([
        { _id: list, boardId }, { _id: secondList, boardId }, { _id: otherList, boardId: otherBoardId },
      ].map(row => ({ ...row, title: 'List', sort: 0, archived: false })));
      const started = Date.now();
      cardId = await actor(() => Cards.insertAsync({ boardId, listId: list, swimlaneId: lane,
        title: 'Entry card', userId, sort: 0, type: 'cardType-card' }));
      let card = await Cards.findOneAsync(cardId);
      assert.ok(card.listEnteredAt instanceof Date && card.listEnteredAt.getTime() >= started);
      const old = new Date('2020-01-01T00:00:00Z');
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { listEnteredAt: old } });
      for (const set of [{ title: 'Edited' }, { sort: 50 }, { swimlaneId: secondLane }, { listId: list }]) {
        await actor(() => Cards.updateAsync(cardId, { $set: set }));
        assert.deepEqual((await Cards.findOneAsync(cardId)).listEnteredAt, old);
      }
      await actor(() => Cards.updateAsync(cardId, { $set: { title: 'Keep timestamp', listEnteredAt: new Date() } }));
      assert.deepEqual((await Cards.findOneAsync(cardId)).listEnteredAt, old);
      await actor(() => Cards.updateAsync({ _id: cardId, listId: 'wrong' }, { $set: { listId: secondList } }));
      assert.deepEqual((await Cards.findOneAsync(cardId)).listEnteredAt, old);
      await actor(() => Cards.updateAsync(cardId, { $set: { listId: secondList } }));
      card = await Cards.findOneAsync(cardId);
      assert.equal(card.listId, secondList);
      assert.ok(card.listEnteredAt.getTime() >= started);
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { listEnteredAt: old } });
      await actor(() => Cards.updateAsync(cardId, { $set: { boardId: otherBoardId, listId: otherList, swimlaneId: otherLane } }));
      card = await Cards.findOneAsync(cardId);
      assert.equal(card.boardId, otherBoardId);
      assert.ok(card.listEnteredAt.getTime() >= started);
    } finally {
      for (const collection of [Cards, Lists, Swimlanes, Activities]) await collection.rawCollection().deleteMany({ boardId: { $in: [boardId, otherBoardId] } });
      await Boards.rawCollection().deleteMany({ _id: { $in: [boardId, otherBoardId] } });
      await Meteor.users.rawCollection().deleteOne({ _id: userId });
    }
  });
});
