import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Integrations from '/models/integrations';
import Activities from '/models/activities';
import { prepareActivityWebhookPlan } from '/server/notifications/prepareWebhooks';
import { captureStoredSyncWebhookPlan, SyncWebhookPlans } from '/server/notifications/storedWebhooks';
import { getFeatureFlags } from '/models/lib/featureFlags';

describe('Shared webhook plan preparation', function () {
  this.timeout(30000);
  it('captures board/global activity matches and actual rendered bodies without HTTP or activity writes', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), cardId = Random.id(), activityId = Random.id();
    const ids = Array.from({ length: 5 }, () => Random.id());
    const flags = getFeatureFlags(), original = flags.disableNotifications, originalActivities = flags.disableActivities;
    try {
      flags.disableNotifications = false; flags.disableActivities = false;
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `webhook-${actor}`, profile: { language: 'en' } });
      await Boards.rawCollection().insertOne({ _id: boardId, title: 'Webhook board', permission: 'private',
        members: [{ userId: actor, isActive: true, isAdmin: true }], watchers: [] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'Webhook list', watchers: [] });
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, title: 'Original card', userId: actor, watchers: [] });
      const base = { boardId, enabled: true, activities: ['act-createCard'], url: 'https://example.invalid/never-send',
        type: Integrations.Const.ONEWAY, userId: actor, token: 'fixture-token', createdAt: new Date(0) };
      await Integrations.rawCollection().insertMany([
        { ...base, _id: ids[0] },
        { ...base, _id: ids[1], boardId: Integrations.Const.GLOBAL_WEBHOOK_ID, type: Integrations.Const.TWOWAY, activities: ['all'] },
        { ...base, _id: ids[2], enabled: false },
        { ...base, _id: ids[3], activities: ['act-addComment'] },
        { ...base, _id: ids[4], boardId: Random.id() },
      ]);
      const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor, createdAt: new Date() };
      const plan = await prepareActivityWebhookPlan({ activity, assertCurrent: async () => {} });
      assert.deepEqual(plan.targets.map(row => row.integrationId).sort(), ids.slice(0, 2).sort());
      const one = plan.targets.find(row => row.integrationId === ids[0]);
      assert.equal(one.request.language, 'en');
      assert.equal(one.request.headers['X-Wekan-Token'], 'fixture-token');
      assert.match(JSON.parse(one.request.body).text, /Original card/);
      const two = plan.targets.find(row => row.integrationId === ids[1]);
      assert.equal(two.request.is2way, true);
      assert.equal(JSON.parse(two.request.body).cardId, cardId);
      assert.equal(JSON.parse(two.request.body).description, 'act-createCard');
      assert.equal(await Activities.find({ _id: activityId }).countAsync(), 0);
      await Activities.rawCollection().insertOne(activity);
      const input = { activity, policy: { activities: true, notifications: true }, assertCurrent: async () => {} };
      const stored = await captureStoredSyncWebhookPlan(input);
      assert.deepEqual(stored, plan);
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { title: 'Changed' } });
      await Integrations.rawCollection().updateOne({ _id: ids[2] }, { $set: { enabled: true } });
      await Integrations.rawCollection().updateOne({ _id: ids[0] }, { $set: { token: 'changed-token' } });
      assert.deepEqual(await captureStoredSyncWebhookPlan(input), stored, 'saved content and target set never rebuild');
      await assert.rejects(captureStoredSyncWebhookPlan({ ...input, assertCurrent: async () => { throw new Error('lease lost'); } }), /lease lost/);
      await Activities.rawCollection().updateOne({ _id: activityId }, { $set: { activityType: 'changed' } });
      await assert.rejects(captureStoredSyncWebhookPlan(input), /activity-changed/);
      await Activities.rawCollection().updateOne({ _id: activityId }, { $set: { activityType: activity.activityType } });
      assert.match(JSON.parse(one.request.body).text, /Original card/);
      flags.disableNotifications = true;
      await assert.rejects(captureStoredSyncWebhookPlan(input), /policy-changed/);
      assert.deepEqual((await prepareActivityWebhookPlan({ activity, assertCurrent: async () => {} })).targets, []);
      flags.disableNotifications = false;
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { listId: 'moved' } });
      await assert.rejects(prepareActivityWebhookPlan({ activity, assertCurrent: async () => {} }), /context-unavailable/);
      await assert.rejects(captureStoredSyncWebhookPlan(input), /context-unavailable/);
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { listId } });
      await SyncWebhookPlans.rawCollection().updateOne({ 'plan.activityId': activityId }, { $set: { checksum: 'corrupt' } });
      await assert.rejects(captureStoredSyncWebhookPlan(input), /plan-invalid/);
      await assert.rejects(prepareActivityWebhookPlan({ activity, assertCurrent: async () => { throw new Error('lease lost'); } }), /lease lost/);
    } finally {
      flags.disableNotifications = original; flags.disableActivities = originalActivities;
      await SyncWebhookPlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      await Activities.rawCollection().deleteMany({ _id: activityId });
      await Integrations.rawCollection().deleteMany({ _id: { $in: ids } });
      await Cards.rawCollection().deleteMany({ _id: cardId });
      await Lists.rawCollection().deleteMany({ _id: listId });
      await Boards.rawCollection().deleteMany({ _id: boardId });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
