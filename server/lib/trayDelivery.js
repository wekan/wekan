'use strict';
const { createHash, randomUUID } = require('node:crypto');
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const PENDING = 'notificationDeliveryPending';
const REVISION = 'notificationDeliveryRevision';
const fail = code => { throw new Error(code); };
function receiptFor(userId, activityId) {
  if (![userId, activityId].every(value => typeof value === 'string' && value.length > 0 && value.length <= 1024)) {
    fail('tray-delivery-identity-invalid');
  }
  return { _id: createHash('sha256').update(JSON.stringify([userId, activityId])).digest('hex'),
    version: 1, userId, activityId };
}
function validateReceipt(value, expected) {
  if (canonical(value) !== canonical(expected)) fail('tray-delivery-receipt-invalid');
}
function fence(user) {
  if (Object.hasOwn(user, REVISION) && (typeof user[REVISION] !== 'string' || !user[REVISION])) {
    fail('tray-delivery-revision-invalid');
  }
  return { _id: user._id, [REVISION]: user[REVISION] ?? { $exists: false } };
}
// Internal raw-driver adapter. The owning application must protect both private
// user fields, retain receipts, and run recovery before enabling this path.
// A single pending marker bounds per-user storage. Independent durable receipts
// prevent reappearance after tray dismissal/cleanup; no receipt has a TTL.
function createTrayDelivery({ users, receipts, assertCurrent = async () => {} }) {
  async function readReceipt(expected) {
    const saved = await receipts.findOne({ _id: expected._id });
    if (saved) validateReceipt(saved, expected);
    return saved;
  }
  async function readUser(userId) {
    return users.findOne({ _id: userId }, { projection: { _id: 1, [PENDING]: 1, [REVISION]: 1 } });
  }
  async function settle(user) {
    const pending = user[PENDING];
    const expected = receiptFor(user._id, pending?.activityId);
    validateReceipt(pending, expected);
    const selector = { ...fence(user), [PENDING]: pending };
    await assertCurrent();
    let failure;
    if (!await readReceipt(expected)) {
      try { await receipts.insertOne(expected); } catch (error) { failure = error; }
      if (!await readReceipt(expected)) throw failure || new Error('tray-delivery-receipt-unconfirmed');
    }
    await assertCurrent();
    try {
      await users.updateOne(selector, { $unset: { [PENDING]: '' }, $set: { [REVISION]: randomUUID() } });
    } catch (error) { failure = error; }
    const current = await readUser(user._id);
    if (current && canonical(current[PENDING]) === canonical(pending)) {
      throw failure || new Error('tray-delivery-cleanup-unconfirmed');
    }
    await assertCurrent();
    return expected._id;
  }
  // #5171: `extra` may carry `showAt` (ms), the time the drawer starts showing
  // this entry under the recipient's tray schedule (models/lib/
  // notificationDelivery.js). Without it the entry is exactly as before.
  async function deliver(userId, activityId, extra = {}) {
    const expected = receiptFor(userId, activityId);
    const entry = { activity: activityId, read: null };
    if (extra && extra.showAt !== undefined) {
      if (!Number.isFinite(extra.showAt)) fail('tray-delivery-show-at-invalid');
      entry.showAt = extra.showAt;
    }
    for (let attempt = 0; attempt < 20; attempt++) {
      await assertCurrent();
      if (await readReceipt(expected)) { await assertCurrent(); return expected._id; }
      const user = await readUser(userId);
      if (!user) fail('tray-delivery-user-missing');
      if (Object.hasOwn(user, PENDING)) { await settle(user); continue; }
      const selector = { ...fence(user), [PENDING]: { $exists: false } };
      const marker = { [PENDING]: expected, [REVISION]: randomUUID() };
      let failure;
      // Preserve an existing read row. Both branches use the same revision;
      // an intervening delivery, dismissal and cleanup cannot admit a stale
      // command, even after the pending marker has disappeared.
      await assertCurrent();
      try {
        await users.updateOne({ ...selector, 'profile.notifications.activity': activityId }, { $set: marker });
        await users.updateOne({ ...selector, 'profile.notifications.activity': { $ne: activityId } }, {
          $set: marker, $addToSet: { 'profile.notifications': entry },
        });
      } catch (error) { failure = error; }
      const current = await readUser(userId);
      if (current && canonical(current[PENDING]) === canonical(expected)) {
        await settle(current);
        return expected._id;
      }
      if (await readReceipt(expected)) { await assertCurrent(); return expected._id; }
      if (failure) throw failure;
      // A competing event may have consumed the slot. Re-read its receipt and
      // revision rather than replaying the old compare-and-set command.
    }
    fail('tray-delivery-busy');
  }
  async function recover(userId) {
    await assertCurrent();
    const user = await readUser(userId);
    return user && Object.hasOwn(user, PENDING) ? settle(user) : null;
  }
  return { deliver, recover };
}
module.exports = { createTrayDelivery, receiptFor, PENDING, REVISION };
