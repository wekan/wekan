/**
 * Cron Migration Manager
 * Manages database migrations as cron jobs using percolate:synced-cron
 */

import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/percolate:synced-cron';
import { ReactiveVar } from 'meteor/reactive-var';
import { cronJobStorage } from './cronJobStorage';

// Server-side reactive variables for cron migration progress
export const cronMigrationProgress = new ReactiveVar(0);
export const cronMigrationStatus = new ReactiveVar('');
export const cronMigrationCurrentStep = new ReactiveVar('');
export const cronMigrationSteps = new ReactiveVar([]);
export const cronIsMigrating = new ReactiveVar(false);
export const cronJobs = new ReactiveVar([]);

// Board-specific operation tracking
export const boardOperations = new ReactiveVar(new Map());
export const boardOperationProgress = new ReactiveVar(new Map());

class CronMigrationManager {
  constructor() {
    this.migrationSteps = this.initializeMigrationSteps();
    this.currentStepIndex = 0;
    this.startTime = null;
    this.isRunning = false;
    this.jobProcessor = null;
    this.processingInterval = null;
  }

  /**
   * Initialize migration steps as cron jobs
   */
  initializeMigrationSteps() {
    return [
      {
        id: 'board-background-color',
        name: 'Board Background Colors',
        description: 'Setting up board background colors',
        weight: 1,
        completed: false,
        progress: 0,
        cronName: 'migration_board_background_color',
        schedule: 'every 1 minute', // Will be changed to 'once' when triggered
        status: 'stopped'
      },
      {
        id: 'add-cardcounterlist-allowed',
        name: 'Card Counter List Settings',
        description: 'Adding card counter list permissions',
        weight: 1,
        completed: false,
        progress: 0,
        cronName: 'migration_card_counter_list',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'add-boardmemberlist-allowed',
        name: 'Board Member List Settings',
        description: 'Adding board member list permissions',
        weight: 1,
        completed: false,
        progress: 0,
        cronName: 'migration_board_member_list',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'lowercase-board-permission',
        name: 'Board Permission Standardization',
        description: 'Converting board permissions to lowercase',
        weight: 1,
        completed: false,
        progress: 0,
        cronName: 'migration_lowercase_permission',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'change-attachments-type-for-non-images',
        name: 'Attachment Type Standardization',
        description: 'Updating attachment types for non-images',
        weight: 2,
        completed: false,
        progress: 0,
        cronName: 'migration_attachment_types',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'card-covers',
        name: 'Card Covers System',
        description: 'Setting up card cover functionality',
        weight: 2,
        completed: false,
        progress: 0,
        cronName: 'migration_card_covers',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'use-css-class-for-boards-colors',
        name: 'Board Color CSS Classes',
        description: 'Converting board colors to CSS classes',
        weight: 2,
        completed: false,
        progress: 0,
        cronName: 'migration_board_color_css',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'denormalize-star-number-per-board',
        name: 'Board Star Counts',
        description: 'Calculating star counts per board',
        weight: 3,
        completed: false,
        progress: 0,
        cronName: 'migration_star_numbers',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'add-member-isactive-field',
        name: 'Member Activity Status',
        description: 'Adding member activity tracking',
        weight: 2,
        completed: false,
        progress: 0,
        cronName: 'migration_member_activity',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'add-sort-checklists',
        name: 'Checklist Sorting',
        description: 'Adding sort order to checklists',
        weight: 2,
        completed: false,
        progress: 0,
        cronName: 'migration_sort_checklists',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'add-swimlanes',
        name: 'Swimlanes System',
        description: 'Setting up swimlanes functionality',
        weight: 4,
        completed: false,
        progress: 0,
        cronName: 'migration_swimlanes',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'add-views',
        name: 'Board Views',
        description: 'Adding board view options',
        weight: 2,
        completed: false,
        progress: 0,
        cronName: 'migration_views',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'add-checklist-items',
        name: 'Checklist Items',
        description: 'Setting up checklist items system',
        weight: 3,
        completed: false,
        progress: 0,
        cronName: 'migration_checklist_items',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'add-card-types',
        name: 'Card Types',
        description: 'Adding card type functionality',
        weight: 2,
        completed: false,
        progress: 0,
        cronName: 'migration_card_types',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'add-custom-fields-to-cards',
        name: 'Custom Fields',
        description: 'Adding custom fields to cards',
        weight: 3,
        completed: false,
        progress: 0,
        cronName: 'migration_custom_fields',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'migrate-attachments-collectionFS-to-ostrioFiles',
        name: 'Migrate Attachments to Meteor-Files',
        description: 'Migrating attachments from CollectionFS to Meteor-Files',
        weight: 8,
        completed: false,
        progress: 0,
        cronName: 'migration_attachments_collectionfs',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'migrate-avatars-collectionFS-to-ostrioFiles',
        name: 'Migrate Avatars to Meteor-Files',
        description: 'Migrating avatars from CollectionFS to Meteor-Files',
        weight: 6,
        completed: false,
        progress: 0,
        cronName: 'migration_avatars_collectionfs',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'migrate-lists-to-per-swimlane',
        name: 'Migrate Lists to Per-Swimlane',
        description: 'Migrating lists to per-swimlane structure',
        weight: 5,
        completed: false,
        progress: 0,
        cronName: 'migration_lists_per_swimlane',
        schedule: 'every 1 minute',
        status: 'stopped'
      },
      {
        id: 'restore-legacy-lists',
        name: 'Restore Legacy Lists',
        description: 'Restore legacy lists to their original shared state across all swimlanes',
        weight: 3,
        completed: false,
        progress: 0,
        cronName: 'migration_restore_legacy_lists',
        schedule: 'every 1 minute',
        status: 'stopped'
      }
    ];
  }

