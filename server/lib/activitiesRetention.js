// Once a day, when ACTIVITIES_RETENTION_DAYS is set (WP-7): board activity rows
// older than that many days are removed, a batch at a time. Off by default.
// The change history of cards (changeHistory) is a different collection and is
// never touched here. The first server to claim today's run does it
// (models/lib/dailyClaim.js).
import { Meteor } from 'meteor/meteor';
import Activities from '/models/activities';

const { retentionDays, cutoffDate } = require('/models/lib/retentionSettings');
const BATCH = 1000;

export async function runActivitiesRetention(now = Date.now()) {
  const cutoff = cutoffDate(retentionDays('ACTIVITIES_RETENTION_DAYS', { ACTIVITIES_RETENTION_DAYS: process.env.ACTIVITIES_RETENTION_DAYS }), now);
  if (!cutoff) return 0;
  const raw = Activities.rawCollection();
  let removed = 0;
  for (;;) {
    const ids = (await raw.find({ createdAt: { $lt: cutoff } }, { projection: { _id: 1 } }).limit(BATCH).toArray()).map(a => a._id);
    if (!ids.length) break;
    removed += ((await raw.deleteMany({ _id: { $in: ids } })) || {}).deletedCount || 0;
    if (ids.length < BATCH) break;
  }
  return removed;
}

if (Meteor.isServer) {
  Meteor.startup(() => {
    if (retentionDays('ACTIVITIES_RETENTION_DAYS', { ACTIVITIES_RETENTION_DAYS: process.env.ACTIVITIES_RETENTION_DAYS }) <= 0) return;
    const runClaimed = async () => {
      const { claimDailyJob } = require('/models/lib/dailyClaim');
      if (!(await claimDailyJob(Activities.rawDatabase(), 'activities-retention'))) return;
      await runActivitiesRetention();
    };
    Meteor.defer(() => { runClaimed().catch(error => console.error('Activities retention failed:', error)); });
    Meteor.setInterval(() => { runClaimed().catch(error => console.error('Activities retention failed:', error)); }, 60 * 60 * 1000);
  });
}
