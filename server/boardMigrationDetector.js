/**
 * Board Migration Detector
 * Detects boards that need migration and manages automatic migration scheduling
 */

import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { check, Match } from 'meteor/check';
import { cronJobStorage } from './cronJobStorage';
import Boards from '/models/boards';

// Reactive variables for board migration tracking
export const unmigratedBoards = new ReactiveVar([]);
export const migrationScanInProgress = new ReactiveVar(false);
export const lastMigrationScan = new ReactiveVar(null);

class BoardMigrationDetector {
  constructor() {
    this.scanInterval = null;
    this.isScanning = false;
    this.migrationCheckInterval = 30000; // Check every 30 seconds
    this.scanInterval = 60000; // Full scan every minute
  }

  /**
   * Start the automatic migration detector
   */
  start() {
    if (this.scanInterval) {
      return; // Already running
    }

    // Check for idle migration opportunities
    this.scanInterval = Meteor.setInterval(() => {
      this.checkForIdleMigration();
    }, this.migrationCheckInterval);

    // Full board scan every minute
    this.fullScanInterval = Meteor.setInterval(() => {
      this.scanUnmigratedBoards();
    }, this.scanInterval);

    // Board migration detector started
  }

  /**
   * Stop the automatic migration detector
   */
  stop() {
    if (this.scanInterval) {
      Meteor.clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    if (this.fullScanInterval) {
      Meteor.clearInterval(this.fullScanInterval);
      this.fullScanInterval = null;
    }
  }

  /**
   * Check if system is idle and can run migrations
   */
  isSystemIdle() {
    const resources = cronJobStorage.getSystemResources();
    const queueStats = cronJobStorage.getQueueStats();
    
    // Check if no jobs are running
    if (queueStats.running > 0) {
      return false;
    }

    // Check if CPU usage is low
    if (resources.cpuUsage > 30) { // Lower threshold for idle migration
      return false;
    }

    // Check if memory usage is reasonable
    if (resources.memoryUsage > 85) {
      return false;
    }

    return true;
  }

  /**
   * Check for idle migration opportunities
   */
  async checkForIdleMigration() {
    if (!this.isSystemIdle()) {
      return;
    }

    // Get unmigrated boards
    const unmigrated = unmigratedBoards.get();
    if (unmigrated.length === 0) {
      return; // No boards to migrate
    }

    // Check if we can start a new job
    const canStart = cronJobStorage.canStartNewJob();
    if (!canStart.canStart) {
      return;
    }

    // Start migrating the next board
    const boardToMigrate = unmigrated[0];
    await this.startBoardMigration(boardToMigrate);
  }

  /**
   * Scan for unmigrated boards
   */
  async scanUnmigratedBoards() {
    if (this.isScanning) {
      return; // Already scanning
    }

    this.isScanning = true;
    migrationScanInProgress.set(true);

    try {
      // Scanning for unmigrated boards
      
      // Get all boards from the database
      const boards = this.getAllBoards();
      const unmigrated = [];

      for (const board of boards) {
        if (await this.needsMigration(board)) {
          unmigrated.push(board);
        }
      }

      unmigratedBoards.set(unmigrated);
      lastMigrationScan.set(new Date());

      // Found unmigrated boards

    } catch (error) {
      console.error('Error scanning for unmigrated boards:', error);
    } finally {
      this.isScanning = false;
      migrationScanInProgress.set(false);
    }
  }

  /**
   * Get all boards from the database
   */
  getAllBoards() {
    // This would need to be implemented based on your board model
    // For now, we'll simulate getting boards
    try {
      // Assuming you have a Boards collection
      if (typeof Boards !== 'undefined') {
        return Boards.find({}, { fields: { _id: 1, title: 1, createdAt: 1, modifiedAt: 1 } }).fetch();
      }
      
      // Fallback: return empty array if Boards collection not available
      return [];
    } catch (error) {
      console.error('Error getting boards:', error);
      return [];
    }
  }

  /**
   * Check if a board needs migration
   */
  async needsMigration(board) {
    try {
      // Check if board has been migrated by looking for migration markers
      const migrationMarkers = this.getMigrationMarkers(board._id);
      
      // Check for specific migration indicators
      const needsListMigration = !migrationMarkers.listsMigrated;
      const needsAttachmentMigration = !migrationMarkers.attachmentsMigrated;
      const needsSwimlaneMigration = !migrationMarkers.swimlanesMigrated;
      
      return needsListMigration || needsAttachmentMigration || needsSwimlaneMigration;
      
    } catch (error) {
      console.error(`Error checking migration status for board ${board._id}:`, error);
      return false;
    }
  }

  /**
   * Get migration markers for a board
   */
  getMigrationMarkers(boardId) {
    try {
      // Check if board has migration metadata
      const board = Boards.findOne(boardId, { fields: { migrationMarkers: 1 } });
      
      if (!board || !board.migrationMarkers) {
        return {
          listsMigrated: false,
          attachmentsMigrated: false,
          swimlanesMigrated: false
        };
      }

      return board.migrationMarkers;
    } catch (error) {
      console.error(`Error getting migration markers for board ${boardId}:`, error);
      return {
        listsMigrated: false,
        attachmentsMigrated: false,
        swimlanesMigrated: false
      };
    }
  }

  /**
   * Start migration for a specific board
   */
  async startBoardMigration(boardId) {
    try {
      const board = Boards.findOne(boardId);
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      // Check if board already has latest migration version
      if (board.migrationVersion && board.migrationVersion >= 1) {
        console.log(`Board ${boardId} already has latest migration version`);
        return null;
      }

      // Create migration job for this board
      const jobId = `board_migration_${board._id}_${Date.now()}`;
      
      // Add to job queue with high priority
      cronJobStorage.addToQueue(jobId, 'board_migration', 1, {
        boardId: board._id,
        boardTitle: board.title,
        migrationType: 'full_board_migration'
      });

      // Save initial job status
      cronJobStorage.saveJobStatus(jobId, {
        jobType: 'board_migration',
        status: 'pending',
        progress: 0,
        boardId: board._id,
        boardTitle: board.title,
        migrationType: 'full_board_migration',
        createdAt: new Date()
      });

      // Remove from unmigrated list
      const currentUnmigrated = unmigratedBoards.get();
      const updatedUnmigrated = currentUnmigrated.filter(b => b._id !== board._id);
      unmigratedBoards.set(updatedUnmigrated);

      return jobId;

    } catch (error) {
      console.error(`Error starting migration for board ${boardId}:`, error);
      throw error;
    }
  }

  /**
   * Get migration statistics
   */
  getMigrationStats() {
    const unmigrated = unmigratedBoards.get();
    const lastScan = lastMigrationScan.get();
    const isScanning = migrationScanInProgress.get();

    return {
      unmigratedCount: unmigrated.length,
      lastScanTime: lastScan,
      isScanning,
      nextScanIn: this.scanInterval ? this.scanInterval / 1000 : 0
    };
  }

  /**
   * Force a full scan of all boards
   */
  async forceScan() {
      // Forcing full board migration scan
    await this.scanUnmigratedBoards();
  }

  /**
   * Get detailed migration status for a specific board
   */
  getBoardMigrationStatus(boardId) {
    const unmigrated = unmigratedBoards.get();
    const isUnmigrated = unmigrated.some(b => b._id === boardId);
    
    if (!isUnmigrated) {
      return { needsMigration: false, reason: 'Board is already migrated' };
    }

    const migrationMarkers = this.getMigrationMarkers(boardId);
    const needsMigration = !migrationMarkers.listsMigrated || 
                          !migrationMarkers.attachmentsMigrated || 
                          !migrationMarkers.swimlanesMigrated;

    return {
      needsMigration,
      migrationMarkers,
      reason: needsMigration ? 'Board requires migration' : 'Board is up to date'
    };
  }

  /**
   * Mark a board as migrated
   */
  markBoardAsMigrated(boardId, migrationType) {
    try {
      // Update migration markers
      const updateQuery = {};
      updateQuery[`migrationMarkers.${migrationType}Migrated`] = true;
      updateQuery['migrationMarkers.lastMigration'] = new Date();

      Boards.update(boardId, { $set: updateQuery });

      // Remove from unmigrated list if present
      const currentUnmigrated = unmigratedBoards.get();
      const updatedUnmigrated = currentUnmigrated.filter(b => b._id !== boardId);
      unmigratedBoards.set(updatedUnmigrated);

      // Marked board as migrated

    } catch (error) {
      console.error(`Error marking board ${boardId} as migrated:`, error);
    }
  }
}

// Export singleton instance
export const boardMigrationDetector = new BoardMigrationDetector();

// Note: Automatic migration detector is disabled - migrations only run when opening boards
// Meteor.startup(() => {
//   // Wait a bit for the system to initialize
//   Meteor.setTimeout(() => {
//     boardMigrationDetector.start();
//   }, 10000); // Start after 10 seconds
// });

// Meteor methods for client access
Meteor.methods({
  'boardMigration.getStats'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return boardMigrationDetector.getMigrationStats();
  },

  'boardMigration.forceScan'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return boardMigrationDetector.forceScan();
  },

  'boardMigration.getBoardStatus'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return boardMigrationDetector.getBoardMigrationStatus(boardId);
  },

  'boardMigration.markAsMigrated'(boardId, migrationType) {
    check(boardId, String);
    check(migrationType, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return boardMigrationDetector.markBoardAsMigrated(boardId, migrationType);
  },

  'boardMigration.startBoardMigration'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    
    return boardMigrationDetector.startBoardMigration(boardId);
  }
});
