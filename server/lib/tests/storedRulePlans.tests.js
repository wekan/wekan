import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Activities from '/models/activities';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { captureStoredSyncRulePlan, runStoredSyncRules, SyncRulePlans, SyncRuleReceipts } from '/server/notifications/storedRulePlans';

const { planId, actionId: invocationId } = require('/server/lib/syncRulePlan');

describe('Stored Sync rule selection', function () {
  this.timeout(15000);
  it('uses actual matching, preserves saved actions and refuses revoked or changed scope', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), cardId = Random.id(), activityId = Random.id();
    const ruleId = Random.id(), triggerId = Random.id(), actionId = Random.id();
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Original card', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'a'.repeat(64), policy: { activities: true, notifications: true }, assertCurrent: async () => {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: actor });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Board', members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List' });
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, title: 'Original card', assignees: [] });
      await Activities.rawCollection().insertOne(activity);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: ruleId, boardId, triggerId, actionId, enabled: true, title: 'Rule' });
      await Actions.rawCollection().insertOne({ _id: actionId, actionType: 'addLabel', boardId, labelId: 'original' });
      const first = await captureStoredSyncRulePlan(input);
      assert.equal(first.actions.length, 1);
      assert.equal(first.actions[0].rule._id, ruleId);
      assert.equal(first.actions[0].action.labelId, 'original');
      await assert.rejects(runStoredSyncRules({ ...input, adapters: {} }), /adapter-required/);
      await assert.rejects(runStoredSyncRules({ ...input, adapters: { addLabel: async () => true } }), /action-unconfirmed/);
      assert.equal(await SyncRuleReceipts.find({ effectId: input.effectId }).countAsync(), 0);
      let calls = 0;
      assert.equal(await runStoredSyncRules({ ...input, adapters: { addLabel: async ({ invocation, assertCurrent }) => {
        await assertCurrent(); calls++;
        assert.equal(invocation.action.labelId, 'original');
        return invocation.id;
      } } }), input.effectId);
      assert.equal(await runStoredSyncRules({ ...input, adapters: {} }), input.effectId);
      assert.equal(calls, 1);
      assert.equal(await SyncRuleReceipts.find({ effectId: input.effectId }).countAsync(), 2);
      await Actions.rawCollection().updateOne({ _id: actionId }, { $set: { labelId: 'edited' } });
      await Rules.rawCollection().updateOne({ _id: ruleId }, { $set: { enabled: false } });
      assert.deepEqual(await captureStoredSyncRulePlan(input), first);
      const empty = await captureStoredSyncRulePlan({ ...input, effectId: 'b'.repeat(64) });
      assert.deepEqual(empty.actions, []);
      await Rules.rawCollection().updateOne({ _id: ruleId }, { $set: { enabled: true } });
      assert.deepEqual(await captureStoredSyncRulePlan({ ...input, effectId: 'b'.repeat(64) }), empty);
      assert.equal(await runStoredSyncRules({ ...input, effectId: 'b'.repeat(64), adapters: {} }), 'b'.repeat(64));
      assert.deepEqual(await Cards.rawCollection().findOne({ _id: cardId }),
        { _id: cardId, boardId, listId, title: 'Original card', assignees: [] });
      assert.equal(await Activities.rawCollection().countDocuments({ boardId }), 1);
      await Meteor.users.rawCollection().updateOne({ _id: actor }, { $set: { loginDisabled: true } });
      await assert.rejects(captureStoredSyncRulePlan(input), /context-denied/);
      await assert.rejects(runStoredSyncRules({ ...input, adapters: {} }), /context-denied/);
      await Meteor.users.rawCollection().updateOne({ _id: actor }, { $set: { loginDisabled: false } });
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { listId: 'moved' } });
      await assert.rejects(captureStoredSyncRulePlan(input), /context-denied/);
      await assert.rejects(runStoredSyncRules({ ...input, adapters: {} }), /context-denied/);
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { listId } });
      await Activities.rawCollection().updateOne({ _id: activityId }, { $set: { cardTitle: 'changed' } });
      await assert.rejects(captureStoredSyncRulePlan(input), /activity-changed/);
      assert.equal(await SyncRulePlans.find({ 'plan.activityId': activityId }).countAsync(), 2);
    } finally {
      const id = planId(input.effectId, activityId);
      await SyncRuleReceipts.rawCollection().deleteMany({ _id: { $in: [id, invocationId(id, 0), planId('b'.repeat(64), activityId)] } });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      for (const [collection, id] of [[Activities, activityId], [Cards, cardId], [Lists, listId], [Boards, boardId],
        [Rules, ruleId], [Triggers, triggerId], [Actions, actionId], [Meteor.users, actor]]) {
        await collection.rawCollection().deleteOne({ _id: id });
      }
    }
  });
});
