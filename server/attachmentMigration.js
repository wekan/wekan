/**
 * Server-side Attachment Migration System
 * Handles migration of attachments from old structure to new structure
 */

import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';

// Reactive variables for tracking migration progress
const migrationProgress = new ReactiveVar(0);
const migrationStatus = new ReactiveVar('');
const unconvertedAttachments = new ReactiveVar([]);

// Track migrated boards on server side
const migratedBoards = new Set();

class AttachmentMigrationService {
  constructor() {
    this.migrationCache = new Map();
  }

  /**
   * Check if a board has been migrated
   * @param {string} boardId - The board ID
   * @returns {boolean} - True if board has been migrated
   */
  isBoardMigrated(boardId) {
    return migratedBoards.has(boardId);
  }

  /**
   * Migrate all attachments for a board
   * @param {string} boardId - The board ID
   */
  async migrateBoardAttachments(boardId) {
    try {
      // Check if board has already been migrated
      if (this.isBoardMigrated(boardId)) {
        console.log(`Board ${boardId} has already been migrated, skipping`);
        return { success: true, message: 'Board already migrated' };
      }

      console.log(`Starting attachment migration for board: ${boardId}`);
      
      // Get all attachments for the board
      const attachments = Attachments.find({
        'meta.boardId': boardId
      }).fetch();

      const totalAttachments = attachments.length;
      let migratedCount = 0;

      migrationStatus.set(`Migrating ${totalAttachments} attachments...`);
      migrationProgress.set(0);

      for (const attachment of attachments) {
        try {
          // Check if attachment needs migration
          if (this.needsMigration(attachment)) {
            await this.migrateAttachment(attachment);
            this.migrationCache.set(attachment._id, true);
          }
          
          migratedCount++;
          const progress = Math.round((migratedCount / totalAttachments) * 100);
          migrationProgress.set(progress);
          migrationStatus.set(`Migrated ${migratedCount}/${totalAttachments} attachments...`);
          
        } catch (error) {
          console.error(`Error migrating attachment ${attachment._id}:`, error);
        }
      }

      // Update unconverted attachments list
      const remainingUnconverted = this.getUnconvertedAttachments(boardId);
      unconvertedAttachments.set(remainingUnconverted);

      migrationStatus.set('Attachment migration completed');
      migrationProgress.set(100);

      // Mark board as migrated
      migratedBoards.add(boardId);
      console.log(`Attachment migration completed for board: ${boardId}`);
      console.log(`Marked board ${boardId} as migrated`);

      return { success: true, message: 'Migration completed' };

    } catch (error) {
      console.error(`Error migrating attachments for board ${boardId}:`, error);
      migrationStatus.set(`Migration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if an attachment needs migration
   * @param {Object} attachment - The attachment object
   * @returns {boolean} - True if attachment needs migration
   */
  needsMigration(attachment) {
    if (this.migrationCache.has(attachment._id)) {
      return false; // Already migrated
    }

    // Check if attachment has old structure
    return !attachment.meta || 
           !attachment.meta.cardId || 
           !attachment.meta.boardId ||
           !attachment.meta.listId;
  }

  /**
   * Migrate a single attachment
   * @param {Object} attachment - The attachment object
   */
  async migrateAttachment(attachment) {
    try {
      // Get the card to find board and list information
      const card = ReactiveCache.getCard(attachment.cardId);
      if (!card) {
        console.warn(`Card not found for attachment ${attachment._id}`);
        return;
      }

      const list = ReactiveCache.getList(card.listId);
      if (!list) {
        console.warn(`List not found for attachment ${attachment._id}`);
        return;
      }

      // Update attachment with new structure
      const updateData = {
        meta: {
          cardId: attachment.cardId,
          boardId: list.boardId,
          listId: card.listId,
          userId: attachment.userId,
          createdAt: attachment.createdAt || new Date(),
          migratedAt: new Date()
        }
      };

      // Preserve existing meta data if it exists
      if (attachment.meta) {
        updateData.meta = {
          ...attachment.meta,
          ...updateData.meta
        };
      }

      Attachments.update(attachment._id, { $set: updateData });

      console.log(`Migrated attachment ${attachment._id}`);

    } catch (error) {
      console.error(`Error migrating attachment ${attachment._id}:`, error);
      throw error;
    }
  }

  /**
   * Get unconverted attachments for a board
   * @param {string} boardId - The board ID
   * @returns {Array} - Array of unconverted attachments
   */
  getUnconvertedAttachments(boardId) {
    try {
      const attachments = Attachments.find({
        'meta.boardId': boardId
      }).fetch();

      return attachments.filter(attachment => this.needsMigration(attachment));
    } catch (error) {
      console.error('Error getting unconverted attachments:', error);
      return [];
    }
  }

  /**
   * Get migration progress
   * @param {string} boardId - The board ID
   * @returns {Object} - Migration progress data
   */
  getMigrationProgress(boardId) {
    const progress = migrationProgress.get();
    const status = migrationStatus.get();
    const unconverted = this.getUnconvertedAttachments(boardId);

    return {
      progress,
      status,
      unconvertedAttachments: unconverted
    };
  }
}

const attachmentMigrationService = new AttachmentMigrationService();

// Meteor methods
Meteor.methods({
  async 'attachmentMigration.migrateBoardAttachments'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    return await attachmentMigrationService.migrateBoardAttachments(boardId);
  },

  'attachmentMigration.getProgress'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    return attachmentMigrationService.getMigrationProgress(boardId);
  },

  'attachmentMigration.getUnconvertedAttachments'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    return attachmentMigrationService.getUnconvertedAttachments(boardId);
  },

  'attachmentMigration.isBoardMigrated'(boardId) {
    check(boardId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    return attachmentMigrationService.isBoardMigrated(boardId);
  }
});

export { attachmentMigrationService };