'use strict';

// Work that every WeKan server schedules for itself but that should happen once
// for the whole installation (#6861). With several servers on one database - a
// Kubernetes Deployment of 24 replicas - each of them ran its own copy: the
// notification cleanup read and rewrote the same users 24 times at every rollout
// (and a notification added by another server between a read and its write was
// lost), and the file integrity audit could start on two servers at once. The
// first server to claim the run does it; the others skip. Same pattern as
// models/lib/dueScanClaim.js.
//
// Two shapes of claim, both ONE database operation, so there is no gap between
// "is it due" and "it is mine" for a second server to slip through:
// - claimDailyJob: a document per job and local day; a duplicate key says another
//   server has today's run;
// - claimIntervalRun: one document per job, claimed by an update that matches only
//   while the last run is older than the interval.

const COLLECTION = 'dailyJobRuns';

function dayKey(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const isDuplicateKey = error => !!error && (error.code === 11000 || /E11000/.test(String(error.message || '')));

// db: a mongodb driver Db. Resolves true when this server should run `job` today.
async function claimDailyJob(db, job, now = new Date()) {
  try {
    await db.collection(COLLECTION).insertOne({ _id: `${job}:${dayKey(now)}`, job, at: now });
    return true;
  } catch (error) {
    if (isDuplicateKey(error)) return false;
    throw error;
  }
}

// collection: a driver Collection holding the run's document under `id`, with the
// time of the last run in `at`. Resolves true when this server's update was the
// one that moved the run forward: the filter matches only a missing or old `at`,
// and with upsert a document that exists but does not match is a duplicate key.
async function claimIntervalRun(collection, id, intervalMs, now = new Date()) {
  const due = new Date(now.getTime() - intervalMs);
  try {
    const result = await collection.updateOne(
      { _id: id, $or: [{ at: { $lt: due } }, { at: { $exists: false } }] },
      { $set: { at: now } },
      { upsert: true },
    );
    return !!result && (result.modifiedCount > 0 || result.upsertedCount > 0);
  } catch (error) {
    if (isDuplicateKey(error)) return false;
    throw error;
  }
}

module.exports = { claimDailyJob, claimIntervalRun, dayKey, COLLECTION };
