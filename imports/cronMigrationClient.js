import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

export const cronMigrationProgress = new ReactiveVar(0);
export const cronMigrationStatus = new ReactiveVar('');
export const cronMigrationCurrentStep = new ReactiveVar('');
export const cronMigrationSteps = new ReactiveVar([]);
export const cronIsMigrating = new ReactiveVar(false);
export const cronJobs = new ReactiveVar([]);

function fetchProgress() {
  Meteor.call('cron.getMigrationProgress', (err, res) => {
    if (err) return;
    if (!res) return;
    cronMigrationProgress.set(res.progress || 0);
    cronMigrationStatus.set(res.status || '');
    cronMigrationCurrentStep.set(res.currentStep || '');
    cronMigrationSteps.set(res.steps || []);
    cronIsMigrating.set(res.isMigrating || false);
  });
}

// Expose cron jobs via method
function fetchJobs() {
  Meteor.call('cron.getJobs', (err, res) => {
    if (err) return;
    cronJobs.set(res || []);
  });
}

if (Meteor.isClient) {
  // Initial fetch
  fetchProgress();
  fetchJobs();

  // Poll periodically
  Meteor.setInterval(() => {
    fetchProgress();
    fetchJobs();
  }, 2000);
}

export default {
  cronMigrationProgress,
  cronMigrationStatus,
  cronMigrationCurrentStep,
  cronMigrationSteps,
  cronIsMigrating,
  cronJobs,
};
