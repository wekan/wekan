// Once a day, when WORKLOAD_ABSENCE_RETENTION_DAYS is set (WP-7): workload
// absences that ENDED more than that many days ago are removed - absences can
// be health data ([GDPR] Art. 9). Off by default. An absence still running, or
// one in the future, is never touched.
import { Meteor } from 'meteor/meteor';
import { WorkloadAbsences } from '/models/workload';

const { retentionDays, cutoffDay } = require('/models/lib/retentionSettings');

export async function runWorkloadAbsenceRetention(now = Date.now()) {
  const day = cutoffDay(retentionDays('WORKLOAD_ABSENCE_RETENTION_DAYS', { WORKLOAD_ABSENCE_RETENTION_DAYS: process.env.WORKLOAD_ABSENCE_RETENTION_DAYS }), now);
  if (!day) return 0;
  // The dates are YYYY-MM-DD strings, which compare as days.
  return ((await WorkloadAbsences.rawCollection().deleteMany({ end: { $lt: day } })) || {}).deletedCount || 0;
}

if (Meteor.isServer) {
  Meteor.startup(() => {
    if (retentionDays('WORKLOAD_ABSENCE_RETENTION_DAYS', { WORKLOAD_ABSENCE_RETENTION_DAYS: process.env.WORKLOAD_ABSENCE_RETENTION_DAYS }) <= 0) return;
    const runClaimed = async () => {
      const { claimDailyJob } = require('/models/lib/dailyClaim');
      if (!(await claimDailyJob(WorkloadAbsences.rawDatabase(), 'workload-absence-retention'))) return;
      await runWorkloadAbsenceRetention();
    };
    Meteor.defer(() => { runClaimed().catch(error => console.error('Workload absence retention failed:', error)); });
    Meteor.setInterval(() => { runClaimed().catch(error => console.error('Workload absence retention failed:', error)); }, 60 * 60 * 1000);
  });
}
