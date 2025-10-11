import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from '/imports/i18n';

// Reactive variables for cron settings
const migrationProgress = new ReactiveVar(0);
const migrationStatus = new ReactiveVar('');
const migrationCurrentStep = new ReactiveVar('');
const migrationSteps = new ReactiveVar([]);
const isMigrating = new ReactiveVar(false);
const cronJobs = new ReactiveVar([]);

Template.cronSettings.onCreated(function() {
  this.loading = new ReactiveVar(true);
  this.showMigrations = new ReactiveVar(true);
  this.showBoardOperations = new ReactiveVar(false);
  this.showJobs = new ReactiveVar(false);
  this.showAddJob = new ReactiveVar(false);

  // Board operations pagination
  this.currentPage = new ReactiveVar(1);
  this.pageSize = new ReactiveVar(20);
  this.searchTerm = new ReactiveVar('');
  this.boardOperations = new ReactiveVar([]);
  this.operationStats = new ReactiveVar({});
  this.pagination = new ReactiveVar({});
  this.queueStats = new ReactiveVar({});
  this.systemResources = new ReactiveVar({});
  this.boardMigrationStats = new ReactiveVar({});

  // Load initial data
  this.loadCronData();
});

Template.cronSettings.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  
  showMigrations() {
    return Template.instance().showMigrations.get();
  },
  
  showBoardOperations() {
    return Template.instance().showBoardOperations.get();
  },
  
  showJobs() {
    return Template.instance().showJobs.get();
  },
  
  showAddJob() {
    return Template.instance().showAddJob.get();
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
  
  migrationSteps() {
    const steps = migrationSteps.get();
    const currentStep = migrationCurrentStep.get();
    
    return steps.map(step => ({
      ...step,
      isCurrentStep: step.name === currentStep
    }));
  },
  
  cronJobs() {
    return cronJobs.get();
  },
  
  formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  },

  boardOperations() {
    return Template.instance().boardOperations.get();
  },

  operationStats() {
    return Template.instance().operationStats.get();
  },

  pagination() {
    return Template.instance().pagination.get();
  },

  queueStats() {
    return Template.instance().queueStats.get();
  },

  systemResources() {
    return Template.instance().systemResources.get();
  },

  boardMigrationStats() {
    return Template.instance().boardMigrationStats.get();
  },

  formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  },

  formatDuration(startTime, endTime) {
    if (!startTime) return '-';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    } else {
      return `${diffSecs}s`;
    }
  }
});

