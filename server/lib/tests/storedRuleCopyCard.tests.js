import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import CardComments from '/models/cardComments';
import Attachments from '/models/attachments';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { runStoredSyncRules, SyncRuleCopyCardCommands, SyncRulePlans, SyncRuleReceipts, SyncRuleCompletions }
  from '/server/notifications/storedRulePlans';

// Durable rule copyCard on the card's own board: the copy and everything
// Card.copy copies, each once, with the creation activities and the
// attachments' History rows written once - and the same copy Card.copy makes.
describe('Stored Sync rule copyCard', function () {
  this.timeout(60000);
  it('copies the card with its checklists, subtasks, comments and attachments, once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), nextId = Random.id(), laneId = Random.id();
    const cardId = Random.id(), subId = Random.id(), activityId = Random.id(), checklistId = Random.id();
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Pump', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'd'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    let ordinaryId;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `copy-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Board', cardNumber: 0,
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertMany([{ _id: listId, boardId, title: 'List', archived: false },
        { _id: nextId, boardId, title: 'Next', archived: false }]);
      await Cards.rawCollection().insertMany([
        { _id: cardId, boardId, listId, swimlaneId: laneId, title: 'Pump', sort: 0, archived: false, userId: actor,
          description: 'Two of them', labelIds: [] },
        { _id: subId, boardId, listId, swimlaneId: laneId, title: 'Seal', sort: 1, archived: false, userId: actor,
          parentId: cardId },
      ]);
      await Checklists.rawCollection().insertOne({ _id: checklistId, cardId, boardId, title: 'Steps', sort: 0 });
      await ChecklistItems.rawCollection().insertOne({ _id: Random.id(), checklistId, cardId, boardId, title: 'Cut',
        isFinished: true, sort: 0 });
      await Checklists.rawCollection().insertOne({ _id: Random.id(), cardId: subId, boardId, title: 'Sub steps', sort: 0 });
      await CardComments.rawCollection().insertOne({ _id: Random.id(), cardId, boardId, userId: actor, text: 'Noted',
        createdAt: new Date(500), modifiedAt: new Date(500) });
      await Attachments.writeAsync(Buffer.from('pump drawing'), { fileName: 'pump.txt', type: 'text/plain', userId: actor,
        meta: { boardId, cardId, listId, swimlaneId: laneId } }, true);
      const withAttachment = true;
      await Activities.rawCollection().insertOne(activity);
      const actionId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: actionId, boardId, actionType: 'copyCard', listId: nextId, swimlaneId: laneId });
      // Every createCard on the board, the copy's own included: the chain guard
      // must stop the copy from copying itself.
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId, triggerId, actionId, enabled: true, title: 'Copy' });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      // A card without a parent stores an empty parentId (schema default).
      const copies = await Cards.rawCollection().find({ boardId, listId: nextId, parentId: { $in: [null, ''] } }).toArray();
      assert.equal(copies.length, 1, 'one copy, and the copy does not copy itself');
      const copied = copies[0];
      assert.deepEqual([copied.title, copied.description, copied.swimlaneId], ['Pump', 'Two of them', laneId]);
      const checklists = await Checklists.rawCollection().find({ cardId: copied._id }).toArray();
      assert.deepEqual(checklists.map(list => list.title), ['Steps']);
      assert.equal(await ChecklistItems.rawCollection().countDocuments({ checklistId: checklists[0]._id, isFinished: true }), 1);
      const subtasks = await Cards.rawCollection().find({ parentId: copied._id }).toArray();
      assert.deepEqual(subtasks.map(card => [card.title, card.listId]), [['Seal', nextId]]);
      assert.equal(await Checklists.rawCollection().countDocuments({ cardId: subtasks[0]._id }), 1);
      assert.deepEqual((await CardComments.rawCollection().find({ cardId: copied._id }).toArray()).map(c => c.text), ['Noted']);
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: copied._id, activityType: 'createCard' }), 1);
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: subtasks[0]._id, activityType: 'createCard' }), 1);
      if (withAttachment) {
        const files = await Attachments.collection.rawCollection().find({ 'meta.cardId': copied._id }).toArray();
        assert.equal(files.length, 1, 'the attachment copied once');
        assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: files[0]._id, entityType: 'attachment' }), 1,
          "its History row once, not the hook's and the plan's");
      }
      // Replay: nothing more.
      assert.equal(await runStoredSyncRules(input), input.effectId);
      assert.equal(await Cards.rawCollection().countDocuments({ boardId, listId: nextId }), 2);
      assert.equal(await Checklists.rawCollection().countDocuments({ boardId }), 4);
      assert.equal(await CardComments.rawCollection().countDocuments({ boardId }), 2);

      // Parity: the ordinary Card.copy of the same card makes the same card.
      const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      const source = await Cards.findOneAsync(cardId);
      ordinaryId = await DDP._CurrentMethodInvocation.withValue(context, () => source.copy(boardId, laneId, nextId));
      const ordinary = await Cards.rawCollection().findOne({ _id: ordinaryId });
      const durable = await Cards.rawCollection().findOne({ _id: copied._id });
      const comparable = card => Object.fromEntries(Object.entries(card).filter(([key]) =>
        !['_id', 'cardNumber', 'sort', 'createdAt', 'modifiedAt', 'dateLastActivity', 'listEnteredAt', 'coverId'].includes(key)));
      assert.deepEqual(comparable(durable), comparable(ordinary), 'the durable copy is the ordinary copy');
    } finally {
      const plans = await SyncRulePlans.rawCollection().find({ 'plan.boardId': boardId }, { projection: { _id: 1 } }).toArray();
      await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': boardId });
      await SyncRuleCopyCardCommands.rawCollection().deleteMany({ boardId });
      for (const collection of [Rules, Triggers, Actions]) await collection.rawCollection().deleteMany({ boardId });
      await Attachments.collection.rawCollection().deleteMany({ 'meta.boardId': boardId });
      for (const collection of [ChangeHistory, Activities, Checklists, ChecklistItems, CardComments, Cards, Lists]) {
        await collection.rawCollection().deleteMany({ boardId });
      }
      await Swimlanes.rawCollection().deleteMany({ _id: laneId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
