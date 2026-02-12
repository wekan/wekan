import { CronJobStatus } from '/server/cronJobStorage';

// Publish cron jobs status for admin users only
Meteor.publish('cronJobs', function() {
  if (!this.userId) {
    return this.ready();
  }

  const user = Users.findOne(this.userId);
  if (!user || !user.isAdmin) {
    return this.ready();
  }

  // Publish all cron job status documents
  return CronJobStatus.find({});
});
