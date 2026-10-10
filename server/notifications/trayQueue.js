import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Users from '/models/users';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Settings from '/models/settings';
const { channelOf, nextDeliveryAt, resolveChannelSettings } = require('/models/lib/notificationDelivery');
import { ensureIndex } from '/server/lib/mongoStartup';
const { createTrayDelivery, PENDING } = require('/server/lib/trayDelivery');

// Receipts outlive visible notifications and have no TTL. Never publish them
// or permit client mutation; the user's transient marker is server-owned too.
export const trayDeliveryReceipts = new Mongo.Collection('notificationTrayReceipts');
trayDeliveryReceipts.deny({ insert: () => true, update: () => true, remove: () => true });
const trayReceipts = createTrayDelivery({
  users: Users.rawCollection(), receipts: trayDeliveryReceipts.rawCollection(),
});

// #5171: the time a tray entry starts showing, from the recipient's tray
// schedule (Member Settings -> board -> Admin Panel -> built-in "at once").
// Computed from the activity's own time, so a retried delivery stamps the
// same value, and stored on the entry, so a restart changes nothing.
export async function trayShowAt(userId, activityId) {
  const [user, activity, setting] = await Promise.all([
    Users.findOneAsync(userId, { fields: { 'profile.notificationDelivery': 1 } }),
    Activities.findOneAsync(activityId, { fields: { createdAt: 1, boardId: 1 } }),
    Settings.findOneAsync({}, { fields: { notificationDelivery: 1 } }),
  ]);
  const board = activity && activity.boardId
    ? await Boards.findOneAsync(activity.boardId, { fields: { notificationDelivery: 1 } }) : null;
  const delivery = resolveChannelSettings('tray', [
    ['member', channelOf(user && user.profile && user.profile.notificationDelivery, 'tray')],
    ['board', channelOf(board && board.notificationDelivery, 'tray')],
    ['admin', channelOf(setting && setting.notificationDelivery, 'tray')],
  ]);
  if (delivery.schedule === 'immediate' && !delivery.quietStart) return undefined;
  const createdAt = activity && activity.createdAt ? new Date(activity.createdAt) : new Date();
  return nextDeliveryAt(createdAt, delivery).getTime();
}

export const trayDelivery = {
  async deliver(userId, activityId) {
    const showAt = await trayShowAt(userId, activityId);
    return trayReceipts.deliver(userId, activityId, showAt === undefined ? {} : { showAt });
  },
  recover: userId => trayReceipts.recover(userId),
};
let afterId = null;
export async function recoverTrayDeliveries() {
  const rows = await Users.rawCollection().find({ [PENDING]: { $exists: true },
    ...(afterId ? { _id: { $gt: afterId } } : {}) }, { projection: { _id: 1 } })
    .sort({ _id: 1 }).limit(100).toArray();
  for (const row of rows) {
    try { await trayDelivery.recover(row._id); }
    catch (error) { console.error('Tray receipt recovery failed; pending evidence retained'); }
  }
  // Advance past damaged rows so they cannot starve later recipients.
  afterId = rows.length === 100 ? rows[rows.length - 1]._id : null;
}
Meteor.startup(async () => {
  await ensureIndex(trayDeliveryReceipts, { userId: 1 });
  await ensureIndex(Users, { [PENDING]: 1 }, { sparse: true });
  async function scan() {
    try { await recoverTrayDeliveries(); }
    catch (error) { console.error('Tray receipt scan failed; recovery will retry'); }
    finally { Meteor.setTimeout(scan, 1000); }
  }
  await scan();
});
