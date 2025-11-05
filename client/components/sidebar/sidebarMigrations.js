import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { migrationProgressManager } from '/client/components/migrationProgress';

BlazeComponent.extendComponent({
  onCreated() {
    this.migrationStatuses = new ReactiveVar({});
    this.loadMigrationStatuses();
  },

  loadMigrationStatuses() {
    const boardId = Session.get('currentBoard');
    if (!boardId) return;

    // Check comprehensive migration
    Meteor.call('comprehensiveBoardMigration.needsMigration', boardId, (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.comprehensive = res;
        this.migrationStatuses.set(statuses);
      }
    });

    // Check fix missing lists migration
    Meteor.call('fixMissingListsMigration.needsMigration', boardId, (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.fixMissingLists = res;
        this.migrationStatuses.set(statuses);
      }
    });

    // Check delete duplicate empty lists migration
    Meteor.call('deleteDuplicateEmptyLists.needsMigration', boardId, (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.deleteDuplicateEmptyLists = res;
        this.migrationStatuses.set(statuses);
      }
    });

    // Check restore lost cards migration
    Meteor.call('restoreLostCards.needsMigration', boardId, (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.restoreLostCards = res;
        this.migrationStatuses.set(statuses);
      }
    });

    // Check restore all archived migration
    Meteor.call('restoreAllArchived.needsMigration', boardId, (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.restoreAllArchived = res;
        this.migrationStatuses.set(statuses);
      }
    });

    // Check fix avatar URLs migration (board-specific)
    Meteor.call('fixAvatarUrls.needsMigration', boardId, (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.fixAvatarUrls = res;
        this.migrationStatuses.set(statuses);
      }
    });

    // Check fix all file URLs migration (board-specific)
    Meteor.call('fixAllFileUrls.needsMigration', boardId, (err, res) => {
      if (!err) {
        const statuses = this.migrationStatuses.get();
        statuses.fixAllFileUrls = res;
        this.migrationStatuses.set(statuses);
      }
    });
  },

  comprehensiveMigrationNeeded() {
    return this.migrationStatuses.get().comprehensive === true;
  },

  fixMissingListsNeeded() {
    return this.migrationStatuses.get().fixMissingLists === true;
  },

  deleteDuplicateEmptyListsNeeded() {
    return this.migrationStatuses.get().deleteDuplicateEmptyLists === true;
  },

  restoreLostCardsNeeded() {
    return this.migrationStatuses.get().restoreLostCards === true;
  },

  restoreAllArchivedNeeded() {
    return this.migrationStatuses.get().restoreAllArchived === true;
  },

  fixAvatarUrlsNeeded() {
    return this.migrationStatuses.get().fixAvatarUrls === true;
  },

  fixAllFileUrlsNeeded() {
    return this.migrationStatuses.get().fixAllFileUrls === true;
  },

  // Simulate migration progress updates using the global progress popup
  async simulateMigrationProgress(progressSteps) {
    const totalSteps = progressSteps.length;
    for (let i = 0; i < progressSteps.length; i++) {
      const step = progressSteps[i];
      const overall = Math.round(((i + 1) / totalSteps) * 100);

      // Start step
      migrationProgressManager.updateProgress({
        overallProgress: overall,
        currentStep: i + 1,
        totalSteps,
        stepName: step.step,
        stepProgress: 0,
        stepStatus: `Starting ${step.name}...`,
        stepDetails: null,
        boardId: Session.get('currentBoard'),
      });

      const stepDuration = step.duration;
      const updateInterval = 100;
      const totalUpdates = Math.max(1, Math.floor(stepDuration / updateInterval));
      for (let j = 0; j < totalUpdates; j++) {
        const per = Math.round(((j + 1) / totalUpdates) * 100);
        migrationProgressManager.updateProgress({
          overallProgress: overall,
          currentStep: i + 1,
          totalSteps,
          stepName: step.step,
          stepProgress: per,
          stepStatus: `Processing ${step.name}...`,
          stepDetails: { progress: `${per}%` },
          boardId: Session.get('currentBoard'),
        });
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, updateInterval));
      }

      // Complete step
      migrationProgressManager.updateProgress({
        overallProgress: overall,
        currentStep: i + 1,
        totalSteps,
        stepName: step.step,
        stepProgress: 100,
        stepStatus: `${step.name} completed`,
        stepDetails: { status: 'completed' },
        boardId: Session.get('currentBoard'),
      });
    }
  },

  runMigration(migrationType) {
    const boardId = Session.get('currentBoard');
    
    let methodName;
    let methodArgs = [];
    
    switch (migrationType) {
      case 'comprehensive':
        methodName = 'comprehensiveBoardMigration.execute';
        methodArgs = [boardId];
        break;
      
      case 'fixMissingLists':
        methodName = 'fixMissingListsMigration.execute';
        methodArgs = [boardId];
        break;
      
      case 'deleteDuplicateEmptyLists':
        methodName = 'deleteDuplicateEmptyLists.execute';
        methodArgs = [boardId];
        break;
      
      case 'restoreLostCards':
        methodName = 'restoreLostCards.execute';
        methodArgs = [boardId];
        break;
      
      case 'restoreAllArchived':
        methodName = 'restoreAllArchived.execute';
        methodArgs = [boardId];
        break;
      
      case 'fixAvatarUrls':
        methodName = 'fixAvatarUrls.execute';
        methodArgs = [boardId];
        break;
      
      case 'fixAllFileUrls':
        methodName = 'fixAllFileUrls.execute';
        methodArgs = [boardId];
        break;
    }
    
    if (methodName) {
      // Define simulated steps per migration type
      const stepsByType = {
        comprehensive: [
          { step: 'analyze_board_structure', name: 'Analyze Board Structure', duration: 800 },
          { step: 'fix_orphaned_cards', name: 'Fix Orphaned Cards', duration: 1200 },
          { step: 'convert_shared_lists', name: 'Convert Shared Lists', duration: 1000 },
          { step: 'ensure_per_swimlane_lists', name: 'Ensure Per-Swimlane Lists', duration: 800 },
          { step: 'validate_migration', name: 'Validate Migration', duration: 800 },
          { step: 'fix_avatar_urls', name: 'Fix Avatar URLs', duration: 600 },
          { step: 'fix_attachment_urls', name: 'Fix Attachment URLs', duration: 600 },
        ],
        fixMissingLists: [
          { step: 'analyze_lists', name: 'Analyze Lists', duration: 600 },
          { step: 'create_missing_lists', name: 'Create Missing Lists', duration: 900 },
          { step: 'update_cards', name: 'Update Cards', duration: 900 },
          { step: 'finalize', name: 'Finalize', duration: 400 },
        ],
        deleteDuplicateEmptyLists: [
          { step: 'convert_shared_lists', name: 'Convert Shared Lists', duration: 700 },
          { step: 'delete_duplicate_empty_lists', name: 'Delete Duplicate Empty Lists', duration: 800 },
        ],
        restoreLostCards: [
          { step: 'ensure_lost_cards_swimlane', name: 'Ensure Lost Cards Swimlane', duration: 600 },
          { step: 'restore_lists', name: 'Restore Lists', duration: 800 },
          { step: 'restore_cards', name: 'Restore Cards', duration: 1000 },
        ],
        restoreAllArchived: [
          { step: 'restore_swimlanes', name: 'Restore Swimlanes', duration: 800 },
          { step: 'restore_lists', name: 'Restore Lists', duration: 900 },
          { step: 'restore_cards', name: 'Restore Cards', duration: 1000 },
          { step: 'fix_missing_ids', name: 'Fix Missing IDs', duration: 600 },
        ],
        fixAvatarUrls: [
          { step: 'scan_users', name: 'Checking board member avatars', duration: 500 },
          { step: 'fix_urls', name: 'Fixing avatar URLs', duration: 900 },
        ],
        fixAllFileUrls: [
          { step: 'scan_files', name: 'Checking board file attachments', duration: 600 },
          { step: 'fix_urls', name: 'Fixing file URLs', duration: 1000 },
        ],
      };

      const steps = stepsByType[migrationType] || [
        { step: 'running', name: 'Running Migration', duration: 1000 },
      ];

      // Kick off popup and simulated progress
      migrationProgressManager.startMigration();
      const progressPromise = this.simulateMigrationProgress(steps);

      // Start migration call
      const callPromise = new Promise((resolve, reject) => {
        Meteor.call(methodName, ...methodArgs, (err, result) => {
          if (err) return reject(err);
          return resolve(result);
        });
      });

      Promise.allSettled([callPromise, progressPromise]).then(([callRes]) => {
        if (callRes.status === 'rejected') {
          migrationProgressManager.failMigration(callRes.reason);
        } else {
          const result = callRes.value;
          // Summarize result details in the popup
          let summary = {};
          if (result && result.results) {
            // Comprehensive returns {success, results}
            const r = result.results;
            summary = {
              totalCardsProcessed: r.totalCardsProcessed,
              totalListsProcessed: r.totalListsProcessed,
              totalListsCreated: r.totalListsCreated,
            };
          } else if (result && result.changes) {
            // Many migrations return a changes string array
            summary = { changes: result.changes.join(' | ') };
          } else if (result && typeof result === 'object') {
            summary = result;
          }

          migrationProgressManager.updateProgress({
            overallProgress: 100,
            currentStep: steps.length,
            totalSteps: steps.length,
            stepName: 'completed',
            stepProgress: 100,
            stepStatus: 'Migration completed',
            stepDetails: summary,
            boardId: Session.get('currentBoard'),
          });

          migrationProgressManager.completeMigration();

          // Refresh status badges slightly after
          Meteor.setTimeout(() => {
            this.loadMigrationStatuses();
          }, 1000);
        }
      });
    }
  },

  events() {
    const self = this; // Capture component reference
    
    return [
      {
        'click .js-run-migration[data-migration="comprehensive"]': Popup.afterConfirm('runComprehensiveMigration', function() {
          self.runMigration('comprehensive');
          Popup.back();
        }),
        'click .js-run-migration[data-migration="fixMissingLists"]': Popup.afterConfirm('runFixMissingListsMigration', function() {
          self.runMigration('fixMissingLists');
          Popup.back();
        }),
        'click .js-run-migration[data-migration="deleteDuplicateEmptyLists"]': Popup.afterConfirm('runDeleteDuplicateEmptyListsMigration', function() {
          self.runMigration('deleteDuplicateEmptyLists');
          Popup.back();
        }),
        'click .js-run-migration[data-migration="restoreLostCards"]': Popup.afterConfirm('runRestoreLostCardsMigration', function() {
          self.runMigration('restoreLostCards');
          Popup.back();
        }),
        'click .js-run-migration[data-migration="restoreAllArchived"]': Popup.afterConfirm('runRestoreAllArchivedMigration', function() {
          self.runMigration('restoreAllArchived');
          Popup.back();
        }),
        'click .js-run-migration[data-migration="fixAvatarUrls"]': Popup.afterConfirm('runFixAvatarUrlsMigration', function() {
          self.runMigration('fixAvatarUrls');
          Popup.back();
        }),
        'click .js-run-migration[data-migration="fixAllFileUrls"]': Popup.afterConfirm('runFixAllFileUrlsMigration', function() {
          self.runMigration('fixAllFileUrls');
          Popup.back();
        }),
      },
    ];
  },
}).register('migrationsSidebar');