Template.cronSettings.events({
  'click .js-cron-migrations'(event) {
    event.preventDefault();
    const instance = Template.instance();
    instance.showMigrations.set(true);
    instance.showJobs.set(false);
    instance.showAddJob.set(false);
  },
  
  'click .js-cron-board-operations'(event) {
    event.preventDefault();
    const instance = Template.instance();
    instance.showMigrations.set(false);
    instance.showBoardOperations.set(true);
    instance.showJobs.set(false);
    instance.showAddJob.set(false);
    instance.loadBoardOperations();
  },
  
  'click .js-cron-jobs'(event) {
    event.preventDefault();
    const instance = Template.instance();
    instance.showMigrations.set(false);
    instance.showBoardOperations.set(false);
    instance.showJobs.set(true);
    instance.showAddJob.set(false);
    instance.loadCronJobs();
  },
  
  'click .js-cron-add'(event) {
    event.preventDefault();
    const instance = Template.instance();
    instance.showMigrations.set(false);
    instance.showJobs.set(false);
    instance.showAddJob.set(true);
  },
  
  'click .js-start-all-migrations'(event) {
    event.preventDefault();
    Meteor.call('cron.startAllMigrations', (error, result) => {
      if (error) {
        console.error('Failed to start migrations:', error);
        alert('Failed to start migrations: ' + error.message);
      } else {
        console.log('Migrations started successfully');
        Template.instance().pollMigrationProgress();
      }
    });
  },
  
  'click .js-pause-all-migrations'(event) {
    event.preventDefault();
    // Pause all migration cron jobs
    const jobs = cronJobs.get();
    jobs.forEach(job => {
      if (job.name.startsWith('migration_')) {
        Meteor.call('cron.pauseJob', job.name);
      }
    });
  },
  
  'click .js-stop-all-migrations'(event) {
    event.preventDefault();
    // Stop all migration cron jobs
    const jobs = cronJobs.get();
    jobs.forEach(job => {
      if (job.name.startsWith('migration_')) {
        Meteor.call('cron.stopJob', job.name);
      }
    });
  },
  
  'click .js-refresh-jobs'(event) {
    event.preventDefault();
    Template.instance().loadCronJobs();
  },
  
  'click .js-start-job'(event) {
    event.preventDefault();
    const jobName = $(event.currentTarget).data('job');
    Meteor.call('cron.startJob', jobName, (error, result) => {
      if (error) {
        console.error('Failed to start job:', error);
        alert('Failed to start job: ' + error.message);
      } else {
        console.log('Job started successfully');
        Template.instance().loadCronJobs();
      }
    });
  },
  
  'click .js-pause-job'(event) {
    event.preventDefault();
    const jobName = $(event.currentTarget).data('job');
    Meteor.call('cron.pauseJob', jobName, (error, result) => {
      if (error) {
        console.error('Failed to pause job:', error);
        alert('Failed to pause job: ' + error.message);
      } else {
        console.log('Job paused successfully');
        Template.instance().loadCronJobs();
      }
    });
  },
  
  'click .js-stop-job'(event) {
    event.preventDefault();
    const jobName = $(event.currentTarget).data('job');
    Meteor.call('cron.stopJob', jobName, (error, result) => {
      if (error) {
        console.error('Failed to stop job:', error);
        alert('Failed to stop job: ' + error.message);
      } else {
        console.log('Job stopped successfully');
        Template.instance().loadCronJobs();
      }
    });
  },
  
  'click .js-remove-job'(event) {
    event.preventDefault();
    const jobName = $(event.currentTarget).data('job');
    if (confirm('Are you sure you want to remove this job?')) {
      Meteor.call('cron.removeJob', jobName, (error, result) => {
        if (error) {
          console.error('Failed to remove job:', error);
          alert('Failed to remove job: ' + error.message);
        } else {
          console.log('Job removed successfully');
          Template.instance().loadCronJobs();
        }
      });
    }
  },
  
  'submit .js-add-cron-job-form'(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const jobData = {
      name: formData.get('name'),
      description: formData.get('description'),
      schedule: formData.get('schedule'),
      weight: parseInt(formData.get('weight'))
    };
    
    Meteor.call('cron.addJob', jobData, (error, result) => {
      if (error) {
        console.error('Failed to add job:', error);
        alert('Failed to add job: ' + error.message);
      } else {
        console.log('Job added successfully');
        form.reset();
        Template.instance().showJobs.set(true);
        Template.instance().showAddJob.set(false);
        Template.instance().loadCronJobs();
      }
    });
  },
  
  'click .js-cancel-add-job'(event) {
    event.preventDefault();
    const instance = Template.instance();
    instance.showJobs.set(true);
    instance.showAddJob.set(false);
  },

  'click .js-refresh-board-operations'(event) {
    event.preventDefault();
    Template.instance().loadBoardOperations();
  },

  'click .js-start-test-operation'(event) {
    event.preventDefault();
    const testBoardId = 'test-board-' + Date.now();
    const operationData = {
      sourceBoardId: 'source-board',
      targetBoardId: 'target-board',
      copyOptions: { includeCards: true, includeAttachments: true }
    };
    
    Meteor.call('cron.startBoardOperation', testBoardId, 'copy_board', operationData, (error, result) => {
      if (error) {
        console.error('Failed to start test operation:', error);
        alert('Failed to start test operation: ' + error.message);
      } else {
        console.log('Test operation started:', result);
        Template.instance().loadBoardOperations();
      }
    });
  },

  'input .js-search-board-operations'(event) {
    const searchTerm = $(event.currentTarget).val();
    const instance = Template.instance();
    instance.searchTerm.set(searchTerm);
    instance.currentPage.set(1);
    instance.loadBoardOperations();
  },

  'click .js-prev-page'(event) {
    event.preventDefault();
    const instance = Template.instance();
    const currentPage = instance.currentPage.get();
    if (currentPage > 1) {
      instance.currentPage.set(currentPage - 1);
      instance.loadBoardOperations();
    }
  },

  'click .js-next-page'(event) {
    event.preventDefault();
    const instance = Template.instance();
    const currentPage = instance.currentPage.get();
    const pagination = instance.pagination.get();
    if (currentPage < pagination.totalPages) {
      instance.currentPage.set(currentPage + 1);
      instance.loadBoardOperations();
    }
  },

  'click .js-pause-operation'(event) {
    event.preventDefault();
    const operationId = $(event.currentTarget).data('operation');
    // Implementation for pausing operation
    console.log('Pause operation:', operationId);
  },

  'click .js-resume-operation'(event) {
    event.preventDefault();
    const operationId = $(event.currentTarget).data('operation');
    // Implementation for resuming operation
    console.log('Resume operation:', operationId);
  },

  'click .js-stop-operation'(event) {
    event.preventDefault();
    const operationId = $(event.currentTarget).data('operation');
    if (confirm('Are you sure you want to stop this operation?')) {
      // Implementation for stopping operation
      console.log('Stop operation:', operationId);
    }
  },

  'click .js-view-details'(event) {
    event.preventDefault();
    const operationId = $(event.currentTarget).data('operation');
    // Implementation for viewing operation details
    console.log('View details for operation:', operationId);
  },

  'click .js-force-board-scan'(event) {
    event.preventDefault();
    Meteor.call('cron.forceBoardMigrationScan', (error, result) => {
      if (error) {
        console.error('Failed to force board scan:', error);
        alert('Failed to force board scan: ' + error.message);
      } else {
        console.log('Board scan started successfully');
        // Refresh the data
        Template.instance().loadBoardOperations();
      }
    });
  }
});