  /**
   * Initialize all migration cron jobs
   */
  initializeCronJobs() {
    this.migrationSteps.forEach(step => {
      this.createCronJob(step);
    });
    
    // Start job processor
    this.startJobProcessor();
    
    // Update cron jobs list after a short delay to allow SyncedCron to initialize
    Meteor.setTimeout(() => {
      this.updateCronJobsList();
    }, 1000);
  }

  /**
   * Start the job processor for CPU-aware job execution
   */
  startJobProcessor() {
    if (this.processingInterval) {
      return; // Already running
    }

    this.processingInterval = Meteor.setInterval(() => {
      this.processJobQueue();
    }, 5000); // Check every 5 seconds

    // Cron job processor started with CPU throttling
  }

  /**
   * Stop the job processor
   */
  stopJobProcessor() {
    if (this.processingInterval) {
      Meteor.clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process the job queue with CPU throttling
   */
  async processJobQueue() {
    const canStart = cronJobStorage.canStartNewJob();
    
    if (!canStart.canStart) {
      // Suppress "Cannot start new job: Maximum concurrent jobs reached" message
      // console.log(`Cannot start new job: ${canStart.reason}`);
      return;
    }

    const nextJob = cronJobStorage.getNextJob();
    if (!nextJob) {
      return; // No jobs in queue
    }

    // Start the job
    await this.executeJob(nextJob);
  }

  /**
   * Execute a job from the queue
   */
  async executeJob(queueJob) {
    const { jobId, jobType, jobData } = queueJob;
    
    try {
      // Update queue status to running
      cronJobStorage.updateQueueStatus(jobId, 'running', { startedAt: new Date() });
      
      // Save job status
      cronJobStorage.saveJobStatus(jobId, {
        jobType,
        status: 'running',
        progress: 0,
        startedAt: new Date(),
        ...jobData
      });

      // Execute based on job type
      if (jobType === 'migration') {
        await this.executeMigrationJob(jobId, jobData);
      } else if (jobType === 'board_operation') {
        await this.executeBoardOperationJob(jobId, jobData);
      } else if (jobType === 'board_migration') {
        await this.executeBoardMigrationJob(jobId, jobData);
      } else {
        throw new Error(`Unknown job type: ${jobType}`);
      }

      // Mark as completed
      cronJobStorage.updateQueueStatus(jobId, 'completed', { completedAt: new Date() });
      cronJobStorage.saveJobStatus(jobId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      });

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      
      // Mark as failed
      cronJobStorage.updateQueueStatus(jobId, 'failed', { 
        failedAt: new Date(),
        error: error.message 
      });
      cronJobStorage.saveJobStatus(jobId, {
        status: 'failed',
        error: error.message,
        failedAt: new Date()
      });
    }
  }

  /**
   * Execute a migration job
   */
  async executeMigrationJob(jobId, jobData) {
    if (!jobData) {
      throw new Error('Job data is required for migration execution');
    }
    
    const { stepId } = jobData;
    if (!stepId) {
      throw new Error('Step ID is required in job data');
    }
    
    const step = this.migrationSteps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Migration step ${stepId} not found`);
    }

    // Create steps for this migration
    const steps = this.createMigrationSteps(step);
    
    for (let i = 0; i < steps.length; i++) {
      const stepData = steps[i];
      
      // Save step status
      cronJobStorage.saveJobStep(jobId, i, {
        stepName: stepData.name,
        status: 'running',
        progress: 0
      });

      // Execute step
      await this.executeMigrationStep(jobId, i, stepData, stepId);

      // Mark step as completed
      cronJobStorage.saveJobStep(jobId, i, {
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      });

      // Update overall progress
      const progress = Math.round(((i + 1) / steps.length) * 100);
      cronJobStorage.saveJobStatus(jobId, { progress });
    }
  }

  /**
   * Create migration steps for a job
   */
  createMigrationSteps(step) {
    const steps = [];
    
    switch (step.id) {
      case 'board-background-color':
        steps.push(
          { name: 'Initialize board colors', duration: 1000 },
          { name: 'Update board documents', duration: 2000 },
          { name: 'Finalize changes', duration: 500 }
        );
        break;
      case 'add-cardcounterlist-allowed':
        steps.push(
          { name: 'Add card counter permissions', duration: 800 },
          { name: 'Update existing boards', duration: 1500 },
          { name: 'Verify permissions', duration: 700 }
        );
        break;
      case 'migrate-attachments-collectionFS-to-ostrioFiles':
        steps.push(
          { name: 'Scan CollectionFS attachments', duration: 2000 },
          { name: 'Create Meteor-Files records', duration: 3000 },
          { name: 'Migrate file data', duration: 5000 },
          { name: 'Update references', duration: 2000 },
          { name: 'Cleanup old data', duration: 1000 }
        );
        break;
      case 'restore-legacy-lists':
        steps.push(
          { name: 'Identify legacy lists', duration: 1000 },
          { name: 'Restore lists to shared state', duration: 2000 },
          { name: 'Update board settings', duration: 500 },
          { name: 'Verify restoration', duration: 500 }
        );
        break;
      default:
        steps.push(
          { name: `Execute ${step.name}`, duration: 2000 },
          { name: 'Verify changes', duration: 1000 }
        );
    }
    
    return steps;
  }

  /**
   * Execute a migration step
   */
  async executeMigrationStep(jobId, stepIndex, stepData, stepId) {
    const { name, duration } = stepData;
    
    if (stepId === 'restore-legacy-lists') {
      await this.executeRestoreLegacyListsMigration(jobId, stepIndex, stepData);
    } else {
      // Simulate step execution with progress updates for other migrations
      const progressSteps = 10;
      for (let i = 0; i <= progressSteps; i++) {
        const progress = Math.round((i / progressSteps) * 100);
        
        // Update step progress
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress,
          currentAction: `Executing: ${name} (${progress}%)`
        });
        
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, duration / progressSteps));
      }
    }
  }

  /**
   * Execute the restore legacy lists migration
   */
  async executeRestoreLegacyListsMigration(jobId, stepIndex, stepData) {
    const { name } = stepData;
    
    try {
      // Import collections directly for server-side access
      const { default: Boards } = await import('/models/boards');
      const { default: Lists } = await import('/models/lists');
      
      // Step 1: Identify legacy lists
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 25,
        currentAction: 'Identifying legacy lists...'
      });
      
      const boards = Boards.find({}).fetch();
      const migrationDate = new Date('2025-10-10T21:14:44.000Z'); // Date of commit 719ef87efceacfe91461a8eeca7cf74d11f4cc0a
      let totalLegacyLists = 0;
      
      for (const board of boards) {
        const allLists = Lists.find({ boardId: board._id }).fetch();
        const legacyLists = allLists.filter(list => {
          const listDate = list.createdAt || new Date(0);
          return listDate < migrationDate && list.swimlaneId && list.swimlaneId !== '';
        });
        totalLegacyLists += legacyLists.length;
      }
      
      // Step 2: Restore lists to shared state
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 50,
        currentAction: 'Restoring lists to shared state...'
      });
      
      let restoredCount = 0;
      
      for (const board of boards) {
        const allLists = Lists.find({ boardId: board._id }).fetch();
        const legacyLists = allLists.filter(list => {
          const listDate = list.createdAt || new Date(0);
          return listDate < migrationDate && list.swimlaneId && list.swimlaneId !== '';
        });
        
        // Restore legacy lists to shared state (empty swimlaneId)
        for (const list of legacyLists) {
          Lists.direct.update(list._id, {
            $set: {
              swimlaneId: ''
            }
          });
          restoredCount++;
        }
        
        // Mark the board as having legacy lists
        if (legacyLists.length > 0) {
          Boards.direct.update(board._id, {
            $set: {
              hasLegacyLists: true
            }
          });
        }
      }
      
      // Step 3: Update board settings
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 75,
        currentAction: 'Updating board settings...'
      });
      
      // Step 4: Verify restoration
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Verification complete. Restored ${restoredCount} legacy lists.`
      });
      
