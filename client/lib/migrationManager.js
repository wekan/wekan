/**
 * Migration Manager
 * Handles all database migrations as steps during board loading
 * with detailed progress tracking and background persistence
 */

import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';

// Reactive variables for migration progress
export const migrationProgress = new ReactiveVar(0);
export const migrationStatus = new ReactiveVar('');
export const migrationCurrentStep = new ReactiveVar('');
export const migrationSteps = new ReactiveVar([]);
export const isMigrating = new ReactiveVar(false);
export const migrationEstimatedTime = new ReactiveVar('');

class MigrationManager {
  constructor() {
    this.migrationCache = new Map(); // Cache completed migrations
    this.steps = this.initializeMigrationSteps();
    this.currentStepIndex = 0;
    this.startTime = null;
  }

  /**
   * Initialize all migration steps with their details
   */
  initializeMigrationSteps() {
    return [
      {
        id: 'board-background-color',
        name: 'Board Background Colors',
        description: 'Setting up board background colors',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-cardcounterlist-allowed',
        name: 'Card Counter List Settings',
        description: 'Adding card counter list permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-boardmemberlist-allowed',
        name: 'Board Member List Settings',
        description: 'Adding board member list permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'lowercase-board-permission',
        name: 'Board Permission Standardization',
        description: 'Converting board permissions to lowercase',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'change-attachments-type-for-non-images',
        name: 'Attachment Type Standardization',
        description: 'Updating attachment types for non-images',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'card-covers',
        name: 'Card Covers System',
        description: 'Setting up card cover functionality',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'use-css-class-for-boards-colors',
        name: 'Board Color CSS Classes',
        description: 'Converting board colors to CSS classes',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'denormalize-star-number-per-board',
        name: 'Board Star Counts',
        description: 'Calculating star counts per board',
        weight: 3,
        completed: false,
        progress: 0
      },
      {
        id: 'add-member-isactive-field',
        name: 'Member Activity Status',
        description: 'Adding member activity tracking',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'add-sort-checklists',
        name: 'Checklist Sorting',
        description: 'Adding sort order to checklists',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'add-swimlanes',
        name: 'Swimlanes System',
        description: 'Setting up swimlanes functionality',
        weight: 4,
        completed: false,
        progress: 0
      },
      {
        id: 'add-views',
        name: 'Board Views',
        description: 'Adding board view options',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'add-checklist-items',
        name: 'Checklist Items',
        description: 'Setting up checklist items system',
        weight: 3,
        completed: false,
        progress: 0
      },
      {
        id: 'add-card-types',
        name: 'Card Types',
        description: 'Adding card type functionality',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'add-custom-fields-to-cards',
        name: 'Custom Fields',
        description: 'Adding custom fields to cards',
        weight: 3,
        completed: false,
        progress: 0
      },
      {
        id: 'add-requester-field',
        name: 'Requester Field',
        description: 'Adding requester field to cards',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-assigner-field',
        name: 'Assigner Field',
        description: 'Adding assigner field to cards',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-parent-field-to-cards',
        name: 'Card Parent Relationships',
        description: 'Adding parent field to cards',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'add-subtasks-boards',
        name: 'Subtasks Boards',
        description: 'Setting up subtasks board functionality',
        weight: 3,
        completed: false,
        progress: 0
      },
      {
        id: 'add-subtasks-sort',
        name: 'Subtasks Sorting',
        description: 'Adding sort order to subtasks',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'add-subtasks-allowed',
        name: 'Subtasks Permissions',
        description: 'Adding subtasks permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-authenticationMethod',
        name: 'Authentication Methods',
        description: 'Adding authentication method tracking',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'remove-tag',
        name: 'Remove Tag Field',
        description: 'Removing deprecated tag field',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'remove-customFields-references-broken',
        name: 'Fix Custom Fields References',
        description: 'Fixing broken custom field references',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'add-product-name',
        name: 'Product Name Settings',
        description: 'Adding product name configuration',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-hide-logo',
        name: 'Hide Logo Setting',
        description: 'Adding hide logo option',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-hide-card-counter-list',
        name: 'Hide Card Counter Setting',
        description: 'Adding hide card counter option',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-hide-board-member-list',
        name: 'Hide Board Member List Setting',
        description: 'Adding hide board member list option',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-displayAuthenticationMethod',
        name: 'Display Authentication Method',
        description: 'Adding authentication method display option',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-defaultAuthenticationMethod',
        name: 'Default Authentication Method',
        description: 'Setting default authentication method',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-templates',
        name: 'Board Templates',
        description: 'Setting up board templates system',
        weight: 3,
        completed: false,
        progress: 0
      },
      {
        id: 'fix-circular-reference_',
        name: 'Fix Circular References',
        description: 'Fixing circular references in cards',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'mutate-boardIds-in-customfields',
        name: 'Custom Fields Board IDs',
        description: 'Updating board IDs in custom fields',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'add-missing-created-and-modified',
        name: 'Missing Timestamps',
        description: 'Adding missing created and modified timestamps',
        weight: 4,
        completed: false,
        progress: 0
      },
      {
        id: 'fix-incorrect-dates',
        name: 'Fix Incorrect Dates',
        description: 'Correcting incorrect date values',
        weight: 3,
        completed: false,
        progress: 0
      },
      {
        id: 'add-assignee',
        name: 'Assignee Field',
        description: 'Adding assignee field to cards',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-profile-showDesktopDragHandles',
        name: 'Desktop Drag Handles',
        description: 'Adding desktop drag handles preference',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-profile-hiddenMinicardLabelText',
        name: 'Hidden Minicard Labels',
        description: 'Adding hidden minicard label text preference',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-receiveddate-allowed',
        name: 'Received Date Permissions',
        description: 'Adding received date permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-startdate-allowed',
        name: 'Start Date Permissions',
        description: 'Adding start date permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-duedate-allowed',
        name: 'Due Date Permissions',
        description: 'Adding due date permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-enddate-allowed',
        name: 'End Date Permissions',
        description: 'Adding end date permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-members-allowed',
        name: 'Members Permissions',
        description: 'Adding members permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-assignee-allowed',
        name: 'Assignee Permissions',
        description: 'Adding assignee permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-labels-allowed',
        name: 'Labels Permissions',
        description: 'Adding labels permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-checklists-allowed',
        name: 'Checklists Permissions',
        description: 'Adding checklists permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-attachments-allowed',
        name: 'Attachments Permissions',
        description: 'Adding attachments permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-comments-allowed',
        name: 'Comments Permissions',
        description: 'Adding comments permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-assigned-by-allowed',
        name: 'Assigned By Permissions',
        description: 'Adding assigned by permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-requested-by-allowed',
        name: 'Requested By Permissions',
        description: 'Adding requested by permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-activities-allowed',
        name: 'Activities Permissions',
        description: 'Adding activities permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-description-title-allowed',
        name: 'Description Title Permissions',
        description: 'Adding description title permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-description-text-allowed',
        name: 'Description Text Permissions',
        description: 'Adding description text permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-description-text-allowed-on-minicard',
        name: 'Minicard Description Permissions',
        description: 'Adding minicard description permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-sort-field-to-boards',
        name: 'Board Sort Field',
        description: 'Adding sort field to boards',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'add-default-profile-view',
        name: 'Default Profile View',
        description: 'Setting default profile view',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-hide-logo-by-default',
        name: 'Hide Logo Default',
        description: 'Setting hide logo as default',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-hide-card-counter-list-by-default',
        name: 'Hide Card Counter Default',
        description: 'Setting hide card counter as default',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-hide-board-member-list-by-default',
        name: 'Hide Board Member List Default',
        description: 'Setting hide board member list as default',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'add-card-number-allowed',
        name: 'Card Number Permissions',
        description: 'Adding card number permissions',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'assign-boardwise-card-numbers',
        name: 'Board Card Numbers',
        description: 'Assigning board-wise card numbers',
        weight: 3,
        completed: false,
        progress: 0
      },
      {
        id: 'add-card-details-show-lists',
        name: 'Card Details Show Lists',
        description: 'Adding card details show lists option',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'migrate-attachments-collectionFS-to-ostrioFiles',
        name: 'Migrate Attachments to Meteor-Files',
        description: 'Migrating attachments from CollectionFS to Meteor-Files',
        weight: 8,
        completed: false,
        progress: 0
      },
      {
        id: 'migrate-avatars-collectionFS-to-ostrioFiles',
        name: 'Migrate Avatars to Meteor-Files',
        description: 'Migrating avatars from CollectionFS to Meteor-Files',
        weight: 6,
        completed: false,
        progress: 0
      },
      {
        id: 'migrate-attachment-drop-index-cardId',
        name: 'Drop Attachment Index',
        description: 'Dropping old attachment index',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'migrate-attachment-migration-fix-source-import',
        name: 'Fix Attachment Source Import',
        description: 'Fixing attachment source import field',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'attachment-cardCopy-fix-boardId-etc',
        name: 'Fix Attachment Card Copy',
        description: 'Fixing attachment card copy board IDs',
        weight: 2,
        completed: false,
        progress: 0
      },
      {
        id: 'remove-unused-planning-poker',
        name: 'Remove Planning Poker',
        description: 'Removing unused planning poker fields',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'remove-user-profile-hiddenSystemMessages',
        name: 'Remove Hidden System Messages',
        description: 'Removing hidden system messages field',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'remove-user-profile-hideCheckedItems',
        name: 'Remove Hide Checked Items',
        description: 'Removing hide checked items field',
        weight: 1,
        completed: false,
        progress: 0
      },
      {
        id: 'migrate-lists-to-per-swimlane',
        name: 'Migrate Lists to Per-Swimlane',
        description: 'Migrating lists to per-swimlane structure',
        weight: 5,
        completed: false,
        progress: 0
      }
    ];
  }

