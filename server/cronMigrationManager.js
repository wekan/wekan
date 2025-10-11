/**
 * Cron Migration Manager
 * Manages database migrations as cron jobs using percolate:synced-cron
 */

import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/percolate:synced-cron';
import { ReactiveVar } from 'meteor/reactive-var';

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
    
    // Update cron jobs list
    this.updateCronJobsList();
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
      console.log(`Starting migration: ${step.name}`);
      
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

      console.log(`Completed migration: ${step.name}`);
      
      // Update progress
      this.updateProgress();

    } catch (error) {
      console.error(`Migration ${step.name} failed:`, error);
      step.status = 'error';
      cronMigrationStatus.set(`Migration failed: ${error.message}`);
    }
  }

  /**
   * Start all migrations in sequence
   */
  async startAllMigrations() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    cronIsMigrating.set(true);
    cronMigrationStatus.set('Starting all migrations...');
    this.startTime = Date.now();

    try {
      for (let i = 0; i < this.migrationSteps.length; i++) {
        const step = this.migrationSteps[i];
        this.currentStepIndex = i;

        if (step.completed) {
          continue; // Skip already completed steps
        }

        // Start the cron job for this step
        await this.startCronJob(step.cronName);
        
        // Wait for completion
        await this.waitForCronJobCompletion(step);
      }

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

    } catch (error) {
      console.error('Migration process failed:', error);
      cronMigrationStatus.set(`Migration process failed: ${error.message}`);
      cronIsMigrating.set(false);
    } finally {
      this.isRunning = false;
    }
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
    const operation = {
      id: operationId,
      boardId: boardId,
      type: operationType,
      data: operationData,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      endTime: null,
      error: null
    };

    // Update board operations map
    const operations = boardOperations.get();
    operations.set(operationId, operation);
    boardOperations.set(operations);

    // Create cron job for this operation
    const cronName = `board_operation_${operationId}`;
    SyncedCron.add({
      name: cronName,
      schedule: (parser) => parser.text('once'),
      job: () => {
        this.executeBoardOperation(operationId, operationType, operationData);
      },
    });

    // Start the cron job
    SyncedCron.start();

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
  }
});
