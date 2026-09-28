'use strict';
const { EJSON } = require('bson');
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
// Callers validate their complete immutable plan before invoking this helper.
// A persisted activity alone never acknowledges its downstream effects.
async function persistSyncActivity({ activities, activity, effectId, assertCurrent, completeDelivery }) {
  activity = copy(activity);
  await assertCurrent();
  let saved = await activities.findOneAsync(activity._id), error;
  if (!saved) {
    await assertCurrent();
    try { await activities.insertAsync(copy(activity)); } catch (failure) { error = failure; }
    await assertCurrent();
    try { saved = await activities.findOneAsync(activity._id); } catch (failure) { throw error || failure; }
  }
  if (!saved || canonical(saved) !== canonical(activity)) throw error || new Error('sync-activity-unconfirmed');
  await assertCurrent();
  const receipt = await completeDelivery({ effectId, activity: copy(activity), assertCurrent });
  if (receipt !== effectId) throw new Error('sync-delivery-unconfirmed');
  await assertCurrent();
  return effectId;
}
module.exports = { persistSyncActivity };
