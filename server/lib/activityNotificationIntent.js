'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { validateCancelledActivityNotificationIntent } = require('./activityNotificationCancellationReceipt');
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
function validateIntent(row, activity, dispatchUserId = activity.userId ?? null) {
  const expected = identity(activity);
  if (!row || row.version !== 1 || row._id !== expected._id || row.activityHash !== expected.activityHash ||
      !text(row.writerId) || (row.dispatchUserId !== null && !text(row.dispatchUserId)) ||
      row.dispatchUserId !== dispatchUserId ||
      !['pending', 'completed', 'cancelled'].includes(row.state)) fail();
  if (row.state === 'cancelled') {
    validateCancelledActivityNotificationIntent(row, expected._id);
    if (row.activityId !== activity._id || row.boardId !== (activity.boardId ?? null) ||
        row.cardId !== (activity.cardId ?? null) || +row.createdAt !== +activity.createdAt) fail();
    return row;
  }
  const fields = row.state === 'pending'
    ? '_id,activity,activityHash,dispatchUserId,state,version,writerId'
    : '_id,activityHash,dispatchUserId,state,version,writerId';
  if (Object.keys(row).sort().join(',') !== fields ||
      (row.state === 'pending' && canonical(row.activity) !== canonical(activity))) fail();
  return row;
}

// Write-ahead storage used by the ordinary activity hook. Callers supply
// finalized IDs/timestamps and the original dispatch actor. Pending snapshots
// survive failures; completion retains only immutable identity metadata.
// This module does not schedule recovery or acknowledge SMTP/webhooks.
async function captureIntent({ intents, activity, assertCurrent, dispatchUserId = activity.userId ?? null }) {
  validateActivity(activity);
  if (typeof assertCurrent !== 'function' || (dispatchUserId !== null && !text(dispatchUserId))) fail();
  activity = copy(activity);
  const expected = { ...identity(activity), version: 1, state: 'pending', activity, writerId: randomUUID(), dispatchUserId };
  await assertCurrent();
  let row = await intents.findOne({ _id: expected._id });
  if (!row) {
    let failure;
    await assertCurrent();
    try { await intents.insertOne(copy(expected)); } catch (error) { failure = error; }
    row = await intents.findOne({ _id: expected._id });
    if (!row) throw failure || new Error('activity-notification-intent-unconfirmed');
  }
  validateIntent(row, activity, dispatchUserId);
  if (row.state === 'cancelled') throw new Error('activity-notification-cancelled');
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
  const savedActivity = copy(activity);
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
async function readActivityForNotificationIntent({ intents, activities, intentId, assertCurrent, expectedActivity, expectedDispatchUserId }) {
  if (!text(intentId) || typeof assertCurrent !== 'function') fail();
  await assertCurrent();
  const row = await intents.findOne({ _id: intentId });
  if (!row || row._id !== intentId) fail();
  if (row.state !== 'pending') fail();
  validateIntent(row, row.activity, row.dispatchUserId);
  if ((expectedActivity && canonical(row.activity) !== canonical(expectedActivity)) ||
      (expectedDispatchUserId !== undefined && row.dispatchUserId !== expectedDispatchUserId)) fail();
  const activity = await activities.findOne({ _id: row.activity._id });
  if (!activity || canonical(activity) !== canonical(row.activity)) {
    throw new Error('activity-notification-activity-unconfirmed');
  }
  await assertCurrent();
  return copy(activity);
}
async function completeActivityNotificationIntent({ intents, activities, activity, dispatchUserId = activity.userId ?? null, assertCurrent }) {
  validateActivity(activity);
  if (typeof assertCurrent !== 'function') fail();
  const expected = identity(activity);
  await assertCurrent();
  const row = await intents.findOne({ _id: expected._id });
  validateIntent(row, activity, dispatchUserId);
  if (row.state === 'cancelled') throw new Error('activity-notification-cancelled');
  if (row.state === 'completed') { await assertCurrent(); return row._id; }
  await readActivityForNotificationIntent({ intents, activities, intentId: row._id, assertCurrent });
  const receipt = { ...row };
  delete receipt.activity;
  receipt.state = 'completed';
  await assertCurrent();
  let failure;
  try { await intents.replaceOne({ _id: row._id, state: 'pending', activityHash: row.activityHash, writerId: row.writerId }, receipt); }
  catch (error) { failure = error; }
  const saved = await intents.findOne({ _id: row._id });
  validateIntent(saved, activity, dispatchUserId);
  if (saved.state !== 'completed') throw failure || new Error('activity-notification-completion-unconfirmed');
  await assertCurrent();
  return row._id;
}
async function readActivityNotificationIntentState({ intents, activity, dispatchUserId = activity.userId ?? null, assertCurrent }) {
  validateActivity(activity);
  if (typeof assertCurrent !== 'function') fail();
  await assertCurrent();
  const row = await intents.findOne({ _id: identity(activity)._id });
  validateIntent(row, activity, dispatchUserId);
  await assertCurrent();
  return row.state;
}
function matchesCompletedActivityNotificationIntent(row, { activityId, activityHash, dispatchUserId }) {
  if (!text(activityId) || !/^[a-f0-9]{64}$/.test(activityHash) ||
      !(dispatchUserId === null || text(dispatchUserId))) return false;
  return Boolean(row && row._id === sha256(canonical(['activity-notification-intent', activityId])) &&
    row.state === 'completed' && row.version === 1 && text(row.writerId) &&
    row.activityHash === activityHash && row.dispatchUserId === dispatchUserId &&
    Object.keys(row).sort().join(',') === '_id,activityHash,dispatchUserId,state,version,writerId');
}
module.exports = { validateActivityNotificationIntent: validateIntent, matchesCompletedActivityNotificationIntent, readActivityNotificationIntentState, completeActivityNotificationIntent, ensureActivityNotificationIntent, persistActivityWithNotificationIntent, readActivityForNotificationIntent };
