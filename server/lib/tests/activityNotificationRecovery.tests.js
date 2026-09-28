import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Activities from '/models/activities';
import { ActivityNotificationIntents, captureActivityNotificationIntent } from '/server/notifications/activityIntents';
import { ActivityNotificationPlans, ActivityNotificationLeases, ActivityNotificationControls, activityNotificationServices,
  recoverActivityNotifications, resumeActivityNotifications, deliverStoredActivityNotifications } from '/server/notifications/activityPlans';
import { EmailJobs } from '/server/notifications/emailQueue';
const { ensureActivityNotificationPlan, planId } = require('/server/lib/activityNotificationPlan');
const { controlActivityNotification, cancelActivityNotification } = require('/server/lib/activityNotificationControl');
const { idFor } = require('/server/lib/emailReceiptIdentity');

describe('Activity notification recovery', function () {
  this.timeout(15000);
  it('resumes stored email content, suppresses competing owners, and leaves orphans unresolved', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId = Random.id(), activityId = Random.id(), orphanId = Random.id();
    const intents = ActivityNotificationIntents.rawCollection(), leases = ActivityNotificationLeases.rawCollection();
    const activity = { _id: activityId, activityType: 'createCard', userId, createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const saved = { ...activityNotificationServices };
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let calls = 0, intent, orphan;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: userId, profile: { notifyOverrideEmail: true }, loginDisabled: false });
      intent = await captureActivityNotificationIntent(activity, null);
      // This represents an activity committed before the previous process died.
      await Activities.rawCollection().insertOne(activity);
      orphan = await captureActivityNotificationIntent({ ...activity, _id: orphanId }, null);
      await ensureActivityNotificationPlan({ plans: ActivityNotificationPlans.rawCollection(), activity, dispatchUserId: null,
        assertCurrent: async () => {}, build: async () => [{ userId, tray: false,
          email: { userId, eventId: activityId, boardId: null, cardId: null, language: 'fi', subject: 'Frozen subject', html: 'Frozen body' } }] });
      activityNotificationServices.prepareEmail = () => assert.fail('must not rerender stored plan');
      activityNotificationServices.prepareTray = () => assert.fail('must not reselect stored plan');
      activityNotificationServices.email = async job => { calls++; await gate; return saved.email(job); };
      const control = { controls: ActivityNotificationControls.rawCollection(), intents, leases,
        intentId: intent._id, paused: true, expectedRevision: 0, requestId: 'pause-request-123456789',
        actorId: userId, assertAdmin: async () => {} };
      await controlActivityNotification(control);
      await assert.rejects(resumeActivityNotifications(intent._id), /notification-paused/);
      await assert.rejects(deliverStoredActivityNotifications(activity, null,
        () => assert.fail('paused notifications must not prepare context')), /notification-paused/);
      const pausedScan = await recoverActivityNotifications();
      assert.ok(pausedScan.skipped >= 1);
      assert.equal(calls, 0);
      assert.equal(await EmailJobs.rawCollection().findOne({ _id: idFor(userId, activityId) }), null);
      assert.equal((await intents.findOne({ _id: intent._id })).state, 'pending');
      await controlActivityNotification({ ...control, paused: false, expectedRevision: 1,
        requestId: 'resume-request-12345678' });
      let accessChecks = 0;
      await assert.rejects(resumeActivityNotifications(intent._id, {
        assertAllowed: async () => {
          if (++accessChecks > 1) throw new Meteor.Error('not-authorized');
        },
      }), /not-authorized/);
      assert.equal(accessChecks, 2);
      assert.equal(calls, 0, 'revocation inside the reservation prevents delivery');
      assert.equal(await leases.findOne({ _id: intent._id }), null);
      const running = resumeActivityNotifications(intent._id);
      for (let i = 0; calls === 0 && i < 200; i++) await new Promise(resolve => setTimeout(resolve, 10));
      assert.equal(calls, 1);
      await assert.rejects(resumeActivityNotifications(intent._id), { code: 'sync-busy' });
      release(); assert.equal(await running, 'completed');
      assert.equal(await resumeActivityNotifications(intent._id), 'skipped');
      assert.equal(calls, 1);
      assert.equal((await intents.findOne({ _id: intent._id })).state, 'completed');
      const job = await EmailJobs.rawCollection().findOne({ _id: idFor(userId, activityId) });
      assert.equal(job.html, 'Frozen body'); assert.equal(job.language, 'fi');
      await assert.rejects(resumeActivityNotifications(orphan._id), /activity-unconfirmed/);
      assert.equal(await Activities.findOneAsync(orphanId), undefined);
      assert.equal((await intents.findOne({ _id: orphan._id })).state, 'pending');
      assert.ok((await recoverActivityNotifications()).failed >= 1);
      await cancelActivityNotification({ ...control, intentId: orphan._id, expectedRevision: 0,
        requestId: 'cancel-orphan-request-123' });
      assert.ok((await recoverActivityNotifications()).skipped >= 1);
      await assert.rejects(resumeActivityNotifications(orphan._id), /notification-cancelled/);
      assert.equal((await intents.findOne({ _id: orphan._id })).state, 'cancelled');
      assert.equal((await intents.findOne({ _id: orphan._id })).activity, undefined);
      assert.equal((await ActivityNotificationPlans.rawCollection().findOne({ _id: planId(orphanId) })).cancelled, true);
      assert.equal(await Activities.findOneAsync(orphanId), undefined);

    } finally {
      release(); Object.assign(activityNotificationServices, saved);
      await Activities.rawCollection().deleteMany({ _id: { $in: [activityId, orphanId] } });
      await intents.deleteMany({ _id: { $in: [intent?._id, orphan?._id].filter(Boolean) } });
      await ActivityNotificationPlans.rawCollection().deleteMany({ _id: { $in: [planId(activityId), planId(orphanId)] } });
      await ActivityNotificationControls.rawCollection().deleteMany({ _id: { $in: [intent?._id, orphan?._id].filter(Boolean) } });
      await leases.deleteMany({ _id: { $in: [intent?._id, orphan?._id].filter(Boolean) } });
      await EmailJobs.rawCollection().deleteOne({ _id: idFor(userId, activityId) });
      await Meteor.users.rawCollection().deleteOne({ _id: userId });
    }
  });
});
