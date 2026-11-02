'use strict';

// The due-date reminder scan (models/cards.js findDueCards) runs once a day,
// at NOTIFY_DUE_AT_HOUR_OF_DAY, on a timer in every WeKan server process. With
// several servers on one database (a Kubernetes Deployment of 24 replicas)
// every one of them scanned the due cards and inserted its own duenow /
// almostdue / pastdue activity for each card - one reminder per server.
// The first server to claim the day does the scan; the others skip.
//
// The claim is a document whose _id is the local date, inserted into
// COLLECTION. The unique _id makes the insert succeed for exactly one server;
// the others get a duplicate key error (11000). One small document per day.

const COLLECTION = 'dueReminderRuns';

function dayKey(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// db: a mongodb driver Db. Resolves true when this server should scan today.
async function claimDueScanDay(db, now = new Date()) {
  try {
    await db.collection(COLLECTION).insertOne({ _id: dayKey(now), at: now });
    return true;
  } catch (error) {
    if (error && error.code === 11000) return false;
    throw error;
  }
}

module.exports = { claimDueScanDay, dayKey, COLLECTION };
