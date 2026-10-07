import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Activities from '/models/activities';
import { ActivityNotificationIntents } from '/server/notifications/activityIntents';
import { ActivityNotificationPlans, ActivityNotificationLeases, activityNotificationServices, deliverStoredActivityNotifications } from '/server/notifications/activityPlans';
const { idFor } = require('/server/lib/emailReceiptIdentity');
const { planId } = require('/server/lib/activityNotificationPlan');
import { Notifications } from '/server/notifications/notifications';
import { RulesHelper } from '/server/rulesHelper';
import { getFeatureFlags } from '/models/lib/featureFlags';
const { withSyncActivityDeferred } = require('/server/lib/syncActivityScope');
async function until(predicate) {
  const end = Date.now() + 5000;
  while (Date.now() < end) { if (await predicate()) return; await new Promise(resolve => setTimeout(resolve, 10)); }
  assert.fail('notification hook did not settle');
}
describe('Activity notification intent hooks', function () {
  this.timeout(15000);
  it('stores intent before dispatch, preserves pending failures and suppresses deferred or disabled capture', async function () {
    if (!Meteor.isAppTest) this.skip();
    const ids = Array.from({ length: 4 }, () => Random.id()), intentIds = [], intentOf = {};
    const flags = getFeatureFlags(), previousFlags = { ...flags };
    const oldRules = RulesHelper.executeRules, oldUsers = Notifications.getUsers, oldServices = { ...activityNotificationServices };
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let calls = 0;
    const intents = ActivityNotificationIntents.rawCollection();
    try {
      flags.disableActivities = false; flags.disableNotifications = false;
      RulesHelper.executeRules = async () => {};
      await Meteor.users.rawCollection().insertOne({ _id: ids[0], profile: {} });
      Notifications.getUsers = async () => [{ _id: ids[0] }];
      activityNotificationServices.prepareTray = async () => false;
      activityNotificationServices.prepareEmail = async (user, title, description, params) => ({
        userId: user._id, eventId: params.activityId, subject: 'saved', html: 'saved', language: 'en', cardId: null, boardId: null,
      });
      activityNotificationServices.email = async job => {
        const params = { activityId: job.eventId };
        calls++;
        const row = await intents.findOne({ 'activity._id': params.activityId });
        assert.ok(row, 'intent exists before subscriber starts');
        assert.equal(row.state, 'pending'); intentIds.push(row._id); intentOf[params.activityId] = row._id;
        assert.ok(await Activities.findOneAsync(params.activityId));
        await gate;
        if (params.activityId === ids[1]) throw new Error('subscriber write failed');
        return idFor(job.userId, job.eventId);
      };
      const activity = id => ({ _id: id, activityType: 'createCard', cardId: Random.id() });
      await Activities.insertAsync(activity(ids[0]));
      await Activities.insertAsync(activity(ids[1]));
      // The two hooks dispatch concurrently, so either may reach the subscriber
      // first: name each intent by its activity, never by arrival order. The
      // recovery scan (every second) also retries ids[1]'s failing delivery
      // once the gate opens, so later checks must not count on `calls` alone.
      await until(() => intentOf[ids[0]] && intentOf[ids[1]]);
      const completedIntent = intentOf[ids[0]], failingIntent = intentOf[ids[1]];
      assert.equal(await intents.countDocuments({ _id: { $in: [completedIntent, failingIntent] }, state: 'pending' }), 2);
      release();
      await until(async () => (await intents.findOne({ _id: completedIntent }))?.state === 'completed');
      assert.equal((await intents.findOne({ _id: completedIntent })).activity, undefined);
      assert.equal((await intents.findOne({ _id: failingIntent })).state, 'pending');
      await until(async () => !await ActivityNotificationLeases.rawCollection().findOne({ _id: failingIntent }));
      const interrupted = await intents.findOne({ _id: failingIntent });
      const savedPlan = await ActivityNotificationPlans.rawCollection().findOne({ 'plan.activityId': ids[1] });
      assert.equal(savedPlan.plan.recipients[0].email.html, 'saved');
      // Deny the recipient BEFORE the replacement subscriber is installed: the
      // recovery scan retries this pending intent on its own, and must not be
      // able to complete it through the new subscriber in between.
      await Meteor.users.rawCollection().updateOne({ _id: ids[0] }, { $set: { loginDisabled: true } });
      activityNotificationServices.prepareEmail = () => assert.fail('saved plan must not rerender');
      activityNotificationServices.prepareTray = () => assert.fail('saved plan must not reselect services');
      activityNotificationServices.email = async job => {
        calls++; assert.equal(job.html, 'saved'); return idFor(job.userId, job.eventId);
      };
      const retry = () => deliverStoredActivityNotifications(interrupted.activity, interrupted.dispatchUserId,
        () => assert.fail('saved plan must not reselect recipients'));
      // A scan holding the lease at that instant answers sync-busy; that is the
      // lease working, so try again rather than fail on the timing.
      const retryPastScan = async () => {
        for (;;) {
          try { return await retry(); } catch (error) {
            if (error.code !== 'sync-busy') throw error;
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      };
      const before = calls;
      await assert.rejects(retryPastScan(), /recipient-denied/);
      assert.equal(calls, before, 'a denied recipient receives nothing');
      await Meteor.users.rawCollection().updateOne({ _id: ids[0] }, { $set: { loginDisabled: false } });
      await retryPastScan();
      assert.equal((await intents.findOne({ _id: failingIntent })).state, 'completed');
      // Exactly one delivery, whether this retry or a concurrent scan made it.
      assert.equal(calls, before + 1);

      const saved = activity(ids[2]); saved.createdAt = new Date(1000); saved.modifiedAt = saved.createdAt;
      await withSyncActivityDeferred(saved, () => Activities.insertAsync(saved));
      assert.equal(await intents.countDocuments({ 'activity._id': ids[2] }), 0);
      flags.disableNotifications = true;
      await Activities.insertAsync(activity(ids[3]));
      assert.equal(await intents.countDocuments({ 'activity._id': ids[3] }), 0);
      assert.equal(calls, before + 1, 'deferred and disabled activities reach no subscriber');
    } finally {
      release();
      Notifications.getUsers = oldUsers; Object.assign(activityNotificationServices, oldServices);
      RulesHelper.executeRules = oldRules; Object.assign(flags, previousFlags);
      await Meteor.users.rawCollection().deleteOne({ _id: ids[0] });
      await ActivityNotificationPlans.rawCollection().deleteMany({ _id: { $in: ids.map(planId) } });
      await Activities.rawCollection().deleteMany({ _id: { $in: ids } });
      await intents.deleteMany({ $or: [{ _id: { $in: intentIds } }, { 'activity._id': { $in: ids } }] });
    }
  });
  it('failed intent storage aborts the activity before its database write', async function () {
    if (!Meteor.isAppTest) this.skip();
    const id = Random.id(), intents = ActivityNotificationIntents.rawCollection(), original = ActivityNotificationIntents.rawCollection;
    const flags = getFeatureFlags(), previousFlags = { ...flags };
    try {
      flags.disableActivities = false; flags.disableNotifications = false;
      ActivityNotificationIntents.rawCollection = () => ({
        findOne: (...args) => intents.findOne(...args),
        insertOne: async () => { throw new Error('intent storage offline'); },
      });
      await assert.rejects(Activities.insertAsync({ _id: id, activityType: 'createCard' }), /intent storage offline/);
      assert.equal(await Activities.findOneAsync(id), undefined);
      assert.equal(await intents.countDocuments({ 'activity._id': id }), 0);
    } finally {
      ActivityNotificationIntents.rawCollection = original; Object.assign(flags, previousFlags);
      await Activities.rawCollection().deleteOne({ _id: id });
    }
  });
});
