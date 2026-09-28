import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Users from '/models/users';
import { ensureIndex } from '/server/lib/mongoStartup';
const { createTrayDelivery, PENDING } = require('/server/lib/trayDelivery');

// Receipts outlive visible notifications and have no TTL. Never publish them
// or permit client mutation; the user's transient marker is server-owned too.
export const trayDeliveryReceipts = new Mongo.Collection('notificationTrayReceipts');
trayDeliveryReceipts.deny({ insert: () => true, update: () => true, remove: () => true });
export const trayDelivery = createTrayDelivery({
  users: Users.rawCollection(), receipts: trayDeliveryReceipts.rawCollection(),
});
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
