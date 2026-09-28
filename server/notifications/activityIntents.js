import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Activities from '/models/activities';
import { ensureIndex } from '/server/lib/mongoStartup';
const { ensureActivityNotificationIntent, completeActivityNotificationIntent } = require('/server/lib/activityNotificationIntent');

export const ActivityNotificationIntents = new Mongo.Collection('activityNotificationIntents');
ActivityNotificationIntents.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(ActivityNotificationIntents, { state: 1, _id: 1 });
});
const options = (activity, dispatchUserId) => ({ activity, dispatchUserId,
  intents: ActivityNotificationIntents.rawCollection(), activities: Activities.rawCollection(),
  assertCurrent: async () => {},
});
export function captureActivityNotificationIntent(activity, dispatchUserId) {
  return ensureActivityNotificationIntent(options(activity, dispatchUserId ?? null));
}
export function acknowledgeActivityNotifications(activity, dispatchUserId, assertCurrent = async () => {}) {
  return completeActivityNotificationIntent({ ...options(activity, dispatchUserId ?? null), assertCurrent });
}
