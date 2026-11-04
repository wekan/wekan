'use strict';

// Which server streams the continuous backup (#6861, item 3).
//
// The continuous backup tails the oplog and writes archives into one target directory. With several
// WeKan servers on one database - the replicas of a Kubernetes Deployment - every one of them applied
// the setting, so the same stream was written many times into one place. It needs a leader: one
// server runs the stream, and another takes over when it stops.
//
// The leader holds a LEASE: one document, `continuousBackupLease/continuous-backup`, with the
// holder's id and an expiry. Every decision is ONE database operation, so there is no gap between
// "is it free" and "it is mine" for a second server to slip through (the pattern of
// models/lib/dailyClaim.js and dueScanClaim.js):
//   - acquireLease: an insert while there is no lease at all (a duplicate key says someone has it),
//     else an update whose filter matches only a lease that is unheld, already ours, or expired;
//   - the holder renews it every RENEW_MS, and it lapses TTL_MS after the last renewal, so a leader
//     that crashed, was rolled out or lost its database for a minute is replaced by the next server
//     to look - without waiting for anybody to notice.
// No upsert on purpose: an upsert whose filter does not match has to insert, and what a database
// does then (a duplicate key, or a second document) is the very thing the lease must not depend on.
//
// `collection` is a MongoDB driver collection (insertOne, updateOne).

const LEASE_ID = 'continuous-backup';
const RENEW_MS = 15 * 1000;
const TTL_MS = 45 * 1000;

const isDuplicateKey = error => !!error && (error.code === 11000 || /E11000|duplicate key/i.test(String(error.message || '')));

// Resolves true when `holder` leads from now until the lease expires.
async function acquireLease(collection, holder, now = new Date(), ttlMs = TTL_MS) {
  const expiresAt = new Date(now.getTime() + ttlMs);
  try {
    await collection.insertOne({ _id: LEASE_ID, holder, expiresAt });
    return true;
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }
  const result = await collection.updateOne(
    { _id: LEASE_ID, $or: [{ holder }, { holder: null }, { expiresAt: { $lte: now } }] },
    { $set: { holder, expiresAt } },
  );
  return (result.matchedCount || 0) > 0 || (result.modifiedCount || 0) > 0;
}

// Gives the lease up when this server is the holder (a clean stop, or the feature switched off), so
// the next server does not have to wait for it to expire.
async function releaseLease(collection, holder) {
  await collection.updateOne({ _id: LEASE_ID, holder }, { $set: { holder: null, expiresAt: new Date(0) } });
}

// Takes the lease whoever holds it. For a restore, which must be the only writer: the former leader
// finds at its next renewal that it lost the lease and stops, so the caller then waits RENEW_MS
// before it writes anything (see waitMs).
async function takeoverLease(collection, holder, now = new Date(), ttlMs = TTL_MS) {
  const expiresAt = new Date(now.getTime() + ttlMs);
  try {
    await collection.insertOne({ _id: LEASE_ID, holder, expiresAt });
    return { waitMs: 0 };
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }
  const result = await collection.updateOne({ _id: LEASE_ID }, { $set: { holder, expiresAt } });
  // taking a lease this server already held needs no wait: nobody else was streaming
  return { waitMs: RENEW_MS, matched: (result.matchedCount || 0) > 0 };
}

module.exports = { LEASE_ID, RENEW_MS, TTL_MS, acquireLease, releaseLease, takeoverLease };
