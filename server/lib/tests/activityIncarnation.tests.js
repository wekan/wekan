import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Activities from '/models/activities';
import { ActivityNotificationIntents } from '/server/notifications/activityIntents';
const { readActivityForNotificationIntent } = require('/server/lib/activityNotificationIntent');
const { canonical, sha256 } = require('/models/lib/changeHistoryIntegrity');
const { getFeatureFlags } = require('/models/lib/featureFlags');

// Incarnations (maintainer decision of 2026-09-30) for activities: notification
// recovery must not take an activity deleted and recreated under the same _id,
// with the same values, for the one its intent captured.
describe('Activity incarnations', function () {
  this.timeout(15000);
  it('gives every insert a new lifetime and refuses recovery against another one', async function () {
    if (!Meteor.isAppTest) this.skip();
    const flags = getFeatureFlags();
    if (flags.disableActivities || flags.disableNotifications) this.skip();
    const _id = Random.id(), intentId = sha256(canonical(['activity-notification-intent', _id]));
    const intents = ActivityNotificationIntents.rawCollection(), activities = Activities.rawCollection();
    const read = () => readActivityForNotificationIntent({ intents, activities, intentId, assertCurrent: async () => {} });
    try {
      await Activities.insertAsync({ _id, activityType: 'createCard', userId: Random.id(), boardId: Random.id() });
      const original = await activities.findOne({ _id });
      assert.ok(typeof original.incarnation === 'string' && original.incarnation, 'an inserted activity has an incarnation');
      const intent = await intents.findOne({ _id: intentId });
      assert.equal(intent.activity.incarnation, original.incarnation, 'the intent captured this lifetime');
      assert.equal((await read()).incarnation, original.incarnation);

      // Deleted and recreated: same _id, same values, same timestamps - another lifetime.
      await activities.deleteOne({ _id });
      await activities.insertOne({ ...original, incarnation: Random.id() });
      await assert.rejects(read(), /activity-unconfirmed/);

      // The original lifetime is still recognized.
      await activities.deleteOne({ _id });
      await activities.insertOne(original);
      assert.equal((await read())._id, _id);

      // Two inserts never share a lifetime, whatever the caller passes.
      const other = Random.id();
      await Activities.insertAsync({ _id: other, activityType: 'createCard', userId: Random.id(), incarnation: original.incarnation });
      assert.notEqual((await activities.findOne({ _id: other })).incarnation, original.incarnation);
      await activities.deleteOne({ _id: other });
      await intents.deleteOne({ _id: sha256(canonical(['activity-notification-intent', other])) });
    } finally {
      await activities.deleteOne({ _id });
      await intents.deleteOne({ _id: intentId });
    }
  });
});
