import { CronJobStatus } from '/server/cronJobStorage';
import Users from '/models/users';

// Publish cron jobs status for admin users only
Meteor.publish('cronJobs', async function() {
  if (!this.userId) {
    return this.ready();
  }

  const user = await Users.findOneAsync(this.userId);
  if (!user || !user.isAdmin) {
    return this.ready();
  }

  // Publish all cron job status documents
  return CronJobStatus.find({});
});
