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
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import UserPositionHistory from '/models/userPositionHistory';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import ScrumSprints from '/models/scrumSprints';
import { runStoredSyncRules, SyncRuleMoveBoardCommands, SyncRuleMoveAllBoardCommands, SyncRuleCardCommands, SyncRulePlans, SyncRuleReceipts,
  SyncRuleCompletions } from '/server/notifications/storedRulePlans';
import { durableSyncDecision } from '/server/lib/listSyncApplication';

// Durable rule moves to ANOTHER board (maintainer decision of 2026-10-02:
// only when that board opted in too): Card.move's move, with every hook record
// written once from the saved command, and only as the plan's last action.
describe('Stored Sync rule moves to another board', function () {
  this.timeout(60000);
  it('moves the card there as Card.move does, once, and only when what can follow it follows the card', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), stranger = Random.id(), from = Random.id(), to = Random.id();
    const ids = { list: Random.id(), lane: Random.id(), inbox: Random.id(), toLane: Random.id(), card: Random.id(),
      twin: Random.id(), blocked: Random.id(), activity: Random.id(), checklist: Random.id() };
    const activity = { _id: ids.activity, activityType: 'createCard', boardId: from, listId: ids.list, cardId: ids.card,
      userId: actor, cardTitle: 'Pump', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000),
      modifiedAt: new Date(1000) };
    const input = { activity, effectId: '8'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    const admin = userId => ({ userId, isAdmin: true, isActive: true });
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    try {
      await Meteor.users.rawCollection().insertMany([{ _id: actor, username: `move-board-${actor}` },
        { _id: stranger, username: `stranger-${stranger}` }]);
      await Boards.rawCollection().insertMany([
        { _id: from, title: 'From', syncEffectsEnabled: true, members: [admin(actor), admin(stranger)],
          labels: [{ _id: 'urgent-from', name: 'Urgent', color: 'red' }, { _id: 'local-from', name: 'Local', color: 'blue' }] },
        { _id: to, title: 'To', syncEffectsEnabled: true, members: [admin(actor)],
          labels: [{ _id: 'urgent-to', name: 'Urgent', color: 'red' }] },
      ]);
      await Swimlanes.rawCollection().insertMany([{ _id: ids.lane, boardId: from, title: 'Lane', sort: 0, archived: false },
        { _id: ids.toLane, boardId: to, title: 'Lane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: ids.list, boardId: from, title: 'List', archived: false },
        { _id: ids.inbox, boardId: to, title: 'Inbox', archived: false }]);
      const card = (_id, title) => ({ _id, boardId: from, listId: ids.list, swimlaneId: ids.lane, title, sort: 0,
        archived: false, labelIds: ['urgent-from', 'local-from'], members: [actor, stranger], customFields: [],
        cardDependencies: [{ cardId: ids.blocked, type: 'blocks' }],
        // The board it leaves owns its sprint and release; its issue type is its own.
        scrum: { sprintId: `sprint-${from}`, releaseId: 'release-from', backlogRank: 2, issueType: 'Story' }, scrumRevision: 4 });
      // That board has a sprint of the same name: the card is linked to it.
      await ScrumSprints.rawCollection().insertMany([{ _id: `sprint-${from}`, boardId: from, name: 'Sprint 7', state: 'active' },
        { _id: `sprint-${to}`, boardId: to, name: 'Sprint 7', state: 'planned' }]);
      await Cards.rawCollection().insertMany([card(ids.card, 'Pump'), card(ids.twin, 'Twin'),
        { _id: ids.blocked, boardId: from, listId: ids.list, swimlaneId: ids.lane, title: 'Waits', sort: 1, archived: false,
          cardDependencies: [{ cardId: ids.card, type: 'blocks' }] }]);
      await Checklists.rawCollection().insertOne({ _id: ids.checklist, cardId: ids.card, boardId: from, title: 'Steps', sort: 0 });
      await ChecklistItems.rawCollection().insertOne({ _id: Random.id(), checklistId: ids.checklist, cardId: ids.card,
        boardId: from, title: 'Cut', sort: 0 });
      await Activities.rawCollection().insertMany([activity,
        { _id: Random.id(), activityType: 'addedLabel', cardId: ids.card, boardId: from, labelId: 'urgent-from', userId: actor },
        { _id: Random.id(), activityType: 'addedLabel', cardId: ids.card, boardId: from, labelId: 'local-from', userId: actor }]);
      const moveId = Random.id(), colorId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertMany([
        { _id: moveId, boardId: to, actionType: 'moveCardToBottom', listName: 'Inbox', swimlaneName: 'Lane' },
        { _id: colorId, boardId: from, actionType: 'setColor', selectedColor: 'green' }]);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId: from, activityType: 'createCard', listName: 'List',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      const ruleId = Random.id();
      await Rules.rawCollection().insertOne({ _id: ruleId, boardId: from, triggerId, actionId: moveId, enabled: true,
        title: 'To the other board' });
      const list = { _id: ids.list, boardId: from, syncRevision: 'rev', syncCredentialIncarnation: 'life' };
      const decide = async () => durableSyncDecision({ list, board: await Boards.findOneAsync(from), trigger: 'manual',
        actorId: actor });
      assert.deepEqual(await decide(), { eligible: true, reason: null }, 'the move ends the only plan it can be in');

      // Negative first: an action that cannot follow the card to the other
      // board - sorting a list of the board it left - keeps the board on
      // direct Sync...
      const sortId = Random.id(), archiveId = Random.id();
      await Actions.rawCollection().insertMany([{ _id: sortId, boardId: from, actionType: 'sortList', listName: '*' },
        { _id: archiveId, boardId: from, actionType: 'archive' }]);
      await Rules.rawCollection().updateOne({ _id: ruleId }, { $set: { extraActionIds: [sortId] } });
      assert.deepEqual(await decide(), { eligible: false, reason: 'rule-actions' }, 'sorting cannot follow it');
      await Rules.rawCollection().updateOne({ _id: ruleId }, { $unset: { extraActionIds: '' } });
      // ...and so does another rule of the same trigger type that archives.
      const otherRule = Random.id(), otherTrigger = Random.id();
      await Triggers.rawCollection().insertOne({ _id: otherTrigger, boardId: from, activityType: 'createCard', listName: '*',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: otherRule, boardId: from, triggerId: otherTrigger, actionId: archiveId,
        enabled: true, title: 'Archive' });
      assert.deepEqual(await decide(), { eligible: false, reason: 'rule-actions' }, 'archiving may run after it');
      await Rules.rawCollection().deleteOne({ _id: otherRule });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const moved = await Cards.rawCollection().findOne({ _id: ids.card });
      assert.deepEqual([moved.boardId, moved.listId, moved.swimlaneId, moved.labelIds, moved.members, moved.cardDependencies],
        [to, ids.inbox, ids.toLane, ['urgent-to'], [actor], []], 'labels by name, members of that board, no dependencies');
      assert.ok(Number.isSafeInteger(moved.cardNumber) && moved.cardNumber > 0);
      assert.deepEqual([moved.scrum, moved.scrumRevision], [{ issueType: 'Story', sprintId: `sprint-${to}` }, 5],
        'that board\'s sprint of the same name; no release there, none kept');
      assert.deepEqual((await Checklists.rawCollection().find({ cardId: ids.card }).toArray()).map(c => c.boardId), [to]);
      assert.deepEqual((await ChecklistItems.rawCollection().find({ cardId: ids.card }).toArray()).map(c => c.boardId), [to]);
      assert.deepEqual((await Cards.rawCollection().findOne({ _id: ids.blocked })).cardDependencies, [],
        'the board left keeps no dependency on it');
      const labelled = await Activities.rawCollection().find({ cardId: ids.card, activityType: 'addedLabel' }).toArray();
      assert.deepEqual(labelled.map(a => [a.labelId, a.boardId]), [['urgent-to', to]]);
      const counts = async () => [
        await Activities.rawCollection().countDocuments({ cardId: ids.card, activityType: 'moveCardBoard' }),
        await ChangeHistory.rawCollection().countDocuments({ entityId: ids.card, group: 'position' }),
        await ChangeHistory.rawCollection().countDocuments({ entityId: ids.card, group: 'labels' }),
        await ChangeHistory.rawCollection().countDocuments({ entityId: ids.card, group: 'dependencies' }),
        await UserPositionHistory.rawCollection().countDocuments({ entityId: ids.card }),
      ];
      assert.deepEqual(await counts(), [1, 1, 1, 1, 1], 'each record once, not the hook\'s and the command\'s');
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.deepEqual(await counts(), [1, 1, 1, 1, 1]);
      assert.equal((await Cards.rawCollection().findOne({ _id: ids.card })).cardNumber, moved.cardNumber);

      // Parity: the ordinary Card.move of an identical card lands the same way.
      const twin = await Cards.findOneAsync(ids.twin);
      await DDP._CurrentMethodInvocation.withValue(context, () => twin.move(to, ids.toLane, ids.inbox, moved.sort));
      const ordinary = await Cards.rawCollection().findOne({ _id: ids.twin });
      const comparable = doc => Object.fromEntries(Object.entries(doc).filter(([key]) => !['_id', 'title', 'cardNumber',
        'listEnteredAt', 'modifiedAt', 'dateLastActivity', 'createdAt'].includes(key)));
      assert.deepEqual(comparable(moved), comparable(ordinary), 'the durable move is the ordinary move');

      // Negative: a destination that opted out keeps the board on direct Sync.
      await Boards.rawCollection().updateOne({ _id: to }, { $set: { syncEffectsEnabled: false } });
      assert.deepEqual(await decide(), { eligible: false, reason: 'rule-actions' });
    } finally {
      for (const board of [from, to]) {
        const plans = await SyncRulePlans.rawCollection().find({ 'plan.boardId': board }, { projection: { _id: 1 } }).toArray();
        await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
        await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': board });
        for (const model of [ScrumSprints, SyncRuleMoveBoardCommands, SyncRuleCardCommands, Rules, Triggers, Actions, ChangeHistory,
          UserPositionHistory, Activities, Checklists, ChecklistItems, Cards, Lists, Swimlanes]) {
          await model.rawCollection().deleteMany({ boardId: board });
        }
      }
      await Activities.rawCollection().deleteMany({ cardId: { $in: [ids.card, ids.twin] } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await Boards.rawCollection().deleteMany({ _id: { $in: [from, to] } });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [actor, stranger] } });
    }
  });

  it('moves every card of a list onto another board, the rule card among them, once each', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), from = Random.id(), to = Random.id();
    const ids = { doing: Random.id(), other: Random.id(), lane: Random.id(), done: Random.id(), toLane: Random.id(),
      card: Random.id(), second: Random.id(), twin: Random.id(), activity: Random.id() };
    const activity = { _id: ids.activity, activityType: 'createCard', boardId: from, listId: ids.doing, cardId: ids.card,
      userId: actor, cardTitle: 'Pump', listName: 'Doing', swimlaneName: 'Lane', createdAt: new Date(1000),
      modifiedAt: new Date(1000) };
    const input = { activity, effectId: '7'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    const members = [{ userId: actor, isAdmin: true, isActive: true }];
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `move-all-board-${actor}` });
      await Boards.rawCollection().insertMany([
        { _id: from, title: 'From', syncEffectsEnabled: true, members, labels: [{ _id: 'u-from', name: 'Urgent', color: 'red' }] },
        { _id: to, title: 'To', syncEffectsEnabled: true, members, labels: [{ _id: 'u-to', name: 'Urgent', color: 'red' }] },
      ]);
      await Swimlanes.rawCollection().insertMany([{ _id: ids.lane, boardId: from, title: 'Lane', sort: 0, archived: false },
        { _id: ids.toLane, boardId: to, title: 'Default', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: ids.doing, boardId: from, title: 'Doing', archived: false, sort: 0 },
        { _id: ids.other, boardId: from, title: 'Other', archived: false, sort: 1 },
        { _id: ids.done, boardId: to, title: 'Done', archived: false, sort: 0 }]);
      const card = (_id, listId, sort) => ({ _id, boardId: from, listId, swimlaneId: ids.lane, title: _id, sort,
        archived: false, labelIds: ['u-from'] });
      await Cards.rawCollection().insertMany([card(ids.card, ids.doing, 1), card(ids.second, ids.doing, 2),
        card(ids.twin, ids.other, 2)]);
      await Activities.rawCollection().insertOne(activity);
      const actionId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: actionId, boardId: to, actionType: 'moveAllCardsInList',
        fromListName: 'Doing', listName: 'Done' });
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId: from, activityType: 'createCard', listName: 'Doing',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId: from, triggerId, actionId, enabled: true, title: 'All away' });
      const list = { _id: ids.doing, boardId: from, syncRevision: 'rev', syncCredentialIncarnation: 'life' };
      assert.deepEqual(await durableSyncDecision({ list, board: await Boards.findOneAsync(from), trigger: 'manual',
        actorId: actor }), { eligible: true, reason: null });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const moved = await Cards.rawCollection().find({ _id: { $in: [ids.card, ids.second] } }, { sort: { sort: 1 } }).toArray();
      assert.deepEqual(moved.map(c => [c.boardId, c.listId, c.swimlaneId, c.sort, c.labelIds]),
        [[to, ids.done, ids.toLane, 1, ['u-to']], [to, ids.done, ids.toLane, 2, ['u-to']]],
        'that board\'s list and default swimlane, each keeping its sort and its label by name');
      assert.notEqual(moved[0].cardNumber, moved[1].cardNumber);
      const count = () => Activities.rawCollection().countDocuments({ cardId: { $in: [ids.card, ids.second] },
        activityType: 'moveCardBoard' });
      assert.equal(await count(), 2, 'one moveCardBoard activity each');
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: { $in: [ids.card, ids.second] },
        group: 'position' }), 2);
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay, with the rule card on the other board');
      assert.equal(await count(), 2);
      assert.equal(await SyncRuleMoveAllBoardCommands.rawCollection().countDocuments({ boardId: from }), 1);

      // Parity: the ordinary action's own call for a card of another list.
      const twin = await Cards.findOneAsync(ids.twin);
      await DDP._CurrentMethodInvocation.withValue(context, () => twin.move(to, twin.swimlaneId, ids.done));
      const ordinary = await Cards.rawCollection().findOne({ _id: ids.twin });
      const comparable = doc => Object.fromEntries(Object.entries(doc).filter(([key]) => !['_id', 'title', 'cardNumber',
        'listEnteredAt', 'modifiedAt', 'dateLastActivity', 'createdAt'].includes(key)));
      assert.deepEqual(comparable(moved[1]), comparable(ordinary), 'the durable move is the ordinary move');
    } finally {
      for (const board of [from, to]) {
        const plans = await SyncRulePlans.rawCollection().find({ 'plan.boardId': board }, { projection: { _id: 1 } }).toArray();
        await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
        await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': board });
        for (const model of [SyncRuleMoveAllBoardCommands, Rules, Triggers, Actions, ChangeHistory, UserPositionHistory,
          Activities, Cards, Lists, Swimlanes]) {
          await model.rawCollection().deleteMany({ boardId: board });
        }
      }
      await Activities.rawCollection().deleteMany({ cardId: { $in: [ids.card, ids.second, ids.twin] } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await Boards.rawCollection().deleteMany({ _id: { $in: [from, to] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });

  // 2026-10-03: the plan's later actions follow the card to the other board,
  // as the ordinary engine's do.
  it('lets later actions act on the moved card on its new board, once', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), from = Random.id(), to = Random.id();
    const ids = { list: Random.id(), lane: Random.id(), inbox: Random.id(), toLane: Random.id(), card: Random.id(),
      activity: Random.id() };
    const activity = { _id: ids.activity, activityType: 'createCard', boardId: from, listId: ids.list, cardId: ids.card,
      userId: actor, cardTitle: 'Pump', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000),
      modifiedAt: new Date(1000) };
    const input = { activity, effectId: '6'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    const members = [{ userId: actor, isAdmin: true, isActive: true }];
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `follow-${actor}` });
      await Boards.rawCollection().insertMany([{ _id: from, title: 'From', syncEffectsEnabled: true, members },
        { _id: to, title: 'To', syncEffectsEnabled: true, members }]);
      await Swimlanes.rawCollection().insertMany([{ _id: ids.lane, boardId: from, title: 'Lane', sort: 0, archived: false },
        { _id: ids.toLane, boardId: to, title: 'Lane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: ids.list, boardId: from, title: 'List', archived: false },
        { _id: ids.inbox, boardId: to, title: 'Inbox', archived: false }]);
      await Cards.rawCollection().insertOne({ _id: ids.card, boardId: from, listId: ids.list, swimlaneId: ids.lane,
        title: 'Pump', sort: 0, archived: false });
      await Activities.rawCollection().insertOne(activity);
      const [moveId, colorId, checklistId, triggerId] = [Random.id(), Random.id(), Random.id(), Random.id()];
      await Actions.rawCollection().insertMany([
        { _id: moveId, boardId: to, actionType: 'moveCardToBottom', listName: 'Inbox', swimlaneName: 'Lane' },
        { _id: colorId, boardId: from, actionType: 'setColor', selectedColor: 'green' },
        { _id: checklistId, boardId: from, actionType: 'addChecklist', checklistName: 'Steps' }]);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId: from, activityType: 'createCard', listName: 'List',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId: from, triggerId, actionId: moveId,
        extraActionIds: [colorId, checklistId], enabled: true, title: 'Move, colour, checklist' });
      const list = { _id: ids.list, boardId: from, syncRevision: 'rev', syncCredentialIncarnation: 'life' };
      assert.deepEqual(await durableSyncDecision({ list, board: await Boards.findOneAsync(from), trigger: 'manual',
        actorId: actor }), { eligible: true, reason: null }, 'colour and checklist can follow the card');

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const card = await Cards.rawCollection().findOne({ _id: ids.card });
      assert.deepEqual([card.boardId, card.listId, card.color], [to, ids.inbox, 'green'], 'moved, then coloured there');
      const checklists = await Checklists.rawCollection().find({ cardId: ids.card }).toArray();
      assert.deepEqual(checklists.map(c => [c.title, c.boardId]), [['Steps', to]], 'the checklist on its new board');
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: ids.card, group: 'title', boardId: to }), 1,
        'the colour row where the card is');
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: ids.card, activityType: 'addChecklist',
        boardId: to }), 1);
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await Checklists.rawCollection().countDocuments({ cardId: ids.card }), 1);
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: ids.card, group: 'title' }), 1);
    } finally {
      for (const board of [from, to]) {
        const plans = await SyncRulePlans.rawCollection().find({ 'plan.boardId': board }, { projection: { _id: 1 } }).toArray();
        await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
        await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': board });
        for (const model of [SyncRuleMoveBoardCommands, SyncRuleCardCommands, Rules, Triggers, Actions, ChangeHistory,
          UserPositionHistory, Activities, Checklists, ChecklistItems, Cards, Lists, Swimlanes]) {
          await model.rawCollection().deleteMany({ boardId: board });
        }
      }
      await Activities.rawCollection().deleteMany({ cardId: ids.card });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await Boards.rawCollection().deleteMany({ _id: { $in: [from, to] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
