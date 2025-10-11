import { Template } from 'meteor/templating';
import { migrationManager } from '/imports/lib/migrationManager';

Template.migrationProgress.helpers({
  isMigrating() {
    return migrationManager.isMigrating.get();
  },
  
  migrationProgress() {
    return migrationManager.migrationProgress.get();
  },
  
  migrationStatus() {
    return migrationManager.migrationStatus.get();
  },
  
  migrationCurrentStep() {
    return migrationManager.migrationCurrentStep.get();
  },
  
  migrationEstimatedTime() {
    return migrationManager.migrationEstimatedTime.get();
  },
  
  migrationSteps() {
    const steps = migrationManager.migrationSteps.get();
    const currentStep = migrationManager.migrationCurrentStep.get();
    
    return steps.map(step => ({
      ...step,
      isCurrentStep: step.name === currentStep
    }));
  }
});

Template.migrationProgress.onCreated(function() {
  // Subscribe to migration state changes
  this.autorun(() => {
    migrationManager.isMigrating.get();
    migrationManager.migrationProgress.get();
    migrationManager.migrationStatus.get();
    migrationManager.migrationCurrentStep.get();
    migrationManager.migrationEstimatedTime.get();
    migrationManager.migrationSteps.get();
  });
});
