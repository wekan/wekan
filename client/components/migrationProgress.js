import { Template } from 'meteor/templating';
import { 
  migrationManager,
  isMigrating,
  migrationProgress,
  migrationStatus,
  migrationCurrentStep,
  migrationEstimatedTime,
  migrationSteps
} from '/client/lib/migrationManager';

Template.migrationProgress.helpers({
  isMigrating() {
    return isMigrating.get();
  },
  
  migrationProgress() {
    return migrationProgress.get();
  },
  
  migrationStatus() {
    return migrationStatus.get();
  },
  
  migrationCurrentStep() {
    return migrationCurrentStep.get();
  },
  
  migrationEstimatedTime() {
    return migrationEstimatedTime.get();
  },
  
  migrationSteps() {
    const steps = migrationSteps.get();
    const currentStep = migrationCurrentStep.get();
    
    return steps.map(step => ({
      ...step,
      isCurrentStep: step.name === currentStep
    }));
  }
});

Template.migrationProgress.onCreated(function() {
  // Subscribe to migration state changes
  this.autorun(() => {
    isMigrating.get();
    migrationProgress.get();
    migrationStatus.get();
    migrationCurrentStep.get();
    migrationEstimatedTime.get();
    migrationSteps.get();
  });
});
