import assert from 'node:assert/strict';
import { sweepUntil } from './sweepUntil';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import { MongoInternals } from 'meteor/mongo';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Swimlanes from '/models/swimlanes';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import Rules from '/models/rules';
import Actions from '/models/actions';
import Triggers from '/models/triggers';
import { syncOneList } from '/server/listSync';
import { durableSyncDecision, replayStoredListSync } from '/server/lib/listSyncApplication';
import { runStoredSyncRuleArchive } from '/server/notifications/storedRulePlans';
const { createSyncRuleArchiveRetention } = require('/server/lib/syncRuleArchiveRetention');

// The rest of the Scrum/Sync handoff (maintainer decision of 2026-09-30):
// manual and scheduled Sync write through the durable journal, and an
// interrupted run resumes from its saved plan, without duplicates.
describe('Durable list Sync', function () {
  this.timeout(60000);
  it('creates, updates and archives through the journal and resumes after an interruption', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), laneId = Random.id();
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const as = work => DDP._CurrentMethodInvocation.withValue(context, work);
    const collection = name => MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection(name);
    let issues = [];
    const fetchers = { jira: async () => ({ startAt: 0, total: issues.length, issues }) };
    const issue = (key, summary) => ({ key, fields: { summary, description: '', status: { name: 'Open' } } });
    const run = () => as(async () => syncOneList(await Lists.findOneAsync(listId), { fetchers, previewConflicts: true }));
    const cards = () => Cards.find({ listId }, { transform: null }).fetchAsync();
    const originalUpdate = Cards.updateAsync;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `sync-${actor}`, profile: {} });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Durable Sync', permission: 'private', archived: false,
        syncEffectsEnabled: true, members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Swimlanes.rawCollection().insertOne({ _id: laneId, boardId, title: 'Lane', archived: false, sort: 0 });
      // A list inserted by the server has a lifetime (models/lists.js autoValue).
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'Watched', archived: false, sort: 0, swimlaneId: laneId,
        syncCredentialIncarnation: Random.id() });
      await as(() => Meteor.server.method_handlers.setListSyncSource.apply(context,
        [listId, { type: 'jira', url: 'https://jira.example.org', projectKey: 'P', token: 'token' }]));
      const list = await Lists.findOneAsync(listId);
      assert.ok(list.syncRevision && list.syncCredentialIncarnation, 'saving settings gives the list a versioned scope');
      assert.deepEqual(await durableSyncDecision({ list, board: await Boards.findOneAsync(boardId), trigger: 'manual', actorId: actor }),
        { eligible: true, reason: null });

      // Create.
      issues = [issue('P-1', 'First'), issue('P-2', 'Second')];
      assert.deepEqual(await run(), { created: 2, updated: 0, archived: 0, durable: true });
      let rows = await cards();
      assert.deepEqual(rows.map(card => card.title).sort(), ['[P-1] First', '[P-2] Second']);
      assert.equal(await Activities.find({ boardId, activityType: 'createCard', _id: /^sync-create-/ }).countAsync(), 2,
        'each creation activity is the saved one');
      const completions = collection('listSyncOperationCompletions');
      assert.equal(await completions.countDocuments({ 'scope.listId': listId }), 1);
      assert.equal(await collection('listSyncOperations').countDocuments({ _id: listId }), 0, 'nothing left pending');

      // Update: History and the title activity come from the saved plan.
      issues = [issue('P-1', 'First renamed'), issue('P-2', 'Second')];
      const updated = await run();
      assert.equal(updated.durable, true, JSON.stringify(updated)); assert.equal(updated.updated >= 1, true);
      const first = (await cards()).find(card => card.syncExternalId === 'P-1');
      assert.equal(first.title, '[P-1] First renamed');
      assert.equal(await ChangeHistory.find({ boardId, cardId: first._id, group: 'title' }).countAsync(), 1);
      assert.equal(await Activities.find({ boardId, cardId: first._id, activityType: 'a-changedTitle' }).countAsync(), 1);

      // Archive, interrupted by a crash at the card write.
      issues = [issue('P-1', 'First renamed')];
      Cards.updateAsync = async () => { throw new Error('injected crash'); };
      const interrupted = await run();
      Cards.updateAsync = originalUpdate;
      assert.match(interrupted.error, /resumes automatically/);
      assert.equal(await collection('listSyncOperations').countDocuments({ _id: listId, state: 'applying' }), 1,
        'the saved plan is kept');
      const replay = await replayStoredListSync();
      assert.ok(replay.resumed >= 1, JSON.stringify(replay));
      rows = await cards();
      assert.equal(rows.find(card => card.syncExternalId === 'P-2').archived, true);
      assert.equal(await Activities.find({ boardId, activityType: 'archivedCard' }).countAsync(), 1, 'archived once');
      assert.equal(await collection('listSyncOperations').countDocuments({ _id: listId }), 0);
      assert.equal(await completions.countDocuments({ 'scope.listId': listId }), 3);
      assert.equal(rows.length, 2, 'no duplicate cards');

      // A rule whose action has a durable adapter keeps the durable path:
      // "archive every created card" runs through the stored archive runner,
      // in bounded time (it took 36 s before guards reused recent results).
      const archiveActionId = Random.id(), triggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: archiveActionId, actionType: 'archive', boardId, desc: 'archive' });
      await Triggers.rawCollection().insertOne({ _id: triggerId, activityType: 'createCard', boardId,
        listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*', desc: 'created' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), title: 'archive new', triggerId, actionId: archiveActionId, boardId });
      assert.equal((await durableSyncDecision({ list, board: await Boards.findOneAsync(boardId), trigger: 'manual', actorId: actor })).eligible, true);
      issues = [issue('P-1', 'First renamed'), issue('P-3', 'Archived by rule')];
      const started = Date.now();
      const ruled = await run();
      const elapsed = Date.now() - started;
      assert.deepEqual([ruled.durable, ruled.created], [true, 1], JSON.stringify(ruled));
      assert.equal((await cards()).find(card => card.syncExternalId === 'P-3').archived, true, 'the rule archived it');
      assert.equal(await collection('listSyncRuleArchiveCommands').countDocuments({ boardId }), 1);
      assert.ok(elapsed < 10000, `a rule-archived card took ${elapsed} ms`);
      // Retention (2026-09-30): 90 days after the archive finished, its effects
      // go and the command - card titles included - is compacted in place; a
      // late replay of the rule action returns as done.
      const archiveCommand = await collection('listSyncRuleArchiveCommands').findOne({ boardId });
      const archiveDone = await collection('listSyncRuleArchiveCompletions').findOne({ _id: archiveCommand._id });
      assert.ok(archiveDone.completedAt instanceof Date);
      assert.ok(await sweepUntil(createSyncRuleArchiveRetention({ commands: collection('listSyncRuleArchiveCommands'),
        effects: collection('listSyncRuleArchiveEffects'), completions: collection('listSyncRuleArchiveCompletions'),
        now: () => new Date(archiveDone.completedAt.getTime() + 91 * 86400000) }), async () => (await collection('listSyncRuleArchiveCommands').findOne({ _id: archiveCommand._id }))?.compactReceiptVersion === 1));
      const compactCommand = await collection('listSyncRuleArchiveCommands').findOne({ _id: archiveCommand._id });
      assert.deepEqual(Object.keys(compactCommand).sort(), ['_id', 'checksum', 'compactReceiptVersion', 'invocationId', 'planId']);
      assert.equal(await collection('listSyncRuleArchiveEffects').countDocuments({ _id: archiveCommand._id }), 0);
      const rulePlan = await collection('listSyncRulePlans').findOne({ _id: archiveCommand.planId });
      const ruleActivity = await Activities.rawCollection().findOne({ _id: rulePlan.plan.activityId });
      assert.equal(await runStoredSyncRuleArchive({ activity: ruleActivity, effectId: rulePlan.plan.effectId, index: 0,
        policy: { activities: true, notifications: true }, trigger: 'manual', assertCurrent: async () => {} }),
      rulePlan.plan.actions[0].id);
      await Rules.rawCollection().deleteMany({ boardId }); await Triggers.rawCollection().deleteMany({ boardId });

      // A card-field action is durable too: "label every created card".
      const labelActionId = Random.id(), labelTriggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: labelActionId, actionType: 'addLabel', labelId: 'sync-label', boardId, desc: 'label' });
      await Triggers.rawCollection().insertOne({ _id: labelTriggerId, activityType: 'createCard', boardId,
        listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*', desc: 'created' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), title: 'label new', triggerId: labelTriggerId, actionId: labelActionId, boardId });
      issues = [issue('P-1', 'First renamed'), issue('P-4', 'Labelled by rule')];
      const labelled = await run();
      assert.deepEqual([labelled.durable, labelled.created], [true, 1], JSON.stringify(labelled));
      const fourth = (await cards()).find(card => card.syncExternalId === 'P-4');
      assert.deepEqual(fourth.labelIds, ['sync-label'], 'the rule labelled it');
      assert.equal(await ChangeHistory.find({ cardId: fourth._id, group: 'labels' }).countAsync(), 1, 'one History row, not two');
      assert.equal(await Activities.find({ cardId: fourth._id, activityType: 'addedLabel' }).countAsync(), 1, 'one addedLabel activity');
      assert.equal(await collection('listSyncRuleCardCommands').countDocuments({ boardId }), 1);
      assert.equal(await replayStoredListSync().then(() => Activities.find({ cardId: fourth._id, activityType: 'addedLabel' }).countAsync()), 1);
      await Rules.rawCollection().deleteMany({ boardId }); await Triggers.rawCollection().deleteMany({ boardId });

      // Dates too: "give every created card a due date" - the timing hook's own
      // activity is deferred, so there is exactly one a-dueAt activity.
      const dateActionId = Random.id(), dateTriggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: dateActionId, actionType: 'updateDate', dateField: 'dueAt', boardId, desc: 'due' });
      await Triggers.rawCollection().insertOne({ _id: dateTriggerId, activityType: 'createCard', boardId,
        listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*', desc: 'created' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), title: 'due new', triggerId: dateTriggerId, actionId: dateActionId, boardId });
      issues = [issue('P-1', 'First renamed'), issue('P-5', 'Due by rule')];
      const dated = await run();
      assert.deepEqual([dated.durable, dated.created], [true, 1], JSON.stringify(dated));
      const fifth = (await cards()).find(card => card.syncExternalId === 'P-5');
      assert.ok(fifth.dueAt instanceof Date, 'the rule set a due date');
      assert.equal(await Activities.find({ cardId: fifth._id, activityType: 'a-dueAt' }).countAsync(), 1, 'one a-dueAt activity');
      assert.equal(await ChangeHistory.find({ cardId: fifth._id, group: 'dates' }).countAsync(), 1, 'one dates History row');
      await Rules.rawCollection().deleteMany({ boardId }); await Triggers.rawCollection().deleteMany({ boardId });

      // Members: "add me to every created card", resolved by username at capture.
      const memberActionId = Random.id(), memberTriggerId = Random.id();
      await Actions.rawCollection().insertOne({ _id: memberActionId, actionType: 'addMember', username: `sync-${actor}`, boardId, desc: 'member' });
      await Triggers.rawCollection().insertOne({ _id: memberTriggerId, activityType: 'createCard', boardId,
        listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*', desc: 'created' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), title: 'member new', triggerId: memberTriggerId, actionId: memberActionId, boardId });
      issues = [issue('P-1', 'First renamed'), issue('P-6', 'Joined by rule')];
      const joined = await run();
      assert.deepEqual([joined.durable, joined.created], [true, 1], JSON.stringify(joined));
      const sixth = (await cards()).find(card => card.syncExternalId === 'P-6');
      assert.deepEqual(sixth.members, [actor], 'the rule added the member');
      assert.equal(await Activities.find({ cardId: sixth._id, activityType: 'joinMember' }).countAsync(), 1, 'one joinMember activity');
      assert.equal(await ChangeHistory.find({ cardId: sixth._id, group: 'members' }).countAsync(), 1, 'one members History row');
      await Rules.rawCollection().deleteMany({ boardId }); await Triggers.rawCollection().deleteMany({ boardId });

      // A rule action without a durable adapter keeps the direct path.
      const actionId = await Actions.insertAsync({ actionType: 'moveCardToTop', boardId, desc: 'top' });
      await Rules.rawCollection().insertOne({ _id: Random.id(), title: 'r', triggerId: Random.id(), actionId, boardId });
      assert.deepEqual(await durableSyncDecision({ list, board: await Boards.findOneAsync(boardId), trigger: 'manual', actorId: actor }),
        { eligible: false, reason: 'rule-actions' });
      issues = [issue('P-1', 'Direct again')];
      const direct = await run();
      assert.equal(direct.durable, undefined, 'the direct path ran');
      assert.equal((await cards()).find(card => card.syncExternalId === 'P-1').title, '[P-1] Direct again');
    } finally {
      Cards.updateAsync = originalUpdate;
      await Cards.rawCollection().deleteMany({ boardId });
      await Activities.rawCollection().deleteMany({ boardId });
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await Rules.rawCollection().deleteMany({ boardId });
      await Triggers.rawCollection().deleteMany({ boardId });
      const commands = await collection('listSyncRuleArchiveCommands').find({ boardId }, { projection: { _id: 1 } }).toArray();
      await collection('listSyncRuleArchiveReceipts').deleteMany({ commandId: { $in: commands.map(row => row._id) } });
      await collection('listSyncRuleArchiveEffects').deleteMany({ _id: { $in: commands.map(row => row._id) } });
      await collection('listSyncRuleArchiveCompletions').deleteMany({ _id: { $in: commands.map(row => row._id) } });
      await collection('listSyncRuleCardCommands').deleteMany({ boardId });
      await collection('listSyncRuleArchiveCommands').deleteMany({ boardId });
      const ruleCompletions = await collection('listSyncRulePlans').find({ 'plan.boardId': boardId }, { projection: { _id: 1 } }).toArray();
      await collection('listSyncRuleCompletions').deleteMany({ _id: { $in: ruleCompletions.map(row => row._id) } });
      // The stored effect plans this run delivered, and their receipts.
      const plans = await collection('listSyncNotificationPlans').find({ 'plan.boardId': boardId }, { projection: { _id: 1 } }).toArray();
      await collection('listSyncNotificationReceipts').deleteMany({ _id: { $in: plans.map(row => row._id) } });
      for (const name of ['listSyncNotificationPlans', 'listSyncWebhookPlans', 'listSyncRulePlans']) {
        await collection(name).deleteMany({ 'plan.boardId': boardId });
      }
      await Actions.rawCollection().deleteMany({ boardId });
      for (const name of ['listSyncOperations', 'listSyncOperationSteps', 'listSyncOperationCompletions', 'listSyncOperationIntents',
        'listSyncCredentials', 'listSyncTargets', 'listSyncRunReports', 'listSyncLeases']) {
        await collection(name).deleteMany({ $or: [{ _id: listId }, { listId }, { 'scope.listId': listId }] });
      }
      await Lists.rawCollection().deleteMany({ _id: listId });
      await Swimlanes.rawCollection().deleteMany({ boardId });
      await Boards.rawCollection().deleteMany({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
