import assert from 'node:assert/strict';
import { sweepUntil } from './sweepUntil';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Activities from '/models/activities';
import Integrations from '/models/integrations';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { captureStoredSyncWebhookPlan, runStoredSyncWebhooks, SyncWebhookPlans, SyncWebhookReceipts,
  SyncWebhookResponses, SyncWebhookCommentPlans, SyncWebhookCommentReceipts, SyncWebhookCompletions } from '/server/notifications/storedWebhooks';
const { createSyncWebhookRetention } = require('/server/lib/syncWebhookRetention');
const { deliverStoredWebhookHttp } = require('/server/lib/syncWebhookHttp');
const { deliveryId, planId } = require('/server/lib/syncWebhookPlan');

describe('Stored Sync webhook delivery', function () {
  this.timeout(30000);
  it('resumes actual persisted HTTP/comment stages and refuses revoked actor, integration or reply access', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), cardId = Random.id(), commentId = Random.id();
    const activityId = Random.id(), hookId = Random.id(), id = deliveryId(activityId, hookId);
    const flags = getFeatureFlags(), original = { activities: flags.disableActivities, notifications: flags.disableNotifications };
    try {
      flags.disableActivities = false; flags.disableNotifications = false;
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `delivery-${actor}`, profile: { language: 'en' } });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Delivery', permission: 'private', watchers: [],
        members: [{ userId: actor, isActive: true, isAdmin: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List', watchers: [] });
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, title: 'Card', userId: actor, assignees: [actor], watchers: [] });
      await CardComments.rawCollection().insertOne({ _id: commentId, boardId, cardId, userId: 'another-author',
        text: 'Before', createdAt: new Date(0), modifiedAt: new Date(1) });
      await Integrations.rawCollection().insertOne({ _id: hookId, boardId, enabled: true, activities: ['act-createCard'],
        type: Integrations.Const.TWOWAY, userId: actor, url: 'https://unreachable.invalid/hook', token: 'original', createdAt: new Date(0) });
      const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor, createdAt: new Date() };
      await Activities.rawCollection().insertOne(activity);
      const input = { activity, policy: { activities: true, notifications: true }, trigger: 'manual', assertCurrent: async () => {} };
      const plan = await captureStoredSyncWebhookPlan(input), target = plan.targets.find(row => row.integrationId === hookId);
      // Model a crash after HTTP acceptance but before reply application. The
      // subsequent production entry point has no injected transport or writer.
      await assert.rejects(deliverStoredWebhookHttp({ item: { activity, target, deliveryId: id,
        request: { ...target.request, headers: { ...target.request.headers, 'X-Wekan-Delivery-Id': id } } },
        responses: SyncWebhookResponses.rawCollection(), assertCurrent: async () => {}, assertTarget: async () => true,
        requestHttp: async () => ({ status: 200, text: async () => JSON.stringify({ boardId, cardId, commentId, comment: 'Captured reply' }) }),
        completeResponse: async () => { throw new Error('interrupted reply'); } }), /interrupted reply/);
      await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { restrictCommentEditing: true } });
      await assert.rejects(runStoredSyncWebhooks(input), /comment-access-denied/);
      assert.equal((await CardComments.rawCollection().findOne({ _id: commentId })).text, 'Before');
      assert.equal(await SyncWebhookReceipts.find({ _id: id }).countAsync(), 0);
      await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { restrictCommentEditing: false } });
      assert.equal(await runStoredSyncWebhooks(input), planId(activityId));
      const updated = await CardComments.rawCollection().findOne({ _id: commentId });
      assert.equal(updated.text, 'Captured reply'); assert.equal(Object.hasOwn(updated, 'webhookResponsePending'), false);
      assert.equal(await SyncWebhookCommentReceipts.find({ _id: id }).countAsync(), 1);
      assert.equal(await SyncWebhookReceipts.find({ _id: id }).countAsync(), 1);
      await CardComments.rawCollection().updateOne({ _id: commentId }, { $set: { text: 'Later human edit' } });
      await runStoredSyncWebhooks(input);
      assert.equal((await CardComments.rawCollection().findOne({ _id: commentId })).text, 'Later human edit');
      await Integrations.rawCollection().updateOne({ _id: hookId }, { $set: { token: 'rotated' } });
      await assert.rejects(runStoredSyncWebhooks(input), /target-denied/);
      await Integrations.rawCollection().updateOne({ _id: hookId }, { $set: { token: 'original' } });
      await Meteor.users.rawCollection().updateOne({ _id: actor }, { $set: { loginDisabled: true } });
      await assert.rejects(runStoredSyncWebhooks(input), /actor-denied/);
      await Meteor.users.rawCollection().updateOne({ _id: actor }, { $unset: { loginDisabled: '' } });
      await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { 'members.0.isActive': false } });
      await assert.rejects(runStoredSyncWebhooks(input), /actor-denied/);
      await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { 'members.0.isActive': true, 'members.0.isAdmin': false, 'members.0.isNormalAssignedOnly': true } });
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { assignees: [] } });
      await assert.rejects(runStoredSyncWebhooks(input), /actor-denied/);
      // A fresh one-way attempt still goes through the actual network guard.
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { assignees: [actor] } });
      // Retention (2026-09-30): 90 days after every target was delivered, the
      // reply and comment-plan rows go and the plan - URL and token included -
      // is compacted in place; a late replay returns as delivered.
      const completion = await SyncWebhookCompletions.rawCollection().findOne({ _id: planId(activityId) });
      assert.ok(completion.completedAt instanceof Date);
      assert.equal(await SyncWebhookResponses.find({ _id: id }).countAsync(), 1, 'the reply is kept while the plan is');
      const past90 = new Date(completion.completedAt.getTime() + 91 * 86400000);
      assert.ok(await sweepUntil(createSyncWebhookRetention({ plans: SyncWebhookPlans.rawCollection(),
        receipts: SyncWebhookCompletions.rawCollection(), responses: SyncWebhookResponses.rawCollection(),
        commentPlans: SyncWebhookCommentPlans.rawCollection(), now: () => past90 }), async () => (await SyncWebhookPlans.rawCollection().findOne({ _id: planId(activityId) }))?.compactReceiptVersion === 1));
      const compact = await SyncWebhookPlans.rawCollection().findOne({ _id: planId(activityId) });
      assert.equal(compact.compactReceiptVersion, 1);
      assert.ok(!JSON.stringify(compact).includes('unreachable.invalid') && !JSON.stringify(compact).includes('original'),
        'the URL and the token are gone');
      assert.deepEqual([await SyncWebhookResponses.find({ _id: id }).countAsync(), await SyncWebhookCommentPlans.find({ _id: id }).countAsync(),
        await SyncWebhookReceipts.find({ _id: id }).countAsync(), await SyncWebhookCommentReceipts.find({ _id: id }).countAsync()], [0, 0, 1, 1]);
      assert.equal(await runStoredSyncWebhooks(input), planId(activityId), 'a late replay returns as delivered');
      assert.equal((await CardComments.rawCollection().findOne({ _id: commentId })).text, 'Later human edit');
      await SyncWebhookCompletions.rawCollection().deleteMany({ _id: planId(activityId) });
      await Integrations.rawCollection().updateOne({ _id: hookId }, { $set: { type: Integrations.Const.ONEWAY, url: 'http://127.0.0.1/hook' } });
      await SyncWebhookPlans.rawCollection().deleteMany({ _id: planId(activityId) });
      await SyncWebhookReceipts.rawCollection().deleteMany({ _id: id });
      await SyncWebhookResponses.rawCollection().deleteMany({ _id: id });
      await assert.rejects(runStoredSyncWebhooks(input), /Blocked IP/);
      assert.equal(await SyncWebhookReceipts.find({ _id: id }).countAsync(), 0);
      assert.equal(await SyncWebhookResponses.find({ _id: id }).countAsync(), 0);
    } finally {
      flags.disableActivities = original.activities; flags.disableNotifications = original.notifications;
      await SyncWebhookPlans.rawCollection().deleteMany({ _id: planId(activityId) });
      await SyncWebhookCompletions.rawCollection().deleteMany({ _id: planId(activityId) });
      for (const collection of [SyncWebhookReceipts, SyncWebhookResponses, SyncWebhookCommentPlans, SyncWebhookCommentReceipts]) {
        await collection.rawCollection().deleteMany({ _id: id });
      }
      await Integrations.rawCollection().deleteMany({ _id: hookId });
      await Activities.rawCollection().deleteMany({ _id: activityId });
      await CardComments.rawCollection().deleteMany({ _id: commentId });
      await Cards.rawCollection().deleteMany({ _id: cardId }); await Lists.rawCollection().deleteMany({ _id: listId });
      await Boards.rawCollection().deleteMany({ _id: boardId }); await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
