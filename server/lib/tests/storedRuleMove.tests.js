import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import UserPositionHistory from '/models/userPositionHistory';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { runStoredSyncRules, SyncRuleMoveCommands, SyncRuleSortListCommands, SyncRuleCreateCardCommands, SyncRulePlans,
  SyncRuleReceipts, SyncRuleCompletions } from '/server/notifications/storedRulePlans';

// Durable rule moves (maintainer decision of 2026-10-02): a "move to top"
// rule run through the stored rule stage writes the sort, the hook's
// position row and the legacy row Ctrl+Z reads, once, from its saved command.
describe('Stored Sync rule moves', function () {
  this.timeout(30000);
  it('moves the card to the top of its list with the ordinary History, once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), laneId = Random.id();
    const cardId = Random.id(), otherId = Random.id(), activityId = Random.id(), undoneId = Random.id();
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Card', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'd'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `move-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Board',
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List', archived: false });
      await Cards.rawCollection().insertMany([
        { _id: otherId, boardId, listId, swimlaneId: laneId, title: 'Other', sort: 3, archived: false },
        { _id: cardId, boardId, listId, swimlaneId: laneId, title: 'Card', sort: 7, archived: false },
      ]);
      await Activities.rawCollection().insertOne(activity);
      // An undone legacy row: a new move clears the actor's redo stack, as trackChange does.
      await UserPositionHistory.rawCollection().insertOne({ _id: undoneId, userId: actor, boardId, entityType: 'card',
        entityId: otherId, actionType: 'move', undone: true, isCheckpoint: false, createdAt: new Date(0) });
      const actionId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: actionId, boardId, actionType: 'moveCardToTop', listName: '*',
        swimlaneName: '*' });
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId, triggerId, actionId, enabled: true, title: 'To top' });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const card = await Cards.rawCollection().findOne({ _id: cardId });
      assert.deepEqual([card.sort, card.listId, card.swimlaneId], [2, listId, laneId], 'one above the smallest sort');
      const rows = await ChangeHistory.rawCollection().find({ entityId: cardId, group: 'position' }).toArray();
      assert.equal(rows.length, 1, 'one position row, not the hook\'s and the plan\'s');
      assert.deepEqual([rows[0].previousContent.sort, rows[0].newContent.sort, rows[0].userId], [7, 2, actor]);
      const legacy = await UserPositionHistory.rawCollection().find({ entityId: cardId }).toArray();
      assert.deepEqual(legacy.map(row => [row.previousSort, row.newSort, row.userId, row.undone]), [[7, 2, actor, false]]);
      assert.equal(await UserPositionHistory.rawCollection().countDocuments({ _id: undoneId }), 0, 'redo stack cleared');
      assert.equal(await Activities.rawCollection().countDocuments({ cardId, activityType: { $ne: 'createCard' } }), 0,
        'an in-place move writes no activity');
      // Replay changes nothing.
      assert.equal(await runStoredSyncRules(input), input.effectId);
      assert.equal((await Cards.rawCollection().findOne({ _id: cardId })).sort, 2);
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: cardId, group: 'position' }), 1);
      assert.equal(await UserPositionHistory.rawCollection().countDocuments({ entityId: cardId }), 1);
      assert.equal(await SyncRuleMoveCommands.rawCollection().countDocuments({ cardId }), 1);
    } finally {
      const plans = await SyncRulePlans.rawCollection().find({ 'plan.activityId': activityId }, { projection: { _id: 1 } }).toArray();
      await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      await SyncRuleMoveCommands.rawCollection().deleteMany({ cardId });
      for (const collection of [Rules, Triggers, Actions]) await collection.rawCollection().deleteMany({ boardId });
      await UserPositionHistory.rawCollection().deleteMany({ boardId });
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await Activities.rawCollection().deleteMany({ cardId });
      await Cards.rawCollection().deleteMany({ boardId }); await Lists.rawCollection().deleteMany({ _id: listId });
      await Swimlanes.rawCollection().deleteMany({ _id: laneId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });

  // Durable sortList: each card's sort and the hook's position row, once.
  it('sorts the list by name with one position row per moved card, once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), laneId = Random.id(), activityId = Random.id();
    const ids = [Random.id(), Random.id(), Random.id()];
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId: ids[0], userId: actor,
      cardTitle: 'Charlie', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'b'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `sort-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Board',
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List', archived: false });
      await Cards.rawCollection().insertMany([['Charlie', 0], ['alpha', 1], ['Bravo', 2]].map(([title, sort], i) =>
        ({ _id: ids[i], boardId, listId, swimlaneId: laneId, title, sort, archived: false })));
      await Activities.rawCollection().insertOne(activity);
      const actionId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: actionId, boardId, actionType: 'sortList', listName: '*', sortField: 'name' });
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId, triggerId, actionId, enabled: true, title: 'Sort' });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const sorted = await Cards.rawCollection().find({ listId }).sort({ sort: 1 }).toArray();
      assert.deepEqual(sorted.map(card => card.title), ['alpha', 'Bravo', 'Charlie']);
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ boardId, group: 'position' }), 3, 'one row per moved card');
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ boardId, group: 'position' }), 3);
      assert.equal(await SyncRuleSortListCommands.rawCollection().countDocuments({ boardId }), 1);
    } finally {
      const plans = await SyncRulePlans.rawCollection().find({ 'plan.activityId': activityId }, { projection: { _id: 1 } }).toArray();
      await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      await SyncRuleSortListCommands.rawCollection().deleteMany({ boardId });
      for (const collection of [Rules, Triggers, Actions]) await collection.rawCollection().deleteMany({ boardId });
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await Activities.rawCollection().deleteMany({ _id: activityId });
      await Cards.rawCollection().deleteMany({ boardId }); await Lists.rawCollection().deleteMany({ _id: listId });
      await Swimlanes.rawCollection().deleteMany({ _id: laneId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });

  // Durable createCard: the card once, with its creation activity once.
  it('creates the named card once with its creation activity', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), nextId = Random.id(), laneId = Random.id();
    const cardId = Random.id(), activityId = Random.id();
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Card', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'c'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `create-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Board',
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertMany([{ _id: listId, boardId, title: 'List', archived: false },
        { _id: nextId, boardId, title: 'Next', archived: false }]);
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, swimlaneId: laneId, title: 'Card', sort: 0, archived: false });
      await Activities.rawCollection().insertOne(activity);
      const actionId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: actionId, boardId, actionType: 'createCard', cardName: 'Follow up',
        listName: 'Next', swimlaneName: 'Lane' });
      // Only the triggering card's own creation runs the rule, not the new card's.
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: 'List', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId, triggerId, actionId, enabled: true, title: 'Create' });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const created = await Cards.rawCollection().find({ boardId, listId: nextId }).toArray();
      assert.deepEqual(created.map(card => [card.title, card.swimlaneId, card.sort]), [['Follow up', laneId, 0]]);
      const activities = await Activities.rawCollection().find({ cardId: created[0]._id, activityType: 'createCard' }).toArray();
      assert.equal(activities.length, 1, 'the creation activity once, not the hook\'s and the plan\'s');
      assert.equal(activities[0].listName, 'Next');
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await Cards.rawCollection().countDocuments({ boardId, listId: nextId }), 1);
      assert.equal(await SyncRuleCreateCardCommands.rawCollection().countDocuments({ boardId }), 1);
    } finally {
      const plans = await SyncRulePlans.rawCollection().find({ 'plan.activityId': activityId }, { projection: { _id: 1 } }).toArray();
      await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      await SyncRuleCreateCardCommands.rawCollection().deleteMany({ boardId });
      for (const collection of [Rules, Triggers, Actions]) await collection.rawCollection().deleteMany({ boardId });
      await Activities.rawCollection().deleteMany({ boardId });
      await Cards.rawCollection().deleteMany({ boardId }); await Lists.rawCollection().deleteMany({ boardId });
      await Swimlanes.rawCollection().deleteMany({ _id: laneId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