  /**
   * Check if any migrations need to be run for a specific board
   */
  needsMigration(boardId = null) {
    if (boardId) {
      // Check if specific board needs migration based on version
      const board = ReactiveCache.getBoard(boardId);
      return !board || !board.migrationVersion || board.migrationVersion < 1;
    }
    
    // Check if any migration step is not completed (global migrations)
    return this.steps.some(step => !step.completed);
  }

  /**
   * Get total weight of all migrations
   */
  getTotalWeight() {
    return this.steps.reduce((total, step) => total + step.weight, 0);
  }

  /**
   * Get completed weight
   */
  getCompletedWeight() {
    return this.steps.reduce((total, step) => {
      return total + (step.completed ? step.weight : step.progress * step.weight / 100);
    }, 0);
  }

  /**
   * Mark a board as migrated
   */
  markBoardAsMigrated(boardId) {
    try {
      Meteor.call('boardMigration.markAsMigrated', boardId, 'full_board_migration', (error, result) => {
        if (error) {
          console.error('Failed to mark board as migrated:', error);
        } else {
          console.log('Board marked as migrated:', boardId);
        }
      });
    } catch (error) {
      console.error('Error marking board as migrated:', error);
    }
  }

  /**
   * Fix boards that are stuck in migration loop
   */
  fixStuckBoards() {
    try {
      Meteor.call('boardMigration.fixStuckBoards', (error, result) => {
        if (error) {
          console.error('Failed to fix stuck boards:', error);
        } else {
          console.log('Fix stuck boards result:', result);
        }
      });
    } catch (error) {
      console.error('Error fixing stuck boards:', error);
    }
  }

