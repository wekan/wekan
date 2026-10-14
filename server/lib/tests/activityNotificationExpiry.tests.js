import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ActivityNotificationIntents, captureActivityNotificationIntent } from '/server/notifications/activityIntents';
import { ActivityNotificationControls, ActivityNotificationLeases, resumeActivityNotifications, giveUpActivityNotification } from '/server/notifications/activityPlans';

const { createActivityNotificationRecovery } = require('/server/lib/activityNotificationRecovery');

// #6768 on a running server: a pending notification whose activity no longer
// exists can never be delivered; once past the grace period the recovery scan
// cancels it - the same cancellation an administrator makes - instead of
// retrying it forever. A recent one is left alone.
describe('Activity notification expiry (#6768)', function () {
  this.timeout(30000);
  before(function () { if (!Meteor.isAppTest) this.skip(); });

  it('cancels an undeliverable notification past the grace period, keeps a recent one', async function () {
    const old = { _id: Random.id(), activityType: 'createCard', boardId: Random.id(), userId: Random.id(),
      createdAt: new Date(Date.now() - 30 * 60 * 1000), modifiedAt: new Date(Date.now() - 30 * 60 * 1000) };
    const fresh = { ...old, _id: Random.id(), createdAt: new Date(), modifiedAt: new Date() };
    // Intents captured, activities never stored: their delivery can not succeed.
    const oldIntent = await captureActivityNotificationIntent(old, old.userId);
    const freshIntent = await captureActivityNotificationIntent(fresh, fresh.userId);
    try {
      const recover = createActivityNotificationRecovery({
        intents: { find: (selector, options) => ActivityNotificationIntents.rawCollection()
          .find({ ...selector, _id: { ...selector._id, $in: [oldIntent._id, freshIntent._id] } }, options) },
        run: id => resumeActivityNotifications(id), giveUp: giveUpActivityNotification,
      });
      const result = await recover();
      assert.equal(result.cancelled, 1, JSON.stringify(result));
      assert.equal((await ActivityNotificationIntents.findOneAsync(oldIntent._id)).state, 'cancelled');
      assert.equal((await ActivityNotificationIntents.findOneAsync(freshIntent._id)).state, 'pending', 'a recent one is retried, not cancelled');
    } finally {
      const ids = [oldIntent._id, freshIntent._id];
      await ActivityNotificationIntents.rawCollection().deleteMany({ _id: { $in: ids } });
      await ActivityNotificationControls.rawCollection().deleteMany({ _id: { $in: ids } });
      await ActivityNotificationLeases.rawCollection().deleteMany({ _id: { $in: ids } });
    }
  });
});
