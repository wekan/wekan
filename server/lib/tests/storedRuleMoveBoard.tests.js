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
import { RulesHelper } from '/server/rulesHelper';

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

      // Sorting and archiving follow the card to the other board since the
      // decision of 2026-10-03 (they resolve where it went)...
      const sortId = Random.id(), archiveId = Random.id(), emailId = Random.id();
      await Actions.rawCollection().insertMany([{ _id: sortId, boardId: from, actionType: 'sortList', listName: '*' },
        { _id: archiveId, boardId: from, actionType: 'archive' },
        { _id: emailId, boardId: from, actionType: 'sendEmail', emailTo: 'a@example.com', emailSubject: 'S', emailMsg: 'M' }]);
      await Rules.rawCollection().updateOne({ _id: ruleId }, { $set: { extraActionIds: [sortId] } });
      assert.deepEqual(await decide(), { eligible: true, reason: null }, 'sorting can follow it');
      // ...and so does an email, in its rule or in another of its trigger type,
      // since the later decision of 2026-10-03: it reads the card where this
      // plan's own move put it (the email test below).
      await Rules.rawCollection().updateOne({ _id: ruleId }, { $set: { extraActionIds: [emailId] } });
      assert.deepEqual(await decide(), { eligible: true, reason: null }, 'an email can follow it');
      await Rules.rawCollection().updateOne({ _id: ruleId }, { $unset: { extraActionIds: '' } });
      const otherRule = Random.id(), otherTrigger = Random.id();
      await Triggers.rawCollection().insertOne({ _id: otherTrigger, boardId: from, activityType: 'createCard', listName: '*',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: otherRule, boardId: from, triggerId: otherTrigger, actionId: archiveId,
        enabled: true, title: 'Archive' });
      assert.deepEqual(await decide(), { eligible: true, reason: null }, 'archiving may run after it');
      await Rules.rawCollection().updateOne({ _id: otherRule }, { $set: { actionId: emailId } });
      assert.deepEqual(await decide(), { eligible: true, reason: null }, 'an email may run after it');
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

  it('resolves a later move, sort, move-all and archive on the board the card went to, durable and ordinary alike', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), from = Random.id(), to = Random.id();
    const ids = { list: Random.id(), lane: Random.id(), inbox: Random.id(), done: Random.id(), toLane: Random.id(),
      card: Random.id(), twin: Random.id(), other: Random.id(), activity: Random.id(), twinActivity: Random.id() };
    const activity = (id, cardId, title) => ({ _id: id, activityType: 'createCard', boardId: from, listId: ids.list, cardId,
      userId: actor, cardTitle: title, listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) });
    const input = { activity: activity(ids.activity, ids.card, 'Pump'), effectId: '5'.repeat(64),
      policy: { activities: true, notifications: true }, trigger: 'manual', assertCurrent: async () => {} };
    const members = [{ userId: actor, isAdmin: true, isActive: true }];
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `there-${actor}` });
      await Boards.rawCollection().insertMany([{ _id: from, title: 'From', syncEffectsEnabled: true, members },
        { _id: to, title: 'To', syncEffectsEnabled: true, members }]);
      await Swimlanes.rawCollection().insertMany([{ _id: ids.lane, boardId: from, title: 'Lane', sort: 0, archived: false },
        { _id: ids.toLane, boardId: to, title: 'Lane', sort: 0, archived: false }]);
      // Only the board the card goes to has a Done list.
      await Lists.rawCollection().insertMany([{ _id: ids.list, boardId: from, title: 'List', archived: false },
        { _id: ids.inbox, boardId: to, title: 'Inbox', archived: false }, { _id: ids.done, boardId: to, title: 'Done', archived: false }]);
      await Cards.rawCollection().insertMany([
        { _id: ids.card, boardId: from, listId: ids.list, swimlaneId: ids.lane, title: 'Pump', sort: 0, archived: false },
        { _id: ids.twin, boardId: from, listId: ids.list, swimlaneId: ids.lane, title: 'Twin', sort: 1, archived: false },
        { _id: ids.other, boardId: to, listId: ids.done, swimlaneId: ids.toLane, title: 'Already done', sort: 7, archived: false }]);
      await Activities.rawCollection().insertOne(input.activity);
      const [moveId, topId, sortId, allId, archiveId, triggerId] = Array.from({ length: 6 }, () => Random.id());
      await Actions.rawCollection().insertMany([
        { _id: moveId, boardId: to, actionType: 'moveCardToBottom', listName: 'Inbox', swimlaneName: 'Lane' },
        // These name the rule's own board: they resolve where the card is now.
        { _id: topId, boardId: from, actionType: 'moveCardToTop', listName: 'Done', swimlaneName: '*' },
        { _id: sortId, boardId: from, actionType: 'sortList', listName: '*', sortField: 'title' },
        { _id: allId, boardId: from, actionType: 'moveAllCardsInList', fromListName: 'Done', listName: 'Inbox' },
        { _id: archiveId, boardId: from, actionType: 'archive' }]);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId: from, activityType: 'createCard', listName: 'List',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId: from, triggerId, actionId: moveId,
        extraActionIds: [topId, sortId, allId, archiveId], enabled: true, title: 'Move there, then work there' });
      const list = { _id: ids.list, boardId: from, syncRevision: 'rev', syncCredentialIncarnation: 'life' };
      assert.deepEqual(await durableSyncDecision({ list, board: await Boards.findOneAsync(from), trigger: 'manual',
        actorId: actor }), { eligible: true, reason: null }, 'everything after the move can follow the card');

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const card = await Cards.rawCollection().findOne({ _id: ids.card });
      // Moved to Inbox, to the top of Done there, sorted with the card already
      // done, every Done card moved to Inbox there, and archived there.
      assert.deepEqual([card.boardId, card.listId, card.swimlaneId, card.archived], [to, ids.inbox, ids.toLane, true]);
      const other = await Cards.rawCollection().findOne({ _id: ids.other });
      assert.deepEqual([other.boardId, other.listId], [to, ids.inbox], 'the move-all ran on the board the card went to');
      assert.equal(await Lists.rawCollection().countDocuments({ boardId: from, title: 'Done' }), 0);
      const positions = await ChangeHistory.rawCollection().countDocuments({ entityId: ids.card, group: 'position', boardId: to });
      assert.ok(positions >= 3, `position rows on the board it went to: ${positions}`);
      const before = await ChangeHistory.rawCollection().countDocuments({ entityId: ids.card });
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await ChangeHistory.rawCollection().countDocuments({ entityId: ids.card }), before, 'nothing twice');

      // Parity: the ordinary engine, action by action, on a twin card.
      await Cards.rawCollection().updateOne({ _id: ids.other }, { $set: { listId: ids.done } });
      const twinActivity = activity(ids.twinActivity, ids.twin, 'Twin');
      for (const actionId of [moveId, topId, sortId, allId, archiveId]) {
        await RulesHelper.performAction(twinActivity, await Actions.findOneAsync(actionId));
      }
      const twin = await Cards.rawCollection().findOne({ _id: ids.twin });
      assert.deepEqual([twin.boardId, twin.listId, twin.swimlaneId, twin.archived], [to, ids.inbox, ids.toLane, true],
        'the ordinary engine resolves where the card went, too');
      assert.equal((await Cards.rawCollection().findOne({ _id: ids.other })).listId, ids.inbox);
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
      await Activities.rawCollection().deleteMany({ cardId: { $in: [ids.card, ids.twin] } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await Boards.rawCollection().deleteMany({ _id: { $in: [from, to] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });

  it('moves on to a third board after a move to another, and the rest follows, durable and ordinary alike', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), a = Random.id(), b = Random.id(), c = Random.id();
    const ids = { list: Random.id(), lane: Random.id(), bInbox: Random.id(), bLane: Random.id(), cInbox: Random.id(),
      cLane: Random.id(), card: Random.id(), twin: Random.id(), activity: Random.id(), twinActivity: Random.id() };
    const activity = (id, cardId, title) => ({ _id: id, activityType: 'createCard', boardId: a, listId: ids.list, cardId,
      userId: actor, cardTitle: title, listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) });
    const input = { activity: activity(ids.activity, ids.card, 'Pump'), effectId: '4'.repeat(64),
      policy: { activities: true, notifications: true }, trigger: 'manual', assertCurrent: async () => {} };
    const members = [{ userId: actor, isAdmin: true, isActive: true }];
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `chain-${actor}` });
      await Boards.rawCollection().insertMany([{ _id: a, title: 'A', syncEffectsEnabled: true, members },
        { _id: b, title: 'B', syncEffectsEnabled: true, members }, { _id: c, title: 'C', syncEffectsEnabled: true, members }]);
      await Swimlanes.rawCollection().insertMany([{ _id: ids.lane, boardId: a, title: 'Lane', sort: 0, archived: false },
        { _id: ids.bLane, boardId: b, title: 'Lane', sort: 0, archived: false },
        { _id: ids.cLane, boardId: c, title: 'Lane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: ids.list, boardId: a, title: 'List', archived: false },
        { _id: ids.bInbox, boardId: b, title: 'Inbox', archived: false }, { _id: ids.cInbox, boardId: c, title: 'Inbox', archived: false }]);
      await Cards.rawCollection().insertMany([
        { _id: ids.card, boardId: a, listId: ids.list, swimlaneId: ids.lane, title: 'Pump', sort: 0, archived: false },
        { _id: ids.twin, boardId: a, listId: ids.list, swimlaneId: ids.lane, title: 'Twin', sort: 1, archived: false }]);
      await Activities.rawCollection().insertOne(input.activity);
      const [toB, toC, colorId, triggerId] = [Random.id(), Random.id(), Random.id(), Random.id()];
      await Actions.rawCollection().insertMany([
        { _id: toB, boardId: b, actionType: 'moveCardToBottom', listName: 'Inbox', swimlaneName: 'Lane' },
        { _id: toC, boardId: c, actionType: 'moveCardToTop', listName: 'Inbox', swimlaneName: '*' },
        { _id: colorId, boardId: a, actionType: 'setColor', selectedColor: 'green' }]);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId: a, activityType: 'createCard', listName: 'List',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId: a, triggerId, actionId: toB,
        extraActionIds: [toC, colorId], enabled: true, title: 'A to B to C' });
      const list = { _id: ids.list, boardId: a, syncRevision: 'rev', syncCredentialIncarnation: 'life' };
      const decide = async () => durableSyncDecision({ list, board: await Boards.findOneAsync(a), trigger: 'manual', actorId: actor });
      // NEGATIVE: a third board that did not opt in keeps the chain on direct Sync.
      await Boards.rawCollection().updateOne({ _id: c }, { $set: { syncEffectsEnabled: false } });
      assert.equal((await decide()).eligible, false, 'C has not opted in');
      await Boards.rawCollection().updateOne({ _id: c }, { $set: { syncEffectsEnabled: true } });
      assert.deepEqual(await decide(), { eligible: true, reason: null }, 'every board of the chain opted in');

      assert.equal(await runStoredSyncRules(input), input.effectId);
      const card = await Cards.rawCollection().findOne({ _id: ids.card });
      assert.deepEqual([card.boardId, card.listId, card.swimlaneId, card.color], [c, ids.cInbox, ids.cLane, 'green']);
      const moves = await Activities.rawCollection().find({ cardId: ids.card, activityType: 'moveCardBoard' }, { sort: { createdAt: 1 } }).toArray();
      assert.deepEqual(moves.map(m => [m.oldBoardId, m.boardId]).sort(), [[a, b], [b, c]].sort(), 'A to B, then B to C');
      const second = await SyncRuleMoveBoardCommands.rawCollection().findOne({ cardId: ids.card, targetBoardId: c });
      assert.equal(second.fromBoard, b, 'the second move saved the board it left');
      const first = await SyncRuleMoveBoardCommands.rawCollection().findOne({ cardId: ids.card, targetBoardId: b });
      assert.equal('fromBoard' in first, false, 'a move from the plan board saves none, as before');
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: ids.card, activityType: 'moveCardBoard' }), 2);

      // Parity: the ordinary engine on a twin card.
      const twinActivity = activity(ids.twinActivity, ids.twin, 'Twin');
      for (const actionId of [toB, toC, colorId]) await RulesHelper.performAction(twinActivity, await Actions.findOneAsync(actionId));
      const twin = await Cards.rawCollection().findOne({ _id: ids.twin });
      assert.deepEqual([twin.boardId, twin.listId, twin.swimlaneId, twin.color], [c, ids.cInbox, ids.cLane, 'green']);
    } finally {
      for (const board of [a, b, c]) {
        const plans = await SyncRulePlans.rawCollection().find({ 'plan.boardId': board }, { projection: { _id: 1 } }).toArray();
        await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
        await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': board });
        for (const model of [SyncRuleMoveBoardCommands, SyncRuleCardCommands, Rules, Triggers, Actions, ChangeHistory,
          UserPositionHistory, Activities, Checklists, ChecklistItems, Cards, Lists, Swimlanes]) {
          await model.rawCollection().deleteMany({ boardId: board });
        }
      }
      await SyncRuleMoveBoardCommands.rawCollection().deleteMany({ cardId: ids.card });
      await Activities.rawCollection().deleteMany({ cardId: { $in: [ids.card, ids.twin] } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await Boards.rawCollection().deleteMany({ _id: { $in: [a, b, c] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });

  it('moves every card of the list the card went to on to a third board, durable and ordinary alike', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), a = Random.id(), b = Random.id(), c = Random.id();
    const ids = { list: Random.id(), lane: Random.id(), bInbox: Random.id(), bLane: Random.id(), cInbox: Random.id(),
      cLane: Random.id(), card: Random.id(), twin: Random.id(), waiting: Random.id(), activity: Random.id(), twinActivity: Random.id() };
    const activity = (id, cardId, title) => ({ _id: id, activityType: 'createCard', boardId: a, listId: ids.list, cardId,
      userId: actor, cardTitle: title, listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) });
    const input = { activity: activity(ids.activity, ids.card, 'Pump'), effectId: '3'.repeat(64),
      policy: { activities: true, notifications: true }, trigger: 'manual', assertCurrent: async () => {} };
    const members = [{ userId: actor, isAdmin: true, isActive: true }];
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `all-chain-${actor}` });
      await Boards.rawCollection().insertMany([{ _id: a, title: 'A', syncEffectsEnabled: true, members },
        { _id: b, title: 'B', syncEffectsEnabled: true, members }, { _id: c, title: 'C', syncEffectsEnabled: true, members }]);
      await Swimlanes.rawCollection().insertMany([{ _id: ids.lane, boardId: a, title: 'Lane', sort: 0, archived: false },
        { _id: ids.bLane, boardId: b, title: 'Lane', sort: 0, archived: false },
        { _id: ids.cLane, boardId: c, title: 'Default', type: 'swimlane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: ids.list, boardId: a, title: 'List', archived: false },
        { _id: ids.bInbox, boardId: b, title: 'Inbox', archived: false }, { _id: ids.cInbox, boardId: c, title: 'Inbox', archived: false }]);
      await Cards.rawCollection().insertMany([
        { _id: ids.card, boardId: a, listId: ids.list, swimlaneId: ids.lane, title: 'Pump', sort: 0, archived: false },
        { _id: ids.waiting, boardId: b, listId: ids.bInbox, swimlaneId: ids.bLane, title: 'Waiting on B', sort: 5, archived: false }]);
      await Activities.rawCollection().insertOne(input.activity);
      const [toB, allToC, triggerId] = [Random.id(), Random.id(), Random.id()];
      await Actions.rawCollection().insertMany([
        { _id: toB, boardId: b, actionType: 'moveCardToBottom', listName: 'Inbox', swimlaneName: 'Lane' },
        { _id: allToC, boardId: c, actionType: 'moveAllCardsInList', fromListName: 'Inbox', listName: 'Inbox' }]);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId: a, activityType: 'createCard', listName: 'List',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), boardId: a, triggerId, actionId: toB, extraActionIds: [allToC],
        enabled: true, title: 'To B, then all of its Inbox to C' });
      const list = { _id: ids.list, boardId: a, syncRevision: 'rev', syncCredentialIncarnation: 'life' };
      assert.deepEqual(await durableSyncDecision({ list, board: await Boards.findOneAsync(a), trigger: 'manual', actorId: actor }),
        { eligible: true, reason: null });

      assert.equal(await runStoredSyncRules(input), input.effectId);
      for (const id of [ids.card, ids.waiting]) {
        const card = await Cards.rawCollection().findOne({ _id: id });
        assert.deepEqual([card.boardId, card.listId], [c, ids.cInbox], `${id} on C`);
      }
      const command = await SyncRuleMoveAllBoardCommands.rawCollection().findOne({ targetBoardId: c });
      assert.deepEqual([command.fromBoard, command.units.length], [b, 2], 'from B, the list the card went to');
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(await Activities.rawCollection().countDocuments({ cardId: ids.waiting, activityType: 'moveCardBoard' }), 1);

      // Parity: the ordinary engine, with the twin and the waiting card on B.
      await Cards.rawCollection().insertOne({ _id: ids.twin, boardId: a, listId: ids.list, swimlaneId: ids.lane, title: 'Twin',
        sort: 1, archived: false });
      await Cards.rawCollection().updateOne({ _id: ids.waiting }, { $set: { boardId: b, listId: ids.bInbox, swimlaneId: ids.bLane } });
      const twinActivity = activity(ids.twinActivity, ids.twin, 'Twin');
      for (const actionId of [toB, allToC]) await RulesHelper.performAction(twinActivity, await Actions.findOneAsync(actionId));
      for (const id of [ids.twin, ids.waiting]) {
        const card = await Cards.rawCollection().findOne({ _id: id });
        assert.deepEqual([card.boardId, card.listId], [c, ids.cInbox], `${id} on C, ordinarily`);
      }
    } finally {
      for (const board of [a, b, c]) {
        const plans = await SyncRulePlans.rawCollection().find({ 'plan.boardId': board }, { projection: { _id: 1 } }).toArray();
        await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
        await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': board });
        for (const model of [SyncRuleMoveBoardCommands, SyncRuleMoveAllBoardCommands, SyncRuleCardCommands, Rules, Triggers, Actions,
          ChangeHistory, UserPositionHistory, Activities, Checklists, ChecklistItems, Cards, Lists, Swimlanes]) {
          await model.rawCollection().deleteMany({ boardId: board });
        }
      }
      await SyncRuleMoveBoardCommands.rawCollection().deleteMany({ cardId: ids.card });
      await SyncRuleMoveAllBoardCommands.rawCollection().deleteMany({ targetBoardId: c });
      await Activities.rawCollection().deleteMany({ cardId: { $in: [ids.card, ids.twin, ids.waiting] } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await Boards.rawCollection().deleteMany({ _id: { $in: [a, b, c] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