Template.cronSettings.prototype.loadCronData = function() {
  this.loading.set(true);
  
  // Load migration progress
  Meteor.call('cron.getMigrationProgress', (error, result) => {
    if (result) {
      migrationProgress.set(result.progress);
      migrationStatus.set(result.status);
      migrationCurrentStep.set(result.currentStep);
      migrationSteps.set(result.steps);
      isMigrating.set(result.isMigrating);
    }
  });
  
  // Load cron jobs
  this.loadCronJobs();
  
  this.loading.set(false);
};

Template.cronSettings.prototype.loadCronJobs = function() {
  Meteor.call('cron.getJobs', (error, result) => {
    if (result) {
      cronJobs.set(result);
    }
  });
};

Template.cronSettings.prototype.loadBoardOperations = function() {
  const instance = this;
  const page = instance.currentPage.get();
  const limit = instance.pageSize.get();
  const searchTerm = instance.searchTerm.get();

  Meteor.call('cron.getAllBoardOperations', page, limit, searchTerm, (error, result) => {
    if (result) {
      instance.boardOperations.set(result.operations);
      instance.pagination.set({
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        start: ((result.page - 1) * result.limit) + 1,
        end: Math.min(result.page * result.limit, result.total),
        hasPrev: result.page > 1,
        hasNext: result.page < result.totalPages
      });
    }
  });

  // Load operation stats
  Meteor.call('cron.getBoardOperationStats', (error, result) => {
    if (result) {
      instance.operationStats.set(result);
    }
  });

  // Load queue stats
  Meteor.call('cron.getQueueStats', (error, result) => {
    if (result) {
      instance.queueStats.set(result);
    }
  });

  // Load system resources
  Meteor.call('cron.getSystemResources', (error, result) => {
    if (result) {
      instance.systemResources.set(result);
    }
  });

  // Load board migration stats
  Meteor.call('cron.getBoardMigrationStats', (error, result) => {
    if (result) {
      instance.boardMigrationStats.set(result);
    }
  });
};

Template.cronSettings.prototype.pollMigrationProgress = function() {
  const pollInterval = setInterval(() => {
    Meteor.call('cron.getMigrationProgress', (error, result) => {
      if (result) {
        migrationProgress.set(result.progress);
        migrationStatus.set(result.status);
        migrationCurrentStep.set(result.currentStep);
        migrationSteps.set(result.steps);
        isMigrating.set(result.isMigrating);
        
        // Stop polling if migration is complete
        if (!result.isMigrating && result.progress === 100) {
          clearInterval(pollInterval);
        }
      }
    });
  }, 1000);
};
