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
import { runStoredSyncRules, SyncRuleChecklistCommands, SyncRulePlans, SyncRuleReceipts, SyncRuleCompletions } from '/server/notifications/storedRulePlans';

// Durable rule checklist actions: a "check every item" rule run through the
// stored rule stage writes the items, the hooks' activities and History once,
// from its saved command.
describe('Stored Sync rule checklist actions', function () {
  this.timeout(30000);
  it('checks every item with the ordinary activities and History, once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), cardId = Random.id(), activityId = Random.id();
    const checklistId = Random.id(), itemIds = [Random.id(), Random.id()];
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Card', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'c'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `checklist-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Board',
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List' });
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, swimlaneId: 'lane', title: 'Card', assignees: [] });
      await Activities.rawCollection().insertOne(activity);
      await Checklists.rawCollection().insertOne({ _id: checklistId, cardId, boardId, title: 'Steps', sort: 0 });
      await ChecklistItems.rawCollection().insertMany(itemIds.map((_id, i) => ({ _id, checklistId, cardId, boardId,
        title: `Step ${i}`, isFinished: false, sort: i })));
      const actionId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: actionId, boardId, actionType: 'checkAll', checklistName: 'Steps' });
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId, triggerId, actionId, enabled: true, title: 'Check all' });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const items = await ChecklistItems.rawCollection().find({ checklistId }).toArray();
      assert.ok(items.every(item => item.isFinished === true), 'every item is checked');
      const kinds = (await Activities.rawCollection().find({ cardId, activityType: { $ne: 'createCard' } }).sort({ _id: 1 }).toArray())
        .map(row => row.activityType).sort();
      assert.deepEqual(kinds, ['checkedItem', 'checkedItem', 'completeChecklist'], 'the activities of the ordinary hooks, once each');
      assert.equal(await ChangeHistory.find({ cardId, entityType: 'checklistItem', group: 'checklists' }).countAsync(), 2,
        'one History row per changed item, not two');
      // Replay: the invocation is done; a direct rerun of the command changes nothing either.
      assert.equal(await runStoredSyncRules(input), input.effectId);
      assert.equal(await Activities.rawCollection().countDocuments({ cardId, activityType: { $ne: 'createCard' } }), 3);
      assert.equal(await SyncRuleChecklistCommands.rawCollection().countDocuments({ cardId }), 1);
    } finally {
      const plans = await SyncRulePlans.rawCollection().find({ 'plan.activityId': activityId }, { projection: { _id: 1 } }).toArray();
      await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      await SyncRuleChecklistCommands.rawCollection().deleteMany({ cardId });
      for (const collection of [Rules, Triggers, Actions]) await collection.rawCollection().deleteMany({ boardId });
      await ChecklistItems.rawCollection().deleteMany({ cardId }); await Checklists.rawCollection().deleteMany({ cardId });
      await ChangeHistory.rawCollection().deleteMany({ cardId });
      await Activities.rawCollection().deleteMany({ cardId });
      await Cards.rawCollection().deleteMany({ _id: cardId }); await Lists.rawCollection().deleteMany({ _id: listId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
