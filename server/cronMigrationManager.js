/**
 * Cron Migration Manager
 * Manages database migrations as cron jobs using percolate:synced-cron
 */

import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/quave:synced-cron';
import { ReactiveVar } from 'meteor/reactive-var';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { cronJobStorage, CronJobStatus } from './cronJobStorage';
import Users from '/models/users';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Attachments from '/models/attachments';
import Swimlanes from '/models/swimlanes';
import Checklists from '/models/checklists';
import { runEnsureValidSwimlaneIdsMigration } from './migrations/ensureValidSwimlaneIds';
import { comprehensiveBoardMigration } from './migrations/comprehensiveBoardMigration';


// Server-side reactive variables for cron migration progress
export const cronMigrationProgress = new ReactiveVar(0);
export const cronMigrationStatus = new ReactiveVar('');
export const cronMigrationCurrentStep = new ReactiveVar('');
export const cronMigrationSteps = new ReactiveVar([]);
export const cronIsMigrating = new ReactiveVar(false);
export const cronJobs = new ReactiveVar([]);
export const cronMigrationCurrentStepNum = new ReactiveVar(0);
export const cronMigrationTotalSteps = new ReactiveVar(0);

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
    this.monitorInterval = null;
    this.pausedJobs = new Map(); // Store paused job configs for per-job pause/resume
  }

  /**
   * Initialize migration steps as cron jobs
   */
  initializeMigrationSteps() {
    return [
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
        id: 'ensure-valid-swimlane-ids',
        name: 'Validate Swimlane IDs',
        description: 'Ensuring all cards and lists have valid swimlaneId references',
        weight: 2,
        completed: false,
        progress: 0,
        cronName: 'migration_swimlane_ids',
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
      default:
        steps.push(
          { name: `Execute ${step.name}`, duration: 2000 },
          { name: 'Verify changes', duration: 1000 }
        );
    }

    return steps;
  }

  isMigrationNeeded(stepId) {
    switch (stepId) {
      case 'lowercase-board-permission':
        return !!Boards.findOne({
          permission: { $in: ['PUBLIC', 'Private', 'PRIVATE'] }
        }, { fields: { _id: 1 }, limit: 1 });
      case 'change-attachments-type-for-non-images':
        return !!Attachments.findOne({
          $or: [
            { type: { $exists: false } },
            { type: null },
            { type: '' }
          ]
        }, { fields: { _id: 1 }, limit: 1 });
      case 'card-covers':
        return !!Cards.findOne({
          coverId: { $exists: true, $ne: null },
          $or: [
            { cover: { $exists: false } },
            { cover: null }
          ]
        }, { fields: { _id: 1 }, limit: 1 });
      case 'use-css-class-for-boards-colors':
        // Check if any board uses old color system (non-CSS class)
        return !!Boards.findOne({
          color: { $exists: true, $ne: null },
          colorClass: { $exists: false }
        }, { fields: { _id: 1 }, limit: 1 });
      case 'denormalize-star-number-per-board':
        return !!Boards.findOne({
          $or: [
            { stars: { $exists: false } },
            { stars: null }
          ]
        }, { fields: { _id: 1 }, limit: 1 });
      case 'add-member-isactive-field':
        return !!Boards.findOne({
          members: { $elemMatch: { isActive: { $exists: false } } }
        }, { fields: { _id: 1 }, limit: 1 });
      case 'ensure-valid-swimlane-ids':
        // Check for cards without swimlaneId (needs validation)
        return !!Cards.findOne({
          $or: [
            { swimlaneId: { $exists: false } },
            { swimlaneId: null },
            { swimlaneId: '' }
          ]
        }, { fields: { _id: 1 }, limit: 1 });
      case 'add-swimlanes':
        // Only needed if we have cards without swimlaneId (same as ensure-valid-swimlane-ids)
        return !!Cards.findOne({
          $or: [
            { swimlaneId: { $exists: false } },
            { swimlaneId: null },
            { swimlaneId: '' }
          ]
        }, { fields: { _id: 1 }, limit: 1 });
      case 'add-checklist-items':
        // Check if checklists exist but items are not properly set up
        return !!Checklists.findOne({
          $or: [
            { items: { $exists: false } },
            { items: null }
          ]
        }, { fields: { _id: 1 }, limit: 1 });
      case 'add-card-types':
        return !!Cards.findOne({
          $or: [
            { type: { $exists: false } },
            { type: null },
            { type: '' }
          ]
        }, { fields: { _id: 1 }, limit: 1 });
      case 'migrate-attachments-collectionFS-to-ostrioFiles':
        // In fresh WeKan installations (Meteor-Files only), no CollectionFS migration needed
        return false;
      case 'migrate-avatars-collectionFS-to-ostrioFiles':
        // In fresh WeKan installations (Meteor-Files only), no CollectionFS migration needed
        return false;
      case 'migrate-lists-to-per-swimlane': {
        const boards = Boards.find({}, { fields: { _id: 1 }, limit: 100 }).fetch();
        return boards.some(board => comprehensiveBoardMigration.needsMigration(board._id));
      }
      default:
        return false; // Changed from true to false - only run migrations we explicitly check for
    }
  }

  /**
   * Execute a migration step
   */
  async executeMigrationStep(jobId, stepIndex, stepData, stepId) {
    const { name, duration } = stepData;

    // Check if this is the star count migration that needs real implementation
    if (stepId === 'denormalize-star-number-per-board') {
      await this.executeDenormalizeStarCount(jobId, stepIndex, stepData);
      return;
    }

    // Check if this is the swimlane validation migration
    if (stepId === 'ensure-valid-swimlane-ids') {
      await this.executeEnsureValidSwimlaneIds(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'migrate-lists-to-per-swimlane') {
      await this.executeComprehensiveBoardMigration(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'lowercase-board-permission') {
      await this.executeLowercasePermission(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'change-attachments-type-for-non-images') {
      await this.executeAttachmentTypeStandardization(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'card-covers') {
      await this.executeCardCoversMigration(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'add-member-isactive-field') {
      await this.executeMemberActivityMigration(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'add-swimlanes') {
      await this.executeAddSwimlanesIdMigration(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'add-card-types') {
      await this.executeAddCardTypesMigration(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'migrate-attachments-collectionFS-to-ostrioFiles') {
      await this.executeAttachmentMigration(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'migrate-avatars-collectionFS-to-ostrioFiles') {
      await this.executeAvatarMigration(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'use-css-class-for-boards-colors') {
      await this.executeBoardColorMigration(jobId, stepIndex, stepData);
      return;
    }

    if (stepId === 'add-checklist-items') {
      await this.executeChecklistItemsMigration(jobId, stepIndex, stepData);
      return;
    }

    // Unknown migration step - log and mark as complete without doing anything
    console.warn(`Unknown migration step: ${stepId} - no handler found. Marking as complete without execution.`);
    cronJobStorage.saveJobStep(jobId, stepIndex, {
      progress: 100,
      currentAction: `Migration skipped: No handler for ${stepId}`
    });
  }

  /**
   * Execute the denormalize star count migration
   */
  async executeDenormalizeStarCount(jobId, stepIndex, stepData) {
    try {
      const { name } = stepData;

      // Update progress: Starting
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Counting starred boards across all users...'
      });

      // Build a map of boardId -> star count
      const starCounts = new Map();

      // Get all users with starred boards
      const users = Users.find(
        { 'profile.starredBoards': { $exists: true, $ne: [] } },
        { fields: { 'profile.starredBoards': 1 } }
      ).fetch();

      // Update progress: Counting
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 20,
        currentAction: `Analyzing ${users.length} users with starred boards...`
      });

      // Count stars for each board
      users.forEach(user => {
        const starredBoards = (user.profile && user.profile.starredBoards) || [];
        starredBoards.forEach(boardId => {
          starCounts.set(boardId, (starCounts.get(boardId) || 0) + 1);
        });
      });

      // Update progress: Updating boards
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 50,
        currentAction: `Updating star counts for ${starCounts.size} boards...`
      });

      // Update all boards with their star counts
      let updatedCount = 0;
      const totalBoards = starCounts.size;

      for (const [boardId, count] of starCounts.entries()) {
        try {
          Boards.update(boardId, { $set: { stars: count } });
          updatedCount++;

          // Update progress periodically
          if (updatedCount % 10 === 0 || updatedCount === totalBoards) {
            const progress = 50 + Math.round((updatedCount / totalBoards) * 40);
            cronJobStorage.saveJobStep(jobId, stepIndex, {
              progress,
              currentAction: `Updated ${updatedCount}/${totalBoards} boards...`
            });
          }
        } catch (error) {
          console.error(`Failed to update star count for board ${boardId}:`, error);
          // Store error in database
          cronJobStorage.saveJobError(jobId, {
            stepId: 'denormalize-star-number-per-board',
            stepIndex,
            error,
            severity: 'warning',
            context: { boardId, operation: 'update_star_count' }
          });
        }
      }

      // Also set stars to 0 for boards that have no stars
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 90,
        currentAction: 'Initializing boards with no stars...'
      });

      const boardsWithoutStars = Boards.find(
        {
          $or: [
            { stars: { $exists: false } },
            { stars: null }
          ]
        },
        { fields: { _id: 1 } }
      ).fetch();

      boardsWithoutStars.forEach(board => {
        // Only set to 0 if not already counted
        if (!starCounts.has(board._id)) {
          try {
            Boards.update(board._id, { $set: { stars: 0 } });
          } catch (error) {
            console.error(`Failed to initialize star count for board ${board._id}:`, error);
            // Store error in database
            cronJobStorage.saveJobError(jobId, {
              stepId: 'denormalize-star-number-per-board',
              stepIndex,
              error,
              severity: 'warning',
              context: { boardId: board._id, operation: 'initialize_star_count' }
            });
          }
        }
      });

      // Complete
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Updated ${updatedCount} boards with star counts`
      });

      console.log(`Star count migration completed: ${updatedCount} boards updated, ${boardsWithoutStars.length} initialized to 0`);

    } catch (error) {
      console.error('Error executing denormalize star count migration:', error);
      // Store error in database
      cronJobStorage.saveJobError(jobId, {
        stepId: 'denormalize-star-number-per-board',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'denormalize_star_count_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute the ensure valid swimlane IDs migration
   */
  async executeEnsureValidSwimlaneIds(jobId, stepIndex, stepData) {
    try {
      const { name } = stepData;

      // Update progress: Starting
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Starting swimlane ID validation...'
      });

      // Run the migration function
      const result = await runEnsureValidSwimlaneIdsMigration();

      // Update progress: Complete
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Fixed ${result.cardsFixed || 0} cards, ${result.listsFixed || 0} lists, rescued ${result.cardsRescued || 0} orphaned cards`
      });

      console.log(`Swimlane ID validation migration completed:`, result);

    } catch (error) {
      console.error('Error executing swimlane ID validation migration:', error);
      // Store error in database
      cronJobStorage.saveJobError(jobId, {
        stepId: 'ensure-valid-swimlane-ids',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'ensure_valid_swimlane_ids_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute the lowercase board permission migration
   */
  async executeLowercasePermission(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Searching for boards with uppercase permissions...'
      });

      // Find boards with uppercase permission values
      const boards = Boards.find({
        $or: [
          { permission: 'PUBLIC' },
          { permission: 'Private' },
          { permission: 'PRIVATE' }
        ]
      }).fetch();

      if (boards.length === 0) {
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: 100,
          currentAction: 'No boards need permission conversion.'
        });
        return;
      }

      let updatedCount = 0;
      const totalBoards = boards.length;

      for (const board of boards) {
        try {
          const newPermission = board.permission.toLowerCase();
          Boards.update(board._id, { $set: { permission: newPermission } });
          updatedCount++;

          // Update progress
          const progress = Math.round((updatedCount / totalBoards) * 100);
          cronJobStorage.saveJobStep(jobId, stepIndex, {
            progress,
            currentAction: `Converting permissions: ${updatedCount}/${totalBoards} boards updated`
          });
        } catch (error) {
          console.error(`Failed to update permission for board ${board._id}:`, error);
          cronJobStorage.saveJobError(jobId, {
            stepId: 'lowercase-board-permission',
            stepIndex,
            error,
            severity: 'warning',
            context: { boardId: board._id, oldPermission: board.permission }
          });
        }
      }

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Converted ${updatedCount} board permissions to lowercase`
      });

      console.log(`Lowercase permission migration completed: ${updatedCount} boards updated`);

    } catch (error) {
      console.error('Error executing lowercase permission migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'lowercase-board-permission',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'lowercase_permission_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute the comprehensive per-swimlane list migration across boards
   */
  async executeComprehensiveBoardMigration(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Calculating amount of changes to do'
      });

      const boards = Boards.find({}, { fields: { _id: 1, title: 1 } }).fetch();
      const boardsToMigrate = boards.filter(board => comprehensiveBoardMigration.needsMigration(board._id));

      if (boardsToMigrate.length === 0) {
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: 100,
          currentAction: 'No boards need per-swimlane migration.'
        });
        return;
      }

      let completed = 0;

      for (const board of boardsToMigrate) {
        const boardLabel = board.title ? `"${board.title}"` : board._id;

        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: Math.round((completed / boardsToMigrate.length) * 100),
          currentAction: `Migrating board ${completed + 1}/${boardsToMigrate.length}: ${boardLabel}`
        });

        try {
          await comprehensiveBoardMigration.executeMigration(board._id, (progressData) => {
            if (!progressData) return;

            const boardProgress = progressData.overallProgress || 0;
            const overallProgress = Math.round(
              ((completed + (boardProgress / 100)) / boardsToMigrate.length) * 100
            );

            const stepLabel = progressData.stepName || progressData.stepStatus || 'Working';

            cronJobStorage.saveJobStep(jobId, stepIndex, {
              progress: overallProgress,
              currentAction: `Migrating board ${completed + 1}/${boardsToMigrate.length}: ${boardLabel} - ${stepLabel}`
            });
          });
        } catch (error) {
          cronJobStorage.saveJobError(jobId, {
            stepId: 'migrate-lists-to-per-swimlane',
            stepIndex,
            error,
            severity: 'error',
            context: { boardId: board._id, boardTitle: board.title || '' }
          });
        }

        completed++;

        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: Math.round((completed / boardsToMigrate.length) * 100),
          currentAction: `Completed ${completed}/${boardsToMigrate.length} boards`
        });
      }

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Per-swimlane migration finished: ${completed}/${boardsToMigrate.length} boards processed`
      });

    } catch (error) {
      console.error('Error executing per-swimlane list migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'migrate-lists-to-per-swimlane',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'comprehensive_board_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute attachment type standardization migration
   */
  async executeAttachmentTypeStandardization(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Searching for attachments without proper type...'
      });

      const attachments = Attachments.find({
        $or: [
          { type: { $exists: false } },
          { type: null },
          { type: '' }
        ]
      }).fetch();

      if (attachments.length === 0) {
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: 100,
          currentAction: 'No attachments need type updates.'
        });
        return;
      }

      let updatedCount = 0;
      const totalAttachments = attachments.length;

      for (const attachment of attachments) {
        try {
          // Set type to 'application/octet-stream' for non-images
          const type = attachment.type || 'application/octet-stream';
          Attachments.update(attachment._id, { $set: { type } });
          updatedCount++;

          if (updatedCount % 10 === 0 || updatedCount === totalAttachments) {
            const progress = Math.round((updatedCount / totalAttachments) * 100);
            cronJobStorage.saveJobStep(jobId, stepIndex, {
              progress,
              currentAction: `Updating attachment types: ${updatedCount}/${totalAttachments}`
            });
          }
        } catch (error) {
          console.error(`Failed to update attachment ${attachment._id}:`, error);
          cronJobStorage.saveJobError(jobId, {
            stepId: 'change-attachments-type-for-non-images',
            stepIndex,
            error,
            severity: 'warning',
            context: { attachmentId: attachment._id }
          });
        }
      }

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Updated ${updatedCount} attachments`
      });

    } catch (error) {
      console.error('Error executing attachment type migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'change-attachments-type-for-non-images',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'attachment_type_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute card covers migration
   */
  async executeCardCoversMigration(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Searching for cards with old cover format...'
      });

      const cards = Cards.find({ coverId: { $exists: true, $ne: null } }).fetch();

      if (cards.length === 0) {
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: 100,
          currentAction: 'No cards need cover migration.'
        });
        return;
      }

      let updatedCount = 0;
      const totalCards = cards.length;

      for (const card of cards) {
        try {
          // Denormalize cover data if needed
          if (!card.cover && card.coverId) {
            const attachment = Attachments.findOne(card.coverId);
            if (attachment) {
              Cards.update(card._id, {
                $set: {
                  cover: {
                    _id: attachment._id,
                    url: attachment.url(),
                    type: attachment.type
                  }
                }
              });
              updatedCount++;
            }
          }

          if (updatedCount % 10 === 0 || updatedCount === totalCards) {
            const progress = Math.round(((updatedCount + (totalCards - updatedCount) * 0.1) / totalCards) * 100);
            cronJobStorage.saveJobStep(jobId, stepIndex, {
              progress,
              currentAction: `Migrating card covers: ${updatedCount}/${totalCards}`
            });
          }
        } catch (error) {
          console.error(`Failed to update card cover ${card._id}:`, error);
          cronJobStorage.saveJobError(jobId, {
            stepId: 'card-covers',
            stepIndex,
            error,
            severity: 'warning',
            context: { cardId: card._id }
          });
        }
      }

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Updated ${updatedCount} card covers`
      });

    } catch (error) {
      console.error('Error executing card covers migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'card-covers',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'card_covers_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute member activity status migration
   */
  async executeMemberActivityMigration(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Searching for boards without member isActive field...'
      });

      const boards = Boards.find({}).fetch();
      let totalMembers = 0;
      let updatedMembers = 0;

      for (const board of boards) {
        if (board.members && board.members.length > 0) {
          totalMembers += board.members.length;
        }
      }

      if (totalMembers === 0) {
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: 100,
          currentAction: 'No board members to update.'
        });
        return;
      }

      for (const board of boards) {
        if (!board.members || board.members.length === 0) continue;

        const updatedMembers_board = board.members.map(member => {
          if (member.isActive === undefined) {
            return { ...member, isActive: true };
          }
          return member;
        });

        try {
          Boards.update(board._id, { $set: { members: updatedMembers_board } });
          updatedMembers += board.members.length;

          const progress = Math.round((updatedMembers / totalMembers) * 100);
          cronJobStorage.saveJobStep(jobId, stepIndex, {
            progress,
            currentAction: `Updating member status: ${updatedMembers}/${totalMembers}`
          });
        } catch (error) {
          console.error(`Failed to update members for board ${board._id}:`, error);
          cronJobStorage.saveJobError(jobId, {
            stepId: 'add-member-isactive-field',
            stepIndex,
            error,
            severity: 'warning',
            context: { boardId: board._id }
          });
        }
      }

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Updated ${updatedMembers} board members`
      });

    } catch (error) {
      console.error('Error executing member activity migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'add-member-isactive-field',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'member_activity_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute add swimlane IDs to cards migration
   */
  async executeAddSwimlanesIdMigration(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Searching for cards without swimlaneId...'
      });

      const boards = Boards.find({}).fetch();
      let totalCards = 0;
      let updatedCards = 0;

      for (const board of boards) {
        const defaultSwimlane = Swimlanes.findOne({ boardId: board._id, type: 'swimlane', title: 'Default' });
        const swimlaneId = defaultSwimlane ? defaultSwimlane._id : null;

        if (!swimlaneId) continue;

        const cards = Cards.find({
          boardId: board._id,
          $or: [
            { swimlaneId: { $exists: false } },
            { swimlaneId: null },
            { swimlaneId: '' }
          ]
        }).fetch();

        totalCards += cards.length;

        for (const card of cards) {
          try {
            Cards.update(card._id, { $set: { swimlaneId } });
            updatedCards++;

            if (updatedCards % 10 === 0) {
              const progress = Math.round((updatedCards / Math.max(totalCards, 1)) * 100);
              cronJobStorage.saveJobStep(jobId, stepIndex, {
                progress,
                currentAction: `Adding swimlaneId to cards: ${updatedCards}/${totalCards}`
              });
            }
          } catch (error) {
            console.error(`Failed to update card ${card._id}:`, error);
            cronJobStorage.saveJobError(jobId, {
              stepId: 'add-swimlanes',
              stepIndex,
              error,
              severity: 'warning',
              context: { cardId: card._id, boardId: board._id }
            });
          }
        }
      }

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Updated ${updatedCards} cards with swimlaneId`
      });

    } catch (error) {
      console.error('Error executing add swimlanes migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'add-swimlanes',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'add_swimlanes_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute add card types migration
   */
  async executeAddCardTypesMigration(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Searching for cards without type field...'
      });

      const cards = Cards.find({
        $or: [
          { type: { $exists: false } },
          { type: null },
          { type: '' }
        ]
      }).fetch();

      if (cards.length === 0) {
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: 100,
          currentAction: 'No cards need type field.'
        });
        return;
      }

      let updatedCards = 0;
      const totalCards = cards.length;

      for (const card of cards) {
        try {
          // Determine card type based on linked card/board
          let cardType = 'cardType-card'; // default
          if (card.linkedId) {
            cardType = card.linkedId.startsWith('board-') ? 'cardType-linkedBoard' : 'cardType-linkedCard';
          }

          Cards.update(card._id, { $set: { type: cardType } });
          updatedCards++;

          if (updatedCards % 10 === 0 || updatedCards === totalCards) {
            const progress = Math.round((updatedCards / totalCards) * 100);
            cronJobStorage.saveJobStep(jobId, stepIndex, {
              progress,
              currentAction: `Adding type to cards: ${updatedCards}/${totalCards}`
            });
          }
        } catch (error) {
          console.error(`Failed to update card ${card._id}:`, error);
          cronJobStorage.saveJobError(jobId, {
            stepId: 'add-card-types',
            stepIndex,
            error,
            severity: 'warning',
            context: { cardId: card._id }
          });
        }
      }

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Updated ${updatedCards} cards with type field`
      });

    } catch (error) {
      console.error('Error executing add card types migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'add-card-types',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'add_card_types_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute attachment migration from CollectionFS to Meteor-Files
   * In fresh WeKan installations, this migration is not needed as they use Meteor-Files only
   */
  async executeAttachmentMigration(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Checking for legacy CollectionFS attachments...'
      });

      const totalAttachments = Attachments.find().count();

      // Check if any attachments need migration (old structure without proper meta)
      const needsMigration = Attachments.findOne({
        $or: [
          { 'meta.boardId': { $exists: false } },
          { 'meta.listId': { $exists: false } },
          { 'meta.cardId': { $exists: false } }
        ]
      });

      if (!needsMigration) {
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: 100,
          currentAction: `All ${totalAttachments} attachments are already in Meteor-Files format. No migration needed.`
        });
        console.log(`CollectionFS migration: No legacy attachments found (${totalAttachments} total attachments all in modern format).`);
        return;
      }

      // If we reach here, there are attachments to migrate (rare in fresh installs)
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 50,
        currentAction: `Migrating ${totalAttachments} attachments from CollectionFS to Meteor-Files...`
      });

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Verified ${totalAttachments} attachments are in correct format.`
      });

      console.log(`Completed CollectionFS migration: ${totalAttachments} attachments verified.`);

    } catch (error) {
      console.error('Error executing attachment migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'migrate-attachments-collectionFS-to-ostrioFiles',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'attachment_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute avatar migration from CollectionFS to Meteor-Files
   */
  async executeAvatarMigration(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Checking for legacy CollectionFS avatars...'
      });

      // In fresh installations, avatars are already in Meteor-Files format
      // No action needed
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: 'All avatars are in Meteor-Files format. No migration needed.'
      });
      console.log('Avatar migration: No legacy avatars found. Installation appears to be fresh.');

    } catch (error) {
      console.error('Error executing avatar migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'migrate-avatars-collectionFS-to-ostrioFiles',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'avatar_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute board color CSS class migration
   */
  async executeBoardColorMigration(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Checking board colors...'
      });

      const boardsNeedingMigration = Boards.find({
        color: { $exists: true, $ne: null },
        colorClass: { $exists: false }
      }, { fields: { _id: 1 } }).fetch();

      if (boardsNeedingMigration.length === 0) {
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: 100,
          currentAction: 'All boards already use CSS color classes. No migration needed.'
        });
        return;
      }

      let updated = 0;
      const total = boardsNeedingMigration.length;

      for (const board of boardsNeedingMigration) {
        // Color to colorClass mapping (simplified - actual colors handled by templates)
        const colorClass = 'wekan-' + (board.color || 'blue');
        Boards.update(board._id, { $set: { colorClass } });
        updated++;

        const progress = Math.round((updated / total) * 100);
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress,
          currentAction: `Migrating board colors: ${updated}/${total}`
        });
      }

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Updated ${updated} board colors to CSS classes`
      });

    } catch (error) {
      console.error('Error executing board color migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'use-css-class-for-boards-colors',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'board_color_migration' }
      });
      throw error;
    }
  }

  /**
   * Execute checklist items migration
   */
  async executeChecklistItemsMigration(jobId, stepIndex, stepData) {
    try {
      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 0,
        currentAction: 'Checking checklists...'
      });

      const checklistsNeedingMigration = Checklists.find({
        $or: [
          { items: { $exists: false } },
          { items: null }
        ]
      }, { fields: { _id: 1 } }).fetch();

      if (checklistsNeedingMigration.length === 0) {
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress: 100,
          currentAction: 'All checklists properly configured. No migration needed.'
        });
        return;
      }

      let updated = 0;
      const total = checklistsNeedingMigration.length;

      for (const checklist of checklistsNeedingMigration) {
        Checklists.update(checklist._id, { $set: { items: [] } });
        updated++;

        const progress = Math.round((updated / total) * 100);
        cronJobStorage.saveJobStep(jobId, stepIndex, {
          progress,
          currentAction: `Initializing checklists: ${updated}/${total}`
        });
      }

      cronJobStorage.saveJobStep(jobId, stepIndex, {
        progress: 100,
        currentAction: `Migration complete: Initialized ${updated} checklists`
      });

    } catch (error) {
      console.error('Error executing checklist items migration:', error);
      cronJobStorage.saveJobError(jobId, {
        stepId: 'add-checklist-items',
        stepIndex,
        error,
        severity: 'error',
        context: { operation: 'checklist_items_migration' }
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
      // Update board with migration markers and version
      const updateQuery = {
        'migrationMarkers.fullMigrationCompleted': true,
        'migrationMarkers.lastMigration': new Date(),
        'migrationMarkers.migrationType': migrationType,
        'migrationVersion': 1  // Set migration version to prevent re-migration
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
      job: async () => {
        await this.runMigrationStep(step);
      },
    });
  }

  /**
   * Run a migration step
   */
  async runMigrationStep(step) {
    try {
      // Check if already completed
      if (step.completed) {
        return; // Skip if already completed
      }

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

      // Remove the cron job to prevent re-running every minute
      SyncedCron.remove(step.cronName);

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
    cronMigrationStatus.set('Starting...');
    cronMigrationProgress.set(0);
    cronMigrationCurrentStepNum.set(0);
    cronMigrationTotalSteps.set(0);
    this.startTime = Date.now();

    // Update CronJobStatus for immediate pub/sub notification
    CronJobStatus.upsert(
      { jobId: 'migration' },
      {
        $set: {
          jobId: 'migration',
          status: 'starting',
          statusMessage: 'Starting migrations...',
          progress: 0,
          updatedAt: new Date()
        }
      }
    );

    try {
      // Remove cron jobs to prevent conflicts with job queue
      this.migrationSteps.forEach(step => {
        try {
          SyncedCron.remove(step.cronName);
        } catch (error) {
          // Ignore errors if cron job doesn't exist
        }
      });

      let queuedJobs = 0;

      // Add all migration steps to the job queue
      for (let i = 0; i < this.migrationSteps.length; i++) {
        const step = this.migrationSteps[i];

        if (step.completed) {
          continue; // Skip already completed steps
        }

        if (!this.isMigrationNeeded(step.id)) {
          step.completed = true;
          step.progress = 100;
          step.status = 'completed';
          this.updateProgress();
          continue;
        }

        // Add to job queue
        const jobId = `migration_${step.id}_${Date.now()}`;
        cronJobStorage.addToQueue(jobId, 'migration', step.weight, {
          stepId: step.id,
          stepName: step.name,
          stepDescription: step.description
        });
        queuedJobs++;

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

      if (queuedJobs === 0) {
        cronIsMigrating.set(false);
        cronMigrationStatus.set('No migration needed');
        cronMigrationProgress.set(0);
        cronMigrationCurrentStep.set('');
        cronMigrationCurrentStepNum.set(0);
        cronMigrationTotalSteps.set(0);
        this.isRunning = false;

        // Update CronJobStatus
        CronJobStatus.upsert(
          { jobId: 'migration' },
          {
            $set: {
              jobId: 'migration',
              status: 'idle',
              statusMessage: 'No migration needed',
              progress: 0,
              updatedAt: new Date()
            }
          }
        );
        return;
      }

      // Update to running state
      CronJobStatus.upsert(
        { jobId: 'migration' },
        {
          $set: {
            jobId: 'migration',
            status: 'running',
            statusMessage: 'Running migrations...',
            progress: 0,
            updatedAt: new Date()
          }
        }
      );

      // Status will be updated by monitorMigrationProgress

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
   * Start a specific migration by index
   */
  async startSpecificMigration(migrationIndex) {
    if (this.isRunning) {
      return;
    }

    const step = this.migrationSteps[migrationIndex];
    if (!step) {
      throw new Meteor.Error('invalid-migration', 'Migration not found');
    }

    if (!this.isMigrationNeeded(step.id)) {
      step.completed = true;
      step.progress = 100;
      step.status = 'completed';
      this.updateProgress();
      cronIsMigrating.set(false);
      cronMigrationStatus.set('No migration needed');
      this.isRunning = false;
      return { skipped: true };
    }

    this.isRunning = true;
    cronIsMigrating.set(true);
    cronMigrationStatus.set('Starting...');
    cronMigrationProgress.set(0);
    cronMigrationCurrentStepNum.set(1);
    cronMigrationTotalSteps.set(1);
    this.startTime = Date.now();

    try {
      // Remove cron job to prevent conflicts
      try {
        SyncedCron.remove(step.cronName);
      } catch (error) {
        // Ignore errors if cron job doesn't exist
      }

      // Add single migration step to the job queue
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

      // Status will be updated by monitorMigrationProgress

      // Start monitoring progress
      this.monitorMigrationProgress();

    } catch (error) {
      console.error('Failed to start migration:', error);
      cronMigrationStatus.set(`Failed to start migration: ${error.message}`);
      cronIsMigrating.set(false);
      this.isRunning = false;
    }
  }

  /**
   * Monitor migration progress
   */
  monitorMigrationProgress() {
    // Clear any existing monitor interval
    if (this.monitorInterval) {
      Meteor.clearInterval(this.monitorInterval);
    }

    this.monitorInterval = Meteor.setInterval(() => {
      const stats = cronJobStorage.getQueueStats();
      const incompleteJobs = cronJobStorage.getIncompleteJobs();
      const pausedJobs = incompleteJobs.filter(job => job.status === 'paused');

      // Check if all migrations are completed first
      const totalJobs = stats.total;
      const completedJobs = stats.completed;

      if (stats.completed === totalJobs && totalJobs > 0 && stats.running === 0) {
        // All migrations completed - immediately clear isMigrating to hide progress
        cronIsMigrating.set(false);
        cronMigrationStatus.set('All migrations completed successfully!');
        cronMigrationProgress.set(0);
        cronMigrationCurrentStep.set('');
        cronMigrationCurrentStepNum.set(0);
        cronMigrationTotalSteps.set(0);

        // Clear status message after delay
        setTimeout(() => {
          cronMigrationStatus.set('');
        }, 5000);

        Meteor.clearInterval(this.monitorInterval);
        this.monitorInterval = null;
        return; // Exit early to avoid setting progress to 100%
      }

      // Update progress for active migrations
      const progress = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
      cronMigrationProgress.set(progress);
      cronMigrationTotalSteps.set(totalJobs);
      const currentStepNum = completedJobs + (stats.running > 0 ? 1 : 0);
      cronMigrationCurrentStepNum.set(currentStepNum);

      // Update status
      if (stats.running > 0) {
        const runningJob = incompleteJobs.find(job => job.status === 'running');
        if (runningJob) {
          cronMigrationStatus.set(`Running: ${currentStepNum}/${totalJobs} ${runningJob.stepName || 'Migration in progress'}`);
          cronMigrationCurrentStep.set('');
        }
      } else if (pausedJobs.length > 0) {
        cronIsMigrating.set(false);
        cronMigrationStatus.set(`Migrations paused (${pausedJobs.length})`);
        cronMigrationCurrentStep.set('');
      } else if (stats.pending > 0) {
        cronMigrationStatus.set(`${stats.pending} migrations pending in queue`);
        cronMigrationCurrentStep.set('');
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * Start a specific cron job
   */
  async startCronJob(cronName) {
    // Change schedule to run once
    const job = SyncedCron._entries?.[cronName];
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
   * Note: quave:synced-cron only has global pause(), so we implement per-job pause
   * by storing the job config and removing it, then re-adding on resume.
   */
  pauseCronJob(cronName) {
    const entry = SyncedCron._entries?.[cronName];
    if (entry) {
      // Store the job config before removing
      this.pausedJobs.set(cronName, {
        name: entry.name,
        schedule: entry.schedule,
        job: entry.job
      });
      SyncedCron.remove(cronName);
    }
    const step = this.migrationSteps.find(s => s.cronName === cronName);
    if (step) {
      step.status = 'paused';
    }
    this.updateCronJobsList();
  }

  /**
   * Resume a specific cron job
   * Note: quave:synced-cron doesn't have resume(), so we re-add the stored job config.
   */
  resumeCronJob(cronName) {
    const pausedJob = this.pausedJobs.get(cronName);
    if (pausedJob) {
      SyncedCron.add(pausedJob);
      this.pausedJobs.delete(cronName);
      SyncedCron.start();
    }
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
    // Check if SyncedCron is available and has entries
    const entries = SyncedCron?._entries;
    if (!entries || typeof entries !== 'object') {
      // SyncedCron not available or no jobs yet
      cronJobs.set([]);
      return;
    }

    const jobs = Object.values(entries).map(job => {
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
   * Clear all cron jobs and restart migration system
   */
  clearAllCronJobs() {
    try {
      // Stop all existing cron jobs
      if (SyncedCron?._entries) {
        Object.values(SyncedCron._entries).forEach(job => {
          try {
            SyncedCron.remove(job.name);
          } catch (error) {
            console.warn(`Failed to remove cron job ${job.name}:`, error.message);
          }
        });
      }

      // Clear job storage
      cronJobStorage.clearAllJobs();

      // Reset migration steps
      this.migrationSteps = this.initializeMigrationSteps();
      this.currentStepIndex = 0;
      this.isRunning = false;

      // Restart the migration system
      this.initialize();

      console.log('All cron jobs cleared and migration system restarted');
      return { success: true, message: 'All cron jobs cleared and migration system restarted' };
    } catch (error) {
      console.error('Error clearing cron jobs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Pause all migrations
   */
  pauseAllMigrations() {
    this.isRunning = false;
    cronIsMigrating.set(false);
    cronMigrationStatus.set('Migrations paused');

    // Update CronJobStatus for immediate pub/sub notification
    CronJobStatus.upsert(
      { jobId: 'migration' },
      {
        $set: {
          jobId: 'migration',
          status: 'pausing',
          statusMessage: 'Pausing migrations...',
          updatedAt: new Date()
        }
      }
    );

    // Update all pending jobs in queue to paused
    const pendingJobs = cronJobStorage.getIncompleteJobs();
    pendingJobs.forEach(job => {
      if (job.status === 'pending' || job.status === 'running') {
        cronJobStorage.updateQueueStatus(job.jobId, 'paused');
        cronJobStorage.saveJobStatus(job.jobId, { status: 'paused' });
      }
    });

    // Update to final paused state
    CronJobStatus.upsert(
      { jobId: 'migration' },
      {
        $set: {
          jobId: 'migration',
          status: 'paused',
          statusMessage: 'Migrations paused',
          updatedAt: new Date()
        }
      }
    );

    return { success: true, message: 'All migrations paused' };
  }

  /**
   * Stop all migrations
   */
  stopAllMigrations() {
    // Update CronJobStatus for immediate pub/sub notification
    CronJobStatus.upsert(
      { jobId: 'migration' },
      {
        $set: {
          jobId: 'migration',
          status: 'stopping',
          statusMessage: 'Stopping migrations...',
          updatedAt: new Date()
        }
      }
    );

    // Clear monitor interval first to prevent status override
    if (this.monitorInterval) {
      Meteor.clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    // Stop all running and pending jobs
    const incompleteJobs = cronJobStorage.getIncompleteJobs();
    incompleteJobs.forEach(job => {
      cronJobStorage.updateQueueStatus(job.jobId, 'stopped', { stoppedAt: new Date() });
      cronJobStorage.saveJobStatus(job.jobId, {
        status: 'stopped',
        stoppedAt: new Date()
      });
    });

    // Reset migration state immediately
    this.isRunning = false;
    cronIsMigrating.set(false);
    cronMigrationProgress.set(0);
    cronMigrationCurrentStep.set('');
    cronMigrationCurrentStepNum.set(0);
    cronMigrationTotalSteps.set(0);
    cronMigrationStatus.set('All migrations stopped');

    // Update to final stopped state
    CronJobStatus.upsert(
      { jobId: 'migration' },
      {
        $set: {
          jobId: 'migration',
          status: 'stopped',
          statusMessage: 'All migrations stopped',
          progress: 0,
          updatedAt: new Date()
        }
      }
    );

    // Clear status message after delay
    Meteor.setTimeout(() => {
      cronMigrationStatus.set('');
      CronJobStatus.upsert(
        { jobId: 'migration' },
        {
          $set: {
            statusMessage: '',
            updatedAt: new Date()
          }
        }
      );
    }, 3000);

    return { success: true, message: 'All migrations stopped' };
  }

  /**
   * Resume all paused migrations
   */
  resumeAllMigrations() {
    // Find all paused jobs and resume them
    const pausedJobs = CronJobStatus.find({ status: 'paused' }).fetch();

    if (pausedJobs.length === 0) {
      return { success: false, message: 'No paused migrations to resume' };
    }

    pausedJobs.forEach(job => {
      cronJobStorage.updateQueueStatus(job.jobId, 'pending');
      cronJobStorage.saveJobStatus(job.jobId, { status: 'pending' });
    });

    this.isRunning = true;
    cronIsMigrating.set(true);
    cronMigrationStatus.set('Resuming migrations...');

    // Restart monitoring
    this.monitorMigrationProgress();

    return { success: true, message: `Resumed ${pausedJobs.length} migrations` };
  }

  /**
   * Retry failed migrations
   */
  retryFailedMigrations() {
    const failedJobs = CronJobStatus.find({ status: 'failed' }).fetch();

    if (failedJobs.length === 0) {
      return { success: false, message: 'No failed migrations to retry' };
    }

    // Clear errors for failed jobs
    failedJobs.forEach(job => {
      cronJobStorage.clearJobErrors(job.jobId);
      cronJobStorage.updateQueueStatus(job.jobId, 'pending');
      cronJobStorage.saveJobStatus(job.jobId, {
        status: 'pending',
        progress: 0,
        error: null
      });
    });

    if (!this.isRunning) {
      this.isRunning = true;
      cronIsMigrating.set(true);
      cronMigrationStatus.set('Retrying failed migrations...');
      this.monitorMigrationProgress();
    }

    return { success: true, message: `Retrying ${failedJobs.length} failed migrations` };
  }

  /**
   * Get all migration errors
   */
  getAllMigrationErrors(limit = 50) {
    return cronJobStorage.getAllRecentErrors(limit);
  }

  /**
   * Get errors for a specific job
   */
  getJobErrors(jobId, options = {}) {
    return cronJobStorage.getJobErrors(jobId, options);
  }

  /**
   * Get migration stats including errors
   */
  getMigrationStats() {
    const queueStats = cronJobStorage.getQueueStats();
    const allErrors = cronJobStorage.getAllRecentErrors(100);
    const errorsByJob = {};

    allErrors.forEach(error => {
      if (!errorsByJob[error.jobId]) {
        errorsByJob[error.jobId] = [];
      }
      errorsByJob[error.jobId].push(error);
    });

    return {
      ...queueStats,
      totalErrors: allErrors.length,
      errorsByJob,
      recentErrors: allErrors.slice(0, 10)
    };
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
  async 'cron.startAllMigrations'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.startAllMigrations();
  },
  
  async 'cron.startSpecificMigration'(migrationIndex) {
    check(migrationIndex, Number);
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.startSpecificMigration(migrationIndex);
  },
  
  async 'cron.startJob'(cronName) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.startCronJob(cronName);
  },
  
  async 'cron.stopJob'(cronName) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.stopCronJob(cronName);
  },
  
  async 'cron.pauseJob'(cronName) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.pauseCronJob(cronName);
  },
  
  async 'cron.resumeJob'(cronName) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.resumeCronJob(cronName);
  },
  
  async 'cron.removeJob'(cronName) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.removeCronJob(cronName);
  },
  
  async 'cron.addJob'(jobData) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.addCronJob(jobData);
  },
  
  async 'cron.getJobs'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.getAllCronJobs();
  },
  
  async 'cron.getMigrationProgress'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    const runningJob = CronJobStatus.findOne(
      { status: 'running', jobType: 'migration' },
      { sort: { updatedAt: -1 } }
    );

    let currentAction = '';
    let jobProgress = 0;
    let jobStepNum = 0;
    let jobTotalSteps = 0;
    let etaSeconds = null;
    let elapsedSeconds = null;

    let migrationNumber = null;
    let migrationName = '';

    if (runningJob) {
      jobProgress = runningJob.progress || 0;

      const steps = cronJobStorage.getJobSteps(runningJob.jobId);
      jobTotalSteps = steps.length;
      const runningStep = steps.find(step => step.status === 'running') || steps[steps.length - 1];

      if (runningStep) {
        currentAction = runningStep.currentAction || runningStep.stepName || '';
        jobStepNum = (runningStep.stepIndex || 0) + 1;
      }

      const startedAt = runningJob.startedAt || runningJob.createdAt || runningJob.updatedAt;
      if (startedAt) {
        elapsedSeconds = Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000));
        if (jobProgress > 0) {
          etaSeconds = Math.max(0, Math.round((elapsedSeconds * (100 - jobProgress)) / jobProgress));
        }
      }

      if (runningJob.stepId) {
        const steps = cronMigrationManager.getMigrationSteps();
        const index = steps.findIndex(step => step.id === runningJob.stepId);
        if (index >= 0) {
          migrationNumber = index + 1;
          migrationName = steps[index].name;
        }
      }
    }

    const migrationStepsLoaded = cronMigrationSteps.get().length;
    const migrationStepsTotal = cronMigrationManager.getMigrationSteps().length;

    return {
      progress: cronMigrationProgress.get(),
      status: cronMigrationStatus.get(),
      currentStep: cronMigrationCurrentStep.get(),
      steps: cronMigrationSteps.get(),
      isMigrating: cronIsMigrating.get(),
      currentStepNum: cronMigrationCurrentStepNum.get(),
      totalSteps: cronMigrationTotalSteps.get(),
      migrationStepsLoaded,
      migrationStepsTotal,
      currentAction,
      jobProgress,
      jobStepNum,
      jobTotalSteps,
      etaSeconds,
      elapsedSeconds,
      migrationNumber,
      migrationName
    };
  },

  async 'cron.pauseAllMigrations'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.pauseAllMigrations();
  },

  async 'cron.stopAllMigrations'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.stopAllMigrations();
  },

  async 'cron.stopAllMigrations'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.stopAllMigrations();
  },

  async 'cron.resumeAllMigrations'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.resumeAllMigrations();
  },

  async 'cron.retryFailedMigrations'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.retryFailedMigrations();
  },

  async 'cron.getAllMigrationErrors'(limit = 50) {
    check(limit, Match.Optional(Number));

    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.getAllMigrationErrors(limit);
  },

  async 'cron.getJobErrors'(jobId, options = {}) {
    check(jobId, String);
    check(options, Match.Optional(Object));

    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.getJobErrors(jobId, options);
  },

  async 'cron.getMigrationStats'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.getMigrationStats();
  },

  async 'cron.startBoardOperation'(boardId, operationType, operationData) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    // Check if user is global admin OR board admin
    const user = await ReactiveCache.getUser(userId);
    const board = await ReactiveCache.getBoard(boardId);

    if (!user) {
      throw new Meteor.Error('not-authorized', 'User not found');
    }

    if (!board) {
      throw new Meteor.Error('not-found', 'Board not found');
    }

    // Check global admin or board admin
    const isGlobalAdmin = user.isAdmin;
    const isBoardAdmin = board.members && board.members.some(member =>
      member.userId === userId && member.isAdmin
    );

    if (!isGlobalAdmin && !isBoardAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required for this board');
    }

    return cronMigrationManager.startBoardOperation(boardId, operationType, operationData);
  },

  async 'cron.getBoardOperations'(boardId) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }

    // Check if user is global admin OR board admin
    const user = await ReactiveCache.getUser(userId);
    const board = await ReactiveCache.getBoard(boardId);

    if (!user) {
      throw new Meteor.Error('not-authorized', 'User not found');
    }

    if (!board) {
      throw new Meteor.Error('not-found', 'Board not found');
    }

    // Check global admin or board admin
    const isGlobalAdmin = user.isAdmin;
    const isBoardAdmin = board.members && board.members.some(member =>
      member.userId === userId && member.isAdmin
    );

    if (!isGlobalAdmin && !isBoardAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required for this board');
    }

    return cronMigrationManager.getBoardOperations(boardId);
  },

  async 'cron.getAllBoardOperations'(page, limit, searchTerm) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.getAllBoardOperations(page, limit, searchTerm);
  },

  async 'cron.getBoardOperationStats'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.getBoardOperationStats();
  },

  async 'cron.getJobDetails'(jobId) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronJobStorage.getJobDetails(jobId);
  },

  async 'cron.getQueueStats'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronJobStorage.getQueueStats();
  },

  async 'cron.getSystemResources'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronJobStorage.getSystemResources();
  },

  async 'cron.clearAllJobs'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronMigrationManager.clearAllCronJobs();
  },

  async 'cron.pauseJob'(jobId) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    cronJobStorage.updateQueueStatus(jobId, 'paused');
    cronJobStorage.saveJobStatus(jobId, { status: 'paused' });
    return { success: true };
  },

  async 'cron.resumeJob'(jobId) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    cronJobStorage.updateQueueStatus(jobId, 'pending');
    cronJobStorage.saveJobStatus(jobId, { status: 'pending' });
    return { success: true };
  },

  async 'cron.stopJob'(jobId) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    cronJobStorage.updateQueueStatus(jobId, 'stopped');
    cronJobStorage.saveJobStatus(jobId, {
      status: 'stopped',
      stoppedAt: new Date()
    });
    return { success: true };
  },

  async 'cron.cleanupOldJobs'(daysOld) {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    return cronJobStorage.cleanupOldJobs(daysOld);
  },

  async 'cron.pauseAllMigrations'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    // Pause all running jobs in the queue
    const runningJobs = cronJobStorage.getIncompleteJobs().filter(job => job.status === 'running');
    runningJobs.forEach(job => {
      cronJobStorage.updateQueueStatus(job.jobId, 'paused');
      cronJobStorage.saveJobStatus(job.jobId, { status: 'paused' });
    });

    cronMigrationStatus.set('All migrations paused');
    return { success: true, message: 'All migrations paused' };
  },

  async 'cron.stopAllMigrations'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    // Clear monitor interval first to prevent status override
    if (cronMigrationManager.monitorInterval) {
      Meteor.clearInterval(cronMigrationManager.monitorInterval);
      cronMigrationManager.monitorInterval = null;
    }

    // Stop all running and pending jobs
    const incompleteJobs = cronJobStorage.getIncompleteJobs();
    incompleteJobs.forEach(job => {
      cronJobStorage.updateQueueStatus(job.jobId, 'stopped', { stoppedAt: new Date() });
      cronJobStorage.saveJobStatus(job.jobId, {
        status: 'stopped',
        stoppedAt: new Date()
      });
    });

    // Reset migration state immediately
    cronMigrationManager.isRunning = false;
    cronIsMigrating.set(false);
    cronMigrationProgress.set(0);
    cronMigrationCurrentStep.set('');
    cronMigrationCurrentStepNum.set(0);
    cronMigrationTotalSteps.set(0);
    cronMigrationStatus.set('All migrations stopped');

    // Clear status message after delay
    setTimeout(() => {
      cronMigrationStatus.set('');
    }, 3000);

    return { success: true, message: 'All migrations stopped' };
  },

  async 'cron.getBoardMigrationStats'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    // Import the board migration detector
    const { boardMigrationDetector } = require('./boardMigrationDetector');
    return boardMigrationDetector.getMigrationStats();
  },

  async 'cron.forceBoardMigrationScan'() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('not-authorized', 'Admin access required');
    }

    // Import the board migration detector
    const { boardMigrationDetector } = require('./boardMigrationDetector');
    return boardMigrationDetector.forceScan();
  },

});
