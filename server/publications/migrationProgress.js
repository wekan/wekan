import { CronJobStatus } from '/server/cronJobStorage';

// Publish detailed migration progress data for admin users
Meteor.publish('migrationProgress', function() {
  if (!this.userId) {
    return this.ready();
  }

  const user = Users.findOne(this.userId);
  if (!user || !user.isAdmin) {
    return this.ready();
  }

  // Publish detailed migration progress documents
  // This includes current running job details, estimated time, etc.
  return CronJobStatus.find({
    $or: [
      { jobType: 'migration' },
      { jobId: 'migration' }
    ]
  });
});
