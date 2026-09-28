'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { randomUUID } = require('node:crypto');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
const fail = () => { throw new Error('activity-notification-intent-invalid'); };
function validateActivity(activity) {
  if (!activity || Array.isArray(activity) || !text(activity._id) || !text(activity.activityType) ||
      !(activity.createdAt instanceof Date) || !Number.isFinite(+activity.createdAt) ||
      !(activity.modifiedAt instanceof Date) || !Number.isFinite(+activity.modifiedAt)) fail();
  if (calculateObjectSize(activity) > 14 * 1024 * 1024) fail();
}
function identity(activity) {
  validateActivity(activity);
  return { _id: sha256(canonical(['activity-notification-intent', activity._id])),
    activityHash: sha256(canonical(activity)) };
}
function validateIntent(row, activity) {
  const expected = identity(activity);
  if (!row || row.version !== 1 || row._id !== expected._id || row.activityHash !== expected.activityHash ||
      !text(row.writerId) || row.state !== 'pending' || canonical(row.activity) !== canonical(activity) ||
      Object.keys(row).sort().join(',') !== '_id,activity,activityHash,state,version,writerId') fail();
  return row;
}

// Internal write-ahead primitive. The eventual hook adapter must supply its
// finalized activity (ID and timestamps included), suppress deferred Sync
// hooks, and retain these private records until delivery is acknowledged.
// This does not schedule delivery or acknowledge downstream completion.
async function captureIntent({ intents, activity, assertCurrent }) {
  validateActivity(activity);
  if (typeof assertCurrent !== 'function') fail();
  activity = copy(activity);
  const expected = { ...identity(activity), version: 1, state: 'pending', activity, writerId: randomUUID() };
  await assertCurrent();
  let row = await intents.findOne({ _id: expected._id });
  if (!row) {
    let failure;
    await assertCurrent();
    try { await intents.insertOne(copy(expected)); } catch (error) { failure = error; }
    row = await intents.findOne({ _id: expected._id });
    if (!row) throw failure || new Error('activity-notification-intent-unconfirmed');
  }
  validateIntent(row, activity);
  await assertCurrent();
  return { intent: copy(row), ownsInsertion: row.writerId === expected.writerId };
}
async function ensureActivityNotificationIntent(options) {
  return (await captureIntent(options)).intent;
}

// A lost activity write acknowledgement is reconciled from storage. A missing
// activity on recovery is NOT recreated: it may be a cancelled insertion or a
// later deletion. Only the call that creates the intent may insert; later
// calls cannot distinguish an interrupted initial write from deletion. The
// retained orphan needs explicit operator resolution instead of resurrection.
async function persistActivityWithNotificationIntent({ intents, activities, activity, assertCurrent, insert }) {
  if (typeof insert !== 'function') fail();
  const { intent, ownsInsertion } = await captureIntent({ intents, activity, assertCurrent });
  const savedActivity = intent.activity;
  await assertCurrent();
  let saved = await activities.findOne({ _id: savedActivity._id }), failure;
  if (!saved) {
    if (!ownsInsertion) throw new Error('activity-notification-activity-unconfirmed');
    await assertCurrent();
    try { await insert(copy(savedActivity)); } catch (error) { failure = error; }
    saved = await activities.findOne({ _id: savedActivity._id });
  }
  if (!saved || canonical(saved) !== canonical(savedActivity)) {
    throw failure || new Error('activity-notification-activity-unconfirmed');
  }
  await assertCurrent();
  return intent;
}
async function readActivityForNotificationIntent({ intents, activities, intentId, assertCurrent }) {
  if (!text(intentId) || typeof assertCurrent !== 'function') fail();
  await assertCurrent();
  const row = await intents.findOne({ _id: intentId });
  if (!row || row._id !== intentId) fail();
  validateIntent(row, row.activity);
  const activity = await activities.findOne({ _id: row.activity._id });
  if (!activity || canonical(activity) !== canonical(row.activity)) {
    throw new Error('activity-notification-activity-unconfirmed');
  }
  await assertCurrent();
  return copy(activity);
}
module.exports = { ensureActivityNotificationIntent, persistActivityWithNotificationIntent, readActivityForNotificationIntent };