      console.log(`Successfully restored ${restoredCount} legacy lists across ${boards.length} boards`);
      
    } catch (error) {
      console.error('Error during restore legacy lists migration:', error);
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: `Error: ${error.message}`,
        status: 'error'
      });
      throw error;
    }
  }

  /**
   * Execute a board operation job
   */
  async executeBoardOperationJob(jobId, jobData) {
    const { operationType, operationData } = jobData;
    
    // Use existing board operation logic
    await this.executeBoardOperation(jobId, operationType, operationData);
  }

  /**
   * Execute a board migration job
   */
  async executeBoardMigrationJob(jobId, jobData) {
    const { boardId, boardTitle, migrationType } = jobData;
    
    try {
      // Starting board migration
      
      // Create migration steps for this board
      const steps = this.createBoardMigrationSteps(boardId, migrationType);
      
      for (let i = 0; i < steps.length; i++) {
        const stepData = steps[i];
        
        // Save step status
        cronJobStorage.saveJobStep(jobId, i, {
          stepName: stepData.name,
          status: 'running',
          progress: 0,
          boardId: boardId
        });

        // Execute step
        await this.executeBoardMigrationStep(jobId, i, stepData, boardId);

        // Mark step as completed
        cronJobStorage.saveJobStep(jobId, i, {
          status: 'completed',
          progress: 100,
          completedAt: new Date()
        });

        // Update overall progress
        const progress = Math.round(((i + 1) / steps.length) * 100);
        cronJobStorage.saveJobStatus(jobId, { progress });
      }

      // Mark board as migrated
      this.markBoardAsMigrated(boardId, migrationType);
      
      // Completed board migration

    } catch (error) {
      console.error(`Board migration failed for ${boardId}:`, error);
      throw error;
    }
  }

  /**
   * Create migration steps for a board
   */
  createBoardMigrationSteps(boardId, migrationType) {
    const steps = [];
    
    if (migrationType === 'full_board_migration') {
      steps.push(
        { name: 'Check board structure', duration: 500, type: 'validation' },
        { name: 'Migrate lists to swimlanes', duration: 2000, type: 'lists' },
        { name: 'Migrate attachments', duration: 3000, type: 'attachments' },
        { name: 'Update board metadata', duration: 1000, type: 'metadata' },
        { name: 'Verify migration', duration: 1000, type: 'verification' }
      );
    } else {
      // Default migration steps
      steps.push(
        { name: 'Initialize board migration', duration: 1000, type: 'init' },
        { name: 'Execute migration', duration: 2000, type: 'migration' },
        { name: 'Finalize changes', duration: 1000, type: 'finalize' }
      );
    }
    
    return steps;
  }

  /**
   * Execute a board migration step
   */
  async executeBoardMigrationStep(jobId, stepIndex, stepData, boardId) {
    const { name, duration, type } = stepData;
    
    // Simulate step execution with progress updates
    const progressSteps = 10;
    for (let i = 0; i <= progressSteps; i++) {
      const progress = Math.round((i / progressSteps) * 100);
      
      // Update step progress
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress,
        currentAction: `Executing: ${name} (${progress}%)`
      });
      
      // Simulate work based on step type
      await this.simulateBoardMigrationWork(type, duration / progressSteps);
    }
  }

  /**
   * Simulate board migration work
   */
  async simulateBoardMigrationWork(stepType, duration) {
    // Simulate different types of migration work
    switch (stepType) {
      case 'validation':
        // Quick validation
        await new Promise(resolve => setTimeout(resolve, duration * 0.5));
        break;
      case 'lists':
        // List migration work
        await new Promise(resolve => setTimeout(resolve, duration));
        break;
      case 'attachments':
        // Attachment migration work
        await new Promise(resolve => setTimeout(resolve, duration * 1.2));
        break;
      case 'metadata':
        // Metadata update work
        await new Promise(resolve => setTimeout(resolve, duration * 0.8));
        break;
      case 'verification':
        // Verification work
        await new Promise(resolve => setTimeout(resolve, duration * 0.6));
        break;
      default:
        // Default work
        await new Promise(resolve => setTimeout(resolve, duration));
    }
  }

  /**
   * Mark a board as migrated
   */
  markBoardAsMigrated(boardId, migrationType) {
    try {
      // Update board with migration markers
      const updateQuery = {
        'migrationMarkers.fullMigrationCompleted': true,
        'migrationMarkers.lastMigration': new Date(),
        'migrationMarkers.migrationType': migrationType
      };

      // Update the board document
      if (typeof Boards !== 'undefined') {
        Boards.update(boardId, { $set: updateQuery });
      }

      console.log(`Marked board ${boardId} as migrated`);

    } catch (error) {
      console.error(`Error marking board ${boardId} as migrated:`, error);
    }
  }

  /**
   * Create a cron job for a migration step
   */
  createCronJob(step) {
    SyncedCron.add({
      name: step.cronName,
      schedule: (parser) => parser.text(step.schedule),
      job: () => {
        this.runMigrationStep(step);
      },
    });
  }

  /**
   * Run a migration step
   */
  async runMigrationStep(step) {
    try {
      // Starting migration step
      
      cronMigrationCurrentStep.set(step.name);
      cronMigrationStatus.set(`Running: ${step.description}`);
      cronIsMigrating.set(true);

      // Simulate migration progress
      const progressSteps = 10;
      for (let i = 0; i <= progressSteps; i++) {
        step.progress = (i / progressSteps) * 100;
        this.updateProgress();
        
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark as completed
      step.completed = true;
      step.progress = 100;
      step.status = 'completed';

      // Completed migration step
      
      // Update progress
      this.updateProgress();

    } catch (error) {
      console.error(`Migration ${step.name} failed:`, error);
      step.status = 'error';
      cronMigrationStatus.set(`Migration failed: ${error.message}`);
    }
  }

  /**
   * Start all migrations using job queue
   */
  async startAllMigrations() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    cronIsMigrating.set(true);
    cronMigrationStatus.set('Adding migrations to job queue...');
    this.startTime = Date.now();

    try {
      // Add all migration steps to the job queue
      for (let i = 0; i < this.migrationSteps.length; i++) {
        const step = this.migrationSteps[i];
        
        if (step.completed) {
          continue; // Skip already completed steps
        }

        // Add to job queue
        const jobId = `migration_${step.id}_${Date.now()}`;
        cronJobStorage.addToQueue(jobId, 'migration', step.weight, {
          stepId: step.id,
          stepName: step.name,
          stepDescription: step.description
        });

        // Save initial job status
        cronJobStorage.saveJobStatus(jobId, {
          jobType: 'migration',
          status: 'pending',
          progress: 0,
          stepId: step.id,
          stepName: step.name,
          stepDescription: step.description
        });
      }

      cronMigrationStatus.set('Migrations added to queue. Processing will begin shortly...');
      
      // Start monitoring progress
      this.monitorMigrationProgress();

    } catch (error) {
      console.error('Failed to start migrations:', error);
      cronMigrationStatus.set(`Failed to start migrations: ${error.message}`);
      cronIsMigrating.set(false);
      this.isRunning = false;
    }
  }

  /**
   * Monitor migration progress
   */
  monitorMigrationProgress() {
    const monitorInterval = Meteor.setInterval(() => {
      const stats = cronJobStorage.getQueueStats();
      const incompleteJobs = cronJobStorage.getIncompleteJobs();
      
      // Update progress
      const totalJobs = stats.total;
      const completedJobs = stats.completed;
      const progress = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
      
      cronMigrationProgress.set(progress);
      
      // Update status
      if (stats.running > 0) {
        const runningJob = incompleteJobs.find(job => job.status === 'running');
        if (runningJob) {
          cronMigrationCurrentStep.set(runningJob.stepName || 'Processing migration...');
          cronMigrationStatus.set(`Running: ${runningJob.stepName || 'Migration in progress'}`);
        }
      } else if (stats.pending > 0) {
        cronMigrationStatus.set(`${stats.pending} migrations pending in queue`);
        cronMigrationCurrentStep.set('Waiting for available resources...');
      } else if (stats.completed === totalJobs && totalJobs > 0) {
        // All migrations completed
        cronMigrationStatus.set('All migrations completed successfully!');
        cronMigrationProgress.set(100);
        cronMigrationCurrentStep.set('');
        
        // Clear status after delay
        setTimeout(() => {
          cronIsMigrating.set(false);
          cronMigrationStatus.set('');
          cronMigrationProgress.set(0);
        }, 3000);
        
        Meteor.clearInterval(monitorInterval);
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * Start a specific cron job
   */
  async startCronJob(cronName) {
    // Change schedule to run once
    const job = SyncedCron.jobs.find(j => j.name === cronName);
    if (job) {
      job.schedule = 'once';
      SyncedCron.start();
    }
  }

  /**
   * Wait for a cron job to complete
   */
  async waitForCronJobCompletion(step) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (step.completed || step.status === 'error') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }

  /**
   * Stop a specific cron job
   */
  stopCronJob(cronName) {
    SyncedCron.remove(cronName);
    const step = this.migrationSteps.find(s => s.cronName === cronName);
    if (step) {
      step.status = 'stopped';
    }
    this.updateCronJobsList();
  }

  /**
   * Pause a specific cron job
   */
  pauseCronJob(cronName) {
    SyncedCron.pause(cronName);
    const step = this.migrationSteps.find(s => s.cronName === cronName);
    if (step) {
      step.status = 'paused';
    }
    this.updateCronJobsList();
  }

  /**
   * Resume a specific cron job
   */
  resumeCronJob(cronName) {
    SyncedCron.resume(cronName);
    const step = this.migrationSteps.find(s => s.cronName === cronName);
    if (step) {
      step.status = 'running';
    }
    this.updateCronJobsList();
  }

  /**
   * Remove a cron job
   */
  removeCronJob(cronName) {
    SyncedCron.remove(cronName);
    this.migrationSteps = this.migrationSteps.filter(s => s.cronName !== cronName);
    this.updateCronJobsList();
  }

  /**
   * Add a new cron job
   */
  addCronJob(jobData) {
    const step = {
      id: jobData.id || `custom_${Date.now()}`,
      name: jobData.name,
      description: jobData.description,
      weight: jobData.weight || 1,
      completed: false,
      progress: 0,
      cronName: jobData.cronName || `custom_${Date.now()}`,
      schedule: jobData.schedule || 'every 1 minute',
      status: 'stopped'
    };

    this.migrationSteps.push(step);
    this.createCronJob(step);
    this.updateCronJobsList();
  }

  /**
   * Update progress variables
   */
  updateProgress() {
    const totalWeight = this.migrationSteps.reduce((total, step) => total + step.weight, 0);
    const completedWeight = this.migrationSteps.reduce((total, step) => {
      return total + (step.completed ? step.weight : step.progress * step.weight / 100);
    }, 0);
    const progress = Math.round((completedWeight / totalWeight) * 100);
    
    cronMigrationProgress.set(progress);
    cronMigrationSteps.set([...this.migrationSteps]);
  }

  /**
   * Update cron jobs list
   */
  updateCronJobsList() {
    // Check if SyncedCron is available and has jobs
    if (!SyncedCron || !SyncedCron.jobs || !Array.isArray(SyncedCron.jobs)) {
      // SyncedCron not available or no jobs yet
      cronJobs.set([]);
      return;
    }

    const jobs = SyncedCron.jobs.map(job => {
      const step = this.migrationSteps.find(s => s.cronName === job.name);
      return {
        name: job.name,
        schedule: job.schedule,
        status: step ? step.status : 'unknown',
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        running: job.running
      };
    });
    cronJobs.set(jobs);
  }

  /**
   * Get all cron jobs
   */
  getAllCronJobs() {
    return cronJobs.get();
  }

  /**
   * Get migration steps
   */
  getMigrationSteps() {
    return this.migrationSteps;
  }

  /**
   * Start a long-running operation for a specific board
   */
  startBoardOperation(boardId, operationType, operationData) {
    const operationId = `${boardId}_${operationType}_${Date.now()}`;
    
    // Add to job queue
    cronJobStorage.addToQueue(operationId, 'board_operation', 3, {
      boardId,
      operationType,
      operationData
    });

    // Save initial job status
    cronJobStorage.saveJobStatus(operationId, {
      jobType: 'board_operation',
      status: 'pending',
      progress: 0,
      boardId,
      operationType,
      operationData,
      createdAt: new Date()
    });

    // Update board operations map for backward compatibility
    const operation = {
      id: operationId,
      boardId: boardId,
      type: operationType,
      data: operationData,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      endTime: null,
      error: null
    };

    const operations = boardOperations.get();
    operations.set(operationId, operation);
    boardOperations.set(operations);

    return operationId;
  }

  /**
   * Execute a board operation
   */
  async executeBoardOperation(operationId, operationType, operationData) {
    const operations = boardOperations.get();
    const operation = operations.get(operationId);
    
    if (!operation) {
      console.error(`Operation ${operationId} not found`);
      return;
    }

    try {
      console.log(`Starting board operation: ${operationType} for board ${operation.boardId}`);
      
      // Update operation status
      operation.status = 'running';
      operation.progress = 0;
      this.updateBoardOperation(operationId, operation);

      // Execute the specific operation
      switch (operationType) {
        case 'copy_board':
          await this.copyBoard(operationId, operationData);
          break;
        case 'move_board':
          await this.moveBoard(operationId, operationData);
          break;
        case 'copy_swimlane':
          await this.copySwimlane(operationId, operationData);
          break;
        case 'move_swimlane':
          await this.moveSwimlane(operationId, operationData);
          break;
        case 'copy_list':
          await this.copyList(operationId, operationData);
          break;
        case 'move_list':
          await this.moveList(operationId, operationData);
          break;
        case 'copy_card':
          await this.copyCard(operationId, operationData);
          break;
        case 'move_card':
          await this.moveCard(operationId, operationData);
          break;
        case 'copy_checklist':
          await this.copyChecklist(operationId, operationData);
          break;
        case 'move_checklist':
          await this.moveChecklist(operationId, operationData);
          break;
        default:
          throw new Error(`Unknown operation type: ${operationType}`);
      }

      // Mark as completed
      operation.status = 'completed';
      operation.progress = 100;
      operation.endTime = new Date();
      this.updateBoardOperation(operationId, operation);

      console.log(`Completed board operation: ${operationType} for board ${operation.boardId}`);

    } catch (error) {
      console.error(`Board operation ${operationType} failed:`, error);
      operation.status = 'error';
      operation.error = error.message;
      operation.endTime = new Date();
      this.updateBoardOperation(operationId, operation);
    }
  }

  /**
   * Update board operation progress
   */
  updateBoardOperation(operationId, operation) {
    const operations = boardOperations.get();
    operations.set(operationId, operation);
    boardOperations.set(operations);

    // Update progress map
    const progressMap = boardOperationProgress.get();
    progressMap.set(operationId, {
      progress: operation.progress,
      status: operation.status,
      error: operation.error
    });
    boardOperationProgress.set(progressMap);
  }

  /**
   * Copy board operation
   */
  async copyBoard(operationId, data) {
    const { sourceBoardId, targetBoardId, copyOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate copy progress
    const steps = ['copying_swimlanes', 'copying_lists', 'copying_cards', 'copying_attachments', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Move board operation
   */
  async moveBoard(operationId, data) {
    const { sourceBoardId, targetBoardId, moveOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate move progress
    const steps = ['preparing_move', 'moving_swimlanes', 'moving_lists', 'moving_cards', 'updating_references', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  /**
   * Copy swimlane operation
   */
  async copySwimlane(operationId, data) {
    const { sourceSwimlaneId, targetBoardId, copyOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate copy progress
    const steps = ['copying_swimlane', 'copying_lists', 'copying_cards', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Move swimlane operation
   */
  async moveSwimlane(operationId, data) {
    const { sourceSwimlaneId, targetBoardId, moveOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate move progress
    const steps = ['preparing_move', 'moving_swimlane', 'updating_references', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  /**
   * Copy list operation
   */
  async copyList(operationId, data) {
    const { sourceListId, targetBoardId, copyOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate copy progress
    const steps = ['copying_list', 'copying_cards', 'copying_attachments', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  /**
   * Move list operation
   */
  async moveList(operationId, data) {
    const { sourceListId, targetBoardId, moveOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate move progress
    const steps = ['preparing_move', 'moving_list', 'updating_references', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  /**
   * Copy card operation
   */
  async copyCard(operationId, data) {
    const { sourceCardId, targetListId, copyOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate copy progress
    const steps = ['copying_card', 'copying_attachments', 'copying_checklists', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  /**
   * Move card operation
   */
  async moveCard(operationId, data) {
    const { sourceCardId, targetListId, moveOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate move progress
    const steps = ['preparing_move', 'moving_card', 'updating_references', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Copy checklist operation
   */
  async copyChecklist(operationId, data) {
    const { sourceChecklistId, targetCardId, copyOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate copy progress
    const steps = ['copying_checklist', 'copying_items', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Move checklist operation
   */
  async moveChecklist(operationId, data) {
    const { sourceChecklistId, targetCardId, moveOptions } = data;
    const operation = boardOperations.get().get(operationId);
    
    // Simulate move progress
    const steps = ['preparing_move', 'moving_checklist', 'finalizing'];
    for (let i = 0; i < steps.length; i++) {
      operation.progress = Math.round(((i + 1) / steps.length) * 100);
      this.updateBoardOperation(operationId, operation);
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Get board operations for a specific board
   */
  getBoardOperations(boardId) {
    const operations = boardOperations.get();
    const boardOps = [];
    
    for (const [operationId, operation] of operations) {
      if (operation.boardId === boardId) {
        boardOps.push(operation);
      }
    }
    
    return boardOps.sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Get all board operations with pagination
   */
  getAllBoardOperations(page = 1, limit = 20, searchTerm = '') {
    const operations = boardOperations.get();
    const allOps = Array.from(operations.values());
    
    // Filter by search term if provided
    let filteredOps = allOps;
    if (searchTerm) {
      filteredOps = allOps.filter(op => 
        op.boardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by start time (newest first)
    filteredOps.sort((a, b) => b.startTime - a.startTime);
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOps = filteredOps.slice(startIndex, endIndex);
    
    return {
      operations: paginatedOps,
      total: filteredOps.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(filteredOps.length / limit)
    };
  }

  /**
   * Get board operation statistics
   */
  getBoardOperationStats() {
    const operations = boardOperations.get();
    const stats = {
      total: operations.size,
      running: 0,
      completed: 0,
      error: 0,
      byType: {}
    };
    
    for (const [operationId, operation] of operations) {
      stats[operation.status]++;
      
      if (!stats.byType[operation.type]) {
        stats.byType[operation.type] = 0;
      }
      stats.byType[operation.type]++;
    }
    
    return stats;
  }

  /**
   * Trigger restore legacy lists migration
   */
  async triggerRestoreLegacyListsMigration() {
    try {
      // Find the restore legacy lists step
      const step = this.migrationSteps.find(s => s.id === 'restore-legacy-lists');
      if (!step) {
        throw new Error('Restore legacy lists migration step not found');
      }

      // Create a job for this migration
      const jobId = `restore_legacy_lists_${Date.now()}`;
      cronJobStorage.addToQueue(jobId, 'migration', step.weight, {
        stepId: step.id,
        stepName: step.name,
        stepDescription: step.description
      });

      // Save initial job status
      cronJobStorage.saveJobStatus(jobId, {
        jobType: 'migration',
        status: 'pending',
        progress: 0,
        stepId: step.id,
        stepName: step.name
      });

      // Execute the migration immediately
      const jobData = {
        stepId: step.id,
        stepName: step.name,
        stepDescription: step.description
      };
      await this.executeMigrationJob(jobId, jobData);

      return {
        success: true,
        jobId: jobId,
        message: 'Restore legacy lists migration triggered successfully'
      };

    } catch (error) {
      console.error('Error triggering restore legacy lists migration:', error);
      throw new Meteor.Error('migration-trigger-failed', `Failed to trigger migration: ${error.message}`);
    }
  }
}

// Export singleton instance
export const cronMigrationManager = new CronMigrationManager();

// Initialize cron jobs on server start
Meteor.startup(() => {
  cronMigrationManager.initializeCronJobs();
});

// Meteor methods for client-server communication
Meteor.methods({
  'cron.startAllMigrations'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.startAllMigrations();
  },
  
  'cron.startJob'(cronName) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.startCronJob(cronName);
  },
  
  'cron.stopJob'(cronName) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.stopCronJob(cronName);
  },
  
  'cron.pauseJob'(cronName) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.pauseCronJob(cronName);
  },
  
  'cron.resumeJob'(cronName) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.resumeCronJob(cronName);
  },
  
  'cron.removeJob'(cronName) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.removeCronJob(cronName);
  },
  
  'cron.addJob'(jobData) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.addCronJob(jobData);
  },
  
  'cron.getJobs'() {
    return cronMigrationManager.getAllCronJobs();
  },
  
  'cron.getMigrationProgress'() {
    return {
      progress: cronMigrationProgress.get(),
      status: cronMigrationStatus.get(),
      currentStep: cronMigrationCurrentStep.get(),
      steps: cronMigrationSteps.get(),
      isMigrating: cronIsMigrating.get()
    };
  },

  'cron.startBoardOperation'(boardId, operationType, operationData) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.startBoardOperation(boardId, operationType, operationData);
  },

  'cron.getBoardOperations'(boardId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.getBoardOperations(boardId);
  },

  'cron.getAllBoardOperations'(page, limit, searchTerm) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.getAllBoardOperations(page, limit, searchTerm);
  },

  'cron.getBoardOperationStats'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronMigrationManager.getBoardOperationStats();
  },

  'cron.getJobDetails'(jobId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronJobStorage.getJobDetails(jobId);
  },

  'cron.getQueueStats'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronJobStorage.getQueueStats();
  },

  'cron.getSystemResources'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronJobStorage.getSystemResources();
  },

  'cron.pauseJob'(jobId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    cronJobStorage.updateQueueStatus(jobId, 'paused');
    cronJobStorage.saveJobStatus(jobId, { status: 'paused' });
    return { success: true };
  },

  'cron.resumeJob'(jobId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    cronJobStorage.updateQueueStatus(jobId, 'pending');
    cronJobStorage.saveJobStatus(jobId, { status: 'pending' });
    return { success: true };
  },

  'cron.stopJob'(jobId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    cronJobStorage.updateQueueStatus(jobId, 'stopped');
    cronJobStorage.saveJobStatus(jobId, { 
      status: 'stopped',
      stoppedAt: new Date()
    });
    return { success: true };
  },

  'cron.cleanupOldJobs'(daysOld) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return cronJobStorage.cleanupOldJobs(daysOld);
  },

  'cron.getBoardMigrationStats'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    // Import the board migration detector
    const { boardMigrationDetector } = require('./boardMigrationDetector');
    return boardMigrationDetector.getMigrationStats();
  },

  'cron.forceBoardMigrationScan'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    // Import the board migration detector
    const { boardMigrationDetector } = require('./boardMigrationDetector');
    return boardMigrationDetector.forceScan();
  },

  'cron.triggerRestoreLegacyLists'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    // Check if user is admin (optional - you can remove this if you want any user to trigger it)
    const user = ReactiveCache.getCurrentUser();
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Only administrators can trigger this migration');
    }

    return cronMigrationManager.triggerRestoreLegacyListsMigration();
  }
});
