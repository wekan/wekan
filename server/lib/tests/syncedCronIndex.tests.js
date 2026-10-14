import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { ensureCronIndexes, CRON_RUNNING_JOB_INDEX } from '/server/cron/syncedCron';

// #6769 on a running server: synced-cron's "is this job still running"
// lookup - { name, finishedAt: { $exists: false } }, every minute per job and
// instance - is answered from an index, not a scan of the job history.
describe('SyncedCron running-job index (#6769)', function () {
  this.timeout(30000);
  before(function () { if (!Meteor.isAppTest) this.skip(); });

  it('cronJobs has { name, finishedAt } and the lookup uses it', async function () {
    await ensureCronIndexes();
    const { SyncedCron } = require('meteor/quave:synced-cron');
    const raw = SyncedCron._collection.rawCollection();
    const indexes = await raw.indexes();
    assert.ok(indexes.some(i => JSON.stringify(i.key) === JSON.stringify(CRON_RUNNING_JOB_INDEX)), JSON.stringify(indexes.map(i => i.key)));
    const plan = await raw.find({ name: 'wekan-scheduled-rules', finishedAt: { $exists: false } }).limit(1).explain();
    // MongoDB names the plan; FerretDB's explain is shaped differently, so the
    // plan is checked only where it is MongoDB's.
    const winning = plan && plan.queryPlanner && JSON.stringify(plan.queryPlanner.winningPlan);
    if (winning) assert.doesNotMatch(winning, /COLLSCAN/);
    // A second run adds nothing.
    assert.equal(await ensureCronIndexes(), false);
  });
});
