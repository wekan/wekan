import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { runStoredSyncRules, SyncRuleChecklistLifecycleCommands, SyncRulePlans, SyncRuleReceipts, SyncRuleCompletions }
  from '/server/notifications/storedRulePlans';

// Durable rule checklist creation and removal: each writes the checklist,
// the hook's activity and the History lifecycle row once, from its command.
describe('Stored Sync rule checklist creation and removal', function () {
  this.timeout(30000);
  it('adds and removes a checklist with the ordinary activity and History, once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), cardId = Random.id();
    const ids = { add: Random.id(), items: Random.id(), remove: Random.id() };
    const activity = id => ({ _id: id, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Card', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) });
    const input = (id, effect) => ({ activity: activity(id), effectId: effect.repeat(64),
      policy: { activities: true, notifications: true }, trigger: 'manual', assertCurrent: async () => {} });
    const ruleIds = [];
    const rule = async (action) => {
      const actionId = Random.id(), triggerId = Random.id(), ruleId = Random.id();
      ruleIds.push(ruleId);
      await Actions.rawCollection().insertOne({ _id: actionId, boardId, ...action });
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: '*',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: ruleId, boardId, triggerId, actionId, enabled: true, title: 'R' });
      return ruleId;
    };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `lifecycle-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Board',
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List' });
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, swimlaneId: 'lane', title: 'Card' });

      // addChecklist, with a rule variable in the name.
      const addRule = await rule({ actionType: 'addChecklist', checklistName: 'Steps for {cardTitle}' });
      await Activities.rawCollection().insertOne(activity(ids.add));
      const addInput = input(ids.add, 'e');
      assert.equal(await runStoredSyncRules(addInput), addInput.effectId);
      const added = await Checklists.rawCollection().find({ cardId }).toArray();
      assert.deepEqual(added.map(row => [row.title, row.sort, row.boardId]), [['Steps for Card', 0, boardId]]);
      assert.ok(added[0].createdAt instanceof Date, 'schema defaults, as for any checklist');
      const addActivities = await Activities.rawCollection().find({ cardId, activityType: 'addChecklist' }).toArray();
      assert.equal(addActivities.length, 1, 'the hook\'s activity once, not the hook\'s and the plan\'s');
      const addRows = await ChangeHistory.rawCollection().find({ entityId: added[0]._id, changeType: 'added' }).toArray();
      assert.equal(addRows.length, 1);
      assert.equal(addRows[0].newContent.document.title, 'Steps for Card');
      assert.equal(await runStoredSyncRules(addInput), addInput.effectId, 'replay');
      assert.equal(await Checklists.rawCollection().countDocuments({ cardId }), 1);
      assert.equal(await Activities.rawCollection().countDocuments({ cardId, activityType: 'addChecklist' }), 1);

      // addChecklistWithItems: the checklist and an item per comma-separated title.
      await Rules.rawCollection().deleteOne({ _id: addRule });
      const withItemsRule = await rule({ actionType: 'addChecklistWithItems', checklistName: 'Parts',
        checklistItems: 'Bolt,Nut for {cardTitle}' });
      await Activities.rawCollection().insertOne(activity(ids.items));
      const itemsInput = input(ids.items, 'a');
      assert.equal(await runStoredSyncRules(itemsInput), itemsInput.effectId);
      const parts = await Checklists.rawCollection().findOne({ cardId, title: 'Parts' });
      const partItems = await ChecklistItems.rawCollection().find({ checklistId: parts._id }).sort({ sort: 1 }).toArray();
      assert.deepEqual(partItems.map(item => [item.title, item.sort]), [['Bolt', 0], ['Nut for Card', 1]]);
      assert.equal(await Activities.rawCollection().countDocuments({ cardId, activityType: 'addChecklistItem' }), 2);
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ cardId, entityType: 'checklistItem', changeType: 'added' }), 2);
      assert.equal(await runStoredSyncRules(itemsInput), itemsInput.effectId, 'replay');
      assert.equal(await ChecklistItems.rawCollection().countDocuments({ checklistId: parts._id }), 2);
      assert.equal(await Activities.rawCollection().countDocuments({ cardId, activityType: 'addChecklistItem' }), 2);
      await Rules.rawCollection().deleteOne({ _id: withItemsRule });
      await ChecklistItems.rawCollection().deleteMany({ checklistId: parts._id });
      await Checklists.rawCollection().deleteOne({ _id: parts._id });

      // removeChecklist of every checklist named as written, sort 0.
      await Checklists.rawCollection().insertOne({ _id: Random.id(), cardId, boardId, title: 'Steps for Card', sort: 0,
        createdAt: new Date(2), modifiedAt: new Date(2) });
      await rule({ actionType: 'removeChecklist', checklistName: 'Steps for Card' });
      await Activities.rawCollection().insertOne(activity(ids.remove));
      const removeInput = input(ids.remove, 'f');
      assert.equal(await runStoredSyncRules(removeInput), removeInput.effectId);
      assert.equal(await Checklists.rawCollection().countDocuments({ cardId }), 0, 'both removed');
      assert.equal(await Activities.rawCollection().countDocuments({ cardId, activityType: 'removeChecklist' }), 2);
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ cardId, entityType: 'checklist', changeType: 'removed' }), 2);
      assert.equal(await runStoredSyncRules(removeInput), removeInput.effectId, 'replay');
      assert.equal(await Activities.rawCollection().countDocuments({ cardId, activityType: 'removeChecklist' }), 2);
      assert.equal(await SyncRuleChecklistLifecycleCommands.rawCollection().countDocuments({ cardId }), 3);
    } finally {
      for (const id of Object.values(ids)) {
        const plans = await SyncRulePlans.rawCollection().find({ 'plan.activityId': id }, { projection: { _id: 1 } }).toArray();
        await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
        await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': id });
      }
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: { $in: ['e'.repeat(64), 'f'.repeat(64), 'a'.repeat(64)] } });
      await ChecklistItems.rawCollection().deleteMany({ cardId });
      await SyncRuleChecklistLifecycleCommands.rawCollection().deleteMany({ cardId });
      for (const collection of [Rules, Triggers, Actions]) await collection.rawCollection().deleteMany({ boardId });
      await Checklists.rawCollection().deleteMany({ cardId });
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await Activities.rawCollection().deleteMany({ cardId });
      await Cards.rawCollection().deleteMany({ _id: cardId }); await Lists.rawCollection().deleteMany({ _id: listId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
