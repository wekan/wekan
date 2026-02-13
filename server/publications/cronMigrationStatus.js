import { CronJobStatus } from '../cronJobStorage';

// Publish migration status for admin users only
Meteor.publish('cronMigrationStatus', function() {
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