  /**
   * Start migration process using cron system
   */
  async startMigration() {
    if (isMigrating.get()) {
      return; // Already migrating
    }

    isMigrating.set(true);
    migrationSteps.set([...this.steps]);
    this.startTime = Date.now();

    try {
      // Start server-side cron migrations
      Meteor.call('cron.startAllMigrations', (error, result) => {
        if (error) {
          console.error('Failed to start cron migrations:', error);
          migrationStatus.set(`Migration failed: ${error.message}`);
          isMigrating.set(false);
        }
      });

      // Poll for progress updates
      this.pollCronMigrationProgress();

    } catch (error) {
      console.error('Migration failed:', error);
      migrationStatus.set(`Migration failed: ${error.message}`);
      isMigrating.set(false);
    }
  }

  /**
   * Poll for cron migration progress updates
   */
  pollCronMigrationProgress() {
    const pollInterval = setInterval(() => {
      Meteor.call('cron.getMigrationProgress', (error, result) => {
        if (error) {
          console.error('Failed to get cron migration progress:', error);
          clearInterval(pollInterval);
          return;
        }

        if (result) {
          migrationProgress.set(result.progress);
          migrationStatus.set(result.status);
          migrationCurrentStep.set(result.currentStep);
          migrationSteps.set(result.steps);
          isMigrating.set(result.isMigrating);

          // Update local steps
          if (result.steps) {
            this.steps = result.steps;
          }

          // If migration is complete, stop polling
          if (!result.isMigrating && result.progress === 100) {
            clearInterval(pollInterval);
            
            // Clear status after delay
            setTimeout(() => {
              migrationStatus.set('');
              migrationProgress.set(0);
              migrationEstimatedTime.set('');
            }, 3000);
          }
        }
      });
    }, 1000); // Poll every second
  }

  /**
   * Run a single migration step
   */
  async runMigrationStep(step) {
    // Simulate migration progress
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      step.progress = (i / steps) * 100;
      this.updateProgress();
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // In a real implementation, this would call the actual migration
    // For now, we'll simulate the migration
    // Running migration step
  }

  /**
   * Update progress variables
   */
  updateProgress() {
    const totalWeight = this.getTotalWeight();
    const completedWeight = this.getCompletedWeight();
    const progress = Math.round((completedWeight / totalWeight) * 100);
    
    migrationProgress.set(progress);
    migrationSteps.set([...this.steps]);

    // Calculate estimated time remaining
    if (this.startTime && progress > 0) {
      const elapsed = Date.now() - this.startTime;
      const rate = progress / elapsed; // progress per millisecond
      const remaining = 100 - progress;
      const estimatedMs = remaining / rate;
      migrationEstimatedTime.set(this.formatTime(estimatedMs));
    }
  }

  /**
   * Format time in milliseconds to human readable format
   */
  formatTime(ms) {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Clear migration cache (for testing)
   */
  clearCache() {
    this.migrationCache.clear();
    this.steps.forEach(step => {
      step.completed = false;
      step.progress = 0;
    });
  }
}

// Export singleton instance
export const migrationManager = new MigrationManager();
