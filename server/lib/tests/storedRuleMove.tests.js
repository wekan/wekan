import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { MongoInternals } from 'meteor/mongo';
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
import { runStoredSyncRules, SyncRuleMoveCommands, SyncRuleSortListCommands, SyncRuleCreateCardCommands,
  SyncRuleLinkCardCommands, SyncRuleAddSwimlaneCommands, SyncRuleMoveAllCommands, SyncRuleCardCommands, SyncRulePlans,
  SyncRuleReceipts, SyncRuleCompletions } from '/server/notifications/storedRulePlans';
import { durableSyncDecision } from '/server/lib/listSyncApplication';

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

  // Durable linkCard on the card's own board: the linked card once, with its activity once.
  it('links the card on its own board once, with the creation activity', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), nextId = Random.id(), laneId = Random.id();
    const cardId = Random.id(), activityId = Random.id();
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Card', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'e'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `link-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Board',
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertMany([{ _id: listId, boardId, title: 'List', archived: false },
        { _id: nextId, boardId, title: 'Next', archived: false }]);
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, swimlaneId: laneId, title: 'Card', sort: 0,
        archived: false, labelIds: ['l1'], userId: actor });
      await Activities.rawCollection().insertOne(activity);
      const actionId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: actionId, boardId, actionType: 'linkCard', listName: 'Next', swimlaneName: 'Lane' });
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: 'List', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId, triggerId, actionId, enabled: true, title: 'Link' });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const linked = await Cards.rawCollection().find({ boardId, listId: nextId }).toArray();
      assert.deepEqual(linked.map(card => [card.type, card.linkedId, card.title]), [['cardType-linkedCard', cardId, 'Card']]);
      assert.ok(!(linked[0].labelIds || []).length, 'no labels on the link');
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: linked[0]._id, activityType: 'createCard' }), 1);
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await Cards.rawCollection().countDocuments({ boardId, listId: nextId }), 1);
      assert.equal(await SyncRuleLinkCardCommands.rawCollection().countDocuments({ boardId }), 1);
    } finally {
      const plans = await SyncRulePlans.rawCollection().find({ 'plan.activityId': activityId }, { projection: { _id: 1 } }).toArray();
      await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      await SyncRuleLinkCardCommands.rawCollection().deleteMany({ boardId });
      for (const collection of [Rules, Triggers, Actions]) await collection.rawCollection().deleteMany({ boardId });
      await Activities.rawCollection().deleteMany({ boardId });
      await Cards.rawCollection().deleteMany({ boardId }); await Lists.rawCollection().deleteMany({ boardId });
      await Swimlanes.rawCollection().deleteMany({ _id: laneId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });

  // Durable linkCard to ANOTHER board (maintainer decision of 2026-10-02):
  // only when that board opted into Sync effects too. The link's creation
  // activity runs the destination board's own rules through the stored stages.
  it('links the card onto another board that opted in, and that board\'s rule acts on the link, once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), destId = Random.id(), listId = Random.id(), laneId = Random.id();
    const destListId = Random.id(), destLaneId = Random.id(), cardId = Random.id(), activityId = Random.id();
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Card', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: '6'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    const members = [{ userId: actor, isAdmin: true, isActive: true }];
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `link-elsewhere-${actor}` });
      await Boards.rawCollection().insertMany([
        { _id: boardId, syncEffectsEnabled: true, title: 'Source', members },
        { _id: destId, syncEffectsEnabled: true, title: 'Destination', members },
      ]);
      await Swimlanes.rawCollection().insertMany([{ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false },
        { _id: destLaneId, boardId: destId, title: 'Lane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: listId, boardId, title: 'List', archived: false },
        { _id: destListId, boardId: destId, title: 'Inbox', archived: false }]);
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, swimlaneId: laneId, title: 'Card', sort: 0,
        archived: false, labelIds: ['l1'], userId: actor });
      await Activities.rawCollection().insertOne(activity);
      const linkId = Random.id(), colorId = Random.id(), triggerId = Random.id(), destTriggerId = Random.id();
      await Actions.rawCollection().insertMany([
        { _id: linkId, boardId: destId, actionType: 'linkCard', listName: 'Inbox', swimlaneName: 'Lane' },
        { _id: colorId, boardId: destId, actionType: 'setColor', selectedColor: 'green' },
      ]);
      await Triggers.rawCollection().insertMany([
        { _id: triggerId, boardId, activityType: 'createCard', listName: 'List', userId: '*', swimlaneName: '*', cardTitle: '*' },
        { _id: destTriggerId, boardId: destId, activityType: 'createCard', listName: 'Inbox', userId: '*', swimlaneName: '*', cardTitle: '*' },
      ]);
      await Rules.rawCollection().insertMany([
        { _id: Random.id(), boardId, triggerId, actionId: linkId, enabled: true, title: 'Link elsewhere' },
        { _id: Random.id(), boardId: destId, triggerId: destTriggerId, actionId: colorId, enabled: true, title: 'Green' },
      ]);
      const list = { _id: listId, boardId, syncRevision: 'rev', syncCredentialIncarnation: 'life' };
      const decide = async () => durableSyncDecision({ list, board: await Boards.findOneAsync(boardId), trigger: 'manual',
        actorId: actor });
      assert.deepEqual(await decide(), { eligible: true, reason: null }, 'both boards opted in');

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const linked = await Cards.rawCollection().find({ boardId: destId }).toArray();
      assert.deepEqual(linked.map(card => [card.type, card.linkedId, card.listId, card.swimlaneId, card.color]),
        [['cardType-linkedCard', cardId, destListId, destLaneId, undefined]], 'linked there');
      // That board's rule ran on the link, and - as the ordinary setter does
      // through getRealId - coloured the card it links to, with its History row (colour is in the title group).
      assert.equal((await Cards.rawCollection().findOne({ _id: cardId })).color, 'green');
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: cardId, boardId, group: 'title' }), 1);
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: linked[0]._id, activityType: 'createCard',
        boardId: destId }), 1);
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await Cards.rawCollection().countDocuments({ boardId: destId }), 1);
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: linked[0]._id, activityType: 'createCard' }), 1);
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: cardId, group: 'title' }), 1);

      // Negative: the destination's own rules must be durable too...
      const elsewhereId = Random.id();
      await Actions.rawCollection().insertOne({ _id: elsewhereId, boardId: Random.id(), actionType: 'moveCardToTop' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId: destId, triggerId: destTriggerId,
        actionId: elsewhereId, enabled: true, title: 'Away' });
      assert.deepEqual(await decide(), { eligible: false, reason: 'rule-actions' }, 'a destination rule is not durable');
      await Rules.rawCollection().deleteMany({ actionId: elsewhereId });
      // ...and a destination that has not opted in keeps the source on direct Sync,
      await Boards.rawCollection().updateOne({ _id: destId }, { $set: { syncEffectsEnabled: false } });
      assert.deepEqual(await decide(), { eligible: false, reason: 'rule-actions' }, 'the destination did not opt in');
      // and the runner refuses to write there before linking anything.
      const second = { ...activity, _id: Random.id() };
      await Activities.rawCollection().insertOne(second);
      await assert.rejects(runStoredSyncRules({ ...input, activity: second, effectId: '7'.repeat(64) }),
        /sync-effects-not-enabled|destination-denied/);
      assert.equal(await Cards.rawCollection().countDocuments({ boardId: destId }), 1, 'no second link');
      // A destination the actor cannot write to does not count either.
      await Boards.rawCollection().updateOne({ _id: destId }, { $set: { syncEffectsEnabled: true, members: [] } });
      assert.deepEqual(await decide(), { eligible: false, reason: 'rule-actions' }, 'the actor is not a member there');
    } finally {
      for (const board of [boardId, destId]) {
        const plans = await SyncRulePlans.rawCollection().find({ 'plan.boardId': board }, { projection: { _id: 1 } }).toArray();
        await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
        await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': board });
        for (const collection of [SyncRuleLinkCardCommands, SyncRuleCardCommands]) {
          await collection.rawCollection().deleteMany({ boardId: board });
        }
        for (const collection of [Rules, Triggers, Actions, Activities, ChangeHistory, Cards, Lists, Swimlanes]) {
          await collection.rawCollection().deleteMany({ boardId: board });
        }
      }
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await Boards.rawCollection().deleteMany({ _id: { $in: [boardId, destId] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });

  // Durable addSwimlane: the swimlane once, its activity once.
  it('adds the named swimlane once, with its activity once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), laneId = Random.id();
    const cardId = Random.id(), activityId = Random.id();
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Pump', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'f'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `lane-${actor}` });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Board',
        members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', sort: 0, archived: false });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List', archived: false });
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, swimlaneId: laneId, title: 'Pump', sort: 0, archived: false });
      await Activities.rawCollection().insertOne(activity);
      const actionId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: actionId, boardId, actionType: 'addSwimlane', swimlaneName: 'Lane for {cardTitle}' });
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId, triggerId, actionId, enabled: true, title: 'Lane' });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const lanes = await Swimlanes.rawCollection().find({ boardId, title: 'Lane for Pump' }).toArray();
      assert.equal(lanes.length, 1);
      assert.equal(await Activities.rawCollection().countDocuments({ swimlaneId: lanes[0]._id, activityType: 'createSwimlane' }), 1,
        "the activity once, not the hook's and the command's");
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await Swimlanes.rawCollection().countDocuments({ boardId, title: 'Lane for Pump' }), 1);
      assert.equal(await Activities.rawCollection().countDocuments({ boardId, activityType: 'createSwimlane' }), 1);
      assert.equal(await SyncRuleAddSwimlaneCommands.rawCollection().countDocuments({ boardId }), 1);
      // Delivered durably (2026-10-03): a board-level activity's notification and
      // webhook plans exist, keyed by it and naming no card.
      const created = await Activities.rawCollection().findOne({ boardId, activityType: 'createSwimlane' });
      const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      const notified = await db.collection('listSyncNotificationPlans').findOne({ 'plan.activityId': created._id });
      assert.ok(notified, 'a durable notification plan');
      assert.equal(notified.plan.cardId, null);
      assert.ok(await db.collection('listSyncWebhookPlans').findOne({ 'plan.activityId': created._id }), 'a webhook plan');
      await db.collection('listSyncNotificationPlans').deleteMany({ 'plan.boardId': boardId });
      await db.collection('listSyncWebhookPlans').deleteMany({ 'plan.boardId': boardId });
    } finally {
      const plans = await SyncRulePlans.rawCollection().find({ 'plan.activityId': activityId }, { projection: { _id: 1 } }).toArray();
      await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      await SyncRuleAddSwimlaneCommands.rawCollection().deleteMany({ boardId });
      for (const collection of [Rules, Triggers, Actions]) await collection.rawCollection().deleteMany({ boardId });
      await Activities.rawCollection().deleteMany({ boardId });
      await Cards.rawCollection().deleteMany({ boardId }); await Lists.rawCollection().deleteMany({ boardId });
      await Swimlanes.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });

  // Maintainer decision of 2026-10-02: the guard follows a move the same rule
  // plan saved. A move to another list, then a second action of the same rule
  // on the moved card - which only runs if the guard follows it.
  async function moveFixture(tag) {
    const ids = { actor: Random.id(), boardId: Random.id(), listId: Random.id(), doneId: Random.id(), laneId: Random.id(),
      cardId: Random.id(), activityId: Random.id() };
    await Meteor.users.rawCollection().insertOne({ _id: ids.actor, username: `${tag}-${ids.actor}` });
    await Boards.rawCollection().insertOne({ _id: ids.boardId, syncEffectsEnabled: true, title: 'Board',
      members: [{ userId: ids.actor, isAdmin: true, isActive: true }] });
    await Swimlanes.rawCollection().insertOne({ _id: ids.laneId, boardId: ids.boardId, title: 'Lane', sort: 0, archived: false });
    await Lists.rawCollection().insertMany([{ _id: ids.listId, boardId: ids.boardId, title: 'Doing', archived: false },
      { _id: ids.doneId, boardId: ids.boardId, title: 'Done', archived: false }]);
    await Cards.rawCollection().insertOne({ _id: ids.cardId, boardId: ids.boardId, listId: ids.listId, swimlaneId: ids.laneId,
      title: 'Pump', sort: 3, archived: false, lastMoveReason: 'old reason' });
    ids.activity = { _id: ids.activityId, activityType: 'createCard', boardId: ids.boardId, listId: ids.listId,
      cardId: ids.cardId, userId: ids.actor, cardTitle: 'Pump', listName: 'Doing', swimlaneName: 'Lane',
      createdAt: new Date(1000), modifiedAt: new Date(1000) };
    await Activities.rawCollection().insertOne(ids.activity);
    return ids;
  }
  async function cleanupMove(ids, input) {
    const plans = await SyncRulePlans.rawCollection().find({ 'plan.boardId': ids.boardId }, { projection: { _id: 1 } }).toArray();
    await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
    await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
    await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': ids.boardId });
    for (const collection of [SyncRuleMoveCommands, SyncRuleMoveAllCommands, SyncRuleCardCommands]) {
      await collection.rawCollection().deleteMany({ boardId: ids.boardId });
    }
    for (const collection of [Rules, Triggers, Actions]) await collection.rawCollection().deleteMany({ boardId: ids.boardId });
    await UserPositionHistory.rawCollection().deleteMany({ boardId: ids.boardId });
    await ChangeHistory.rawCollection().deleteMany({ boardId: ids.boardId });
    await Activities.rawCollection().deleteMany({ boardId: ids.boardId });
    await Cards.rawCollection().deleteMany({ boardId: ids.boardId }); await Lists.rawCollection().deleteMany({ boardId: ids.boardId });
    await Swimlanes.rawCollection().deleteMany({ boardId: ids.boardId });
    await Boards.rawCollection().deleteMany({ _id: ids.boardId }); await Meteor.users.rawCollection().deleteMany({ _id: ids.actor });
  }

  it('moves the card to another list and the same rule acts on it there, once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const ids = await moveFixture('move-list');
    const input = { activity: ids.activity, effectId: '3'.repeat(64), policy: { activities: true, notifications: true },
      trigger: 'manual', assertCurrent: async () => {} };
    try {
      const moveId = Random.id(), colorId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertMany([
        { _id: moveId, boardId: ids.boardId, actionType: 'moveCardToBottom', listName: 'Done', swimlaneName: '*' },
        { _id: colorId, boardId: ids.boardId, actionType: 'setColor', selectedColor: 'green' },
      ]);
      // Only the triggering card's creation in Doing runs this rule.
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId: ids.boardId, activityType: 'createCard', listName: 'Doing', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId: ids.boardId, triggerId, actionId: moveId,
        extraActionIds: [colorId], enabled: true, title: 'Done and green' });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const card = await Cards.rawCollection().findOne({ _id: ids.cardId });
      // An empty reason is cleaned to "unset", as Card.move's own update is.
      assert.deepEqual([card.listId, card.lastMoveReason ?? '', card.color], [ids.doneId, '', 'green'],
        'moved, the reason reset, and the second action ran on the moved card');
      assert.ok(card.listEnteredAt instanceof Date, 'the list-entry hook ran');
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: ids.cardId, activityType: 'moveCard' }), 1,
        "the moveCard activity once, not the hook's and the command's");
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: ids.cardId, group: 'position' }), 1);
      assert.equal(await UserPositionHistory.rawCollection().countDocuments({ entityId: ids.cardId }), 1);
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: ids.cardId, activityType: 'moveCard' }), 1);
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: ids.cardId, group: 'position' }), 1);
      // Negative: a card moved by anyone else is not followed - the guard refuses.
      await Cards.rawCollection().updateOne({ _id: ids.cardId }, { $set: { listId: ids.listId } });
      await Lists.rawCollection().insertOne({ _id: 'elsewhere-' + ids.boardId, boardId: ids.boardId, title: 'Elsewhere' });
      await Cards.rawCollection().updateOne({ _id: ids.cardId }, { $set: { listId: 'elsewhere-' + ids.boardId } });
      await assert.rejects(runStoredSyncRules({ ...input, effectId: '4'.repeat(64) }), /context-denied/);
    } finally { await cleanupMove(ids, input); }
  });

  it('moves every card of a list, the rule card among them, once each', async function () {
    if (!Meteor.isAppTest) this.skip();
    const ids = await moveFixture('move-all');
    const input = { activity: ids.activity, effectId: '5'.repeat(64), policy: { activities: true, notifications: true },
      trigger: 'manual', assertCurrent: async () => {} };
    try {
      const otherId = Random.id();
      await Cards.rawCollection().insertOne({ _id: otherId, boardId: ids.boardId, listId: ids.listId, swimlaneId: ids.laneId,
        title: 'Seal', sort: 7, archived: false });
      const moveAllId = Random.id(), colorId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertMany([
        { _id: moveAllId, boardId: ids.boardId, actionType: 'moveAllCardsInList', fromListName: 'Doing', listName: 'Done' },
        { _id: colorId, boardId: ids.boardId, actionType: 'setColor', selectedColor: 'blue' },
      ]);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId: ids.boardId, activityType: 'createCard', listName: 'Doing', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId: ids.boardId, triggerId, actionId: moveAllId,
        extraActionIds: [colorId], enabled: true, title: 'All done' });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const moved = await Cards.rawCollection().find({ boardId: ids.boardId }).sort({ sort: 1 }).toArray();
      assert.deepEqual(moved.map(card => [card.title, card.listId === ids.doneId, card.sort]), [['Pump', true, 3], ['Seal', true, 7]],
        'each keeps its swimlane and sort');
      assert.equal(moved.find(card => card._id === ids.cardId).color, 'blue', 'the guard followed the rule card');
      assert.equal(await Activities.rawCollection().countDocuments({ boardId: ids.boardId, activityType: 'moveCard' }), 2);
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await Activities.rawCollection().countDocuments({ boardId: ids.boardId, activityType: 'moveCard' }), 2);
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ boardId: ids.boardId, group: 'position' }), 2);
    } finally { await cleanupMove(ids, input); }
  });
});
