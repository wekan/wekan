/**
 * Migration Progress Component
 * Displays detailed progress for comprehensive board migration
 */

import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';

// Reactive variables for migration progress
export const migrationProgress = new ReactiveVar(0);
export const migrationStatus = new ReactiveVar('');
export const migrationStepName = new ReactiveVar('');
export const migrationStepProgress = new ReactiveVar(0);
export const migrationStepStatus = new ReactiveVar('');
export const migrationStepDetails = new ReactiveVar(null);
export const migrationCurrentStep = new ReactiveVar(0);
export const migrationTotalSteps = new ReactiveVar(0);
export const isMigrating = new ReactiveVar(false);

class MigrationProgressManager {
  constructor() {
    this.progressHistory = [];
  }

  /**
   * Update migration progress
   */
  updateProgress(progressData) {
    const {
      overallProgress,
      currentStep,
      totalSteps,
      stepName,
      stepProgress,
      stepStatus,
      stepDetails,
      boardId
    } = progressData;

    // Update reactive variables
    migrationProgress.set(overallProgress);
    migrationCurrentStep.set(currentStep);
    migrationTotalSteps.set(totalSteps);
    migrationStepName.set(stepName);
    migrationStepProgress.set(stepProgress);
    migrationStepStatus.set(stepStatus);
    migrationStepDetails.set(stepDetails);

    // Store in history
    this.progressHistory.push({
      timestamp: new Date(),
      ...progressData
    });

    // Update overall status
    migrationStatus.set(`${stepName}: ${stepStatus}`);
  }

  /**
   * Start migration
   */
  startMigration() {
    isMigrating.set(true);
    migrationProgress.set(0);
    migrationStatus.set('Starting migration...');
    migrationStepName.set('');
    migrationStepProgress.set(0);
    migrationStepStatus.set('');
    migrationStepDetails.set(null);
    migrationCurrentStep.set(0);
    migrationTotalSteps.set(0);
    this.progressHistory = [];
  }

  /**
   * Complete migration
   */
  completeMigration() {
    isMigrating.set(false);
    migrationProgress.set(100);
    migrationStatus.set('Migration completed successfully!');

    // Clear step details after a delay
    setTimeout(() => {
      migrationStepName.set('');
      migrationStepProgress.set(0);
      migrationStepStatus.set('');
      migrationStepDetails.set(null);
      migrationCurrentStep.set(0);
      migrationTotalSteps.set(0);
    }, 3000);
  }

  /**
   * Fail migration
   */
  failMigration(error) {
    isMigrating.set(false);
    migrationStatus.set(`Migration failed: ${error.message || error}`);
    migrationStepStatus.set('Error occurred');
  }

  /**
   * Get progress history
   */
  getProgressHistory() {
    return this.progressHistory;
  }

  /**
   * Clear progress
   */
  clearProgress() {
    isMigrating.set(false);
    migrationProgress.set(0);
    migrationStatus.set('');
    migrationStepName.set('');
    migrationStepProgress.set(0);
    migrationStepStatus.set('');
    migrationStepDetails.set(null);
    migrationCurrentStep.set(0);
    migrationTotalSteps.set(0);
    this.progressHistory = [];
  }
}

// Export singleton instance
export const migrationProgressManager = new MigrationProgressManager();

// Template helpers
Template.migrationProgress.helpers({
  isMigrating() {
    return isMigrating.get();
  },

  overallProgress() {
    return migrationProgress.get();
  },

  overallStatus() {
    return migrationStatus.get();
  },

  currentStep() {
    return migrationCurrentStep.get();
  },

  totalSteps() {
    return migrationTotalSteps.get();
  },

  stepName() {
    return migrationStepName.get();
  },

  stepProgress() {
    return migrationStepProgress.get();
  },

  stepStatus() {
    return migrationStepStatus.get();
  },

  stepDetails() {
    return migrationStepDetails.get();
  },

  progressBarStyle() {
    const progress = migrationProgress.get();
    return `width: ${progress}%`;
  },

  stepProgressBarStyle() {
    const progress = migrationStepProgress.get();
    return `width: ${progress}%`;
  },

  stepNameFormatted() {
    const stepName = migrationStepName.get();
    if (!stepName) return '';

    // Convert snake_case to Title Case
    return stepName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  stepDetailsFormatted() {
    const details = migrationStepDetails.get();
    if (!details) return '';

    const formatted = [];
    for (const [key, value] of Object.entries(details)) {
      const formattedKey = key
        .split(/(?=[A-Z])/)
        .join(' ')
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());
      formatted.push(`${formattedKey}: ${value}`);
    }

    return formatted.join(', ');
  }
});

// Template events
Template.migrationProgress.events({
  'click .js-close-migration-progress'() {
    migrationProgressManager.clearProgress();
  }
});